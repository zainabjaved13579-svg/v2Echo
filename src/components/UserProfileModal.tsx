import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Upload,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#201f1d] border border-[#33312e] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh] text-[#ede8e1]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2a2926] flex items-center justify-between bg-[#191817]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#282724] border border-[#383633] text-[#d97757] flex items-center justify-center shadow-xs">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#f5f2eb] leading-tight">
                {isFirstTimeSetup ? 'Welcome to Sapphire' : 'Profile Settings'}
              </h3>
              <p className="text-xs text-[#86837c]">
                {isFirstTimeSetup
                  ? 'Set up your name and choose your avatar'
                  : 'Update your display name and character'}
              </p>
            </div>
          </div>
          {!isFirstTimeSetup && (
            <button
              onClick={onClose}
              className="p-1.5 text-[#86837c] hover:text-[#ede8e1] hover:bg-[#282724] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5">
          {/* Active Preview - Square with soft rounded edges */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-[#d97757] shadow-md bg-[#282724] p-1">
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
            <p className="mt-2 text-xs font-semibold text-[#ede8e1]">
              {name.trim() || 'Your Profile'}
            </p>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-[#86837c] uppercase tracking-wider mb-1.5">
              Enter Your Name <span className="text-[#d97757]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex, Sam, Dev..."
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-[#33312e] bg-[#191817] text-sm font-medium text-[#ede8e1] focus:outline-none focus:border-[#d97757]"
            />
          </div>

          {/* Character Avatars Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#86837c] uppercase tracking-wider">
                Choose Avatar
              </label>
              {/* Category Filter */}
              <div className="flex items-center gap-1 bg-[#191817] p-0.5 rounded-lg text-[11px] font-medium border border-[#2a2926]">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    filter === 'all' ? 'bg-[#282724] text-[#ede8e1] shadow-xs' : 'text-[#86837c] hover:text-[#ede8e1]'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('boy')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    filter === 'boy' ? 'bg-[#282724] text-[#ede8e1] shadow-xs' : 'text-[#86837c] hover:text-[#ede8e1]'
                  }`}
                >
                  Boy 👦
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('girl')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    filter === 'girl' ? 'bg-[#282724] text-[#ede8e1] shadow-xs' : 'text-[#86837c] hover:text-[#ede8e1]'
                  }`}
                >
                  Girl 👧
                </button>
              </div>
            </div>

            {/* Avatars Grid - Square with soft edges */}
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
                        ? 'border-[#d97757] bg-[#282724] ring-1 ring-[#d97757]/40 scale-102'
                        : 'border-[#2a2926] bg-[#191817] hover:border-[#383633] hover:bg-[#201f1d]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#201f1d] p-0.5">
                      <img src={av.url} alt={av.name} className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <span className="text-[10px] font-medium text-[#86837c] mt-1 truncate w-full text-center">
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
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#383633] hover:border-[#d97757] bg-[#191817] hover:bg-[#282724] text-[#ede8e1] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#d97757]" />
              <span>Upload Picture from Device</span>
            </button>
            {uploadError && (
              <p className="text-[11px] text-rose-400 font-medium mt-1 text-center">{uploadError}</p>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="w-full py-3 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-sm font-bold shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isFirstTimeSetup ? 'Start Using Sapphire' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default UserProfileModal;
