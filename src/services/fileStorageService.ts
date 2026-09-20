import { WorkspaceFile } from '../types';
import JSZip from 'jszip';

const STORAGE_KEY_FILES = 'echo_workspace_files_v2';
const STORAGE_KEY_AUTO_SAVE_SETTING = 'echo_auto_save_enabled_v1';

// Clean starting workspace with no clutter/examples - files are dynamically created by user and AI
const DEFAULT_FILES: WorkspaceFile[] = [];

// Helper: Get language extension
export function getExtensionFromLanguage(lang: string): string {
  const l = (lang || '').toLowerCase().trim();
  switch (l) {
    case 'html':
    case 'htm':
      return 'html';
    case 'javascript':
    case 'js':
      return 'js';
    case 'typescript':
    case 'ts':
      return 'ts';
    case 'tsx':
    case 'react':
      return 'tsx';
    case 'jsx':
      return 'jsx';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'json':
      return 'json';
    case 'python':
    case 'py':
      return 'py';
    case 'markdown':
    case 'md':
      return 'md';
    case 'svg':
      return 'svg';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yml';
    case 'bash':
    case 'sh':
      return 'sh';
    default:
      return l || 'txt';
  }
}

// Helper: Guess language from filename
export function getLanguageFromFileName(filename: string): string {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'jsx':
      return 'jsx';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'json':
      return 'json';
    case 'py':
      return 'python';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'svg':
      return 'svg';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'sh':
      return 'bash';
    default:
      return 'text';
  }
}

/**
 * Resolves standard, official filename based on language and code content.
 * e.g., HTML -> index.html, CSS -> style.css, JS -> script.js, Python -> main.py, Java -> Main.java, JSON -> package.json
 */
