/**
 * Google AI Studio App Engine & Codex Generator
 * Powers multi-file autonomous web applications with instant live preview.
 */

import { WorkspaceFile } from '../types';
import { getLanguageFromFileName } from './fileStorageService';

export interface GeneratedAppProject {
  title: string;
  description: string;
  files: WorkspaceFile[];
  summary: string;
}

/**
 * Parse multi-file code blocks from AI Studio response into structured files.
 */
export function parseGeneratedProjectFiles(aiResponseText: string): WorkspaceFile[] {
  const files: WorkspaceFile[] = [];
  const regex = /```([a-zA-Z0-9_-]+)?(?:\s+([a-zA-Z0-9_.\-\/\\]+))?\n([\s\S]*?)```/g;

  let match: RegExpExecArray | null;
  let fileIndex = 0;

  while ((match = regex.exec(aiResponseText)) !== null) {
    const rawLang = (match[1] || '').trim().toLowerCase();
    let filename = (match[2] || '').trim();
    const code = match[3] || '';

    // If filename wasn't in language tag, check first line comments e.g. // index.html or <!-- index.html -->
    if (!filename) {
      const firstLine = code.trim().split('\n')[0] || '';
      const commentMatch = firstLine.match(/(?:\/\/\s*|<!--\s*|#\s*)([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)(?:\s*-->)?/i);
      if (commentMatch && commentMatch[1]) {
        filename = commentMatch[1];
      }
    }

    if (!filename) {
      if (rawLang === 'html') filename = fileIndex === 0 ? 'index.html' : `page_${fileIndex}.html`;
      else if (rawLang === 'css') filename = 'styles.css';
      else if (rawLang === 'js' || rawLang === 'javascript') filename = 'app.js';
      else if (rawLang === 'ts' || rawLang === 'typescript') filename = 'app.ts';
      else if (rawLang === 'json') filename = 'package.json';
      else filename = `module_${fileIndex}.${rawLang || 'txt'}`;
    }

    const cleanName = filename.replace(/^[\/\\]+/, '').split('/').pop() || filename;
    const cleanPath = `/workspace/${filename.replace(/^[\/\\]+/, '')}`;

    files.push({
      id: `ai_file_${Date.now()}_${fileIndex}`,
      name: cleanName,
      path: cleanPath,
      content: code,
      language: getLanguageFromFileName(cleanName) || rawLang || 'text',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      autoSaved: true,
      source: 'ai-generated'
    });

    fileIndex++;
  }

  // If no code blocks found, fallback to single HTML app if text contains HTML
  if (files.length === 0 && aiResponseText.includes('<html')) {
    files.push({
      id: `ai_file_${Date.now()}_0`,
      name: 'index.html',
      path: '/workspace/index.html',
      content: aiResponseText,
      language: 'html',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      autoSaved: true,
      source: 'ai-generated'
    });
  }

  return files;
}

/**
 * Escapes raw strings for safe HTML rendering
 */
function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders Markdown file content as rich formatted HTML
 */
function renderMarkdownToHtml(markdown: string, filename: string): string {
  const safeContent = JSON.stringify(markdown);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(filename)} - Markdown Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
</head>
<body class="bg-[#0e0f12] text-slate-100 p-4 sm:p-8 min-h-screen font-sans selection:bg-[#d97757]/30">
  <div class="max-w-4xl mx-auto space-y-4">
    <div class="flex items-center justify-between border-b border-[#272a33] pb-4">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full bg-purple-400"></span>
        <span class="font-bold text-base text-white font-mono">${escapeHtml(filename)}</span>
        <span class="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
          Markdown
        </span>
      </div>
      <span class="text-xs text-slate-400 font-mono">${markdown.split('\n').length} lines</span>
    </div>
    <div id="content" class="prose prose-invert max-w-none bg-[#16171d] border border-[#272a33] rounded-3xl p-6 sm:p-8 shadow-2xl leading-relaxed text-sm overflow-x-auto">
      <!-- Rendered by Marked.js -->
    </div>
  </div>
  <script>
    const raw = ${safeContent};
    marked.setOptions({
      highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      breaks: true,
      gfm: true
    });
    document.getElementById('content').innerHTML = marked.parse(raw);
  </script>
</body>
</html>`;
}

/**
 * Renders CSV file content as an interactive dynamic table
 */
function renderCsvToHtml(csvText: string, filename: string): string {
  const safeCsv = JSON.stringify(csvText);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(filename)} - CSV Spreadsheet Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0e0f12] text-slate-100 p-3 sm:p-6 min-h-screen font-sans">
  <div class="max-w-6xl mx-auto space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#272a33] pb-4">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
        <h1 class="font-bold text-base text-white font-mono">${escapeHtml(filename)}</h1>
        <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
          CSV Spreadsheet
        </span>
      </div>
      <div class="flex items-center gap-3">
        <input
          id="search-input"
          type="text"
          placeholder="Filter rows..."
          class="px-3 py-1.5 rounded-xl bg-[#1c1d24] border border-[#2e313d] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d97757]"
        />
        <span id="row-count" class="text-xs text-slate-400 font-mono">Loading...</span>
      </div>
    </div>
    <div class="bg-[#16171d] border border-[#272a33] rounded-3xl overflow-hidden shadow-2xl">
      <div class="overflow-x-auto max-h-[75vh]">
        <table id="csv-table" class="w-full text-left text-xs border-collapse">
          <!-- Populated by JS -->
        </table>
      </div>
    </div>
  </div>
  <script>
    const raw = ${safeCsv};
    
    function parseCSV(text) {
      const p = [];
      let row = [''];
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i+1];
        if (c === '"') {
          if (inQuotes && next === '"') { row[row.length - 1] += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (c === ',' && !inQuotes) {
          row.push('');
        } else if ((c === '\\r' || c === '\\n') && !inQuotes) {
          if (c === '\\r' && next === '\\n') i++;
          p.push(row);
          row = [''];
        } else {
          row[row.length - 1] += c;
        }
      }
      if (row.length > 1 || row[0] !== '') p.push(row);
      return p.filter(r => r.some(cell => cell.trim().length > 0));
    }

    const rows = parseCSV(raw);
    const table = document.getElementById('csv-table');
    const rowCountEl = document.getElementById('row-count');
    const searchInput = document.getElementById('search-input');

    function renderTable(filter = '') {
      if (rows.length === 0) {
        table.innerHTML = '<tbody><tr><td class="p-6 text-center text-slate-400">Empty CSV file</td></tr></tbody>';
        rowCountEl.textContent = '0 rows';
        return;
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);
      const filtered = filter ? dataRows.filter(r => r.join(' ').toLowerCase().includes(filter.toLowerCase())) : dataRows;

      rowCountEl.textContent = filtered.length + ' / ' + dataRows.length + ' rows';

      let html = '<thead class="bg-[#1c1d25] sticky top-0 border-b border-[#2d303d] text-slate-200 uppercase tracking-wider text-[11px] font-semibold"><tr>';
      html += '<th class="p-3 w-12 text-center text-slate-500">#</th>';
      headers.forEach(h => {
        html += '<th class="p-3 font-semibold text-slate-200 whitespace-nowrap">' + escape(h) + '</th>';
      });
      html += '</tr></thead><tbody class="divide-y divide-[#21232c]">';

      filtered.forEach((r, idx) => {
        html += '<tr class="hover:bg-[#1a1b22] transition-colors">';
        html += '<td class="p-3 text-center text-slate-500 font-mono text-[10px]">' + (idx + 1) + '</td>';
        headers.forEach((_, colIdx) => {
          const val = r[colIdx] || '';
          html += '<td class="p-3 text-slate-300 font-mono whitespace-nowrap max-w-xs truncate" title="' + escape(val) + '">' + escape(val) + '</td>';
        });
        html += '</tr>';
      });

      html += '</tbody>';
      table.innerHTML = html;
    }

    function escape(s) {
      return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    searchInput.addEventListener('input', (e) => renderTable(e.target.value));
    renderTable();
  </script>
</body>
</html>`;
}

/**
 * Renders SVG file content live
 */
function renderSvgToHtml(svgContent: string, filename: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(filename)} - SVG Vector Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0e0f12] text-slate-100 p-4 sm:p-8 min-h-screen flex flex-col items-center justify-center font-sans">
  <div class="w-full max-w-3xl bg-[#16171d] border border-[#272a33] rounded-3xl p-6 shadow-2xl space-y-4">
    <div class="flex items-center justify-between border-b border-[#272a33] pb-3">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full bg-amber-400"></span>
        <span class="font-bold text-base text-white font-mono">${escapeHtml(filename)}</span>
        <span class="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
          SVG Graphic
        </span>
      </div>
      <button onclick="toggleBg()" class="text-xs px-3 py-1 rounded-xl bg-[#22242e] hover:bg-[#2b2e3b] text-slate-300 border border-[#2f3240] transition">
        Toggle Background
      </button>
    </div>
    <div id="svg-canvas" class="min-h-[350px] p-8 flex items-center justify-center rounded-2xl bg-[#0c0d11] border border-[#20222a] overflow-hidden transition-colors">
      <div class="max-w-full max-h-[60vh] flex items-center justify-center">
        ${svgContent}
      </div>
    </div>
  </div>
  <script>
    let isDark = true;
    function toggleBg() {
      const el = document.getElementById('svg-canvas');
      isDark = !isDark;
      el.className = isDark
        ? 'min-h-[350px] p-8 flex items-center justify-center rounded-2xl bg-[#0c0d11] border border-[#20222a] overflow-hidden transition-colors'
        : 'min-h-[350px] p-8 flex items-center justify-center rounded-2xl bg-white border border-slate-200 overflow-hidden transition-colors';
    }
  </script>
