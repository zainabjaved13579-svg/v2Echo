import React, { useState } from 'react';
import {
  signInWithGoogle,
  initiateGmailRegistration,
  verifyGmailCode,
  signInWithGmailPassword,
  clearAllCorruptCache,
  SapphireUser
} from '../services/authService';
import { SAPPHIRE_APP_NAME, SAPPHIRE_LOGO_URL } from '../data/constants';
import {
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  onLoginSuccess?: (user: any) => void;
  onContinueAsGuest?: () => void;
}

type AuthMode = 'signin' | 'register' | 'verify';

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onContinueAsGuest }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

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
      setError(err?.message || 'Unable to sign in with Google. You can continue with your Gmail below or enter as Guest.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid Gmail / email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Please enter a password with at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await initiateGmailRegistration(email, password, name);
      setGeneratedCode(res.code);
      setVerificationCode(res.code); // Pre-fill for instant convenience
      setMode('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to start registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await verifyGmailCode(email, verificationCode);
      if (user && onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid Gmail address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGmailPassword(email, password);
      if (user && onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
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
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#1c1c1b] border border-[#2e2d2a] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col items-center text-center space-y-5"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#282724] p-1.5 border border-[#383633] shadow-xl flex items-center justify-center">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt="Sapphire Logo"
              className="w-full h-full rounded-xl object-cover ring-1 ring-[#d97757]/40 shadow-md"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#252422] border border-[#383633] text-[11px] text-[#a19e97] mb-1.5">
              <Sparkles className="w-3 h-3 text-[#d97757]" />
              <span>Next-Gen Intelligent AI</span>
            </div>
            <h1 className="text-2xl font-bold text-[#f5f2eb] tracking-tight">
              Welcome to {SAPPHIRE_APP_NAME}
            </h1>
            <p className="text-xs text-[#a19e97] mt-0.5">
              {mode === 'verify'
                ? 'Verify your Gmail to complete your setup'
                : 'Sign in to sync your conversations across all devices'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2 text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="flex-1">{error}</span>
          </motion.div>
        )}

        {/* Mode: VERIFICATION STEP */}
        {mode === 'verify' ? (
          <form onSubmit={handleVerifyCode} className="w-full space-y-4 text-left">
            <div className="p-3.5 rounded-2xl bg-[#252422] border border-[#383633] text-center space-y-2">
              <div className="text-xs text-[#a19e97]">
                Verification code generated for{' '}
                <strong className="text-white block font-semibold text-sm mt-0.5">
                  {email}
                </strong>
              </div>

              {/* Verified Code Token Badge */}
              <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-[#191918] border border-[#44423e] max-w-xs mx-auto">
                <span className="font-mono text-lg font-bold tracking-widest text-[#d97757]">
                  {generatedCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-1 rounded-lg hover:bg-[#2c2b28] text-[#a19e97] hover:text-white transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-[#73716b]">
                Enter this 6-digit code below to verify your Gmail.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a19e97] mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-2xl bg-[#20201f] border border-[#33312e] text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-[#d97757] transition-all"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#d97757] hover:bg-[#c86b4c] text-white rounded-2xl font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{loading ? 'Verifying Code...' : 'Verify Gmail & Launch'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('register');
              }}
              className="w-full text-center text-xs text-[#a19e97] hover:text-white transition-colors pt-1 cursor-pointer"
            >
              Change Email or Password
            </button>
          </form>
        ) : (
          /* Normal Sign In / Register Modes */
          <div className="w-full space-y-4">
            {/* Primary Google Login Button */}
            <button
              id="google-signin-btn"
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] text-[#191817] rounded-2xl font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
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
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#2e2d2a]" />
              <span className="text-[11px] text-[#73716b] font-medium uppercase tracking-wider">
                or with Gmail
              </span>
              <div className="flex-1 h-px bg-[#2e2d2a]" />
            </div>

            {/* Switch Tabs between Sign In and Create Account */}
            <div className="flex items-center p-1 rounded-2xl bg-[#20201f] border border-[#2e2d2a]">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('signin');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[#2a2926] text-white shadow-xs'
                    : 'text-[#86837c] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('register');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#2a2926] text-white shadow-xs'
                    : 'text-[#86837c] hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={mode === 'signin' ? handleSignInWithPassword : handleStartRegistration}
              className="space-y-3 text-left"
            >
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-[#a19e97] mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#73716b] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#20201f] border border-[#2e2d2a] text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#d97757] transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#a19e97] mb-1">
                  Gmail Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#73716b] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#20201f] border border-[#2e2d2a] text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#d97757] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a19e97] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#73716b] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Create a secure password' : 'Enter your password'}
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#20201f] border border-[#2e2d2a] text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#d97757] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-[#73716b] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#d97757] hover:bg-[#c86b4c] active:scale-[0.98] text-white rounded-2xl font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>
                  {loading
                    ? 'Processing...'
                    : mode === 'signin'
                    ? 'Sign In with Gmail'
                    : 'Verify Gmail & Continue'}
                </span>
              </button>
            </form>

            {/* Continue as Guest Button */}
            <div className="pt-2">
              <button
                id="guest-signin-btn"
                type="button"
                onClick={onContinueAsGuest}
                className="w-full py-2.5 px-4 bg-[#20201f] hover:bg-[#282724] active:scale-[0.98] text-[#ede8e1] border border-[#2e2d2a] rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-[#d97757]" />
                <span>Continue as Guest</span>
              </button>
              <p className="text-[11px] text-[#73716b] mt-1.5 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Guest mode messages stay strictly in guest mode</span>
              </p>
            </div>
          </div>
        )}

        {/* Self-healing Cache / White page recovery button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleResetCacheAndReload}
            className="text-[11px] text-[#666] hover:text-[#999] transition-colors flex items-center gap-1.5 cursor-pointer mx-auto"
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
