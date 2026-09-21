import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Layers,
  Box,
  Sliders,
  Folder,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Settings as SettingsIcon,
  Code2,
  Download,
  Key,
  Shield
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import { SAPPHIRE_LOGO_URL, SAPPHIRE_APP_NAME } from '../data/constants';

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
  onOpenVoiceStudio?: () => void;
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
  onClearAllSessions,
  onOpenSettings,
  onOpenFileManager,
  onOpenFileWorkspace,
  onOpenGetApp,
  onOpenCodex,
  onOpenProjects,
  onOpenArtifacts,
  onOpenCustomize,
  activeNavTab = 'chat'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const isGuest = !userProfile?.email || userProfile.name === 'Guest User';

  const sidebarInnerContent = (
    <div className="w-full lg:w-72 h-full flex flex-col shrink-0 min-w-0 overflow-hidden bg-black text-slate-200 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={SAPPHIRE_LOGO_URL}
            alt={`${SAPPHIRE_APP_NAME} Logo`}
            className="w-7 h-7 rounded-lg object-contain bg-slate-900 border border-slate-800 shadow-md shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-white tracking-tight leading-tight flex items-center gap-1.5 truncate">
              <span>{SAPPHIRE_APP_NAME}</span>
              <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 text-[10px] font-mono rounded-sm shrink-0 border border-blue-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium truncate">AI Architect Workspace</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
          title="Close sidebar"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Required Sidebar Menu Options:
          1. + New
          2. Projects
          3. Artifacts
          4. Codex (Powered by Google AI Studio Engine)
          5. Customize
      */}
      <div className="p-3 space-y-1 border-b border-slate-800/80">
        {/* 1. + New */}
        <button
          id="sidebar-new-btn"
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 1024) onClose();
          }}
          className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all shadow-xs border border-slate-800 active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-white">New</span>
        </button>

        {/* 2. Projects (Workspace) */}
        <button
          id="sidebar-projects-btn"
          onClick={() => {
            if (onOpenProjects) onOpenProjects();
            else if (onOpenFileWorkspace) onOpenFileWorkspace();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
            activeNavTab === 'projects'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold'
              : 'text-slate-300 hover:bg-slate-900/90 hover:text-white border border-transparent'
          }`}
          title="Projects & Workspace"
        >
          <div className="flex items-center gap-2.5">
            <Folder className="w-4 h-4 text-blue-400" />
            <span>Projects</span>
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase">Workspace</span>
        </button>

        {/* 3. Artifacts */}
        <button
          id="sidebar-artifacts-btn"
          onClick={() => {
            if (onOpenArtifacts) onOpenArtifacts();
            else if (onOpenFileManager) onOpenFileManager();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
            activeNavTab === 'artifacts'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold'
              : 'text-slate-300 hover:bg-slate-900/90 hover:text-white border border-transparent'
          }`}
          title="Generated Artifacts"
        >
          <div className="flex items-center gap-2.5">
            <Box className="w-4 h-4 text-purple-400" />
            <span>Artifacts</span>
          </div>
          <span className="text-[9px] font-mono text-purple-400/80">Files</span>
        </button>

        {/* 4. Codex (App tab powered by Google AI Studio Engine) */}
        <button
          id="sidebar-codex-app-btn"
          onClick={() => {
            if (onOpenCodex) onOpenCodex();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
            activeNavTab === 'codex'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-800/50'
          }`}
          title="Codex: Full App Builder (Google AI Studio Engine)"
        >
          <div className="flex items-center gap-2.5">
            <Code2 className="w-4 h-4 text-blue-300" />
            <span className="tracking-wide">Codex</span>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40">
            AI STUDIO
          </span>
        </button>

        {/* 5. Customize */}
        <button
          id="sidebar-customize-btn"
          onClick={() => {
            if (onOpenCustomize) onOpenCustomize();
            else onOpenSettings();
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
            activeNavTab === 'customize'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold'
              : 'text-slate-300 hover:bg-slate-900/90 hover:text-white border border-transparent'
          }`}
          title="Customize Sapphire AI parameters"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>Customize</span>
          </div>
        </button>
      </div>

      {/* Guest Mode Banner or Conversation List */}
      {isGuest ? (
        <div className="p-4 m-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-300">Guest Mode Active</p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Chat history is disabled with zero data persistence. Sign in with Google to sync across devices.
          </p>
        </div>
      ) : (
        <>
          {/* Search Chats */}
          {sessions.length > 2 && (
            <div className="px-3 pt-3 pb-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
              <span>Chats ({sessions.length})</span>
              {sessions.length > 1 && (
                <button
                  onClick={onClearAllSessions}
                  className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors font-medium cursor-pointer"
                  title="Clear all"
                >
                  Clear All
                </button>
              )}
            </div>

            {filteredSessions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-600 px-3">
                {searchQuery ? 'No matching chats' : 'Workspace is ready. Start a new chat!'}
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === currentSessionId && activeNavTab === 'chat';
                const isEditing = editingId === session.id;

                return (
                  <div
                    key={session.id}
                    id={`session-item-${session.id}`}
                    onClick={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white border border-slate-700 shadow-sm font-semibold'
                        : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-blue-400' : 'text-slate-500'
                        }`}
                      />
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
                          autoFocus
                          className="bg-slate-950 text-white px-1.5 py-0.5 rounded border border-blue-500 text-xs w-full focus:outline-none"
                        />
                      ) : (
                        <span className="truncate">{session.title}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={(e) => handleSaveRename(session.id, e)}
                            className="p-1 text-emerald-400 hover:bg-slate-800 rounded cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 text-slate-500 hover:bg-slate-800 rounded cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            onClick={(e) => handleStartRename(session, e)}
                            className="p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(session.id, e)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
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
        </>
      )}

      {/* User Profile & Settings Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-black/90 flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (onOpenProfile) onOpenProfile();
            if (window.innerWidth < 1024) onClose();
          }}
          className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer group flex-1"
          title="User Profile"
        >
          {userProfile?.avatar ? (
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-7 h-7 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-700 shrink-0">
              {isGuest ? 'G' : userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
              <span>{userProfile?.name || 'Guest User'}</span>
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {isGuest ? 'Zero persistence' : 'Google Auth Active'}
            </p>
          </div>
        </button>

        <button
          id="sidebar-settings-btn"
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
          title="Settings & API Key"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 288 : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="h-full border-r border-slate-800/80 bg-black shrink-0 overflow-hidden flex flex-col z-20"
      >
        {sidebarInnerContent}
      </motion.aside>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-72 h-full z-10"
          >
            {sidebarInnerContent}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatSidebar;
