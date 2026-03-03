
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Inicializa os serviços do Firebase de forma resiliente.
 * Garante que o build e o SSR não quebrem na ausência de chaves reais.
 */
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  const hasValidConfig = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "BUILD_TIME_PLACEHOLDER" &&
    !firebaseConfig.apiKey.includes("YOUR_");

  if (!hasValidConfig) {
    return {
      firebaseApp: null,
      auth: null,
      firestore: null
    };
  }

  try {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  } catch (error) {
    console.error("Erro na inicialização do Firebase:", error);
    return {
      firebaseApp: null,
      auth: null,
      firestore: null
    };
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
