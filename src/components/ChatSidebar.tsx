import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Sliders,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
  Edit2,
  Check,
  X,
  Bot,
  Code2,
  Smartphone,
  Info,
  MessageSquare,
  PanelRightOpen
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import { SAPPHIRE_LOGO_URL } from '../data/constants';
import { useAppTheme } from '../context/ThemeContext';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  onOpenAbout?: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  userProfile?: UserProfile | null;
  onOpenProfile?: () => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAllSessions: () => void;
  onOpenSettings: () => void;
  onOpenFileManager?: () => void;
  onOpenFileWorkspace?: () => void;
  onOpenGetApp?: () => void;
  onOpenCodex?: () => void;
  onOpenProjects?: () => void;
  onOpenArtifacts?: () => void;
  onOpenCustomize?: () => void;
  onOpenImageGen?: () => void;
  activeNavTab?: string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  onOpenAbout,
  sessions,
  currentSessionId,
  userProfile,
  onOpenProfile,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onOpenSettings,
  onOpenGetApp,
  onOpenCodex,
  onOpenCustomize,
  activeNavTab = 'chat'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(id);
  };

  const { theme } = useAppTheme();
  const userName = userProfile?.name || 'Guest';
  const initial = userName.charAt(0).toUpperCase();
  const isMoon = theme === 'moon';

  // === Theme Colors (CodexWorkspaceView style) ===
  const bgSidebar = isMoon ? 'bg-[#1a1a1a]' : 'bg-[#f0ebe2]';
  const bgCard = isMoon ? 'bg-[#1e1e1e]' : 'bg-white';
  const bgHover = isMoon ? 'hover:bg-[#252525]' : 'hover:bg-[#e8e2d8]';
  const border = isMoon ? 'border-[#2a2a2a]' : 'border-[#e0dace]';
  const borderSubtle = isMoon ? 'border-[#262626]' : 'border-[#e8e2d8]';
  const text = isMoon ? 'text-white' : 'text-[#2a2620]';
  const textSub = isMoon ? 'text-[#a19e97]' : 'text-[#6b6459]';
  const textMuted = isMoon ? 'text-[#666]' : 'text-[#9a9186]';
  const textBright = isMoon ? 'text-[#f5f2eb]' : 'text-[#1a1712]';

  const sidebarContent = (
    <div
      className={`w-full h-full flex flex-col shrink-0 min-w-0 ${bgSidebar} ${text} border-r ${borderSubtle} font-['Plus_Jakarta_Sans',sans-serif]`}
    >
      {/* ===== Brand Header ===== */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt="Sapphire AI"
              className="w-7 h-7 rounded-lg object-contain p-0.5 border border-[#e8e2d8] bg-white"
            />
            <div className="flex items-center gap-1.5">
              <span className={`font-bold text-[15px] ${textBright} tracking-tight`}>
                Sapphire
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#d97757]/20 text-[#d97757] font-bold tracking-wider">
                AI
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onClose}
              className={`lg:hidden p-1.5 rounded-lg ${bgHover} ${textSub} cursor-pointer transition-colors`}
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={`hidden lg:flex p-1.5 rounded-lg ${bgHover} ${textSub} cursor-pointer transition-colors`}
              title="Toggle panel"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== New Chat Button ===== */}
      <div className="px-3 pb-3">
        <button
          id="sidebar-new-btn"
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-2.5 px-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${bgCard} ${text} border ${border} ${bgHover} shadow-xs`}
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* ===== Top Nav Items ===== */}
      <nav className="px-3 pb-3 space-y-0.5">
        {/* Codex Studio */}
        <button
          id="sidebar-codex-btn"
          onClick={() => {
            if (onOpenCodex) onOpenCodex();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-2 px-3 rounded-lg text-[13px] font-medium flex items-center justify-between transition-colors cursor-pointer ${
            activeNavTab === 'codex'
              ? `${bgCard} ${text} shadow-sm font-semibold`
              : `${textSub} ${bgHover} hover:${text}`
          }`}
          title="Sapphire Codex Studio"
        >
          <div className="flex items-center gap-2.5">
            <Code2 className="w-4 h-4 text-[#d97757]" />
            <span>Codex</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#d97757]/20 text-[#d97757] font-bold tracking-wider">
            STUDIO
          </span>
        </button>

        {/* PWA */}
        {onOpenGetApp && (
          <button
            id="sidebar-pwa-btn"
            onClick={() => {
              onOpenGetApp();
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full py-2 px-3 rounded-lg text-[13px] font-medium flex items-center justify-between transition-colors cursor-pointer ${textSub} ${bgHover} hover:${text}`}
            title="Install PWA"
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-[#d97757]" />
              <span>PWA</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider ${bgCard} ${textSub}`}
            >
              INSTALL
            </span>
          </button>
        )}

        {/* About */}
        {onOpenAbout && (
          <button
            id="sidebar-about-btn"
            onClick={() => {
              onOpenAbout();
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full py-2 px-3 rounded-lg text-[13px] font-medium flex items-center justify-between transition-colors cursor-pointer ${textSub} ${bgHover} hover:${text}`}
            title="About Sapphire AI"
          >
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-[#d97757]" />
              <span>About</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider ${bgCard} ${textSub}`}
            >
              v2.5
            </span>
          </button>
        )}

        {/* Customize */}
        <button
          id="sidebar-customize-btn"
          onClick={() => {
            if (onOpenCustomize) onOpenCustomize();
            else onOpenSettings();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-2 px-3 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${textSub} ${bgHover} hover:${text}`}
          title="Customize Theme & Preferences"
        >
          <Sliders className="w-4 h-4" />
          <span>Customize</span>
        </button>
      </nav>

      {/* ===== Chats Section Header ===== */}
      <div className="flex-1 flex flex-col overflow-hidden px-3">
        <div className={`flex items-center justify-between px-2 py-1.5 ${textMuted}`}>
          <span className="text-[11px] font-semibold uppercase tracking-wide">
            Chats
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setShowSearchInput((prev) => !prev)}
              className={`p-1 rounded ${bgHover} cursor-pointer transition-colors`}
              title="Search chats"
            >
              <Search className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className={`p-1 rounded ${bgHover} cursor-pointer transition-colors`}
              title="Chat settings"
            >
              <SlidersHorizontal className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearchInput && (
          <div className="px-0 pb-2">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-lg px-3 py-1.5 text-[13px] focus:outline-none transition-colors ${bgCard} border ${border} ${text} placeholder:${textMuted}`}
            />
          </div>
        )}

        {/* Chat Session List */}
        <div className="flex-1 overflow-y-auto space-y-0.5 no-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className={`px-3 py-4 text-[13px] ${textMuted}`}>
              No chats yet
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = session.id === currentSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectSession(session.id);
                      if (window.innerWidth < 1024) onClose();
                    }
                  }}
                  className={`group relative flex items-center justify-between py-1.5 px-3 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? `${bgCard} ${text} shadow-sm`
                      : `${textSub} ${bgHover} hover:${text}`
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#d97757]' : ''
                      }`}
                    />

                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            handleSaveRename(session.id, e as any);
                          if (e.key === 'Escape')
                            handleCancelRename(e as any);
                        }}
                        className={`w-full px-2 py-0.5 rounded text-[13px] focus:outline-none ${bgCard} ${text} border ${border}`}
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">{session.title || 'Untitled'}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0 ml-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => handleSaveRename(session.id, e)}
                          className="p-1 text-emerald-500 hover:text-emerald-600 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className={`p-1 cursor-pointer ${textMuted} hover:${text}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          onClick={(e) => handleStartRename(session, e)}
                          className={`p-1 cursor-pointer rounded ${bgHover} ${textSub}`}
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(session.id, e)}
                          className={`p-1 cursor-pointer rounded ${bgHover} hover:text-rose-400`}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== User Profile Footer ===== */}
      <div
        className={`p-3 border-t ${borderSubtle} flex items-center gap-2.5 mt-2`}
      >
        <button
          type="button"
          onClick={() => {
            if (onOpenProfile) onOpenProfile();
            if (window.innerWidth < 1024) onClose();
          }}
          className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer flex-1"
        >
          <div
            className={`w-7 h-7 rounded-full ${bgCard} border ${border} flex items-center justify-center shrink-0 overflow-hidden`}
          >
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={`text-[11px] font-bold ${text}`}>{initial}</span>
            )}
          </div>
          <div className="min-w-0 flex items-center gap-1 text-[13px] truncate">
            <span className={`truncate font-semibold ${text}`}>{userName}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 ${textMuted}`}
            />
          </div>
        </button>

        {onOpenGetApp && (
          <button
            type="button"
            onClick={onOpenGetApp}
            className={`p-1.5 rounded-lg ${bgHover} ${textSub} cursor-pointer transition-colors shrink-0`}
            title="Install PWA"
          >
            <Smartphone className="w-4 h-4 text-[#d97757]" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP: Persistent Sidebar */}
      <aside
        className={`hidden lg:flex h-full shrink-0 ${
          isOpen ? 'w-[260px]' : 'w-0 overflow-hidden border-none'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* MOBILE: Drawer Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-[260px] h-full z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSidebar;