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
  PackageCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppTheme } from '../../context/ThemeContext';
import { AppSettings, UserProfile } from '../../types';
import FileManagerTool from './FileManagerTool';
import WebToNativeTool from './WebToNativeTool';

interface ToolsStudioViewProps {
  onClose?: () => void;
  settings?: AppSettings;
  userProfile?: UserProfile | null;
  initialTool?: 'overview' | 'file-manager' | 'url-to-app';
}

export const ToolsStudioView: React.FC<ToolsStudioViewProps> = ({
  onClose,
  settings,
  userProfile,
  initialTool = 'overview'
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  const [activeTool, setActiveTool] = useState<'overview' | 'file-manager' | 'url-to-app'>(initialTool);

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
      <header className={`h-14 px-4 sm:px-6 border-b ${border} ${bgHeader} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-3">
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

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d97757]/15 border border-[#d97757]/30 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-[#d97757]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm sm:text-base font-extrabold ${textBright}`}>Sapphire Tools Suite</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d97757]/15 text-[#d97757] font-bold">
                  2 READY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-xl p-0.5 border border-zinc-500/20 text-xs">
          <button
            type="button"
            onClick={() => setActiveTool('overview')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTool === 'overview' ? 'bg-[#d97757] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Tools
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('file-manager')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'file-manager' ? 'bg-[#d97757] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">File Manager</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('url-to-app')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'url-to-app' ? 'bg-[#d97757] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Url to App</span>
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#d97757]/20 text-[#d97757]">
                  Developer & Productivity Suite
                </span>
                <h1 className={`text-2xl sm:text-3xl font-black ${textBright}`}>
                  Professional Tools & Native Compilers
                </h1>
                <p className={`text-xs sm:text-sm ${textSub} leading-relaxed pt-1`}>
                  Integrated utility suite built directly into Sapphire. Manage laptop files with AI refactoring and live disk synchronization, or convert any web application into native Windows (.exe) and Android (.apk) packages.
                </p>
              </div>
            </div>

            {/* Ready Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tool 1 Card: Sapphire File Commander */}
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
                        LIVE DISK
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400">
                        AI MODIFIER
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-lg font-extrabold ${textBright} mb-1`}>
                      Sapphire File Commander (File Manager)
                    </h3>
                    <p className={`text-xs ${textSub} leading-relaxed`}>
                      Connect to your laptop directory (Desktop, Documents, Downloads, or code projects). Edit files directly on your disk, rename, change formats (CSV to JSON, Markdown to HTML), or command AI to rewrite and refactor files with live hard-drive writes.
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-zinc-400 pt-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Direct read/write access via File System Access API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>AI-powered format converter, refactorer, and renamer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Live file explorer with instant disk synchronization</span>
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

              {/* Tool 2 Card: WebToNative Studio */}
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400">
                        WEBVIEW2 EXE
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                        ANDROID APK
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-lg font-extrabold ${textBright} mb-1`}>
                      WebToNative Studio (Url to App)
                    </h3>
                    <p className={`text-xs ${textSub} leading-relaxed`}>
                      Convert any website URL into a standalone, native Windows executable (<code className="font-mono text-amber-400">.exe</code>) with WebView2 runtime, AppUserModelID taskbar isolation, and binary byte patching, or assemble a valid signed Android package (<code className="font-mono text-emerald-400">.apk</code>).
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-zinc-400 pt-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Native Win32 desktop window (no browser flags / --app=)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Isolated Taskbar process identity & zero registry touches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Android APK with Dalvik DEX bytecode & signed archive</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTool('url-to-app')}
                  className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <span>Launch WebToNative Studio</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </motion.div>
            </div>
          </div>
        )}

        {/* Tool 1 Active View */}
        {activeTool === 'file-manager' && (
          <FileManagerTool settings={settings} userProfile={userProfile} />
        )}

        {/* Tool 2 Active View */}
        {activeTool === 'url-to-app' && (
          <WebToNativeTool />
        )}
      </div>
    </div>
  );
};

export default ToolsStudioView;
