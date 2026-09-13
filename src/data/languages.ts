export type SupportedLanguage = 'auto' | 'en' | 'ur' | 'hi' | 'es' | 'fr' | 'ar';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  voiceLang: string;
  tagline: string;
  instruction: string;
  samplePrompts: string[];
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'auto',
    name: 'Auto Detect',
    nativeName: 'خودکار / स्वतः / Auto',
    flag: '🌐',
    voiceLang: 'en-US',
    tagline: 'Replies naturally in the same language you write or speak',
    instruction: 'Detect the language used by the user and respond fluently in that exact same language. Use a natural, warm, empathetic, and human-like tone, avoiding stiff or robotic expressions.',
    samplePrompts: [
      'Hello, how are you today?',
      'آپ کیسے ہیں؟',
      'आप कैसे हैं?'
    ]
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو / Roman Urdu',
    flag: '🇵🇰',
    voiceLang: 'ur-PK',
    tagline: 'قدرتی، شائستہ اور انسان جیسی روانی کے ساتھ اردو بولیں اور سنیں',
    instruction: `You must speak and respond in natural, warm, human-like, polite, and fluent Urdu (or Roman Urdu if the user writes in Roman script). 
- Use natural conversational vocabulary (شائستہ اور میٹھی بول چال), everyday idioms, and respectful forms of address (جیسے آپ، جناب، جی ہاں).
- Avoid robotic or stiff Google-translate literal phrasing. Make the conversation feel genuinely human, warm, attentive, and helpful.
- When explaining complex ideas or code, explain concepts with clarity in natural Urdu with clear examples.`,
    samplePrompts: [
      'مجھے مصنوعی ذہانت کے بارے میں آسان الفاظ میں بتائیں',
      'ایک خوبصورت اردو نظم یا غزل سنائیں',
      'آج کا دن اچھا گزارنے کے لیے کچھ مفید مشورے دیں'
    ]
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी / Hinglish',
    flag: '🇮🇳',
    voiceLang: 'hi-IN',
    tagline: 'सहज, स्वाभाविक और आत्मीयता से भरी बातचीत हिंदी में करें',
    instruction: `You must speak and respond in natural, fluent, warm, polite, and human-like Hindi (or Hinglish if the user writes in Latin script).
- Use natural conversational everyday Hindi (सरल, आत्मीय और स्वाभाविक भाषा).
- Avoid stiff, archaic or robotic translations. Speak like a friendly, knowledgeable, and empathetic human companion.
- Address the user respectfully (आप, जी).`,
    samplePrompts: [
      'मुझे एक अच्छी और प्रेरणादायक कहानी सुनाओ',
      'वेब डेवलपमेंट सीखने की शुरुआत कैसे करें?',
      'आज के दिन को बेहतर बनाने के कुछ अच्छे उपाय बताइए'
    ]
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (Human Tone)',
    flag: '🇺🇸',
    voiceLang: 'en-US',
    tagline: 'Natural, lively, conversational, and human-like English',
    instruction: 'Speak in a lively, empathetic, warm, and natural human conversational tone. Avoid generic AI cliches, rigid formalities, and robotic transitions. Sound like an intelligent, thoughtful, and friendly expert human partner.',
    samplePrompts: [
      'How does quantum computing work in simple terms?',
      'Help me outline a modern web application project',
      'Give me thoughtful advice on productivity and focus'
    ]
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    voiceLang: 'ar-SA',
    tagline: 'محادثة طبيعية وفصيحة بأسلوب بشري راقٍ',
    instruction: 'تحدث بلغة عربية فصيحة، سلسة، دافئة وإنسانية خالية من الركاكة والترجمة الحرفية الجافة.',
    samplePrompts: [
      'حدثني عن تاريخ الذكاء الاصطناعي',
      'كيف أنظم وقتي بكفاءة؟'
    ]
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    voiceLang: 'es-ES',
    tagline: 'Conversación natural, fluida y cercana en español',
    instruction: 'Habla en un español natural, empático, fluido y humano, como un asistente cercano y experto.',
    samplePrompts: [
      '¿Cuáles son las mejores prácticas en JavaScript moderno?',
      'Escribe una breve historia creativa'
    ]
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    voiceLang: 'fr-FR',
    tagline: 'Conversation humaine, fluide et élégante en français',
    instruction: 'Parlez dans un français naturel, fluide, chaleureux et humain avec élégance et précision.',
    samplePrompts: [
      'Explique-moi les principes du machine learning',
      'Donne-moi des conseils d’écriture'
    ]
  }
];

export function getLanguageConfig(code?: string): LanguageOption {
  if (!code) return SUPPORTED_LANGUAGES[0];
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return found || SUPPORTED_LANGUAGES[0];
}
