import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Image as ImageIcon,
  Archive,
  Download,
  Trash2,
  Edit3,
  Search,
  X,
  FilePlus,
  FolderPlus,
  RotateCcw,
  ChevronsDownUp,
  FolderUp,
  FileUp
} from 'lucide-react';
import { WorkspaceFile } from '../types';

export interface FileTreeNode {
  id: string;
  name: string; // e.g. "assets \ minecraft" or "bow.json"
  fullPath: string; // original directory path or file path
  isFolder: boolean;
  file?: WorkspaceFile;
  children: FileTreeNode[];
}

interface VsCodeFileTreeProps {
  files: WorkspaceFile[];
  selectedFileId: string;
  onSelectFile: (fileId: string) => void;
  onDeleteFile: (fileId: string, e?: React.MouseEvent) => void;
  onDeleteFolder: (folderPath: string, e?: React.MouseEvent) => void;
  onRenameFile: (file: WorkspaceFile) => void;
  onCreateFile: (fullPath: string) => void;
  onCreateFolder?: (folderPath: string) => void;
  onRefresh: () => void;
  onUploadFolderClick: () => void;
  onUploadFilesClick: () => void;
  onDownloadFile: (file: WorkspaceFile) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

// Render icons matching VS Code and user screenshot
function renderFileIcon(fileName: string) {
  const lower = fileName.toLowerCase();

  // JSON files -> {} in bright yellow/amber (exact match to Screenshot 2)
  if (lower.endsWith('.json')) {
    return (
      <span className="text-amber-400 font-mono font-bold text-xs select-none w-4 text-center shrink-0">
        &#123;&#125;
      </span>
    );
  }

  // Images -> Purple image icon (exact match to Screenshot 2)
  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.ico')
  ) {
    return <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
  }

  // Minecraft pack / metadata / configs -> ≡ (exact match to Screenshot 2 pack.mcmeta)
  if (
    lower.endsWith('.mcmeta') ||
    lower.endsWith('.toml') ||
    lower.endsWith('.yaml') ||
    lower.endsWith('.yml') ||
    lower.endsWith('.properties') ||
    lower.endsWith('.cfg') ||
    lower.endsWith('.env') ||
    lower.endsWith('.ini')
  ) {
    return (
      <span className="text-slate-300 font-bold text-xs font-mono select-none w-4 text-center shrink-0">
        &#8801;
      </span>
    );
  }

  // TypeScript files -> TS badge
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) {
    return (
      <span className="text-sky-400 font-bold text-[10px] font-mono select-none w-4 text-center shrink-0">
        TS
      </span>
    );
  }

  // JavaScript files -> JS badge
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) {
    return (
      <span className="text-amber-300 font-bold text-[10px] font-mono select-none w-4 text-center shrink-0">
        JS
      </span>
    );
  }

  // HTML -> <> in orange/rose
  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    return (
      <span className="text-rose-400 font-bold text-[11px] font-mono select-none w-4 text-center shrink-0">
        &lt;&gt;
      </span>
    );
  }

  // CSS / SCSS -> # in cyan
  if (lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.less')) {
    return (
      <span className="text-sky-400 font-bold text-xs font-mono select-none w-4 text-center shrink-0">
        #
      </span>
    );
  }

  // Archive / Zip
  if (lower.endsWith('.zip') || lower.endsWith('.rar') || lower.endsWith('.tar') || lower.endsWith('.gz')) {
    return <Archive className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }

  // Text / Docs
  if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.log')) {
    return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }

  return <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

