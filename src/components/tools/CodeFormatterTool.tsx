import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Sparkles,
  Minimize2,
  Maximize2,
  FileCode
} from 'lucide-react';

export const CodeFormatterTool: React.FC = () => {
  const [language, setLanguage] = useState<'json' | 'html' | 'css' | 'javascript' | 'sql'>('json');
  const [indentSize, setIndentSize] = useState<2 | 4 | 'tab'>(2);
  const [inputCode, setInputCode] = useState(
    `{"name":"Sapphire AI","status":"active","developer":"Shaheer","modules":["codex","tools","web-cloner"],"config":{"port":3000,"theme":"dark"}}`
  );
  const [outputCode, setOutputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Preset Samples
  const samples: Record<string, string> = {
    json: `{"name":"Sapphire AI","status":"active","developer":"Shaheer","modules":["codex","tools","web-cloner"],"config":{"port":3000,"theme":"dark"}}`,
    html: `<!DOCTYPE html><html><head><title>App</title><link rel="stylesheet" href="style.css"></head><body><div class="card"><h1>Hello World</h1><p>Sapphire Studio</p><button id="btn">Click Me</button></div><script src="script.js"></script></body></html>`,
    css: `body{margin:0;background:#0e0f12;color:#edeef2;font-family:sans-serif}.card{padding:2rem;border-radius:1rem;background:#151722;border:1px solid #292c3d}.btn{background:#3b82f6;color:#fff;padding:.5rem 1rem;border-radius:.5rem}`,
    javascript: `function calculateTotal(items,taxRate=0.08){let sum=items.reduce((acc,item)=>acc+item.price*item.qty,0);return{subtotal:sum,tax:sum*taxRate,total:sum*(1+taxRate)}}const cart=[{id:1,price:25,qty:2},{id:2,price:10,qty:1}];console.log(calculateTotal(cart));`,
    sql: `SELECT u.id,u.name,u.email,COUNT(o.id) as total_orders,SUM(o.amount) as total_spent FROM users u LEFT JOIN orders o ON u.id=o.user_id WHERE u.status='active' GROUP BY u.id,u.name,u.email HAVING total_spent>1000 ORDER BY total_spent DESC LIMIT 50;`
  };

  const getIndent = () => (indentSize === 'tab' ? '\t' : ' '.repeat(indentSize));

  // Beautifier function
  const handleFormat = () => {
    setErrorMsg('');
    if (!inputCode.trim()) {
      setOutputCode('');
      return;
    }

    const ind = getIndent();

    try {
      if (language === 'json') {
        const parsed = JSON.parse(inputCode);
        const formatted = JSON.stringify(parsed, null, indentSize === 'tab' ? '\t' : indentSize);
        setOutputCode(formatted);
        return;
      }

      if (language === 'html' || language === 'css' || language === 'javascript' || language === 'sql') {
        let formatted = '';
        let indentLevel = 0;

        if (language === 'html') {
          // Tokenize tags
          const tokens = inputCode.replace(/>\s*</g, '><').match(/<[^>]+>|[^<]+/g) || [];
          tokens.forEach((token) => {
            token = token.trim();
            if (!token) return;

            // Closing tag
            if (/^<\/[^>]+>/.test(token)) {
              indentLevel = Math.max(0, indentLevel - 1);
              formatted += ind.repeat(indentLevel) + token + '\n';
            }
            // Self-closing tag or void tag
            else if (/^<[^>]+\/>$/.test(token) || /^<(?:img|input|br|hr|meta|link|area|base|col|param)[^>]*>$/i.test(token) || /^<!/.test(token)) {
              formatted += ind.repeat(indentLevel) + token + '\n';
            }
            // Opening tag
            else if (/^<[^\/][^>]*>/.test(token)) {
              formatted += ind.repeat(indentLevel) + token + '\n';
              indentLevel++;
            }
            // Text node
            else {
              formatted += ind.repeat(indentLevel) + token + '\n';
            }
          });
        } else if (language === 'css') {
          const lines = inputCode
            .replace(/\{/g, ' {\n')
            .replace(/\}/g, '\n}\n')
            .replace(/;/g, ';\n')
            .split('\n');

          lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            if (trimmed === '}') {
              indentLevel = Math.max(0, indentLevel - 1);
            }
            formatted += ind.repeat(indentLevel) + trimmed + '\n';
            if (trimmed.endsWith('{')) {
              indentLevel++;
            }
          });
        } else if (language === 'sql') {
          const keywords = [
            'SELECT', 'FROM', 'WHERE', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
            'JOIN', 'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'INSERT INTO',
            'VALUES', 'UPDATE', 'SET', 'DELETE FROM'
          ];
          let query = inputCode;
          keywords.forEach((kw) => {
            const re = new RegExp(`\\b${kw}\\b`, 'gi');
            query = query.replace(re, `\n${kw}`);
          });
          formatted = query
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .join('\n');
        } else {
          // JavaScript
          const lines = inputCode
            .replace(/\{/g, '{\n')
            .replace(/\}/g, '\n}\n')
            .replace(/;/g, ';\n')
            .split('\n');

          lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
              indentLevel = Math.max(0, indentLevel - 1);
            }
            formatted += ind.repeat(indentLevel) + trimmed + '\n';
            if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
              indentLevel++;
            }
          });
        }

        setOutputCode(formatted.trim());
      }
    } catch (err: any) {
      setErrorMsg(`Format Notice: ${err.message || 'Please check code syntax'}`);
    }
  };

  // Minify function
  const handleMinify = () => {
    setErrorMsg('');
    if (!inputCode.trim()) return;

    try {
      if (language === 'json') {
        const parsed = JSON.parse(inputCode);
        setOutputCode(JSON.stringify(parsed));
      } else {
        const minified = inputCode
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
          .replace(/\s+/g, ' ')
          .replace(/\s*([{};:,>+~])\s*/g, '$1')
          .trim();
        setOutputCode(minified);
      }
    } catch (err: any) {
      setErrorMsg(`Minify Notice: ${err.message || 'Could not parse input'}`);
    }
  };

  const handleCopy = () => {
    if (!outputCode) return;
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputCode) return;
    const exts: Record<string, string> = {
      json: 'json',
      html: 'html',
      css: 'css',
      javascript: 'js',
      sql: 'sql'
    };
    const blob = new Blob([outputCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted-code.${exts[language] || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col p-3 sm:p-5 overflow-y-auto space-y-4">
      {/* Top Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Code Formatter & Beautifier</span>
          <span className="text-xs text-zinc-400">· Fast in-browser syntax beautifier & minifier</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['json', 'html', 'css', 'javascript', 'sql'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                setLanguage(lang);
                setInputCode(samples[lang] || '');
                setOutputCode('');
              }}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                language === lang
                  ? 'bg-white text-black border-white font-bold shadow-xs'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700/60'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span>Indent:</span>
            {[2, 4, 'tab'].map((s) => (
              <button
                key={String(s)}
                type="button"
                onClick={() => setIndentSize(s as any)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                  indentSize === s ? 'bg-zinc-700 text-white font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {s === 'tab' ? 'Tab' : `${s} spaces`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFormat}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Beautify Code</span>
          </button>
          <button
            type="button"
            onClick={handleMinify}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
          >
            <Minimize2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Minify</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Split Panes: Input & Formatted Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[380px]">
        {/* Input Code */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950/40 text-xs">
            <span className="font-semibold text-zinc-300">Raw Input Code</span>
            <span className="text-[11px] text-zinc-500">{inputCode.length} chars</span>
          </div>
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Paste code to beautify..."
            className="w-full flex-1 bg-zinc-950 p-3 text-xs font-mono text-zinc-200 outline-hidden resize-none leading-relaxed"
          />
        </div>

        {/* Output Code */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950/40 text-xs">
            <span className="font-semibold text-zinc-300">Formatted Result</span>
            {outputCode && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-semibold"
                  title="Download formatted file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 bg-zinc-950 p-3 overflow-auto">
            {outputCode ? (
              <pre className="text-zinc-200 font-mono text-xs whitespace-pre-wrap select-text leading-relaxed">
                {outputCode}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-1.5">
                <Code2 className="w-6 h-6 opacity-40" />
                <p className="text-xs">Click "Beautify Code" to format</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
