'use client';

import { Auth, GoogleAuthProvider, reauthenticateWithPopup, signInWithPopup } from 'firebase/auth';
import { GOOGLE_WORKSPACE_SCOPES } from '@/services/google-workspace';

const TOKEN_KEY = 'google_access_token';
const EXPIRY_KEY = 'google_token_expiry';

export interface GoogleAccessTokenOptions {
  forceRefresh?: boolean;
}

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

export function createGoogleWorkspaceProvider() {
  const provider = new GoogleAuthProvider();
  GOOGLE_WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({ include_granted_scopes: 'true' });
  return provider;
}

/**
 * Renova o token do Google via popup de autenticação.
 * Retorna o novo access token ou null se o usuário cancelar.
 */
export async function refreshGoogleAccessToken(auth: Auth): Promise<string | null> {
  try {
    const provider = createGoogleWorkspaceProvider();
    const result = auth.currentUser
      ? await reauthenticateWithPopup(auth.currentUser, provider)
      : await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (credential?.accessToken) {
      storeGoogleToken(credential.accessToken);
      return credential.accessToken;
    }

    return null;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/popup-closed-by-user'
    ) {
      return null;
    }

    console.error('Google token refresh failed:', error);
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
export async function getValidGoogleAccessToken(
  auth: Auth,
  options: GoogleAccessTokenOptions = {}
): Promise<string | null> {
  if (!options.forceRefresh && isTokenValid()) {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Token expirado ou inexistente — renova
  return refreshGoogleAccessToken(auth);
}
