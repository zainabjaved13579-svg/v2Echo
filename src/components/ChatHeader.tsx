import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  Settings as SettingsIcon,
  Trash2,
  Download,
  Plus,
  Edit2,
  Check,
  X,
  Code2,
  FolderCode,
  Image as ImageIcon,
  MoreVertical
} from 'lucide-react';
import { ChatSession } from '../types';
import { ECHO_LOGO_URL } from '../data/constants';

interface ChatHeaderProps {
  currentSession: ChatSession;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onClearMessages: () => void;
  onRenameSession: (title: string) => void;
  onOpenSettings: () => void;
  onOpenFileManager: () => void;
  onOpenFileWorkspace?: () => void;
  onOpenImageGen: () => void;
  onOpenGetApp?: () => void;
  onExportChat: (format: 'markdown' | 'json') => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentSession,
  onToggleSidebar,
  onNewChat,
  onClearMessages,
  onRenameSession,
  onOpenSettings,
  onOpenFileManager,
  onOpenFileWorkspace,
  onOpenImageGen,
  onOpenGetApp,
  onExportChat
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(currentSession.title);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onRenameSession(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 sm:h-16 border-b border-slate-100 bg-white/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-2xs">
      {/* Left section: Sidebar toggle & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          title="Toggle conversation list"
        >
          <Menu className="w-5 h-5" />
        </button>

        {isEditingTitle ? (
          <div className="flex items-center gap-1 min-w-0">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
              className="px-2 py-1 text-xs sm:text-sm bg-slate-50 border border-indigo-500 rounded-lg text-slate-800 focus:outline-none max-w-[150px] sm:max-w-xs"
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setTitleInput(currentSession.title);
                setIsEditingTitle(false);
              }}
              className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={ECHO_LOGO_URL}
              alt="Echo"
              className="w-6 h-6 rounded-lg object-contain bg-white border border-slate-200 shrink-0 shadow-2xs"
            />
            <h2 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 truncate max-w-[110px] sm:max-w-[200px] md:max-w-[280px]">
              {currentSession.title}
            </h2>
            <button
              onClick={() => {
                setTitleInput(currentSession.title);
                setIsEditingTitle(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors shrink-0"
              title="Rename conversation"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Right section: Responsive, clean, uncluttered action buttons */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Get App Button */}
        {onOpenGetApp && (
          <button
            id="header-get-app-btn"
            onClick={onOpenGetApp}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Download Android APK & Windows EXE"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Get App</span>
          </button>
        )}

        {/* Files Button */}
        {onOpenFileWorkspace && (
          <button
            id="header-file-workspace-btn"
            onClick={onOpenFileWorkspace}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Open Files"
          >
            <FolderCode className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Files</span>
          </button>
        )}

        {/* New Chat */}
        <button
          id="header-new-chat-btn"
          onClick={onNewChat}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
          title="Start new conversation"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">New Chat</span>
        </button>

        {/* More Actions Dropdown (Clean on mobile, keeps header uncongested!) */}
        <div className="relative">
          <button
            id="header-more-btn"
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-40 text-xs text-slate-700 font-medium animate-fadeIn">
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
              >
                <SettingsIcon className="w-4 h-4 text-slate-500" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onExportChat('markdown');
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Chat (Markdown)</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onClearMessages();
                }}
                disabled={currentSession.messages.length === 0}
                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Clear Messages</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
