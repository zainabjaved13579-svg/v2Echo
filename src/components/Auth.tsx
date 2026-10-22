import React, { useState, useEffect } from 'react';
import {
  signInWithGoogle,
  SavedAccount,
  SAVED_ACCOUNTS_KEY,
  SapphireUser,
  recordSavedAccount,
  saveActiveUser
} from '../services/authService';
import { SAPPHIRE_APP_NAME, SAPPHIRE_LOGO_URL } from '../data/constants';
import {
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Trash2,
  CheckCircle2,
  Sun,
  Moon,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppTheme } from '../context/ThemeContext';

interface AuthProps {
  onLoginSuccess?: (user: SapphireUser) => void;
  onContinueAsGuest?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onContinueAsGuest }) => {
  const { theme, toggleTheme } = useAppTheme();
  const isMoon = theme === 'moon';

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  // Load saved profiles from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedAccounts(parsed);
        }
      }
    } catch {}
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. Please try again.');
      } else {
        setErrorMessage(err?.message || 'Google sign-in could not be completed. Please try again.');
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleSelectSavedAccount = (account: SavedAccount) => {
    const user: SapphireUser = {
      uid: `saved_${account.email || 'user'}`,
      email: account.email || '',
      displayName: account.name || 'User',
      photoURL: account.avatar,
      emailVerified: true,
      provider: (account.provider as any) || 'google',
      createdAt: Date.now()
    };
    saveActiveUser(user);
    if (onLoginSuccess) {
      onLoginSuccess(user);
    }
  };

  const handleRemoveSavedAccount = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    const updated = savedAccounts.filter((a) => a.email !== email);
    setSavedAccounts(updated);
    try {
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleGuestAccess = () => {
    saveActiveUser(null);
    const guestUser: SapphireUser = {
      uid: `guest_${Date.now()}`,
      email: '',
      displayName: 'Guest User',
      emailVerified: true,
      provider: 'guest',
      createdAt: Date.now()
    };
    if (onContinueAsGuest) {
      onContinueAsGuest();
    } else if (onLoginSuccess) {
      onLoginSuccess(guestUser);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 ${
        isMoon ? 'bg-[#0f1015] text-[#ede8e1]' : 'bg-[#f8f9fa] text-slate-900'
      }`}
    >
      {/* Theme Toggle in top-right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          type="button"
          className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
            isMoon
              ? 'bg-[#181920] border-[#2a2c3a] text-zinc-300 hover:text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
          }`}
          title="Toggle Dark / Light Theme"
        >
          {isMoon ? <Sun className="w-4 h-4 text-[#d97757]" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl ${
          isMoon
            ? 'bg-[#14151e]/95 border-[#282a3c] text-white shadow-black/80'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/80'
        }`}
      >
        {/* Header */}
        <div className="p-8 pb-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white p-2 border border-[#e8e2d8] shadow-md flex items-center justify-center">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt="Sapphire AI Logo"
              className="w-full h-full rounded-xl object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {SAPPHIRE_APP_NAME}
          </h1>
          <p className={`text-xs mt-1.5 leading-relaxed ${isMoon ? 'text-zinc-400' : 'text-slate-500'}`}>
            Autonomous AI Studio & Full-Stack Codex Environment
          </p>
        </div>

        {/* Action Body */}
        <div className="px-8 pb-8 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold text-center">
              {errorMessage}
            </div>
          )}

          {/* PRIMARY: CONTINUE WITH GOOGLE */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle}
            className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] ${
              isMoon
                ? 'bg-white hover:bg-zinc-100 text-zinc-900 border-white/20'
                : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isLoadingGoogle ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#d97757]" />
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* SECONDARY: CONTINUE AS GUEST */}
          <button
            type="button"
            onClick={handleGuestAccess}
            className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
              isMoon
                ? 'bg-[#1c1d29] hover:bg-[#232534] border-[#2c2f42] text-zinc-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-[#d97757]" />
            <span>Continue as Guest</span>
          </button>

          {/* SAVED PROFILES SECTION (If previously signed in) */}
          {savedAccounts.length > 0 && (
            <div className="pt-3 border-t border-zinc-700/20">
              <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isMoon ? 'text-zinc-400' : 'text-slate-500'}`}>
                Or Select Saved Profile
              </p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {savedAccounts.map((acc, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectSavedAccount(acc)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                      isMoon
                        ? 'bg-[#181a24] hover:bg-[#202230] border-[#292c3c] text-zinc-200'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {acc.avatar ? (
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-7 h-7 rounded-xl object-cover shrink-0 border border-black/10"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-[#d97757] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {(acc.name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <span className="block truncate font-bold">{acc.name}</span>
                        {acc.email && (
                          <span className={`block truncate text-[10px] ${isMoon ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {acc.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => handleRemoveSavedAccount(e, acc.email)}
                        className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer transition-colors"
                        title="Remove profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secure Firebase Badge */}
          <div className="pt-3 text-center flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Official Firebase Authentication · Secure & Private</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
