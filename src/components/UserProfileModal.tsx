import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  LogOut,
  UserPlus,
  ShieldCheck,
  User,
  Trash2,
  Loader2,
  Check
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  saveUserProfile,
  DEFAULT_PREADDED_PROFILE_PHOTO,
  getInitialsAvatar
} from '../services/userService';
import { signInWithGoogle } from '../services/authService';
import { useAppTheme } from '../context/ThemeContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  isFirstTimeSetup?: boolean;
  sessions?: any[];
  files?: any[];
  onSignOut?: () => void;
  isGuestMode?: boolean;
}

interface SavedAccount {
  name: string;
  email: string;
  avatar: string;
  provider?: 'google' | 'guest' | 'email';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onSignOut,
  isGuestMode = false
}) => {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  const [name, setName] = useState(profile.name && profile.name !== 'Guest User' ? profile.name : '');
  const [email, setEmail] = useState(profile.email || '');
  const [picture, setPicture] = useState(profile.avatar || DEFAULT_PREADDED_PROFILE_PHOTO);
  const [isSaving, setIsSaving] = useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saved accounts from localStorage
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => {
    try {
      const data = localStorage.getItem('sapphire_saved_accounts_list');
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  });

  useEffect(() => {
    setName(profile.name && profile.name !== 'Guest User' ? profile.name : '');
    setEmail(profile.email || '');
    setPicture(profile.avatar || DEFAULT_PREADDED_PROFILE_PHOTO);
  }, [profile]);

  if (!isOpen) return null;

  // Handle browsing and selecting pictures from computer/device
  const handleBrowsePicture = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image size exceeds 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPicture(dataUrl);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    setIsSaving(true);
    try {
      const updated: UserProfile = {
        ...profile,
        name: cleanName,
        email: email.trim(),
        avatar: picture || getInitialsAvatar(cleanName),
        lastSyncedAt: Date.now()
      };

      // Add to saved accounts list
      const accountList = [...savedAccounts];
      const existingIdx = accountList.findIndex((a) => a.email === updated.email && updated.email !== '');
      if (existingIdx >= 0) {
        accountList[existingIdx] = {
          name: cleanName,
          email: updated.email || '',
          avatar: updated.avatar || '',
          provider: updated.email.includes('@gmail.com') ? 'google' : 'guest'
        };
      } else if (updated.email) {
        accountList.push({
          name: cleanName,
          email: updated.email,
          avatar: updated.avatar || '',
          provider: updated.email.includes('@gmail.com') ? 'google' : 'guest'
        });
      }

      try {
        localStorage.setItem('sapphire_saved_accounts_list', JSON.stringify(accountList));
        if (updated.email) {
          localStorage.setItem('sapphire_user_email', updated.email);
        }
      } catch {}

      const saved = await saveUserProfile(updated);
      onUpdateProfile(saved);
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchToAccount = (acc: SavedAccount) => {
    const updated: UserProfile = {
      ...profile,
      name: acc.name,
      email: acc.email,
      avatar: acc.avatar || getInitialsAvatar(acc.name),
      lastSyncedAt: Date.now()
    };
    try {
      localStorage.setItem('sapphire_user_email', acc.email);
    } catch {}
    saveUserProfile(updated);
    onUpdateProfile(updated);
    setName(acc.name);
    setEmail(acc.email);
    setPicture(acc.avatar || getInitialsAvatar(acc.name));
    setSwitchFeedback(`Switched to ${acc.name}`);
    setTimeout(() => setSwitchFeedback(null), 2500);
  };

  const handleRemoveAccount = (emailToRemove: string) => {
    const updated = savedAccounts.filter((a) => a.email !== emailToRemove);
    setSavedAccounts(updated);
    try {
      localStorage.setItem('sapphire_saved_accounts_list', JSON.stringify(updated));
    } catch {}
  };

  const handleGoogleSignInAccount = async () => {
    setIsGoogleLoggingIn(true);
    setUploadError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        const accName = user.displayName || user.email.split('@')[0] || 'Google User';
        const accEmail = user.email || '';
        const accAvatar = user.photoURL || DEFAULT_PREADDED_PROFILE_PHOTO;

        const newAcc: SavedAccount = {
          name: accName,
          email: accEmail,
          avatar: accAvatar,
          provider: 'google'
        };

        const existingIdx = savedAccounts.findIndex((a) => a.email.toLowerCase() === accEmail.toLowerCase());
        let updatedList = [...savedAccounts];
        if (existingIdx >= 0) {
          updatedList[existingIdx] = newAcc;
        } else {
          updatedList.push(newAcc);
        }

        setSavedAccounts(updatedList);
        try {
          localStorage.setItem('sapphire_saved_accounts_list', JSON.stringify(updatedList));
          localStorage.setItem('sapphire_user_email', accEmail);
        } catch {}

        const updatedProfile: UserProfile = {
          ...profile,
          name: accName,
          email: accEmail,
          avatar: accAvatar,
          lastSyncedAt: Date.now()
        };

        await saveUserProfile(updatedProfile);
        onUpdateProfile(updatedProfile);
        setName(accName);
        setEmail(accEmail);
        setPicture(accAvatar);
        setSwitchFeedback(`Signed in with Google: ${accName}`);
        setTimeout(() => setSwitchFeedback(null), 3000);
      }
    } catch (err: any) {
      console.warn('Google sign-in flow error:', err);
      setUploadError(err?.message || 'Google Sign-In could not complete.');
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  // 1. SIMPLE GUEST MODE: NO AVATAR, NO PROFILE SETUP
  if (isGuestMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-['Plus_Jakarta_Sans',sans-serif]">
        <div
          className={`border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center ${
            isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#181920] text-[#ede8e1] border-[#292b3a]'
          }`}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-800/50 border border-zinc-700/40 flex items-center justify-center text-zinc-300 mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Guest Mode</h3>
          <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
            You are browsing in simple Guest Mode. No profile, account, or avatar is required.
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignInAccount}
              disabled={isGoogleLoggingIn}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              {isGoogleLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Sign in with Google</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. SIGNED-IN PROFILE: JUST NAME & BROWSE PICTURES WITH PRE-ADDED PHOTO
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className={`border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh] ${
          isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#181920] text-[#ede8e1] border-[#292b3a]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#13141a] border-[#252735]'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl border flex items-center justify-center bg-[#d97757]/15 border-[#d97757]/40 text-[#d97757]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                Account & Profile
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
          {/* Profile Picture with Clean Browse Button */}
          <div className="flex flex-col items-center justify-center pt-1 pb-2">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#d97757] shadow-lg p-0.5 bg-black/30">
                <img
                  src={picture}
                  alt={name || 'Profile'}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleBrowsePicture}
              accept="image/*"
              className="hidden"
            />

            {/* Browse Picture Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:border-[#d97757]"
            >
              <Upload className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Browse Picture from Device</span>
            </button>
            {uploadError && (
              <p className="text-[11px] text-rose-500 font-medium mt-1.5 text-center">{uploadError}</p>
            )}
          </div>

          {/* Feedback */}
          {switchFeedback && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{switchFeedback}</span>
            </div>
          )}

          {/* Just Name & Email Fields */}
          <div className="space-y-3">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                Your Name <span className="text-[#d97757]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#d97757] ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#14151e] border-[#292b3a] text-zinc-100'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                Email / Account
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@gmail.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#d97757] ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#14151e] border-[#292b3a] text-zinc-100'
                }`}
              />
            </div>
          </div>

          {/* Switch Accounts & Google Auth */}
          <div
            className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#14151e] border-[#292b3a]'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-zinc-100'}`}>
                <User className="w-3.5 h-3.5 text-[#d97757]" />
                <span>Switch Accounts</span>
              </label>
              <button
                type="button"
                onClick={handleGoogleSignInAccount}
                disabled={isGoogleLoggingIn}
                className="text-xs font-bold text-[#d97757] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoggingIn ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <UserPlus className="w-3 h-3" />
                )}
                <span>+ Add Google Account</span>
              </button>
            </div>

            {/* Saved Accounts */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              <div
                className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold ${
                  isLight ? 'bg-white border-[#d97757]' : 'bg-[#1d1f2a] border-[#d97757]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={picture}
                    alt={name}
                    className="w-6 h-6 rounded-lg object-cover border border-black/10 shrink-0"
                  />
                  <div className="truncate">
                    <span className="block truncate font-bold text-slate-900 dark:text-zinc-100">
                      {name.trim() || 'Active User'}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {email || 'Active Account'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/30">
                  <Check className="w-3 h-3" />
                  <span>Active</span>
                </span>
              </div>

              {savedAccounts
                .filter((acc) => acc.email.toLowerCase() !== email.toLowerCase())
                .map((acc, i) => (
                  <div
                    key={i}
                    onClick={() => handleSwitchToAccount(acc)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                        : 'bg-[#181a24] hover:bg-[#202230] border-[#292c3c] text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-6 h-6 rounded-lg object-cover shrink-0"
                      />
                      <div className="truncate">
                        <span className="block truncate font-bold">{acc.name}</span>
                        <span className="text-[10px] text-zinc-400 block truncate">{acc.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">
                        Switch
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAccount(acc.email);
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            {onSignOut ? (
              <button
                type="button"
                onClick={onSignOut}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="px-5 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86949] text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
