import { WorkspaceFile } from '../types';
import JSZip from 'jszip';

const STORAGE_KEY_FILES = 'echo_workspace_files_v2';
const STORAGE_KEY_AUTO_SAVE_SETTING = 'echo_auto_save_enabled_v1';

// Preloaded workspace files for coding language standards and reference
const DEFAULT_FILES: WorkspaceFile[] = [
  {
    id: 'file-coding-languages-csv',
    name: 'coding_languages_and_extensions.csv',
    path: '/coding_languages_and_extensions.csv',
    language: 'csv',
    createdAt: 1727500000000,
    updatedAt: 1727500000000,
    autoSaved: true,
    content: `Category,Programming Language,Standard Extension,Standard Filename,Core Use Case
Frontend Web,HTML (HyperText Markup Language),.html,index.html,Webpage structure and markup
Frontend Web,CSS (Cascading Style Sheets),.css,style.css,Webpage styling and layouts
Frontend Web,JavaScript (ES6+ Engine),.js,main.js,Interactive client-side and server logic
Frontend Web,TypeScript (Strict JS),.ts,app.ts,Type-safe scalable JavaScript
Frontend Web,React JSX,.jsx,Navbar.jsx,React components with JSX syntax
Frontend Web,React TSX,.tsx,App.tsx,React components with TypeScript
Frontend Web,SCSS (Sassy CSS),.scss,global.scss,Advanced nested CSS architectures
Frontend Web,SASS,.sass,main.sass,Indented Sass syntax
Frontend Web,LESS,.less,styles.less,Dynamic stylesheet preprocessor
Frontend Web,WebAssembly,.wasm,module.wasm,High-speed compiled binary for browsers
Backend Web,Python (FastAPI / Django / Flask),.py,main.py,AI / ML / Data Science & Web APIs
Backend Web,Node.js ES Modules,.mjs,server.mjs,Modern ECMAScript module runner
Backend Web,Node.js CommonJS,.cjs,index.cjs,CommonJS module scripts
Backend Web,PHP (Hypertext Preprocessor),.php,index.php,Server-side web applications
Backend Web,Ruby (Ruby on Rails),.rb,main.rb,Web application frameworks
Backend Web,Go (Golang Engine),.go,main.go,High-concurrency microservices and cloud APIs
Backend Web,Java Enterprise,.java,Main.java,Enterprise systems and Android apps
Core Systems,C Native Programming,.c,main.c,Operating systems and low-level software
Core Systems,C++ High Performance,.cpp,main.cpp,Game engines and high-performance apps
Core Systems,C# (C-Sharp / .NET),.cs,Program.cs,Enterprise .NET and Unity game development
Core Systems,Rust,.rs,main.rs,Memory-safe high-speed systems computing
Core Systems,Zig,.zig,main.zig,Modern C replacement with safe memory
Core Systems,Nim,.nim,main.nim,Compiled expressive systems language
Core Systems,D Language,.d,main.d,Fast OOP compiled systems programming
Core Systems,Assembly Hardware,.asm,boot.asm,Direct CPU / hardware architecture instructions
Mobile Apps,Swift,.swift,AppDelegate.swift,Native Apple iOS and macOS apps
Mobile Apps,Kotlin,.kt,MainActivity.kt,Modern native Google Android apps
Mobile Apps,Dart (Flutter Engine),.dart,main.dart,Cross-platform Android / iOS / Web apps
Mobile Apps,Objective-C,.m,main.m,Legacy Apple iOS and macOS systems
Data & Maths,R Statistics,.r,analysis.R,Statistical modeling and data analysis
Data & Maths,Julia,.jl,model.jl,High-performance scientific computing
Data & Maths,MATLAB,.m,matrix.m,Matrix computation and engineering simulation
Data & Maths,Fortran,.f90,main.f90,High-precision numeric simulations
Functional,Haskell,.hs,Main.hs,Pure mathematical functional programming
Functional,Scala,.scala,Main.scala,Functional and OOP on the JVM
Functional,Elixir,.ex,main.ex,Distributed fault-tolerant systems on Erlang VM
Functional,Erlang,.erl,module.erl,Telecom and high-concurrency systems
Functional,Clojure,.clj,core.clj,Lisp dialect running on Java JVM
Functional,F#,.fs,Program.fs,Functional-first language for .NET
Database Tier,SQL Standard,.sql,schema.sql,Relational database management and queries
Database Tier,PL/SQL Oracle,.pls,procedure.pls,Stored procedures and database triggers
Database Tier,GraphQL Schema,.graphql,schema.graphql,Client-defined API query schemas
Database Tier,Cypher Neo4j,.cypher,graph.cypher,Graph database traversal and querying
Config & Docs,JSON Objects,.json,config.json,Standard key-value data exchange
Config & Docs,YAML Deployment,.yaml,docker-compose.yml,Cloud infrastructure and CI/CD configs
Config & Docs,XML Markup,.xml,manifest.xml,Structured data and Android layouts
Config & Docs,TOML Minimal,.toml,Cargo.toml,Modern configuration files
Config & Docs,Markdown,.md,README.md,Rich documentation and project readmes
Config & Docs,LaTeX Document,.tex,paper.tex,Academic research typesetting
Automation,Bash / Shell,.sh,deploy.sh,Linux / macOS terminal automated scripts
Automation,PowerShell,.ps1,backup.ps1,Windows PowerShell system scripting
Automation,Batch Script,.bat,run.bat,Windows CMD automated scripts
DevOps & Cloud,Dockerfile,Dockerfile,Dockerfile,Container build instructions (No dot extension)
DevOps & Cloud,Makefile,Makefile,Makefile,Build and compilation instructions (No dot extension)
DevOps & Cloud,Terraform HCL,.tf,main.tf,Infrastructure-as-Code for cloud platforms
Game Engines,Lua Scripting,.lua,main.lua,Embedded lightweight game scripts
Game Engines,GDScript (Godot),.gd,player.gd,Godot engine native scripting
Legacy Tech,COBOL,.cbl,program.cbl,Mainframe banking systems
Legacy Tech,Pascal,.pas,program.pas,Structured programming language
Legacy Tech,Visual Basic,.vb,Module1.vb,Windows automation and office macros`,
    source: 'imported'
  },
  {
    id: 'file-coding-languages-md',
    name: 'coding_languages_and_extensions.md',
    path: '/coding_languages_and_extensions.md',
    language: 'markdown',
    createdAt: 1727500000000,
    updatedAt: 1727500000000,
    autoSaved: true,
    content: `# 🌐 Complete Global Standard Coding Languages & File Extensions Guide

Globally, file extensions follow the standard rule \`filename.extension\` where the dot (\`.\`) signals to the operating system, compilers, and code editors (like VS Code) which syntax highlighter, parser, or compiler to use.

---

## 1. Web Development (Frontend & Backend)
| Category | Language / Stack | Standard Extension | Standard Filename | Core Use Case |
|---|---|---|---|---|
| Frontend | **HTML** | \`.html\` | \`index.html\` | Webpage structure & entry point |
| Frontend | **CSS** | \`.css\` | \`style.css\` | Web styling & layout |
| Frontend | **JavaScript** | \`.js\` | \`script.js\` / \`main.js\` | Interactive web logic & dynamic DOM |
| Frontend | **TypeScript** | \`.ts\` | \`app.ts\` / \`index.ts\` | Typed scalable JavaScript |
| Frontend | **React JSX** | \`.jsx\` | \`Navbar.jsx\` | React component markup |
| Frontend | **React TSX** | \`.tsx\` | \`App.tsx\` | Type-safe React components |
| Frontend | **SCSS** | \`.scss\` | \`global.scss\` | Sassy nested stylesheets |
| Frontend | **WebAssembly** | \`.wasm\` | \`module.wasm\` | High-speed browser binary bytecode |
| Backend | **Python** | \`.py\` | \`app.py\` / \`main.py\` | AI, ML, Data Science & APIs (FastAPI/Django) |
| Backend | **Node.js (ESM)** | \`.mjs\` | \`server.mjs\` | Native ECMAScript modules |
| Backend | **PHP** | \`.php\` | \`index.php\` | Dynamic server-side web scripting |
| Backend | **Ruby** | \`.rb\` | \`main.rb\` | Ruby on Rails web backends |
| Backend | **Go (Golang)** | \`.go\` | \`main.go\` | Microservices, networking & cloud APIs |
| Backend | **Java** | \`.java\` | \`Main.java\` | Enterprise systems & Android JVM |

---

## 2. Core Systems & High Performance
| Language | Standard Extension | Standard Filename | Core Use Case |
|---|---|---|---|
| **C Native** | \`.c\` / \`.h\` | \`main.c\` | Operating systems, drivers, kernels |
| **C++ Engine** | \`.cpp\` / \`.hpp\` | \`main.cpp\` | Game engines, high-speed trading, rendering |
| **C# (.NET)** | \`.cs\` | \`Program.cs\` | Microsoft .NET & Unity game development |
| **Rust** | \`.rs\` | \`main.rs\` | Ultra-fast memory-safe system programming |
| **Zig** | \`.zig\` | \`main.zig\` | Modern safe C alternative |
| **Assembly** | \`.asm\` / \`.s\` | \`boot.asm\` | Direct processor & machine CPU instructions |

---

## 3. Mobile App Development
| Platform / Engine | Standard Extension | Standard Filename | Core Use Case |
|---|---|---|---|
| **Swift** | \`.swift\` | \`AppDelegate.swift\` | Native iOS, iPadOS, macOS |
| **Kotlin** | \`.kt\` | \`MainActivity.kt\` | Modern Google Android apps |
| **Dart (Flutter)** | \`.dart\` | \`main.dart\` | Cross-platform iOS/Android apps |
| **Objective-C** | \`.m\` | \`main.m\` | Legacy Apple ecosystem |

---

## 4. Databases, Data Science & Config
| Format / Tool | Standard Extension | Standard Filename | Core Use Case |
|---|---|---|---|
| **SQL** | \`.sql\` | \`schema.sql\` / \`query.sql\` | Relational queries (Postgres/MySQL) |
| **GraphQL** | \`.graphql\` / \`.gql\` | \`schema.graphql\` | API graph queries |
| **JSON** | \`.json\` | \`config.json\` / \`package.json\` | Universal key-value data interchange |
| **YAML** | \`.yaml\` / \`.yml\` | \`docker-compose.yml\` | Cloud, Kubernetes & CI/CD configs |
| **Markdown** | \`.md\` | \`README.md\` | Formatted documentation |
| **R Language** | \`.r\` | \`analysis.R\` | Statistical computation |
| **Julia** | \`.jl\` | \`model.jl\` | High-performance scientific computing |

---

## 5. DevOps, Shell & Automation
| Tool | Standard Extension | Standard Filename | Core Use Case |
|---|---|---|---|
| **Bash** | \`.sh\` | \`deploy.sh\` | Linux/Mac terminal automation |
| **PowerShell** | \`.ps1\` | \`script.ps1\` | Windows server scripting |
| **Batch** | \`.bat\` / \`.cmd\` | \`run.bat\` | Windows CMD command scripts |
| **Docker** | *(No extension)* | \`Dockerfile\` | Container image build manifest |
| **Make** | *(No extension)* | \`Makefile\` | Compilation & task automation |
| **Terraform** | \`.tf\` | \`main.tf\` | Infrastructure-as-Code |

---

## 💡 Global Standards & Naming Conventions
1. **Always Use Lowercase Extensions**: Use \`.html\`, \`.js\`, \`.py\` (never \`.HTML\` or \`.JS\`).
2. **No Whitespace in Filenames**: Use kebab-case (\`my-script.js\`) or snake_case (\`my_script.py\`).
3. **Entrypoint Convention**: Web apps use \`index.html\` or \`index.js\` as their root file.
4. **Special Tools Without Extension**: \`Dockerfile\`, \`Makefile\`, and \`Vagrantfile\` never use an extension.
`,
    source: 'imported'
  }
];

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

