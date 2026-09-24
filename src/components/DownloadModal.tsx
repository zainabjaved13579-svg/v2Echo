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
  HardDrive
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

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'all' | 'android' | 'windows' | 'qr'>('pwa');
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null);
  const [pwaStatusMessage, setPwaStatusMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [windowsAutoPrompted, setWindowsAutoPrompted] = useState(false);

  // Auto-download for Windows users when modal opens
  useEffect(() => {
    if (!isOpen || windowsAutoPrompted) return;
    if (typeof navigator === 'undefined') return;

    const isWindows = /Windows|Win32|Win64|WOW64/i.test(navigator.userAgent || '');
    if (isWindows) {
      setWindowsAutoPrompted(true);
      // Keep on PWA or windows as helpful
    }
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
      setTimeout(() => {
        setDownloadingPlatform(null);
      }, 1500);
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
      setPwaStatusMessage('Tap your browser menu (⋮ or Share) and select "Add to Home screen" / "Install Sapphire".');
      setTimeout(() => setPwaStatusMessage(null), 4000);
    }
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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="download-modal-container"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[#201f1d] border border-[#33312e] rounded-3xl p-5 sm:p-7 shadow-2xl text-[#ede8e1] space-y-5 my-auto max-h-[92vh] overflow-y-auto select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]"
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

          {/* Header Banner */}
          <div className="text-center space-y-2 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d97757]/15 border border-[#d97757]/30 text-[#d97757] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#d97757]" />
              <span>Official Release · Version 2.0.1</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <img
                src={SAPPHIRE_LOGO_URL}
                alt={SAPPHIRE_APP_NAME}
                className="w-12 h-12 rounded-2xl object-cover bg-[#282724] border border-[#383633] ring-1 ring-[#d97757]/30 shadow-md"
              />
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5f2eb] flex items-center gap-2">
                  <span>Sapphire PWA App</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Mobile &amp; PC
                  </span>
                </h2>
                <p className="text-xs text-[#86837c]">Full Progressive Web App with offline speed &amp; native experience</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#a19e97] max-w-lg mx-auto leading-relaxed">
              Install Sapphire directly on your Android, iPhone, iPad, Windows, or Mac. No app store login needed.
            </p>
          </div>

          {/* Status Message Toast */}
          {pwaStatusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-[#282724] border border-[#d97757] text-xs text-[#ede8e1] text-center font-medium shadow-md"
            >
              {pwaStatusMessage}
            </motion.div>
          )}

          {/* Animated Tab Bar */}
          <div className="flex items-center justify-center gap-1.5 p-1 bg-[#191817] border border-[#2a2926] rounded-2xl overflow-x-auto text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('pwa')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pwa'
                  ? 'bg-[#d97757] text-white shadow-md font-semibold'
                  : 'text-[#86837c] hover:text-[#ede8e1] hover:bg-[#201f1d]'
              }`}
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Mobile &amp; Web PWA</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-[#d97757] text-white shadow-md font-semibold'
                  : 'text-[#86837c] hover:text-[#ede8e1] hover:bg-[#201f1d]'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Android APK</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('windows')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'windows'
                  ? 'bg-[#d97757] text-white shadow-md font-semibold'
                  : 'text-[#86837c] hover:text-[#ede8e1] hover:bg-[#201f1d]'
              }`}
            >
              <Monitor className="w-4 h-4 text-blue-400" />
              <span>Windows EXE</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-[#d97757] text-white shadow-md font-semibold'
                  : 'text-[#86837c] hover:text-[#ede8e1] hover:bg-[#201f1d]'
              }`}
            >
              <QrCode className="w-4 h-4 text-purple-400" />
              <span>QR Code</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="space-y-4">
            {/* View: Progressive Web App (PWA) Direct Download */}
            {(activeTab === 'all' || activeTab === 'pwa') && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-[#191817] border border-[#33312e] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#f5f2eb]">Sapphire Progressive Web App (PWA)</h3>
                      <p className="text-xs text-[#86837c]">Zero installation size, runs like a native app on iOS, Android &amp; Desktop</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-300" /> 1-Click Install
                  </span>
                </div>

                {/* Direct Action Buttons for PWA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    id="install-pwa-button-direct"
                    onClick={handleInstallPwa}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#d97757] hover:bg-[#c86b4c] text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install PWA to Device</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadOfflinePwaPackage}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#282724] hover:bg-[#32302c] text-[#ede8e1] border border-[#383633] font-semibold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4 text-[#d97757]" />
                    <span>Download Offline Web App</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3.5 rounded-2xl bg-[#201f1d] border border-[#33312e] space-y-1.5">
                    <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> iPhone / iPad (Safari)
                    </p>
                    <p className="text-[#a19e97] leading-relaxed">
                      Tap the <strong>Share</strong> button in Safari and tap <strong>Add to Home Screen</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#201f1d] border border-[#33312e] space-y-1.5">
                    <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5" /> Chrome / Edge / Android
                    </p>
                    <p className="text-[#a19e97] leading-relaxed">
                      Click the button above or browser install icon in address bar to install in 1 second.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View: Android & Windows Cards */}
            {(activeTab === 'all' || activeTab === 'android' || activeTab === 'windows') && (
              <div className={`grid gap-4 ${activeTab === 'all' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Android Card */}
                {(activeTab === 'all' || activeTab === 'android') && (
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="flex flex-col justify-between p-5 rounded-2xl bg-[#191817] border border-[#33312e] hover:border-emerald-500/60 transition-all shadow-md group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-300" /> Direct APK
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-[#f5f2eb] group-hover:text-emerald-300 transition-colors">
                          Sapphire for Android
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#86837c] mt-0.5">
                          <span>Version 2.0.1</span>
                          <span>•</span>
                          <span>28 MB</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">Verified</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#a19e97] leading-relaxed">
                        Full mobile app. Install directly on any Android phone or tablet. Works smoothly with live chat, voice &amp; file coding.
                      </p>
                    </div>

                    <div className="pt-4 mt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerDownload('android', APK_DIRECT_URL)}
                        disabled={downloadingPlatform === 'android'}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-75"
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

                      <a
                        href={APK_DOWNLOAD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#282724] hover:bg-[#32302c] text-[#a19e97] hover:text-[#ede8e1] text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Google Drive Backup</span>
                      </a>
                    </div>
                  </motion.div>
                )}

                {/* Windows Card */}
                {(activeTab === 'all' || activeTab === 'windows') && (
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="flex flex-col justify-between p-5 rounded-2xl bg-[#191817] border border-[#33312e] hover:border-blue-500/60 transition-all shadow-md group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <Monitor className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-blue-300" /> Windows 10/11
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-[#f5f2eb] group-hover:text-blue-300 transition-colors">
                          Sapphire for Windows
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#86837c] mt-0.5">
                          <span>Version 2.0.1</span>
                          <span>•</span>
                          <span>42 MB</span>
                          <span>•</span>
                          <span className="text-blue-400 font-medium">Standalone EXE</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#a19e97] leading-relaxed">
                        Dedicated desktop application. Enhanced with live preview, keyboard shortcuts, and instant offline backup.
                      </p>
                    </div>

                    <div className="pt-4 mt-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerDownload('windows', EXE_DOWNLOAD_URL)}
                        disabled={downloadingPlatform === 'windows'}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-75"
                      >
                        {downloadingPlatform === 'windows' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Starting EXE Download...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download Windows EXE</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* View: QR Code Scan for Mobile */}
            {activeTab === 'qr' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl bg-[#191817] border border-[#33312e] text-center space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#f5f2eb] flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5 text-[#d97757]" />
                    <span>Scan with Mobile Camera</span>
                  </h3>
                  <p className="text-xs text-[#a19e97]">
                    Open camera on your phone to install Sapphire directly.
                  </p>
                </div>

                <div className="inline-block p-4 rounded-2xl bg-white shadow-xl border-4 border-[#33312e]">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&color=201f1d&bgcolor=ffffff`}
                    alt="Scan to Install"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-center gap-3 text-xs text-[#86837c]">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Instant Launch
                  </span>
                  <span>•</span>
                  <span>Zero Storage Needed</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Verified Guarantee Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#282724] border border-[#383633] text-xs text-[#ede8e1]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Free · Clean &amp; VirusTotal Verified · No subscription needed.</span>
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
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#282724] hover:bg-[#32302c] text-[#ede8e1] transition-colors cursor-pointer border border-[#383633] font-medium"
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
