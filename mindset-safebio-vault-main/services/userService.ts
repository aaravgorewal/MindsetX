import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from './firebase';
import { UserProfile } from '../types';

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
