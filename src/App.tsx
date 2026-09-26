import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu } from 'lucide-react';
import {
  ChatSession,
  ChatMessage,
  AppSettings,
  ImageAttachment,
  UploadedFileAttachment
} from './types';
import { PERSONAS } from './data/personas';
import { streamGeminiChat, getStoredApiKey } from './services/geminiService';
import { autoSaveAiCodeBlocks, fileStorageService } from './services/fileStorageService';
import { ChatHeader } from './components/ChatHeader';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { PersonaModal } from './components/PersonaModal';
import { SettingsModal } from './components/SettingsModal';
import { FileWorkspaceModal } from './components/FileWorkspaceModal';
import { FileManagerModal } from './components/FileManagerModal';
import { CodePreviewModal } from './components/CodePreviewModal';
import { CodexWorkspaceView } from './components/CodexWorkspaceView';
import { GenerateImageModal } from './components/GenerateImageModal';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { DownloadModal } from './components/DownloadModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AndroidShortcutModal } from './components/AndroidShortcutModal';
import { Auth } from './components/Auth';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebase';
import { getStoredActiveUser, signOutUser } from './services/authService';
import { syncTabToFirestore, deleteTabFromFirestore } from './services/tabFirestoreService';
import { loadUserProfile, hasUserCompletedSetup, syncUserDataToCloud } from './services/userService';
import { loadWorkspaceFiles } from './services/fileStorageService';
import { speechService, detectScriptLanguage } from './services/speechService';
import { SAPPHIRE_LOGO_URL } from './data/constants';
import { useAppTheme } from './context/ThemeContext';

const STORAGE_KEY_SETTINGS = 'sapphire_ai_chat_settings_v1';
const STORAGE_KEY_CURRENT = 'sapphire_ai_chat_current_session_id';

// Helper to safely load & sanitize sessions from localStorage without white screen errors
function loadSessionsForStorage(storageKey: string, settings: AppSettings): ChatSession[] {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s) => ({
          ...createNewSession(settings),
          ...s,
          messages: Array.isArray(s?.messages) ? s.messages : []
        }));
      }
    }
  } catch (e) {
    console.warn('Auto-healed corrupted session store:', storageKey, e);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }
  return [createNewSession(settings)];
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: 'sapphire-3.7-flash',
  defaultTemperature: 0.7,
  defaultPersonaId: 'general',
  enableSearchGrounding: false,
  selectedLanguage: 'auto',
  autoSpeakResponses: false,
  ttsSpeed: 1.0,
  ttsPitch: 1.0
};

function createNewSession(settings: AppSettings): ChatSession {
  const initialPersona = PERSONAS.find((p) => p.id === settings.defaultPersonaId) || PERSONAS[0];
  const now = Date.now();
  return {
    id: `${now}`,
    title: 'New Chat',
    messages: [],
    personaId: initialPersona.id,
    customInstruction: initialPersona.systemInstruction,
    temperature: settings.defaultTemperature,
    model: settings.defaultModel || 'sapphire-3.7-flash',
    useSearchGrounding: settings.enableSearchGrounding,
    createdAt: now,
    updatedAt: now
  };
}

