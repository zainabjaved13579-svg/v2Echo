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
<html>
<head>
  <meta charset="utf-8">
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

  // Inject Tailwind if not present
  if (!htmlContent.includes('cdn.tailwindcss.com') && !htmlContent.includes('tailwindcss')) {
    htmlContent = htmlContent.replace('<head>', '<head>\n  <script src="https://cdn.tailwindcss.com"></script>');
  }

  // Inject CSS
  const combinedCss = cssFiles.map(c => `/* ${c.name} */\n${c.content}`).join('\n\n');
  if (combinedCss) {
    const styleTag = `<style id="injected-workspace-styles">\n${combinedCss}\n</style>`;
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
    } else {
      htmlContent = `${styleTag}\n${htmlContent}`;
    }
  }

  // Inject JS
  const combinedJs = jsFiles.map(j => `// ${j.name}\ntry {\n${j.content}\n} catch(err) { console.error('Error in ${j.name}:', err); }`).join('\n\n');
  if (combinedJs) {
    const scriptTag = `<script id="injected-workspace-scripts">\nwindow.addEventListener('DOMContentLoaded', () => {\n${combinedJs}\n});\n</script>`;
    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      htmlContent = `${htmlContent}\n${scriptTag}`;
    }
  }

  return htmlContent;
}
