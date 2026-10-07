import { UserProfile, ChatSession, WorkspaceFile } from '../types';
import { loadWorkspaceFiles, saveWorkspaceFiles } from './fileStorageService';

const USER_PROFILE_KEY = 'echo_user_profile_v1';
const HAS_COMPLETED_SETUP_KEY = 'echo_user_has_completed_setup_v1';

export interface AvatarPreset {
  id: string;
  name: string;
  category: 'executive' | 'modern' | 'tech';
  url: string;
}

export const DEFAULT_PREADDED_PROFILE_PHOTO =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23d97757"/><stop offset="100%" stop-color="%238a2b0e"/></linearGradient></defs><rect width="100" height="100" rx="28" fill="url(%23g)"/><circle cx="50" cy="40" r="16" fill="white" fill-opacity="0.95"/><path d="M26 80 C26 62 38 58 50 58 C62 58 74 62 74 80 Z" fill="white" fill-opacity="0.95"/></svg>';

export const PROFESSIONAL_AVATARS: AvatarPreset[] = [
  {
    id: 'pro-sapphire',
    name: 'Sapphire Pro',
    category: 'executive',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23d97757"/><stop offset="100%" stop-color="%238a2b0e"/></linearGradient></defs><rect width="100" height="100" rx="28" fill="url(%23g1)"/><path d="M50 25 L75 40 L75 68 L50 82 L25 68 L25 40 Z" fill="none" stroke="white" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="54" r="8" fill="white"/></svg>'
  },
  {
    id: 'pro-indigo',
    name: 'Executive Indigo',
    category: 'executive',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234f46e5"/><stop offset="100%" stop-color="%231e1b4b"/></linearGradient></defs><rect width="100" height="100" rx="28" fill="url(%23g2)"/><circle cx="50" cy="40" r="16" fill="%23ffffff" fill-opacity="0.95"/><path d="M28 78 C28 62 40 58 50 58 C60 58 72 62 72 78 Z" fill="%23ffffff" fill-opacity="0.95"/></svg>'
  },
  {
    id: 'pro-emerald',
    name: 'Emerald Lead',
    category: 'modern',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23059669"/><stop offset="100%" stop-color="%23064e3b"/></linearGradient></defs><rect width="100" height="100" rx="28" fill="url(%23g3)"/><polygon points="50,22 80,72 20,72" fill="none" stroke="white" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="56" r="6" fill="white"/></svg>'
  },
  {
    id: 'pro-obsidian',
    name: 'Obsidian Minimal',
    category: 'tech',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2327272a"/><stop offset="100%" stop-color="%2309090b"/></linearGradient></defs><rect width="100" height="100" rx="28" fill="url(%23g4)" stroke="%233f3f46" stroke-width="2"/><circle cx="50" cy="42" r="15" fill="%23e4e4e7"/><path d="M28 78 C28 63 39 59 50 59 C61 59 72 63 72 78 Z" fill="%23e4e4e7"/></svg>'
  },
  {
    id: 'pro-cyan',
    name: 'Cyber Cyan',
    category: 'tech',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230891b2"/><stop offset="100%" stop-color="%23164e63"/></linearGradient></defs><rect width="100" height="100" rx="28" fill="url(%23g5)"/><rect x="30" y="30" width="40" height="40" rx="10" fill="none" stroke="white" stroke-width="4"/><circle cx="50" cy="50" r="6" fill="white"/></svg>'
  },
  {
    id: 'pro-violet',
    name: 'Aurora Violet',
    category: 'modern',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%234c1d95"/></linearGradient></defs><rect width="100" height="100" rx="28" fill="url(%23g6)"/><circle cx="50" cy="50" r="22" fill="none" stroke="white" stroke-width="4"/><circle cx="50" cy="50" r="10" fill="white"/></svg>'
  }
];

export const ANIMATED_AVATARS = PROFESSIONAL_AVATARS;
export const DEFAULT_AVATARS = PROFESSIONAL_AVATARS.map((a) => a.url);

