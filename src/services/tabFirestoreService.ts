import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { ChatSession } from '../types';

export interface TabData {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  personaId?: string;
  messagesCount?: number;
}

// Collection reference helper for a given user
function getTabsCollection(userId: string) {
  return collection(db, 'users', userId, 'tabs');
}

/**
 * Save / sync a tab/session to Firestore
 */
export async function syncTabToFirestore(userId: string, session: ChatSession): Promise<void> {
  if (!userId) return;
  try {
    const tabRef = doc(db, 'users', userId, 'tabs', session.id);
    const tabPayload = {
      id: session.id,
      title: session.title || 'New Chat',
      createdAt: session.createdAt || Date.now(),
      updatedAt: Date.now(),
      personaId: session.personaId || 'general',
      model: session.model || 'sapphire-3.7-flash',
      messagesCount: session.messages ? session.messages.length : 0
    };
    await setDoc(tabRef, tabPayload, { merge: true });
  } catch (err) {
    console.warn('Firestore tab sync notice (offline or rules):', err);
  }
}

/**
 * Delete a tab from Firestore
 */
export async function deleteTabFromFirestore(userId: string, tabId: string): Promise<void> {
  if (!userId || !tabId) return;
  try {
    const tabRef = doc(db, 'users', userId, 'tabs', tabId);
    await deleteDoc(tabRef);
  } catch (err) {
    console.warn('Firestore tab deletion notice:', err);
  }
}

/**
 * Fetch all tabs for a user from Firestore
 */
export async function fetchUserTabsFromFirestore(userId: string): Promise<TabData[]> {
  if (!userId) return [];
  try {
    const q = query(getTabsCollection(userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const tabs: TabData[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      tabs.push({
        id: data.id || d.id,
        title: data.title || 'New Chat',
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        personaId: data.personaId,
        messagesCount: data.messagesCount || 0
      });
    });
    return tabs;
  } catch (err) {
    console.warn('Failed to fetch tabs from Firestore:', err);
    return [];
  }
}
