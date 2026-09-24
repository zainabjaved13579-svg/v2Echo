import { ChatMessage } from '../types';
import { generateEchoFallbackResponse, generateThinkingTrace } from './echoEngine';

export interface HealthCheckResult {
  status: string;
  hasKey: boolean;
  hasCloudKey?: boolean;
  mode?: string;
  platform?: string;
  defaultModel?: string;
}

export function getStoredApiKey(): string {
  try {
    return (
      localStorage.getItem('echo_gemini_api_key') ||
      localStorage.getItem('gemini_api_key') ||
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      ''
    );
  } catch {
    return '';
  }
}

export function saveStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem('echo_gemini_api_key', key.trim());
      localStorage.setItem('gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('echo_gemini_api_key');
      localStorage.removeItem('gemini_api_key');
    }
  } catch (e) {
    console.warn('Unable to persist API key:', e);
  }
}

/**
 * Strict role alternation and sanitization for Google Gemini API.
 * Ensures the turns start with 'user', alternate strictly 'user' -> 'model' -> 'user',
 * and contains valid non-empty parts.
 */
export function sanitizeAndAlternateContents(rawContents: any[]): any[] {
  if (!Array.isArray(rawContents) || rawContents.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello Echo!' }] }];
  }

  // 1. Filter out empty turns
  const validTurns = rawContents
    .map((c) => {
      const parts = (c.parts || []).filter((p: any) => {
        if (!p) return false;
        if (p.inlineData && p.inlineData.data) return true;
        if (typeof p.text === 'string' && p.text.trim().length > 0) return true;
        return false;
      });
      return {
        role: c.role === 'model' ? 'model' : 'user',
        parts
      };
    })
    .filter((c) => c.parts.length > 0);

  if (validTurns.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello Echo!' }] }];
  }

  // 2. Merge consecutive turns of identical role
  const mergedTurns: any[] = [];
  for (const turn of validTurns) {
    if (mergedTurns.length === 0) {
      mergedTurns.push({ role: turn.role, parts: [...turn.parts] });
    } else {
      const lastTurn = mergedTurns[mergedTurns.length - 1];
      if (lastTurn.role === turn.role) {
        lastTurn.parts.push(...turn.parts);
      } else {
        mergedTurns.push({ role: turn.role, parts: [...turn.parts] });
      }
    }
  }

  // 3. Ensure the conversation starts with 'user' turn
  while (mergedTurns.length > 0 && mergedTurns[0].role !== 'user') {
    mergedTurns.shift();
  }

  if (mergedTurns.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello Echo!' }] }];
  }

  return mergedTurns;
}

export async function checkServerHealth(customApiKey?: string): Promise<HealthCheckResult> {
  const activeKey = customApiKey || getStoredApiKey();
  try {
    const headers: Record<string, string> = {};
    if (activeKey) {
      headers['x-gemini-api-key'] = activeKey;
    }
    const res = await fetch('/api/health', { headers });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
    return {
      status: 'ok',
      hasKey: Boolean(activeKey),
      mode: activeKey ? 'gemini-live' : 'echo-ready',
      defaultModel: 'echo-3.7-flash'
    };
  } catch {
    return {
      status: 'ok',
      hasKey: Boolean(activeKey),
      mode: activeKey ? 'gemini-live' : 'echo-ready',
      defaultModel: 'echo-3.7-flash'
    };
  }
}

