'use client';

import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { CalendarAct, GoogleCalendarApiError, deleteGoogleCalendarEvent, pushActToGoogleCalendar, updateGoogleCalendarEvent } from '@/services/google-calendar';
import { clearGoogleToken, getValidGoogleAccessToken } from '@/services/google-token';
import { GoogleWorkspaceSettings, normalizeGoogleWorkspaceSettings } from '@/services/google-workspace';
import { resolveAccessTokenForStaff } from '@/services/google-impersonation';

type GoogleCalendarSyncStatus = 'synced' | 'not_connected' | 'disabled' | 'failed';

export interface GoogleCalendarSyncResult {
  status: GoogleCalendarSyncStatus;
  calendarEventId?: string;
  meetingUrl?: string;
  errorMessage?: string;
}

function getCalendarErrorMessage(error: unknown) {
  if (error instanceof GoogleCalendarApiError) {
    if (error.status === 401) {
      return 'Seu token do Google expirou. Reconecte a conta e tente novamente.';
    }

    if (error.status === 403) {
      return 'A conta Google não concedeu permissão ao Calendar. Faça login novamente e autorize o acesso.';
    }

    return `Google Calendar recusou a operação (${error.status}).`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Falha ao sincronizar com o Google Calendar.';
}

function isRecoverableAuthError(error: unknown) {
  return error instanceof GoogleCalendarApiError && (error.status === 401 || error.status === 403);
}

export async function updateActInGoogleCalendar(params: {
  auth: Auth;
  calendarEventId: string;
  act: CalendarAct;
  accessToken?: string | null;
  googleSettings?: Partial<GoogleWorkspaceSettings> | null;
  /** Pilar 3 — E-mail do advogado alvo para impersonificação (opcional) */
  staffEmail?: string;
  /** Firestore necessário quando staffEmail é fornecido */
  firestore?: Firestore;
}): Promise<GoogleCalendarSyncResult> {
  const { auth, calendarEventId, act, accessToken, googleSettings, staffEmail, firestore } = params;
  const settings = normalizeGoogleWorkspaceSettings(googleSettings);

  if (!settings.isCalendarActive) {
    return { status: 'disabled', errorMessage: 'Google Calendar está desativado nas configurações do sistema.' };
  }

  const actToSync = settings.isMeetActive ? act : { ...act, useMeet: false };

  // Pilar 3: Se staffEmail fornecido, tenta impersonificar (com refresh server-side)
  let token = accessToken ?? null;
  if (!token && staffEmail && firestore) {
    const impersonation = await resolveAccessTokenForStaff(firestore, staffEmail, auth.currentUser?.email || undefined, auth);
    if (impersonation.error) {
      return { status: 'failed', errorMessage: impersonation.error };
    }
    token = impersonation.accessToken;
  }
  if (!token) {
    token = await getValidGoogleAccessToken(auth);
  }

  if (!token) {
    return { status: 'not_connected', errorMessage: 'A conta Google precisa ser reconectada para sincronizar no Calendar.' };
  }

  try {
    const response = await updateGoogleCalendarEvent({ accessToken: token, calendarEventId, act: actToSync });
    return { status: 'synced', calendarEventId: response.id ?? calendarEventId, meetingUrl: response.hangoutLink || '' };
  } catch (error) {
    if (isRecoverableAuthError(error)) {
      clearGoogleToken();
      const refreshedToken = await getValidGoogleAccessToken(auth, { forceRefresh: true });
      if (refreshedToken) {
        try {
          const retryResponse = await updateGoogleCalendarEvent({ accessToken: refreshedToken, calendarEventId, act: actToSync });
          return { status: 'synced', calendarEventId: retryResponse.id ?? calendarEventId, meetingUrl: retryResponse.hangoutLink || '' };
        } catch (retryError) {
          return { status: 'failed', errorMessage: getCalendarErrorMessage(retryError) };
        }
      }
    }
    return { status: 'failed', errorMessage: getCalendarErrorMessage(error) };
  }
}

export async function deleteActFromGoogleCalendar(params: {
  auth: Auth;
  calendarEventId: string;
  accessToken?: string | null;
  googleSettings?: Partial<GoogleWorkspaceSettings> | null;
  /** Pilar 3 — E-mail do advogado alvo para impersonificação (opcional) */
  staffEmail?: string;
  /** Firestore necessário quando staffEmail é fornecido */
  firestore?: Firestore;
}): Promise<GoogleCalendarSyncResult> {
  const { auth, calendarEventId, accessToken, googleSettings, staffEmail, firestore } = params;
  const settings = normalizeGoogleWorkspaceSettings(googleSettings);

  if (!settings.isCalendarActive) {
    return { status: 'disabled' };
  }

  // Pilar 3: Se staffEmail fornecido, tenta impersonificar (com refresh server-side)
  let token = accessToken ?? null;
  if (!token && staffEmail && firestore) {
    const impersonation = await resolveAccessTokenForStaff(firestore, staffEmail, auth.currentUser?.email || undefined, auth);
    if (impersonation.error) {
      return { status: 'failed', errorMessage: impersonation.error };
    }
    token = impersonation.accessToken;
  }
  if (!token) {
    token = await getValidGoogleAccessToken(auth);
  }
  if (!token) {
    return { status: 'not_connected', errorMessage: 'A conta Google precisa ser reconectada para remover do Calendar.' };
  }

  try {
    await deleteGoogleCalendarEvent({ accessToken: token, calendarEventId });
    return { status: 'synced' };
  } catch (error) {
    if (isRecoverableAuthError(error)) {
      clearGoogleToken();
      const refreshedToken = await getValidGoogleAccessToken(auth, { forceRefresh: true });
      if (refreshedToken) {
        try {
          await deleteGoogleCalendarEvent({ accessToken: refreshedToken, calendarEventId });
          return { status: 'synced' };
        } catch (retryError) {
          return { status: 'failed', errorMessage: getCalendarErrorMessage(retryError) };
        }
      }
    }
    return { status: 'failed', errorMessage: getCalendarErrorMessage(error) };
  }
}

export async function syncActToGoogleCalendar(params: {
  auth: Auth;
  act: CalendarAct;
  accessToken?: string | null;
  googleSettings?: Partial<GoogleWorkspaceSettings> | null;
  /** Pilar 3 — E-mail do advogado alvo para impersonificação (opcional) */
  staffEmail?: string;
  /** Firestore necessário quando staffEmail é fornecido */
  firestore?: Firestore;
}): Promise<GoogleCalendarSyncResult> {
  const { auth, act, accessToken, googleSettings, staffEmail, firestore } = params;
  const settings = normalizeGoogleWorkspaceSettings(googleSettings);

  if (!settings.isCalendarActive) {
    return {
      status: 'disabled',
      errorMessage: 'Google Calendar está desativado nas configurações do sistema.',
    };
  }

  const actToSync = settings.isMeetActive ? act : { ...act, useMeet: false };

  // Pilar 3: Se staffEmail fornecido, tenta impersonificar (com refresh server-side)
  let initialToken = accessToken ?? null;
  if (!initialToken && staffEmail && firestore) {
    const impersonation = await resolveAccessTokenForStaff(firestore, staffEmail, auth.currentUser?.email || undefined, auth);
    if (impersonation.error) {
      return { status: 'failed', errorMessage: impersonation.error };
    }
    initialToken = impersonation.accessToken;
  }
  if (!initialToken) {
    initialToken = await getValidGoogleAccessToken(auth);
  }

  if (!initialToken) {
    return {
      status: 'not_connected',
      errorMessage: 'A conta Google precisa ser reconectada para sincronizar no Calendar.',
    };
  }

  try {
    const response = await pushActToGoogleCalendar({ accessToken: initialToken, act: actToSync });
    return {
      status: 'synced',
      calendarEventId: response.id,
      meetingUrl: response.hangoutLink || '',
    };
  } catch (error) {
    if (isRecoverableAuthError(error)) {
      clearGoogleToken();
      const refreshedToken = await getValidGoogleAccessToken(auth, { forceRefresh: true });

      if (refreshedToken) {
        try {
          const retryResponse = await pushActToGoogleCalendar({ accessToken: refreshedToken, act: actToSync });
          return {
            status: 'synced',
            calendarEventId: retryResponse.id,
            meetingUrl: retryResponse.hangoutLink || '',
          };
        } catch (retryError) {
          return {
            status: 'failed',
            errorMessage: getCalendarErrorMessage(retryError),
          };
        }
      }
    }

    return {
      status: 'failed',
      errorMessage: getCalendarErrorMessage(error),
    };
  }
}