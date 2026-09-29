import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  Download,
  ExternalLink,
  Mail,
  CheckCircle,
  Zap,
  QrCode,
  Globe,
  ShieldCheck,
  Check,
  Copy,
  Sparkles,
  HardDrive,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SAPPHIRE_LOGO_URL,
  SAPPHIRE_APP_NAME,
  ANDROID_APK_URL,
  ANDROID_APK_DIRECT_DOWNLOAD,
  WINDOWS_EXE_URL
} from '../data/constants';
import { promptPwaInstall, downloadOfflinePwaPackage, isPwaInstalled } from '../services/pwaInstallService';
import { useAppTheme } from '../context/ThemeContext';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  const [activeTab, setActiveTab] = useState<'pc' | 'mobile' | 'qr'>('pc');
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null);
  const [pwaStatusMessage, setPwaStatusMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [windowsAutoPrompted, setWindowsAutoPrompted] = useState(false);

  useEffect(() => {
    if (!isOpen || windowsAutoPrompted) return;
    if (typeof navigator === 'undefined') return;

    const isWindows = /Windows|Win32|Win64|WOW64/i.test(navigator.userAgent || '');
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

    if (isMobile) {
      setActiveTab('mobile');
    } else if (isWindows) {
      setActiveTab('pc');
    }
    setWindowsAutoPrompted(true);
  }, [isOpen, windowsAutoPrompted]);

  if (!isOpen) return null;

  const APK_DOWNLOAD_URL = ANDROID_APK_URL;
  const APK_DIRECT_URL = ANDROID_APK_DIRECT_DOWNLOAD;
  const EXE_DOWNLOAD_URL = WINDOWS_EXE_URL;
  const SUPPORT_EMAIL = 'shaheerh328@gmail.com';

  const handleTriggerDownload = (platform: 'android' | 'windows', url: string) => {
    setDownloadingPlatform(platform);
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => setDownloadingPlatform(null), 1500);
    }, 500);
  };

  const handleInstallPwa = async () => {
    if (isPwaInstalled()) {
      setPwaStatusMessage('Sapphire is already installed on your device!');
      setTimeout(() => setPwaStatusMessage(null), 3500);
      return;
    }
    const result = await promptPwaInstall();
    if (result.outcome === 'accepted') {
      setPwaStatusMessage('Sapphire installed successfully!');
      setTimeout(() => setPwaStatusMessage(null), 3500);
    } else if (result.outcome === 'already-installed') {
      setPwaStatusMessage('Sapphire is already running in installed mode.');
      setTimeout(() => setPwaStatusMessage(null), 3500);
    } else {
      setPwaStatusMessage('Tap your browser menu and select "Install Sapphire" / "Add to Home screen".');
      setTimeout(() => setPwaStatusMessage(null), 4000);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {}
  };

  // Theme-aware classes
  const bgMain = isMoon ? 'bg-[#1a1a1a]' : 'bg-[#faf7f2]';
  const bgCard = isMoon ? 'bg-[#20201f]' : 'bg-white';
  const bgSubtle = isMoon ? 'bg-[#151515]' : 'bg-[#f5f1ea]';
  const border = isMoon ? 'border-[#2b2b2a]' : 'border-[#e8e2d8]';
  const textPrimary = isMoon ? 'text-white' : 'text-[#2a2620]';
  const textBright = isMoon ? 'text-[#f5f2eb]' : 'text-[#1a1712]';
  const textSub = isMoon ? 'text-[#a19e97]' : 'text-[#6b6459]';
  const textMuted = isMoon ? 'text-[#86837c]' : 'text-[#9a9186]';
  const hoverBg = isMoon ? 'hover:bg-[#282724]' : 'hover:bg-[#efe9df]';

  return (
    <AnimatePresence>
      <div
        id="download-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="download-modal-container"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-2xl ${bgMain} border ${border} rounded-3xl p-5 sm:p-7 shadow-2xl ${textPrimary} space-y-5 my-auto max-h-[92vh] overflow-y-auto select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            id="close-download-modal"
            type="button"
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 ${textMuted} ${textPrimary} rounded-full ${bgCard} ${hoverBg} border ${border} transition-all cursor-pointer active:scale-90`}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Banner */}
          <div className="text-center space-y-2 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d97757]/15 border border-[#d97757]/30 text-[#d97757] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Official Sapphire PWA Application</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <img
                src={SAPPHIRE_LOGO_URL}
                alt={SAPPHIRE_APP_NAME}
                className={`w-12 h-12 rounded-2xl object-cover ${bgCard} border ${border} ring-1 ring-[#d97757]/30 shadow-md`}
              />
              <div className="text-left">
                <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${textBright} flex items-center gap-2`}>
                  <span>Get Sapphire</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-semibold">
                    v2.5 PWA
                  </span>
                </h2>
                <p className={`text-xs ${textSub}`}>Always up-to-date · Instant install · Zero file clutter</p>
              </div>
            </div>

            <p className={`text-xs sm:text-sm ${textSub} max-w-lg mx-auto leading-relaxed`}>
              Install the official Sapphire Progressive Web App directly to your device for fast, full-screen native performance.
            </p>
          </div>

          {/* Status Message Toast */}
          {pwaStatusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2.5 rounded-xl ${bgCard} border border-[#d97757] text-xs ${textPrimary} text-center`}
            >
              {pwaStatusMessage}
            </motion.div>
          )}

          {/* Animated Tab Bar: PC | Mobile | QR */}
          <div className={`flex items-center justify-center gap-1.5 p-1 ${bgSubtle} border ${border} rounded-2xl overflow-x-auto text-xs font-medium`}>
            <button
              type="button"
              onClick={() => setActiveTab('pc')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex-1 ${
                activeTab === 'pc'
                  ? 'bg-[#d97757] text-white shadow-md font-bold'
                  : `${textSub} hover:${textPrimary} ${hoverBg}`
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>PC</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                activeTab === 'pc' ? 'bg-white/20' : `${bgCard}`
              }`}>
                Windows / Mac
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mobile')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex-1 ${
                activeTab === 'mobile'
                  ? 'bg-[#d97757] text-white shadow-md font-bold'
                  : `${textSub} hover:${textPrimary} ${hoverBg}`
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                activeTab === 'mobile' ? 'bg-white/20' : `${bgCard}`
              }`}>
                Android / iOS
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex-1 ${
                activeTab === 'qr'
                  ? 'bg-[#d97757] text-white shadow-md font-bold'
                  : `${textSub} hover:${textPrimary} ${hoverBg}`
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR</span>
            </button>
          </div>

          {/* TAB: PC */}
          {activeTab === 'pc' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl ${bgCard} border ${border} space-y-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-[#d97757]/15 border border-[#d97757]/30 flex items-center justify-center text-[#d97757] shrink-0`}>
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-base ${textBright}`}>Sapphire for PC</h3>
                    <p className={`text-xs ${textSub}`}>Windows 10/11 · macOS · Linux · Chromebook</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center gap-1 shrink-0">
                  <Zap className="w-3 h-3" /> PWA Desktop
                </span>
              </div>

              <p className={`text-xs ${textSub} leading-relaxed`}>
                Full standalone desktop window with multi-file codex studio, instant live previews, keyboard shortcuts, and zero lag.
              </p>

              <button
                type="button"
                onClick={handleInstallPwa}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[#d97757] hover:bg-[#c86b4c] text-white font-bold text-sm transition-all shadow-lg active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install App</span>
              </button>

              {/* Installation Steps */}
              <div className={`p-3.5 rounded-2xl ${bgSubtle} border ${border} space-y-2`}>
                <p className={`text-[11px] font-bold ${textBright} flex items-center gap-1.5 uppercase tracking-wider`}>
                  <Zap className="w-3.5 h-3.5 text-[#d97757]" />
                  <span>How to install on your PC:</span>
                </p>
                <ul className={`text-[11px] ${textSub} space-y-1.5 pl-1`}>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#d97757] mt-1.5 shrink-0" />
                    <span>
                      <strong className={textPrimary}>Chrome, Edge & Brave:</strong> Click <strong>Install App</strong> above or click the <strong>Install icon (⊕)</strong> in your browser address bar.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#d97757] mt-1.5 shrink-0" />
                    <span>
                      <strong className={textPrimary}>macOS Safari:</strong> Click <strong>File</strong> in the top menu bar → select <strong>Add to Dock</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#d97757] mt-1.5 shrink-0" />
                    <span>
                      <strong className={textPrimary}>Instant Launch:</strong> Opens in its own borderless native window right from your Desktop or Taskbar.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Alternative Downloads */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTriggerDownload('windows', EXE_DOWNLOAD_URL)}
                  disabled={downloadingPlatform === 'windows'}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl ${bgSubtle} ${hoverBg} ${textPrimary} border ${border} text-xs font-medium transition-colors cursor-pointer disabled:opacity-60`}
                >
                  {downloadingPlatform === 'windows' ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-3.5 h-3.5 text-[#d97757]" />
                      <span>Windows EXE</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => downloadOfflinePwaPackage()}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl ${bgSubtle} ${hoverBg} ${textPrimary} border ${border} text-xs font-medium transition-colors cursor-pointer`}
                >
                  <HardDrive className="w-3.5 h-3.5 text-[#d97757]" />
                  <span>Offline Package</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB: Mobile */}
          {activeTab === 'mobile' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl ${bgCard} border ${border} space-y-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-base ${textBright}`}>Sapphire for Mobile</h3>
                    <p className={`text-xs ${textSub}`}>Android · iOS · iPadOS</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <Zap className="w-3 h-3" /> PWA Mobile
                </span>
              </div>

              <p className={`text-xs ${textSub} leading-relaxed`}>
                Install Sapphire on your phone for fast, full-screen, app-like experience with offline support.
              </p>

              <button
                type="button"
                onClick={handleInstallPwa}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[#d97757] hover:bg-[#c86b4c] text-white font-bold text-sm transition-all shadow-lg active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install on Mobile</span>
              </button>

              {/* Installation Steps */}
              <div className={`p-3.5 rounded-2xl ${bgSubtle} border ${border} space-y-2`}>
                <p className={`text-[11px] font-bold ${textBright} flex items-center gap-1.5 uppercase tracking-wider`}>
                  <Zap className="w-3.5 h-3.5 text-[#d97757]" />
                  <span>How to install on your Phone:</span>
                </p>
                <ul className={`text-[11px] ${textSub} space-y-1.5 pl-1`}>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#d97757] mt-1.5 shrink-0" />
                    <span>
                      <strong className={textPrimary}>Android Chrome:</strong> Tap <strong>Install App</strong> above or tap <strong>⋮ menu</strong> → <strong>Install app</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#d97757] mt-1.5 shrink-0" />
                    <span>
                      <strong className={textPrimary}>iPhone / iPad Safari:</strong> Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#d97757] mt-1.5 shrink-0" />
                    <span>
                      <strong className={textPrimary}>Instant Launch:</strong> Opens in its own full-screen native window right from your Home Screen.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Direct APK Download */}
              <button
                type="button"
                onClick={() => handleTriggerDownload('android', APK_DIRECT_URL)}
                disabled={downloadingPlatform === 'android'}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-75`}
              >
                {downloadingPlatform === 'android' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Starting APK Download...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Android APK</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* TAB: QR Code */}
          {activeTab === 'qr' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-2xl ${bgCard} border ${border} text-center space-y-4`}
            >
              <div className="space-y-1">
                <h3 className={`text-lg font-bold ${textBright} flex items-center justify-center gap-2`}>
                  <QrCode className="w-5 h-5 text-[#d97757]" />
                  <span>Scan with Mobile Camera</span>
                </h3>
                <p className={`text-xs ${textSub}`}>
                  Open camera on your phone to install Sapphire directly.
                </p>
              </div>

              <div className={`inline-block p-4 rounded-2xl bg-white shadow-xl border-4 ${border}`}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&color=${isMoon ? 'ffffff' : '2a2620'}&bgcolor=${isMoon ? '1a1a1a' : 'ffffff'}`}
                  alt="Scan to Install"
                  className="w-44 h-44 object-contain rounded-lg"
                />
              </div>

              <div className={`flex items-center justify-center gap-3 text-xs ${textSub}`}>
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Instant Launch
                </span>
                <span>•</span>
                <span>Zero Storage Needed</span>
              </div>
            </motion.div>
          )}

          {/* Verified Guarantee Banner */}
          <div className={`flex items-center justify-between p-3 rounded-xl ${bgCard} border ${border} text-xs ${textPrimary}`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>100% Free · Clean &amp; VirusTotal Verified · No subscription needed.</span>
            </div>
          </div>

          {/* Support Footer */}
          <div className={`pt-2 border-t ${border} flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs ${textSub}`}>
            <div className="flex items-center gap-1.5">
              <span>Developer support:</span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1 text-[#d97757] hover:underline font-mono font-medium cursor-pointer"
                title="Click to copy email"
              >
                <span>{SUPPORT_EMAIL}</span>
                {copiedEmail ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=Sapphire%20AI%20App%20Inquiry`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg ${bgCard} ${hoverBg} ${textPrimary} transition-colors cursor-pointer border ${border} font-medium`}
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