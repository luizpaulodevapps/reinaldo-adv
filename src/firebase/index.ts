
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Inicializa os serviços do Firebase de forma resiliente.
 * Se as variáveis de ambiente não estiverem disponíveis (como no build time),
 * utiliza uma configuração dummy para não travar a compilação.
 */
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  let firebaseApp: FirebaseApp;
  
  const isConfigValid = firebaseConfig && 
                        firebaseConfig.apiKey && 
                        firebaseConfig.apiKey !== "undefined" &&
                        !firebaseConfig.apiKey.startsWith("NEXT_PUBLIC");

  if (isConfigValid) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    // Modo de Build Seguro: Evita erro 'app/no-options' durante a geração estática
    firebaseApp = initializeApp({
      apiKey: "BUILD_TIME_PLACEHOLDER",
      authDomain: "BUILD_TIME_PLACEHOLDER",
      projectId: "BUILD_TIME_PLACEHOLDER",
      storageBucket: "BUILD_TIME_PLACEHOLDER",
      messagingSenderId: "BUILD_TIME_PLACEHOLDER",
      appId: "BUILD_TIME_PLACEHOLDER"
    });
  }

  return getSdks(firebaseApp);
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
