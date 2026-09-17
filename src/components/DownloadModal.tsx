import React, { useState } from 'react';
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
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ECHO_LOGO_URL } from '../data/constants';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'android' | 'windows' | 'qr' | 'pwa'>('all');
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const APK_DOWNLOAD_URL = 'https://web2apkpro.com/public_download.php?project_id=22151&token=b5beb40122';
  const EXE_DOWNLOAD_URL = 'https://drive.google.com/uc?export=download&confirm=t&id=1_xlUnq7dHKWI2SRySfSC-7F6nucLncRY';
  const SUPPORT_EMAIL = 'shaheerh328@gmail.com';

  const handleTriggerDownload = (platform: 'android' | 'windows', url: string) => {
    setDownloadingPlatform(platform);
    // Simulate brief secure handshake animation then open direct link
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
    }, 600);
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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="download-modal-container"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[#0e1322] border border-slate-700/70 rounded-3xl p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(30,58,138,0.4)] text-white space-y-5 my-auto max-h-[92vh] overflow-y-auto select-none sm:select-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Decorative Ambient Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 blur-3xl pointer-events-none rounded-full" />

          {/* Close Button */}
          <button
            id="close-download-modal"
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 transition-all cursor-pointer active:scale-90"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Banner */}
          <div className="text-center space-y-2 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span>Official Release · Version 2.0.1</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <motion.img
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                src={ECHO_LOGO_URL}
                alt="Echo AI"
                className="w-12 h-12 rounded-2xl object-contain bg-slate-900 border border-blue-500/30 p-1 shadow-lg shadow-blue-500/15"
              />
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>Get Echo AI</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Free
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Available on Android, Windows &amp; Web</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Experience ultra-fast AI reasoning, offline file management, coding workspaces, and image generation anywhere.
            </p>
          </div>

          {/* Animated Tab Bar */}
          <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              All Downloads
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Android APK</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('windows')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'windows'
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>Windows EXE</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-purple-400" />
              <span>Scan QR</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pwa')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pwa'
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Web PWA</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="space-y-4">
            {/* View: All or Android + Windows Grid */}
            {(activeTab === 'all' || activeTab === 'android' || activeTab === 'windows') && (
              <div className={`grid gap-4 ${activeTab === 'all' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Android Card */}
                {(activeTab === 'all' || activeTab === 'android') && (
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-[#151c2e] to-[#0f1422] border border-slate-700/80 hover:border-emerald-500/60 transition-all shadow-lg hover:shadow-emerald-500/10 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-300" /> Direct APK
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">
                          Echo for Android
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>Version 2.0.1</span>
                          <span>•</span>
                          <span>28 MB</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">Verified</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Full mobile app. Install directly on any Android phone or tablet. Works smoothly with live chat, voice &amp; file coding.
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> No ads
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-400" /> No root required
                        </span>
                      </div>
                    </div>

                    <div className="pt-5 mt-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerDownload('android', APK_DOWNLOAD_URL)}
                        disabled={downloadingPlatform === 'android'}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-95 cursor-pointer disabled:opacity-75"
                      >
                        {downloadingPlatform === 'android' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Starting APK Download...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download Android APK (28 MB)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Windows Card */}
                {(activeTab === 'all' || activeTab === 'windows') && (
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-[#151c2e] to-[#0f1422] border border-slate-700/80 hover:border-blue-500/60 transition-all shadow-lg hover:shadow-blue-500/10 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                          <Monitor className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-300" /> Windows 10/11
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors">
                          Echo for Windows
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>Version 2.0.1</span>
                          <span>•</span>
                          <span>42 MB</span>
                          <span>•</span>
                          <span className="text-blue-400 font-medium">Standalone EXE</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Dedicated desktop application. Enhanced with dual-pane code workspaces, hotkeys, and instant offline backup.
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Portable
                        </span>
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Safe executable
                        </span>
                      </div>
                    </div>

                    <div className="pt-5 mt-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerDownload('windows', EXE_DOWNLOAD_URL)}
                        disabled={downloadingPlatform === 'windows'}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/25 active:scale-95 cursor-pointer disabled:opacity-75"
                      >
                        {downloadingPlatform === 'windows' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Starting EXE Download...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download Windows EXE (42 MB)</span>
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
                className="p-6 rounded-2xl bg-[#141a2c] border border-slate-700/80 text-center space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5 text-purple-400" />
                    <span>Scan with Mobile Camera</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Open camera or QR scanner on your phone to download the APK directly without cords.
                  </p>
                </div>

                <div className="inline-block p-4 rounded-2xl bg-white shadow-2xl border-4 border-purple-500/40">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(APK_DOWNLOAD_URL)}&color=0e1322&bgcolor=ffffff`}
                    alt="Scan to Download APK"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Direct APK Link
                  </span>
                  <span>•</span>
                  <span>Fast Android Installation</span>
                </div>
              </motion.div>
            )}

            {/* View: Progressive Web App (PWA) Instructions */}
            {activeTab === 'pwa' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-[#141a2c] border border-slate-700/80 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Install Web App (PWA)</h3>
                    <p className="text-xs text-slate-400">Zero installation size, runs like a native app</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> iPhone / iPad (Safari)
                    </p>
                    <ol className="list-decimal list-inside text-slate-300 space-y-1 pl-1">
                      <li>Tap the Share button in Safari</li>
                      <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                      <li>Launch Echo directly from your home screen</li>
                    </ol>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5" /> Chrome / Edge (Desktop & Android)
                    </p>
                    <ol className="list-decimal list-inside text-slate-300 space-y-1 pl-1">
                      <li>Click the Install icon in the address bar (or menu)</li>
                      <li>Select <strong>Install Echo AI</strong></li>
                      <li>Launch as an independent desktop window anytime</li>
                    </ol>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Verified Guarantee Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Free · Clean &amp; VirusTotal Verified · No account or subscription needed.</span>
            </div>
          </div>

          {/* Support / Direct Developer Contact Footer */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Developer support:</span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-mono font-medium hover:underline cursor-pointer"
                title="Click to copy email"
              >
                <span>{SUPPORT_EMAIL}</span>
                {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=Echo%20AI%20App%20Inquiry&body=Hello%20Developer%2C%0A%0AI%20am%20using%20Echo%20AI%20and...`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer border border-slate-700/60 font-medium"
            >
              <Mail className="w-3 h-3 text-blue-400" />
              <span>Contact in Gmail</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
