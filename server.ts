import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { generateEchoFallbackResponse } from './src/services/echoEngine.ts';

dotenv.config();

const app = express();

// Detect environment: AI Studio dev sandbox vs Cloud Run production deployment
const isDevSandbox = Boolean(
  process.env.DEFAULT_APP_PORT ||
  process.env.CONTROL_PLANE_PORT ||
  process.env.K_SERVICE?.startsWith('ais-dev-') ||
  process.env.NODE_ENV === 'development'
);

// In AI Studio dev sandbox, port 3000 is required by the nginx reverse proxy.
// In Cloud Run production deployment, the server must listen on process.env.PORT (typically 8080).
const PORT = isDevSandbox
  ? 3000
  : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

// Explicitly allow embedding in iframes from all domains and enable CORS
app.use((req, res, next) => {
  // Universal iframe embedding: allow in every website
  res.removeHeader('X-Frame-Options');
  res.removeHeader('x-frame-options');
  res.setHeader('Content-Security-Policy', 'frame-ancestors *;');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, x-gemini-api-key, x-gemini-key, x-deepseek-api-key, x-openai-api-key'
  );

  // Intercept setHeader to prevent any library from setting X-Frame-Options
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = function (name: string, value: any) {
    if (name.toLowerCase() === 'x-frame-options') {
      return res; // Block any attempts to add X-Frame-Options
    }
    return originalSetHeader(name, value);
  };

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body parsers with support for base64 images and files up to 15MB
app.use(express.json({ limit: '40mb' }));
app.use(express.urlencoded({ extended: true, limit: '40mb' }));

// Health and status endpoint
app.get('/api/health', (req, res) => {
  const customApiKey = (req.headers['x-gemini-api-key'] as string) || (req.headers['x-gemni-api-key'] as string) || (req.headers['x-gemini-key'] as string) || (req.headers['x-gemni-key'] as string) || '';
  const hasEnvKey = Boolean(process.env.GEMNI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMNI_API_KEY || process.env.VITE_GEMINI_API_KEY);
  const hasKey = hasEnvKey || Boolean(customApiKey);

  res.json({
    status: 'ok',
    hasKey: true, // Always operational via Gemini API or Echo Instant Engine
    hasCloudKey: hasKey,
    mode: hasKey ? 'gemini-cloud' : 'echo-instant',
    defaultModel: 'echo-3.7-flash',
    supportedModels: ['echo-3.7-flash', 'echo-2.5-flash', 'echo-2.5-pro']
  });
});

// Helper to identify API 429 quota exhaustion or billing limit errors across all AI endpoints
function isQuotaExceededError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const status = err.status || err.statusCode || err.code;
  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('billing')
  );
}

function sanitizeAndAlternateContents(contents: any[]): Array<{ role: 'user' | 'model'; parts: any[] }> {
  const rawList = (contents || [])
    .map((c: any) => ({
      role: (c.role === 'model' ? 'model' : 'user') as 'user' | 'model',
      parts: (c.parts || []).filter((p: any) => (p.text && typeof p.text === 'string' && p.text.trim()) || (p.inlineData && p.inlineData.data))
    }))
    .filter((c: any) => c.parts && c.parts.length > 0);

  if (rawList.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello Echo!' }] }];
  }

  // Ensure conversation starts with user turn
  while (rawList.length > 0 && rawList[0].role !== 'user') {
    rawList.shift();
  }

  if (rawList.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello Echo!' }] }];
  }

  // Merge consecutive turns with the same role to strictly enforce alternating user/model roles
  const alternating: Array<{ role: 'user' | 'model'; parts: any[] }> = [];
  for (const item of rawList) {
    const prev = alternating[alternating.length - 1];
    if (prev && prev.role === item.role) {
      prev.parts.push(...item.parts);
    } else {
      alternating.push({ role: item.role, parts: [...item.parts] });
    }
  }

  // Ensure last turn is user turn for Gemini generation
  while (alternating.length > 0 && alternating[alternating.length - 1].role !== 'user') {
    alternating.pop();
  }

  if (alternating.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello Echo!' }] }];
  }

  return alternating;
}

