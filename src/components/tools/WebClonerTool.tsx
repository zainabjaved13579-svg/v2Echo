import React, { useState } from 'react';
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
  Maximize2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Zap,
  ShieldCheck,
  FolderDown,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppTheme } from '../../context/ThemeContext';
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
  stats: {
    durationMs: number;
    htmlBytes: number;
    cssBytes: number;
    jsBytes: number;
    stylesheetsHarvested: number;
    scriptsHarvested: number;
  };
}

const PRESET_SITES = [
  { name: 'Linear App', url: 'https://linear.app' },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com' },
  { name: 'Stripe', url: 'https://stripe.com' },
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

  // Preview & Code State
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('desktop');
  const [activeCodeTab, setActiveCodeTab] = useState<'index.html' | 'style.css' | 'script.js' | 'README.md'>('index.html');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  // Theme Tokens
  const bgMain = isMoon ? 'bg-[#0a0b0e]' : 'bg-[#faf9f7]';
  const bgCard = isMoon ? 'bg-[#151722]' : 'bg-white';
  const bgSubtle = isMoon ? 'bg-[#1e202d]' : 'bg-slate-50';
  const border = isMoon ? 'border-[#292c3d]' : 'border-slate-200';
  const textBright = isMoon ? 'text-white' : 'text-slate-900';
  const textSub = isMoon ? 'text-zinc-400' : 'text-slate-600';

  const handleStartClone = async (overrideUrl?: string) => {
    const target = (overrideUrl || inputUrl).trim();
    if (!target) {
      setErrorMsg('Please enter a website URL to clone.');
      return;
    }

    setIsCloning(true);
    setErrorMsg(null);
    setCloneStage('Connecting to target host & analyzing DOM structure...');

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

      setCloneStage('Harvesting stylesheets, inlining assets & cleaning trackers...');
      const data: ClonedResult = await res.json();

      setClonedData(data);
      setPreviewKey((k) => k + 1);
    } catch (err: any) {
      console.error('Clone failed:', err);
      setErrorMsg(err.message || 'Could not clone target website. Please check URL.');
    } finally {
      setIsCloning(false);
      setCloneStage('');
    }
  };

  const handleCopyCode = (filename: keyof ClonedResult['files']) => {
    if (!clonedData) return;
    const content = clonedData.files[filename];
    navigator.clipboard.writeText(content);
    setCopiedTab(filename);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleExportZip = async () => {
    if (!clonedData) return;
    setIsExportingZip(true);
    try {
      const res = await fetch('/api/tools/web-clone/export-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: clonedData.files,
          siteTitle: clonedData.siteTitle || clonedData.domain
        })
      });

      if (!res.ok) throw new Error('Failed to generate zip archive');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(clonedData.siteTitle || clonedData.domain).replace(/[^a-zA-Z0-9_-]/g, '_')}-ClonedWebsite.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err: any) {
      alert(err.message || 'ZIP export failed');
    } finally {
      setIsExportingZip(false);
    }
  };

  const getDeviceWidth = () => {
    switch (previewDevice) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      case 'laptop': return 'max-w-[1024px]';
      default: return 'w-full';
    }
  };

  // Build standalone iframe HTML srcDoc with CSS and JS injected
  const getIframeSrcDoc = () => {
    if (!clonedData) return '';
    const { 'index.html': html, 'style.css': css, 'script.js': js } = clonedData.files;
    let doc = html;
    // Replace link style.css with real inline style for instant sandbox rendering
    if (doc.includes('<link rel="stylesheet" href="style.css">')) {
      doc = doc.replace('<link rel="stylesheet" href="style.css">', `<style>\n${css}\n</style>`);
    } else if (doc.includes('</head>')) {
      doc = doc.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
    }
    // Inject JS into sandbox
    if (doc.includes('<script src="script.js" defer></script>')) {
      doc = doc.replace('<script src="script.js" defer></script>', `<script>\n${js}\n</script>`);
    } else if (doc.includes('</body>')) {
      doc = doc.replace('</body>', `<script>\n${js}\n</script>\n</body>`);
    }
    return doc;
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${bgMain} font-['Plus_Jakarta_Sans',sans-serif]`}>
      {/* Top Banner & Control Bar */}
      <div className={`px-4 sm:px-6 py-4 border-b ${border} ${bgCard} shrink-0`}>
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-base sm:text-lg font-black ${textBright}`}>
                    Sapphire Ultra Web Cloner
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    High Fidelity
                  </span>
                </div>
                <p className={`text-xs ${textSub}`}>
                  Deep DOM harvesting, unified CSS bundle, tracker-purged JS & instant ZIP export · Lead Architect: <span className="font-bold text-cyan-400">{SAPPHIRE_LEAD_DEVELOPER}</span>
                </p>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className={`text-[11px] font-bold ${textSub} shrink-0 mr-1`}>Try Sample:</span>
              {PRESET_SITES.map((site) => (
                <button
                  key={site.name}
                  type="button"
                  onClick={() => {
                    setInputUrl(site.url);
                    handleStartClone(site.url);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${bgSubtle} ${border} border ${textSub} hover:${textBright} hover:border-cyan-500/40 transition-all shrink-0 cursor-pointer`}
                >
                  {site.name}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl border ${border} ${bgSubtle} focus-within:border-cyan-500 transition-all`}>
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartClone()}
                placeholder="Enter any website URL to clone (e.g., https://linear.app)"
                className={`w-full bg-transparent text-xs sm:text-sm font-medium ${textBright} focus:outline-none placeholder:text-zinc-500`}
              />
            </div>

            <button
              type="button"
              onClick={() => handleStartClone()}
              disabled={isCloning}
              className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isCloning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cloning Deep Assets...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Clone Website Now</span>
                </>
              )}
            </button>
          </div>

          {/* Progress / Error Feedback */}
          {isCloning && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2 text-xs text-cyan-300"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{cloneStage}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Workspace (Preview & Code) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {clonedData ? (
          <>
            {/* Left / Top: Interactive Live Preview */}
            <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-500/20 overflow-hidden bg-black/5 dark:bg-black/30">
              {/* Preview Bar */}
              <div className={`h-11 px-4 border-b ${border} ${bgCard} flex items-center justify-between shrink-0 text-xs`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Live Cloned Preview</span>
                  </span>
                  <span className={`text-[10px] font-medium ${textSub} hidden sm:inline`}>
                    ({clonedData.siteTitle || clonedData.domain})
                  </span>
                </div>

                {/* Device Switcher */}
                <div className="flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-zinc-500/20">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg transition-all ${
                      previewDevice === 'desktop' ? 'bg-cyan-500 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Desktop (100%)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('laptop')}
                    className={`p-1.5 rounded-lg transition-all ${
                      previewDevice === 'laptop' ? 'bg-cyan-500 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Laptop (1024px)"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-1.5 rounded-lg transition-all ${
                      previewDevice === 'tablet' ? 'bg-cyan-500 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Tablet (768px)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg transition-all ${
                      previewDevice === 'mobile' ? 'bg-cyan-500 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Mobile (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-all ml-1 border-l border-zinc-500/20"
                    title="Reload Sandbox"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Viewport Frame */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                <div className={`h-full ${getDeviceWidth()} transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border ${border} bg-white flex flex-col`}>
                  <iframe
                    key={previewKey}
                    title="Cloned Preview Sandbox"
                    srcDoc={getIframeSrcDoc()}
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            </div>

            {/* Right / Bottom: Extracted Clean Code Inspector & Actions */}
            <div className="w-full lg:w-[480px] xl:w-[540px] flex flex-col overflow-hidden bg-black/10 dark:bg-black/50">
              {/* Code Tabs Header */}
              <div className={`h-11 px-3 border-b ${border} ${bgCard} flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold">
                  {(['index.html', 'style.css', 'script.js', 'README.md'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveCodeTab(tab)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeCodeTab === tab
                          ? 'bg-cyan-500 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(activeCodeTab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${bgSubtle} ${border} border text-zinc-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer`}
                    title="Copy File Code"
                  >
                    {copiedTab === activeCodeTab ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Content */}
              <div className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed text-zinc-300 bg-[#0d0e15] select-text">
                <pre className="whitespace-pre-wrap break-all">
                  {clonedData.files[activeCodeTab]}
                </pre>
              </div>

              {/* Bottom Actions Bar */}
              <div className={`p-3 border-t ${border} ${bgCard} flex items-center gap-2.5 shrink-0`}>
                <button
                  type="button"
                  onClick={handleExportZip}
                  disabled={isExportingZip}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <FolderDown className="w-4 h-4" />
                  <span>{isExportingZip ? 'Packaging ZIP...' : 'Download Clean ZIP'}</span>
                </button>

                {onOpenInCodex && (
                  <button
                    type="button"
                    onClick={() => onOpenInCodex(clonedData.files)}
                    className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer active:scale-95"
                    title="Edit and code this site in Codex Studio"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Open in Codex</span>
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty / Hero State */
          <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
            <div className="max-w-md text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/10">
                <Globe className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className={`text-xl font-black ${textBright}`}>
                  Ultra High-Fidelity Web Cloning
                </h3>
                <p className={`text-xs sm:text-sm ${textSub} leading-relaxed`}>
                  Enter any website URL above or click one of the quick presets. Sapphire will extract the full DOM, resolve all remote stylesheets, purge tracking telemetry, and provide live responsive preview and clean ZIP download!
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Tracker Purged
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Sub-Second Scrape
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5" /> Multi-File Bundle
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebClonerTool;
