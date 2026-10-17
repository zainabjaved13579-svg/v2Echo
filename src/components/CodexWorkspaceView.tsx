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
  ArrowUp,
  Loader2,
  Smartphone,
  Monitor,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Upload,
  Save,
  Zap,
  Cpu,
  Laptop,
  FolderUp,
  FilePlus,
  AlertCircle,
  Layers,
  Edit3,
  Check,
  Sparkles,
  Search,
  MessageSquare,
  Eye,
  Play,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, UserProfile } from '../types';
import { useAppTheme } from '../context/ThemeContext';
import { getStoredApiKey } from '../services/geminiService';

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

interface CodexMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

export type CodexEngineId = 'ultra-reasoning' | 'deep-omni' | 'heavy-turbo' | 'code-auditor';

export interface CodexEngineConfig {
  id: CodexEngineId;
  name: string;
  badge: string;
  model: string;
  description: string;
  speed: string;
  strength: string;
  thinking: boolean;
  color: string;
}

export const CODEX_ENGINES: Record<CodexEngineId, CodexEngineConfig> = {
  'heavy-turbo': {
    id: 'heavy-turbo',
    name: 'Sapphire Flash New',
    badge: '⚡ Flash Latest',
    model: 'gemini-flash-latest',
    description: 'Blazing sub-second response times, ultra-fast UI generation, and rapid multi-file prototyping.',
    speed: 'Ultra-Fast New Model',
    strength: 'Rapid Senior Coding & UI',
    thinking: false,
    color: 'from-amber-600 to-[#d97757]'
  },
  'ultra-reasoning': {
    id: 'ultra-reasoning',
    name: 'Heavy Senior Architect',
    badge: 'Argon 4 Heavy',
    model: 'gemini-4-argon',
    description: 'Deepest enterprise architectural planning, complete complex state machines & full-scale applications.',
    speed: 'High Intelligence',
    strength: 'Enterprise Full-Stack Architecture',
    thinking: true,
    color: 'from-purple-600 to-indigo-600'
  },
  'deep-omni': {
    id: 'deep-omni',
    name: 'Heavy System Synthesis',
    badge: 'Flash 3.8 Ultra',
    model: 'gemini-3.8-flash',
    description: 'Multi-file cohesion, reactive states, beautiful CSS Grid layouts, and seamless logic flow.',
    speed: 'Deep Multi-File',
    strength: 'Production Aesthetics',
    thinking: false,
    color: 'from-blue-600 to-cyan-600'
  },
  'code-auditor': {
    id: 'code-auditor',
    name: 'Heavy Code Auditor',
    badge: 'Shield Auditor',
    model: 'gemini-flash-latest',
    description: 'Defensive code auditing, syntax repair, null-safety checks, and robust DOM event handling.',
    speed: 'Real-time Guard',
    strength: 'Bug-Free Verification',
    thinking: false,
    color: 'from-emerald-600 to-teal-600'
  }
};

export interface CodexWorkspaceViewProps {
  settings: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
  onClose?: () => void;
  userProfile?: UserProfile | null;
  onOpenPreview?: (code: string, lang: string, filename?: string, files?: any[]) => void;
}

// ============================================================
// HELPERS
// ============================================================
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  html: 'html', htm: 'html',
  css: 'css', scss: 'scss', sass: 'scss', less: 'less',
  json: 'json', md: 'markdown', markdown: 'markdown',
  py: 'python', java: 'java', cpp: 'cpp', cc: 'cpp', c: 'c', h: 'c',
  php: 'php', rb: 'ruby', go: 'go', rs: 'rust',
  sql: 'sql', xml: 'xml', svg: 'svg',
  yml: 'yaml', yaml: 'yaml', toml: 'toml',
  sh: 'bash', bash: 'bash', zsh: 'bash',
  txt: 'text', env: 'text', gitignore: 'text',
  vue: 'vue', svelte: 'svelte', astro: 'astro'
};

const TEXT_EXTENSIONS = new Set([
  'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'html', 'htm', 'css', 'scss',
  'sass', 'less', 'json', 'md', 'markdown', 'py', 'java', 'cpp', 'cc',
  'c', 'h', 'hpp', 'php', 'rb', 'go', 'rs', 'sql', 'xml', 'svg',
  'yml', 'yaml', 'toml', 'sh', 'bash', 'zsh', 'txt', 'env', 'gitignore',
  'vue', 'svelte', 'astro', 'graphql', 'prisma', 'lock', 'config',
  'editorconfig', 'prettierrc', 'eslintrc', 'babelrc'
]);

const getLanguage = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (!ext) {
    const lower = name.toLowerCase();
    if (lower === 'dockerfile') return 'dockerfile';
    if (lower === 'makefile') return 'makefile';
    return 'text';
  }
  return LANGUAGE_MAP[ext] || 'text';
};

const isTextFile = (name: string): boolean => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (!ext) {
    const lower = name.toLowerCase();
    return ['dockerfile', 'makefile', 'readme', 'license'].includes(lower);
  }
  return TEXT_EXTENSIONS.has(ext);
};

const normalizePath = (path: string): string => {
  return path.replace(/\\/g, '/').replace(/^\/+/, '');
};

