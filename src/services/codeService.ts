/**
 * Echo Code Services
 * Unified AI Code Generation, Remake, and Surgical Edit
 */

export interface CodeRemakeParams {
  code: string;
  language?: string;
  instruction?: string;
  filename?: string;
  customApiKey?: string;
}

export interface CodeGenResponse {
  content: string;
  model: string;
  engine: string;
}

/**
 * Calls backend or cloud to generate complete multi-file project or application code
 */
export async function generateAiCode(prompt: string, customApiKey?: string): Promise<CodeGenResponse> {
  const key =
    customApiKey ||
    localStorage.getItem('echo_gemini_api_key') ||
    localStorage.getItem('gemini_api_key') ||
    '';
  const deepseekApiKey =
    localStorage.getItem('deepseek_api_key') ||
    localStorage.getItem('echo_deepseek_api_key') ||
    '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (key) {
    headers['x-gemini-api-key'] = key;
  }
  if (deepseekApiKey) {
    headers['x-deepseek-api-key'] = deepseekApiKey;
  }

  const response = await fetch('/api/code/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, apiKey: key, deepseekApiKey })
  });

  if (!response.ok) {
    throw new Error(`Code generation failed with HTTP status ${response.status}`);
  }

  return response.json();
}

/**
 * Calls backend to remake, refactor, modernize, and enhance existing code
 */
export async function remakeAiCode(params: CodeRemakeParams): Promise<CodeGenResponse> {
  const {
    code,
    language = 'html',
    instruction = 'Refactor, modernize, fix bugs, and ensure responsive design for mobile and PC',
    filename = 'script.js',
    customApiKey
  } = params;

  const key =
    customApiKey ||
    localStorage.getItem('echo_gemini_api_key') ||
    localStorage.getItem('gemini_api_key') ||
    '';
  const deepseekApiKey =
    localStorage.getItem('deepseek_api_key') ||
    localStorage.getItem('echo_deepseek_api_key') ||
    '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (key) {
    headers['x-gemini-api-key'] = key;
  }
  if (deepseekApiKey) {
    headers['x-deepseek-api-key'] = deepseekApiKey;
  }

  const response = await fetch('/api/code/remake', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      code,
      language,
      instruction,
      filename,
      apiKey: key,
      deepseekApiKey
    })
  });

  if (!response.ok) {
    throw new Error(`Code remake failed with HTTP status ${response.status}`);
  }

  return response.json();
}

/**
 * Surgical AI Edit for workspace files
 */
export async function surgicalAiEdit(params: {
  filePath: string;
  currentContent: string;
  commandPrompt: string;
  customApiKey?: string;
}): Promise<CodeGenResponse> {
  const { filePath, currentContent, commandPrompt, customApiKey } = params;
  const key =
    customApiKey ||
    localStorage.getItem('echo_gemini_api_key') ||
    localStorage.getItem('gemini_api_key') ||
    '';
  const deepseekApiKey =
    localStorage.getItem('deepseek_api_key') ||
    localStorage.getItem('echo_deepseek_api_key') ||
    '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (key) {
    headers['x-gemini-api-key'] = key;
  }
  if (deepseekApiKey) {
    headers['x-deepseek-api-key'] = deepseekApiKey;
  }

  const response = await fetch('/api/code/ai-edit', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      filePath,
      currentContent,
      commandPrompt,
      apiKey: key,
      deepseekApiKey
    })
  });

  if (!response.ok) {
    throw new Error(`Surgical code edit failed with HTTP status ${response.status}`);
  }

  return response.json();
}
