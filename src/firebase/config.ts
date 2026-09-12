import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let isInitialized = false;

try {
  const firebaseConfig = {
    apiKey: firebaseConfigJson.apiKey,
    authDomain: firebaseConfigJson.authDomain,
    projectId: firebaseConfigJson.projectId,
    storageBucket: firebaseConfigJson.storageBucket,
    messagingSenderId: firebaseConfigJson.messagingSenderId,
    appId: firebaseConfigJson.appId,
  };

  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);

  // If a specific firestore databaseId is configured in the project, use it
  const configObj = firebaseConfigJson as Record<string, unknown>;
  const customDbId = typeof configObj.firestoreDatabaseId === 'string' ? configObj.firestoreDatabaseId : undefined;
  const databaseId = customDbId && customDbId !== '(default)'
    ? customDbId
    : undefined;

  db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  isInitialized = true;
} catch (error) {
  console.warn('Firebase initialization notice (falling back to resilient offline mode if needed):', error);
}

export { app, auth, db, isInitialized };

/**
 * Ensures an active Firebase Auth session anonymously or retrieves current user
 */
export async function ensureFirebaseAuth(): Promise<User | null> {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous sign-in skipped or offline:', err);
    return null;
  }
}
