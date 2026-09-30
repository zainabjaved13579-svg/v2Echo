// AI Keys & Engine Configuration Service
// Stores and provides API keys for Google Gemini, DeepSeek, OpenAI, Anthropic Claude, and xAI Grok

export interface AiEngineKeys {
  gemini: string;
  deepseek: string;
  openai: string;
  claude: string;
  grok: string;
}

const STORAGE_KEYS = {
  gemini: 'echo_gemini_api_key',
  geminiAlt: 'gemini_api_key',
  deepseek: 'sapphire_deepseek_api_key',
  openai: 'sapphire_openai_api_key',
  claude: 'sapphire_claude_api_key',
  grok: 'sapphire_grok_api_key'
};

export function getAiKeys(): AiEngineKeys {
  try {
    const gemini =
      localStorage.getItem(STORAGE_KEYS.gemini) ||
      localStorage.getItem(STORAGE_KEYS.geminiAlt) ||
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      '';

    const deepseek =
      localStorage.getItem(STORAGE_KEYS.deepseek) ||
      (import.meta as any).env?.VITE_DEEPSEEK_API_KEY ||
      '';

    const openai =
      localStorage.getItem(STORAGE_KEYS.openai) ||
      (import.meta as any).env?.VITE_OPENAI_API_KEY ||
      '';

    const claude =
      localStorage.getItem(STORAGE_KEYS.claude) ||
      (import.meta as any).env?.VITE_ANTHROPIC_API_KEY ||
      (import.meta as any).env?.VITE_CLAUDE_API_KEY ||
      '';

    const grok =
      localStorage.getItem(STORAGE_KEYS.grok) ||
      (import.meta as any).env?.VITE_GROK_API_KEY ||
      (import.meta as any).env?.VITE_XAI_API_KEY ||
      '';

    return { gemini, deepseek, openai, claude, grok };
  } catch {
    return { gemini: '', deepseek: '', openai: '', claude: '', grok: '' };
  }
}

export function saveAiKeys(keys: Partial<AiEngineKeys>): void {
  try {
    if (keys.gemini !== undefined) {
      if (keys.gemini.trim()) {
        localStorage.setItem(STORAGE_KEYS.gemini, keys.gemini.trim());
        localStorage.setItem(STORAGE_KEYS.geminiAlt, keys.gemini.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.gemini);
        localStorage.removeItem(STORAGE_KEYS.geminiAlt);
      }
    }

    if (keys.deepseek !== undefined) {
      if (keys.deepseek.trim()) {
        localStorage.setItem(STORAGE_KEYS.deepseek, keys.deepseek.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.deepseek);
      }
    }

    if (keys.openai !== undefined) {
      if (keys.openai.trim()) {
        localStorage.setItem(STORAGE_KEYS.openai, keys.openai.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.openai);
      }
    }

    if (keys.claude !== undefined) {
      if (keys.claude.trim()) {
        localStorage.setItem(STORAGE_KEYS.claude, keys.claude.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.claude);
      }
    }

    if (keys.grok !== undefined) {
      if (keys.grok.trim()) {
        localStorage.setItem(STORAGE_KEYS.grok, keys.grok.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.grok);
      }
    }
  } catch (e) {
    console.warn('Failed to save AI engine keys to localStorage:', e);
  }
}

export function getAiKeyHeaders(): Record<string, string> {
  const keys = getAiKeys();
  const headers: Record<string, string> = {};

  if (keys.gemini) {
    headers['x-gemini-api-key'] = keys.gemini;
    headers['x-gemini-key'] = keys.gemini;
  }
  if (keys.deepseek) {
    headers['x-deepseek-api-key'] = keys.deepseek;
  }
  if (keys.openai) {
    headers['x-openai-api-key'] = keys.openai;
  }
  if (keys.claude) {
    headers['x-claude-api-key'] = keys.claude;
    headers['x-anthropic-api-key'] = keys.claude;
  }
  if (keys.grok) {
    headers['x-grok-api-key'] = keys.grok;
    headers['x-xai-api-key'] = keys.grok;
  }

  return headers;
}

export function getActiveEnginesCount(): number {
  const keys = getAiKeys();
  let count = 0;
  if (keys.gemini) count++;
  if (keys.deepseek) count++;
  if (keys.openai) count++;
  if (keys.claude) count++;
  if (keys.grok) count++;
  return count;
}