</body>
</html>`;
}

/**
 * Renders JSON file content in formatted tree viewer
 */
function renderJsonToHtml(jsonText: string, filename: string): string {
  let formatted = jsonText;
  let isValid = true;
  try {
    const parsed = JSON.parse(jsonText);
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    isValid = false;
  }

  const safeJson = JSON.stringify(formatted);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(filename)} - JSON Data Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
</head>
<body class="bg-[#0e0f12] text-slate-100 p-4 sm:p-8 min-h-screen font-sans">
  <div class="max-w-4xl mx-auto space-y-4">
    <div class="flex items-center justify-between border-b border-[#272a33] pb-3">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full ${isValid ? 'bg-amber-400' : 'bg-rose-400'}"></span>
        <span class="font-bold text-base text-white font-mono">${escapeHtml(filename)}</span>
        <span class="text-xs px-2.5 py-0.5 rounded-full ${isValid ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'} font-semibold border">
          ${isValid ? 'Valid JSON' : 'Invalid JSON Syntax'}
        </span>
      </div>
      <button onclick="navigator.clipboard.writeText(${safeJson}); this.innerText='Copied!';" class="text-xs px-3 py-1.5 rounded-xl bg-[#20222a] hover:bg-[#2b2e3b] text-white border border-[#2f3240] transition">
        Copy JSON
      </button>
    </div>
    <div class="bg-[#16171d] border border-[#272a33] rounded-3xl p-5 shadow-2xl overflow-x-auto max-h-[78vh] font-mono text-xs leading-relaxed">
      <pre><code class="language-json">${escapeHtml(formatted)}</code></pre>
    </div>
  </div>
  <script>hljs.highlightAll();</script>
</body>
</html>`;
}

