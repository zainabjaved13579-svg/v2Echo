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
  Sparkles
} from 'lucide-react';
import { WorkspaceFile } from '../types';
import { buildLivePreviewBundle, downloadWorkspaceFile, autoSaveFile } from '../services/fileStorageService';
import { remakeAiCode } from '../services/codeService';

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: WorkspaceFile | null;
  code?: string;
  language?: string;
  filename?: string;
  onOpenFileManager?: (fileId?: string) => void;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  code = '',
  language = 'html',
  filename = 'index.html',
  onOpenFileManager
}) => {
  const [copied, setCopied] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const activeContent = file?.content || code || '';
  const activeLang = file?.language || language || 'html';
  const activeName = file?.name || filename || 'index.html';
  const activePath = file?.path || `/workspace/${activeName}`;

  const [liveContent, setLiveContent] = useState(activeContent);
  const [showRemakeBar, setShowRemakeBar] = useState(false);
  const [remakeInstruction, setRemakeInstruction] = useState(
    'Refactor, modernize layout, fix bugs, and make responsive for mobile and PC'
  );
  const [isRemaking, setIsRemaking] = useState(false);
  const [remakeSuccess, setRemakeSuccess] = useState(false);

  useEffect(() => {
    setLiveContent(activeContent);
  }, [activeContent]);

  // Ensure file is auto-saved in workspace if not already present
  useEffect(() => {
    if (isOpen && liveContent && !file?.id) {
      autoSaveFile({
        name: activeName,
        path: activePath,
        content: liveContent,
        language: activeLang,
        source: 'ai-generated'
      });
    }
  }, [isOpen, liveContent, file?.id, activeName, activePath, activeLang]);

  if (!isOpen) return null;

  // Build the live preview HTML
  const previewHtml = buildLivePreviewBundle({
    id: file?.id || 'temp_preview',
    name: activeName,
    path: activePath,
    content: liveContent,
    language: activeLang,
    createdAt: file?.createdAt || Date.now(),
    updatedAt: Date.now(),
    autoSaved: true,
    source: 'ai-generated'
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(liveContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleDownload = () => {
    downloadWorkspaceFile({
      id: file?.id || 'download_file',
      name: activeName,
      path: activePath,
      content: liveContent,
      language: activeLang,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      autoSaved: true,
      source: 'ai-generated'
    });
  };

  const handleRemakeCode = async (instructionOverride?: string) => {
    const instructionToUse = (instructionOverride || remakeInstruction).trim();
    if (!instructionToUse || isRemaking) return;

    setIsRemaking(true);
    try {
      const res = await remakeAiCode({
        code: liveContent,
        language: activeLang,
        filename: activeName,
        instruction: instructionToUse
      });

      if (res && res.content) {
        let clean = res.content;
        const match = /```[\w\-\.]*\n([\s\S]*?)```/.exec(clean);
        if (match && match[1]) {
          clean = match[1].trim();
        }

        setLiveContent(clean);
        setRemakeSuccess(true);
        setTimeout(() => setRemakeSuccess(false), 3000);

        autoSaveFile({
          name: activeName,
          path: activePath,
          content: clean,
          language: activeLang,
          source: 'ai-generated'
        });

        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error('Failed to remake code in preview:', err);
    } finally {
      setIsRemaking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[88vh] max-h-[850px]'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 text-slate-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white truncate">{activeName}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Auto-Saved in {activePath}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Device Switcher & Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              View Code
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5">
            {activeTab === 'preview' && (
              <div className="hidden sm:flex items-center gap-1 border-r border-slate-800 pr-2 mr-1">
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`p-1.5 rounded-lg text-xs ${
                    deviceView === 'desktop'
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop View (100%)"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeviceView('tablet')}
                  className={`p-1.5 rounded-lg text-xs ${
                    deviceView === 'tablet'
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tablet View (768px)"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`p-1.5 rounded-lg text-xs ${
                    deviceView === 'mobile'
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile View (375px)"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Refresh Live Sandbox"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* AI Remake Code Trigger */}
            <button
              onClick={() => setShowRemakeBar((b) => !b)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-200 hover:text-white text-xs font-semibold rounded-lg border border-purple-500/40 transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Remake and refactor this code with AI"
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Remake</span>
            </button>

            {onOpenFileManager && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFileManager(file?.id);
                }}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                title="Open in Full File Manager"
              >
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>File Manager</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Copy Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen((f) => !f)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Remake Toolbar */}
        {showRemakeBar && (
          <div className="p-3 bg-slate-900 border-b border-purple-500/40 space-y-2 text-xs animate-fadeIn shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Code Remake & Live Sandbox Sync</span>
              </span>
              <div className="flex items-center gap-2">
                {remakeSuccess && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Code Remade & Live Preview Updated!
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  Optimizes HTML, CSS & JS for PC & Mobile
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={remakeInstruction}
                onChange={(e) => setRemakeInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRemakeCode();
                  }
                }}
                placeholder="Describe how to remake or optimize this code..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => handleRemakeCode()}
                disabled={isRemaking || !remakeInstruction.trim()}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                {isRemaking ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Remaking...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Remake Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick preset chips */}
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
                  className="text-[11px] px-2.5 py-0.5 rounded bg-slate-800 hover:bg-purple-950 text-slate-300 hover:text-purple-200 border border-slate-700/60 transition-all font-sans cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
          {activeTab === 'preview' ? (
            <div
              className={`h-full transition-all duration-300 bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700/50 flex flex-col ${
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
          ) : (
            <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-auto font-mono text-xs sm:text-sm text-slate-200">
              <pre className="!m-0 !p-0">
                <code>{liveContent}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Location: <strong className="text-slate-300 font-mono">{activePath}</strong></span>
            <span>•</span>
            <span>Language: <strong className="text-indigo-400 uppercase font-mono">{activeLang}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚡ Interactive Sandbox</span>
          </div>
        </div>
      </div>
    </div>
  );
};
