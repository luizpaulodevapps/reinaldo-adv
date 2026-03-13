
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  profile: any | null;
  role: string | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  profile: any | null;
  role: string | null;
  setProfile: (profile: any) => void;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  profile: any | null;
  role: string | null;
  setProfile: (profile: any) => void;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  profile: any | null;
  role: string | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
    profile: null,
    role: null,
  });

  const OWNERS = [
    'luizao16@gmail.com', 
    'luizpaulo.dev.apps@gmail.com', 
    'rgmj.adv@gmail.com',
    'reinaldo.g.m.dejesus@gmail.com'
  ];

  const setProfile = (profile: any) => {
    setUserAuthState(prev => {
      const isOwner = OWNERS.includes(prev.user?.email || '') || profile?.isOwner;
      return { 
        ...prev, 
        profile, 
        role: isOwner ? 'admin' : (profile?.role || null)
      };
    });
  };

  useEffect(() => {
    if (!auth) {
      setUserAuthState(prev => ({ ...prev, isUserLoading: false }));
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        const isOwner = OWNERS.includes(firebaseUser?.email || '');
        setUserAuthState(prev => ({ 
          ...prev, 
          user: firebaseUser, 
          isUserLoading: false, 
          userError: null,
          role: isOwner ? 'admin' : prev.role
        }));
      },
      (error) => {
        console.error("FirebaseProvider error:", error);
        setUserAuthState(prev => ({ ...prev, user: null, isUserLoading: false, userError: error }));
      }
    );
    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp,
      firestore,
      auth,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      profile: userAuthState.profile,
      role: userAuthState.role,
      setProfile,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    profile: context.profile,
    role: context.role,
    setProfile: context.setProfile,
  };
};

export const useAuth = (): Auth | null => {
  const fb = useFirebase();
  return fb.auth;
}

export const useFirestore = (): Firestore | null => {
  const fb = useFirebase();
  return fb.firestore;
}

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}

export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  if (!context) return { user: null, isUserLoading: true, userError: null, profile: null, role: null };
  const { user, isUserLoading, userError, profile, role } = context;
  return { user, isUserLoading, userError, profile, role };
};