/**
 * Renders CSS file with a live interactive component testbench
 */
function renderCssShowcaseToHtml(cssText: string, filename: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(filename)} - CSS Stylesheet Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
${cssText}
  </style>
</head>
<body class="bg-[#0e0f12] text-slate-100 p-4 sm:p-8 min-h-screen font-sans">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between border-b border-[#272a33] pb-4">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full bg-cyan-400"></span>
        <span class="font-bold text-base text-white font-mono">${escapeHtml(filename)}</span>
        <span class="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
          CSS Stylesheet
        </span>
      </div>
      <span class="text-xs text-slate-400 font-mono">${cssText.split('\n').length} lines</span>
    </div>

    <!-- Live Component Test Bench using the styles -->
    <div class="bg-[#16171d] border border-[#272a33] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-[#272a33] pb-2">
        Live CSS Component Showcase
      </h2>
      
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-300 mb-2">Typography & Headings</h3>
          <h1 class="text-2xl font-bold">Heading Level 1 Example</h1>
          <h2 class="text-xl font-bold">Heading Level 2 Example</h2>
          <p class="text-sm text-slate-400 mt-1">This paragraph tests font styles, line heights, and color variables declared in ${escapeHtml(filename)}.</p>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-slate-300 mb-2">Buttons & Controls</h3>
          <div class="flex flex-wrap gap-2.5">
            <button class="btn btn-primary px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-md">Primary Button</button>
            <button class="btn btn-secondary px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700">Secondary Button</button>
            <button class="btn btn-danger px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs">Danger</button>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-slate-300 mb-2">Cards & Containers</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="card p-4 rounded-2xl bg-[#1c1d25] border border-[#292c3a] shadow-lg">
              <h4 class="font-bold text-sm text-white mb-1">Standard Card</h4>
              <p class="text-xs text-slate-400">Card container verifying border-radius, background, and shadows.</p>
            </div>
            <div class="card p-4 rounded-2xl bg-[#1c1d25] border border-[#292c3a] shadow-lg">
              <h4 class="font-bold text-sm text-white mb-1">Interactive Element</h4>
              <p class="text-xs text-slate-400">Verifying hover effects and interactive styles.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Renders any code file (Python, JS, C++, SQL, Shell, etc.) with clean syntax highlighting
 */
function renderCodeViewerToHtml(codeText: string, filename: string, language: string): string {
  const safeCode = escapeHtml(codeText);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(filename)} - Code Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
</head>
<body class="bg-[#0e0f12] text-slate-100 p-3 sm:p-6 min-h-screen font-sans">
  <div class="max-w-4xl mx-auto space-y-4">
    <div class="flex items-center justify-between border-b border-[#272a33] pb-3">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full bg-blue-500 shadow-xs"></span>
        <span class="font-bold text-base text-white font-mono">${escapeHtml(filename)}</span>
        <span class="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold uppercase border border-blue-500/30">
          ${escapeHtml(language || filename.split('.').pop() || 'Code')}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-400 font-mono">${codeText.split('\n').length} lines</span>
        <button onclick="navigator.clipboard.writeText(document.getElementById('code-block').innerText); this.innerText='Copied!';" class="text-xs px-3 py-1.5 rounded-xl bg-[#20222a] hover:bg-[#2b2e3b] text-white border border-[#2f3240] transition">
          Copy Code
        </button>
      </div>
    </div>
    <div class="bg-[#16171d] border border-[#272a33] rounded-3xl p-5 shadow-2xl overflow-x-auto max-h-[78vh] font-mono text-xs leading-relaxed">
      <pre><code id="code-block" class="language-${escapeHtml(language || 'plaintext')}">${safeCode}</code></pre>
    </div>
  </div>
  <script>hljs.highlightAll();</script>
</body>
</html>`;
}

/**
 * Builds a single HTML application page bundled with all project styles and scripts
 */
function renderSingleHtmlApp(htmlFile: WorkspaceFile, allFiles: WorkspaceFile[]): string {
  let htmlContent = htmlFile.content || '';

  if (!htmlContent.toLowerCase().includes('<html')) {
    htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(htmlFile.name)}</title>
</head>
<body>
${htmlContent}
</body>
</html>`;
  }

  // Ensure Tailwind CDN
  htmlContent = htmlContent.replace(
    /<script[^>]*src="[^"]*@tailwindcss\/browser[^"]*"[^>]*><\/script>/gi,
    '<script src="https://cdn.tailwindcss.com"></script>'
  );
  if (!htmlContent.includes('tailwindcss.com')) {
    const twScript = '<script src="https://cdn.tailwindcss.com"></script>';
    htmlContent = htmlContent.includes('<head>')
      ? htmlContent.replace('<head>', `<head>\n  ${twScript}`)
      : `${twScript}\n${htmlContent}`;
  }

  const cssFiles = allFiles.filter(f => f.name.toLowerCase().endsWith('.css'));
  const jsFiles = allFiles.filter(f => {
    const n = f.name.toLowerCase();
    return n.endsWith('.js') || n.endsWith('.jsx') || n.endsWith('.ts') || n.endsWith('.tsx') || n.endsWith('.mjs');
  });

  const reactHeaders = `
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.6/babel.min.js"></script>`;

  if (!htmlContent.includes('react.production.min.js')) {
    htmlContent = htmlContent.includes('<head>')
      ? htmlContent.replace('<head>', `<head>\n${reactHeaders}`)
      : `${reactHeaders}\n${htmlContent}`;
  }

  // Inline CSS files
  cssFiles.forEach(c => {
    const linkRegex = new RegExp(`<link[^>]*href=["'](?:\\.\\/)?${c.name.replace('.', '\\.')}["'][^>]*>`, 'gi');
    if (linkRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(linkRegex, `<style data-file="${c.name}">\n/* ${c.name} */\n${c.content}\n</style>`);
    }
  });

  const remainingCss = cssFiles.filter(c => !htmlContent.includes(`/* ${c.name} */`));
  if (remainingCss.length > 0) {
    const combined = remainingCss.map(c => `/* ${c.name} */\n${c.content}`).join('\n\n');
    const styleTag = `<style id="injected-workspace-styles">\n${combined}\n</style>`;
    htmlContent = htmlContent.includes('</head>')
      ? htmlContent.replace('</head>', `${styleTag}\n</head>`)
      : `${styleTag}\n${htmlContent}`;
  }

  // Strip local <script src="..."> for scripts we are bundling
  jsFiles.forEach(j => {
    const scriptRegex = new RegExp(`<script[^>]*src=["'](?:\\.\\/)?${j.name.replace('.', '\\.')}["'][^>]*>\\s*<\\/script>`, 'gi');
    htmlContent = htmlContent.replace(scriptRegex, '');
  });

  // Prepare environment shim & runner
  const envShimScript = `
  <script>
    window.process = window.process || { env: { NODE_ENV: 'production' } };
    window.global = window;
    window.exports = window.exports || {};
    window.module = window.module || { exports: window.exports };
    window.require = function(mod) {
      if (mod === 'react') return window.React;
      if (mod === 'react-dom' || mod === 'react-dom/client') return window.ReactDOM;
      if (mod === 'lucide-react') return window.lucide || {};
      return window[mod] || {};
    };

    function showPreviewError(filename, err) {
      try {
        var existing = document.getElementById('sapphire-preview-error-toast');
        if (existing) existing.remove();
        var errBox = document.createElement('div');
        errBox.id = 'sapphire-preview-error-toast';
        errBox.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;max-width:540px;margin:0 auto;z-index:999999;background:#18181b;border:1px solid #d97757;border-radius:16px;padding:12px 16px;color:#fecdd3;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;box-shadow:0 12px 30px rgba(0,0,0,0.7);display:flex;align-items:flex-start;gap:12px;line-height:1.4;';
        errBox.innerHTML = '<span style="font-size:16px;line-height:1;">⚠️</span><div style="flex:1;"><strong style="color:#fff;display:block;margin-bottom:2px;font-size:12px;font-family:system-ui,sans-serif;">Preview Notice (' + filename + ')</strong><span>' + (err && err.message ? err.message : String(err)) + '</span></div><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#999;cursor:pointer;font-size:18px;padding:0 6px;">&times;</button>';
        document.body.appendChild(errBox);
      } catch(e) {}
    }

    window.addEventListener('error', function(e) {
      showPreviewError(e.filename ? e.filename.split('/').pop() : 'runtime', e.error || e.message);
    });
  </script>`;

  // Safe script blocks
  const scriptBlocks = jsFiles.map((j) => {
    const safeContent = JSON.stringify(j.content);
    return `
    <script>
      (function() {
        var fileName = ${JSON.stringify(j.name)};
        var code = ${safeContent};
        try {
          var isJsx = fileName.indexOf('.jsx') !== -1 || fileName.indexOf('.tsx') !== -1 || code.indexOf('import ') !== -1 || code.indexOf('export ') !== -1 || (code.indexOf('<') !== -1 && code.indexOf('/>') !== -1);
          if (window.Babel && isJsx) {
            try {
              code = window.Babel.transform(code, {
                presets: ['env', 'react']
              }).code;
            } catch(be) {
              console.warn('Babel transpile notice for ' + fileName + ':', be);
            }
          }
          var fn = new Function('React', 'ReactDOM', 'require', 'exports', 'module', code);
          fn(window.React, window.ReactDOM, window.require, window.exports, window.module);
        } catch(err) {
          console.error('Execution error in ' + fileName + ':', err);
          showPreviewError(fileName, err);
        }
      })();
    </script>`;
  }).join('\n');

  // React auto-mounter & Lucide activator
  const autoMountScript = `
  <script>
    (function() {
      function __initSapphireApp__() {
        try {
          if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
          }
        } catch(e) {}

        try {
          var rootEl = document.getElementById('root') || document.getElementById('app');
          if (rootEl && rootEl.childNodes.length === 0 && window.React && window.ReactDOM) {
            var AppComp = window.App || (window.exports && (window.exports.default || window.exports.App));
            if (AppComp) {
              if (window.ReactDOM.createRoot) {
                var root = window.ReactDOM.createRoot(rootEl);
                root.render(window.React.createElement(AppComp));
              } else {
                window.ReactDOM.render(window.React.createElement(AppComp), rootEl);
              }
            }
          }
        } catch(err) {
          console.warn('Sapphire auto-mount notice:', err);
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', __initSapphireApp__);
      } else {
        setTimeout(__initSapphireApp__, 50);
      }
    })();
  </script>`;

  const bundleFooter = `${envShimScript}\n${scriptBlocks}\n${autoMountScript}`;

  if (htmlContent.includes('</body>')) {
    htmlContent = htmlContent.replace('</body>', `${bundleFooter}\n</body>`);
  } else {
    htmlContent = `${htmlContent}\n${bundleFooter}`;
  }

  return htmlContent;
}

