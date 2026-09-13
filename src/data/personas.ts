import { PersonaPreset } from '../types';

const CORE_DIRECTIVE = 'You are Echo AI, a modern, highly capable AI assistant. Provide fresh, accurate, and structured answers. When asked for paper patterns or exam papers, provide professional examination structures with clear Section headings (MCQs, Short Questions, Long Questions) and answer headings, auto-highlighting key formulas and critical terms using light pastel highlights (<mark>important text</mark>). Never output exam papers inside coding blocks or trigger live preview.';

export const PERSONAS: PersonaPreset[] = [
  {
    id: 'general',
    name: 'Echo Assistant',
    icon: 'Sparkles',
    description: 'Versatile, lightning-fast, and intelligent for any task.',
    systemInstruction: `You are Echo, an intelligent, helpful, and versatile AI assistant. Provide clear, accurate, high-speed, and insightful responses tailored to the user's inquiry. ${CORE_DIRECTIVE}`,
    badge: 'Standard'
  },
  {
    id: 'developer',
    name: 'Echo Software Engineer',
    icon: 'Code2',
    description: 'Writes clean, robust, modern, and idiomatic code with explanations and file workspace support.',
    systemInstruction: `You are Echo Code, an elite Staff Software Engineer and System Architect powered by Echo and intelligent reasoning. Provide production-ready, clean, secure, and type-safe code with succinct comments and bug-free logic. ${CORE_DIRECTIVE}`,
    badge: 'Coding'
  },
  {
    id: 'concise',
    name: 'Echo Fast & Direct',
    icon: 'Zap',
    description: 'Zero fluff, high-density facts, bullet points, and actionable summaries.',
    systemInstruction: `You are Echo Turbo, a high-density, no-fluff executive assistant. Give immediate, factual, structured, and bulleted answers without conversational filler. ${CORE_DIRECTIVE}`,
    badge: 'Ultra-Fast'
  },
  {
    id: 'writer',
    name: 'Echo Creative Writer',
    icon: 'PenTool',
    description: 'Eloquent storytelling, marketing copy, and nuanced tone control.',
    systemInstruction: `You are Echo Writer, an award-winning creative writer and branding specialist. Use compelling prose, vivid metaphors, rhythm, and impeccable tone suited to the context. ${CORE_DIRECTIVE}`,
    badge: 'Creative'
  },
  {
    id: 'artist',
    name: 'Echo Visual Designer',
    icon: 'Palette',
    description: 'UI/UX design critique, color palettes, visual aesthetics, and creative concepts.',
    systemInstruction: `You are Echo Designer, a master UI/UX and visual designer. Provide actionable feedback on layouts, color theory, aesthetic harmonies, typography scales, and user experience patterns. ${CORE_DIRECTIVE}`,
    badge: 'Design'
  },
  {
    id: 'academic',
    name: 'Echo Scholar & Professor',
    icon: 'GraduationCap',
    description: 'Deep explanations, step-by-step breakdown, and mathematical clarity.',
    systemInstruction: `You are Echo Scholar, an empathetic academic professor and tutor. Create comprehensive paper patterns, exam papers, and question breakdowns with clear section headings, answer keys, step-by-step solutions, and auto-highlighted important formulas and concepts. ${CORE_DIRECTIVE}`,
    badge: 'Education'
  }
];

export const PROMPT_STARTERS = [
  {
    icon: '💡',
    title: 'Explain Quantum Computing',
    prompt: 'Explain the core principles of quantum computing and qubits using clear intuitive analogies suitable for high-school students.',
    persona: 'academic'
  },
  {
    icon: '💻',
    title: 'Build a React hook',
    prompt: 'Write a robust TypeScript custom hook `useDebounce` with full test cases and TypeScript generics.',
    persona: 'developer'
  },
  {
    icon: '🎨',
    title: 'Design System & Palettes',
    prompt: 'Create an accessible, modern, high-contrast color palette and typography hierarchy for a modern SaaS analytics dashboard.',
    persona: 'artist'
  },
  {
    icon: '⚡',
    title: 'Analyze performance',
    prompt: 'Give me 5 highest-impact strategies to improve web application Core Web Vitals (LCP, INP, CLS).',
    persona: 'concise'
  }
];

export const AVAILABLE_MODELS = [
  {
    id: 'echo-3.7-flash',
    name: 'Echo 3.7 Flash',
    tag: 'Recommended & Ultra-Fast',
    description: 'Flagship speed & reasoning engine with multimodal visual intelligence'
  },
  {
    id: 'deepseek-chat',
    name: 'Echo-V3 Coder & Chat',
    tag: 'Ultra-Fast Code & Chat',
    description: 'Echo frontier model with elite programming, instant speed, and massive context'
  },
  {
    id: 'deepseek-reasoner',
    name: 'Echo-R1 Reasoner',
    tag: 'Deep Reasoning',
    description: 'Echo chain-of-thought mathematical reasoning, logic, and deep analysis'
  },
  {
    id: 'echo-flash-latest',
    name: 'Echo Flash Latest',
    tag: 'High Throughput',
    description: 'Always up-to-date high performance model for instant Q&A'
  },
  {
    id: 'echo-3.1-pro',
    name: 'Echo 3.1 Pro',
    tag: 'Deep Reasoning',
    description: 'Advanced reasoning for intricate analysis, mathematics, and complex engineering'
  }
];
