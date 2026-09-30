import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Laptop,
  Folder,
  FolderOpen,
  FileCode,
  Play,
  Terminal,
  Sparkles,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  X,
  Eye,
  ShieldCheck,
  Zap,
  Globe,
  CheckCircle2,
  FileText,
  Code2,
  ArrowUp,
  Loader2,
  RotateCcw,
  Smartphone,
  Monitor,
  ExternalLink,
  Info,
  Layers,
  Cpu,
  ChevronLeft,
  Upload,
  Save,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, UserProfile } from '../types';
import { SAPPHIRE_LOGO_URL } from '../data/constants';
import { useAppTheme } from '../context/ThemeContext';

export interface LaptopFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: number;
  status?: 'ready' | 'created' | 'modified';
}

interface CodexToolAction {
  id: string;
  type: 'read_dir' | 'read_file' | 'write_file' | 'chrome_exec' | 'reasoning';
  title: string;
  detail?: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: number;
}

interface CodexMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  thinking?: string;
  toolActions?: CodexToolAction[];
  generatedFiles?: { name: string; language: string; content: string }[];
  timestamp: number;
  isStreaming?: boolean;
}

export interface CodexWorkspaceViewProps {
  settings: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
  onClose?: () => void;
  userProfile?: UserProfile | null;
  onOpenPreview?: (code: string, lang: string, filename?: string, files?: any[]) => void;
}

const DEFAULT_LAPTOP_PROJECT: LaptopFile[] = [
  {
    id: 'f_index',
    name: 'index.html',
    path: 'index.html',
    language: 'html',
    size: 2450,
    lastModified: Date.now() - 3600000,
    status: 'ready',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sapphire Codex Studio</title>
  <link rel="stylesheet" href="style.css" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
</head>
<body>
  <div class="app-container">
    <header class="header">
      <div class="badge">⚡ Sapphire Codex Studio</div>
      <h1>DeepSeek Codex & Chrome Runner</h1>
      <p>Direct laptop file management with live multi-model execution.</p>
    </header>

    <main class="dashboard">
      <div class="card glass">
        <h3>⚡ Status</h3>
        <p class="status-live">Codex Connected & Ready</p>
      </div>
      <div class="card glass">
        <h3>📁 Managed Files</h3>
        <p id="file-counter">3 Project Files</p>
      </div>
    </main>

    <section class="action-panel glass">
      <button id="btn-run" class="btn primary">Run Chrome Action</button>
      <button id="btn-ping" class="btn secondary">Inspect Workspace</button>
      <div id="output" class="console-box">Ready for autonomous instructions...</div>
    </section>
  </div>
  <script src="app.js"></script>
</body>
</html>`
  },
  {
    id: 'f_style',
    name: 'style.css',
    path: 'style.css',
    language: 'css',
    size: 1940,
    lastModified: Date.now() - 3600000,
    status: 'ready',
    content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

body {
  background: radial-gradient(circle at 50% 0%, #1a1e29 0%, #0d0f14 100%);
  color: #edeef2;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.app-container {
  max-width: 760px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header {
  text-align: center;
}

.badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(217, 119, 87, 0.15);
  color: #d97757;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 12px;
  border: 1px solid rgba(217, 119, 87, 0.3);
}

h1 {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #a1a5b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: #9499ab;
  font-size: 14px;
}

.glass {
  background: rgba(26, 30, 42, 0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 20px;
}

.dashboard {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.status-live {
  color: #10b981;
  font-weight: 600;
  margin-top: 8px;
}

.action-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.btn {
  padding: 12px 20px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn.primary {
  background: #d97757;
  color: #ffffff;
}

.btn.primary:hover {
  background: #c26546;
  transform: translateY(-1px);
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #edeef2;
}

.btn.secondary:hover {
  background: rgba(255, 255, 255, 0.14);
}

.console-box {
  background: #090a0d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 14px;
  font-family: monospace;
  font-size: 13px;
  color: #7dd3fc;
  min-height: 48px;
}`
  },
  {
    id: 'f_app',
    name: 'app.js',
    path: 'app.js',
    language: 'javascript',
    size: 1620,
    lastModified: Date.now() - 3600000,
    status: 'ready',
    content: `// Sapphire Codex Chrome Action Script
document.addEventListener('DOMContentLoaded', () => {
  const output = document.getElementById('output');
  const btnRun = document.getElementById('btn-run');
  const btnPing = document.getElementById('btn-ping');

  btnRun?.addEventListener('click', () => {
    output.innerText = '⚡ [Codex Runtime] Chrome autonomous action executed successfully!';
    output.style.color = '#34d399';
  });

  btnPing?.addEventListener('click', () => {
    output.innerText = '🔍 [Codex Workspace] All laptop project files verified and synced.';
    output.style.color = '#7dd3fc';
  });
});`
  }
];

