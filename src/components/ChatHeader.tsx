import React, { useState, useEffect } from 'react';
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
  MoreVertical,
  User,
  VolumeX
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import { SAPPHIRE_LOGO_URL, SAPPHIRE_APP_NAME } from '../data/constants';
import { speechService } from '../services/speechService';

interface ChatHeaderProps {
  currentSession: ChatSession;
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onClearMessages: () => void;
  onRenameSession: (title: string) => void;
  onOpenSettings: () => void;
  onOpenFileManager: () => void;
  onOpenFileWorkspace?: () => void;
  onOpenImageGen?: () => void;
  onOpenGetApp?: () => void;
  onExportChat: (format: 'markdown' | 'json') => void;
  onGoHome?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentSession,
  userProfile,
  onOpenProfile,
  onToggleSidebar,
  onNewChat,
  onClearMessages,
  onRenameSession,
  onOpenSettings,
  onOpenFileManager,
  onOpenFileWorkspace,
  onOpenImageGen,
  onOpenGetApp,
  onExportChat,
  onGoHome
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(currentSession.title);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const unsub = speechService.subscribe((state) => {
      setIsSpeaking(state.isSpeaking);
    });
    return () => unsub();
  }, []);

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onRenameSession(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 sm:h-16 border-b border-[#2a2926] bg-[#191817]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-md">
      {/* Left section: Sidebar toggle & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#a19e97] hover:text-[#ede8e1] hover:bg-[#201f1d] active:bg-[#282724] transition-colors shrink-0 touch-manipulation cursor-pointer border border-[#33312e]"
          title="Toggle conversation list"
          aria-label="Toggle conversation list"
        >
          <Menu className="w-4 h-4" />
        </button>

        {isEditingTitle ? (
          <div className="flex items-center gap-1 min-w-0">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
              className="px-2.5 py-1 text-xs sm:text-sm bg-[#201f1d] border border-[#d97757] rounded-xl text-[#ede8e1] focus:outline-none max-w-[150px] sm:max-w-xs"
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 text-emerald-400 hover:bg-[#201f1d] rounded-lg"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setTitleInput(currentSession.title);
                setIsEditingTitle(false);
              }}
              className="p-1 text-[#86837c] hover:bg-[#201f1d] rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            {onGoHome ? (
              <button
                type="button"
                onClick={onGoHome}
                className="flex items-center gap-1.5 p-1 -ml-1 rounded-xl hover:bg-[#201f1d] transition-colors cursor-pointer group shrink-0"
                title="Go to Home"
              >
                <img
                  src={SAPPHIRE_LOGO_URL}
                  alt={SAPPHIRE_APP_NAME}
                  className="w-7 h-7 rounded-xl object-cover bg-[#201f1d] ring-1 ring-[#d97757]/40 shadow-xs group-hover:scale-105 transition-transform"
                />
              </button>
            ) : (
              <img
                src={SAPPHIRE_LOGO_URL}
                alt={SAPPHIRE_APP_NAME}
                className="w-7 h-7 rounded-xl object-cover bg-[#201f1d] ring-1 ring-[#d97757]/40 shrink-0 shadow-xs"
              />
            )}
            <h2 className="text-xs sm:text-sm md:text-base font-semibold text-[#ede8e1] truncate max-w-[120px] sm:max-w-[200px] md:max-w-[280px]">
              {currentSession.title}
            </h2>
            <button
              onClick={() => {
                setTitleInput(currentSession.title);
                setIsEditingTitle(true);
              }}
              className="p-1 text-[#86837c] hover:text-[#ede8e1] rounded-lg transition-colors shrink-0"
              title="Rename conversation"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Right section: Responsive, clean action buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Stop Voice button when speech is playing */}
        {isSpeaking && (
          <button
            id="header-stop-voice-btn"
            onClick={() => speechService.stop()}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-semibold animate-pulse transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Stop voice speech"
          >
            <VolumeX className="w-3.5 h-3.5 text-white" />
            <span className="hidden xs:inline">Stop Voice</span>
          </button>
        )}

        {/* Get App Button */}
        {onOpenGetApp && (
          <button
            id="header-get-app-btn"
            onClick={onOpenGetApp}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#201f1d] hover:bg-[#282724] text-[#ede8e1] border border-[#33312e] text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Download Sapphire App & PWA"
          >
            <Download className="w-3.5 h-3.5 text-[#d97757]" />
            <span>Get App</span>
          </button>
        )}

        {/* Files Button */}
        {onOpenFileWorkspace && (
          <button
            id="header-file-workspace-btn"
            onClick={onOpenFileWorkspace}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#201f1d] hover:bg-[#282724] text-[#ede8e1] border border-[#33312e] text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Open Files"
          >
            <FolderCode className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="hidden sm:inline">Files</span>
          </button>
        )}

        {/* New Chat */}
        <button
          id="header-new-chat-btn"
          onClick={onNewChat}
          className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-medium flex items-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer"
          title="Start new conversation"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">New Chat</span>
        </button>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            id="header-more-btn"
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className="p-2 rounded-xl text-[#a19e97] hover:text-[#ede8e1] hover:bg-[#201f1d] transition-colors border border-[#33312e] cursor-pointer"
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#201f1d] border border-[#33312e] shadow-2xl py-1.5 z-40 text-xs text-[#ede8e1] font-medium animate-fadeIn">
              {onOpenProfile && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#282724] hover:text-[#ede8e1] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#d97757]" />
                  <span>Profile & Google Sync</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-[#282724] hover:text-[#ede8e1] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-[#a19e97]" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onExportChat('markdown');
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-[#282724] hover:text-[#ede8e1] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#a19e97]" />
                <span>Export Chat (Markdown)</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onClearMessages();
                }}
                disabled={currentSession.messages.length === 0}
                className="w-full text-left px-3.5 py-2 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Clear Messages</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
