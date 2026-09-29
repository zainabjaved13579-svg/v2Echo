import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Code2,
  Eye,
  Folder,
  FileCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Laptop,
  Smartphone,
  Trash2,
  X,
  Send,
  ArrowRight,
  FolderPlus,
  History,
  Cpu,
  Key,
  Wand2
} from 'lucide-react';
import { WorkspaceFile, AppSettings } from '../types';
import {
  loadWorkspaceFiles,
  saveWorkspaceFiles,
  exportAllFilesAsZip
} from '../services/fileStorageService';
import { parseGeneratedProjectFiles, buildUnifiedLivePreviewBundle } from '../services/appEngineService';
import { streamGeminiChat } from '../services/geminiService';
import {
  CodexProject,
  CodexChatMessage,
  getStoredProjects,
  getCurrentProjectId,
  setCurrentProjectId,
  createNewProject,
  updateProject,
  deleteProject
} from '../services/projectService';
import { useAppTheme } from '../context/ThemeContext';
import { SAPPHIRE_LOGO_URL } from '../data/constants';

interface CodexWorkspaceViewProps {
  settings: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
  onClose?: () => void;
}

export const CodexWorkspaceView: React.FC<CodexWorkspaceViewProps> = ({
  settings,
  onUpdateSettings,
  onClose
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  // Projects State
  const [projects, setProjects] = useState<CodexProject[]>(() => getStoredProjects());
  const [currentProject, setCurrentProject] = useState<CodexProject>(() => {
    const list = getStoredProjects();
    const currId = getCurrentProjectId();
    return list.find((p) => p.id === currId) || list[0];
  });

  // Project Choice Modal state
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'create' | 'continue'>('create');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectEngine, setNewProjectEngine] = useState<CodexProject['engine']>('ensemble');

  // Files & Editor State
  const [files, setFiles] = useState<WorkspaceFile[]>(() => currentProject?.files || loadWorkspaceFiles());
  const [selectedFileId, setSelectedFileId] = useState<string>(() => {
    return currentProject?.files?.[0]?.id || files[0]?.id || '';
  });

  // Layout: device frame for preview
  const [deviceFrame, setDeviceFrame] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');

  // Chat State
  const [chatMessages, setChatMessages] = useState<CodexChatMessage[]>(() => currentProject?.chatHistory || []);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<'ensemble' | 'deepseek' | 'gemini' | 'google-ai-studio' | 'openai'>('ensemble');
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [keysForm, setKeysForm] = useState(() => ({
    openaiKey: settings.openaiApiKey || localStorage.getItem('openai_api_key') || localStorage.getItem('OPENAI_API_KEY') || '',
    deepseekKey: settings.deepseekApiKey || localStorage.getItem('deepseek_api_key') || localStorage.getItem('DEEPSEEK_API_KEY') || '',
    geminiKey: settings.customApiKey || localStorage.getItem('gemini_api_key') || localStorage.getItem('gemni_api_key') || localStorage.getItem('GEMINI_API_KEY') || ''
  }));
  const [keysSavedFeedback, setKeysSavedFeedback] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync files when project changes
  useEffect(() => {
    if (currentProject) {
      setFiles(currentProject.files);
      setSelectedFileId(currentProject.files[0]?.id || '');
      setChatMessages(currentProject.chatHistory || []);
      saveWorkspaceFiles(currentProject.files);
      setCurrentProjectId(currentProject.id);
      setPreviewKey((k) => k + 1);
    }
  }, [currentProject?.id]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGenerating]);

  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (keysForm.openaiKey) localStorage.setItem('openai_api_key', keysForm.openaiKey.trim());
    else localStorage.removeItem('openai_api_key');

    if (keysForm.deepseekKey) localStorage.setItem('deepseek_api_key', keysForm.deepseekKey.trim());
    else localStorage.removeItem('deepseek_api_key');

    if (keysForm.geminiKey) localStorage.setItem('gemini_api_key', keysForm.geminiKey.trim());
    else localStorage.removeItem('gemini_api_key');

    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        openaiApiKey: keysForm.openaiKey.trim() || undefined,
        deepseekApiKey: keysForm.deepseekKey.trim() || undefined,
        customApiKey: keysForm.geminiKey.trim() || undefined
      });
    }

    setKeysSavedFeedback(true);
    setTimeout(() => {
      setKeysSavedFeedback(false);
      setShowApiKeysModal(false);
    }, 1500);
  };

  // Update files
  const handleUpdateCurrentFiles = (newFiles: WorkspaceFile[]) => {
    setFiles(newFiles);
    saveWorkspaceFiles(newFiles);
    const updated = {
      ...currentProject,
      files: newFiles,
      updatedAt: Date.now()
    };
    setCurrentProject(updated);
    updateProject(updated);
    setProjects(getStoredProjects());
    setPreviewKey((k) => k + 1);
  };

  // Create new empty file
  const handleCreateEmptyFile = () => {
    const filename = window.prompt('Enter filename (e.g. styles.css, app.js, index.html):', 'component.js');
    if (!filename) return;
    const newFile: WorkspaceFile = {
      id: `file_${Date.now()}`,
      name: filename,
      path: `/workspace/${filename}`,
      content: filename.endsWith('.html')
        ? '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>'
        : `// ${filename}\n`,
      language: filename.split('.').pop() || 'javascript',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      autoSaved: true,
      source: 'user-created'
    };
    const updated = [...files, newFile];
    handleUpdateCurrentFiles(updated);
    setSelectedFileId(newFile.id);
  };

  // Delete file
  const handleDeleteFile = (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    const updated = files.filter((f) => f.id !== id);
    handleUpdateCurrentFiles(updated);
    if (selectedFileId === id) {
      setSelectedFileId(updated[0]?.id || '');
    }
  };

  // Switch project
  const handleSelectProject = (proj: CodexProject) => {
    setCurrentProject(proj);
    setShowProjectModal(false);
  };

  // Create new project
  const handleCreateProjectSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const created = createNewProject(
      newProjectName || 'Master Web Project',
      newProjectDesc || 'Full-stack application built with Sapphire Codex',
      newProjectEngine
    );
    setProjects(getStoredProjects());
    setCurrentProject(created);
    setShowProjectModal(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  // Delete project
  const handleDeleteProject = (projId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    const remaining = deleteProject(projId);
    setProjects(remaining);
    if (currentProject.id === projId) {
      setCurrentProject(remaining[0] || createNewProject('New Master Project', 'Initial project'));
    }
  };

  // Send prompt to AI
  const handleSendPrompt = async (promptOverride?: string) => {
    const textToSend = (promptOverride || chatInput).trim();
    if (!textToSend || isGenerating) return;

    setChatInput('');
    setIsGenerating(true);
    setStatusText('Synthesizing project files...');

    const userMessageId = `msg_user_${Date.now()}`;
    const userMessage: CodexChatMessage = {
      id: userMessageId,
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    const aiMessageId = `msg_ai_${Date.now()}`;
    const initialAiMessage: CodexChatMessage = {
      id: aiMessageId,
      role: 'model',
      text: 'Analyzing project and synthesizing files...',
      timestamp: Date.now(),
      engine: selectedEngine
    };

    const newChatHistory = [...chatMessages, userMessage, initialAiMessage];
    setChatMessages(newChatHistory);

    const filesContext = files
      .map((f) => `### File: ${f.name}\n\`\`\`${f.language} ${f.name}\n${f.content}\n\`\`\``)
      .join('\n\n');

    const systemPrompt = `You are Codex Master Engine, an elite autonomous software architect.
Never mention underlying model providers. Always refer to yourself strictly as Codex Master Engine.

CRITICAL INSTRUCTIONS:
- Build or update the complete master web application according to user's instructions.
- Provide full, coordinated, ready-to-run files (e.g. index.html, styles.css, app.js).
- Put EACH file in its own Markdown code block with its filename on the first line:
\`\`\`html index.html
<!DOCTYPE html>
...
\`\`\`
\`\`\`css styles.css
...
\`\`\`
\`\`\`javascript app.js
...
\`\`\`
- Use modern Tailwind CSS via CDN, clean typography, responsive layout.
- Every button and element must work interactively.
- After code blocks, give a brief 1-2 sentence overview.`;

    const userInstructionPrompt = `Current Project: "${currentProject.name}"
Description: "${currentProject.description}"

CURRENT WORKSPACE FILES:
${filesContext}

USER REQUEST:
${textToSend}

Please engineer the updated files now.`;

    let accumulatedText = '';
    const activeOpenAiKey = settings.openaiApiKey || localStorage.getItem('openai_api_key') || '';
    const activeDeepSeekKey = settings.deepseekApiKey || localStorage.getItem('deepseek_api_key') || '';
    const activeGeminiKey = settings.customApiKey || localStorage.getItem('gemini_api_key') || '';

    let targetModel = 'gemini-2.5-flash';
    if (selectedEngine === 'openai') targetModel = 'openai-gpt-4o-mini';
    else if (selectedEngine === 'deepseek') targetModel = 'deepseek-coder';
    else if (selectedEngine === 'google-ai-studio') targetModel = 'gemini-2.5-pro';
    else if (selectedEngine === 'ensemble') targetModel = activeOpenAiKey ? 'openai-gpt-4o-mini' : 'gemini-2.5-flash';

    const onGenerationComplete = (finalText: string) => {
      const parsed = parseGeneratedProjectFiles(finalText);
      let updatedFilesList = [...files];
      const modifiedNames: string[] = [];

      if (parsed.length > 0) {
        parsed.forEach((pFile) => {
          const existingIdx = updatedFilesList.findIndex(
            (f) => f.name.toLowerCase() === pFile.name.toLowerCase()
          );
          if (existingIdx !== -1) {
            updatedFilesList[existingIdx] = {
              ...updatedFilesList[existingIdx],
              content: pFile.content,
              updatedAt: Date.now()
            };
          } else {
            updatedFilesList.push(pFile);
          }
          modifiedNames.push(pFile.name);
        });

        handleUpdateCurrentFiles(updatedFilesList);
        setStatusText(`Updated: ${modifiedNames.join(', ')}`);
      }

      const updatedChatHistory = newChatHistory.map((m) =>
        m.id === aiMessageId ? { ...m, text: finalText, modifiedFiles: modifiedNames } : m
      );

      setChatMessages(updatedChatHistory);

      const updatedProj: CodexProject = {
        ...currentProject,
        files: updatedFilesList,
        chatHistory: updatedChatHistory,
        updatedAt: Date.now()
      };
      setCurrentProject(updatedProj);
      updateProject(updatedProj);
      setProjects(getStoredProjects());
      setPreviewKey((k) => k + 1);
    };

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-mode': 'codex',
          'x-gemini-api-key': activeGeminiKey,
          'x-openai-api-key': activeOpenAiKey,
          'x-deepseek-api-key': activeDeepSeekKey
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userInstructionPrompt }] }],
          systemInstruction: systemPrompt,
          temperature: 0.4,
          model: targetModel,
          isCodex: true,
          engine: selectedEngine,
          openaiApiKey: activeOpenAiKey,
          deepseekApiKey: activeDeepSeekKey,
          customApiKey: activeGeminiKey
        })
      });

      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              accumulatedText += parsed.text;
              setChatMessages((prev) =>
                prev.map((m) => (m.id === aiMessageId ? { ...m, text: accumulatedText } : m))
              );
            }
          } catch {}
        }
      }

      if (accumulatedText.trim()) {
        onGenerationComplete(accumulatedText);
        return;
      }
      throw new Error('Empty stream, falling back.');
    } catch (fetchErr) {
      try {
        await streamGeminiChat({
          messages: [{ id: userMessageId, role: 'user', text: userInstructionPrompt, timestamp: Date.now() }],
          systemInstruction: systemPrompt,
          temperature: 0.5,
          model: targetModel.includes('pro') ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
          customApiKey: activeGeminiKey,
          onChunk: (chunkText) => {
            accumulatedText = chunkText;
            setChatMessages((prev) =>
              prev.map((m) => (m.id === aiMessageId ? { ...m, text: chunkText } : m))
            );
          },
          onDone: (finalText) => onGenerationComplete(finalText),
          onError: (err) => {
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId ? { ...m, text: `Error: ${err || 'Please retry.'}` } : m
              )
            );
          }
        });
      } catch (clientErr: any) {
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId ? { ...m, text: `Error: ${clientErr?.message || 'Failed.'}` } : m
          )
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const previewBundle = buildUnifiedLivePreviewBundle(files, selectedFileId, 'all');

  // === THEME COLORS ===
  const t = {
    bg: isMoon ? 'bg-[#151515]' : 'bg-[#faf7f2]',
    bgHeader: isMoon ? 'bg-[#111111]' : 'bg-white',
    bgCard: isMoon ? 'bg-[#1a1a1a]' : 'bg-white',
    bgSubtle: isMoon ? 'bg-[#20201f]' : 'bg-[#f5f1ea]',
    bgHover: isMoon ? 'hover:bg-[#282724]' : 'hover:bg-[#efe9df]',
    border: isMoon ? 'border-[#2b2b2a]' : 'border-[#e8e2d8]',
    text: isMoon ? 'text-white' : 'text-[#2a2620]',
    textSub: isMoon ? 'text-[#a19e97]' : 'text-[#6b6459]',
    textMuted: isMoon ? 'text-[#86837c]' : 'text-[#9a9186]',
  };

  return (
    <div className={`h-full w-full flex flex-col ${t.bg} ${t.text} overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]`}>

      {/* === HEADER (Minimal) === */}
      <header className={`h-14 border-b ${t.border} ${t.bgHeader} px-4 flex items-center justify-between shrink-0 z-20`}>
        <div className="flex items-center gap-3">
          <img
            src={SAPPHIRE_LOGO_URL}
            alt="Codex Studio"
            className={`w-8 h-8 rounded-xl object-contain p-0.5 border ${t.border} bg-white shadow-sm shrink-0`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm tracking-tight ${t.text}`}>Codex Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium">
                Multi-Engine
              </span>
            </div>
          </div>

          <div className={`h-4 w-px ${isMoon ? 'bg-[#2b2b2a]' : 'bg-[#e8e2d8]'} hidden sm:block mx-1`} />

          <button
            onClick={() => setShowProjectModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl ${t.bgSubtle} ${t.bgHover} border ${t.border} text-xs ${t.text} transition-all cursor-pointer`}
          >
            <Folder className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="font-medium max-w-[140px] truncate">{currentProject?.name || 'Master Project'}</span>
            <span className={`text-[10px] ${t.textMuted} ${t.bg} px-1.5 py-0.5 rounded-lg border ${t.border}`}>Switch</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowApiKeysModal(true)}
            className={`p-2 rounded-xl ${t.bgSubtle} ${t.bgHover} border ${t.border} transition-colors cursor-pointer`}
            title="API Keys"
          >
            <Key className="w-3.5 h-3.5 text-[#d97757]" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-xl ${t.bgSubtle} ${t.bgHover} border ${t.border} transition-colors cursor-pointer`}
              title="Close"
            >
              <X className={`w-4 h-4 ${t.textSub}`} />
            </button>
          )}
        </div>
      </header>

      {/* === MOBILE TAB SWITCHER === */}
      <div className={`lg:hidden flex items-center ${t.bgHeader} border-b ${t.border} p-1.5 gap-1 shrink-0`}>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'chat' ? 'bg-[#d97757] text-white shadow-xs' : `${t.textMuted}`
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>AI Chat</span>
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'preview' ? 'bg-[#d97757] text-white shadow-xs' : `${t.textMuted}`
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live Preview</span>
        </button>
      </div>

      {/* === MAIN BODY: 2-COLUMN LAYOUT === */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ===================== LEFT SIDE: CHAT ===================== */}
        <div className={`w-full lg:w-1/2 flex flex-col ${t.bg} overflow-hidden lg:border-r ${t.border} ${
          mobileTab === 'preview' ? 'hidden lg:flex' : 'flex'
        }`}>

          {/* Chat Header */}
          <div className={`px-4 py-3 border-b ${t.border} ${t.bgHeader} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d97757]" />
              <span className={`text-xs font-bold ${t.text}`}>Sapphire Codex Engine</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className={t.textSub}>{isGenerating ? 'Building...' : 'Ready'}</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${t.bg} select-text`}>
            {chatMessages.length === 0 && (
              <div className={`flex flex-col items-center justify-center h-full text-center gap-3 ${t.textMuted}`}>
                <Sparkles className="w-10 h-10 text-[#d97757]/40" />
                <p className="text-sm font-medium">Start building with Codex Engine</p>
                <p className="text-xs max-w-xs">Describe what you want to build and AI will generate all the files for you.</p>
              </div>
            )}

            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[92%] border ${
                      isUser
                        ? `bg-[#d97757] text-white border-[#d97757]`
                        : `${t.bgCard} ${t.text} ${t.border}`
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {msg.modifiedFiles && msg.modifiedFiles.length > 0 && (
                      <div className={`mt-2.5 pt-2 border-t ${isUser ? 'border-white/20' : t.border} flex flex-wrap items-center gap-1`}>
                        <span className="text-[10px] text-emerald-400 font-medium">Updated:</span>
                        {msg.modifiedFiles.map((fn, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${t.bgSubtle} border ${t.border} text-[10px] ${t.text}`}
                          >
                            <FileCode className="w-2.5 h-2.5 text-[#d97757]" />
                            {fn}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isGenerating && (
              <div className={`flex items-center gap-2 text-xs ${t.textSub} p-3 ${t.bgCard} border ${t.border} rounded-2xl`}>
                <div className="w-3.5 h-3.5 border-2 border-[#d97757] border-t-transparent rounded-full animate-spin" />
                <span>Building your application...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <div className={`p-3 ${t.bgHeader} border-t ${t.border}`}>
            <div className={`relative rounded-2xl ${t.bgCard} border ${t.border} p-2.5 shadow-sm focus-within:border-[#d97757]/60 transition-all`}>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                placeholder="Describe what to build or change..."
                rows={2}
                className={`w-full bg-transparent ${t.text} text-xs sm:text-sm ${t.textMuted} focus:outline-none resize-none leading-relaxed placeholder:opacity-70`}
              />

              <div className={`pt-2 flex items-center justify-between border-t ${t.border}`}>
                <button
                  onClick={handleCreateEmptyFile}
                  className={`p-1.5 px-3 rounded-xl ${t.bgSubtle} ${t.bgHover} border ${t.border} ${t.text} text-xs flex items-center gap-1.5 cursor-pointer transition-colors`}
                  title="Add file"
                >
                  <Plus className="w-3.5 h-3.5 text-[#d97757]" />
                  <span className="hidden sm:inline">New File</span>
                </button>

                <button
                  onClick={() => handleSendPrompt()}
                  disabled={!chatInput.trim() || isGenerating}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    chatInput.trim() && !isGenerating
                      ? 'bg-[#d97757] hover:bg-[#c86b4c] text-white shadow-md'
                      : `${t.bgSubtle} ${t.textMuted} cursor-not-allowed`
                  }`}
                >
                  <span>Build</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== RIGHT SIDE: PREVIEW ONLY ===================== */}
        <div className={`w-full lg:w-1/2 flex flex-col ${t.bg} overflow-hidden ${
          mobileTab === 'chat' ? 'hidden lg:flex' : 'flex'
        }`}>

          {/* Preview Header with Device Toggle + Download All Files */}
          <div className={`px-4 py-3 border-b ${t.border} ${t.bgHeader} flex items-center justify-between shrink-0 gap-2`}>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#d97757]" />
              <span className={`text-xs font-bold ${t.text}`}>Live Preview</span>
              <span className={`text-[10px] ${t.textMuted} ${t.bgSubtle} px-2 py-0.5 rounded-lg border ${t.border}`}>
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Device Toggle */}
              <div className={`flex items-center ${t.bgSubtle} border ${t.border} rounded-xl p-0.5`}>
                <button
                  onClick={() => setDeviceFrame('desktop')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    deviceFrame === 'desktop' ? 'bg-[#d97757] text-white' : `${t.textMuted}`
                  }`}
                  title="Desktop"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceFrame('mobile')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    deviceFrame === 'mobile' ? 'bg-[#d97757] text-white' : `${t.textMuted}`
                  }`}
                  title="Mobile"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Reload */}
              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                className={`p-2 rounded-xl ${t.bgSubtle} ${t.bgHover} border ${t.border} transition-colors cursor-pointer`}
                title="Reload"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${t.textSub}`} />
              </button>
            </div>
          </div>

          {/* Preview Iframe */}
          <div className={`flex-1 ${t.bg} flex items-center justify-center p-3 sm:p-4 overflow-hidden`}>
            <div
              className={`w-full h-full flex flex-col rounded-2xl overflow-hidden border ${t.border} shadow-xl bg-white transition-all ${
                deviceFrame === 'mobile' ? 'max-w-[390px]' : ''
              }`}
            >
              <iframe
                key={previewKey}
                srcDoc={previewBundle}
                title="Live Preview"
                sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-downloads"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>

          {/* Download All Files Button */}
          <div className={`p-3 ${t.bgHeader} border-t ${t.border} shrink-0`}>
            <button
              onClick={() => exportAllFilesAsZip(files)}
              className="w-full py-3 rounded-2xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download All Files (ZIP)</span>
            </button>
          </div>
        </div>
      </div>

      {/* === PROJECT MODAL === */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl ${t.bgCard} border ${t.border} rounded-3xl shadow-2xl p-6 relative overflow-hidden flex flex-col`}>
            <button
              onClick={() => setShowProjectModal(false)}
              className={`absolute top-5 right-5 p-2 rounded-2xl ${t.bgSubtle} ${t.bgHover} border ${t.border} transition-colors cursor-pointer`}
            >
              <X className={`w-4 h-4 ${t.textSub}`} />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-3xl bg-gradient-to-tr from-[#d97757] to-[#e69176] mx-auto flex items-center justify-center font-bold text-white shadow-lg shadow-[#d97757]/30 mb-3">
                <Code2 className="w-6 h-6" />
              </div>
              <h2 className={`text-xl font-bold ${t.text}`}>Codex Projects</h2>
              <p className={`text-xs ${t.textSub} mt-1`}>Build production software with AI.</p>
            </div>

            <div className={`grid grid-cols-2 gap-2 ${t.bgSubtle} p-1.5 rounded-2xl border ${t.border} mb-6`}>
              <button
                onClick={() => setModalTab('create')}
                className={`py-2.5 px-4 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  modalTab === 'create' ? 'bg-[#d97757] text-white shadow-md' : `${t.textSub}`
                }`}
              >
                <FolderPlus className="w-4 h-4" />
                <span>New Project</span>
              </button>
              <button
                onClick={() => setModalTab('continue')}
                className={`py-2.5 px-4 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  modalTab === 'continue' ? 'bg-[#d97757] text-white shadow-md' : `${t.textSub}`
                }`}
              >
                <History className="w-4 h-4" />
                <span>Continue ({projects.length})</span>
              </button>
            </div>

            {modalTab === 'create' && (
              <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium ${t.text} mb-1.5`}>Project Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. SaaS Dashboard"
                    required
                    className={`w-full px-3.5 py-2.5 rounded-2xl ${t.bgSubtle} border ${t.border} ${t.text} text-sm focus:outline-none focus:border-[#d97757]`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium ${t.text} mb-1.5`}>Goal / Description</label>
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="What do you want to build?"
                    rows={3}
                    className={`w-full px-3.5 py-2.5 rounded-2xl ${t.bgSubtle} border ${t.border} ${t.text} text-sm focus:outline-none focus:border-[#d97757] resize-none`}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className={`px-4 py-2 rounded-2xl ${t.bgSubtle} ${t.bgHover} border ${t.border} text-xs ${t.text} cursor-pointer`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-2xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <span>Create Project</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {modalTab === 'continue' && (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {projects.map((proj) => {
                  const isCurrent = proj.id === currentProject?.id;
                  return (
                    <div
                      key={proj.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isCurrent ? 'bg-[#d97757]/10 border-[#d97757]' : `${t.bgSubtle} ${t.border}`
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold ${t.text} truncate`}>{proj.name}</h4>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${t.textSub} truncate mt-0.5`}>{proj.description}</p>
                        <div className={`flex items-center gap-2 text-[10px] ${t.textMuted} mt-1.5`}>
                          <span>{proj.files?.length || 0} files</span>
                          <span>•</span>
                          <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {projects.length > 1 && (
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleSelectProject(proj)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                            isCurrent ? 'bg-[#d97757] text-white' : `${t.bgSubtle} ${t.bgHover} border ${t.border} ${t.text}`
                          }`}
                        >
                          <span>{isCurrent ? 'Current' : 'Open'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === API KEYS MODAL === */}
      {showApiKeysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl ${t.bgCard} border ${t.border} shadow-2xl p-6 space-y-4`}>
            <div className={`flex items-center justify-between pb-3 border-b ${t.border}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-2xl bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-[#d97757]">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${t.text}`}>API Keys</h3>
                  <p className={`text-[11px] ${t.textSub}`}>Optional - server proxy works by default</p>
                </div>
              </div>
              <button
                onClick={() => setShowApiKeysModal(false)}
                className={`p-1.5 ${t.textSub} hover:${t.text} rounded-xl ${t.bgHover} cursor-pointer`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveApiKeys} className="space-y-3">
              <div className={`space-y-1.5 p-3 rounded-2xl ${t.bgSubtle} border ${t.border}`}>
                <label className="text-xs font-semibold text-teal-500">OpenAI API Key</label>
                <input
                  type="password"
                  placeholder="sk-... (optional)"
                  value={keysForm.openaiKey}
                  onChange={(e) => setKeysForm((p) => ({ ...p, openaiKey: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl ${t.bg} border ${t.border} text-xs ${t.text} focus:outline-none focus:border-teal-500 font-mono`}
                />
              </div>

              <div className={`space-y-1.5 p-3 rounded-2xl ${t.bgSubtle} border ${t.border}`}>
                <label className="text-xs font-semibold text-blue-500">DeepSeek API Key</label>
                <input
                  type="password"
                  placeholder="sk-... (optional)"
                  value={keysForm.deepseekKey}
                  onChange={(e) => setKeysForm((p) => ({ ...p, deepseekKey: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl ${t.bg} border ${t.border} text-xs ${t.text} focus:outline-none focus:border-blue-500 font-mono`}
                />
              </div>

              <div className={`space-y-1.5 p-3 rounded-2xl ${t.bgSubtle} border ${t.border}`}>
                <label className="text-xs font-semibold text-purple-500">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy... (optional)"
                  value={keysForm.geminiKey}
                  onChange={(e) => setKeysForm((p) => ({ ...p, geminiKey: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl ${t.bg} border ${t.border} text-xs ${t.text} focus:outline-none focus:border-purple-500 font-mono`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {keysSavedFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Keys</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodexWorkspaceView;