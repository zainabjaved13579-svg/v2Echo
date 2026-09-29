import React, { useState } from 'react';
import {
  signInWithGoogle,
  clearAllCorruptCache,
  SapphireUser
} from '../services/authService';
import { SAPPHIRE_APP_NAME, SAPPHIRE_LOGO_URL } from '../data/constants';
import {
  UserCheck,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onLoginSuccess?: (user: SapphireUser) => void;
  onContinueAsGuest?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onContinueAsGuest }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      if (user && onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.warn('Google sign-in notice:', err);
      setError(err?.message || 'Google sign-in was closed or unavailable. You can retry or continue in Guest Mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCacheAndReload = () => {
    clearAllCorruptCache();
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#151515] text-[#ede8e1] p-4 sm:p-6 relative overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#d97757]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#d97757]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Animated Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#1c1c1b] border border-[#2e2d2a] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col items-center text-center space-y-6"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 border border-slate-200 shadow-xl flex items-center justify-center">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt="Sapphire AI Logo"
              className="w-full h-full rounded-xl object-contain shadow-xs"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#252422] border border-[#383633] text-[11px] text-[#a19e97] mb-2 font-medium">
              <Sparkles className="w-3 h-3 text-[#d97757]" />
              <span>Next-Gen Intelligent AI</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#f5f2eb] tracking-tight">
              Welcome to {SAPPHIRE_APP_NAME}
            </h1>
            <p className="text-xs text-[#a19e97] mt-1 max-w-xs mx-auto leading-relaxed">
              Sign in with Google to sync your work, or enter immediately with ephemeral Guest Mode.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2 text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="flex-1">{error}</span>
          </motion.div>
        )}

        {/* Actions Container */}
        <div className="w-full space-y-3 pt-1">
          {/* Primary Google Login Button */}
          <button
            id="google-signin-btn"
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] text-[#191817] rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 group"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.99 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-[#2e2d2a]" />
            <span className="text-[11px] text-[#73716b] font-semibold uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-[#2e2d2a]" />
          </div>

          {/* Guest Mode Button */}
          <button
            id="guest-signin-btn"
            type="button"
            disabled={loading}
            onClick={onContinueAsGuest}
            className="w-full py-3.5 px-4 bg-[#232321] hover:bg-[#2c2b28] active:scale-[0.98] text-[#ede8e1] border border-[#383633] rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md group"
          >
            <UserCheck className="w-4 h-4 text-[#d97757] group-hover:scale-110 transition-transform" />
            <span>Continue as Guest</span>
            <ArrowRight className="w-4 h-4 text-[#888] ml-auto group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Guest Mode Notice */}
          <div className="p-3 rounded-2xl bg-[#171716] border border-[#2a2926] text-left flex items-start gap-2.5 mt-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#8e8c85] leading-relaxed">
              <strong className="text-[#d8d5cd] font-semibold block">Guest Mode (0 Data Saved):</strong>
              Nothing is saved to database or storage. When you refresh the page, the login screen will return so you can choose again.
            </div>
          </div>
        </div>

        {/* Self-healing Cache / Reset Storage */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleResetCacheAndReload}
            className="text-[11px] text-[#666] hover:text-[#aaa] transition-colors flex items-center gap-1.5 cursor-pointer mx-auto"
            title="Clean local cookies and refresh application"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Cache & Storage</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
