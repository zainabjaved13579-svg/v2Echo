import React, { useRef, useEffect, useState, KeyboardEvent, ClipboardEvent, DragEvent } from 'react';
import {
  Send,
  Square,
  Globe,
  Paperclip,
  X,
  Mic,
  MicOff,
  Image as ImageIcon,
  FileCode,
  FileText,
  AlertCircle,
  FolderCode,
  Languages,
  Reply
} from 'lucide-react';
import { ImageAttachment, UploadedFileAttachment, SupportedLanguage } from '../types';
import { getLanguageConfig } from '../data/languages';
import { createSpeechRecognition } from '../services/speechService';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB limit

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  onSend: (text: string, image?: ImageAttachment, file?: UploadedFileAttachment) => void;
  onStop: () => void;
  isLoading: boolean;
  useSearchGrounding: boolean;
  setUseSearchGrounding: (val: boolean | ((prev: boolean) => boolean)) => void;
  selectedLanguage: SupportedLanguage;
  onOpenLanguageModal: () => void;
  onOpenImageGen: () => void;
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
  selectedLanguage,
  onOpenLanguageModal,
  onOpenImageGen,
  onOpenFileWorkspace,
  onChangeLanguage,
  replyTo,
  onCancelReply
}) => {
  const [attachedImage, setAttachedImage] = useState<ImageAttachment | null>(null);
  const [attachedFile, setAttachedFile] = useState<UploadedFileAttachment | null>(null);
  const [fileErrorMessage, setFileErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const langConfig = getLanguageConfig(selectedLanguage);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Voice speech-to-text recording toggle (Supports English & Urdu accents)
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Determine speech recognition language (English or Urdu)
    const recLang = selectedLanguage === 'ur' ? 'ur' : selectedLanguage === 'hi' ? 'hi' : 'en';

    const recognition = createSpeechRecognition(
      recLang,
      (transcript) => {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      () => {
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    if (!recognition) {
      alert('Voice microphone input is not supported in this browser environment. You can type directly.');
      return;
    }

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  // Quick toggle between English and Urdu voice/accent
  const toggleEnglishUrduAccent = () => {
    if (!onChangeLanguage) return;
    if (selectedLanguage === 'ur') {
      onChangeLanguage('en');
    } else {
      onChangeLanguage('ur');
    }
  };

  // Process any uploaded file (< 15MB: Code, Text, PDF, Image, Document)
  const processGeneralFile = async (file: File, fileHandle?: any) => {
    setFileErrorMessage(null);

    // Strict 15MB check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFileErrorMessage(`File "${file.name}" is ${sizeMB} MB. Maximum allowed size is 15 MB.`);
      return;
    }

    // 1. Image Files
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const commaIdx = result.indexOf(',');
        const base64 = commaIdx !== -1 ? result.slice(commaIdx + 1) : result;
        setAttachedImage({
          mimeType: file.type || 'image/png',
          base64,
          dataUrl: result,
          name: file.name || `image_${Date.now()}.png`
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    // 2. Code or Plain Text files
    const isCodeOrTextExt =
      /\.(txt|md|html|htm|css|scss|sass|less|js|jsx|ts|tsx|mjs|cjs|json|jsonc|mcmeta|properties|yml|yaml|xml|svg|py|java|c|cpp|h|hpp|cs|go|rs|php|rb|sql|sh|bash|zsh|bat|cmd|env|dockerfile|gitignore)$/i.test(
        file.name
      ) ||
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      file.type === 'application/xml' ||
      file.type === 'application/javascript';

    if (isCodeOrTextExt) {
      try {
        const textContent = await file.text();
        setAttachedFile({
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: textContent,
          isCodeOrText: true,
          fileHandle
        });
        return;
      } catch (err) {
        console.warn('Could not read file as text, trying binary/multimodal reader:', err);
      }
    }

    // 3. PDF Document or other multimodal files (up to 15MB)
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      const base64 = commaIdx !== -1 ? result.slice(commaIdx + 1) : result;
      setAttachedFile({
        name: file.name,
        type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        size: file.size,
        content: `[Uploaded Document: ${file.name}]`,
        isCodeOrText: false,
        base64,
        dataUrl: result,
        fileHandle
      });
    };
    reader.readAsDataURL(file);
  };

  // Open file picker with File System Access API support for direct disk auto-save!
  const handleTriggerFileUpload = async () => {
    if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker();
        if (handle) {
          const file = await handle.getFile();
          await processGeneralFile(file, handle);
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User cancelled
      }
    }
    // Standard fallback
    fileInputRef.current?.click();
  };

  // Handle Clipboard Paste (CTRL+V for screenshots or code files)
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processGeneralFile(file);
        }
        break;
      }
    }
  };

  // Drag and Drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      await processGeneralFile(file);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isLoading) return;
    const trimmed = input.trim();
    if (!trimmed && !attachedImage && !attachedFile) return;

    const messageText = trimmed || (attachedFile ? `Please analyze and rewrite this file: ${attachedFile.name}` : 'Please analyze this screenshot.');

    onSend(messageText, attachedImage || undefined, attachedFile || undefined);
    setInput('');
    setAttachedImage(null);
    setAttachedFile(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5">
      {/* Universal File Upload Input (Any file type) */}
      <input
        type="file"
        ref={fileInputRef}
        accept="*/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            await processGeneralFile(file);
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={`relative rounded-2xl bg-white border transition-all shadow-xs ${
          isDragging
            ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/20'
            : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
        }`}
      >
        {/* File Size Error Alert Banner */}
        {fileErrorMessage && (
          <div className="mx-3 mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-800 text-xs animate-fadeIn shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="truncate">{fileErrorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setFileErrorMessage(null)}
              className="p-1 rounded-lg text-rose-500 hover:text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
              title="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Reply Banner */}
        {replyTo && (
          <div className="mx-3 mt-2.5 p-2 bg-indigo-50/90 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Reply className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-indigo-900 block">
                  Replying to {replyTo.role === 'model' ? 'Echo AI' : 'You'}
                </span>
                <p className="text-[11px] text-slate-600 truncate max-w-[220px] sm:max-w-lg italic">
                  "{replyTo.text.slice(0, 120)}"
                </p>
              </div>
            </div>
            {onCancelReply && (
              <button
                type="button"
                onClick={onCancelReply}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
                title="Cancel reply"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Uploaded File Preview Badge (<15MB support) */}
        {attachedFile && (
          <div className="mx-3 mt-2.5 p-2 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-3 animate-fadeIn shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-indigo-200 flex items-center justify-center shrink-0 shadow-2xs">
                {attachedFile.type.includes('pdf') || attachedFile.name.toLowerCase().endsWith('.pdf') ? (
                  <FileText className="w-4 h-4 text-rose-600" />
                ) : attachedFile.isCodeOrText ? (
                  <FileCode className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Paperclip className="w-4 h-4 text-purple-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate max-w-[190px] sm:max-w-md">
                  {attachedFile.name}
                </p>
                <p className="text-[10px] text-indigo-700 font-medium flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-semibold">
                    {attachedFile.size < 1024 * 1024
                      ? `${(attachedFile.size / 1024).toFixed(1)} KB`
                      : `${(attachedFile.size / (1024 * 1024)).toFixed(2)} MB`}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">
                    {attachedFile.isCodeOrText
                      ? 'Code/Text Ready for Remake'
                      : 'Multimodal <15MB Document Ready'}
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Screenshot / Image Attachment Preview */}
        {attachedImage && (
          <div className="mx-3 mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={attachedImage.dataUrl}
                alt={attachedImage.name || 'Screenshot'}
                className="w-10 h-10 object-cover rounded-lg border border-slate-300 shrink-0 bg-white"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-sm">
                  {attachedImage.name || 'Screenshot'}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">Vision Ready</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Remove screenshot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Text Area */}
        <div className="px-3.5 pt-3 pb-1.5">
          <textarea
            ref={textareaRef}
            id="chat-input-textarea"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              attachedFile
                ? `Tell Echo what to rewrite in ${attachedFile.name}...`
                : attachedImage
                ? "Ask Echo about this image..."
                : "Ask Echo..."
            }
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-base sm:text-sm focus:outline-none resize-none max-h-40 leading-relaxed"
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="px-2.5 sm:px-3 pb-2.5 pt-1.5 flex items-center justify-between gap-1.5 border-t border-slate-100">
          {/* Left tools: Upload File, File Manager, Language Accent, Search */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-[calc(100%-85px)] sm:max-w-none">
            {/* Upload File Button (<15MB support) */}
            <button
              id="upload-file-btn"
              type="button"
              onClick={handleTriggerFileUpload}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs shrink-0"
              title="Upload file under 15MB (Code, HTML, JS, Python, Text, PDF, Image) for AI analysis & remake"
            >
              <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden xs:inline">Upload</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 font-mono font-bold">
                &lt;15MB
              </span>
            </button>

            {/* Quick File Manager button */}
            {onOpenFileWorkspace && (
              <button
                id="input-file-workspace-btn"
                type="button"
                onClick={onOpenFileWorkspace}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
                title="Open File Manager & Code Workspace"
              >
                <FolderCode className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">File Manager</span>
              </button>
            )}

            {/* Quick Language Accent Selector (English / Urdu Toggle) */}
            <button
              id="language-accent-toggle-btn"
              type="button"
              onClick={toggleEnglishUrduAccent}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer border shrink-0 ${
                selectedLanguage === 'ur'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-slate-200'
              }`}
              title="Toggle between English accent and Urdu accent"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-600" />
              <span>{selectedLanguage === 'ur' ? 'اردو' : 'EN'}</span>
            </button>

            {/* Web Search toggle */}
            <button
              id="search-grounding-btn"
              type="button"
              onClick={() => setUseSearchGrounding((prev) => !prev)}
              className={`p-1.5 sm:px-2 sm:py-1 rounded-xl transition-all text-xs font-medium border flex items-center gap-1 shrink-0 ${
                useSearchGrounding
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border-slate-200'
              }`}
              title="Toggle Live Web Search"
            >
              <Globe className={`w-3.5 h-3.5 ${useSearchGrounding ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span className="hidden md:inline">Search</span>
              {useSearchGrounding && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          </div>

          {/* Right tools: Voice Microphone + Send / Stop */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Voice Dictation (Microphone) with Accent Indicator */}
            <button
              id="voice-mic-btn"
              type="button"
              onClick={toggleRecording}
              className={`flex items-center justify-center gap-1 px-2 h-8 rounded-xl transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30 ring-2 ring-rose-300'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
              }`}
              title={
                isRecording
                  ? 'Recording voice... Click to finish'
                  : `Speak in ${selectedLanguage === 'ur' ? 'Urdu' : 'English'} (Voice to Text)`
              }
            >
              {isRecording ? (
                <MicOff className="w-4 h-4 text-white animate-bounce" />
              ) : (
                <Mic className="w-4 h-4 text-slate-600" />
              )}
              <span className="text-[10px] font-bold text-slate-500">
                {selectedLanguage === 'ur' ? 'UR' : 'EN'}
              </span>
            </button>

            {isLoading ? (
              <button
                id="stop-generation-btn"
                type="button"
                onClick={onStop}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                id="send-message-btn"
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() && !attachedImage && !attachedFile}
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer ${
                  input.trim() || attachedImage || attachedFile
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
                title="Send (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-1.5 text-center text-[10px] text-slate-400 font-medium">
        Echo AI • Multimodal & Intelligent Assistant
      </div>
    </div>
  );
};
