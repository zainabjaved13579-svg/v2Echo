import React, { useState, useMemo } from 'react';
import {
  Code,
  Copy,
  Check,
  Zap,
  HelpCircle,
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';

export const RegexStudioTool: React.FC = () => {
  const [pattern, setPattern] = useState(String.raw`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`);
  const [flags, setFlags] = useState({ g: true, i: true, m: false, s: false, u: false });
  const [testString, setTestString] = useState(
    `Contact our enterprise team at contact@sapphire-studio.ai or dev@shaheer.tech for support.\nBilling queries: billing@cloud.internal. Invalid: test@.com or user@`
  );
  const [replaceTemplate, setReplaceTemplate] = useState('[REDACTED_EMAIL]');
  const [copied, setCopied] = useState(false);

  // Common Presets
  const presets = [
    { label: 'Email Address', pattern: String.raw`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`, flags: 'gi' },
    { label: 'HTTP / HTTPS URL', pattern: String.raw`https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)`, flags: 'gi' },
    { label: 'IPv4 Address', pattern: String.raw`\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b`, flags: 'g' },
    { label: 'Hex Color Code', pattern: String.raw`#(?:[0-9a-fA-F]{3}){1,2}\b`, flags: 'gi' },
    { label: 'Date (YYYY-MM-DD)', pattern: String.raw`\b\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b`, flags: 'g' },
    { label: 'UUID / GUID', pattern: String.raw`\b[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}\b`, flags: 'gi' }
  ];

  const flagStr = useMemo(() => {
    return Object.entries(flags)
      .filter(([_, enabled]) => enabled)
      .map(([f]) => f)
      .join('');
  }, [flags]);

  // Compute Regex Matches
  const analysis = useMemo(() => {
    if (!pattern.trim()) return { matches: [], error: null, replaced: '' };
    try {
      const re = new RegExp(pattern, flagStr);
      const matches: { index: number; text: string; groups: string[] }[] = [];
      let match: RegExpExecArray | null;

      if (flags.g) {
        let count = 0;
        while ((match = re.exec(testString)) !== null && count < 200) {
          matches.push({
            index: match.index,
            text: match[0],
            groups: match.slice(1)
          });
          count++;
          if (match.index === re.lastIndex) re.lastIndex++;
        }
      } else {
        match = re.exec(testString);
        if (match) {
          matches.push({
            index: match.index,
            text: match[0],
            groups: match.slice(1)
          });
        }
      }

      const replaced = testString.replace(re, replaceTemplate);

      return { matches, error: null, replaced };
    } catch (e: any) {
      return { matches: [], error: e.message, replaced: '' };
    }
  }, [pattern, flagStr, testString, replaceTemplate]);

  // Highlight matches in test string
  const highlightedContent = useMemo(() => {
    if (analysis.error || analysis.matches.length === 0) return testString;

    const parts: React.ReactNode[] = [];
    let lastIdx = 0;

    analysis.matches.forEach((m, idx) => {
      if (m.index > lastIdx) {
        parts.push(testString.substring(lastIdx, m.index));
      }
      parts.push(
        <mark
          key={idx}
          className="bg-amber-400/30 text-amber-200 border-b-2 border-amber-400 font-bold px-0.5 rounded-xs"
        >
          {m.text}
        </mark>
      );
      lastIdx = m.index + m.text.length;
    });

    if (lastIdx < testString.length) {
      parts.push(testString.substring(lastIdx));
    }

    return parts;
  }, [testString, analysis]);

  return (
    <div className="h-full flex flex-col p-3 sm:p-5 overflow-y-auto space-y-4">
      {/* Top Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Regex Studio</span>
          <span className="text-xs text-zinc-400">· Real-time regular expression tester & group inspector</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPattern(p.pattern);
                setFlags({
                  g: p.flags.includes('g'),
                  i: p.flags.includes('i'),
                  m: p.flags.includes('m'),
                  s: p.flags.includes('s'),
                  u: p.flags.includes('u')
                });
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 flex items-center gap-2 font-mono text-sm bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5">
          <span className="text-zinc-500 font-bold">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Regular expression pattern..."
            aria-label="Regular expression pattern"
            className="flex-1 bg-transparent text-amber-300 outline-hidden font-mono text-xs sm:text-sm"
          />
          <span className="text-zinc-500 font-bold">/{flagStr}</span>
        </div>

        {/* Flag Toggles */}
        <div className="flex items-center gap-1 shrink-0">
          {(['g', 'i', 'm', 's', 'u'] as const).map((flag) => (
            <button
              key={flag}
              type="button"
              onClick={() => setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }))}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer ${
                flags[flag]
                  ? 'bg-white text-black shadow-xs'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title={`Flag /${flag}`}
            >
              {flag}
            </button>
          ))}
        </div>
      </div>

      {analysis.error && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
          Syntax Error: {analysis.error}
        </div>
      )}

      {/* Split Panes: Test String / Matches / Replacement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[380px]">
        {/* Left: Test String Input */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950/40 text-xs">
            <span className="font-semibold text-zinc-300">Test String Input</span>
            <span className="text-[11px] text-zinc-500">{testString.length} chars</span>
          </div>
          <div className="flex-1 p-3 flex flex-col space-y-2">
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Paste or type sample text here to test your regular expression..."
              className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 outline-hidden resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Right: Live Matches & Group Breakdown */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950/40 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-300">Matches</span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-white font-mono font-bold text-[11px]">
                {analysis.matches.length} found
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(analysis.matches.map((m) => m.text).join('\n'));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Matches</span>
            </button>
          </div>

          <div className="flex-1 p-3 overflow-auto space-y-3 bg-zinc-950 text-xs font-mono">
            {/* Highlighted text preview */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 leading-relaxed whitespace-pre-wrap text-zinc-300">
              {highlightedContent}
            </div>

            {/* Match List */}
            {analysis.matches.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">
                  Captured Matches ({analysis.matches.length})
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {analysis.matches.map((m, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <span className="text-zinc-500 shrink-0">#{i + 1}</span>
                      <span className="text-amber-300 truncate font-semibold">{m.text}</span>
                      <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                        pos {m.index}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Substitution Playground */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">
                Replace / Substitution
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replaceTemplate}
                  onChange={(e) => setReplaceTemplate(e.target.value)}
                  placeholder="Replace with..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 font-mono outline-hidden"
                />
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 whitespace-pre-wrap text-[11px]">
                {analysis.replaced || '(No text)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
