import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Settings as SettingsIcon,
  Folder,
  HardDrive,
  Code2,
  Download
} from 'lucide-react';
import { ChatSession } from '../types';
import { ECHO_LOGO_URL } from '../data/constants';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
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
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  onOpenSettings,
  onOpenFileManager,
  onOpenFileWorkspace,
  onOpenGetApp,
  onOpenVoiceStudio
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Track responsive screen size for desktop vs mobile behavior
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

  // Reusable inner content
  const sidebarInnerContent = (
    <div className="w-80 h-full flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={ECHO_LOGO_URL}
            alt="Echo AI Logo"
            className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 shadow-2xs"
          />
          <div>
            <h1 className="font-bold text-base text-slate-800 tracking-tight leading-tight flex items-center gap-1.5">
              <span>Echo AI</span>
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-sm">FAST</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Intelligent Assistant</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat & File Hub Buttons */}
      <div className="p-4 space-y-2">
        <button
          id="sidebar-new-chat-btn"
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 1024) onClose();
          }}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        {/* Files Button */}
        {onOpenFileWorkspace && (
          <button
            id="sidebar-workspace-btn"
            onClick={() => {
              onOpenFileWorkspace();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full py-2 px-3.5 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-xl text-xs font-semibold text-indigo-900 flex items-center justify-between transition-all shadow-2xs active:scale-[0.99] cursor-pointer"
            title="Open Files"
          >
            <div className="flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-indigo-600" />
              <span>Files</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-200/70 text-indigo-800 text-[9px] font-bold">
              EXPLORER
            </span>
          </button>
        )}
      </div>

      {/* Search Chats Input */}
      {sessions.length > 2 && (
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
            />
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-4 py-1 space-y-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5 flex items-center justify-between">
          <span>Recent Activity ({sessions.length})</span>
          {sessions.length > 1 && (
            <button
              onClick={onClearAllSessions}
              className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors font-medium cursor-pointer"
              title="Clear all conversation history"
            >
              Clear All
            </button>
          )}
        </div>

        {filteredSessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 px-4">
            {searchQuery ? 'No matching conversations' : 'No conversations yet. Start a new chat!'}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === currentSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                id={`session-item-${session.id}`}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`group relative flex items-center justify-between p-3 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                    : 'hover:bg-slate-100/90 text-slate-600 hover:text-slate-800 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'
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
                      className="bg-white text-slate-800 px-2 py-0.5 rounded border border-indigo-500 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <span className="truncate">{session.title}</span>
                  )}
                </div>

                {/* Actions (Rename, Delete) */}
                <div className="flex items-center gap-1 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => handleSaveRename(session.id, e)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 text-slate-400 hover:bg-slate-200 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button
                        onClick={(e) => handleStartRename(session, e)}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Delete conversation"
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

      {/* Quick App Download Banner */}
      {onOpenGetApp && (
        <div className="p-3 border-t border-slate-200/80 bg-blue-50/40">
          <button
            onClick={onOpenGetApp}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white hover:bg-blue-50/80 text-blue-700 border border-blue-200 shadow-2xs hover:shadow-xs transition-all text-xs font-semibold cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[#3b71fe] group-hover:scale-110 transition-transform" />
              <span>Get App (APK &amp; EXE)</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
              v2.0
            </span>
          </button>
        </div>
      )}

      {/* User Account / Settings Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={ECHO_LOGO_URL}
            alt="Echo AI"
            className="w-8 h-8 rounded-full object-contain bg-white border border-slate-200 shadow-2xs"
          />
          <div>
            <p className="text-xs font-semibold text-slate-800">Echo Assistant</p>
            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Active & Ready
            </p>
          </div>
        </div>
        <button
          id="sidebar-settings-btn"
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
          title="Settings & Model Config"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Desktop: Docked panel with smooth width & opacity slide-in transition
  if (isDesktop) {
    return (
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 320 : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="h-full border-r border-slate-200 bg-white shrink-0 overflow-hidden flex flex-col z-20"
      >
        {sidebarInnerContent}
      </motion.aside>
    );
  }

  // Mobile: Floating drawer with backdrop and slide-in from left
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile drawer */}
          <motion.div
            key="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          />

          {/* Sidebar container drawer on mobile */}
          <motion.aside
            key="mobile-sidebar-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-white border-r border-slate-200 flex flex-col shadow-2xl h-full lg:hidden"
          >
            {sidebarInnerContent}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
