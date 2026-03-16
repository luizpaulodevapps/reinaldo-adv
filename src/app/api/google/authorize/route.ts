/**
 * @fileOverview API Route — Inicia o fluxo OAuth2 Authorization Code com o Google.
 *
 * PILAR 1 + 2: Solicita permissões explícitas (Calendar, Drive, Tasks)
 * com `access_type=offline` para obter o refresh_token real do Google.
 *
 * Fluxo:
 *   1. Client chama GET /api/google/authorize?email=advogado@email.com
 *   2. Server gera URL de consentimento do Google
 *   3. Redireciona o navegador para a tela de permissão do Google
 *   4. Google redireciona de volta para /api/google/callback com um `code`
 *
 * Variáveis de ambiente necessárias:
 *   - GOOGLE_CLIENT_ID
 *   - GOOGLE_CLIENT_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/tasks',
];

function getOAuth2Client(origin: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${origin}/api/google/callback`
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Parâmetro email é obrigatório.' }, { status: 400 });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Variáveis GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não configuradas.' },
      { status: 500 }
    );
  }

  const oauth2Client = getOAuth2Client(origin);

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    // Passamos o e-mail no state para recuperar no callback
    state: Buffer.from(JSON.stringify({ email: email.toLowerCase().trim() })).toString('base64'),
    login_hint: email,
  });

  return NextResponse.redirect(authorizeUrl);
}
