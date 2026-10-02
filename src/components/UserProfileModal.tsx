import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Upload,
  Camera,
  Smile,
  LogOut,
  LogIn,
  UserPlus,
  RefreshCw,
  Crown,
  ShieldCheck,
  Mail,
  User,
  Trash2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  saveUserProfile,
  ANIMATED_AVATARS,
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
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  isFirstTimeSetup = false,
  onSignOut,
  isGuestMode = false
}) => {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  const [name, setName] = useState(profile.name && profile.name !== 'Guest User' ? profile.name : '');
  const [email, setEmail] = useState(profile.email || '');
  const [avatar, setAvatar] = useState(profile.avatar || ANIMATED_AVATARS[0].url);
  const [filter, setFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showAddAccountBox, setShowAddAccountBox] = useState(false);
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
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
    setAvatar(profile.avatar || ANIMATED_AVATARS[0].url);
  }, [profile]);

  if (!isOpen) return null;

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image size is too large (max 8MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatar(dataUrl);
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
        avatar: avatar || getInitialsAvatar(cleanName),
        lastSyncedAt: Date.now()
      };

      // Add to saved accounts list
      const accountList = [...savedAccounts];
      const existingIdx = accountList.findIndex((a) => a.email === updated.email && updated.email !== '');
      if (existingIdx >= 0) {
        accountList[existingIdx] = { name: cleanName, email: updated.email || '', avatar: updated.avatar || '' };
      } else if (updated.email) {
        accountList.push({ name: cleanName, email: updated.email, avatar: updated.avatar || '' });
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
    setAvatar(acc.avatar || getInitialsAvatar(acc.name));
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
        const accAvatar = user.photoURL || getInitialsAvatar(accName);

        const newAcc: SavedAccount = {
          name: accName,
          email: accEmail,
          avatar: accAvatar
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
        setAvatar(accAvatar);
        setShowAddAccountBox(false);
        setSwitchFeedback(`Successfully signed in with Google: ${accName}`);
        setTimeout(() => setSwitchFeedback(null), 3000);
      }
    } catch (err: any) {
      console.warn('Google sign-in flow error:', err);
      // If popup was blocked or closed in restricted iframe, offer manual prompt pre-filled
      setUploadError(err?.message || 'Google Sign-In popup could not complete. You can enter your Google account details below.');
      setShowAddAccountBox(true);
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  const handleAddNewAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountEmail.trim() || !newAccountName.trim()) return;

    const newAcc: SavedAccount = {
      name: newAccountName.trim(),
      email: newAccountEmail.trim(),
      avatar: ANIMATED_AVATARS[0].url
    };

    const updatedList = [...savedAccounts, newAcc];
    setSavedAccounts(updatedList);
    try {
      localStorage.setItem('sapphire_saved_accounts_list', JSON.stringify(updatedList));
      localStorage.setItem('sapphire_user_email', newAcc.email);
    } catch {}

    const updatedProfile: UserProfile = {
      ...profile,
      name: newAcc.name,
      email: newAcc.email,
      avatar: newAcc.avatar,
      lastSyncedAt: Date.now()
    };

    saveUserProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
    setName(newAcc.name);
    setEmail(newAcc.email);
    setAvatar(newAcc.avatar);
    setShowAddAccountBox(false);
    setSwitchFeedback(`Added account: ${newAcc.name}`);
    setTimeout(() => setSwitchFeedback(null), 2500);
  };

  const filteredAvatars =
    filter === 'all'
      ? ANIMATED_AVATARS
      : ANIMATED_AVATARS.filter((a) => a.type === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className={`border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] ${
        isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#201f1d] text-[#ede8e1] border-[#33312e]'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191817] border-[#2a2926]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shadow-xs ${
              isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-[#282724] border-[#383633] text-[#d97757]'
            }`}>
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-base leading-tight ${isLight ? 'text-slate-900' : 'text-[#f5f2eb]'}`}>
                {isFirstTimeSetup ? 'Welcome to Sapphire AI' : 'Account & Profile Settings'}
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>
                {isFirstTimeSetup
                  ? 'Set up your name, email and character avatar'
                  : 'Manage accounts, change profile and choose your avatar'}
              </p>
            </div>
          </div>
          {!isFirstTimeSetup && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-[#86837c] hover:text-[#ede8e1] hover:bg-[#282724]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5">

          {/* Active Preview & Avatar */}
          <div className="flex flex-col items-center justify-center py-1">
            <div className="relative group">
              <div className="w-22 h-22 rounded-2xl overflow-hidden border-2 border-[#d97757] shadow-lg p-1 bg-[#282724]">
                <img
                  src={avatar}
                  alt={name || 'User Avatar'}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-[#d97757] text-white flex items-center justify-center shadow-md hover:bg-[#c86b4c] transition-all cursor-pointer"
                title="Upload custom image"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className={`mt-2 font-bold text-sm ${isLight ? 'text-slate-900' : 'text-[#ede8e1]'}`}>
              {name.trim() || 'Your Profile'}
            </p>
            {email && (
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>{email}</p>
            )}
          </div>

          {/* Name & Email Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-slate-600' : 'text-[#86837c]'
              }`}>
                Your Name <span className="text-[#d97757]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex, Sam, Taylor..."
                required
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#d97757] ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#191817] border-[#33312e] text-[#ede8e1]'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-slate-600' : 'text-[#86837c]'
              }`}>
                Email / Account
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@gmail.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#d97757] ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#191817] border-[#33312e] text-[#ede8e1]'
                }`}
              />
            </div>
          </div>

          {/* Avatar Selection (Available for ALL users, both guest and signed-in!) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-semibold uppercase tracking-wider ${
                isLight ? 'text-slate-600' : 'text-[#86837c]'
              }`}>
                Choose Character Avatar
              </label>
              {/* Category Filter */}
              <div className={`flex items-center gap-1 p-0.5 rounded-lg text-[11px] font-medium border ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#191817] border-[#2a2926]'
              }`}>
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    filter === 'all'
                      ? isLight ? 'bg-white text-slate-900 shadow-xs' : 'bg-[#282724] text-[#ede8e1] shadow-xs'
                      : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-[#86837c] hover:text-[#ede8e1]'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('boy')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    filter === 'boy'
                      ? isLight ? 'bg-white text-slate-900 shadow-xs' : 'bg-[#282724] text-[#ede8e1] shadow-xs'
                      : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-[#86837c] hover:text-[#ede8e1]'
                  }`}
                >
                  Boy 👦
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('girl')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    filter === 'girl'
                      ? isLight ? 'bg-white text-slate-900 shadow-xs' : 'bg-[#282724] text-[#ede8e1] shadow-xs'
                      : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-[#86837c] hover:text-[#ede8e1]'
                  }`}
                >
                  Girl 👧
                </button>
              </div>
            </div>

            {/* Avatars Grid */}
            <div className="grid grid-cols-4 gap-2">
              {filteredAvatars.map((av) => {
                const isSelected = avatar === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatar(av.url)}
                    className={`flex flex-col items-center p-1.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500/40 scale-102'
                          : 'border-[#d97757] bg-[#282724] ring-1 ring-[#d97757]/40 scale-102'
                        : isLight
                        ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        : 'border-[#2a2926] bg-[#191817] hover:border-[#383633] hover:bg-[#201f1d]'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl overflow-hidden p-0.5 ${
                      isLight ? 'bg-white' : 'bg-[#201f1d]'
                    }`}>
                      <img src={av.url} alt={av.name} className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <span className={`text-[10px] font-medium mt-1 truncate w-full text-center ${
                      isLight ? 'text-slate-600' : 'text-[#86837c]'
                    }`}>
                      {av.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Custom Picture Option */}
          <div className="pt-0.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCustomUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full py-2.5 px-3 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-300 hover:border-blue-600 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  : 'border-[#383633] hover:border-[#d97757] bg-[#191817] hover:bg-[#282724] text-[#ede8e1]'
              }`}
            >
              <Upload className="w-4 h-4 text-[#d97757]" />
              <span>Upload Custom Photo from Device</span>
            </button>
            {uploadError && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 text-center">{uploadError}</p>
            )}
          </div>

          {/* Switch feedback toast */}
          {switchFeedback && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{switchFeedback}</span>
            </div>
          )}

          {/* Account Management: Switch Account / Add Another Account */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191817] border-[#2a2926]'
          }`}>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-[#ede8e1]'
              }`}>
                <User className="w-4 h-4 text-[#d97757]" />
                <span>Account Management</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddAccountBox((prev) => !prev)}
                className={`text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isLight ? 'text-blue-600 hover:text-blue-700' : 'text-[#d97757] hover:text-[#e0896b]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddAccountBox ? 'Cancel' : 'Add Another Account'}</span>
              </button>
            </div>

            {/* Quick 1-Click Google Sign-In & Add Account Button */}
            <button
              type="button"
              onClick={handleGoogleSignInAccount}
              disabled={isGoogleLoggingIn}
              className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all active:scale-98 shadow-xs cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-[#222120] hover:bg-[#2a2926] border-[#383633] text-[#ede8e1]'
              } disabled:opacity-60`}
            >
              {isGoogleLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#d97757]" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in & Add Account with Google</span>
                </>
              )}
            </button>

            {/* Saved Accounts List with Professional Switcher */}
            {savedAccounts.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-[#86837c]'}`}>
                  Switch between accounts on this device:
                </p>
                <div className="space-y-1.5">
                  {savedAccounts.map((acc, i) => {
                    const isCurrent = acc.email.toLowerCase() === email.toLowerCase();
                    const isGoogle = acc.email.includes('@gmail.com');
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                          isCurrent
                            ? isLight ? 'bg-blue-50/80 border-blue-300 shadow-xs' : 'bg-[#282724] border-[#d97757]/60 shadow-xs'
                            : isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-[#141414] border-[#2a2926] hover:border-[#383633]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={acc.avatar || getInitialsAvatar(acc.name)}
                            alt={acc.name}
                            className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold truncate">{acc.name}</span>
                              {isGoogle && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/20">
                                  Google
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate">{acc.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCurrent ? (
                            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSwitchToAccount(acc)}
                                className="px-3 py-1 rounded-lg bg-[#d97757] hover:bg-[#c86b4c] text-white text-[11px] font-bold cursor-pointer transition-colors active:scale-95 shadow-xs"
                              >
                                Switch
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAccount(acc.email)}
                                className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Remove this account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add New Account Form Box */}
            {showAddAccountBox && (
              <div className={`p-3.5 rounded-xl border space-y-2.5 animate-fadeIn ${
                isLight ? 'bg-white border-slate-300' : 'bg-[#121212] border-[#33312e]'
              }`}>
                <h4 className="text-xs font-bold text-[#d97757] flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Another Account Manually</span>
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Full Name (e.g. Alex Rivera)"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-[#d97757] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1a1a1a] border-[#383633] text-white'
                    }`}
                  />
                  <input
                    type="email"
                    placeholder="Email Address (e.g. yourname@gmail.com)"
                    value={newAccountEmail}
                    onChange={(e) => setNewAccountEmail(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-[#d97757] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1a1a1a] border-[#383633] text-white'
                    }`}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddNewAccountSubmit}
                      disabled={!newAccountName.trim() || !newAccountEmail.trim()}
                      className="flex-1 py-2 bg-[#d97757] hover:bg-[#c86b4c] text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Save & Switch Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAccountBox(false)}
                      className="px-3 py-2 rounded-lg bg-zinc-700/30 hover:bg-zinc-700/50 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Save & Log Out */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="w-full py-3 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-sm font-bold shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isFirstTimeSetup ? 'Start Using Sapphire' : 'Save Profile'}</span>
            </button>

            {/* Logout button (Requested by user: "add logout button too") */}
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isGuestMode
                    ? isLight
                      ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'border-[#383633] bg-[#191817] hover:bg-[#201f1d] text-[#ede8e1]'
                    : 'border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500'
                }`}
              >
                {isGuestMode ? (
                  <>
                    <LogIn className="w-3.5 h-3.5 text-[#d97757]" />
                    <span>Sign In to Account / Register</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Log Out of Sapphire</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
export default UserProfileModal;
