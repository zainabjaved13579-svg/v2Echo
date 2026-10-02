import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Cpu,
  Zap,
  Bot,
  ExternalLink,
  Flame,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppTheme } from '../context/ThemeContext';
import { getAiKeys, saveAiKeys, AiEngineKeys } from '../services/aiKeysService';

interface AiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

export const AiKeysModal: React.FC<AiKeysModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  const [keys, setKeys] = useState<AiEngineKeys>({
    gemini: '',
    deepseek: '',
    openai: '',
    claude: '',
    grok: ''
  });

  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeys(getAiKeys());
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleVisibility = (field: string) => {
    setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    saveAiKeys(keys);
    setIsSaved(true);
    if (onKeysUpdated) onKeysUpdated();
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const engines = [
    {
      id: 'gemini' as keyof AiEngineKeys,
      name: 'Google Gemini',
      badge: '2.5 Flash / Pro',
      icon: Zap,
      color: '#38bdf8',
      placeholder: 'AIzaSy...',
      docsUrl: 'https://aistudio.google.com/app/apikey',
      desc: 'Turbo-speed reasoning with 65k output tokens & full multi-file coding.'
    },
    {
      id: 'deepseek' as keyof AiEngineKeys,
      name: 'DeepSeek',
      badge: 'DeepSeek-R1 / V3',
      icon: Cpu,
      color: '#60a5fa',
      placeholder: 'sk-...',
      docsUrl: 'https://platform.deepseek.com/api_keys',
      desc: 'Deep reasoning chain-of-thought and architectural planning.'
    },
    {
      id: 'claude' as keyof AiEngineKeys,
      name: 'Anthropic Claude',
      badge: 'Claude 3.7 Sonnet',
      icon: Layers,
      color: '#d97757',
      placeholder: 'sk-ant-api03-...',
      docsUrl: 'https://console.anthropic.com/settings/keys',
      desc: 'Master of clean syntax, production refactoring, and pristine code.'
    },
    {
      id: 'grok' as keyof AiEngineKeys,
      name: 'xAI Grok',
      badge: 'Grok 2 / Grok Code',
      icon: Flame,
      color: '#f97316',
      placeholder: 'xai-...',
      docsUrl: 'https://console.x.ai',
      desc: 'Real-time coding intelligence, raw performance, and modern web tasks.'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isMoon ? 'bg-[#151722] border-[#2b2e40] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div
            className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
              isMoon ? 'bg-[#101118] border-[#222533]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#d97757]/15 border border-[#d97757]/30 flex items-center justify-center text-[#d97757]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">AI Engines & API Keys</h3>
                <p className={`text-xs ${isMoon ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Configure Gemini, DeepSeek, Claude, and Grok for expansive coding (No OpenAI key needed)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isMoon ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center gap-3 ${
                isMoon ? 'bg-[#0f1016] border-[#252838]' : 'bg-orange-50/70 border-orange-200 text-orange-950'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-[11px] leading-relaxed">
                Keys are stored locally in your browser and transmitted securely via authenticated server proxy routes. Built-in system quota is used whenever a key is blank.
              </div>
            </div>

            {/* List of 5 Engines */}
            <div className="space-y-3.5">
              {engines.map((eng) => {
                const IconComponent = eng.icon;
                const isVisible = visibleFields[eng.id];
                const value = keys[eng.id];
                const hasValue = Boolean(value && value.trim());

                return (
                  <div
                    key={eng.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isMoon ? 'bg-[#101118] border-[#222533] focus-within:border-[#d97757]' : 'bg-slate-50/80 border-slate-200 focus-within:border-[#d97757]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${eng.color}20`, color: eng.color }}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs">{eng.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            isMoon ? 'bg-zinc-800 text-zinc-300' : 'bg-white border text-slate-600'
                          }`}
                        >
                          {eng.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            hasValue
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isMoon
                              ? 'bg-zinc-800 text-zinc-500'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {hasValue ? 'Active Key' : 'Built-in Key'}
                        </span>

                        <a
                          href={eng.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#d97757] hover:underline flex items-center gap-0.5 font-semibold"
                          title="Get API Key"
                        >
                          <span>Get Key</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    <div className="text-[11px] mb-2.5 text-zinc-400">
                      {eng.desc}
                    </div>

                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                        isMoon ? 'bg-[#090a0f] border-[#252838]' : 'bg-white border-slate-300'
                      }`}
                    >
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={value}
                        onChange={(e) =>
                          setKeys((prev) => ({ ...prev, [eng.id]: e.target.value }))
                        }
                        placeholder={eng.placeholder}
                        className="flex-1 bg-transparent border-none outline-none font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility(eng.id)}
                        className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                        title={isVisible ? 'Hide Key' : 'Show Key'}
                      >
                        {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div
            className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
              isMoon ? 'bg-[#101118] border-[#222533]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`text-[11px] ${isMoon ? 'text-zinc-500' : 'text-slate-500'}`}>
              Multi-engine coding ensemble runs across all configured providers.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  isMoon ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-[#d97757] hover:bg-[#c26546] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Engine Keys</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
