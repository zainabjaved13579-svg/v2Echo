import { WorkspaceFile } from '../types';
import { loadWorkspaceFiles, saveWorkspaceFiles } from './fileStorageService';

export interface CodexChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  engine?: string;
  modifiedFiles?: string[];
}

export interface CodexProject {
  id: string;
  name: string;
  description: string;
  engine: 'ensemble' | 'deepseek' | 'gemini' | 'google-ai-studio' | 'openai';
  createdAt: number;
  updatedAt: number;
  files: WorkspaceFile[];
  chatHistory: CodexChatMessage[];
}

const STORAGE_PROJECTS_KEY = 'sapphire_codex_projects_v1';
const STORAGE_CURRENT_PROJECT_KEY = 'sapphire_codex_current_project_id';

const DEFAULT_PROJECT_FILES: WorkspaceFile[] = [
  {
    id: 'f_index_html',
    name: 'index.html',
    path: '/workspace/index.html',
    language: 'html',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    autoSaved: true,
    source: 'ai-generated',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Master AI Studio Application</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-[#0f0f11] text-white min-h-screen flex flex-col antialiased selection:bg-[#d97757] selection:text-white">
  <!-- Navigation Header -->
  <header class="border-b border-[#252528] bg-[#141416]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#d97757] to-[#e69176] flex items-center justify-center font-bold text-white shadow-lg shadow-[#d97757]/20">
        ⚡
      </div>
      <div>
        <h1 class="text-base font-bold tracking-tight text-white flex items-center gap-2">
          Codex Master Program
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Live</span>
        </h1>
        <p class="text-[11px] text-[#8e8e93]">Built collectively by DeepSeek + Gemini + Google AI Studio + OpenAI</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button id="themeToggleBtn" class="px-3.5 py-1.5 rounded-xl bg-[#202024] hover:bg-[#2b2b30] text-xs font-medium text-white transition-colors border border-[#2e2e33]">
        Toggle Glow
      </button>
      <button id="actionBtn" class="px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-xs font-semibold text-white transition-all shadow-md active:scale-95">
        Run Engine
      </button>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="flex-1 max-w-5xl mx-auto px-6 py-12 w-full flex flex-col items-center text-center">
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1e24] border border-[#2b2b33] text-xs text-[#d97757] font-medium mb-6">
      <span class="w-2 h-2 rounded-full bg-[#d97757] animate-ping"></span>
      Autonomous Multi-Engine Intelligence
    </div>
    
    <h2 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-tight mb-4">
      Engineered with DeepSeek, Gemini, AI Studio & OpenAI
    </h2>
    <p class="text-base text-[#a3a3a8] max-w-2xl leading-relaxed mb-8">
      Your master program is live and connected. Chat on the side to write full-stack features, integrate databases, add animations, and deploy instant changes.
    </p>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left mb-10">
      <div class="p-5 rounded-2xl bg-[#17171a] border border-[#26262a] hover:border-[#38383e] transition-all">
        <div class="text-xs text-[#8e8e93] font-medium mb-1">Algorithmic Precision</div>
        <div class="text-2xl font-bold text-white mb-2">99.8%</div>
        <p class="text-xs text-[#a3a3a8]">DeepSeek Coder deep tree search logic.</p>
      </div>
      <div class="p-5 rounded-2xl bg-[#17171a] border border-[#26262a] hover:border-[#38383e] transition-all">
        <div class="text-xs text-[#8e8e93] font-medium mb-1">Realtime Streaming</div>
        <div class="text-2xl font-bold text-white mb-2">18ms</div>
        <p class="text-xs text-[#a3a3a8]">Gemini 2.5 Flash low latency token feed.</p>
      </div>
      <div class="p-5 rounded-2xl bg-[#17171a] border border-[#26262a] hover:border-[#38383e] transition-all">
        <div class="text-xs text-[#8e8e93] font-medium mb-1">Architecture Standard</div>
        <div class="text-2xl font-bold text-white mb-2">Production</div>
        <p class="text-xs text-[#a3a3a8]">Google AI Studio multi-file orchestration.</p>
      </div>
    </div>

    <!-- Interactive Component Box -->
    <div class="w-full p-6 rounded-3xl bg-[#141418] border border-[#26262e] text-left">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-white">Live Interactive Console</h3>
        <span id="statusBadge" class="text-xs text-emerald-400 font-medium">Ready</span>
      </div>
      <div class="flex gap-2">
        <input id="demoInput" type="text" placeholder="Type a message or state change..." class="flex-1 px-4 py-2.5 rounded-xl bg-[#1d1d22] border border-[#2e2e36] text-white text-sm focus:outline-none focus:border-[#d97757]">
        <button id="sendDemoBtn" class="px-5 py-2.5 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-sm font-semibold transition-all">
          Trigger
        </button>
      </div>
      <div id="outputConsole" class="mt-4 p-4 rounded-2xl bg-[#0d0d0f] border border-[#1e1e22] text-xs font-mono text-[#a3a3a8] min-h-[90px] whitespace-pre-wrap">
// Interactive state console initialized.
// Listening for user events...
      </div>
    </div>
  </main>

  <script src="app.js"></script>
</body>
</html>`
  },
  {
    id: 'f_styles_css',
    name: 'styles.css',
    path: '/workspace/styles.css',
    language: 'css',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    autoSaved: true,
    source: 'ai-generated',
    content: `/* Custom Application Styles */
:root {
  --primary: #d97757;
  --bg-dark: #0f0f11;
  --surface: #141416;
}

body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Smooth transitions */
button, input, a {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #141416;
}

::-webkit-scrollbar-thumb {
  background: #2a2a2e;
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3f3f45;
}`
  },
  {
    id: 'f_app_js',
    name: 'app.js',
    path: '/workspace/app.js',
    language: 'javascript',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    autoSaved: true,
    source: 'ai-generated',
    content: `// Codex Master Application Logic
document.addEventListener('DOMContentLoaded', () => {
  const actionBtn = document.getElementById('actionBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const sendDemoBtn = document.getElementById('sendDemoBtn');
  const demoInput = document.getElementById('demoInput');
  const outputConsole = document.getElementById('outputConsole');
  const statusBadge = document.getElementById('statusBadge');

  let count = 0;

  function log(msg) {
    const time = new Date().toLocaleTimeString();
    outputConsole.innerHTML = \`[\${time}] \${msg}\\n\` + outputConsole.innerHTML;
  }

  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      count++;
      statusBadge.textContent = \`Running Cycle #\${count}\`;
      statusBadge.className = 'text-xs text-[#d97757] font-semibold animate-pulse';
      log(\`Engine cycle #\${count} executed successfully across all models.\`);
    });
  }

  if (sendDemoBtn && demoInput) {
    sendDemoBtn.addEventListener('click', () => {
      const val = demoInput.value.trim();
      if (!val) return;
      log(\`User event triggered: "\${val}"\`);
      demoInput.value = '';
    });

    demoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendDemoBtn.click();
      }
    });
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('ring-1');
      document.body.classList.toggle('ring-[#d97757]/40');
      log('Dynamic ambient glow toggled.');
    });
  }

  log('System online. Multi-model collaboration ready.');
});`
  }
];

export function getStoredProjects(): CodexProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse projects:', err);
  }

  // Fallback initial default project
  const initialProject: CodexProject = {
    id: 'proj_default_master',
    name: 'Master Web Program',
    description: 'Autonomous full-stack application synthesized by DeepSeek, Gemini, Google AI Studio & OpenAI',
    engine: 'ensemble',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
    files: DEFAULT_PROJECT_FILES,
    chatHistory: [
      {
        id: 'msg_welcome',
        role: 'model',
        text: 'Welcome to Codex Master Studio. DeepSeek Coder, Gemini 2.5 Flash, Google AI Studio, and OpenAI GPT-4o are connected and working together. What would you like to build, update, or refactor today?',
        timestamp: Date.now() - 3600000,
        engine: 'ensemble'
      }
    ]
  };

  saveProjects([initialProject]);
  return [initialProject];
}

export function saveProjects(projects: CodexProject[]): void {
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to storage:', err);
  }
}

export function getCurrentProjectId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_CURRENT_PROJECT_KEY);
    if (saved) return saved;
  } catch {
    // ignore
  }
  const projects = getStoredProjects();
  return projects[0]?.id || '';
}

