import React, { useState, useEffect, useRef, useMemo } from 'react';
import JSZip from 'jszip';
import {
  X,
  Folder,
  FolderOpen,
  FileCode,
  Download,
  Trash2,
  Copy,
  Check,
  Search,
  Sparkles,
  History,
  RotateCcw,
  Plus,
  FileUp,
  FolderUp,
  ChevronRight,
  ChevronDown,
  Clock,
  Loader2,
  File as FileIcon,
  Archive,
  Image as ImageIcon,
  FolderTree,
  Edit3,
  CheckCircle2,
  ArrowLeft,
  Code2,
  Layers,
  ArrowRight,
  CornerDownRight,
  FolderPlus
} from 'lucide-react';
import { WorkspaceFile, AiEditHistoryItem } from '../types';
import {
  loadWorkspaceFiles,
  saveWorkspaceFiles,
  autoSaveFile,
  deleteWorkspaceFile,
  deleteWorkspaceFolder,
  clearAllWorkspaceFiles,
  downloadWorkspaceFile,
  exportAllFilesAsZip,
  loadAiEditHistory,
  saveAiEditHistoryItem,
  getLanguageFromFileName
} from '../services/fileStorageService';
import { VsCodeFileTree } from './VsCodeFileTree';

interface FileWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedFileId?: string;
}

// Tree node definition for directory tree
export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  file?: WorkspaceFile;
  children: FileTreeNode[];
  depth: number;
}

// Category determination
export function getFileCategory(name: string): 'code' | 'styles' | 'markup' | 'data' | 'media' | 'other' {
  const lower = name.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'markup';
  if (lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.sass') || lower.endsWith('.less')) return 'styles';
  if (
    lower.endsWith('.json') ||
    lower.endsWith('.xml') ||
    lower.endsWith('.yaml') ||
    lower.endsWith('.yml') ||
    lower.endsWith('.toml') ||
    lower.endsWith('.sql') ||
    lower.endsWith('.csv')
  ) {
    return 'data';
  }
  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.ico')
  ) {
    return 'media';
  }
  if (
    lower.endsWith('.js') ||
    lower.endsWith('.ts') ||
    lower.endsWith('.tsx') ||
    lower.endsWith('.jsx') ||
    lower.endsWith('.py') ||
    lower.endsWith('.php') ||
    lower.endsWith('.sh')
  ) {
    return 'code';
  }
  return 'other';
}

// Color-coded badge for file extensions
export function getFileTypeBadge(name: string) {
  const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
  const lower = name.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    return { label: 'HTML', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  }
  if (lower.endsWith('.css') || lower.endsWith('.scss')) {
    return { label: 'CSS', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
  }
  if (lower.endsWith('.tsx') || lower.endsWith('.ts')) {
    return { label: ext, bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
  }
  if (lower.endsWith('.jsx') || lower.endsWith('.js')) {
    return { label: ext, bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  }
  if (lower.endsWith('.json')) {
    return { label: 'JSON', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  }
  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.svg')
  ) {
    return { label: 'IMG', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  }
  return { label: ext.slice(0, 5), bg: 'bg-slate-800 text-slate-300 border-slate-700' };
}

// Read file content safely
async function readFileContent(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const isBinary =
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.gif') ||
    name.endsWith('.webp') ||
    name.endsWith('.ico');

  if (isBinary) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  try {
    return await file.text();
  } catch {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  }
}

// Extract files from a ZIP archive
async function extractZipFile(file: File): Promise<Array<{ name: string; path: string; content: string }>> {
  const zip = await JSZip.loadAsync(file);
  const baseFolder = file.name.replace(/\.zip$/i, '').trim();
  const results: Array<{ name: string; path: string; content: string }> = [];

  const entries: Array<{ relativePath: string; zipEntry: JSZip.JSZipObject }> = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && !relativePath.startsWith('__MACOSX/') && !relativePath.includes('.DS_Store')) {
      entries.push({ relativePath, zipEntry });
    }
  });

  for (const { relativePath, zipEntry } of entries) {
    const fileName = relativePath.split('/').pop() || relativePath;
    const lower = fileName.toLowerCase();
    const isBinary =
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.ico');

    let content = '';
    if (isBinary) {
      const base64 = await zipEntry.async('base64');
      const mime = lower.endsWith('.png')
        ? 'image/png'
        : lower.endsWith('.jpg') || lower.endsWith('.jpeg')
        ? 'image/jpeg'
        : 'application/octet-stream';
      content = `data:${mime};base64,${base64}`;
    } else {
      content = await zipEntry.async('text');
    }

    let fullPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    if (!fullPath.startsWith(`/${baseFolder}/`)) {
      fullPath = `/${baseFolder}${fullPath}`;
    }

    results.push({
      name: fileName,
      path: fullPath,
      content
    });
  }

  return results;
}

// Read folder entries recursively with File System Access API
async function readDirectoryRecursive(
  dirHandle: any,
  currentPath = ''
): Promise<Array<{ name: string; path: string; content: string; handle?: any }>> {
  const files: Array<{ name: string; path: string; content: string; handle?: any }> = [];
  try {
    for await (const entry of dirHandle.values()) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : `/${entry.name}`;
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      if (entry.kind === 'file') {
        try {
          const file = await entry.getFile();
          const content = await readFileContent(file);
          files.push({
            name: entry.name,
            path: entryPath,
            content,
            handle: entry
          });
        } catch (fileErr) {
          console.warn(`Could not read file ${entryPath}:`, fileErr);
        }
      } else if (entry.kind === 'directory') {
        const subFiles = await readDirectoryRecursive(entry, entryPath);
        files.push(...subFiles);
      }
    }
  } catch (err) {
    console.warn('Error during recursive directory read:', err);
  }
  return files;
}