/**
 * Renders React (JSX / TSX) component live with Babel, React, ReactDOM, and Lucide
 */
function renderReactComponentToHtml(codeText: string, filename: string): string {
  const safeCode = JSON.stringify(codeText);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(filename)} - React Component Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.6/babel.min.js"></script>
  <style>
    body { margin: 0; background: #0f1015; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body class="p-3 sm:p-6 min-h-screen flex flex-col justify-start">
  <div class="w-full max-w-4xl mx-auto space-y-4">
    <div class="flex items-center justify-between border-b border-[#252834] pb-3 select-none">
      <div class="flex items-center gap-2.5">
        <span class="w-3 h-3 rounded-full bg-cyan-400"></span>
        <span class="font-bold text-sm text-white font-mono">${escapeHtml(filename)}</span>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
          React Live Component
        </span>
      </div>
      <span class="text-xs text-slate-400 font-mono">${codeText.split('\n').length} lines</span>
    </div>
    <div id="root" class="bg-[#15161e] border border-[#272a33] rounded-3xl p-6 shadow-2xl min-h-[300px]"></div>
  </div>
  <script>
    window.process = { env: { NODE_ENV: 'production' } };
    window.global = window;
    window.exports = {};
    window.module = { exports: window.exports };
    window.require = function(m) {
      if (m === 'react') return window.React;
      if (m === 'react-dom' || m === 'react-dom/client') return window.ReactDOM;
      if (m === 'lucide-react') return window.lucide || {};
      return window[m] || {};
    };

    var rawCode = ${safeCode};
    try {
      var transformed = Babel.transform(rawCode, {
        presets: ['env', 'react']
      }).code;
      
      var compFn = new Function('React', 'ReactDOM', 'require', 'exports', 'module', transformed);
      compFn(window.React, window.ReactDOM, window.require, window.exports, window.module);
      
      var Comp = window.App || window.exports.default || Object.values(window.exports).find(function(v) { return typeof v === 'function'; });
      if (Comp) {
        var root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Comp));
        if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
      } else {
        document.getElementById('root').innerHTML = '<div class="p-6 text-center text-slate-400"><p class="text-sm font-semibold text-white">Component Ready</p><p class="text-xs mt-1">Export your component with <code>export default</code> or <code>function App()</code> to auto-mount.</p></div>';
      }
    } catch(err) {
      document.getElementById('root').innerHTML = '<div class="p-4 bg-rose-950/40 border border-rose-800 rounded-2xl text-rose-200"><strong class="block text-sm font-bold text-rose-100 mb-1">React Runtime Notice:</strong><pre class="text-xs font-mono whitespace-pre-wrap leading-relaxed">' + (err.message || String(err)) + '</pre></div>';
    }
  </script>
