'use client';

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useFirebase, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useEffect } from 'react';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Scale, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { NotificationCenter } from "@/components/notifications/notification-center";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading, firestore: db, setProfile, profile, auth } = useFirebase();

  // Feedback do fluxo OAuth2 do Google Workspace
  useEffect(() => {
    const googleStatus = searchParams.get('google_workspace');
    if (!googleStatus) return;

    const messages: Record<string, { title: string; description: string; variant?: 'destructive' | 'default' }> = {
      connected: { title: 'Google Conectado', description: 'Calendar, Drive e Meet sincronizados com sucesso.' },
      partial: { title: 'Conexão Parcial', description: 'O Google não retornou o refresh token. Tente desconectar e reconectar.', variant: 'destructive' },
      denied: { title: 'Permissão Negada', description: 'Você negou o acesso ao Google Workspace. Reconecte em Configurações.', variant: 'destructive' },
      error: { title: 'Erro na Conexão', description: 'Falha ao conectar com o Google. Tente novamente em Configurações.', variant: 'destructive' },
    };

    const msg = messages[googleStatus];
    if (msg) {
      toast({ title: msg.title, description: msg.description, variant: msg.variant });
    }

    // Limpa o query param sem recarregar a página
    window.history.replaceState({}, '', window.location.pathname);
  }, [searchParams, toast]);

  const OWNERS = [
    'luizao16@gmail.com', 
    'luizpaulo.dev.apps@gmail.com', 
    'rgmj.adv@gmail.com',
    'reinaldo.g.m.dejesus@gmail.com'
  ];

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const profileRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'staff_profiles', user.email?.toLowerCase().trim() || 'unauthorized');
  }, [user, db]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (profileData && !profile) {
      setProfile(profileData);
    }
  }, [profileData, profile, setProfile]);

  useEffect(() => {
    if (user && profileData && profileData.isActive === false && auth) {
      signOut(auth).then(() => router.push('/login'));
    }
  }, [user, profileData, auth, router]);

  useEffect(() => {
    if (user && db && profileData === null && !isProfileLoading && !profile && OWNERS.includes(user.email?.toLowerCase() || '')) {
      const emailId = user.email?.toLowerCase().trim() || '';
      const newProfileRef = doc(db, 'staff_profiles', emailId);
      
      const initialProfile = {
        id: emailId,
        uid: user.uid,
        name: user.displayName || 'Sócio Fundador',
        email: emailId,
        role: 'admin',
        isOwner: true,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      setDocumentNonBlocking(newProfileRef, initialProfile, { merge: true });
      setProfile(initialProfile);
    }
  }, [user, db, profileData, isProfileLoading, setProfile, profile]);

  if (isUserLoading || (isProfileLoading && !profileData)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0D1422] flex-col gap-4 font-sans">
        <div className="w-16 h-16 rounded-xl bg-gold-200/10 flex items-center justify-center animate-pulse border border-gold-200/20">
          <Scale className="text-gold-100 h-8 w-8" />
        </div>
        <p className="text-gold-100/40 font-bold tracking-[0.3em] uppercase text-[10px]">
          Sincronizando Soberania RGMJ
        </p>
      </div>
    );
  }

  if (!isProfileLoading && profileData === null && !OWNERS.includes(user?.email?.toLowerCase() || '')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0D1422] flex-col gap-8 font-sans p-10 text-center">
        <div className="w-24 h-24 rounded-[2rem] bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500 shadow-2xl">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Não Autorizado</h2>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
            Seu e-mail Google (<span className="text-white">{user?.email}</span>) não possui autorização neste ecossistema. 
          </p>
        </div>
        <Button onClick={() => auth && signOut(auth).then(() => router.push('/'))} className="gold-gradient text-background font-black h-12 px-10 rounded-xl uppercase text-[10px]">
          Sair do Portal
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background w-full font-sans">
        <SidebarNav />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 px-6 flex items-center justify-between border-b border-gold-200/10 bg-background/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/5 transition-all">
                <SidebarTrigger className="text-white scale-110" />
              </div>
              <div className="hidden lg:flex items-center gap-3 border-l border-gold-200/10 pl-6 h-8">
                <Scale className="text-gold-100 h-5 w-5" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Escritório R G J M</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
              <NotificationCenter />
              
              {profile?.isOwner && (
                <div className="hidden xl:flex items-center gap-2 px-4 h-9 rounded-xl bg-gold-200/5 border border-gold-200/10 hover:bg-gold-200/10 transition-all cursor-default">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold-100/50" />
                  <span className="text-[9px] font-black text-gold-100/70 uppercase tracking-widest">Sócio Fundador</span>
                </div>
              )}

              <div className="hidden md:flex items-center gap-3 px-4 h-9 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10">
                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest">Ativo</span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden">
            <div className="py-8 px-6 lg:py-10 lg:px-12 max-w-[1800px] w-[95%] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
              {children}
            </div>
          </main>

          <footer className="w-full py-8 border-t border-gold-200/5 bg-[#05070a]/50 backdrop-blur-md">
            <div className="max-w-[1800px] w-full mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-gold-100/40" />
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">RGMJ ADVOCACIA</span>
                </div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">© 2026 Todos os direitos reservados. Inteligência Juridica.</p>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">SISTEMA DE GESTÃO V.2.4</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-emerald-500/60 uppercase tracking-widest">Servidores Online</span>
                  </div>
                </div>
                
                <div className="w-px h-8 bg-gold-200/10 hidden md:block" />

                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group cursor-pointer hover:bg-gold-200/10 transition-all">
                    <ShieldCheck className="h-4 w-4 text-white/20 group-hover:text-gold-100 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  )
}
