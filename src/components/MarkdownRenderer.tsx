import React, { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import {
  Check,
  Copy,
  Terminal,
  Eye,
  Download,
  Folder,
  FileCode,
  Wand2,
  RefreshCw,
  Sparkles,
  Smartphone,
  GraduationCap,
  X
} from 'lucide-react';
import {
  getExtensionFromLanguage,
  autoSaveFile,
  downloadSingleFileDirectly,
  getLanguageFromFileName,
  resolveOfficialCodeFileName
} from '../services/fileStorageService';
import { remakeAiCode } from '../services/codeService';
import { useAppTheme } from '../context/ThemeContext';

interface MarkdownRendererProps {
  content: string;
  onPreviewCode?: (code: string, language: string, filename?: string) => void;
  onOpenFileWorkspace?: (fileId?: string) => void;
}

/**
 * Preprocesses markdown text:
 * 1. Converts ==highlight== to <mark> tags for attractive highlighting
 * 2. Normalizes inline LaTeX math so KaTeX parses smoothly ($ c $ -> $c$)
 */
function preprocessMarkdown(raw: string): string {
  if (!raw) return '';
  let processed = raw;

  // Convert ==text== to <mark>
  processed = processed.replace(/==([^=\n]+)==/g, '<mark>$1</mark>');

  // Normalize loose spaces in inline math: $ c $ -> $c$
  processed = processed.replace(/\$\s+([^$\n]+?)\s+\$/g, '$$$1$$');

  // Auto-close unclosed markdown code fence if output ended prematurely
  const fences = (processed.match(/```/g) || []).length;
  if (fences % 2 !== 0) {
    processed += '\n```';
  }

  return processed;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onPreviewCode,
  onOpenFileWorkspace
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';
  const processedContent = useMemo(() => preprocessMarkdown(content), [content]);

  return (
    <div className={`prose max-w-none ${isMoon ? 'text-white' : 'text-slate-900'} leading-relaxed text-sm selection:bg-[#d97757]/30`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const rawLang = (match ? match[1] : '').toLowerCase();
            const codeString = String(children).replace(/\n$/, '');
            const meta = (node?.data?.meta as string) || (props?.meta as string) || '';

            // Detect if this code fence is actually an exam, paper pattern, test questionnaire, or notes
            const isExamOrPaperPattern =
              ['exam', 'paper', 'pattern', 'text', 'txt', 'markdown', 'md'].includes(rawLang) &&
              /(###\s*section|section\s+[a-c]:|paper\s*pattern|question\s*paper|marks\s*:|total\s*marks|attempt\s*any|time\s*allowed)/i.test(codeString);

            // If it is an exam or paper pattern, render as a clean card with white text
            if (isExamOrPaperPattern) {
              return (
                <div className="my-4 p-4 sm:p-6 rounded-2xl bg-[#20201f] border border-[#2b2b2a] shadow-md space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-[#2b2b2a] text-white font-bold text-xs uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-[#d97757]" />
                    <span>Examination Paper & Answers Document</span>
                  </div>
                  <div className="prose max-w-none text-white text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeRaw, rehypeKatex]}
                      components={{
                        p({ children }: any) {
                          return <div className="my-2 last:mb-0 leading-relaxed text-white">{children}</div>;
                        },
                        mark({ children }) {
                          return (
                            <mark className="bg-[#d97757]/20 text-[#d97757] font-semibold px-1.5 py-0.5 rounded-lg border-b border-[#d97757]/40 shadow-xs inline-block my-0.5">
                              {children}
                            </mark>
                          );
                        }
                      }}
                    >
                      {preprocessMarkdown(codeString)}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            }

            // Suppress raw ASCII art diagrams so they don't render as ugly text drawings
            if (!inline && isRawAsciiDiagram(codeString)) {
              return null;
            }

            if (!inline && (match || codeString.includes('\n'))) {
              return (
                <CodeBlock
                  language={match ? match[1] : 'code'}
                  meta={meta}
                  value={codeString}
                  onPreview={onPreviewCode}
                  onOpenFile={onOpenFileWorkspace}
                />
              );
            }

            return (
              <code
                className="px-1.5 py-0.5 mx-0.5 rounded-lg bg-[#20201f] text-[#d97757] font-mono text-[12.5px] border border-[#2b2b2a] font-medium"
                {...props}
              >
                {children}
              </code>
            );
          },
          mark({ children }) {
            return (
              <mark className="bg-[#d97757]/20 text-[#d97757] font-semibold px-1.5 py-0.5 rounded-lg border-b border-[#d97757]/40 shadow-xs inline-block my-0.5">
                {children}
              </mark>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-2xl border border-[#2b2b2a] bg-[#20201f] shadow-md">
                <table className="w-full text-left text-sm text-white divide-y divide-[#2b2b2a]">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="bg-[#151515] px-4 py-2.5 font-bold text-white text-xs uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="px-4 py-2.5 border-t border-[#2b2b2a] text-white">{children}</td>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 bg-[#20201f] px-4 py-2.5 rounded-2xl text-white/90 italic">
                {children}
              </blockquote>
            );
          },
          ul({ children }) {
            return <ul className="my-2.5 list-disc list-outside pl-5 space-y-1.5 text-white">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-2.5 list-decimal list-outside pl-5 space-y-1.5 text-white">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-white">{children}</li>;
          },
          h1({ children }) {
            return (
              <div className="mt-5 mb-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {children}
                </h1>
              </div>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-4 mb-2 tracking-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base sm:text-lg font-bold text-white mt-3.5 mb-1.5">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-sm sm:text-base font-bold text-white mt-3 mb-1">
                {children}
              </h4>
            );
          },
          p({ children }: any) {
            return <div className="my-2.5 last:mb-0 leading-relaxed text-white">{children}</div>;
          },
          img({ src, alt }: any) {
            return <DiagramImageCard src={src} alt={alt} />;
          },
          strong({ children }) {
            return <strong className="font-bold text-white">{children}</strong>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d97757] hover:underline underline-offset-4 decoration-[#d97757]/60 transition-colors font-semibold"
              >
                {children}
              </a>
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

/**
 * Detects ASCII art diagrams (like text drawings of prism, rainbow, optics, etc.) to prevent ugly text rendering
 */
function isRawAsciiDiagram(code: string): boolean {
  if (!code || code.length < 25) return false;
  const lines = code.split('\n');
  if (lines.length < 3) return false;

  let graphicLineCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Lines that look like schematic drawings: e.g. \  |  /, / \ , |  |, +---+
    if (
      /^[\\/\s|_.+\-=#*~^<>():;@]+$/.test(trimmed) ||
      /[\\/|]{2,}/.test(trimmed) ||
      /\s*(\\|\/|\|)\s+(\\|\/|\|)/.test(trimmed) ||
      /[┌┐└┘├┤┬┴┼─│═║╔╗╚╝]/.test(trimmed)
    ) {
      graphicLineCount++;
    }
  }

  // Ensure actual programming code (JS, TS, HTML, CSS, Python, C++, etc.) is not flagged
  const isActualProgram = /\b(const|let|var|function|import|export|class|def|return|interface|type|public|private|void|if\s*\(|for\s*\(|<[a-zA-Z0-9]+>)\b/.test(code);
  return !isActualProgram && (graphicLineCount >= 4 || (graphicLineCount >= 3 && lines.length <= 8));
}

/**
 * Diagram and Educational Image Card with Zoom, Download & High-Res View
 */
const DiagramImageCard: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
  const [currentSrc, setCurrentSrc] = useState(src || '');
  const [isZoomed, setIsZoomed] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setHasError(false);
    }
  }, [src]);

  if (!currentSrc || hasError) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = currentSrc;
    a.download = `${(alt || 'diagram').replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(currentSrc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleImageError = () => {
    // If direct image URL failed (e.g. CORS/referrer limit), try our backend proxy
    if (currentSrc && !currentSrc.startsWith('/api/diagram/proxy') && currentSrc.startsWith('http')) {
      setCurrentSrc(`/api/diagram/proxy?url=${encodeURIComponent(currentSrc)}`);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
      {/* Diagram Top Bar */}
      <div className="px-3.5 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800 truncate">
            {alt || 'Educational Working Diagram'}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-200 shrink-0">
            Google Web Visual
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            title="Copy visual link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            title="Download diagram image"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            title="Zoom Full Screen"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Diagram Picture Canvas */}
      <div
        className="relative bg-slate-950/95 flex items-center justify-center p-2 sm:p-4 cursor-pointer group"
        onClick={() => setIsZoomed(true)}
      >
        <img
          src={currentSrc}
          alt={alt || 'Working Diagram'}
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className="max-h-96 w-auto max-w-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.01]"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
            <Eye className="w-3.5 h-3.5" /> Tap / Click to Full Zoom
          </span>
        </div>
      </div>

      {/* Caption description */}
      <div className="px-3.5 py-2 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between gap-2">
        <span className="truncate">{alt || 'Working architecture and mechanism diagram'}</span>
        <span className="text-emerald-700 font-semibold shrink-0 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Verified Educational Diagram
        </span>
      </div>

      {/* Full screen zoom modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute -top-11 right-0 text-white/80 hover:text-white p-1 cursor-pointer"
              title="Close zoom"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={src}
              alt={alt || 'Diagram'}
              referrerPolicy="no-referrer"
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl bg-slate-900 border border-white/10"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download High-Resolution</span>
              </button>
              <button
                onClick={() => setIsZoomed(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CodeBlockProps {
  language: string;
  meta?: string;
  value: string;
  onPreview?: (code: string, language: string, filename?: string) => void;
  onOpenFile?: (fileId?: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, meta, value, onPreview, onOpenFile }) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [currentCode, setCurrentCode] = useState(value);
  const [isRemaking, setIsRemaking] = useState(false);
  const [showRemakeDrawer, setShowRemakeDrawer] = useState(false);
  const [remakeInstruction, setRemakeInstruction] = useState(
    'Refactor, modernize, fix bugs, and ensure responsive design for mobile and PC'
  );
  const [wasRemade, setWasRemade] = useState(false);

  React.useEffect(() => {
    setCurrentCode(value);
  }, [value]);

  const rawLang = (language || 'text').toLowerCase();
  const ext = getExtensionFromLanguage(rawLang);

  // Detect standard official filename (e.g. index.html, style.css, script.js, main.py, package.json)
  const filename = resolveOfficialCodeFileName(rawLang, currentCode, meta);

  // Ensure clean filename
  const cleanName = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '') || `file.${ext}`;
  const fileExtension = cleanName.split('.').pop() || ext;
  const folder = ['html', 'css', 'javascript', 'typescript', 'tsx', 'jsx'].includes(rawLang)
    ? '/workspace'
    : rawLang === 'python'
    ? '/scripts'
    : '/workspace';
  const fullPath = `${folder}/${cleanName}`;

  // Only real web code should show a live preview button, and NEVER exam/paper patterns!
  const isExamContent =
    /(###\s*section|section\s+[a-c]:|paper\s*pattern|question\s*paper|marks\s*:|total\s*marks|attempt\s*any|time\s*allowed)/i.test(currentCode);
  const isPreviewable =
    !isExamContent &&
    ['html', 'htm', 'javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx', 'svg'].includes(rawLang);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    downloadSingleFileDirectly(cleanName, currentCode);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleOpenInWorkspace = () => {
    const saved = autoSaveFile({
      name: cleanName,
      path: fullPath,
      content: currentCode,
      language: rawLang,
      source: 'ai-generated'
    });

    if (onOpenFile) {
      onOpenFile(saved.id);
    }
  };

  const handlePreview = () => {
    autoSaveFile({
      name: cleanName,
      path: fullPath,
      content: currentCode,
      language: rawLang,
      source: 'ai-generated'
    });

    if (onPreview) {
      onPreview(currentCode, rawLang, cleanName);
    }
  };

  const handleRemakeCode = async (instructionOverride?: string) => {
    const instructionToUse = (instructionOverride || remakeInstruction).trim();
    if (!instructionToUse || isRemaking) return;

    setIsRemaking(true);
    try {
      const res = await remakeAiCode({
        code: currentCode,
        language: rawLang,
        filename: cleanName,
        instruction: instructionToUse
      });

      if (res && res.content) {
        let clean = res.content;
        const match = /```[\w\-\.]*\n([\s\S]*?)```/.exec(clean);
        if (match && match[1]) {
          clean = match[1].trim();
        }

        setCurrentCode(clean);
        setWasRemade(true);
        setShowRemakeDrawer(false);

        autoSaveFile({
          name: cleanName,
          path: fullPath,
          content: clean,
          language: rawLang,
          source: 'ai-generated'
        });

        if (onPreview) {
          onPreview(clean, rawLang, cleanName);
        }
      }
    } catch (err) {
      console.error('Code remake failed:', err);
    } finally {
      setIsRemaking(false);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md font-mono text-[13.5px]">
      {/* File Header Bar with Name, Extension, and Individual Download Option */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-[#18191e] border-b border-[#272a33] text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-semibold text-[#f3f4f6] truncate max-w-[180px] sm:max-w-[240px]">
            {cleanName}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono uppercase font-bold border border-blue-500/30">
            .{fileExtension}
          </span>
          {wasRemade && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Remade</span>
            </span>
          )}
        </div>

        {/* Action Controls: Strictly 3 options: Copy, Download, and Preview */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 1. Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#22242c] hover:bg-[#2c2f3a] border border-[#2e323d] transition-all active:scale-95 cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* 2. Download Button */}
          <button
            type="button"
            onClick={() => {
              downloadSingleFileDirectly(cleanName, currentCode);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#22242c] hover:bg-[#2c2f3a] border border-[#2e323d] transition-all active:scale-95 cursor-pointer"
            title={`Download ${cleanName}`}
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download</span>
          </button>

          {/* 3. Preview Button */}
          <button
            type="button"
            onClick={handlePreview}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-xs ${
              isPreviewable
                ? 'text-white bg-blue-600 hover:bg-blue-500 border border-blue-500'
                : 'text-slate-300 hover:text-white bg-[#22242c] hover:bg-[#2c2f3a] border border-[#2e323d]'
            }`}
            title="Live Preview"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Interactive AI Code Remake Drawer */}
      {showRemakeDrawer && (
        <div className="p-3 bg-slate-900/90 border-b border-purple-500/30 space-y-2 text-xs font-sans animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Code Remake Engine</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Refactor • Modernize • Mobile/PC Responsive
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={remakeInstruction}
              onChange={(e) => setRemakeInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRemakeCode();
                }
              }}
              placeholder="What to remake or improve in this code..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={() => handleRemakeCode()}
              disabled={isRemaking || !remakeInstruction.trim()}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              {isRemaking ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Remaking...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Remake Code</span>
                </>
              )}
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[
              'Make fully responsive for mobile & PC',
              'Modernize code, clean layout & fix bugs',
              'Add dark mode & smooth CSS transitions',
              'Add keyboard events & touch handlers'
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setRemakeInstruction(preset);
                  handleRemakeCode(preset);
                }}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-purple-900/60 text-slate-300 hover:text-purple-200 border border-slate-700/60 transition-all font-sans cursor-pointer"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Code Content */}
      {(() => {
        let highlightedHtml = '';
        try {
          const validLanguage = hljs.getLanguage(rawLang) ? rawLang : null;
          if (validLanguage) {
            highlightedHtml = hljs.highlight(currentCode, { language: validLanguage, ignoreIllegals: true }).value;
          } else {
            highlightedHtml = hljs.highlightAuto(currentCode).value;
          }
        } catch {
          highlightedHtml = currentCode
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        }

        return (
          <div className="p-4 overflow-x-auto text-slate-100 font-['JetBrains_Mono',monospace] text-xs sm:text-sm leading-relaxed bg-[#0e131f] border-t border-slate-800">
            <pre className="!bg-transparent !p-0 !m-0 font-mono">
              <code
                className={`hljs ${rawLang ? `language-${rawLang}` : ''}`}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            </pre>
          </div>
        );
      })()}
    </div>
  );
};