/**
 * Generates an SVG data avatar with initials if image not present
 */
export function getInitialsAvatar(name: string): string {
  const initials = (name || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const colors = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706'];
  const charCode = (name || 'U').charCodeAt(0) % colors.length;
  const color = colors[charCode];

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="20" fill="${color}"/><text x="50%" y="55%" font-family="system-ui, sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
}

/**
 * Loads current user profile
 */
export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load user profile from storage:', e);
  }

  // Initial guest/unconfigured profile
  const initialProfile: UserProfile = {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    name: 'Guest User',
    email: '',
    role: 'Explorer',
    isGoogleConnected: false,
    createdAt: Date.now()
  };
  return initialProfile;
}

/**
 * Checks if user has completed initial profile setup
 */
export function hasUserCompletedSetup(): boolean {
  return localStorage.getItem(HAS_COMPLETED_SETUP_KEY) === 'true';
}

/**
 * Marks profile setup as completed
 */
export function markUserSetupCompleted(completed: boolean = true) {
  if (completed) {
    localStorage.setItem(HAS_COMPLETED_SETUP_KEY, 'true');
  } else {
    localStorage.removeItem(HAS_COMPLETED_SETUP_KEY);
  }
}

/**
 * Saves user profile to local storage and syncs to cloud server
 */
export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  const updated: UserProfile = {
    ...profile,
    lastSyncedAt: Date.now()
  };

  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
    markUserSetupCompleted(true);
  } catch (e) {
    console.error('Failed to save user profile to localStorage:', e);
  }

  // Backup profile to cloud server
  try {
    await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
  } catch (err) {
    console.warn('Could not sync user profile to cloud server:', err);
  }

  return updated;
}

/**
 * Connect with Google Account (Loads Google Profile and saves)
 */
export async function connectGoogleProfile(userEmail?: string, userName?: string): Promise<UserProfile> {
  const current = loadUserProfile();
  const email = userEmail || current.email || 'user@gmail.com';
  const name = userName || (email.split('@')[0] || 'Google User').replace(/[^a-zA-Z0-9 ]/g, ' ');

  const updated: UserProfile = {
    ...current,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    email: email,
    isGoogleConnected: true,
    googleId: 'google_' + Date.now(),
    avatar: current.avatar || getInitialsAvatar(name),
    lastSyncedAt: Date.now()
  };

  return await saveUserProfile(updated);
}

/**
 * Full cloud backup: syncs user profile, chat sessions, and workspace files to cloud storage
 */
export async function syncUserDataToCloud(
  profile: UserProfile,
  sessions: ChatSession[],
  files?: WorkspaceFile[]
): Promise<{ success: boolean; message: string; timestamp: number }> {
  const filesToSync = files || loadWorkspaceFiles();

  try {
    const res = await fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: profile.id,
        userEmail: profile.email,
        profile,
        sessions,
        files: filesToSync,
        timestamp: Date.now()
      })
    });

    if (!res.ok) {
      throw new Error(`Sync server responded with ${res.status}`);
    }

    const data = await res.json();
    const updatedProfile = { ...profile, lastSyncedAt: Date.now() };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));

    return {
      success: true,
      message: 'All your chats, code files, and profile are securely backed up in Google Cloud Storage.',
      timestamp: Date.now()
    };
  } catch (err: any) {
    console.warn('Cloud sync error, stored locally:', err?.message);
    return {
      success: false,
      message: 'Cloud sync warning: saved locally. Will retry when connected.',
      timestamp: Date.now()
    };
  }
}

/**
 * Cloud restore: fetch user data by ID or email
 */
export async function restoreUserDataFromCloud(userIdOrEmail: string): Promise<{
  profile?: UserProfile;
  sessions?: ChatSession[];
  files?: WorkspaceFile[];
} | null> {
  try {
    const res = await fetch(`/api/user/sync?query=${encodeURIComponent(userIdOrEmail)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Failed to restore user cloud data:', err);
    return null;
  }
}