</body>
</html>`;
}

/**
 * Builds an interactive, unified multi-file dashboard previewing ALL project files
 */
function renderAllFilesDashboard(files: WorkspaceFile[]): string {
  const safeFiles = JSON.stringify(
    files.map(f => ({
      id: f.id,
      name: f.name,
      language: f.language || f.name.split('.').pop() || 'text',
      content: f.content,
      lines: (f.content || '').split('\n').length
    }))
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Files Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
</head>
<body class="bg-[#0b0c0f] text-slate-100 p-3 sm:p-6 min-h-screen font-sans selection:bg-[#d97757]/30">
  <div class="max-w-6xl mx-auto space-y-5">
    <!-- Header -->
    <div class="sticky top-0 z-30 bg-[#0b0c0f]/95 backdrop-blur-md py-3 border-b border-[#272a33] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-lg font-bold text-white flex items-center gap-2">
          <span>All Project Files Live Preview</span>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-[#d97757]/20 text-[#d97757] font-semibold border border-[#d97757]/30">
            ${files.length} Files
          </span>
        </h1>
        <p class="text-xs text-slate-400 mt-0.5">Interactive live rendering and code inspector for every file in the project.</p>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <input
          id="file-search"
          type="text"
          placeholder="Filter files..."
          class="px-3 py-1.5 rounded-xl bg-[#171821] border border-[#2c2f3d] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d97757]"
        />
      </div>
    </div>

    <!-- Quick Jump Bar -->
    <div id="file-chips" class="flex flex-wrap gap-1.5 pb-2">
      <!-- File jump chips populated by JS -->
    </div>

    <!-- File Cards Container -->
    <div id="file-cards" class="space-y-6">
      <!-- File cards rendered by JS -->
    </div>
  </div>

  <script>
    const files = ${safeFiles};
    const chipsContainer = document.getElementById('file-chips');
    const cardsContainer = document.getElementById('file-cards');
    const searchInput = document.getElementById('file-search');

    function renderFiles(filter = '') {
      chipsContainer.innerHTML = '';
      cardsContainer.innerHTML = '';

      const query = filter.toLowerCase().trim();
      const filtered = query
        ? files.filter(f => f.name.toLowerCase().includes(query) || f.language.toLowerCase().includes(query) || f.content.toLowerCase().includes(query))
        : files;

      if (filtered.length === 0) {
        cardsContainer.innerHTML = '<div class="p-12 text-center text-slate-400 bg-[#16171d] rounded-3xl border border-[#272a33]">No matching files found.</div>';
        return;
      }

      // Render Chips
      filtered.forEach((f, idx) => {
        const chip = document.createElement('a');
        chip.href = '#file-card-' + idx;
        chip.className = 'px-3 py-1 rounded-xl text-xs font-mono bg-[#171821] hover:bg-[#20222f] text-slate-300 border border-[#2b2e3c] transition-colors flex items-center gap-1.5';
        chip.innerHTML = '<span class="w-2 h-2 rounded-full ' + getDotColor(f.name) + '"></span><span>' + escape(f.name) + '</span>';
        chipsContainer.appendChild(chip);
      });

      // Render Cards
      filtered.forEach((f, idx) => {
        const card = document.createElement('div');
        card.id = 'file-card-' + idx;
        card.className = 'bg-[#15161d] border border-[#272a33] rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4 sm:p-6';

        const ext = f.name.split('.').pop().toLowerCase();
        let previewBody = '';

        if (ext === 'html' || ext === 'htm') {
          previewBody = '<div class="border border-[#2b2e3c] rounded-2xl overflow-hidden bg-white shadow-inner"><iframe srcdoc="' + escapeAttr(f.content) + '" class="w-full h-80 border-0" sandbox="allow-scripts allow-same-origin"></iframe></div>';
        } else if (ext === 'md' || ext === 'markdown') {
          previewBody = '<div class="prose prose-invert max-w-none bg-[#0e0f14] p-5 rounded-2xl border border-[#22242f] text-xs leading-relaxed overflow-x-auto">' + marked.parse(f.content) + '</div>';
        } else if (ext === 'csv') {
          previewBody = renderCsvPreview(f.content);
        } else if (ext === 'svg' || f.content.trim().startsWith('<svg')) {
          previewBody = '<div class="p-6 bg-[#0c0d12] rounded-2xl border border-[#22242f] flex items-center justify-center min-h-[220px] max-h-[360px] overflow-hidden">' + f.content + '</div>';
        } else if (ext === 'json') {
          let pretty = f.content;
          try { pretty = JSON.stringify(JSON.parse(f.content), null, 2); } catch(e){}
          previewBody = '<div class="bg-[#0c0d12] p-4 rounded-2xl border border-[#22242f] overflow-x-auto text-xs font-mono max-h-80"><pre><code class="language-json">' + escape(pretty) + '</code></pre></div>';
        } else {
          previewBody = '<div class="bg-[#0c0d12] p-4 rounded-2xl border border-[#22242f] overflow-x-auto text-xs font-mono max-h-80"><pre><code class="language-' + escape(f.language || 'plaintext') + '">' + escape(f.content) + '</code></pre></div>';
        }

        card.innerHTML = \`
          <div class="flex items-center justify-between border-b border-[#252834] pb-3">
            <div class="flex items-center gap-2.5">
              <span class="w-3 h-3 rounded-full \${getDotColor(f.name)}"></span>
              <span class="font-bold text-sm text-white font-mono">\${escape(f.name)}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#20222e] text-slate-300 font-semibold border border-[#2c2f3d]">
                \${escape(f.language.toUpperCase())}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400 font-mono">\${f.lines} lines</span>
              <button onclick="navigator.clipboard.writeText(\${JSON.stringify(f.content)}); this.innerText='Copied!';" class="text-[11px] px-2.5 py-1 rounded-lg bg-[#20222e] hover:bg-[#2b2e3c] text-white border border-[#2c2f3d] transition">
                Copy
              </button>
            </div>
          </div>
          <div>\${previewBody}</div>
        \`;

        cardsContainer.appendChild(card);
      });

      hljs.highlightAll();
    }

    function renderCsvPreview(csv) {
      const lines = csv.split('\\n').filter(l => l.trim());
      if (lines.length === 0) return '<p class="text-xs text-slate-500">Empty CSV</p>';
      const headers = lines[0].split(',');
      const rows = lines.slice(1, 11);
      let t = '<div class="overflow-x-auto max-h-72 border border-[#252834] rounded-2xl bg-[#0c0d12]"><table class="w-full text-left text-xs border-collapse">';
      t += '<thead class="bg-[#181922] sticky top-0 text-slate-300 text-[10px] uppercase"><tr>';
      headers.forEach(h => { t += '<th class="p-2.5 border-b border-[#252834] whitespace-nowrap font-semibold">' + escape(h.replace(/"/g, '')) + '</th>'; });
      t += '</tr></thead><tbody class="divide-y divide-[#1e202b]">';
      rows.forEach(r => {
        t += '<tr>';
        r.split(',').forEach(c => { t += '<td class="p-2.5 text-slate-300 font-mono text-[11px] whitespace-nowrap truncate max-w-xs">' + escape(c.replace(/"/g, '')) + '</td>'; });
        t += '</tr>';
      });
      t += '</tbody></table></div>';
      if (lines.length > 11) t += '<p class="text-[11px] text-slate-400 mt-1.5 text-right font-mono">Showing first 10 of ' + (lines.length - 1) + ' rows</p>';
      return t;
    }

    function getDotColor(name) {
      const ext = name.split('.').pop().toLowerCase();
      if (ext === 'html') return 'bg-orange-500';
      if (ext === 'css') return 'bg-cyan-400';
      if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') return 'bg-yellow-400';
      if (ext === 'csv') return 'bg-emerald-400';
      if (ext === 'md') return 'bg-purple-400';
      if (ext === 'svg') return 'bg-pink-400';
      if (ext === 'json') return 'bg-amber-400';
      return 'bg-blue-400';
    }

    function escape(s) {
      return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escapeAttr(s) {
      return escape(s).replace(/"/g, '&quot;');
    }

    searchInput.addEventListener('input', (e) => renderFiles(e.target.value));
    renderFiles();
  </script>
</body>
</html>`;
}

