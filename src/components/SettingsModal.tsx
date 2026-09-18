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
  Code2,
  Volume2
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
    deepseekApiKey: settings.deepseekApiKey || localStorage.getItem('deepseek_api_key') || localStorage.getItem('echo_deepseek_api_key') || '',
    openaiApiKey: settings.openaiApiKey || localStorage.getItem('openai_api_key') || localStorage.getItem('echo_openai_api_key') || '',
    customApiKey: settings.customApiKey || localStorage.getItem('gemni_api_key') || localStorage.getItem('GEMNI_API_KEY') || localStorage.getItem('gemini_api_key') || localStorage.getItem('echo_gemini_api_key') || ''
  }));
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...settings,
        deepseekApiKey: settings.deepseekApiKey || localStorage.getItem('deepseek_api_key') || localStorage.getItem('echo_deepseek_api_key') || '',
        openaiApiKey: settings.openaiApiKey || localStorage.getItem('openai_api_key') || localStorage.getItem('echo_openai_api_key') || '',
        customApiKey: settings.customApiKey || localStorage.getItem('gemni_api_key') || localStorage.getItem('GEMNI_API_KEY') || localStorage.getItem('gemini_api_key') || localStorage.getItem('echo_gemini_api_key') || ''
      });
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (formData.deepseekApiKey !== undefined) {
      const clean = formData.deepseekApiKey.trim();
      localStorage.setItem('deepseek_api_key', clean);
      localStorage.setItem('echo_deepseek_api_key', clean);
    }
    if (formData.openaiApiKey !== undefined) {
      const clean = formData.openaiApiKey.trim();
      localStorage.setItem('openai_api_key', clean);
      localStorage.setItem('echo_openai_api_key', clean);
    }
    if (formData.customApiKey !== undefined) {
      const clean = formData.customApiKey.trim();
      localStorage.setItem('gemni_api_key', clean);
      localStorage.setItem('GEMNI_API_KEY', clean);
      localStorage.setItem('gemini_api_key', clean);
      localStorage.setItem('echo_gemini_api_key', clean);
    }
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Application Settings</h2>
              <p className="text-xs text-slate-500">Customize Echo AI model parameters and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Model Selection */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              Default Intelligence Engine
            </label>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((model) => {
                const isSelected = formData.defaultModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => setFormData({ ...formData, defaultModel: model.id })}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300 text-indigo-950'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{model.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono border border-slate-200">
                          {model.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{model.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                Response Creativity / Temperature
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600">
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
              className="w-full accent-indigo-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>0.0 (Fast, Precise & Logical)</span>
              <span>0.7 (Balanced)</span>
              <span>1.0 (Creative & Broad)</span>
            </div>
          </div>

          {/* Google Search Grounding default */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="font-semibold text-slate-800 text-xs">Enable Web Search Grounding</p>
                <p className="text-[11px] text-slate-500">Allows Echo to pull real-time live facts and current info</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.enableSearchGrounding}
              onChange={(e) =>
                setFormData({ ...formData, enableSearchGrounding: e.target.checked })
              }
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Voice & Auto-Speak Response Settings */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-xs">Auto-Speak AI Answers</p>
                <p className="text-[11px] text-slate-500">AI automatically speaks out responses in natural human speech (English, Urdu, Hindi)</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.autoSpeakResponses}
              onChange={(e) =>
                setFormData({ ...formData, autoSpeakResponses: e.target.checked })
              }
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Dedicated API Keys Configuration (DeepSeek for Code & Gemini) */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/80">
              <Key className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900">Custom AI Engine API Keys</h3>
                <p className="text-[11px] text-slate-500">Enable DeepSeek for high-speed code generation & reasoning</p>
              </div>
            </div>

            {/* DeepSeek API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>DeepSeek API Key</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-medium">
                    ⚡ Fast Code Generation
                  </span>
                </label>
                {formData.deepseekApiKey && (
                  <span className="text-[10px] text-emerald-600 font-medium">Configured</span>
                )}
              </div>
              <input
                type="password"
                placeholder="sk-..."
                value={formData.deepseekApiKey || ''}
                onChange={(e) => setFormData({ ...formData, deepseekApiKey: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800"
              />
              <p className="text-[10px] text-slate-400">
                Used to generate, remake, and edit multi-file code via DeepSeek V3 / Coder.
              </p>
            </div>

            {/* Google Gemini / Nano Banana API Key */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Google Gemini & Nano Banana Key</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium">
                    🍌 Nano Banana & Gemini 3.8
                  </span>
                </label>
                {formData.customApiKey && (
                  <span className="text-[10px] text-emerald-600 font-medium">Configured</span>
                )}
              </div>
              <input
                type="password"
                placeholder="AIzaSy... or custom API key"
                value={formData.customApiKey || ''}
                onChange={(e) => setFormData({ ...formData, customApiKey: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-slate-800"
              />
              <p className="text-[10px] text-slate-400">
                Key for Nano Banana image generation (gemini-3.1-flash-lite-image) & Gemini 3.8 models. Supports both GEMNI_API_KEY and GEMINI_API_KEY.
              </p>
            </div>
          </div>

          {/* Danger zone: Clear data */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div>
              <p className="font-semibold text-xs text-rose-600">Reset & Clear Data</p>
              <p className="text-[11px] text-slate-400">Erase all saved chats from local storage</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete all chat history?')) {
                  onClearAllHistory();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
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
