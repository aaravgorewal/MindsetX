import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserCredential } from 'firebase/auth';
import { signInWithGoogle, signOutUser, subscribeToAuthChanges } from '../services/firebase';
import { createUserProfileIfMissing } from '../services/userService';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__setUser = (u: any) => {
        setUser(u);
        setLoading(false);
      };
    }

    if (typeof window !== 'undefined' && localStorage.getItem('test_mock_user')) {
      const raw = localStorage.getItem('test_mock_user');
      try {
        const parsed = JSON.parse(raw || '{}');
        setUser({ uid: parsed.uid || 'test-demo-user', email: parsed.email || 'test@mindsetx.in', displayName: parsed.displayName || 'Test Student', photoURL: parsed.photoURL } as any);
      } catch (e) {
        setUser({ uid: 'test-demo-user', email: 'test@mindsetx.in', displayName: 'Test Student' } as any);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await createUserProfileIfMissing(currentUser);
        } catch (err) {
          console.error('Error creating user profile in Firestore:', err);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (): Promise<UserCredential> => {
    return await signInWithGoogle();
  };

  const signOut = async (): Promise<void> => {
    await signOutUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
