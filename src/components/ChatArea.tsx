import React, { RefObject } from 'react';
import { ChatMessageItem } from './ChatMessageItem';
import { EmptyState } from './EmptyState';
import { ChatSession, SupportedLanguage, AppSettings, UserProfile } from '../types';

interface ChatAreaProps {
  currentSession: ChatSession;
  isStartingScreen: boolean;
  userProfile?: UserProfile | null;
  onSendMessage: (text: string) => void;
  onStartChat?: () => void;
  onOpenGetApp: () => void;
  onRegenerate: () => void;
  onEditPrompt: (text: string) => void;
  onReplyMessage: (message: any) => void;
  onOpenLanguageModal?: () => void;
  onToggleSidebar?: () => void;
  onOpenFileWorkspace?: () => void;
  onPreviewCodeSnippet?: (code: string, language: string, filename?: string) => void;
  chatContainerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  settings: AppSettings;
  setUseSearchGrounding: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  currentSession,
  isStartingScreen,
  userProfile,
  onSendMessage,
  onStartChat,
  onOpenGetApp,
  onRegenerate,
  onEditPrompt,
  onReplyMessage,
  onOpenLanguageModal,
  onToggleSidebar,
  onOpenFileWorkspace,
  onPreviewCodeSnippet,
  chatContainerRef,
  messagesEndRef,
  onScroll,
  settings,
  setUseSearchGrounding
}) => {
  return (
    <div
      ref={chatContainerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-5 scroll-smooth relative"
    >
      {isStartingScreen ? (
        <EmptyState
          onSendMessage={onSendMessage}
          onStartChat={onStartChat}
          onOpenGetApp={onOpenGetApp}
          onOpenLanguageModal={onOpenLanguageModal}
          onToggleSidebar={onToggleSidebar}
          selectedLanguage={settings.selectedLanguage || 'auto'}
          useSearchGrounding={currentSession.useSearchGrounding}
          setUseSearchGrounding={setUseSearchGrounding}
          onOpenFileWorkspace={onOpenFileWorkspace}
        />
      ) : (
        <div className="max-w-3xl mx-auto space-y-5">
          {currentSession.messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              language={(settings.selectedLanguage as SupportedLanguage) || 'auto'}
              userProfile={userProfile}
              onRegenerate={onRegenerate}
              onEditPrompt={onEditPrompt}
              onPreviewCode={onPreviewCodeSnippet}
              onOpenFileWorkspace={onOpenFileWorkspace}
              onOpenFileInManager={onOpenFileWorkspace}
              onReply={onReplyMessage}
            />
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      )}
    </div>
  );
};

export default ChatArea;
