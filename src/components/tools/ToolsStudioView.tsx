import React, { useState } from 'react';
import {
  Wrench,
  Globe,
  ChevronLeft,
  Zap,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppTheme } from '../../context/ThemeContext';
import { AppSettings, UserProfile } from '../../types';
import WebToNativeTool from './WebToNativeTool';
import WebClonerTool from './WebClonerTool';
import PromptGeneratorTool from './PromptGeneratorTool';

export type ToolTab = 'overview' | 'web-cloner' | 'url-to-app' | 'prompt-generator';

interface ToolsStudioViewProps {
  onClose?: () => void;
  settings?: AppSettings;
  userProfile?: UserProfile | null;
  initialTool?: ToolTab;
  onOpenInCodex?: (files: Record<string, string>) => void;
  onSendToChat?: (text: string) => void;
}

export const ToolsStudioView: React.FC<ToolsStudioViewProps> = ({
  onClose,
  initialTool = 'overview',
  onOpenInCodex,
  onSendToChat,
  settings,
  userProfile
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  const [activeTool, setActiveTool] = useState<ToolTab>(initialTool);

  // Exact theme matches from chat
  const bgMain = isMoon ? 'bg-[#151515]' : 'bg-[#f8fafc]';
  const bgHeader = isMoon ? 'bg-[#111111]' : 'bg-white';
  const bgCard = isMoon ? 'bg-[#20201f]' : 'bg-white';
  const border = isMoon ? 'border-[#2b2b2a]' : 'border-[#e2e8f0]';
  const textBright = isMoon ? 'text-white' : 'text-slate-900';
  const textSub = isMoon ? 'text-[#a3a3a3]' : 'text-slate-500';
  const hoverBg = isMoon ? 'hover:bg-[#1f1f1e]' : 'hover:bg-slate-100';

  const tabActiveCls = isMoon
    ? 'bg-[#20201f] text-[#d97757] border border-[#2b2b2a] shadow-xs font-bold'
    : 'bg-white text-[#d97757] border border-slate-200 shadow-xs font-bold';

  const tabInactiveCls = isMoon
    ? 'text-[#a3a3a3] hover:text-white'
    : 'text-slate-600 hover:text-slate-900';

  const toolsList: { id: ToolTab; name: string; tag: string; desc: string; icon: any }[] = [
    {
      id: 'web-cloner',
      name: 'Ultra Web Cloner & AI Editor',
      tag: 'Scraper + AI Editor',
      desc: 'High-fidelity website scraper with tracker purging, live sandbox, and real-time AI chat editor.',
      icon: Zap
    },
    {
      id: 'url-to-app',
      name: 'Url to App (.exe & APK)',
      tag: 'Windows & Android',
      desc: 'Instant autoguess logo and title, building standalone Windows and Android WebAPK packages.',
      icon: Globe
    },
    {
      id: 'prompt-generator',
      name: 'Structured Prompt Studio',
      tag: 'Prompt Architect',
      desc: 'Precision prompt generator with engineering constraints, persona controls, and 1-click execution.',
      icon: Sparkles
    }
  ];

  return (
    <div className={`h-full w-full flex flex-col ${bgMain} ${isMoon ? 'text-zinc-100' : 'text-zinc-800'} overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]`}>
      {/* Top Header */}
      <header className={`h-13 px-3 sm:px-6 border-b ${border} ${bgHeader} flex items-center justify-between shrink-0 gap-2`}>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 sm:p-2 rounded-xl ${textSub} ${hoverBg} transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold`}
              title="Back to Sapphire"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#20201f] text-[#d97757] border border-[#2b2b2a] flex items-center justify-center shadow-xs">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <span className={`text-xs sm:text-sm font-bold ${textBright}`}>Sapphire Tools Studio</span>
          </div>
        </div>

        {/* Tab Switcher (Monochrome/Coral, Matches Chat Exactly) */}
        <div className={`flex items-center ${isMoon ? 'bg-[#181818]' : 'bg-slate-100'} rounded-xl p-0.5 border ${border} text-xs overflow-x-auto max-w-[70%] sm:max-w-none`}>
          <button
            type="button"
            onClick={() => setActiveTool('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              activeTool === 'overview' ? tabActiveCls : tabInactiveCls
            }`}
          >
            All Tools
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('web-cloner')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTool === 'web-cloner' ? tabActiveCls : tabInactiveCls
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#d97757]" />
            <span>Web Cloner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('url-to-app')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTool === 'url-to-app' ? tabActiveCls : tabInactiveCls
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#d97757]" />
            <span>URL to App</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('prompt-generator')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTool === 'prompt-generator' ? tabActiveCls : tabInactiveCls
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d97757]" />
            <span>Prompt Builder</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTool === 'overview' ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full w-full overflow-y-auto p-4 sm:p-8"
            >
              <div className="max-w-5xl mx-auto space-y-6">
                <div>
                  <h1 className={`text-xl sm:text-2xl font-bold ${textBright} tracking-tight`}>
                    Developer Suite
                  </h1>
                  <p className={`text-xs sm:text-sm ${textSub} mt-1`}>
                    Essential utilities built for zero-lag workflow: website cloning with AI editing, native app packaging, and structured prompt engineering.
                  </p>
                </div>

                {/* 3 Core Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {toolsList.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        className={`group p-5 rounded-2xl border ${border} ${bgCard} hover:border-[#d97757]/60 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-[#181818] text-[#d97757] border border-[#2b2b2a] flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-[#d97757]/10 text-[#d97757] border border-[#d97757]/20">
                              {tool.tag}
                            </span>
                          </div>
                          <div>
                            <h3 className={`text-sm sm:text-base font-bold ${textBright} group-hover:text-[#d97757] transition-colors`}>
                              {tool.name}
                            </h3>
                            <p className={`text-xs ${textSub} mt-1 leading-relaxed`}>
                              {tool.desc}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-inherit flex items-center justify-between text-xs font-semibold text-[#d97757]">
                          <span>Launch Tool</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : activeTool === 'web-cloner' ? (
            <motion.div
              key="web-cloner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full w-full overflow-hidden"
            >
              <WebClonerTool
                settings={settings}
                userProfile={userProfile}
                onOpenInCodex={onOpenInCodex}
              />
            </motion.div>
          ) : activeTool === 'url-to-app' ? (
            <motion.div
              key="url-to-app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full w-full overflow-hidden"
            >
              <WebToNativeTool />
            </motion.div>
          ) : (
            <motion.div
              key="prompt-generator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full w-full overflow-hidden"
            >
              <PromptGeneratorTool
                settings={settings}
                userProfile={userProfile}
                onSendToChat={(prompt) => {
                  if (onSendToChat) {
                    onSendToChat(prompt);
                  }
                  if (onClose) onClose();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ToolsStudioView;
