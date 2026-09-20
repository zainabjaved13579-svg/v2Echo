import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Default configuration provided for Sapphire AI with environment variable overrides
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAAcahVaCssUkvY1MWXaPQOxOSj3qYKGI0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sapphire-85cb0.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sapphire-85cb0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sapphire-85cb0.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "987166331389",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:987166331389:web:05a3e6acd2c4e86de78994",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-V4MMJP671H"
};

// Singleton initialization
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
