'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Inicializa os serviços do Firebase de forma resiliente.
 * Garante que o build e o SSR não quebrem na ausência de chaves.
 */
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  const apiKey = firebaseConfig?.apiKey;
  const isConfigValid = !!apiKey && 
                        apiKey !== "undefined" && 
                        apiKey !== "" &&
                        !apiKey.startsWith("NEXT_PUBLIC");

  if (!isConfigValid) {
    // Retorna SDKs dummy para evitar quebra de contexto durante Build/SSR
    const dummyApp = createDummyApp();
    return getSdks(dummyApp);
  }

  try {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  } catch (error) {
    console.error("Erro crítico na inicialização do Firebase:", error);
    return getSdks(createDummyApp());
  }
}

function createDummyApp() {
  return initializeApp({
    apiKey: "BUILD_TIME_PLACEHOLDER",
    authDomain: "BUILD_TIME_PLACEHOLDER",
    projectId: "nextn-placeholder",
    storageBucket: "BUILD_TIME_PLACEHOLDER",
    messagingSenderId: "BUILD_TIME_PLACEHOLDER",
    appId: "BUILD_TIME_PLACEHOLDER"
  }, "dummy-app");
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
