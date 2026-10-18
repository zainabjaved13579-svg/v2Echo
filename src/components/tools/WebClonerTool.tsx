import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Sparkles,
  Download,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Zap,
  FolderDown,
  ArrowRight,
  Send,
  RotateCcw,
  Undo2,
  MessageSquare,
  Eye,
  Sliders,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { useAppTheme } from '../../context/ThemeContext';
import { getStoredApiKey } from '../../services/geminiService';
import { SAPPHIRE_LEAD_DEVELOPER } from '../../data/constants';

interface ClonedResult {
  url: string;
  domain: string;
  siteTitle: string;
  siteDescription: string;
  files: {
    'index.html': string;
    'style.css': string;
    'script.js': string;
    'README.md': string;
  };
  stats?: {
    durationMs: number;
    htmlBytes: number;
    cssBytes: number;
    jsBytes: number;
    stylesheetsHarvested: number;
    scriptsHarvested: number;
  };
}

interface ClonedRevision {
  timestamp: number;
  prompt: string;
  files: {
    'index.html': string;
    'style.css': string;
    'script.js': string;
    'README.md': string;
  };
}

const PRESET_SITES = [
  { name: 'Linear', url: 'https://linear.app' },
  { name: 'Notion', url: 'https://notion.so' },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com' },
  { name: 'Vercel', url: 'https://vercel.com' },
  { name: 'GitHub', url: 'https://github.com' }
];

