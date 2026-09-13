export interface ImageAttachment {
  name: string;
  mimeType: string;
  base64: string;
  dataUrl: string;
}

export interface SpeedStats {
  durationMs: number;
  charsCount: number;
  charsPerSec: number;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string; // e.g. '/workspace/index.html' or '/src/components/App.tsx'
  content: string;
  language: string; // 'html' | 'javascript' | 'typescript' | 'css' | 'python' | 'markdown' | 'json' | 'svg' | 'text'
  createdAt: number;
  updatedAt: number;
  autoSaved: boolean;
  source: 'ai-generated' | 'user-created' | 'imported';
  chatSessionId?: string;
  chatMessageId?: string;
  isFavorite?: boolean;
  fileHandle?: any; // FileSystemFileHandle for live direct disk saving
  localPath?: string;
}

export type FileCategory = 'all' | 'image' | 'document' | 'code' | 'data' | 'other';

export interface ManagedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: 'image' | 'document' | 'code' | 'data' | 'other';
  dataUrl?: string;
  textContent?: string;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  tags?: string[];
}

export interface UploadedFileAttachment {
  name: string;
  type: string;
  size: number;
  content: string; // text content for code/text files
  isCodeOrText: boolean;
  dataUrl?: string;
  base64?: string; // base64 representation for multimodal files (PDF, images, etc. up to 15MB)
  fileHandle?: any; // FileSystemFileHandle if picked via showOpenFilePicker
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  image?: ImageAttachment;
  attachedFile?: UploadedFileAttachment;
  generatedImages?: string[];
  generatedImagePrompt?: string;
  attachedFileId?: string;
  attachedFileName?: string;
  modifiedFileName?: string;
  modifiedFileContent?: string;
  isStreaming?: boolean;
  isThinking?: boolean;
  thinkingText?: string;
  thinkingDurationMs?: number;
  error?: string;
  modelUsed?: string;
  stats?: SpeedStats;
  replyTo?: {
    id: string;
    role: 'user' | 'model';
    text: string;
    senderName?: string;
  };
}

export interface PersonaPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemInstruction: string;
  badge: string;
}

export type SupportedLanguage = 'auto' | 'en' | 'ur' | 'hi' | 'es' | 'fr' | 'ar';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  personaId: string;
  customInstruction?: string;
  language?: SupportedLanguage;
  temperature: number;
  model: string;
  useSearchGrounding: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  defaultModel: string;
  defaultTemperature: number;
  defaultPersonaId: string;
  enableSearchGrounding: boolean;
  customApiKey?: string;
  deepseekApiKey?: string;
  openaiApiKey?: string;
  selectedLanguage: SupportedLanguage;
  autoSpeakResponses: boolean;
  ttsVoice?: string;
  ttsSpeed: number;
  ttsPitch: number;
}

export interface AiEditHistoryItem {
  id: string;
  fileId: string;
  filePath: string;
  prompt: string;
  timestamp: number;
  previousContent: string;
  newContent: string;
  model: string;
}
