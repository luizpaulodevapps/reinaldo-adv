import { firebaseConfig } from '@/firebase/config';

export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.file',
] as const;

export const GOOGLE_WORKSPACE_AUTH_FLOW_LABEL = 'Firebase Auth com popup do Google';

export interface GoogleWorkspaceSettings {
  masterEmail: string;
  rootFolderId: string;
  clientId: string;
  isDriveActive: boolean;
  isDocsActive: boolean;
  isCalendarActive: boolean;
  isTasksActive: boolean;
  isMeetActive: boolean;
}

export const DEFAULT_GOOGLE_WORKSPACE_SETTINGS: GoogleWorkspaceSettings = {
  masterEmail: '',
  rootFolderId: '',
  clientId: '',
  isDriveActive: true,
  isDocsActive: true,
  isCalendarActive: true,
  isTasksActive: false,
  isMeetActive: true,
};

export function extractGoogleDriveFolderId(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return '';

  try {
    const url = new URL(trimmedValue);
    const queryId = url.searchParams.get('id');
    if (queryId) return queryId;

    const folderMatch = url.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch?.[1]) return folderMatch[1];
  } catch {
    // Not a URL. Continue with raw pattern extraction.
  }

  const rawIdMatch = trimmedValue.match(/[a-zA-Z0-9_-]{20,}/);
  return rawIdMatch?.[0] || trimmedValue;
}

export function isValidGoogleDriveFolderId(folderId: string) {
  return /^[a-zA-Z0-9_-]{20,}$/.test(folderId.trim());
}

export function toGoogleDriveFolderUrl(folderId: string) {
  return isValidGoogleDriveFolderId(folderId)
    ? `https://drive.google.com/drive/folders/${folderId}`
    : '';
}

export function normalizeGoogleWorkspaceSettings(
  input?: Partial<GoogleWorkspaceSettings> | null
): GoogleWorkspaceSettings {
  const merged = {
    ...DEFAULT_GOOGLE_WORKSPACE_SETTINGS,
    ...(input || {}),
  };

  return {
    ...merged,
    masterEmail: merged.masterEmail.trim().toLowerCase(),
    rootFolderId: extractGoogleDriveFolderId(merged.rootFolderId || ''),
    clientId: (merged.clientId || '').trim(),
  };
}

export function getGoogleWorkspaceRuntimeContext(origin = '') {
  return {
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    origin,
    authFlow: GOOGLE_WORKSPACE_AUTH_FLOW_LABEL,
    scopes: [...GOOGLE_WORKSPACE_SCOPES],
  };
}