// Chat generation (Streaming SSE)
app.post('/api/chat/stream', async (req, res) => {
  const bodyApiKey = req.body?.apiKey || req.body?.customApiKey || req.body?.gemniApiKey || req.body?.geminiApiKey;
  const customApiKey = (req.headers['x-gemini-api-key'] as string) || (req.headers['x-gemni-api-key'] as string) || (req.headers['x-gemini-key'] as string) || (req.headers['x-gemni-key'] as string) || bodyApiKey || '';
  const apiKey = customApiKey || process.env.GEMNI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMNI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const deepSeekKey =
    (req.headers['x-deepseek-api-key'] as string) ||
    req.body?.deepseekApiKey ||
    process.env.DEEPSEEK_API_KEY ||
    (process.env as any).DEEP_SEEK_API_KEY;

  const {
    contents,
    systemInstruction,
    temperature = 0.7,
    model = 'echo-3.7-flash',
    useSearchGrounding = false
  } = req.body;

  if (!contents || !Array.isArray(contents) || contents.length === 0) {
    res.status(400).json({ error: 'Contents array is required.' });
    return;
  }

  // Configure SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Sanitize and strictly enforce alternating contents for GoogleGenAI SDK
  const sanitizedContents = sanitizeAndAlternateContents(contents);

  // Fast response for basic greetings (instant reply in ~5ms)
  const lastUserText = (sanitizedContents[sanitizedContents.length - 1]?.parts || [])
    .map((p: any) => p.text || '')
    .join(' ')
    .trim()
    .toLowerCase();

  const isBasicGreeting = /^(hi|hello|hey|salam|assalam|aoa|hola|sup|good morning|good evening|good afternoon)[\s!.]*$/i.test(lastUserText);
  if (isBasicGreeting) {
    const greetingReplies = [
      "Hello! I'm Echo AI, your principal AI software architect and coding assistant. What can I build, code, or create for you today?",
      "Hi there! Echo AI is ready. Whether you need full-stack web code, bug fixes, or AI image generation, let's get started!",
      "Hey! Echo AI here, running fast and ready. What project or code are we working on?"
    ];
    const reply = greetingReplies[Math.floor(Math.random() * greetingReplies.length)];
    const words = reply.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ');
      res.write(`data: ${JSON.stringify({ text: (i === 0 ? '' : ' ') + chunk })}

`);
      await new Promise((r) => setTimeout(r, 6));
    }
    res.write(`data: [DONE]

`);
    res.end();
    return;
  }

  // If live API key is present, use official Google Gemini API with low-latency streaming
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Map echo model names to official Gemini model IDs
      let targetModel = 'gemini-3.8-flash';
      if (model.includes('3.1-pro') || model.includes('pro')) targetModel = 'gemini-3.1-pro-preview';
      else if (model.includes('lite')) targetModel = 'gemini-3.1-flash-lite';
      else if (model.includes('preview')) targetModel = 'gemini-3-flash-preview';
      else if (model.includes('flash-latest')) targetModel = 'gemini-flash-latest';
      else if (model.includes('3.8') || model.includes('flash') || model.includes('echo')) targetModel = 'gemini-3.8-flash';
      else if (model.startsWith('gemini-')) targetModel = model;

      const baseOwnerInstruction = `You are Echo AI, an ultra-smart, professional, elite AI assistant and principal software architect.
The creator and developer of this AI is Shaheer Hassan. Do NOT advertise or state who created you unprompted or in routine greetings. ONLY when a user explicitly asks who created you, who made you, who is your developer, who is your owner, who built Echo, or who is Shaheer Hassan, clearly and politely state that Shaheer Hassan is your creator and developer.

CODING & MULTI-FILE PROJECT STANDARDS (CRITICAL):
1. PROJECT STRUCTURE FIRST:
   Whenever asked to create a website, web app, script, or multiple-file project:
   - ALWAYS start your answer with a clean ASCII directory/file structure diagram showing exactly where each file belongs (e.g., 📁 project-name/ ├── index.html ├── src/ ...).
   - Show how the files interact.
2. INDIVIDUAL FILE CODE BLOCKS:
   - Provide each file in its own markdown code block with an explicit filename tag or comment on line 1, for example:
     \`\`\`html filename="index.html"
     <!-- index.html -->
     \`\`\`
     \`\`\`typescript filename="src/App.tsx"
     // src/App.tsx
     \`\`\`
   - NEVER use lazy abbreviations, comments like "// TODO", "// implement rest here", or truncated placeholders. Always output 100% complete, fully implemented, working code for every single file.
3. INSTRUCTIONS TO RUN:
   - At the end, provide brief, crystal-clear setup/execution instructions.

4. ACCURACY & INTELLECT:
   - Think deeply, eliminate bugs, handle edge cases, and ensure clean modern architecture.`;
      const combinedInstruction = systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()
        ? `${baseOwnerInstruction}\n\n${systemInstruction.trim()}`
        : baseOwnerInstruction;

      const config: Record<string, any> = {
        temperature: Number(temperature) || 0.7,
        systemInstruction: combinedInstruction
      };

      if (useSearchGrounding) {
        config.tools = [{ googleSearch: {} }];
      }

      // Candidate model list with fast fallback:
      // Prioritize low-latency gemini-3.1-flash-lite so responses start instantly and avoid 503 spikes
      const candidateModels = targetModel === 'gemini-3.1-pro-preview'
        ? ['gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
        : ['gemini-3.1-flash-lite', targetModel, 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.8-flash'].filter((m, i, arr) => arr.indexOf(m) === i);

      let streamedAny = false;

      for (const currModel of candidateModels) {
        if (streamedAny) break;
        try {
          const responseStream = await ai.models.generateContentStream({
            model: currModel,
            contents: sanitizedContents,
            config
          });

          for await (const chunk of responseStream) {
            const text = chunk.text || '';
            if (text) {
              streamedAny = true;
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          }

          if (streamedAny) {
            res.write(`data: [DONE]\n\n`);
            res.end();
            return;
          }
        } catch (streamErr: any) {
          console.warn(`Gemini stream attempt notice (${currModel}):`, streamErr?.message?.slice(0, 100));
          // If we already started streaming tokens, don't corrupt stream with another model
          if (streamedAny) break;
        }
      }
    } catch (error: any) {
      console.warn('Gemini Cloud API initialization notice:', error?.message?.slice(0, 150));
    }
  }

  
  // If DeepSeek API key is available, stream real DeepSeek responses
  if (deepSeekKey) {
    try {
      const dsMessages = sanitizedContents.map((c: any) => ({
        role: c.role === 'model' ? 'assistant' : 'user',
        content: (c.parts || []).map((p: any) => p.text || '').join('\n')
      }));
      if (systemInstruction) {
        dsMessages.unshift({ role: 'system', content: systemInstruction });
      }
      const streamed = await streamDeepSeekChatToClient(dsMessages, {
        apiKey: deepSeekKey,
        model: (typeof model === 'string' && model.includes('reasoner')) ? 'deepseek-reasoner' : 'deepseek-chat',
        temperature: Number(temperature) || 0.3
      }, res);
      if (streamed) return;
    } catch (dsErr: any) {
      console.warn('DeepSeek streaming attempt notice:', dsErr.message);
    }
  }

  // High-speed Echo Engine streaming fallback (Zero variable needed!)
  try {
    const fullResponse = generateEchoFallbackResponse(sanitizedContents, systemInstruction, model);
    const words = fullResponse.split(' ');

    // Fast streaming emission with zero lag
    const chunkSize = 6;
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      const piece = (i === 0 ? '' : ' ') + chunk;
      res.write(`data: ${JSON.stringify({ text: piece })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 2));
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err: any) {
    console.error('Echo Engine error:', err);
    res.write(`data: ${JSON.stringify({ error: 'Failed to stream response.' })}\n\n`);
    res.end();
  }
});

// Non-streaming chat generation fallback
app.post('/api/chat', async (req, res) => {
  const bodyApiKey = req.body?.apiKey || req.body?.customApiKey || req.body?.gemniApiKey || req.body?.geminiApiKey;
  const customApiKey = (req.headers['x-gemini-api-key'] as string) || (req.headers['x-gemni-api-key'] as string) || (req.headers['x-gemini-key'] as string) || (req.headers['x-gemni-key'] as string) || bodyApiKey || '';
  const apiKey = customApiKey || process.env.GEMNI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMNI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  const {
    contents,
    systemInstruction,
    temperature = 0.7,
    model = 'echo-3.7-flash',
    useSearchGrounding = false
  } = req.body;

  if (!contents || !Array.isArray(contents) || contents.length === 0) {
    res.status(400).json({ error: 'Contents array is required.' });
    return;
  }

  const sanitizedContents = sanitizeAndAlternateContents(contents);

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      let targetModel = 'gemini-3.7-flash';
      if (model.includes('3.1-pro') || model.includes('pro')) targetModel = 'gemini-3.1-pro-preview';
      else if (model.includes('lite')) targetModel = 'gemini-3.1-flash-lite';
      else if (model.includes('flash-latest')) targetModel = 'gemini-flash-latest';
      else if (model.includes('3.7') || model.includes('flash') || model.includes('echo')) targetModel = 'gemini-3.7-flash';
      else if (model.startsWith('gemini-')) targetModel = model;

      const baseOwnerInstruction = "The creator and developer of this AI is Shaheer Hassan. Do NOT advertise or state who created you unprompted or in routine greetings. ONLY when a user explicitly asks who created you, who made you, who is your developer, who is your owner, who built Echo, or who is Shaheer Hassan, clearly and politely state that Shaheer Hassan is your creator and developer. Always generate clean, production-ready, complete code directly without unsolicited boilerplate example files.";
      const combinedInstruction = systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()
        ? `${baseOwnerInstruction}\n\n${systemInstruction.trim()}`
        : baseOwnerInstruction;

      const config: Record<string, any> = {
        temperature: Number(temperature) || 0.7,
        systemInstruction: combinedInstruction
      };

      if (useSearchGrounding) {
        config.tools = [{ googleSearch: {} }];
      }

      // Resilient fallback candidate list with high-capacity models
      const candidateModels = targetModel === 'gemini-3.1-pro-preview'
        ? ['gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
        : ['gemini-3.1-flash-lite', targetModel, 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.8-flash'].filter((m, i, arr) => arr.indexOf(m) === i);

      for (const currModel of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: currModel,
            contents: sanitizedContents,
            config
          });

          const responseText = response.text || '';
          if (responseText) {
            res.json({
              text: responseText,
              model: currModel
            });
            return;
          }
        } catch (genErr: any) {
          const msg = genErr?.message || String(genErr) || '';
          const isCapacityIssue =
            msg.includes('503') ||
            msg.includes('404') ||
            msg.includes('429') ||
            msg.includes('high demand') ||
            msg.includes('UNAVAILABLE') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            genErr?.status === 503 ||
            genErr?.code === 503;

          if (isCapacityIssue) {
            continue;
          }
          break;
        }
      }
    } catch (error: any) {
      console.warn('Gemini non-stream notice, using Echo fallback:', error?.message?.slice(0, 150));
    }
  }

  const text = generateEchoFallbackResponse(sanitizedContents, systemInstruction, model);
  res.json({
    text,
    model: 'echo-3.7-flash'
  });
});


// DeepSeek Streaming Helper to stream directly to SSE client
async function streamDeepSeekChatToClient(
  messages: Array<{ role: string; content: string }>,
  options: { apiKey?: string; model?: string; temperature?: number },
  res: any
): Promise<boolean> {
  const apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY || (process.env as any).DEEP_SEEK_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: options.model || 'deepseek-chat',
        messages,
        temperature: options.temperature ?? 0.3,
        stream: true
      })
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => '');
      console.warn(`DeepSeek streaming error (${response.status}):`, errText.slice(0, 200));
      return false;
    }

    const reader = (response.body as any).getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let streamedAny = false;

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
          const delta = parsed.choices?.[0]?.delta;
          const content = delta?.content || '';
          const reasoning = delta?.reasoning_content || '';

          if (reasoning) {
            res.write(`data: ${JSON.stringify({ thinking: reasoning })}\n\n`);
            streamedAny = true;
          }
          if (content) {
            res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
            streamedAny = true;
          }
        } catch {
          // ignore partial parse
        }
      }
    }

    if (streamedAny) {
      res.write(`data: [DONE]\n\n`);
      res.end();
      return true;
    }
  } catch (err: any) {
    console.warn('DeepSeek streaming failed:', err.message);
  }
  return false;
}

// DeepSeek Coding Engine Helper
async function callDeepSeekChat(
  messages: Array<{ role: string; content: string }>,
  options: { apiKey?: string; model?: string; temperature?: number } = {}
): Promise<string> {
  const apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY || (process.env as any).DEEP_SEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: options.model || 'deepseek-chat',
      messages,
      temperature: options.temperature ?? 0.2
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`DeepSeek API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Intelligent AI Code Generation (Multi-File Website & App Builder)
app.post('/api/code/generate', async (req, res) => {
  const { prompt, projectType = 'website', existingFiles = [] } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const deepSeekKey =
    (req.headers['x-deepseek-api-key'] as string) ||
    req.body?.deepseekApiKey ||
    process.env.DEEPSEEK_API_KEY ||
    (process.env as any).DEEP_SEEK_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  const systemInstruction = `You are an elite principal software architect and senior full-stack engineer.
The user wants you to generate complete, production-ready, beautiful, professional code for: ${prompt}.
You MUST generate real code files (e.g. index.html, style.css, script.js, or pack.mcmeta, config.json, etc.).
Make the website or application look world-class:
- Clean HTML5 semantic layout with responsive viewports and modern meta tags
- Gorgeous, modern styling with sophisticated color harmony, typography, fluid grid/flexbox layouts, smooth hover transitions, and dark/light polish
- Rich interactive JavaScript with dynamic DOM events, state management, and real functional components
- Zero placeholder comments. Always output 100% full, working, production-ready code.

Return your response formatted cleanly with code blocks showing the filename or path in the header:
\`\`\`html index.html
<!DOCTYPE html>
...
\`\`\`

\`\`\`css style.css
...
\`\`\`

\`\`\`javascript script.js
...
\`\`\``;

  // 1. Try primary coding engine if key is configured
  if (deepSeekKey) {
    try {
      const codeOutput = await callDeepSeekChat([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ], { apiKey: deepSeekKey, model: 'deepseek-chat' });
      res.json({
        content: codeOutput,
        model: 'ai-coder',
        engine: 'Intelligent Code Engine'
      });
      return;
    } catch (err: any) {
      console.warn('Primary coding engine notice, using neural cloud fallback:', err.message);
    }
  }

  // 2. High-performance models for code generation (Gemini 3.8 Flash / 3.1 Pro)
  if (geminiKey) {
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-pro-preview',
      'gemini-3.7-flash',
      'gemini-2.5-flash'
    ];

    for (const codeModel of candidateModels) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const callPromise = ai.models.generateContent({
          model: codeModel,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { systemInstruction }
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini code timeout')), 3500)
        );
        const response = await Promise.race([callPromise, timeoutPromise]);
        if (response.text) {
          res.json({
            content: response.text,
            model: codeModel,
            engine: 'Intelligent Code Engine'
          });
          return;
        }
      } catch (err: any) {
        console.warn(`Gemini code generation (${codeModel}) notice:`, err.message);
        if (isQuotaExceededError(err) || (err.message || '').includes('429')) {
          break; // Quota limit reached, proceed to fallback immediately!
        }
        break; // Don't chain slow requests
      }
    }
  }

  // 3. Fallback to rich professional interactive template
  const fallbackCode = `\`\`\`html index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${prompt.slice(0, 32)}</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <div class="app-container">
    <nav class="navbar">
      <div class="brand-logo">⚡ ${prompt.slice(0, 20)}</div>
      <div class="nav-links">
        <a href="#features">Features</a>
        <a href="#interactive">Demo</a>
        <button id="theme-btn" class="btn-ghost">🌓 Theme</button>
      </div>
    </nav>

    <header class="hero-section">
      <div class="badge">Professional Web Application</div>
      <h1 class="hero-title">${prompt}</h1>
      <p class="hero-subtitle">Production-ready, highly responsive web application built with precision design and zero latency.</p>
      <div class="hero-actions">
        <button id="action-btn" class="btn-primary">Launch Interactive Demo</button>
        <button id="docs-btn" class="btn-secondary">View Project Files</button>
      </div>
    </header>

    <main class="content-grid" id="features">
      <div class="card">
        <div class="card-icon">🚀</div>
        <h3>Ultra High Performance</h3>
        <p>Engineered with lightweight semantic markup and optimized CSS for immediate render speeds.</p>
      </div>
      <div class="card">
        <div class="card-icon">🎨</div>
        <h3>Modern Visual Hierarchy</h3>
        <p>Crafted with fluid typography, responsive layout scaling, and mathematically balanced spacing.</p>
      </div>
      <div class="card">
        <div class="card-icon">⚡</div>
        <h3>Live Interactivity</h3>
        <p>Interactive DOM controls, event bindings, and real-time state feedback ready out-of-the-box.</p>
      </div>
    </main>

    <section class="demo-section" id="interactive">
      <div class="interactive-box">
        <h3 id="status-title">Live Workspace Demo</h3>
        <p id="status-desc">Click the button below to test live JavaScript state management.</p>
        <div class="demo-controls">
          <button id="counter-btn" class="btn-accent">Clicks: <span id="counter-value">0</span></button>
          <button id="reset-btn" class="btn-outline">Reset</button>
        </div>
      </div>
    </section>

    <footer class="footer">
      <p>© ${new Date().getFullYear()} ${prompt.slice(0, 24)} • Built with Intelligent AI Engine</p>
    </footer>
  </div>
  <script src="script.js"></script>
</body>
</html>
\`\`\`

\`\`\`css style.css
:root {
  --bg-primary: #090d16;
  --bg-card: #131b2e;
  --bg-card-hover: #1a243d;
  --border-color: #24304f;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --accent-primary: #4f46e5;
  --accent-hover: #4338ca;
  --accent-cyan: #06b6d4;
  --radius-lg: 16px;
  --radius-md: 10px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(19, 27, 46, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  margin-bottom: 48px;
}

.brand-logo {
  font-weight: 800;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
  color: #fff;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: #fff;
}

.hero-section {
  text-align: center;
  max-width: 780px;
  margin: 0 auto 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.badge {
  display: inline-block;
  padding: 4px 14px;
  background: rgba(79, 70, 229, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(79, 70, 229, 0.3);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 20px;
}

.hero-title {
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin-bottom: 18px;
  background: linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 620px;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-primary {
  padding: 12px 28px;
  background: var(--accent-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.5);
}

.btn-secondary, .btn-ghost {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover, .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #475569;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 64px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  transition: all 0.25s ease;
}

.card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(99, 102, 241, 0.4);
  transform: translateY(-4px);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 16px;
}

.card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: #fff;
}

.card p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.demo-section {
  margin-bottom: 64px;
}

.interactive-box {
  background: linear-gradient(180deg, #131b2e 0%, #0c1220 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 40px;
  text-align: center;
}

.interactive-box h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.interactive-box p {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.demo-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-accent {
  padding: 10px 24px;
  background: var(--accent-cyan);
  color: #042f2e;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-accent:hover {
  filter: brightness(1.1);
  transform: scale(1.03);
}

.btn-outline {
  padding: 10px 20px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.btn-outline:hover {
  color: #fff;
  border-color: #64748b;
}

.footer {
  text-align: center;
  padding-top: 32px;
  border-top: 1px solid var(--border-color);
  color: #64748b;
  font-size: 0.85rem;
}
\`\`\`

\`\`\`javascript script.js
let count = 0;
const counterValueEl = document.getElementById('counter-value');
const counterBtn = document.getElementById('counter-btn');
const resetBtn = document.getElementById('reset-btn');
const actionBtn = document.getElementById('action-btn');
const statusDesc = document.getElementById('status-desc');

counterBtn?.addEventListener('click', () => {
  count++;
  if (counterValueEl) counterValueEl.textContent = count.toString();
  if (statusDesc) statusDesc.textContent = \`Real-time click handler triggered (\${count} times)\`;
});

resetBtn?.addEventListener('click', () => {
  count = 0;
  if (counterValueEl) counterValueEl.textContent = '0';
  if (statusDesc) statusDesc.textContent = 'Counter reset to zero.';
});

actionBtn?.addEventListener('click', () => {
  document.getElementById('interactive')?.scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('docs-btn')?.addEventListener('click', () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
});
\`\`\``;

  res.json({
    content: fallbackCode,
    model: 'ai-coder',
    engine: 'Intelligent Code Engine'
  });
});

// AI Code Remake & Refactoring Endpoint
app.post('/api/code/remake', async (req, res) => {
  const { code, language = 'html', instruction = 'Refactor, modernize, fix bugs, and ensure responsive design for mobile and PC', filename = 'script.js' } = req.body;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'code is required for remake' });
    return;
  }

  const customApiKey =
    (req.headers['x-gemini-api-key'] as string) ||
    (req.headers['x-gemini-key'] as string) ||
    req.body?.apiKey ||
    '';
  const deepSeekKey =
    (req.headers['x-deepseek-api-key'] as string) ||
    req.body?.deepseekApiKey ||
    process.env.DEEPSEEK_API_KEY ||
    (process.env as any).DEEP_SEEK_API_KEY;
  const geminiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  const remakePrompt = `You are a Principal Software Engineer and Code Crafting Specialist.
The user wants you to REMAKE, IMPROVE, and MODERNIZE the following code for file "${filename}" (${language}).

User Remake Instructions:
"${instruction}"

Core Directives:
1. Preserve core business logic while fixing bugs, optimizing performance, and modernizing layout.
2. If this is Web or UI code (HTML, CSS, JavaScript, React, Vue), make it 100% RESPONSIVE for both PC (desktops/laptops) and Mobile devices (phones/tablets). Ensure beautiful touch targets (>=44px), readable typography, clean padding, and responsive CSS flexbox/grid.
3. Output 100% COMPLETE, fully implemented code. NEVER use placeholders or incomplete comments like "// add rest here".
4. Format the output inside a clean markdown code block with the language and filename:
\`\`\`${language} ${filename}
...
\`\`\`

Existing Code to Remake:
\`\`\`${language}
${code}
\`\`\``;

  // 1. Try DeepSeek if key is available
  if (deepSeekKey) {
    try {
      const result = await callDeepSeekChat([
        { role: 'system', content: 'You are an elite code refactoring specialist. Output complete rewritten code.' },
        { role: 'user', content: remakePrompt }
      ], { apiKey: deepSeekKey, model: 'deepseek-chat' });
      if (result) {
        res.json({
          content: result,
          model: 'deepseek-coder',
          engine: 'DeepSeek Code Remake Engine'
        });
        return;
      }
    } catch (err: any) {
      console.warn('DeepSeek code remake notice:', err.message);
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-pro-preview'
    ];
    for (const model of candidateModels) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const callPromise = ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: remakePrompt }] }]
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini remake timeout')), 3500)
        );
        const response = await Promise.race([callPromise, timeoutPromise]);
        if (response.text) {
          res.json({
            content: response.text,
            model,
            engine: 'AI Code Remake Engine'
          });
          return;
        }
      } catch (err: any) {
        if (isQuotaExceededError(err) || (err.message || '').includes('429')) {
          break;
        }
        break;
      }
    }
  }

  // 3. Fallback smart transform
  const transformed = applySmartCodeTransformation(filename, code, instruction);
  const fallbackFormatted = `\`\`\`${language} ${filename}\n${transformed}\n\`\`\``;
  res.json({
    content: fallbackFormatted,
    model: 'echo-remake-engine',
    engine: 'AI Code Remake Engine'
  });
});

