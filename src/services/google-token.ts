'use client';

import { Auth, GoogleAuthProvider, reauthenticateWithPopup, signInWithPopup } from 'firebase/auth';
import { Firestore, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
  provider.setCustomParameters({
    include_granted_scopes: 'true',
    access_type: 'offline',
    prompt: 'consent',
  });
  return provider;
}

/**
 * Pilar 2 — Cache de Access Token no Firestore.
 *
 * Salva APENAS o access token Google no documento staff_profiles/{email}.
 * O refresh_token REAL do Google é salvo exclusivamente pelo OAuth2
 * Authorization Code Flow via /api/google/callback. Nunca misturar com
 * o refreshToken do Firebase Auth (que é inútil para Google APIs).
 *
 * Chamado automaticamente no login via GoogleLoginButton.
 */
export function persistGoogleTokenToFirestore(
  firestore: Firestore,
  email: string,
  accessToken: string,
  expiresInSeconds = 3600
) {
  const emailId = email.toLowerCase().trim();
  if (!emailId) return;

  const profileRef = doc(firestore, 'staff_profiles', emailId);
  const tokenExpiry = new Date(Date.now() + expiresInSeconds * 1000);

  setDocumentNonBlocking(profileRef, {
    googleAccessToken: accessToken,
    googleTokenExpiry: tokenExpiry,
    googleTokenUpdatedAt: serverTimestamp(),
  }, { merge: true });
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
 * Tenta refresh silencioso via servidor usando o refresh_token real do Google
 * armazenado pelo fluxo OAuth2 (/api/google/callback).
 * Retorna o novo access token ou null se falhar.
 */
async function tryServerSideRefresh(auth: Auth): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user?.email) return null;

    const idToken = await user.getIdToken();
    const response = await fetch('/api/google/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ staffEmail: user.email }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.accessToken) {
      storeGoogleToken(data.accessToken, data.expiresIn || 3500);
      return data.accessToken;
    }
    return null;
  } catch (error) {
    console.warn('[tryServerSideRefresh] Falha no refresh server-side:', error);
    return null;
  }
}

/**
 * Retorna um access token válido para Google APIs.
 * Estratégia de resolução em 3 camadas:
 *   1. Cache local (localStorage) — se ainda válido, retorna direto.
 *   2. Refresh server-side via /api/google/refresh-token — silencioso,
 *      usa o refresh_token real do Google salvo pelo OAuth2 Code Flow.
 *   3. Popup de re-autenticação — fallback interativo.
 * 
 * @param auth - Instância do Firebase Auth
 * @returns access token válido ou null se não conseguir obter
 */
export async function getValidGoogleAccessToken(
  auth: Auth,
  options: GoogleAccessTokenOptions = {}
): Promise<string | null> {
  // Camada 1: Cache local
  if (!options.forceRefresh && isTokenValid()) {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Camada 2: Refresh server-side (silencioso, sem popup)
  const serverToken = await tryServerSideRefresh(auth);
  if (serverToken) return serverToken;

  // Camada 3: Fallback — popup de re-autenticação
  return refreshGoogleAccessToken(auth);
}
