import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Send,
  RefreshCw,
  Code2,
  Terminal,
  FileText,
  X
} from 'lucide-react';
import { useAppTheme } from '../../context/ThemeContext';
import { AppSettings, UserProfile } from '../../types';

interface PromptGeneratorToolProps {
  settings?: AppSettings;
  userProfile?: UserProfile | null;
  onSendToChat?: (prompt: string) => void;
}

export const PromptGeneratorTool: React.FC<PromptGeneratorToolProps> = ({
  onSendToChat
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  // Theme tokens
  const bgMain = isMoon ? 'bg-[#151515]' : 'bg-[#f8fafc]';
  const bgCard = isMoon ? 'bg-[#20201f]' : 'bg-white';
  const bgInput = isMoon ? 'bg-[#181818]' : 'bg-[#f1f5f9]';
  const border = isMoon ? 'border-[#2b2b2a]' : 'border-[#e2e8f0]';
  const textBright = isMoon ? 'text-white' : 'text-slate-900';
  const textSub = isMoon ? 'text-[#a3a3a3]' : 'text-slate-500';

  // Clean state — NO PRE-ADDED WALLS OF TEXT
  const [userInput, setUserInput] = useState<string>('');
  const [category, setCategory] = useState<'app' | 'component' | 'fix' | 'api'>('app');
  const [style, setStyle] = useState<'direct' | 'detailed'>('direct');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);

  // Generate structured prompt
  const generatedPrompt = userInput.trim()
    ? `### [TASK OBJECTIVE]
${userInput.trim()}

### [ROLE & SCOPE]
Act as a Senior Principal Engineer. Target: ${
        category === 'app'
          ? 'Full-Stack Web Application'
          : category === 'component'
          ? 'Clean Interactive UI Component'
          : category === 'fix'
          ? 'Bug Fix & Performance Optimization'
          : 'Backend REST API & Architecture'
      }.

### [REQUIREMENTS & CONSTRAINTS]
- Implement production-ready, clean, functional code with zero lag.
- Follow anti-AI slop standards: sharp typography, fluid responsive layout, zero generic placeholders.
- Handle edge cases, loading states, and error handling gracefully.

### [OUTPUT FORMAT]
${
  style === 'direct'
    ? 'Provide clean, drop-in production code with clear inline explanations.'
    : 'Provide step-by-step architectural breakdown followed by complete implementation code.'
}`
    : '';

  const handleCopy = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSend = () => {
    if (!generatedPrompt) return;
    if (onSendToChat) {
      onSendToChat(generatedPrompt);
    } else {
      handleCopy();
    }
  };

  // AI 1-tap expander
  const handleAiEnhance = async () => {
    if (!userInput.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Convert this rough user prompt into a clear, surgical 2-sentence technical requirement for an AI engineer: "${userInput}". Output ONLY the 2 sentences.`
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.text || data.response || '';
        if (text.trim()) {
          setUserInput(text.trim());
        }
      }
    } catch {}
    setIsEnhancing(false);
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto ${bgMain} font-['Plus_Jakarta_Sans',sans-serif] p-4 sm:p-8`}>
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#20201f] text-[#d97757] border border-[#2b2b2a] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className={`text-lg sm:text-xl font-bold ${textBright}`}>
              Prompt Studio
            </h1>
          </div>
          <p className={`text-xs ${textSub}`}>
            Type what you need. Get a clean, structured prompt that yields accurate, production-grade code.
          </p>
        </div>

        {/* Clean Input Box */}
        <div className={`p-5 rounded-2xl border ${border} ${bgCard} space-y-4 shadow-xs`}>
          <div className="flex items-center justify-between">
            <label className={`text-xs font-bold ${textBright}`}>
              What do you want to build or fix?
            </label>
            {userInput && (
              <button
                type="button"
                onClick={handleAiEnhance}
                disabled={isEnhancing}
                className="text-[11px] font-semibold text-[#d97757] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
                <span>{isEnhancing ? 'Enhancing...' : 'AI Refine'}</span>
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g. Build an invoice generator with live PDF preview, tax calculation, and download..."
              className={`w-full p-3.5 pr-8 rounded-xl border ${border} ${bgInput} ${textBright} text-xs sm:text-sm focus:outline-none placeholder:text-neutral-500 leading-relaxed resize-none`}
            />
            {userInput && (
              <button
                type="button"
                onClick={() => setUserInput('')}
                className="absolute top-3 right-3 text-neutral-500 hover:text-white p-1 cursor-pointer"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Clean Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className={`text-[11px] font-semibold ${textSub} mr-1`}>Type:</span>
              {[
                { id: 'app', label: 'Full App' },
                { id: 'component', label: 'Component' },
                { id: 'fix', label: 'Fix Bug' },
                { id: 'api', label: 'Backend API' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCategory(t.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    category === t.id
                      ? 'bg-[#d97757] text-white shadow-xs font-bold'
                      : `${bgInput} ${textSub} hover:${textBright} border ${border}`
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className={`text-[11px] font-semibold ${textSub} mr-1`}>Style:</span>
              {[
                { id: 'direct', label: 'Direct Code' },
                { id: 'detailed', label: 'Step-by-Step' }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    style === s.id
                      ? 'bg-[#d97757] text-white shadow-xs font-bold'
                      : `${bgInput} ${textSub} hover:${textBright} border ${border}`
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Structured Output Card */}
        {generatedPrompt ? (
          <div className={`p-5 rounded-2xl border ${border} ${bgCard} space-y-3 shadow-xs`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#d97757]" />
                <h3 className={`text-xs font-bold ${textBright}`}>Structured Prompt Output</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isCopied
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : `${bgInput} ${textBright} ${border} hover:border-[#d97757]`
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  className="px-3.5 py-1.5 rounded-lg bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Use in Chat</span>
                </button>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${border} ${bgInput} font-mono text-xs ${textBright} whitespace-pre-wrap leading-relaxed select-all`}>
              {generatedPrompt}
            </div>
          </div>
        ) : (
          <div className={`p-8 rounded-2xl border border-dashed ${border} text-center ${textSub}`}>
            <p className="text-xs">Type your idea above to instantly generate your structured prompt.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptGeneratorTool;