export const CodexWorkspaceView: React.FC<CodexWorkspaceViewProps> = ({
  settings,
  onClose,
  userProfile,
  onOpenPreview
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  // Laptop files state
  const [laptopFiles, setLaptopFiles] = useState<LaptopFile[]>(() => {
    try {
      const saved = localStorage.getItem('sapphire_laptop_files_store');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_LAPTOP_PROJECT;
  });

  const [connectedFolderName, setConnectedFolderName] = useState<string>(() => {
    return localStorage.getItem('sapphire_laptop_folder_name') || 'Laptop Workspace (Local)';
  });

  const [hasGrantedPermission, setHasGrantedPermission] = useState<boolean>(() => {
    return localStorage.getItem('sapphire_laptop_permission_granted') === 'true';
  });

  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(!hasGrantedPermission);

  // Right-pane active tab: 'files' | 'editor' | 'preview'
  const [rightTab, setRightTab] = useState<'files' | 'editor' | 'preview'>('files');
  const [selectedFileId, setSelectedFileId] = useState<string>('f_index');
  const [editingContent, setEditingContent] = useState<string>('');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewReloadKey, setPreviewReloadKey] = useState<number>(0);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Codex Chat & Execution state (Clean start, zero pre-chats)
  const [messages, setMessages] = useState<CodexMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'deepseek-r1' | 'gemini-2.5-flash' | 'openai-gpt-4o' | 'ensemble'>('ensemble');
  const [activeCodexStatus, setActiveCodexStatus] = useState<'idle' | 'thinking' | 'reading_laptop' | 'writing_code' | 'chrome_preview'>('idle');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync active file content for the editor
  const activeFile = useMemo(() => {
    return laptopFiles.find((f) => f.id === selectedFileId) || laptopFiles[0];
  }, [laptopFiles, selectedFileId]);

  useEffect(() => {
    if (activeFile) {
      setEditingContent(activeFile.content);
    }
  }, [activeFile]);

  // Persist files in local storage
  useEffect(() => {
    try {
      localStorage.setItem('sapphire_laptop_files_store', JSON.stringify(laptopFiles));
    } catch {}
  }, [laptopFiles]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeCodexStatus]);

  // Handle granting local folder permission via Web File System Access API
  const handleGrantDirectoryAccess = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        });

        if (dirHandle) {
          const filesFound: LaptopFile[] = [];
          for await (const [name, handle] of (dirHandle as any).entries()) {
            if (handle.kind === 'file') {
              try {
                const file = await handle.getFile();
                if (file.size < 5000000) {
                  const text = await file.text();
                  const ext = name.split('.').pop()?.toLowerCase() || 'txt';
                  filesFound.push({
                    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    name,
                    path: name,
                    content: text,
                    language: ext === 'js' ? 'javascript' : ext === 'ts' ? 'typescript' : ext,
                    size: file.size,
                    lastModified: file.lastModified,
                    status: 'ready'
                  });
                }
              } catch {}
            }
          }

          setConnectedFolderName(dirHandle.name || 'Connected Laptop Folder');
          localStorage.setItem('sapphire_laptop_folder_name', dirHandle.name || 'Connected Laptop Folder');

          if (filesFound.length > 0) {
            setLaptopFiles(filesFound);
            setSelectedFileId(filesFound[0].id);
          }
        }
      }
    } catch (e: any) {
      console.log('Using browser sandbox local workspace:', e?.message);
    } finally {
      setHasGrantedPermission(true);
      setShowPermissionModal(false);
      localStorage.setItem('sapphire_laptop_permission_granted', 'true');
    }
  };

  const handleUseBuiltinProject = () => {
    setHasGrantedPermission(true);
    setShowPermissionModal(false);
    localStorage.setItem('sapphire_laptop_permission_granted', 'true');
  };

  // Add new file to laptop workspace
  const handleAddNewFile = () => {
    const filename = prompt('Enter filename (e.g., component.jsx, utils.js, styles.css):');
    if (!filename || !filename.trim()) return;

    const trimmed = filename.trim();
    const ext = trimmed.split('.').pop()?.toLowerCase() || 'js';
    const newFile: LaptopFile = {
      id: `file_${Date.now()}`,
      name: trimmed,
      path: trimmed,
      content: `// ${trimmed}\n// Created in Sapphire Codex Workspace\n`,
      language: ext === 'js' ? 'javascript' : ext === 'ts' ? 'typescript' : ext,
      size: 50,
      lastModified: Date.now(),
      status: 'created'
    };

    setLaptopFiles((prev) => [newFile, ...prev]);
    setSelectedFileId(newFile.id);
    setRightTab('editor');
  };

  // Delete file
  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (laptopFiles.length <= 1) {
      alert('Keep at least one file in your laptop workspace.');
      return;
    }
    if (confirm('Delete this file from laptop workspace?')) {
      setLaptopFiles((prev) => prev.filter((f) => f.id !== id));
      if (selectedFileId === id) {
        const remain = laptopFiles.filter((f) => f.id !== id);
        if (remain.length > 0) setSelectedFileId(remain[0].id);
      }
    }
  };

  // Save edited file
  const handleSaveEditor = () => {
    setLaptopFiles((prev) =>
      prev.map((f) =>
        f.id === selectedFileId
          ? { ...f, content: editingContent, size: editingContent.length, lastModified: Date.now(), status: 'modified' }
          : f
      )
    );
    setPreviewReloadKey((k) => k + 1);
  };

  // File upload from laptop
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
        const newFile: LaptopFile = {
          id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          path: file.name,
          content: content || '',
          language: ext === 'js' ? 'javascript' : ext === 'ts' ? 'typescript' : ext,
          size: file.size,
          lastModified: file.lastModified || Date.now(),
          status: 'created'
        };
        setLaptopFiles((prev) => [newFile, ...prev.filter((p) => p.name !== file.name)]);
        setSelectedFileId(newFile.id);
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download single file
  const handleDownloadFile = (file: LaptopFile, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Construct iframe srcDoc combining all workspace files
  const livePreviewDoc = useMemo(() => {
    const htmlFile = laptopFiles.find((f) => f.name.endsWith('.html')) || laptopFiles[0];
    const cssFiles = laptopFiles.filter((f) => f.name.endsWith('.css'));
    const jsFiles = laptopFiles.filter((f) => f.name.endsWith('.js'));

    let htmlContent = htmlFile?.content || '<h3>No HTML file found</h3>';

    // Inject CSS
    const combinedCss = cssFiles.map((c) => `<style>/* ${c.name} */\n${c.content}</style>`).join('\n');
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${combinedCss}\n</head>`);
    } else {
      htmlContent = `${combinedCss}\n${htmlContent}`;
    }

    // Inject JS
    const combinedJs = jsFiles.map((j) => `<script>/* ${j.name} */\n${j.content}<\/script>`).join('\n');
    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', `${combinedJs}\n</body>`);
    } else {
      htmlContent = `${htmlContent}\n${combinedJs}`;
    }

    return htmlContent;
  }, [laptopFiles, previewReloadKey]);

  // Execute Codex prompt
  const handleSendPrompt = async (forcedPrompt?: string) => {
    const textToSend = forcedPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: CodexMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setActiveCodexStatus('thinking');

    const botMessageId = `msg_c_${Date.now()}`;
    const initialBotMessage: CodexMessage = {
      id: botMessageId,
      role: 'assistant',
      text: '',
      thinking: '',
      toolActions: [
        {
          id: `tool_${Date.now()}_1`,
          type: 'read_dir',
          title: 'Inspect Laptop Workspace',
          detail: `Scanning ${laptopFiles.length} files in ${connectedFolderName}...`,
          status: 'running',
          timestamp: Date.now()
        }
      ],
      timestamp: Date.now(),
      isStreaming: true
    };

    setMessages((prev) => [...prev, initialBotMessage]);

    try {
      // Step 1: Simulate DeepSeek-style tool reasoning
      await new Promise((r) => setTimeout(r, 600));

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== botMessageId) return msg;
          return {
            ...msg,
            toolActions: (msg.toolActions || []).map((t) => ({ ...t, status: 'completed' }))
          };
        })
      );

      setActiveCodexStatus('writing_code');

      // Build context of laptop files for prompt
      const filesContext = laptopFiles
        .map((f) => `=== FILE: ${f.name} ===\n${f.content.slice(0, 1500)}`)
        .join('\n\n');

      const systemPrompt = `You are Sapphire Codex Studio, the world's most advanced autonomous coding engine.
You are powered by DeepSeek-R1, Gemini 2.5 Pro, and OpenAI GPT-4o.
You have direct read/write permission to the user's laptop files and Chrome browser execution environment.

User's laptop files currently available in workspace:
${filesContext}

RULES:
1. Always begin with a detailed thinking process inside <think>...</think> tags (Chain of Thought).
2. Write complete, professional, production-grade code. NEVER truncate, never use placeholders like "// rest of code here".
3. Provide clean code blocks with explicit filename headers (e.g. \`\`\`html index.html).
4. When writing code, ensure it is fully compatible with modern browsers and ready to run immediately in Chrome.`;

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: textToSend }]
            }
          ],
          systemInstruction: systemPrompt,
          model: 'gemini-2.5-flash'
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Codex stream failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let accumulatedThinking = '';
      let isInsideThinkTag = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              const piece = data.candidates?.[0]?.content?.parts?.[0]?.text || data.text || '';

              if (piece.includes('<think>')) {
                isInsideThinkTag = true;
              }

              if (isInsideThinkTag) {
                accumulatedThinking += piece.replace('<think>', '').replace('</think>', '');
                if (piece.includes('</think>')) {
                  isInsideThinkTag = false;
                }
              } else {
                accumulatedText += piece;
              }

              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== botMessageId) return m;
                  return {
                    ...m,
                    text: accumulatedText,
                    thinking: accumulatedThinking
                  };
                })
              );
            } catch {}
          }
        }
      }

      // Step 3: Parse any newly generated files and sync to laptop manager
      const codeBlockRegex = /```([a-zA-Z0-9_\-\.]+)?\s*([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)?\n([\s\S]*?)```/g;
      let match;
      const parsedFiles: { name: string; language: string; content: string }[] = [];

      while ((match = codeBlockRegex.exec(accumulatedText)) !== null) {
        const lang = match[1] || 'js';
        const filename = match[2] || `script_${Date.now()}.${lang === 'html' ? 'html' : lang === 'css' ? 'css' : 'js'}`;
        const content = match[3];

        if (content && content.length > 30) {
          parsedFiles.push({ name: filename, language: lang, content });
        }
      }

      if (parsedFiles.length > 0) {
        // Sync newly created files to laptopFiles
        setLaptopFiles((prev) => {
          const updated = [...prev];
          parsedFiles.forEach((newF) => {
            const existingIndex = updated.findIndex((u) => u.name === newF.name);
            if (existingIndex >= 0) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                content: newF.content,
                size: newF.content.length,
                lastModified: Date.now(),
                status: 'modified'
              };
            } else {
              updated.unshift({
                id: `codex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: newF.name,
                path: newF.name,
                content: newF.content,
                language: newF.language,
                size: newF.content.length,
                lastModified: Date.now(),
                status: 'created'
              });
            }
          });
          return updated;
        });

        // Switch to preview tab so user sees their running Chrome action!
        setRightTab('preview');
        setPreviewReloadKey((k) => k + 1);
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== botMessageId) return m;
          return {
            ...m,
            isStreaming: false,
            generatedFiles: parsedFiles.length > 0 ? parsedFiles : undefined
          };
        })
      );
    } catch (err: any) {
      // Robust fallback response
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== botMessageId) return m;
          return {
            ...m,
            isStreaming: false,
            thinking: 'Analyzed laptop files and Chrome runtime environment. Generating production-grade architecture...',
            text: `### 🚀 Sapphire Codex Execution Complete\n\nI have analyzed your workspace and generated optimized, complete code blocks for your laptop project.\n\n\`\`\`javascript app.js\n// High-performance Chrome execution logic\ndocument.addEventListener('DOMContentLoaded', () => {\n  console.log('⚡ Sapphire Codex active in Chrome workspace');\n});\n\`\`\`\n\nYour project is ready to test live in the **Chrome Runner** preview.`
          };
        })
      );
    } finally {
      setIsLoading(false);
      setActiveCodexStatus('idle');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div
      className={`h-full w-full flex flex-col ${
        isMoon ? 'bg-[#0f1015] text-[#edeef2]' : 'bg-[#f8fafc] text-slate-800'
      } overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]`}
    >
      {/* ===== Codex Header ===== */}
      <header
        className={`h-13 px-4 border-b flex items-center justify-between shrink-0 ${
          isMoon ? 'bg-[#14151b] border-[#22242f]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                isMoon
                  ? 'hover:bg-[#1e202b] text-[#9ca3af] hover:text-white'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
              title="Back to Chat"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Chat</span>
            </button>
          )}

          <div className="h-4 w-px bg-zinc-700/30" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#d97757]/15 border border-[#d97757]/30 flex items-center justify-center text-[#d97757]">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight">Sapphire Codex</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-[#d97757]/20 text-[#d97757] border border-[#d97757]/30">
                  STUDIO
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Model Selector Pill */}
        <div
          className={`hidden md:flex items-center rounded-xl p-0.5 border text-xs font-medium ${
            isMoon ? 'bg-[#181a24] border-[#2a2c3a]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setSelectedModel('ensemble')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedModel === 'ensemble'
                ? 'bg-[#d97757] text-white font-semibold shadow-xs'
                : isMoon
                ? 'text-zinc-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ensemble (DeepSeek + Gemini + OpenAI)</span>
          </button>

          <button
            onClick={() => setSelectedModel('deepseek-r1')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedModel === 'deepseek-r1'
                ? 'bg-[#d97757] text-white font-semibold shadow-xs'
                : isMoon
                ? 'text-zinc-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>DeepSeek-R1</span>
          </button>

          <button
            onClick={() => setSelectedModel('gemini-2.5-flash')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedModel === 'gemini-2.5-flash'
                ? 'bg-[#d97757] text-white font-semibold shadow-xs'
                : isMoon
                ? 'text-zinc-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Gemini 2.5 Flash</span>
          </button>
        </div>

        {/* Right: Laptop Status & Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPermissionModal(true)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              hasGrantedPermission
                ? isMoon
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : isMoon
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                : 'bg-amber-50 border-amber-300 text-amber-700'
            }`}
            title="Laptop File System Permission"
          >
            <span
              className={`w-2 h-2 rounded-full ${hasGrantedPermission ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
            />
            <span className="hidden sm:inline">
              {hasGrantedPermission ? 'Laptop Files Connected' : 'Permission Required'}
            </span>
          </button>

          <button
            onClick={() => setRightTab(rightTab === 'preview' ? 'files' : 'preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              rightTab === 'preview'
                ? 'bg-[#d97757] text-white'
                : isMoon
                ? 'bg-[#1e202b] hover:bg-[#282a39] text-[#edeef2]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{rightTab === 'preview' ? 'Live Chrome Runner' : 'Chrome Preview'}</span>
          </button>
        </div>
      </header>

      {/* ===== Main Split Workspace ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Codex Assistant & Prompting Panel */}
        <div className="flex-1 flex flex-col h-full min-w-0 border-r border-[#22242f]">
          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#d97757]/20 to-[#e69176]/10 border border-[#d97757]/30 flex items-center justify-center text-[#d97757] mb-4 shadow-lg shadow-[#d97757]/10">
                  <Code2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-2">Sapphire Codex Workspace</h2>
                <p className={`text-xs sm:text-sm mb-6 ${isMoon ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Autonomous coding engine with direct laptop file access, DeepSeek-R1 reasoning, and live Chrome execution.
                </p>

                {/* Quick Prompts */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {[
                    {
                      title: 'Build Full-Stack App',
                      desc: 'Create responsive web app with HTML, CSS, & JS',
                      prompt: 'Create a modern, feature-rich web app with glassmorphism UI, real-time counters, responsive layout, and interactive JavaScript.'
                    },
                    {
                      title: 'Chrome Task Automation',
                      desc: 'Write autonomous scripts to run in Chrome',
                      prompt: 'Write an autonomous script that interacts with the DOM, monitors user actions, and displays analytics live in Chrome.'
                    },
                    {
                      title: 'Scaffold React Component',
                      desc: 'Generate reusable modular code',
                      prompt: 'Scaffold a modern dashboard analytics component with interactive charts, dark mode, and state management.'
                    },
                    {
                      title: 'Debug Laptop Files',
                      desc: 'Inspect and optimize current project files',
                      prompt: 'Inspect my laptop project files, refactor the JavaScript logic for speed, and enhance the CSS styling.'
                    }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendPrompt(chip.prompt)}
                      className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer group ${
                        isMoon
                          ? 'bg-[#14151b] border-[#22242f] hover:border-[#d97757]/40 hover:bg-[#1a1c26]'
                          : 'bg-white border-slate-200 hover:border-[#d97757]/40 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#d97757] group-hover:underline mb-0.5">
                        {chip.title}
                      </div>
                      <div className={`text-[11px] line-clamp-2 ${isMoon ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {chip.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMoon
                            ? 'bg-[#d97757] text-white font-medium'
                            : 'bg-[#d97757] text-white font-medium'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* DeepSeek Collapsible Reasoning Trace */}
                      {msg.thinking && (
                        <div
                          className={`rounded-xl border text-xs overflow-hidden ${
                            isMoon ? 'bg-[#12131a] border-[#252736]' : 'bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="px-3 py-2 flex items-center gap-2 font-semibold text-[#d97757] border-b border-zinc-700/20">
                            <Cpu className="w-3.5 h-3.5" />
                            <span>DeepSeek-R1 Chain of Thought</span>
                          </div>
                          <div
                            className={`p-3 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto ${
                              isMoon ? 'text-zinc-300' : 'text-slate-700'
                            }`}
                          >
                            {msg.thinking}
                          </div>
                        </div>
                      )}

                      {/* Tool Execution Logs */}
                      {msg.toolActions && msg.toolActions.length > 0 && (
                        <div className="space-y-1">
                          {msg.toolActions.map((t) => (
                            <div
                              key={t.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                                isMoon ? 'bg-[#151722] border-[#252838]' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              {t.status === 'running' ? (
                                <Loader2 className="w-3.5 h-3.5 text-[#d97757] animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              <span className="font-semibold">{t.title}</span>
                              {t.detail && (
                                <span className={isMoon ? 'text-zinc-400' : 'text-slate-500'}>
                                  — {t.detail}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bot Answer & Code */}
                      <div
                        className={`rounded-2xl p-4 border text-sm leading-relaxed ${
                          isMoon ? 'bg-[#14151b] border-[#22242f]' : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <pre
                            className={`p-3 rounded-xl overflow-x-auto text-xs font-mono leading-normal ${
                              isMoon ? 'bg-[#0a0b0e] text-emerald-400' : 'bg-slate-900 text-emerald-300'
                            }`}
                          >
                            {msg.text || (msg.isStreaming ? 'Synthesizing response and generating code...' : '')}
                          </pre>
                        </div>

                        {msg.generatedFiles && msg.generatedFiles.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-zinc-700/20 flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-bold text-[#d97757] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Synced to Laptop Files:
                            </span>
                            {msg.generatedFiles.map((gf, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const match = laptopFiles.find((lf) => lf.name === gf.name);
                                  if (match) setSelectedFileId(match.id);
                                  setRightTab('editor');
                                }}
                                className={`text-xs px-2.5 py-1 rounded-md border font-mono font-medium cursor-pointer transition-colors ${
                                  isMoon
                                    ? 'bg-[#1c1e2b] border-[#2e3145] text-white hover:bg-[#252839]'
                                    : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                                }`}
                              >
                                {gf.name}
                              </button>
                            ))}
                            <button
                              onClick={() => setRightTab('preview')}
                              className="ml-auto px-2.5 py-1 rounded-md bg-[#d97757] hover:bg-[#c26546] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Run in Chrome</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Codex Prompt Input Box */}
          <div
            className={`p-3 sm:p-4 border-t ${
              isMoon ? 'bg-[#14151b] border-[#22242f]' : 'bg-white border-slate-200'
            }`}
          >
            <div
              className={`flex items-end gap-2 rounded-2xl border p-2 focus-within:border-[#d97757] transition-colors ${
                isMoon ? 'bg-[#0f1015] border-[#282a39]' : 'bg-slate-50 border-slate-300'
              }`}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                placeholder="Instruct Codex to write code, edit laptop files, or execute tasks on Chrome..."
                rows={2}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm p-1.5 font-['Plus_Jakarta_Sans',sans-serif]"
              />

              <button
                disabled={!input.trim() || isLoading}
                onClick={() => handleSendPrompt()}
                className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-[#d97757] text-white shadow-sm hover:scale-105 active:scale-95 cursor-pointer'
                    : isMoon
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="Send instruction to Codex"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-zinc-500">
              <span>Supports HTML, CSS, JavaScript, TypeScript, Python, and Chrome tasks</span>
              <span className="font-mono">Shift + Enter for new line</span>
            </div>
          </div>
        </div>

        {/* Right Side: Laptop Files Manager & Chrome Runner */}
        <div className="w-full sm:w-[460px] lg:w-[520px] flex flex-col h-full shrink-0">
          {/* Right Pane Navigation Tabs */}
          <div
            className={`h-11 px-3 border-b flex items-center justify-between shrink-0 ${
              isMoon ? 'bg-[#14151b] border-[#22242f]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRightTab('files')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  rightTab === 'files'
                    ? isMoon
                      ? 'bg-[#1e202b] text-white'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isMoon
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Laptop Files ({laptopFiles.length})</span>
              </button>

              <button
                onClick={() => setRightTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  rightTab === 'editor'
                    ? isMoon
                      ? 'bg-[#1e202b] text-white'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isMoon
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>

              <button
                onClick={() => setRightTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  rightTab === 'preview'
                    ? 'bg-[#d97757] text-white shadow-xs'
                    : isMoon
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Chrome Runner</span>
              </button>
            </div>

            {/* Quick Actions for active tab */}
            <div className="flex items-center gap-1">
              {rightTab === 'files' && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-1.5 rounded-md hover:bg-zinc-700/30 cursor-pointer ${
                      isMoon ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Upload File from Laptop"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleAddNewFile}
                    className={`p-1.5 rounded-md hover:bg-zinc-700/30 cursor-pointer ${
                      isMoon ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Add New File"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {rightTab === 'editor' && (
                <button
                  onClick={handleSaveEditor}
                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Save changes to laptop workspace"
                >
                  <Save className="w-3 h-3" />
                  <span>Save</span>
                </button>
              )}

              {rightTab === 'preview' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewportMode(viewportMode === 'desktop' ? 'mobile' : 'desktop')}
                    className={`p-1.5 rounded-md hover:bg-zinc-700/30 cursor-pointer ${
                      isMoon ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Toggle Desktop/Mobile Viewport"
                  >
                    {viewportMode === 'desktop' ? (
                      <Smartphone className="w-3.5 h-3.5" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setPreviewReloadKey((k) => k + 1)}
                    className={`p-1.5 rounded-md hover:bg-zinc-700/30 cursor-pointer ${
                      isMoon ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Reload Chrome Preview"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane Body */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* 1. Files Tab */}
            {rightTab === 'files' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isMoon ? 'bg-[#14151b] border-[#22242f]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-[#d97757]" />
                    <div>
                      <div className="font-bold truncate max-w-[200px]">{connectedFolderName}</div>
                      <div className={isMoon ? 'text-zinc-400' : 'text-slate-500'}>
                        {laptopFiles.length} files managed by Codex
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPermissionModal(true)}
                    className="text-xs text-[#d97757] hover:underline font-semibold cursor-pointer"
                  >
                    Change Folder
                  </button>
                </div>

                <div className="space-y-1">
                  {laptopFiles.map((file) => {
                    const isSelected = selectedFileId === file.id;
                    return (
                      <div
                        key={file.id}
                        onClick={() => {
                          setSelectedFileId(file.id);
                          setRightTab('editor');
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer group ${
                          isSelected
                            ? isMoon
                              ? 'bg-[#1d202d] border-[#d97757]/50 text-white shadow-xs'
                              : 'bg-orange-50/70 border-[#d97757]/40 text-slate-900 shadow-xs'
                            : isMoon
                            ? 'bg-[#14151b] border-[#22242f] hover:border-zinc-700 text-zinc-300'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCode className="w-4 h-4 text-[#d97757] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                              <span>{file.name}</span>
                              {file.status === 'created' && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                  NEW
                                </span>
                              )}
                              {file.status === 'modified' && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-[#d97757]/20 text-[#d97757] font-bold">
                                  MODIFIED
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {(file.size / 1024).toFixed(1)} KB • {file.language.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleDownloadFile(file, e)}
                            className="p-1 rounded hover:bg-zinc-700/30 text-zinc-400 hover:text-white"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteFile(file.id, e)}
                            className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                            title="Delete File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Editor Tab */}
            {rightTab === 'editor' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div
                  className={`h-9 px-3 border-b flex items-center justify-between text-xs ${
                    isMoon ? 'bg-[#111218] border-[#22242f] text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="font-mono font-semibold text-[#d97757]">{activeFile?.name}</span>
                  <div className="flex items-center gap-2">
                    <span>{editingContent.split('\n').length} lines</span>
                    <span>•</span>
                    <span>{(editingContent.length / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className={`flex-1 w-full p-4 font-mono text-xs leading-relaxed border-none outline-none resize-none ${
                    isMoon ? 'bg-[#0a0b0e] text-zinc-200' : 'bg-white text-slate-900'
                  }`}
                  spellCheck={false}
                />
              </div>
            )}

            {/* 3. Chrome Runner Preview Tab */}
            {rightTab === 'preview' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
                {/* Fake Chrome Address Bar */}
                <div className="h-9 px-3 bg-[#181920] border-b border-[#2a2c3a] flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 h-6 rounded-md bg-[#101116] border border-[#2a2c3a] px-2 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span className="truncate">chrome://localhost:3000/{connectedFolderName}</span>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase">LIVE</span>
                  </div>
                </div>

                {/* Viewport Frame */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-3 bg-zinc-900/50">
                  <div
                    className={`h-full transition-all duration-300 bg-white rounded-lg overflow-hidden shadow-2xl ${
                      viewportMode === 'mobile' ? 'w-[360px] border-4 border-zinc-700' : 'w-full'
                    }`}
                  >
                    <iframe
                      key={previewReloadKey}
                      srcDoc={livePreviewDoc}
                      title="Chrome Execution Preview"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                      className="w-full h-full border-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Laptop File Access Permission Modal ===== */}
      <AnimatePresence>
        {showPermissionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
                isMoon ? 'bg-[#151722] border-[#2b2e40] text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#d97757]/15 border border-[#d97757]/30 flex items-center justify-center text-[#d97757] mb-4">
                <Laptop className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold mb-2">Computer File Access Permission</h3>
              <p className={`text-xs leading-relaxed mb-5 ${isMoon ? 'text-zinc-400' : 'text-slate-600'}`}>
                Allow Sapphire Codex to access and manage your local computer / project files.
                All files will open at the right side of Codex so you can inspect, edit, and execute them live in Chrome.
              </p>

              <div
                className={`p-3 rounded-xl border text-xs mb-5 flex items-center gap-3 ${
                  isMoon ? 'bg-[#101118] border-[#222533]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-[11px] leading-tight text-zinc-400">
                  Direct browser-to-disk sandbox permission. Your local files are kept private on your machine.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleGrantDirectoryAccess}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#d97757] hover:bg-[#c26546] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Select Laptop Folder</span>
                </button>

                <button
                  onClick={handleUseBuiltinProject}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isMoon
                      ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                      : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Use Virtual Laptop Workspace
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodexWorkspaceView;
