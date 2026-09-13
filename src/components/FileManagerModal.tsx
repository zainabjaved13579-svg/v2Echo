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
  FileText,
  Folder,
  FolderOpen,
  ChevronRight
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
  initialTab = 'ai-creating'
}) => {
  const [files, setFiles] = useState<WorkspaceFile[]>(() => loadWorkspaceFiles());
  const [activeTab, setActiveTab] = useState<'ai-creating' | 'code' | 'preview'>(initialTab);
  const [selectedFileId, setSelectedFileId] = useState<string>(() => {
    return initialSelectedFileId || files[0]?.id || '';
  });

  // Editor content
  const [activeContent, setActiveContent] = useState('');
  const [activeName, setActiveName] = useState('');
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

  const [activeFolderFilter, setActiveFolderFilter] = useState<string | null>(null);

  // Group files strictly by folder
  const groupedFiles = useMemo(() => {
    const map: Record<string, WorkspaceFile[]> = {};
    for (const f of files) {
      const parts = f.path.replace(/^\/+/, '').split('/');
      const folder = parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/';
      if (!map[folder]) map[folder] = [];
      map[folder].push(f);
    }
    const keys = Object.keys(map).sort((a, b) => {
      if (a === '/') return -1;
      if (b === '/') return 1;
      return a.localeCompare(b);
    });
    return keys.map((key) => ({
      folderPath: key,
      files: map[key].sort((a, b) => a.name.localeCompare(b.name))
    }));
  }, [files]);

  // Update editor state when file changes
  useEffect(() => {
    if (selectedFile) {
      setActiveContent(selectedFile.content);
      setActiveName(selectedFile.name);
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

  // 1. AI Creating: Create coordinated multi-file website/project with DeepSeek (HTML, CSS, JS)
  const handleAiCreateNewCode = async () => {
    const prompt = aiCreatePrompt.trim();
    if (!prompt || isAiProcessing) return;

    setIsAiProcessing(true);
    setAiStatusMessage('Auto-generating complete project files (HTML, CSS, JS)...');

    try {
      const response = await fetch('/api/code/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, projectType: 'website' })
      });

      if (!response.ok) {
        throw new Error('Code generation request failed');
      }

      const data = await response.json();
      const outputText = data.content || '';

      // Extract all code blocks with filenames
      // Regex matches: ```(language)? (filename)?\n(content)```
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

      // If no code blocks found, treat entire output as HTML
      if (parsedFiles.length === 0) {
        parsedFiles.push({
          name: 'index.html',
          content: outputText.trim(),
          language: 'html'
        });
      }

      // Save all generated files into workspace!
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
        const prim = updatedFiles.find((f) => f.id === primaryFileId);
        if (prim) {
          setActiveContent(prim.content);
          setActiveName(prim.name);
        }
      }

      setAiCreatePrompt('');
      setIsAiProcessing(false);
      setAiStatusMessage(`Successfully generated ${parsedFiles.length} files (${parsedFiles.map(f => f.name).join(', ')})!`);
      setActiveTab('preview');
      setPreviewKey((k) => k + 1);
    } catch (e: any) {
      console.error('DeepSeek code creation error:', e);
      setIsAiProcessing(false);
      setAiStatusMessage('Generation notice: ' + (e?.message || 'Failed to create files'));
    }
  };

  // 2. AI Change Code: Modify current file's code by user prompt
  const handleAiChangeCode = async () => {
    const changeInstruction = aiChangePrompt.trim();
    if (!changeInstruction || !selectedFile || isAiProcessing) return;

    setIsAiProcessing(true);
    setAiStatusMessage('AI is modifying code based on your prompt...');

    try {
      const lang = selectedFile.language || 'html';
      const promptText = `Here is the current code of file "${selectedFile.name}":\n\n\`\`\`${lang}\n${activeContent}\n\`\`\`\n\nPlease modify this code to fulfill this request:\n"${changeInstruction}"\n\nReturn the COMPLETE updated code inside a single \`\`\`${lang} code block with all requested changes applied.`;

      let generated = '';
      await streamEchoChat({
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
          generated = chunk;
        },
        onDone: (full) => {
          const codeMatch = full.match(/```(?:\w+)?\n([\s\S]*?)```/);
          const updatedCode = codeMatch ? codeMatch[1].trim() : full.trim();

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
          setIsAiProcessing(false);
        },
        onError: (err) => {
          console.error('AI code modify error:', err);
          setIsAiProcessing(false);
          setAiStatusMessage('Failed to update code: ' + err);
        }
      });
    } catch (e: any) {
      setIsAiProcessing(false);
      setAiStatusMessage('Error: ' + (e?.message || 'Unable to update code'));
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

  // Escape key listener to cancel/close modal
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

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center sm:p-4 cursor-default"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Container: Fullscreen on mobile, rounded modal on tablet/desktop */}
      <div
        className="w-full h-full sm:h-[90vh] sm:max-w-5xl bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Title & Close */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span>Web & Code Builder</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  AI Pro
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Auto-makes coordinated HTML, CSS, JavaScript files • Fast Live Preview • One-Click ZIP Download
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => exportAllFilesAsZip(files)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Download the entire website project folder as a ZIP package"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Download Folder</span>
                <span className="sm:hidden">Download</span>
              </button>
            )}
            {selectedFile && (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold font-mono border border-indigo-200/60">
                <FileCode className="w-3.5 h-3.5" />
                <span>{selectedFile.name}</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/70 border border-slate-200 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* The 3 Core Tabs: AI Creating, Code, Fast Preview */}
        <div className="px-3 sm:px-6 py-2 border-b border-slate-100 bg-white flex items-center justify-center sm:justify-start gap-1 sm:gap-2 shrink-0">
          <button
            id="tab-ai-creating"
            onClick={() => setActiveTab('ai-creating')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ai-creating'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>1. AI Generator</span>
          </button>

          <button
            id="tab-code"
            onClick={() => setActiveTab('code')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>2. Code</span>
          </button>

          <button
            id="tab-preview"
            onClick={() => setActiveTab('preview')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>3. Fast Live Preview</span>
          </button>
        </div>

        {/* Tab 1: AI CREATING */}
        {activeTab === 'ai-creating' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Status message banner */}
            {aiStatusMessage && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium flex items-center justify-between animate-fadeIn">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  {aiStatusMessage}
                </span>
                <button
                  onClick={() => setAiStatusMessage('')}
                  className="text-indigo-400 hover:text-indigo-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Sub-section A: AI Change Code by user prompt */}
            {selectedFile && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/40 border border-indigo-100 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                      Change Code with AI: <span className="font-mono text-indigo-700">{selectedFile.name}</span>
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Prompt-based modification</span>
                </div>

                <p className="text-xs text-slate-600">
                  Tell AI what changes to make to this code (e.g. <em>"Make background dark with neon text"</em>, <em>"Add a reset button"</em>, <em>"Add smooth fade-in animations"</em>):
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiChangePrompt}
                    onChange={(e) => setAiChangePrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiChangeCode()}
                    placeholder="e.g. Change colors to modern emerald green and make the buttons rounder..."
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-indigo-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    onClick={handleAiChangeCode}
                    disabled={!aiChangePrompt.trim() || isAiProcessing}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    {isAiProcessing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Apply Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-section B: Create New Code from scratch */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  Create New Code File with AI
                </h3>
              </div>

              <p className="text-xs text-slate-500">
                Describe any app, website, or component. Echo will create the complete working code.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiCreatePrompt}
                  onChange={(e) => setAiCreatePrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiCreateNewCode()}
                  placeholder="e.g. A retro arcade snake game with score tracking and sound effects..."
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  onClick={handleAiCreateNewCode}
                  disabled={!aiCreatePrompt.trim() || isAiProcessing}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Create</span>
                </button>
              </div>
            </div>

            {/* Sub-section C: List of AI Created Files Grouped by Folder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>Project Files by Folder ({files.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Files are separated folder-by-folder so they never mix together.
                  </p>
                </div>
                {groupedFiles.length > 1 && (
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {groupedFiles.length} Folders
                  </span>
                )}
              </div>

              {/* Folder Filter Pills */}
              {groupedFiles.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveFolderFilter(null)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
                      activeFolderFilter === null
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    All Folders ({files.length})
                  </button>
                  {groupedFiles.map((g) => {
                    const isSelected = activeFolderFilter === g.folderPath;
                    return (
                      <button
                        key={g.folderPath}
                        type="button"
                        onClick={() => setActiveFolderFilter(g.folderPath)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1 border ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Folder className={`w-3 h-3 ${isSelected ? 'text-amber-500' : 'text-slate-400'}`} />
                        <span>{g.folderPath === '/' ? '/ (Root)' : g.folderPath}</span>
                        <span className="text-[10px] px-1 rounded bg-slate-100 text-slate-500 font-sans">
                          {g.files.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {files.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                  <FileCode className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No code files created yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ask Echo to write code in chat or use the prompt bar above.
                  </p>
                </div>
              ) : (
                /* Grouped Folders View */
                <div className="space-y-3">
                  {groupedFiles
                    .filter((g) => activeFolderFilter === null || g.folderPath === activeFolderFilter)
                    .map(({ folderPath, files: folderFiles }) => (
                      <div
                        key={folderPath}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                      >
                        {/* Distinct Folder Header */}
                        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="font-mono text-xs font-bold text-slate-800 truncate">
                              {folderPath === '/' ? '/ (Root Directory)' : folderPath}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {folderFiles.length} {folderFiles.length === 1 ? 'file' : 'files'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            Separated Folder
                          </span>
                        </div>

                        {/* Files within this Folder */}
                        <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {folderFiles.map((file) => {
                            const isSelected = file.id === selectedFileId;
                            return (
                              <div
                                key={file.id}
                                onClick={() => {
                                  setSelectedFileId(file.id);
                                  setActiveTab('code');
                                }}
                                className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-50/90 border-indigo-400 ring-1 ring-indigo-400/30'
                                    : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/80'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                                    {file.name.split('.').pop()?.toUpperCase() || 'CODE'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate font-mono">
                                      {file.path}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteFile(file.id, e)}
                                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                    title="Delete file"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: CODE (Editor & Viewer) */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900 text-slate-200">
            {/* Code Toolbar */}
            <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-mono text-xs font-semibold text-emerald-400 truncate" title={selectedFile?.path}>
                  {selectedFile?.path || selectedFile?.name || 'No file selected'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                  {selectedFile?.language || 'html'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {selectedFile && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteFile(selectedFile.id, e)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-300 hover:text-rose-200 text-xs font-medium flex items-center gap-1 border border-rose-500/30 transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCode}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Run Preview</span>
                </button>
              </div>
            </div>

            {/* Quick File Bar by Folder */}
            {files.length > 1 && (
              <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar shrink-0">
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider shrink-0 mr-1">
                  Files:
                </span>
                {files.map((f) => {
                  const isCur = f.id === selectedFileId;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFileId(f.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${
                        isCur
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title={f.path}
                    >
                      <span className="text-slate-500 text-[10px]">
                        {f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/') + 1) : ''}
                      </span>
                      <span>{f.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Code Textarea / Viewer */}
            <div className="flex-1 p-3 overflow-hidden relative">
              <textarea
                value={activeContent}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="// Code content goes here..."
                className="w-full h-full p-3 font-mono text-xs sm:text-sm bg-transparent text-emerald-300 border-none outline-none resize-none leading-relaxed selection:bg-indigo-900 selection:text-white"
                spellCheck={false}
              />
            </div>

            {/* Quick AI Change Bar at bottom of code view */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
              <Wand2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <input
                type="text"
                value={aiChangePrompt}
                onChange={(e) => setAiChangePrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiChangeCode()}
                placeholder="Ask AI to change this code (e.g. make background black, add a button)..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAiChangeCode}
                disabled={!aiChangePrompt.trim() || isAiProcessing}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                {isAiProcessing ? 'Modifying...' : 'Change Code'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: PREVIEW (Interactive Live Sandbox Runner) */}
        {activeTab === 'preview' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-100">
            {/* Preview Toolbar */}
            <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-800">
                  Live Interactive Preview: {selectedFile?.name || 'Sandbox'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Device switch */}
                <div className="hidden sm:flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      previewDevice === 'desktop' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      previewDevice === 'mobile' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Refresh sandbox preview"
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

            {/* Iframe Viewport */}
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
                  title="Echo Live Sandbox Preview"
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-downloads"
                  allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; clipboard-read; clipboard-write;"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>

            {/* Quick AI Change Bar at bottom of Preview view */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <input
                type="text"
                value={aiChangePrompt}
                onChange={(e) => setAiChangePrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiChangeCode()}
                placeholder="Want to adjust this preview? Type what AI should change..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={handleAiChangeCode}
                disabled={!aiChangePrompt.trim() || isAiProcessing}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                {isAiProcessing ? 'Updating...' : 'Update Preview'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Safe In-App Delete Confirmation Modal */}
      {deleteConfirmFile && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4 border border-slate-200">
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

            <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-xs text-rose-700">
              This action cannot be undone and will permanently remove this code file from your workspace.
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