// ============================================================
// COMPONENT
// ============================================================
export const CodexWorkspaceView: React.FC<CodexWorkspaceViewProps> = ({
  settings,
  onClose
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  // ========== PROJECTS STATE (No forced default files!) ==========
  const [projects, setProjects] = useState<CodexProject[]>(() => {
    try {
      const saved = localStorage.getItem('sapphire_codex_projects_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Clean initial project with NO default boilerplate files!
    return [
      {
        id: `proj_${Date.now()}`,
        name: 'Project 1',
        createdAt: Date.now(),
        lastModified: Date.now(),
        files: []
      }
    ];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sapphire_codex_active_proj_id');
      if (saved) return saved;
    } catch {}
    return projects[0]?.id || `proj_${Date.now()}`;
  });

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  // Active Project Reference
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0] || {
      id: 'proj_fallback',
      name: 'Project 1',
      createdAt: Date.now(),
      lastModified: Date.now(),
      files: []
    };
  }, [projects, activeProjectId]);

  const files = activeProject.files || [];

  // Update active project files cleanly
  const setFiles = useCallback((newFilesOrFn: LaptopFile[] | ((prev: LaptopFile[]) => LaptopFile[])) => {
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
  }, [activeProjectId]);

  const [selectedFileId, setSelectedFileId] = useState<string>(() => files[0]?.id || '');
  const [editingContent, setEditingContent] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [rootDirHandle, setRootDirHandle] = useState<any>(null);
  const [folderName, setFolderName] = useState<string>('Virtual Workspace');
  const [rightTab, setRightTab] = useState<'preview' | 'files'>('preview');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [selectedHtmlFile, setSelectedHtmlFile] = useState<string>('');
  const [messages, setMessages] = useState<CodexMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelMode, setModelMode] = useState<'fast' | 'reasoning'>('fast');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [viewMode, setViewMode] = useState<'dashboard' | 'workspace'>('dashboard');
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview' | 'files'>('chat');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<CodexProject | null>(null);
  const [showNotificationToast, setShowNotificationToast] = useState<string | null>(null);

  const formatTimeAgo = useCallback((timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  // ========== PERSIST PROJECTS ==========
  useEffect(() => {
    try {
      const serializableProjects = projects.map((p) => ({
        ...p,
        files: p.files.map(({ fileHandle, ...rest }) => rest)
      }));
      localStorage.setItem('sapphire_codex_projects_v3', JSON.stringify(serializableProjects));
      localStorage.setItem('sapphire_codex_active_proj_id', activeProjectId);
    } catch (err) {
      console.warn('Failed to save projects to localStorage:', err);
    }
  }, [projects, activeProjectId]);

  // ========== REFS ==========
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ========== COMPUTED ==========
  const activeFile = useMemo(
    () => files.find((f) => f.id === selectedFileId) || files[0],
    [files, selectedFileId]
  );

  const htmlFiles = useMemo(
    () => files.filter((f) => f.name.endsWith('.html') || f.language === 'html'),
    [files]
  );

  const cssFiles = useMemo(
    () => files.filter((f) => f.name.endsWith('.css') || f.language === 'css'),
    [files]
  );

  const jsFiles = useMemo(
    () => files.filter((f) =>
      f.name.endsWith('.js') || f.name.endsWith('.jsx') ||
      f.name.endsWith('.mjs') || f.name.endsWith('.cjs') ||
      f.name.endsWith('.ts') || f.name.endsWith('.tsx') ||
      f.language === 'javascript' || f.language === 'typescript'
    ),
    [files]
  );

  // ========== EFFECTS ==========

  // Sync editor content when active file changes
  useEffect(() => {
    if (activeFile && !activeFile.isBinary) {
      setEditingContent(activeFile.content);
    }
  }, [activeFile?.id]);

  // Auto-select first HTML file
  useEffect(() => {
    if (!selectedHtmlFile && htmlFiles.length > 0) {
      setSelectedHtmlFile(htmlFiles[0].name);
    }
  }, [htmlFiles, selectedHtmlFile]);

  // Persist files to localStorage (without fileHandle which is not serializable)
  useEffect(() => {
    try {
      const serializable = files.map(({ fileHandle, ...rest }) => rest);
      localStorage.setItem('sapphire_codex_files_v2', JSON.stringify(serializable));
    } catch (err) {
      console.warn('Failed to save files to localStorage:', err);
    }
  }, [files]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ========== AUTO-SAVE EDITOR CONTENT ==========
  useEffect(() => {
    if (!activeFile || activeFile.isBinary) return;
    if (editingContent === activeFile.content) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        // Update in-memory
        setFiles((prev) =>
          prev.map((f) =>
            f.id === activeFile.id
              ? { ...f, content: editingContent, size: editingContent.length, lastModified: Date.now(), status: 'modified' }
              : f
          )
        );

        // Save to laptop if we have the handle
        if (activeFile.fileHandle) {
          try {
            const writable = await activeFile.fileHandle.createWritable();
            await writable.write(editingContent);
            await writable.close();
          } catch (err) {
            console.warn('Laptop save failed:', err);
          }
        }

        setSaveStatus('saved');
        setPreviewReloadKey((k) => k + 1);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 1500); // 1.5s debounce

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editingContent, activeFile?.id]);

  // ========== FILE SYSTEM: READ DIRECTORY ==========
  const readDirectoryRecursive = useCallback(
    async (dirHandle: any, path = ''): Promise<LaptopFile[]> => {
      const result: LaptopFile[] = [];
      try {
        for await (const entry of (dirHandle as any).values()) {
          const [name, handle] = [entry.name, entry];
          if (name.startsWith('.') || name === 'node_modules' || name === 'dist' || name === '.git') {
            continue;
          }

          const fullPath = normalizePath(path ? `${path}/${name}` : name);

          if (handle.kind === 'file') {
            try {
              const file = await handle.getFile();
              if (file.size > MAX_FILE_SIZE) {
                result.push({
                  id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                  name,
                  path: fullPath,
                  content: `[File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB]`,
                  language: getLanguage(name),
                  size: file.size,
                  lastModified: file.lastModified,
                  status: 'ready',
                  isBinary: true
                });
                continue;
              }

              const text = isTextFile(name) ? await file.text() : '';
              result.push({
                id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                name,
                path: fullPath,
                content: text || '[Binary file - preview not available]',
                language: getLanguage(name),
                size: file.size,
                lastModified: file.lastModified,
                status: 'ready',
                fileHandle: handle,
                isBinary: !isTextFile(name)
              });
            } catch (e) {
              console.warn(`Read file error ${fullPath}:`, e);
            }
          } else if (handle.kind === 'directory') {
            const children = await readDirectoryRecursive(handle, fullPath);
            result.push(...children);
          }
        }
      } catch (e) {
        console.warn(`Read directory error ${path}:`, e);
      }
      return result;
    },
    []
  );

  // ========== OPEN FOLDER ==========
  const handleOpenFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        setShowNotificationToast('Folder access requires Chrome, Edge, or Brave browser.');
        setTimeout(() => setShowNotificationToast(null), 4000);
        return;
      }

      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      if (!dirHandle) return;

      setRootDirHandle(dirHandle);
      setFolderName(dirHandle.name);

      const allFiles = await readDirectoryRecursive(dirHandle);
      if (allFiles.length === 0) {
        setShowNotificationToast('Selected folder is empty.');
        setTimeout(() => setShowNotificationToast(null), 3000);
        return;
      }

      setFiles(allFiles);
      setSelectedFileId(allFiles[0].id);

      // Auto-expand folders
      const folders = new Set<string>();
      allFiles.forEach((f) => {
        const parts = f.path.split('/');
        let cur = '';
        for (let i = 0; i < parts.length - 1; i++) {
          cur = cur ? `${cur}/${parts[i]}` : parts[i];
          folders.add(cur);
        }
      });
      setExpandedFolders(folders);

      // Persist as default workspace
      try {
        localStorage.setItem(
          'sapphire_default_workspace_v2',
          JSON.stringify({
            name: dirHandle.name,
            files: allFiles.map((f) => ({
              id: f.id,
              name: f.name,
              path: f.path,
              content: f.content,
              size: f.size,
              lastModified: f.lastModified,
              isBinary: f.isBinary
            }))
          })
        );
      } catch {}

      setPreviewReloadKey((k) => k + 1);
      setShowNotificationToast(`⭐ Opened "${dirHandle.name}" and saved as Default Workspace!`);
      setTimeout(() => setShowNotificationToast(null), 4500);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Folder open error:', err);
        alert('Could not open folder: ' + (err.message || 'Unknown error'));
      }
    }
  };

  // ========== UPLOAD FILES ==========
  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    const newFiles: LaptopFile[] = [];
    for (const file of Array.from(uploaded)) {
      if (file.size > MAX_FILE_SIZE) continue;
      const text = isTextFile(file.name) ? await file.text() : '';
      const relPath = normalizePath((file as any).webkitRelativePath || file.name);

      newFiles.push({
        id: `up_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        path: relPath,
        content: text || '[Binary file - preview not available]',
        language: getLanguage(file.name),
        size: file.size,
        lastModified: file.lastModified || Date.now(),
        status: 'created',
        isBinary: !isTextFile(file.name)
      });
    }

    setFiles((prev) => {
      const merged = [...newFiles];
      prev.forEach((p) => {
        if (!newFiles.some((n) => n.path === p.path)) merged.push(p);
      });
      return merged;
    });

    if (newFiles.length > 0) setSelectedFileId(newFiles[0].id);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
    setPreviewReloadKey((k) => k + 1);
  };

  // ========== SAVE FILE (manual) ==========
  const handleSaveFile = async () => {
    if (!activeFile || activeFile.isBinary) return;
    setSaveStatus('saving');

    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile.id
            ? { ...f, content: editingContent, size: editingContent.length, lastModified: Date.now(), status: 'modified' }
            : f
        )
      );

      if (activeFile.fileHandle) {
        const writable = await activeFile.fileHandle.createWritable();
        await writable.write(editingContent);
        await writable.close();
      }

      setSaveStatus('saved');
      setPreviewReloadKey((k) => k + 1);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // ========== CREATE NEW FILE ==========
  const handleCreateFile = async () => {
    const name = prompt('Enter filename (e.g., new-file.js):');
    if (!name?.trim()) return;
    const trimmed = normalizePath(name.trim());

    const newFile: LaptopFile = {
      id: `new_${Date.now()}`,
      name: trimmed.split('/').pop() || trimmed,
      path: trimmed,
      content: '',
      language: getLanguage(trimmed),
      size: 0,
      lastModified: Date.now(),
      status: 'created'
    };

    if (rootDirHandle) {
      try {
        const parts = trimmed.split('/');
        let currentDir = rootDirHandle;
        for (let i = 0; i < parts.length - 1; i++) {
          currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true });
        }
        const fileHandle = await currentDir.getFileHandle(parts[parts.length - 1], { create: true });
        newFile.fileHandle = fileHandle;
      } catch (err) {
        console.warn('Could not create file in laptop folder:', err);
      }
    }

    setFiles((prev) => [newFile, ...prev]);
    setSelectedFileId(newFile.id);
  };

  // ========== DELETE FILE ==========
  const handleDeleteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) {
      alert('Keep at least one file in workspace.');
      return;
    }
    if (!confirm('Delete this file permanently from workspace?')) return;

    const file = files.find((f) => f.id === id);

    // Try to delete from laptop folder
    if (file?.fileHandle && rootDirHandle) {
      try {
        const pathParts = file.path.split('/');
        let currentDir = rootDirHandle;
        for (let i = 0; i < pathParts.length - 1; i++) {
          currentDir = await currentDir.getDirectoryHandle(pathParts[i]);
        }
        await currentDir.removeEntry(pathParts[pathParts.length - 1]);
      } catch (err) {
        console.warn('Could not delete from laptop:', err);
      }
    }

    const remaining = files.filter((f) => f.id !== id);
    setFiles(remaining);
    if (selectedFileId === id) setSelectedFileId(remaining[0].id);
    setPreviewReloadKey((k) => k + 1);
  };

  // ========== FILE TREE ==========
  const fileTree = useMemo(() => {
    const tree: any = { name: 'root', children: {} };
    files.forEach((file) => {
      const parts = file.path.split('/');
      let current = tree;
      for (let i = 0; i < parts.length - 1; i++) {
        const folder = parts[i];
        if (!current.children[folder]) {
          current.children[folder] = { name: folder, isFolder: true, children: {} };
        }
        current = current.children[folder];
      }
      current.children[parts[parts.length - 1]] = {
        name: parts[parts.length - 1],
        isFolder: false,
        file
      };
    });
    return tree;
  }, [files]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // ========== RENDER FILE TREE ==========
  const renderTreeNode = (node: any, currentPath: string, depth: number = 0) => {
    const entries = Object.values(node.children || {}).sort((a: any, b: any) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return entries.map((entry: any) => {
      const fullPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

      if (entry.isFolder) {
        const isExpanded = expandedFolders.has(fullPath);
        return (
          <div key={fullPath}>
            <div
              onClick={() => toggleFolder(fullPath)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${hoverBg} cursor-pointer ${textSub} text-xs`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#d97757]" />
              ) : (
                <Folder className="w-3.5 h-3.5 shrink-0 text-[#d97757]" />
              )}
              <span className="truncate font-medium">{entry.name}</span>
            </div>
            {isExpanded && (
              <div>{renderTreeNode(entry, fullPath, depth + 1)}</div>
            )}
          </div>
        );
      }

      const isSelected = selectedFileId === entry.file.id;
      return (
        <div
          key={fullPath}
          onClick={() => setSelectedFileId(entry.file.id)}
          className={`group flex items-center justify-between gap-1 px-2 py-1 rounded-lg cursor-pointer text-xs ${
            isSelected
              ? `${bgCard} ${textBright} font-semibold shadow-sm`
              : `${textSub} ${hoverBg}`
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          title={entry.file.path}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#d97757]' : textMuted}`} />
            <span className="truncate">{entry.name}</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const blob = new Blob([entry.file.content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = entry.file.name;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className={`p-1 rounded ${textMuted} hover:text-[#d97757] transition-colors cursor-pointer`}
              title="Download"
            >
              <Download className="w-3 h-3" />
            </button>
            {files.length > 1 && (
              <button
                onClick={(e) => handleDeleteFile(entry.file.id, e)}
                className={`p-1 rounded ${textMuted} hover:text-red-400 transition-colors cursor-pointer`}
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  // ========== LIVE PREVIEW (ALL FILES COMBINED) ==========
  const livePreviewDoc = useMemo(() => {
    const htmlFile =
      files.find((f) => f.name === selectedHtmlFile) ||
      htmlFiles[0] ||
      files.find((f) => f.name.endsWith('.html') || f.language === 'html');

    if (!htmlFile) {
      if (files.length === 0) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activeProject?.name || 'Workspace'}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 30%, #1e1f29 0%, #0d0e13 100%);
      color: #ede8e1;
      padding: 24px;
      text-align: center;
    }
    .card {
      max-width: 440px;
      padding: 36px 28px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(217, 119, 87, 0.3);
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
      backdrop-filter: blur(12px);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      border-radius: 999px;
      background: rgba(217, 119, 87, 0.18);
      border: 1px solid rgba(217, 119, 87, 0.5);
      color: #ffaa8a;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
    }
    p {
      font-size: 13px;
      color: #a0a3af;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .tips {
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
    }
    .tip {
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      font-size: 12px;
      color: #d1d5db;
    }
    .tip strong { color: #ff9e7d; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🚀 Clean Project Workspace</div>
    <h1>${activeProject?.name || 'My Project'}</h1>
    <p>Zero boilerplate clutter. Ask Codex on the left to code your app from scratch, or click <strong>New File</strong> to start typing!</p>
    <div class="tips">
      <div class="tip">💬 <strong>AI Coding:</strong> Type your prompt to generate full HTML, CSS & JS.</div>
      <div class="tip">📁 <strong>Multi-Project:</strong> Create & switch between unlimited projects anytime.</div>
    </div>
  </div>
</body>
</html>`;
      }

      return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui;padding:40px;text-align:center;background:#181922;color:#999;">
  <div style="max-width:400px;margin:auto;">
    <div style="font-size:48px;margin-bottom:16px;">📄</div>
    <h2 style="color:#eee;font-size:18px;margin-bottom:8px;">No HTML file found</h2>
    <p style="font-size:13px;color:#888;">Create an <code>index.html</code> file or ask Codex to generate one for live preview.</p>
  </div>
</body>
</html>`;
    }

    let html = htmlFile.content;

    // Wrap if not full HTML
    if (!html.toLowerCase().includes('<html')) {
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${htmlFile.name}</title>
</head>
<body>
${html}
</body>
</html>`;
    }

    // Remove existing external references to avoid duplication
    html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
    html = html.replace(/<script[^>]*src=["'][^"']+\.(?:js|jsx|ts|tsx|mjs|cjs)["'][^>]*>\s*<\/script>/gi, '');

    // Remove previous injections
    html = html.replace(/<style data-injected[^>]*>[\s\S]*?<\/style>/gi, '');
    html = html.replace(/<script data-injected[^>]*>[\s\S]*?<\/script>/gi, '');

    // Inject all CSS files
    const otherCssFiles = cssFiles.filter((c) => c.id !== htmlFile.id && !c.isBinary);
    if (otherCssFiles.length > 0) {
      const cssBundle = otherCssFiles
        .map((c) => `/* ═══════ ${c.path} ═══════ */\n${c.content}`)
        .join('\n\n');

      const styleTag = `<style data-injected="css-bundle">\n${cssBundle}\n</style>`;

      if (html.includes('</head>')) {
        html = html.replace('</head>', `${styleTag}\n</head>`);
      } else if (html.match(/<body[^>]*>/i)) {
        html = html.replace(/(<body[^>]*>)/i, `<head>${styleTag}</head>\n$1`);
      } else {
        html = `${styleTag}\n${html}`;
      }
    }

    // Inject all JS files with isolated execution guards
    const otherJsFiles = jsFiles.filter((j) => j.id !== htmlFile.id && !j.isBinary);
    if (otherJsFiles.length > 0) {
      const jsBundle = otherJsFiles
        .map((j) => `/* ═══════ ${j.path} ═══════ */\ntry {\n${j.content}\n} catch (err) { console.error('[${j.name}]', err); }`)
        .join('\n\n');

      const scriptTag = `<script data-injected="js-bundle">\n${jsBundle}\n<\/script>`;

      if (html.includes('</body>')) {
        html = html.replace('</body>', `${scriptTag}\n</body>`);
      } else {
        html = `${html}\n${scriptTag}`;
      }
    }

    // Error overlay
    const errorOverlay = `<script>
      window.addEventListener('error', function(e) {
        var overlay = document.getElementById('__preview_error');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = '__preview_error';
          overlay.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#dc2626;color:white;padding:10px;font-family:monospace;font-size:11px;z-index:999999;max-height:100px;overflow:auto;';
          if (document.body) document.body.appendChild(overlay);
        }
        overlay.innerHTML += '⚠️ ' + e.message + '<br>';
      });
    <\/script>`;

    if (html.includes('</body>')) {
      html = html.replace('</body>', `${errorOverlay}\n</body>`);
    } else {
      html = `${html}\n${errorOverlay}`;
    }

    return html;
  }, [files, htmlFiles, cssFiles, jsFiles, selectedHtmlFile, previewReloadKey, activeProject?.name]);

  // ========== AI CHAT & ADVANCED CODE GENERATION ==========
  const handleSendPrompt = async (forcedPrompt?: string) => {
    const text = (forcedPrompt || input).trim();
    if (!text || isLoading) return;

    const userMsg: CodexMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const botId = `b_${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: botId,
      role: 'assistant',
      text: '',
      timestamp: Date.now(),
      isStreaming: true
    }]);

    try {
      const filesContext = files
        .filter((f) => !f.isBinary && !f.path.includes('node_modules'))
        .slice(0, 12)
        .map((f) => `=== ${f.path} ===\n${f.content.slice(0, 1500)}`)
        .join('\n\n');

      const systemPrompt = `You are Codex Studio, an elite Principal Software Architect and Senior Full-Stack Engineer powered by Sapphire AI.
MANDATORY CONSTITUTION: WRITE 100% PROFESSIONAL, PRODUCTION-GRADE, SENIOR ENTERPRISE CODE.
NEVER write childish, basic, simplistic, or toy code ("bacho wali coding").

[CREATOR & DEVELOPER IDENTITY]:
Sapphire and Codex Studio were created, developed, and are owned by Shaheer (Shaheer Hassan - shaheerhassan). If asked who is your developer, creator, founder, or owner, proudly and clearly state: "Shaheer is the developer, creator, and owner of Sapphire and Codex Studio!"

[ANTI-AMATEUR CODING DIRECTIVE - CRITICAL]:
1. NO TOY OR DEMO CODE:
   - Deliver rich, production-tier applications that look and feel like premium commercial software (e.g. Stripe, Linear, Notion, Airbnb).
   - Use vibrant modern UI palettes, glassmorphism card surfaces, clean borders, crisp typography, and responsive layouts.
   - Every single interactive feature must be fully functional. No dead buttons, no fake controls.
2. FULL REAL STATE & PERSISTENCE:
   - Full state management in JavaScript with localStorage persistence, undo/redo, real data filtering/sorting, search, and export.
   - Complete input validation with instant visual error states and feedback toasts.
   - Defensive JavaScript: verify DOM nodes exist, wrap event listeners cleanly.
3. EXACT MULTI-FILE ARCHITECTURE:
   - index.html: <link rel="stylesheet" href="style.css"> and <script src="script.js" defer></script>
   - style.css: Modern CSS variables, complete reset, responsive media queries, card layouts, active button transitions.
   - script.js: Deep, complete business logic without stubs or placeholders.

Current Project: "${activeProject?.name || 'Workspace'}"
Existing files in project:
${filesContext || '(Empty project - generate complete initial files: index.html, style.css, script.js)'}`;

      const selectedModel = modelMode === 'reasoning' ? 'gemini-4-argon' : 'gemini-flash-latest';

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': getStoredApiKey()
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text }] }],
          systemInstruction: systemPrompt,
          model: selectedModel
        })
      });

      if (!response.ok || !response.body) throw new Error('Stream failed');

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
            if (jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              const piece = data.candidates?.[0]?.content?.parts?.[0]?.text || data.text || '';
              accumulated += piece;
              setMessages((prev) =>
                prev.map((m) => (m.id === botId ? { ...m, text: accumulated } : m))
              );
            } catch {}
          }
        }
      }

      // Enhanced Multi-File Parser
      // Supports ```html index.html, ```html:index.html, ```css style.css, comments <!-- filename: index.html -->
      const codeRegex = /```([a-zA-Z0-9_\-\.]+)?(?::|\s+)?([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)?\n([\s\S]*?)```/g;
      let match;
      const parsed: { name: string; path: string; language: string; content: string }[] = [];

      while ((match = codeRegex.exec(accumulated)) !== null) {
        const lang = (match[1] || 'js').toLowerCase();
        let filename = match[2];
        const content = match[3];

        if (!filename) {
          const commentMatch = content.match(/^(?:\/\*|\/\/|<!--)\s*(?:filename|file|path):\s*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)/i);
          if (commentMatch) {
            filename = commentMatch[1];
          }
        }

        if (!filename) {
          if (lang === 'html' || content.includes('<!DOCTYPE') || content.includes('<html')) filename = 'index.html';
          else if (lang === 'css' || (content.includes('{') && content.includes(':') && (content.includes('margin') || content.includes('padding') || content.includes('color') || content.includes('display')))) filename = 'style.css';
          else if (lang === 'js' || lang === 'javascript' || lang === 'typescript' || lang === 'ts') filename = 'script.js';
          else if (lang === 'json') filename = 'data.json';
          else filename = `file_${parsed.length + 1}.${lang}`;
        }

        if (content && content.trim().length > 10) {
          const cleanPath = normalizePath(filename);
          parsed.push({
            name: cleanPath.split('/').pop() || cleanPath,
            path: cleanPath,
            language: getLanguage(cleanPath),
            content: content.trim()
          });
        }
      }

      if (parsed.length > 0) {
        // Update files in active project
        const updatedFiles = [...files];
        parsed.forEach((p) => {
          const idx = updatedFiles.findIndex((u) => u.path === p.path || u.name === p.name);
          if (idx >= 0) {
            updatedFiles[idx] = { ...updatedFiles[idx], content: p.content, size: p.content.length, lastModified: Date.now(), status: 'modified' };
          } else {
            updatedFiles.unshift({
              id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              name: p.name,
              path: p.path,
              content: p.content,
              language: p.language,
              size: p.content.length,
              lastModified: Date.now(),
              status: 'created'
            });
          }
        });

        setFiles(updatedFiles);

        // Auto-select HTML file for immediate live preview and switch to preview tab
        const firstHtml = parsed.find((p) => p.name.endsWith('.html') || p.name === 'index.html');
        if (firstHtml) {
          setSelectedHtmlFile(firstHtml.name);
          const matched = updatedFiles.find((f) => f.name === firstHtml.name);
          if (matched) setSelectedFileId(matched.id);
        } else if (parsed[0]) {
          const matched = updatedFiles.find((f) => f.name === parsed[0].name);
          if (matched) setSelectedFileId(matched.id);
        }
        setRightTab('preview');
        setPreviewReloadKey((k) => k + 1);

        // Auto-save AI-generated files to laptop folder if folder open
        if (rootDirHandle) {
          for (const p of parsed) {
            try {
              const parts = p.path.split('/');
              let currentDir = rootDirHandle;
              for (let i = 0; i < parts.length - 1; i++) {
                currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true });
              }
              const fileHandle = await currentDir.getFileHandle(parts[parts.length - 1], { create: true });
              const writable = await fileHandle.createWritable();
              await writable.write(p.content);
              await writable.close();
            } catch (err) {
              console.warn(`Could not save ${p.path} to laptop:`, err);
            }
          }
        }

        setPreviewReloadKey((k) => k + 1);
        setRightTab('preview');
        setShowNotificationToast('✨ Live preview updated! Check preview tab');
        setTimeout(() => setShowNotificationToast(null), 4500);
      }

      setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, isStreaming: false } : m)));
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId ? { ...m, text: '⚠️ Code generation could not complete. Please retry.', isStreaming: false } : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ========== DASHBOARD & WORKSPACE HELPERS ==========
  const filteredProjects = useMemo(() => {
    if (!projectSearchQuery.trim()) return projects;
    const q = projectSearchQuery.toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.files.some((f) => f.name.toLowerCase().includes(q))
    );
  }, [projects, projectSearchQuery]);

  const totalFilesCount = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.files?.length || 0), 0);
  }, [projects]);

  const handleCreateNewProject = (nameInput?: string) => {
    const name = (nameInput || newProjectName).trim() || `Project ${projects.length + 1}`;
    const newProj: CodexProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      createdAt: Date.now(),
      lastModified: Date.now(),
      files: [] // Zero pre-added files by AI! Clean slate!
    };
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setSelectedFileId('');
    setEditingContent('');
    setNewProjectName('');
    setShowNewProjectModal(false);
    setMessages([]);
    setPreviewReloadKey((k) => k + 1);
    setMobileTab('chat');
    setViewMode('workspace');
  };

  const handleOpenProject = (projId: string) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;
    setActiveProjectId(proj.id);
    if (proj.files.length > 0) {
      setSelectedFileId(proj.files[0].id);
      setEditingContent(proj.files[0].content);
      const firstHtml = proj.files.find((f) => f.name.endsWith('.html') || f.name === 'index.html');
      if (firstHtml) setSelectedHtmlFile(firstHtml.name);
    } else {
      setSelectedFileId('');
      setEditingContent('');
      setSelectedHtmlFile('');
    }
    setPreviewReloadKey((k) => k + 1);
    setMobileTab('chat');
    setViewMode('workspace');
  };

  // ========== THEME CLASSES ==========
  const bgMain = isMoon ? 'bg-[#0a0b0e]' : 'bg-[#faf9f7]';
  const bgHeader = isMoon ? 'bg-[#0e0f13]' : 'bg-white';
  const bgCard = isMoon ? 'bg-[#1a1c22]' : 'bg-[#f0ede7]';
  const bgSubtle = isMoon ? 'bg-[#1a1c22]' : 'bg-[#f5f3ef]';
  const bgInput = isMoon ? 'bg-[#0a0b0e]' : 'bg-[#faf9f7]';
  const border = isMoon ? 'border-[#22242c]' : 'border-[#e8e5df]';
  const textPrimary = isMoon ? 'text-[#e8e8ea]' : 'text-[#1a1815]';
  const textBright = isMoon ? 'text-white' : 'text-[#0d0b09]';
  const textSub = isMoon ? 'text-[#8a8d96]' : 'text-[#6b6760]';
  const textMuted = isMoon ? 'text-[#5a5d66]' : 'text-[#9a958d]';
  const hoverBg = isMoon ? 'hover:bg-[#1a1c22]' : 'hover:bg-[#f0ede7]';
  const accent = 'text-[#d97757]';
  const accentBg = 'bg-[#d97757]';

  // ========== RENDER ==========
  return (
    <div className={`h-full w-full flex flex-col ${bgMain} ${textPrimary} overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]`}>

      {/* ========================================================================= */}
      {/* 1. PROJECTS HISTORY & MANAGEMENT DASHBOARD VIEW                            */}
      {/* ========================================================================= */}
      {viewMode === 'dashboard' ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Dashboard Header */}
          <header className={`h-14 px-4 sm:px-6 border-b ${border} ${bgHeader} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-3">
              {onClose && (
                <button
                  onClick={onClose}
                  className={`p-2 rounded-xl ${textSub} ${hoverBg} transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold`}
                  title="Back to Sapphire Chat"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#d97757]/15 border border-[#d97757]/30 flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-[#d97757]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm sm:text-base font-extrabold ${textBright}`}>Codex Studio</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d97757]/15 text-[#d97757] font-bold">
                      Projects Hub
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Bar */}
              <div className={`relative hidden sm:flex items-center rounded-xl border ${border} ${bgInput} px-2.5 py-1.5 focus-within:border-[#d97757]/60 transition-colors w-44 md:w-60`}>
                <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="bg-transparent border-none outline-none text-xs w-full placeholder-zinc-500"
                />
                {projectSearchQuery && (
                  <button onClick={() => setProjectSearchQuery('')} className="text-zinc-400 hover:text-zinc-200">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Add Project Primary Button */}
              <button
                type="button"
                onClick={() => {
                  setNewProjectName(`Project ${projects.length + 1}`);
                  setShowNewProjectModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86949] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-[#d97757]/20 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add New Project</span>
              </button>
            </div>
          </header>

          {/* Dashboard Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
            {/* Hero / Overview Banner */}
            <div className={`p-5 sm:p-6 rounded-3xl border ${border} ${bgCard} relative overflow-hidden shadow-sm`}>
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#d97757]/20 text-[#d97757]">
                    Workspace Manager
                  </span>
                </div>
                <h1 className={`text-xl sm:text-2xl font-black ${textBright} mb-2`}>
                  Projects History & Workspaces
                </h1>
                <p className={`text-xs sm:text-sm ${textSub} leading-relaxed mb-4`}>
                  Every project starts clean with zero AI boilerplate. Chat in the prompt panel to generate full-stack software and watch it render in real-time live preview.
                </p>

                {/* Quick Metrics */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1">
                  <div className={`px-3 py-1.5 rounded-xl border ${border} ${bgSubtle} text-xs font-semibold flex items-center gap-1.5`}>
                    <Layers className="w-3.5 h-3.5 text-[#d97757]" />
                    <span>{projects.length} Total Projects</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl border ${border} ${bgSubtle} text-xs font-semibold flex items-center gap-1.5`}>
                    <FileCode className="w-3.5 h-3.5 text-blue-500" />
                    <span>{totalFilesCount} Files Built</span>
                  </div>
                  {activeProject && (
                    <div className={`px-3 py-1.5 rounded-xl border border-[#d97757]/30 bg-[#d97757]/10 text-xs font-bold text-[#d97757] flex items-center gap-1.5`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">Current: {activeProject.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="sm:hidden">
              <div className={`relative flex items-center rounded-2xl border ${border} ${bgInput} px-3 py-2.5 w-full`}>
                <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="bg-transparent border-none outline-none text-xs w-full placeholder-zinc-500"
                />
                {projectSearchQuery && (
                  <button onClick={() => setProjectSearchQuery('')} className="text-zinc-400 hover:text-zinc-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Projects Section Header */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-bold ${textBright}`}>
                  Your Projects ({filteredProjects.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewProjectName(`Project ${projects.length + 1}`);
                  setShowNewProjectModal(true);
                }}
                className="text-xs font-bold text-[#d97757] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div className={`p-10 rounded-3xl border ${border} ${bgCard} text-center max-w-md mx-auto my-6 space-y-3`}>
                <div className="w-12 h-12 rounded-2xl bg-[#d97757]/15 text-[#d97757] flex items-center justify-center mx-auto mb-2">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className={`text-sm font-bold ${textBright}`}>No projects found</h3>
                <p className={`text-xs ${textSub} leading-relaxed`}>
                  {projectSearchQuery ? 'No projects match your search query.' : 'You do not have any projects yet. Create your first clean workspace!'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewProjectName(`Project ${projects.length + 1}`);
                    setShowNewProjectModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86949] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  + Add New Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((proj) => {
                  const isActive = proj.id === activeProjectId;
                  const isEditing = editingProjectId === proj.id;
                  const htmlCount = proj.files.filter((f) => f.name.endsWith('.html')).length;
                  const cssCount = proj.files.filter((f) => f.name.endsWith('.css')).length;
                  const jsCount = proj.files.filter((f) => f.name.endsWith('.js') || f.name.endsWith('.ts')).length;

                  return (
                    <motion.div
                      key={proj.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                        isActive
                          ? isMoon
                            ? 'bg-[#151722] border-[#d97757]/50 shadow-lg shadow-black/40 ring-1 ring-[#d97757]/30'
                            : 'bg-white border-[#d97757] shadow-lg shadow-orange-100 ring-1 ring-[#d97757]/30'
                          : `${bgCard} ${border} hover:border-[#d97757]/40 shadow-sm`
                      }`}
                    >
                      <div>
                        {/* Top: Icon & Actions */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                              isActive ? 'bg-[#d97757] text-white' : `${bgSubtle} text-[#d97757]`
                            }`}>
                              <Layers className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingProjectName}
                                  onChange={(e) => setEditingProjectName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (editingProjectName.trim()) {
                                        setProjects((prev) =>
                                          prev.map((p) => (p.id === proj.id ? { ...p, name: editingProjectName.trim() } : p))
                                        );
                                      }
                                      setEditingProjectId(null);
                                    }
                                    if (e.key === 'Escape') setEditingProjectId(null);
                                  }}
                                  className="w-full bg-transparent border-b border-[#d97757] outline-none text-sm font-bold"
                                  autoFocus
                                />
                              ) : (
                                <h3 className={`text-sm font-extrabold ${textBright} truncate`}>
                                  {proj.name}
                                </h3>
                              )}
                              <span className="text-[11px] text-zinc-400 block">
                                {formatTimeAgo(proj.lastModified)}
                              </span>
                            </div>
                          </div>

                          {/* Quick Edit/Delete */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingProjectName.trim()) {
                                    setProjects((prev) =>
                                      prev.map((p) => (p.id === proj.id ? { ...p, name: editingProjectName.trim() } : p))
                                    );
                                  }
                                  setEditingProjectId(null);
                                }}
                                className="p-1.5 text-emerald-500 hover:text-emerald-400 cursor-pointer"
                                title="Save Name"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProjectId(proj.id);
                                    setEditingProjectName(proj.name);
                                  }}
                                  className="p-1.5 text-zinc-400 hover:text-[#d97757] rounded-lg transition-colors cursor-pointer"
                                  title="Rename Project"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProjectToDelete(proj)}
                                  className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Project"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Middle: File Status & Preview Badges */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            {proj.files.length === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500">
                                Clean Slate (0 files)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                                {proj.files.length} {proj.files.length === 1 ? 'file' : 'files'}
                              </span>
                            )}
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d97757]/20 text-[#d97757]">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-zinc-400 min-h-[38px] flex items-center">
                            {proj.files.length === 0 ? (
                              <span className="text-[11px] text-zinc-400 italic">
                                Zero files pre-added. Ready for AI chat prompts or custom files.
                              </span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {proj.files.slice(0, 3).map((f) => (
                                  <span key={f.id} className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${border} ${bgSubtle} text-zinc-300`}>
                                    {f.name}
                                  </span>
                                ))}
                                {proj.files.length > 3 && (
                                  <span className="text-[10px] text-zinc-500">
                                    +{proj.files.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Action */}
                      <button
                        type="button"
                        onClick={() => handleOpenProject(proj.id)}
                        className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#d97757] hover:bg-[#c86949] text-white shadow-sm'
                            : `${bgSubtle} ${hoverBg} text-zinc-200 border ${border} hover:border-[#d97757]/50`
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Open Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. PROJECT WORKSPACE VIEW (CHAT + PREVIEW / FILES)                        */
        /* ========================================================================= */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* WORKSPACE HEADER */}
          <header className={`h-12 px-2.5 sm:px-4 border-b ${border} ${bgHeader} flex items-center justify-between shrink-0 gap-2`}>
            {/* Left: Back to Projects & Project Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setViewMode('dashboard')}
                className={`p-1.5 rounded-xl ${textSub} ${hoverBg} transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0`}
                title="Return to Projects History Hub"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Projects</span>
              </button>

              <div className={`h-4 w-px ${border} hidden sm:block`} />

              {/* Project Dropdown Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    isMoon
                      ? 'bg-[#181a24] hover:bg-[#202230] border-[#292c3c] text-zinc-200'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-[#d97757] shrink-0" />
                  <span className="font-bold max-w-[100px] sm:max-w-[160px] truncate">
                    {activeProject?.name || 'Workspace'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                </button>

                <AnimatePresence>
                  {isProjectDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      className={`absolute left-0 top-full mt-2 w-72 rounded-2xl border shadow-2xl p-2.5 z-50 backdrop-blur-xl ${
                        isMoon
                          ? 'bg-[#14151e]/95 border-[#282a3c] text-zinc-200 shadow-black/80'
                          : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/80'
                      }`}
                    >
                      <div className="flex items-center justify-between px-2 py-1 mb-1.5 border-b border-zinc-700/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Projects ({projects.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewProjectName(`Project ${projects.length + 1}`);
                            setShowNewProjectModal(true);
                            setIsProjectDropdownOpen(false);
                          }}
                          className="text-[11px] font-bold text-[#d97757] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Project</span>
                        </button>
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1">
                        {projects.map((proj) => {
                          const isCurrent = proj.id === activeProjectId;
                          const isEditing = editingProjectId === proj.id;
                          return (
                            <div
                              key={proj.id}
                              onClick={() => {
                                if (!isEditing) {
                                  handleOpenProject(proj.id);
                                  setIsProjectDropdownOpen(false);
                                }
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                                isCurrent
                                  ? isMoon
                                    ? 'bg-[#d97757]/20 border border-[#d97757]/60 text-white font-bold'
                                    : 'bg-[#ffeade] border border-[#d97757] text-[#8a2b0e] font-bold'
                                  : isMoon
                                  ? 'hover:bg-[#1e202c] text-zinc-300'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Layers className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-[#d97757]' : 'text-zinc-400'}`} />
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingProjectName}
                                    onChange={(e) => setEditingProjectName(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editingProjectName.trim()) {
                                          setProjects((prev) =>
                                            prev.map((p) => (p.id === proj.id ? { ...p, name: editingProjectName.trim() } : p))
                                          );
                                        }
                                        setEditingProjectId(null);
                                      }
                                      if (e.key === 'Escape') setEditingProjectId(null);
                                    }}
                                    className="w-full bg-transparent border-b border-[#d97757] outline-none text-xs font-bold"
                                    autoFocus
                                  />
                                ) : (
                                  <div className="truncate">
                                    <span className="truncate block font-semibold">{proj.name}</span>
                                    <span className="text-[10px] text-zinc-400 block font-normal">
                                      {proj.files.length === 0 ? 'Empty (clean slate)' : `${proj.files.length} files`}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {isEditing ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (editingProjectName.trim()) {
                                        setProjects((prev) =>
                                          prev.map((p) => (p.id === proj.id ? { ...p, name: editingProjectName.trim() } : p))
                                        );
                                      }
                                      setEditingProjectId(null);
                                    }}
                                    className="p-1 text-emerald-500 hover:text-emerald-400 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingProjectId(proj.id);
                                        setEditingProjectName(proj.name);
                                      }}
                                      className="p-1 hover:text-[#d97757] text-zinc-400 cursor-pointer transition-colors"
                                      title="Rename Project"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setProjectToDelete(proj);
                                      }}
                                      className="p-1 hover:text-rose-500 text-zinc-400 cursor-pointer transition-colors"
                                      title="Delete Project"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Direct Add Project Quick Button */}
              <button
                type="button"
                onClick={() => {
                  setNewProjectName(`Project ${projects.length + 1}`);
                  setShowNewProjectModal(true);
                }}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isMoon
                    ? 'bg-[#d97757]/15 hover:bg-[#d97757]/25 border-[#d97757]/50 text-[#ffaa8a]'
                    : 'bg-[#ffeade] hover:bg-[#ffd8c7] border-[#d97757]/60 text-[#8a2b0e]'
                }`}
                title="Add New Project"
              >
                <Plus className="w-3.5 h-3.5 text-[#d97757]" />
                <span className="hidden md:inline ml-1">New</span>
              </button>
            </div>

            {/* Center: Mobile Segmented Switcher (Optimized for Mobile Users) */}
            <div className="flex lg:hidden items-center bg-black/10 dark:bg-white/10 rounded-xl p-0.5 border border-zinc-500/20 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setMobileTab('chat')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  mobileTab === 'chat' ? 'bg-[#d97757] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileTab('preview');
                  setRightTab('preview');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  mobileTab === 'preview' ? 'bg-[#d97757] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileTab('files');
                  setRightTab('files');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  mobileTab === 'files' ? 'bg-[#d97757] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Files ({files.length})</span>
              </button>
            </div>

            {/* Right: Desktop Controls */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              {/* Model Mode */}
              <div className={`flex items-center ${bgSubtle} border ${border} rounded-xl p-0.5 text-xs`}>
                <button
                  onClick={() => setModelMode('fast')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    modelMode === 'fast' ? `${accentBg} text-white font-semibold shadow-sm` : `${textSub} ${hoverBg}`
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Fast</span>
                </button>
                <button
                  onClick={() => setModelMode('reasoning')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    modelMode === 'reasoning' ? `${accentBg} text-white font-semibold shadow-sm` : `${textSub} ${hoverBg}`
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>Reasoning</span>
                </button>
              </div>

              {/* Desktop Right Tab Toggle */}
              <div className={`flex items-center ${bgSubtle} border ${border} rounded-xl p-0.5 text-xs`}>
                <button
                  onClick={() => setRightTab('preview')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    rightTab === 'preview' ? `${accentBg} text-white font-semibold shadow-sm` : `${textSub} ${hoverBg}`
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setRightTab('files')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    rightTab === 'files' ? `${accentBg} text-white font-semibold shadow-sm` : `${textSub} ${hoverBg}`
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Files ({files.length})</span>
                </button>
              </div>
            </div>
          </header>

          {/* Toast Notification Banner (Auto Preview Jump) */}
          <AnimatePresence>
            {showNotificationToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#d97757] text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md shrink-0 z-40"
              >
                <span>{showNotificationToast}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileTab('preview');
                    setRightTab('preview');
                    setShowNotificationToast(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white text-[#d97757] text-xs font-extrabold hover:bg-white/90 transition-colors cursor-pointer"
                >
                  View Preview →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT: CHAT (Talk with Codex AI and it responds with code) */}
            <div
              className={`w-full lg:w-1/2 flex-col border-r ${border} ${bgMain} ${
                mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-sm mx-auto">
                    <div className={`w-12 h-12 rounded-2xl ${bgCard} border ${border} flex items-center justify-center mb-4 text-[#d97757]`}>
                      <Code2 className="w-6 h-6" />
                    </div>
                    <h2 className={`text-lg font-bold ${textBright} mb-1.5`}>
                      Code in {activeProject?.name || 'Workspace'}
                    </h2>
                    <p className={`text-xs ${textSub} mb-5 leading-relaxed`}>
                      Clean project with zero dummy boilerplate. Describe the software or web app you want to build and Codex will write full-stack code and update the preview.
                    </p>
                    <div className="w-full space-y-2">
                      {[
                        'Build a modern interactive Budget & Expense Tracker',
                        'Create a responsive Developer Portfolio with project modals',
                        'Make a Scientific Calculator with calculation history & dark mode',
                        'Build a Kanban Task Board with drag & drop and localStorage'
                      ].map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendPrompt(p)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl border ${border} ${bgCard} ${hoverBg} text-xs ${textSub} transition-all cursor-pointer`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id}>
                      {msg.role === 'user' ? (
                        <div className="flex justify-end">
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${accentBg} text-white font-medium shadow-sm`}>
                            {msg.text}
                          </div>
                        </div>
                      ) : (
                        <div className={`rounded-2xl p-4 ${bgCard} border ${border} text-sm space-y-2`}>
                          {msg.text ? (
                            <pre className={`whitespace-pre-wrap font-['Plus_Jakarta_Sans',sans-serif] text-xs ${textPrimary} leading-relaxed`}>
                              {msg.text}
                            </pre>
                          ) : (
                            <div className={`flex items-center gap-2 text-xs ${textSub}`}>
                              <Loader2 className={`w-3.5 h-3.5 ${accent} animate-spin`} />
                              <span>Codex is writing and assembling files...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className={`p-3 border-t ${border} ${bgHeader}`}>
                <div className={`flex items-end gap-2 rounded-2xl border ${border} ${bgInput} p-2 focus-within:border-[#d97757]/50 transition-colors`}>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendPrompt();
                      }
                    }}
                    placeholder="Describe what you want to build (e.g. Budget tracker with charts)..."
                    rows={2}
                    className={`flex-1 bg-transparent border-none outline-none resize-none text-xs sm:text-sm p-1.5 ${textPrimary} placeholder-[#6b6760]`}
                  />
                  <button
                    disabled={!input.trim() || isLoading}
                    onClick={() => handleSendPrompt()}
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      input.trim() && !isLoading
                        ? `${accentBg} text-white shadow-md hover:scale-105 active:scale-95 cursor-pointer`
                        : `${bgSubtle} ${textMuted} cursor-not-allowed`
                    }`}
                    title="Send Prompt (Enter)"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4 stroke-[2.5]" />}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: PREVIEW & FILES (Interactive live preview and project files code) */}
            <div
              className={`w-full lg:w-1/2 flex-col ${bgMain} ${
                mobileTab !== 'chat' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {rightTab === 'preview' ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Preview Toolbar */}
                  <div className={`h-10 px-3 border-b ${border} ${bgHeader} flex items-center justify-between shrink-0`}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                      {htmlFiles.length > 1 && (
                        <select
                          value={selectedHtmlFile}
                          onChange={(e) => {
                            setSelectedHtmlFile(e.target.value);
                            setPreviewReloadKey((k) => k + 1);
                          }}
                          className={`ml-2 px-2 py-1 rounded-lg text-[11px] font-mono ${bgSubtle} ${textPrimary} border ${border} cursor-pointer focus:outline-none`}
                        >
                          {htmlFiles.map((f) => (
                            <option key={f.id} value={f.name}>{f.name}</option>
                          ))}
                        </select>
                      )}
                      {htmlFiles.length <= 1 && (
                        <span className={`text-[11px] ${textSub} font-mono ml-2 truncate max-w-[140px]`}>
                          {selectedHtmlFile || 'Live Preview'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewportMode(viewportMode === 'desktop' ? 'mobile' : 'desktop')}
                        className={`p-1.5 rounded-lg ${textSub} ${hoverBg} transition-colors cursor-pointer`}
                        title={viewportMode === 'desktop' ? 'Switch to Mobile Frame' : 'Switch to Desktop Frame'}
                      >
                        {viewportMode === 'desktop' ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setPreviewReloadKey((k) => k + 1)}
                        className={`p-1.5 rounded-lg ${textSub} ${hoverBg} transition-colors cursor-pointer`}
                        title="Reload Preview"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Preview Content Area */}
                  <div className={`flex-1 overflow-hidden ${isMoon ? 'bg-[#0a0b0e]' : 'bg-[#f0ede7]'} flex items-center justify-center p-2 sm:p-4`}>
                    {files.length === 0 ? (
                      <div className={`p-8 rounded-3xl border ${border} ${bgCard} text-center max-w-sm space-y-3`}>
                        <div className="w-12 h-12 rounded-2xl bg-[#d97757]/15 text-[#d97757] flex items-center justify-center mx-auto">
                          <Globe className="w-6 h-6" />
                        </div>
                        <h3 className={`text-sm font-bold ${textBright}`}>Clean Workspace (0 files)</h3>
                        <p className={`text-xs ${textSub} leading-relaxed`}>
                          Talk to Codex AI in Chat to generate your HTML, CSS, and JavaScript. Your running app will automatically appear here!
                        </p>
                        <button
                          type="button"
                          onClick={() => setMobileTab('chat')}
                          className="px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86949] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Go to Chat & Build →
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`h-full transition-all duration-300 bg-white rounded-2xl overflow-hidden shadow-2xl ${
                          viewportMode === 'mobile' ? 'w-[375px] max-w-full border-4 border-[#2a2c34]' : 'w-full'
                        }`}
                      >
                        <iframe
                          key={previewReloadKey}
                          srcDoc={livePreviewDoc}
                          title="Live Preview"
                          sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-downloads"
                          className="w-full h-full border-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* PROJECT FILES & CODE EDITOR */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Files Toolbar */}
                  <div className={`h-10 px-3 border-b ${border} ${bgHeader} flex items-center justify-between shrink-0`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className={`w-3.5 h-3.5 ${accent} shrink-0`} />
                      <span className={`text-xs font-semibold ${textBright} truncate`}>
                        {activeProject?.name || 'Workspace'} ({files.length} {files.length === 1 ? 'file' : 'files'})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleUploadFiles}
                        className="hidden"
                      />
                      <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        onChange={handleUploadFiles}
                        className="hidden"
                        {...({ webkitdirectory: '', directory: '', mozdirectory: '' } as any)}
                      />

                      <button
                        onClick={handleOpenFolder}
                        className={`px-2.5 py-1.5 rounded-lg ${accentBg} text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer`}
                        title="Open Folder from Device"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span className="hidden sm:inline">Open Folder</span>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-1.5 rounded-lg ${textSub} ${hoverBg} transition-colors cursor-pointer`}
                        title="Upload Files"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={handleCreateFile}
                        className={`p-1.5 rounded-lg ${textSub} ${hoverBg} transition-colors cursor-pointer`}
                        title="New File"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* File Tree / List */}
                  <div className="flex-1 overflow-y-auto p-2">
                    {files.length === 0 ? (
                      <div className={`h-full flex flex-col items-center justify-center text-center p-6 ${textMuted}`}>
                        <Folder className="w-10 h-10 mb-3 opacity-40 text-[#d97757]" />
                        <p className="text-xs font-bold mb-1">No files in project yet</p>
                        <p className="text-[11px] max-w-xs mb-3">Ask Codex AI in Chat to generate code, or click below to create a file manually.</p>
                        <button
                          onClick={handleCreateFile}
                          className="px-3 py-1.5 rounded-xl bg-[#d97757] hover:bg-[#c86949] text-white text-xs font-bold cursor-pointer"
                        >
                          + Create New File
                        </button>
                      </div>
                    ) : (
                      renderTreeNode(fileTree, '')
                    )}
                  </div>

                  {/* Built-in Code Editor */}
                  {activeFile && !activeFile.isBinary && (
                    <div className={`border-t ${border} flex flex-col ${isMoon ? 'bg-[#0a0b0e]' : 'bg-[#faf9f7]'} h-[50%] shrink-0`}>
                      <div className={`h-9 px-3 border-b ${border} flex items-center justify-between shrink-0 ${bgHeader}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCode className={`w-3.5 h-3.5 ${accent} shrink-0`} />
                          <span className={`text-xs font-mono font-semibold ${textBright} truncate`}>
                            {activeFile.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {saveStatus === 'saving' && (
                            <span className={`text-[10px] ${textSub} flex items-center gap-1`}>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Saving...
                            </span>
                          )}
                          {saveStatus === 'saved' && (
                            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                              ✓ Saved
                            </span>
                          )}
                          <button
                            onClick={handleSaveFile}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className={`flex-1 w-full p-3 font-mono text-xs leading-relaxed border-none outline-none resize-none ${
                          isMoon ? 'bg-[#0a0b0e] text-[#e8e8ea]' : 'bg-white text-[#1a1815]'
                        }`}
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GLOBAL MODALS (NEW PROJECT & DELETE CONFIRMATION)                      */}
      {/* ========================================================================= */}

      {/* NEW PROJECT MODAL */}
      <AnimatePresence>
        {showNewProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-3xl border p-5 shadow-2xl ${
                isMoon ? 'bg-[#14151e] border-[#2b2d3e] text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-[#d97757]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm">Add New Project</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="p-1 rounded-lg hover:bg-zinc-800/40 text-zinc-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                Create a clean, empty workspace with zero default boilerplate. You can chat with Codex AI to code any app or upload files.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateNewProject(newProjectName);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Portfolio, E-Commerce, Budget Tracker"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:border-[#d97757] ${
                      isMoon ? 'bg-[#1a1c28] border-[#2f3248] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86949] text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE PROJECT IN-UI CONFIRMATION MODAL */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-3xl border p-5 shadow-2xl ${
                isMoon ? 'bg-[#14151e] border-[#2b2d3e] text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">Delete Project?</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    "{projectToDelete.name}" and all of its files will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const remaining = projects.filter((p) => p.id !== projectToDelete.id);
                    setProjects(remaining);
                    if (activeProjectId === projectToDelete.id) {
                      if (remaining.length > 0) {
                        setActiveProjectId(remaining[0].id);
                        setSelectedFileId(remaining[0].files[0]?.id || '');
                        setEditingContent(remaining[0].files[0]?.content || '');
                      } else {
                        setActiveProjectId('');
                        setSelectedFileId('');
                        setEditingContent('');
                      }
                    }
                    setProjectToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Delete Project
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