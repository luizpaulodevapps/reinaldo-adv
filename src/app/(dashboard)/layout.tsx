'use client';

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { useFirebase, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Scale, LogIn, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { auth, user, isUserLoading, firestore: db, setProfile, profile, role } = useFirebase();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Monitora o perfil do staff em tempo real apenas para carregar na sessão inicial
  const profileRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'staff_profiles', user.uid);
  }, [user, db]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  // Identifica se é o proprietário pelo e-mail
  const isOwner = user?.email === 'luizao16@gmail.com';

  // Sincroniza o perfil carregado com a sessão global do FirebaseProvider
  useEffect(() => {
    if (profileData && !profile) {
      setProfile(profileData);
    }
  }, [profileData, profile, setProfile]);

  useEffect(() => {
    // Se o usuário logar e não tiver perfil, criamos ou garantimos que exista
    if (user && db && profileData === null && !isProfileLoading) {
      const newProfileRef = doc(db, 'staff_profiles', user.uid);
      
      const initialProfile = {
        id: user.uid,
        googleId: user.uid,
        name: user.displayName || 'Membro da Equipe',
        email: user.email || '',
        role: isOwner ? 'admin' : 'lawyer',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      setDocumentNonBlocking(newProfileRef, initialProfile, { merge: true });
      setProfile(initialProfile);
    }
  }, [user, db, profileData, isProfileLoading, isOwner, setProfile]);

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao autenticar com Google:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 1. Carregamento de Autenticação Inicial
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background flex-col gap-4">
        <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center animate-pulse shadow-2xl shadow-primary/20">
          <Scale className="text-background h-10 w-10" />
        </div>
        <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sincronizando...
        </div>
      </div>
    );
  }

  // 2. Tela de Login
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6">
        <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-3xl gold-gradient flex items-center justify-center shadow-2xl shadow-primary/20 transform hover:rotate-6 transition-transform">
              <Scale className="text-background h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-headline font-bold text-white tracking-tight">
                Dr. Reinaldo <span className="text-primary">Gonçalves</span>
              </h1>
              <p className="text-muted-foreground uppercase tracking-[0.2em] text-[10px] font-bold">
                Advocacia de Elite | Portal Restrito
              </p>
            </div>
          </div>

          <div className="glass p-10 rounded-3xl border-primary/20 space-y-8">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Acesso ao Centro de Comando</h2>
              <p className="text-sm text-muted-foreground">Autentique-se com sua conta Google para gerenciar sua banca.</p>
            </div>

            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full h-16 gold-gradient text-background font-bold text-lg rounded-xl shadow-xl shadow-primary/10 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
              {isLoggingIn ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-6 w-6" />
                  Entrar com Google
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest pt-4">
              <ShieldCheck className="h-3 w-3 text-primary" />
              Conexão Segura e Criptografada
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">
            © 2024 LexFlow Technology | Todos os direitos reservados
          </p>
        </div>
      </div>
    );
  }

  // 3. Aguarda Perfil do Usuário na Sessão
  // O Dono (isOwner) tem permissão imediata, outros aguardam a role ser confirmada
  if (!isOwner && !role && isProfileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background flex-col gap-4">
        <div className="w-16 h-16 rounded-2xl border border-primary/20 flex items-center justify-center animate-bounce">
          <UserCheck className="text-primary h-8 w-8" />
        </div>
        <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Validando Credenciais de Elite...
        </div>
      </div>
    );
  }

  // 4. Layout do Dashboard - Renderiza apenas após autenticação e role estabilizada
  return (
    <div className="flex min-h-screen">
      <aside className="w-72 glass border-r border-border/50 hidden md:block sticky top-0 h-screen overflow-y-auto">
        <SidebarNav />
      </aside>
      <main className="flex-1 bg-background/50 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}