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
  AudioWaveform
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadUserProfile } from '../services/userService';
import { createSpeechRecognition } from '../services/speechService';
import { SAPPHIRE_LOGO_URL } from '../data/constants';
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
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSendMessage,
  onStartChat,
  onOpenGetApp,
  useSearchGrounding,
  setUseSearchGrounding,
  userName: propUserName,
  currentModel,
  onSelectModel
}) => {
  const { theme } = useAppTheme();
  const [promptText, setPromptText] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: number }[]>([]);

  const modelChoices = [
    { id: 'openai-gpt-4o-mini', name: 'OpenAI GPT-4o Mini', sub: 'Ultra-fast OpenAI engine' },
    { id: 'openai-gpt-4o', name: 'OpenAI GPT-4o', sub: 'OpenAI flagship multimodal' },
    { id: 'sapphire-3.7-flash', name: 'Sapphire 3.7 Flash', sub: 'Recommended low latency' },
    { id: 'sapphire-flash-latest', name: 'Sapphire Studio', sub: 'Interactive live app builder' },
    { id: 'sapphire-3.1-pro', name: 'Sapphire Ultra', sub: 'Deep algorithmic reasoning' }
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

  return (
    <div className={`relative min-h-full w-full flex flex-col overflow-x-hidden select-none ${
      theme === 'moon' ? 'bg-[#151515] text-white' : 'bg-[#191817] text-[#ede8e1]'
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

      {/* Main Content — 3 sections: Greeting (center), Chips+Input (bottom) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-4 sm:px-6 py-4 sm:py-8 max-w-2xl mx-auto w-full">

        {/* TOP SECTION: Greeting (screen ke beech mein) */}
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
                alt="Sapphire Logo"
                className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-[#d97757]/40 shadow-xl shadow-black/40 transition-transform duration-300 group-hover:scale-105 ${
                  theme === 'moon' ? 'bg-[#111111]' : 'bg-[#201f1d]'
                }`}
              />
            </div>

            <h1 className={`text-[22px] leading-tight sm:text-3xl md:text-4xl tracking-tight font-semibold ${
              theme === 'moon' ? 'text-white' : 'text-[#f5f2eb]'
            }`}>
              {greetingTime},{' '}
              <span className="bg-gradient-to-r from-[#d97757] to-[#e89a7a] bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>

            <p className={`hidden xs:block text-[11px] sm:text-xs font-normal ${
              theme === 'moon' ? 'text-[#737373]' : 'text-[#86837c]'
            }`}>
              Your AI companion is ready to build, create & reason
            </p>
          </motion.div>

        </div>

        {/* BOTTOM SECTION: Chips + Input (dono neeche saath) */}
        <div className="w-full flex flex-col items-center gap-3 sm:gap-4">

          {/* Suggestion Chips — Input ke UPAR */}
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
                      : 'bg-[#201f1d] hover:bg-[#282724] hover:border-[#d97757]/40 text-[#a19e97] hover:text-[#ede8e1] border-[#33312e]'
                  }`}
                >
                  <IconComp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#d97757]" />
                  <span>{chip.label}</span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Input Box — sabse neeche */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
            className={`w-full relative rounded-2xl sm:rounded-3xl border shadow-xl transition-all p-3 sm:p-4 text-left mb-1 sm:mb-2 ${
              theme === 'moon'
                ? 'bg-[#20201f] border-[#2b2b2a] focus-within:border-[#d97757]/50'
                : 'bg-[#201f1d] border-[#33312e] focus-within:border-[#d97757]/50'
            }`}
          >
            {/* Attached Files */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] ${
                      theme === 'moon' ? 'bg-[#151515] border-[#2b2b2a] text-white' : 'bg-[#282724] border-[#383633] text-[#ede8e1]'
                    }`}
                  >
                    <FileCode className="w-3 h-3 text-[#d97757]" />
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-[#a19e97] hover:text-white cursor-pointer ml-0.5"
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
              className={`w-full bg-transparent placeholder-[#737373] text-[13px] sm:text-sm focus:outline-none resize-none leading-relaxed font-normal ${
                theme === 'moon' ? 'text-white' : 'text-[#ede8e1]'
              }`}
            />

            {/* Bottom Controls */}
            <div className={`pt-2 sm:pt-3 flex items-center justify-between gap-2 border-t ${
              theme === 'moon' ? 'border-[#2b2b2a]' : 'border-[#2a2926]'
            }`}>
              {/* Plus Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
                    theme === 'moon'
                      ? 'bg-[#151515] hover:bg-[#282724] text-white border-[#2b2b2a]'
                      : 'bg-[#282724] hover:bg-[#32302c] text-[#ede8e1] border-[#383633]'
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
                          : 'bg-[#201f1d] border-[#33312e] text-[#ede8e1]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                          theme === 'moon' ? 'hover:bg-[#151515]' : 'hover:bg-[#282724]'
                        }`}
                      >
                        <Paperclip className="w-3.5 h-3.5 text-[#d97757]" />
                        <span>Upload file</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className={`w-full px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                          theme === 'moon' ? 'hover:bg-[#151515]' : 'hover:bg-[#282724]'
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
                        : 'bg-[#282724] hover:bg-[#32302c] text-[#ede8e1] border-[#383633]'
                    }`}
                  >
                    <span className="font-medium">{selectedModelName}</span>
                    <ChevronDown className="w-3 h-3 text-[#a19e97]" />
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
                            : 'bg-[#201f1d] border-[#33312e] text-[#ede8e1]'
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
                                : 'hover:bg-[#252422] text-[#a19e97]'
                            }`}
                          >
                            <span className="font-semibold text-[11px]">{item.name}</span>
                            <span className="text-[10px] text-[#86837c]">{item.sub}</span>
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
                      : 'bg-[#282724] hover:bg-[#32302c] text-[#a19e97] border-[#383633]'
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
                      : 'bg-[#282724] hover:bg-[#32302c] text-[#a19e97] hover:text-[#ede8e1] border-[#383633]'
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
                      : 'bg-[#282724] hover:bg-[#32302c] text-[#a19e97] hover:text-[#ede8e1] border-[#383633]'
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
    </div>
  );
};

export default EmptyState;