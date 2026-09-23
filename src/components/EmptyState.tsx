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
  Edit3,
  GraduationCap,
  Code,
  Coffee,
  Lightbulb,
  AudioWaveform
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadUserProfile } from '../services/userService';
import { createSpeechRecognition } from '../services/speechService';
import { SAPPHIRE_LOGO_URL } from '../data/constants';

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
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSendMessage,
  onStartChat,
  onOpenGetApp,
  useSearchGrounding,
  setUseSearchGrounding,
  userName: propUserName
}) => {
  const [promptText, setPromptText] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Sapphire Studio');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: number }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Dynamic greeting based on time of day matching screenshot
  const [greetingTime, setGreetingTime] = useState('Up late');
  const userDisplayName = propUserName || loadUserProfile().name || 'Shaheer';
  const firstName = userDisplayName.split(' ')[0] || 'Shaheer';

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

  // Toggle voice dictation
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
    { label: 'Write', icon: Edit3, prompt: 'Help me draft a clear, persuasive document or article' },
    { label: 'Learn', icon: GraduationCap, prompt: 'Explain the core principles of modern distributed systems' },
    { label: 'Code', icon: Code, prompt: 'Build a full responsive web application with index.html and style.css' },
    { label: 'Productivity', icon: Coffee, prompt: 'Give me a structured weekly productivity and wellness schedule' },
    { label: 'Sapphire Pick', icon: Lightbulb, prompt: 'What are the most innovative AI developments right now and why do they matter?' }
  ];

  return (
    <div className="relative min-h-full w-full flex flex-col justify-between overflow-x-hidden select-none bg-[#191817] text-[#ede8e1] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Hidden file inputs for multiple uploads */}
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

      {/* Top spacing */}
      <div className="w-full pt-4 sm:pt-6" />

      {/* Center Welcome & Search Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full text-center">
        {/* Dynamic Greeting with Sapphire Logo */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 select-none">
          <div className="relative group shrink-0">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt="Sapphire Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover ring-1 ring-[#d97757]/40 shadow-lg shadow-black/40 transition-transform duration-200 group-hover:scale-105 bg-[#201f1d]"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-[40px] text-[#f5f2eb] tracking-tight font-medium">
            {greetingTime}, {firstName}
          </h1>
        </div>

        {/* Central Clean Prompt Card */}
        <div className="w-full relative bg-[#201f1d] rounded-2xl sm:rounded-3xl border border-[#33312e] shadow-xl hover:border-[#423f3b] transition-all p-3.5 sm:p-5 text-left">
          {/* Attached Files Pills if any */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#282724] border border-[#383633] text-xs text-[#ede8e1]"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#d97757]" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-[#a19e97] hover:text-white cursor-pointer ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Input Area */}
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            rows={2}
            className="w-full bg-transparent text-[#ede8e1] placeholder-[#86837c] text-sm sm:text-base focus:outline-none resize-none leading-relaxed font-normal"
          />

          {/* Controls Bottom Bar */}
          <div className="pt-2 sm:pt-3 flex items-center justify-between gap-2 border-t border-[#2a2926]">
            {/* Left: ONLY + Button (Square with soft rounded corners, no sharp ends, no text inside) */}
            <div className="relative">
              <button
                type="button"
                id="empty-state-plus-btn"
                onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                className="w-8 h-8 rounded-xl bg-[#282724] hover:bg-[#32302c] text-[#ede8e1] flex items-center justify-center transition-colors cursor-pointer border border-[#383633]"
                title="Add files or images"
              >
                <span className="text-lg leading-none font-light mb-0.5">+</span>
              </button>

              {/* Popover Menu with strictly Upload File & Upload Image */}
              <AnimatePresence>
                {isPlusMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute left-0 bottom-10 z-50 w-48 bg-[#201f1d] border border-[#33312e] rounded-xl shadow-2xl p-1.5 space-y-1 text-xs text-[#ede8e1]"
                  >
                    {/* 1. Upload File */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-3 py-2 rounded-lg hover:bg-[#282724] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <Paperclip className="w-4 h-4 text-[#d97757]" />
                      <span>Upload file</span>
                    </button>

                    {/* 2. Upload Image */}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full px-3 py-2 rounded-lg hover:bg-[#282724] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <ImageIcon className="w-4 h-4 text-[#d97757]" />
                      <span>Upload image</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Tools: Model Picker, Web Search 🌐, Mic, Waveform, Send */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Sapphire Engine Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#282724] hover:bg-[#32302c] text-xs text-[#ede8e1] border border-[#383633] transition-colors cursor-pointer"
                >
                  <span className="font-medium text-[#ede8e1]">{selectedModel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#a19e97]" />
                </button>

                <AnimatePresence>
                  {isModelDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 bottom-10 z-50 w-52 bg-[#201f1d] border border-[#33312e] rounded-xl shadow-2xl p-1.5 space-y-1 text-xs text-[#ede8e1]"
                    >
                      {[
                        { name: 'Sapphire Studio', sub: 'Interactive live app builder' },
                        { name: 'Sapphire Flash', sub: 'Ultra low latency real-time coder' },
                        { name: 'Sapphire Ultra', sub: 'Deep algorithmic reasoning' }
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setSelectedModel(item.name);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg flex flex-col text-left transition-colors cursor-pointer ${
                            selectedModel === item.name
                              ? 'bg-[#282724] text-[#f5f2eb] font-semibold'
                              : 'hover:bg-[#252422] text-[#a19e97]'
                          }`}
                        >
                          <span className="font-semibold text-[#ede8e1]">{item.name}</span>
                          <span className="text-[10px] text-[#86837c]">{item.sub}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Web Search 🌐 Toggle */}
              <button
                type="button"
                onClick={() => setUseSearchGrounding((prev) => !prev)}
                className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer border ${
                  useSearchGrounding
                    ? 'bg-[#d97757]/20 text-[#d97757] border-[#d97757]/50 font-medium'
                    : 'bg-[#282724] hover:bg-[#32302c] text-[#a19e97] border-[#383633]'
                }`}
                title="Toggle Live Web Search"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>

              {/* Voice Microphone */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-xl transition-all cursor-pointer border ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse border-rose-500'
                    : 'bg-[#282724] hover:bg-[#32302c] text-[#a19e97] hover:text-[#ede8e1] border-[#383633]'
                }`}
                title="Voice dictation"
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              {/* Audio Waveform icon */}
              <button
                type="button"
                onClick={onStartChat}
                className="p-2 rounded-xl bg-[#282724] hover:bg-[#32302c] text-[#a19e97] hover:text-[#ede8e1] border border-[#383633] transition-colors cursor-pointer"
                title="Voice mode"
              >
                <AudioWaveform className="w-3.5 h-3.5" />
              </button>

              {/* Send Button */}
              {promptText.trim() && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-8 h-8 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md"
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center justify-center gap-2 flex-wrap max-w-2xl mx-auto pt-4 sm:pt-6">
          {suggestionChips.map((chip, idx) => {
            const IconComp = chip.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSendMessage(chip.prompt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#201f1d] hover:bg-[#282724] text-[#a19e97] hover:text-[#ede8e1] text-xs font-medium border border-[#33312e] transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <IconComp className="w-3.5 h-3.5 text-[#a19e97]" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty bottom spacer for balance */}
      <div className="h-6 sm:h-10" />
    </div>
  );
};
