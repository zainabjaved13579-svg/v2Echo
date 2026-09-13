import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const customApiKey = event.headers['x-gemini-api-key'] || event.headers['x-gemini-key'] || '';
  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
  const hasKey = hasEnvKey || Boolean(customApiKey);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key, x-gemini-key',
    },
    body: JSON.stringify({
      status: 'ok',
      hasKey: true, // Always ready for zero-config Netlify deployments
      hasCloudKey: hasKey,
      mode: hasKey ? 'gemini-cloud' : 'echo-instant',
      platform: 'netlify',
      defaultModel: 'echo-3.7-flash',
      supportedModels: ['echo-3.7-flash', 'echo-2.5-flash', 'echo-2.5-pro'],
    }),
  };
};