// Build VS Code Tree with single-child folder compaction
export function buildVsCodeTree(
  files: WorkspaceFile[],
  searchQuery = ''
): { rootTitle: string; commonPrefix: string; nodes: FileTreeNode[] } {
  let list = files;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    return { rootTitle: 'Workspace', commonPrefix: '', nodes: [] };
  }

  // Detect if all files share a common root folder (e.g. /Azure/assets/... or /Oraxen Setup/...)
  const firstSegments = list.map((f) => {
    const p = f.path.replace(/^\/+/, '').split('/');
    return p.length > 1 ? p[0] : null;
  });

  let commonPrefix = '';
  if (firstSegments.length > 0 && firstSegments[0] !== null) {
    const candidate = firstSegments[0];
    if (firstSegments.every((s) => s === candidate)) {
      commonPrefix = candidate;
    }
  }

  const rootTitle = commonPrefix || 'Workspace';

  interface RawFolder {
    name: string;
    path: string;
    subfolders: Record<string, RawFolder>;
    files: WorkspaceFile[];
  }

  const rootRaw: RawFolder = {
    name: rootTitle,
    path: commonPrefix ? `/${commonPrefix}` : '/',
    subfolders: {},
    files: []
  };

  for (const file of list) {
    let clean = file.path.replace(/^\/+/, '');
    if (commonPrefix && clean.startsWith(`${commonPrefix}/`)) {
      clean = clean.slice(commonPrefix.length + 1);
    }
    const parts = clean.split('/');
    if (parts.length === 1) {
      rootRaw.files.push(file);
    } else {
      let cur = rootRaw;
      let curPath = commonPrefix ? `/${commonPrefix}` : '';
      for (let i = 0; i < parts.length - 1; i++) {
        const seg = parts[i];
        curPath += `/${seg}`;
        if (!cur.subfolders[seg]) {
          cur.subfolders[seg] = {
            name: seg,
            path: curPath,
            subfolders: {},
            files: []
          };
        }
        cur = cur.subfolders[seg];
      }
      cur.files.push(file);
    }
  }

  function convertRaw(rf: RawFolder): FileTreeNode[] {
    const result: FileTreeNode[] = [];

    // Sort subdirectories alphabetically
    const subKeys = Object.keys(rf.subfolders).sort((a, b) => a.localeCompare(b));
    for (const k of subKeys) {
      const sub = rf.subfolders[k];
      const children = convertRaw(sub);
      result.push({
        id: `dir:${sub.path}`,
        name: sub.name,
        fullPath: sub.path,
        isFolder: true,
        children
      });
    }

    // Sort files alphabetically
    const sortedFiles = [...rf.files].sort((a, b) => a.name.localeCompare(b.name));
    for (const f of sortedFiles) {
      result.push({
        id: f.id,
        name: f.name,
        fullPath: f.path,
        isFolder: false,
        file: f,
        children: []
      });
    }

    return result;
  }

  let nodes = convertRaw(rootRaw);

  // Compact Single-Child Folders (VS Code Compact Folders like "assets \ minecraft", "models \ item")
  function compactNode(node: FileTreeNode): FileTreeNode {
    if (!node.isFolder) return node;

    // Compact all children recursively
    node.children = node.children.map(compactNode);

    // If folder has NO files and EXACTLY 1 subfolder child, compact iteratively:
    while (node.children.length === 1 && node.children[0].isFolder) {
      const child = node.children[0];
      node = {
        id: node.id,
        name: `${node.name} \\ ${child.name}`,
        fullPath: child.fullPath,
        isFolder: true,
        children: child.children
      };
    }

    return node;
  }

  nodes = nodes.map(compactNode);

  return { rootTitle, commonPrefix, nodes };
}

