import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  Download,
  Mail,
  Zap,
  QrCode,
  ShieldCheck,
  Check,
  Copy,
  Sparkles,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SAPPHIRE_LOGO_URL,
  SAPPHIRE_APP_NAME
} from '../data/constants';
import { promptPwaInstall, isPwaInstalled } from '../services/pwaInstallService';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  // Detect if user is on mobile or desktop
  const isMobileClient = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
  const [activeTab, setActiveTab] = useState<'pc' | 'mobile'>(isMobileClient ? 'mobile' : 'pc');
  const [pwaStatusMessage, setPwaStatusMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showQrOnMobile, setShowQrOnMobile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(isMobileClient ? 'mobile' : 'pc');
    }
  }, [isOpen, isMobileClient]);

  if (!isOpen) return null;

  const SUPPORT_EMAIL = 'support@sapphireai.com';

  const handleInstallPwa = async (platformName?: 'PC' | 'Mobile') => {
    if (isPwaInstalled()) {
      setPwaStatusMessage(`Sapphire is already installed and running on your device!`);
      setTimeout(() => setPwaStatusMessage(null), 4000);
      return;
    }
    const result = await promptPwaInstall();
    if (result.outcome === 'accepted') {
      setPwaStatusMessage(`Sapphire PWA successfully installed on your ${platformName || 'device'}!`);
      setTimeout(() => setPwaStatusMessage(null), 4000);
    } else if (result.outcome === 'already-installed') {
      setPwaStatusMessage(`Sapphire is already installed on this device.`);
      setTimeout(() => setPwaStatusMessage(null), 4000);
    } else {
      if (platformName === 'Mobile' || isMobileClient) {
        setPwaStatusMessage(`On Mobile: Tap browser menu (⋮) -> "Install app" or "Add to Home screen" (iOS: Share -> Add to Home Screen).`);
      } else {
        setPwaStatusMessage(`On PC: Click the Install icon (⊕) in the browser address bar or menu (⋮) -> "Install Sapphire".`);
      }
      setTimeout(() => setPwaStatusMessage(null), 5000);
    }
  };

  const handleSelectTab = (tab: 'pc' | 'mobile') => {
    setActiveTab(tab);
    // Directly trigger native PWA install prompt when tab is chosen
    handleInstallPwa(tab === 'pc' ? 'PC' : 'Mobile');
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <AnimatePresence>
      <div
        id="download-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="download-modal-container"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-[#1e1d1b] border border-[#33312e] rounded-3xl p-5 sm:p-7 shadow-2xl text-[#ede8e1] space-y-5 my-auto max-h-[92vh] overflow-y-auto select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            id="close-download-modal"
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#86837c] hover:text-[#ede8e1] rounded-full bg-[#282724] hover:bg-[#32302c] border border-[#383633] transition-all cursor-pointer active:scale-90"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Banner with New Logo */}
          <div className="text-center space-y-2 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d97757]/15 border border-[#d97757]/30 text-[#d97757] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#d97757]" />
              <span>Official Sapphire PWA Application</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <img
                src={SAPPHIRE_LOGO_URL}
                alt={SAPPHIRE_APP_NAME}
                className="w-12 h-12 rounded-2xl object-contain bg-white border border-slate-200 p-1 ring-1 ring-[#d97757]/30 shadow-md"
              />
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5f2eb] flex items-center gap-2">
                  <span>Get Sapphire</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    v2.5 PWA
                  </span>
                </h2>
                <p className="text-xs text-[#86837c]">Always up-to-date · Instant install · Zero file clutter</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#a19e97] max-w-md mx-auto leading-relaxed">
              Install the official Sapphire Progressive Web App directly to your device for fast, full-screen native performance.
            </p>
          </div>

          {/* Status Message Toast */}
          {pwaStatusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-[#282724] border border-[#d97757] text-xs text-[#ede8e1] text-center font-medium shadow-md leading-relaxed"
            >
              {pwaStatusMessage}
            </motion.div>
          )}

          {/* Two Exclusive Tabs: PC and Mobile */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#141413] border border-[#2a2926] rounded-2xl">
            <button
              type="button"
              id="download-tab-pc"
              onClick={() => handleSelectTab('pc')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all cursor-pointer text-xs sm:text-sm font-bold ${
                activeTab === 'pc'
                  ? 'bg-[#d97757] text-white shadow-lg shadow-[#d97757]/20 scale-[1.01]'
                  : 'text-[#86837c] hover:text-[#ede8e1] hover:bg-[#201f1d]'
              }`}
            >
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
              <span>PC</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-1 ${
                activeTab === 'pc' ? 'bg-white/20 text-white' : 'bg-[#2a2926] text-[#86837c]'
              }`}>
                Windows / Mac
              </span>
            </button>

            <button
              type="button"
              id="download-tab-mobile"
              onClick={() => handleSelectTab('mobile')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all cursor-pointer text-xs sm:text-sm font-bold ${
                activeTab === 'mobile'
                  ? 'bg-[#d97757] text-white shadow-lg shadow-[#d97757]/20 scale-[1.01]'
                  : 'text-[#86837c] hover:text-[#ede8e1] hover:bg-[#201f1d]'
              }`}
            >
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              <span>Mobile</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-1 ${
                activeTab === 'mobile' ? 'bg-white/20 text-white' : 'bg-[#2a2926] text-[#86837c]'
              }`}>
                Android / iOS
              </span>
            </button>
          </div>

          {/* Active Panel */}
          <div className="space-y-4">
            {/* PC TAB */}
            {activeTab === 'pc' && (
              <motion.div
                key="pc-panel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-5 sm:p-6 rounded-2xl bg-[#141413] border border-[#2e2d2a] space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-[#f5f2eb]">Sapphire for PC</h3>
                      <p className="text-xs text-[#86837c]">Windows 10/11 · macOS · Linux · Chromebook</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 shrink-0">
                    PWA Desktop
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#a19e97] leading-relaxed">
                  Full standalone desktop window with multi-file codex studio, instant live previews, keyboard shortcuts, and zero lag.
                </p>

                {/* Primary Action Button: Triggers Native PWA Install */}
                <div className="pt-1">
                  <button
                    type="button"
                    id="install-pc-pwa-btn"
                    onClick={() => handleInstallPwa('PC')}
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[#d97757] hover:bg-[#c86b4c] active:bg-[#b55c3f] text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-[#d97757]/20 active:scale-95 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>Install App</span>
                  </button>
                </div>

                {/* Desktop Instructions */}
                <div className="p-3.5 rounded-2xl bg-[#1e1d1b] border border-[#2e2d2a] space-y-2 text-xs">
                  <p className="font-semibold text-blue-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> How to install on your PC:
                  </p>
                  <ul className="space-y-1.5 text-[#a19e97] list-disc list-inside leading-relaxed pl-1">
                    <li>
                      <strong>Chrome, Edge &amp; Brave:</strong> Click <strong>Install App</strong> above or click the <strong>Install</strong> icon (⊕) in your browser address bar.
                    </li>
                    <li>
                      <strong>macOS Safari:</strong> Click <strong>File</strong> in the top menu bar &rarr; select <strong>Add to Dock</strong>.
                    </li>
                    <li>
                      <strong>Instant Launch:</strong> Opens in its own borderless native window right from your Desktop or Taskbar.
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* MOBILE TAB */}
            {activeTab === 'mobile' && (
              <motion.div
                key="mobile-panel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-5 sm:p-6 rounded-2xl bg-[#141413] border border-[#2e2d2a] space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-[#f5f2eb]">Sapphire for Mobile</h3>
                      <p className="text-xs text-[#86837c]">Android (Phones &amp; Tablets) · iPhone · iPad</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                    PWA Mobile
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#a19e97] leading-relaxed">
                  Full-screen native experience with zero storage overhead, touch gestures, instant chat, and voice reasoning.
                </p>

                {/* Primary Action Button: Triggers Native PWA Install */}
                <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    id="install-mobile-pwa-btn"
                    onClick={() => handleInstallPwa('Mobile')}
                    className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[#d97757] hover:bg-[#c86b4c] active:bg-[#b55c3f] text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-[#d97757]/20 active:scale-95 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>Install App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQrOnMobile(!showQrOnMobile)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#201f1d] hover:bg-[#2a2926] text-[#ede8e1] border border-[#383633] font-semibold text-xs transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <QrCode className="w-4 h-4 text-purple-400" />
                    <span>{showQrOnMobile ? 'Hide QR Code' : 'Scan QR Code'}</span>
                  </button>
                </div>

                {/* Mobile QR Code Dropdown for users viewing on PC */}
                {showQrOnMobile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-2xl bg-[#1e1d1b] border border-[#33312e] text-center space-y-3"
                  >
                    <p className="text-xs text-[#a19e97]">
                      Scan with your phone camera to open and install Sapphire instantly on mobile:
                    </p>
                    <div className="inline-block p-3 rounded-2xl bg-white shadow-xl border border-gray-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&color=141413&bgcolor=ffffff`}
                        alt="Scan to Install"
                        className="w-36 h-36 object-contain rounded-lg"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Mobile Platform Instructions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#1e1d1b] border border-[#2e2d2a] space-y-1.5">
                    <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> Android (Chrome)
                    </p>
                    <p className="text-[#a19e97] leading-relaxed">
                      Tap <strong>Install App</strong> above, or tap <strong>⋮ (Menu)</strong> in Chrome and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#1e1d1b] border border-[#2e2d2a] space-y-1.5">
                    <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" /> iPhone / iPad (Safari)
                    </p>
                    <p className="text-[#a19e97] leading-relaxed">
                      Tap the <strong>Share</strong> icon (square with arrow) at the bottom, scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Clean Verified Guarantee Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#141413] border border-[#2e2d2a] text-xs text-[#ede8e1]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Official Release · Progressive Web App (PWA) · Direct Browser Installation</span>
            </div>
          </div>

          {/* Support / Direct Developer Contact Footer */}
          <div className="pt-2 border-t border-[#2a2926] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-[#86837c]">
            <div className="flex items-center gap-1.5">
              <span>Developer support:</span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1 text-[#d97757] hover:underline font-mono font-medium cursor-pointer"
                title="Click to copy email"
              >
                <span>{SUPPORT_EMAIL}</span>
                {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=Sapphire%20AI%20App%20Inquiry&body=Hello%20Developer%2C%0A%0AI%20am%20using%20Sapphire%20AI%20and...`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#201f1d] hover:bg-[#2a2926] text-[#ede8e1] transition-colors cursor-pointer border border-[#383633] font-medium"
            >
              <Mail className="w-3 h-3 text-[#d97757]" />
              <span>Contact Developer</span>
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DownloadModal;