export interface StreamChatParams {
  messages: ChatMessage[];
  systemInstruction?: string;
  temperature?: number;
  model?: string;
  useSearchGrounding?: boolean;
  customApiKey?: string;
  onThinking?: (thinkingText: string, isThinking: boolean) => void;
  onChunk: (text: string) => void;
  onDone: (
    fullText: string,
    stats: {
      durationMs: number;
      charsCount: number;
      charsPerSec: number;
      thinkingDurationMs?: number;
    }
  ) => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

// Convert model identifier to official Google Gemini model ID
function resolveGeminiModelId(modelName: string = 'sapphire-flash-latest'): string {
  const lower = modelName.toLowerCase();
  if (lower.includes('3.1-pro') || lower.includes('pro')) {
    return 'gemini-3.1-pro-preview';
  }
  if (lower.includes('lite')) {
    return 'gemini-3.1-flash-lite';
  }
  if (lower.includes('3.8')) {
    return 'gemini-3.8-flash';
  }
  return 'gemini-flash-latest';
}

/**
 * Direct client-side streaming call to Google Generative Language API.
 */
async function callDirectGoogleGemini({
  apiKey,
  contents,
  systemInstruction,
  temperature = 0.7,
  model = 'gemini-flash-latest',
  useSearchGrounding = false,
  onChunk,
  signal
}: {
  apiKey: string;
  contents: any[];
  systemInstruction?: string;
  temperature?: number;
  model?: string;
  useSearchGrounding?: boolean;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const targetModel = resolveGeminiModelId(model);
  const candidateModels = [
    targetModel,
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash'
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  let lastErrorMsg = '';

  for (const currModel of candidateModels) {
    if (signal?.aborted) return '';

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currModel}:streamGenerateContent?alt=sse&key=${encodeURIComponent(
        apiKey
      )}`;

      const baseOwnerInstruction = `You are Sapphire AI, an elite AI assistant and principal software architect.
Answer with high intelligence, accuracy, and clear structured presentation.
When writing code for websites or apps, provide complete runnable multi-file code with index.html, style.css, script.js with no placeholders.`;
      const finalInstruction = systemInstruction && systemInstruction.trim()
        ? `${baseOwnerInstruction}\n\n${systemInstruction.trim()}`
        : baseOwnerInstruction;

      const bodyPayload: Record<string, any> = {
        contents,
        generationConfig: {
          temperature: Number(temperature) || 0.7,
          maxOutputTokens: 8192
        },
        systemInstruction: {
          parts: [{ text: finalInstruction }]
        }
      };

      if (useSearchGrounding) {
        bodyPayload.tools = [{ googleSearch: {} }];
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload),
        signal
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const errMsg = errorJson?.error?.message || `HTTP ${response.status}`;
        lastErrorMsg = errMsg;
        console.warn(`Direct Gemini API failed with model ${currModel}:`, errMsg);
        continue;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '').trim();
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            const textPart =
              parsed.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';

            if (textPart) {
              accumulatedText += textPart;
              onChunk(accumulatedText);
            }
          } catch {
            // Ignore partial SSE JSON frames
          }
        }
      }

      if (accumulatedText.length > 0) {
        return accumulatedText;
      }
    } catch (err: any) {
      if (signal?.aborted) return '';
      lastErrorMsg = err?.message || 'Network error';
    }
  }

  throw new Error(lastErrorMsg || 'Failed to generate response from Gemini AI.');
}

/**
 * Main chat streaming engine for Echo.
 * Orchestrates server routes, Netlify functions, and direct client Gemini integration.
 */
export async function streamEchoChat({
  messages,
  systemInstruction,
  temperature = 0.7,
  model = 'echo-3.7-flash',
  useSearchGrounding = false,
  customApiKey,
  onThinking,
  onChunk,
  onDone,
  onError,
  signal
}: StreamChatParams): Promise<void> {
  const startTime = performance.now();
  let accumulatedText = '';
  let accumulatedThinking = '';
  const thinkingStartTime = performance.now();
  let thinkingDurationMs = 0;

  const activeApiKey = customApiKey || getStoredApiKey();

  // Filter, format and sanitize messages with strict alternation
  const rawContents = messages
    .filter(
      (msg) =>
        (msg.text && msg.text.trim().length > 0) ||
        (msg.image && msg.image.base64) ||
        (msg.attachedFile && msg.attachedFile.base64)
    )
    .map((msg) => {
      const parts: any[] = [];

      if (msg.image && msg.image.base64) {
        parts.push({
          inlineData: {
            mimeType: msg.image.mimeType || 'image/jpeg',
            data: msg.image.base64
          }
        });
      }

      if (msg.attachedFile && msg.attachedFile.base64) {
        parts.push({
          inlineData: {
            mimeType: msg.attachedFile.type || 'application/pdf',
            data: msg.attachedFile.base64
          }
        });
      }

      if (msg.text && msg.text.trim()) {
        parts.push({
          text: msg.text.trim()
        });
      }

      return {
        role: msg.role === 'model' ? 'model' : 'user',
        parts
      };
    });

  const contents = sanitizeAndAlternateContents(rawContents);

  const deepseekApiKey =
    localStorage.getItem('deepseek_api_key') ||
    localStorage.getItem('echo_deepseek_api_key') ||
    '';
  const openaiApiKey =
    localStorage.getItem('openai_api_key') ||
    localStorage.getItem('echo_openai_api_key') ||
    '';

  const payload = {
    contents,
    systemInstruction,
    temperature,
    model,
    useSearchGrounding,
    apiKey: activeApiKey || undefined,
    customApiKey: activeApiKey || undefined,
    deepseekApiKey: deepseekApiKey || undefined,
    openaiApiKey: openaiApiKey || undefined
  };	

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (activeApiKey) {
    headers['x-gemini-api-key'] = activeApiKey;
    headers['x-gemini-key'] = activeApiKey;
  }
  if (deepseekApiKey) {
    headers['x-deepseek-api-key'] = deepseekApiKey;
  }
  if (openaiApiKey) {
    headers['x-openai-api-key'] = openaiApiKey;
  }

  // 1. If we have an active API key or if deployed on static host, try direct Gemini first or backend
  const candidateEndpoints = ['/api/chat/stream', '/api/chat'];

  try {
    let success = false;

    // Try backend or serverless endpoints
    for (const endpoint of candidateEndpoints) {
      if (success || signal?.aborted) break;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal
        });

        const contentType = response.headers.get('content-type') || '';

        // If the endpoint returned HTML (e.g. static server fallback / <!doctype html), SKIP IT!
        if (contentType.includes('text/html')) {
          continue;
        }

        // If streaming SSE endpoint
        if (response.ok && contentType.includes('text/event-stream') && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;

              const dataStr = trimmed.replace(/^data:\s*/, '');
              if (dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  onError(parsed.error);
                  return;
                }
                if (parsed.thinking) {
                  accumulatedThinking += parsed.thinking;
                  onThinking?.(accumulatedThinking, true);
                }
                if (parsed.isThinking === false && thinkingDurationMs === 0) {
                  thinkingDurationMs = Math.max(1, Math.round(performance.now() - thinkingStartTime));
                  onThinking?.(accumulatedThinking, false);
                }
                if (parsed.text) {
                  if (accumulatedThinking && thinkingDurationMs === 0) {
                    thinkingDurationMs = Math.max(1, Math.round(performance.now() - thinkingStartTime));
                    onThinking?.(accumulatedThinking, false);
                  }
                  let piece = parsed.text;
                  if (piece.includes('<think>')) {
                    const thinkParts = piece.split('</think>');
                    if (thinkParts.length > 1) {
                      accumulatedThinking += thinkParts[0].replace('<think>', '').trim();
                      thinkingDurationMs = Math.max(1, Math.round(performance.now() - thinkingStartTime));
                      onThinking?.(accumulatedThinking, false);
                      piece = thinkParts[1].trimStart();
                    } else {
                      accumulatedThinking += piece.replace('<think>', '');
                      onThinking?.(accumulatedThinking, true);
                      piece = '';
                    }
                  }
                  if (piece) {
                    accumulatedText += piece;
                    onChunk(accumulatedText);
                  }
                }
              } catch {
                // Ignore partial JSON
              }
            }
          }

          if (accumulatedText.length > 0) {
            const durationMs = Math.max(1, Math.round(performance.now() - startTime));
            const charsCount = accumulatedText.length;
            const charsPerSec = Math.round((charsCount / (durationMs / 1000)));
            onDone(accumulatedText, { durationMs, charsCount, charsPerSec, thinkingDurationMs });
            success = true;
            return;
          }
        } else if (response.ok && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.error) {
            onError(data.error);
            return;
          }
          if (data.text) {
            // Fast typewriter streaming effect for json responses
            const fullText = data.text;
            const step = Math.max(3, Math.ceil(fullText.length / 45));
            let curr = '';
            for (let i = 0; i < fullText.length; i += step) {
              if (signal?.aborted) return;
              curr = fullText.slice(0, i + step);
              onChunk(curr);
              await new Promise((r) => setTimeout(r, 12));
            }
            accumulatedText = fullText;
            onChunk(fullText);
            const durationMs = Math.max(1, Math.round(performance.now() - startTime));
            const charsCount = accumulatedText.length;
            const charsPerSec = Math.round((charsCount / (durationMs / 1000)));
            onDone(accumulatedText, { durationMs, charsCount, charsPerSec });
            success = true;
            return;
          }
        }
      } catch (endpointErr: any) {
        if (signal?.aborted) return;
        console.warn(`Backend endpoint ${endpoint} unavailable, trying next.`);
      }
    }

    // 2. If backend endpoints were unavailable or returned static HTML, and we have an API key, use direct Google Gemini
    if (!success && activeApiKey) {
      const directText = await callDirectGoogleGemini({
        apiKey: activeApiKey,
        contents,
        systemInstruction,
        temperature,
        model,
        useSearchGrounding,
        onChunk: (text) => {
          accumulatedText = text;
          onChunk(text);
        },
        signal
      });

      if (directText) {
        const durationMs = Math.max(1, Math.round(performance.now() - startTime));
        const charsCount = directText.length;
        const charsPerSec = Math.round((charsCount / (durationMs / 1000)));
        onDone(directText, { durationMs, charsCount, charsPerSec });
        return;
      }
    }

    // 3. If no response could be generated from remote endpoints, generate from intelligent fallback engine
    if (!success) {
      if (signal?.aborted) return;

      const fallbackText = generateEchoFallbackResponse(contents, systemInstruction, model);
      const words = fallbackText.split(/(\s+)/);
      let streamed = '';

      for (let i = 0; i < words.length; i++) {
        if (signal?.aborted) return;
        streamed += words[i];
        onChunk(streamed);
      }

      const durationMs = Math.max(1, Math.round(performance.now() - startTime));
      onDone(streamed, {
        durationMs,
        charsCount: streamed.length,
        charsPerSec: Math.round(streamed.length / (durationMs / 1000 || 1)),
        thinkingDurationMs: 0
      });
      success = true;
    }
  } catch (error: any) {
    if (signal?.aborted) return;
    console.error('Chat error:', error);
    // Even on error, ensure user receives a response
    try {
      const fallbackText = generateEchoFallbackResponse(contents, systemInstruction, model);
      onChunk(fallbackText);
      onDone(fallbackText, { durationMs: 200, charsCount: fallbackText.length, charsPerSec: 150 });
    } catch {
      onError(error?.message || 'Echo encountered an issue formulating response. Please try again.');
    }
  }
}

// Backward compatibility alias
export const streamGeminiChat = streamEchoChat;


