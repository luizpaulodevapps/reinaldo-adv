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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Sincronizando Sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 font-sans">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card Container */}
        <div className="bg-card/50 backdrop-blur-xl border border-gold-200/10 rounded-3xl p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {/* Logo */}
          <div className="text-center mb-10">
            <Logo />
            <h1 className="text-3xl font-black text-white mt-6 uppercase tracking-tighter">
              DR. <span className="text-gold-100">REINALDO</span>
            </h1>
            <p className="text-gold-100/40 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
              Assessoria Jurídica de Alto Padrão
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gold-200/20 to-transparent my-10" />

          {/* Login Form */}
          <div className="space-y-8">
            <div className="space-y-3 text-center">
              <h2 className="text-white font-black text-xs uppercase tracking-widest">Acesso ao Comando</h2>
              <p className="text-white/40 text-[11px] font-medium leading-relaxed">
                Autentique-se via Google para acessar o <br/>painel estratégico de operações.
              </p>
            </div>

            {/* Google Button */}
            <div className="flex justify-center">
              <GoogleLoginButton />
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-10 pt-8 border-t border-white/5">
            <p className="text-white/30 text-[9px] font-bold text-center leading-relaxed uppercase tracking-wider">
              Ao acessar, você concorda com nossos <br/>
              <a href="#" className="text-gold-100/60 hover:text-gold-100 transition-colors">Termos de Serviço</a>
              {' '}e{' '}
              <a href="#" className="text-gold-100/60 hover:text-gold-100 transition-colors">Privacidade</a>
            </p>
          </div>
        </div>

        {/* Bottom Link */}
        <div className="text-center mt-10">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
            Acesso Restrito?{' '}
            <a href="/" className="text-gold-100 hover:tracking-[0.2em] transition-all duration-300">
              Retornar à Base
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
