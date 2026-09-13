import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Languages,
  ArrowRightLeft,
  Copy,
  Check,
  Sparkles,
  Send,
  Sliders,
  Play,
  Square
} from 'lucide-react';
import { speechService, detectScriptLanguage, translateText } from '../services/speechService';

interface VoiceTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
  initialText?: string;
}

export const VoiceTranslatorModal: React.FC<VoiceTranslatorModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
  initialText = ''
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslated, setCopiedTranslated] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechType, setActiveSpeechType] = useState<'original' | 'translated' | null>(null);

  // Sync initialText if passed
  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  // Subscribe to speech service state
  useEffect(() => {
    const unsubscribe = speechService.subscribe((state) => {
      setIsSpeaking(state.isSpeaking);
      if (!state.isSpeaking) {
        setActiveSpeechType(null);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const detectedScript = detectScriptLanguage(inputText);
  const isUrduInput = detectedScript === 'ur';

  // Play Real Voice for Original Text
  const handleSpeakOriginal = () => {
    if (isSpeaking && activeSpeechType === 'original') {
      speechService.stop();
      setActiveSpeechType(null);
      return;
    }

    speechService.stop();
    setActiveSpeechType('original');
    speechService.speak(inputText, {
      messageId: 'modal-original',
      speed: selectedSpeed,
      onEnd: () => setActiveSpeechType(null),
      onError: () => setActiveSpeechType(null)
    });
  };

  // Play Real Voice for Translated Text
  const handleSpeakTranslated = () => {
    if (!translatedText) return;

    if (isSpeaking && activeSpeechType === 'translated') {
      speechService.stop();
      setActiveSpeechType(null);
      return;
    }

    speechService.stop();
    setActiveSpeechType('translated');
    const targetScript = detectScriptLanguage(translatedText);
    speechService.speak(translatedText, {
      messageId: 'modal-translated',
      language: targetScript,
      speed: selectedSpeed,
      onEnd: () => setActiveSpeechType(null),
      onError: () => setActiveSpeechType(null)
    });
  };

  // Translate and optionally speak
  const handleTranslate = async (autoSpeak: boolean = false) => {
    if (!inputText.trim() || isTranslating) return;

    setIsTranslating(true);
    try {
      // If input is Urdu -> target is English. If English -> target is Urdu
      const targetLang = isUrduInput ? 'en' : 'ur';
      const result = await translateText(inputText, targetLang);
      setTranslatedText(result.translatedText);

      if (autoSpeak && result.translatedText) {
        setActiveSpeechType('translated');
        speechService.speak(result.translatedText, {
          messageId: 'modal-translated-auto',
          language: targetLang,
          speed: selectedSpeed,
          onEnd: () => setActiveSpeechType(null),
          onError: () => setActiveSpeechType(null)
        });
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async (text: string, type: 'orig' | 'trans') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'orig') {
        setCopiedOriginal(true);
        setTimeout(() => setCopiedOriginal(false), 2000);
      } else {
        setCopiedTranslated(true);
        setTimeout(() => setCopiedTranslated(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] animate-fadeIn">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Real Voice &amp; Translator</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Urdu + English
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Studio natural voice with auto-detect for Urdu &amp; English
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Try:
            </span>
            <button
              onClick={() => {
                setInputText('السلام علیکم! میں ایکو اے آئی ہوں۔ میں اردو میں انسان کی طرح قدرتی آواز میں بول سکتا ہوں۔');
                setTranslatedText('');
              }}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs shrink-0 transition-colors border border-slate-200"
            >
              🇵🇰 اردو آواز (Urdu Voice)
            </button>
            <button
              onClick={() => {
                setInputText('Hello! Welcome to Echo AI. I can speak and translate in natural human voice.');
                setTranslatedText('');
              }}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs shrink-0 transition-colors border border-slate-200"
            >
              🇬🇧 English Voice
            </button>
            <button
              onClick={() => {
                setInputText('Aap kaise ho bhai? Mujhe Echo ki voice sunni hai.');
                setTranslatedText('');
              }}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs shrink-0 transition-colors border border-slate-200"
            >
              🗣️ Roman Urdu
            </button>
          </div>

          {/* Input Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Source Text</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isUrduInput
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {isUrduInput ? '🇵🇰 Urdu Detected (اردو)' : '🇬🇧 English Detected'}
                </span>
              </div>
              {inputText && (
                <button
                  onClick={() => handleCopy(inputText, 'orig')}
                  className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                  {copiedOriginal ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedOriginal ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste any text in English, Urdu (اردو), or Roman Urdu here..."
              rows={3}
              className="w-full text-sm sm:text-base text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 resize-none font-sans"
              dir={isUrduInput ? 'rtl' : 'ltr'}
            />

            {/* Controls Row */}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Real Voice Button for Original */}
                <button
                  onClick={handleSpeakOriginal}
                  disabled={!inputText.trim()}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSpeaking && activeSpeechType === 'original'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSpeaking && activeSpeechType === 'original' ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Speak in Real Voice ({isUrduInput ? 'Urdu' : 'English'})</span>
                    </>
                  )}
                </button>

                {/* Speed Selector */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs text-slate-600">
                  <span className="px-1 text-[10px] text-slate-400 font-medium">Speed:</span>
                  {[0.8, 1.0, 1.25].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setSelectedSpeed(speed)}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        selectedSpeed === speed ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Action: Translate & Speak */}
              <button
                onClick={() => handleTranslate(true)}
                disabled={!inputText.trim() || isTranslating}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTranslating ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Translating &amp; Speaking...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Translate &amp; Speak {isUrduInput ? 'English' : 'اردو'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Translation Result Card */}
          {(translatedText || isTranslating) && (
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3 sm:p-4 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isUrduInput ? 'English Translation' : 'اردو ترجمہ (Urdu Translation)'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-white text-indigo-700 font-bold border border-indigo-200">
                    REAL VOICE READY
                  </span>
                </div>
                {translatedText && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(translatedText, 'trans')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                    >
                      {copiedTranslated ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTranslated ? 'Copied' : 'Copy'}</span>
                    </button>
                    {onSendToChat && (
                      <button
                        onClick={() => {
                          onSendToChat(translatedText);
                          speechService.stop();
                          onClose();
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors ml-1"
                        title="Send this translation into chat"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to Chat</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isTranslating ? (
                <div className="p-4 bg-white/80 rounded-xl border border-indigo-100 flex items-center justify-center gap-2 text-indigo-600 text-xs font-medium">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Translating naturally and preparing studio human voice...</span>
                </div>
              ) : (
                <div
                  className="w-full text-sm sm:text-base text-slate-900 bg-white border border-indigo-100 rounded-xl p-3 font-sans leading-relaxed whitespace-pre-wrap"
                  dir={!isUrduInput ? 'rtl' : 'ltr'}
                >
                  {translatedText}
                </div>
              )}

              {/* Translation Voice Audio Bar */}
              {translatedText && !isTranslating && (
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleSpeakTranslated}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                      isSpeaking && activeSpeechType === 'translated'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isSpeaking && activeSpeechType === 'translated' ? (
                      <>
                        <VolumeX className="w-4 h-4 animate-bounce" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Listen to Translation in Real Voice</span>
                      </>
                    )}
                  </button>

                  {/* Visual Waveform indicator when playing */}
                  {isSpeaking && activeSpeechType === 'translated' && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 rounded-lg text-emerald-800 text-xs font-medium">
                      <span>Speaking now</span>
                      <span className="flex gap-0.5 items-end h-3 ml-1">
                        <span className="w-1 h-2 bg-emerald-600 animate-pulse" />
                        <span className="w-1 h-3 bg-emerald-600 animate-pulse delay-75" />
                        <span className="w-1 h-1.5 bg-emerald-600 animate-pulse delay-150" />
                        <span className="w-1 h-3.5 bg-emerald-600 animate-pulse delay-200" />
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Automatic Urdu &amp; English pronunciation engine active</span>
          </span>
          <button
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