/**
 * Builds an all-in-one unified live interactive bundle preview from files.
 * Supports:
 *  - 'app': Bundles index.html + CSS + JS into live standalone web app
 *  - 'selected': Previews the currently selected file (HTML, Markdown, CSV, SVG, JSON, CSS, React, Code)
 *  - 'all': Renders an interactive multi-file dashboard previewing all files together
 */
export function buildUnifiedLivePreviewBundle(
  files: WorkspaceFile[],
  selectedFileId?: string,
  previewScope: 'app' | 'selected' | 'all' = 'selected'
): string {
  if (!files || files.length === 0) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#111111] text-white flex items-center justify-center min-h-screen font-sans">
  <div class="text-center p-8">
    <div class="w-12 h-12 rounded-2xl bg-[#d97757]/20 border border-[#d97757]/40 text-[#d97757] flex items-center justify-center mx-auto mb-3 font-bold text-xl">
      &lt;/&gt;
    </div>
    <h2 class="text-lg font-bold text-white">No Files in Project</h2>
    <p class="text-xs text-neutral-400 mt-1">Add or generate code files to start the live preview.</p>
  </div>
</body>
</html>`;
  }

  // 1. ALL FILES SCOPE: Live preview every file in the project together
  if (previewScope === 'all') {
    return renderAllFilesDashboard(files);
  }

  // 2. SELECTED FILE SCOPE: Live preview whatever specific file the user is focused on
  if (previewScope === 'selected') {
    const selected = (selectedFileId ? files.find(f => f.id === selectedFileId) : null) || files[0];
    if (selected) {
      const ext = selected.name.split('.').pop()?.toLowerCase() || '';
      if (ext === 'html' || ext === 'htm') {
        return renderSingleHtmlApp(selected, files);
      }
      if (ext === 'md' || ext === 'markdown') {
        return renderMarkdownToHtml(selected.content, selected.name);
      }
      if (ext === 'csv') {
        return renderCsvToHtml(selected.content, selected.name);
      }
      if (ext === 'svg' || selected.content.trim().startsWith('<svg')) {
        return renderSvgToHtml(selected.content, selected.name);
      }
      if (ext === 'json') {
        return renderJsonToHtml(selected.content, selected.name);
      }
      if (ext === 'css') {
        return renderCssShowcaseToHtml(selected.content, selected.name);
      }
      if (ext === 'jsx' || ext === 'tsx' || selected.content.includes('export default') || selected.content.includes('import React')) {
        return renderReactComponentToHtml(selected.content, selected.name);
      }
      return renderCodeViewerToHtml(selected.content, selected.name, selected.language);
    }
  }

  // 3. APP SCOPE: Bundled index.html application or smart fallback
  const htmlFile = files.find(f => {
    const n = f.name.toLowerCase();
    const hasHtmlExt = n.endsWith('.html') || n.endsWith('.htm');
    const content = (f.content || '').toLowerCase();
    return hasHtmlExt && (content.includes('<html') || content.includes('<!doctype') || content.includes('<body') || content.includes('<div') || content.includes('<main'));
  }) || files.find(f => f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm'));

  if (htmlFile) {
    return renderSingleHtmlApp(htmlFile, files);
  }

  // If no HTML file exists in project, preview the primary or selected file
  const target = (selectedFileId ? files.find(f => f.id === selectedFileId) : null) || files[0];
  const targetExt = target.name.split('.').pop()?.toLowerCase() || '';

  if (targetExt === 'md' || targetExt === 'markdown') {
    return renderMarkdownToHtml(target.content, target.name);
  }
  if (targetExt === 'csv') {
    return renderCsvToHtml(target.content, target.name);
  }
  if (targetExt === 'svg' || target.content.trim().startsWith('<svg')) {
    return renderSvgToHtml(target.content, target.name);
  }
  if (targetExt === 'json') {
    return renderJsonToHtml(target.content, target.name);
  }
  if (targetExt === 'css') {
    return renderCssShowcaseToHtml(target.content, target.name);
  }
  if (targetExt === 'jsx' || targetExt === 'tsx' || target.content.includes('export default') || target.content.includes('import React')) {
    return renderReactComponentToHtml(target.content, target.name);
  }

  return renderCodeViewerToHtml(target.content, target.name, target.language);
}
