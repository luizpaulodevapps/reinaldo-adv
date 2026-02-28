'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/firebase'
import GoogleLoginButton from '@/components/auth/google-login-button'
import { Logo } from '@/components/auth/logo'

export default function LoginPage() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (isReady && !isUserLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isUserLoading, isReady, router])

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#213b37] to-[#0A2C29]">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="w-12 h-12 rounded-full border-4 border-[#818258]/20 border-t-[#818258] animate-spin" />
          </div>
          <p className="text-white/60 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#213b37] to-[#0A2C29] px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#818258]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 right-20 w-96 h-96 bg-[#213b37]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo />
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-white mt-4">
              Dr. Reinaldo
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Assessoria Jurídica Especializada
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#818258]/30 to-transparent my-8" />

          {/* Login Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-white font-semibold text-lg">Acesso ao Portal</h2>
              <p className="text-white/60 text-sm">
                Faça login com sua conta Google para acessar o dashboard
              </p>
            </div>

            {/* Google Button */}
            <GoogleLoginButton />
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-white/50 text-xs text-center leading-relaxed">
              Ao fazer login, você concorda com nossos{' '}
              <span className="text-[#818258] hover:underline cursor-pointer">
                Termos de Serviço
              </span>
              {' '}e{' '}
              <span className="text-[#818258] hover:underline cursor-pointer">
                Política de Privacidade
              </span>
            </p>
          </div>
        </div>

        {/* Bottom Link */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            Não é um usuário autorizado?{' '}
            <a href="/" className="text-[#818258] hover:text-[#bbbd7e] transition">
              Voltar para home
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
