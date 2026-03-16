/**
 * @fileOverview API Route — Callback do OAuth2 do Google.
 *
 * PILAR 2: Recebe o authorization code, troca por access_token + refresh_token,
 * e salva o refresh_token no Firestore em staff_profiles/{email}.
 *
 * Fluxo:
 *   1. Google redireciona para cá com ?code=xxx&state=base64({email})
 *   2. Server troca o code por tokens usando GOOGLE_CLIENT_ID + CLIENT_SECRET
 *   3. Salva googleRefreshToken no staff_profiles/{email}
 *   4. Redireciona de volta para /dashboard com status de sucesso
 *
 * Este refresh_token é a "chave mestra" que permite ao Motor de Impersonificação
 * gerar access tokens frescos para qualquer advogado, mesmo offline.
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { firestoreAdmin } from '@/firebase/admin';
import admin from 'firebase-admin';

function getOAuth2Client(origin: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${origin}/api/google/callback`
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const errorParam = searchParams.get('error');

  // Se o usuário negou permissão
  if (errorParam) {
    console.warn('[GoogleCallback] Usuário negou permissão:', errorParam);
    return NextResponse.redirect(`${origin}/dashboard?google_workspace=denied`);
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${origin}/dashboard?google_workspace=error&reason=missing_params`);
  }

  // Decodifica o state para recuperar o e-mail
  let email: string;
  try {
    const stateData = JSON.parse(Buffer.from(stateRaw, 'base64').toString('utf-8'));
    email = stateData.email?.toLowerCase().trim();
    if (!email) throw new Error('E-mail vazio no state');
  } catch {
    return NextResponse.redirect(`${origin}/dashboard?google_workspace=error&reason=invalid_state`);
  }

  try {
    const oauth2Client = getOAuth2Client(origin);

    // Troca o authorization code por tokens (access + refresh)
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.warn(`[GoogleCallback] Google não retornou refresh_token para ${email}. Tokens:`, Object.keys(tokens));
      // Mesmo sem refresh_token, salva o access_token se disponível
      if (tokens.access_token) {
        await firestoreAdmin.collection('staff_profiles').doc(email).set({
          googleAccessToken: tokens.access_token,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          googleTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      return NextResponse.redirect(`${origin}/dashboard?google_workspace=partial`);
    }

    // Salva AMBOS os tokens no perfil do advogado
    await firestoreAdmin.collection('staff_profiles').doc(email).set({
      googleRefreshToken: tokens.refresh_token,
      googleAccessToken: tokens.access_token || '',
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      googleTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`[GoogleCallback] Tokens salvos com sucesso para ${email} (refresh_token capturado)`);

    return NextResponse.redirect(`${origin}/dashboard?google_workspace=connected`);
  } catch (error: any) {
    console.error('[GoogleCallback] Erro ao trocar code por tokens:', error.message);
    return NextResponse.redirect(`${origin}/dashboard?google_workspace=error&reason=token_exchange`);
  }
}