export function resolveOfficialCodeFileName(
  rawLang: string,
  codeContent: string,
  explicitMeta?: string,
  counter = 1
): string {
  // 1. Check if an explicit filename was provided in the code block meta or info string
  if (explicitMeta && explicitMeta.trim()) {
    const metaParts = explicitMeta.trim().split(/\s+/);
    for (const part of metaParts) {
      const clean = part.replace(/^[:=]+/, '').replace(/[^a-zA-Z0-9_\-\.\/]/g, '');
      if (clean.includes('.') && clean.length > 2) {
        const fileOnly = clean.split('/').pop();
        if (fileOnly && fileOnly.includes('.')) {
          return fileOnly;
        }
      }
    }
  }

  // 2. Check the first 5 lines of code content for an explicit comment specifying filename
  const lines = codeContent.split('\n').slice(0, 5);
  for (const line of lines) {
    const trimmed = line.trim();
    // e.g. // index.html, <!-- index.html -->, /* style.css */, # main.py, // File: index.html
    const commentMatch = trimmed.match(
      /^(?:\/\/|#|<!--|\/\*)\s*(?:file(?:name)?\s*[:=]\s*)?([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/i
    );
    if (commentMatch && commentMatch[1]) {
      return commentMatch[1];
    }
  }

  // 3. Resolve by official convention and code content
  const lang = (rawLang || '').toLowerCase().trim();
  const ext = getExtensionFromLanguage(lang);

  if (ext === 'html') {
    return counter === 1 ? 'index.html' : `page_${counter}.html`;
  }

  if (ext === 'css' || ext === 'scss') {
    return counter === 1 ? 'style.css' : `styles_${counter}.css`;
  }

  if (ext === 'js') {
    if (/(?:require\s*\(\s*['"]express|import\s+express|process\.env|app\.listen)/i.test(codeContent)) {
      return 'server.js';
    }
    if (/(?:React|useState|useEffect|import\s+React)/i.test(codeContent)) {
      return counter === 1 ? 'App.jsx' : `Component_${counter}.jsx`;
    }
    return counter === 1 ? 'script.js' : `script_${counter}.js`;
  }

  if (ext === 'ts') {
    if (/(?:require\s*\(\s*['"]express|import\s+express|process\.env|app\.listen)/i.test(codeContent)) {
      return 'server.ts';
    }
    return counter === 1 ? 'main.ts' : `index_${counter}.ts`;
  }

  if (ext === 'tsx' || ext === 'jsx') {
    return counter === 1 ? 'App.tsx' : `Component_${counter}.tsx`;
  }

  if (ext === 'py') {
    if (/(?:from\s+flask|import\s+flask|from\s+fastapi|import\s+fastapi|from\s+django)/i.test(codeContent)) {
      return 'app.py';
    }
    return counter === 1 ? 'main.py' : `script_${counter}.py`;
  }

  if (ext === 'java') {
    const classMatch = codeContent.match(/public\s+class\s+([A-Za-z0-9_]+)/);
    if (classMatch && classMatch[1]) {
      return `${classMatch[1]}.java`;
    }
    return 'Main.java';
  }

  if (ext === 'c') {
    return 'main.c';
  }

  if (ext === 'cpp') {
    return 'main.cpp';
  }

  if (ext === 'json') {
    if (/(?:"dependencies"|"devDependencies"|"scripts"|"peerDependencies")/i.test(codeContent)) {
      return 'package.json';
    }
    if (/(?:"pack"|"pack_format")/i.test(codeContent)) {
      return 'pack.mcmeta';
    }
    if (/(?:"manifest_version")/i.test(codeContent)) {
      return 'manifest.json';
    }
    if (/(?:"compilerOptions")/i.test(codeContent)) {
      return 'tsconfig.json';
    }
    return counter === 1 ? 'data.json' : `data_${counter}.json`;
  }

  if (ext === 'sql') {
    if (/CREATE\s+TABLE/i.test(codeContent)) {
      return 'schema.sql';
    }
    return 'query.sql';
  }

  if (ext === 'sh') {
    if (/(?:npm\s+install|yarn|pip\s+install|apt-get|git\s+clone)/i.test(codeContent)) {
      return 'setup.sh';
    }
    return 'run.sh';
  }

  if (ext === 'md') {
    return 'README.md';
  }

  if (ext === 'svg') {
    return 'icon.svg';
  }

  return `${ext || 'file'}${counter > 1 ? `_${counter}` : ''}.${ext || 'txt'}`;
}

// Load all workspace files from localStorage
export function loadWorkspaceFiles(): WorkspaceFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FILES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((f) => f && typeof f === 'object' && f.id);
      }
    }
  } catch (err) {
    console.warn('Failed to load workspace files from storage:', err);
  }
  return DEFAULT_FILES;
}

// Save all workspace files to localStorage
export function saveWorkspaceFiles(files: WorkspaceFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
    // Dispatch custom event for reactive UI updates
    window.dispatchEvent(new CustomEvent('echo_workspace_files_updated', { detail: files }));
  } catch (err) {
    console.error('Failed to save workspace files to storage:', err);
  }
}

// Auto-save a single file (upsert by id or path)
export function autoSaveFile(
  fileData: {
    id?: string;
    name: string;
    path: string;
    content: string;
    language?: string;
    source?: 'ai-generated' | 'user-created' | 'imported';
    chatSessionId?: string;
    chatMessageId?: string;
  }
): WorkspaceFile {
  const files = loadWorkspaceFiles();
  const now = Date.now();
  const lang = fileData.language || getLanguageFromFileName(fileData.name);

  // Clean path formatting (always start with /)
  let normalizedPath = fileData.path.trim();
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }

  // Check if file with same id exists or same path exists
  const existingIndex = files.findIndex(
    (f) => (fileData.id && f.id === fileData.id) || f.path === normalizedPath
  );

  let savedFile: WorkspaceFile;

  if (existingIndex >= 0) {
    savedFile = {
      ...files[existingIndex],
      name: fileData.name,
      path: normalizedPath,
      content: fileData.content,
      language: lang,
      updatedAt: now,
      autoSaved: true,
      source: fileData.source || files[existingIndex].source,
      chatSessionId: fileData.chatSessionId || files[existingIndex].chatSessionId,
      chatMessageId: fileData.chatMessageId || files[existingIndex].chatMessageId
    };
    files[existingIndex] = savedFile;
  } else {
    savedFile = {
      id: fileData.id || `file_${now}_${Math.random().toString(36).substring(2, 7)}`,
      name: fileData.name,
      path: normalizedPath,
      content: fileData.content,
      language: lang,
      createdAt: now,
      updatedAt: now,
      autoSaved: true,
      source: fileData.source || 'user-created',
      chatSessionId: fileData.chatSessionId,
      chatMessageId: fileData.chatMessageId
    };
    files.unshift(savedFile);
  }

  saveWorkspaceFiles(files);
  return savedFile;
}

// Delete a file safely by id, path, or filename
export function deleteWorkspaceFile(idOrPath: string): WorkspaceFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FILES);
    let files: WorkspaceFile[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        files = parsed;
      }
    } else {
      files = loadWorkspaceFiles();
    }
    const filtered = files.filter(
      (f) => f && f.id !== idOrPath && f.path !== idOrPath && f.name !== idOrPath
    );
    saveWorkspaceFiles(filtered);
    return filtered;
  } catch (err) {
    console.error('Failed to delete workspace file:', err);
    const files = loadWorkspaceFiles();
    const filtered = files.filter(
      (f) => f && f.id !== idOrPath && f.path !== idOrPath
    );
    saveWorkspaceFiles(filtered);
    return filtered;
  }
}