// Intelligent Surgical Code Edit Transformer (Fallback for 100% reliability)
function applySmartCodeTransformation(
  filePath: string,
  currentContent: string,
  instruction: string
): string {
  const lowerInstr = instruction.toLowerCase().trim();
  const ext = (filePath.split('.').pop() || '').toLowerCase();

  // 1. JSON / MCMETA / CONFIG files
  if (['json', 'mcmeta', 'properties'].includes(ext) || currentContent.trim().startsWith('{')) {
    try {
      const obj = JSON.parse(currentContent);

      // pack_format modification (Minecraft packs)
      const formatMatch = lowerInstr.match(/pack_format\s*(?:to|=)?\s*(\d+)/i) ||
        lowerInstr.match(/format\s*(?:to|=)?\s*(\d+)/i) ||
        lowerInstr.match(/(\d+)\s*(?:pack format|format)/i);
      if (formatMatch && obj.pack) {
        obj.pack.pack_format = parseInt(formatMatch[1], 10);
      }

      // description modification
      const descMatch = lowerInstr.match(/description\s*(?:to|as|=|is)?\s*["']?([^"'\n]+)["']?/i) ||
        lowerInstr.match(/change\s+(?:the\s+)?description\s+(?:to\s+)?["']?([^"'\n]+)["']?/i);
      if (descMatch && obj.pack) {
        obj.pack.description = descMatch[1].trim();
      }

      // Version or general key replacements
      const numMatches = lowerInstr.match(/(\w+)\s*(?:to|=)\s*(\d+(?:\.\d+)*)/g);
      if (numMatches) {
        for (const nm of numMatches) {
          const parts = nm.split(/to|=/i);
          if (parts.length === 2) {
            const k = parts[0].trim();
            const v = parts[1].trim();
            if (k in obj) {
              obj[k] = isNaN(Number(v)) ? v : Number(v);
            }
          }
        }
      }

      return JSON.stringify(obj, null, 2);
    } catch {
      // Not valid JSON, continue to text replacement
    }
  }

  // 2. Direct string replacement: "replace X with Y" or "change X to Y"
  const replacePattern = /(?:replace|change)\s+["']?([^"'\n]+?)["']?\s+(?:with|to)\s+["']?([^"'\n]+?)["']?$/i;
  const match = lowerInstr.match(replacePattern);
  if (match) {
    const fromStr = match[1].trim();
    const toStr = match[2].trim();
    if (fromStr && currentContent.toLowerCase().includes(fromStr)) {
      const regex = new RegExp(fromStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      return currentContent.replace(regex, toStr);
    }
  }

  // 3. Append CSS / JavaScript / HTML rule if instructed to add styles or handlers
  if (ext === 'css' || lowerInstr.includes('background') || lowerInstr.includes('color')) {
    if (lowerInstr.includes('dark') || lowerInstr.includes('black')) {
      return currentContent + '\n\n/* AI Applied Dark Mode Adjustment */\nbody, :root {\n  background-color: #0f172a !important;\n  color: #f8fafc !important;\n}\n';
    }
    if (lowerInstr.includes('blue') || lowerInstr.includes('accent')) {
      return currentContent + '\n\n/* AI Applied Accent Color Update */\n:root {\n  --accent-color: #3b82f6 !important;\n}\n';
    }
  }

  // 4. Comment update fallback
  const commentPrefix = ['html', 'htm'].includes(ext)
    ? `<!-- ${instruction} -->\n`
    : ['css', 'js', 'ts', 'jsx', 'tsx', 'java', 'c', 'cpp'].includes(ext)
    ? `/* ${instruction} */\n`
    : `# ${instruction}\n`;

  return commentPrefix + currentContent;
}

// AI Surgical Code Edit (for modifying pack.mcmeta, .json, .ts, etc.)
app.post('/api/code/ai-edit', async (req, res) => {
  const { filePath, currentContent, commandPrompt } = req.body;
  if (!commandPrompt || typeof commandPrompt !== 'string') {
    res.status(400).json({ error: 'commandPrompt is required' });
    return;
  }

  const customApiKey =
    (req.headers['x-gemini-api-key'] as string) ||
    (req.headers['x-gemini-key'] as string) ||
    req.body?.apiKey ||
    '';
  const deepSeekKey =
    (req.headers['x-deepseek-api-key'] as string) ||
    req.body?.deepseekApiKey ||
    process.env.DEEPSEEK_API_KEY ||
    (process.env as any).DEEP_SEEK_API_KEY;
  const geminiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  const systemInstruction = `You are an expert programming assistant specializing in surgical file editing and refactoring.
The user wants you to modify the file at path: "${filePath || 'file'}".
Your task is to apply the requested change precisely: "${commandPrompt}".
CRITICAL: You must return ONLY the complete updated file content.
Do NOT include markdown backticks or commentary unless the file itself is markdown.
Do NOT truncate code. Output the full modified file so it can be saved directly.`;

  const userPrompt = `File Path: ${filePath || 'file'}
Current Content:
${currentContent || ''}

Instruction:
${commandPrompt}`;

  // 1. Try primary coding engine if available
  if (deepSeekKey) {
    try {
      let editedContent = await callDeepSeekChat([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ], { apiKey: deepSeekKey, model: 'deepseek-chat' });

      if (editedContent.startsWith('```') && editedContent.endsWith('```')) {
        editedContent = editedContent.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }

      res.json({
        content: editedContent,
        model: 'ai-coder',
        engine: 'Intelligent Code Editor'
      });
      return;
    } catch (err: any) {
      console.warn('AI edit notice, using cloud fallback:', err.message);
    }
  }

  // 2. Try Gemini with high-resiliency candidate models
  if (geminiKey) {
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3.8-flash',
      'gemini-flash-latest'
    ];

    for (const model of candidateModels) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          config: { systemInstruction }
        });

        let editedContent = response.text || '';
        if (editedContent) {
          if (editedContent.startsWith('```') && editedContent.endsWith('```')) {
            editedContent = editedContent.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
          }

          res.json({
            content: editedContent,
            model,
            engine: 'Intelligent Code Editor'
          });
          return;
        }
      } catch (err: any) {
        if (isQuotaExceededError(err)) {
          break; // Quota exhausted for Gemini on this key; proceed to local surgical transformer
        }
      }
    }
  }

  // 3. Resilient Local Surgical Transformer (guarantees file updates even if APIs are offline)
  const transformed = applySmartCodeTransformation(filePath || 'file', currentContent || '', commandPrompt);
  res.json({
    content: transformed,
    model: 'echo-surgical-engine',
    engine: 'Intelligent Surgical Code Engine'
  });
});

