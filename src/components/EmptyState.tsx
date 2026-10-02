import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Mic,
  MicOff,
  ArrowUp,
  Paperclip,
  FileCode,
  Image as ImageIcon,
  ChevronDown,
  Code,
  Coffee,
  Lightbulb,
  AudioWaveform,
  UserCheck,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadUserProfile } from '../services/userService';
import { createSpeechRecognition } from '../services/speechService';
import { SAPPHIRE_LOGO_URL, SAPPHIRE_APP_NAME } from '../data/constants';
import { useAppTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface EmptyStateProps {
  onSendMessage: (text: string) => void;
  onStartChat?: () => void;
  onOpenGetApp?: () => void;
  onOpenLanguageModal?: () => void;
  onToggleSidebar?: () => void;
  selectedLanguage?: string;
  useSearchGrounding: boolean;
  setUseSearchGrounding: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenFileWorkspace?: () => void;
  onOpenImageGen?: () => void;
  userName?: string;
  currentModel?: string;
  onSelectModel?: (modelId: string) => void;
  // NEW: Auth props
  isAuthenticated?: boolean;
  isGuestMode?: boolean;
  onGoogleSignIn?: () => void;
  onContinueAsGuest?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSendMessage,
  onStartChat,
  onOpenGetApp,
  useSearchGrounding,
  setUseSearchGrounding,
  userName: propUserName,
  currentModel,
  onSelectModel,
  // NEW: Auth props with defaults
  isAuthenticated = true,
  isGuestMode = false,
  onGoogleSignIn,
  onContinueAsGuest
}) => {
  const { theme } = useAppTheme();
  const [promptText, setPromptText] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: number }[]>([]);

  const modelChoices = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', sub: 'Ultra-fast multimodal speed' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', sub: 'Deep architectural logic' },
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', sub: 'Pristine code development' },
    { id: 'grok-2', name: 'Grok 2 Engine', sub: 'High throughput coding' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', sub: 'Massive context & vision' }
  ];

  const currentChoice = modelChoices.find((m) => m.id === currentModel) || modelChoices[0];
  const [selectedModelName, setSelectedModelName] = useState(currentChoice.name);

  useEffect(() => {
    if (currentModel) {
      const match = modelChoices.find((m) => m.id === currentModel);
      if (match) setSelectedModelName(match.name);
    }
  }, [currentModel]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [greetingTime, setGreetingTime] = useState('Up late');
  const userDisplayName = propUserName || loadUserProfile().name || 'Guest';
  const firstName = userDisplayName === 'Guest User' ? 'Guest' : (userDisplayName.split(' ')[0] || 'Guest');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) {
      setGreetingTime('Up late');
    } else if (hour >= 5 && hour < 12) {
      setGreetingTime('Good morning');
    } else if (hour >= 12 && hour < 17) {
      setGreetingTime('Good afternoon');
    } else {
      setGreetingTime('Good evening');
    }
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim() && attachedFiles.length === 0) {
      if (onStartChat) onStartChat();
      return;
    }

    let finalPrompt = promptText.trim();
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map((f) => f.name).join(', ');
      finalPrompt = `${finalPrompt}\n\n[Attached: ${fileNames}]`.trim();
    }

    onSendMessage(finalPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = createSpeechRecognition(
      'en',
      (transcript) => {
        setPromptText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      () => setIsRecording(false),
      () => setIsRecording(false)
    );

    if (!recognition) return;
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const handleMultipleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const list: { name: string; size: number }[] = [];
    for (let i = 0; i < files.length; i++) {
      list.push({ name: files[i].name, size: files[i].size });
    }
    setAttachedFiles((prev) => [...prev, ...list]);
    setIsPlusMenuOpen(false);
  };

  const suggestionChips = [
    { label: 'Code', icon: Code, prompt: 'Build a full responsive web application with index.html and style.css' },
    { label: 'Productivity', icon: Coffee, prompt: 'Give me a structured weekly productivity and wellness schedule' },
    { label: 'Sapphire Pick', icon: Lightbulb, prompt: 'What are the most innovative AI developments right now and why do they matter?' }
  ];

  // Determine if we should show login panel
  const showLoginPanel = !isAuthenticated && !isGuestMode;

  return (
    <div className={`relative min-h-full w-full flex flex-col overflow-x-hidden select-none ${
      theme === 'moon' ? 'bg-[#151515] text-white' : 'bg-[#faf7f2] text-[#2a2620]'
    } font-['Plus_Jakarta_Sans',sans-serif]`}>

      {/* Subtle Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-[#d97757]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-[#d97757]/4 rounded-full blur-[120px] pointer-events-none" />

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleMultipleFiles}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleMultipleFiles}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Top: Theme Toggle */}
      <div className="w-full pt-3 sm:pt-5 px-4 sm:px-6 flex justify-end relative z-10 shrink-0">
        <ThemeToggle size="sm" />
      </div>

      {/* ============= LOGIN PANEL (When NOT authenticated) ============= */}
      {showLoginPanel ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 max-w-md mx-auto w-full">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`w-full rounded-3xl border shadow-2xl p-8 sm:p-10 ${
              theme === 'moon'
                ? 'bg-[#20201f] border-[#2b2b2a]'
                : 'bg-white border-[#e8e2d8]'
            }`}
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex justify-center mb-6"
            >
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl bg-[#d97757]/30 blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
                <img
                  src={SAPPHIRE_LOGO_URL}
                  alt={SAPPHIRE_APP_NAME}
                  className="relative w-16 h-16 rounded-2xl object-contain p-2 ring-2 ring-[#d97757]/40 shadow-xl bg-white"
                />
              </div>
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex justify-center mb-4"
            >
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
                theme === 'moon'
                  ? 'bg-[#151515] border-[#2b2b2a] text-[#a3a3a3]'
                  : 'bg-[#f5f1ea] border-[#e8e2d8] text-[#6b6459]'
              }`}>
                <Sparkles className="w-3 h-3 text-[#d97757]" />
                <span>Next-Gen Intelligent AI</span>
              </span>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-center mb-8"
            >
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
                theme === 'moon' ? 'text-white' : 'text-[#2a2620]'
              }`}>
                Welcome to {SAPPHIRE_APP_NAME}
              </h1>
              <p className={`text-xs sm:text-sm ${
                theme === 'moon' ? 'text-[#a3a3a3]' : 'text-[#6b6459]'
              }`}>
                Sign in to sync your work, or continue as guest
              </p>
            </motion.div>

            {/* Google Sign-In Button */}
            {onGoogleSignIn && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onGoogleSignIn}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-[#191817] rounded-2xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer mb-4"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.99 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Continue with Google</span>
              </motion.button>
            )}

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex items-center gap-3 my-5"
            >
              <div className={`flex-1 h-px ${theme === 'moon' ? 'bg-[#2b2b2a]' : 'bg-[#e8e2d8]'}`} />
              <span className={`text-[11px] font-medium uppercase tracking-wider ${
                theme === 'moon' ? 'text-[#737373]' : 'text-[#9a9186]'
              }`}>or</span>
              <div className={`flex-1 h-px ${theme === 'moon' ? 'bg-[#2b2b2a]' : 'bg-[#e8e2d8]'}`} />
            </motion.div>

            {/* Guest Mode Button */}
            {onContinueAsGuest && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onContinueAsGuest}
                className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer border ${
                  theme === 'moon'
                    ? 'bg-[#151515] hover:bg-[#282724] text-white border-[#2b2b2a]'
                    : 'bg-[#f5f1ea] hover:bg-[#efe9df] text-[#2a2620] border-[#e8e2d8]'
                }`}
              >
                <UserCheck className="w-4 h-4 text-[#d97757]" />
                <span>Continue as Guest</span>
              </motion.button>
            )}

            {/* Privacy Notice */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className={`text-[11px] flex items-center justify-center gap-1.5 mt-6 ${
                theme === 'moon' ? 'text-[#737373]' : 'text-[#9a9186]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Secure sign-in · No tracking</span>
            </motion.p>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className={`text-[11px] text-center mt-6 max-w-sm ${
              theme === 'moon' ? 'text-[#737373]' : 'text-[#9a9186]'
            }`}
          >
            By continuing, you agree to our Terms & Privacy Policy
          </motion.p>

        </div>
      ) : (
        /* ============= NORMAL CHAT SCREEN (When authenticated) ============= */
        <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-4 sm:px-6 py-4 sm:py-8 max-w-2xl mx-auto w-full">

          {/* TOP SECTION: Greeting */}
          <div className="flex-1 flex flex-col items-center justify-center w-full">

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center gap-2.5 sm:gap-3 select-none w-full text-center"
            >
              <div className="relative group shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-[#d97757]/25 blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                <img
                  src={SAPPHIRE_LOGO_URL}
                  alt="Sapphire AI"
                  className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-2xl object-contain p-1 ring-2 ring-[#d97757]/40 shadow-xl shadow-black/40 transition-transform duration-300 group-hover:scale-105 bg-white"
                />
              </div>

              <h1 className={`text-[22px] leading-tight sm:text-3xl md:text-4xl tracking-tight font-semibold ${
                theme === 'moon' ? 'text-white' : 'text-[#2a2620]'
              }`}>
                {greetingTime},{' '}
                <span className="bg-gradient-to-r from-[#d97757] to-[#e89a7a] bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>

              <p className={`hidden xs:block text-[11px] sm:text-xs font-normal ${
                theme === 'moon' ? 'text-[#737373]' : 'text-[#9a9186]'
              }`}>
                #1 Education AI & Autonomous Codex Studio — ready to build, learn & create
              </p>
            </motion.div>

          </div>

          {/* BOTTOM SECTION: Chips + Input */}
          <div className="w-full flex flex-col items-center gap-3 sm:gap-4">

            {/* Suggestion Chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
              className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap max-w-md sm:max-w-2xl mx-auto"
            >
              {suggestionChips.map((chip, idx) => {
                const IconComp = chip.icon;
                return (
                  <motion.button
                    key={idx}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.04, duration: 0.25 }}
                    whileHover={{ y: -2, scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onSendMessage(chip.prompt)}
                    className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-colors cursor-pointer shadow-xs ${
                      theme === 'moon'
                        ? 'bg-[#20201f] hover:bg-[#282724] hover:border-[#d97757]/40 text-white border-[#2b2b2a]'
                        : 'bg-white hover:bg-[#f5f1ea] hover:border-[#d97757]/40 text-[#6b6459] hover:text-[#2a2620] border-[#e8e2d8]'
                    }`}
                  >
                    <IconComp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#d97757]" />
                    <span>{chip.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Input Box */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
              className={`w-full relative rounded-2xl sm:rounded-3xl border shadow-xl transition-all p-3 sm:p-4 text-left mb-1 sm:mb-2 ${
                theme === 'moon'
                  ? 'bg-[#20201f] border-[#2b2b2a] focus-within:border-[#d97757]/50'
                  : 'bg-white border-[#e8e2d8] focus-within:border-[#d97757]/50'
              }`}
            >
              {/* Attached Files */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] ${
                        theme === 'moon'
                          ? 'bg-[#151515] border-[#2b2b2a] text-white'
                          : 'bg-[#f5f1ea] border-[#e8e2d8] text-[#2a2620]'
                      }`}
                    >
                      <FileCode className="w-3 h-3 text-[#d97757]" />
                      <span className="truncate max-w-[120px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className={`cursor-pointer ml-0.5 ${
                          theme === 'moon' ? 'text-[#a19e97] hover:text-white' : 'text-[#9a9186] hover:text-[#2a2620]'
                        }`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Textarea */}
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="How can I help you today?"
                rows={2}
                className={`w-full bg-transparent text-[13px] sm:text-sm focus:outline-none resize-none leading-relaxed font-normal ${
                  theme === 'moon'
                    ? 'text-white placeholder-[#737373]'
                    : 'text-[#2a2620] placeholder-[#9a9186]'
                }`}
              />

              {/* Bottom Controls */}
              <div className={`pt-2 sm:pt-3 flex items-center justify-between gap-2 border-t ${
                theme === 'moon' ? 'border-[#2b2b2a]' : 'border-[#e8e2d8]'
              }`}>
                {/* Plus Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
                      theme === 'moon'
                        ? 'bg-[#151515] hover:bg-[#282724] text-white border-[#2b2b2a]'
                        : 'bg-[#f5f1ea] hover:bg-[#efe9df] text-[#2a2620] border-[#e8e2d8]'
                    }`}
                    title="Add files or images"
                  >
                    <span className="text-lg leading-none font-light mb-0.5">+</span>
                  </button>

                  <AnimatePresence>
                    {isPlusMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className={`absolute left-0 bottom-10 z-50 w-44 rounded-xl shadow-2xl p-1.5 space-y-1 text-xs border ${
                          theme === 'moon'
                            ? 'bg-[#20201f] border-[#2b2b2a] text-white'
                            : 'bg-white border-[#e8e2d8] text-[#2a2620]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                            theme === 'moon' ? 'hover:bg-[#151515]' : 'hover:bg-[#f5f1ea]'
                          }`}
                        >
                          <Paperclip className="w-3.5 h-3.5 text-[#d97757]" />
                          <span>Upload file</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className={`w-full px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                            theme === 'moon' ? 'hover:bg-[#151515]' : 'hover:bg-[#f5f1ea]'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#d97757]" />
                          <span>Upload image</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Tools */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* Model Picker */}
                  <div className="relative hidden sm:block">
                    <button
                      type="button"
                      onClick={() => setIsModelDropdownOpen((prev) => !prev)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] transition-colors cursor-pointer border ${
                        theme === 'moon'
                          ? 'bg-[#151515] hover:bg-[#282724] text-white border-[#2b2b2a]'
                          : 'bg-[#f5f1ea] hover:bg-[#efe9df] text-[#2a2620] border-[#e8e2d8]'
                      }`}
                    >
                      <span className="font-medium">{selectedModelName}</span>
                      <ChevronDown className={`w-3 h-3 ${theme === 'moon' ? 'text-[#a19e97]' : 'text-[#9a9186]'}`} />
                    </button>

                    <AnimatePresence>
                      {isModelDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className={`absolute right-0 bottom-10 z-50 w-56 rounded-xl shadow-2xl p-1.5 space-y-1 text-xs border ${
                            theme === 'moon'
                              ? 'bg-[#20201f] border-[#2b2b2a] text-white'
                              : 'bg-white border-[#e8e2d8] text-[#2a2620]'
                          }`}
                        >
                          {modelChoices.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setSelectedModelName(item.name);
                                if (onSelectModel) onSelectModel(item.id);
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg flex flex-col text-left transition-colors cursor-pointer ${
                                selectedModelName === item.name
                                  ? 'bg-[#d97757]/20 text-[#d97757] font-semibold'
                                  : theme === 'moon'
                                  ? 'hover:bg-[#151515] text-[#a3a3a3] hover:text-white'
                                  : 'hover:bg-[#f5f1ea] text-[#6b6459] hover:text-[#2a2620]'
                              }`}
                            >
                              <span className="font-semibold text-[11px]">{item.name}</span>
                              <span className={`text-[10px] ${theme === 'moon' ? 'text-[#86837c]' : 'text-[#9a9186]'}`}>{item.sub}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Web Search */}
                  <button
                    type="button"
                    onClick={() => setUseSearchGrounding((prev) => !prev)}
                    className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-[11px] flex items-center gap-1 transition-all cursor-pointer border ${
                      useSearchGrounding
                        ? 'bg-[#d97757]/20 text-[#d97757] border-[#d97757]/50 font-medium'
                        : theme === 'moon'
                        ? 'bg-[#151515] hover:bg-[#282724] text-[#a3a3a3] hover:text-white border-[#2b2b2a]'
                        : 'bg-[#f5f1ea] hover:bg-[#efe9df] text-[#6b6459] border-[#e8e2d8]'
                    }`}
                    title="Toggle Live Web Search"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Search</span>
                  </button>

                  {/* Mic */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`p-2 rounded-xl transition-all cursor-pointer border ${
                      isRecording
                        ? 'bg-rose-600 text-white animate-pulse border-rose-500'
                        : theme === 'moon'
                        ? 'bg-[#151515] hover:bg-[#282724] text-[#a3a3a3] hover:text-white border-[#2b2b2a]'
                        : 'bg-[#f5f1ea] hover:bg-[#efe9df] text-[#6b6459] border-[#e8e2d8]'
                    }`}
                    title="Voice dictation"
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {/* Waveform */}
                  <button
                    type="button"
                    onClick={onStartChat}
                    className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                      theme === 'moon'
                        ? 'bg-[#151515] hover:bg-[#282724] text-[#a3a3a3] hover:text-white border-[#2b2b2a]'
                        : 'bg-[#f5f1ea] hover:bg-[#efe9df] text-[#6b6459] border-[#e8e2d8]'
                    }`}
                    title="Voice mode"
                  >
                    <AudioWaveform className="w-3.5 h-3.5" />
                  </button>

                  {/* Send */}
                  {promptText.trim() && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      type="button"
                      onClick={handleSubmit}
                      className="w-8 h-8 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md"
                      title="Send message"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      )}
    </div>
  );
};

export default EmptyState;