// Delete an entire folder and all its nested files
export function deleteWorkspaceFolder(folderPath: string): WorkspaceFile[] {
  const files = loadWorkspaceFiles();
  const normalized = folderPath.endsWith('/') ? folderPath.slice(0, -1) : folderPath;
  const filtered = files.filter((f) => {
    const p = f.path;
    return p !== normalized && !p.startsWith(normalized + '/');
  });
  saveWorkspaceFiles(filtered);
  return filtered;
}

// Clear all files from workspace
export function clearAllWorkspaceFiles(): WorkspaceFile[] {
  saveWorkspaceFiles([]);
  return [];
}

// Extract and auto-save code blocks from AI messages into the workspace
export function autoSaveAiCodeBlocks(
  markdown: string,
  sessionId?: string,
  messageId?: string
): WorkspaceFile[] {
  if (!markdown || !markdown.includes('```')) return [];

  const codeBlockRegex = /```(\w+)?(?:\s+([^\n\r]+))?\n([\s\S]*?)```/g;
  const savedFiles: WorkspaceFile[] = [];
  let match: RegExpExecArray | null;
  let counter = 1;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const rawLang = (match[1] || '').trim().toLowerCase();
    const commentOrFilename = (match[2] || '').trim();
    const codeContent = match[3] || '';

    if (!codeContent.trim()) continue;

    // Do not auto-save exam paper patterns, test questionnaires, or general notes as programming code files
    const isExamOrPattern =
      ['markdown', 'md', 'text', 'txt', 'exam', 'paper', 'pattern'].includes(rawLang) &&
      /(###\s*section|section\s+[a-c]:|paper\s*pattern|question\s*paper|total\s*marks|attempt\s*any)/i.test(codeContent);
    if (isExamOrPattern) continue;

    // Detect official standard filename (e.g. index.html, style.css, script.js, main.py, package.json)
    const ext = getExtensionFromLanguage(rawLang || 'txt');
    const currentFiles = loadWorkspaceFiles();
    const existingSessionFile = sessionId
      ? currentFiles.find((f) => f.chatSessionId === sessionId && f.name.endsWith(`.${ext}`))
      : null;

    let detectedName = '';
    if (existingSessionFile && counter === 1) {
      detectedName = existingSessionFile.name;
    } else {
      detectedName = resolveOfficialCodeFileName(rawLang, codeContent, commentOrFilename, counter);
    }

    const lang = rawLang || getLanguageFromFileName(detectedName);
    const folder =
      lang === 'html' || lang === 'css' || lang === 'javascript' || lang === 'typescript' || lang === 'tsx'
        ? '/workspace'
        : lang === 'python'
        ? '/scripts'
        : lang === 'markdown'
        ? '/docs'
        : '/workspace';

    const fullPath = detectedName.startsWith('/')
      ? detectedName
      : `${folder}/${detectedName.replace(/^\/+/, '')}`;

    const fileNameOnly = fullPath.split('/').pop() || detectedName;

    const file = autoSaveFile({
      name: fileNameOnly,
      path: fullPath,
      content: codeContent.trim(),
      language: lang,
      source: 'ai-generated',
      chatSessionId: sessionId,
      chatMessageId: messageId
    });

    savedFiles.push(file);
    counter++;
  }

  return savedFiles;
}