export default function App() {
  // Load settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const storedKey = getStoredApiKey();
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS) || localStorage.getItem('gemini_ai_chat_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          customApiKey: parsed.customApiKey || storedKey || undefined,
          defaultModel: parsed.defaultModel?.includes('flash') || !parsed.defaultModel ? 'echo-3.7-flash' : parsed.defaultModel
        };
      }
      return {
        ...DEFAULT_SETTINGS,
        customApiKey: storedKey || undefined
      };
    } catch {
      return {
        ...DEFAULT_SETTINGS,
        customApiKey: storedKey || undefined
      };
    }
  });

  // Guest Mode State (no cloud save, instant access, history stays strictly in guest mode)
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('sapphire_guest_mode') === 'true';
  });

  // Stored active user (Google or verified Gmail)
  const [authUser, setAuthUser] = useState<User | any>(() => {
    return getStoredActiveUser();
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Load sessions strictly based on mode (Guest sessions vs Signed-in sessions)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const storedUser = getStoredActiveUser();
    const guest = localStorage.getItem('sapphire_guest_mode') === 'true';
    const key = guest || !storedUser
      ? 'sapphire_guest_sessions'
      : `sapphire_user_sessions_${storedUser.uid || storedUser.email}`;
    return loadSessionsForStorage(key, DEFAULT_SETTINGS);
  });

  // Current session ID
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (savedId && sessions.some((s) => s.id === savedId)) return savedId;
    return sessions[0]?.id || '';
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAndroidShortcutModalOpen, setIsAndroidShortcutModalOpen] = useState(false);
  const [isStartingScreen, setIsStartingScreen] = useState<boolean>(true);

  const { theme } = useAppTheme();

  // Active navigation tab ('chat' | 'workspace' | 'codex' | 'projects' | 'artifacts' | 'customize')
  const [activeNavTab, setActiveNavTab] = useState<string>('chat');

  // Monitor Firebase & Local Verified Auth State with safety timeout (prevents infinite white/loading screen)
  useEffect(() => {
    let resolved = false;
    const safetyTimeout = setTimeout(() => {
      if (!resolved) {
        setAuthLoading(false);
      }
    }, 1200);

    const localUser = getStoredActiveUser();
    if (localUser && !authUser) {
      setAuthUser(localUser as any);
      setAuthLoading(false);
      resolved = true;
      clearTimeout(safetyTimeout);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      resolved = true;
      clearTimeout(safetyTimeout);
      if (user) {
        setAuthUser(user);
        setCurrentUserProfile((prev) => ({
          ...prev,
          name: user.displayName || prev.name,
          email: user.email || prev.email,
          avatar: user.photoURL || prev.avatar
        }));
      } else if (!localUser) {
        setAuthUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      resolved = true;
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  // User Profile & Onboarding State
  const [currentUserProfile, setCurrentUserProfile] = useState(loadUserProfile);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);

  // Onboarding prompt for new users
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('echo_profile_onboarding_shown');
    const isCompleted = hasUserCompletedSetup();
    if (!hasSeenOnboarding && !isCompleted && !isGuestMode) {
      const timer = setTimeout(() => {
        setIsUserProfileModalOpen(true);
        localStorage.setItem('echo_profile_onboarding_shown', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isGuestMode]);

  // Automatic Cloud Sync for user data & files (STRICTLY DISABLED IN GUEST MODE)
  useEffect(() => {
    if (isGuestMode) return;
    if (sessions.length > 0 && currentUserProfile) {
      const timer = setTimeout(() => {
        syncUserDataToCloud(currentUserProfile, sessions, loadWorkspaceFiles()).catch(() => {});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sessions, currentUserProfile, isGuestMode]);

  // Reply tracking state
  const [replyTo, setReplyTo] = useState<{
    id: string;
    role: 'user' | 'model';
    text: string;
    senderName?: string;
  } | null>(null);

  // Workspace & Code Preview Modal States
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceSelectedFileId, setWorkspaceSelectedFileId] = useState<string | undefined>(undefined);
  const [previewModalState, setPreviewModalState] = useState<{
    isOpen: boolean;
    code: string;
    language: string;
    filename?: string;
    files?: WorkspaceFile[];
  }>({
    isOpen: false,
    code: '',
    language: 'html',
    filename: 'index.html',
    files: []
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);

  // Active session (safely guarded)
  const currentSession =
    (sessions && sessions.find((s) => s.id === currentSessionId)) ||
    (sessions && sessions[0]) ||
    createNewSession(settings);

  // Save sessions to localStorage strictly isolated by mode (Guest history stays strictly in guest mode)
  useEffect(() => {
    const key = isGuestMode || !authUser
      ? 'sapphire_guest_sessions'
      : `sapphire_user_sessions_${authUser.uid || authUser.email}`;
    try {
      localStorage.setItem(key, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions:', e);
    }
  }, [sessions, isGuestMode, authUser]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  // Save active session id
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(STORAGE_KEY_CURRENT, currentSessionId);
    }
  }, [currentSessionId]);

  const scrollRafRef = useRef<number | null>(null);

  // Auto-scroll when messages change or stream updates
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth', force = false) => {
    if (!force && !isAutoScrollRef.current) return;

    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight + 300,
        behavior
      });
    }

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // Keep view smoothly locked to bottom during token streaming
  const scheduleScrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (!isAutoScrollRef.current) return;
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    });
  };

  // User scrolling detection - pause if scrolled up, resume if near bottom
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    isAutoScrollRef.current = distanceToBottom < 120;
  };

  // Auto-scroll on session change, stream start/end, message count change
  useEffect(() => {
    if (!isStartingScreen && currentSession?.messages.length > 0) {
      isAutoScrollRef.current = true;
      scrollToBottom('auto', true);
      const timer = setTimeout(() => {
        scrollToBottom('smooth', true);
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [currentSessionId, isStartingScreen]);

  useEffect(() => {
    if (!isStartingScreen) {
      scrollToBottom('smooth');
    }
  }, [currentSession?.messages.length, isLoading]);

  // Helper to update any session by specific ID
  const updateSessionById = (
    sessionId: string,
    updater: (prev: ChatSession) => ChatSession
  ) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id === sessionId) {
          return updater(session);
        }
        return session;
      })
    );
  };

  // Helper to update active session
  const updateCurrentSession = (updater: (prev: ChatSession) => ChatSession) => {
    updateSessionById(currentSession.id, updater);
  };

  // Create new chat (creates a fresh session tab with unique Date.now() ID and navigates)
  const handleNewChat = () => {
    const fresh = createNewSession(settings);
    setSessions((prev) => [fresh, ...prev]);
    setCurrentSessionId(fresh.id);
    setIsStartingScreen(false);
    setInput('');
    setReplyTo(null);

    // Sync to Firestore if authenticated and not in guest mode
    if (!isGuestMode && authUser?.uid) {
      syncTabToFirestore(authUser.uid, fresh);
    }
  };

  // Close session tab - if all closed, creates a fresh new tab
  const handleCloseSessionTab = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isGuestMode && authUser?.uid) {
      deleteTabFromFirestore(authUser.uid, sessionId);
    }
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      if (filtered.length === 0) {
        const fresh = createNewSession(settings);
        setCurrentSessionId(fresh.id);
        setIsStartingScreen(false);
        if (!isGuestMode && authUser?.uid) {
          syncTabToFirestore(authUser.uid, fresh);
        }
        return [fresh];
      }
      if (currentSessionId === sessionId) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Select session
  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setIsStartingScreen(false);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Delete session
  const handleDeleteSession = (id: string) => {
    if (!isGuestMode && authUser?.uid) {
      deleteTabFromFirestore(authUser.uid, id);
    }
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewSession(settings);
        setCurrentSessionId(fresh.id);
        setIsStartingScreen(false);
        if (!isGuestMode && authUser?.uid) {
          syncTabToFirestore(authUser.uid, fresh);
        }
        return [fresh];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Clear current session messages
  const handleClearMessages = () => {
    if (confirm('Are you sure you want to clear all messages in this conversation?')) {
      updateCurrentSession((s) => ({
        ...s,
        messages: [],
        updatedAt: Date.now()
      }));
    }
  };

  // Clear all sessions for the active mode
  const handleClearAllSessions = () => {
    if (confirm('Are you sure you want to delete conversation history? This cannot be undone.')) {
      const fresh = createNewSession(settings);
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
      const key = isGuestMode || !authUser
        ? 'sapphire_guest_sessions'
        : `sapphire_user_sessions_${authUser.uid || authUser.email}`;
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  };

  // Stop generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    updateCurrentSession((s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.isStreaming ? { ...m, isStreaming: false } : m
      )
    }));
  };

  // Open Live Preview for code block (supports single file or full multi-file project)
  const handlePreviewCode = (code: string, language: string, filename?: string, files?: any[]) => {
    let resolvedFiles: WorkspaceFile[] = [];
    if (Array.isArray(files) && files.length > 0) {
      resolvedFiles = files.map((f, i) => ({
        id: f.id || `file_${Date.now()}_${i}`,
        name: f.name || `file_${i}.${f.language || 'txt'}`,
        path: f.path || `/workspace/${f.name}`,
        content: f.content || '',
        language: f.language || 'html',
        createdAt: f.createdAt || Date.now(),
        updatedAt: f.updatedAt || Date.now(),
        autoSaved: true,
        source: 'ai-generated'
      }));
    } else {
      resolvedFiles = [
        {
          id: `file_${Date.now()}`,
          name: filename || 'index.html',
          path: `/workspace/${filename || 'index.html'}`,
          content: code,
          language: language || 'html',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          autoSaved: true,
          source: 'ai-generated'
        }
      ];
    }

    setPreviewModalState({
      isOpen: true,
      code,
      language,
      filename: filename || 'index.html',
      files: resolvedFiles
    });
  };

  // Open File & Workspace Modal
  const handleOpenFileManager = (fileId?: string) => {
    if (fileId) {
      setWorkspaceSelectedFileId(fileId);
    }
    setIsWorkspaceOpen(true);
  };

  // Insert code into active chat input
  const handleInsertCodeToChat = (code: string, fileName: string) => {
    setInput((prev) => {
      const comment = `// File: ${fileName}\n`;
      return prev ? `${prev}\n\n${comment}${code}` : `${comment}${code}`;
    });
  };

  // Send message (Supports Text, Multiple Images Vision, and Unlimited File Uploads / Rewrites)
  const handleSendMessage = async (
    text: string,
    image?: ImageAttachment,
    file?: UploadedFileAttachment,
    allFiles?: UploadedFileAttachment[],
    allImages?: ImageAttachment[]
  ) => {
    const effectiveFiles = (allFiles && allFiles.length > 0) ? allFiles : (file ? [file] : []);
    const effectiveImages = (allImages && allImages.length > 0) ? allImages : (image ? [image] : []);

    if (isLoading) return;
    if (!text.trim() && effectiveImages.length === 0 && effectiveFiles.length === 0) return;

    const userMessageId = `msg_user_${Date.now()}`;
    const modelMessageId = `msg_model_${Date.now() + 1}`;

    let promptText = text.trim();
    if (!promptText) {
      if (effectiveFiles.length === 1) {
        promptText = `Please analyze and rewrite this file: ${effectiveFiles[0].name}`;
      } else if (effectiveFiles.length > 1) {
        promptText = `Please analyze, review, and process these ${effectiveFiles.length} uploaded files.`;
      } else if (effectiveImages.length > 0) {
        promptText = 'Please analyze this screenshot / image.';
      }
    }

    if (replyTo) {
      promptText = `> Replying to ${replyTo.role === 'model' ? 'Echo AI' : 'User'}: "${replyTo.text.slice(0, 160)}"\n\n${promptText}`;
      setReplyTo(null);
    }

    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: promptText,
      image: effectiveImages[0] || undefined,
      images: effectiveImages.length > 0 ? effectiveImages : undefined,
      attachedFile: effectiveFiles[0] || undefined,
      attachedFiles: effectiveFiles.length > 0 ? effectiveFiles : undefined,
      timestamp: Date.now()
    };

    // Auto-generate session title from first prompt
    const sessionTitle =
      (effectiveFiles.length === 1
        ? `Edit: ${effectiveFiles[0].name}`
        : effectiveFiles.length > 1
        ? `${effectiveFiles.length} Files: ${effectiveFiles[0].name}`
        : promptText.slice(0, 36)) || 'New Conversation';

    // If on Starting Screen ("Into the Unknown"), spawn a clean separate session / tab
    const isFromStarting = isStartingScreen;
    let targetSessionId = currentSession.id;
    let targetSession = currentSession;
    let baseHistory = currentSession.messages;

    if (isFromStarting) {
      const newSession = createNewSession(settings);
      newSession.title = sessionTitle;
      targetSessionId = newSession.id;
      targetSession = newSession;
      baseHistory = [];
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setIsStartingScreen(false);
    } else {
      setIsStartingScreen(false);
    }

    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }

    // Force auto-scroll to bottom immediately
    isAutoScrollRef.current = true;
    scrollToBottom('smooth', true);
    setTimeout(() => scrollToBottom('smooth', true), 60);
    setTimeout(() => scrollToBottom('smooth', true), 220);

    // Normal High-Speed Chat Streaming Mode (with code generation or file rewrite)
    const newModelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      text: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
      isThinking: true,
      thinkingText: '',
      modelUsed: targetSession.model
    };

    // Prepare message for Gemini with all uploaded files context (<25MB support)
    let geminiFormattedUserText = promptText;
    if (effectiveFiles.length > 0) {
      const fileBlocks = effectiveFiles.map((f, idx) => {
        const sz = f.size < 1024 * 1024
          ? `${(f.size / 1024).toFixed(1)} KB`
          : `${(f.size / (1024 * 1024)).toFixed(2)} MB`;
        if (f.isCodeOrText && f.content) {
          return `### File ${idx + 1}: "${f.name}" (${f.type || 'text/plain'}, ${sz})\n\`\`\`${f.name.split('.').pop() || 'text'}\n${f.content}\n\`\`\``;
        } else {
          return `### File ${idx + 1}: "${f.name}" (${f.type || 'application/octet-stream'}, ${sz})`;
        }
      }).join('\n\n');

      geminiFormattedUserText = `[User Uploaded ${effectiveFiles.length} File${effectiveFiles.length > 1 ? 's' : ''}:]
${fileBlocks}

User Request / Instructions:
${promptText || 'Please analyze, remake, or update these files cleanly according to best engineering practices. Provide the complete updated file code in clean markdown code blocks with their filenames.'}`;
    }

    const messageForGemini = { ...newUserMessage, text: geminiFormattedUserText };
    const updatedMessages = [...baseHistory, newUserMessage];
    const messagesToSend = [...baseHistory, messageForGemini];

    updateSessionById(targetSessionId, (s) => ({
      ...s,
      title: sessionTitle,
      messages: [...updatedMessages, newModelMessage],
      updatedAt: Date.now()
    }));

    setIsLoading(true);
    isAutoScrollRef.current = true;
    scrollToBottom('smooth', true);
    setTimeout(() => scrollToBottom('smooth', true), 80);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let streamText = '';

    try {
      await streamGeminiChat({
        messages: messagesToSend,
        systemInstruction: targetSession.customInstruction,
        temperature: targetSession.temperature,
        model: targetSession.model,
        useSearchGrounding: targetSession.useSearchGrounding,
        customApiKey: settings.customApiKey,
        signal: controller.signal,
        onThinking: (thinkingText, isThinking) => {
          updateSessionById(targetSessionId, (s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === modelMessageId ? { ...m, thinkingText, isThinking } : m
            )
          }));
          scheduleScrollToBottom('smooth');
        },
        onChunk: (chunkText) => {
          streamText = chunkText;
          updateSessionById(targetSessionId, (s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === modelMessageId ? { ...m, text: chunkText, isThinking: false } : m
            )
          }));
          scheduleScrollToBottom('smooth');
        },
        onDone: async (finalText, stats) => {
          // Auto-save any code blocks into the workspace files storage
          autoSaveAiCodeBlocks(finalText, targetSessionId, modelMessageId);

          let modifiedContent: string | undefined = undefined;
          let modifiedFileName: string | undefined = undefined;

          // If a file was uploaded for rewrite, extract the modified code and auto-save
          if (file) {
            modifiedFileName = file.name;
            const codeMatch = finalText.match(/```(?:\w+)?\s*\n([\s\S]*?)```/);
            modifiedContent = codeMatch ? codeMatch[1].trim() : finalText;

            // Save or update in file storage service
            const allFiles = fileStorageService.getFiles();
            const existingFile = allFiles.find((f) => f.name === file.name);
            if (existingFile) {
              fileStorageService.updateFile(existingFile.id, { content: modifiedContent });
            } else {
              fileStorageService.createFile(
                file.name,
                modifiedContent,
                (file.name.split('.').pop() as any) || 'html'
              );
            }

            // If user opened via showOpenFilePicker, auto-save directly to file location on disk!
            if (file.fileHandle && typeof file.fileHandle.createWritable === 'function') {
              try {
                const writable = await file.fileHandle.createWritable();
                await writable.write(modifiedContent);
                await writable.close();
                console.log(`Auto-saved directly to local file location: ${file.name}`);
              } catch (saveErr) {
                console.warn('Direct file handle write failed:', saveErr);
              }
            }
          }

          updateSessionById(targetSessionId, (s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === modelMessageId
                ? {
                    ...m,
                    text: finalText,
                    isStreaming: false,
                    isThinking: false,
                    thinkingDurationMs: (stats as any)?.thinkingDurationMs,
                    stats,
                    modifiedFileName,
                    modifiedFileContent: modifiedContent,
                    attachedFile: file || undefined
                  }
                : m
            ),
            updatedAt: Date.now()
          }));
          scrollToBottom('smooth', true);
          setTimeout(() => scrollToBottom('smooth', true), 100);

          // Auto-speak response if enabled or active (natural human voice in English / Urdu / Hindi)
          if (settings.autoSpeakResponses && finalText && finalText.trim()) {
            try {
              const detectedLang = settings.selectedLanguage === 'auto'
                ? detectScriptLanguage(finalText)
                : settings.selectedLanguage || 'auto';

              speechService.speak(finalText, {
                language: detectedLang,
                speed: settings.ttsSpeed || 1.0,
                pitch: settings.ttsPitch || 1.0,
                voiceName: settings.ttsVoice,
                messageId: modelMessageId
              });
            } catch (ttsErr) {
              console.warn('Auto-speak response notice:', ttsErr);
            }
          }
        },
        onError: (errMessage: string) => {
          console.error('Streaming error caught:', errMessage);
          updateSessionById(targetSessionId, (s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === modelMessageId
                ? {
                    ...m,
                    isStreaming: false,
                    error: errMessage || 'An error occurred while generating response'
                  }
                : m
            )
          }));
          scrollToBottom('smooth', true);
        }
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Fatal chat stream error:', err);
        updateSessionById(targetSessionId, (s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === modelMessageId
              ? {
                  ...m,
                  isStreaming: false,
                  error: err?.message || 'Failed to complete response stream'
                }
              : m
          ),
          updatedAt: Date.now()
        }));
        scrollToBottom('smooth', true);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      scrollToBottom('smooth', true);
    }
  };

  // Regenerate last response
  const handleRegenerate = async () => {
    if (isLoading || currentSession.messages.length === 0) return;

    const lastMsg = currentSession.messages[currentSession.messages.length - 1];
    let promptToReplay = '';
    let imageToReplay: ImageAttachment | undefined;

    if (lastMsg.role === 'model') {
      const prevUserMsg = currentSession.messages[currentSession.messages.length - 2];
      if (!prevUserMsg) return;
      promptToReplay = prevUserMsg.text;
      imageToReplay = prevUserMsg.image;

      // Remove last model message and user message
      updateCurrentSession((s) => ({
        ...s,
        messages: s.messages.slice(0, -2),
        updatedAt: Date.now()
      }));
    } else {
      promptToReplay = lastMsg.text;
      imageToReplay = lastMsg.image;
      updateCurrentSession((s) => ({
        ...s,
        messages: s.messages.slice(0, -1),
        updatedAt: Date.now()
      }));
    }

    handleSendMessage(promptToReplay, imageToReplay);
  };

  // Continue generating incomplete code
  const handleContinueCode = (msg: ChatMessage) => {
    const raw = (msg.text || '').trim();
    const lastSnippet = raw.slice(-200);
    const continuePrompt = `Please continue generating the remaining code exactly from where you stopped. Complete all remaining files, functions, and HTML/CSS completely without repeating the beginning part:\n\n"...${lastSnippet}"`;
    handleSendMessage(continuePrompt);
  };

  // Export chat
  const handleExportChat = (format: 'markdown' | 'json') => {
    let content = '';
    let filename = `${currentSession.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_echo_chat`;
    let type = 'text/plain';

    if (format === 'json') {
      content = JSON.stringify(currentSession, null, 2);
      filename += '.json';
      type = 'application/json';
    } else {
      content = `# ${currentSession.title}\n\n`;
      content += `_Created: ${new Date(currentSession.createdAt).toLocaleString()}_\n`;
      content += `_Engine: ${currentSession.model}_\n\n---\n\n`;
      for (const msg of currentSession.messages) {
        const author = msg.role === 'user' ? '### 👤 User' : '### ⚡ Echo AI';
        content += `${author} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
        content += `${msg.text}\n\n---\n\n`;
      }
      filename += '.md';
      type = 'text/markdown';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activePersona =
    PERSONAS.find((p) => p.id === currentSession.personaId) || PERSONAS[0];

  const handleLoginSuccess = (user: any) => {
    setAuthUser(user);
    setIsGuestMode(false);
    localStorage.removeItem('sapphire_guest_mode');
    if (user) {
      setCurrentUserProfile((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
        avatar: user.photoURL || prev.avatar
      }));
      // Switch sessions to signed-in user's private store (never merging guest messages)
      const userKey = `sapphire_user_sessions_${user.uid || user.email}`;
      const userSessions = loadSessionsForStorage(userKey, settings);
      setSessions(userSessions);
      setCurrentSessionId(userSessions[0]?.id || '');
      setIsStartingScreen(true);
    }
  };

  const handleSignOut = () => {
    signOutUser();
    setAuthUser(null);
    setIsGuestMode(true);
    localStorage.setItem('sapphire_guest_mode', 'true');
    // Load isolated guest sessions (never displaying signed-in user messages)
    const guestSessions = loadSessionsForStorage('sapphire_guest_sessions', settings);
    setSessions(guestSessions);
    setCurrentSessionId(guestSessions[0]?.id || '');
    setIsStartingScreen(true);
  };

  // Route protection: If auth state is initializing, show sleek branded loader with timeout protection
  if (authLoading && !authUser && !isGuestMode) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#151515] text-white select-none">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#20201f] border border-[#2e2d2a] p-2 shadow-2xl flex items-center justify-center">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt="Sapphire"
              className="w-full h-full object-contain rounded-xl animate-pulse"
            />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-[#d97757]/20 blur-sm pointer-events-none -z-10" />
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#a19e97] font-medium">
          <div className="w-3.5 h-3.5 border-2 border-[#d97757] border-t-transparent rounded-full animate-spin" />
          <span>Starting Sapphire Studio...</span>
        </div>
      </div>
    );
  }

  // Route protection: If user is not authenticated and not in guest mode, render Login Screen
  if (!authUser && !isGuestMode) {
    return (
      <Auth
        onLoginSuccess={handleLoginSuccess}
        onContinueAsGuest={() => {
          setIsGuestMode(true);
          localStorage.setItem('sapphire_guest_mode', 'true');
          const guestSessions = loadSessionsForStorage('sapphire_guest_sessions', settings);
          setSessions(guestSessions);
          setCurrentSessionId(guestSessions[0]?.id || '');
          setIsStartingScreen(true);
        }}
      />
    );
  }

  return (
    <div className={`flex h-full w-full ${
      theme === 'moon' ? 'bg-[#151515] text-white' : 'bg-[#191817] text-[#edeef2]'
    } overflow-hidden select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]`}>
      {/* Sidebar: Shown in chat view or toggled open */}
      <AnimatePresence>
        {(!isStartingScreen || isSidebarOpen) && activeNavTab !== 'codex' && (
          <ChatSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            sessions={sessions}
            currentSessionId={currentSession.id}
            userProfile={currentUserProfile}
            onOpenProfile={() => setIsUserProfileModalOpen(true)}
            onSelectSession={(id) => {
              handleSelectSession(id);
              setIsStartingScreen(false);
            }}
            onNewChat={() => {
              handleNewChat();
              setIsStartingScreen(false);
            }}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onClearAllSessions={handleClearAllSessions}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenFileManager={() => handleOpenFileManager()}
            onOpenImageGen={() => setIsImageModalOpen(true)}
            onOpenGetApp={() => setIsDownloadModalOpen(true)}
            onOpenCodex={() => {
              setActiveNavTab('codex');
              setIsStartingScreen(false);
            }}
            activeNavTab={activeNavTab}
          />
        )}
      </AnimatePresence>

      {/* Main Content View */}
      <main className={`flex-1 flex flex-col h-full min-w-0 relative ${
        theme === 'moon' ? 'bg-[#151515]' : 'bg-[#191817]'
      } overflow-hidden`}>
        {/* Sleek Floating Menu Button when sidebar is collapsed */}
        {!isSidebarOpen && (
          <button
            type="button"
            id="floating-sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(true)}
            className={`absolute top-3.5 left-3.5 z-30 p-2.5 rounded-xl border shadow-lg transition-all active:scale-95 cursor-pointer ${
              theme === 'moon'
                ? 'bg-[#20201f] hover:bg-[#282724] border-[#2b2b2a] text-white'
                : 'bg-[#201f1d] hover:bg-[#282724] border-[#33312e] text-[#a19e97] hover:text-[#ede8e1]'
            }`}
            title="Open Sidebar"
            aria-label="Open Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {activeNavTab === 'codex' ? (
            /* Dedicated Google AI Studio Codex App Engine Screen with Live Preview */
            <motion.div
              key="codex-engine-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 h-full w-full overflow-hidden"
            >
              <CodexWorkspaceView
                settings={settings}
                onUpdateSettings={(newSettings) => setSettings(newSettings)}
                onClose={() => {
                  setActiveNavTab('chat');
                  setIsStartingScreen(false);
                }}
              />
            </motion.div>
          ) : isStartingScreen ? (
            /* Starting Screen: Sapphire Clean Prompt Screen */
            <motion.div
              key="starting-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className={`flex-1 h-full w-full overflow-y-auto ${
                theme === 'moon' ? 'bg-[#151515]' : 'bg-[#0e0f12]'
              }`}
            >
              <EmptyState
                onSendMessage={(text) => handleSendMessage(text)}
                onStartChat={() => {
                  setIsStartingScreen(false);
                  if (window.innerWidth >= 1024) setIsSidebarOpen(true);
                }}
                onOpenGetApp={() => setIsDownloadModalOpen(true)}
                onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                selectedLanguage={settings.selectedLanguage || 'auto'}
                useSearchGrounding={currentSession.useSearchGrounding}
                setUseSearchGrounding={(val) => {
                  updateCurrentSession((s) => ({
                    ...s,
                    useSearchGrounding:
                      typeof val === 'function' ? val(s.useSearchGrounding) : val
                  }));
                }}
                onOpenFileWorkspace={() => {
                  setActiveNavTab('workspace');
                  setIsWorkspaceOpen(true);
                }}
                userName={currentUserProfile?.name || 'Shaheer'}
                currentModel={currentSession.model || settings.defaultModel}
                onSelectModel={(modelId) => {
                  updateCurrentSession((s) => ({ ...s, model: modelId }));
                  setSettings((prev) => ({ ...prev, defaultModel: modelId }));
                }}
              />
            </motion.div>
          ) : (
            /* Active Chat Stream View */
            <motion.div
              key="chat-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className={`flex-1 flex flex-col h-full min-w-0 relative ${
                theme === 'moon' ? 'bg-[#151515]' : 'bg-white'
              } overflow-hidden`}
            >
              {/* Header with Theme Toggle & controls */}
              <ChatHeader
                currentSession={currentSession}
                userProfile={currentUserProfile}
                onOpenProfile={() => setIsUserProfileModalOpen(true)}
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                onNewChat={handleNewChat}
                onClearMessages={handleClearMessages}
                onRenameSession={(title) => handleRenameSession(currentSession.id, title)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onOpenFileManager={handleOpenFileManager}
                onOpenFileWorkspace={() => {
                  setActiveNavTab('workspace');
                  setIsWorkspaceOpen(true);
                }}
                onOpenGetApp={() => setIsDownloadModalOpen(true)}
                onExportChat={handleExportChat}
                onGoHome={() => setIsStartingScreen(true)}
              />

              {/* Guest Mode Banner: history only in guest mode */}
              {isGuestMode && (
                <div className={`px-4 py-2 flex items-center justify-between text-xs border-b ${
                  theme === 'moon' ? 'bg-[#20201f] border-[#2b2b2a] text-white' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-semibold">Guest Mode</span>
                    <span className="hidden sm:inline text-xs opacity-75">— Messages kept in guest mode only (never merged with signed-in accounts)</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsGuestMode(false);
                      localStorage.removeItem('sapphire_guest_mode');
                      setAuthUser(null);
                    }}
                    className="text-xs text-[#d97757] hover:underline cursor-pointer font-semibold"
                  >
                    Sign In / Register
                  </button>
                </div>
              )}

              {/* Scrollable Conversation Stream */}
              <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth flex flex-col ${
                  theme === 'moon' ? 'bg-[#151515]' : 'bg-white'
                }`}
              >
                {!Array.isArray(currentSession?.messages) || currentSession.messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto my-auto animate-fadeIn">
                    <div className={`w-14 h-14 rounded-2xl p-1.5 flex items-center justify-center mb-3 shadow-md ${
                      theme === 'moon' ? 'bg-[#20201f] border border-[#2b2b2a]' : 'bg-slate-100 border border-slate-200'
                    }`}>
                      <img
                        src={SAPPHIRE_LOGO_URL}
                        alt="Sapphire"
                        className="w-full h-full rounded-xl object-cover ring-1 ring-[#d97757]/30"
                      />
                    </div>
                    <h3 className={`font-semibold text-xl mb-1 ${theme === 'moon' ? 'text-white' : 'text-slate-900'}`}>
                      Sapphire Chat
                    </h3>
                    <p className={`text-xs max-w-md ${theme === 'moon' ? 'text-[#a19e97]' : 'text-slate-500'}`}>
                      Ask questions, brainstorm, or generate and preview responsive code.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 py-2">
                    {(currentSession.messages || []).map((msg) => (
                      <ChatMessageItem
                        key={msg.id}
                        message={msg}
                        language={settings.selectedLanguage || 'auto'}
                        userProfile={currentUserProfile}
                        onRegenerate={handleRegenerate}
                        onEditPrompt={(text) => setInput(text)}
                        onPreviewCode={handlePreviewCode}
                        onOpenFileWorkspace={() => setIsWorkspaceOpen(true)}
                        onOpenFileInManager={handleOpenFileManager}
                        onReply={(targetMsg) =>
                          setReplyTo({
                            id: targetMsg.id,
                            role: targetMsg.role,
                            text: targetMsg.text
                          })
                        }
                        onContinueCode={handleContinueCode}
                      />
                    ))}
                    <div ref={messagesEndRef} className="h-6" />
                  </div>
                )}
              </div>

              {/* Floating Input Dock */}
              <ChatInput
                input={input}
                setInput={setInput}
                onSend={handleSendMessage}
                onStop={handleStop}
                isLoading={isLoading}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                useSearchGrounding={currentSession.useSearchGrounding}
                setUseSearchGrounding={(val) => {
                  updateCurrentSession((s) => ({
                    ...s,
                    useSearchGrounding:
                      typeof val === 'function' ? val(s.useSearchGrounding) : val
                  }));
                }}
                selectedLanguage={settings.selectedLanguage || 'auto'}
                onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
                onOpenFileWorkspace={() => setIsWorkspaceOpen(true)}
                onChangeLanguage={(lang) => {
                  setSettings((prev) => ({ ...prev, selectedLanguage: lang }));
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persona Selection Modal */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        selectedPersonaId={currentSession.personaId}
        customInstruction={currentSession.customInstruction || ''}
        onSave={(personaId, customInstruction) => {
          updateCurrentSession((s) => ({
            ...s,
            personaId,
            customInstruction
          }));
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          updateCurrentSession((s) => ({
            ...s,
            model: newSettings.defaultModel,
            temperature: newSettings.defaultTemperature
          }));
        }}
        onClearAllHistory={handleClearAllSessions}
      />

      {/* Simplified, Clean File Manager & AI Code Sandbox Modal */}
      {isWorkspaceOpen && (
        <FileManagerModal
          isOpen={isWorkspaceOpen}
          onClose={() => {
            setIsWorkspaceOpen(false);
            setWorkspaceSelectedFileId(undefined);
          }}
          initialSelectedFileId={workspaceSelectedFileId}
        />
      )}

      {/* User Profile & Google Cloud Sync Modal */}
      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        profile={currentUserProfile}
        onUpdateProfile={(updated) => {
          setCurrentUserProfile(updated);
        }}
        sessions={sessions}
        files={loadWorkspaceFiles()}
        isFirstTimeSetup={!hasUserCompletedSetup()}
        onSignOut={handleSignOut}
        isGuestMode={isGuestMode}
      />

      {/* Standalone Code Live Preview Modal */}
      <CodePreviewModal
        isOpen={previewModalState.isOpen}
        onClose={() => setPreviewModalState((p) => ({ ...p, isOpen: false }))}
        code={previewModalState.code}
        language={previewModalState.language}
        filename={previewModalState.filename}
        files={previewModalState.files}
        onOpenFileManager={handleOpenFileManager}
        onOpenCodexWorkspace={() => {
          setPreviewModalState((p) => ({ ...p, isOpen: false }));
          setActiveNavTab('codex');
        }}
      />

      {/* Human Voice Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        selectedLanguage={settings.selectedLanguage || 'auto'}
        onSelectLanguage={(lang) => {
          setSettings((prev) => ({ ...prev, selectedLanguage: lang }));
        }}
        onSelectSamplePrompt={(p) => handleSendMessage(p)}
      />

      {/* Direct App Download Modal (Android APK & Windows EXE) */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* Android Hardware & Navigation Bar Shortcut Modal */}
      <AndroidShortcutModal
        isOpen={isAndroidShortcutModalOpen}
        onClose={() => setIsAndroidShortcutModalOpen(false)}
      />

      {/* Sapphire Vision AI Image Creation & Editing Studio Modal */}
      <GenerateImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onInsertToChat={(imageUrl, prompt) => {
          setIsImageModalOpen(false);
          handleSendMessage(`![${prompt}](${imageUrl})\n*Generated Image: ${prompt}*`);
        }}
      />
    </div>
  );
}
