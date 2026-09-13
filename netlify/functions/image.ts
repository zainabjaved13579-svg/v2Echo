import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key, x-gemini-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { prompt, aspectRatio = '1:1', engine = 'nano-banana', style = 'photorealistic', numberOfImages = 1 } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }

    const trimmedPrompt = prompt.trim();
    const customKey =
      event.headers['x-gemini-api-key'] ||
      event.headers['x-gemini-key'] ||
      body.apiKey ||
      body.customApiKey;

    const apiKey = customKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

    let styleModifier = '';
    if (style === 'photorealistic') {
      styleModifier = ', ultra-detailed 8k photograph, natural lighting, sharp focus, masterpiece, high realism';
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

    let width = 1024;
    let height = 1024;
    if (aspectRatio === '16:9') { width = 1280; height = 720; }
    else if (aspectRatio === '9:16') { width = 720; height = 1280; }
    else if (aspectRatio === '4:3') { width = 1024; height = 768; }
    else if (aspectRatio === '3:4') { width = 768; height = 1024; }

    if (apiKey && (engine === 'gemini-imagen' || engine === 'gemini')) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: enrichedPrompt,
          config: {
            numberOfImages: Math.min(Math.max(1, Number(numberOfImages) || 1), 4),
            outputMimeType: 'image/jpeg',
            aspectRatio: (aspectRatio === '16:9' || aspectRatio === '9:16' || aspectRatio === '4:3' || aspectRatio === '3:4' || aspectRatio === '1:1') ? aspectRatio : '1:1'
          }
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
          const images = response.generatedImages.map((img) => `data:image/jpeg;base64,${img.image.imageBytes}`);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              images,
              prompt: trimmedPrompt,
              model: 'gemini-imagen-3',
              engine: 'Gemini Imagen 3.0'
            })
          };
        }
      } catch (imgErr: any) {
        console.warn('Netlify function imagen notice:', imgErr?.message?.slice(0, 150));
      }
    }

    const seed = Math.floor(Math.random() * 9999999) + 1;
    const pollModel = style === 'anime' ? 'flux-anime' : style === '3d-render' ? 'flux-3d' : 'flux';
    const nanoBananaImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enrichedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=${pollModel}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        images: [nanoBananaImageUrl],
        prompt: trimmedPrompt,
        model: 'nano-banana-flux',
        engine: 'Nano Banana Neural Diffusion',
        aspectRatio,
        style
      })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error?.message || 'Serverless image generation failed' })
    };
  }
};