// Generate unified HTML bundle for Live Preview
export function buildLivePreviewBundle(file: WorkspaceFile, allFiles: WorkspaceFile[] = []): string {
  const lang = (file.language || getLanguageFromFileName(file.name)).toLowerCase();

  // If already full HTML document
  if (lang === 'html' || file.name.endsWith('.html')) {
    let html = file.content;

    // If html doesn't include <html> tags, wrap it nicely
    if (!html.toLowerCase().includes('<html')) {
      html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${file.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; line-height: 1.5; color: #1e293b; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
    }

    // Try linking adjacent css / js in workspace if not already bundled
    const cssFile = allFiles.find((f) => f.name.endsWith('.css') && f.path.startsWith('/workspace'));
    const jsFile = allFiles.find((f) => f.name.endsWith('.js') && f.path.startsWith('/workspace'));

    if (cssFile && !html.includes(cssFile.content.slice(0, 30))) {
      html = html.replace('</head>', `<style>\n/* Auto-linked from ${cssFile.path} */\n${cssFile.content}\n</style>\n</head>`);
    }
    if (jsFile && !html.includes(jsFile.content.slice(0, 30))) {
      html = html.replace('</body>', `<script>\n/* Auto-linked from ${jsFile.path} */\n${jsFile.content}\n</script>\n</body>`);
    }

    return html;
  }

  // If CSS file: create preview playground
  if (lang === 'css' || file.name.endsWith('.css')) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CSS Preview - ${file.name}</title>
  <style>
    ${file.content}
  </style>
</head>
<body style="padding: 30px; font-family: sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <h1>CSS Stylesheet Preview</h1>
    <p>Styles from <code>${file.path}</code> are loaded and applied here.</p>
    <button style="padding: 8px 16px; border-radius: 6px; cursor: pointer;">Sample Button</button>
  </div>
</body>
</html>`;
  }

  // If JavaScript / TypeScript: create live runner sandbox with interactive console
  if (lang === 'javascript' || lang === 'typescript' || lang === 'js' || lang === 'ts') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>JS Runner - ${file.name}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #090d16; color: #e2e8f0; padding: 20px; font-size: 13.5px; }
    #console-logs { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; min-height: 200px; max-height: 500px; overflow-y: auto; line-height: 1.6; }
    .log-line { border-bottom: 1px solid #1e293b; padding: 4px 0; display: flex; gap: 8px; }
    .log-time { color: #64748b; font-size: 11px; }
    .log-info { color: #38bdf8; }
    .log-error { color: #f43f5e; }
    .log-warn { color: #fbbf24; }
    .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .badge { background: #4f46e5; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    #canvas-container { margin-top: 16px; }
  </style>
</head>
<body>
  <div class="header-bar">
    <div><strong>Live JS/TS Execution Console</strong> <span class="badge">${file.name}</span></div>
    <div style="color: #94a3b8; font-size: 12px;">Auto-executed sandbox</div>
  </div>
  <div id="console-logs"></div>
  <div id="canvas-container"></div>

  <script>
    const logBox = document.getElementById('console-logs');
    function printLog(type, ...args) {
      const line = document.createElement('div');
      line.className = 'log-line';
      const time = new Date().toLocaleTimeString();
      const content = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      line.innerHTML = '<span class="log-time">' + time + '</span> <span class="log-' + type + '">[' + type.toUpperCase() + ']</span> <span>' + content.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
      logBox.appendChild(line);
      logBox.scrollTop = logBox.scrollHeight;
    }
    console.log = (...args) => printLog('info', ...args);
    console.error = (...args) => printLog('error', ...args);
    console.warn = (...args) => printLog('warn', ...args);

    try {
      printLog('info', '▶️ Executing ${file.name}...');
      ${file.content}
      printLog('info', '✅ Script completed execution.');
    } catch (err) {
      printLog('error', 'Execution Error: ' + err.message);
    }
  </script>
</body>
</html>`;
  }

  // If SVG: directly render SVG graphic
  if (lang === 'svg' || file.name.endsWith('.svg')) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SVG Preview - ${file.name}</title>
  <style>
    body { margin: 0; background: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: sans-serif; color: #fff; }
    .svg-wrapper { background: #1e293b; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-width: 90vw; max-height: 80vh; display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <div style="margin-bottom: 16px; font-weight: 600; color: #94a3b8;">SVG Vector Preview: ${file.name}</div>
  <div class="svg-wrapper">
    ${file.content}
  </div>
</body>
</html>`;
  }

  // Fallback / Text / Markdown / Python simulator
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${file.name}</title>
  <style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #0f172a; color: #f8fafc; padding: 24px; font-size: 13.5px; line-height: 1.6; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-all; }
    .bar { padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid #334155; color: #94a3b8; font-size: 12px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="bar">
    <span>File: ${file.path}</span>
    <span>Auto-Saved • ${lang.toUpperCase()}</span>
  </div>
  <pre><code>${file.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
</body>
</html>`;
}

// Save file directly to user disk location using File System Access API or browser download
export async function saveFileToDiskLocation(
  filename: string,
  content: string,
  existingHandle?: any
): Promise<{ success: boolean; handle?: any; locationName: string }> {
  try {
    let handle = existingHandle;

    // Use showSaveFilePicker if available and no existing handle
    if (!handle && typeof (window as any).showSaveFilePicker === 'function') {
      const ext = filename.split('.').pop() || 'txt';
      try {
        handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'Code File',
              accept: { 'text/plain': [`.${ext}`] }
            }
          ]
        });
      } catch (pickerErr: any) {
        if (pickerErr.name === 'AbortError') {
          return { success: false, locationName: 'Cancelled' };
        }
      }
    }

    if (handle && typeof handle.createWritable === 'function') {
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      const locationName = handle.name || filename;
      return { success: true, handle, locationName };
    }
  } catch (err) {
    console.warn('Direct file handle write unavailable, falling back to download:', err);
  }

  // Fallback: browser download
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { success: true, locationName: filename };
}

