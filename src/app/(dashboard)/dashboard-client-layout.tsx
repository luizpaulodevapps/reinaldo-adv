'use client';

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useFirebase, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Scale, LogIn, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { auth, user, isUserLoading, firestore: db, setProfile, profile } = useFirebase();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'staff_profiles', user.uid);
  }, [user, db]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileRef);

  const isOwner = user?.email === 'luizao16@gmail.com' || user?.email === 'luizpaulo.dev.apps@gmail.com';

  useEffect(() => {
    if (profileData && !profile) {
      setProfile(profileData);
    }
  }, [profileData, profile, setProfile]);

  useEffect(() => {
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

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a14] flex-col gap-4">
        <div className="w-16 h-16 rounded-[1.5rem] bg-[#1e1b2e] flex items-center justify-center animate-pulse border border-white/5">
          <Scale className="text-primary h-8 w-8" />
        </div>
        <p className="text-white/40 font-bold tracking-[0.3em] uppercase text-[10px]">Ecossistema RGMJ</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a14] p-6">
        <div className="max-w-md w-full space-y-10 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-[#1e1b2e] flex items-center justify-center shadow-2xl border border-white/10">
              <Scale className="text-primary h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl text-white font-bold tracking-tighter">Portal RGMJ</h1>
              <p className="text-primary uppercase tracking-[0.3em] text-[10px] font-bold">Acesso de Elite</p>
            </div>
          </div>

          <div className="glass p-10 rounded-[2rem] border border-white/5 space-y-8">
            <p className="text-sm text-white/70 font-medium">Autenticação Corporativa Obrigatória.</p>
            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full h-14 blue-gradient hover:opacity-90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-4"
            >
              {isLoggingIn ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Entrar via Google
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-[#0a0a14] w-full">
        <SidebarNav />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#0a0a14] sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white hover:bg-white/10" />
              <div className="lg:hidden flex items-center gap-3">
                <Scale className="text-primary h-5 w-5" />
                <span className="text-sm font-black text-white uppercase">RGMJ</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Sincronizado</span>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="py-8 px-6 lg:py-12 lg:px-16 max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