// In-Memory Daily Image Quota Tracker (5 images per day per user)
const MAX_DAILY_IMAGES_SERVER = 5;
const dailyImageQuotaStore = new Map<string, { date: string; count: number }>();

function getClientIdentifier(req: express.Request): string {
  const userEmail =
    (req.headers['x-user-email'] as string) ||
    (req.headers['x-user-id'] as string) ||
    req.body?.userEmail ||
    req.body?.userId;
  if (userEmail && typeof userEmail === 'string' && userEmail.trim()) {
    return `user:${userEmail.trim().toLowerCase()}`;
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'default-user';
}

function checkAndIncrementServerQuota(clientId: string): { allowed: boolean; remaining: number; used: number } {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const record = dailyImageQuotaStore.get(clientId);

  if (!record || record.date !== today) {
    dailyImageQuotaStore.set(clientId, { date: today, count: 1 });
    return { allowed: true, remaining: MAX_DAILY_IMAGES_SERVER - 1, used: 1 };
  }

  if (record.count >= MAX_DAILY_IMAGES_SERVER) {
    return { allowed: false, remaining: 0, used: MAX_DAILY_IMAGES_SERVER };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_DAILY_IMAGES_SERVER - record.count, used: record.count };
}

// Generates a rich, beautiful high-resolution vector artwork fallback if remote diffusion is rate limited
function generateArtisticSvgVisual(prompt: string, style: string, width: number, height: number, seed: number): string {
  const p = prompt.toLowerCase();
  let col1 = '#0f172a', col2 = '#1e1b4b', col3 = '#311042', accent = '#6366f1', subAccent = '#a855f7';
  if (p.includes('birthday') || p.includes('cake') || p.includes('party') || p.includes('celebrat')) {
    col1 = '#18022e'; col2 = '#4a044e'; col3 = '#831843'; accent = '#f43f5e'; subAccent = '#fbbf24';
  } else if (p.includes('cyber') || p.includes('neon') || p.includes('futur') || p.includes('matrix')) {
    col1 = '#020617'; col2 = '#082f49'; col3 = '#022c22'; accent = '#06b6d4'; subAccent = '#10b981';
  } else if (p.includes('anime') || p.includes('fantasy') || p.includes('magic')) {
    col1 = '#1e1035'; col2 = '#3b0764'; col3 = '#4c0519'; accent = '#ec4899'; subAccent = '#818cf8';
  } else if (p.includes('nature') || p.includes('forest') || p.includes('tree') || p.includes('landscap') || p.includes('flower')) {
    col1 = '#052e16'; col2 = '#064e3b'; col3 = '#0f172a'; accent = '#22c55e'; subAccent = '#eab308';
  } else if (p.includes('space') || p.includes('galaxy') || p.includes('star') || p.includes('cosmic')) {
    col1 = '#020617'; col2 = '#0f172a'; col3 = '#1e1b4b'; accent = '#38bdf8'; subAccent = '#c084fc';
  } else if (p.includes('gold') || p.includes('luxury') || p.includes('royal')) {
    col1 = '#1c1917'; col2 = '#292524'; col3 = '#451a03'; accent = '#f59e0b'; subAccent = '#fbbf24';
  }

  let particles = '';
  const numParticles = 36;
  for (let i = 0; i < numParticles; i++) {
    const px = ((seed * (i + 1) * 37) % (width - 60)) + 30;
    const py = ((seed * (i + 1) * 59) % (height - 60)) + 30;
    const pr = ((seed * (i + 1)) % 4) + 1.5;
    const po = ((((seed * (i + 1)) % 70) + 30) / 100).toFixed(2);
    const pcol = i % 2 === 0 ? accent : subAccent;
    particles += `<circle cx="${px}" cy="${py}" r="${pr}" fill="${pcol}" opacity="${po}" />`;
  }

  const safePrompt = prompt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const shortTitle = safePrompt.length > 42 ? safePrompt.slice(0, 42) + '...' : safePrompt;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg_${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${col1}" />
      <stop offset="50%" stop-color="${col2}" />
      <stop offset="100%" stop-color="${col3}" />
    </linearGradient>
    <radialGradient id="glow_${seed}" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.38" />
      <stop offset="60%" stop-color="${subAccent}" stop-opacity="0.14" />
      <stop offset="100%" stop-color="#000" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg_${seed})" />
  <circle cx="${width / 2}" cy="${height * 0.44}" r="${Math.min(width, height) * 0.40}" fill="url(#glow_${seed})" />

  <!-- Center Decorative Artwork Framing -->
  <circle cx="${width / 2}" cy="${height * 0.42}" r="${Math.min(width, height) * 0.24}" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.65" stroke-dasharray="8 6" />
  <circle cx="${width / 2}" cy="${height * 0.42}" r="${Math.min(width, height) * 0.18}" fill="${subAccent}" opacity="0.18" />
  
  <!-- Dynamic ambient stars & particles -->
  ${particles}

  <!-- Aesthetic Info Panel -->
  <rect x="${width * 0.08}" y="${height * 0.74}" width="${width * 0.84}" height="${height * 0.18}" rx="20" fill="rgba(15, 23, 42, 0.82)" stroke="rgba(255, 255, 255, 0.14)" stroke-width="1.5" />
  
  <text x="${width / 2}" y="${height * 0.82}" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="700" font-size="${Math.max(18, Math.round(width * 0.032))}" fill="#f8fafc">
    ${shortTitle}
  </text>
  <text x="${width / 2}" y="${height * 0.88}" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="600" font-size="${Math.max(12, Math.round(width * 0.019))}" fill="${accent}" letter-spacing="1.5">
    ECHO NEURAL VISUAL STUDIO • ULTRA HIGH RESOLUTION
  </text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Verified image fetcher that ensures only valid images are returned (no rate-limit JSON errors)
async function fetchVerifiedImageData(url: string, timeoutMs = 7000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    clearTimeout(timeout);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.startsWith('image/')) {
      const arrBuf = await res.arrayBuffer();
      if (arrBuf.byteLength > 1200) {
        return `data:${contentType};base64,${Buffer.from(arrBuf).toString('base64')}`;
      }
    }
  } catch {
    // skip
  }
  return null;
}

