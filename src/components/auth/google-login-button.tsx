'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useFirebase } from '@/firebase'
import { Button } from '@/components/ui/button'
import { createGoogleWorkspaceProvider, storeGoogleToken, persistGoogleTokenToFirestore } from '@/services/google-token'

export default function GoogleLoginButton() {
  const router = useRouter()
  const { auth, firestore: db } = useFirebase()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    if (!auth) {
      setError('Firebase não está configurado corretamente')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = createGoogleWorkspaceProvider()
      
      const result = await signInWithPopup(auth, provider)
      
      // Captura o Access Token para operações de Workspace (Calendar/Drive)
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        storeGoogleToken(credential.accessToken);

        // Salva APENAS o access token no Firestore (cache).
        // O refresh_token real do Google será salvo pelo OAuth2 Code Flow
        // via /api/google/callback — NUNCA usar result.user.refreshToken
        // (que é o refresh token do Firebase Auth, inútil para Google APIs).
        if (result.user.email && db) {
          persistGoogleTokenToFirestore(
            db,
            result.user.email,
            credential.accessToken
          );
        }
      }

      // Pilar 2 — Inicia o fluxo OAuth2 Authorization Code para capturar
      // o refresh_token REAL do Google. Isso redireciona para a tela de
      // consentimento e volta para /api/google/callback, que salva o
      // refresh_token no Firestore. Sem isso, a impersonificação só funciona
      // enquanto o access_token (~1h) estiver válido.
      if (result.user.email) {
        const email = encodeURIComponent(result.user.email);
        window.location.href = `/api/google/authorize?email=${email}`;
        return; // O redirect cuida do restante
      }

      router.push('/dashboard')
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelado')
      } else {
        setError(err.message || 'Erro ao fazer login com Google')
      }
      console.error('Google login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        size="lg"
        className="w-full h-12 bg-white text-[#213b37] hover:bg-gray-100 font-semibold rounded-lg flex items-center justify-center gap-3 transition"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.91 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isLoading ? 'Conectando...' : 'Entrar com Google'}
      </Button>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  )
}
