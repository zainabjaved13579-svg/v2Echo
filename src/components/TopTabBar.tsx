import React from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Code2,
  Ghost,
  Minus,
  Square,
  X
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';

interface TopTabBarProps {
  isStartingScreen: boolean;
  onSelectStartingScreen: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onCloseSession: (id: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  userProfile?: UserProfile | null;
  onOpenProfile?: () => void;
  onOpenAndroidShortcut?: () => void;
  onSignOut?: () => void;
  onOpenGetApp?: () => void;
  onOpenCodex?: () => void;
  onOpenWorkspace?: () => void;
  activeNavTab?: string;
}

export const TopTabBar: React.FC<TopTabBarProps> = ({
  isStartingScreen,
  onSelectStartingScreen,
  sessions,
  currentSessionId,
  onSelectSession,
  onToggleSidebar,
  userProfile,
  onOpenProfile,
  onOpenGetApp,
  onOpenCodex,
  onOpenWorkspace,
  activeNavTab = 'chat'
}) => {
  const currentSessionIndex = sessions.findIndex((s) => s.id === currentSessionId);

  const handlePrevSession = () => {
    if (currentSessionIndex > 0) {
      onSelectSession(sessions[currentSessionIndex - 1].id);
    } else if (sessions.length > 0) {
      onSelectStartingScreen();
    }
  };

  const handleNextSession = () => {
    if (currentSessionIndex >= 0 && currentSessionIndex < sessions.length - 1) {
      onSelectSession(sessions[currentSessionIndex + 1].id);
    }
  };

  return (
    <header className="h-10 bg-[#191817] border-b border-[#262422] px-2 sm:px-3 flex items-center justify-between gap-2 shrink-0 z-30 select-none text-[#a19e97] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left controls: ☰, ◫, ←, →, and Mode Toggle Pill (💬 / </>) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sidebar Toggle / Hamburger */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            id="tab-toggle-sidebar-btn"
            className="p-1 hover:text-[#ede8e1] rounded-lg transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Back and Forward navigation arrows */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={handlePrevSession}
            className="p-1 hover:text-[#ede8e1] rounded-lg transition-colors cursor-pointer"
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextSession}
            className="p-1 hover:text-[#ede8e1] rounded-lg transition-colors cursor-pointer"
            title="Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle Pill: Chat 💬 / Codex </> */}
        <div className="flex items-center bg-[#201f1d] border border-[#33312e] rounded-xl p-0.5 ml-1">
          {/* Chat Mode */}
          <button
            type="button"
            onClick={() => {
              if (activeNavTab !== 'chat') {
                if (onSelectStartingScreen) onSelectStartingScreen();
              }
            }}
            className={`p-1 sm:px-2 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer ${
              activeNavTab === 'chat'
                ? 'bg-[#282724] text-[#ede8e1] shadow-2xs font-medium'
                : 'text-[#a19e97] hover:text-[#ede8e1]'
            }`}
            title="Chat Mode"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Chat</span>
          </button>

          {/* Codex Mode (Google AI Studio) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenCodex) onOpenCodex();
            }}
            className={`p-1 sm:px-2 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer ${
              activeNavTab === 'codex'
                ? 'bg-[#282724] text-[#ede8e1] shadow-2xs font-medium'
                : 'text-[#a19e97] hover:text-[#ede8e1]'
            }`}
            title="Codex (AI Studio App Builder)"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Codex</span>
          </button>
        </div>
      </div>

      {/* Center: Free plan · Upgrade pill */}
      <div className="hidden sm:flex items-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#201f1d] border border-[#33312e] text-[11px] text-[#a19e97]">
          <span>Free plan</span>
          <span>·</span>
          <button
            type="button"
            onClick={onOpenGetApp}
            className="text-[#d97757] hover:text-[#e88869] font-medium transition-colors cursor-pointer"
          >
            Upgrade
          </button>
        </div>
      </div>

      {/* Right controls: Ghost icon 👻, Window controls (—, □, ✕) */}
      <div className="flex items-center gap-2">
        {/* Ghost / Profile icon matching screenshot */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="p-1 text-[#a19e97] hover:text-[#ede8e1] rounded-lg transition-colors cursor-pointer"
          title="Profile & Settings"
        >
          <Ghost className="w-4 h-4" />
        </button>

        {/* Desktop window controls styling matching reference */}
        <div className="hidden md:flex items-center gap-2 text-[#7d7a74] pl-2 border-l border-[#262422]">
          <button
            type="button"
            className="p-1 hover:text-white transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 hover:text-white transition-colors cursor-pointer"
            title="Toggle Window"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            type="button"
            className="p-1 hover:text-rose-400 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopTabBar;
