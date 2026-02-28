'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * Inicializa os serviços do Firebase de forma resiliente para ambientes de build (Vercel/CI).
 * Evita o erro 'app/no-options' e garante que a aplicação não trave durante a compilação estática.
 */
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  let firebaseApp;
  
  try {
    // 1. Tenta inicialização automática (específica para Firebase App Hosting)
    firebaseApp = initializeApp();
  } catch (autoInitError) {
    // 2. Fallback para configuração manual via variáveis de ambiente
    // Verifica se temos uma configuração válida antes de inicializar
    if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined") {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      // Durante o build em CI/CD, as variáveis NEXT_PUBLIC podem não estar presentes.
      // Inicializamos com um placeholder para permitir que o Next.js complete o rastreamento de dependências.
      console.warn("Aviso RGMJ: Configuração do Firebase ausente no ambiente de Build. Usando modo de segurança.");
      firebaseApp = initializeApp({
        apiKey: "BUILD_TIME_PLACEHOLDER",
        authDomain: "BUILD_TIME_PLACEHOLDER",
        projectId: "BUILD_TIME_PLACEHOLDER",
        storageBucket: "BUILD_TIME_PLACEHOLDER",
        messagingSenderId: "BUILD_TIME_PLACEHOLDER",
        appId: "BUILD_TIME_PLACEHOLDER"
      });
    }
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
