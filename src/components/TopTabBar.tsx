import React, { useMemo } from 'react';
import {
  Sparkles,
  MessageSquare,
  Plus,
  Menu,
  ChevronRight,
  Compass,
  Smartphone,
  X,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import { SAPPHIRE_LOGO_URL, SAPPHIRE_APP_NAME } from '../data/constants';

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
  onOpenAndroidShortcut?: () => void;
  onSignOut?: () => void;
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
  onOpenProfile,
  onOpenAndroidShortcut,
  onSignOut
}) => {
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const displayName = userProfile?.name && userProfile.name !== 'Guest User' ? userProfile.name : 'Profile';
  const avatarUrl = userProfile?.avatar;

  // Detect Android environment (via userAgent)
  const isAndroidUser = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Android/i.test(ua);
  }, []);

  return (
    <div className="h-11 sm:h-12 bg-white/95 border-b border-slate-200/80 px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-30 select-none backdrop-blur-md">
      {/* Left side: Navigation / Tabs */}
      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1 overflow-x-auto no-scrollbar">
        {/* Sidebar Toggle */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            id="tab-toggle-sidebar-btn"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Toggle Sidebar (Ctrl+B)"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* "Into the Unknown" / Home Pill */}
        <button
          type="button"
          onClick={onSelectStartingScreen}
          className={`group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            isStartingScreen
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Return to 'Into the Unknown' Home"
        >
          <img
            src={SAPPHIRE_LOGO_URL}
            alt={SAPPHIRE_APP_NAME}
            className="w-4 h-4 rounded-md object-contain shrink-0"
          />
          <span className="hidden xs:inline">Into the Unknown</span>
          {isStartingScreen && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse shrink-0" />
          )}
        </button>

        {/* Dynamic Chat Tabs list */}
        {sessions.map((sess) => {
          const isActive = !isStartingScreen && sess.id === currentSessionId;
          return (
            <div
              key={sess.id}
              onClick={() => onSelectSession(sess.id)}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border max-w-[140px] sm:max-w-[200px] ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
              }`}
              title={sess.title || 'Chat'}
            >
              <MessageSquare className={`w-3 h-3 shrink-0 ${isActive ? 'text-indigo-200' : 'text-indigo-600'}`} />
              <span className="truncate flex-1">{sess.title || 'New Chat'}</span>
              <button
                type="button"
                onClick={(e) => onCloseSession(sess.id, e)}
                className={`p-0.5 rounded transition-colors shrink-0 ${
                  isActive
                    ? 'text-indigo-200 hover:text-white hover:bg-indigo-700'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200 opacity-60 group-hover:opacity-100'
                }`}
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Quick New Chat Tab Button */}
        <button
          type="button"
          id="topbar-new-chat-btn"
          onClick={onNewChat}
          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-colors shrink-0 cursor-pointer"
          title="New Chat Tab"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Dedicated Android Shortcut Tab: Conditionally shown ONLY to Android users! */}
        {isAndroidUser && onOpenAndroidShortcut && (
          <button
            type="button"
            id="android-shortcut-tab-btn"
            onClick={onOpenAndroidShortcut}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 animate-fadeIn"
            title="Android Hardware & Navigation Bar Shortcut Settings"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Shortcut</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </button>
        )}
      </div>

      {/* Right side: User Profile & Auth */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            id="tab-user-profile-btn"
            className="flex items-center gap-2 pl-1.5 pr-2 sm:pr-2.5 py-1 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/90 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs active:scale-97 group shrink-0"
            title="User Profile & Character Settings"
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs">
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

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate max-w-[80px] sm:max-w-[120px]">
                {displayName}
              </span>
              <span className="text-[9px] text-slate-400 font-medium -mt-0.5">
                Sapphire Profile
              </span>
            </div>
          </button>
        )}

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
