import React, { useState, useMemo } from 'react';
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
  GraduationCap
} from 'lucide-react';
import {
  getExtensionFromLanguage,
  autoSaveFile,
  downloadSingleFileDirectly,
  getLanguageFromFileName
} from '../services/fileStorageService';
import { remakeAiCode } from '../services/codeService';

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

  return processed;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onPreviewCode,
  onOpenFileWorkspace
}) => {
  const processedContent = useMemo(() => preprocessMarkdown(content), [content]);

  return (
    <div className="prose max-w-none text-slate-700 leading-relaxed text-sm selection:bg-indigo-500/20">
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

            // If it is an exam or paper pattern, DO NOT render as code block or trigger live preview!
            // Render it directly as a clean structured examination document card.
            if (isExamOrPaperPattern) {
              return (
                <div className="my-4 p-4 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Examination Paper & Answers Document</span>
                  </div>
                  <div className="prose max-w-none text-slate-800 text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeRaw, rehypeKatex]}
                      components={{
                        mark({ children }) {
                          return (
                            <mark className="bg-amber-100/90 text-amber-950 font-semibold px-1.5 py-0.5 rounded border-b border-amber-300/80 shadow-2xs inline-block my-0.5">
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
                className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 text-indigo-700 font-mono text-[12.5px] border border-slate-200/80 font-medium"
                {...props}
              >
                {children}
              </code>
            );
          },
          mark({ children }) {
            return (
              <mark className="bg-amber-100/90 text-amber-950 font-semibold px-1.5 py-0.5 rounded border-b border-amber-300/80 shadow-2xs inline-block my-0.5">
                {children}
              </mark>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-sm text-slate-700 divide-y divide-slate-200">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="bg-slate-50 px-4 py-2.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="px-4 py-2.5 border-t border-slate-200 text-slate-600">{children}</td>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-4 border-indigo-500 bg-indigo-50/60 pl-4 py-2.5 rounded-r-xl text-slate-800 italic">
                {children}
              </blockquote>
            );
          },
          ul({ children }) {
            return <ul className="my-2.5 list-disc list-outside pl-5 space-y-1.5 text-slate-700">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-2.5 list-decimal list-outside pl-5 space-y-1.5 text-slate-700">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-slate-700">{children}</li>;
          },
          h1({ children }) {
            return (
              <div className="mt-6 mb-3 pb-2 border-b border-slate-200">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded-full bg-indigo-600 shrink-0" />
                  <span>{children}</span>
                </h1>
              </div>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-5 mb-2.5 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-indigo-500 shrink-0" />
                <span>{children}</span>
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base sm:text-lg font-bold text-indigo-950 mt-4 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span>{children}</span>
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-sm sm:text-base font-bold text-slate-800 mt-3 mb-1">
                {children}
              </h4>
            );
          },
          p({ children }) {
            return <p className="my-2.5 last:mb-0 leading-relaxed text-slate-700">{children}</p>;
          },
          strong({ children }) {
            return <strong className="font-bold text-slate-900">{children}</strong>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-300 hover:decoration-indigo-600 transition-colors font-semibold"
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

  // Detect filename from meta or top comment or convention
  let filename = '';
  if (meta && meta.includes('.')) {
    filename = meta.trim().split(/\s+/)[0];
  } else {
    const firstLine = currentCode.split('\n')[0]?.trim() || '';
    const fileCommentMatch = firstLine.match(/^(?:\/\/|#|<!--|\/\*)\s*([\w\-\.\/]+\.[a-zA-Z0-9]+)/);
    if (fileCommentMatch) {
      filename = fileCommentMatch[1].split('/').pop() || fileCommentMatch[1];
    } else {
      filename =
        ext === 'html'
          ? 'index.html'
          : ext === 'css'
          ? 'styles.css'
          : ext === 'py'
          ? 'main.py'
          : ext === 'json'
          ? currentCode.includes('"pack"')
            ? 'pack.mcmeta'
            : 'data.json'
          : ext === 'md'
          ? 'README.md'
          : `script.${ext}`;
    }
  }

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
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-semibold text-slate-100 truncate max-w-[180px] sm:max-w-[240px]">
            {cleanName}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono uppercase font-bold border border-indigo-500/30">
            .{fileExtension}
          </span>
          {wasRemade && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Remade</span>
            </span>
          )}
        </div>

        {/* Action Controls: Remake, Download, Preview, Workspace, Copy */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* AI Remake Code Button */}
          <button
            type="button"
            onClick={() => setShowRemakeDrawer((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-200 hover:text-white bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Remake and refactor this code with AI"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Remake</span>
          </button>

          {/* Direct File Download with Extension */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-200 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 transition-all shadow-xs active:scale-95 cursor-pointer"
            title={`Download ${cleanName} with .${fileExtension} extension`}
          >
            {downloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download<span className="hidden xs:inline"> .{fileExtension}</span></span>
              </>
            )}
          </button>

          {/* Live Preview Button */}
          {isPreviewable && (
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Preview rendered code"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Preview</span>
            </button>
          )}

          {/* Open in File & Workspace */}
          <button
            type="button"
            onClick={handleOpenInWorkspace}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition-all active:scale-95 cursor-pointer"
            title="Open in File & Workspace"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Workspace</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition-all active:scale-95 cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
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
