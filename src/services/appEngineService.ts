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
 * Builds an all-in-one unified live interactive bundle preview from files
 */
export function buildUnifiedLivePreviewBundle(files: WorkspaceFile[]): string {
  const htmlFile = files.find(f => f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase() === 'index.html') || files[0];
  const cssFiles = files.filter(f => f.name.toLowerCase().endsWith('.css'));
  const jsFiles = files.filter(f => 
    f.name.toLowerCase().endsWith('.js') || 
    f.name.toLowerCase().endsWith('.jsx') || 
    f.name.toLowerCase().endsWith('.ts') || 
    f.name.toLowerCase().endsWith('.tsx')
  );

  let htmlContent = htmlFile?.content || `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sapphire Codex Live App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white flex items-center justify-center min-h-screen">
  <div class="p-8 text-center">
    <h1 class="text-2xl font-bold">Sapphire Codex App</h1>
    <p class="text-slate-400 mt-2">Generate or select files to preview live app.</p>
  </div>
</body>
</html>`;

  // Fix Tailwind CDN if invalid or version 4 browser script was used
  htmlContent = htmlContent.replace(
    /<script[^>]*src="[^"]*@tailwindcss\/browser[^"]*"[^>]*><\/script>/gi,
    '<script src="https://cdn.tailwindcss.com"></script>'
  );

  // Inject Tailwind if not present
  if (!htmlContent.includes('tailwindcss')) {
    if (htmlContent.includes('<head>')) {
      htmlContent = htmlContent.replace('<head>', '<head>\n  <script src="https://cdn.tailwindcss.com"></script>');
    } else {
      htmlContent = `<script src="https://cdn.tailwindcss.com"></script>\n${htmlContent}`;
    }
  }

  // Inject Lucide icons if not already present
  if (!htmlContent.includes('lucide') && !htmlContent.includes('lucide.createIcons')) {
    const lucideScript = '<script src="https://unpkg.com/lucide@latest"></script>';
    if (htmlContent.includes('<head>')) {
      htmlContent = htmlContent.replace('<head>', `<head>\n  ${lucideScript}`);
    } else {
      htmlContent = `${lucideScript}\n${htmlContent}`;
    }
  }

  // Inline and replace any local CSS link tags (e.g. href="styles.css" or href="./styles.css")
  cssFiles.forEach(c => {
    const linkRegex = new RegExp(`<link[^>]*href=["'](?:\\.\\/)?${c.name.replace('.', '\\.')}["'][^>]*>`, 'gi');
    if (linkRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(linkRegex, `<style data-inlined="${c.name}">\n/* Inlined: ${c.name} */\n${c.content}\n</style>`);
    }
  });

  // Any remaining CSS files not inlined yet
  const remainingCss = cssFiles.filter(c => !htmlContent.includes(`/* Inlined: ${c.name} */`));
  if (remainingCss.length > 0) {
    const combinedCss = remainingCss.map(c => `/* ${c.name} */\n${c.content}`).join('\n\n');
    const styleTag = `<style id="injected-workspace-styles">\n${combinedCss}\n</style>`;
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
    } else {
      htmlContent = `${styleTag}\n${htmlContent}`;
    }
  }

  // Remove local script references that will be inlined safely
  jsFiles.forEach(j => {
    const scriptRegex = new RegExp(`<script[^>]*src=["'](?:\\.\\/)?${j.name.replace('.', '\\.')}["'][^>]*>\\s*<\\/script>`, 'gi');
    htmlContent = htmlContent.replace(scriptRegex, '');
  });

  // Check if any script uses JSX or modern syntax requiring Babel
  const needsBabel = jsFiles.some(j => 
    j.name.endsWith('.jsx') || 
    j.name.endsWith('.tsx') || 
    j.content.includes('<') && j.content.includes('/>') ||
    j.content.includes('import ') && !j.content.includes('from \'http')
  );

  let babelHeader = '';
  if (needsBabel && !htmlContent.includes('babel')) {
    babelHeader = '<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.6/babel.min.js"></script>\n';
  }

  // Safe scripts injection: each file in its own script block with try/catch to isolate errors
  const safeScriptBlocks = jsFiles.map((j, idx) => {
    const safeSource = JSON.stringify(j.content);
    return `
    <script>
      (function() {
        var fileName = ${JSON.stringify(j.name)};
        var code = ${safeSource};
        try {
          if (window.Babel && (fileName.indexOf('.jsx') !== -1 || fileName.indexOf('.tsx') !== -1 || code.indexOf('import ') !== -1 || code.indexOf('export ') !== -1)) {
            try {
              code = window.Babel.transform(code, { presets: ['env', 'react'] }).code;
            } catch(be) {
              console.warn('Babel note for ' + fileName + ':', be);
            }
          }
          var fn = new Function('console', 'window', 'document', code);
          fn(console, window, document);
        } catch(err) {
          console.error('Error in ' + fileName + ':', err);
          if (typeof showPreviewError === 'function') {
            showPreviewError(fileName, err);
          }
        }
      })();
    </script>`;
  }).join('\n');

  const runnerScript = `
  ${babelHeader}
  <script>
    // In-iframe graceful error display with rounded smooth corners
    function showPreviewError(filename, err) {
      try {
        var errBox = document.getElementById('sapphire-preview-error-toast');
        if (!errBox) {
          errBox = document.createElement('div');
          errBox.id = 'sapphire-preview-error-toast';
          errBox.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;max-width:480px;margin:0 auto;z-index:999999;background:#18181b;border:1px solid #d97757;border-radius:18px;padding:12px 18px;color:#fecdd3;font-family:system-ui,-apple-system,sans-serif;font-size:12px;box-shadow:0 12px 30px rgba(0,0,0,0.6);display:flex;align-items:flex-start;gap:12px;line-height:1.4;';
          errBox.innerHTML = '<span style="font-size:18px;line-height:1;">⚠️</span><div style="flex:1;"><strong style="color:#fff;display:block;margin-bottom:2px;font-size:13px;">Execution Note (' + filename + ')</strong><span>' + (err && err.message ? err.message : String(err)) + '</span></div><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#999;cursor:pointer;font-size:18px;padding:0 6px;">&times;</button>';
          document.body.appendChild(errBox);
        }
      } catch(e) {}
    }

    window.addEventListener('error', function(e) {
      if (typeof showPreviewError === 'function') {
        showPreviewError(e.filename ? e.filename.split('/').pop() : 'script', e.error || e.message);
      }
    });

    // Auto-initialize Lucide icons if available
    function __initIconsAndEvents__() {
      try {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      } catch(e) {}
      setTimeout(function() {
        try {
          var evt = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
          document.dispatchEvent(evt);
          window.dispatchEvent(evt);
        } catch(e) {}
      }, 50);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', __initIconsAndEvents__);
    } else {
      __initIconsAndEvents__();
    }
  </script>
  ${safeScriptBlocks}`;

  if (htmlContent.includes('</body>')) {
    htmlContent = htmlContent.replace('</body>', `${runnerScript}\n</body>`);
  } else {
    htmlContent = `${htmlContent}\n${runnerScript}`;
  }

  return htmlContent;
}
