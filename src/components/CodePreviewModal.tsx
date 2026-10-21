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
  loadWorkspaceFiles
} from '../services/fileStorageService';
import { buildUnifiedLivePreviewBundle } from '../services/appEngineService';
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

  if (!isOpen) return null;

  // Build the live preview HTML from all active project files
  const previewHtml = buildUnifiedLivePreviewBundle(
    projectFiles,
    selectedFileId,
    activeTab === 'all-files' ? 'all' : previewScope
  );

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] select-none sm:select-auto"
    >
      {/* Mobile Floating Close Action Button - ALWAYS visible on mobile */}
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
        {/* Top Header Bar - Clean Code and Preview only, no logo, no file name, just cross button */}
        <header className="px-4 py-3 bg-[#111111] border-b border-[#2b2b2a] flex items-center justify-between gap-3 text-white shrink-0 select-none">
          {/* Left Spacer */}
          <div className="w-10 sm:w-20 shrink-0" />

          {/* Center: Mode Switcher (Code and Preview only) */}
          <div className="flex items-center bg-[#181818] border border-[#2b2b2a] rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-[#d97757] text-white shadow-xs font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-[#d97757] text-white shadow-xs font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Right: Just Cross Close Button */}
          <div className="flex items-center justify-end w-10 sm:w-20 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-neutral-300 hover:text-white transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center shadow-xs"
              title="Close Preview"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </header>

        {/* Multi-File Tab Bar (shown if multiple files or code/split mode) */}
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
                    <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{f.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle: Selected File Preview vs Full Web App */}
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
                        ? 'bg-gradient-to-r from-[#d97757] to-[#c86b4c] text-white shadow-xs font-semibold'
                        : 'text-[#86837c] hover:text-white'
                    }`}
                    title="Preview currently active file"
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
                        ? 'bg-gradient-to-r from-[#d97757] to-[#c86b4c] text-white shadow-xs font-semibold'
                        : 'text-[#86837c] hover:text-white'
                    }`}
                    title="Preview bundled web app"
                  >
                    Full Web App
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Canvas Body: Depending on activeTab */}
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

          {/* TAB 2: SPLIT (Code on Left, Live Preview on Right) */}
          {activeTab === 'split' && (
            <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
              {/* Code Editor on Left */}
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

              {/* Live Preview on Right */}
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

          {/* TAB 3: CODE (Full Code Editor) */}
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


        </div>

        {/* Footer info bar */}
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
              className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
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
