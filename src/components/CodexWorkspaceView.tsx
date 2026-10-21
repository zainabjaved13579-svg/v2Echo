import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  Copy,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  X,
  Globe,
  Code2,
  Smartphone,
  Monitor,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Upload,
  Save,
  Zap,
  Cpu,
  Laptop,
  Check,
  Sparkles,
  Search,
  MessageSquare,
  Play,
  ArrowRight,
  FileText,
  FileJson,
  FilePlus,
  FolderPlus,
  ExternalLink,
  Tablet,
  Settings,
  GitBranch,
  AlertCircle,
  Eye,
  Columns,
  Maximize2,
  RotateCcw,
  Layers,
  Terminal,
  Share2,
  Mic,
  ArrowUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { AppSettings, UserProfile } from '../types';
import { useAppTheme } from '../context/ThemeContext';
import { getStoredApiKey } from '../services/geminiService';
import { SAPPHIRE_LOGO_URL, SAPPHIRE_APP_NAME, SAPPHIRE_LEAD_DEVELOPER } from '../data/constants';

// ============================================================
// TYPES
// ============================================================
export interface LaptopFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: number;
  status?: 'ready' | 'created' | 'modified';
  fileHandle?: any;
  isBinary?: boolean;
}

export interface CodexProject {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
  files: LaptopFile[];
}

interface FileActionSummary {
  path: string;
  lines: number;
  action: 'created' | 'updated';
}

interface CodexMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  summary?: string;
  actionFiles?: FileActionSummary[];
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

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  file?: LaptopFile;
}

// ============================================================
// HELPERS & FILE LANGUAGE DETECTION
// ============================================================
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  html: 'html', htm: 'html',
  css: 'css', scss: 'scss', sass: 'scss', less: 'less',
  json: 'json', md: 'markdown', markdown: 'markdown',
  py: 'python', java: 'java', cpp: 'cpp', c: 'c',
  sql: 'sql', xml: 'xml', svg: 'svg',
  yml: 'yaml', yaml: 'yaml', toml: 'toml',
  sh: 'bash', bash: 'bash', txt: 'text', env: 'text'
};

const getLanguage = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return LANGUAGE_MAP[ext] || 'text';
};

const isTextFile = (name: string): boolean => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (!ext) {
    const lower = name.toLowerCase();
    return ['dockerfile', 'makefile', 'readme', 'license', '.env', '.gitignore'].includes(lower);
  }
  return ext in LANGUAGE_MAP || ['txt', 'env', 'gitignore', 'config', 'lock'].includes(ext);
};

const normalizePath = (path: string): string => {
  return path.replace(/\\/g, '/').replace(/^\/+/, '');
};