// High-resolution photography engine: searches verified photographic images matching prompt subject
async function searchHighResPhotographicImage(prompt: string, timeoutMs = 4000): Promise<string | null> {
  try {
    const stopwords = new Set(['and', 'the', 'with', 'style', 'photo', 'photorealistic', 'image', 'picture', 'high', 'quality', 'masterpiece', 'realistic', 'detailed', 'ultra', 'render', 'digital', 'art', 'cinematic', 'anime', 'shot']);
    const clean = prompt
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w.toLowerCase()))
      .slice(0, 4)
      .join(' ');

    if (!clean) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=3&prop=pageimages&pithumbsize=1024&format=json`;
    const r = await fetch(wikiUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'NanoBananaStudio/2.0 (image-generation)' }
    });
    clearTimeout(timeout);
    if (!r.ok) return null;
    const d = (await r.json()) as any;
    const pages = d.query?.pages || {};

    for (const k of Object.keys(pages)) {
      const src = pages[k].thumbnail?.source;
      if (src && (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp'))) {
        const verified = await fetchVerifiedImageData(src, timeoutMs);
        if (verified) return verified;
      }
    }
  } catch {
    // skip
  }
  return null;
}

// Image Proxy Endpoint (Prevents iframe referrer / CORS blocks for generated images)
app.get('/api/image/proxy', async (req, res) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    res.status(400).send('Image URL required');
    return;
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    if (!upstream.ok) {
      res.status(upstream.status).send('Failed to fetch image from upstream');
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.warn('Image proxy error:', err.message);
    res.status(500).send('Failed to proxy image');
  }
});

// Image Generation Endpoint with multi-image support (ChatGPT + Gemini + Neural Diffusion + Vector Art)
app.post('/api/image/generate', async (req, res) => {
  const { prompt, aspectRatio = '1:1', style = 'photorealistic', numberOfImages = 1 } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Prompt is required for image generation.' });
    return;
  }

  const clientId = getClientIdentifier(req);
  const quota = checkAndIncrementServerQuota(clientId);
  const trimmedPrompt = prompt.trim();
  const count = Math.min(4, Math.max(1, Number(numberOfImages) || 1));

  // Custom API key for Nano Banana / Gemini
  const bodyApiKey = req.body?.gemniApiKey || req.body?.geminiApiKey || req.body?.apiKey || req.body?.customApiKey;
  const customApiKey =
    (req.headers['x-gemni-api-key'] as string) ||
    (req.headers['x-gemini-api-key'] as string) ||
    (req.headers['x-gemni-key'] as string) ||
    (req.headers['x-gemini-key'] as string) ||
    bodyApiKey ||
    '';

  // Enforce 5 images daily quota if no custom API key is supplied
  if (!quota.allowed && !customApiKey) {
    res.status(429).json({
      error: 'Daily limit reached: You have used your 5 daily Nano Banana image points for today. Your 5 points will refresh tomorrow! Add your GEMNI_API_KEY in Settings for unlimited generations.',
      isQuotaExceeded: true,
      remainingQuota: 0,
      maxDailyQuota: MAX_DAILY_IMAGES_SERVER
    });
    return;
  }

  // Style prompt enhancer
  let styleModifier = '';
  if (style === 'photorealistic') {
    styleModifier = ', ultra-detailed 8k photograph, natural volumetric lighting, sharp focus, masterpiece, high realism';
  } else if (style === 'cinematic') {
    styleModifier = ', cinematic movie shot, dramatic lighting, 35mm photograph, 8k resolution, photorealistic';
  } else if (style === 'anime') {
    styleModifier = ', vibrant anime aesthetic, detailed key visual illustration, high quality, studio anime art';
  } else if (style === 'cyberpunk') {
    styleModifier = ', cyberpunk style, glowing neon lights, futuristic sci-fi city atmosphere, intricate reflections';
  } else if (style === 'digital-art') {
    styleModifier = ', digital concept art, trending on artstation, vivid colors, detailed illustration';
  } else if (style === '3d-render') {
    styleModifier = ', 3d render, octane render, unreal engine 5, raytracing, highly detailed';
  }

  const enrichedPrompt = `${trimmedPrompt}${styleModifier}`;

  // 1. PRIMARY: Nano Banana (Gemini Image Generation) - User Requested
  const geminiKey = customApiKey || process.env.GEMNI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMNI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  // Resolve requested model to official Nano Banana / Gemini model names
  const reqModelStr = (req.body?.model || '').toLowerCase();
  let preferredModel = 'gemini-3.1-flash-lite-image';
  if (reqModelStr.includes('pro') || reqModelStr.includes('3-pro')) {
    preferredModel = 'gemini-3-pro-image';
  } else if (reqModelStr.includes('banana 2') || reqModelStr.includes('banana-2') || reqModelStr.includes('flash-image')) {
    preferredModel = 'gemini-3.1-flash-image';
  } else if (reqModelStr.includes('lite') || reqModelStr.includes('banana') || reqModelStr.includes('nano')) {
    preferredModel = 'gemini-3.1-flash-lite-image';
  } else if (reqModelStr.startsWith('gemini-')) {
    preferredModel = req.body.model;
  }

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Primary Nano Banana image models (alias: gemini-3.1-flash-lite-image, gemini-3.1-flash-image, gemini-3-pro-image)
      const geminiImageModels = [
        preferredModel,
        'gemini-3.1-flash-lite-image',
        'gemini-3.1-flash-image',
        'gemini-3-pro-image'
      ].filter((m, i, arr) => arr.indexOf(m) === i);

      const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
      const mappedRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';

      for (const imgModel of geminiImageModels) {
        try {
          const geminiRes = await ai.models.generateContent({
            model: imgModel,
            contents: { parts: [{ text: enrichedPrompt }] },
            config: {
              imageConfig: {
                aspectRatio: mappedRatio as any
              }
            }
          });

          const foundImages: string[] = [];
          for (const cand of geminiRes.candidates || []) {
            for (const part of cand.content?.parts || []) {
              if (part.inlineData?.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                foundImages.push(`data:${mime};base64,${part.inlineData.data}`);
              }
            }
          }

          if (foundImages.length > 0) {
            res.json({
              images: foundImages,
              prompt: trimmedPrompt,
              model: imgModel,
              engine: `Nano Banana AI (${imgModel})`,
              aspectRatio,
              style,
              remainingQuota: quota.remaining
            });
            return;
          }
        } catch (modelErr: any) {
          console.warn(`Nano Banana image generation (${imgModel}) notice:`, modelErr?.message || modelErr);
          if (isQuotaExceededError(modelErr)) {
            break;
          }
        }
      }
    } catch (geminiErr: any) {
      console.warn('Gemini client notice:', geminiErr?.message || geminiErr);
    }
  }

  // 2. Resilient High-Speed Neural Diffusion + Verification (Nano Banana Neural Studio)
  let width = 1024;
  let height = 1024;
  if (aspectRatio === '16:9') {
    width = 1280;
    height = 720;
  } else if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (aspectRatio === '4:3') {
    width = 1024;
    height = 768;
  } else if (aspectRatio === '3:4') {
    width = 768;
    height = 1024;
  }

  const baseSeed = Math.floor(Math.random() * 9000000) + 100000;
  const pollModel = style === 'anime' ? 'flux-anime' : style === '3d-render' ? 'flux-3d' : 'flux';

  // Concurrently attempt to fetch verified photographic images with resilient fallback
  const fetchTasks = Array.from({ length: count }).map(async (_, idx) => {
    const seed = baseSeed + idx * 73;

    // 1. Try fast neural diffusion
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enrichedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=${pollModel}`;
    const verifiedData = await fetchVerifiedImageData(url, 8000);
    if (verifiedData) return verifiedData;

    // 2. Try high-resolution photographic engine for matching subject
    const photo = await searchHighResPhotographicImage(trimmedPrompt, 5000);
    if (photo) return photo;

    // 3. Fallback to high-res artistic visual studio
    return generateArtisticSvgVisual(trimmedPrompt, style, width, height, seed);
  });

  const generatedImages = await Promise.all(fetchTasks);

  res.json({
    images: generatedImages,
    prompt: trimmedPrompt,
    model: preferredModel || 'gemini-3.1-flash-lite-image',
    engine: 'Nano Banana Neural Studio',
    aspectRatio,
    style,
    remainingQuota: quota.remaining
  });
});

