
'use client';

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useFirebase, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useEffect } from 'react';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Scale, ShieldCheck } from "lucide-react";
import { useRouter } from 'next/navigation';
import { NotificationCenter } from "@/components/notifications/notification-center";

export function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const { user, isUserLoading, firestore: db, setProfile, profile } = useFirebase();

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
    if (user && db && profileData === null && !isProfileLoading) {
      const newProfileRef = doc(db, 'staff_profiles', user.uid);
      // Lista de e-mails com soberania total (Donos da Banca)
      const owners = ['luizao16@gmail.com', 'luizpaulo.dev.apps@gmail.com', 'rgmj.adv@gmail.com'];
      const isOwner = owners.includes(user?.email || '');
      
      const initialProfile = {
        id: user.uid,
        googleId: user.uid,
        name: user.displayName || 'Membro da Equipe',
        email: user.email || '',
        role: isOwner ? 'admin' : 'lawyer',
        isOwner: isOwner,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      setDocumentNonBlocking(newProfileRef, initialProfile, { merge: true });
      setProfile(initialProfile);
    }
  }, [user, db, profileData, isProfileLoading, setProfile]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a14] flex-col gap-4 font-sans">
        <div className="w-16 h-16 rounded-[1.5rem] bg-[#1e1b2e] flex items-center justify-center animate-pulse border border-white/5">
          <Scale className="text-primary h-8 w-8" />
        </div>
        <p className="text-white/40 font-bold tracking-[0.3em] uppercase text-[10px]">
          {!user ? 'Redirecionando...' : 'Ecossistema RGMJ'}
        </p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-[#0a0a14] w-full font-sans">
        <SidebarNav />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#0a0a14]/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/5 transition-all">
                <SidebarTrigger className="text-white scale-110" />
              </div>
              <div className="hidden lg:flex items-center gap-3 border-l border-white/10 pl-6 h-8">
                <Scale className="text-primary h-5 w-5" />
                <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Comando RGMJ</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {profile?.isOwner && (
                <div className="hidden xl:flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">Sócio Fundador</span>
                </div>
              )}
              <NotificationCenter />
              <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sincronizado</span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden">
            <div className="py-8 px-6 lg:py-12 lg:px-16 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