export const VsCodeFileTree: React.FC<VsCodeFileTreeProps> = ({
  files,
  selectedFileId,
  onSelectFile,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  onCreateFile,
  onRefresh,
  onUploadFolderClick,
  onUploadFilesClick,
  onDownloadFile,
  searchQuery,
  setSearchQuery
}) => {
  // Expanded folders map: fullPath -> boolean. Default is true (expanded).
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isRootExpanded, setIsRootExpanded] = useState(true);

  // Inline creation state: { parentPath: string, type: 'file' | 'folder' }
  const [creatingTarget, setCreatingTarget] = useState<{
    parentPath: string;
    type: 'file' | 'folder';
  } | null>(null);
  const [inlineName, setInlineName] = useState('');

  // Build the tree
  const { rootTitle, commonPrefix, nodes } = useMemo(
    () => buildVsCodeTree(files, searchQuery),
    [files, searchQuery]
  );

  // Toggle folder expanded
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const isCurrentlyExpanded = prev[folderPath] !== false;
      return {
        ...prev,
        [folderPath]: !isCurrentlyExpanded
      };
    });
  };

  // Collapse / Expand all
  const handleToggleCollapseAll = () => {
    // Check if any folder is currently expanded (default is true if not explicitly false)
    let anyExpanded = false;
    function checkExpanded(list: FileTreeNode[]) {
      for (const n of list) {
        if (n.isFolder) {
          if (expandedFolders[n.fullPath] !== false) {
            anyExpanded = true;
            return;
          }
          checkExpanded(n.children);
        }
      }
    }
    checkExpanded(nodes);

    const targetState = !anyExpanded;
    const next: Record<string, boolean> = {};
    function markAll(list: FileTreeNode[]) {
      for (const n of list) {
        if (n.isFolder) {
          next[n.fullPath] = targetState;
          markAll(n.children);
        }
      }
    }
    markAll(nodes);
    setExpandedFolders(next);
  };

  // Start creating inline
  const startCreatingIn = (parentPath: string, type: 'file' | 'folder') => {
    setCreatingTarget({ parentPath, type });
    setInlineName('');
    // Auto expand parent
    if (parentPath) {
      setExpandedFolders((prev) => ({ ...prev, [parentPath]: true }));
    }
  };

  // Submit inline creation
  const handleConfirmInlineCreation = () => {
    if (!creatingTarget || !inlineName.trim()) {
      setCreatingTarget(null);
      return;
    }

    const trimmed = inlineName.trim().replace(/^\/+/, '');
    const parent = creatingTarget.parentPath === '/' ? '' : creatingTarget.parentPath;
    const finalPath = `${parent}/${trimmed}`;

    if (creatingTarget.type === 'file') {
      onCreateFile(finalPath);
    } else {
      // Create folder placeholder file so it exists in tree
      onCreateFile(`${finalPath}/.keep`);
    }

    setCreatingTarget(null);
    setInlineName('');
  };

  // Render inline creation row
  const renderInlineCreationRow = () => {
    if (!creatingTarget) return null;
    return (
      <div className="flex items-center gap-1.5 py-1 px-1.5 bg-[#182030] rounded border border-indigo-500/70 shadow-sm animate-fadeIn">
        {creatingTarget.type === 'file' ? (
          <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        ) : (
          <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        )}
        <input
          type="text"
          autoFocus
          value={inlineName}
          onChange={(e) => setInlineName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirmInlineCreation();
            if (e.key === 'Escape') setCreatingTarget(null);
          }}
          onBlur={() => {
            if (!inlineName.trim()) setCreatingTarget(null);
          }}
          placeholder={creatingTarget.type === 'file' ? 'name.json' : 'folder_name'}
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
        />
        <button
          type="button"
          onClick={handleConfirmInlineCreation}
          className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-1.5 py-0.5 rounded cursor-pointer font-semibold"
        >
          OK
        </button>
        <button
          type="button"
          onClick={() => setCreatingTarget(null)}
          className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // Recursive Tree Node Renderer
  const renderNode = (node: FileTreeNode) => {
    if (node.isFolder) {
      const isExpanded = expandedFolders[node.fullPath] !== false; // expanded by default

      return (
        <div key={node.id} className="select-none">
          {/* Folder Line */}
          <div
            onClick={() => toggleFolder(node.fullPath)}
            className="group flex items-center justify-between gap-1 py-1 px-1.5 rounded-md hover:bg-white/5 cursor-pointer text-slate-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="text-xs truncate font-sans font-medium text-slate-200 group-hover:text-white">
                {node.name}
              </span>
            </div>

            {/* Actions on hover */}
            <div
              className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => startCreatingIn(node.fullPath, 'file')}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded cursor-pointer"
                title="New File inside this folder"
              >
                <FilePlus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => startCreatingIn(node.fullPath, 'folder')}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded cursor-pointer"
                title="New Folder inside this folder"
              >
                <FolderPlus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => onDeleteFolder(node.fullPath, e)}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded cursor-pointer"
                title="Delete this folder"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Children container with sleek VS Code vertical guide line */}
          {isExpanded && (
            <div className="border-l border-zinc-700/60 ml-3 pl-1.5 space-y-0.5 mt-0.5">
              {creatingTarget?.parentPath === node.fullPath && renderInlineCreationRow()}
              {node.children.map((child) => renderNode(child))}
            </div>
          )}
        </div>
      );
    }

    // File Line
    const isSelected = selectedFileId === node.file?.id;

    return (
      <div
        key={node.id}
        onClick={() => node.file && onSelectFile(node.file.id)}
        className={`group flex items-center justify-between gap-1 py-1 px-1.5 rounded-md cursor-pointer select-none transition-colors ${
          isSelected
            ? 'bg-[#2a2d32] text-white font-medium shadow-xs'
            : 'text-slate-300 hover:text-white hover:bg-white/5'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {renderFileIcon(node.name)}
          <span className="text-xs truncate font-sans text-slate-200 group-hover:text-white">
            {node.name}
          </span>
        </div>

        {/* File Actions on Hover */}
        <div
          className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => node.file && onDownloadFile(node.file)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded cursor-pointer"
            title="Download file"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => node.file && onRenameFile(node.file)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded cursor-pointer"
            title="Rename file"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => node.file && onDeleteFile(node.file.id, e)}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded cursor-pointer"
            title="Delete file"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  const rootParentPath = commonPrefix ? `/${commonPrefix}` : '/';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0e121b] text-slate-200">
      {/* Search Bar - Clean, Minimal */}
      <div className="p-2 border-b border-slate-800/80 shrink-0 bg-[#121622]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161c2b] border border-slate-800 rounded-lg pl-7 pr-6 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Action Toolbar: Upload Folder, Upload Files */}
      <div className="p-2 border-b border-slate-800/80 shrink-0 grid grid-cols-2 gap-1.5 bg-[#0f1420]">
        <button
          type="button"
          onClick={onUploadFolderClick}
          className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
          title="Upload an entire folder with subfolders"
        >
          <FolderUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Upload Folder</span>
        </button>

        <button
          type="button"
          onClick={onUploadFilesClick}
          className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 active:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
          title="Upload files or ZIP archive"
        >
          <FileUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate">Upload Files</span>
        </button>
      </div>

      {/* Explorer Root Header Bar (Exact match to Screenshot 2: "⌄ Azure" with action buttons) */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141926] border-b border-slate-800 text-xs font-bold select-none shrink-0">
        <div
          className="flex items-center gap-1.5 cursor-pointer hover:text-white text-slate-300 truncate"
          onClick={() => setIsRootExpanded(!isRootExpanded)}
          title="Toggle Root Folder"
        >
          {isRootExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="tracking-wide uppercase font-bold text-[11px] truncate">
            {rootTitle}
          </span>
        </div>

        {/* Action icons on right of root header */}
        <div className="flex items-center gap-0.5 text-slate-400">
          <button
            type="button"
            onClick={() => startCreatingIn(rootParentPath, 'file')}
            className="p-1 hover:text-white hover:bg-slate-700/60 rounded cursor-pointer transition-colors"
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => startCreatingIn(rootParentPath, 'folder')}
            className="p-1 hover:text-white hover:bg-slate-700/60 rounded cursor-pointer transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="p-1 hover:text-white hover:bg-slate-700/60 rounded cursor-pointer transition-colors"
            title="Refresh Explorer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggleCollapseAll}
            className="p-1 hover:text-white hover:bg-slate-700/60 rounded cursor-pointer transition-colors"
            title="Collapse / Expand All"
          >
            <ChevronsDownUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tree View Content */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {files.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs space-y-2">
            <Folder className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-400">No files in workspace</p>
            <p className="text-[11px] text-slate-500">
              Click &quot;Upload Folder&quot; or &quot;Upload Files&quot; above to import your project.
            </p>
          </div>
        ) : isRootExpanded ? (
          <>
            {/* Inline creation at root if active */}
            {creatingTarget?.parentPath === rootParentPath && renderInlineCreationRow()}

            {/* Hierarchical Nodes */}
            {nodes.map((node) => renderNode(node))}
          </>
        ) : null}
      </div>
    </div>
  );
};