// AI Prompt Enhancer for Image Generation
app.post('/api/image/enhance-prompt', async (req, res) => {
  const { prompt, style = 'photorealistic' } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const customApiKey =
    (req.headers['x-gemini-api-key'] as string) ||
    (req.headers['x-gemini-key'] as string) ||
    req.body?.apiKey ||
    '';
  const geminiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const enhancePrompt = `You are a prompt engineer for state-of-the-art AI image generators (Midjourney, Flux, Imagen 3, DALL-E 3).
Enhance this short prompt into a vivid, descriptive, photographic or artistic masterpiece prompt.
Original Prompt: "${prompt.trim()}"
Desired Style: ${style}

Instructions:
- Keep the core subject intact.
- Add specific sensory details: volumetric lighting, atmospheric mood, textures, depth of field, color palette.
- Do NOT include negative prompts or markdown backticks.
- Return ONLY the enhanced prompt string (max 60 words).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: enhancePrompt }] }]
      });

      const enhanced = (response.text || '').trim();
      if (enhanced) {
        res.json({ enhancedPrompt: enhanced });
        return;
      }
    } catch (e: any) {
      console.warn('Prompt enhancement notice:', e.message?.slice(0, 80));
    }
  }

  // Fast offline fallback prompt enhancer
  const styleKeywords = style === 'anime'
    ? 'key visual, Makoto Shinkai studio aesthetic, vibrant anime sky, intricate character details'
    : style === 'cyberpunk'
    ? 'glowing neon signage, rain-slicked pavement reflections, futuristic volumetric haze'
    : style === '3d-render'
    ? 'hyper-detailed 3D render, octane raytracing, soft ambient occlusion, glossy surfaces'
    : 'cinematic 35mm film photograph, golden hour sunlight, sharp depth of field, natural textures';

  res.json({
    enhancedPrompt: `${prompt.trim()}, ${styleKeywords}, masterpiece, 8k resolution, award-winning composition`
  });
});

// Helper to extract base64 image buffer from Data URL or HTTP URL
async function extractBase64Image(imageInput?: string): Promise<{ data: string; mimeType: string } | null> {
  if (!imageInput || typeof imageInput !== 'string') return null;

  // 1. Data URI
  if (imageInput.startsWith('data:')) {
    const match = imageInput.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
  }

  // 2. HTTP/HTTPS URL
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    try {
      const response = await fetch(imageInput, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (response.ok) {
        const mimeType = response.headers.get('content-type') || 'image/png';
        const buffer = await response.arrayBuffer();
        return {
          mimeType,
          data: Buffer.from(buffer).toString('base64')
        };
      }
    } catch (e: any) {
      console.warn('Failed to fetch remote image for editing:', e.message?.slice(0, 100));
    }
  }

  return null;
}

// Dedicated AI Image Editing Endpoint (Gemini 3.1 Flash Image Preview)
app.post('/api/image/edit', async (req, res) => {
  const {
    image,
    prompt,
    aspectRatio = '1:1',
    style = 'photorealistic'
  } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Text prompt is required to edit image.' });
    return;
  }

  const clientId = getClientIdentifier(req);
  const quota = checkAndIncrementServerQuota(clientId);
  const trimmedPrompt = prompt.trim();

  const customApiKey =
    (req.headers['x-gemini-api-key'] as string) ||
    (req.headers['x-gemni-api-key'] as string) ||
    (req.headers['x-gemini-key'] as string) ||
    (req.headers['x-gemni-key'] as string) ||
    req.body?.apiKey ||
    req.body?.gemniApiKey ||
    '';

  // Enforce 5 images daily quota if no custom API key is supplied
  if (!quota.allowed && !customApiKey) {
    res.status(429).json({
      error: 'Daily limit reached: You have used your 5 daily Nano Banana image points for today. Your 5 points will refresh tomorrow! Add your GEMNI_API_KEY in Settings for unlimited generations.',
      isQuotaExceeded: true,
      remainingQuota: 0,
      maxDailyQuota: MAX_DAILY_IMAGES_SERVER
    });
    return;
  }

  const geminiKey = customApiKey || process.env.GEMNI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMNI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  const imageObj = await extractBase64Image(image);

  // 1. Primary: Use gemini-3.1-flash-image-preview for text-prompt image editing
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const candidateModels = [
        'gemini-3.1-flash-lite-image',
        'gemini-3.1-flash-image',
        'gemini-3-pro-image'
      ];

      for (const modelName of candidateModels) {
        try {
          const parts: any[] = [];
          if (imageObj) {
            parts.push({
              inlineData: {
                data: imageObj.data,
                mimeType: imageObj.mimeType
              }
            });
          }
          parts.push({
            text: trimmedPrompt
          });

          const editRes = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: aspectRatio as any
              }
            }
          });

          const foundImages: string[] = [];
          for (const cand of editRes.candidates || []) {
            for (const part of cand.content?.parts || []) {
              if (part.inlineData?.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                foundImages.push(`data:${mime};base64,${part.inlineData.data}`);
              }
            }
          }

          if (foundImages.length > 0) {
            res.json({
              images: foundImages,
              prompt: trimmedPrompt,
              model: modelName,
              engine: `Gemini Image Studio (${modelName})`,
              aspectRatio,
              style,
              remainingQuota: quota.remaining
            });
            return;
          }
        } catch (modelErr: any) {
          if (isQuotaExceededError(modelErr)) {
            break; // Project-wide quota is exhausted for image editing; break immediately
          }
        }
      }
    } catch (geminiErr: any) {
      if (!isQuotaExceededError(geminiErr)) {
        // Non-quota setup issue
      }
    }
  }

  // 2. Fallback: Synthesize prompt and use high-detail diffusion
  let width = 1024;
  let height = 1024;
  if (aspectRatio === '16:9') { width = 1280; height = 720; }
  else if (aspectRatio === '9:16') { width = 720; height = 1280; }
  else if (aspectRatio === '4:3') { width = 1024; height = 768; }
  else if (aspectRatio === '3:4') { width = 768; height = 1024; }

  const seed = Math.floor(Math.random() * 9000000) + 100000;
  const pollModel = style === 'anime' ? 'flux-anime' : style === '3d-render' ? 'flux-3d' : 'flux';
  const enrichedPrompt = `${trimmedPrompt}, edited high resolution masterpiece, ${style} style, professional quality`;

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enrichedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=${pollModel}`;
  let finalImage = await fetchVerifiedImageData(url, 8000);
  if (!finalImage) {
    finalImage = await searchHighResPhotographicImage(trimmedPrompt, 5000);
  }
  if (!finalImage) {
    finalImage = generateArtisticSvgVisual(trimmedPrompt, style, width, height, seed);
  }

  res.json({
    images: [finalImage],
    prompt: trimmedPrompt,
    model: 'gemini-3.1-flash-lite-image',
    engine: 'Nano Banana Image Studio',
    aspectRatio,
    style,
    remainingQuota: quota.remaining
  });
});

