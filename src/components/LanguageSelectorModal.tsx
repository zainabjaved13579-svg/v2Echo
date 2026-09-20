import React from 'react';
import { X, Globe, Check, Volume2, Sparkles, MessageSquare } from 'lucide-react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, LanguageOption } from '../data/languages';
import { speechService } from '../services/speechService';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onSelectSamplePrompt?: (prompt: string) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedLanguage,
  onSelectLanguage,
  onSelectSamplePrompt
}) => {
  if (!isOpen) return null;

  const handleTestVoice = (lang: LanguageOption, e: React.MouseEvent) => {
    e.stopPropagation();
    const sampleText =
      lang.code === 'ur'
        ? 'السلام علیکم! میں آپ کا اسسٹنٹ ہوں۔ میں اردو میں انسان کی طرح روانی سے بات کر سکتا ہوں۔'
        : lang.code === 'hi'
        ? 'नमस्ते! मैं आपका एआई साथी हूँ। मैं आपके साथ सहज और आत्मीय हिंदी में बात कर सकता हूँ।'
        : lang.code === 'es'
        ? '¡Hola! Puedo hablar con una voz natural y humana en español.'
        : lang.code === 'fr'
        ? 'Bonjour! Je peux converser d’une voix naturelle et humaine en français.'
        : lang.code === 'ar'
        ? 'مرحباً! يمكنني التحدث باللغة العربية بأسلوب طبيعي وإنساني.'
        : 'Hello! I can speak and converse naturally with a warm, human-like voice.';

    speechService.speak(sampleText, {
      language: lang.code,
      messageId: `preview-${lang.code}`
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Select AI Language & Human Voice</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Urdu & Hindi Supported
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Choose how Sapphire AI communicates with you — in natural, warm, and fluent human tone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                  }}
                  className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer relative ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/70'
                  }`}
                >
                  <div>
                    {/* Top flag + titles + checkmark */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900">{lang.name}</span>
                            {isSelected && (
                              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-1.5 py-0.2 rounded-md">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-600 font-urdu">{lang.nativeName}</p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </div>

                    {/* Tagline */}
                    <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                      {lang.tagline}
                    </p>
                  </div>

                  {/* Test Speech Sample button */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => handleTestVoice(lang, e)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 hover:underline"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Hear Voice Sample</span>
                    </button>

                    {lang.code === 'ur' && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-100">
                        اردو بولیں
                      </span>
                    )}
                    {lang.code === 'hi' && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-100">
                        हिंदी में बोलें
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Prompts Section for Selected Language */}
          {selectedLanguage && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  Try speaking or asking in{' '}
                  {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name}:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.samplePrompts.map(
                  (prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (onSelectSamplePrompt) {
                          onSelectSamplePrompt(prompt);
                          onClose();
                        }
                      }}
                      className="text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5 shadow-2xs text-left"
                    >
                      <MessageSquare className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>{prompt}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Sapphire AI auto-adapts to your speech and responds in the same language.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
};
