import React, { useState } from 'react';
import {
  Sparkles,
  ArrowUp,
  Globe,
  MessageSquare,
  Atom,
  Download,
  Menu,
  Languages
} from 'lucide-react';
import { ECHO_LOGO_URL } from '../data/constants';

interface EmptyStateProps {
  onSendMessage: (text: string) => void;
  onStartChat?: () => void;
  onOpenGetApp: () => void;
  onToggleSidebar?: () => void;
  onOpenLanguageModal?: () => void;
  selectedLanguage?: string;
  useSearchGrounding: boolean;
  setUseSearchGrounding: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenFileWorkspace?: () => void;
  onOpenImageGen?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSendMessage,
  onStartChat,
  onOpenGetApp,
  onToggleSidebar,
  onOpenLanguageModal,
  selectedLanguage = 'auto',
  useSearchGrounding,
  setUseSearchGrounding,
  onOpenFileWorkspace
}) => {
  const [promptText, setPromptText] = useState('');
  const [isDeepThinkActive, setIsDeepThinkActive] = useState(true);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim()) {
      if (onStartChat) {
        onStartChat();
      } else {
        onSendMessage('Hello! How can you assist me today?');
      }
      return;
    }
    onSendMessage(promptText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative min-h-full flex flex-col justify-between overflow-x-hidden select-none sm:select-auto bg-[#f8fafc]">
      {/* Background Subtle Radial Glow & Grid - 1:1 with Image 2 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 18% 22%, rgba(205, 230, 255, 0.55) 0%, transparent 45%),
            radial-gradient(circle at 50% 12%, rgba(215, 238, 255, 0.65) 0%, transparent 60%),
            linear-gradient(to right, rgba(147, 197, 253, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(147, 197, 253, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 54px 54px, 54px 54px'
        }}
      />

      {/* Top Navigation Bar - Matching Image 2 */}
      <header className="relative z-20 w-full px-4 sm:px-10 py-3.5 sm:py-5 flex items-center justify-between">
        {/* Left: Sidebar History Toggle + Echo Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200 transition-colors cursor-pointer touch-manipulation"
              title="Open Chat History"
              aria-label="Open Chat History"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Echo Brand with Image */}
          <div
            className="flex items-center gap-2 select-none cursor-pointer active:opacity-80 transition-opacity"
            onClick={onToggleSidebar}
          >
            <img
              src={ECHO_LOGO_URL}
              alt="Echo AI"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-contain bg-white shadow-2xs border border-blue-100"
            />
            <span className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#1d59f2] font-sans">
              echo
            </span>
          </div>
        </div>

        {/* Right: Get App + Language Toggle (Exact match to Image 2, NO API button) */}
        <div className="flex items-center gap-2.5 sm:gap-6">
          {/* Get App Text Button - Compact 2-line stacked on mobile, inline on desktop */}
          <button
            type="button"
            onClick={onOpenGetApp}
            className="text-slate-700 hover:text-[#1d59f2] font-semibold sm:font-medium transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100/60 active:scale-95 flex flex-col sm:flex-row items-center justify-center leading-[1.1] text-xs sm:text-base touch-manipulation"
            title="Download APK & EXE"
          >
            <span>Get</span>
            <span className="sm:ml-1">App</span>
          </button>

          {/* Language Selector Capsule: 中文 | EN */}
          <button
            type="button"
            onClick={onOpenLanguageModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-1 rounded-full bg-white/95 hover:bg-white text-slate-700 border border-slate-200/90 text-xs sm:text-sm font-normal shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95 touch-manipulation"
            title="Switch Language"
          >
            <span className={selectedLanguage === 'zh' ? 'text-[#1d59f2] font-bold' : 'text-slate-600'}>中文</span>
            <span className="text-slate-300">|</span>
            <span className={selectedLanguage !== 'zh' ? 'text-[#1d59f2] font-bold' : 'text-slate-600'}>EN</span>
          </button>
        </div>
      </header>

      {/* Hero Center Section */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-3.5 sm:px-6 py-4 sm:py-6 max-w-4xl mx-auto w-full text-center">
        {/* Announcement Pill - Compact, sleek & smaller */}
        <div
          onClick={onOpenGetApp}
          className="group inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/80 hover:bg-white border border-blue-100/90 text-slate-600 hover:text-[#1d59f2] text-[11px] sm:text-xs transition-all mb-4 sm:mb-6 cursor-pointer max-w-[92%] sm:max-w-xl text-center leading-tight backdrop-blur-xs shadow-2xs active:scale-[0.99] touch-manipulation"
        >
          <span className="text-[#3b71fe] text-xs shrink-0">✦</span>
          <span className="truncate sm:whitespace-normal">
            Echo-V2.0 is live with multimodal &amp; deep reasoning upgrades.
          </span>
          <span className="text-[#3b71fe] font-semibold group-hover:translate-x-0.5 transition-transform ml-0.5 shrink-0">
            →
          </span>
        </div>

        {/* Big Headline: "Into the Unknown" */}
        <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-[68px] font-bold text-[#1a2538] tracking-tight mb-5 sm:mb-8 font-sans leading-[1.08]">
          Into the<br className="sm:hidden" /> Unknown
        </h1>

        {/* "Chat with Echo" Button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-[#1d59f2] border border-slate-200 text-xs sm:text-sm font-medium transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer touch-manipulation"
          >
            <MessageSquare className="w-4 h-4 text-[#1d59f2]" />
            <span>Chat with Echo</span>
          </button>
        </div>
      </div>

      {/* Bottom Search / Prompt Input Card Section (Docked niche/bottom right above footer) */}
      <div className="relative z-10 w-full max-w-[760px] mx-auto px-3.5 sm:px-6 mb-2 sm:mb-4">
        <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_10px_35px_rgba(30,64,175,0.06)] hover:shadow-[0_14px_45px_rgba(30,64,175,0.09)] transition-all p-3.5 sm:p-5 text-left space-y-3 sm:space-y-4">
          {/* Textarea Input - Min 16px to prevent iOS zoom */}
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Echo..."
            rows={2}
            autoFocus
            className="w-full bg-transparent text-base sm:text-[17px] text-slate-800 placeholder-slate-400 resize-none focus:outline-none leading-relaxed font-sans min-h-[48px] sm:min-h-[56px]"
          />

          {/* Bottom Controls Row: DeepThink + Search pills on left, Blue Arrow on right */}
          <div className="flex items-center justify-between pt-1">
            {/* Left Action Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* DeepThink Pill Toggle */}
              <button
                type="button"
                onClick={() => setIsDeepThinkActive(!isDeepThinkActive)}
                className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none active:scale-95 touch-manipulation ${
                  isDeepThinkActive
                    ? 'bg-blue-50 text-[#1d59f2] border border-blue-200/80'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <Atom className={`w-3.5 h-3.5 ${isDeepThinkActive ? 'text-[#1d59f2]' : 'text-slate-400'}`} />
                <span>DeepThink</span>
              </button>

              {/* Search Pill Toggle */}
              <button
                type="button"
                onClick={() => setUseSearchGrounding(!useSearchGrounding)}
                className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none active:scale-95 touch-manipulation ${
                  useSearchGrounding
                    ? 'bg-blue-50 text-[#1d59f2] border border-blue-200/80'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <Globe className={`w-3.5 h-3.5 ${useSearchGrounding ? 'text-[#1d59f2]' : 'text-slate-400'}`} />
                <span>Search</span>
              </button>
            </div>

            {/* Blue Circular Send Button - Min 40px touch area on mobile */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer select-none touch-manipulation ${
                promptText.trim()
                  ? 'bg-[#1d59f2] hover:bg-[#1546cb] text-white shadow-md hover:scale-105 active:scale-95'
                  : 'bg-[#1d59f2] hover:bg-[#1546cb] text-white opacity-85 active:scale-95'
              }`}
              title="Send (Enter)"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-3 sm:py-4 px-4 text-center text-[11px] text-slate-400 select-none">
        Echo can make mistakes. Verify critical information.
      </footer>
    </div>
  );
};
