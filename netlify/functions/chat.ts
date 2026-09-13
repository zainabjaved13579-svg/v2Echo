import type { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';
import { generateEchoFallbackResponse } from './echoEngine';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const {
      contents,
      systemInstruction,
      temperature = 0.7,
      model = 'echo-3.7-flash',
      useSearchGrounding = false,
      apiKey: bodyApiKey,
      customApiKey: bodyCustomApiKey,
    } = body;

    const customApiKey =
      event.headers['x-gemini-api-key'] ||
      event.headers['x-gemini-key'] ||
      bodyApiKey ||
      bodyCustomApiKey ||
      '';
    const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Contents array is required' }),
      };
    }

    const sanitizedContents = (contents || [])
      .map((c: any) => ({
        role: (c.role === 'model' ? 'model' : 'user') as 'user' | 'model',
        parts: (c.parts || []).filter((p: any) => (p.text && p.text.trim()) || (p.inlineData && p.inlineData.data))
      }))
      .filter((c: any) => c.parts && c.parts.length > 0);

    if (sanitizedContents.length === 0) {
      sanitizedContents.push({
        role: 'user',
        parts: [{ text: 'Hello Echo!' }]
      });
    }

    while (sanitizedContents.length > 0 && sanitizedContents[0].role !== 'user') {
      sanitizedContents.shift();
    }

    // If API key is available in Netlify environment or custom headers, use Google Gemini Cloud
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        let targetModel = 'gemini-3.7-flash';
        if (model.includes('3.1-pro') || model.includes('pro')) targetModel = 'gemini-3.1-pro-preview';
        else if (model.includes('lite')) targetModel = 'gemini-3.1-flash-lite';
        else if (model.includes('flash-latest')) targetModel = 'gemini-flash-latest';
        else if (model.includes('3.7') || model.includes('flash') || model.includes('echo')) targetModel = 'gemini-3.7-flash';
        else if (model.startsWith('gemini-')) targetModel = model;

        const config: Record<string, any> = {
          temperature: Number(temperature) || 0.7,
        };

        if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
          config.systemInstruction = systemInstruction.trim();
        }

        if (useSearchGrounding) {
          config.tools = [{ googleSearch: {} }];
        }

        // Resilient candidate list with high-capacity models for high demand / 503 fallback
        const candidateModels = [
          targetModel,
          'gemini-3.1-flash-lite',
          'gemini-flash-latest',
          'gemini-3.7-flash'
        ].filter((m, i, arr) => arr.indexOf(m) === i);

        let responseText = '';
        for (const currModel of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model: currModel,
              contents: sanitizedContents,
              config,
            });
            responseText = response.text || '';
            if (responseText) break;
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

        if (responseText) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              text: responseText,
              model,
            }),
          };
        }
      } catch (geminiError: any) {
        console.warn('Gemini cloud execution notice, falling back to Echo Engine:', geminiError?.message);
      }
    }

    // Zero-config Netlify Instant Engine Response (Works with no variables added!)
    const fallbackText = generateEchoFallbackResponse(sanitizedContents, systemInstruction, model);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        text: fallbackText,
        model: 'echo-3.7-flash',
      }),
    };
  } catch (error: any) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error?.message || 'Error processing request with Echo AI',
      }),
    };
  }
};