export const FileWorkspaceModal: React.FC<FileWorkspaceModalProps> = ({
  isOpen,
  onClose,
  initialSelectedFileId
}) => {
  const [files, setFiles] = useState<WorkspaceFile[]>(() => loadWorkspaceFiles());
  const [selectedFileId, setSelectedFileId] = useState<string>(() => {
    return initialSelectedFileId || files[0]?.id || '';
  });

  // Mobile navigation view: 'files' or 'editor'
  const [mobileView, setMobileView] = useState<'files' | 'editor'>('files');

  // Presentation mode for folders: 'separate' (distinct folder cards, files isolated by folder) or 'accordion' (all folders in collapsible view)
  const [folderViewMode, setFolderViewMode] = useState<'separate' | 'accordion'>('separate');

  // Currently opened folder in 'separate' mode (null = viewing all separate folder cards)
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // View presentation mode: 'cards' (grouped folders with separated file cards) or 'tree'
  const [explorerMode, setExplorerMode] = useState<'cards' | 'tree'>('cards');

  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'code' | 'markup' | 'styles' | 'data' | 'media'>('all');

  // Active file editor states
  const [activeContent, setActiveContent] = useState('');
  const [activePath, setActivePath] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded folders map
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // AI Command Bar states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // AI Edit History states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [aiHistory, setAiHistory] = useState<AiEditHistoryItem[]>(() => loadAiEditHistory());

  // Drag & drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // New file creation state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');

  // Path renaming state
  const [isRenamingPath, setIsRenamingPath] = useState(false);
  const [editPathInput, setEditPathInput] = useState('');

  // In-app Delete Confirmation Target (safe in iframes, no window.confirm)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'file' | 'folder' | 'all';
    id?: string;
    path?: string;
    name: string;
    count?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileHandlesRef = useRef<Record<string, any>>({});

  // Ensure folder input element has webkitdirectory set in browser DOM
  useEffect(() => {
    if (folderInputRef.current) {
      try {
        (folderInputRef.current as any).webkitdirectory = true;
        (folderInputRef.current as any).directory = true;
        folderInputRef.current.setAttribute('webkitdirectory', '');
        folderInputRef.current.setAttribute('directory', '');
        folderInputRef.current.setAttribute('mozdirectory', '');
      } catch (e) {
        console.warn('Could not set webkitdirectory attribute:', e);
      }
    }
  }, [folderInputRef.current]);

  // Sync files on open
  useEffect(() => {
    if (isOpen) {
      const current = loadWorkspaceFiles();
      setFiles(current);
      setAiHistory(loadAiEditHistory());

      // Auto-expand all folders
      const autoExpanded: Record<string, boolean> = {};
      current.forEach((f) => {
        const parts = f.path.replace(/^\/+/, '').split('/');
        let p = '';
        for (let i = 0; i < parts.length - 1; i++) {
          p += `/${parts[i]}`;
          autoExpanded[p] = true;
        }
      });
      setExpandedFolders(autoExpanded);

      if (initialSelectedFileId && current.some((f) => f.id === initialSelectedFileId)) {
        setSelectedFileId(initialSelectedFileId);
        setMobileView('editor');
      } else if (!selectedFileId || !current.some((f) => f.id === selectedFileId)) {
        if (current.length > 0) {
          setSelectedFileId(current[0].id);
        }
      }
    }
  }, [isOpen, initialSelectedFileId]);

  const selectedFile = files.find((f) => f.id === selectedFileId) || files[0];

  useEffect(() => {
    if (selectedFile) {
      setActiveContent(selectedFile.content);
      setActivePath(selectedFile.path);
      setEditPathInput(selectedFile.path);
    } else {
      setActiveContent('');
      setActivePath('');
      setEditPathInput('');
    }
  }, [selectedFile?.id]);

  // Global Escape key handler to cancel/close modal or subdialogs
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (deleteConfirmTarget) {
          setDeleteConfirmTarget(null);
        } else if (isRenamingPath) {
          setIsRenamingPath(false);
        } else if (isCreatingNew) {
          setIsCreatingNew(false);
        } else if (isHistoryOpen) {
          setIsHistoryOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleteConfirmTarget, isRenamingPath, isCreatingNew, isHistoryOpen, onClose]);

  // Grouped Folders for the "Separated Cards" Mode (keeps files cleanly separated and organized)
  const groupedFolderMap = useMemo(() => {
    let list = files;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') {
      list = list.filter((f) => getFileCategory(f.name) === categoryFilter);
    }

    const groups: Record<string, WorkspaceFile[]> = {};
    for (const f of list) {
      const parts = f.path.replace(/^\/+/, '').split('/');
      const folderPath = parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/';
      if (!groups[folderPath]) groups[folderPath] = [];
      groups[folderPath].push(f);
    }

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === '/') return -1;
      if (b === '/') return 1;
      return a.localeCompare(b);
    });

    return sortedKeys.map((key) => ({
      folderPath: key,
      files: groups[key].sort((a, b) => a.name.localeCompare(b.name))
    }));
  }, [files, searchQuery, categoryFilter]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { code: 0, markup: 0, styles: 0, data: 0, media: 0 };
    for (const f of files) {
      const cat = getFileCategory(f.name);
      if (cat in counts) {
        counts[cat as keyof typeof counts]++;
      }
    }
    return counts;
  }, [files]);

  // Unique folders list with summary metadata (file count, extension types, total size)
  const allUniqueFolders = useMemo(() => {
    const map = new Map<string, { count: number; types: Set<string>; totalBytes: number }>();
    for (const f of files) {
      const parts = f.path.replace(/^\/+/, '').split('/');
      const folderPath = parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/';
      const existing = map.get(folderPath) || { count: 0, types: new Set<string>(), totalBytes: 0 };
      existing.count++;
      const ext = f.name.split('.').pop()?.toUpperCase() || 'FILE';
      existing.types.add(ext);
      existing.totalBytes += new Blob([f.content || '']).size;
      map.set(folderPath, existing);
    }
    return Array.from(map.entries())
      .map(([folderPath, data]) => ({
        folderPath,
        count: data.count,
        types: Array.from(data.types).slice(0, 4),
        totalBytes: data.totalBytes
      }))
      .sort((a, b) => {
        if (a.folderPath === '/') return -1;
        if (b.folderPath === '/') return 1;
        return a.folderPath.localeCompare(b.folderPath);
      });
  }, [files]);

  // Files strictly in activeFolder (isolated view with no mixing)
  const activeFolderFiles = useMemo(() => {
    if (!activeFolder) return [];
    return files
      .filter((f) => {
        const parts = f.path.replace(/^\/+/, '').split('/');
        const folderPath = parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/';
        return folderPath === activeFolder;
      })
      .filter((f) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q);
        }
        return true;
      })
      .filter((f) => {
        if (categoryFilter !== 'all') {
          return getFileCategory(f.name) === categoryFilter;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [files, activeFolder, searchQuery, categoryFilter]);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    groupedFolderMap.forEach((g) => {
      next[g.folderPath] = false;
    });
    setExpandedFolders(next);
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    groupedFolderMap.forEach((g) => {
      next[g.folderPath] = true;
    });
    setExpandedFolders(next);
  };

  // Toggle folder expansion
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: prev[folderPath] === false ? true : false
    }));
  };

  // Apply newly imported files into workspace state
  const applyImportedFiles = (
    extracted: Array<{ name: string; path: string; content: string; handle?: any }>
  ) => {
    if (extracted.length === 0) {
      setAiStatus('No files found.');
      setTimeout(() => setAiStatus(null), 3000);
      return;
    }

    const now = Date.now();
    const newFiles: WorkspaceFile[] = extracted.map((item, idx) => ({
      id: `file_${now}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.name,
      path: item.path.startsWith('/') ? item.path : `/${item.path}`,
      content: item.content,
      language: getLanguageFromFileName(item.name),
      createdAt: now,
      updatedAt: now,
      autoSaved: true,
      source: 'imported'
    }));

    extracted.forEach((item) => {
      if (item.handle) {
        fileHandlesRef.current[item.path] = item.handle;
      }
    });

    const expanded: Record<string, boolean> = {};
    newFiles.forEach((f) => {
      const parts = f.path.replace(/^\/+/, '').split('/');
      let p = '';
      for (let i = 0; i < parts.length - 1; i++) {
        p += `/${parts[i]}`;
        expanded[p] = true;
      }
    });
    setExpandedFolders((prev) => ({ ...prev, ...expanded }));

    const current = loadWorkspaceFiles();
    const merged = [
      ...newFiles,
      ...current.filter((c) => !newFiles.some((n) => n.path === c.path))
    ];

    saveWorkspaceFiles(merged);
    setFiles(merged);

    const priorityFile =
      newFiles.find((f) => f.name === 'index.html') ||
      newFiles.find((f) => f.name.endsWith('.json') || f.name.endsWith('.js') || f.name.endsWith('.tsx')) ||
      newFiles[0];

    if (priorityFile) {
      setSelectedFileId(priorityFile.id);
      setMobileView('editor');
    }

    setAiStatus(`Loaded ${newFiles.length} files`);
    setTimeout(() => setAiStatus(null), 3000);
  };

  // Instant real-time auto-save on edit
  const handleCodeChange = (newCode: string) => {
    setActiveContent(newCode);
    setIsSaving(true);

    if (selectedFile) {
      const updated = autoSaveFile({
        ...selectedFile,
        content: newCode
      });
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));

      const handle = fileHandlesRef.current[selectedFile.path];
      if (handle && typeof handle.createWritable === 'function') {
        handle.createWritable().then(async (writable: any) => {
          await writable.write(newCode);
          await writable.close();
        }).catch((e: any) => console.warn('Could not write to local handle:', e));
      }
    }

    setTimeout(() => setIsSaving(false), 500);
  };

  // Upload folder click (Native File System Access API with input fallback)
  const handleUploadFolderClick = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        setAiStatus(`Loading folder "${dirHandle.name}"...`);
        const extracted = await readDirectoryRecursive(dirHandle, `/${dirHandle.name}`);
        applyImportedFiles(extracted);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('showDirectoryPicker failed or canceled, falling back to input:', err);
      }
    }
    folderInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setAiStatus('Reading files...');

    const extracted: Array<{ name: string; path: string; content: string }> = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const lower = file.name.toLowerCase();

      if (lower.endsWith('.zip')) {
        try {
          const zipFiles = await extractZipFile(file);
          extracted.push(...zipFiles);
        } catch (zipErr) {
          console.error('Failed to extract zip:', zipErr);
        }
      } else {
        const content = await readFileContent(file);
        const relPath = (file as any).webkitRelativePath || file.name;
        const normalizedPath = relPath.startsWith('/') ? relPath : `/${relPath}`;
        extracted.push({
          name: file.name,
          path: normalizedPath,
          content
        });
      }
    }

    applyImportedFiles(extracted);
  };

  // Drag & drop drop handler
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const items = e.dataTransfer.items;
    const extracted: Array<{ name: string; path: string; content: string }> = [];

    if (items && items.length > 0) {
      setAiStatus('Reading dropped folder...');
      const queue: any[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = (item as any).webkitGetAsEntry?.();
          if (entry) queue.push(entry);
        }
      }

      async function processEntry(entry: any, pathSoFar = '') {
        if (entry.isFile) {
          return new Promise<void>((resolve) => {
            entry.file(async (file: File) => {
              const filePath = `${pathSoFar}/${entry.name}`;
              if (file.name.toLowerCase().endsWith('.zip')) {
                const zipFiles = await extractZipFile(file);
                extracted.push(...zipFiles);
              } else {
                const content = await readFileContent(file);
                extracted.push({
                  name: entry.name,
                  path: filePath.startsWith('/') ? filePath : `/${filePath}`,
                  content
                });
              }
              resolve();
            });
          });
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const readEntries = (): Promise<any[]> =>
            new Promise((resolve) => dirReader.readEntries((ents: any[]) => resolve(ents)));

          let batch: any[] = [];
          do {
            batch = await readEntries();
            for (const child of batch) {
              await processEntry(child, `${pathSoFar}/${entry.name}`);
            }
          } while (batch.length > 0);
        }
      }

      for (const entry of queue) {
        await processEntry(entry);
      }

      applyImportedFiles(extracted);
    } else if (e.dataTransfer.files.length > 0) {
      handleFileInputChange(e.dataTransfer.files);
    }
  };

  // Rename full path
  const handleSaveRenamedPath = () => {
    if (!selectedFile || !editPathInput.trim()) return;
    let newPath = editPathInput.trim();
    if (!newPath.startsWith('/')) newPath = `/${newPath}`;
    const newName = newPath.split('/').pop() || selectedFile.name;

    const updated = autoSaveFile({
      ...selectedFile,
      name: newName,
      path: newPath
    });

    setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setIsRenamingPath(false);
    setAiStatus(`Renamed to ${newPath}`);
    setTimeout(() => setAiStatus(null), 3000);
  };

  // Submit AI edit command
  const handleAiEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = aiPrompt.trim();
    if (!prompt || !selectedFile || isAiEditing) return;

    setIsAiEditing(true);
    setAiStatus(`AI is editing ${selectedFile.name}...`);

    try {
      const response = await fetch('/api/code/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeContent,
          filename: selectedFile.name,
          path: selectedFile.path,
          language: selectedFile.language,
          instruction: prompt
        })
      });

      if (!response.ok) {
        throw new Error('AI Edit request failed');
      }

      const data = await response.json();
      const updatedCode = data.content?.trim();

      if (updatedCode) {
        saveAiEditHistoryItem({
          id: `hist_${Date.now()}`,
          fileId: selectedFile.id,
          filePath: selectedFile.path,
          prompt,
          previousContent: activeContent,
          newContent: updatedCode,
          timestamp: Date.now(),
          model: 'gemini-3.6-flash'
        });
        setAiHistory(loadAiEditHistory());

        setActiveContent(updatedCode);
        const updated = autoSaveFile({
          ...selectedFile,
          content: updatedCode
        });

        setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));

        setAiPrompt('');
        setAiStatus(`Updated ${selectedFile.name}!`);
        setTimeout(() => setAiStatus(null), 3000);
      }
    } catch (err: any) {
      setAiStatus(`Edit error: ${err.message || 'Request failed'}`);
      setTimeout(() => setAiStatus(null), 3500);
    } finally {
      setIsAiEditing(false);
    }
  };

  // Restore from history
  const handleRestoreHistory = (hist: AiEditHistoryItem) => {
    if (selectedFile) {
      setActiveContent(hist.previousContent);
      const updated = autoSaveFile({
        ...selectedFile,
        content: hist.previousContent
      });
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setAiStatus(`Restored previous version`);
      setTimeout(() => setAiStatus(null), 3000);
    }
  };

  // Create new file with custom full path
  const handleCreateNewFile = () => {
    if (!newFilePath.trim()) return;
    let path = newFilePath.trim();
    if (!path.startsWith('/')) path = `/${path}`;
    const fileName = path.split('/').pop() || 'untitled.txt';

    const newFile = autoSaveFile({
      name: fileName,
      path: path,
      content:
        path.endsWith('.json')
          ? '{\n  "name": "project",\n  "version": "1.0.0"\n}\n'
          : path.endsWith('.html')
          ? '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>New Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>\n'
          : '',
      language: getLanguageFromFileName(fileName),
      source: 'user-created'
    });

    const parts = path.replace(/^\/+/, '').split('/');
    let cur = '';
    const updatedExpanded = { ...expandedFolders };
    for (let i = 0; i < parts.length - 1; i++) {
      cur += `/${parts[i]}`;
      updatedExpanded[cur] = true;
    }
    setExpandedFolders(updatedExpanded);

    const all = loadWorkspaceFiles();
    setFiles(all);
    setSelectedFileId(newFile.id);
    setIsCreatingNew(false);
    setNewFilePath('');
    setMobileView('editor');
    setAiStatus(`Created ${path}`);
    setTimeout(() => setAiStatus(null), 3000);
  };

  // Create file directly from VS Code Tree
  const handleCreateFileFromTree = (fullPath: string) => {
    let path = fullPath.trim();
    if (!path.startsWith('/')) path = `/${path}`;
    const fileName = path.split('/').pop() || 'untitled.txt';

    const newFile = autoSaveFile({
      name: fileName,
      path: path,
      content:
        path.endsWith('.json')
          ? '{\n  \n}\n'
          : path.endsWith('.html')
          ? '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>New Page</title>\n</head>\n<body>\n</body>\n</html>\n'
          : '',
      language: getLanguageFromFileName(fileName),
      source: 'user-created'
    });

    const all = loadWorkspaceFiles();
    setFiles(all);
    setSelectedFileId(newFile.id);
    setMobileView('editor');
    setAiStatus(`Created ${path}`);
    setTimeout(() => setAiStatus(null), 3000);
  };

  // Refresh workspace files
  const handleRefreshWorkspace = () => {
    const current = loadWorkspaceFiles();
    setFiles(current);
    setAiStatus('Workspace refreshed');
    setTimeout(() => setAiStatus(null), 2000);
  };

  // Delete single file with clear in-app confirmation
  const handleDeleteFile = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetFile = files.find((f) => f.id === id);
    const fileName = targetFile?.name || 'this file';

    setDeleteConfirmTarget({
      type: 'file',
      id,
      name: fileName
    });
  };

  // Delete folder and all its files with clear in-app confirmation
  const handleDeleteFolder = (folderPath: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetFiles = files.filter(
      (f) => f.path === folderPath || f.path.startsWith(folderPath + '/')
    );
    if (targetFiles.length === 0) return;

    setDeleteConfirmTarget({
      type: 'folder',
      path: folderPath,
      name: folderPath,
      count: targetFiles.length
    });
  };

  // Clear all workspace files with in-app confirmation
  const handleClearAll = () => {
    if (files.length === 0) return;
    setDeleteConfirmTarget({
      type: 'all',
      name: 'All Workspace Files',
      count: files.length
    });
  };

  // Execute confirmed deletion safely and refresh UI instantly
  const handleExecuteConfirmedDelete = () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget.type === 'file' && deleteConfirmTarget.id) {
      const remaining = deleteWorkspaceFile(deleteConfirmTarget.id);
      setFiles(remaining);
      if (selectedFileId === deleteConfirmTarget.id) {
        const next = remaining[0]?.id || '';
        setSelectedFileId(next);
        if (!next) {
          setMobileView('files');
        }
      }
      setAiStatus(`Deleted "${deleteConfirmTarget.name}"`);
    } else if (deleteConfirmTarget.type === 'folder' && deleteConfirmTarget.path) {
      const remaining = deleteWorkspaceFolder(deleteConfirmTarget.path);
      setFiles(remaining);
      if (!remaining.some((f) => f.id === selectedFileId)) {
        const next = remaining[0]?.id || '';
        setSelectedFileId(next);
        if (!next) {
          setMobileView('files');
        }
      }
      setAiStatus(`Deleted folder "${deleteConfirmTarget.path}"`);
    } else if (deleteConfirmTarget.type === 'all') {
      clearAllWorkspaceFiles();
      setFiles([]);
      setSelectedFileId('');
      setMobileView('files');
      setAiStatus('All files cleared');
    }

    setDeleteConfirmTarget(null);
    setTimeout(() => setAiStatus(null), 3000);
  };

  // Select file and switch to editor on mobile
  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    setMobileView('editor');
  };

  // Copy code
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to pick file icon
  const renderFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.zip') || lower.endsWith('.rar')) {
      return <Archive className="w-4 h-4 text-amber-300 shrink-0" />;
    }
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.svg') || lower.endsWith('.webp')) {
      return <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (lower.endsWith('.json')) {
      return <FileCode className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (lower.endsWith('.css') || lower.endsWith('.scss')) {
      return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    if (lower.endsWith('.html')) {
      return <FileCode className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    if (lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.jsx')) {
      return <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
    return <FileIcon className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  // Is active file an image?
  const isSelectedImage =
    selectedFile &&
    (selectedFile.name.toLowerCase().endsWith('.png') ||
      selectedFile.name.toLowerCase().endsWith('.jpg') ||
      selectedFile.name.toLowerCase().endsWith('.jpeg') ||
      selectedFile.name.toLowerCase().endsWith('.webp') ||
      selectedFile.name.toLowerCase().endsWith('.svg') ||
      selectedFile.name.toLowerCase().endsWith('.ico'));

  if (!isOpen) return null;

  return (
    <div
      id="file-workspace-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      <div
        className="w-full max-w-7xl h-full sm:h-[92vh] bg-[#111622] border-0 sm:border border-slate-700/80 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Clean, Easy, and Clear */}
        <div className="px-4 py-3 bg-[#151b2a] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold shrink-0">
              <FolderTree className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                File Manager & Workspace
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Auto-saved
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download Full ZIP */}
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => exportAllFilesAsZip(files)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Download all files as a ZIP archive"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ZIP</span>
              </button>
            )}

            {/* AI History Button */}
            {aiHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  isHistoryOpen
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="AI Edit History"
              >
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">History</span>
                <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded-full border border-slate-700">
                  {aiHistory.length}
                </span>
              </button>
            )}

            {/* Prominent Cancel / Close Button */}
            <button
              id="close-file-workspace-btn"
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 active:bg-rose-700 text-slate-200 hover:text-white border border-slate-700 hover:border-rose-500 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="Cancel & Close File Manager (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Cancel / Close</span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher (Visible on small screens) */}
        <div className="md:hidden flex items-center bg-[#0e131e] border-b border-slate-800 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/30 transition-all min-h-[44px] cursor-pointer shrink-0"
            title="Cancel & Close File Manager"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('files')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
              mobileView === 'files'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Folder className="w-4 h-4 text-amber-400" />
            <span>Files ({files.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileView('editor')}
            disabled={!selectedFile}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
              mobileView === 'editor'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 disabled:opacity-40'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span className="truncate max-w-[140px]">
              {selectedFile ? selectedFile.name : 'Editor'}
            </span>
          </button>
        </div>

        {/* Notification / Status Banner */}
        {aiStatus && (
          <div className="px-4 py-2 bg-indigo-950/90 border-b border-indigo-800/80 text-indigo-200 text-xs flex items-center justify-between animate-fadeIn shrink-0">
            <div className="flex items-center gap-2 truncate">
              {isAiEditing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="truncate">{aiStatus}</span>
            </div>
            <button onClick={() => setAiStatus(null)} className="text-slate-400 hover:text-white p-0.5 ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Workspace Body */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Drag Overlay Notice */}
          {isDraggingOver && (
            <div className="absolute inset-0 z-50 bg-[#0e131f]/95 border-2 border-dashed border-indigo-400 flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
              <FolderUp className="w-12 h-12 text-indigo-400 animate-bounce" />
              <p className="text-base font-bold text-white">Drop your folder here</p>
              <p className="text-xs text-indigo-300">
                All nested files and subfolders will be loaded cleanly.
              </p>
            </div>
          )}

          {/* Left Column: File Explorer (Professional VS Code Style - Matching Image 2) */}
          <div
            className={`${
              mobileView === 'files' ? 'flex' : 'hidden'
            } md:flex w-full md:w-80 lg:w-96 border-r border-slate-800 bg-[#0d111a] flex-col shrink-0 overflow-hidden`}
          >
            {/* Hidden file and folder inputs for upload */}
            <input
              ref={folderInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFileInputChange(e.target.files);
                e.target.value = '';
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFileInputChange(e.target.files);
                e.target.value = '';
              }}
            />

            {/* VS Code Tree View Component */}
            <div className="flex-1 overflow-hidden">
              <VsCodeFileTree
                files={files}
                selectedFileId={selectedFileId}
                onSelectFile={(id) => handleSelectFile(id)}
                onDeleteFile={(id, e) => handleDeleteFile(id, e)}
                onDeleteFolder={(path, e) => handleDeleteFolder(path, e)}
                onRenameFile={(file) => {
                  handleSelectFile(file.id);
                  setIsRenamingPath(true);
                }}
                onCreateFile={(path) => handleCreateFileFromTree(path)}
                onRefresh={handleRefreshWorkspace}
                onUploadFolderClick={handleUploadFolderClick}
                onUploadFilesClick={() => fileInputRef.current?.click()}
                onDownloadFile={(file) => downloadWorkspaceFile(file)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>

            {/* Footer Summary with Clear All and Close */}
            <div className="px-3 py-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between shrink-0 bg-[#0a0e17]">
              <span>{files.length} {files.length === 1 ? 'file' : 'files'}</span>
              <div className="flex items-center gap-2">
                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-rose-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                    title="Delete all files from workspace"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Close File Manager"
                >
                  <X className="w-3 h-3" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Code Editor (Clean, Focused, Productive) */}
          <div
            className={`${
              mobileView === 'editor' ? 'flex' : 'hidden'
            } md:flex flex-1 flex-col bg-[#0e131f] overflow-hidden min-w-0`}
          >
            {selectedFile ? (
              <>
                {/* Editor Header: File name, path, and actions */}
                <div className="px-3 sm:px-5 py-2.5 bg-[#141b2a] border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Back to Files on Mobile */}
                    <button
                      type="button"
                      onClick={() => setMobileView('files')}
                      className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white text-xs font-semibold border border-slate-700 cursor-pointer shrink-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Files</span>
                    </button>

                    {/* File Path / Renaming */}
                    {isRenamingPath ? (
                      <div className="flex items-center gap-1.5 flex-1 max-w-md">
                        <input
                          type="text"
                          value={editPathInput}
                          onChange={(e) => setEditPathInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRenamedPath()}
                          className="flex-1 bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none"
                        />
                        <button
                          onClick={handleSaveRenamedPath}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsRenamingPath(false)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-sm sm:text-base text-white truncate">
                          {selectedFile.name}
                        </span>
                        <span className="text-xs text-slate-400 font-mono hidden sm:inline truncate">
                          {selectedFile.path}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsRenamingPath(true)}
                          className="p-1 text-slate-500 hover:text-slate-300 rounded shrink-0"
                          title="Rename file path"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions: Delete, Download, Copy, Close */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                      title="Close File Manager"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Close</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                      title="Copy code"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadWorkspaceFile(selectedFile)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                      title="Download this file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Save</span>
                    </button>

                    {/* Prominent Red Delete File Button in Header */}
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(selectedFile.id)}
                      className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-xs font-semibold transition-colors cursor-pointer"
                      title="Delete this file"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* AI Edit Command Bar - Clean & Simple */}
                <div className="p-2.5 sm:p-3 bg-[#111724] border-b border-slate-800 shrink-0">
                  <form onSubmit={handleAiEditSubmit} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Sparkles className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={`Ask AI to edit ${selectedFile.name}...`}
                        disabled={isAiEditing}
                        className="w-full bg-[#161d2d] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isAiEditing || !aiPrompt.trim()}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                    >
                      {isAiEditing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Editing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Edit with AI</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Main Code Editor or Image Viewer */}
                <div className="flex-1 flex overflow-hidden">
                  {isSelectedImage ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0a0f1c] overflow-auto">
                      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center gap-3 max-w-sm w-full">
                        <div className="w-full h-48 flex items-center justify-center rounded-xl bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] p-4 overflow-hidden border border-slate-800">
                          <img
                            src={selectedFile.content}
                            alt={selectedFile.name}
                            className="max-h-40 max-w-full object-contain rounded"
                          />
                        </div>
                        <div className="w-full text-center">
                          <p className="font-bold text-sm text-white">{selectedFile.name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedFile.path}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 relative flex overflow-hidden">
                      {/* Line numbers gutter */}
                      <div className="w-9 sm:w-11 py-3 bg-[#0d111a] text-right pr-2 sm:pr-2.5 select-none text-[11px] font-mono text-slate-600 border-r border-slate-800 overflow-hidden shrink-0">
                        {activeContent.split('\n').map((_, i) => (
                          <div key={i} className="leading-6">
                            {i + 1}
                          </div>
                        ))}
                      </div>

                      {/* Code Textarea with auto-saving */}
                      <textarea
                        value={activeContent}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        spellCheck={false}
                        className="flex-1 p-3 bg-[#0e131f] text-slate-100 font-mono text-xs sm:text-sm leading-6 resize-none focus:outline-none overflow-y-auto whitespace-pre tab-4"
                        placeholder="File content..."
                      />
                    </div>
                  )}

                  {/* AI Edit History Slide-over Drawer */}
                  {isHistoryOpen && (
                    <div className="w-72 sm:w-80 border-l border-slate-800 bg-[#0d111a] p-4 flex flex-col shrink-0 animate-fadeIn">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <History className="w-4 h-4 text-indigo-400" />
                          <span>AI Edit History</span>
                        </div>
                        <button
                          onClick={() => setIsHistoryOpen(false)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
                        {aiHistory.length === 0 ? (
                          <div className="py-8 text-center text-slate-500 text-xs">
                            <Clock className="w-6 h-6 mx-auto mb-2 opacity-50 text-slate-600" />
                            <p className="font-semibold text-slate-400">No edits yet</p>
                          </div>
                        ) : (
                          aiHistory.map((hist) => (
                            <div
                              key={hist.id}
                              className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs"
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span className="truncate font-mono text-indigo-300">
                                  {hist.filePath}
                                </span>
                                <span>
                                  {new Date(hist.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-200 font-medium line-clamp-2">
                                "{hist.prompt}"
                              </p>
                              <button
                                type="button"
                                onClick={() => handleRestoreHistory(hist)}
                                className="w-full mt-1 py-1 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <FileCode className="w-12 h-12 text-slate-600 mb-3 opacity-60" />
                <p className="text-base font-bold text-slate-300">Select a file to view or edit</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Choose any file from the list on the left, or upload a folder.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safe In-App Delete Confirmation Modal (Iframe-safe, zero window.confirm reliance) */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white">
                  {deleteConfirmTarget.type === 'file'
                    ? 'Delete File'
                    : deleteConfirmTarget.type === 'folder'
                    ? 'Delete Folder'
                    : 'Clear Workspace'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {deleteConfirmTarget.type === 'file' && `Are you sure you want to delete "${deleteConfirmTarget.name}"?`}
                  {deleteConfirmTarget.type === 'folder' && `Delete folder "${deleteConfirmTarget.name}" and all ${deleteConfirmTarget.count} files inside?`}
                  {deleteConfirmTarget.type === 'all' && `Delete all ${deleteConfirmTarget.count} files from workspace?`}
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-xs text-rose-300 space-y-1">
              <p className="font-semibold">⚠️ Irreversible Action</p>
              <p className="text-rose-300/80 text-[11px]">
                This item will be permanently removed from your workspace memory.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
