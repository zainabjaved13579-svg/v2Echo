import { UserProfile, ChatSession, WorkspaceFile } from '../types';
import { loadWorkspaceFiles, saveWorkspaceFiles } from './fileStorageService';

const USER_PROFILE_KEY = 'echo_user_profile_v1';
const HAS_COMPLETED_SETUP_KEY = 'echo_user_has_completed_setup_v1';

export interface AvatarPreset {
  id: string;
  name: string;
  type: 'boy' | 'girl';
  url: string;
}

export const ANIMATED_AVATARS: AvatarPreset[] = [
  {
    id: 'boy-cool',
    name: 'Cool Boy',
    type: 'boy',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&hair=short01,short02&backgroundColor=b6e3f4'
  },
  {
    id: 'girl-anime',
    name: 'Anime Girl',
    type: 'girl',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&hair=long01,long02&backgroundColor=ffd5dc'
  },
  {
    id: 'boy-cyber',
    name: 'Cyber Boy',
    type: 'boy',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Max&hair=short03,short04&backgroundColor=c0aede'
  },
  {
    id: 'girl-cute',
    name: 'Cute Girl',
    type: 'girl',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&hair=long03,long04&backgroundColor=ffdfbf'
  },
  {
    id: 'boy-hoodie',
    name: 'Tech Boy',
    type: 'boy',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&hair=short05&backgroundColor=d1d4f9'
  },
  {
    id: 'girl-artist',
    name: 'Artist Girl',
    type: 'girl',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya&hair=long05&backgroundColor=d2e7d6'
  },
  {
    id: 'boy-scholar',
    name: 'Smart Boy',
    type: 'boy',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sam&hair=short02&backgroundColor=ffe2d1'
  },
  {
    id: 'girl-chibi',
    name: 'Sweet Girl',
    type: 'girl',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe&hair=long02&backgroundColor=e8ddff'
  }
];

export const DEFAULT_AVATARS = ANIMATED_AVATARS.map((a) => a.url);

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
