import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Clock,
  FolderOpen,
  Search,
  ChevronDown,
  ChevronRight,
  Send,
  User,
  PanelRightOpen,
  Bot,
  FileText,
  SlidersHorizontal,
  FolderInput,
  Loader2,
  Plug
} from 'lucide-react';
import { AppSettings } from '../types';
import { SAPPHIRE_LOGO_URL } from '../data/constants';
import { useAppTheme } from '../context/ThemeContext';

interface CodexWorkspaceViewProps {
  settings: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
  onClose?: () => void;
}

interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

const WORKSPACE_ITEMS = [
  { icon: FolderOpen, label: 'Default workspace', isFolder: true },
  { icon: FileText, label: 'Meet Sapphire Agent', active: true },
  { icon: FileText, label: 'Q3 summary slides' },
  { icon: FileText, label: 'Review prep' },
  { icon: FileText, label: 'Sales report' },
  { icon: FileText, label: 'Data analysis' },
  { icon: FileText, label: 'Plugin dev' }
];

export const CodexWorkspaceView: React.FC<CodexWorkspaceViewProps> = ({
  settings,
  onUpdateSettings,
  onClose
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState('Meet Sapphire Agent');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: AgentMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: input.trim(),
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const agentMsgId = `agent_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: agentMsgId,
        role: 'agent',
        text: '',
        timestamp: Date.now(),
        isThinking: true
      }
    ]);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: userMsg.text }]
            }
          ],
          systemInstruction:
            'You are Sapphire Agent, an autonomous background AI worker. You help users with coding, file operations, research, and complex tasks. Be precise, logical, and complete. Never truncate responses.',
          model: 'echo-3.7-flash'
        })
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMsgId
                    ? { ...m, text: fullText, isThinking: false }
                    : m
                )
              );
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMsgId
            ? {
                ...m,
                text: `Error: ${err.message || 'Failed to respond'}`,
                isThinking: false
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // === COLORS ===
  const bgMain = isMoon ? 'bg-[#0f0f0f]' : 'bg-[#faf7f2]';
  const bgSidebar = isMoon ? 'bg-[#1a1a1a]' : 'bg-[#f0ebe2]';
  const bgCard = isMoon ? 'bg-[#1e1e1e]' : 'bg-white';
  const bgInput = isMoon ? 'bg-[#252525]' : 'bg-white';
  const bgHover = isMoon ? 'hover:bg-[#252525]' : 'hover:bg-[#e8e2d8]';
  const border = isMoon ? 'border-[#2a2a2a]' : 'border-[#e0dace]';
  const borderSubtle = isMoon ? 'border-[#262626]' : 'border-[#e8e2d8]';
  const text = isMoon ? 'text-white' : 'text-[#2a2620]';
  const textSub = isMoon ? 'text-[#a19e97]' : 'text-[#6b6459]';
  const textMuted = isMoon ? 'text-[#666]' : 'text-[#9a9186]';

  return (
    <div
      className={`h-full w-full flex ${bgMain} ${text} overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]`}
    >
      {/* ============ LEFT SIDEBAR ============ */}
      <aside
        className={`w-[260px] ${bgSidebar} flex flex-col shrink-0 border-r ${borderSubtle}`}
      >
        {/* Top: Logo + Brand — CLICKABLE to go Home */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
              }}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              title="Back to Sapphire Home"
            >
              <img
                src={SAPPHIRE_LOGO_URL}
                alt="Sapphire Agent"
                className="w-7 h-7 rounded-lg object-contain p-0.5 border border-[#e8e2d8] bg-white"
              />
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold text-[15px] ${text} tracking-tight`}
                >
                  Sapphire
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#d97757]/20 text-[#d97757] font-bold tracking-wider">
                  AGENT
                </span>
              </div>
            </button>
            <button
              className={`p-1.5 rounded-lg ${bgHover} ${textSub} cursor-pointer transition-colors`}
              title="Toggle panel"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Session Button */}
        <div className="px-3 pb-3">
          <button
            onClick={() => {
              setMessages([]);
              setActiveSession('New Session');
            }}
            className={`w-full py-2.5 px-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${bgCard} ${text} border ${border} ${bgHover} shadow-xs`}
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </button>
        </div>

        {/* Top Nav Items */}
        <nav className="px-3 pb-3 space-y-0.5">
          <button
            className={`w-full py-2 px-3 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${textSub} ${bgHover} hover:${text}`}
          >
            <Plug className="w-4 h-4" />
            <span>Plugins</span>
          </button>
          <button
            className={`w-full py-2 px-3 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${textSub} ${bgHover} hover:${text}`}
          >
            <Clock className="w-4 h-4" />
            <span>Automation</span>
          </button>
        </nav>

        {/* Workspace Section */}
        <div className="flex-1 flex flex-col overflow-hidden px-3">
          <div
            className={`flex items-center justify-between px-2 py-1.5 ${textMuted}`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              Workspace
            </span>
            <div className="flex items-center gap-0.5">
              <button
                className={`p-1 rounded ${bgHover} cursor-pointer`}
                title="Search"
              >
                <Search className="w-3 h-3" />
              </button>
              <button
                className={`p-1 rounded ${bgHover} cursor-pointer`}
                title="Sort"
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>
              <button
                className={`p-1 rounded ${bgHover} cursor-pointer`}
                title="Import"
              >
                <FolderInput className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5">
            {WORKSPACE_ITEMS.map((item, i) => {
              const Icon = item.icon;
              const isActive = item.active;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (item.isFolder && item.label === 'Default workspace') {
                      if (onClose) onClose();
                    } else {
                      setActiveSession(item.label);
                    }
                  }}
                  className={`w-full py-1.5 px-3 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                    isActive
                      ? `${bgCard} ${text} shadow-sm`
                      : `${textSub} ${bgHover} hover:${text}`
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Profile */}
        <div
          className={`p-3 border-t ${borderSubtle} flex items-center gap-2.5 mt-2`}
        >
          <div
            className={`w-7 h-7 rounded-full ${bgCard} border ${border} flex items-center justify-center shrink-0`}
          >
            <User className={`w-3.5 h-3.5 ${textSub}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-semibold ${text} truncate`}>
              Sapphire
            </p>
            <p className={`text-[11px] ${textMuted} truncate`}>User</p>
          </div>
        </div>
      </aside>

      {/* ============ MAIN AREA ============ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className={`h-11 px-5 flex items-center justify-between border-b ${borderSubtle} shrink-0`}
        >
          <h1 className={`text-[13px] font-medium ${text} truncate`}>
            {activeSession}
          </h1>
          <div className="flex items-center gap-1">
            <button
              className={`p-1.5 rounded-lg ${bgHover} ${textSub} cursor-pointer`}
              title="Toggle right panel"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Welcome message (initial state) */}
            {messages.length === 0 && (
              <div
                className={`text-[14px] ${text} leading-[1.7] space-y-5`}
              >
                <p>
                  I'm <strong>Sapphire Agent</strong>, an open-source agent built
                  on Sapphire's "everything is a plugin" architecture. Run me as
                  a desktop app or launch the web UI from code.
                </p>

                <div>
                  <p className="mb-3">I can help with:</p>
                  <ol className="space-y-2.5 pl-1 list-decimal list-inside">
                    <li>
                      <strong>Everyday work</strong> — Organize files, analyze
                      data, draft docs, and create slides.
                    </li>
                    <li>
                      <strong>Coding</strong> — Explore repos, fix bugs, build
                      features, and run tests.
                    </li>
                    <li>
                      <strong>Research</strong> — Find information, verify facts,
                      and cite sources.
                    </li>
                    <li>
                      <strong>Background tasks</strong> — Run scripts,
                      batch-process files, and track progress.
                    </li>
                    <li>
                      <strong>Plugins</strong> — Add or build plugins to fit your
                      workflow.
                    </li>
                  </ol>
                </div>

                <p>And so much more...</p>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${bgCard} border ${border} ${text} text-[14px] leading-relaxed whitespace-pre-wrap shadow-xs`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Thinking indicator */}
                    {msg.isThinking && (
                      <div
                        className={`flex items-center gap-1.5 text-[12px] ${textMuted} px-2 py-1`}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span>Thought for a while</span>
                      </div>
                    )}

                    {/* Agent Response */}
                    <div
                      className={`text-[14px] ${text} leading-[1.7] whitespace-pre-wrap`}
                    >
                      {msg.text ||
                        (isLoading && msg.role === 'agent' ? (
                          <div className="flex items-center gap-2 text-[13px] text-[#666]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Thinking...</span>
                          </div>
                        ) : (
                          ''
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-6 pb-6 pt-2 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div
              className={`${bgInput} border ${border} rounded-2xl p-3 shadow-sm focus-within:border-[#d97757]/50 transition-colors`}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe what you want to build, / commands, @ files or sessions"
                rows={2}
                disabled={isLoading}
                className={`w-full bg-transparent text-[14px] ${text} placeholder-[#7a7a7a] focus:outline-none resize-none leading-relaxed`}
              />

              <div className="flex items-center justify-between pt-2 mt-1">
                {/* Left Controls */}
                <div className="flex items-center gap-1">
                  <button
                    className={`p-1.5 rounded-lg ${bgHover} ${textSub} cursor-pointer transition-colors`}
                    title="Attach file"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    className={`px-2.5 py-1.5 rounded-lg ${bgHover} ${textSub} text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Workspace Write</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                  <button
                    className={`px-2.5 py-1.5 rounded-lg ${bgHover} ${textSub} text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors`}
                  >
                    <span>Sapphire-V3.7 Flash</span>
                    <span className={`text-[10px] ${textMuted}`}>High</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="w-8 h-8 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    title="Send"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CodexWorkspaceView;