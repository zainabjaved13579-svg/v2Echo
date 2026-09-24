import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  Plus,
  Box,
  Sliders,
  Folder,
  Search,
  SlidersHorizontal,
  Download,
  ChevronDown,
  Trash2,
  Edit2,
  Check,
  X,
  Code2,
  Smartphone
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import { SAPPHIRE_LOGO_URL } from '../data/constants';
import { useAppTheme } from '../context/ThemeContext';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
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
  activeNavTab?: string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  onOpen,
  sessions,
  currentSessionId,
  userProfile,
  onOpenProfile,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onOpenSettings,
  onOpenFileWorkspace,
  onOpenGetApp,
  onOpenCodex,
  onOpenProjects,
  onOpenArtifacts,
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
  const userName = userProfile?.name || 'Shaheer';
  const initial = userName.charAt(0).toLowerCase();

  const isMoon = theme === 'moon';

  const sidebarContent = (
    <div className={`w-full h-full flex flex-col shrink-0 min-w-0 ${
      isMoon
        ? 'bg-[#111111] text-[#ede8e1] border-r border-[#222222]'
        : 'bg-[#f8fafc] text-slate-800 border-r border-[#e2e8f0]'
    } select-none font-['Plus_Jakarta_Sans',sans-serif]`}>

      {/* Top Navigation Action Section */}
      <div className="p-3.5 space-y-2 pt-4">
        {/* 1. New */}
        <button
          id="sidebar-new-btn"
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer shadow-xs ${
            isMoon
              ? 'bg-[#1a1a1a] hover:bg-[#222222] text-[#ede8e1] border border-[#2a2a2a]'
              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
          }`}
          title="Start new chat"
        >
          <div className="w-5 h-5 rounded-xl bg-[#d97757]/15 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5 text-[#d97757]" />
          </div>
          <span>New</span>
        </button>

        {/* 2. Workspace */}
        <button
          id="sidebar-workspace-btn"
          onClick={() => {
            if (onOpenFileWorkspace) onOpenFileWorkspace();
            else if (onOpenProjects) onOpenProjects();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
            activeNavTab === 'projects' || activeNavTab === 'workspace'
              ? isMoon
                ? 'bg-[#222222] text-[#ede8e1] font-semibold shadow-xs'
                : 'bg-slate-200 text-slate-900 font-semibold shadow-xs'
              : isMoon
              ? 'text-[#a19e97] hover:bg-[#1a1a1a] hover:text-[#ede8e1]'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Workspace files and multi-file project editor"
        >
          <div className="flex items-center gap-2.5">
            <Folder className="w-4 h-4 text-[#d97757]" />
            <span>Workspace</span>
          </div>
        </button>

        {/* 3. CodeX */}
        <button
          id="sidebar-codex-btn"
          onClick={() => {
            if (onOpenCodex) onOpenCodex();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
            activeNavTab === 'codex'
              ? isMoon
                ? 'bg-[#222222] text-[#ede8e1] font-semibold shadow-xs'
                : 'bg-slate-200 text-slate-900 font-semibold shadow-xs'
              : isMoon
              ? 'text-[#a19e97] hover:bg-[#1a1a1a] hover:text-[#ede8e1]'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="CodeX Multi-Model Studio"
        >
          <div className="flex items-center gap-2.5">
            <Code2 className="w-4 h-4 text-[#d97757]" />
            <span>CodeX</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d97757]/15 text-[#d97757] font-semibold">
            Pro
          </span>
        </button>

        {/* 4. Customize */}
        <button
          id="sidebar-customize-btn"
          onClick={() => {
            if (onOpenCustomize) onOpenCustomize();
            else onOpenSettings();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
            activeNavTab === 'customize'
              ? isMoon
                ? 'bg-[#222222] text-[#ede8e1] font-semibold shadow-xs'
                : 'bg-slate-200 text-slate-900 font-semibold shadow-xs'
              : isMoon
              ? 'text-[#a19e97] hover:bg-[#1a1a1a] hover:text-[#ede8e1]'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Customize Theme & Preferences"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-[#a19e97]" />
            <span>Customize</span>
          </div>
        </button>

        {/* 5. PWA */}
        {onOpenGetApp && (
          <button
            id="sidebar-pwa-btn"
            onClick={() => {
              onOpenGetApp();
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
              isMoon
                ? 'text-[#a19e97] hover:bg-[#1a1a1a] hover:text-[#ede8e1]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Install PWA"
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-[#d97757]" />
              <span>PWA</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              isMoon ? 'bg-[#222222] text-[#d97757]' : 'bg-slate-200 text-[#d97757]'
            }`}>
              Install
            </span>
          </button>
        )}
      </div>

      {/* Chats Header */}
      <div className={`px-4 pt-3 pb-1.5 flex items-center justify-between text-xs ${
        isMoon ? 'text-[#a19e97]' : 'text-slate-500'
      }`}>
        <span className="font-semibold text-xs tracking-wide">Chats</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSearchInput((prev) => !prev)}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isMoon ? 'hover:bg-[#1a1a1a] text-[#86837c] hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            title="Search chats"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isMoon ? 'hover:bg-[#1a1a1a] text-[#86837c] hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            title="Chat settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearchInput && (
        <div className="px-3.5 pb-2">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-2xl px-3 py-1.5 text-xs focus:outline-none transition-colors ${
              isMoon
                ? 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#ede8e1] placeholder-[#86837c]'
                : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      )}

      {/* Chat Session List */}
      <div className="flex-1 overflow-y-auto px-2.5 space-y-1 no-scrollbar">
        {filteredSessions.length === 0 ? (
          <div className={`px-3 py-4 text-xs ${isMoon ? 'text-[#86837c]' : 'text-slate-400'}`}>
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
                className={`group relative flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? isMoon
                      ? 'bg-[#222222] text-[#ede8e1] font-semibold'
                      : 'bg-slate-200 text-slate-900 font-semibold'
                    : isMoon
                    ? 'text-[#a19e97] hover:bg-[#1a1a1a] hover:text-[#ede8e1]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                    isSelected ? 'bg-[#d97757]' : isMoon ? 'bg-[#555] group-hover:bg-[#ede8e1]' : 'bg-slate-400 group-hover:bg-slate-700'
                  }`} />

                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(session.id, e as any);
                        if (e.key === 'Escape') handleCancelRename(e as any);
                      }}
                      className={`w-full px-2 py-1 rounded-xl text-xs focus:outline-none ${
                        isMoon ? 'bg-[#111111] text-white border border-[#2a2a2a]' : 'bg-white text-slate-900 border border-slate-300'
                      }`}
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{session.title || 'Untitled'}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => handleSaveRename(session.id, e)}
                        className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 text-[#7d7a74] hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => handleStartRename(session, e)}
                        className="p-1 text-[#7d7a74] hover:text-white cursor-pointer rounded-lg hover:bg-black/20"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        className="p-1 text-[#7d7a74] hover:text-rose-400 cursor-pointer rounded-lg hover:bg-black/20"
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

      {/* User Profile Pill */}
      <div className={`p-3.5 border-t flex items-center justify-between gap-2 shrink-0 ${
        isMoon ? 'border-[#222222]' : 'border-[#e2e8f0]'
      }`}>
        <button
          type="button"
          onClick={() => {
            if (onOpenProfile) onOpenProfile();
            if (window.innerWidth < 1024) onClose();
          }}
          className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer flex-1"
        >
          <div className={`w-7 h-7 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 ${
            isMoon ? 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#ede8e1]' : 'bg-white border border-slate-200 text-slate-800'
          }`}>
            {initial.toUpperCase()}
          </div>
          <div className="min-w-0 flex items-center gap-1.5 text-xs truncate">
            <span className={`truncate font-medium ${isMoon ? 'text-[#ede8e1]' : 'text-slate-800'}`}>{userName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#86837c] shrink-0" />
          </div>
        </button>

        {onOpenGetApp && (
          <button
            type="button"
            onClick={onOpenGetApp}
            className={`p-2 rounded-2xl transition-colors cursor-pointer shrink-0 ${
              isMoon ? 'text-[#86837c] hover:text-white hover:bg-[#1a1a1a]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
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
          isOpen ? 'w-72' : 'w-0 overflow-hidden border-none'
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
              className="relative w-72 h-full z-10"
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