export function setCurrentProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_CURRENT_PROJECT_KEY, id);
  } catch {
    // ignore
  }
}

export function createNewProject(
  name: string,
  description: string,
  engine: CodexProject['engine'] = 'ensemble'
): CodexProject {
  const newProj: CodexProject = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim() || 'Untitled Project',
    description: description.trim() || 'Custom web application',
    engine,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    files: JSON.parse(JSON.stringify(DEFAULT_PROJECT_FILES)),
    chatHistory: [
      {
        id: `msg_init_${Date.now()}`,
        role: 'model',
        text: `New project "${name || 'Untitled'}" initialized with DeepSeek, Gemini, AI Studio, and OpenAI. Ready to write code!`,
        timestamp: Date.now(),
        engine
      }
    ]
  };

  const projects = getStoredProjects();
  const updated = [newProj, ...projects];
  saveProjects(updated);
  setCurrentProjectId(newProj.id);
  saveWorkspaceFiles(newProj.files);
  return newProj;
}

export function updateProject(updatedProject: CodexProject): void {
  const projects = getStoredProjects();
  const index = projects.findIndex((p) => p.id === updatedProject.id);
  if (index !== -1) {
    projects[index] = { ...updatedProject, updatedAt: Date.now() };
  } else {
    projects.unshift(updatedProject);
  }
  saveProjects(projects);
}

export function deleteProject(id: string): CodexProject[] {
  const projects = getStoredProjects().filter((p) => p.id !== id);
  saveProjects(projects);
  if (getCurrentProjectId() === id && projects.length > 0) {
    setCurrentProjectId(projects[0].id);
  }
  return projects;
}
