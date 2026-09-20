import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { SAPPHIRE_LOGO_URL, SAPPHIRE_APP_NAME } from '../data/constants';
import { ShieldCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLoginSuccess?: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
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
      // If popup was blocked or iframe restriction
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirErr: any) {
          setError(redirErr.message || 'Authentication error occurred.');
        }
      } else {
        setError(err.message || 'Unable to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col items-center text-center space-y-6">
        {/* Logo and Identity */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-2xl bg-slate-800/80 p-2.5 border border-slate-700/80 shadow-xl flex items-center justify-center">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt={SAPPHIRE_APP_NAME}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 p-1 bg-blue-600 rounded-full text-white shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome to {SAPPHIRE_APP_NAME}
          </h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Your high-speed autonomous AI engineering assistant and cloud workspace.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="w-full p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <div className="w-full space-y-3 pt-2">
          <button
            id="google-signin-btn"
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 rounded-2xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>{loading ? 'Signing In...' : 'Continue with Google'}</span>
          </button>

          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Protected with Firebase Authentication & Firestore Cloud</span>
          </p>
        </div>
      </div>
    </div>
  );
};
