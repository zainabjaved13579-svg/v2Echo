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
  Zap
} from 'lucide-react';
import { AppSettings } from '../types';
import { AVAILABLE_MODELS } from '../data/personas';

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
  const [formData, setFormData] = useState<AppSettings>(() => ({
    ...settings,
    customApiKey: settings.customApiKey || localStorage.getItem('gemni_api_key') || localStorage.getItem('GEMNI_API_KEY') || localStorage.getItem('gemini_api_key') || localStorage.getItem('echo_gemini_api_key') || ''
  }));
  const [openaiApiKey, setOpenaiApiKey] = useState<string>(() => {
    return localStorage.getItem('openai_api_key') || localStorage.getItem('echo_openai_api_key') || '';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...settings,
        customApiKey: settings.customApiKey || localStorage.getItem('gemni_api_key') || localStorage.getItem('GEMNI_API_KEY') || localStorage.getItem('gemini_api_key') || localStorage.getItem('echo_gemini_api_key') || ''
      });
      setOpenaiApiKey(localStorage.getItem('openai_api_key') || localStorage.getItem('echo_openai_api_key') || '');
    }
  }, [isOpen, settings]);

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
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-xl bg-[#201f1d] border border-[#33312e] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2926] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#282724] border border-[#383633] text-[#d97757] flex items-center justify-center">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f5f2eb]">Application Settings</h2>
              <p className="text-xs text-[#86837c]">Configure Sapphire AI engine parameters and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#86837c] hover:text-[#ede8e1] rounded-xl hover:bg-[#282724] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm text-[#ede8e1]">
          {/* Model Selection */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#86837c] flex items-center gap-2">
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
                        ? 'bg-[#282724] border-[#d97757]/60 ring-1 ring-[#d97757]/30 text-[#ede8e1]'
                        : 'bg-[#191817] border-[#2a2926] hover:border-[#383633] hover:bg-[#201f1d] text-[#a19e97]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-[#f5f2eb]' : 'text-[#ede8e1]'}`}>{model.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#201f1d] text-[#86837c] font-mono border border-[#33312e]">
                          {model.tag}
                        </span>
                      </div>
                      <p className="text-xs text-[#86837c] mt-0.5">{model.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#d97757] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2 p-4 rounded-2xl bg-[#191817] border border-[#2a2926]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#ede8e1] flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#d97757]" />
                Response Creativity / Temperature
              </label>
              <span className="text-xs font-mono font-bold text-[#d97757]">
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
              className="w-full accent-[#d97757] bg-[#282724] h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#86837c]">
              <span>0.0 (Fast, Precise & Logical)</span>
              <span>0.7 (Balanced)</span>
              <span>1.0 (Creative & Broad)</span>
            </div>
          </div>

          {/* Search Grounding default */}
          <div className="p-4 rounded-2xl bg-[#191817] border border-[#2a2926] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-[#d97757]" />
              <div>
                <p className="font-semibold text-[#ede8e1] text-xs">Search Grounding</p>
                <p className="text-[11px] text-[#86837c]">Allows Sapphire to pull real-time facts and current info</p>
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
          <div className="p-4 rounded-2xl bg-[#191817] border border-[#2a2926] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#282724] text-[#d97757] flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-[#ede8e1] text-xs">Auto-Speak Responses</p>
                <p className="text-[11px] text-[#86837c]">Automatically speaks responses in natural voice</p>
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

          {/* Dedicated Google AI Studio API Key Configuration */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#191817] border border-[#2a2926]">
            <div className="flex items-center gap-2 pb-1 border-b border-[#2a2926]">
              <Key className="w-4 h-4 text-[#d97757]" />
              <div>
                <h3 className="text-xs font-bold text-[#ede8e1]">Google AI Studio API Key</h3>
                <p className="text-[11px] text-[#86837c]">Optional custom key for autonomous Codex & live preview apps</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <input
                type="password"
                placeholder="AIzaSy... (optional, server proxy is active)"
                value={formData.customApiKey || ''}
                onChange={(e) => setFormData({ ...formData, customApiKey: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#201f1d] border border-[#33312e] rounded-xl focus:outline-none focus:border-[#d97757] font-mono text-[#ede8e1]"
              />
              <p className="text-[10px] text-[#86837c]">
                Leave blank to use Sapphire's integrated auto-switching high-speed backend.
              </p>
            </div>
          </div>

          {/* Dedicated OpenAI API Key Configuration */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#191817] border border-[#2a2926]">
            <div className="flex items-center gap-2 pb-1 border-b border-[#2a2926]">
              <Zap className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-xs font-bold text-[#ede8e1]">OpenAI API Key</h3>
                <p className="text-[11px] text-[#86837c]">Optional key for fast OpenAI GPT-4o Mini & GPT-4o</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <input
                type="password"
                placeholder="sk-proj-... (optional OpenAI key)"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#201f1d] border border-[#33312e] rounded-xl focus:outline-none focus:border-[#d97757] font-mono text-[#ede8e1]"
              />
              <p className="text-[10px] text-[#86837c]">
                Enables ultra-fast direct streaming with OpenAI models.
              </p>
            </div>
          </div>

          {/* Danger zone: Clear data */}
          <div className="pt-2 border-t border-[#2a2926] flex items-center justify-between">
            <div>
              <p className="font-semibold text-xs text-rose-400">Reset & Clear Data</p>
              <p className="text-[11px] text-[#86837c]">Erase all saved chats from local storage</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete all chat history?')) {
                  onClearAllHistory();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2a2926] bg-[#191817] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86837c] hover:text-[#ede8e1] hover:bg-[#282724] transition-colors cursor-pointer"
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
              <span>Save Settings</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default SettingsModal;
