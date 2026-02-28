
'use client';

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Scale } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { auth, user, isUserLoading, firestore: db } = useFirebase();

  useEffect(() => {
    if (isUserLoading) return;
    
    if (!user) {
      signInAnonymously(auth);
    } else if (db) {
      // Garante que o perfil de Staff (Admin) exista para o desenvolvedor
      const profileRef = doc(db, 'staff_profiles', user.uid);
      getDoc(profileRef).then(snap => {
        if (!snap.exists()) {
          setDocumentNonBlocking(profileRef, {
            id: user.uid,
            googleId: 'dev_mode',
            name: user.displayName || 'Dr. Reinaldo G. Miguel de Jesus',
            email: user.email || 'reinaldo@lexflow.adv.br',
            role: 'admin',
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      });
    }
  }, [user, isUserLoading, auth, db]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background flex-col gap-4">
        <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center animate-pulse shadow-2xl shadow-primary/20">
          <Scale className="text-background h-10 w-10" />
        </div>
        <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Autenticando Dr. Reinaldo...
        </div>
      </div>
    );
  }

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
