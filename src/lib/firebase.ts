// src/lib/firebase.ts
// ─── Firebase App initialization for EduNetwork (koinexa project) ───

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyDkkSI1Io6Vu-6jkrMYxa45hELYhmYYgNY',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'koinexa-392d0.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'koinexa-392d0',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'koinexa-392d0.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '267177354478',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:267177354478:web:c52e16ead52906ddd0bfff',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || 'G-302H8QHXTB',
};

// Prevent re-initialisation during hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// Analytics only in browser (not SSR)
if (typeof window !== 'undefined') {
  try { getAnalytics(app); } catch { /* ignore */ }
}
