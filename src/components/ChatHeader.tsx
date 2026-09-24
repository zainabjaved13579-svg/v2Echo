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
  VolumeX,
  Smartphone
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import { SAPPHIRE_LOGO_URL, SAPPHIRE_APP_NAME } from '../data/constants';
import { speechService } from '../services/speechService';
import { useAppTheme } from '../context/ThemeContext';

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
  const { theme } = useAppTheme();
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

  // Header completely removed — returns null so nothing renders on top
  return null;
};

export default ChatHeader;