import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Eye,
  Edit3,
  Download,
  Terminal,
  Sparkles
} from 'lucide-react';
import { highlightCode, extractCodeBlocksFromMarkdown } from '../services/codeHighlighter';
import { downloadSingleFileDirectly } from '../services/fileStorageService';

interface CodexCodeMessageRendererProps {
  content: string;
  isStreaming?: boolean;
  isMoon?: boolean;
  onSelectFileForEditor?: (filename: string, code: string) => void;
  onPreviewFile?: (filename: string, code: string) => void;
}

export const CodexCodeMessageRenderer: React.FC<CodexCodeMessageRendererProps> = ({
  content,
  isStreaming = false,
  isMoon = true,
  onSelectFileForEditor,
  onPreviewFile
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const codeBlocks = extractCodeBlocksFromMarkdown(content);

  // If no markdown code blocks found yet:
  if (codeBlocks.length === 0) {
    if (isStreaming && !content.trim()) {
      return (
        <div className="flex items-center gap-2 text-xs font-mono py-2 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-[#d97757] animate-ping" />
          <span>Synthesizing multi-file architecture with Prism highlighting...</span>
        </div>
      );
    }
    return (
      <div className={`text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap ${
        isMoon ? 'text-zinc-200' : 'text-slate-800'
      }`}>
        {content}
      </div>
    );
  }

  // Split non-code text from code blocks for rich reading
  const segments: Array<{ type: 'text' | 'code'; text?: string; block?: typeof codeBlocks[0] }> = [];
  let remainingText = content;

  for (const block of codeBlocks) {
    const idx = remainingText.indexOf(block.fullMatch);
    if (idx > 0) {
      segments.push({ type: 'text', text: remainingText.slice(0, idx) });
    }
    segments.push({ type: 'code', block });
    remainingText = remainingText.slice(idx + block.fullMatch.length);
  }
  if (remainingText.trim()) {
    segments.push({ type: 'text', text: remainingText });
  }

  const handleCopyCode = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {}
  };

  return (
    <div className="space-y-4">
      {segments.map((seg, sIdx) => {
        if (seg.type === 'text') {
          return (
            <div
              key={sIdx}
              className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans ${
                isMoon ? 'text-zinc-300' : 'text-slate-700'
              }`}
            >
              {seg.text}
            </div>
          );
        }

        const block = seg.block!;
        const filename = block.filename || `file_${sIdx}.${block.language}`;
        const ext = filename.split('.').pop() || block.language;
        const lineCount = block.code.split('\n').length;
        const isCopied = copiedIndex === sIdx;
        const highlightedHtml = highlightCode(block.code, block.language);

        return (
          <div
            key={sIdx}
            className={`rounded-2xl border overflow-hidden shadow-lg transition-all ${
              isMoon ? 'bg-[#0b0c10] border-[#222432]' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            {/* File Header Bar */}
            <div
              className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 text-xs flex-wrap ${
                isMoon ? 'bg-[#141620] border-[#222432]' : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileCode className="w-4 h-4 text-[#d97757] shrink-0" />
                <span className="font-mono font-bold text-white truncate max-w-[220px]">
                  {filename}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#d97757]/20 text-[#d97757] text-[10px] font-mono font-bold uppercase border border-[#d97757]/30 shrink-0">
                  .{ext}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                  {lineCount} lines
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyCode(block.code, sIdx)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-zinc-700"
                  title="Copy code to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => downloadSingleFileDirectly(filename, block.code)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-zinc-700"
                  title={`Download ${filename}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                {onSelectFileForEditor && (
                  <button
                    type="button"
                    onClick={() => onSelectFileForEditor(filename, block.code)}
                    className="px-2.5 py-1 rounded-lg bg-[#252837] hover:bg-[#2f3347] text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-zinc-700"
                    title="Open in Right Editor"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>
                )}

                {onPreviewFile && ['html', 'htm'].includes(ext) && (
                  <button
                    type="button"
                    onClick={() => onPreviewFile(filename, block.code)}
                    className="px-2.5 py-1 rounded-lg bg-[#d97757] hover:bg-[#c46849] text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    title="Run live in Chrome Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Run</span>
                  </button>
                )}
              </div>
            </div>

            {/* Prism / Highlight.js Color-Coded Syntax Body */}
            <div className="p-4 overflow-x-auto text-xs sm:text-[13px] leading-relaxed font-mono bg-[#090a0f]">
              <pre className="!bg-transparent !p-0 !m-0 font-mono">
                <code
                  className={`language-${block.language}`}
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              </pre>
            </div>
          </div>
        );
      })}
    </div>
  );
};
