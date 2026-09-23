import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { SAPPHIRE_APP_NAME, SAPPHIRE_LOGO_URL } from '../data/constants';
import { ShieldCheck, UserCheck, AlertCircle, Sparkles, Code2, Cpu, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onLoginSuccess?: (user: User) => void;
  onContinueAsGuest?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onContinueAsGuest }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && onLoginSuccess) {
        onLoginSuccess(result.user);
      }
    } catch (err: any) {
      console.warn('Firebase popup sign-in notice, attempting redirect fallback:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirErr: any) {
          setError(redirErr.message || 'Authentication error occurred.');
        }
      } else {
        setError(err.message || 'Unable to sign in with Google. You can continue as Guest.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#191817] text-[#ede8e1] p-4 sm:p-6 relative overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Animated Floating Gradient Orbs in Background */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.12, 0.22, 0.12],
          x: [0, 20, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 -left-20 w-96 h-96 bg-[#d97757]/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.08, 0.16, 0.08],
          x: [0, -30, 0],
          y: [0, 25, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#c86b4c]/20 rounded-full blur-3xl pointer-events-none"
      />

      {/* Main Animated Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#201f1d] border border-[#33312e] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col items-center text-center space-y-6"
      >
        {/* Sapphire Brand Logo with breathing animated glow ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative group cursor-pointer"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(217, 119, 87, 0.2)',
                '0 0 0 14px rgba(217, 119, 87, 0)',
                '0 0 0 0 rgba(217, 119, 87, 0.2)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl bg-[#282724] p-1.5 border border-[#383633] shadow-xl flex items-center justify-center"
          >
            <img
              src={SAPPHIRE_LOGO_URL}
              alt="Sapphire Logo"
              className="w-full h-full rounded-xl object-cover ring-1 ring-[#d97757]/40 shadow-md group-hover:scale-105 transition-transform"
            />
          </motion.div>
        </motion.div>

        {/* Title & Tagline with subtle badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#282724] border border-[#383633] text-[11px] text-[#a19e97]">
            <Sparkles className="w-3 h-3 text-[#d97757] animate-pulse" />
            <span>Next-Gen Intelligent Studio</span>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-semibold text-[#f5f2eb] tracking-tight">
            Welcome to {SAPPHIRE_APP_NAME}
          </h1>
          <p className="text-xs text-[#a19e97] max-w-xs mx-auto leading-relaxed">
            Multi-file application architecture, live interactive Codex engine, and ultra-fast reasoning.
          </p>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-2 w-full pt-1 text-[10px] text-[#86837c]"
        >
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#191817] border border-[#2a2926]">
            <Code2 className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="font-medium text-[#ede8e1]">Codex Apps</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#191817] border border-[#2a2926]">
            <Zap className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="font-medium text-[#ede8e1]">Fast Engine</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#191817] border border-[#2a2926]">
            <Cpu className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="font-medium text-[#ede8e1]">Multi-File</span>
          </div>
        </motion.div>

        {/* Error notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="flex-1">{error}</span>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="w-full space-y-3 pt-1"
        >
          {/* Google Sign-In Button */}
          <button
            id="google-signin-btn"
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] text-[#191817] rounded-2xl font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          {/* Continue as Guest Button (No cloud save, instant access) */}
          <button
            id="guest-signin-btn"
            type="button"
            onClick={onContinueAsGuest}
            className="w-full py-3 px-4 bg-[#282724] hover:bg-[#32302c] active:scale-[0.98] text-[#ede8e1] border border-[#383633] rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-[#d97757]" />
            <span>Continue as Guest (Instant Access)</span>
          </button>

          <p className="text-[11px] text-[#86837c] flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guest mode saves data locally in your browser</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
export default Auth;
