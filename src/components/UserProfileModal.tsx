import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Check,
  Upload,
  Sparkles,
  Camera,
  Smile
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  saveUserProfile,
  ANIMATED_AVATARS,
  getInitialsAvatar
} from '../services/userService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  isFirstTimeSetup?: boolean;
  sessions?: any[];
  files?: any[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  isFirstTimeSetup = false
}) => {
  const [name, setName] = useState(profile.name && profile.name !== 'Guest User' ? profile.name : '');
  const [avatar, setAvatar] = useState(profile.avatar || ANIMATED_AVATARS[0].url);
  const [filter, setFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile.name && profile.name !== 'Guest User' ? profile.name : '');
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
        avatar: avatar || getInitialsAvatar(cleanName),
        lastSyncedAt: Date.now()
      };

      const saved = await saveUserProfile(updated);
      onUpdateProfile(saved);
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAvatars =
    filter === 'all'
      ? ANIMATED_AVATARS
      : ANIMATED_AVATARS.filter((a) => a.type === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                {isFirstTimeSetup ? 'Welcome to Echo AI' : 'Profile Settings'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isFirstTimeSetup
                  ? 'Set up your name and choose a character avatar'
                  : 'Update your display name and character'}
              </p>
            </div>
          </div>
          {!isFirstTimeSetup && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5">
          {/* Active Preview */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl overflow-hidden border-2 border-indigo-500 shadow-md bg-white p-1">
                <img
                  src={avatar}
                  alt={name || 'User Avatar'}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
                title="Upload custom image"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-700">
              {name.trim() || 'Your Character'}
            </p>
          </div>

          {/* Name Field (ONLY NAME) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Enter Your Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zainab, Ali, Alex..."
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-2xs"
            />
          </div>

          {/* Character Avatars Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Choose Animated Character
              </label>
              {/* Category Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    filter === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('boy')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    filter === 'boy' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Boy 👦
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('girl')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    filter === 'girl' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
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
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-200 scale-105'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white p-0.5">
                      <img src={av.url} alt={av.name} className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 mt-1 truncate w-full text-center">
                      {av.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Custom Picture Option */}
          <div className="pt-1">
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
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Picture from Device</span>
            </button>
            {uploadError && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 text-center">{uploadError}</p>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isFirstTimeSetup ? 'Start Using Echo AI' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
