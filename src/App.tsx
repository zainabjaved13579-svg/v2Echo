import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { CodePreviewModal } from './components/CodePreviewModal';
import { GenerateImageModal } from './components/GenerateImageModal';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { DownloadModal } from './components/DownloadModal';
import {
  isImageGenerationPrompt,
  isImageEditPrompt,
  generateAiImage,
  editAiImage
} from './services/imageService';
import { ECHO_LOGO_URL } from './data/constants';

const STORAGE_KEY_SESSIONS = 'echo_ai_chat_sessions_v1';
const STORAGE_KEY_SETTINGS = 'echo_ai_chat_settings_v1';
const STORAGE_KEY_CURRENT = 'echo_ai_chat_current_session_id';

const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: 'echo-3.7-flash',
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
    id: `session_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: 'New Conversation',
    messages: [],
    personaId: initialPersona.id,
    customInstruction: initialPersona.systemInstruction,
    temperature: settings.defaultTemperature,
    model: settings.defaultModel || 'echo-3.7-flash',
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

  // Load sessions
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS) || localStorage.getItem('gemini_ai_chat_sessions_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse sessions:', e);
    }
    return [createNewSession(DEFAULT_SETTINGS)];
  });

  // Current session ID
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_CURRENT) || localStorage.getItem('gemini_ai_chat_current_session_id');
    if (savedId && sessions.some((s) => s.id === savedId)) return savedId;
    return sessions[0]?.id || '';
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalImage, setImageModalImage] = useState<string | undefined>();
  const [imageModalPrompt, setImageModalPrompt] = useState<string>('');
  const [imageModalTab, setImageModalTab] = useState<'create' | 'edit'>('create');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isStartingScreen, setIsStartingScreen] = useState<boolean>(true);

  const handleOpenImageEditor = (imgUrl: string, promptText?: string) => {
    setImageModalImage(imgUrl);
    setImageModalPrompt(promptText || '');
    setImageModalTab('edit');
    setIsImageModalOpen(true);
  };

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
  }>({
    isOpen: false,
    code: '',
    language: 'html',
    filename: 'index.html'
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);

  // Active session
  const currentSession =
    sessions.find((s) => s.id === currentSessionId) || sessions[0] || createNewSession(settings);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }, [sessions]);

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

  // Auto-scroll when messages change or stream updates
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (isAutoScrollRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [currentSession?.messages.length, isLoading]);

  // User scrolling detection
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAutoScrollRef.current = isNearBottom;
  };

  // Helper to update active session
  const updateCurrentSession = (updater: (prev: ChatSession) => ChatSession) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id === currentSession.id) {
          return updater(session);
        }
        return session;
      })
    );
  };

  // Create new chat
  const handleNewChat = () => {
    const newSession = createNewSession(settings);
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setInput('');
    setIsStartingScreen(false);
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
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
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewSession(settings);
        setCurrentSessionId(fresh.id);
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

  // Clear all sessions
  const handleClearAllSessions = () => {
    if (confirm('Are you sure you want to delete ALL conversation history? This cannot be undone.')) {
      const fresh = createNewSession(settings);
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
      localStorage.removeItem(STORAGE_KEY_SESSIONS);
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

  // Open Live Preview for code block
  const handlePreviewCode = (code: string, language: string, filename?: string) => {
    setPreviewModalState({
      isOpen: true,
      code,
      language,
      filename: filename || 'index.html'
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

  // Send message (Supports Text, Screenshot Vision, and File Upload / Rewrite)
  const handleSendMessage = async (
    text: string,
    image?: ImageAttachment,
    file?: UploadedFileAttachment
  ) => {
    if (isLoading) return;
    if (!text.trim() && !image && !file) return;

    setIsStartingScreen(false);
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }

    const userMessageId = `msg_user_${Date.now()}`;
    const modelMessageId = `msg_model_${Date.now() + 1}`;

    let promptText =
      text.trim() ||
      (file
        ? `Please analyze and rewrite this file: ${file.name}`
        : image
        ? 'Please analyze this screenshot / image.'
        : '');

    if (replyTo) {
      promptText = `> Replying to ${replyTo.role === 'model' ? 'Echo AI' : 'User'}: "${replyTo.text.slice(0, 160)}"\n\n${promptText}`;
      setReplyTo(null);
    }

    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: promptText,
      image: image || undefined,
      attachedFile: file || undefined,
      timestamp: Date.now()
    };

    // Auto-generate session title from first prompt
    const isFirstMessage = currentSession.messages.length === 0;
    const sessionTitle = isFirstMessage
      ? (file ? `Edit: ${file.name}` : promptText.slice(0, 36)) || 'New Conversation'
      : currentSession.title;

    // Check if user requested to generate or draw an image (Auto-intent routing)
    if (!image && !file && isImageGenerationPrompt(promptText)) {
      const newModelMessage: ChatMessage = {
        id: modelMessageId,
        role: 'model',
        text: 'Generating your visual with neural diffusion...',
        timestamp: Date.now() + 1,
        isStreaming: true,
        modelUsed: 'echo-imagen-flux'
      };

      const updatedMessages = [...currentSession.messages, newUserMessage];
      updateCurrentSession((s) => ({
        ...s,
        title: sessionTitle,
        messages: [...updatedMessages, newModelMessage],
        updatedAt: Date.now()
      }));

      setIsLoading(true);
      isAutoScrollRef.current = true;

      try {
        const startImgTime = performance.now();
        const imgResult = await generateAiImage({ prompt: promptText });
        const durationMs = Math.max(1, Math.round(performance.now() - startImgTime));

        updateCurrentSession((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === modelMessageId
              ? {
                  ...m,
                  text: imgResult.quotaNotice
                    ? `Here is your visual for **"${imgResult.prompt}"**:\n\n> ℹ️ *${imgResult.quotaNotice}*`
                    : `Here is your visual for **"${imgResult.prompt}"**:`,
                  generatedImages: imgResult.images,
                  generatedImagePrompt: imgResult.prompt,
                  isStreaming: false,
                  stats: { durationMs, charsCount: 0, charsPerSec: 0 }
                }
              : m
          ),
          updatedAt: Date.now()
        }));
      } catch (imgErr: any) {
        updateCurrentSession((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === modelMessageId
              ? {
                  ...m,
                  text: '',
                  error: 'Image generation could not complete. Please try another prompt.',
                  isStreaming: false
                }
              : m
          )
        }));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Check if user requested to edit an attached image with text instruction (gemini-3.1-flash-image-preview)
    if (image && isImageEditPrompt(promptText)) {
      const newModelMessage: ChatMessage = {
        id: modelMessageId,
        role: 'model',
        text: 'Transforming your image with Gemini...',
        timestamp: Date.now() + 1,
        isStreaming: true,
        modelUsed: 'gemini-3.1-flash-image-preview'
      };

      const updatedMessages = [...currentSession.messages, newUserMessage];
      updateCurrentSession((s) => ({
        ...s,
        title: sessionTitle,
        messages: [...updatedMessages, newModelMessage],
        updatedAt: Date.now()
      }));

      setIsLoading(true);
      isAutoScrollRef.current = true;

      try {
        const startImgTime = performance.now();
        const imgSrc = image.dataUrl || `data:${image.mimeType};base64,${image.base64}`;
        const editResult = await editAiImage({
          image: imgSrc,
          prompt: promptText
        });
        const durationMs = Math.max(1, Math.round(performance.now() - startImgTime));

        updateCurrentSession((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === modelMessageId
              ? {
                  ...m,
                  text: editResult.quotaNotice
                    ? `Here is your edited visual for **"${editResult.prompt}"**:\n\n> ℹ️ *${editResult.quotaNotice}*`
                    : `Here is your edited visual for **"${editResult.prompt}"**:`,
                  generatedImages: editResult.images,
                  generatedImagePrompt: editResult.prompt,
                  isStreaming: false,
                  stats: { durationMs, charsCount: 0, charsPerSec: 0 }
                }
              : m
          ),
          updatedAt: Date.now()
        }));
      } catch (editErr: any) {
        updateCurrentSession((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === modelMessageId
              ? {
                  ...m,
                  text: '',
                  error: 'Image editing could not complete. Please try another instruction or format.',
                  isStreaming: false
                }
              : m
          )
        }));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Normal High-Speed Chat Streaming Mode (with code generation or file rewrite)
    const newModelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      text: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
      isThinking: true,
      thinkingText: '',
      modelUsed: currentSession.model
    };

    // Prepare message for Gemini with file context if uploaded (<15MB support)
    const fileSizeStr = file
      ? file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : '';

    let geminiFormattedUserText = promptText;
    if (file) {
      if (file.isCodeOrText && file.content) {
        geminiFormattedUserText = `[User Uploaded File: "${file.name}" (${file.type || 'text/plain'}, ${fileSizeStr})]
