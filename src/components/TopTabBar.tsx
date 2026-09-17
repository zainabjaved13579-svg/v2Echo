import React from 'react';
import {
  Sparkles,
  MessageSquare,
  Plus,
  Menu,
  ChevronRight,
  Compass,
  User as UserIcon
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import { ECHO_LOGO_URL } from '../data/constants';

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
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
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
  isSidebarOpen,
  userProfile,
  onOpenProfile
}) => {
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const displayName = userProfile?.name && userProfile.name !== 'Guest User' ? userProfile.name : 'Profile';
  const avatarUrl = userProfile?.avatar;

  return (
    <div className="h-11 sm:h-12 bg-white/95 border-b border-slate-200/80 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-30 select-none backdrop-blur-md">
      {/* Left side: Navigation / Home Button */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Sidebar Toggle */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer ${
              isSidebarOpen ? 'bg-slate-100 text-indigo-600' : ''
            }`}
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* "Into the Unknown" / Home Pill */}
        <button
          type="button"
          onClick={onSelectStartingScreen}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            isStartingScreen
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Return to 'Into the Unknown' Home"
        >
          <img
            src={ECHO_LOGO_URL}
            alt="Echo AI"
            className="w-4 h-4 rounded-md object-contain shrink-0"
          />
          <span>Into the Unknown</span>
          {isStartingScreen && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse shrink-0" />
          )}
        </button>

        {/* Current Active Conversation Pill (if not on starting screen) */}
        {!isStartingScreen && currentSession && (
          <div className="flex items-center gap-1.5 min-w-0 max-w-[180px] sm:max-w-[280px] md:max-w-[400px]">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700 truncate shadow-2xs">
              <MessageSquare className="w-3 h-3 text-indigo-600 shrink-0" />
              <span className="truncate">{currentSession.title || 'Conversation'}</span>
            </div>

            {/* Quick New Chat Button */}
            <button
              type="button"
              onClick={onNewChat}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0 cursor-pointer"
              title="Start New Chat"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right side: User Profile (Placed professionally in the top tab bar!) */}
      {onOpenProfile && (
        <button
          type="button"
          onClick={onOpenProfile}
          id="tab-user-profile-btn"
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/90 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs active:scale-97 group shrink-0"
          title="User Profile & Character Settings"
        >
          <div className="relative">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate max-w-[90px] sm:max-w-[130px]">
              {displayName}
            </span>
            <span className="text-[9px] text-slate-400 font-medium -mt-0.5">
              Echo Profile
            </span>
          </div>
        </button>
      )}
    </div>
  );
};
