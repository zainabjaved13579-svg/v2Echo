import React, { useState } from 'react';
import {
  Wrench,
  Globe,
  ChevronLeft,
  ArrowRight,
  Zap,
  Code2,
  Terminal,
  Search,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppTheme } from '../../context/ThemeContext';
import { AppSettings, UserProfile } from '../../types';
import WebToNativeTool from './WebToNativeTool';
import WebClonerTool from './WebClonerTool';
import { ApiTesterTool } from './ApiTesterTool';
import { RegexStudioTool } from './RegexStudioTool';
import { CodeFormatterTool } from './CodeFormatterTool';
import { SAPPHIRE_LEAD_DEVELOPER } from '../../data/constants';

type ToolTab = 'overview' | 'web-cloner' | 'url-to-app' | 'api-tester' | 'regex-studio' | 'code-formatter';

interface ToolsStudioViewProps {
  onClose?: () => void;
  settings?: AppSettings;
  userProfile?: UserProfile | null;
  initialTool?: ToolTab;
  onOpenInCodex?: (files: Record<string, string>) => void;
}

export const ToolsStudioView: React.FC<ToolsStudioViewProps> = ({
  onClose,
  initialTool = 'overview',
  onOpenInCodex
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  const [activeTool, setActiveTool] = useState<ToolTab>(initialTool);

  const bgMain = isMoon ? 'bg-[#090a0f]' : 'bg-[#faf9f7]';
  const bgHeader = isMoon ? 'bg-[#101118]' : 'bg-white';
  const bgCard = isMoon ? 'bg-[#13141c]' : 'bg-white';
  const border = isMoon ? 'border-[#222430]' : 'border-[#e5e5e0]';
  const textBright = isMoon ? 'text-white' : 'text-zinc-900';
  const textSub = isMoon ? 'text-zinc-400' : 'text-zinc-600';
  const hoverBg = isMoon ? 'hover:bg-[#1a1b24]' : 'hover:bg-[#f0ede7]';

  const tabActiveCls = isMoon
    ? 'bg-white text-black shadow-xs font-bold'
    : 'bg-zinc-900 text-white shadow-xs font-bold';

  const tabInactiveCls = isMoon
    ? 'text-zinc-400 hover:text-white'
    : 'text-zinc-600 hover:text-zinc-900';

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
      tag: 'Windows / Android',
      desc: 'Instant autoguess logo and name, building standalone Windows and Android WebAPK packages.',
      icon: Globe
    },
    {
      id: 'api-tester',
      name: 'API Tester',
      tag: 'REST Client',
      desc: 'Execute real HTTP requests (GET, POST, PUT, DELETE) with custom headers, params, and body.',
      icon: Terminal
    },
    {
      id: 'regex-studio',
      name: 'Regex Studio',
      tag: 'Evaluator',
      desc: 'Real-time regular expression tester with syntax flags, match span highlights, and replace playground.',
      icon: Search
    },
    {
      id: 'code-formatter',
      name: 'Code Formatter',
      tag: 'Beautifier',
      desc: 'Instant in-browser beautifier and minifier for JSON, HTML, CSS, JavaScript, and SQL.',
      icon: Code2
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
            <div className="w-7 h-7 rounded-lg bg-zinc-800 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <span className={`text-xs sm:text-sm font-bold ${textBright} hidden xs:inline`}>Developer Suite</span>
          </div>
        </div>

        {/* Tab Switcher (Clean, Monochrome, No Blue) */}
        <div className={`flex items-center ${isMoon ? 'bg-[#171822]' : 'bg-[#eeece8]'} rounded-xl p-0.5 border ${border} text-xs overflow-x-auto max-w-[70%] sm:max-w-none`}>
          <button
            type="button"
            onClick={() => setActiveTool('overview')}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              activeTool === 'overview' ? tabActiveCls : tabInactiveCls
            }`}
          >
            All Tools
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('web-cloner')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTool === 'web-cloner' ? tabActiveCls : tabInactiveCls
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Web Cloner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('url-to-app')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTool === 'url-to-app' ? tabActiveCls : tabInactiveCls
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Url to App</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('api-tester')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTool === 'api-tester' ? tabActiveCls : tabInactiveCls
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>API Tester</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('regex-studio')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTool === 'regex-studio' ? tabActiveCls : tabInactiveCls
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Regex</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('code-formatter')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTool === 'code-formatter' ? tabActiveCls : tabInactiveCls
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Formatter</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTool === 'overview' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${textBright}`}>
                  Professional Developer Suite
                </h1>
                <p className={`text-xs ${textSub} pt-0.5`}>
                  High-performance utilities built for speed. Developed by {SAPPHIRE_LEAD_DEVELOPER}.
                </p>
              </div>
            </div>

            {/* Compact Tool Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {toolsList.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <motion.div
                    key={tool.id}
                    whileHover={{ y: -2 }}
                    className={`p-5 rounded-2xl border ${border} ${bgCard} shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-600 transition-all`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center border border-zinc-700/60">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                          {tool.tag}
                        </span>
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${textBright}`}>
                          {tool.name}
                        </h3>
                        <p className={`text-xs ${textSub} leading-relaxed pt-1`}>
                          {tool.desc}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTool(tool.id)}
                      className={`w-full py-2 px-3 rounded-xl ${
                        isMoon ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                      } text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer`}
                    >
                      <span>Open Tool</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tool Views */}
        {activeTool === 'web-cloner' && (
          <WebClonerTool onOpenInCodex={onOpenInCodex} />
        )}

        {activeTool === 'url-to-app' && (
          <WebToNativeTool />
        )}

        {activeTool === 'api-tester' && (
          <ApiTesterTool />
        )}

        {activeTool === 'regex-studio' && (
          <RegexStudioTool />
        )}

        {activeTool === 'code-formatter' && (
          <CodeFormatterTool />
        )}
      </div>
    </div>
  );
};

export default ToolsStudioView;
