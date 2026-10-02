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
  AlertCircle
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

interface CodexMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
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
// DEFAULT FILES
// ============================================================
const DEFAULT_FILES: LaptopFile[] = [
  {
    id: 'f_index',
    name: 'index.html',
    path: 'index.html',
    language: 'html',
    size: 400,
    lastModified: Date.now(),
    status: 'ready',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
</head>
<body>
  <div class="container">
    <h1>Hello, World!</h1>
    <button id="btn">Click Me</button>
    <p id="output"></p>
  </div>
</body>
</html>`
  },
  {
    id: 'f_style',
    name: 'style.css',
    path: 'style.css',
    language: 'css',
    size: 250,
    lastModified: Date.now(),
    status: 'ready',
    content: `* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  text-align: center;
}

h1 { color: #333; margin-bottom: 20px; }

button {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover { background: #5568d3; transform: translateY(-2px); }

#output { margin-top: 20px; color: #666; font-weight: 600; }`
  },
  {
    id: 'f_app',
    name: 'app.js',
    path: 'app.js',
    language: 'javascript',
    size: 150,
    lastModified: Date.now(),
    status: 'ready',
    content: `document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('btn');
  var output = document.getElementById('output');
  var count = 0;

  if (btn) {
    btn.addEventListener('click', function() {
      count++;
      if (output) {
        output.innerText = 'Clicked ' + count + ' time' + (count > 1 ? 's' : '') + '!';
      }
    });
  }
});`
  }
];

// ============================================================
// COMPONENT
// ============================================================
export const CodexWorkspaceView: React.FC<CodexWorkspaceViewProps> = ({
  settings,
  onClose
}) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  // ========== STATE ==========
  const [files, setFiles] = useState<LaptopFile[]>(() => {
    try {
      const saved = localStorage.getItem('sapphire_codex_files_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_FILES;
  });

  const [selectedFileId, setSelectedFileId] = useState<string>(() => files[0]?.id || 'f_index');
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
        alert('Your browser does not support folder access.\n\nPlease use Chrome, Edge, or Brave browser.');
        return;
      }

      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      if (!dirHandle) return;

      setRootDirHandle(dirHandle);
      setFolderName(dirHandle.name);

      const allFiles = await readDirectoryRecursive(dirHandle);
      if (allFiles.length === 0) {
        alert('Folder is empty.');
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

      setPreviewReloadKey((k) => k + 1);
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
      files[0];

    if (!htmlFile) {
      return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui;padding:40px;text-align:center;background:#f5f5f5;color:#666;">
  <div style="max-width:400px;margin:auto;">
    <div style="font-size:48px;margin-bottom:20px;">📄</div>
    <h2>No HTML file</h2>
    <p style="font-size:14px;">Create an <code>index.html</code> file to see live preview</p>
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

    // Remove existing external references (avoid duplicates)
    html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
    html = html.replace(/<script[^>]*src=["'][^"']+\.(?:js|jsx|ts|tsx|mjs|cjs)["'][^>]*>\s*<\/script>/gi, '');

    // Remove previous injections
    html = html.replace(/<style data-injected[^>]*>[\s\S]*?<\/style>/gi, '');
    html = html.replace(/<script data-injected[^>]*>[\s\S]*?<\/script>/gi, '');

    // Inject all CSS
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

    // Inject all JS
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
  }, [files, htmlFiles, cssFiles, jsFiles, selectedHtmlFile, previewReloadKey]);

  // ========== AI CHAT ==========
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
        .slice(0, 10)
        .map((f) => `=== ${f.path} ===\n${f.content.slice(0, 600)}`)
        .join('\n\n');

      const systemPrompt = `You are an elite full-stack developer. Generate COMPLETE, production-ready code.
NEVER use placeholders, "// TODO", or abbreviate code.
Always output files in separate code blocks with filenames:
\`\`\`html index.html
\`\`\`css style.css
\`\`\`javascript app.js

Current workspace files:
${filesContext}`;

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': getStoredApiKey()
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text }] }],
          systemInstruction: systemPrompt,
          model: modelMode === 'reasoning' ? 'deepseek-reasoner' : 'gemini-2.5-flash'
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

      // Parse files from response
      const codeRegex = /```([a-zA-Z0-9_\-\.]+)?\s*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)?\n([\s\S]*?)```/g;
      let match;
      const parsed: { name: string; path: string; language: string; content: string }[] = [];

      while ((match = codeRegex.exec(accumulated)) !== null) {
        const lang = match[1] || 'js';
        const filename = match[2] || `file_${Date.now()}.${lang}`;
        const content = match[3];
        if (content && content.length > 20) {
          const cleanPath = normalizePath(filename);
          parsed.push({
            name: cleanPath.split('/').pop() || cleanPath,
            path: cleanPath,
            language: lang,
            content
          });
        }
      }

      if (parsed.length > 0) {
        // Update files in memory
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

        // Auto-save AI-generated files to laptop folder
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
      }

      setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, isStreaming: false } : m)));
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId ? { ...m, text: '⚠️ Generation failed. Please try again.', isStreaming: false } : m
        )
      );
    } finally {
      setIsLoading(false);
    }
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

      {/* HEADER */}
      <header className={`h-12 px-4 border-b ${border} ${bgHeader} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg ${textSub} ${hoverBg} transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div className={`h-4 w-px ${border}`} />
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${bgSubtle} border ${border} flex items-center justify-center`}>
              <Code2 className={`w-3.5 h-3.5 ${accent}`} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${textBright}`}>Codex Studio</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${bgSubtle} ${accent} font-semibold border ${border}`}>
                v2.5
              </span>
            </div>
          </div>
        </div>

        {/* Model Mode */}
        <div className={`hidden sm:flex items-center ${bgSubtle} border ${border} rounded-xl p-0.5 text-xs`}>
          <button
            onClick={() => setModelMode('fast')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              modelMode === 'fast' ? `${accentBg} text-white font-semibold shadow-sm` : `${textSub} ${hoverBg}`
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Fast</span>
          </button>
          <button
            onClick={() => setModelMode('reasoning')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              modelMode === 'reasoning' ? `${accentBg} text-white font-semibold shadow-sm` : `${textSub} ${hoverBg}`
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>Reasoning</span>
          </button>
        </div>

        {/* Tab Toggle */}
        <div className={`flex items-center ${bgSubtle} border ${border} rounded-xl p-0.5 text-xs`}>
          <button
            onClick={() => setRightTab('preview')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              rightTab === 'preview' ? `${accentBg} text-white font-semibold shadow-sm` : `${textSub} ${hoverBg}`
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={() => setRightTab('files')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              rightTab === 'files' ? `${accentBg} text-white font-semibold shadow-sm` : `${textSub} ${hoverBg}`
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Files</span>
            <span className={`text-[10px] ${rightTab === 'files' ? 'text-white/80' : textMuted}`}>
              {files.length}
            </span>
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: CHAT */}
        <div className={`w-full lg:w-1/2 flex flex-col border-r ${border} ${bgMain}`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-sm mx-auto">
                <div className={`w-12 h-12 rounded-2xl ${bgCard} border ${border} flex items-center justify-center mb-4`}>
                  <Code2 className={`w-6 h-6 ${accent}`} />
                </div>
                <h2 className={`text-lg font-bold ${textBright} mb-1.5`}>What will you build?</h2>
                <p className={`text-xs ${textSub} mb-6 leading-relaxed`}>
                  Describe your app idea and I'll generate complete code with live preview.
                </p>
                <div className="w-full space-y-2">
                  {[
                    'Build a todo app with animations',
                    'Create a portfolio website',
                    'Make a calculator with dark mode',
                    'Build a chat UI with messages'
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
                    <div className={`rounded-2xl p-4 ${bgCard} border ${border} text-sm`}>
                      {msg.text ? (
                        <pre className={`whitespace-pre-wrap font-['Plus_Jakarta_Sans',sans-serif] text-xs ${textPrimary} leading-relaxed`}>
                          {msg.text}
                        </pre>
                      ) : (
                        <div className={`flex items-center gap-2 text-xs ${textSub}`}>
                          <Loader2 className={`w-3.5 h-3.5 ${accent} animate-spin`} />
                          <span>Generating code...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

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
                placeholder="Describe what you want to build..."
                rows={2}
                className={`flex-1 bg-transparent border-none outline-none resize-none text-sm p-1.5 ${textPrimary} placeholder-[#6b6760]`}
              />
              <button
                disabled={!input.trim() || isLoading}
                onClick={() => handleSendPrompt()}
                className={`p-2.5 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  input.trim() && !isLoading
                    ? `${accentBg} text-white shadow-md hover:scale-105 active:scale-95 cursor-pointer`
                    : `${bgSubtle} ${textMuted} cursor-not-allowed`
                }`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4 stroke-[2.5]" />}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: PREVIEW / FILES */}
        <div className={`w-full lg:w-1/2 flex flex-col ${bgMain}`}>
          {rightTab === 'preview' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Preview Toolbar */}
              <div className={`h-10 px-3 border-b ${border} ${bgHeader} flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500/60" />
                  <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
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
                    <span className={`text-[11px] ${textSub} font-mono ml-2`}>
                      {selectedHtmlFile || 'preview'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewportMode(viewportMode === 'desktop' ? 'mobile' : 'desktop')}
                    className={`p-1.5 rounded-lg ${textSub} ${hoverBg} transition-colors cursor-pointer`}
                  >
                    {viewportMode === 'desktop' ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setPreviewReloadKey((k) => k + 1)}
                    className={`p-1.5 rounded-lg ${textSub} ${hoverBg} transition-colors cursor-pointer`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Preview Iframe */}
              <div className={`flex-1 overflow-hidden ${isMoon ? 'bg-[#0a0b0e]' : 'bg-[#f0ede7]'} flex items-center justify-center p-3`}>
                <div
                  className={`h-full transition-all duration-300 bg-white rounded-xl overflow-hidden shadow-2xl ${
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
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Files Toolbar */}
              <div className={`h-10 px-3 border-b ${border} ${bgHeader} flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Laptop className={`w-3.5 h-3.5 ${accent} shrink-0`} />
                  <span className={`text-xs font-semibold ${textBright} truncate`}>
                    {folderName}
                  </span>
                  {rootDirHandle && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold shrink-0">
                      LIVE
                    </span>
                  )}
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
                    title="Open Folder from Laptop"
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
                    onClick={() => folderInputRef.current?.click()}
                    className={`p-1.5 rounded-lg ${textSub} ${hoverBg} transition-colors cursor-pointer`}
                    title="Upload Folder"
                  >
                    <FolderUp className="w-3.5 h-3.5" />
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

              {/* File Tree */}
              <div className="flex-1 overflow-y-auto p-2">
                {files.length === 0 ? (
                  <div className={`h-full flex flex-col items-center justify-center text-center p-6 ${textMuted}`}>
                    <Folder className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-xs mb-2">No files in workspace</p>
                    <button
                      onClick={handleOpenFolder}
                      className={`text-xs ${accent} hover:underline font-semibold cursor-pointer`}
                    >
                      Open a folder from laptop
                    </button>
                  </div>
                ) : (
                  renderTreeNode(fileTree, '')
                )}
              </div>

              {/* Editor */}
              {activeFile && !activeFile.isBinary && (
                <div className={`border-t ${border} flex flex-col ${isMoon ? 'bg-[#0a0b0e]' : 'bg-[#faf9f7]'} h-[45%] shrink-0`}>
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
  );
};

export default CodexWorkspaceView;