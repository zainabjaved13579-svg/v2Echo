import React, { useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Menu,
  Download,
  X,
  LogOut,
  Code2,
  Folder
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import { SAPPHIRE_APP_NAME } from '../data/constants';

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
  onCloseSession,
  onNewChat,
  onToggleSidebar,
  userProfile,
  onOpenProfile,
  onSignOut,
  onOpenGetApp,
  onOpenCodex,
  onOpenWorkspace,
  activeNavTab = 'chat'
}) => {
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const displayName = userProfile?.name || 'Guest User';
  const avatarUrl = userProfile?.avatar;
  const isGuest = !userProfile?.email || userProfile?.name === 'Guest User';

  return (
    <header className="h-12 bg-black border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-30 select-none backdrop-blur-md text-slate-200">
      {/* Left side: Sidebar Toggle & Chat Name / Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto no-scrollbar">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            id="tab-toggle-sidebar-btn"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Sapphire Brand / Home */}
        <button
          type="button"
          onClick={onSelectStartingScreen}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            isStartingScreen && activeNavTab === 'chat'
              ? 'bg-slate-900 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
          title="Home"
        >
          <span className="font-bold tracking-tight text-white">{SAPPHIRE_APP_NAME}</span>
        </button>

        {/* Divider */}
        <span className="text-slate-700 hidden xs:inline">/</span>

        {/* Current Active Mode / Chat Name */}
        {activeNavTab === 'codex' ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/40 text-xs font-semibold shrink-0">
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Codex (AI Studio App Builder)</span>
          </div>
        ) : activeNavTab === 'projects' ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 text-xs font-semibold shrink-0">
            <Folder className="w-3.5 h-3.5 text-purple-400" />
            <span>Workspace Projects</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0 max-w-[180px] sm:max-w-xs truncate text-xs font-medium text-slate-300">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{currentSession?.title || 'New Session'}</span>
          </div>
        )}

        {/* Plus / New Chat */}
        <button
          type="button"
          id="topbar-new-chat-btn"
          onClick={onNewChat}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors shrink-0 cursor-pointer"
          title="New Chat"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right side: 'Get App', Profile Name, and Logout */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 'Get App' */}
        {onOpenGetApp && (
          <button
            type="button"
            onClick={onOpenGetApp}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-95"
            title="Download Sapphire App (APK & EXE)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Get App</span>
          </button>
        )}

        {/* Profile Name & Avatar */}
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            id="tab-user-profile-btn"
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer shadow-xs active:scale-97 group shrink-0"
            title="Profile & Settings"
          >
            <div className="w-6 h-6 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-xs font-bold text-slate-200">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : isGuest ? (
                'G'
              ) : (
                displayName[0]?.toUpperCase() || 'U'
              )}
            </div>
            <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate max-w-[100px] hidden sm:inline">
              {displayName}
            </span>
          </button>
        )}

        {/* Logout */}
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            title={isGuest ? 'Exit Guest Mode' : 'Logout'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

export default TopTabBar;
