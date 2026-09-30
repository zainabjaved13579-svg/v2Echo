import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  Folder,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  Code2,
  ExternalLink,
  Wand2,
  Sparkles,
  Eye,
  Layers,
  FileCode,
  FileSpreadsheet,
  Plus,
  Play
} from 'lucide-react';
import { WorkspaceFile } from '../types';
import {
  autoSaveFile,
  downloadWorkspaceFile,
  exportAllFilesAsZip,
  loadWorkspaceFiles,
  buildLivePreviewBundle
} from '../services/fileStorageService';
import { remakeAiCode } from '../services/codeService';
import { SAPPHIRE_LOGO_URL } from '../data/constants';

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: WorkspaceFile | null;
  files?: WorkspaceFile[];
  code?: string;
  language?: string;
  filename?: string;
  onOpenFileManager?: (fileId?: string) => void;
  onOpenCodexWorkspace?: () => void;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  files: initialFiles,
  code = '',
  language = 'html',
  filename = 'index.html',
  onOpenFileManager,
  onOpenCodexWorkspace
}) => {
  // All active files for this preview
  const [projectFiles, setProjectFiles] = useState<WorkspaceFile[]>(() => {
    if (initialFiles && initialFiles.length > 0) return initialFiles;
    if (file) return [file];
    return [
      {
        id: 'primary_file',
        name: filename || 'index.html',
        path: `/workspace/${filename || 'index.html'}`,
        content: code || '',
        language: language || 'html',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        autoSaved: true,
        source: 'ai-generated'
      }
    ];
  });

  // Selected file id in multi-file project
  const [selectedFileId, setSelectedFileId] = useState<string>(() => {
    return file?.id || projectFiles[0]?.id || 'primary_file';
  });

  // View modes: 'preview' | 'split' | 'code' | 'all-files'
  const [activeTab, setActiveTab] = useState<'preview' | 'split' | 'code' | 'all-files'>('preview');
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Preview scope: 'selected' (live preview of active file) | 'app' (compiled full web app)
  const [previewScope, setPreviewScope] = useState<'selected' | 'app'>('selected');
  // In 'all-files' tab: 'preview' (interactive all-files dashboard) | 'code' (raw code cards)
  const [allFilesMode, setAllFilesMode] = useState<'preview' | 'code'>('preview');

  // Remake states
  const [showRemakeBar, setShowRemakeBar] = useState(false);
  const [remakeInstruction, setRemakeInstruction] = useState(
    'Refactor, modernize layout, fix bugs, and make responsive for mobile and PC'
  );
  const [isRemaking, setIsRemaking] = useState(false);
  const [remakeSuccess, setRemakeSuccess] = useState(false);

  // Synchronize when props update
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setProjectFiles(initialFiles);
      if (!initialFiles.some((f) => f.id === selectedFileId)) {
        setSelectedFileId(initialFiles[0]?.id || '');
      }
    } else if (file) {
      setProjectFiles([file]);
      setSelectedFileId(file.id);
    } else if (code) {
      const single: WorkspaceFile = {
        id: 'primary_file',
        name: filename || 'index.html',
        path: `/workspace/${filename || 'index.html'}`,
        content: code,
        language: language || 'html',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        autoSaved: true,
        source: 'ai-generated'
      };
      setProjectFiles([single]);
      setSelectedFileId('primary_file');
    }
  }, [file, initialFiles, code, filename, language]);

  // Escape key listener for fast and foolproof closing
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const selectedFile = projectFiles.find((f) => f.id === selectedFileId) || projectFiles[0];

  // Auto-save files
  const handleUpdateFileContent = (newContent: string) => {
    if (!selectedFile) return;
    const updated = projectFiles.map((f) =>
      f.id === selectedFile.id ? { ...f, content: newContent, updatedAt: Date.now() } : f
    );
    setProjectFiles(updated);
    autoSaveFile({
      name: selectedFile.name,
      path: selectedFile.path,
      content: newContent,
      language: selectedFile.language,
      source: 'ai-generated'
    });
    setRefreshKey((k) => k + 1);
  };

  const handleCopyCurrentFile = async () => {
    if (!selectedFile) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleCopyAllFiles = async () => {
    const combined = projectFiles
      .map((f) => `// ==========================================\n// File: ${f.name}\n// ==========================================\n${f.content}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(combined);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {}
  };

  const handleDownloadCurrentFile = () => {
    if (!selectedFile) return;
    downloadWorkspaceFile(selectedFile);
  };

  const handleRemakeCode = async (instructionOverride?: string) => {
    const instruction = (instructionOverride || remakeInstruction).trim();
    if (!instruction || !selectedFile || isRemaking) return;

    setIsRemaking(true);
    try {
      const res = await remakeAiCode({
        code: selectedFile.content,
        language: selectedFile.language,
        filename: selectedFile.name,
        instruction
      });

      if (res && res.content) {
        let clean = res.content;
        const match = /```[\w\-\.]*\n([\s\S]*?)```/.exec(clean);
        if (match && match[1]) {
          clean = match[1].trim();
        }

        handleUpdateFileContent(clean);
        setRemakeSuccess(true);
        setTimeout(() => setRemakeSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to remake code in preview:', err);
    } finally {
      setIsRemaking(false);
    }
  };

  useEffect(() => {
    const isWeb = ['html', 'htm', 'js', 'jsx', 'ts', 'tsx', 'css', 'svg'].includes((language || '').toLowerCase()) || (filename || '').endsWith('.html') || (filename || '').endsWith('.jsx') || (filename || '').endsWith('.tsx');
    if (!isWeb) {
      setActiveTab('code');
    }
  }, [filename, language]);

  // ===== BUILD LIVE PREVIEW BUNDLE (FIXED) =====
  const previewHtml = React.useMemo(() => {
    if (projectFiles.length === 0) {
      return '<!DOCTYPE html><html><body><h1>No files to preview</h1></body></html>';
    }

    // Find active file
    const activeFile = projectFiles.find((f) => f.id === selectedFileId) || projectFiles[0];
    if (!activeFile) {
      return '<!DOCTYPE html><html><body><h1>No active file</h1></body></html>';
    }

    // Mode 1: Full Web App or All Files → use HTML file as base
    if (previewScope === 'app' || activeTab === 'all-files') {
      const htmlFile = projectFiles.find((f) =>
        f.name.toLowerCase().endsWith('.html') || f.language === 'html'
      );
      
      if (htmlFile) {
        return buildLivePreviewBundle(htmlFile, projectFiles);
      }
    }

    // Mode 2: Preview the active file with all project files
    return buildLivePreviewBundle(activeFile, projectFiles);
  }, [projectFiles, selectedFileId, previewScope, activeTab, refreshKey]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] select-none sm:select-auto"
    >
      {/* Mobile Floating Close Action Button */}
      <button
        type="button"
        onClick={onClose}
        className="sm:hidden fixed top-3 right-3 z-[9999] p-2.5 rounded-full bg-rose-600 text-white shadow-2xl hover:bg-rose-500 active:scale-90 transition-all flex items-center justify-center min-w-[42px] min-h-[42px] cursor-pointer"
        title="Close Preview"
        aria-label="Close Preview"
      >
        <X className="w-5 h-5 stroke-[2.5]" />
      </button>

      <div
        className={`bg-[#151515] border border-[#2b2b2a] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full h-full sm:w-[98vw] sm:max-w-[1700px] sm:h-[95vh] sm:max-h-[96vh]'
        }`}
      >
        {/* Top Header Bar */}
        <header className="px-4 py-3 bg-[#111111] border-b border-[#2b2b2a] flex items-center justify-between gap-3 text-white shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt="Sapphire Studio"
              className="w-8 h-8 rounded-xl object-contain p-0.5 border border-white/20 bg-white shadow-md shadow-[#d97757]/20 shrink-0"
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-tight truncate">
                  {selectedFile?.name || 'Studio Preview'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  Live Reactive
                </span>
                {projectFiles.length > 1 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#20201f] text-[#a19e97] border border-[#2b2b2a]">
                    {projectFiles.length} files
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#20201f] border border-[#2b2b2a] rounded-2xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-[#d97757] text-white shadow-xs'
                  : 'text-[#86837c] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`hidden md:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'split'
                  ? 'bg-[#d97757] text-white shadow-xs'
                  : 'text-[#86837c] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-[#d97757] text-white shadow-xs'
                  : 'text-[#86837c] hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all-files')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all-files'
                  ? 'bg-[#d97757] text-white shadow-xs'
                  : 'text-[#86837c] hover:text-white'
              }`}
              title="Full Preview of All Project Files"
            >
              <Folder className="w-3.5 h-3.5" />
              <span>All Files</span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5">
            {(activeTab === 'preview' || activeTab === 'split') && (
              <div className="hidden lg:flex items-center bg-[#20201f] border border-[#2b2b2a] rounded-xl p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => setDeviceView('desktop')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    deviceView === 'desktop' ? 'bg-[#d97757] text-white' : 'text-[#86837c] hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView('tablet')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    deviceView === 'tablet' ? 'bg-[#d97757] text-white' : 'text-[#86837c] hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView('mobile')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    deviceView === 'mobile' ? 'bg-[#d97757] text-white' : 'text-[#86837c] hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 rounded-2xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-[#a19e97] hover:text-white transition-colors cursor-pointer"
              title="Refresh Live Preview"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowRemakeBar((b) => !b)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-xs font-medium text-[#d97757] hover:text-white transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Remake</span>
            </button>

            <button
              type="button"
              onClick={() => exportAllFilesAsZip(projectFiles)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-xs font-medium text-white transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Export ZIP</span>
            </button>

            {onOpenCodexWorkspace && (
              <button
                type="button"
                onClick={onOpenCodexWorkspace}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Codex Studio</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              className="p-2 rounded-2xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-[#a19e97] hover:text-white transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:p-2 rounded-2xl bg-rose-500/20 sm:bg-[#20201f] hover:bg-rose-500/30 sm:hover:bg-[#282724] border border-rose-500/40 sm:border-[#2b2b2a] text-rose-300 sm:text-[#a19e97] hover:text-white transition-colors cursor-pointer shrink-0 min-w-[38px] min-h-[38px] flex items-center justify-center shadow-xs"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </header>

        {/* Multi-File Tab Bar */}
        {projectFiles.length > 1 && (
          <div className="h-10 bg-[#121212] border-b border-[#2b2b2a] px-3 flex items-center justify-between gap-2 overflow-x-auto shrink-0 select-none">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {projectFiles.map((f) => {
                const isSelected = f.id === selectedFileId;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFileId(f.id);
                      setPreviewScope('selected');
                      setRefreshKey((k) => k + 1);
                    }}
                    className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#20201f] text-white border-[#2b2b2a] shadow-xs font-semibold'
                        : 'text-[#86837c] hover:text-white border-transparent hover:bg-[#181818]'
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-[#d97757]' : 'text-slate-400'}`} />
                    <span>{f.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(activeTab === 'preview' || activeTab === 'split') && projectFiles.some(f => f.name.toLowerCase().endsWith('.html')) && (
                <div className="flex items-center bg-[#181817] p-0.5 rounded-xl border border-[#2b2b2a] text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewScope('selected');
                      setRefreshKey((k) => k + 1);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      previewScope === 'selected'
                        ? 'bg-[#d97757] text-white shadow-xs font-semibold'
                        : 'text-[#86837c] hover:text-white'
                    }`}
                  >
                    Selected File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewScope('app');
                      setRefreshKey((k) => k + 1);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      previewScope === 'app'
                        ? 'bg-[#d97757] text-white shadow-xs font-semibold'
                        : 'text-[#86837c] hover:text-white'
                    }`}
                  >
                    Full Web App
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleCopyCurrentFile}
                className="px-2.5 py-1 rounded-lg bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-xs text-[#ede8e1] flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#a19e97]" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCurrentFile}
                className="px-2.5 py-1 rounded-lg bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-xs text-[#ede8e1] flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3 text-[#d97757]" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>
        )}

        {/* AI Remake Toolbar */}
        {showRemakeBar && (
          <div className="p-3 bg-[#181817] border-b border-[#33312e] space-y-2 text-xs shrink-0 select-none">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f5f2eb] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#d97757]" />
                <span>AI Code Remake & Enhancement Studio</span>
              </span>
              {remakeSuccess && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Enhanced & Preview Live Updated!
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={remakeInstruction}
                onChange={(e) => setRemakeInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRemakeCode();
                }}
                placeholder="Describe how to remake or optimize this code..."
                className="flex-1 bg-[#101010] border border-[#2e2d2a] rounded-xl px-3 py-1.5 text-white placeholder-[#666] text-xs focus:outline-none focus:border-[#d97757]"
              />
              <button
                type="button"
                onClick={() => handleRemakeCode()}
                disabled={isRemaking || !remakeInstruction.trim()}
                className="px-4 py-1.5 bg-[#d97757] hover:bg-[#c86b4c] disabled:opacity-40 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                {isRemaking ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Enhance Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                'Make responsive for PC monitors and mobile phones',
                'Modernize visual styling, fix layouts and bugs',
                'Add polished dark mode styling & gradients',
                'Improve interactive animations and UX'
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setRemakeInstruction(preset);
                    handleRemakeCode(preset);
                  }}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#20201f] hover:bg-[#282724] text-[#a19e97] hover:text-white border border-[#2e2d2a] transition-all font-sans cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Canvas Body */}
        <div className="flex-1 bg-[#0d0d0f] relative overflow-hidden flex">
          {/* TAB 1: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 bg-[#0e0e10] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#2b2b2a] flex flex-col ${
                  deviceView === 'desktop'
                    ? 'w-full'
                    : deviceView === 'tablet'
                    ? 'w-[768px] max-w-full'
                    : 'w-[380px] max-w-full'
                }`}
              >
                <iframe
                  key={refreshKey}
                  title="Code Live Preview"
                  srcDoc={previewHtml}
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-downloads"
                  allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; clipboard-read; clipboard-write;"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 2: SPLIT */}
          {activeTab === 'split' && (
            <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-[#2b2b2a] bg-[#111111] overflow-hidden">
                <div className="px-3 py-1.5 bg-[#151515] border-b border-[#2b2b2a] text-[11px] text-[#a19e97] flex items-center justify-between select-none">
                  <div className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-[#d97757]" />
                    <span className="font-semibold text-white">{selectedFile?.name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">Live Sync</span>
                </div>
                <div className="flex-1 p-3 overflow-y-auto">
                  <textarea
                    value={selectedFile?.content || ''}
                    onChange={(e) => handleUpdateFileContent(e.target.value)}
                    className="w-full h-full bg-transparent text-[#f1f1f1] font-mono text-xs sm:text-sm resize-none focus:outline-none leading-relaxed select-text"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-[#0e0e10] p-2 sm:p-3 overflow-hidden">
                <div
                  className={`w-full h-full rounded-2xl overflow-hidden border border-[#2b2b2a] shadow-xl bg-white transition-all ${
                    deviceView === 'mobile' ? 'max-w-[390px] mx-auto rounded-3xl' : ''
                  }`}
                >
                  <iframe
                    key={refreshKey}
                    title="Code Live Preview Split"
                    srcDoc={previewHtml}
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-downloads"
                    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; clipboard-read; clipboard-write;"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CODE */}
          {activeTab === 'code' && selectedFile && (
            <div className="w-full h-full flex flex-col bg-[#111111] overflow-hidden">
              <div className="px-4 py-2 bg-[#151515] border-b border-[#2b2b2a] flex items-center justify-between text-xs text-[#a19e97] select-none">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{selectedFile.name}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[#20201f] text-[#a19e97] border border-[#2b2b2a]">
                    {selectedFile.language || selectedFile.name.split('.').pop()}
                  </span>
                  <span className="text-[11px] text-[#737373]">
                    {(selectedFile.content || '').split('\n').length} lines
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCurrentFile}
                    className="px-2.5 py-1 rounded-lg bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-white text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#a19e97]" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCurrentFile}
                    className="px-2.5 py-1 rounded-lg bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                <textarea
                  value={selectedFile.content}
                  onChange={(e) => handleUpdateFileContent(e.target.value)}
                  className="w-full h-full bg-transparent text-[#f1f1f1] font-mono text-xs sm:text-sm resize-none focus:outline-none leading-relaxed select-text"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* TAB 4: ALL FILES */}
          {activeTab === 'all-files' && (
            <div className="w-full h-full flex flex-col bg-[#111111] overflow-hidden">
              <div className="px-4 py-2.5 bg-[#151515] border-b border-[#2b2b2a] flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[#d97757]" />
                  <span className="font-semibold text-white">All Project Files</span>
                  <span className="text-[11px] text-[#a19e97] bg-[#20201f] px-2 py-0.5 rounded-lg border border-[#2b2b2a]">
                    {projectFiles.length} {projectFiles.length === 1 ? 'file' : 'files'} • {projectFiles.reduce((acc, f) => acc + (f.content?.split('\n').length || 0), 0)} lines
                  </span>
                </div>

                <div className="flex items-center bg-[#20201f] p-0.5 rounded-xl border border-[#2b2b2a] text-xs">
                  <button
                    type="button"
                    onClick={() => setAllFilesMode('preview')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      allFilesMode === 'preview'
                        ? 'bg-[#d97757] text-white shadow-xs font-semibold'
                        : 'text-[#86837c] hover:text-white'
                    }`}
                  >
                    ⚡ Live Preview Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllFilesMode('code')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      allFilesMode === 'code'
                        ? 'bg-[#d97757] text-white shadow-xs font-semibold'
                        : 'text-[#86837c] hover:text-white'
                    }`}
                  >
                    📝 Raw Source Code
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAllFiles}
                    className="px-3 py-1.5 rounded-xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#d97757]" />}
                    <span>{copiedAll ? 'All Copied' : 'Copy All Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportAllFilesAsZip(projectFiles)}
                    className="px-3 py-1.5 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export All ZIP</span>
                  </button>
                </div>
              </div>

              {allFilesMode === 'preview' ? (
                <div className="flex-1 w-full h-full bg-[#0d0d0f] overflow-hidden">
                  <iframe
                    key={`all-files-frame-${refreshKey}`}
                    title="All Files Live Preview Dashboard"
                    srcDoc={previewHtml}
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-downloads"
                    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; clipboard-read; clipboard-write;"
                    className="w-full h-full border-0 bg-[#0b0c0f]"
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {projectFiles.map((item) => {
                  const lines = (item.content || '').split('\n');
                  return (
                    <div key={item.id} className="rounded-2xl border border-[#2b2b2a] bg-[#151515] overflow-hidden shadow-lg">
                      <div className="px-4 py-2 bg-[#191919] border-b border-[#2b2b2a] flex items-center justify-between gap-2 select-none">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-[#d97757]" />
                          <span className="font-bold text-white text-xs tracking-wide">{item.name}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[#222] text-[#a19e97] border border-[#333]">
                            {item.language || item.name.split('.').pop()}
                          </span>
                          <span className="text-[11px] text-[#737373]">
                            {lines.length} lines
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.content);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-[#ede8e1] text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3 text-[#a19e97]" />
                            <span>Copy</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFileId(item.id);
                              setActiveTab('code');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-[#ede8e1] text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Code2 className="w-3 h-3 text-[#d97757]" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-[#0d0d0f] font-mono text-xs text-[#f1f1f1] overflow-x-auto leading-relaxed max-h-[500px] overflow-y-auto">
                        <pre className="flex">
                          <div className="select-none pr-4 text-right text-[#555] font-mono shrink-0">
                            {lines.map((_, i) => (
                              <div key={i}>{i + 1}</div>
                            ))}
                          </div>
                          <code className="text-white/95 whitespace-pre flex-1 select-text">
                            {item.content}
                          </code>
                        </pre>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-4 py-2 bg-[#111111] border-t border-[#2b2b2a] flex items-center justify-between text-[11px] text-[#a19e97] select-none">
          <div className="flex items-center gap-2">
            <span>Active: <strong className="text-white font-mono">{selectedFile?.name || 'File'}</strong></span>
            <span>•</span>
            <span>Path: <strong className="text-[#a19e97] font-mono">{selectedFile?.path}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">⚡ Unified Reactive Live Runtime</span>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([previewHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              }}
              className="text-[#d97757] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Popout Window</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CodePreviewModal;