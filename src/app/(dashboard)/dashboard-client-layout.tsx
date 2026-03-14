'use client';

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useFirebase, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useEffect } from 'react';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Scale, ShieldCheck, ShieldAlert } from "lucide-react";
import { useRouter } from 'next/navigation';
import { NotificationCenter } from "@/components/notifications/notification-center";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";

export function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const { user, isUserLoading, firestore: db, setProfile, profile, auth } = useFirebase();

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
    return doc(db, 'staff_profiles', user.uid);
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
    if (user && db && profileData === null && !isProfileLoading && !profile && OWNERS.includes(user.email || '')) {
      const newProfileRef = doc(db, 'staff_profiles', user.uid);
      const isOwner = true;
      
      const initialProfile = {
        id: user.uid,
        googleId: user.uid,
        name: user.displayName || 'Sócio Fundador',
        email: user.email || '',
        role: 'admin',
        isOwner: isOwner,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      setDocumentNonBlocking(newProfileRef, initialProfile, { merge: true });
      setProfile(initialProfile);
    }
  }, [user, db, profileData, isProfileLoading, setProfile, profile]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0D1422] flex-col gap-4 font-sans">
        <div className="w-16 h-16 rounded-xl bg-gold-200/10 flex items-center justify-center animate-pulse border border-gold-200/20">
          <Scale className="text-gold-100 h-8 w-8" />
        </div>
        <p className="text-gold-100/40 font-bold tracking-[0.3em] uppercase text-[10px]">
          {!user ? 'Redirecionando...' : 'Ecossistema RGMJ'}
        </p>
      </div>
    );
  }

  if (!isProfileLoading && profileData === null && !OWNERS.includes(user.email || '')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0D1422] flex-col gap-8 font-sans p-10 text-center">
        <div className="w-24 h-24 rounded-[2rem] bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500 shadow-2xl">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Não Autorizado</h2>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
            Seu e-mail não possui soberania de acesso neste ecossistema. Contate o Sócio Fundador para liberação.
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
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Comando RGMJ</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {profile?.isOwner && (
                <div className="hidden xl:flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-200/10 border border-gold-200/20">
                  <ShieldCheck className="h-3 w-3 text-gold-100" />
                  <span className="text-[9px] font-black text-gold-100 uppercase tracking-widest">Sócio Fundador</span>
                </div>
              )}
              <NotificationCenter />
              <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sincronizado</span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden">
            <div className="py-8 px-6 lg:py-10 lg:px-12 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