export const WebClonerTool: React.FC<{ onOpenInCodex?: (files: Record<string, string>) => void }> = ({
  onOpenInCodex
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  const [inputUrl, setInputUrl] = useState<string>('https://linear.app');
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [cloneStage, setCloneStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clonedData, setClonedData] = useState<ClonedResult | null>(null);

  // Revisions & Undo State
  const [history, setHistory] = useState<ClonedRevision[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // AI Editor State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiEditing, setIsAiEditing] = useState<boolean>(false);
  const [aiEditStatus, setAiEditStatus] = useState<string | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState<boolean>(true);
  const [aiMessageLog, setAiMessageLog] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);

  // Preview & Code State
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeCodeTab, setActiveCodeTab] = useState<'index.html' | 'style.css' | 'script.js' | 'README.md'>('index.html');
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<'preview' | 'code' | 'split'>('preview');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Theme Styling (Clean Black and White, No Garish Blue)
  const bgMain = isMoon ? 'bg-[#090a0f]' : 'bg-[#faf9f7]';
  const bgCard = isMoon ? 'bg-[#12131a]' : 'bg-white';
  const bgInput = isMoon ? 'bg-[#181922]' : 'bg-[#f4f3ef]';
  const border = isMoon ? 'border-[#222430]' : 'border-[#e5e5e0]';
  const textBright = isMoon ? 'text-white' : 'text-zinc-900';
  const textSub = isMoon ? 'text-zinc-400' : 'text-zinc-600';
  const btnPrimary = isMoon
    ? 'bg-white hover:bg-zinc-200 text-black font-bold'
    : 'bg-zinc-900 hover:bg-zinc-800 text-white font-bold';

  // Trigger toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Start Cloner
  const handleStartClone = async (overrideUrl?: string) => {
    const target = (overrideUrl || inputUrl).trim();
    if (!target) {
      setErrorMsg('Please enter a website URL to clone.');
      return;
    }

    setIsCloning(true);
    setErrorMsg(null);
    setCloneStage('Analyzing DOM structure & harvesting assets...');

    try {
      const res = await fetch('/api/tools/web-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Cloning failed with status ${res.status}`);
      }

      setCloneStage('Inlining stylesheets & purging telemetry...');
      const data: ClonedResult = await res.json();

      setClonedData(data);
      setHistory([
        {
          timestamp: Date.now(),
          prompt: 'Initial Clone',
          files: { ...data.files }
        }
      ]);
      setHistoryIndex(0);
      setAiMessageLog([
        {
          role: 'assistant',
          text: `Website "${data.siteTitle || data.domain}" cloned! You can ask me to change copy, dark mode, layout, or add new sections.`
        }
      ]);
      setPreviewKey((k) => k + 1);
      showToast(`Cloned ${data.domain} successfully`);
    } catch (err: any) {
      console.error('Clone failed:', err);
      setErrorMsg(err.message || 'Could not clone target website. Please check URL.');
    } finally {
      setIsCloning(false);
      setCloneStage('');
    }
  };

  // AI Chat Website Editor
  const handleAiEdit = async (customPrompt?: string) => {
    const prompt = (customPrompt || aiPrompt).trim();
    if (!prompt || !clonedData || isAiEditing) return;

    setIsAiEditing(true);
    setAiEditStatus('AI Architect editing website...');
    setAiMessageLog((prev) => [...prev, { role: 'user', text: prompt }]);
    setAiPrompt('');

    try {
      const currentHtml = clonedData.files['index.html'] || '';
      const currentCss = clonedData.files['style.css'] || '';
      const currentJs = clonedData.files['script.js'] || '';

      const systemInstruction = `You are Sapphire AI Website Architect.
You are directly modifying an existing cloned web application.
MANDATORY CONSTITUTION:
1. Preserve the structure and styling of the existing page while applying the user's requested changes cleanly and professionally.
2. Output your modifications using clean Markdown code blocks with filenames:
\`\`\`html index.html
<!DOCTYPE html>
...
\`\`\`
\`\`\`css style.css
...
\`\`\`
\`\`\`javascript script.js
...
\`\`\`
3. Do NOT output commentary or chat filler outside the code blocks. Make sure HTML, CSS, and JS are fully implemented and bug-free.`;

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': getStoredApiKey()
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `User Request: "${prompt}"\n\nCurrent index.html:\n${currentHtml.slice(0, 14000)}\n\nCurrent style.css:\n${currentCss.slice(0, 8000)}\n\nCurrent script.js:\n${currentJs.slice(0, 4000)}`
                }
              ]
            }
          ],
          systemInstruction,
          model: 'gemini-flash-latest'
        })
      });

      if (!response.ok || !response.body) throw new Error('AI Stream connection failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(jsonStr);
              const piece = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              accumulated += piece;
            } catch {}
          }
        }
      }

      // Parse updated code blocks
      const blockRegex = /```([a-zA-Z0-9_-]+)?(?:\s+([\w\.\-\/]+))?\n([\s\S]*?)```/g;
      let match;
      const updatedFiles: Partial<ClonedResult['files']> = {};

      while ((match = blockRegex.exec(accumulated)) !== null) {
        const lang = (match[1] || 'html').toLowerCase();
        let fileName = match[2];
        const content = match[3].trim();

        if (!fileName) {
          if (lang === 'html') fileName = 'index.html';
          else if (lang === 'css') fileName = 'style.css';
          else if (lang === 'js' || lang === 'javascript') fileName = 'script.js';
        }

        if (fileName === 'index.html' || fileName === 'style.css' || fileName === 'script.js') {
          updatedFiles[fileName] = content;
        }
      }

      if (updatedFiles['index.html'] || updatedFiles['style.css'] || updatedFiles['script.js']) {
        const newFiles = {
          ...clonedData.files,
          ...(updatedFiles['index.html'] ? { 'index.html': updatedFiles['index.html'] } : {}),
          ...(updatedFiles['style.css'] ? { 'style.css': updatedFiles['style.css'] } : {}),
          ...(updatedFiles['script.js'] ? { 'script.js': updatedFiles['script.js'] } : {})
        };

        setClonedData((prev) => (prev ? { ...prev, files: newFiles } : prev));

        // Append to history
        const newRev: ClonedRevision = {
          timestamp: Date.now(),
          prompt,
          files: { ...newFiles }
        };
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), newRev]);
        setHistoryIndex((prev) => prev + 1);

        setAiMessageLog((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Applied: "${prompt}". Live preview updated.`
          }
        ]);
        setPreviewKey((k) => k + 1);
        showToast('Website updated with AI');
      } else {
        setAiMessageLog((prev) => [
          ...prev,
          { role: 'assistant', text: 'Changes processed. Preview re-rendered.' }
        ]);
      }
    } catch (err: any) {
      console.error('AI Edit Error:', err);
      setAiMessageLog((prev) => [
        ...prev,
        { role: 'assistant', text: `Notice: ${err.message || 'Could not complete modification.'}` }
      ]);
    } finally {
      setIsAiEditing(false);
      setAiEditStatus(null);
    }
  };

  // Revert / Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const targetRev = history[prevIdx];
      setClonedData((prev) => (prev ? { ...prev, files: { ...targetRev.files } } : prev));
      setHistoryIndex(prevIdx);
      setPreviewKey((k) => k + 1);
      showToast(`Reverted to: "${targetRev.prompt}"`);
    }
  };

  // Copy code
  const handleCopyCode = (filename: keyof ClonedResult['files']) => {
    if (!clonedData) return;
    navigator.clipboard.writeText(clonedData.files[filename]);
    setCopiedTab(filename);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  // Export as Clean ZIP
  const handleExportZip = async () => {
    if (!clonedData) return;
    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      zip.file('index.html', clonedData.files['index.html']);
      zip.file('style.css', clonedData.files['style.css']);
      zip.file('script.js', clonedData.files['script.js']);
      zip.file('README.md', clonedData.files['README.md'] || `# Cloned ${clonedData.domain}\nExported from Sapphire.`);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(clonedData.siteTitle || clonedData.domain).replace(/[^a-zA-Z0-9_-]/g, '_')}-clean.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded clean ZIP archive');
    } catch {
      alert('Error creating ZIP archive');
    } finally {
      setIsExportingZip(false);
    }
  };

  // Build clean inlined iframe doc
  const getIframeSrcDoc = () => {
    if (!clonedData) return '';
    const { 'index.html': html, 'style.css': css, 'script.js': js } = clonedData.files;
    let doc = html;

    if (doc.includes('</head>')) {
      doc = doc.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
    } else {
      doc = `<style>\n${css}\n</style>\n${doc}`;
    }

    if (doc.includes('</body>')) {
      doc = doc.replace('</body>', `<script>\n${js}\n</script>\n</body>`);
    } else {
      doc = `${doc}\n<script>\n${js}\n</script>`;
    }
    return doc;
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${bgMain} font-['Plus_Jakarta_Sans',sans-serif]`}>
      {/* Top Search & Actions Bar (Clean, Minimal, No Blue) */}
      <div className={`px-4 sm:px-6 py-3 border-b ${border} ${bgCard} shrink-0`}>
        <div className="max-w-7xl mx-auto space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 text-white flex items-center justify-center shadow-xs">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-sm sm:text-base font-bold ${textBright}`}>
                    Ultra Web Cloner & AI Editor
                  </h2>
                </div>
                <p className={`text-[11px] ${textSub}`}>
                  Deep DOM scraper with interactive AI chat editing and clean ZIP export.
                </p>
              </div>
            </div>

            {/* Quick Samples */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className={`text-[10px] font-semibold ${textSub} shrink-0`}>Samples:</span>
              {PRESET_SITES.map((site) => (
                <button
                  key={site.name}
                  type="button"
                  onClick={() => {
                    setInputUrl(site.url);
                    handleStartClone(site.url);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${bgInput} ${border} border ${textSub} hover:${textBright} transition-colors shrink-0 cursor-pointer`}
                >
                  {site.name}
                </button>
              ))}
            </div>
          </div>

          {/* URL Input & Clone Action */}
          <div className="flex items-center gap-2">
            <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border ${border} ${bgInput}`}>
              <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartClone()}
                placeholder="Enter any website URL (e.g., https://linear.app)"
                className={`w-full bg-transparent text-xs sm:text-sm font-medium ${textBright} focus:outline-none placeholder:text-zinc-500`}
              />
            </div>

            <button
              type="button"
              onClick={() => handleStartClone()}
              disabled={isCloning}
              className={`py-2 px-5 rounded-xl ${btnPrimary} text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0`}
            >
              {isCloning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Cloning...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Clone Site</span>
                </>
              )}
            </button>
          </div>

          {/* Status feedback */}
          {isCloning && (
            <div className="text-xs text-zinc-400 flex items-center gap-2 animate-pulse pt-0.5">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>{cloneStage}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      {clonedData ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Left: Live Preview Sandbox & Code Toggle */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-[#1a1b24]">
            {/* Viewport & View Mode Bar */}
            <div className={`h-10 px-4 border-b ${border} ${bgCard} flex items-center justify-between text-xs shrink-0 select-none`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Live Sandbox</span>
                </span>
                <span className={`text-[10px] ${textSub} truncate max-w-[140px]`}>
                  ({clonedData.siteTitle || clonedData.domain})
                </span>
              </div>

              {/* View Switcher: Preview vs Code */}
              <div className={`flex items-center gap-1 ${bgInput} p-0.5 rounded-lg border ${border}`}>
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceView('preview')}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    activeWorkspaceView === 'preview' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceView('code')}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    activeWorkspaceView === 'code' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Code
                </button>
              </div>

              {/* Responsive Device Frames */}
              <div className="flex items-center gap-1">
                <div className={`flex items-center ${bgInput} p-0.5 rounded-lg border ${border}`}>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
                    title="Desktop 100%"
                  >
                    <Monitor className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-1 rounded ${previewDevice === 'tablet' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
                    title="Tablet 768px"
                  >
                    <Tablet className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
                    title="Mobile 375px"
                  >
                    <Smartphone className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
                  title="Reload"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                {historyIndex > 0 && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer ml-1"
                    title="Undo AI edit"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sandbox Frame or Code View */}
            {activeWorkspaceView === 'preview' ? (
              <div className="flex-1 bg-black/40 flex items-center justify-center p-3 overflow-auto">
                <div
                  className={`h-full bg-white transition-all duration-200 rounded-xl overflow-hidden shadow-2xl border ${border}`}
                  style={{
                    width:
                      previewDevice === 'mobile'
                        ? '375px'
                        : previewDevice === 'tablet'
                        ? '768px'
                        : '100%'
                  }}
                >
                  <iframe
                    key={previewKey}
                    title="Cloned Preview"
                    srcDoc={getIframeSrcDoc()}
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            ) : (
              /* Code Editor / Inspector */
              <div className="flex-1 flex flex-col bg-[#0b0c10] overflow-hidden font-mono text-xs">
                <div className={`h-8 px-3 border-b ${border} ${bgCard} flex items-center justify-between`}>
                  <div className="flex items-center gap-1">
                    {(['index.html', 'style.css', 'script.js', 'README.md'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveCodeTab(tab)}
                        className={`px-2.5 py-1 rounded text-[11px] cursor-pointer ${
                          activeCodeTab === tab ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(activeCodeTab)}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedTab === activeCodeTab ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTab === activeCodeTab ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <div className="flex-1 p-3 overflow-auto text-zinc-300">
                  <pre className="whitespace-pre-wrap break-all leading-relaxed">
                    {clonedData.files[activeCodeTab]}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Website Editor Assistant (~360px) */}
          <div className="w-full lg:w-96 flex flex-col shrink-0 bg-[#0c0d12] border-t lg:border-t-0 border-[#1e202a]">
            {/* AI Header */}
            <div className={`h-10 px-3.5 border-b ${border} ${bgCard} flex items-center justify-between text-xs shrink-0 select-none`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                <span className="font-bold text-white text-xs">AI Website Editor</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                Rev {historyIndex + 1}/{history.length}
              </span>
            </div>

            {/* AI Messages & Quick Presets Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
              {aiMessageLog.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-zinc-800 text-white ml-2'
                      : 'bg-[#15161f] border border-[#232532] text-zinc-300 mr-2 shadow-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              ))}

              {isAiEditing && (
                <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-zinc-300 text-xs flex items-center gap-2 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{aiEditStatus || 'Modifying website components...'}</span>
                </div>
              )}

              {/* Quick AI Action Suggestions */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                  Quick Prompts:
                </span>
                <div className="flex flex-col gap-1">
                  {[
                    'Switch to dark obsidian theme with clean cards',
                    'Modernize hero typography and CTA button',
                    'Make all buttons pill-shaped with smooth hover effects',
                    'Add a clean testimonials section to the page'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAiEdit(preset)}
                      disabled={isAiEditing}
                      className="text-left px-2.5 py-1.5 rounded-lg bg-[#141620] hover:bg-zinc-800 text-zinc-400 hover:text-white text-[11px] border border-[#222432] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Prompt Input Bar */}
            <div className={`p-2.5 border-t ${border} ${bgCard} space-y-2 shrink-0`}>
              <div className="flex items-center gap-1.5 bg-[#15161f] border border-[#232532] rounded-xl px-2.5 py-1.5">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAiEdit();
                  }}
                  placeholder="Ask AI to modify copy, colors, sections..."
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => handleAiEdit()}
                  disabled={isAiEditing || !aiPrompt.trim()}
                  className="p-1 rounded-lg bg-white text-black hover:bg-zinc-200 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                  title="Send modification to AI"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>

              {/* Export ZIP and Open in Codex actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportZip}
                  disabled={isExportingZip}
                  className="flex-1 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FolderDown className="w-3.5 h-3.5" />
                  <span>Download ZIP</span>
                </button>

                {onOpenInCodex && (
                  <button
                    type="button"
                    onClick={() => onOpenInCodex(clonedData.files)}
                    className="flex-1 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Open in Codex</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Hero State */
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="max-w-md text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white flex items-center justify-center mx-auto shadow-xl">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className={`text-lg font-bold ${textBright}`}>
              High-Fidelity Web Cloner & AI Editor
            </h3>
            <p className={`text-xs ${textSub} leading-relaxed`}>
              Enter any target URL above or select a sample. The engine clones the full DOM, inlines styles, cleans tracking telemetry, and lets you edit the website live with our AI chat.
            </p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-white text-black text-xs font-bold px-4 py-2 rounded-xl shadow-2xl z-50 animate-fade-in flex items-center gap-2">
          <Check className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default WebClonerTool;