// ============================================================
// SMART PROJECT FILE MATCHING
// Picks only files belonging to the SAME project/message so
// preview doesn't mix old CSS/JS from other projects.
// ============================================================
function getProjectSiblingFiles(
  mainFile: WorkspaceFile,
  workspaceFiles: WorkspaceFile[]
): WorkspaceFile[] {
  return workspaceFiles.filter((f) => {
    if (f.id === mainFile.id) return false;
    if (f.name === mainFile.name && f.path === mainFile.path) return false;

    // 1. Match by chatSessionId (most accurate — same AI session)
    if (mainFile.chatSessionId && f.chatSessionId === mainFile.chatSessionId) {
      return true;
    }

    // 2. Match by chatMessageId (very accurate — same AI message)
    if (mainFile.chatMessageId && f.chatMessageId === mainFile.chatMessageId) {
      return true;
    }

    // 3. Match by same folder
    const mainFolder = mainFile.path.substring(0, mainFile.path.lastIndexOf('/'));
    const fFolder = f.path.substring(0, f.path.lastIndexOf('/'));
    if (mainFolder && fFolder && mainFolder === fFolder) {
      return true;
    }

    // 4. Match by recent update (within 5 minutes of the main file)
    if (Math.abs(f.updatedAt - mainFile.updatedAt) < 5 * 60 * 1000) {
      return true;
    }

    return false;
  });
}

