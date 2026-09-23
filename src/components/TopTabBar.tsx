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
import { SAPPHIRE_LOGO_URL } from '../data/constants';

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
    <header className="h-10 bg-[#0e0f12] border-b border-[#1f222b] px-2 sm:px-3 flex items-center justify-between gap-2 shrink-0 z-30 select-none text-[#9ca3af] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left controls: ☰, Sapphire Logo, ←, →, and Mode Toggle Pill */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sidebar Toggle / Hamburger */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            id="tab-toggle-sidebar-btn"
            className="p-1 hover:text-[#edeef2] rounded-lg transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Sapphire Brand Logo (Square with soft rounded corners, not sharp) */}
        <button
          type="button"
          onClick={onSelectStartingScreen}
          className="flex items-center gap-1.5 hover:opacity-85 transition-opacity cursor-pointer group"
          title="Sapphire Home"
        >
          <img
            src={SAPPHIRE_LOGO_URL}
            alt="Sapphire"
            className="w-5 h-5 rounded-lg object-cover ring-1 ring-blue-500/30 shadow-xs group-hover:scale-105 transition-transform"
          />
          <span className="font-semibold text-xs text-[#f3f4f6] tracking-tight hidden sm:inline">
            Sapphire
          </span>
        </button>

        {/* Back and Forward navigation arrows */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={handlePrevSession}
            className="p-1 hover:text-[#edeef2] rounded-lg transition-colors cursor-pointer"
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextSession}
            className="p-1 hover:text-[#edeef2] rounded-lg transition-colors cursor-pointer"
            title="Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle Pill: Chat 💬 / Codex </> / Workspace */}
        <div className="flex items-center bg-[#18191e] border border-[#272a33] rounded-xl p-0.5 ml-1">
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
                ? 'bg-[#22242c] text-white shadow-2xs font-medium'
                : 'text-[#9ca3af] hover:text-[#edeef2]'
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
                ? 'bg-[#22242c] text-white shadow-2xs font-medium'
                : 'text-[#9ca3af] hover:text-[#edeef2]'
            }`}
            title="Codex (Google AI Studio Live Workbench)"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Codex Studio</span>
          </button>
        </div>
      </div>

      {/* Right controls: Profile icon, Window controls */}
      <div className="flex items-center gap-2">
        {/* Profile icon */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="p-1 text-[#9ca3af] hover:text-[#edeef2] rounded-lg transition-colors cursor-pointer"
          title="Profile & Settings"
        >
          <Ghost className="w-4 h-4" />
        </button>

        {/* Desktop window controls */}
        <div className="hidden md:flex items-center gap-2 text-[#717684] pl-2 border-l border-[#1f222b]">
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
