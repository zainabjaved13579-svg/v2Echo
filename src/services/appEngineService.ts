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

  // Look for a genuine HTML host file
  const htmlFile = files.find(f => {
    const n = f.name.toLowerCase();
    const hasHtmlExt = n.endsWith('.html') || n.endsWith('.htm');
    const content = (f.content || '').toLowerCase();
    return hasHtmlExt && (content.includes('<html') || content.includes('<!doctype') || content.includes('<body') || content.includes('<div') || content.includes('<main'));
  });

  const cssFiles = files.filter(f => f.name.toLowerCase().endsWith('.css'));
  const jsFiles = files.filter(f => {
    const n = f.name.toLowerCase();
    return n.endsWith('.js') || n.endsWith('.jsx') || n.endsWith('.ts') || n.endsWith('.tsx') || n.endsWith('.mjs');
  });

  let htmlContent = '';

  if (htmlFile) {
    htmlContent = htmlFile.content;
    // Wrap if fragment without html tags
    if (!htmlContent.toLowerCase().includes('<html')) {
      htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${htmlFile.name}</title>
</head>
<body>
${htmlContent}
</body>
</html>`;
    }
  } else {
    // Check if there is an SVG file
    const svgFile = files.find(f => f.name.toLowerCase().endsWith('.svg') || f.content.trim().startsWith('<svg'));
    if (svgFile && jsFiles.length === 0) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${svgFile.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#111111] flex items-center justify-center min-h-screen p-8">
  <div class="max-w-2xl max-h-[80vh] flex items-center justify-center p-6 bg-[#1a1a19] border border-[#2b2b2a] rounded-3xl shadow-2xl">
    ${svgFile.content}
  </div>
</body>
</html>`;
    }

    // Auto-generate clean universal HTML host for React / JS / CSS projects
    htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
</head>
<body class="bg-[#0f172a] text-slate-100 min-h-screen">
  <div id="root"></div>
  <div id="app"></div>
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

  // Ensure React 18 & ReactDOM UMD are available
  const hasReactCode = jsFiles.some(f => 
    f.name.endsWith('.jsx') || 
    f.name.endsWith('.tsx') || 
    f.content.includes('React') || 
    f.content.includes('useState') || 
    f.content.includes('createRoot') ||
    f.content.includes('import ')
  );

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