// ============================================================
// BUILD UNIFIED LIVE PREVIEW BUNDLE
// Works for both chat preview AND workspace preview.
// Smart-matches project files, inlines CSS + JS into the HTML
// so the whole multi-file project renders in the iframe.
// ============================================================
export function buildLivePreviewBundle(
  file: WorkspaceFile,
  allFiles: WorkspaceFile[] = []
): string {
  const lang = (file.language || getLanguageFromFileName(file.name)).toLowerCase();

  // If allFiles is empty, load from persistent workspace
  const workspaceFiles = allFiles.length > 0 ? allFiles : loadWorkspaceFiles();

  // ===== HTML PROJECT WITH MULTI-FILE BUNDLE =====
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

    // Fix invalid tailwind browser script if present
    html = html.replace(
      /<script[^>]*src="[^"]*@tailwindcss\/browser[^"]*"[^>]*><\/script>/gi,
      '<script src="https://cdn.tailwindcss.com"></script>'
    );

    // ===== SMART PROJECT FILE MATCHING =====
    // Only pick CSS/JS files that belong to the SAME project/message
    const projectFiles = getProjectSiblingFiles(file, workspaceFiles);

    const cssFiles = projectFiles.filter(
      (f) => f.name.endsWith('.css') || f.language === 'css'
    );
    const jsFiles = projectFiles.filter(
      (f) =>
        f.name.endsWith('.js') ||
        f.name.endsWith('.ts') ||
        f.name.endsWith('.jsx') ||
        f.name.endsWith('.tsx') ||
        f.name.endsWith('.mjs') ||
        f.name.endsWith('.cjs') ||
        f.language === 'javascript' ||
        f.language === 'typescript'
    );

    // ===== INLINE ALL CSS FILES =====
    cssFiles.forEach((cssFile) => {
      // First: replace the <link href="style.css"> tag with inline <style>
      const escapedName = cssFile.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const linkRegex = new RegExp(
        `<link[^>]*href=["'](?:\\.\\/|\\/)?${escapedName}["'][^>]*\\/?>`,
        'gi'
      );

      if (linkRegex.test(html)) {
        html = html.replace(
          linkRegex,
          `<style data-inlined="${cssFile.name}">\n/* Auto-bundled: ${cssFile.name} */\n${cssFile.content}\n</style>`
        );
      } else if (!html.includes(cssFile.content.slice(0, 40))) {
        // No <link> tag found — auto-inject before </head>
        if (html.includes('</head>')) {
          html = html.replace(
            '</head>',
            `<style data-inlined="${cssFile.name}">\n/* Auto-bundled: ${cssFile.name} */\n${cssFile.content}\n</style>\n</head>`
          );
        } else {
          html = `<style data-inlined="${cssFile.name}">\n/* Auto-bundled: ${cssFile.name} */\n${cssFile.content}\n</style>\n${html}`;
        }
      }
    });

    // ===== INLINE ALL JS FILES =====
    jsFiles.forEach((jsFile) => {
      // Remove the <script src="script.js"></script> tag
      const escapedName = jsFile.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const scriptRegex = new RegExp(
        `<script[^>]*src=["'](?:\\.\\/|\\/)?${escapedName}["'][^>]*>\\s*<\\/script>`,
        'gi'
      );
      html = html.replace(scriptRegex, '');

      if (!html.includes(jsFile.content.slice(0, 40))) {
        const injected = `<script data-inlined="${jsFile.name}">\n// Auto-bundled: ${jsFile.name}\ntry {\n${jsFile.content}\n} catch (e) { console.error('Error in ${jsFile.name}:', e); }\n</script>`;
        if (html.includes('</body>')) {
          html = html.replace('</body>', `${injected}\n</body>`);
        } else {
          html = `${html}\n${injected}`;
        }
      }
    });

    return html;
  }

  // ===== CSS PREVIEW PLAYGROUND =====
  if (lang === 'css' || file.name.endsWith('.css')) {
    // Also pull in any HTML/JS from same project for context
    const projectFiles = getProjectSiblingFiles(file, workspaceFiles);
    const htmlSibling = projectFiles.find((f) => f.name.endsWith('.html'));

    if (htmlSibling) {
      // We have an HTML sibling — build full project preview from that
      return buildLivePreviewBundle(htmlSibling, workspaceFiles);
    }

    // Standalone CSS preview
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CSS Preview - ${file.name}</title>
  <style>
    ${file.content}
  </style>
  <style>
    body { padding: 30px; font-family: sans-serif; }
  </style>
</head>
<body>
  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <h1>CSS Stylesheet Preview</h1>
    <p>Styles from <code>${file.path}</code> are loaded and applied here.</p>
    <button style="padding: 8px 16px; border-radius: 6px; cursor: pointer;">Sample Button</button>
  </div>
</body>
</html>`;
  }

  // ===== JS / TS / JSX / TSX LIVE RUNNER =====
  if (
    lang === 'javascript' ||
    lang === 'typescript' ||
    lang === 'js' ||
    lang === 'ts' ||
    lang === 'jsx' ||
    lang === 'tsx'
  ) {
    // Check for HTML sibling in same project
    const projectFiles = getProjectSiblingFiles(file, workspaceFiles);
    const htmlSibling = projectFiles.find((f) => f.name.endsWith('.html'));

    if (htmlSibling) {
      // Full project preview from HTML sibling
      return buildLivePreviewBundle(htmlSibling, workspaceFiles);
    }

    // Standalone JS runner
    const safeContent = JSON.stringify(file.content);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>JS Runner - ${file.name}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.6/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #090d16; color: #e2e8f0; padding: 20px; font-size: 13.5px; margin: 0; }
    #console-logs { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; min-height: 240px; max-height: 520px; overflow-y: auto; line-height: 1.6; }
    .log-line { border-bottom: 1px solid #1e293b; padding: 5px 0; display: flex; gap: 8px; font-size: 12.5px; }
    .log-time { color: #64748b; font-size: 11px; }
    .log-info { color: #38bdf8; }
    .log-error { color: #f43f5e; font-weight: bold; }
    .log-warn { color: #fbbf24; }
    .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .badge { background: #d97757; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; }
    #canvas-container { margin-top: 16px; }
  </style>
</head>
<body>
  <div class="header-bar">
    <div><strong>Live JS/TS Execution Console</strong> <span class="badge">${file.name}</span></div>
    <div style="color: #94a3b8; font-size: 12px;">Auto-transpiled sandbox</div>
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
      const rawCode = ${safeContent};
      let executable = rawCode;
      if (window.Babel) {
        try {
          const res = Babel.transform(rawCode, { presets: ['env', 'typescript', 'react'] });
          executable = res.code;
        } catch (babelErr) {
          printLog('warn', 'Babel note: ' + babelErr.message);
        }
      }
      const runFn = new Function('console', 'printLog', executable);
      runFn(console, printLog);
      printLog('info', '✅ Script completed execution.');
    } catch (err) {
      printLog('error', 'Execution Error: ' + (err ? err.message : String(err)));
    }
  </script>
</body>
</html>`;
  }

  // ===== SVG PREVIEW =====
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

  // ===== FALLBACK / TEXT / MARKDOWN =====
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

  let normalizedMarkdown = markdown;
  const fenceCount = (markdown.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) {
    normalizedMarkdown += '\n```';
  }

  const codeBlockRegex = /```(\w+)?(?:\s+([^\n\r]+))?\n([\s\S]*?)```/g;
  const files: ExtractedCodeFile[] = [];
  let match: RegExpExecArray | null;
  let counter = 1;

  while ((match = codeBlockRegex.exec(normalizedMarkdown)) !== null) {
    const rawLang = (match[1] || '').trim().toLowerCase();
    const commentOrFilename = (match[2] || '').trim();
    const codeContent = match[3] || '';
    if (!codeContent.trim()) continue;

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
export async function exportAllFilesAsZip(filesInput?: WorkspaceFile[]): Promise<void> {
  const files = filesInput && filesInput.length > 0 ? filesInput : loadWorkspaceFiles();
  const zip = new JSZip();

  for (const file of files) {
    const cleanPath = file.path.replace(/^\/+/, '') || file.name;
    if (file.content.startsWith('data:') && file.content.includes(';base64,')) {
      const base64Data = file.content.split(';base64,')[1];
      zip.file(cleanPath, base64Data, { base64: true });
    } else {
      zip.file(cleanPath, file.content);
    }
  }

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
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEY_AI_HISTORY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save AI history:', err);
  }
}

export function clearAiEditHistory(): void {
  localStorage.removeItem(STORAGE_KEY_AI_HISTORY);
}

export async function importZipArchive(file: File | Blob): Promise<WorkspaceFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const extractedFiles: WorkspaceFile[] = [];
  const now = Date.now();

  const filePromises: Promise<void>[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
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

  if (extractedFiles.length > 0) {
    const current = loadWorkspaceFiles();
    const updated = [...extractedFiles, ...current.filter((c) => !extractedFiles.some((e) => e.path === c.path))];
    saveWorkspaceFiles(updated);
  }

  return extractedFiles;
}

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