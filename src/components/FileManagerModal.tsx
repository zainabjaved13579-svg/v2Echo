import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Sparkles,
  Code2,
  Eye,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Download,
  Trash2,
  ExternalLink,
  Smartphone,
  Monitor,
  Send,
  Wand2,
  FileCode,
  Folder,
  Search,
  Zap,
  ArrowRight
} from 'lucide-react';
import { WorkspaceFile } from '../types';
import {
  loadWorkspaceFiles,
  saveWorkspaceFiles,
  autoSaveFile,
  deleteWorkspaceFile,
  buildLivePreviewBundle,
  getLanguageFromFileName,
  exportAllFilesAsZip
} from '../services/fileStorageService';
import { streamEchoChat } from '../services/geminiService';

interface FileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedFileId?: string;
  initialTab?: 'ai-creating' | 'code' | 'preview';
}

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
  isOpen,
  onClose,
  initialSelectedFileId,
  initialTab = 'code'
}) => {
  const [files, setFiles] = useState<WorkspaceFile[]>(() => loadWorkspaceFiles());
  const [activeTab, setActiveTab] = useState<'ai-creating' | 'code' | 'preview'>(initialTab);
  const [selectedFileId, setSelectedFileId] = useState<string>(() => {
    return initialSelectedFileId || files[0]?.id || '';
  });
  const [fileSearch, setFileSearch] = useState('');

  // Editor content
  const [activeContent, setActiveContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);

  // AI Prompt States for Creating & Changing Code
  const [aiCreatePrompt, setAiCreatePrompt] = useState('');
  const [aiChangePrompt, setAiChangePrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<{ id: string; name: string } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync files on open
  useEffect(() => {
    if (isOpen) {
      const current = loadWorkspaceFiles();
      setFiles(current);
      if (initialSelectedFileId && current.some((f) => f.id === initialSelectedFileId)) {
        setSelectedFileId(initialSelectedFileId);
      } else if (!selectedFileId || !current.some((f) => f.id === selectedFileId)) {
        if (current.length > 0) {
          setSelectedFileId(current[0].id);
        }
      }
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialSelectedFileId, initialTab]);

  // Selected file reference
  const selectedFile = files.find((f) => f.id === selectedFileId) || files[0];

  // Filtered files list
  const filteredFiles = useMemo(() => {
    if (!fileSearch.trim()) return files;
    const query = fileSearch.toLowerCase();
    return files.filter(
      (f) => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query)
    );
  }, [files, fileSearch]);

  // Update editor state when file changes
  useEffect(() => {
    if (selectedFile) {
      setActiveContent(selectedFile.content);
      setPreviewKey((k) => k + 1);
    }
  }, [selectedFile?.id]);

  if (!isOpen) return null;

  // Handle direct manual code edit
  const handleCodeChange = (newCode: string) => {
    setActiveContent(newCode);
    if (selectedFile) {
      autoSaveFile({
        id: selectedFile.id,
        name: selectedFile.name,
        path: selectedFile.path,
        content: newCode,
        language: selectedFile.language,
        source: selectedFile.source
      });
      setFiles(loadWorkspaceFiles());
      setPreviewKey((k) => k + 1);
    }
  };

  // Create a new blank file
  const handleCreateBlankFile = () => {
    const fileName = prompt('Enter new file name (e.g., app.js, styles.css, index.html):');
    if (!fileName || !fileName.trim()) return;
    const cleanName = fileName.trim();
    const newFile = autoSaveFile({
      name: cleanName,
      path: `/workspace/${cleanName}`,
      content: cleanName.endsWith('.html')
        ? '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>New Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>'
        : `// ${cleanName}\n`,
      language: getLanguageFromFileName(cleanName),
      source: 'user-created'
    });
    const updated = loadWorkspaceFiles();
    setFiles(updated);
    setSelectedFileId(newFile.id);
    setActiveTab('code');
  };

  // 1. AI Creating: Multi-file project generator with guaranteed fallbacks
  const handleAiCreateNewCode = async (promptOverride?: string) => {
    const prompt = (promptOverride || aiCreatePrompt).trim();
    if (!prompt || isAiProcessing) return;

    setIsAiProcessing(true);
    setAiStatusMessage('Generating coordinated project files (HTML, CSS, JS)...');

    try {
      let outputText = '';
      // Try backend endpoint first
      try {
        const response = await fetch('/api/code/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, projectType: 'website' })
        });

        if (response.ok) {
          const data = await response.json();
          outputText = data.content || '';
        }
      } catch (backendErr) {
        console.warn('Backend code generation fallback:', backendErr);
      }

      // Fallback to client streaming if backend was empty
      if (!outputText) {
        await new Promise<void>((resolve, reject) => {
          let accumulated = '';
          streamEchoChat({
            messages: [
              {
                id: `gen_prompt_${Date.now()}`,
                role: 'user',
                text: `Create a complete, modern, working multi-file project for: "${prompt}". Provide separate files in clean code blocks with filename tags (e.g. \`\`\`html index.html, \`\`\`css style.css, \`\`\`javascript script.js). Output full, ready-to-run code for each file.`,
                timestamp: Date.now()
              }
            ],
            systemInstruction:
              'You are an expert web software engineer. Create complete, polished, bug-free multi-file projects with all HTML, CSS, and JS implemented.',
            onChunk: (chunk) => {
              accumulated = chunk;
            },
            onDone: (full) => {
              outputText = full;
              resolve();
            },
            onError: (err) => {
              reject(err);
            }
          });
        });
      }

      // Extract code blocks with filenames
      const blockRegex = /```([a-zA-Z0-9_-]+)?(?:\s+([\w\.\-\/]+))?\n([\s\S]*?)```/g;
      let match;
      const parsedFiles: { name: string; content: string; language: string }[] = [];

      while ((match = blockRegex.exec(outputText)) !== null) {
        const lang = (match[1] || 'html').toLowerCase();
        let fileName = match[2];
        const content = match[3].trim();

        if (!fileName) {
          if (lang === 'html') fileName = 'index.html';
          else if (lang === 'css') fileName = 'style.css';
          else if (lang === 'js' || lang === 'javascript') fileName = 'script.js';
          else fileName = `file_${parsedFiles.length + 1}.${lang}`;
        }

        parsedFiles.push({
          name: fileName,
          content,
          language: getLanguageFromFileName(fileName)
        });
      }

      // If no markdown blocks, treat output as HTML
      if (parsedFiles.length === 0 && outputText.trim()) {
        parsedFiles.push({
          name: 'index.html',
          content: outputText.trim(),
          language: 'html'
        });
      }

      if (parsedFiles.length > 0) {
        let primaryFileId = '';
        for (const p of parsedFiles) {
          const saved = autoSaveFile({
            name: p.name,
            path: `/workspace/${p.name}`,
            content: p.content,
            language: p.language,
            source: 'ai-generated'
          });
          if (p.name.endsWith('.html') || !primaryFileId) {
            primaryFileId = saved.id;
          }
        }

        const updatedFiles = loadWorkspaceFiles();
        setFiles(updatedFiles);
        if (primaryFileId) {
          setSelectedFileId(primaryFileId);
        }
        setAiCreatePrompt('');
        setAiStatusMessage(`Generated ${parsedFiles.length} files successfully!`);
        setActiveTab('preview');
        setPreviewKey((k) => k + 1);
      } else {
        setAiStatusMessage('No code files were generated. Please try a different description.');
      }
    } catch (e: any) {
      console.error('Code creation error:', e);
      setAiStatusMessage('Generation notice: ' + (e?.message || 'Failed to create files'));
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 2. AI Quick Refactor: Modify active file by prompt
  const handleAiChangeCode = async () => {
    const instruction = aiChangePrompt.trim();
    if (!instruction || !selectedFile || isAiProcessing) return;

    setIsAiProcessing(true);
    setAiStatusMessage('AI is updating code...');

    try {
      const lang = selectedFile.language || 'html';
      const promptText = `Here is the current code of file "${selectedFile.name}":\n\n\`\`\`${lang}\n${activeContent}\n\`\`\`\n\nPlease update this code according to this instruction:\n"${instruction}"\n\nReturn ONLY the complete updated code inside a single \`\`\`${lang} code block with all requested modifications.`;

      let updatedCode = '';
      await new Promise<void>((resolve, reject) => {
        streamEchoChat({
          messages: [
            {
              id: `change_prompt_${Date.now()}`,
              role: 'user',
              text: promptText,
              timestamp: Date.now()
            }
          ],
          systemInstruction:
            'You are an expert coder. Modify the provided code accurately according to the user request. Output ONLY the complete, production-ready code inside a code block. Do not truncate or leave placeholders.',
          onChunk: (chunk) => {
            const match = chunk.match(/```(?:\w+)?\n([\s\S]*?)```/);
            if (match) updatedCode = match[1].trim();
          },
          onDone: (full) => {
            const match = full.match(/```(?:\w+)?\n([\s\S]*?)```/);
            updatedCode = match ? match[1].trim() : full.trim();
            resolve();
          },
          onError: (err) => reject(err)
        });
      });

      if (updatedCode) {
        autoSaveFile({
          id: selectedFile.id,
          name: selectedFile.name,
          path: selectedFile.path,
          content: updatedCode,
          language: selectedFile.language,
          source: 'ai-generated'
        });

        setActiveContent(updatedCode);
        setFiles(loadWorkspaceFiles());
        setPreviewKey((k) => k + 1);
        setAiChangePrompt('');
        setAiStatusMessage('Code successfully updated by AI!');
      }
    } catch (e: any) {
      console.error('Code modify error:', e);
      setAiStatusMessage('Update notice: ' + (e?.message || 'Failed to update code'));
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    if (!selectedFile) return;
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = files.find((f) => f.id === id);
    setDeleteConfirmFile({ id, name: target?.name || 'this file' });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmFile) return;
    const remaining = deleteWorkspaceFile(deleteConfirmFile.id);
    setFiles(remaining);
    if (selectedFileId === deleteConfirmFile.id) {
      setSelectedFileId(remaining[0]?.id || '');
    }
    setDeleteConfirmFile(null);
  };

  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const previewHtml = selectedFile ? buildLivePreviewBundle(selectedFile, files) : '';

  const samplePresets = [
    { title: 'Interactive Calculator', prompt: 'A sleek, modern scientific calculator with history and dark mode' },
    { title: 'Personal Portfolio', prompt: 'A responsive developer portfolio with project grid, bio, and contact form' },
    { title: 'Music Player UI', prompt: 'A retro music player with track playlist, play/pause controls, and volume slider' },
    { title: 'Task & Kanban Board', prompt: 'A clean Kanban task board with add task, drag-and-drop columns, and local persistence' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center sm:p-4 cursor-default"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Container */}
      <div
        className="w-full h-full sm:h-[90vh] sm:max-w-6xl bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Folder className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>File Manager & Code AI</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                  {files.length} Files
                </span>
              </h2>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('ai-creating')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ai-creating'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Generator</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'code'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => exportAllFilesAsZip(files)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Download all workspace files as a ZIP archive"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export ZIP</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {aiStatusMessage && (
          <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900 shrink-0">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              {aiStatusMessage}
            </span>
            <button onClick={() => setAiStatusMessage('')} className="text-indigo-400 hover:text-indigo-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Two-Column Body: Sidebar (Files) + Main Workspace */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Sidebar: Workspace Files */}
          <div className="w-64 border-r border-slate-200 bg-slate-50/60 flex flex-col shrink-0 hidden md:flex">
            {/* Sidebar Search & New File */}
            <div className="p-3 border-b border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Files ({files.length})
                </span>
                <button
                  type="button"
                  onClick={handleCreateBlankFile}
                  className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  title="Create new file"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  placeholder="Filter files..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Files List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredFiles.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No files found</div>
              ) : (
                filteredFiles.map((f) => {
                  const isCur = f.id === selectedFileId;
                  const ext = f.name.split('.').pop()?.toUpperCase() || 'FILE';
                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedFileId(f.id);
                        if (activeTab === 'ai-creating') setActiveTab('code');
                      }}
                      className={`group px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isCur
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                          : 'hover:bg-slate-200/70 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isCur ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {ext}
                        </span>
                        <span className="truncate">{f.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteFile(f.id, e)}
                        className={`p-1 rounded hover:bg-rose-500 hover:text-white transition-opacity ${
                          isCur ? 'text-indigo-200 opacity-60 group-hover:opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100'
                        }`}
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Export Link */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => exportAllFilesAsZip(files)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All (ZIP)</span>
              </button>
            </div>
          </div>

          {/* Main Area based on Active Tab */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
            {/* 1. AI CREATOR TAB */}
            {activeTab === 'ai-creating' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Headline */}
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-1">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">AI Project & Code Generator</h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Describe what you want to build. Echo will generate complete, coordinated files
                      (HTML, CSS, JavaScript) ready to run and download.
                    </p>
                  </div>

                  {/* Prompt Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                    <textarea
                      value={aiCreatePrompt}
                      onChange={(e) => setAiCreatePrompt(e.target.value)}
                      placeholder="e.g. Build a modern responsive personal portfolio with a clean dark theme, interactive project gallery, skill bars, and a working contact form..."
                      rows={4}
                      className="w-full p-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        AI will automatically create and organize files in your workspace
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAiCreateNewCode()}
                        disabled={!aiCreatePrompt.trim() || isAiProcessing}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        {isAiProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Creating Project...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-300" />
                            <span>Generate Project</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Example Presets */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Or try an instant idea:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {samplePresets.map((preset) => (
                        <button
                          key={preset.title}
                          type="button"
                          onClick={() => {
                            setAiCreatePrompt(preset.prompt);
                            handleAiCreateNewCode(preset.prompt);
                          }}
                          disabled={isAiProcessing}
                          className="p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-xl text-left transition-all group flex items-start justify-between cursor-pointer"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                              {preset.title}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{preset.prompt}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 shrink-0 ml-2 mt-0.5 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CODE EDITOR TAB */}
            {activeTab === 'code' && (
              <div className="flex-1 flex flex-col min-h-0 bg-slate-900 text-slate-200">
                {/* Editor Bar */}
                <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-mono text-xs font-bold text-slate-100 truncate">
                      {selectedFile?.name || 'No file selected'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {selectedFile?.language || 'text'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copy code"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadCode}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Run Preview</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Quick File Pills */}
                <div className="md:hidden px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar shrink-0">
                  {files.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFileId(f.id)}
                      className={`px-2 py-1 rounded text-xs font-mono shrink-0 ${
                        f.id === selectedFileId
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>

                {/* AI Quick Refactor Input */}
                <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 shrink-0">
                  <Wand2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <input
                    type="text"
                    value={aiChangePrompt}
                    onChange={(e) => setAiChangePrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiChangeCode()}
                    placeholder={`Ask AI to modify "${selectedFile?.name || 'this file'}" (e.g. add smooth animation, fix bug, make responsive)...`}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAiChangeCode}
                    disabled={!aiChangePrompt.trim() || isAiProcessing}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    {isAiProcessing ? 'Applying...' : 'Apply'}
                  </button>
                </div>

                {/* Code Textarea Editor */}
                <div className="flex-1 p-3 overflow-hidden relative">
                  <textarea
                    value={activeContent}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="// Type or paste your code here..."
                    className="w-full h-full p-3 font-mono text-xs sm:text-sm bg-transparent text-emerald-300 border-none outline-none resize-none leading-relaxed selection:bg-indigo-900 selection:text-white"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* 3. LIVE PREVIEW TAB */}
            {activeTab === 'preview' && (
              <div className="flex-1 flex flex-col min-h-0 bg-slate-100">
                {/* Preview Bar */}
                <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-800">
                      Live Preview: {selectedFile?.name || 'Sandbox'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Device switch */}
                    <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-2 py-1 rounded-md transition-all ${
                          previewDevice === 'desktop' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
                        }`}
                        title="Desktop View"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-2 py-1 rounded-md transition-all ${
                          previewDevice === 'mobile' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
                        }`}
                        title="Mobile View"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewKey((k) => k + 1)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Reload preview"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                      }}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Open in new window"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sandbox Frame */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4">
                  <div
                    className={`bg-white transition-all shadow-md overflow-hidden rounded-xl border border-slate-200 ${
                      previewDevice === 'mobile'
                        ? 'w-[375px] h-[667px] max-h-full border-4 border-slate-800'
                        : 'w-full h-full'
                    }`}
                  >
                    <iframe
                      key={previewKey}
                      ref={iframeRef}
                      srcDoc={previewHtml}
                      title="Live Sandbox Preview"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-downloads"
                      allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; clipboard-read; clipboard-write;"
                      className="w-full h-full border-0 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmFile && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDeleteConfirmFile(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">Delete File?</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Are you sure you want to remove <span className="font-semibold text-slate-700">"{deleteConfirmFile.name}"</span>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmFile(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