Here is the existing file content:
\`\`\`${file.name.split('.').pop() || 'text'}
${file.content}
\`\`\`

User Request / Modification & Remake instructions:
${promptText}

Please understand, analyze, and remake or update this file cleanly according to the user's instructions. Provide the complete updated file code in a clean markdown code block with the filename.`;
      } else {
        geminiFormattedUserText = `[User Uploaded Multimodal File: "${file.name}" (${file.type || 'application/pdf'}, ${fileSizeStr})]
User Request / Instructions:
${promptText}

Please carefully examine, understand, and analyze this uploaded document/file and fulfill the user's request thoroughly.`;
      }
    }

    const messageForGemini = { ...newUserMessage, text: geminiFormattedUserText };
    const updatedMessages = [...currentSession.messages, newUserMessage];
    const messagesToSend = [...currentSession.messages, messageForGemini];

    updateCurrentSession((s) => ({
      ...s,
      title: sessionTitle,
      messages: [...updatedMessages, newModelMessage],
      updatedAt: Date.now()
    }));

    setIsLoading(true);
    isAutoScrollRef.current = true;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let streamText = '';

    try {
      await streamGeminiChat({
        messages: messagesToSend,
        systemInstruction: currentSession.customInstruction,
        temperature: currentSession.temperature,
        model: currentSession.model,
        useSearchGrounding: currentSession.useSearchGrounding,
        customApiKey: settings.customApiKey,
        signal: controller.signal,
        onThinking: (thinkingText, isThinking) => {
          updateCurrentSession((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === modelMessageId ? { ...m, thinkingText, isThinking } : m
            )
          }));
        },
        onChunk: (chunkText) => {
          streamText = chunkText;
          updateCurrentSession((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === modelMessageId ? { ...m, text: chunkText, isThinking: false } : m
            )
          }));
        },
        onDone: async (finalText, stats) => {
          // Auto-save any code blocks into the workspace files storage
          autoSaveAiCodeBlocks(finalText, currentSession.id, modelMessageId);

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

          updateCurrentSession((s) => ({
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
        },
        onError: (errMessage: string) => {
          console.error('Streaming error caught:', errMessage);
          updateCurrentSession((s) => ({
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
        }
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Fatal chat stream error:', err);
        updateCurrentSession((s) => ({
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
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
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

  return (
    <div className="flex h-full w-full bg-white text-slate-800 overflow-hidden select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar: Shown in chat view, hidden on starting screen */}
      <AnimatePresence>
        {!isStartingScreen && (
          <ChatSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            sessions={sessions}
            currentSessionId={currentSession.id}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onClearAllSessions={handleClearAllSessions}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenFileManager={() => handleOpenFileManager()}
            onOpenFileWorkspace={() => setIsWorkspaceOpen(true)}
            onOpenGetApp={() => setIsDownloadModalOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Main Chat View */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative bg-white overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {isStartingScreen ? (
            /* Starting Screen: DeepSeek Style "Into the Unknown" with Get App (APK/EXE), Search Box, and NO API Option */
            <motion.div
              key="starting-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="flex-1 h-full w-full overflow-y-auto"
            >
              <EmptyState
                onSendMessage={(text) => handleSendMessage(text)}
                onStartChat={() => {
                  setIsStartingScreen(false);
                  if (window.innerWidth >= 1024) setIsSidebarOpen(true);
                }}
                onOpenGetApp={() => setIsDownloadModalOpen(true)}
                onToggleSidebar={() => {
                  setIsStartingScreen(false);
                  setIsSidebarOpen(true);
                }}
                onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
                selectedLanguage={settings.selectedLanguage || 'auto'}
                useSearchGrounding={currentSession.useSearchGrounding}
                setUseSearchGrounding={(val) => {
                  updateCurrentSession((s) => ({
                    ...s,
                    useSearchGrounding:
                      typeof val === 'function' ? val(s.useSearchGrounding) : val
                  }));
                }}
                onOpenFileWorkspace={() => setIsWorkspaceOpen(true)}
                onOpenImageGen={() => setIsImageModalOpen(true)}
              />
            </motion.div>
          ) : (
            /* Active Chat Stream View */
            <motion.div
              key="chat-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="flex-1 flex flex-col h-full min-w-0 relative bg-white overflow-hidden"
            >
              {/* Header */}
              <ChatHeader
                currentSession={currentSession}
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                onNewChat={handleNewChat}
                onClearMessages={handleClearMessages}
                onRenameSession={(title) => handleRenameSession(currentSession.id, title)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onOpenFileManager={() => handleOpenFileManager()}
                onOpenFileWorkspace={() => setIsWorkspaceOpen(true)}
                onOpenImageGen={() => setIsImageModalOpen(true)}
                onOpenGetApp={() => setIsDownloadModalOpen(true)}
                onExportChat={handleExportChat}
              />

              {/* Scrollable Conversation Stream */}
              <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth flex flex-col"
              >
                {currentSession.messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto my-auto animate-fadeIn">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 shadow-2xs">
                      <img
                        src={ECHO_LOGO_URL}
                        alt="Echo AI"
                        className="w-7 h-7 rounded-xl object-contain"
                      />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                      What can Echo help you with?
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Ask questions, solve problems, generate code, or upload files and images.
                    </p>

                    {/* Quick prompt suggestions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 w-full text-left">
                      {[
                        'Explain quantum computing simply',
                        'Help me write a professional email',
                        'Create a Python script to parse JSON',
                        'Translate English to Urdu voice'
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSendMessage(suggestion)}
                          className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/70 hover:border-indigo-200 text-xs text-slate-700 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99]"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100/80">
                    {currentSession.messages.map((msg) => (
                      <ChatMessageItem
                        key={msg.id}
                        message={msg}
                        language={settings.selectedLanguage || 'auto'}
                        onRegenerate={handleRegenerate}
                        onEditPrompt={(text) => setInput(text)}
                        onPreviewCode={handlePreviewCode}
                        onOpenFileWorkspace={() => setIsWorkspaceOpen(true)}
                        onOpenFileInManager={handleOpenFileManager}
                        onEditImage={handleOpenImageEditor}
                        onReply={(targetMsg) =>
                          setReplyTo({
                            id: targetMsg.id,
                            role: targetMsg.role,
                            text: targetMsg.text
                          })
                        }
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
                onOpenImageGen={() => setIsImageModalOpen(true)}
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

      {/* File & Workspace Modal (Upload unzipped folder/files, hierarchical path tree, AI code edit, no preview) */}
      {isWorkspaceOpen && (
        <FileWorkspaceModal
          isOpen={isWorkspaceOpen}
          onClose={() => {
            setIsWorkspaceOpen(false);
            setWorkspaceSelectedFileId(undefined);
          }}
          initialSelectedFileId={workspaceSelectedFileId}
        />
      )}

      {/* Standalone Code Live Preview Modal */}
      <CodePreviewModal
        isOpen={previewModalState.isOpen}
        onClose={() => setPreviewModalState((p) => ({ ...p, isOpen: false }))}
        code={previewModalState.code}
        language={previewModalState.language}
        filename={previewModalState.filename}
        onOpenFileManager={handleOpenFileManager}
      />

      {/* Dedicated Working AI Image Generator & Editor Modal */}
      <GenerateImageModal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setImageModalImage(undefined);
          setImageModalPrompt('');
          setImageModalTab('create');
        }}
        initialImage={imageModalImage}
        initialPrompt={imageModalPrompt}
        initialTab={imageModalTab}
        onInsertToChat={(imageUrl, prompt) => {
          handleSendMessage(`Visual Asset: ${prompt}\n\n![${prompt}](${imageUrl})`);
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
    </div>
  );
}