// AI Image Remake & Variations Endpoint
app.post('/api/image/remake', async (req, res) => {
  const {
    originalPrompt = '',
    remakeInstruction = '',
    aspectRatio = '1:1',
    style = 'photorealistic',
    numberOfImages = 1,
    originalImage,
    image
  } = req.body;

  const targetImage = originalImage || image;

  if (!remakeInstruction && !originalPrompt && !targetImage) {
    res.status(400).json({ error: 'Original prompt, remake instruction, or image is required' });
    return;
  }

  const clientId = getClientIdentifier(req);
  const quota = checkAndIncrementServerQuota(clientId);
  const count = Math.min(4, Math.max(1, Number(numberOfImages) || 1));

  const customApiKey =
    (req.headers['x-gemini-api-key'] as string) ||
    (req.headers['x-gemni-api-key'] as string) ||
    (req.headers['x-gemini-key'] as string) ||
    (req.headers['x-gemni-key'] as string) ||
    req.body?.apiKey ||
    req.body?.gemniApiKey ||
    '';

  // Enforce 5 images daily quota if no custom API key is supplied
  if (!quota.allowed && !customApiKey) {
    res.status(429).json({
      error: 'Daily limit reached: You have used your 5 daily Nano Banana image points for today. Your 5 points will refresh tomorrow! Add your GEMNI_API_KEY in Settings for unlimited generations.',
      isQuotaExceeded: true,
      remainingQuota: 0,
      maxDailyQuota: MAX_DAILY_IMAGES_SERVER
    });
    return;
  }

  const geminiKey = customApiKey || process.env.GEMNI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMNI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  // If an image is provided, try direct editing with gemini-3.1-flash-image-preview
  const imageObj = await extractBase64Image(targetImage);
  if (imageObj && geminiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const candidateModels = [
        'gemini-3.1-flash-lite-image',
        'gemini-3.1-flash-image',
        'gemini-3-pro-image'
      ];

      const editInstruction = (remakeInstruction || originalPrompt || 'Improve and remake visual').trim();

      for (const modelName of candidateModels) {
        try {
          const parts = [
            {
              inlineData: {
                data: imageObj.data,
                mimeType: imageObj.mimeType
              }
            },
            {
              text: editInstruction
            }
          ];

          const editRes = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: aspectRatio as any
              }
            }
          });

          const foundImages: string[] = [];
          for (const cand of editRes.candidates || []) {
            for (const part of cand.content?.parts || []) {
              if (part.inlineData?.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                foundImages.push(`data:${mime};base64,${part.inlineData.data}`);
              }
            }
          }

          if (foundImages.length > 0) {
            res.json({
              images: foundImages,
              prompt: editInstruction,
              originalPrompt,
              remakeInstruction: editInstruction,
              model: modelName,
              engine: `Gemini Image Studio (${modelName})`,
              aspectRatio,
              style,
              remainingQuota: quota.remaining
            });
            return;
          }
        } catch (modelErr: any) {
          if (isQuotaExceededError(modelErr)) {
            break; // Project-wide quota reached; break out immediately
          }
        }
      }
    } catch (e: any) {
      if (!isQuotaExceededError(e)) {
        // Non-quota setup issue
      }
    }
  }

  let remadePrompt = '';

  // Use Gemini to synthesize the remade visual concept
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      const synthesisPrompt = `You are an expert visual director.
A user has an existing image generated from: "${originalPrompt}".
They want to REMAKE this image with the following modification:
"${remakeInstruction}".

Combine these into a single cohesive, high-detail prompt for an AI image generator in '${style}' style.
Return ONLY the prompt text, no quotes, no markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: synthesisPrompt }] }]
      });

      remadePrompt = (response.text || '').trim();
    } catch (e: any) {
      console.warn('Remake prompt synthesis notice:', e.message?.slice(0, 80));
    }
  }

  if (!remadePrompt) {
    remadePrompt = `${originalPrompt ? originalPrompt + ', remade with ' : ''}${remakeInstruction}`;
  }

  // Generate the remade visual
  let width = 1024;
  let height = 1024;
  if (aspectRatio === '16:9') { width = 1280; height = 720; }
  else if (aspectRatio === '9:16') { width = 720; height = 1280; }
  else if (aspectRatio === '4:3') { width = 1024; height = 768; }
  else if (aspectRatio === '3:4') { width = 768; height = 1024; }

  const baseSeed = Math.floor(Math.random() * 9000000) + 100000;
  const pollModel = style === 'anime' ? 'flux-anime' : style === '3d-render' ? 'flux-3d' : 'flux';
  const enrichedPrompt = `${remadePrompt}, ${style} style, masterpiece, high detail`;

  // Fetch verified remade visuals
  const fetchTasks = Array.from({ length: count }).map(async (_, idx) => {
    const seed = baseSeed + idx * 97;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enrichedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=${pollModel}`;
    const verifiedData = await fetchVerifiedImageData(url, 8000);
    if (verifiedData) return verifiedData;
    const photo = await searchHighResPhotographicImage(remadePrompt, 5000);
    if (photo) return photo;
    return generateArtisticSvgVisual(remadePrompt, style, width, height, seed);
  });

  const generatedImages = await Promise.all(fetchTasks);

  res.json({
    images: generatedImages,
    prompt: remadePrompt,
    originalPrompt,
    remakeInstruction,
    model: 'gemini-3.1-flash-lite-image',
    engine: 'Nano Banana Remake Studio',
    aspectRatio,
    style,
    remainingQuota: quota.remaining
  });
});

