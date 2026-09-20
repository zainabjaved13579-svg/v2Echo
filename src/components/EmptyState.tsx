import React, { useState } from 'react';
import {
  Sparkles,
  ArrowUp,
  Globe,
  MessageSquare,
  Atom,
  Download,
  Languages,
  FileCode,
  Terminal,
  Palette,
  Menu
} from 'lucide-react';
import { motion } from 'motion/react';
import { SAPPHIRE_LOGO_URL, SAPPHIRE_APP_NAME } from '../data/constants';

interface EmptyStateProps {
  onSendMessage: (text: string) => void;
  onStartChat?: () => void;
  onOpenGetApp: () => void;
  onOpenLanguageModal?: () => void;
  onToggleSidebar?: () => void;
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
  onOpenLanguageModal,
  onToggleSidebar,
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
        {/* Left: Echo Logo & Brand Name */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleSidebar && (
            <button
              id="empty-state-sidebar-btn"
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer touch-manipulation"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 select-none">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt={SAPPHIRE_APP_NAME}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-contain bg-white shadow-2xs border border-blue-100"
            />
            <span className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#1d59f2] font-sans">
              sapphire
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
        {/* Announcement Pill - Compact, sleek with subtle float */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: [0, -3, 0] }}
          transition={{
            opacity: { duration: 0.5 },
            y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
          }}
          onClick={onOpenGetApp}
          className="group inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/90 hover:bg-white border border-blue-100/90 text-slate-600 hover:text-[#1d59f2] text-[11px] sm:text-xs transition-all mb-4 sm:mb-6 cursor-pointer max-w-[92%] sm:max-w-xl text-center leading-tight backdrop-blur-xs shadow-2xs hover:shadow-xs active:scale-[0.99] touch-manipulation"
        >
          <span className="text-[#3b71fe] text-xs shrink-0 animate-pulse">✦</span>
          <span className="truncate sm:whitespace-normal">
            Sapphire-V2.0 is live with multimodal &amp; deep reasoning upgrades.
          </span>
          <span className="text-[#3b71fe] font-semibold group-hover:translate-x-0.5 transition-transform ml-0.5 shrink-0">
            →
          </span>
        </motion.div>

        {/* Big Headline: "Into the Unknown" with Ambient Halo & Float Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-5 sm:mb-7 select-none"
        >
          {/* Ambient Glowing Halo Orb */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.65, 0.35]
            }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-28 sm:h-36 bg-gradient-to-r from-blue-300/40 via-indigo-300/30 to-sky-200/40 rounded-full blur-2xl sm:blur-3xl pointer-events-none -z-10"
          />

          <motion.h1
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
            className="text-4xl xs:text-5xl sm:text-6xl md:text-[68px] font-bold tracking-tight font-sans leading-[1.08]"
          >
            <span className="bg-gradient-to-r from-[#111827] via-[#1d59f2] to-[#1e293b] bg-clip-text text-transparent">
              Into the<br className="sm:hidden" /> Unknown
            </span>
          </motion.h1>
        </motion.div>

        {/* "Chat with Echo" Button & Quick Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center justify-center gap-3.5"
        >
          <div className="relative inline-flex items-center justify-center">
            {/* Pulsing ring */}
            <span className="absolute -inset-1 rounded-full bg-blue-400/25 animate-ping pointer-events-none opacity-40" />
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSubmit()}
              className="relative flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-[#1d59f2] border border-slate-200 text-xs sm:text-sm font-medium transition-all shadow-2xs hover:shadow-xs cursor-pointer touch-manipulation"
            >
              <MessageSquare className="w-4 h-4 text-[#1d59f2]" />
              <span>Chat with Sapphire</span>
            </motion.button>
          </div>

          {/* Staggered Animated Quick Starter Prompts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-2 flex-wrap max-w-lg mx-auto pt-1"
          >
            {[
              { label: 'index.html web page', icon: FileCode, prompt: 'Create a responsive index.html page with modern CSS and JavaScript' },
              { label: 'main.py script', icon: Terminal, prompt: 'Write a clean main.py script with official structure and comments' },
              { label: 'style.css layout', icon: Palette, prompt: 'Write an official style.css stylesheet with flexbox and animations' }
            ].map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <motion.button
                  key={idx}
                  type="button"
                  whileHover={{ y: -2, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onSendMessage(item.prompt)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-[#1d59f2] text-xs font-medium border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <IconComponent className="w-3.5 h-3.5 text-slate-700" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Search / Prompt Input Card Section (Docked niche/bottom right above footer) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="relative z-10 w-full max-w-[760px] mx-auto px-3.5 sm:px-6 mb-2 sm:mb-4"
      >
        <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_10px_35px_rgba(30,64,175,0.06)] hover:shadow-[0_14px_45px_rgba(30,64,175,0.09)] transition-all p-3.5 sm:p-5 text-left space-y-3 sm:space-y-4">
          {/* Textarea Input - Min 16px to prevent iOS zoom */}
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Sapphire..."
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
      </motion.div>

      {/* Footer */}
      <footer className="relative z-10 py-3 sm:py-4 px-4 text-center text-[11px] text-slate-400 select-none">
        Sapphire can make mistakes. Verify critical information.
      </footer>
    </div>
  );
};
