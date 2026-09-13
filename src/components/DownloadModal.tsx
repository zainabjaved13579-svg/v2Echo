import React from 'react';
import { X, Smartphone, Monitor, Download, ExternalLink, Mail, CheckCircle, Zap } from 'lucide-react';
import { ECHO_LOGO_URL } from '../data/constants';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const APK_DOWNLOAD_URL = 'https://web2apkpro.com/public_download.php?project_id=22151&token=b5beb40122';
  const EXE_DOWNLOAD_URL = 'https://drive.google.com/uc?export=download&confirm=t&id=1_xlUnq7dHKWI2SRySfSC-7F6nucLncRY';
  const SUPPORT_EMAIL = 'shaheerh328@gmail.com';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#0e131f] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-1">
            <img
              src={ECHO_LOGO_URL}
              alt="EchoAI"
              className="w-10 h-10 rounded-xl object-contain"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Download Echo AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Choose your platform and download instantly. Direct download — click &amp; go. No sign-up required.
          </p>
        </div>

        {/* Download Grid: Android APK & Windows EXE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Android Card */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-slate-700/60 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">Android APK</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Direct
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Version 2.0.1 · 28 MB</p>
              </div>
              <p className="text-xs text-slate-300">
                Install directly on your Android device. Full features &amp; quick access.
              </p>
            </div>

            <div className="pt-4 mt-2">
              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 hover:scale-[1.02] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download APK</span>
              </a>
            </div>
          </div>

          {/* Windows Card */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-slate-700/60 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">Windows EXE</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Direct
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Version 2.0.1 · 42 MB</p>
              </div>
              <p className="text-xs text-slate-300">
                Desktop app for Windows 10 &amp; 11 with keyboard shortcuts &amp; workspace.
              </p>
            </div>

            <div className="pt-4 mt-2">
              <a
                href={EXE_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/20 hover:scale-[1.02] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download EXE</span>
              </a>
            </div>
          </div>
        </div>

        {/* Feature badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 rounded-xl">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Click download — file starts immediately. No sign-up required.</span>
        </div>

        {/* Support Footer */}
        <div className="pt-2 border-t border-slate-800 text-center space-y-1">
          <p className="text-xs text-slate-400">
            Have questions or need assistance? Contact developer directly:
          </p>
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=Echo%20AI%20Support&body=Hello%2C%20I%20have%20a%20question...`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{SUPPORT_EMAIL}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
