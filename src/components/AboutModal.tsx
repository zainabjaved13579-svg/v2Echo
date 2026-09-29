import React from 'react';
import {
  X,
  Sparkles,
  Zap,
  Code2,
  Folder,
  Image as ImageIcon,
  Mic,
  Globe,
  Layers,
  Cpu,
  ShieldCheck,
  Download,
  Palette,
  GraduationCap,
  Languages,
  Search,
  Wand2,
  Rocket,
  Heart,
  Github,
  Mail,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { SAPPHIRE_LOGO_URL, SAPPHIRE_APP_NAME } from '../data/constants';
import { useAppTheme } from '../context/ThemeContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURES = [
  {
    icon: Zap,
    title: 'Ultra-Fast Engine',
    desc: 'Powered by Sapphire Flash — sub-second responses with zero lag.'
  },
  {
    icon: Sparkles,
    title: 'No Limits',
    desc: 'Unlimited messages, files, images, and chats. 100% free forever.'
  },
  {
    icon: Code2,
    title: 'Autonomous Codex Studio',
    desc: 'Multi-file app builder with live preview and instant code generation.'
  },
  {
    icon: Layers,
    title: 'Multi-Engine Intelligence',
    desc: 'Ensemble reasoning across premium AI models for elite accuracy.'
  },
  {
    icon: Folder,
    title: 'File & Workspace',
    desc: 'Upload, edit, organize, and export files with full workspace control.'
  },
  {
    icon: ImageIcon,
    title: 'AI Image Generation',
    desc: 'Generate stunning high-resolution visuals from text prompts.'
  },
  {
    icon: Mic,
    title: 'Real Voice & Translation',
    desc: 'Natural speech in Urdu, Hindi, English + 6 more languages.'
  },
  {
    icon: Globe,
    title: 'Search Grounding',
    desc: 'Real-time web info with live search integration.'
  },
  {
    icon: Cpu,
    title: 'Lightweight & Fast',
    desc: 'Optimized PWA — minimal memory, blazing performance on any device.'
  },
  {
    icon: GraduationCap,
    title: 'Education AI',
    desc: 'Exam papers, tutoring, homework help, and step-by-step learning.'
  },
  {
    icon: Languages,
    title: 'Multi-Language Support',
    desc: 'Speak & write in Urdu, Hindi, Arabic, Spanish, French, and more.'
  },
  {
    icon: Wand2,
    title: 'AI Code Remake',
    desc: 'Refactor, modernize, and optimize any codebase with one click.'
  },
  {
    icon: Palette,
    title: 'Dark & Light Themes',
    desc: 'Beautiful warm themes designed for day and night comfort.'
  },
  {
    icon: Download,
    title: 'PWA + APK + EXE',
    desc: 'Install on Android, Windows, Mac, iOS, and Linux.'
  },
  {
    icon: ShieldCheck,
    title: 'Privacy First',
    desc: 'No tracking, no ads, no data selling. Your chats stay yours.'
  },
  {
    icon: Rocket,
    title: 'Always Up-to-Date',
    desc: 'Instant auto-updates with new features shipped weekly.'
  }
];

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  if (!isOpen) return null;

  // Theme classes
  const bgMain = isMoon ? 'bg-[#151515]' : 'bg-[#faf7f2]';
  const bgCard = isMoon ? 'bg-[#20201f]' : 'bg-white';
  const bgSubtle = isMoon ? 'bg-[#1a1a1a]' : 'bg-[#f5f1ea]';
  const border = isMoon ? 'border-[#2b2b2a]' : 'border-[#e8e2d8]';
  const textPrimary = isMoon ? 'text-white' : 'text-[#2a2620]';
  const textBright = isMoon ? 'text-[#f5f2eb]' : 'text-[#1a1712]';
  const textSub = isMoon ? 'text-[#a19e97]' : 'text-[#6b6459]';
  const textMuted = isMoon ? 'text-[#86837c]' : 'text-[#9a9186]';
  const hoverBg = isMoon ? 'hover:bg-[#282724]' : 'hover:bg-[#efe9df]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative w-full max-w-3xl ${bgMain} border ${border} rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${border} ${bgCard} flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white p-1 border border-[#e8e2d8] shadow-md flex items-center justify-center">
              <img
                src={SAPPHIRE_LOGO_URL}
                alt="Sapphire AI Logo"
                className="w-full h-full rounded-xl object-contain"
              />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${textBright} tracking-tight`}>
                About {SAPPHIRE_APP_NAME}
              </h2>
              <p className={`text-xs ${textSub}`}>
                The #1 Education AI & Autonomous Codex Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl ${textMuted} hover:${textPrimary} ${hoverBg} transition-colors cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d97757]/15 border border-[#d97757]/30 text-[#d97757] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Version 2.5 PWA · Free Forever</span>
            </div>
            <h3 className={`text-2xl sm:text-3xl font-extrabold ${textBright} tracking-tight`}>
              Meet {SAPPHIRE_APP_NAME}
            </h3>
            <p className={`text-sm ${textSub} max-w-xl mx-auto leading-relaxed`}>
              A next-generation AI assistant engineered for speed, intelligence, and creativity. Built with multi-model
              reasoning, autonomous coding, and natural voice in multiple languages — completely free, no limits.
            </p>
          </div>

          {/* Features Grid */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${textSub} mb-3 flex items-center gap-2`}>
              <Rocket className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Everything You Get</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FEATURES.map((feature, idx) => {
                const IconComp = feature.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                    className={`flex items-start gap-3 p-3 rounded-2xl ${bgCard} border ${border} hover:border-[#d97757]/40 transition-all`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#d97757]/15 flex items-center justify-center shrink-0">
                      <IconComp className="w-4 h-4 text-[#d97757]" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${textBright} mb-0.5`}>{feature.title}</p>
                      <p className={`text-[11px] ${textSub} leading-relaxed`}>{feature.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Mission */}
          <div className={`p-4 rounded-2xl ${bgCard} border ${border} space-y-2`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${textSub} flex items-center gap-2`}>
              <Heart className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Our Mission</span>
            </h4>
            <p className={`text-xs ${textPrimary} leading-relaxed`}>
              Sapphire was built to make elite AI accessible to everyone — students, developers, creators, and
              professionals. No subscriptions, no hidden limits, no compromises. Just fast, powerful, and beautiful AI
              that respects your privacy.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            <a
              href="https://ai-sapphire.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl ${bgCard} border ${border} ${textPrimary} ${hoverBg} text-xs font-semibold transition-colors cursor-pointer flex-1 justify-center`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Visit Website</span>
            </a>
            <a
              href="mailto:shaheerh328@gmail.com"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl ${bgCard} border ${border} ${textPrimary} ${hoverBg} text-xs font-semibold transition-colors cursor-pointer flex-1 justify-center`}
            >
              <Mail className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Contact Developer</span>
            </a>
          </div>

          {/* Footer */}
          <div className={`pt-4 border-t ${border} text-center space-y-1`}>
            <p className={`text-[11px] ${textMuted}`}>
              © {new Date().getFullYear()} Sapphire AI Studio · All rights reserved
            </p>
            <p className={`text-[10px] ${textMuted} flex items-center justify-center gap-1`}>
              Made with <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" /> for the world
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AboutModal;