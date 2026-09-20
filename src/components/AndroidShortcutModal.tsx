import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Zap,
  Sliders,
  CheckCircle2,
  Volume2,
  Layers,
  ArrowRight,
  ExternalLink,
  Shield,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SAPPHIRE_LOGO_URL, ANDROID_APK_URL, ANDROID_APK_DIRECT_DOWNLOAD } from '../data/constants';

interface AndroidShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidShortcutModal: React.FC<AndroidShortcutModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copiedSetting, setCopiedSetting] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSetting(true);
    setTimeout(() => setCopiedSetting(false), 2000);
  };

  return (
    <AnimatePresence>
      <div
        id="android-shortcut-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden text-white my-auto p-5 sm:p-7 space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Android Exclusive
                  </span>
                  <span className="text-xs text-slate-400">Quick Hardware &amp; Nav Bar Triggers</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  Sapphire Quick Launch Shortcut
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Configure Android system-level shortcuts to open <strong>Sapphire AI</strong> instantly from any app, lockscreen, or navigation button without touching the app drawer.
          </p>

          {/* Shortcut Cards */}
          <div className="space-y-3">
            {/* Method 1: Far-Left Navigation Bar Button */}
            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2 hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    1. Far-Left Nav Bar Button (Floating Overlay)
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-700/40">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-300">
                In Android Settings &gt; Accessibility, enable the <strong>Sapphire Shortcut</strong> button. It pins an accessibility icon to the bottom navigation bar (next to Back/Home) for 1-tap AI access.
              </p>
            </div>

            {/* Method 2: Physical Volume Key Double Click */}
            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2 hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600/30 flex items-center justify-center text-emerald-400">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    2. Volume Key / Power Double-Press
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  Hardware
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Map <strong>Double-Click Volume Down</strong> or the side button to launch Sapphire. This allows long-press Home to stay reserved for Google Assistant while Sapphire has its own dedicated physical button!
              </p>
            </div>
          </div>

          {/* Step by Step Guide */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              How to enable in your Android phone
            </h4>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4">
              <li>Install the updated <strong>Sapphire APK</strong> (v2.0.1) on your phone.</li>
              <li>Open phone <strong>Settings</strong> &gt; <strong>Accessibility</strong> &gt; <strong>Installed Apps</strong>.</li>
              <li>Turn on <strong>Sapphire AI Shortcut</strong>.</li>
              <li>Select <em>"Accessibility button on navigation bar"</em>.</li>
            </ol>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <a
              href={ANDROID_APK_DIRECT_DOWNLOAD}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 active:scale-97 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Download Sapphire APK (Direct)</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
