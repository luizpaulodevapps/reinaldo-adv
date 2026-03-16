/**
 * @fileOverview Singleton do Firebase Admin SDK para uso em API Routes (server-side).
 *
 * Ambientes suportados:
 *   1. Firebase App Hosting — ADC automático, nenhuma config extra necessária.
 *   2. Vercel / outros — Variável FIREBASE_SERVICE_ACCOUNT_KEY com o JSON
 *      da service account codificado em base64 (ou JSON raw).
 *   3. Dev local — GOOGLE_APPLICATION_CREDENTIALS apontando para o JSON file.
 */

import admin from 'firebase-admin';

function parseServiceAccountKey(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  try {
    // Tenta decodificar base64 primeiro, senão assume JSON direto
    const decoded = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf-8');
    return JSON.parse(decoded) as admin.ServiceAccount;
  } catch (e) {
    console.error('[FirebaseAdmin] Falha ao parsear FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    return null;
  }
}

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccount = parseServiceAccountKey();

  if (serviceAccount) {
    // Vercel ou qualquer host com service account explícita
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: (serviceAccount as any).project_id || process.env.FIREBASE_PROJECT_ID,
    });
  }

  // Firebase App Hosting (ADC) ou dev local (GOOGLE_APPLICATION_CREDENTIALS)
  return admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'studio-9423799575-2f09f',
  });
}

const app = getFirebaseAdmin();

export const firestoreAdmin = admin.firestore(app);
export const authAdmin = admin.auth(app);
export default app;
