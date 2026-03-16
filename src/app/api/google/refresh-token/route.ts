/**
 * @fileOverview API Route — Refresh de token server-side para Impersonificação.
 *
 * PILAR 3: Este é o Motor de Impersonificação server-side.
 * Quando a secretária agenda uma audiência para o "Dr. Reinaldo":
 *
 *   1. Client chama POST /api/google/refresh-token { staffEmail: 'reinaldo@...' }
 *   2. Server busca o googleRefreshToken do Dr. Reinaldo no Firestore
 *   3. Server usa OAuth2Client com CLIENT_ID + CLIENT_SECRET para gerar
 *      um access_token FRESCO (mesmo que Dr. Reinaldo esteja offline há dias)
 *   4. Retorna o access_token fresco para o client usar na API do Google
 *
 * Este endpoint é protegido: exige um Firebase ID token válido no header Authorization.
 * Assim, apenas membros logados do sistema podem solicitar tokens de colegas.
 *
 * Variáveis de ambiente necessárias:
 *   - GOOGLE_CLIENT_ID
 *   - GOOGLE_CLIENT_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { firestoreAdmin, authAdmin } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  // 1. Validar autenticação — exige Firebase ID token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Token de autenticação não fornecido.' }, { status: 401 });
  }

  const idToken = authHeader.slice(7);
  try {
    await authAdmin.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: 'Token de autenticação inválido ou expirado.' }, { status: 401 });
  }

  // 2. Extrair staffEmail do body
  let staffEmail: string;
  try {
    const body = await request.json();
    staffEmail = body.staffEmail?.toLowerCase().trim();
    if (!staffEmail) throw new Error('vazio');
  } catch {
    return NextResponse.json({ error: 'Campo staffEmail é obrigatório.' }, { status: 400 });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Variáveis GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não configuradas no servidor.' },
      { status: 500 }
    );
  }

  // 3. Buscar refresh token do advogado alvo no Firestore
  const profileDoc = await firestoreAdmin.collection('staff_profiles').doc(staffEmail).get();

  if (!profileDoc.exists) {
    return NextResponse.json({
      error: `Perfil não encontrado para ${staffEmail}.`,
    }, { status: 404 });
  }

  const profile = profileDoc.data();
  const refreshToken = profile?.googleRefreshToken;
  const staffName = profile?.name || staffEmail;

  if (!refreshToken) {
    return NextResponse.json({
      error: `${staffName} ainda não autorizou o Google Workspace. Peça para acessar o sistema e conectar a conta.`,
      staffName,
    }, { status: 404 });
  }

  // 4. Usar o refresh token para obter um access token fresco
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Força o refresh — gera um access token novo agindo como o advogado
    const { token } = await oauth2Client.getAccessToken();

    if (!token) {
      return NextResponse.json({
        error: `Não foi possível renovar o token de ${staffName}. O advogado precisa reconectar o Google no sistema.`,
        staffName,
      }, { status: 401 });
    }

    // 5. Atualiza o access token no Firestore para cache local
    await firestoreAdmin.collection('staff_profiles').doc(staffEmail).set({
      googleAccessToken: token,
      googleTokenExpiry: new Date(Date.now() + 3500 * 1000), // ~58min (margem)
      googleTokenUpdatedAt: new Date(),
    }, { merge: true });

    return NextResponse.json({
      accessToken: token,
      staffEmail,
      staffName,
      expiresIn: 3500,
    });
  } catch (error: any) {
    console.error(`[RefreshToken] Erro ao renovar token para ${staffEmail}:`, error.message);

    // Se o refresh token foi revogado, limpa do banco
    if (error.message?.includes('invalid_grant') || error.response?.status === 400) {
      await firestoreAdmin.collection('staff_profiles').doc(staffEmail).set({
        googleRefreshToken: null,
        googleAccessToken: null,
        googleTokenExpiry: null,
      }, { merge: true });

      return NextResponse.json({
        error: `O acesso de ${staffName} ao Google foi revogado. Peça para reconectar a conta no sistema.`,
        staffName,
        revoked: true,
      }, { status: 401 });
    }

    return NextResponse.json({
      error: `Erro ao renovar credenciais de ${staffName}: ${error.message}`,
      staffName,
    }, { status: 500 });
  }
}
