import hljs from 'highlight.js';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';

export interface ParsedCodeBlock {
  language: string;
  filename?: string;
  code: string;
  fullMatch: string;
}

/**
 * Normalizes language names to standard identifiers
 */
export function normalizeLanguage(lang: string): string {
  const l = (lang || '').toLowerCase().trim();
  if (['js', 'javascript', 'node'].includes(l)) return 'javascript';
  if (['ts', 'typescript'].includes(l)) return 'typescript';
  if (['html', 'htm', 'xhtml'].includes(l)) return 'html';
  if (['css', 'scss', 'sass', 'less'].includes(l)) return 'css';
  if (['jsx', 'react'].includes(l)) return 'jsx';
  if (['tsx'].includes(l)) return 'tsx';
  if (['py', 'python', 'py3'].includes(l)) return 'python';
  if (['sh', 'bash', 'zsh', 'shell'].includes(l)) return 'bash';
  if (['json'].includes(l)) return 'json';
  if (['sql', 'mysql', 'pgsql', 'sqlite'].includes(l)) return 'sql';
  if (['md', 'markdown'].includes(l)) return 'markdown';
  return l || 'plaintext';
}

/**
 * Highlight code using Prism.js with Highlight.js fallback
 */
export function highlightCode(code: string, language: string): string {
  const normLang = normalizeLanguage(language);
  
  // 1. Try Prism.js first
  try {
    let prismGrammar = Prism.languages[normLang];
    if (!prismGrammar) {
      if (normLang === 'html' || normLang === 'xml') prismGrammar = Prism.languages.markup;
      else if (normLang === 'javascript') prismGrammar = Prism.languages.javascript;
      else if (normLang === 'typescript') prismGrammar = Prism.languages.typescript;
      else if (normLang === 'css') prismGrammar = Prism.languages.css;
    }
    if (prismGrammar) {
      return Prism.highlight(code, prismGrammar, normLang);
    }
  } catch (err) {
    // Fall through to hljs
  }

  // 2. Try Highlight.js
  try {
    const validHljsLang = hljs.getLanguage(normLang) ? normLang : null;
    if (validHljsLang) {
      return hljs.highlight(code, { language: validHljsLang, ignoreIllegals: true }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    // 3. Fallback safe HTML escaping
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

/**
 * Extracts multiple code blocks from AI response text,
 * parsing filenames like ```html index.html, ```css style.css, or comments inside the code.
 */
export function extractCodeBlocksFromMarkdown(text: string): ParsedCodeBlock[] {
  if (!text) return [];

  const blocks: ParsedCodeBlock[] = [];
  // Regex matches: ```lang filename or ```lang
  const codeRegex = /```([a-zA-Z0-9_\-\.]+)?(?:\s+(?:filename=)?["']?([a-zA-Z0-9_\-\.\/]+)["']?)?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    const rawLang = (match[1] || '').trim();
    let filename = (match[2] || '').trim();
    const code = match[3] || '';

    // If filename wasn't in backticks line, check first 3 lines for comment like /* style.css */ or <!-- index.html --> or // script.js
    if (!filename) {
      const firstLines = code.slice(0, 300);
      const commentMatch = firstLines.match(/(?:<!--|\/\*|\/\/|#)\s*(?:file(?:name)?:\s*)?([a-zA-Z0-9_\-]+\.(?:html|css|js|ts|jsx|tsx|json|py|sql|sh))/i);
      if (commentMatch && commentMatch[1]) {
        filename = commentMatch[1].trim();
      }
    }

    // Default filenames if still unspecified
    const normLang = normalizeLanguage(rawLang);
    if (!filename) {
      if (normLang === 'html') filename = blocks.some((b) => b.filename === 'index.html') ? `page_${blocks.length}.html` : 'index.html';
      else if (normLang === 'css') filename = blocks.some((b) => b.filename === 'style.css') ? `style_${blocks.length}.css` : 'style.css';
      else if (normLang === 'javascript') filename = blocks.some((b) => b.filename === 'script.js') ? `script_${blocks.length}.js` : 'script.js';
      else if (normLang === 'typescript') filename = 'app.ts';
      else if (normLang === 'python') filename = 'main.py';
      else if (normLang === 'json') filename = 'data.json';
      else filename = `file_${blocks.length + 1}.${normLang === 'plaintext' ? 'txt' : normLang}`;
    }

    blocks.push({
      language: normLang,
      filename,
      code,
      fullMatch: match[0]
    });
  }

  return blocks;
}
