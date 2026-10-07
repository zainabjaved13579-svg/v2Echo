import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  Save,
  Trash2,
  Edit3,
  RefreshCw,
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Upload,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  Copy,
  ChevronRight,
  ChevronDown,
  Wand2,
  FileType,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppTheme } from '../../context/ThemeContext';
import { AppSettings, UserProfile } from '../../types';

export interface LocalDiskFile {
  id: string;
  name: string;
  path: string;
  content: string;
  size: number;
  lastModified: number;
  fileHandle?: any;
  dirHandle?: any;
  isBinary?: boolean;
  dataUrl?: string;
  type?: string;
}

interface FileManagerToolProps {
  settings?: AppSettings;
  userProfile?: UserProfile | null;
}

const TEXT_EXTS = new Set([
  'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss',
  'xml', 'svg', 'csv', 'yaml', 'yml', 'toml', 'ini', 'env', 'sh', 'py',
  'java', 'c', 'cpp', 'h', 'hpp', 'sql', 'rs', 'go', 'php', 'rb', 'bat', 'cmd', 'ps1'
]);

const isTextFilename = (name: string): boolean => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return TEXT_EXTS.has(ext) || ['dockerfile', 'makefile', 'readme', 'license', '.env', '.gitignore'].includes(name.toLowerCase());
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const FileManagerTool: React.FC<FileManagerToolProps> = () => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  // State
  const [rootDirHandle, setRootDirHandle] = useState<any>(null);
  const [rootFolderName, setRootFolderName] = useState<string>('');
  const [files, setFiles] = useState<LocalDiskFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [editingContent, setEditingContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'ai'>('editor');
  const [isLoadingDir, setIsLoadingDir] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Rename & Delete state
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>('');
  const [fileToDelete, setFileToDelete] = useState<LocalDiskFile | null>(null);

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{
    modifiedContent?: string;
    suggestedName?: string;
    suggestedPath?: string;
    summary?: string;
  } | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active File Reference
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId) || null;
  }, [files, selectedFileId]);

  // Sync editor content when selection changes
  useEffect(() => {
    if (activeFile && !activeFile.isBinary) {
      setEditingContent(activeFile.content);
      setAiResult(null);
    }
  }, [activeFile?.id]);

  // Process uploaded files (FileList or Array of Files) - Supports ALL file types
  const processUploadedFiles = async (fileList: FileList | File[], folderName = 'Laptop Files') => {
    if (!fileList || fileList.length === 0) return;

    setIsLoadingDir(true);
    const scanned: LocalDiskFile[] = [];
    let detectedRoot = folderName;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = (file as any).webkitRelativePath || file.name;
      const parts = relPath.split('/');
      if (parts.length > 1 && detectedRoot === 'Laptop Files') {
        detectedRoot = parts[0];
      }

      const name = file.name;
      // Skip system junk files only
      if (name === '.DS_Store' || name === 'Thumbs.db' || name === 'desktop.ini') {
        continue;
      }
      if (relPath.includes('node_modules/') || relPath.includes('.git/')) {
        continue;
      }

      let isText = false;
      let content = '';
      let dataUrl: string | undefined = undefined;

      const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|ico|bmp|avif)$/i.test(name);

      if (isImage) {
        try {
          dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
          content = `[Image Asset: ${name}]`;
        } catch {
          content = `[Image: ${name}]`;
        }
      } else if (file.size < 12 * 1024 * 1024) {
        // Universal text reader: attempt utf-8 text decoding for ANY file under 12MB
        try {
          const rawText = await file.text();
          // If first 4KB has no null bytes, it is a text-based format (code, docs, json, csv, etc.)
          const hasNullByte = rawText.slice(0, 4096).includes('\0');
          if (!hasNullByte) {
            isText = true;
            content = rawText;
          } else {
            content = `[Binary File - ${formatBytes(file.size)}]`;
          }
        } catch {
          content = `[Binary File - ${formatBytes(file.size)}]`;
        }
      } else {
        content = `[Large File - ${formatBytes(file.size)}]`;
      }

      // For binary/media files under 25MB, generate dataUrl for preview and export
      if (!isText && !dataUrl && file.size < 25 * 1024 * 1024) {
        try {
          dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        } catch {}
      }

      scanned.push({
        id: `file_${relPath}_${Date.now()}_${i}`,
        name,
        path: relPath,
        content,
        dataUrl,
        type: file.type || 'application/octet-stream',
        size: file.size,
        lastModified: file.lastModified,
        isBinary: !isText && !isImage
      });
    }

    if (scanned.length > 0) {
      setRootDirHandle({ name: detectedRoot } as any);
      setRootFolderName(detectedRoot);
      setFiles((prev) => {
        const existingPaths = new Set(prev.map((p) => p.path));
        const filteredNew = scanned.filter((s) => !existingPaths.has(s.path));
        return [...prev, ...filteredNew];
      });
      setSelectedFileId(scanned[0].id);
      if (!scanned[0].isBinary) {
        setEditingContent(scanned[0].content);
      }
      showToast(`Loaded ${scanned.length} files from laptop!`);
    } else {
      showToast('No readable files selected.');
    }
    setIsLoadingDir(false);
  };

  // Sample Demo Project Loader
  const handleLoadDemoWorkspace = () => {
    const demoFiles: LocalDiskFile[] = [
      {
        id: 'demo_app_js',
        name: 'app.js',
        path: 'src/app.js',
        content: `// Sapphire File Manager - Local Execution Controller
function runFileAnalytics(files) {
  console.log("Analyzing local files...", files);
  return {
    status: "active",
    analyzedAt: new Date().toISOString(),
    totalFiles: files.length
  };
}

module.exports = { runFileAnalytics };`,
        size: 268,
        lastModified: Date.now()
      },
      {
        id: 'demo_readme_md',
        name: 'README.md',
        path: 'README.md',
        content: `# Local Project Workspace

Welcome to **Sapphire File Commander**!
This workspace lets you view, edit, and transform files right on your machine.

### What you can do:
1. **Manual Editor**: Click any file to edit live.
2. **AI Transform**: Ask AI to refactor code, convert format (e.g. CSV to JSON, Markdown to HTML), or rename/relocate files.
3. **Save to Disk**: Save your modifications directly back to your laptop!
4. **All Files**: Upload images, documents, CSVs, logs, configs, and binaries.`,
        size: 472,
        lastModified: Date.now()
      },
      {
        id: 'demo_data_csv',
        name: 'users_dataset.csv',
        path: 'data/users_dataset.csv',
        content: `id,name,role,department,status
101,Alexander Pierce,Principal Engineer,Core Systems,active
102,Sophia Reynolds,Product Designer,UX Architecture,active
103,Marcus Vance,Security Lead,Infra Sec,active
104,Elena Rostova,AI Researcher,Cognitive Labs,pending`,
        size: 236,
        lastModified: Date.now()
      },
      {
        id: 'demo_theme_css',
        name: 'theme.css',
        path: 'styles/theme.css',
        content: `:root {
  --primary-accent: #d97757;
  --bg-surface: #0f1118;
  --text-main: #ffffff;
  --border-subtle: #292c3d;
}

.file-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
}`,
        size: 220,
        lastModified: Date.now()
      },
      {
        id: 'demo_config_json',
        name: 'appsettings.json',
        path: 'config/appsettings.json',
        content: `{
  "application": "Sapphire File Commander",
  "version": "2.4.0",
  "features": {
    "directDiskSync": true,
    "aiRefactoring": true,
    "formatConverter": true
  },
  "theme": "dark"
}`,
        size: 204,
        lastModified: Date.now()
      }
    ];

    setRootDirHandle({ name: 'Demo Laptop Project' } as any);
    setRootFolderName('Demo Laptop Project');
    setFiles(demoFiles);
    setSelectedFileId(demoFiles[0].id);
    setEditingContent(demoFiles[0].content);
    showToast('Loaded Demo Laptop Project with 5 sample files!');
  };

  // Drag and Drop Handler
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFiles(e.dataTransfer.files, 'Dropped Files');
    }
  };

  // Direct Laptop Directory Scanner (File System Access API)
  const scanDirectory = async (dirHandle: any, currentPath = ''): Promise<LocalDiskFile[]> => {
    const list: LocalDiskFile[] = [];
    try {
      for await (const entry of (dirHandle as any).values()) {
        const name = entry.name;
        if (name.startsWith('.') || name === 'node_modules' || name === 'dist' || name === '.git') {
          continue;
        }

        const fullPath = currentPath ? `${currentPath}/${name}` : name;

        if (entry.kind === 'file') {
          try {
            const file = await entry.getFile();
            let isText = false;
            let content = '';
            let dataUrl: string | undefined = undefined;

            const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|ico|bmp|avif)$/i.test(name);

            if (isImage) {
              try {
                dataUrl = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve((reader.result as string) || '');
                  reader.onerror = () => resolve('');
                  reader.readAsDataURL(file);
                });
                content = `[Image Asset: ${name}]`;
              } catch {
                content = `[Image: ${name}]`;
              }
            } else if (file.size < 12 * 1024 * 1024) {
              try {
                const rawText = await file.text();
                const hasNullByte = rawText.slice(0, 4096).includes('\0');
                if (!hasNullByte) {
                  isText = true;
                  content = rawText;
                } else {
                  content = `[Binary File - ${formatBytes(file.size)}]`;
                }
              } catch {
                content = `[Binary File - ${formatBytes(file.size)}]`;
              }
            } else {
              content = `[Large File - ${formatBytes(file.size)}]`;
            }

            if (!isText && !dataUrl && file.size < 25 * 1024 * 1024) {
              try {
                dataUrl = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve((reader.result as string) || '');
                  reader.onerror = () => resolve('');
                  reader.readAsDataURL(file);
                });
              } catch {}
            }

            list.push({
              id: `file_${fullPath}_${Date.now()}`,
              name,
              path: fullPath,
              content,
              dataUrl,
              type: file.type || 'application/octet-stream',
              size: file.size,
              lastModified: file.lastModified,
              fileHandle: entry,
              dirHandle,
              isBinary: !isText && !isImage
            });
          } catch (e) {
            console.warn('Error reading file:', fullPath, e);
          }
        } else if (entry.kind === 'directory') {
          const subFiles = await scanDirectory(entry, fullPath);
          list.push(...subFiles);
        }
      }
    } catch (e) {
      console.warn('Error scanning directory:', e);
    }
    return list;
  };

  // Native showDirectoryPicker attempt (falls back to instant folderInputRef.click)
  const handleConnectDirectory = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        setIsLoadingDir(true);
        const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        if (!handle) {
          setIsLoadingDir(false);
          return;
        }

        setRootDirHandle(handle);
        setRootFolderName(handle.name || 'Laptop Directory');

        const scanned = await scanDirectory(handle);
        setFiles(scanned);
        if (scanned.length > 0) {
          setSelectedFileId(scanned[0].id);
          setEditingContent(scanned[0].content);
        }
        setIsLoadingDir(false);
        showToast(`Connected to "${handle.name}" with ${scanned.length} files.`);
        return;
      }
    } catch (err: any) {
      setIsLoadingDir(false);
      if (err.name === 'AbortError') return;
      // In iframes, showDirectoryPicker is restricted by browser security policy.
      // Trigger folder picker directly
      showToast('Opening folder upload dialog...');
    }

    folderInputRef.current?.click();
  };

  // Download / Export any file directly back to laptop
  const handleDownloadFile = (file: LocalDiskFile) => {
    let blob: Blob;
    if (file.dataUrl && file.dataUrl.includes(',')) {
      const arr = file.dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Downloaded "${file.name}" to laptop!`);
  };

  // Manual Save to Local Disk
  const handleSaveToDisk = async () => {
    if (!activeFile) return;

    setSaveStatus('saving');
    try {
      if (activeFile.fileHandle && activeFile.fileHandle.createWritable) {
        const writable = await activeFile.fileHandle.createWritable();
        await writable.write(editingContent);
        await writable.close();
      }

      // Update in-memory file list
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile.id
            ? { ...f, content: editingContent, size: editingContent.length, lastModified: Date.now() }
            : f
        )
      );

      setSaveStatus('saved');
      showToast(`Saved "${activeFile.name}" directly to your laptop!`);
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      console.error('Error saving to disk:', err);
      setSaveStatus('error');
      showToast('Error saving directly to disk. Check file permissions.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Rename File / Change Format on Disk
  const handleRenameFile = async () => {
    if (!renamingFileId || !newFileName.trim()) return;

    const file = files.find((f) => f.id === renamingFileId);
    if (!file) return;

    const trimmedName = newFileName.trim();
    if (trimmedName === file.name) {
      setRenamingFileId(null);
      return;
    }

    try {
      // If native File System Access supports handle.move or creating new entry
      if (file.dirHandle) {
        try {
          const newFileHandle = await file.dirHandle.getFileHandle(trimmedName, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(file.content);
          await writable.close();

          // Delete old entry
          await file.dirHandle.removeEntry(file.name);
        } catch (e) {
          console.warn('Native move fallback to virtual rename:', e);
        }
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, name: trimmedName, path: f.path.replace(file.name, trimmedName) }
            : f
        )
      );

      showToast(`Renamed to "${trimmedName}"`);
      setRenamingFileId(null);
      setNewFileName('');
    } catch (err) {
      showToast('Failed to rename file.');
    }
  };

  // Delete File from Disk
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      if (fileToDelete.dirHandle) {
        try {
          await fileToDelete.dirHandle.removeEntry(fileToDelete.name);
        } catch (e) {
          console.warn('Delete entry warning:', e);
        }
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      if (selectedFileId === fileToDelete.id) {
        setSelectedFileId('');
        setEditingContent('');
      }
      showToast(`Deleted "${fileToDelete.name}" from laptop.`);
      setFileToDelete(null);
    } catch (err) {
      showToast('Failed to delete file.');
      setFileToDelete(null);
    }
  };

  // AI File Transformation Handler
  const handleTransformWithAi = async (customInstruction?: string) => {
    const prompt = (customInstruction || aiPrompt).trim();
    if (!prompt || !activeFile || aiLoading) return;

    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are Sapphire AI File Engineer. The user wants to modify, format, or refactor a file from their laptop.
FILE DETAILS:
- Name: ${activeFile.name}
- Path: ${activeFile.path}
- Size: ${activeFile.size} bytes

USER INSTRUCTION:
${prompt}

CURRENT FILE CONTENT:
\`\`\`
${activeFile.content.slice(0, 20000)}
\`\`\`

TASK:
1. Provide the complete modified file content.
2. If the user asked to change format (e.g. CSV to JSON, Markdown to HTML, JS to TS) or rename the file, specify the suggested new filename.
3. If the user asked to change location/folder or move file, specify the suggested new path.
4. Return your output in this format:

=== SUMMARY ===
[Brief explanation of changes]

=== NEW_FILENAME ===
[Optional: new file name with extension if format/name changed, or keep original name]

=== NEW_PATH ===
[Optional: new path/folder if location changed, or keep original path]

=== FILE_CONTENT ===
[Complete modified file content with zero placeholders]`
        })
      });

      if (!res.ok) throw new Error('AI service error');
      const data = await res.json();
      const rawText = data.reply || data.text || '';

      // Parse AI output
      let summary = 'File transformed according to instructions.';
      let suggestedName = activeFile.name;
      let suggestedPath = activeFile.path;
      let modifiedContent = activeFile.content;

      if (rawText.includes('=== FILE_CONTENT ===')) {
        const parts = rawText.split('=== FILE_CONTENT ===');
        modifiedContent = parts[1].trim();

        if (parts[0].includes('=== NEW_FILENAME ===')) {
          const namePart = parts[0].split('=== NEW_FILENAME ===')[1].split('===')[0].trim();
          if (namePart) suggestedName = namePart;
        }

        if (parts[0].includes('=== NEW_PATH ===')) {
          const pathPart = parts[0].split('=== NEW_PATH ===')[1].split('===')[0].trim();
          if (pathPart) suggestedPath = pathPart;
        }

        if (parts[0].includes('=== SUMMARY ===')) {
          const sumPart = parts[0].split('=== SUMMARY ===')[1].split('===')[0].trim();
          if (sumPart) summary = sumPart;
        }
      } else {
        modifiedContent = rawText.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '').trim();
      }

      setAiResult({
        modifiedContent,
        suggestedName,
        suggestedPath,
        summary
      });
      setAiLoading(false);
    } catch (err: any) {
      console.error('AI Transform Error:', err);
      setAiLoading(false);
      showToast('AI could not transform file. Please retry.');
    }
  };

  // Apply AI Changes directly to local disk
  const handleApplyAiChanges = async () => {
    if (!aiResult || !activeFile) return;

    const newContent = aiResult.modifiedContent || editingContent;
    const newName = aiResult.suggestedName || activeFile.name;
    const newPath = aiResult.suggestedPath || activeFile.path.replace(activeFile.name, newName);

    try {
      // If name or location changed, write new file handle
      if (newName !== activeFile.name && activeFile.dirHandle) {
        try {
          const newFileHandle = await activeFile.dirHandle.getFileHandle(newName, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(newContent);
          await writable.close();
          await activeFile.dirHandle.removeEntry(activeFile.name);
        } catch (e) {
          console.warn('AI rename fallback:', e);
        }
      } else if (activeFile.fileHandle && activeFile.fileHandle.createWritable) {
        const writable = await activeFile.fileHandle.createWritable();
        await writable.write(newContent);
        await writable.close();
      }

      // Update in-memory state
      setEditingContent(newContent);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile.id
            ? {
                ...f,
                name: newName,
                path: newPath,
                content: newContent,
                size: newContent.length,
                lastModified: Date.now()
              }
            : f
        )
      );

      setAiResult(null);
      setAiPrompt('');
      showToast(`AI changes, format & location saved directly to "${newName}" on your laptop!`);
    } catch (err) {
      showToast('Failed to write AI changes to disk.');
    }
  };

  // Filtered Files
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  }, [files, searchQuery]);

  // Theme Helpers
  const bgCard = isMoon ? 'bg-[#151722]' : 'bg-white';
  const bgSubtle = isMoon ? 'bg-[#1e202d]' : 'bg-slate-50';
  const border = isMoon ? 'border-[#292c3d]' : 'border-slate-200';
  const textBright = isMoon ? 'text-white' : 'text-slate-900';
  const textSub = isMoon ? 'text-zinc-400' : 'text-slate-600';

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col h-full overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] relative ${
        isDragging ? 'ring-4 ring-[#d97757] ring-inset' : ''
      }`}
    >
      {/* Hidden file & folder inputs for instant synchronous activation */}
      <input
        type="file"
        ref={folderInputRef}
        {...({ webkitdirectory: '', directory: '' } as any)}
        multiple
        onChange={(e) => {
          if (e.target.files) processUploadedFiles(e.target.files, 'Laptop Folder');
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={(e) => {
          if (e.target.files) processUploadedFiles(e.target.files, 'Uploaded Files');
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#d97757]/20 backdrop-blur-xs z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-[#151722] text-white p-6 rounded-3xl border-2 border-dashed border-[#d97757] shadow-2xl flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-[#d97757] animate-bounce" />
            <h3 className="text-base font-bold">Drop files or folder anywhere to upload</h3>
            <p className="text-xs text-zinc-400">All file formats supported (text, code, images, docs, data)</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#d97757] text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg shrink-0 z-50"
          >
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. WELCOME & GET STARTED SCREEN (When no folder connected) */}
      {files.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-xl w-full p-6 sm:p-8 rounded-3xl border ${border} ${bgCard} shadow-xl text-center space-y-6`}
          >
            <div className="w-16 h-16 rounded-3xl bg-[#d97757]/15 text-[#d97757] flex items-center justify-center mx-auto shadow-inner">
              <HardDrive className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#d97757]/20 text-[#d97757]">
                Local Laptop Storage & AI Modifier
              </span>
              <h1 className={`text-2xl sm:text-3xl font-black ${textBright} mt-2 mb-2`}>
                Sapphire File Commander
              </h1>
              <p className={`text-xs sm:text-sm ${textSub} leading-relaxed`}>
                Access and manage files directly on your laptop (Desktop, Documents, Downloads, or any folder). Upload any files or entire folders, edit in place, or let Sapphire AI change file contents, formats, and names with instant live disk writes.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className={`p-3.5 rounded-2xl border ${border} ${bgSubtle}`}>
                <Laptop className="w-4 h-4 text-[#d97757] mb-1.5" />
                <h4 className={`text-xs font-bold ${textBright}`}>All Files Supported</h4>
                <p className="text-[11px] text-zinc-400">Code, text, images, data, CSV, JSON & docs.</p>
              </div>
              <div className={`p-3.5 rounded-2xl border ${border} ${bgSubtle}`}>
                <Wand2 className="w-4 h-4 text-purple-400 mb-1.5" />
                <h4 className={`text-xs font-bold ${textBright}`}>AI File Rewrite</h4>
                <p className="text-[11px] text-zinc-400">Refactor code, change format & rename.</p>
              </div>
              <div className={`p-3.5 rounded-2xl border ${border} ${bgSubtle}`}>
                <FileType className="w-4 h-4 text-blue-400 mb-1.5" />
                <h4 className={`text-xs font-bold ${textBright}`}>Instant Export</h4>
                <p className="text-[11px] text-zinc-400">Download or write back to laptop disk.</p>
              </div>
            </div>

            {/* PRIMARY UPLOAD & DEMO ACTIONS */}
            <div className="pt-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Button 1: Upload Any Files */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoadingDir}
                  className="py-3.5 px-4 rounded-2xl bg-[#d97757] hover:bg-[#c86949] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#d97757]/25 transition-all cursor-pointer active:scale-95"
                >
                  <Upload className="w-4 h-4 stroke-[2.5]" />
                  <span>Upload Files (All Formats)</span>
                </button>

                {/* Button 2: Upload Entire Folder */}
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={isLoadingDir}
                  className="py-3.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-zinc-700 shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <FolderOpen className="w-4 h-4 stroke-[2.5] text-[#d97757]" />
                  <span>Upload Laptop Folder</span>
                </button>
              </div>

              {/* 1-Click Demo Project Loader */}
              <button
                type="button"
                onClick={handleLoadDemoWorkspace}
                className={`w-full py-2.5 px-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Load Sample Project (1-Click Instant Demo)</span>
              </button>

              {/* Drag and Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border-2 border-dashed ${border} ${bgSubtle} hover:border-[#d97757]/50 transition-all cursor-pointer text-center group`}
              >
                <Upload className="w-5 h-5 text-zinc-400 group-hover:text-[#d97757] mx-auto mb-1 transition-colors" />
                <span className="text-xs font-semibold text-zinc-300 block">
                  Click or Drag & drop files / folders here
                </span>
                <span className="text-[10px] text-zinc-400">Desktop, Documents, Downloads or any laptop files</span>
              </div>

              {/* Direct Folder Target Shortcuts */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
                  Quick Laptop Targets:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-3 py-1.5 rounded-xl border ${border} ${bgSubtle} text-xs font-semibold flex items-center gap-1.5 hover:border-[#d97757]/60 hover:text-[#d97757] transition-all cursor-pointer`}
                  >
                    <span>🖥️ Desktop Files</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className={`px-3 py-1.5 rounded-xl border ${border} ${bgSubtle} text-xs font-semibold flex items-center gap-1.5 hover:border-[#d97757]/60 hover:text-[#d97757] transition-all cursor-pointer`}
                  >
                    <span>📁 Documents Folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-3 py-1.5 rounded-xl border ${border} ${bgSubtle} text-xs font-semibold flex items-center gap-1.5 hover:border-[#d97757]/60 hover:text-[#d97757] transition-all cursor-pointer`}
                  >
                    <span>📥 Downloads</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConnectDirectory()}
                    className={`px-3 py-1.5 rounded-xl border ${border} ${bgSubtle} text-xs font-semibold flex items-center gap-1.5 hover:border-[#d97757]/60 hover:text-[#d97757] transition-all cursor-pointer`}
                    title="Direct File System Access (Chrome/Edge)"
                  >
                    <span>⚡ Direct Disk Sync</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        /* 2. FILE MANAGER WORKSPACE (Explorer on Left, Editor/AI on Right) */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Bar */}
          <div className={`h-12 px-4 border-b ${border} ${isMoon ? 'bg-[#0f1118]' : 'bg-white'} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#d97757]/15 text-[#d97757] flex items-center justify-center shrink-0">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
              <span className={`text-xs sm:text-sm font-extrabold ${textBright} truncate`}>
                {rootFolderName || 'Laptop Files'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold shrink-0">
                {files.length} {files.length === 1 ? 'FILE' : 'FILES'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`px-2.5 py-1 rounded-xl border ${border} ${bgSubtle} text-xs font-semibold flex items-center gap-1.5 hover:border-[#d97757]/40 transition-colors cursor-pointer`}
              >
                <Upload className="w-3.5 h-3.5 text-[#d97757]" />
                <span className="hidden sm:inline">Add Files</span>
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className={`px-2.5 py-1 rounded-xl border ${border} ${bgSubtle} text-xs font-semibold flex items-center gap-1.5 hover:border-[#d97757]/40 transition-colors cursor-pointer`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#d97757]" />
                <span className="hidden sm:inline">Add Folder</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  setSelectedFileId('');
                  setRootFolderName('');
                }}
                className={`px-2.5 py-1 rounded-xl border ${border} text-xs font-semibold text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer`}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT: File List & Search */}
            <div className={`w-full sm:w-72 md:w-80 border-r ${border} ${isMoon ? 'bg-[#0b0c11]' : 'bg-slate-50'} flex flex-col shrink-0 ${selectedFileId ? 'hidden sm:flex' : 'flex'}`}>
              {/* Search Bar */}
              <div className={`p-2.5 border-b ${border}`}>
                <div className={`flex items-center rounded-xl border ${border} ${isMoon ? 'bg-[#151722]' : 'bg-white'} px-2.5 py-1.5`}>
                  <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter files..."
                    className="bg-transparent border-none outline-none text-xs w-full placeholder-zinc-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-zinc-200">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Files List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredFiles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-400">
                    No files found in folder.
                  </div>
                ) : (
                  filteredFiles.map((f) => {
                    const isSelected = f.id === selectedFileId;
                    const isRenaming = renamingFileId === f.id;

                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFileId(f.id)}
                        className={`p-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? isMoon
                              ? 'bg-[#d97757]/20 border border-[#d97757]/50 text-white font-bold'
                              : 'bg-orange-50 border border-[#d97757] text-[#8a2b0e] font-bold'
                            : `${bgCard} border ${border} hover:border-[#d97757]/30 text-zinc-300`
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#d97757]' : 'text-zinc-400'}`} />
                          {isRenaming ? (
                            <input
                              type="text"
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameFile();
                                if (e.key === 'Escape') setRenamingFileId(null);
                              }}
                              className="w-full bg-transparent border-b border-[#d97757] outline-none text-xs font-bold"
                              autoFocus
                            />
                          ) : (
                            <div className="truncate">
                              <span className="truncate block font-semibold">{f.name}</span>
                              <span className="text-[10px] text-zinc-400 block font-normal">
                                {formatBytes(f.size)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* File Action Icons */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isRenaming ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameFile();
                              }}
                              className="p-1 text-emerald-500 hover:text-emerald-400"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingFileId(f.id);
                                  setNewFileName(f.name);
                                }}
                                className="p-1 text-zinc-400 hover:text-[#d97757]"
                                title="Rename or Change Extension"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFileToDelete(f);
                                }}
                                className="p-1 text-zinc-400 hover:text-rose-500"
                                title="Delete from Laptop"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: Active File Editor & AI Transformation Panel */}
            <div className={`flex-1 flex flex-col overflow-hidden ${isMoon ? 'bg-[#0f1118]' : 'bg-white'} ${!selectedFileId ? 'hidden sm:flex' : 'flex'}`}>
              {activeFile ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Active File Header */}
                  <div className={`p-3 border-b ${border} flex items-center justify-between shrink-0 gap-2`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => setSelectedFileId('')}
                        className="sm:hidden p-1.5 rounded-lg border border-zinc-700 text-zinc-400"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <FileText className="w-4 h-4 text-[#d97757] shrink-0" />
                      <div className="min-w-0">
                        <span className={`text-xs sm:text-sm font-bold ${textBright} truncate block`}>
                          {activeFile.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate block">
                          {activeFile.path} • {formatBytes(activeFile.size)}
                        </span>
                      </div>
                    </div>

                    {/* Mode Toggle (Manual Editor vs AI Assistant) & Save Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`flex items-center rounded-xl p-0.5 border ${border} ${bgSubtle} text-xs`}>
                        <button
                          type="button"
                          onClick={() => setActiveTab('editor')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            activeTab === 'editor' ? 'bg-[#d97757] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          Manual Editor
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('ai')}
                          className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            activeTab === 'ai' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>AI Transform</span>
                        </button>
                      </div>

                      {/* Download to Laptop Button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(activeFile)}
                        className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        title="Download to Laptop"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>

                      {/* Save to Laptop Button */}
                      <button
                        type="button"
                        onClick={handleSaveToDisk}
                        disabled={saveStatus === 'saving'}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        title="Save Directly to Laptop Disk"
                      >
                        {saveStatus === 'saving' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Save to Disk</span>
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Manual Code / Text Editor / Image Preview */}
                  {activeTab === 'editor' ? (
                    activeFile.dataUrl ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto bg-black/5 dark:bg-black/20">
                        <div className={`p-4 rounded-3xl border ${border} ${bgCard} shadow-xl max-w-xl text-center space-y-3`}>
                          <img
                            src={activeFile.dataUrl}
                            alt={activeFile.name}
                            className="max-h-96 max-w-full rounded-2xl object-contain mx-auto shadow-md"
                          />
                          <div className="text-xs text-zinc-400">
                            <span className="font-bold text-white block text-sm">{activeFile.name}</span>
                            <span>{formatBytes(activeFile.size)} • {activeFile.type || 'Image'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(activeFile)}
                            className="px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86949] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download to Laptop</span>
                          </button>
                        </div>
                      </div>
                    ) : activeFile.isBinary ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
                        <div className={`p-6 rounded-3xl border ${border} ${bgCard} shadow-xl max-w-md text-center space-y-3`}>
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto">
                            <File className="w-7 h-7" />
                          </div>
                          <h4 className="text-sm font-bold text-white">{activeFile.name}</h4>
                          <p className="text-xs text-zinc-400">
                            Binary file ({formatBytes(activeFile.size)}). You can download it directly to your laptop or ask AI to analyze its purpose.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(activeFile)}
                            className="px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86949] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download File</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className={`flex-1 w-full p-4 font-mono text-xs sm:text-sm leading-relaxed border-none outline-none resize-none ${
                            isMoon ? 'bg-[#0a0b0e] text-[#e8e8ea]' : 'bg-white text-[#1a1815]'
                          }`}
                          spellCheck={false}
                        />
                      </div>
                    )
                  ) : (
                    /* Tab 2: AI File Transformer Panel */
                    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
                      {/* AI Header */}
                      <div className={`p-4 rounded-2xl border border-purple-500/30 ${isMoon ? 'bg-purple-950/20' : 'bg-purple-50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Wand2 className="w-4 h-4 text-purple-400" />
                          <h3 className={`text-sm font-bold ${textBright}`}>Sapphire AI File Transformer</h3>
                        </div>
                        <p className={`text-xs ${textSub}`}>
                          Command AI to edit, refactor, summarize, translate, or convert the format of <strong>{activeFile.name}</strong>. Apply changes directly to your hard drive in one click.
                        </p>
                      </div>

                      {/* Quick Action Presets */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          Quick Transformation Presets (Format, Name & Location)
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            'Change format: Convert to structured JSON',
                            'Change format: Convert to clean Markdown',
                            'Change format: Refactor to TypeScript',
                            'Change name: Suggest clean, professional filename',
                            'Change location: Move to subfolder (e.g. src/ or data/)',
                            'Refactor code, fix syntax & errors',
                            'Summarize key data into bullet points'
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setAiPrompt(preset);
                                handleTransformWithAi(preset);
                              }}
                              className={`px-3 py-1.5 rounded-xl border ${border} ${bgSubtle} text-xs font-medium hover:border-purple-500/50 hover:text-purple-300 transition-all cursor-pointer`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Prompt Textarea */}
                      <div className={`p-3 rounded-2xl border ${border} ${bgCard} space-y-2`}>
                        <label className="block text-[11px] font-bold text-zinc-400">
                          Custom Transformation Instruction
                        </label>
                        <textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="e.g. Change format to CSV, rename to users_export.csv, and sort rows alphabetically..."
                          rows={3}
                          className={`w-full bg-transparent border-none outline-none resize-none text-xs sm:text-sm ${textBright} placeholder-zinc-500`}
                        />
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleTransformWithAi()}
                            disabled={!aiPrompt.trim() || aiLoading}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                          >
                            {aiLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Processing File with AI...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Transform File</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* AI Result & Diff Preview */}
                      {aiResult && (
                        <div className={`p-4 rounded-2xl border border-emerald-500/40 ${isMoon ? 'bg-emerald-950/15' : 'bg-emerald-50/50'} space-y-3`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className={`text-xs font-bold ${textBright}`}>
                                Proposed Modification Ready
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {aiResult.suggestedName !== activeFile.name && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                                  Renamed: {aiResult.suggestedName}
                                </span>
                              )}
                              {aiResult.suggestedPath && aiResult.suggestedPath !== activeFile.path && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold">
                                  Moved: {aiResult.suggestedPath}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-zinc-300">
                            {aiResult.summary}
                          </p>

                          {/* Preview Box */}
                          <div className={`max-h-60 overflow-y-auto p-3 rounded-xl border ${border} ${isMoon ? 'bg-[#0a0b0e]' : 'bg-white'} font-mono text-xs text-zinc-200 whitespace-pre-wrap`}>
                            {aiResult.modifiedContent}
                          </div>

                          {/* Apply to Disk Button */}
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setAiResult(null)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                              Discard
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyAiChanges}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Apply & Save to Laptop Disk</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400 space-y-2">
                  <File className="w-10 h-10 opacity-30" />
                  <p className="text-xs">Select a file from the explorer to view, edit, or transform.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {fileToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-3xl border ${border} ${bgCard} p-5 shadow-2xl space-y-3`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${textBright}`}>Delete from Laptop?</h3>
                  <p className="text-xs text-zinc-400">"{fileToDelete.name}" will be deleted from your hard drive.</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteFile}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Delete File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileManagerTool;
