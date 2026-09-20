import React from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatSession, UserProfile } from '../types';

interface SidebarProps {
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
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  return <ChatSidebar {...props} />;
};

export default Sidebar;
