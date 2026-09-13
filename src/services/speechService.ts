import { SupportedLanguage, getLanguageConfig } from '../data/languages';

// Helper: Clean markdown text for human-like speech output
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ' [Code omitted for audio] ')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Remove headings markdown (#, ##, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold and italic (*text*, **text**, _text_, __text__)
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove blockquotes (> quote)
      .replace(/^>\s+/gm, '')
      // Remove bullet markers (*, -, +)
      .replace(/^[\*\-\+]\s+/gm, '')
      // Remove numbered list markers (1. 2.)
      .replace(/^\d+\.\s+/gm, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove excessive whitespaces and empty lines
      .replace(/\n\s*\n/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

// Helper: Auto-detect language script (Urdu script, Roman Urdu, Hindi, English)
export function detectScriptLanguage(text: string): 'ur' | 'hi' | 'ar' | 'en' {
  if (!text) return 'en';

  if (/[\u0600-\u06FF]/.test(text)) {
    // Arabic / Urdu Nastaliq script
    return 'ur';
  }
  if (/[\u0900-\u097F]/.test(text)) {
    // Devanagari script for Hindi
    return 'hi';
  }

  // Detect Roman Urdu common vocabulary & markers
  const lower = text.toLowerCase();
  const romanUrduPatterns = /\b(aap|tum|kya|kaise|kaisa|kaisi|hai|hain|ho|hoon|hun|mein|main|mujhe|apko|aapko|karo|kardo|theek|acha|achha|bohot|bahut|shukriya|bhai|salam|nahi|kyun|kahan|kab|hoga|hogi|zaroor|aur|lekin|mera|meri|mere|batao|bataiye|samajh|khuda|hafiz|shabash|shukran|alhamdulillah)\b/i;
  if (romanUrduPatterns.test(lower)) {
    return 'ur';
  }

  return 'en';
}

// Real-time translation helper between English & Urdu
export async function translateText(
  text: string,
  targetLang: string = 'auto'
): Promise<{
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}> {
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    });
    if (!res.ok) throw new Error('Translation failed');
    return await res.json();
  } catch (err) {
    console.error('Translation service warning:', err);
    return {
      originalText: text,
      translatedText: text,
      sourceLang: 'auto',
      targetLang
    };
  }
}

export type SpeechStateListener = (state: {
  isSpeaking: boolean;
  isPaused: boolean;
  currentMessageId: string | null;
}) => void;

class SpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentMessageId: string | null = null;
  private isPaused: boolean = false;
  private listeners: Set<SpeechStateListener> = new Set();
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    return this.voices;
  }

  public subscribe(listener: SpeechStateListener): () => void {
    this.listeners.add(listener);
    listener({
      isSpeaking: this.isSpeaking(),
      isPaused: this.isPaused,
      currentMessageId: this.currentMessageId
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = {
      isSpeaking: this.isSpeaking(),
      isPaused: this.isPaused,
      currentMessageId: this.currentMessageId
    };
    this.listeners.forEach((listener) => listener(state));
  }

  public isSpeaking(): boolean {
    if (this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended) {
      return true;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking && !window.speechSynthesis.paused;
    }
    return false;
  }

  public getSpeakingMessageId(): string | null {
    return this.currentMessageId;
  }

  // Find best matching natural voice for the target language
  public findBestVoice(langCode: string, preferredVoiceName?: string): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) this.loadVoices();
    const voices = this.voices;
    if (!voices || voices.length === 0) return null;

    if (preferredVoiceName) {
      const match = voices.find((v) => v.name === preferredVoiceName);
      if (match) return match;
    }

    // Language prefix mapping
    let targetLang = langCode.toLowerCase();
    if (targetLang === 'ur') targetLang = 'ur-pk';
    if (targetLang === 'hi') targetLang = 'hi-in';
    if (targetLang === 'en') targetLang = 'en-us';

    const shortLang = targetLang.split('-')[0];

    // Priority 1: High quality human/neural/natural voices (polite and realistic)
    const preferredKeywords = [
      'natural',
      'online',
      'neural',
      'jenny',
      'guy',
      'aria',
      'ryan',
      'sonia',
      'samantha',
      'siri',
      'ava',
      'allison',
      'serena',
      'google',
      'asif',
      'gul',
      'swara'
    ];

    // Filter out robotic or synthesizer legacy voices
    const isRobotic = (name: string) => /espeak|compact|klatt|synthetic/i.test(name);

    // Score voices for human-like naturalness
    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      let score = 0;
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();

      if (isRobotic(name)) return -100;

      // Exact language match
      if (lang === targetLang) score += 50;
      else if (lang.startsWith(shortLang)) score += 30;
      else if (shortLang === 'ur' && (lang.startsWith('hi') || name.includes('urdu') || name.includes('hindi'))) score += 25;

      // Penalize English voices attempting to read Urdu
      if (shortLang === 'ur' && lang.startsWith('en')) {
        return -50;
      }

      // Natural/Neural human keywords
      preferredKeywords.forEach((kw) => {
        if (name.includes(kw)) score += 25;
      });

      if (v.default) score += 5;
      return score;
    };

    const sortedVoices = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
    if (sortedVoices.length > 0 && scoreVoice(sortedVoices[0]) > 0) {
      return sortedVoices[0];
    }

    if (shortLang === 'ur') {
      return null;
    }

    // Default fallback
    return voices.find((v) => v.default) || voices[0] || null;
  }

  // Play real human studio audio stream from /api/tts
  private async playNativeAudio(
    clean: string,
    lang: string,
    options: {
      messageId?: string;
      speed?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<boolean> {
    try {
      this.currentMessageId = options.messageId || 'adhoc';
      this.isPaused = false;

      let audioSrc = '';
      if (clean.length < 400) {
        audioSrc = `/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(clean)}`;
      } else {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean, lang })
        });
        if (!response.ok) throw new Error('Failed to fetch audio stream');
        const blob = await response.blob();
        audioSrc = URL.createObjectURL(blob);
      }

      const audio = new Audio(audioSrc);
      if (options.speed) {
        audio.playbackRate = options.speed;
      }
      this.currentAudio = audio;

      audio.onplay = () => {
        this.isPaused = false;
        this.notify();
        options.onStart?.();
      };

      audio.onended = () => {
        if (audioSrc.startsWith('blob:')) {
          URL.revokeObjectURL(audioSrc);
        }
        this.currentAudio = null;
        this.currentMessageId = null;
        this.isPaused = false;
        this.notify();
        options.onEnd?.();
      };

      audio.onerror = (err) => {
        console.warn('Native audio playback notice, attempting browser synthesis fallback:', err);
        if (audioSrc.startsWith('blob:')) {
          URL.revokeObjectURL(audioSrc);
        }
        this.currentAudio = null;
        this.isPaused = false;
        this.notify();
        this.speakWithSynthesis(clean, lang, options);
      };

      await audio.play();
      this.notify();
      return true;
    } catch (e) {
      console.warn('Error initiating audio stream, attempting browser synthesis fallback:', e);
      this.currentAudio = null;
      this.speakWithSynthesis(clean, lang, options);
      return false;
    }
  }

  // Browser SpeechSynthesis fallback
  private speakWithSynthesis(
    clean: string,
    langCode: string,
    options: {
      messageId?: string;
      speed?: number;
      pitch?: number;
      voiceName?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const isUrdu = langCode === 'ur';
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = options.speed ?? (isUrdu ? 1.0 : 1.08);
    utterance.pitch = options.pitch ?? 1.0;

    const matchedVoice = this.findBestVoice(langCode, options.voiceName);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      const config = getLanguageConfig(langCode);
      utterance.lang = config.voiceLang;
    }

    this.currentUtterance = utterance;
    this.currentMessageId = options.messageId || 'adhoc';
    this.isPaused = false;

    utterance.onstart = () => {
      this.isPaused = false;
      this.notify();
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.currentMessageId = null;
      this.isPaused = false;
      this.notify();
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.error('Speech synthesis error:', e);
      }
      this.currentUtterance = null;
      this.currentMessageId = null;
      this.isPaused = false;
      this.notify();
      options.onError?.(e);
    };

    try {
      window.speechSynthesis.speak(utterance);
      this.notify();
    } catch (err) {
      console.error('Failed to trigger speech:', err);
    }
  }

  // Speak a text message aloud with zero delay and natural human voices
  public speak(
    text: string,
    options: {
      messageId?: string;
      language?: SupportedLanguage | string;
      speed?: number;
      pitch?: number;
      voiceName?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    // If currently speaking this same message, cancel/toggle
    if (this.currentMessageId === options.messageId && this.isSpeaking()) {
      this.stop();
      return;
    }

    // Cancel any ongoing speech instantly
    this.stop();

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    // Auto-detect language if not explicitly forced
    let langCode = options.language || 'auto';
    if (langCode === 'auto') {
      langCode = detectScriptLanguage(clean);
    }

    const isUrdu = langCode === 'ur' || /[\u0600-\u06FF]/.test(clean);
    const targetLang = isUrdu ? 'ur' : langCode === 'hi' ? 'hi' : 'en';

    // Use high-fidelity real studio voice stream for genuine human tone
    this.playNativeAudio(clean, targetLang, options);
  }

  public stop(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.currentMessageId = null;
    this.isPaused = false;
    this.notify();
  }

  public pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.isPaused = true;
      this.notify();
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.isSpeaking()) {
      window.speechSynthesis.pause();
      this.isPaused = true;
      this.notify();
    }
  }

  public resume(): void {
    if (this.currentAudio && this.isPaused) {
      this.currentAudio.play().catch(console.error);
      this.isPaused = false;
      this.notify();
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
      this.notify();
    }
  }
}

export const speechService = new SpeechService();

// Speech-to-text recognition helper
export function createSpeechRecognition(
  langCode: string,
  onResult: (transcript: string) => void,
  onEnd: () => void,
  onError: (err: any) => void
) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;

  // Language mapping
  let recognitionLang = 'en-US';
  if (langCode === 'ur') recognitionLang = 'ur-PK';
  else if (langCode === 'hi') recognitionLang = 'hi-IN';
  else if (langCode === 'ar') recognitionLang = 'ar-SA';
  else if (langCode === 'es') recognitionLang = 'es-ES';
  else if (langCode === 'fr') recognitionLang = 'fr-FR';

  recognition.lang = recognitionLang;

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript) {
      onResult(finalTranscript);
    }
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    onError(event);
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}
