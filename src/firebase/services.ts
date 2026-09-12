import { 
  collection, doc, setDoc, getDocs, onSnapshot, updateDoc, 
  query, orderBy, getDoc, Unsubscribe 
} from 'firebase/firestore';
import { db, isInitialized, ensureFirebaseAuth } from './config';
import { SeniorProfile, Companion, Booking, AppNotification } from '../types';
import { INITIAL_SENIORS, INITIAL_COMPANIONS, INITIAL_BOOKINGS, INITIAL_NOTIFICATIONS } from '../data/mockData';

const SENIORS_COLLECTION = 'seniors';
const COMPANIONS_COLLECTION = 'companions';
const BOOKINGS_COLLECTION = 'bookings';
const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Initializes and seeds Firestore with initial demo companions, seniors, and visits
 * if the database is newly provisioned.
 */
export async function seedInitialFirestoreData(): Promise<void> {
  if (!isInitialized || !db) return;
  try {
    await ensureFirebaseAuth();
    
    // Ensure all seniors exist in Firestore
    for (const senior of INITIAL_SENIORS) {
      const seniorDocRef = doc(db, SENIORS_COLLECTION, senior.id);
      const snap = await getDoc(seniorDocRef);
      if (!snap.exists()) {
        await setDoc(seniorDocRef, senior);
      }
    }

    // Ensure all companions (including new test users) exist in Firestore
    for (const companion of INITIAL_COMPANIONS) {
      const compDocRef = doc(db, COMPANIONS_COLLECTION, companion.id);
      const snap = await getDoc(compDocRef);
      if (!snap.exists()) {
        await setDoc(compDocRef, companion);
      }
    }

    // Check if bookings exist
    const bookingsSnap = await getDocs(collection(db, BOOKINGS_COLLECTION));
    if (bookingsSnap.empty) {
      for (const booking of INITIAL_BOOKINGS) {
        await setDoc(doc(db, BOOKINGS_COLLECTION, booking.id), booking);
      }
    }

    // Check if notifications exist
    const notifsSnap = await getDocs(collection(db, NOTIFICATIONS_COLLECTION));
    if (notifsSnap.empty) {
      for (const notif of INITIAL_NOTIFICATIONS) {
        await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notif.id), notif);
      }
    }
  } catch (error) {
    console.warn('Notice seeding Firestore (will operate with local state):', error);
  }
}

/**
 * Real-time listener for Seniors collection
 */
export function subscribeSeniors(
  onSuccess: (seniors: SeniorProfile[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  if (!isInitialized || !db) return null;
  try {
    const colRef = collection(db, SENIORS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as SeniorProfile);
        onSuccess(items);
      }
    }, (err) => {
      console.warn('Seniors Firestore subscription error:', err);
      onError?.(err);
    });
  } catch (err) {
    console.warn('Failed to subscribe to seniors:', err);
    return null;
  }
}

/**
 * Real-time listener for Bookings collection
 */
export function subscribeBookings(
  onSuccess: (bookings: Booking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  if (!isInitialized || !db) return null;
  try {
    const colRef = collection(db, BOOKINGS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as Booking);
        onSuccess(items);
      }
    }, (err) => {
      console.warn('Bookings Firestore subscription error:', err);
      onError?.(err);
    });
  } catch (err) {
    console.warn('Failed to subscribe to bookings:', err);
    return null;
  }
}

/**
 * Real-time listener for Companions collection
 */
export function subscribeCompanions(
  onSuccess: (companions: Companion[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  if (!isInitialized || !db) return null;
  try {
    const colRef = collection(db, COMPANIONS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as Companion);
        onSuccess(items);
      }
    }, (err) => {
      console.warn('Companions Firestore subscription error:', err);
      onError?.(err);
    });
  } catch (err) {
    console.warn('Failed to subscribe to companions:', err);
    return null;
  }
}

/**
 * Real-time listener for Notifications
 */
export function subscribeNotifications(
  onSuccess: (notifs: AppNotification[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  if (!isInitialized || !db) return null;
  try {
    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => d.data() as AppNotification);
        onSuccess(items);
      }
    }, (err) => {
      console.warn('Notifications subscription error:', err);
      onError?.(err);
    });
  } catch (err) {
    console.warn('Failed to subscribe to notifications:', err);
    return null;
  }
}

/**
 * Save or update a booking in Firestore
 */
export async function persistBooking(booking: Booking): Promise<void> {
  if (!isInitialized || !db) return;
  try {
    await setDoc(doc(db, BOOKINGS_COLLECTION, booking.id), booking, { merge: true });
  } catch (err) {
    console.warn('Failed to persist booking to Firestore:', err);
  }
}

/**
 * Save or update a Senior Profile in Firestore
 */
export async function persistSeniorProfile(senior: SeniorProfile): Promise<void> {
  if (!isInitialized || !db) return;
  try {
    await setDoc(doc(db, SENIORS_COLLECTION, senior.id), senior, { merge: true });
  } catch (err) {
    console.warn('Failed to persist senior profile to Firestore:', err);
  }
}

/**
 * Update Companion Rate or Availability in Firestore
 */
export async function persistCompanion(companion: Companion): Promise<void> {
  if (!isInitialized || !db) return;
  try {
    await setDoc(doc(db, COMPANIONS_COLLECTION, companion.id), companion, { merge: true });
  } catch (err) {
    console.warn('Failed to persist companion to Firestore:', err);
  }
}

/**
 * Save notification to Firestore
 */
export async function persistNotification(notification: AppNotification): Promise<void> {
  if (!isInitialized || !db) return;
  try {
    await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notification.id), notification, { merge: true });
  } catch (err) {
    console.warn('Failed to persist notification to Firestore:', err);
  }
}

/**
 * Save or update FCM Device Token in Firestore
 */
export async function persistFcmTokenToFirestore(
  token: string,
  metadata: { device: string; userId: string; registeredAt: string; permission?: string }
): Promise<void> {
  if (!isInitialized || !db) return;
  try {
    // Hash or normalize token string for document key
    const docId = token.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 48) || 'fcm_token_default';
    await setDoc(doc(db, 'fcmTokens', docId), {
      token,
      ...metadata,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Notice saving FCM token to Firestore:', err);
  }
}

