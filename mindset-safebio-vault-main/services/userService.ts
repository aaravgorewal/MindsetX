import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from './firebase';
import { UserProfile, MoodLogEntry, SDoHHistoryEntry, BookingEntry } from '../types';

/**
 * Reads users/{uid} from Firestore.
 * Returns null if the document does not exist.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) return null;
  const userDocRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

/**
 * Checks if users/{uid} exists; if not, creates it with default profile values.
 * Returns the existing or newly created UserProfile.
 */
export const createUserProfileIfMissing = async (
  user: FirebaseUser
): Promise<UserProfile> => {
  const userDocRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) {
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || null,
      email: user.email || null,
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      onboardingComplete: false,
      preferredLanguage: 'hinglish',
    };
    await setDoc(userDocRef, newProfile);
    return newProfile;
  }

  return docSnap.data() as UserProfile;
};

/**
 * Merges fields into the existing users/{uid} document using { merge: true }.
 */
export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  if (!uid) return;
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, data, { merge: true });
};

/**
 * Formats a Date as YYYY-MM-DD in local time.
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Logs a mood entry to Firestore at users/{uid}/moodLog/{date}.
 * Overwrites the day's record if called multiple times on the same date.
 */
export const logUserMood = async (
  uid: string,
  moodScore: number,
  dateStr?: string
): Promise<void> => {
  if (!uid) return;
  const targetDate = dateStr || getLocalDateString();
  const moodDocRef = doc(db, 'users', uid, 'moodLog', targetDate);
  await setDoc(
    moodDocRef,
    {
      date: targetDate,
      moodScore,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Reads all mood logs for a user from users/{uid}/moodLog.
 * Returns a map of date string (YYYY-MM-DD) -> MoodLogEntry.
 */
export const getRecentMoodLogs = async (
  uid: string
): Promise<Record<string, MoodLogEntry>> => {
  const result: Record<string, MoodLogEntry> = {};
  if (!uid) return result;

  try {
    const moodColRef = collection(db, 'users', uid, 'moodLog');
    const snap = await getDocs(moodColRef);
    snap.forEach((docSnap) => {
      const data = docSnap.data() as MoodLogEntry;
      if (data && data.date) {
        result[data.date] = data;
      }
    });
  } catch (err) {
    console.error('Failed to fetch mood logs from Firestore:', err);
  }

  return result;
};

/**
 * Saves an SDoH analysis result to users/{uid}/sdohHistory.
 */
export const saveSDoHResult = async (
  uid: string,
  data: { riskScore: number; summary: string; groundingUrls: string[] }
): Promise<void> => {
  if (!uid) return;
  try {
    const sdohColRef = collection(db, 'users', uid, 'sdohHistory');
    await addDoc(sdohColRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save SDoH result to Firestore:', err);
  }
};

/**
 * Queries users/{uid}/sdohHistory ordered by createdAt desc, limit 1.
 * Returns the latest SDoHHistoryEntry or null if none exists.
 */
export const getLatestSDoHResult = async (
  uid: string
): Promise<SDoHHistoryEntry | null> => {
  if (!uid) return null;
  try {
    const sdohColRef = collection(db, 'users', uid, 'sdohHistory');
    try {
      const q = query(sdohColRef, orderBy('createdAt', 'desc'), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...(docSnap.data() as SDoHHistoryEntry) };
      }
    } catch (orderErr) {
      // Fallback: fetch docs and sort client-side in case index is creating
      const snap = await getDocs(sdohColRef);
      if (!snap.empty) {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as SDoHHistoryEntry),
        }));
        docs.sort((a, b) => {
          const aTime =
            a.createdAt?.toMillis?.() ||
            (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const bTime =
            b.createdAt?.toMillis?.() ||
            (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return bTime - aTime;
        });
        return docs[0] || null;
      }
    }
  } catch (err) {
    console.error('Failed to fetch latest SDoH result from Firestore:', err);
  }
  return null;
};

/**
 * Saves a confirmed booking to users/{uid}/bookings/{autoId}.
 */
export const saveUserBooking = async (
  uid: string,
  booking: {
    specialistName: string;
    specialistRole: string;
    dateTime: string;
    status?: 'upcoming' | 'completed' | 'cancelled';
  }
): Promise<string | null> => {
  if (!uid) return null;
  try {
    const bookingsColRef = collection(db, 'users', uid, 'bookings');
    const docRef = await addDoc(bookingsColRef, {
      specialistName: booking.specialistName,
      specialistRole: booking.specialistRole,
      dateTime: booking.dateTime,
      status: booking.status || 'upcoming',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error('Failed to save booking to Firestore:', err);
    return null;
  }
};

/**
 * Queries users/{uid}/bookings where status == 'upcoming' and dateTime >= now (ISO string),
 * ordered by dateTime asc, limit 1.
 * Gracefully falls back to client-side filtering if Firestore compound index is pending.
 */
export const getUpcomingBooking = async (
  uid: string
): Promise<BookingEntry | null> => {
  if (!uid) return null;
  // Grace window: include sessions that started up to 30 mins ago so ongoing sessions remain visible
  const cutoffIso = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  try {
    const bookingsColRef = collection(db, 'users', uid, 'bookings');
    try {
      const q = query(
        bookingsColRef,
        where('status', '==', 'upcoming'),
        where('dateTime', '>=', cutoffIso),
        orderBy('dateTime', 'asc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...(docSnap.data() as BookingEntry) };
      }
      return null;
    } catch (queryErr) {
      console.warn('Compound index query failed, using client sort fallback:', queryErr);
      const fallbackQ = query(bookingsColRef, where('status', '==', 'upcoming'));
      const snap = await getDocs(fallbackQ);
      const valid: BookingEntry[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as BookingEntry;
        if (data && data.dateTime && data.dateTime >= cutoffIso) {
          valid.push({ id: docSnap.id, ...data });
        }
      });
      valid.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      return valid[0] || null;
    }
  } catch (err) {
    console.error('Failed to fetch upcoming booking from Firestore:', err);
  }
  return null;
};
