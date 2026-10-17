import React, { useState } from 'react';
import {
  Wrench,
  HardDrive,
  Globe,
  Monitor,
  Smartphone,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  FileCode,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  PackageCheck,
  Zap,
  FolderDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppTheme } from '../../context/ThemeContext';
import { AppSettings, UserProfile } from '../../types';
import FileManagerTool from './FileManagerTool';
import WebToNativeTool from './WebToNativeTool';
import WebClonerTool from './WebClonerTool';
import { SAPPHIRE_LEAD_DEVELOPER } from '../../data/constants';

interface ToolsStudioViewProps {
  onClose?: () => void;
  settings?: AppSettings;
  userProfile?: UserProfile | null;
  initialTool?: 'overview' | 'file-manager' | 'url-to-app' | 'web-cloner';
  onOpenInCodex?: (files: Record<string, string>) => void;
}

export const ToolsStudioView: React.FC<ToolsStudioViewProps> = ({
  onClose,
  settings,
  userProfile,
  initialTool = 'overview',
  onOpenInCodex
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  const [activeTool, setActiveTool] = useState<'overview' | 'file-manager' | 'url-to-app' | 'web-cloner'>(initialTool);

  const bgMain = isMoon ? 'bg-[#0a0b0e]' : 'bg-[#faf9f7]';
  const bgHeader = isMoon ? 'bg-[#0e0f13]' : 'bg-white';
  const bgCard = isMoon ? 'bg-[#151722]' : 'bg-white';
  const bgSubtle = isMoon ? 'bg-[#1e202d]' : 'bg-slate-50';
  const border = isMoon ? 'border-[#292c3d]' : 'border-slate-200';
  const textBright = isMoon ? 'text-white' : 'text-slate-900';
  const textSub = isMoon ? 'text-zinc-400' : 'text-slate-600';
  const hoverBg = isMoon ? 'hover:bg-[#1a1c22]' : 'hover:bg-[#f0ede7]';

  return (
    <div className={`h-full w-full flex flex-col ${bgMain} ${isMoon ? 'text-zinc-100' : 'text-slate-800'} overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]`}>
      {/* Top Header */}
      <header className={`h-14 px-3 sm:px-6 border-b ${border} ${bgHeader} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-2 sm:gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-xl ${textSub} ${hoverBg} transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold`}
              title="Back to Sapphire AI"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs sm:text-base font-extrabold ${textBright}`}>Sapphire Tools Suite</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold hidden xs:inline">
                  3 ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-xl p-0.5 border border-zinc-500/20 text-xs overflow-x-auto max-w-[60%] sm:max-w-none">
          <button
            type="button"
            onClick={() => setActiveTool('overview')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
              activeTool === 'overview' ? 'bg-[#d97757] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('web-cloner')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTool === 'web-cloner' ? 'bg-cyan-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Web Cloner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('url-to-app')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTool === 'url-to-app' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Url to App (.exe)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('file-manager')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTool === 'file-manager' ? 'bg-[#d97757] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">File Manager</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTool === 'overview' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
            {/* Hero Card */}
            <div className={`p-6 sm:p-8 rounded-3xl border ${border} ${bgCard} shadow-sm relative overflow-hidden`}>
              <div className="max-w-2xl space-y-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30">
                  Senior Architect Suite · Lead Developer: {SAPPHIRE_LEAD_DEVELOPER}
                </span>
                <h1 className={`text-2xl sm:text-3xl font-black ${textBright}`}>
                  Professional Engineering & Native Compilers
                </h1>
                <p className={`text-xs sm:text-sm ${textSub} leading-relaxed pt-1`}>
                  Integrated utility suite built directly into Sapphire. Clone any website with deep asset harvesting, convert web applications into standalone Windows (.exe) binaries with 0% antivirus warnings, or command your local user directories with disk synchronization.
                </p>
              </div>
            </div>

            {/* Ready Tools Grid (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tool 1 Card: Ultra Web Cloner */}
              <motion.div
                whileHover={{ y: -3 }}
                className={`p-6 rounded-3xl border ${border} ${bgCard} shadow-sm flex flex-col justify-between space-y-5 hover:border-cyan-500/50 transition-all`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        ULTRA FIDELITY
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-lg font-extrabold ${textBright} mb-1`}>
                      Ultra Web Cloner
                    </h3>
                    <p className={`text-xs ${textSub} leading-relaxed`}>
                      Clone any website URL into clean, modern, tracker-free code. Extracts HTML, bundles external stylesheets into <code className="font-mono text-cyan-400">style.css</code>, purges tracking telemetry, and provides multi-device live preview and instant ZIP export.
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-zinc-400 pt-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Deep CSS & asset harvesting with resolved relative URLs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Live responsive simulator: Desktop, Laptop, Tablet, Mobile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>1-click Standalone ZIP Export + Direct Codex Import</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTool('web-cloner')}
                  className="w-full py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <span>Launch Web Cloner</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </motion.div>

              {/* Tool 2 Card: WebToNative Studio (Url to App .exe) */}
              <motion.div
                whileHover={{ y: -3 }}
                className={`p-6 rounded-3xl border ${border} ${bgCard} shadow-sm flex flex-col justify-between space-y-5 hover:border-blue-500/50 transition-all`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        INSTANT .EXE
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        0% VIRUS WARNING
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-lg font-extrabold ${textBright} mb-1`}>
                      WebToNative Studio (Url to App)
                    </h3>
                    <p className={`text-xs ${textSub} leading-relaxed`}>
                      Generate real standalone Windows executables (<code className="font-mono text-blue-400">.exe</code>) in under 1 second! Includes embedded site favicon, WebView2 runtime isolation, and authentic Win32 headers.
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-zinc-400 pt-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Direct Standalone .EXE download + Safe Bundle (.zip)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Zero SmartScreen false positives guarantee with unlock guide</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ultra-fast generation engine with sub-second packaging</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTool('url-to-app')}
                  className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <span>Launch Url to App (.exe)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </motion.div>

              {/* Tool 3 Card: Sapphire File Commander */}
              <motion.div
                whileHover={{ y: -3 }}
                className={`p-6 rounded-3xl border ${border} ${bgCard} shadow-sm flex flex-col justify-between space-y-5 hover:border-[#d97757]/50 transition-all`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#d97757]/15 text-[#d97757] flex items-center justify-center">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                        C:\USERS READY
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-lg font-extrabold ${textBright} mb-1`}>
                      Sapphire File Commander
                    </h3>
                    <p className={`text-xs ${textSub} leading-relaxed`}>
                      Mount your laptop directory (Desktop, Documents, Downloads, or user folders). Open entire directories recursively and set them as default workspace with direct hard-drive read/writes.
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-zinc-400 pt-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Open entire folders (Infinite - Personal / C:\Users)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Set as Default Workspace with persistent memory</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Senior AI refactoring & multi-format conversion</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTool('file-manager')}
                  className="w-full py-3 px-4 rounded-2xl bg-[#d97757] hover:bg-[#c86949] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#d97757]/20 transition-all cursor-pointer active:scale-95"
                >
                  <span>Launch File Commander</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </motion.div>
            </div>
          </div>
        )}

        {/* Tool 1 Active View: Web Cloner */}
        {activeTool === 'web-cloner' && (
          <WebClonerTool onOpenInCodex={onOpenInCodex} />
        )}

        {/* Tool 2 Active View: Url to App */}
        {activeTool === 'url-to-app' && (
          <WebToNativeTool />
        )}

        {/* Tool 3 Active View: File Manager */}
        {activeTool === 'file-manager' && (
          <FileManagerTool settings={settings} userProfile={userProfile} />
        )}
      </div>
    </div>
  );
};

export default ToolsStudioView;
