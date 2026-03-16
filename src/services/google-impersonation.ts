/**
 * @fileOverview Motor de Impersonificação Google — Pilar 3 da Integração com Google Workspace.
 *
 * Permite que qualquer membro da equipe (ex.: secretária) execute operações
 * no Google Calendar/Drive em nome de um advogado específico.
 *
 * ARQUITETURA (idêntica ao projeto Bueno Gois, adaptada para Firebase Auth):
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  1. Advogado faz login → Firebase Auth + OAuth2 Code Flow         │
 * │  2. Callback /api/google/callback salva refresh_token no Firestore│
 * │  3. Secretária agenda audiência para "Dr. Reinaldo"               │
 * │  4. Sistema chama resolveAccessTokenForStaff('reinaldo@...')      │
 * │  5. Tenta token local (Firestore) → se expirado, chama           │
 * │     /api/google/refresh-token que usa o refresh_token no server   │
 * │  6. Server gera access_token fresco com OAuth2Client              │
 * │  7. Evento criado no Calendar PESSOAL do Dr. Reinaldo             │
 * │  8. Dr. Reinaldo recebe notificações nativas (push + e-mail)      │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * DIFERENÇA CHAVE vs versão anterior:
 * O refresh_token real do Google (não o do Firebase) é salvo pelo OAuth2
 * Authorization Code Flow (/api/google/callback). Isso permite gerar
 * access tokens frescos DIAS depois do último login do advogado.
 */

import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

// ────────────────────────────────────────────────────────────────────
// Interfaces
// ────────────────────────────────────────────────────────────────────

export interface StaffGoogleClient {
  /** Token de acesso à API do Google, obtido do perfil do advogado alvo. */
  accessToken: string;
  /** E-mail do advogado cujo Calendar será manipulado. */
  staffEmail: string;
  /** Nome do advogado (para mensagens de UI). */
  staffName: string;
  /** Se o token ainda é válido (não expirou). */
  isTokenValid: boolean;
}

export interface StaffTokenResult {
  success: boolean;
  client?: StaffGoogleClient;
  error?: string;
}

// ────────────────────────────────────────────────────────────────────
// Constantes
// ────────────────────────────────────────────────────────────────────

/** Margem de segurança: considera expirado 5 minutos antes do timestamp real */
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

// ────────────────────────────────────────────────────────────────────
// Motor Principal
// ────────────────────────────────────────────────────────────────────

/**
 * Busca o token Google de um membro da equipe no Firestore e retorna
 * um "cliente" pronto para operações na API do Google.
 *
 * Este é o CORAÇÃO do sistema de impersonificação. Quando a secretária
 * agenda uma audiência para o "Dr. Reinaldo", o sistema:
 *   1. Chama esta função com o e-mail do Dr. Reinaldo
 *   2. Busca o documento staff_profiles/{email} no Firestore
 *   3. Extrai o googleAccessToken salvo no último login do Dr. Reinaldo
 *   4. Retorna um "client" pronto para usar com pushActToGoogleCalendar()
 *
 * Assim o evento aparece no Calendar PESSOAL do Dr. Reinaldo, com
 * notificações push e e-mail enviadas pelo Google direto para ele.
 *
 * @param firestore Instância do Firestore
 * @param staffEmail E-mail do advogado alvo (ex.: 'reinaldo@gmail.com')
 * @returns StaffTokenResult com o client pronto ou mensagem de erro
 *
 * @example
 * const result = await getGoogleClientsForStaff(db, 'reinaldo@gmail.com');
 * if (result.success && result.client?.isTokenValid) {
 *   await pushActToGoogleCalendar({
 *     accessToken: result.client.accessToken,
 *     act: { title: 'Audiência TRT', ... }
 *   });
 * }
 */
