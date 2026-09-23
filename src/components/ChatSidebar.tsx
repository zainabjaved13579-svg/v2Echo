import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
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
  Code2
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import { SAPPHIRE_LOGO_URL } from '../data/constants';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

  const userName = userProfile?.name || 'Shaheer';
  const initial = userName.charAt(0).toLowerCase();

  const sidebarContent = (
    <div className="w-full lg:w-64 h-full flex flex-col shrink-0 min-w-0 bg-[#191817] text-[#ede8e1] border-r border-[#2a2926] select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Brand Header */}
      <div className="p-3 pb-2.5 flex items-center justify-between border-b border-[#2a2926]">
        <div className="flex items-center gap-2.5">
          <img
            src={SAPPHIRE_LOGO_URL}
            alt="Sapphire"
            className="w-7 h-7 rounded-xl object-cover ring-1 ring-[#d97757]/40 shadow-xs bg-[#201f1d]"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-[#f5f2eb] tracking-tight">Sapphire</span>
            <span className="text-[10px] text-[#86837c] leading-none">Studio</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
        </div>
      </div>

      {/* Top Navigation Action Section */}
      <div className="p-3 space-y-1.5">
        {/* + New Button */}
        <button
          id="sidebar-new-btn"
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 1024) onClose();
          }}
          className="w-full py-2 px-3 bg-[#201f1d] hover:bg-[#282724] text-[#ede8e1] rounded-xl text-xs font-medium flex items-center gap-2 transition-all border border-[#33312e] active:scale-[0.99] cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#d97757]" />
          <span>New</span>
        </button>

        {/* Workspace / Projects */}
        <button
          id="sidebar-workspace-btn"
          onClick={() => {
            if (onOpenFileWorkspace) onOpenFileWorkspace();
            else if (onOpenProjects) onOpenProjects();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-normal flex items-center justify-between transition-colors cursor-pointer ${
            activeNavTab === 'projects' || activeNavTab === 'workspace'
              ? 'bg-[#282724] text-[#ede8e1] font-medium'
              : 'text-[#a19e97] hover:bg-[#201f1d] hover:text-[#ede8e1]'
          }`}
          title="Workspace (normal coding & multi-file preview)"
        >
          <div className="flex items-center gap-2.5">
            <Folder className="w-3.5 h-3.5 text-[#a19e97]" />
            <span>Workspace</span>
          </div>
        </button>

        {/* Codex (Google AI Studio app builder & live preview) */}
        <button
          id="sidebar-codex-btn"
          onClick={() => {
            if (onOpenCodex) onOpenCodex();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-normal flex items-center justify-between transition-colors cursor-pointer ${
            activeNavTab === 'codex'
              ? 'bg-[#282724] text-[#ede8e1] font-medium'
              : 'text-[#a19e97] hover:bg-[#201f1d] hover:text-[#ede8e1]'
          }`}
          title="Codex (Google AI Studio app builder & all files preview)"
        >
          <div className="flex items-center gap-2.5">
            <Code2 className="w-3.5 h-3.5 text-[#d97757]" />
            <span>Codex</span>
          </div>
        </button>

        {/* Customize */}
        <button
          id="sidebar-customize-btn"
          onClick={() => {
            if (onOpenCustomize) onOpenCustomize();
            else onOpenSettings();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-normal flex items-center justify-between transition-colors cursor-pointer ${
            activeNavTab === 'customize'
              ? 'bg-[#282724] text-[#ede8e1] font-medium'
              : 'text-[#a19e97] hover:bg-[#201f1d] hover:text-[#ede8e1]'
          }`}
          title="Customize"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-3.5 h-3.5 text-[#a19e97]" />
            <span>Customize</span>
          </div>
        </button>

        {/* Install / Download PWA Button */}
        {onOpenGetApp && (
          <button
            id="sidebar-download-pwa-btn"
            onClick={() => {
              onOpenGetApp();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full py-1.5 px-2.5 rounded-xl text-xs font-normal flex items-center justify-between text-[#a19e97] hover:bg-[#201f1d] hover:text-[#ede8e1] transition-colors cursor-pointer"
            title="Download / Install PWA App"
          >
            <div className="flex items-center gap-2.5">
              <Download className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Download PWA</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#282724] text-[#d97757] font-medium">App</span>
          </button>
        )}
      </div>

      {/* Chats Section Header with Search and Filter Icons matching screenshot */}
      <div className="px-3 pt-3 pb-1.5 flex items-center justify-between text-xs text-[#a19e97]">
        <span className="font-normal text-[11px] tracking-wide text-[#86837c]">Chats</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSearchInput((prev) => !prev)}
            className="p-1 hover:text-[#ede8e1] rounded-lg transition-colors cursor-pointer"
            title="Search chats"
          >
            <Search className="w-3 h-3 text-[#86837c]" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1 hover:text-[#ede8e1] rounded-lg transition-colors cursor-pointer"
            title="Filter & parameters"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#86837c]" />
          </button>
        </div>
      </div>

      {/* Optional Search Bar */}
      {showSearchInput && (
        <div className="px-3 pb-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#201f1d] border border-[#33312e] rounded-xl px-2.5 py-1 text-xs text-[#ede8e1] placeholder-[#86837c] focus:outline-none"
          />
        </div>
      )}

      {/* Chat Session List with clean circle bullets matching screenshot */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 no-scrollbar">
        {filteredSessions.length === 0 ? (
          <div className="px-2 py-3 text-[11px] text-[#86837c]">No chats yet</div>
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
                className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#282724] text-[#ede8e1] font-medium'
                    : 'text-[#a19e97] hover:bg-[#201f1d] hover:text-[#ede8e1]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Clean bullet circle */}
                  <span className={`w-1.5 h-1.5 rounded-full border shrink-0 ${isSelected ? 'border-[#d97757] bg-[#d97757]' : 'border-[#86837c] group-hover:border-[#ede8e1]'}`} />

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
                      className="w-full bg-[#191817] text-white px-1.5 py-0.5 rounded text-xs border border-[#383633] focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{session.title || 'Untitled'}</span>
                  )}
                </div>

                {/* Edit & Delete hover controls */}
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => handleSaveRename(session.id, e)}
                        className="p-0.5 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-0.5 text-[#7d7a74] hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => handleStartRename(session, e)}
                        className="p-0.5 text-[#7d7a74] hover:text-white cursor-pointer"
                        title="Rename"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        className="p-0.5 text-[#7d7a74] hover:text-rose-400 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Profile Pill at Bottom */}
      <div className="p-3 border-t border-[#2a2926] flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (onOpenProfile) onOpenProfile();
            if (window.innerWidth < 1024) onClose();
          }}
          className="flex items-center gap-2 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer flex-1"
        >
          {/* Square avatar with soft rounded edges */}
          <div className="w-6 h-6 rounded-lg bg-[#201f1d] border border-[#33312e] text-[#ede8e1] flex items-center justify-center text-[11px] font-semibold shrink-0">
            {initial.toUpperCase()}
          </div>
          <div className="min-w-0 flex items-center gap-1.5 text-xs text-[#ede8e1] truncate">
            <span className="truncate font-medium">{userName}</span>
            <ChevronDown className="w-3 h-3 text-[#86837c] shrink-0" />
          </div>
        </button>

        {/* Download / Install App Icon */}
        <button
          type="button"
          onClick={onOpenGetApp}
          className="p-1.5 text-[#86837c] hover:text-[#ede8e1] rounded-lg transition-colors cursor-pointer shrink-0 hover:bg-[#201f1d]"
          title="Download App / PWA"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex h-full transition-all duration-200 ease-in-out shrink-0 ${
          isOpen ? 'w-64' : 'w-0 overflow-hidden border-none'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
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
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-64 h-full z-10"
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
