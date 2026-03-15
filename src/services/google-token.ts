'use client';

import { Auth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const TOKEN_KEY = 'google_access_token';
const EXPIRY_KEY = 'google_token_expiry';

/** Margem de segurança: renova 5 minutos antes de expirar */
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

/**
 * Salva o token Google e sua expiração no localStorage.
 * O token do Firebase/Google Auth dura ~3600s (1h).
 * Guardamos o timestamp de expiração para saber quando renovar.
 */
export function storeGoogleToken(accessToken: string, expiresInSeconds = 3600) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  const expiryTimestamp = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(EXPIRY_KEY, String(expiryTimestamp));
}

/**
 * Verifica se o token atual ainda é válido (não expirou).
 */
function isTokenValid(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!token || !expiry) return false;
  return Date.now() < Number(expiry) - EXPIRY_MARGIN_MS;
}

/**
 * Limpa token e expiração do storage.
 */
export function clearGoogleToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

/**
 * Renova o token silenciosamente via popup de re-autenticação.
 * Retorna o novo access token ou null se o usuário cancelar.
 */
async function refreshToken(auth: Auth): Promise<string | null> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.setCustomParameters({ prompt: 'none' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (credential?.accessToken) {
      storeGoogleToken(credential.accessToken);
      return credential.accessToken;
    }
    return null;
  } catch (error: any) {
    // Se prompt:none falhar (ex: precisa de consentimento), tenta com consentimento
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      return null;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.addScope('https://www.googleapis.com/auth/drive.file');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        storeGoogleToken(credential.accessToken);
        return credential.accessToken;
      }
    } catch (retryError) {
      console.error('Google token refresh failed:', retryError);
    }

    return null;
  }
}

/**
 * Retorna um access token válido para Google APIs.
 * Se o token armazenado estiver válido, retorna direto.
 * Se estiver expirado, faz re-autenticação automática.
 * 
 * @param auth - Instância do Firebase Auth
 * @returns access token válido ou null se não conseguir obter
 */
export async function getValidGoogleAccessToken(auth: Auth): Promise<string | null> {
  if (isTokenValid()) {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Token expirado ou inexistente — renova
  return refreshToken(auth);
}
