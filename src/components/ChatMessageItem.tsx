import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Clock,
  Zap,
  Maximize2,
  X,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Radio,
  Download,
  FileCode,
  Save,
  FolderCode,
  Folder,
  Archive,
  Reply,
  Brain,
  ChevronDown,
  ChevronRight,
  Languages,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { ChatMessage, SupportedLanguage, UserProfile } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SAPPHIRE_LOGO_URL } from '../data/constants';
import { speechService, detectScriptLanguage, translateText } from '../services/speechService';
import { getLanguageConfig } from '../data/languages';
import {
  extractCodeFilesFromMarkdown,
  downloadFilesAsZip,
  autoSaveFile
} from '../services/fileStorageService';
import { loadUserProfile } from '../services/userService';

interface ChatMessageItemProps {
  message: ChatMessage;
  language?: SupportedLanguage;
  userProfile?: UserProfile | null;
  onRegenerate?: () => void;
  onEditPrompt?: (text: string) => void;
  onPreviewCode?: (code: string, language: string, filename?: string) => void;
  onOpenFileWorkspace?: (fileId?: string) => void;
  onOpenFileInManager?: (fileId?: string) => void;
  onReply?: (message: ChatMessage) => void;
}

const GeneratedVisualCard: React.FC<{
  imgUrl: string;
  prompt?: string;
}> = ({ imgUrl, prompt }) => {
  const [src, setSrc] = useState(imgUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setSrc(imgUrl);
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
  }, [imgUrl]);

  const handleError = () => {
    if (retryCount === 0 && !src.includes('/api/image/proxy')) {
      // First fallback: route through backend proxy
      setRetryCount(1);
      setSrc(`/api/image/proxy?url=${encodeURIComponent(imgUrl)}`);
    } else if (retryCount === 1) {
      // Second fallback: alternate high-entropy seed
      setRetryCount(2);
      const cleanP = (prompt || 'vibrant visual artwork').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
      const altUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanP)}?seed=${Math.floor(Math.random() * 900000 + 100000)}&width=1024&height=1024&nologo=true`;
      setSrc(`/api/image/proxy?url=${encodeURIComponent(altUrl)}`);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (src.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = src;
        link.download = `echo_visual_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      const response = await fetch(src, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `echo_visual_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch {
      window.open(src, '_blank');
    }
  };

  return (
    <>
      <div className="group/genimg relative rounded-2xl overflow-hidden border border-slate-700/60 bg-[#0a0f1d] shadow-md transition-all hover:shadow-indigo-500/10 hover:border-indigo-500/40">
        {isLoading && (
          <div className="w-full h-64 sm:h-72 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 animate-pulse flex flex-col items-center justify-center gap-2.5 text-slate-400 p-4">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-spin">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-200">Synthesizing high-res visual...</p>
            <p className="text-[11px] text-indigo-400 font-mono">Neural Generative Diffusion</p>
          </div>
        )}

        {hasError ? (
          <div className="w-full h-60 bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
            <p className="text-xs font-semibold text-slate-200">Unable to display visual</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs truncate">{prompt}</p>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                setRetryCount(0);
                setSrc(`https://image.pollinations.ai/prompt/${encodeURIComponent((prompt || 'visual') + ' masterpiece 8k')}?seed=${Date.now()}&width=1024&height=1024&nologo=true`);
              }}
              className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              Retry Visual
            </button>
          </div>
        ) : (
          <img
            src={src}
            alt={prompt || 'Generated visual'}
            referrerPolicy="no-referrer"
            className={`w-full max-h-80 object-cover cursor-pointer transition-transform duration-300 group-hover/genimg:scale-102 ${isLoading ? 'hidden' : 'block'}`}
            onLoad={() => setIsLoading(false)}
            onError={handleError}
            onClick={() => setIsZoomed(true)}
          />
        )}

        {!isLoading && !hasError && (
          <>
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover/genimg:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-xl bg-black/80 hover:bg-black text-white text-xs backdrop-blur-md flex items-center gap-1.5 shadow-lg border border-white/10 transition-all active:scale-95 cursor-pointer"
                title="Download full quality visual"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Download</span>
              </button>
            </div>
            <div className="p-2.5 bg-slate-950/95 backdrop-blur-md text-white flex items-center justify-between text-[11px] border-t border-white/5">
              <span className="flex items-center gap-1.5 text-indigo-300 font-semibold truncate max-w-[220px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{prompt || 'Echo Generative Visual'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
                1024×1024
              </span>
            </div>
          </>
        )}
      </div>

      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={src}
              alt={prompt || 'Full view'}
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res</span>
              </button>
              <button
                onClick={() => setIsZoomed(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  language = 'auto',
  userProfile,
  onRegenerate,
  onEditPrompt,
  onPreviewCode,
  onOpenFileWorkspace,
  onOpenFileInManager,
  onReply
}) => {
  const activeProfile = userProfile || loadUserProfile();
  const userName = activeProfile?.name && activeProfile.name.trim() ? activeProfile.name.trim() : 'You';
  const userAvatar = activeProfile?.avatar || activeProfile?.avatarUrl;

  const [copied, setCopied] = useState(false);
  const [fileSavedFeedback, setFileSavedFeedback] = useState(false);
  const [isZoomedImageOpen, setIsZoomedImageOpen] = useState(false);
  const [isSpeakingThis, setIsSpeakingThis] = useState(false);
  const [isSpeakingTranslation, setIsSpeakingTranslation] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipDone, setZipDone] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [thinkingElapsed, setThinkingElapsed] = useState(1);

  // Keep thinking collapsed by default like Image 2; ensure collapsed when answer text is present
  useEffect(() => {
    if (message.text) {
      setIsThinkingExpanded(false);
    }
  }, [message.text]);

  // Thinking live timer
  useEffect(() => {
    if (!message.isThinking) return;
    const timer = setInterval(() => {
      setThinkingElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [message.isThinking]);

  const openWorkspaceHandler = onOpenFileWorkspace || onOpenFileInManager;
  const isUser = message.role === 'user';

  // Extract multiple code files if present in AI response
  const extractedFiles = useMemo(() => {
    if (isUser || !message.text) return [];
    return extractCodeFilesFromMarkdown(message.text);
  }, [isUser, message.text]);

  // Handler to download all generated files as a full ZIP folder
  const handleDownloadFullFolderZip = async () => {
    if (extractedFiles.length === 0 || isZipping) return;
    setIsZipping(true);
    try {
      await downloadFilesAsZip(
        extractedFiles.map((f) => ({
          name: f.name,
          content: f.content,
          path: f.path
        })),
        `echo_project_${Date.now()}.zip`
      );
      setZipDone(true);
      setTimeout(() => setZipDone(false), 3000);
    } catch (err) {
      console.error('Failed to download project zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Handler to save all files from message into File & Workspace
  const handleSaveAllToWorkspace = () => {
    if (extractedFiles.length === 0) return;
    let firstFileId = '';
    for (const f of extractedFiles) {
      const saved = autoSaveFile({
        name: f.name,
        path: f.path,
        content: f.content,
        language: f.language,
        source: 'ai-generated'
      });
      if (!firstFileId) firstFileId = saved.id;
    }
    if (openWorkspaceHandler) {
      openWorkspaceHandler(firstFileId);
    }
  };

  const handleSaveToFileLocation = async () => {
    if (!message.modifiedFileContent) return;
    const fileName = message.modifiedFileName || 'updated_file.txt';

    // Try direct file handle write if available from File System Access API
    const handle = message.attachedFile?.fileHandle;
    if (handle && typeof handle.createWritable === 'function') {
      try {
        const writable = await handle.createWritable();
        await writable.write(message.modifiedFileContent);
        await writable.close();
      } catch (err) {
        console.warn('Direct file handle write failed, falling back to download:', err);
      }
    }

    // Trigger instant browser download with the original filename so file is saved locally
    const blob = new Blob([message.modifiedFileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFileSavedFeedback(true);
    setTimeout(() => setFileSavedFeedback(false), 3000);
  };

  // Auto-detect Urdu vs English
  const detectedIsUrdu = useMemo(() => {
    return detectScriptLanguage(message.text) === 'ur';
  }, [message.text]);

  // Listen to speech service state
  useEffect(() => {
    const unsubscribe = speechService.subscribe((state) => {
      setIsSpeakingThis(state.isSpeaking && state.currentMessageId === message.id);
      setIsSpeakingTranslation(state.isSpeaking && state.currentMessageId === `${message.id}-translated`);
    });
    return () => unsubscribe();
  }, [message.id]);

  const handleToggleSpeech = () => {
    if (isSpeakingThis) {
      speechService.stop();
    } else {
      speechService.stop();
      // Auto-detect language (Urdu if Urdu script or Roman Urdu, English if English)
      const script = detectScriptLanguage(message.text);
      const targetLang = language && language !== 'auto' ? language : script;

      speechService.speak(message.text, {
        messageId: message.id,
        language: targetLang
      });
    }
  };

  const handleSpeakTranslation = () => {
    if (!translatedText) return;
    if (isSpeakingTranslation) {
      speechService.stop();
    } else {
      speechService.stop();
      const targetLang = detectedIsUrdu ? 'en' : 'ur';
      speechService.speak(translatedText, {
        messageId: `${message.id}-translated`,
        language: targetLang
      });
    }
  };

  const handleTranslateAndSpeak = async () => {
    if (isSpeakingTranslation) {
      speechService.stop();
      return;
    }

    if (translatedText) {
      setShowTranslation(true);
      handleSpeakTranslation();
      return;
    }

    if (isTranslating) return;

    setIsTranslating(true);
    try {
      const targetLang = detectedIsUrdu ? 'en' : 'ur';
      const result = await translateText(message.text, targetLang);
      if (result.translatedText) {
        setTranslatedText(result.translatedText);
        setShowTranslation(true);
        speechService.stop();
        speechService.speak(result.translatedText, {
          messageId: `${message.id}-translated`,
          language: targetLang
        });
      }
    } catch (err) {
      console.error('Error translating and speaking:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <>
      <motion.div
        id={`message-${message.id}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`group w-full py-4 sm:py-5 transition-colors ${
          isUser ? 'bg-transparent text-[#edeef2]' : 'bg-[#121316] text-[#edeef2]'
        }`}
      >
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 flex gap-3 sm:gap-4 items-start">
          {/* Avatar - Square with rounded edges (not sharp, not circle) */}
          <div className="shrink-0 mt-0.5">
            {isUser ? (
              userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover bg-[#1c1d22] border border-[#2b2d35]"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#1c1d22] border border-[#2b2d35] flex items-center justify-center text-xs font-semibold text-[#edeef2]">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )
            ) : (
              <div className="relative shrink-0">
                <img
                  src={SAPPHIRE_LOGO_URL}
                  alt="Sapphire AI"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover ring-1 ring-blue-500/30 shadow-xs bg-[#1c1d22]"
                />
                {message.isStreaming && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                )}
              </div>
            )}
          </div>

          {/* Message Content Body */}
          <div className={`flex-1 min-w-0 ${isUser ? 'bg-[#1c1d22] text-[#edeef2] px-4 py-3 rounded-2xl border border-[#2a2d36] max-w-2xl' : 'space-y-3 py-0.5 text-[#edeef2]'}`}>
            {/* Header row: Author & timestamp without model badges */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs sm:text-sm text-[#f3f4f6]">
                  {isUser ? userName : 'Sapphire'}
                </span>
                <span className="text-[11px] text-[#6b7280]">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* User Attached Code or Document File */}
            {message.attachedFile && (
              <div className="mb-2.5">
                <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 font-medium shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <FileCode className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate max-w-[220px] sm:max-w-xs">
                      {message.attachedFile.name}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-mono">
                      {(message.attachedFile.size / 1024).toFixed(1)} KB • Uploaded File
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Rewritten / Modified File Card with Auto-Save */}
            {!isUser && message.modifiedFileContent && (
              <div className="mb-3 p-3 sm:p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {message.modifiedFileName || 'Updated File'}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        Rewritten & Changed by Echo AI
                      </p>
                    </div>
                  </div>

                  {/* Auto-Save & Download Button */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveToFileLocation}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                      title="Auto-save and download this rewritten file to your file location"
                    >
                      {fileSavedFeedback ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Saved to Location!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 text-white" />
                          <span>Auto-Save to File</span>
                        </>
                      )}
                    </button>

                    {openWorkspaceHandler && (
                      <button
                        type="button"
                        onClick={() => openWorkspaceHandler()}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                        title="Open in File & Workspace"
                      >
                        <FolderCode className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">File & Workspace</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User Attached Screenshot / Image */}
            {message.image && (
              <div className="mb-2">
                <div className="relative group/img inline-block max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 shadow-xs">
                  <img
                    src={message.image.dataUrl || `data:${message.image.mimeType};base64,${message.image.base64}`}
                    alt={message.image.name || 'Screenshot'}
                    referrerPolicy="no-referrer"
                    className="max-h-60 w-auto object-contain rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => setIsZoomedImageOpen(true)}
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none p-2">
                    <button
                      type="button"
                      onClick={() => setIsZoomedImageOpen(true)}
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-semibold flex items-center gap-1 shadow-md pointer-events-auto transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                  {message.image.name && (
                    <div className="px-2.5 py-1 bg-slate-900/75 backdrop-blur-xs text-[10px] text-white flex items-center gap-1.5 font-medium">
                      <ImageIcon className="w-3 h-3 text-amber-400" />
                      <span className="truncate max-w-[200px]">{message.image.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Generated Images Showcase */}
            {message.generatedImages && message.generatedImages.length > 0 && (
              <div className="mb-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {message.generatedImages.map((imgUrl, idx) => (
                    <GeneratedVisualCard
                      key={idx}
                      imgUrl={imgUrl}
                      prompt={message.generatedImagePrompt}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Multiple Files Project Folder Download Banner */}
            {!isUser && extractedFiles.length > 1 && (
              <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/95 via-slate-900 to-slate-950 border border-indigo-500/30 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        <Archive className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-100">
                        Generated Project Folder ({extractedFiles.length} files)
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {extractedFiles.map((f, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-[11px] font-mono border border-slate-700/60"
                        >
                          <FileCode className="w-3 h-3 text-indigo-400" />
                          <span>{f.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                    {/* Preview All Files (Live App Sandbox) Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const htmlFile = extractedFiles.find((f) => f.name.endsWith('.html')) || extractedFiles[0];
                        if (htmlFile && onPreviewCode) {
                          extractedFiles.forEach((f) => {
                            autoSaveFile({
                              name: f.name,
                              path: `/${f.name}`,
                              content: f.content,
                              language: f.language,
                              source: 'ai-generated'
                            });
                          });
                          onPreviewCode(htmlFile.content, htmlFile.language, htmlFile.name);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d97757] hover:bg-[#c66b4d] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                      title="Preview all generated files together in live app sandbox"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview All Files</span>
                    </button>

                    {/* Full Folder ZIP Download Button */}
                    <button
                      type="button"
                      onClick={handleDownloadFullFolderZip}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#242320] hover:bg-[#2e2c29] border border-[#383633] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                      title="Download all files in this project as a full ZIP folder"
                    >
                      {isZipping ? (
                        <>
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Zipping...</span>
                        </>
                      ) : zipDone ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Downloaded ZIP!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-white" />
                          <span>Download ZIP</span>
                        </>
                      )}
                    </button>

                    {/* Open All in File & Workspace */}
                    {openWorkspaceHandler && (
                      <button
                        type="button"
                        onClick={handleSaveAllToWorkspace}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#242320] hover:bg-[#2e2c29] border border-[#383633] text-slate-200 text-xs font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        title="Open all generated files in File & Workspace"
                      >
                        <Folder className="w-3.5 h-3.5 text-[#d97757]" />
                        <span>Open in Workspace</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quoted Reply Preview */}
            {message.replyTo && (
              <div className="mb-2.5 p-2 rounded-xl bg-slate-100/95 border-l-3 border-indigo-500 text-xs text-slate-700 flex items-start gap-2 shadow-2xs">
                <Reply className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-indigo-900 block text-[11px]">
                    {message.replyTo.role === 'model' ? 'Echo AI' : 'You'}
                  </span>
                  <p className="truncate text-slate-600 text-[11px] italic">
                    "{message.replyTo.text}"
                  </p>
                </div>
              </div>
            )}

            {/* Live AI Thinking & Reasoning Process - 1:1 with Image 2 */}
            {!isUser && (message.isThinking || message.thinkingText) && (
              <div className="relative overflow-hidden mb-3 rounded-2xl border border-indigo-100/90 bg-[#f8faff] hover:bg-white transition-all px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                  className="w-full flex items-center justify-between text-left select-none cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50/90 text-indigo-600 flex items-center justify-center border border-indigo-100/90 shrink-0 shadow-2xs">
                      <Brain className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${message.isThinking ? 'animate-pulse text-indigo-600' : 'text-indigo-600'}`} />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-800 text-xs sm:text-sm">Thinking Process</span>
                      <span className="font-mono text-xs text-indigo-500 font-normal">
                        ({message.isThinking ? `${thinkingElapsed}s` : message.thinkingDurationMs ? `${(message.thinkingDurationMs / 1000).toFixed(0)}s` : `${thinkingElapsed}s`})
                      </span>
                      <span className={`w-2 h-2 rounded-full ${message.isThinking ? 'bg-indigo-400 animate-ping' : 'bg-indigo-200'} ml-1 shrink-0`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-indigo-600 group-hover:text-indigo-800 font-medium">
                    <span>{isThinkingExpanded ? 'Hide' : 'View thoughts'}</span>
                    {isThinkingExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* Loading animation bar while thinking or searching */}
                {message.isThinking && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] overflow-hidden rounded-b-2xl bg-indigo-100/50">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                      className="h-full w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                    />
                  </div>
                )}

                {/* Expanded Thinking Thoughts */}
                {isThinkingExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.25 }}
                    className="mt-2.5 pt-2.5 border-t border-indigo-100/80 text-xs text-slate-600 font-mono leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto pr-1"
                  >
                    {message.thinkingText || (
                      <div className="flex items-center gap-2 text-indigo-600 italic py-1">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Formulating architectural logic, validating requirements, and constructing solution...</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Text Content */}
            <div className="text-slate-700 break-words">
              {isUser ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 font-medium">
                  {message.text}
                </div>
              ) : (
                <div>
                  {message.text ? (
                    <MarkdownRenderer
                      content={message.text}
                      onPreviewCode={onPreviewCode}
                      onOpenFileWorkspace={openWorkspaceHandler}
                    />
                  ) : message.isStreaming && !message.isThinking ? (
                    <div className="flex items-center gap-1.5 py-2 text-slate-400">
                      <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 rounded-full bg-indigo-500" />
                      <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 rounded-full bg-indigo-500" />
                      <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 rounded-full bg-indigo-500" />
                    </div>
                  ) : null}

                  {/* Blinking streaming cursor when text is actively arriving */}
                  {message.isStreaming && message.text && (
                    <span className="inline-block w-2 h-4 ml-1 bg-indigo-600 animate-pulse rounded-xs align-middle" />
                  )}
                </div>
              )}
            </div>

            {/* Error Banner */}
            {message.error && (
              <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-rose-900">Sapphire Notice</p>
                  <p className="text-xs text-rose-700 mt-0.5">{message.error}</p>
                  {onRegenerate && (
                    <button
                      id={`retry-btn-${message.id}`}
                      onClick={onRegenerate}
                      className="mt-2 text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors shadow-xs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry with Sapphire
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Minimalist 5-Icon Action Bar directly matching image.png */}
            {!message.isStreaming && !message.error && message.text && !isUser && (
              <div className="flex items-center gap-1.5 pt-2 text-[#8b8e98] select-none">
                {/* 1. Copy icon */}
                <button
                  type="button"
                  id={`copy-msg-${message.id}`}
                  onClick={handleCopy}
                  className="p-1 text-[#8b8e98] hover:text-[#f3f4f6] transition-colors cursor-pointer rounded hover:bg-[#1c1d22]"
                  title={copied ? 'Copied' : 'Copy'}
                  aria-label="Copy"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                {/* 2. Speaker icon */}
                <button
                  type="button"
                  id={`speak-msg-${message.id}`}
                  onClick={handleToggleSpeech}
                  className={`p-1 transition-colors cursor-pointer rounded hover:bg-[#1c1d22] ${
                    isSpeakingThis ? 'text-blue-400' : 'text-[#8b8e98] hover:text-[#f3f4f6]'
                  }`}
                  title={isSpeakingThis ? 'Stop voice' : 'Listen with voice'}
                  aria-label="Listen"
                >
                  {isSpeakingThis ? <VolumeX className="w-4 h-4 text-blue-400 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* 3. Thumbs up icon */}
                <button
                  type="button"
                  onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                  className={`p-1 transition-colors cursor-pointer rounded hover:bg-[#1c1d22] ${
                    feedback === 'up' ? 'text-blue-400' : 'text-[#8b8e98] hover:text-[#f3f4f6]'
                  }`}
                  title="Good response"
                  aria-label="Thumbs up"
                >
                  <ThumbsUp className={`w-4 h-4 ${feedback === 'up' ? 'fill-blue-400/30' : ''}`} />
                </button>

                {/* 4. Thumbs down icon */}
                <button
                  type="button"
                  onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                  className={`p-1 transition-colors cursor-pointer rounded hover:bg-[#1c1d22] ${
                    feedback === 'down' ? 'text-rose-400' : 'text-[#8b8e98] hover:text-[#f3f4f6]'
                  }`}
                  title="Bad response"
                  aria-label="Thumbs down"
                >
                  <ThumbsDown className={`w-4 h-4 ${feedback === 'down' ? 'fill-rose-400/30' : ''}`} />
                </button>

                {/* 5. Regenerate icon */}
                {onRegenerate && (
                  <button
                    type="button"
                    id={`regenerate-msg-${message.id}`}
                    onClick={onRegenerate}
                    className="p-1 text-[#8b8e98] hover:text-[#f3f4f6] transition-colors cursor-pointer rounded hover:bg-[#1c1d22]"
                    title="Regenerate response"
                    aria-label="Regenerate"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                {/* Active Speaking Indicator */}
                {isSpeakingThis && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1c1d22] border border-[#2b2d35] text-[#edeef2] text-[11px] font-medium animate-fadeIn ml-2">
                    <span className="flex items-center gap-0.5">
                      <span className="w-1 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-3.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-[10px] text-blue-300">Playing voice</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Zoomed Screenshot Modal */}
      {isZoomedImageOpen && message.image && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsZoomedImageOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 truncate">
                {message.image.name || 'Screenshot Preview'}
              </span>
              <button
                onClick={() => setIsZoomedImageOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center max-h-[80vh]">
              <img
                src={message.image.dataUrl || `data:${message.image.mimeType};base64,${message.image.base64}`}
                alt={message.image.name || 'Zoomed Screenshot'}
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