// Default starter templates
const STARTER_TEMPLATES: Record<string, LaptopFile[]> = {
  web: [
    {
      id: 'init_html',
      name: 'index.html',
      path: 'index.html',
      language: 'html',
      size: 1420,
      lastModified: Date.now(),
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Web Application</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-[#0f1117] text-white min-h-screen flex flex-col font-sans">
  <header class="border-b border-[#222734] px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-xl bg-[#d97757] flex items-center justify-center font-bold text-white shadow-md">
        ⚡
      </div>
      <span class="font-bold text-base tracking-tight">Sapphire Studio</span>
    </div>
    <div class="flex items-center gap-3">
      <button id="counter-btn" class="px-4 py-2 rounded-xl bg-[#20201f] hover:bg-[#282724] border border-[#2b2b2a] text-xs font-semibold transition-colors">
        Clicks: <span id="click-count">0</span>
      </button>
      <button class="px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-xs font-bold text-white transition-all shadow-md">
        Get Started
      </button>
    </div>
  </header>

  <main class="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col items-center text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d97757]/15 border border-[#d97757]/30 text-[#d97757] text-xs font-semibold mb-6">
      <span>🚀 Ready for AI generation</span>
    </div>
    <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
      Engineered for Speed & Zero Lag
    </h1>
    <p class="text-slate-400 text-base max-w-xl mb-8 leading-relaxed">
      This project is loaded inside your Sapphire Codex Studio. Modify code directly or use the AI Chat Architect to scaffold features.
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
      <div class="p-5 rounded-2xl bg-[#181818] border border-[#2b2b2a]">
        <h3 class="font-bold text-sm mb-1 text-white">Full-Stack Reactive</h3>
        <p class="text-xs text-slate-400">Tailwind CSS and Lucide icons preconfigured.</p>
      </div>
      <div class="p-5 rounded-2xl bg-[#181818] border border-[#2b2b2a]">
        <h3 class="font-bold text-sm mb-1 text-white">Instant Sandbox</h3>
        <p class="text-xs text-slate-400">Hot reloads instantly with in-tab preview.</p>
      </div>
      <div class="p-5 rounded-2xl bg-[#181818] border border-[#2b2b2a]">
        <h3 class="font-bold text-sm mb-1 text-white">Export to VS Code</h3>
        <p class="text-xs text-slate-400">One-click ZIP with .vscode settings included.</p>
      </div>
    </div>
  </main>

  <script src="script.js"></script>
</body>
</html>`
    },
    {
      id: 'init_css',
      name: 'style.css',
      path: 'style.css',
      language: 'css',
      size: 420,
      lastModified: Date.now(),
      content: `/* Custom Project Styles */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

main {
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}`
    },
    {
      id: 'init_js',
      name: 'script.js',
      path: 'script.js',
      language: 'javascript',
      size: 512,
      lastModified: Date.now(),
      content: `// Interactive Application Logic
document.addEventListener('DOMContentLoaded', () => {
  let count = 0;
  const countEl = document.getElementById('click-count');
  const btn = document.getElementById('counter-btn');

  if (btn && countEl) {
    btn.addEventListener('click', () => {
      count++;
      countEl.textContent = count;
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
});`
    }
  ]
};

// Build tree from flat files
function buildFileTree(files: LaptopFile[]): TreeNode {
  const root: TreeNode = { name: '', path: '', isFolder: true, children: [] };

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      let existing = current.children.find((c) => c.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isFolder: !isFile,
          children: [],
          file: isFile ? file : undefined
        };
        current.children.push(existing);
      }
      current = existing;
    }
  });

  const sortNodes = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.isFolder === b.isFolder) {
        return a.name.localeCompare(b.name);
      }
      return a.isFolder ? -1 : 1;
    });
    node.children.forEach(sortNodes);
  };
  sortNodes(root);

  return root;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export const CodexWorkspaceView: React.FC<CodexWorkspaceViewProps> = ({
  settings,
  onClose
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  // EXACT THEME COLORS FROM CHAT
  const bgMain = isMoon ? 'bg-[#151515]' : 'bg-[#f8fafc]';
  const bgSidebar = isMoon ? 'bg-[#111111]' : 'bg-white';
  const bgPanel = isMoon ? 'bg-[#181818]' : 'bg-[#f1f5f9]';
  const bgCard = isMoon ? 'bg-[#20201f]' : 'bg-white';
  const bgInput = isMoon ? 'bg-[#181818]' : 'bg-[#f1f5f9]';
  const bgEditor = isMoon ? 'bg-[#151515]' : 'bg-white';
  const border = isMoon ? 'border-[#2b2b2a]' : 'border-[#e2e8f0]';
  const textBright = isMoon ? 'text-white' : 'text-slate-900';
  const textSub = isMoon ? 'text-[#a3a3a3]' : 'text-slate-500';
  const accentColor = '#d97757';

  // Projects State - Starts with 0 pre-added files as requested
  const [projects, setProjects] = useState<CodexProject[]>(() => {
    try {
      const saved = localStorage.getItem('sapphire_codex_projects_v7');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: `proj_${Date.now()}`,
        name: 'Workspace',
        createdAt: Date.now(),
        lastModified: Date.now(),
        files: [] // No pre-added files!
      }
    ];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sapphire_codex_active_proj_id_v7');
      if (saved) return saved;
    } catch {}
    return projects[0]?.id || `proj_${Date.now()}`;
  });

  useEffect(() => {
    try {
      localStorage.setItem('sapphire_codex_projects_v7', JSON.stringify(projects));
      localStorage.setItem('sapphire_codex_active_proj_id_v7', activeProjectId);
    } catch {}
  }, [projects, activeProjectId]);

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  const files = activeProject?.files || [];

  const setFiles = useCallback(
    (newFilesOrFn: LaptopFile[] | ((prev: LaptopFile[]) => LaptopFile[])) => {
      setProjects((prevProjects) => {
        return prevProjects.map((p) => {
          if (p.id === activeProjectId) {
            const nextFiles = typeof newFilesOrFn === 'function' ? newFilesOrFn(p.files) : newFilesOrFn;
            return {
              ...p,
              files: nextFiles,
              lastModified: Date.now()
            };
          }
          return p;
        });
      });
    },
    [activeProjectId]
  );

  // Layout View Modes:
  // 'code': Editor only
  // 'split': Editor + Live Preview side-by-side
  // 'preview': Dedicated Full-Tab Live Preview inside the workspace
  const [viewMode, setViewMode] = useState<'code' | 'split' | 'preview'>('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));
  const [isChatOpen, setIsChatOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1280 : true));
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewReloadKey, setPreviewReloadKey] = useState(0);

  // Editor Tabs & Active File
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => {
    return files.slice(0, 3).map((f) => f.id);
  });
  const [selectedFileId, setSelectedFileId] = useState<string>(() => files[0]?.id || '');
  const [editingContent, setEditingContent] = useState<string>('');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'components']));
  const [rootDirHandle, setRootDirHandle] = useState<any>(null);

  // Search in Files State
  const [searchQuery, setSearchQuery] = useState('');

  // AI Chat & Generation State (matching user's reference image!)
  const [messages, setMessages] = useState<CodexMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Sapphire Codex AI Architect ready.',
      summary: 'Ready to build high-performance multi-file web apps and components.',
      timestamp: Date.now()
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiStreamingStatus, setAiStreamingStatus] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-flash-latest');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lineGutterRef = useRef<HTMLDivElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId) || files[0] || null;
  }, [files, selectedFileId]);

  useEffect(() => {
    if (selectedFileId && !openTabIds.includes(selectedFileId)) {
      setOpenTabIds((prev) => [...prev, selectedFileId]);
    }
  }, [selectedFileId]);

  useEffect(() => {
    if (activeFile && !activeFile.isBinary) {
      setEditingContent(activeFile.content);
    }
  }, [activeFile?.id]);

  const handleEditorScroll = () => {
    if (editorTextareaRef.current && lineGutterRef.current) {
      lineGutterRef.current.scrollTop = editorTextareaRef.current.scrollTop;
    }
  };

  const updateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const selStart = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, selStart);
    const lines = textBefore.split('\n');
    setCursorPosition({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  const handleEditorKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    updateCursorPosition(e.currentTarget);
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    updateCursorPosition(e.currentTarget);
  };

  useEffect(() => {
    if (!activeFile || activeFile.isBinary) return;
    if (editingContent === activeFile.content) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    setSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(async () => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === activeFile.id) {
            return {
              ...f,
              content: editingContent,
              size: new Blob([editingContent]).size,
              lastModified: Date.now(),
              status: 'modified'
            };
          }
          return f;
        })
      );

      if (activeFile.fileHandle && activeFile.fileHandle.createWritable) {
        try {
          const writable = await activeFile.fileHandle.createWritable();
          await writable.write(editingContent);
          await writable.close();
        } catch (err) {
          console.warn('Could not write directly to local file handle:', err);
        }
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editingContent, activeFile?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Open laptop folder
  const handleOpenLaptopFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        });
        setRootDirHandle(dirHandle);

        const loadedFiles: LaptopFile[] = [];

        async function scanDirectory(handle: any, currentPath = '') {
          for await (const entry of handle.values()) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
              continue;
            }
            const relativePath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

            if (entry.kind === 'file') {
              try {
                const file = await entry.getFile();
                if (file.size > MAX_FILE_SIZE) continue;

                let content = '';
                let isBinary = false;

                if (isTextFile(file.name)) {
                  content = await file.text();
                } else {
                  isBinary = true;
                  content = `[Binary file: ${file.name}]`;
                }

                loadedFiles.push({
                  id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  name: file.name,
                  path: relativePath,
                  content,
                  language: getLanguage(file.name),
                  size: file.size,
                  lastModified: file.lastModified,
                  status: 'ready',
                  fileHandle: entry,
                  isBinary
                });
              } catch (e) {
                console.warn(`Could not read file ${relativePath}:`, e);
              }
            } else if (entry.kind === 'directory') {
              await scanDirectory(entry, relativePath);
            }
          }
        }

        await scanDirectory(dirHandle);


        const newProjId = `proj_${Date.now()}`;
        const newProj: CodexProject = {
          id: newProjId,
          name: dirHandle.name || 'Laptop Folder',
          createdAt: Date.now(),
          lastModified: Date.now(),
          files: loadedFiles
        };

        setProjects((prev) => [newProj, ...prev]);
        setActiveProjectId(newProjId);
        setSelectedFileId(loadedFiles[0]?.id || '');
        setOpenTabIds(loadedFiles.slice(0, 3).map((f) => f.id));
        showToast(`Opened laptop folder "${dirHandle.name}" with ${loadedFiles.length} files`);
      } else {
        folderInputRef.current?.click();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        showToast('Could not open laptop folder: ' + err.message);
      }
    }
  };

  // Upload folder via file input
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const loadedFiles: LaptopFile[] = [];
    let detectedFolderName = 'Uploaded Project';

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relativePath = (file as any).webkitRelativePath || file.name;
      const parts = relativePath.split('/');
      if (parts.length > 1) {
        detectedFolderName = parts[0];
      }

      const cleanPath = parts.slice(1).join('/') || file.name;
      if (cleanPath.includes('node_modules') || cleanPath.startsWith('.')) continue;

      try {
        let content = '';
        const isBinary = !isTextFile(file.name);
        if (!isBinary) {
          content = await file.text();
        } else {
          content = `[Binary file: ${file.name}]`;
        }

        loadedFiles.push({
          id: `f_${Date.now()}_${i}`,
          name: file.name,
          path: cleanPath,
          content,
          language: getLanguage(file.name),
          size: file.size,
          lastModified: file.lastModified,
          status: 'ready',
          isBinary
        });
      } catch (err) {
        console.warn('Error reading file:', err);
      }
    }

    if (loadedFiles.length > 0) {
      const newProjId = `proj_${Date.now()}`;
      const newProj: CodexProject = {
        id: newProjId,
        name: detectedFolderName,
        createdAt: Date.now(),
        lastModified: Date.now(),
        files: loadedFiles
      };
      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newProjId);
      setSelectedFileId(loadedFiles[0]?.id || '');
      setOpenTabIds(loadedFiles.slice(0, 3).map((f) => f.id));
      showToast(`Loaded ${loadedFiles.length} files from "${detectedFolderName}"`);
    }
    e.target.value = '';
  };

  // Export for VS Code (.zip)
  const handleExportVsCodeZip = async () => {
    try {
      const zip = new JSZip();

      files.forEach((f) => {
        if (!f.isBinary) {
          zip.file(f.path, f.content);
        }
      });

      const vscodeSettings = {
        'editor.tabSize': 2,
        'editor.formatOnSave': true,
        'editor.fontSize': 14,
        'files.autoSave': 'afterDelay'
      };
      zip.file('.vscode/settings.json', JSON.stringify(vscodeSettings, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const safeName = activeProject.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeName}-vscode.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      showToast('Exported project ZIP for VS Code!');
    } catch (err: any) {
      showToast('Export failed: ' + err.message);
    }
  };

  // Create new file
  const handleCreateNewFile = (folderPath = '') => {
    const rawName = window.prompt('Enter file name (e.g. App.tsx, styles.css):');
    if (!rawName || !rawName.trim()) return;

    const cleanName = rawName.trim();
    const finalPath = folderPath ? `${folderPath}/${cleanName}` : cleanName;

    const newFile: LaptopFile = {
      id: `file_${Date.now()}`,
      name: cleanName,
      path: finalPath,
      content: '',
      language: getLanguage(cleanName),
      size: 0,
      lastModified: Date.now(),
      status: 'created'
    };

    setFiles((prev) => [...prev, newFile]);
    setSelectedFileId(newFile.id);
    if (!openTabIds.includes(newFile.id)) {
      setOpenTabIds((prev) => [...prev, newFile.id]);
    }
    showToast(`Created file ${finalPath}`);
  };

  // Create new folder
  const handleCreateNewFolder = (parentPath = '') => {
    const rawName = window.prompt('Enter folder name:');
    if (!rawName || !rawName.trim()) return;

    const folderName = rawName.trim();
    const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName;

    const placeholderFile: LaptopFile = {
      id: `f_${Date.now()}`,
      name: '.gitkeep',
      path: `${folderPath}/.gitkeep`,
      content: '',
      language: 'text',
      size: 0,
      lastModified: Date.now()
    };

    setFiles((prev) => [...prev, placeholderFile]);
    setExpandedFolders((prev) => new Set([...prev, folderPath]));
    showToast(`Created folder ${folderPath}`);
  };

  // Delete file
  const handleDeleteFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    if (!window.confirm(`Delete ${file.name}?`)) return;

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setOpenTabIds((prev) => prev.filter((id) => id !== fileId));
    if (selectedFileId === fileId) {
      const remaining = files.filter((f) => f.id !== fileId);
      setSelectedFileId(remaining[0]?.id || '');
    }
    showToast(`Deleted ${file.name}`);
  };

  // Close tab
  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openTabIds.filter((id) => id !== tabId);
    setOpenTabIds(nextTabs);
    if (selectedFileId === tabId) {
      setSelectedFileId(nextTabs[nextTabs.length - 1] || '');
    }
  };

  // Live preview document with link interception
  const livePreviewDoc = useMemo(() => {
    const htmlFile = files.find((f) => f.name.endsWith('.html') || f.language === 'html');
    const cssFiles = files.filter((f) => f.name.endsWith('.css') || f.language === 'css');
    const jsFiles = files.filter((f) => {
      const n = f.name.toLowerCase();
      return n.endsWith('.js') || n.endsWith('.jsx') || n.endsWith('.ts') || n.endsWith('.tsx');
    });

    let html = htmlFile ? htmlFile.content : '';

    if (!html) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#151515] text-slate-300 font-sans flex items-center justify-center min-h-screen p-6">
  <div class="text-center max-w-sm p-6 rounded-2xl bg-[#20201f] border border-[#2b2b2a]">
    <h3 class="text-white font-bold text-base mb-1">Live Sandbox Ready</h3>
    <p class="text-xs text-slate-400">Add or click an HTML/JS file to preview in real time.</p>
  </div>
</body>
</html>`;
    }

    // Auto-inject Tailwind CSS CDN if not present
    if (!html.includes('tailwindcss.com')) {
      const tailwindScript = `<script src="https://cdn.tailwindcss.com"></script>`;
      html = html.includes('<head>')
        ? html.replace('<head>', `<head>\n  ${tailwindScript}`)
        : `${tailwindScript}\n${html}`;
    }

    // Auto-inject Lucide Icons CDN and init
    if (!html.includes('unpkg.com/lucide')) {
      const lucideScript = `
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    window.addEventListener('DOMContentLoaded', function() {
      if (window.lucide) window.lucide.createIcons();
    });
  </script>`;
      html = html.includes('</head>')
        ? html.replace('</head>', `${lucideScript}\n</head>`)
        : `${lucideScript}\n${html}`;
    }

    // Intercept navigation links so clicking buttons/links in code does not redirect outside
    const interceptScript = `
  <script>
    (function() {
      // Prevent popups and external window redirects
      window.open = function(url) {
        console.log('[Sapphire Sandbox] Intercepted window.open:', url);
        return null;
      };
      // Intercept link clicks in capture phase
      document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (a) {
          var href = a.getAttribute('href');
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            e.preventDefault();
            console.log('[Sapphire Sandbox] Intercepted navigation link:', href);
          }
        }
      }, true);
      // Intercept form submissions
      document.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('[Sapphire Sandbox] Intercepted form submit');
      }, true);
    })();
  </script>`;

    if (html.includes('</head>')) {
      html = html.replace('</head>', `${interceptScript}\n</head>`);
    } else {
      html = `${interceptScript}\n${html}`;
    }

    // Inline CSS from all .css files
    const cssBundle = cssFiles.map((c) => `/* ${c.name} */\n${c.content}`).join('\n\n');
    if (cssBundle) {
      const styleTag = `<style>\n${cssBundle}\n</style>`;
      html = html.includes('</head>')
        ? html.replace('</head>', `${styleTag}\n</head>`)
        : `${styleTag}\n${html}`;
    }

    // Inline JS
    const jsBundle = jsFiles
      .filter((j) => !j.name.endsWith('.tsx') && !j.name.endsWith('.ts'))
      .map((j) => `// ${j.name}\n${j.content}`)
      .join('\n\n');

    if (jsBundle) {
      const scriptTag = `<script>\ntry {\n${jsBundle}\n} catch (err) { console.error('Script runtime error:', err); }\n</script>`;
      html = html.includes('</body>')
        ? html.replace('</body>', `${scriptTag}\n</body>`)
        : `${html}\n${scriptTag}`;
    }

    return html;
  }, [files]);

  // AI Architect Generation
  const handleSendAiPrompt = async (forcedPrompt?: string) => {
    const prompt = (forcedPrompt || inputPrompt).trim();
    if (!prompt || isLoadingAi) return;

    setInputPrompt('');
    setIsLoadingAi(true);
    setAiStreamingStatus('Analyzing code & planning file changes...');

    const userMsgId = `usr_${Date.now()}`;
    const assistantMsgId = `ast_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', text: prompt, timestamp: Date.now() },
      {
        id: assistantMsgId,
        role: 'assistant',
        text: '',
        summary: 'Architecting solution...',
        timestamp: Date.now(),
        isStreaming: true,
        actionFiles: []
      }
    ]);

    try {
      const filesContext = files
        .filter((f) => !f.isBinary)
        .slice(0, 8)
        .map((f) => `=== ${f.path} ===\n${f.content.slice(0, 1000)}`)
        .join('\n\n');

      const systemPrompt = `You are Sapphire Codex Studio, an elite Principal Software Architect created and developed by Shaheer (${SAPPHIRE_LEAD_DEVELOPER}).
MANDATORY DIRECTIVE:
1. WRITE 100% PROFESSIONAL, SENIOR ENTERPRISE PRODUCTION CODE.
2. DO NOT output conversational filler or bloated commentary in your response.
3. Output your files strictly in this clean Markdown code block format:
\`\`\`html index.html
<!DOCTYPE html>
<html lang="en">
...
</html>
\`\`\`
\`\`\`css style.css
...
\`\`\`
\`\`\`javascript script.js
...
\`\`\`
Always provide complete, production-grade, bug-free implementations with modern responsive UI.`;

      let accumulated = '';
      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-api-key': getStoredApiKey()
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${prompt}\n\nCurrent Workspace Files:\n${filesContext}` }] }],
            systemInstruction: systemPrompt,
            model: selectedModel
          })
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]') break;
                try {
                  const parsed = JSON.parse(jsonStr);
                  const textPiece = parsed.text ?? parsed.content ?? parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                  accumulated += textPiece;

                  const currentBlockMatch = accumulated.match(/```([a-zA-Z0-9_-]+)?(?:\s+([\w\.\-\/]+))?[^`]*$/);
                  if (currentBlockMatch && currentBlockMatch[2]) {
                    setAiStreamingStatus(`Crafting ${currentBlockMatch[2]}...`);
                  }
                } catch {}
              }
            }
          }
        }
      } catch (streamErr) {
        console.warn('Codex stream error, attempting fallback:', streamErr);
      }

      // If stream didn't accumulate text, try standard endpoint
      if (!accumulated.trim()) {
        try {
          const fallbackRes = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-gemini-api-key': getStoredApiKey()
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${prompt}\n\nCurrent Workspace Files:\n${filesContext}` }] }],
              systemInstruction: systemPrompt,
              model: selectedModel
            })
          });
          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json();
            accumulated = fbData.text || fbData.response || '';
          }
        } catch (e) {
          console.error('Codex fallback failed:', e);
        }
      }

      // Parse generated files
      const blockRegex = /```([a-zA-Z0-9_-]+)?(?:\s+([\w\.\-\/]+))?\n([\s\S]*?)```/g;
      let match;
      const parsedFiles: { name: string; path: string; content: string; language: string }[] = [];

      while ((match = blockRegex.exec(accumulated)) !== null) {
        const lang = (match[1] || 'html').toLowerCase();
        let fileName = match[2];
        const content = match[3].trim();

        if (!fileName) {
          if (lang === 'html') fileName = 'index.html';
          else if (lang === 'css') fileName = 'style.css';
          else if (lang === 'js' || lang === 'javascript') fileName = 'script.js';
          else fileName = `file_${parsedFiles.length + 1}.${lang}`;
        }

        parsedFiles.push({
          name: fileName.split('/').pop() || fileName,
          path: normalizePath(fileName),
          content,
          language: getLanguage(fileName)
        });
      }

      if (parsedFiles.length > 0) {
        const actionFiles: FileActionSummary[] = [];
        const assignedFileIds: string[] = [];
        let primaryFileId = '';

        setFiles((prev) => {
          const updated = [...prev];
          parsedFiles.forEach((newFile) => {
            const existingIdx = updated.findIndex((f) => f.path === newFile.path);
            const lineCount = newFile.content.split('\n').length;
            if (existingIdx !== -1) {
              const fileId = updated[existingIdx].id;
              updated[existingIdx] = {
                ...updated[existingIdx],
                content: newFile.content,
                size: new Blob([newFile.content]).size,
                lastModified: Date.now(),
                status: 'modified'
              };
              actionFiles.push({ path: newFile.path, lines: lineCount, action: 'updated' });
              assignedFileIds.push(fileId);
              if (newFile.name === 'index.html' || !primaryFileId) {
                primaryFileId = fileId;
              }
            } else {
              const fileId = `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              const createdFile: LaptopFile = {
                id: fileId,
                name: newFile.name,
                path: newFile.path,
                content: newFile.content,
                language: newFile.language,
                size: new Blob([newFile.content]).size,
                lastModified: Date.now(),
                status: 'created'
              };
              updated.push(createdFile);
              actionFiles.push({ path: newFile.path, lines: lineCount, action: 'created' });
              assignedFileIds.push(fileId);
              if (newFile.name === 'index.html' || !primaryFileId) {
                primaryFileId = fileId;
              }
            }
          });
          return updated;
        });

        if (primaryFileId) {
          setSelectedFileId(primaryFileId);
        }
        setOpenTabIds((prev) => Array.from(new Set([...prev, ...assignedFileIds])));

        const summaryText = `Applied changes across ${parsedFiles.length} file(s). Live sandbox updated.`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  summary: summaryText,
                  text: summaryText,
                  actionFiles,
                  isStreaming: false
                }
              : m
          )
        );

        setPreviewReloadKey((k) => k + 1);
        showToast(`AI updated ${parsedFiles.length} file(s)`);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  summary: 'Completed code review and recommendations.',
                  text: accumulated.slice(0, 300) || 'Task completed.',
                  isStreaming: false
                }
              : m
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                summary: 'AI code generation failed.',
                text: `Error: ${err.message || 'Unknown network error'}. Please try again.`,
                isStreaming: false
              }
            : m
        )
      );
    } finally {
      setIsLoadingAi(false);
      setAiStreamingStatus(null);
    }
  };

  const lineCount = useMemo(() => {
    return Math.max(1, editingContent.split('\n').length);
  }, [editingContent]);

  const fileTree = useMemo(() => buildFileTree(files), [files]);

  // Recursive tree renderer
  const renderTree = (node: TreeNode, depth = 0) => {
    if (node.isFolder) {
      const isExpanded = expandedFolders.has(node.path);
      return (
        <div key={node.path || 'root'} className="select-none">
          {node.name && (
            <div
              onClick={() => {
                setExpandedFolders((prev) => {
                  const next = new Set(prev);
                  if (next.has(node.path)) next.delete(node.path);
                  else next.add(node.path);
                  return next;
                });
              }}
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
              className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer text-xs ${textSub} hover:${textBright} hover:${bgPanel} transition-colors group`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#d97757] shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#d97757]/80 shrink-0" />
                )}
                <span className="font-medium truncate">{node.name}</span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateNewFile(node.path);
                  }}
                  className={`p-0.5 rounded hover:${bgCard} ${textSub}`}
                  title="New File in Folder"
                >
                  <FilePlus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          {(!node.name || isExpanded) && (
            <div>{node.children.map((child) => renderTree(child, depth + (node.name ? 1 : 0)))}</div>
          )}
        </div>
      );
    }

    if (!node.file) return null;
    const file = node.file;
    const isSelected = selectedFileId === file.id;
    const ext = file.name.split('.').pop()?.toLowerCase();

    return (
      <div
        key={file.id}
        onClick={() => {
          setSelectedFileId(file.id);
          if (!openTabIds.includes(file.id)) {
            setOpenTabIds((prev) => [...prev, file.id]);
          }
          if (viewMode === 'preview') {
            setViewMode('split');
          }
        }}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition-colors text-xs ${
          isSelected
            ? `${bgCard} font-semibold border-l-2 border-[#d97757] text-[#d97757]`
            : `${textSub} hover:${bgPanel} hover:${textBright}`
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
          {ext === 'html' ? (
            <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          ) : ext === 'css' ? (
            <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          ) : ext === 'json' ? (
            <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="truncate">{file.name}</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteFile(file.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-500 hover:text-rose-400 shrink-0"
          title="Delete File"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className={`h-full w-full flex flex-col ${bgMain} ${textBright} overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]`}>
      {/* Hidden file input for laptop folder upload */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderInputChange}
        {...({ webkitdirectory: '', directory: '', multiple: true } as any)}
        className="hidden"
      />

      {/* 1. TOP HEADER (Sapphire logo & name, folder upload area, view switchers) */}
      <header className={`h-12 px-3 sm:px-4 border-b ${border} ${bgSidebar} flex items-center justify-between shrink-0 gap-2`}>
        {/* Left: Logo, Name & Project Name */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl ${textSub} hover:${bgPanel} hover:${textBright} transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold`}
              title="Back to Sapphire"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt="Sapphire"
              className="w-6 h-6 rounded-lg object-contain"
            />
            <span className="font-bold text-xs sm:text-sm tracking-tight hidden xs:inline">
              Sapphire Codex
            </span>
          </div>

          <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono ${bgPanel} ${textSub} border ${border} truncate max-w-[140px]`}>
            {activeProject.name}
          </span>

          <button
            type="button"
            onClick={() => setIsSidebarOpen((s) => !s)}
            className={`p-1.5 rounded-lg border ${border} ${
              isSidebarOpen ? 'bg-[#d97757]/15 text-[#d97757]' : `${bgPanel} ${textSub}`
            } cursor-pointer transition-colors`}
            title="Toggle File Explorer"
          >
            <Folder className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: In-Tab Layout Switcher (Code, Split, Live Preview) */}
        <div className={`flex items-center ${bgPanel} rounded-lg p-0.5 border ${border} text-xs`}>
          <button
            type="button"
            onClick={() => setViewMode('code')}
            className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              viewMode === 'code' ? `bg-[#d97757] text-white shadow-xs` : `${textSub} hover:${textBright}`
            }`}
          >
            Code
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              viewMode === 'split' ? `bg-[#d97757] text-white shadow-xs` : `${textSub} hover:${textBright}`
            }`}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              viewMode === 'preview' ? `bg-[#d97757] text-white shadow-xs` : `${textSub} hover:${textBright}`
            }`}
          >
            Live Preview
          </button>
        </div>

        {/* Right: Folder Upload / Open Folder & VS Code Export Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleCreateNewFile()}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-lg ${bgPanel} hover:${bgCard} ${textBright} text-[11px] font-semibold flex items-center gap-1 border ${border} cursor-pointer`}
            title="Create New File"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="hidden sm:inline">New File</span>
          </button>

          <button
            type="button"
            onClick={() => handleCreateNewFolder()}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-lg ${bgPanel} hover:${bgCard} ${textBright} text-[11px] font-semibold flex items-center gap-1 border ${border} cursor-pointer`}
            title="Create New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="hidden sm:inline">New Folder</span>
          </button>

          <button
            type="button"
            onClick={handleOpenLaptopFolder}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg ${bgPanel} hover:${bgCard} ${textBright} text-[11px] font-semibold flex items-center gap-1.5 border ${border} cursor-pointer`}
            title="Open Folder from Laptop"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="hidden md:inline">Open Folder</span>
          </button>

          <button
            type="button"
            onClick={handleExportVsCodeZip}
            className="px-2.5 py-1 rounded-lg bg-[#d97757] hover:bg-[#c86b4c] text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Download for VS Code (.zip)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">VS Code Zip</span>
          </button>

          <button
            type="button"
            onClick={() => setIsChatOpen((c) => !c)}
            className={`p-1.5 rounded-lg border ${border} cursor-pointer transition-colors ${
              isChatOpen ? 'bg-[#d97757]/15 text-[#d97757]' : `${bgPanel} ${textSub}`
            }`}
            title="Toggle Build with Agent Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-PANEL WORKSPACE (Explorer | Editor / Preview | Build with Agent) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Explorer (Tree view matching user's image) */}
        {isSidebarOpen && (
          <div className={`w-60 border-r ${border} ${bgSidebar} flex flex-col shrink-0 select-none overflow-hidden`}>
            {/* Explorer Header */}
            <div className={`px-3 py-2 border-b ${border} flex items-center justify-between text-xs font-bold ${textSub} uppercase tracking-wider`}>
              <span>Explorer</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCreateNewFile()}
                  className={`p-1 rounded hover:${bgPanel} ${textSub}`}
                  title="New File"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateNewFolder()}
                  className={`p-1 rounded hover:${bgPanel} ${textSub}`}
                  title="New Folder"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleOpenLaptopFolder}
                  className={`p-1 rounded hover:${bgPanel} ${textSub}`}
                  title="Open Laptop Folder"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Folder Tree */}
            <div className="flex-1 overflow-y-auto p-1.5 font-mono text-xs">
              {renderTree(fileTree)}
            </div>

            {/* Outline & Timeline sections (matching user's reference image!) */}
            <div className={`border-t ${border} text-xs font-semibold ${textSub}`}>
              <div className={`px-3 py-1.5 flex items-center gap-1.5 border-b ${border} cursor-pointer hover:${bgPanel}`}>
                <ChevronRight className="w-3 h-3 text-neutral-500" />
                <span>Outline</span>
              </div>
              <div className={`px-3 py-1.5 flex items-center gap-1.5 cursor-pointer hover:${bgPanel}`}>
                <ChevronRight className="w-3 h-3 text-neutral-500" />
                <span>Timeline</span>
              </div>
            </div>
          </div>
        )}

        {/* CENTER COLUMN: Code Editor OR In-Tab Live Preview */}
        <div className={`flex-1 flex flex-col min-w-0 ${bgEditor} overflow-hidden`}>
          {/* Top File Tabs */}
          <div className={`h-9 border-b ${border} ${bgSidebar} flex items-center justify-between px-2 overflow-x-auto shrink-0 select-none`}>
            <div className="flex items-center gap-1">
              {openTabIds.map((tabId) => {
                const f = files.find((item) => item.id === tabId);
                if (!f) return null;
                const isSelected = selectedFileId === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedFileId(f.id);
                      if (viewMode === 'preview') setViewMode('split');
                    }}
                    className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs font-mono cursor-pointer transition-colors ${
                      isSelected
                        ? `${bgCard} ${textBright} border ${border} font-semibold shadow-xs`
                        : `${textSub} hover:${bgPanel} hover:${textBright}`
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-[#d97757]' : 'text-neutral-500'}`} />
                    <span className="truncate max-w-[120px]">{f.name}</span>
                    <button
                      type="button"
                      onClick={(e) => handleCloseTab(f.id, e)}
                      className="p-0.5 rounded hover:bg-neutral-700/50 text-neutral-500 hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {saveStatus !== 'idle' && (
              <span className={`text-[10px] ${textSub} font-mono px-2`}>
                {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
              </span>
            )}
          </div>

          {/* Center Content: Editor and/or Live Preview */}
          <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
            {/* If no files loaded: Sapphire Logo, Folder Upload Area & VS Code Shortcuts */}
            {files.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center select-none overflow-y-auto">
                <div className="max-w-md w-full space-y-6">
                  {/* Top Sapphire Logo & Branding */}
                  <div className="flex flex-col items-center">
                    <img
                      src={SAPPHIRE_LOGO_URL}
                      alt="Sapphire"
                      className="w-12 h-12 rounded-2xl mb-3 shadow-md object-contain"
                    />
                    <h2 className={`text-base sm:text-lg font-bold ${textBright}`}>
                      Sapphire Codex Studio
                    </h2>
                    <p className={`text-xs ${textSub} mt-1`}>
                      Select a project folder or build something new with the AI Architect.
                    </p>
                  </div>

                  {/* Folder Upload & New File Action Card */}
                  <div className={`p-5 rounded-2xl border ${border} ${bgCard} space-y-3 shadow-xs text-left`}>
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${textSub}`}>
                      Workspace Setup
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={handleOpenLaptopFolder}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Select / Open Folder</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCreateNewFile()}
                        className={`flex-1 py-2.5 px-4 rounded-xl ${bgInput} hover:${bgPanel} ${textBright} text-xs font-semibold flex items-center justify-center gap-2 border ${border} transition-colors cursor-pointer`}
                      >
                        <FilePlus className="w-4 h-4 text-[#d97757]" />
                        <span>Create New File</span>
                      </button>
                    </div>
                  </div>

                  {/* Keyboard Shortcuts Watermark (matching user's reference image) */}
                  <div className={`p-4 rounded-xl border ${border} ${bgPanel} space-y-2.5 text-xs ${textSub} font-mono text-left`}>
                    <div className="flex items-center justify-between">
                      <span>Open Chat Architect</span>
                      <span className={`px-2 py-0.5 rounded ${bgCard} border ${border} ${textBright}`}>Ctrl + Alt + I</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Show All Commands</span>
                      <span className={`px-2 py-0.5 rounded ${bgCard} border ${border} ${textBright}`}>Ctrl + Shift + P</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Live Preview Sandbox</span>
                      <span className={`px-2 py-0.5 rounded ${bgCard} border ${border} ${textBright}`}>F5</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : !activeFile ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none text-xs text-neutral-400 font-mono">
                <FileCode className="w-8 h-8 text-[#d97757] mb-2" />
                <p>Select a file from the explorer on the left to edit code or preview.</p>
              </div>
            ) : (
              <>
                {/* 1. CODE EDITOR (Rendered in 'code' or 'split') */}
                {(viewMode === 'code' || viewMode === 'split') && (
                  <div className={`flex-1 flex flex-col min-w-0 h-full ${bgEditor} overflow-hidden ${
                    viewMode === 'split' ? 'border-r ' + border : ''
                  }`}>
                    <div className="flex-1 flex min-h-0 overflow-hidden">
                      {/* Line Numbers Gutter */}
                      <div
                        ref={lineGutterRef}
                        className={`w-11 py-3 pr-2 text-right font-mono text-xs select-none border-r ${border} ${bgSidebar} ${textSub} opacity-60 overflow-hidden`}
                      >
                        {Array.from({ length: lineCount }).map((_, i) => (
                          <div key={i} className="leading-6">
                            {i + 1}
                          </div>
                        ))}
                      </div>

                      {/* Code Textarea */}
                      <textarea
                        ref={editorTextareaRef}
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onScroll={handleEditorScroll}
                        onKeyUp={handleEditorKeyUp}
                        onClick={handleEditorClick}
                        spellCheck={false}
                        className={`flex-1 p-3 bg-transparent font-mono text-xs ${textBright} leading-6 focus:outline-none resize-none overflow-auto tab-size-2 whitespace-pre`}
                      />
                    </div>
                  </div>
                )}

                {/* 2. IN-TAB LIVE PREVIEW (Rendered in 'preview' or 'split') */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className={`flex-1 flex flex-col min-w-0 h-full bg-[#111111] overflow-hidden`}>
                    {/* Viewport Control Bar */}
                    <div className={`h-9 px-3 border-b border-neutral-800 bg-[#161616] flex items-center justify-between shrink-0 select-none text-xs`}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                        <span className="font-semibold text-neutral-300">Live Sandbox Preview</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-[#20201f] rounded-lg p-0.5 border border-[#2b2b2a]">
                          <button
                            type="button"
                            onClick={() => setPreviewViewport('desktop')}
                            className={`p-1 rounded cursor-pointer ${
                              previewViewport === 'desktop' ? 'bg-[#d97757] text-white' : 'text-neutral-400'
                            }`}
                            title="Desktop View"
                          >
                            <Monitor className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewViewport('tablet')}
                            className={`p-1 rounded cursor-pointer ${
                              previewViewport === 'tablet' ? 'bg-[#d97757] text-white' : 'text-neutral-400'
                            }`}
                            title="Tablet View"
                          >
                            <Tablet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewViewport('mobile')}
                            className={`p-1 rounded cursor-pointer ${
                              previewViewport === 'mobile' ? 'bg-[#d97757] text-white' : 'text-neutral-400'
                            }`}
                            title="Mobile View"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewReloadKey((k) => k + 1)}
                          className="p-1.5 rounded-lg bg-[#20201f] hover:bg-[#282724] text-neutral-400 hover:text-white border border-[#2b2b2a] cursor-pointer"
                          title="Reload Live Sandbox"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Sandbox Frame Container */}
                    <div className="flex-1 p-2 sm:p-4 flex items-center justify-center overflow-auto bg-[#0d0d0d]">
                      <div
                        className={`h-full bg-white transition-all duration-200 rounded-xl overflow-hidden shadow-2xl ${
                          previewViewport === 'mobile'
                            ? 'w-[375px] max-h-[760px] border-[6px] border-neutral-800'
                            : previewViewport === 'tablet'
                            ? 'w-[768px] max-h-[900px] border-[6px] border-neutral-800'
                            : 'w-full h-full border border-neutral-800'
                        }`}
                      >
                        <iframe
                          key={previewReloadKey}
                          srcDoc={livePreviewDoc}
                          title="Sapphire Codex Live Sandbox"
                          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                          className="w-full h-full border-none bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: "BUILD WITH AGENT" / CHAT (Matching user's reference image!) */}
        {isChatOpen && (
          <div className={`w-80 sm:w-96 border-l ${border} ${bgSidebar} flex flex-col h-full shrink-0 select-none overflow-hidden`}>
            {/* Header: Chat tab & controls matching user's image */}
            <div className={`h-9 px-3 border-b ${border} flex items-center justify-between shrink-0 text-xs`}>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${textBright} px-2 py-0.5 rounded bg-[#d97757]/15 text-[#d97757]`}>
                  Chat
                </span>
                <span className={`text-[11px] ${textSub}`}>Build with Agent</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setMessages([
                      {
                        id: `ast_${Date.now()}`,
                        role: 'assistant',
                        text: 'Ready for new task.',
                        summary: 'New session initialized.',
                        timestamp: Date.now()
                      }
                    ])
                  }
                  className={`p-1 rounded hover:${bgPanel} ${textSub} hover:${textBright}`}
                  title="New Agent Session"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className={`p-1 rounded hover:${bgPanel} ${textSub} hover:${textBright}`}
                  title="Close Agent Panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Middle: Conversation & Steps */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans">
              {messages.length === 1 && (
                <div className="text-center py-8 px-4 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#20201f] text-[#d97757] border border-[#2b2b2a] flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className={`text-xs font-bold ${textBright}`}>Build with Agent</h4>
                  <p className={`text-[11px] ${textSub} leading-relaxed`}>
                    Describe what to build. Sapphire Codex will create, modify, and wire code files directly into your workspace.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? `bg-[#d97757]/15 border border-[#d97757]/30 text-white ml-4`
                      : `${bgCard} border ${border} ${textBright} mr-4`
                  }`}
                >
                  <p className="font-semibold text-[10px] text-[#d97757] mb-1">
                    {msg.role === 'user' ? 'You' : 'Agent'}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.summary || msg.text}</p>

                  {/* File modified cards */}
                  {msg.actionFiles && msg.actionFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.actionFiles.map((af, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const f = files.find((file) => file.path === af.path);
                            if (f) setSelectedFileId(f.id);
                          }}
                          className={`p-1.5 rounded-lg ${bgPanel} border ${border} flex items-center justify-between text-[11px] font-mono cursor-pointer hover:border-[#d97757]`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FileCode className="w-3 h-3 text-[#d97757]" />
                            <span className="truncate">{af.path}</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-sans">
                            {af.action === 'created' ? '+ created' : '✓ updated'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isLoadingAi && (
                <div className={`p-2.5 rounded-xl text-xs ${bgCard} border ${border} ${textBright} mr-4 flex items-center gap-2`}>
                  <RefreshCw className="w-3 h-3 text-[#d97757] animate-spin" />
                  <span>{aiStreamingStatus || 'Architecting code...'}</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Bottom: Rounded Input Box matching user's reference image */}
            <div className={`p-3 border-t ${border} ${bgSidebar} space-y-2 shrink-0 font-sans`}>
              <div className={`p-2.5 rounded-2xl border ${border} ${bgCard} space-y-2 shadow-xs`}>
                <textarea
                  rows={2}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAiPrompt();
                    }
                  }}
                  placeholder="Describe what to build..."
                  className={`w-full bg-transparent text-xs ${textBright} focus:outline-none placeholder:text-neutral-500 resize-none leading-relaxed`}
                />

                {/* Bottom toolbar inside input box (matching user's screenshot: +, Agent, Models, mic, send) */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <button
                      type="button"
                      onClick={() => handleCreateNewFile()}
                      className={`p-1 rounded-md hover:${bgPanel} text-neutral-400 hover:text-white cursor-pointer`}
                      title="Add File Context"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-semibold">
                      <Code2 className="w-3 h-3" />
                      <span>Agent</span>
                    </span>
                    <span className="text-[10px] text-neutral-500">Models</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className={`p-1 rounded-md hover:${bgPanel} text-neutral-400 hover:text-white cursor-pointer`}
                      title="Dictate"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendAiPrompt()}
                      disabled={isLoadingAi || !inputPrompt.trim()}
                      className="w-6 h-6 rounded-lg bg-[#d97757] hover:bg-[#c86b4c] text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom tag indicators (matching user's screenshot) */}
              <div className="flex items-center justify-between text-[10px] text-neutral-500 px-1 font-mono">
                <span>🖥 Local</span>
                <span>🛡 Default permissions</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM STATUS BAR (Sapphire Aesthetic matching chat) */}
      <footer className={`h-6 ${bgSidebar} border-t ${border} ${textSub} flex items-center justify-between px-3 text-[11px] select-none shrink-0 font-mono`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#d97757]">
            <GitBranch className="w-3 h-3" />
            <span>main*</span>
          </span>
          <span className="flex items-center gap-1 text-neutral-500">
            <span>⊗ 0</span>
            <span>⚠ 0</span>
          </span>
          <span className="truncate max-w-[160px]">{activeProject.name}</span>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span className="font-semibold uppercase text-[#d97757]">{activeFile?.language || 'TEXT'}</span>
          <span className="px-1.5 py-0.2 rounded font-bold font-sans bg-[#d97757]/15 text-[#d97757]">
            Sapphire Codex
          </span>
        </div>
      </footer>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 right-6 bg-[#d97757] text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl z-50 flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
          <Check className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default CodexWorkspaceView;