// Download single file to user computer directly with custom name
export function downloadSingleFileDirectly(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download multiple files as a full ZIP folder bundle directly
export async function downloadFilesAsZip(
  files: Array<{ name: string; content: string; path?: string }>,
  zipName = 'echo_project_bundle.zip'
): Promise<void> {
  const zip = new JSZip();
  for (const f of files) {
    const cleanPath = (f.path || f.name).replace(/^\/+/, '') || f.name;
    zip.file(cleanPath, f.content);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExtractedCodeFile {
  id: string;
  name: string;
  extension: string;
  language: string;
  content: string;
  path: string;
  sizeBytes: number;
}

// Extract distinct code files from markdown response
export function extractCodeFilesFromMarkdown(markdown: string): ExtractedCodeFile[] {
  if (!markdown || !markdown.includes('```')) return [];
  const codeBlockRegex = /```(\w+)?(?:\s+([^\n\r]+))?\n([\s\S]*?)```/g;
  const files: ExtractedCodeFile[] = [];
  let match: RegExpExecArray | null;
  let counter = 1;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const rawLang = (match[1] || '').trim().toLowerCase();
    const commentOrFilename = (match[2] || '').trim();
    const codeContent = match[3] || '';
    if (!codeContent.trim()) continue;

    // Do not extract exam paper patterns, questionnaires, or general text documents as code files
    const isExamOrPattern =
      ['markdown', 'md', 'text', 'txt', 'exam', 'paper', 'pattern'].includes(rawLang) &&
      /(###\s*section|section\s+[a-c]:|paper\s*pattern|question\s*paper|total\s*marks|attempt\s*any)/i.test(codeContent);
    if (isExamOrPattern) continue;

    const detectedName = resolveOfficialCodeFileName(rawLang, codeContent, commentOrFilename, counter);
    const cleanName = detectedName.split('/').pop() || detectedName;
    const parts = cleanName.split('.');
    const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : getExtensionFromLanguage(rawLang || 'txt');
    const finalName = parts.length > 0 ? `${parts.join('.')}.${ext}` : cleanName;

    files.push({
      id: `file_${counter}_${Date.now()}`,
      name: finalName,
      extension: ext,
      language: rawLang || getLanguageFromFileName(finalName),
      content: codeContent.trim(),
      path: `/${finalName}`,
      sizeBytes: new Blob([codeContent]).size
    });
    counter++;
  }
  return files;
}

// Download single file to user computer
export function downloadWorkspaceFile(file: WorkspaceFile): void {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

// Export all files as ZIP package
export async function exportAllFilesAsZip(files: WorkspaceFile[]): Promise<void> {
  const zip = new JSZip();

  for (const file of files) {
    // Remove leading slash for ZIP directory structure
    const cleanPath = file.path.replace(/^\/+/, '') || file.name;
    if (file.content.startsWith('data:') && file.content.includes(';base64,')) {
      const base64Data = file.content.split(';base64,')[1];
      zip.file(cleanPath, base64Data, { base64: true });
    } else {
      zip.file(cleanPath, file.content);
    }
  }

  // Add a manifest file
  const manifest = {
    project: 'Sapphire AI Workspace',
    exportedAt: new Date().toISOString(),
    totalFiles: files.length,
    owner: 'Sapphire AI',
    files: files.map((f) => ({
      name: f.name,
      path: f.path,
      language: f.language,
      updatedAt: new Date(f.updatedAt).toISOString()
    }))
  };

  zip.file('workspace_manifest.json', JSON.stringify(manifest, null, 2));

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sapphire_workspace_export_${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

// AI Edit History Storage Key
const STORAGE_KEY_AI_HISTORY = 'echo_workspace_ai_history_v1';

export function loadAiEditHistory(): import('../types').AiEditHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load AI history:', err);
  }
  return [];
}

export function saveAiEditHistoryItem(item: import('../types').AiEditHistoryItem): void {
  try {
    const history = loadAiEditHistory();
    history.unshift(item);
    // Keep last 50 edits
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEY_AI_HISTORY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save AI history:', err);
  }
}

export function clearAiEditHistory(): void {
  localStorage.removeItem(STORAGE_KEY_AI_HISTORY);
}

// Import all files from a ZIP archive, keeping full relative paths
export async function importZipArchive(file: File | Blob): Promise<WorkspaceFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const extractedFiles: WorkspaceFile[] = [];
  const now = Date.now();

  const filePromises: Promise<void>[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    // Ignore directories and OS metadata
    if (zipEntry.dir || relativePath.startsWith('__MACOSX') || relativePath.includes('.DS_Store')) {
      return;
    }

    const p = (async () => {
      try {
        const textContent = await zipEntry.async('string');
        const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
        const fileName = relativePath.split('/').pop() || relativePath;
        const lang = getLanguageFromFileName(fileName);

        extractedFiles.push({
          id: `zip_${now}_${Math.random().toString(36).substring(2, 7)}`,
          name: fileName,
          path: cleanPath,
          content: textContent,
          language: lang,
          createdAt: now,
          updatedAt: now,
          autoSaved: true,
          source: 'imported'
        });
      } catch (err) {
        console.warn(`Could not extract ${relativePath} as text:`, err);
      }
    })();

    filePromises.push(p);
  });

  await Promise.all(filePromises);

  // Merge into existing workspace files
  if (extractedFiles.length > 0) {
    const current = loadWorkspaceFiles();
    // Overwrite or append
    const updated = [...extractedFiles, ...current.filter((c) => !extractedFiles.some((e) => e.path === c.path))];
    saveWorkspaceFiles(updated);
  }

  return extractedFiles;
}

// Convenient unified service object
export const fileStorageService = {
  getFiles: loadWorkspaceFiles,
  saveFiles: saveWorkspaceFiles,
  saveFile: autoSaveFile,
  createFile: (name: string, content: string, language?: string) =>
    autoSaveFile({
      name,
      path: name.startsWith('/') ? name : `/${name}`,
      content,
      language: language || getLanguageFromFileName(name),
      source: 'user-created'
    }),
  updateFile: (id: string, updates: Partial<WorkspaceFile>) => {
    const files = loadWorkspaceFiles();
    const idx = files.findIndex((f) => f.id === id);
    if (idx !== -1) {
      files[idx] = { ...files[idx], ...updates, updatedAt: Date.now() };
      saveWorkspaceFiles(files);
      return files[idx];
    }
    return null;
  },
  deleteFile: deleteWorkspaceFile,
  downloadFile: downloadWorkspaceFile,
  exportZip: exportAllFilesAsZip,
  importZip: importZipArchive,
  getAiHistory: loadAiEditHistory,
  saveAiHistory: saveAiEditHistoryItem
};