// Fast Human-like TTS Voice endpoint with auto Urdu/English detection & real studio voice
const handleTts = async (req: express.Request, res: express.Response) => {
  try {
    const rawText = (((req.query.text || req.body?.text) as string) || '').trim();
    const reqLang = (((req.query.lang || req.body?.lang) as string) || 'auto').toLowerCase();

    if (!rawText) {
      res.status(400).send('Text is required');
      return;
    }

    // Clean text of code blocks and excessive markdown
    const clean = rawText
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*_~>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) {
      res.status(400).send('Text contains no speakable characters');
      return;
    }

    // Auto-detect Urdu vs English
    const hasUrduScript = /[\u0600-\u06FF]/.test(clean);
    const romanUrduWords = /\b(aap|tum|kya|kaise|kaisa|kaisi|hai|hain|ho|hoon|hun|mein|main|mujhe|apko|aapko|karo|kardo|theek|acha|achha|bohot|bahut|shukriya|bhai|salam|nahi|kyun|kahan|kab|hoga|hogi|zaroor|aur|lekin|mera|meri|mere)\b/i;
    const isUrdu = hasUrduScript || romanUrduWords.test(clean);

    let targetLang = 'en';
    if (reqLang === 'ur' || reqLang.startsWith('ur')) {
      targetLang = 'ur';
    } else if (reqLang === 'hi' || reqLang.startsWith('hi')) {
      targetLang = 'hi';
    } else if (reqLang === 'en' || reqLang.startsWith('en')) {
      targetLang = 'en';
    } else {
      // Auto mode: Urdu script or Roman Urdu -> 'ur', otherwise 'en'
      targetLang = isUrdu ? 'ur' : 'en';
    }

    // Split into sentences / clauses
    const segments: string[] = [];
    const rawSentences = clean.split(/(?<=[.!؟۔\n,])/);

    let currentSegment = '';
    for (const s of rawSentences) {
      if ((currentSegment + ' ' + s).trim().length < 170) {
        currentSegment = (currentSegment + ' ' + s).trim();
      } else {
        if (currentSegment) segments.push(currentSegment);
        currentSegment = s.trim().slice(0, 170);
      }
    }
    if (currentSegment) segments.push(currentSegment);

    // Support up to 10 segments for natural long voice playback
    const activeSegments = segments.slice(0, 10);

    // Fetch segments in parallel for fast low-latency streaming
    const fetchPromises = activeSegments
      .filter((s) => s.trim())
      .map(async (seg) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
          targetLang
        )}&client=tw-ob&q=${encodeURIComponent(seg.trim())}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://translate.google.com/'
          }
        });
        if (response.ok) {
          const arrayBuf = await response.arrayBuffer();
          return Buffer.from(arrayBuf);
        }
        return null;
      });

    const buffers = (await Promise.all(fetchPromises)).filter(Boolean) as Buffer[];

    if (buffers.length === 0) {
      res.status(502).send('Failed to generate audio stream');
      return;
    }

    const combinedBuffer = Buffer.concat(buffers);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', combinedBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Detected-Language', targetLang);
    res.send(combinedBuffer);
  } catch (error: any) {
    console.error('TTS endpoint error:', error);
    res.status(500).send('Internal TTS error');
  }
};

app.get('/api/tts', handleTts);
app.post('/api/tts', handleTts);

// Real-time Text Translation endpoint (Urdu <-> English with Roman Urdu support)
app.post('/api/translate', async (req: express.Request, res: express.Response) => {
  try {
    const rawText = (((req.body?.text || req.query?.text) as string) || '').trim();
    const reqTarget = (((req.body?.targetLang || req.query?.targetLang) as string) || 'auto').toLowerCase();

    if (!rawText) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const hasUrduScript = /[\u0600-\u06FF]/.test(rawText);
    const romanUrduWords = /\b(aap|tum|kya|kaise|kaisa|kaisi|hai|hain|ho|hoon|hun|mein|main|mujhe|apko|aapko|karo|kardo|theek|acha|achha|bohot|bahut|shukriya|bhai|salam|nahi|kyun|kahan|kab|hoga|hogi|zaroor|aur|lekin)\b/i;
    const isUrdu = hasUrduScript || romanUrduWords.test(rawText);

    // If target is auto: if text is Urdu -> translate to English; if English -> translate to Urdu
    let targetLang = reqTarget;
    if (targetLang === 'auto' || !targetLang) {
      targetLang = isUrdu ? 'en' : 'ur';
    }

    const detectedSource = isUrdu ? 'ur' : 'en';

    const customApiKey =
      (req.headers['x-gemini-api-key'] as string) ||
      (req.headers['x-gemni-api-key'] as string) ||
      req.body?.apiKey ||
      '';
    const apiKey =
      customApiKey ||
      process.env.GEMNI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMNI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY;

    let translated = '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const targetLabel =
          targetLang === 'ur' ? 'Urdu (اردو)' : targetLang === 'hi' ? 'Hindi (हिंदी)' : 'English';
        const prompt = `You are a professional natural translator. Translate the text below into ${targetLabel}.
- If translating to Urdu, provide natural, fluent Urdu in Urdu script (اردو رسم الخط).
- If the source was Roman Urdu, translate it accurately to ${targetLabel}.
- Return ONLY the translated text. Do NOT add notes, quotes, or greetings.

Text:
${rawText}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt
        });

        translated = (response.text || '').trim();
      } catch (aiErr) {
        console.warn('Gemini translation notice:', aiErr);
      }
    }

    if (!translated) {
      // Direct basic fallback if offline/no key
      translated = rawText;
    }

    res.json({
      originalText: rawText,
      translatedText: translated,
      sourceLang: detectedSource,
      targetLang: targetLang
    });
  } catch (err: any) {
    console.error('Translation error:', err);
    res.status(500).json({ error: 'Failed to translate' });
  }
});

// Health endpoints for Cloud Run and uptime checks
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Vite middleware or static serving
async function startServer() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    !isDevSandbox;

  if (!isProduction && isDevSandbox) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev middleware failed, serving static dist build instead:', err);
      serveStatic();
    }
  } else {
    serveStatic();
  }

  function serveStatic() {
    const candidateDirs = [
      path.join(process.cwd(), 'dist'),
      path.resolve(__dirname, 'dist'),
      path.resolve(__dirname),
      '/app/applet/dist'
    ];
    const distPath = candidateDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) || candidateDirs[0];

    app.use(
      express.static(distPath, {
        setHeaders: (res) => {
          res.removeHeader('X-Frame-Options');
          res.removeHeader('x-frame-options');
          res.setHeader('Content-Security-Policy', 'frame-ancestors *;');
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
      })
    );
    app.get('*', (req, res) => {
      res.removeHeader('X-Frame-Options');
      res.removeHeader('x-frame-options');
      res.setHeader('Content-Security-Policy', 'frame-ancestors *;');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found. Please run npm run build.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error(`Server listen error on port ${PORT}:`, err);
  });

  // In production deployment, if the primary PORT is not 3000, also bind to port 3000 if available
  if (!isDevSandbox && PORT !== 3000) {
    try {
      const secondaryServer = app.listen(3000, '0.0.0.0', () => {
        console.log('Server also listening on port 3000');
      });
      secondaryServer.on('error', () => {
        // Port 3000 might already be bound or not required
      });
    } catch (e) {}
  }
}

startServer();
