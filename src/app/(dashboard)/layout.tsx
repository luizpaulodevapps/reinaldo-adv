'use client';

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { useFirebase, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Scale, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { auth, user, isUserLoading, firestore: db, setProfile, profile, role } = useFirebase();
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
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F9FA] flex-col gap-4">
        <div className="w-16 h-16 rounded bg-[#213B37] flex items-center justify-center animate-pulse">
          <Scale className="text-white h-8 w-8" />
        </div>
        <p className="text-[#213B37] font-bold tracking-widest uppercase text-[10px]">Sincronizando Ecossistema...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F9FA] p-6">
        <div className="max-w-md w-full space-y-10 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded bg-[#213B37] flex items-center justify-center shadow-xl">
              <Scale className="text-white h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl text-[#213B37] font-bold">Portal RGMJ</h1>
              <p className="text-[#818258] uppercase tracking-[0.3em] text-[10px] font-bold">Acesso Restrito ao Comando</p>
            </div>
          </div>

          <div className="bg-white p-10 rounded shadow-2xl border border-[#818258]/10 space-y-8">
            <p className="text-sm text-[#213B37]/70 font-medium">Autentique-se com sua conta corporativa Google.</p>
            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full h-14 bg-[#818258] hover:bg-[#bbbd7e] text-white font-bold rounded-[0.3em] transition-all flex items-center justify-center gap-4"
            >
              {isLoggingIn ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Entrar com Google
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner && !role && isProfileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F9FA] flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#213B37]" />
        <p className="text-[#213B37] font-bold tracking-widest uppercase text-[10px]">Validando Credenciais...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <aside className="w-[300px] bg-[#213B37] hidden lg:block sticky top-0 h-screen overflow-y-auto">
        <SidebarNav />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="py-10 px-12 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}