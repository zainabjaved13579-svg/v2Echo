import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { SAPPHIRE_APP_NAME, SAPPHIRE_LOGO_URL } from '../data/constants';
import { ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0e0f12] text-[#edeef2] p-4 sm:p-6 relative overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Subtle Blue Ambient Glow */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#18191e] border border-[#272a33] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col items-center text-center space-y-6">
        {/* Sapphire Brand Logo (Square with soft rounded corners) */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-2xl bg-[#22242c] p-1.5 border border-[#2e323d] shadow-xl flex items-center justify-center">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt="Sapphire Logo"
              className="w-full h-full rounded-xl object-cover ring-1 ring-blue-500/30 shadow-md group-hover:scale-105 transition-transform"
            />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-medium text-[#f3f4f6] tracking-tight">
            Welcome to {SAPPHIRE_APP_NAME}
          </h1>
          <p className="text-xs text-[#9ca3af] max-w-xs mx-auto leading-relaxed">
            Autonomous multi-file architecture, Codex app builder, and global intelligent assistant.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="w-full p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-1">
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
            <span>Continue as Guest (No Sign-in)</span>
          </button>

          <p className="text-[11px] text-[#86837c] flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guest mode stores data locally without saving to cloud</span>
          </p>
        </div>
      </div>
    </div>
  );
};