export async function getGoogleClientsForStaff(
  firestore: Firestore,
  staffEmail: string
): Promise<StaffTokenResult> {
  const emailId = staffEmail.toLowerCase().trim();

  if (!emailId) {
    return { success: false, error: 'E-mail do advogado não informado.' };
  }

  const profileRef = doc(firestore, 'staff_profiles', emailId);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    return {
      success: false,
      error: `Perfil não encontrado para ${emailId}. O advogado precisa estar cadastrado no sistema.`,
    };
  }

  const profile = profileSnap.data();
  const accessToken = profile.googleAccessToken;
  const tokenExpiry = profile.googleTokenExpiry?.toDate?.()
    ? profile.googleTokenExpiry.toDate()
    : profile.googleTokenExpiry;

  if (!accessToken) {
    return {
      success: false,
      error: `${profile.name || emailId} ainda não conectou a conta Google. Peça para fazer login no sistema.`,
    };
  }

  const isValid = tokenExpiry
    ? new Date(tokenExpiry).getTime() > Date.now() + EXPIRY_MARGIN_MS
    : false;

  return {
    success: true,
    client: {
      accessToken,
      staffEmail: emailId,
      staffName: profile.name || emailId,
      isTokenValid: isValid,
    },
  };
}

// ────────────────────────────────────────────────────────────────────
// Refresh Server-Side (usa o refresh_token real via API Route)
// ────────────────────────────────────────────────────────────────────

/**
 * Chama o endpoint /api/google/refresh-token para obter um access token
 * fresco usando o refresh_token do Google salvo no Firestore.
 *
 * Equivalente à função getGoogleClientsForStaff() do projeto Bueno Gois,
 * que cria um OAuth2Client no servidor e chama getAccessToken().
 *
 * @param auth Firebase Auth (para obter o ID token do usuário logado)
 * @param staffEmail E-mail do advogado alvo
 * @returns accessToken fresco ou erro
 */
async function refreshTokenServerSide(
  auth: Auth,
  staffEmail: string
): Promise<{ accessToken: string | null; staffName?: string; error?: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { accessToken: null, error: 'Usuário não autenticado.' };
  }

  const idToken = await currentUser.getIdToken();

  const response = await fetch('/api/google/refresh-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ staffEmail }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      accessToken: null,
      staffName: data.staffName,
      error: data.error || `Erro ${response.status} ao renovar token.`,
    };
  }

  return {
    accessToken: data.accessToken,
    staffName: data.staffName,
  };
}

// ────────────────────────────────────────────────────────────────────
// Resolução Inteligente de Token
// ────────────────────────────────────────────────────────────────────

/**
 * Resolve o token de acesso Google para uma operação de Calendar/Drive.
 *
 * Estratégia de resolução (3 camadas):
 * 1. Se `staffEmail` não fornecido ou é o próprio usuário → fluxo padrão (localStorage)
 * 2. Se o advogado alvo tem um access token válido no Firestore → usa direto
 * 3. Se o token está expirado → chama /api/google/refresh-token (server-side)
 *    que usa o refresh_token real para gerar um access token fresco
 *
 * @param firestore Instância do Firestore (client SDK)
 * @param staffEmail E-mail do advogado alvo (opcional)
 * @param currentUserEmail E-mail do usuário logado
 * @param auth Firebase Auth (necessário para refresh server-side)
 */
export async function resolveAccessTokenForStaff(
  firestore: Firestore,
  staffEmail?: string,
  currentUserEmail?: string,
  auth?: Auth
): Promise<{ accessToken: string | null; staffName?: string; error?: string }> {
  // Sem e-mail alvo ou é o próprio usuário → fluxo padrão (usa localStorage)
  if (!staffEmail || staffEmail.toLowerCase().trim() === currentUserEmail?.toLowerCase().trim()) {
    return { accessToken: null };
  }

  // Camada 1: Tenta usar o access token local (cache do Firestore)
  const result = await getGoogleClientsForStaff(firestore, staffEmail);

  if (result.success && result.client?.isTokenValid) {
    return {
      accessToken: result.client.accessToken,
      staffName: result.client.staffName,
    };
  }

  // Camada 2: Token expirado ou ausente → refresh server-side usando refresh_token real
  if (auth) {
    console.log(`[Impersonation] Token local de ${staffEmail} expirado. Tentando refresh server-side...`);
    return refreshTokenServerSide(auth, staffEmail);
  }

  // Sem auth para fazer refresh → retorna erro
  if (!result.success) {
    return { accessToken: null, error: result.error };
  }

  return {
    accessToken: null,
    staffName: result.client?.staffName,
    error: `Token de ${result.client?.staffName || staffEmail} expirado. Peça para o advogado reconectar o Google no sistema.`,
  };
}
