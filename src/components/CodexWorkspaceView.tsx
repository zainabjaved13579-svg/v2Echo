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
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { AppSettings, UserProfile } from '../types';
import { useAppTheme } from '../context/ThemeContext';
import { getStoredApiKey } from '../services/geminiService';
import { SAPPHIRE_LEAD_DEVELOPER } from '../data/constants';

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

// Tree node structure for hierarchical explorer
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
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Application</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-[#0b0f19] text-slate-100 min-h-screen flex items-center justify-center p-6 selection:bg-cyan-500/30">
  <div class="max-w-md w-full bg-[#131b2e] border border-cyan-500/20 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
    <div class="absolute -right-12 -top-12 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
        <i data-lucide="sparkles" class="w-5 h-5"></i>
      </div>
      <div>
        <h1 class="text-xl font-bold text-white tracking-tight">Sapphire Codex</h1>
        <p class="text-xs text-cyan-400 font-mono">Autonomous VS Code Studio</p>
      </div>
    </div>
    <p class="text-slate-300 text-sm leading-relaxed mb-6">
      Production-grade environment with live preview, Tailwind CSS, Lucide icons, and zero-lag streaming.
    </p>
    <div class="space-y-3">
      <button id="cta-btn" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm transition-all transform active:scale-95 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer">
        <i data-lucide="zap" class="w-4 h-4"></i>
        <span>Test Interactive Action</span>
      </button>
      <div id="output-box" class="hidden p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200 font-mono text-center"></div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      language: 'html',
      size: 1940,
      lastModified: Date.now(),
      status: 'ready'
    },
    {
      id: 'init_css',
      name: 'style.css',
      path: 'style.css',
      content: `/* Custom App Enhancements */
@keyframes pulseGlow {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.05); }
}

.glow-effect {
  animation: pulseGlow 4s ease-in-out infinite;
}`,
      language: 'css',
      size: 220,
      lastModified: Date.now(),
      status: 'ready'
    },
    {
      id: 'init_js',
      name: 'script.js',
      path: 'script.js',
      content: `// Interactive Application Logic
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const btn = document.getElementById('cta-btn');
  const output = document.getElementById('output-box');
  let clicks = 0;

  btn?.addEventListener('click', () => {
    clicks++;
    if (output) {
      output.classList.remove('hidden');
      output.textContent = \`Interactive action executed! Total clicks: \${clicks}\`;
    }
  });
});`,
      language: 'javascript',
      size: 470,
      lastModified: Date.now(),
      status: 'ready'
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

  // Sort folders first, then alphabetically
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

  // Projects State
  const [projects, setProjects] = useState<CodexProject[]>(() => {
    try {
      const saved = localStorage.getItem('sapphire_codex_projects_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: `proj_${Date.now()}`,
        name: 'Sapphire App',
        createdAt: Date.now(),
        lastModified: Date.now(),
        files: STARTER_TEMPLATES.web
      }
    ];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sapphire_codex_active_proj_id_v4');
      if (saved) return saved;
    } catch {}
    return projects[0]?.id || `proj_${Date.now()}`;
  });

  // Save projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sapphire_codex_projects_v4', JSON.stringify(projects));
      localStorage.setItem('sapphire_codex_active_proj_id_v4', activeProjectId);
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
  // 'preview': Dedicated Full-Tab Live Preview inside the workspace!
  const [viewMode, setViewMode] = useState<'code' | 'split' | 'preview'>('split');
  const [activeActivityTab, setActiveActivityTab] = useState<'explorer' | 'search' | 'ai'>('explorer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  // New Project / Folder Modal
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTemplate, setNewProjectTemplate] = useState<'web' | 'empty'>('web');

  // Search in Files State
  const [searchQuery, setSearchQuery] = useState('');

  // AI Chat & Generation State
  const [messages, setMessages] = useState<CodexMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Sapphire Codex AI Architect ready.',
      summary: 'Ready to build high-performance multi-file web apps, clean components, and full pages.',
      timestamp: Date.now()
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiStreamingStatus, setAiStreamingStatus] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini-flash-latest' | 'gemini-4-argon'>('gemini-flash-latest');
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

  // Sync open tabs
  useEffect(() => {
    if (selectedFileId && !openTabIds.includes(selectedFileId)) {
      setOpenTabIds((prev) => [...prev, selectedFileId]);
    }
  }, [selectedFileId]);

  // Sync editor content
  useEffect(() => {
    if (activeFile && !activeFile.isBinary) {
      setEditingContent(activeFile.content);
    }
  }, [activeFile?.id]);

  // Synchronize Line Gutter Scroll
  const handleEditorScroll = () => {
    if (editorTextareaRef.current && lineGutterRef.current) {
      lineGutterRef.current.scrollTop = editorTextareaRef.current.scrollTop;
    }
  };

  // Cursor tracking
  const handleEditorKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const selStart = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, selStart);
    const lines = textBefore.split('\n');
    setCursorPosition({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  // Auto-Save Content with debounce
  useEffect(() => {
    if (!activeFile || activeFile.isBinary) return;
    if (editingContent === activeFile.content) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile.id
            ? { ...f, content: editingContent, size: editingContent.length, lastModified: Date.now(), status: 'modified' }
            : f
        )
      );

      // Write directly to laptop disk if handle exists
      if (activeFile.fileHandle) {
        try {
          const writable = await activeFile.fileHandle.createWritable();
          await writable.write(editingContent);
          await writable.close();
        } catch {}
      }

      setSaveStatus('saved');
      setPreviewReloadKey((k) => k + 1);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editingContent, activeFile?.id]);

  // Keyboard shortcut Ctrl/Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeFile && !activeFile.isBinary) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === activeFile.id
                ? { ...f, content: editingContent, size: editingContent.length, lastModified: Date.now(), status: 'modified' }
                : f
            )
          );
          setSaveStatus('saved');
          setPreviewReloadKey((k) => k + 1);
          setTimeout(() => setSaveStatus('idle'), 1500);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, editingContent]);

  // ========== DIRECTORY & FOLDER HANDLING ==========
  const scanDirectoryRecursive = async (dirHandle: any, currentPath = ''): Promise<LaptopFile[]> => {
    const list: LaptopFile[] = [];
    try {
      for await (const entry of (dirHandle as any).values()) {
        const name = entry.name;
        if (name === 'node_modules' || name === '.git' || name === 'dist' || name === '.DS_Store') {
          continue;
        }

        const fullPath = normalizePath(currentPath ? `${currentPath}/${name}` : name);

        if (entry.kind === 'file') {
          try {
            const file = await entry.getFile();
            if (file.size > MAX_FILE_SIZE) continue;
            const text = isTextFile(name) ? await file.text() : '';
            list.push({
              id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              name,
              path: fullPath,
              content: text || '[Binary / Media Asset]',
              language: getLanguage(name),
              size: file.size,
              lastModified: file.lastModified,
              fileHandle: entry,
              isBinary: !isTextFile(name)
            });
          } catch {}
        } else if (entry.kind === 'directory') {
          const sub = await scanDirectoryRecursive(entry, fullPath);
          list.push(...sub);
        }
      }
    } catch {}
    return list;
  };

  const handleOpenLaptopFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        if (!handle) return;

        setRootDirHandle(handle);
        const scanned = await scanDirectoryRecursive(handle);

        if (scanned.length === 0) {
          // Empty folder selected! Provide starter prompt or file
          const initialFile: LaptopFile = {
            id: `f_${Date.now()}`,
            name: 'index.html',
            path: 'index.html',
            content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${handle.name}</title>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-slate-900 text-white min-h-screen flex items-center justify-center p-6">\n  <div class="text-center">\n    <h1 class="text-2xl font-bold">${handle.name}</h1>\n    <p class="text-slate-400 mt-2">Folder opened. Ask Codex to build your application!</p>\n  </div>\n</body>\n</html>`,
            language: 'html',
            size: 350,
            lastModified: Date.now()
          };
          const newProj: CodexProject = {
            id: `proj_${Date.now()}`,
            name: handle.name,
            createdAt: Date.now(),
            lastModified: Date.now(),
            files: [initialFile]
          };
          setProjects((prev) => [newProj, ...prev]);
          setActiveProjectId(newProj.id);
          setSelectedFileId(initialFile.id);
          setOpenTabIds([initialFile.id]);
          setToastMessage(`Opened empty laptop folder "${handle.name}". Scaffold ready!`);
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }

        const newProj: CodexProject = {
          id: `proj_${Date.now()}`,
          name: handle.name,
          createdAt: Date.now(),
          lastModified: Date.now(),
          files: scanned
        };
        setProjects((prev) => [newProj, ...prev]);
        setActiveProjectId(newProj.id);
        setSelectedFileId(scanned[0].id);
        setOpenTabIds([scanned[0].id]);

        // Auto expand directories
        const folders = new Set<string>();
        scanned.forEach((f) => {
          const parts = f.path.split('/');
          for (let i = 1; i < parts.length; i++) {
            folders.add(parts.slice(0, i).join('/'));
          }
        });
        setExpandedFolders(folders);

        setPreviewReloadKey((k) => k + 1);
        setToastMessage(`Connected folder "${handle.name}" (${scanned.length} files)`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
    }

    folderInputRef.current?.click();
  };

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const scanned: LaptopFile[] = [];
    let detectedRoot = 'Laptop Project';

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = normalizePath((file as any).webkitRelativePath || file.name);
      if (relPath.includes('node_modules/') || relPath.includes('.git/')) continue;

      const parts = relPath.split('/');
      if (parts.length > 1 && detectedRoot === 'Laptop Project') {
        detectedRoot = parts[0];
      }

      const text = isTextFile(file.name) ? await file.text() : '';
      scanned.push({
        id: `f_${Date.now()}_${i}`,
        name: file.name,
        path: relPath,
        content: text || '[Binary / Media Asset]',
        language: getLanguage(file.name),
        size: file.size,
        lastModified: file.lastModified,
        isBinary: !isTextFile(file.name)
      });
    }

    if (scanned.length > 0) {
      const newProj: CodexProject = {
        id: `proj_${Date.now()}`,
        name: detectedRoot,
        createdAt: Date.now(),
        lastModified: Date.now(),
        files: scanned
      };
      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newProj.id);
      setSelectedFileId(scanned[0].id);
      setOpenTabIds([scanned[0].id]);

      const folders = new Set<string>();
      scanned.forEach((f) => {
        const parts = f.path.split('/');
        for (let i = 1; i < parts.length; i++) {
          folders.add(parts.slice(0, i).join('/'));
        }
      });
      setExpandedFolders(folders);

      setPreviewReloadKey((k) => k + 1);
      setToastMessage(`Loaded folder "${detectedRoot}" (${scanned.length} files)`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Create New Project Folder
  const handleCreateNewProject = () => {
    const name = newProjectName.trim() || 'New App';
    const newFiles: LaptopFile[] =
      newProjectTemplate === 'web'
        ? STARTER_TEMPLATES.web.map((f, i) => ({
            ...f,
            id: `f_new_${Date.now()}_${i}`
          }))
        : [
            {
              id: `f_empty_${Date.now()}`,
              name: 'index.html',
              path: 'index.html',
              content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${name}</title>\n</head>\n<body>\n  <h1>Welcome to ${name}</h1>\n</body>\n</html>`,
              language: 'html',
              size: 120,
              lastModified: Date.now()
            }
          ];

    const newProj: CodexProject = {
      id: `proj_${Date.now()}`,
      name,
      createdAt: Date.now(),
      lastModified: Date.now(),
      files: newFiles
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setSelectedFileId(newFiles[0].id);
    setOpenTabIds([newFiles[0].id]);
    setIsNewProjectModalOpen(false);
    setNewProjectName('');
    setToastMessage(`Created project folder "${name}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ========== FILE OPERATIONS ==========
  const handleCreateNewFile = (parentFolder = '') => {
    const promptMsg = parentFolder
      ? `Create file inside "${parentFolder}/" (e.g. Navbar.tsx):`
      : 'File path/name (e.g. src/App.tsx, styles.css):';
    const input = prompt(promptMsg);
    if (!input?.trim()) return;

    let fullPath = normalizePath(input.trim());
    if (parentFolder && !fullPath.startsWith(parentFolder)) {
      fullPath = normalizePath(`${parentFolder}/${fullPath}`);
    }

    const fileName = fullPath.split('/').pop() || fullPath;

    const newFile: LaptopFile = {
      id: `file_${Date.now()}`,
      name: fileName,
      path: fullPath,
      content: '',
      language: getLanguage(fileName),
      size: 0,
      lastModified: Date.now(),
      status: 'created'
    };

    setFiles((prev) => [newFile, ...prev]);
    setSelectedFileId(newFile.id);
    if (!openTabIds.includes(newFile.id)) {
      setOpenTabIds((prev) => [...prev, newFile.id]);
    }
  };

  const handleCreateNewFolder = (parentFolder = '') => {
    const promptMsg = parentFolder
      ? `Create folder inside "${parentFolder}/":`
      : 'Folder path/name (e.g. src/components):';
    const folderInput = prompt(promptMsg);
    if (!folderInput?.trim()) return;

    let targetPath = normalizePath(folderInput.trim());
    if (parentFolder && !targetPath.startsWith(parentFolder)) {
      targetPath = normalizePath(`${parentFolder}/${targetPath}`);
    }

    // Auto add a placeholder .gitkeep or index file
    const placeholder: LaptopFile = {
      id: `file_${Date.now()}`,
      name: '.gitkeep',
      path: `${targetPath}/.gitkeep`,
      content: '',
      language: 'text',
      size: 0,
      lastModified: Date.now(),
      status: 'created'
    };

    setFiles((prev) => [...prev, placeholder]);
    setExpandedFolders((prev) => new Set([...prev, targetPath]));
    setToastMessage(`Created folder "${targetPath}"`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCloseTab = (idToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openTabIds.filter((id) => id !== idToClose);
    setOpenTabIds(nextTabs);
    if (selectedFileId === idToClose) {
      if (nextTabs.length > 0) {
        setSelectedFileId(nextTabs[nextTabs.length - 1]);
      } else {
        setSelectedFileId('');
        setEditingContent('');
      }
    }
  };

  const handleDeleteFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) {
      alert('Workspace must keep at least one file.');
      return;
    }
    const target = files.find((f) => f.id === fileId);
    if (!confirm(`Delete "${target?.name || 'this file'}"?`)) return;

    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    setOpenTabIds((prev) => prev.filter((id) => id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(remaining[0]?.id || '');
    }
  };

  // Export full project as VS Code Zip package
  const handleExportVsCodeZip = async () => {
    try {
      const zip = new JSZip();

      // Add all project files
      files.forEach((f) => {
        if (!f.isBinary) {
          zip.file(f.path, f.content);
        }
      });

      // Add standard VS Code configurations
      zip.folder('.vscode')?.file(
        'settings.json',
        JSON.stringify(
          {
            'editor.tabSize': 2,
            'editor.formatOnSave': true,
            'files.autoSave': 'afterDelay',
            'files.autoSaveDelay': 1000
          },
          null,
          2
        )
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeProject.name.toLowerCase().replace(/\s+/g, '-')}-vscode.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setToastMessage('Exported complete project for VS Code (.zip)');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      alert('Error exporting ZIP');
    }
  };

  // Quick Format Code
  const handleFormatCode = () => {
    if (!editingContent.trim() || !activeFile) return;
    try {
      if (activeFile.language === 'json') {
        const parsed = JSON.parse(editingContent);
        setEditingContent(JSON.stringify(parsed, null, 2));
        setToastMessage('Formatted JSON');
        setTimeout(() => setToastMessage(null), 2000);
        return;
      }

      const lines = editingContent.split('\n');
      let indentLevel = 0;
      const formatted = lines.map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        const indented = '  '.repeat(indentLevel) + trimmed;
        if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
          indentLevel++;
        }
        return indented;
      });
      setEditingContent(formatted.join('\n'));
      setToastMessage('Formatted Code');
      setTimeout(() => setToastMessage(null), 2000);
    } catch {
      setToastMessage('Could not auto-format: check syntax');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  // ========== ROBUST LIVE PREVIEW BUNDLE ==========
  // Powers seamless rendering: HTML + Tailwind + Lucide Icons + React 18 + Babel + CSS/JS bundling
  const livePreviewDoc = useMemo(() => {
    const htmlFile = files.find((f) => f.name.endsWith('.html') || f.language === 'html');
    const cssFiles = files.filter((f) => f.name.endsWith('.css') || f.language === 'css');
    const jsFiles = files.filter((f) => {
      const n = f.name.toLowerCase();
      return n.endsWith('.js') || n.endsWith('.jsx') || n.endsWith('.ts') || n.endsWith('.tsx');
    });

    let html = htmlFile ? htmlFile.content : '';

    // If no HTML file is present, construct a modern runtime shell showcasing the active file
    if (!html) {
      if (activeFile && (activeFile.language === 'javascript' || activeFile.language === 'typescript')) {
        html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.6/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-[#0b0f19] text-white p-6 font-sans min-h-screen">
  <div id="root"></div>
</body>
</html>`;
      } else {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0a0d14] text-slate-300 font-sans flex items-center justify-center min-h-screen p-6">
  <div class="text-center max-w-sm p-6 rounded-2xl bg-[#121624] border border-cyan-500/20">
    <h3 class="text-white font-bold text-base mb-1">Live Sandbox Ready</h3>
    <p class="text-xs text-slate-400">Add an index.html or script to preview your components in real time.</p>
  </div>
</body>
</html>`;
      }
    }

    // Auto-inject Tailwind CSS CDN if not already present
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

    // Inline CSS from all .css files
    const cssBundle = cssFiles.map((c) => `/* ${c.name} */\n${c.content}`).join('\n\n');
    if (cssBundle) {
      const styleTag = `<style id="codex-injected-styles">\n${cssBundle}\n</style>`;
      html = html.includes('</head>')
        ? html.replace('</head>', `${styleTag}\n</head>`)
        : `${styleTag}\n${html}`;
    }

    // Inline JS/TS/JSX scripts with error toast notification
    const errorToastScript = `
  <script>
    window.addEventListener('error', function(e) {
      try {
        var existing = document.getElementById('sapphire-err-toast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.id = 'sapphire-err-toast';
        toast.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;max-width:480px;margin:0 auto;z-index:99999;background:#161922;border:1px solid #06b6d4;border-radius:12px;padding:10px 14px;color:#cbd5e1;font-family:monospace;font-size:11px;box-shadow:0 10px 25px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:between;gap:8px;';
        toast.innerHTML = '<span>⚡ ' + (e.message || 'Script error') + '</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;">&times;</button>';
        document.body.appendChild(toast);
      } catch(err) {}
    });
  </script>`;

    const jsBundle = jsFiles
      .map((j) => {
        return `
    <script>
      try {
        ${j.content}
      } catch(err) {
        console.error('Sandbox script error in ${j.name}:', err);
      }
    </script>`;
      })
      .join('\n');

    const finalScripts = `${errorToastScript}\n${jsBundle}`;

    if (html.includes('</body>')) {
      html = html.replace('</body>', `${finalScripts}\n</body>`);
    } else {
      html = `${html}\n${finalScripts}`;
    }

    return html;
  }, [files, previewReloadKey, activeFile?.id]);

  // ========== AI MULTI-FILE CODE GENERATION (CLEAN CHAT & ZERO-LAG) ==========
  const handleSendAiPrompt = async (promptOverride?: string) => {
    const prompt = (promptOverride || inputPrompt).trim();
    if (!prompt || isLoadingAi) return;

    const userMsg: CodexMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: prompt,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoadingAi(true);
    setAiStreamingStatus('Architecting multi-file solution...');

    const botId = `b_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: botId,
        role: 'assistant',
        text: 'Generating project files...',
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
2. NEVER write childish, basic, simplistic, or placeholder code ("bacho wali coding").
3. DO NOT output conversational filler or bloated commentary in your response.
4. Output your files strictly in this clean Markdown code block format:
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
Always provide complete, production-grade, bug-free implementations with modern responsive UI (Tailwind CSS, Lucide icons, glassmorphism, flex/grid, clean interaction).`;

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

      if (!response.ok || !response.body) throw new Error('Stream request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

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
              const textPiece = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              accumulated += textPiece;

              // Check if currently generating a specific file block
              const currentBlockMatch = accumulated.match(/```([a-zA-Z0-9_-]+)?(?:\s+([\w\.\-\/]+))?[^`]*$/);
              if (currentBlockMatch && currentBlockMatch[2]) {
                setAiStreamingStatus(`Crafting ${currentBlockMatch[2]}...`);
              }
            } catch {}
          }
        }
      }

      // Parse generated files from markdown blocks
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
        const actionSummaries: FileActionSummary[] = [];

        setFiles((prev) => {
          const updated = [...prev];
          parsedFiles.forEach((newF) => {
            const existingIdx = updated.findIndex((f) => f.path === newF.path);
            const lineCount = newF.content.split('\n').length;

            if (existingIdx >= 0) {
              updated[existingIdx] = {
                ...updated[existingIdx],
                content: newF.content,
                size: newF.content.length,
                lastModified: Date.now(),
                status: 'modified'
              };
              actionSummaries.push({
                path: newF.path,
                lines: lineCount,
                action: 'updated'
              });
            } else {
              updated.push({
                id: `f_gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                name: newF.name,
                path: newF.path,
                content: newF.content,
                language: newF.language,
                size: newF.content.length,
                lastModified: Date.now(),
                status: 'created'
              });
              actionSummaries.push({
                path: newF.path,
                lines: lineCount,
                action: 'created'
              });
            }
          });
          return updated;
        });

        // Set primary file active
        const primary = parsedFiles.find((p) => p.path === 'index.html') || parsedFiles[0];
        const target = files.find((f) => f.path === primary.path);
        if (target) {
          setSelectedFileId(target.id);
          if (!openTabIds.includes(target.id)) {
            setOpenTabIds((prev) => [...prev, target.id]);
          }
        }

        // Clean, ultra-concise message in chat - ZERO code dumped!
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId
              ? {
                  ...m,
                  isStreaming: false,
                  text: `Completed architecture for "${prompt.slice(0, 40)}..."`,
                  summary: `Successfully generated ${parsedFiles.length} file(s) with production styling and responsive logic.`,
                  actionFiles: actionSummaries
                }
              : m
          )
        );

        setPreviewReloadKey((k) => k + 1);
        setToastMessage(`Generated ${parsedFiles.length} production files!`);
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId
              ? {
                  ...m,
                  isStreaming: false,
                  text: accumulated.slice(0, 240) || 'Action completed.',
                  summary: 'Code analyzed.'
                }
              : m
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? {
                ...m,
                text: 'Architect notice: Request encountered an error.',
                summary: err.message || 'Error executing request.',
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

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return files.filter(
      (f) => f.path.toLowerCase().includes(q) || (!f.isBinary && f.content.toLowerCase().includes(q))
    );
  }, [files, searchQuery]);

  // Line numbers
  const lineCount = useMemo(() => {
    return Math.max(1, editingContent.split('\n').length);
  }, [editingContent]);

  // File tree
  const fileTree = useMemo(() => buildFileTree(files), [files]);

  // Recursive tree component
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
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
              className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-800/50 cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-1.5 truncate">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-cyan-500/70 shrink-0" />
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
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300"
                  title="New File in Folder"
                >
                  <FilePlus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateNewFolder(node.path);
                  }}
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300"
                  title="New Subfolder"
                >
                  <FolderPlus className="w-3 h-3" />
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
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        className={`group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition-colors text-xs ${
          isSelected
            ? 'bg-cyan-500/15 text-cyan-300 font-semibold border-l-2 border-cyan-400'
            : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
          {ext === 'html' ? (
            <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          ) : ext === 'css' ? (
            <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          ) : ext === 'json' ? (
            <FileJson className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          )}
          <span className="truncate">{file.name}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => handleDeleteFile(file.id, e)}
            className="p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400"
            title="Delete File"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0b0e17] text-slate-200 overflow-hidden font-['JetBrains_Mono',monospace]">
      {/* Hidden Folder Input */}
      <input
        type="file"
        ref={folderInputRef}
        {...({ webkitdirectory: '', directory: '' } as any)}
        multiple
        className="hidden"
        onChange={handleFolderInputChange}
      />

      {/* TOP HEADER MENU BAR (Matches Sapphire Theme) */}
      <div className="h-10 bg-[#080b12] border-b border-[#1a2030] flex items-center justify-between px-3 text-xs shrink-0 select-none font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center gap-1"
              title="Return to Sapphire"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px] font-semibold hidden sm:inline">Back</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-xs">Sapphire Codex</span>
            <span className="text-slate-500 text-[11px] hidden md:inline">· {activeProject.name}</span>
          </div>
        </div>

        {/* View Mode Segmented Controls (Editor, Split, Full Preview) */}
        <div className="flex items-center gap-1 bg-[#121624] p-0.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('code')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'code' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Code Editor Only"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Code</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'split' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Split Code & Live Preview"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'preview' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Full-Tab Live Preview"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Live Preview</span>
          </button>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
              <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-[#151926] hover:bg-[#1e2436] text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/60 cursor-pointer"
            title="Create New Project Folder"
          >
            <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">New Folder</span>
          </button>

          <button
            type="button"
            onClick={handleOpenLaptopFolder}
            className="px-2.5 py-1 rounded-lg bg-[#151926] hover:bg-[#1e2436] text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/60 cursor-pointer"
            title="Open Folder from Laptop"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Open Folder</span>
          </button>

          <button
            type="button"
            onClick={handleExportVsCodeZip}
            className="px-2.5 py-1 rounded-lg bg-[#151926] hover:bg-[#1e2436] text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/60 cursor-pointer"
            title="Download for VS Code (.zip)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">VS Code Zip</span>
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE BODY (Activity Bar + Sidebar + Editor/Preview Pane) */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. ACTIVITY BAR (Left 48px) */}
        <div className="w-12 bg-[#06080e] border-r border-[#161b29] flex flex-col items-center py-2.5 justify-between shrink-0 select-none">
          <div className="flex flex-col items-center space-y-2.5">
            <button
              type="button"
              onClick={() => {
                if (activeActivityTab === 'explorer' && isSidebarOpen) {
                  setIsSidebarOpen(false);
                } else {
                  setActiveActivityTab('explorer');
                  setIsSidebarOpen(true);
                }
              }}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                activeActivityTab === 'explorer' && isSidebarOpen
                  ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="File Explorer"
            >
              <Folder className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeActivityTab === 'search' && isSidebarOpen) {
                  setIsSidebarOpen(false);
                } else {
                  setActiveActivityTab('search');
                  setIsSidebarOpen(true);
                }
              }}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                activeActivityTab === 'search' && isSidebarOpen
                  ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Search in Files"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeActivityTab === 'ai' && isSidebarOpen) {
                  setIsSidebarOpen(false);
                } else {
                  setActiveActivityTab('ai');
                  setIsSidebarOpen(true);
                }
              }}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                activeActivityTab === 'ai' && isSidebarOpen
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-l-2 border-cyan-400'
                  : 'text-slate-500 hover:text-cyan-400'
              }`}
              title="Autonomous Codex Architect"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-300 cursor-pointer"
              title="Toggle Primary Sidebar"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. PRIMARY SIDEBAR (~260px) */}
        {isSidebarOpen && (
          <div className="w-64 bg-[#0a0d14] border-r border-[#161b29] flex flex-col shrink-0 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Sidebar Header */}
            <div className="px-3 py-2.5 border-b border-[#161b29] flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
              <span className="flex items-center gap-1.5">
                {activeActivityTab === 'explorer' && 'Project Explorer'}
                {activeActivityTab === 'search' && 'Search Files'}
                {activeActivityTab === 'ai' && 'Codex Architect'}
              </span>

              <div className="flex items-center gap-1">
                {activeActivityTab === 'explorer' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCreateNewFile()}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 cursor-pointer"
                      title="New File"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateNewFolder()}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 cursor-pointer"
                      title="New Folder"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenLaptopFolder}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-300 cursor-pointer"
                      title="Open Laptop Folder"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-2 text-xs font-mono">
              {activeActivityTab === 'explorer' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 text-slate-500 font-bold uppercase tracking-wider text-[10px] font-['Plus_Jakarta_Sans',sans-serif]">
                    <span className="truncate">{activeProject.name}</span>
                    <span>{files.length} files</span>
                  </div>

                  {files.length === 0 ? (
                    <div className="p-4 text-center space-y-3 font-sans">
                      <p className="text-slate-500 text-xs">Workspace is empty.</p>
                      <button
                        type="button"
                        onClick={handleOpenLaptopFolder}
                        className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Open Laptop Folder
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateNewFile()}
                        className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                      >
                        Create New File
                      </button>
                    </div>
                  ) : (
                    renderTree(fileTree)
                  )}
                </div>
              )}

              {activeActivityTab === 'search' && (
                <div className="space-y-3 font-sans">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in workspace..."
                    className="w-full bg-[#131722] border border-[#232a3d] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-hidden font-mono"
                  />

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      Matches ({searchResults.length})
                    </span>
                    {searchResults.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => {
                          setSelectedFileId(file.id);
                          if (!openTabIds.includes(file.id)) {
                            setOpenTabIds((prev) => [...prev, file.id]);
                          }
                          if (viewMode === 'preview') setViewMode('split');
                        }}
                        className="p-2 rounded-xl bg-[#121624] border border-[#1e2436] hover:border-cyan-500/40 cursor-pointer text-xs"
                      >
                        <p className="font-bold text-cyan-400 truncate font-mono">{file.path}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                          {file.content.slice(0, 70)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeActivityTab === 'ai' && (
                <div className="h-full flex flex-col space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      Architect Model
                    </span>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value as any)}
                      aria-label="Codex AI Model"
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] text-cyan-300 font-mono outline-hidden"
                    >
                      <option value="gemini-flash-latest">Flash New (Instant)</option>
                      <option value="gemini-4-argon">Argon 4 (Heavy)</option>
                    </select>
                  </div>

                  {/* Clean Messages Feed (Zero Lag) */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-80 p-1">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-2xl text-xs ${
                          m.role === 'user'
                            ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-100 ml-2'
                            : 'bg-[#121624] border border-[#1e2436] text-slate-200 mr-1 shadow-lg'
                        }`}
                      >
                        <p className="font-semibold text-slate-100">{m.text}</p>
                        {m.summary && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {m.summary}
                          </p>
                        )}

                        {/* Interactive File Action Badges */}
                        {m.actionFiles && m.actionFiles.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5">
                            <span className="text-[10px] text-cyan-400 font-bold block">
                              Files Updated:
                            </span>
                            <div className="flex flex-col gap-1">
                              {m.actionFiles.map((item) => (
                                <button
                                  key={item.path}
                                  type="button"
                                  onClick={() => {
                                    const found = files.find((f) => f.path === item.path);
                                    if (found) {
                                      setSelectedFileId(found.id);
                                      if (!openTabIds.includes(found.id)) {
                                        setOpenTabIds((prev) => [...prev, found.id]);
                                      }
                                      if (viewMode === 'preview') setViewMode('split');
                                    }
                                  }}
                                  className="w-full px-2 py-1 rounded-lg bg-[#0e111a] hover:bg-cyan-500/10 text-[11px] text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 font-mono flex items-center justify-between transition-colors text-left"
                                >
                                  <span className="truncate">{item.path}</span>
                                  <span className="text-[9px] text-slate-500 shrink-0 font-sans">
                                    {item.lines} lines
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Live streaming indicator */}
                    {isLoadingAi && aiStreamingStatus && (
                      <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        <span>{aiStreamingStatus}</span>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input Prompt Box */}
                  <div className="space-y-1.5 pt-2 border-t border-[#1a2030]">
                    <textarea
                      value={inputPrompt}
                      onChange={(e) => setInputPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendAiPrompt();
                        }
                      }}
                      placeholder="Ask Codex to code features or apps..."
                      rows={3}
                      className="w-full bg-[#121624] border border-[#232a3d] rounded-xl p-2.5 text-xs text-slate-200 outline-hidden resize-none font-mono focus:border-cyan-500/60 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendAiPrompt()}
                      disabled={isLoadingAi || !inputPrompt.trim()}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                    >
                      {isLoadingAi ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>Build & Apply</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. CENTER / MAIN WORKSPACE AREA */}
        <div className="flex-1 flex min-w-0 overflow-hidden bg-[#0b0e17]">
          {/* EDITOR SECTION (Visible in 'code' or 'split' mode) */}
          {(viewMode === 'code' || viewMode === 'split') && (
            <div
              className={`flex flex-col min-w-0 overflow-hidden ${
                viewMode === 'split' ? 'w-[55%] border-r border-[#1a2030]' : 'w-full'
              }`}
            >
              {/* TABS BAR (With dedicated Live Preview Tab!) */}
              <div className="h-9 bg-[#080b12] border-b border-[#1a2030] flex items-center overflow-x-auto select-none shrink-0 font-['Plus_Jakarta_Sans',sans-serif]">
                {openTabIds.map((tabId) => {
                  const file = files.find((f) => f.id === tabId);
                  if (!file) return null;
                  const isActive = selectedFileId === tabId;
                  return (
                    <div
                      key={tabId}
                      onClick={() => setSelectedFileId(tabId)}
                      className={`h-full px-3 flex items-center gap-2 border-r border-[#1a2030] cursor-pointer text-xs font-medium transition-colors shrink-0 ${
                        isActive
                          ? 'bg-[#0b0e17] text-white border-t-2 border-t-cyan-400 font-semibold'
                          : 'bg-[#080b12] text-slate-400 hover:bg-[#0e121d] hover:text-slate-200'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate max-w-[120px] font-mono">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCloseTab(tabId, e)}
                        className="p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handleCreateNewFile()}
                  className="p-1.5 text-slate-500 hover:text-slate-300 ml-1 cursor-pointer"
                  title="New File"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* Permanent In-Tab Preview Switcher */}
                <div className="ml-auto pr-2 flex items-center">
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className="px-2 py-0.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Switch to full tab preview"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Live Preview Tab</span>
                  </button>
                </div>
              </div>

              {/* Breadcrumb Bar */}
              <div className="h-6 px-3 bg-[#0d101a] border-b border-[#161b29] flex items-center justify-between text-[11px] text-slate-400 select-none font-mono">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-500">{activeProject.name}</span>
                  <span>&gt;</span>
                  <span className="text-cyan-300 font-semibold">{activeFile?.path || 'Untitled'}</span>
                </div>
                <div className="flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
                  <button
                    type="button"
                    onClick={handleFormatCode}
                    className="hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Format Code"
                  >
                    Format
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(editingContent);
                      setToastMessage('Copied to clipboard');
                      setTimeout(() => setToastMessage(null), 2000);
                    }}
                    className="hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Copy Code"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Editor Textarea with Line Numbers */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Gutter */}
                <div
                  ref={lineGutterRef}
                  className="w-12 bg-[#080b12] border-r border-[#161b29] py-3 text-right pr-2 text-slate-600 font-mono text-xs select-none overflow-hidden shrink-0"
                >
                  {Array.from({ length: lineCount }).map((_, i) => (
                    <div key={i} className="leading-6">
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  ref={editorTextareaRef}
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  onScroll={handleEditorScroll}
                  onKeyUp={handleEditorKeyUp}
                  onClick={(e) => handleEditorKeyUp(e as any)}
                  spellCheck={false}
                  className="flex-1 bg-transparent p-3 text-xs font-mono text-slate-100 outline-hidden resize-none leading-6 whitespace-pre overflow-auto selection:bg-cyan-500/30"
                />
              </div>
            </div>
          )}

          {/* LIVE PREVIEW SECTION (Visible in 'split' or 'preview' mode) */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div
              className={`bg-[#080a10] flex flex-col shrink-0 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] ${
                viewMode === 'split' ? 'w-[45%]' : 'w-full'
              }`}
            >
              {/* Preview Browser Chrome Header */}
              <div className="h-10 px-3 bg-[#0d101a] border-b border-[#1a2030] flex items-center justify-between text-xs select-none gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <span className="font-bold text-white text-[11px] hidden sm:inline">Live Sandbox</span>
                </div>

                {/* Simulated URL bar */}
                <div className="flex-1 max-w-sm mx-2 bg-[#141826] border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-400 font-mono flex items-center gap-1.5 truncate">
                  <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">http://localhost:3000/preview</span>
                </div>

                {/* Viewport Toggles */}
                <div className="flex items-center gap-1 bg-[#141826] rounded-lg p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('desktop')}
                    className={`p-1 rounded ${
                      previewViewport === 'desktop' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Desktop 100%"
                  >
                    <Monitor className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('tablet')}
                    className={`p-1 rounded ${
                      previewViewport === 'tablet' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Tablet 768px"
                  >
                    <Tablet className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('mobile')}
                    className={`p-1 rounded ${
                      previewViewport === 'mobile' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Mobile 375px"
                  >
                    <Smartphone className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewReloadKey((k) => k + 1)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Reload Sandbox"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  {viewMode === 'preview' && (
                    <button
                      type="button"
                      onClick={() => setViewMode('split')}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Back to Split View"
                    >
                      Split View
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Frame Container */}
              <div className="flex-1 bg-[#06080e] flex items-center justify-center p-2 overflow-auto">
                <div
                  className="h-full bg-white transition-all duration-200 rounded-xl overflow-hidden shadow-2xl border border-slate-800"
                  style={{
                    width:
                      previewViewport === 'mobile'
                        ? '375px'
                        : previewViewport === 'tablet'
                        ? '768px'
                        : '100%'
                  }}
                >
                  <iframe
                    key={previewReloadKey}
                    srcDoc={livePreviewDoc}
                    title="Live Sandbox"
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM STATUS BAR (Sapphire Aesthetic) */}
      <footer className="h-6 bg-[#080b12] border-t border-[#1a2030] text-slate-400 flex items-center justify-between px-3 text-[11px] select-none shrink-0 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-cyan-400">
            <GitBranch className="w-3 h-3" />
            <span>main*</span>
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span>⊗ 0</span>
            <span>⚠ 0</span>
          </span>
          <span className="font-mono text-slate-400">{activeProject.name}</span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span className="font-semibold uppercase text-cyan-300">{activeFile?.language || 'TEXT'}</span>
          <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold font-sans">
            Sapphire Codex
          </span>
          <span className="hidden sm:inline text-slate-500 font-sans">Shaheer Hassan</span>
        </div>
      </footer>

      {/* NEW PROJECT / FOLDER MODAL */}
      <AnimatePresence>
        {isNewProjectModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f1422] border border-cyan-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Create New Project Folder</h3>
                    <p className="text-xs text-slate-400">Initialize a workspace folder for your apps</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. saas-landing, portfolio-hub, ecommerce-app"
                    className="w-full bg-[#161c2e] border border-[#27324d] rounded-xl px-3 py-2 text-xs text-white outline-hidden focus:border-cyan-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Starter Architecture
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewProjectTemplate('web')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        newProjectTemplate === 'web'
                          ? 'bg-cyan-500/20 border-cyan-400 text-white'
                          : 'bg-[#161c2e] border-[#27324d] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-cyan-400 mb-1" />
                      <p className="font-bold text-xs">Modern Web App</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">HTML5, Tailwind, JS & Icons</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewProjectTemplate('empty')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        newProjectTemplate === 'empty'
                          ? 'bg-cyan-500/20 border-cyan-400 text-white'
                          : 'bg-[#161c2e] border-[#27324d] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Folder className="w-4 h-4 text-blue-400 mb-1" />
                      <p className="font-bold text-xs">Blank Folder</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Empty canvas for AI</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewProject}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  Create Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 right-6 bg-cyan-600 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl z-50 flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif] animate-fade-in">
          <Check className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default CodexWorkspaceView;