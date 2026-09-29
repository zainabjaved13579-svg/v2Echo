import {
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export interface SapphireUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  provider: 'google';
  createdAt: number;
}

const CURRENT_USER_KEY = 'sapphire_current_active_user_v1';

/**
 * Sign in using official Google OAuth
 */
export async function signInWithGoogle(): Promise<SapphireUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      const u: SapphireUser = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'User',
        photoURL: result.user.photoURL || undefined,
        emailVerified: true,
        provider: 'google',
        createdAt: Date.now()
      };
      saveActiveUser(u);
      return u;
    }
    throw new Error('Google sign-in did not return user details.');
  } catch (err: any) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, googleProvider);
    }
    throw err;
  }
}

/**
 * Get active user from storage if available
 */
export function getStoredActiveUser(): SapphireUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export function saveActiveUser(user: SapphireUser | null) {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch {}
}

/**
 * Sign out user completely
 */
export async function signOutUser() {
  saveActiveUser(null);
  try {
    await fbSignOut(auth);
  } catch {}
}

/**
 * Clears corrupted cache, cookies, and local session stores (Self-healing tool)
 */
export function clearAllCorruptCache() {
  try {
    const keysToRemove = [
      'sapphire_ai_chat_sessions_v1',
      'sapphire_ai_chat_settings_v1',
      'sapphire_ai_chat_current_session_id',
      'echo_chat_sessions_v1',
      'sapphire_chat_sessions_v2',
      'echo_active_session_id',
      'echo_user_profile_v1',
      'gemini_ai_chat_sessions_v1',
      'gemini_ai_chat_current_session_id',
      'sapphire_guest_mode',
      'sapphire_guest_sessions'
    ];
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
    sessionStorage.clear();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      });
    }
  } catch {}
}
