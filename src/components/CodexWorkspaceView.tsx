import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Code2,
  Eye,
  Layers,
  Folder,
  FileCode,
  Play,
  Download,
  Copy,
  Check,
  RefreshCw,
  Plus,
  ExternalLink,
  Laptop,
  Smartphone,
  Zap,
  Trash2,
  X,
  Send,
  ArrowRight,
  FolderPlus,
  History,
  Bot,
  User,
  Wand2,
  Cpu
} from 'lucide-react';
import { WorkspaceFile, AppSettings } from '../types';
import {
  loadWorkspaceFiles,
  saveWorkspaceFiles,
  autoSaveFile,
  deleteWorkspaceFile,
  exportAllFilesAsZip
} from '../services/fileStorageService';
import { parseGeneratedProjectFiles, buildUnifiedLivePreviewBundle } from '../services/appEngineService';
import { streamGeminiChat } from '../services/geminiService';
import {
  CodexProject,
  CodexChatMessage,
  getStoredProjects,
  saveProjects,
  getCurrentProjectId,
  setCurrentProjectId,
  createNewProject,
  updateProject,
  deleteProject
} from '../services/projectService';
import { useAppTheme } from '../context/ThemeContext';

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

  // Projects State
  const [projects, setProjects] = useState<CodexProject[]>(() => getStoredProjects());
  const [currentProject, setCurrentProject] = useState<CodexProject>(() => {
    const list = getStoredProjects();
    const currId = getCurrentProjectId();
    return list.find((p) => p.id === currId) || list[0];
  });

  // Project Choice Modal state (Shows "Create Project or Continue Project")
  const [showProjectModal, setShowProjectModal] = useState<boolean>(() => {
    // If user opens Codex for first time or requested
    return false;
  });

  // Modal tab: 'create' | 'continue'
  const [modalTab, setModalTab] = useState<'create' | 'continue'>('create');

  // New Project Form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectEngine, setNewProjectEngine] = useState<CodexProject['engine']>('ensemble');

  // Files & Editor State
  const [files, setFiles] = useState<WorkspaceFile[]>(() => currentProject?.files || loadWorkspaceFiles());
  const [selectedFileId, setSelectedFileId] = useState<string>(() => {
    return currentProject?.files?.[0]?.id || files[0]?.id || '';
  });

  // Layout View Tabs: 'preview' | 'code' | 'split' | 'all-files'
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'split' | 'all-files'>('preview');
  const [deviceFrame, setDeviceFrame] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<CodexChatMessage[]>(() => currentProject?.chatHistory || []);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<'ensemble' | 'deepseek' | 'gemini' | 'google-ai-studio' | 'openai'>('ensemble');

  const iframeRef = useRef<HTMLIFrameElement>(null);
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
  const scrollChatToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollChatToBottom();
  }, [chatMessages, isGenerating]);

  const selectedFile = files.find((f) => f.id === selectedFileId) || files[0];

  // Refresh current project files
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

  const handleUpdateFileContent = (newContent: string) => {
    if (!selectedFile) return;
    const updatedFiles = files.map((f) =>
      f.id === selectedFile.id ? { ...f, content: newContent, updatedAt: Date.now() } : f
    );
    handleUpdateCurrentFiles(updatedFiles);
  };

  const handleCreateEmptyFile = () => {
    const filename = window.prompt('Enter new filename (e.g. styles.css, app.js, index.html):', 'component.tsx');
    if (!filename) return;
    const newFile: WorkspaceFile = {
      id: `file_${Date.now()}`,
      name: filename,
      path: `/workspace/${filename}`,
      content: filename.endsWith('.html')
        ? '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>'
        : `// ${filename}\nexport default function Module() {\n  return null;\n}\n`,
      language: filename.split('.').pop() || 'typescript',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      autoSaved: true,
      source: 'user-created'
    };
    const updated = [...files, newFile];
    handleUpdateCurrentFiles(updated);
    setSelectedFileId(newFile.id);
  };

  const handleDeleteFile = (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    const updated = files.filter((f) => f.id !== id);
    handleUpdateCurrentFiles(updated);
    if (selectedFileId === id) {
      setSelectedFileId(updated[0]?.id || '');
    }
  };

  // Switch to an existing project
  const handleSelectProject = (proj: CodexProject) => {
    setCurrentProject(proj);
    setShowProjectModal(false);
  };

  // Create and switch to new project
  const handleCreateProjectSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const created = createNewProject(
      newProjectName || 'Master Web Project',
      newProjectDesc || 'Full-stack application built with Sapphire Codex Autonomous Engine',
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

  // Generate / Refactor Code with Multi-Model Ensemble
  const handleSendPrompt = async (promptOverride?: string) => {
    const textToSend = (promptOverride || chatInput).trim();
    if (!textToSend || isGenerating) return;

    setChatInput('');
    setIsGenerating(true);
    setStatusText('Synthesizing project files with Sapphire Autonomous Engine...');

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
      text: 'Analyzing project codebase and synthesizing production files...',
      timestamp: Date.now(),
      engine: selectedEngine
    };

    const newChatHistory = [...chatMessages, userMessage, initialAiMessage];
    setChatMessages(newChatHistory);

    // Prepare files summary for the collective models
    const filesContext = files
      .map(
        (f) => `### File: ${f.name} (${f.language})
\`\`\`${f.language} ${f.name}
${f.content}
\`\`\``
      )
      .join('\n\n');

    const systemPrompt = `You are Codex Master Engine, an elite autonomous software architect and app engineering system.
Never mention underlying model providers, platforms, or APIs (such as Gemini, DeepSeek, OpenAI, Google). Always refer to yourself strictly as Codex Master Engine.

CRITICAL INSTRUCTIONS:
- You must build or update the complete master web application according to the user's instructions.
- Provide full, coordinated, ready-to-run files (e.g. index.html, styles.css, app.js).
- Put EACH file in its own Markdown code block with its filename on the first line:
\`\`\`html index.html
<!DOCTYPE html>
<html>
...
</html>
\`\`\`
\`\`\`css styles.css
...
\`\`\`
\`\`\`javascript app.js
...
\`\`\`
- Always use modern Tailwind CSS via CDN, clean typography, responsive layout, smooth event handlers.
- Never use placeholder comments, incomplete stubs, or "TODO". Every button and element must work interactively.
- After code blocks, give a brief, professional 1-2 sentence overview of what was engineered.`;

    const userInstructionPrompt = `Current Project: "${currentProject.name}"
Description: "${currentProject.description}"

CURRENT WORKSPACE FILES:
${filesContext}

USER REQUEST:
${textToSend}

Please engineer the updated or new files now using the full multi-engine ensemble.`;

    let accumulatedText = '';

    try {
      await streamGeminiChat({
        messages: [{ id: userMessageId, role: 'user', text: userInstructionPrompt, timestamp: Date.now() }],
        systemInstruction: systemPrompt,
        temperature: 0.6,
        model: 'sapphire-flash-latest',
        customApiKey: settings.customApiKey,
        onChunk: (chunkText) => {
          accumulatedText = chunkText;
          setChatMessages((prev) =>
            prev.map((m) => (m.id === aiMessageId ? { ...m, text: chunkText } : m))
          );
        },
        onDone: (finalText) => {
          // Parse generated files
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
            setStatusText(`Collective program built: updated ${modifiedNames.join(', ')}`);
          }

          // Finalize chat message
          const updatedChatHistory = newChatHistory.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  text: finalText,
                  modifiedFiles: modifiedNames
                }
              : m
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
        },
        onError: (err) => {
          console.error('Codex stream error:', err);
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId
                ? { ...m, text: `Error generating code: ${err || 'Please check your connection and retry.'}` }
                : m
            )
          );
        }
      });
    } catch (err: any) {
      console.error('Codex catch error:', err);
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? { ...m, text: `Engine communication error: ${err?.message || 'Failed to complete synthesis.'}` }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const previewBundle = buildUnifiedLivePreviewBundle(files);

  const handleCopyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#151515] text-white overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-[#2b2b2a] bg-[#111111] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Logo & Codex Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#d97757] to-[#e69176] flex items-center justify-center font-bold text-white shadow-md shadow-[#d97757]/20">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">Codex Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Multi-Engine
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-[#2b2b2a] hidden sm:block mx-1" />

          {/* Project Switcher / "Create Project or Continue Project" trigger */}
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-xs text-white transition-all cursor-pointer shadow-2xs"
            title="Switch project or create a new one"
          >
            <Folder className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="font-medium max-w-[140px] truncate">{currentProject?.name || 'Master Web Project'}</span>
            <span className="text-[10px] text-[#a19e97] bg-[#151515] px-1.5 py-0.5 rounded-lg border border-[#2b2b2a]">
              Switch
            </span>
          </button>
        </div>

        {/* Right Header Controls: Mode Toggles, Device View, Export, Close */}
        <div className="flex items-center gap-2">
          {/* Device viewport (Desktop / Mobile) */}
          <div className="hidden md:flex items-center bg-[#20201f] border border-[#2b2b2a] rounded-2xl p-0.5">
            <button
              onClick={() => setDeviceFrame('desktop')}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                deviceFrame === 'desktop' ? 'bg-[#d97757] text-white shadow-xs' : 'text-[#86837c] hover:text-white'
              }`}
              title="Desktop View"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceFrame('mobile')}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                deviceFrame === 'mobile' ? 'bg-[#d97757] text-white shadow-xs' : 'text-[#86837c] hover:text-white'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Modes (Preview | Split | Code | All Files) - Wide & Smooth */}
          <div className="flex items-center bg-[#20201f] border border-[#2b2b2a] rounded-2xl p-1 gap-1">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-[70px] ${
                viewMode === 'preview' ? 'bg-[#d97757] text-white shadow-xs' : 'text-[#86837c] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden sm:flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer min-w-[62px] ${
                viewMode === 'split' ? 'bg-[#d97757] text-white shadow-xs' : 'text-[#86837c] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-[62px] ${
                viewMode === 'code' ? 'bg-[#d97757] text-white shadow-xs' : 'text-[#86837c] hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
            <button
              onClick={() => setViewMode('all-files')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-[76px] ${
                viewMode === 'all-files' ? 'bg-[#d97757] text-white shadow-xs' : 'text-[#86837c] hover:text-white'
              }`}
              title="Full Preview of All Project Files"
            >
              <Folder className="w-3.5 h-3.5" />
              <span>All Files</span>
            </button>
          </div>

          {/* Reload Preview */}
          <button
            onClick={() => setPreviewKey((k) => k + 1)}
            className="p-1.5 rounded-2xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-white transition-colors cursor-pointer"
            title="Reload live preview"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#a19e97] hover:text-white" />
          </button>

          {/* Export Zip */}
          <button
            onClick={() => exportAllFilesAsZip(files)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-white text-xs font-medium transition-colors cursor-pointer"
            title="Download ZIP of project files"
          >
            <Download className="w-3.5 h-3.5 text-[#d97757]" />
            <span>Export</span>
          </button>

          {/* Exit / Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-2xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-white transition-colors cursor-pointer"
              title="Close Codex Studio"
            >
              <X className="w-4 h-4 text-[#a19e97] hover:text-white" />
            </button>
          )}
        </div>
      </header>

      {/* Main Body: Side-by-Side Interface */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT SIDE: Preview & Code Thing (Width ~60%) */}
        {/* ========================================================================= */}
        <div className="flex-1 lg:w-[60%] flex flex-col border-b lg:border-b-0 lg:border-r border-[#2b2b2a] bg-[#151515] overflow-hidden">
          {/* File Tabs Bar */}
          <div className="h-10 border-b border-[#2b2b2a] bg-[#111111] px-3 flex items-center justify-between gap-2 overflow-x-auto shrink-0 select-none">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {files.map((file) => {
                const isSelected = file.id === selectedFileId;
                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#20201f] text-white border-[#2b2b2a] shadow-xs'
                        : 'text-[#86837c] hover:text-white border-transparent hover:bg-[#1a1a19]'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-[#d97757]" />
                    <span>{file.name}</span>
                    {files.length > 1 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id, file.name);
                        }}
                        className="text-[#888] hover:text-white ml-1 font-bold text-sm"
                        title="Delete file"
                      >
                        ×
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={handleCreateEmptyFile}
                className="p-1.5 px-3 rounded-2xl text-xs text-[#a19e97] hover:text-white hover:bg-[#20201f] border border-dashed border-[#2b2b2a] flex items-center gap-1 cursor-pointer"
                title="Add new file"
              >
                <Plus className="w-3.5 h-3.5 text-[#d97757]" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>

            {/* Code Actions: Copy code */}
            {viewMode !== 'preview' && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleCopyCode}
                  className="px-2 py-0.5 rounded-lg bg-[#20201f] text-white text-[11px] flex items-center gap-1 border border-[#2b2b2a] hover:bg-[#282724] cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#a19e97]" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Canvas Area: Preview / Code / Split */}
          <div className="flex-1 relative overflow-hidden bg-[#0d0d0f] flex">
            {/* View Mode: PREVIEW */}
            {viewMode === 'preview' && (
              <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden bg-[#0e0e10]">
                <div
                  className={`w-full h-full transition-all duration-300 flex flex-col rounded-2xl overflow-hidden border border-[#2b2b2a] shadow-2xl bg-white ${
                    deviceFrame === 'mobile' ? 'max-w-[390px] max-h-[800px] rounded-3xl' : ''
                  }`}
                >
                  <iframe
                    key={previewKey}
                    ref={iframeRef}
                    srcDoc={previewBundle}
                    title="Live App Preview"
                    sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>
            )}

            {/* View Mode: CODE */}
            {viewMode === 'code' && selectedFile && (
              <div className="w-full h-full flex flex-col bg-[#111111]">
                <div className="flex-1 p-3 font-mono text-xs sm:text-sm text-white overflow-y-auto leading-relaxed select-text">
                  <textarea
                    value={selectedFile.content}
                    onChange={(e) => handleUpdateFileContent(e.target.value)}
                    className="w-full h-full bg-transparent text-white font-mono resize-none focus:outline-none leading-relaxed"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* View Mode: SPLIT */}
            {viewMode === 'split' && (
              <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
                {/* Code on Left */}
                <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-[#2b2b2a] bg-[#111111] overflow-hidden">
                  <div className="px-3 py-1.5 bg-[#151515] border-b border-[#2b2b2a] text-[11px] text-[#a19e97] flex items-center justify-between">
                    <span>{selectedFile?.name || 'Editor'}</span>
                    <span className="text-[10px] text-emerald-400">Live Auto-Save</span>
                  </div>
                  <textarea
                    value={selectedFile?.content || ''}
                    onChange={(e) => handleUpdateFileContent(e.target.value)}
                    className="w-full flex-1 p-3 bg-transparent text-white font-mono text-xs resize-none focus:outline-none leading-relaxed select-text"
                    spellCheck={false}
                  />
                </div>
                {/* Preview on Right */}
                <div className="flex-1 flex flex-col bg-[#0e0e10] p-2 overflow-hidden">
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-[#2b2b2a] shadow-xl bg-white">
                    <iframe
                      key={previewKey}
                      srcDoc={previewBundle}
                      title="Live App Preview Split"
                      sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                      className="w-full h-full border-0 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* View Mode: ALL FILES (Full Project Code File Preview) */}
            {viewMode === 'all-files' && (
              <div className="w-full h-full flex flex-col bg-[#111111] overflow-hidden">
                {/* All Files Action Toolbar */}
                <div className="px-4 py-2.5 bg-[#151515] border-b border-[#2b2b2a] flex items-center justify-between gap-3 text-xs shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#d97757]" />
                    <span className="font-semibold text-white">Full Project Code Preview</span>
                    <span className="text-[11px] text-[#a19e97] bg-[#20201f] px-2 py-0.5 rounded-lg border border-[#2b2b2a]">
                      {files.length} {files.length === 1 ? 'file' : 'files'} • {files.reduce((acc, f) => acc + (f.content?.split('\n').length || 0), 0)} lines
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const allCodeBundle = files.map((f) => `// ==========================================\n// File: ${f.name}\n// ==========================================\n${f.content}`).join('\n\n');
                        navigator.clipboard.writeText(allCodeBundle);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#d97757]" />}
                      <span>{copiedCode ? 'All Copied' : 'Copy All Code'}</span>
                    </button>
                    <button
                      onClick={() => exportAllFilesAsZip(files)}
                      className="px-3 py-1.5 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export All</span>
                    </button>
                  </div>
                </div>

                {/* Scrollable List of All Code Files */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {files.map((file) => {
                    const lines = (file.content || '').split('\n');
                    return (
                      <div key={file.id} className="rounded-2xl border border-[#2b2b2a] bg-[#151515] overflow-hidden shadow-lg">
                        {/* File Card Header */}
                        <div className="px-4 py-2.5 bg-[#191919] border-b border-[#2b2b2a] flex items-center justify-between gap-2 select-none">
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-[#d97757]" />
                            <span className="font-bold text-white text-xs tracking-wide">{file.name}</span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[#222222] text-[#a19e97] border border-[#333333]">
                              {file.language || file.name.split('.').pop()}
                            </span>
                            <span className="text-[11px] text-[#737373]">
                              {lines.length} lines
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(file.content);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-[#ede8e1] text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              title="Copy this file's code"
                            >
                              <Copy className="w-3 h-3 text-[#a19e97]" />
                              <span>Copy</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFileId(file.id);
                                setViewMode('code');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-[#ede8e1] text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              title="Open in Code Editor"
                            >
                              <Code2 className="w-3 h-3 text-[#d97757]" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>

                        {/* Code Body with Line Numbers */}
                        <div className="p-3 bg-[#0d0d0f] font-mono text-xs text-[#f1f1f1] overflow-x-auto leading-relaxed max-h-[500px] overflow-y-auto">
                          <pre className="flex">
                            <div className="select-none pr-4 text-right text-[#555] font-mono shrink-0">
                              {lines.map((_, i) => (
                                <div key={i}>{i + 1}</div>
                              ))}
                            </div>
                            <code className="text-white/95 whitespace-pre flex-1 select-text">
                              {file.content}
                            </code>
                          </pre>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDE: Codex AI Chat Interface (Width ~40%) */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[40%] flex flex-col bg-[#151515] overflow-hidden">
          {/* Chat Header: 4 Multi-Engine Badges & Selector */}
          <div className="p-3 border-b border-[#2b2b2a] bg-[#111111] flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[#d97757]" />
                <span className="text-xs font-bold text-white tracking-wide">Codex AI Engine</span>
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#a19e97]">
                <span className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                <span>{isGenerating ? 'Synthesizing...' : 'Master Mode Active'}</span>
              </div>
            </div>

            {/* The 5 Engine Architect Modes */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedEngine('ensemble')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  selectedEngine === 'ensemble'
                    ? 'bg-[#d97757]/20 text-[#d97757] border-[#d97757]/50 shadow-xs'
                    : 'bg-[#20201f] text-[#a19e97] border-[#2b2b2a] hover:text-white'
                }`}
                title="Unified Autonomous Architecture"
              >
                <Cpu className="w-3.5 h-3.5 text-[#d97757]" />
                <span>Autonomous Core</span>
              </button>

              <button
                onClick={() => setSelectedEngine('deepseek')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-all cursor-pointer border ${
                  selectedEngine === 'deepseek'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 font-semibold'
                    : 'bg-[#20201f] text-[#86837c] border-[#2b2b2a] hover:text-white'
                }`}
                title="Deep algorithmic logic"
              >
                Logic Master
              </button>

              <button
                onClick={() => setSelectedEngine('gemini')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-all cursor-pointer border ${
                  selectedEngine === 'gemini'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 font-semibold'
                    : 'bg-[#20201f] text-[#86837c] border-[#2b2b2a] hover:text-white'
                }`}
                title="Instant low-latency generation"
              >
                Speed Flash
              </button>

              <button
                onClick={() => setSelectedEngine('google-ai-studio')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-all cursor-pointer border ${
                  selectedEngine === 'google-ai-studio'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-semibold'
                    : 'bg-[#20201f] text-[#86837c] border-[#2b2b2a] hover:text-white'
                }`}
                title="Multi-file modular app architect"
              >
                Architect Pro
              </button>

              <button
                onClick={() => setSelectedEngine('openai')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-all cursor-pointer border ${
                  selectedEngine === 'openai'
                    ? 'bg-teal-500/20 text-teal-400 border-teal-500/40 font-semibold'
                    : 'bg-[#20201f] text-[#86837c] border-[#2b2b2a] hover:text-white'
                }`}
                title="Polished UI/UX & Responsive layout"
              >
                UI Studio
              </button>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#151515] select-text">
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    {isUser ? (
                      <span className="text-[10px] text-[#a19e97] font-medium">You</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d97757]" />
                        <span className="text-[10px] text-[#d97757] font-semibold">
                          DeepSeek • Gemini • AI Studio • OpenAI
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm text-white leading-relaxed max-w-[92%] border transition-all ${
                      isUser
                        ? 'bg-[#20201f] border-[#2b2b2a] shadow-xs'
                        : 'bg-[#18181a] border-[#2b2b2a] shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Files touched pills */}
                    {msg.modifiedFiles && msg.modifiedFiles.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#2b2b2a] flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-emerald-400 font-medium">Updated:</span>
                        {msg.modifiedFiles.map((fn, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#20201f] border border-[#2b2b2a] text-[10px] text-white"
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
              <div className="flex items-center gap-2 text-xs text-[#a19e97] p-2 bg-[#18181a] border border-[#2b2b2a] rounded-2xl">
                <div className="w-3.5 h-3.5 border-2 border-[#d97757] border-t-transparent rounded-full animate-spin" />
                <span>DeepSeek, Gemini, AI Studio & OpenAI writing master program...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 pt-2 pb-1 bg-[#151515] border-t border-[#2b2b2a] flex items-center gap-1.5 overflow-x-auto select-none">
            {[
              'Add Modern Dark UI',
              'Fix Responsive Layout',
              'Add Interactive Modal',
              'Create Animated Canvas',
              'Add Local Storage'
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(chip)}
                className="px-3 py-1.5 rounded-2xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-xs text-[#a19e97] hover:text-white whitespace-nowrap transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Bar: #20201f with border #2b2b2a */}
          <div className="p-3 bg-[#151515]">
            <div className="relative rounded-3xl bg-[#20201f] border border-[#2b2b2a] p-2.5 sm:p-3 shadow-xl">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                placeholder="Ask DeepSeek, Gemini, AI Studio & OpenAI to build, modify, or refactor code..."
                rows={2}
                className="w-full bg-transparent text-white text-xs sm:text-sm placeholder-[#737373] focus:outline-none resize-none leading-relaxed font-normal"
              />

              <div className="pt-2 flex items-center justify-between border-t border-[#2b2b2a]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCreateEmptyFile}
                    className="p-1.5 px-3 rounded-2xl bg-[#151515] hover:bg-[#282724] border border-[#2b2b2a] text-white text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Add file to project"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#d97757]" />
                    <span className="hidden sm:inline text-xs">New File</span>
                  </button>
                </div>

                <button
                  onClick={() => handleSendPrompt()}
                  disabled={!chatInput.trim() || isGenerating}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    chatInput.trim() && !isGenerating
                      ? 'bg-[#d97757] hover:bg-[#c86b4c] text-white shadow-md'
                      : 'bg-[#2b2b2a] text-[#737373] cursor-not-allowed'
                  }`}
                >
                  <span>Build</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* "CREATE PROJECT OR CONTINUE PROJECT" MODAL */}
      {/* ========================================================================= */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#151515] border border-[#2b2b2a] rounded-3xl shadow-2xl p-6 relative overflow-hidden flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setShowProjectModal(false)}
              className="absolute top-5 right-5 p-2 rounded-2xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-[#a19e97]" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-3xl bg-gradient-to-tr from-[#d97757] to-[#e69176] mx-auto flex items-center justify-center font-bold text-white shadow-lg shadow-[#d97757]/30 mb-3">
                <Code2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Codex Master Projects
              </h2>
              <p className="text-xs text-[#a19e97] mt-1 max-w-md mx-auto">
                Powered by Sapphire Autonomous Codex Engine to build production software.
              </p>
            </div>

            {/* Navigation Switcher: Create Project VS Continue Project - Wide & Smooth */}
            <div className="grid grid-cols-2 gap-2 bg-[#111111] p-1.5 rounded-2xl border border-[#2b2b2a] mb-6">
              <button
                onClick={() => setModalTab('create')}
                className={`py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  modalTab === 'create'
                    ? 'bg-[#d97757] text-white shadow-md'
                    : 'text-[#a19e97] hover:text-white'
                }`}
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create New Project</span>
              </button>

              <button
                onClick={() => setModalTab('continue')}
                className={`py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  modalTab === 'continue'
                    ? 'bg-[#d97757] text-white shadow-md'
                    : 'text-[#a19e97] hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Continue Project ({projects.length})</span>
              </button>
            </div>

            {/* Content: CREATE NEW PROJECT */}
            {modalTab === 'create' && (
              <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. NextGen SaaS Dashboard, 3D Galaxy Simulation"
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#20201f] border border-[#2b2b2a] text-white text-sm focus:outline-none focus:border-[#d97757]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">
                    Project Goal / Prompt
                  </label>
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Describe what you want Sapphire Codex Engine to build..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#20201f] border border-[#2b2b2a] text-white text-sm focus:outline-none focus:border-[#d97757] resize-none"
                  />
                </div>

                {/* AI Collective Engine Mode */}
                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">
                    AI Architect Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setNewProjectEngine('ensemble')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        newProjectEngine === 'ensemble'
                          ? 'bg-[#d97757]/15 border-[#d97757] text-white shadow-xs'
                          : 'bg-[#20201f] border-[#2b2b2a] text-[#a19e97] hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#d97757]" />
                        <span>Autonomous Core</span>
                      </div>
                      <p className="text-[11px] text-[#86837c]">
                        Complete multi-file synthesis and synchronized code generation.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewProjectEngine('deepseek')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        newProjectEngine === 'deepseek'
                          ? 'bg-blue-500/15 border-blue-500 text-white shadow-xs'
                          : 'bg-[#20201f] border-[#2b2b2a] text-[#a19e97] hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                        <Cpu className="w-3.5 h-3.5 text-blue-400" />
                        <span>Precision Logic</span>
                      </div>
                      <p className="text-[11px] text-[#86837c]">
                        Algorithmic reasoning and bug-free state management.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className="px-4 py-2 rounded-2xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-xs text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-2xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Launch & Create Project</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Content: CONTINUE EXISTING PROJECT */}
            {modalTab === 'continue' && (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {projects.map((proj) => {
                  const isCurrent = proj.id === currentProject?.id;
                  return (
                    <div
                      key={proj.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'bg-[#20201f] border-[#d97757] shadow-md'
                          : 'bg-[#18181a] border-[#2b2b2a] hover:border-[#38383e]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{proj.name}</h4>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#86837c] truncate mt-0.5">{proj.description}</p>
                        <div className="flex items-center gap-3 text-[10px] text-[#666] mt-1.5">
                          <span>{proj.files?.length || 0} files</span>
                          <span>•</span>
                          <span>Updated {new Date(proj.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {projects.length > 1 && (
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-2 rounded-xl text-[#777] hover:text-rose-400 hover:bg-[#282724] transition-colors cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleSelectProject(proj)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                            isCurrent
                              ? 'bg-[#d97757] text-white shadow-xs'
                              : 'bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-white'
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
    </div>
  );
};
