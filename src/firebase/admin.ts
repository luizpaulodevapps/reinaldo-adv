/**
 * @fileOverview Singleton do Firebase Admin SDK para uso em API Routes (server-side).
 *
 * Em produção (Firebase App Hosting), o Firebase Admin se auto-configura
 * via Application Default Credentials (ADC). Não é necessário service account JSON.
 *
 * Em desenvolvimento, usa as variáveis de ambiente:
 *   - GOOGLE_APPLICATION_CREDENTIALS (path para service account JSON)
 *   - Ou FIREBASE_PROJECT_ID para inicializar sem credenciais (emulator)
 */

import admin from 'firebase-admin';

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Firebase App Hosting injeta ADC automaticamente em produção.
  // Em dev, usa GOOGLE_APPLICATION_CREDENTIALS ou projectId fallback.
  return admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'studio-9423799575-2f09f',
  });
}

const app = getFirebaseAdmin();

export const firestoreAdmin = admin.firestore(app);
export const authAdmin = admin.auth(app);
export default app;
