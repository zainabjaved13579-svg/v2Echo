import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Code2,
  FileCode,
  CheckCircle2,
  Eye,
  Copy,
  Check,
  RefreshCw,
  FolderPlus,
  Play,
  Lightbulb,
  ArrowRight,
  Layers
} from 'lucide-react';
import { WorkspaceFile } from '../types';
import {
  autoSaveFile,
  loadWorkspaceFiles,
  getLanguageFromFileName,
  buildLivePreviewBundle
} from '../services/fileStorageService';
import { streamGeminiChat, getStoredApiKey } from '../services/geminiService';

interface AiFileCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileCreated?: (file: WorkspaceFile) => void;
  onOpenLivePreview?: (code: string, language: string, filename: string) => void;
  onInsertToChat?: (text: string) => void;
}

const QUICK_TEMPLATES = [
  {
    title: 'Interactive Web Page',
    filename: 'index.html',
    folder: '/workspace',
    prompt: 'Create a modern, interactive single-page web app with responsive styling and working JavaScript interactions.'
  },
  {
    title: 'CSS Animations & Design System',
    filename: 'styles.css',
    folder: '/workspace',
    prompt: 'Create a comprehensive modern CSS stylesheet with responsive variables, glassmorphism card effects, gradients, and hover transitions.'
  },
  {
    title: 'React / JS Component',
    filename: 'App.jsx',
    folder: '/src',
    prompt: 'Build a clean, stateful React component with engaging interactive features, modern UI, and clear event handlers.'
  },
  {
    title: 'Python Automation Tool',
    filename: 'main.py',
    folder: '/scripts',
    prompt: 'Write an efficient, well-structured Python utility script with functions, error handling, and terminal output.'
  }
];

export const AiFileCreatorModal: React.FC<AiFileCreatorModalProps> = ({
  isOpen,
  onClose,
  onFileCreated,
  onOpenLivePreview,
  onInsertToChat
}) => {
  const [fileName, setFileName] = useState('index.html');
  const [folder, setFolder] = useState('/workspace');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [copied, setCopied] = useState(false);
  const [createdFile, setCreatedFile] = useState<WorkspaceFile | null>(null);

  if (!isOpen) return null;

  const cleanFolder = folder.startsWith('/') ? folder : `/${folder}`;
  const fullPath = `${cleanFolder.replace(/\/+$/, '')}/${fileName.trim().replace(/^\/+/, '') || 'index.html'}`;
  const detectedLang = getLanguageFromFileName(fileName.trim() || 'index.html');

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationError('');
    setGeneratedCode('');
    setCreatedFile(null);

    const activeFileName = fileName.trim() || 'index.html';
    const activePath = fullPath;
    const activeLang = detectedLang;

    const systemInstruction = `You are Echo AI Code Creator.
Your task is to write ONLY the exact, pure, complete source code for a file named "${activeFileName}" at path "${activePath}".
Do NOT include conversational chatter or long explanations. Output the complete code directly in clean code blocks or raw code suitable for ${activeLang}. Make sure it is fully working, modern, and production ready without any placeholders.`;

    const userQuery = `Create the complete file "${activeFileName}" (${activeLang}) based on this requirement:
${prompt.trim()}`;

    let accumulatedText = '';

    await streamGeminiChat({
      messages: [{ id: 'req_1', role: 'user', text: userQuery, timestamp: Date.now() }],
      systemInstruction,
      temperature: 0.3,
      model: 'echo-3.7-flash',
      useSearchGrounding: false,
      customApiKey: getStoredApiKey(),
      onChunk: (chunk) => {
        accumulatedText += chunk;
        // Clean markdown backticks if returned as markdown block
        let clean = accumulatedText;
        const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
        const match = codeBlockRegex.exec(accumulatedText);
        if (match && match[1]) {
          clean = match[1];
        } else if (clean.startsWith('```')) {
          clean = clean.replace(/^```(?:\w+)?\n/, '');
        }
        setGeneratedCode(clean);
      },
      onDone: (fullText) => {
        setIsGenerating(false);

        // Extract pure code without markdown fences if present
        let finalCode = fullText.trim();
        const codeBlockMatch = /```(?:\w+)?\n([\s\S]*?)(?:```|$)/.exec(fullText);
        if (codeBlockMatch && codeBlockMatch[1]) {
          finalCode = codeBlockMatch[1].trim();
        } else if (finalCode.startsWith('```')) {
          finalCode = finalCode.replace(/^```(?:\w+)?\n/, '').replace(/```$/, '').trim();
        }

        setGeneratedCode(finalCode);

        // Auto-save generated file to workspace
        const saved = autoSaveFile({
          name: activeFileName,
          path: activePath,
          content: finalCode,
          language: activeLang,
          source: 'ai-generated'
        });

        setCreatedFile(saved);
        if (onFileCreated) {
          onFileCreated(saved);
        }
      },
      onError: (err) => {
        setIsGenerating(false);
        setGenerationError(err || 'Failed to generate file. Please check your connection.');
      }
    });
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePreview = () => {
    if (!generatedCode) return;
    if (onOpenLivePreview) {
      onOpenLivePreview(generatedCode, detectedLang, fileName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white tracking-tight">AI File & Code Generator</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium">
                  Auto-Creates & Saves File
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tell Echo AI what you need and it will write and create the file directly into your workspace.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Form: File Name, Folder, and Prompt */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                File Name
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="index.html, app.js, style.css"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                Workspace Folder
              </label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="/workspace">/workspace</option>
                <option value="/src">/src</option>
                <option value="/scripts">/scripts</option>
                <option value="/docs">/docs</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Target Path
              </label>
              <div className="px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 truncate flex items-center h-[38px]">
                {fullPath}
              </div>
            </div>
          </div>

          {/* Quick Idea Presets */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Quick Templates
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {QUICK_TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setFileName(t.filename);
                    setFolder(t.folder);
                    setPrompt(t.prompt);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 flex items-center justify-between">
                    <span>{t.title}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                    {t.filename}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Prompt Input Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Describe what the code should do:</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Echo AI will generate and create the file automatically
              </span>
            </label>
            <div className="relative rounded-xl bg-slate-950 border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all p-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Build a sleek interactive counter and todo list with Tailwind styling, sound effects, and clean Javascript animations..."
                rows={3}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400">
                  Powered by Echo AI Engine • Instant Creation
                </span>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md active:scale-95 ${
                    !prompt.trim() || isGenerating
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Writing Code...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate & Create File</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {generationError && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
              {generationError}
            </div>
          )}

          {/* Generated Code Result Panel */}
          {generatedCode && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg animate-fadeIn">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-slate-200">{fileName}</span>
                  {createdFile && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Saved in {createdFile.path}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePreview}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
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

              <div className="p-4 max-h-72 overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed bg-slate-950">
                <pre className="!bg-transparent !p-0 !m-0">
                  <code>{generatedCode}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>Echo AI File Workspace</div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
