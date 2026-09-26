import React, { useRef, useEffect, useState, KeyboardEvent, ClipboardEvent, DragEvent } from 'react';
import {
  Square,
  Globe,
  ImageIcon,
  Paperclip,
  X,
  Mic,
  MicOff,
  FileCode,
  ArrowUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageAttachment, UploadedFileAttachment, SupportedLanguage } from '../types';
import { createSpeechRecognition, speechService } from '../services/speechService';
import { useAppTheme } from '../context/ThemeContext';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  onSend: (
    text: string,
    image?: ImageAttachment,
    file?: UploadedFileAttachment,
    files?: UploadedFileAttachment[],
    images?: ImageAttachment[]
  ) => void;
  onStop: () => void;
  isLoading: boolean;
  useSearchGrounding: boolean;
  setUseSearchGrounding: (val: boolean | ((prev: boolean) => boolean)) => void;
  selectedLanguage: SupportedLanguage;
  onOpenLanguageModal?: () => void;
  onOpenImageGen?: () => void;
  onOpenFileWorkspace?: () => void;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
  replyTo?: {
    id: string;
    role: 'user' | 'model';
    text: string;
    senderName?: string;
  } | null;
  onCancelReply?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isLoading,
  useSearchGrounding,
  setUseSearchGrounding,
  replyTo,
  onCancelReply
}) => {
  const { theme } = useAppTheme();
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFileAttachment[]>([]);
  const [fileErrorMessage, setFileErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef<string>('');

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Voice speech-to-text recording toggle
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
      baseInputRef.current = input.trim();
      return;
    }

    speechService.stop();
    baseInputRef.current = input.trim();

    const recognition = createSpeechRecognition(
      'en',
      (transcript) => {
        const base = baseInputRef.current;
        const full = base ? `${base} ${transcript}` : transcript;
        setInput(full);
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

  const processGeneralFile = async (file: File) => {
    setFileErrorMessage(null);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileErrorMessage(`File "${file.name}" exceeds maximum allowed size (25MB).`);
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        setAttachedImages((prev) => [
          ...prev,
          {
            dataUrl: result,
            base64: base64,
            name: file.name,
            mimeType: file.type || 'image/png'
          }
        ]);
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      const text = await file.text();
      setAttachedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: text,
          isCodeOrText: true
        }
      ]);
    } catch {
      setFileErrorMessage(`Could not read text from "${file.name}".`);
    }
  };

  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      processGeneralFile(files[i]);
    }
    setIsPlusMenuOpen(false);
    e.target.value = '';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!input.trim() && attachedImages.length === 0 && attachedFiles.length === 0) || isLoading) return;

    onSend(
      input.trim(),
      attachedImages[0] || undefined,
      attachedFiles[0] || undefined,
      attachedFiles.length > 0 ? attachedFiles : undefined,
      attachedImages.length > 0 ? attachedImages : undefined
    );
    setInput('');
    setAttachedImages([]);
    setAttachedFiles([]);
    setFileErrorMessage(null);
    setIsPlusMenuOpen(false);
    if (onCancelReply) onCancelReply();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processGeneralFile(file);
          return;
        }
      }
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        processGeneralFile(files[i]);
      }
    }
  };

  return (
    <div
      className="relative w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input elements supporting multiple items */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleMultipleFilesChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleMultipleFilesChange}
      />

      {/* Reply Quote Banner */}
      {replyTo && (
        <div className="mx-2 sm:mx-3 mb-2 p-2 rounded-2xl bg-[#282724] border border-[#383633] text-xs flex items-center justify-between text-[#ede8e1]">
          <span className="truncate max-w-[85%] text-[#a19e97]">
            Replying to: &quot;{replyTo.text.slice(0, 70)}...&quot;
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-[#a19e97] hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error message */}
      {fileErrorMessage && (
        <div className="mx-2 sm:mx-3 mb-2 p-2 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{fileErrorMessage}</span>
          <button
            type="button"
            onClick={() => setFileErrorMessage(null)}
            className="text-rose-400 hover:text-white cursor-pointer ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Card - Moon #20201f / #2b2b2a or Sun Theme */}
      <div
        className={`relative w-full rounded-3xl transition-all shadow-xl ${
          theme === 'moon' ? 'bg-[#20201f]' : 'bg-white'
        } border ${
          isDragging
            ? 'border-[#d97757] ring-2 ring-[#d97757]/30'
            : theme === 'moon'
            ? 'border-[#2b2b2a] focus-within:border-[#d97757]/60'
            : 'border-slate-200 focus-within:border-[#d97757]/60'
        }`}
      >
        {/* Attached Files & Images Preview Cards (No Limit) */}
        {(attachedFiles.length > 0 || attachedImages.length > 0) && (
          <div className="mx-3 mt-2.5 flex flex-wrap gap-2">
            {/* Attached Code/Text/Project Files */}
            {attachedFiles.map((file, idx) => (
              <div
                key={`file-${idx}-${file.name}`}
                className={`p-2 rounded-2xl flex items-center justify-between gap-2.5 text-xs border max-w-full sm:max-w-xs transition-all shadow-2xs ${
                  theme === 'moon'
                    ? 'bg-[#151515] border-[#2b2b2a] text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="w-4 h-4 text-[#d97757] shrink-0" />
                  <div className="min-w-0">
                    <span className="truncate block font-medium max-w-[140px] sm:max-w-[180px]">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-[#a19e97] font-mono">
                      {file.size < 1024 * 1024
                        ? `${(file.size / 1024).toFixed(1)} KB`
                        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-[#a19e97] hover:text-rose-400 cursor-pointer p-1 rounded-lg transition-colors"
                  title={`Remove ${file.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Attached Screenshots / Images */}
            {attachedImages.map((img, idx) => (
              <div
                key={`img-${idx}-${img.name}`}
                className={`p-1.5 rounded-2xl flex items-center gap-2 text-xs border max-w-full transition-all shadow-2xs ${
                  theme === 'moon'
                    ? 'bg-[#151515] border-[#2b2b2a] text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <img
                  src={img.dataUrl}
                  alt={img.name || 'Uploaded'}
                  className="w-8 h-8 rounded-xl object-cover border border-[#2b2b2a]"
                />
                <span className="truncate max-w-[110px] font-medium text-[11px]">
                  {img.name || `Image ${idx + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedImages((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-[#a19e97] hover:text-rose-400 cursor-pointer p-1 rounded-lg transition-colors"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <div className="px-4 pt-3 pb-1.5">
          <textarea
            ref={textareaRef}
            id="chat-input-textarea"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              attachedFiles.length === 1
                ? `Ask about "${attachedFiles[0].name}"...`
                : attachedFiles.length > 1
                ? `Ask about these ${attachedFiles.length} files...`
                : attachedImages.length === 1
                ? 'Ask about this image...'
                : attachedImages.length > 1
                ? `Ask about these ${attachedImages.length} images...`
                : 'How can I help you today?'
            }
            className={`w-full bg-transparent text-sm sm:text-base focus:outline-none resize-none max-h-40 leading-relaxed font-normal ${
              theme === 'moon' ? 'text-white placeholder-[#737373]' : 'text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Bottom Bar: ONLY + on the left, Search 🌐 + Mic + Send on the right */}
        <div className={`px-3.5 pb-2.5 pt-1.5 flex items-center justify-between gap-2 border-t ${
          theme === 'moon' ? 'border-[#2b2b2a]' : 'border-slate-100'
        }`}>
          {/* Left: ONLY + icon button */}
          <div className="relative">
            <button
              type="button"
              id="chat-plus-menu-btn"
              onClick={() => setIsPlusMenuOpen((prev) => !prev)}
              className={`w-7 h-7 rounded-2xl flex items-center justify-center transition-colors cursor-pointer border ${
                theme === 'moon'
                  ? 'bg-[#151515] hover:bg-[#282724] text-white border-[#2b2b2a]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
              title="Upload file or image"
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
                  className={`absolute left-0 bottom-9 z-50 w-44 rounded-2xl shadow-2xl p-1.5 space-y-1 text-xs border ${
                    theme === 'moon'
                      ? 'bg-[#20201f] border-[#2b2b2a] text-white'
                      : 'bg-white border-slate-200 text-slate-800 shadow-xl'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                      theme === 'moon' ? 'hover:bg-[#151515]' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Paperclip className="w-4 h-4 text-[#d97757]" />
                    <span>Upload file</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                      theme === 'moon' ? 'hover:bg-[#151515]' : 'hover:bg-slate-100'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-[#d97757]" />
                    <span>Upload image</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Tools: Web Search 🌐, Mic, and Send / Stop */}
          <div className="flex items-center gap-1.5">
            {/* Live Web Search toggle */}
            <button
              type="button"
              id="search-grounding-btn"
              onClick={() => setUseSearchGrounding((prev) => !prev)}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                useSearchGrounding
                  ? 'bg-[#d97757]/20 text-[#d97757] border-[#d97757]/50 font-semibold'
                  : theme === 'moon'
                  ? 'bg-[#151515] hover:bg-[#282724] text-[#a3a3a3] hover:text-white border-[#2b2b2a]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
              title="Toggle Live Web Search"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Voice Dictation Microphone */}
            <button
              type="button"
              id="voice-mic-btn"
              onClick={toggleRecording}
              className={`p-1.5 rounded-2xl transition-all cursor-pointer border ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse border-rose-500'
                  : theme === 'moon'
                  ? 'bg-[#151515] hover:bg-[#282724] text-[#a3a3a3] hover:text-white border-[#2b2b2a]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
              title="Voice dictation"
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Send or Stop Button */}
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="w-7 h-7 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                title="Stop generation"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                id="send-message-btn"
                disabled={!input.trim() && attachedImages.length === 0 && attachedFiles.length === 0}
                onClick={handleSend}
                className="w-7 h-7 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] disabled:opacity-40 disabled:hover:bg-[#d97757] text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md"
                title="Send message"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
