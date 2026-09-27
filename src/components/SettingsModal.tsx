import React, { useState, useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Sliders,
  Cpu,
  Trash2,
  Globe,
  Sparkles,
  Check,
  Key,
  Volume2,
  Zap,
  Sun,
  Moon,
  MessageSquareCode,
  ShieldCheck
} from 'lucide-react';
import { AppSettings } from '../types';
import { AVAILABLE_MODELS } from '../data/personas';
import { useAppTheme } from '../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClearAllHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAllHistory
}) => {
  const { theme, setTheme } = useAppTheme();
  const [formData, setFormData] = useState<AppSettings>(() => ({
    ...settings,
    customApiKey: settings.customApiKey || localStorage.getItem('gemni_api_key') || localStorage.getItem('GEMNI_API_KEY') || localStorage.getItem('gemini_api_key') || localStorage.getItem('echo_gemini_api_key') || '',
    customAiReactionCommand: settings.customAiReactionCommand || localStorage.getItem('sapphire_custom_ai_reaction') || '',
    themePreference: (theme === 'light' ? 'light' : 'moon')
  }));
  const [openaiApiKey, setOpenaiApiKey] = useState<string>(() => {
    return localStorage.getItem('openai_api_key') || localStorage.getItem('echo_openai_api_key') || '';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...settings,
        customApiKey: settings.customApiKey || localStorage.getItem('gemni_api_key') || localStorage.getItem('GEMNI_API_KEY') || localStorage.getItem('gemini_api_key') || localStorage.getItem('echo_gemini_api_key') || '',
        customAiReactionCommand: settings.customAiReactionCommand || localStorage.getItem('sapphire_custom_ai_reaction') || '',
        themePreference: (theme === 'light' ? 'light' : 'moon')
      });
      setOpenaiApiKey(localStorage.getItem('openai_api_key') || localStorage.getItem('echo_openai_api_key') || '');
    }
  }, [isOpen, settings, theme]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (formData.customApiKey !== undefined) {
      const clean = formData.customApiKey.trim();
      localStorage.setItem('gemni_api_key', clean);
      localStorage.setItem('GEMNI_API_KEY', clean);
      localStorage.setItem('gemini_api_key', clean);
    }
    if (openaiApiKey !== undefined) {
      const cleanOpenAI = openaiApiKey.trim();
      if (cleanOpenAI) {
        localStorage.setItem('openai_api_key', cleanOpenAI);
        localStorage.setItem('echo_openai_api_key', cleanOpenAI);
      } else {
        localStorage.removeItem('openai_api_key');
        localStorage.removeItem('echo_openai_api_key');
      }
    }
    if (formData.customAiReactionCommand !== undefined) {
      localStorage.setItem('sapphire_custom_ai_reaction', formData.customAiReactionCommand.trim());
    }
    if (formData.themePreference) {
      setTheme(formData.themePreference);
    }
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`w-full max-w-xl ${isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#201f1d] text-[#ede8e1] border-[#33312e]'} border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191817] border-[#2a2926]'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-[#282724] border-[#383633] text-[#d97757]'} border flex items-center justify-center`}>
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-semibold ${isLight ? 'text-slate-900' : 'text-[#f5f2eb]'}`}>Customize & Settings</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>Theme, AI reaction command, models and parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 ${isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-[#86837c] hover:text-[#ede8e1] hover:bg-[#282724]'} rounded-xl transition-colors cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* 1. Theme Selection: Dark Moon vs Pure White */}
          <div className="space-y-2.5">
            <label className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-slate-600' : 'text-[#86837c]'}`}>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Theme & Visual Styling
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Moon / Dark Theme */}
              <button
                type="button"
                onClick={() => {
                  setTheme('moon');
                  setFormData((prev) => ({ ...prev, themePreference: 'moon' }));
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  theme === 'moon'
                    ? 'bg-[#151515] border-[#d97757] text-white ring-2 ring-[#d97757]/40 shadow-md'
                    : 'bg-[#181817] border-[#2b2b2a] text-[#a19e97] hover:text-white hover:border-[#383633]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Moon className="w-4 h-4 text-[#d97757]" />
                    <span>Dark Moon (Obsidian)</span>
                  </div>
                  {theme === 'moon' && <Check className="w-4 h-4 text-[#d97757]" />}
                </div>
                <p className="text-[11px] text-[#86837c] mt-0.5">Deep black & graphite aesthetic with warm copper accents.</p>
              </button>

              {/* White / Light Theme */}
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  setFormData((prev) => ({ ...prev, themePreference: 'light' }));
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  theme === 'light'
                    ? 'bg-blue-50/50 border-blue-600 text-slate-900 ring-2 ring-blue-500/40 shadow-md'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    : 'bg-[#181817] border-[#2b2b2a] text-[#a19e97] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>White Theme (Light)</span>
                  </div>
                  {theme === 'light' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Clean, bright white backgrounds with crisp high-contrast text.</p>
              </button>
            </div>
          </div>

          {/* 2. Custom AI Reaction Command */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191817] border-[#2a2926]'} space-y-2.5`}>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-[#ede8e1]'}`}>
                <MessageSquareCode className="w-4 h-4 text-[#d97757]" />
                <span>AI Reaction Command (Custom System Instructions)</span>
              </label>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-[#282724] text-[#d97757]'}`}>
                Custom Reaction
              </span>
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>
              Give direct commands to Sapphire AI on how it should react, tone of voice, formatting rules, or persona style:
            </p>
            <textarea
              rows={3}
              value={formData.customAiReactionCommand || ''}
              onChange={(e) => setFormData({ ...formData, customAiReactionCommand: e.target.value })}
              placeholder="e.g. Always generate complete code without placeholder snippets. Be direct, clear, and provide thorough explanations with zero artificial limits..."
              className={`w-full p-3 rounded-xl border text-xs leading-relaxed focus:outline-none focus:border-[#d97757] resize-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-[#121212] border-[#2e2d2a] text-[#ede8e1] placeholder-[#666]'
              }`}
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Ultra-detailed, deep technical architect with step-by-step reasoning',
                'Direct, concise answers with zero fluff and complete code',
                'Patient, friendly tutor for science, math & educational concepts',
                'Full-stack production engineer: complete files, zero shortcuts'
              ].map((cmd, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormData({ ...formData, customAiReactionCommand: cmd })}
                  className={`text-[10.5px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    formData.customAiReactionCommand === cmd
                      ? isLight ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#d97757] text-white border-[#d97757]'
                      : isLight
                      ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-[#20201f] border-[#2e2d2a] text-[#a19e97] hover:text-white hover:bg-[#282724]'
                  }`}
                >
                  + {cmd.slice(0, 32)}...
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2.5">
            <label className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-slate-600' : 'text-[#86837c]'}`}>
              <Cpu className="w-3.5 h-3.5 text-[#d97757]" />
              Default Intelligence Engine
            </label>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((model) => {
                const isSelected = formData.defaultModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => setFormData({ ...formData, defaultModel: model.id })}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-500/30 text-slate-900'
                          : 'bg-[#282724] border-[#d97757]/60 ring-1 ring-[#d97757]/30 text-[#ede8e1]'
                        : isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        : 'bg-[#191817] border-[#2a2926] hover:border-[#383633] hover:bg-[#201f1d] text-[#a19e97]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? isLight ? 'text-blue-900' : 'text-[#f5f2eb]' : isLight ? 'text-slate-900' : 'text-[#ede8e1]'}`}>{model.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#201f1d] border-[#33312e] text-[#86837c]'}`}>
                          {model.tag}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>{model.description}</p>
                    </div>
                    {isSelected && <Check className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-[#d97757]'} shrink-0`} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature Slider */}
          <div className={`space-y-2 p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191817] border-[#2a2926]'}`}>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-[#ede8e1]'}`}>
                <Sliders className="w-3.5 h-3.5 text-[#d97757]" />
                Response Creativity / Temperature
              </label>
              <span className={`text-xs font-mono font-bold ${isLight ? 'text-blue-600' : 'text-[#d97757]'}`}>
                {formData.defaultTemperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={formData.defaultTemperature}
              onChange={(e) =>
                setFormData({ ...formData, defaultTemperature: parseFloat(e.target.value) })
              }
              className={`w-full accent-[#d97757] ${isLight ? 'bg-slate-200' : 'bg-[#282724]'} h-2 rounded-lg cursor-pointer`}
            />
            <div className={`flex justify-between text-[11px] ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>
              <span>0.0 (Precise & Analytical)</span>
              <span>0.7 (Balanced)</span>
              <span>1.0 (Creative & Broad)</span>
            </div>
          </div>

          {/* Search Grounding default */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191817] border-[#2a2926]'}`}>
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-[#d97757]" />
              <div>
                <p className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-[#ede8e1]'}`}>Search Grounding</p>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>Allows Sapphire to pull real-time facts and current info</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.enableSearchGrounding}
              onChange={(e) =>
                setFormData({ ...formData, enableSearchGrounding: e.target.checked })
              }
              className="w-4 h-4 accent-[#d97757] rounded cursor-pointer"
            />
          </div>

          {/* Voice Auto-Speak */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191817] border-[#2a2926]'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-[#282724] text-[#d97757]'} flex items-center justify-center shrink-0`}>
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-[#ede8e1]'}`}>Auto-Speak Responses</p>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>Automatically speaks responses in natural voice</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.autoSpeakResponses}
              onChange={(e) =>
                setFormData({ ...formData, autoSpeakResponses: e.target.checked })
              }
              className="w-4 h-4 accent-[#d97757] rounded cursor-pointer"
            />
          </div>

          {/* Dedicated Google AI Studio API Key */}
          <div className={`space-y-3 p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191817] border-[#2a2926]'}`}>
            <div className={`flex items-center gap-2 pb-1 border-b ${isLight ? 'border-slate-200' : 'border-[#2a2926]'}`}>
              <Key className="w-4 h-4 text-[#d97757]" />
              <div>
                <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-[#ede8e1]'}`}>Google AI Studio API Key</h3>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>Optional custom key for autonomous Codex & live preview apps</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <input
                type="password"
                placeholder="AIzaSy... (optional, server proxy is active)"
                value={formData.customApiKey || ''}
                onChange={(e) => setFormData({ ...formData, customApiKey: e.target.value })}
                className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-[#d97757] font-mono ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#201f1d] border-[#33312e] text-[#ede8e1]'
                }`}
              />
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>
                Leave blank to use Sapphire's integrated auto-switching high-speed backend.
              </p>
            </div>
          </div>

          {/* Dedicated OpenAI API Key */}
          <div className={`space-y-3 p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191817] border-[#2a2926]'}`}>
            <div className={`flex items-center gap-2 pb-1 border-b ${isLight ? 'border-slate-200' : 'border-[#2a2926]'}`}>
              <Zap className="w-4 h-4 text-emerald-500" />
              <div>
                <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-[#ede8e1]'}`}>OpenAI API Key</h3>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>Optional key for fast OpenAI GPT-4o Mini & GPT-4o</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <input
                type="password"
                placeholder="sk-proj-... (optional OpenAI key)"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-[#d97757] font-mono ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#201f1d] border-[#33312e] text-[#ede8e1]'
                }`}
              />
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>
                Enables ultra-fast direct streaming with OpenAI models.
              </p>
            </div>
          </div>

          {/* Danger zone: Clear data */}
          <div className={`pt-2 border-t flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-[#2a2926]'}`}>
            <div>
              <p className="font-semibold text-xs text-rose-500">Reset & Clear Data</p>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>Erase all saved chats from local storage</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete all chat history?')) {
                  onClearAllHistory();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191817] border-[#2a2926]'} flex items-center justify-end gap-2.5`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-[#86837c] hover:text-[#ede8e1] hover:bg-[#282724]'} transition-colors cursor-pointer`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#d97757] hover:bg-[#c86b4c] text-white shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default SettingsModal;
