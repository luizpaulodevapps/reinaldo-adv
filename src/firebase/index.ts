
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Inicializa os serviços do Firebase de forma resiliente.
 * Garante que o build e o SSR não quebrem na ausência de chaves,
 * inicializando sempre o app '[DEFAULT]' para satisfazer chamadas globais.
 */
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  // Em ambiente de build ou sem variáveis de ambiente, usamos placeholders 
  // para evitar o erro 'app/no-app' ou 'app/no-options'.
  const config = {
    apiKey: firebaseConfig?.apiKey || "BUILD_TIME_PLACEHOLDER",
    authDomain: firebaseConfig?.authDomain || "placeholder.firebaseapp.com",
    projectId: firebaseConfig?.projectId || "placeholder-project",
    storageBucket: firebaseConfig?.storageBucket || "placeholder.appspot.com",
    messagingSenderId: firebaseConfig?.messagingSenderId || "000000000000",
    appId: firebaseConfig?.appId || "1:000000000000:web:000000000000",
  };

  try {
    const firebaseApp = initializeApp(config);
    return getSdks(firebaseApp);
  } catch (error) {
    console.error("Erro crítico na inicialização do Firebase:", error);
    // Fallback absoluto para não quebrar o build
    const fallbackApp = initializeApp({ apiKey: "none" }, "fallback");
    return getSdks(fallbackApp);
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
