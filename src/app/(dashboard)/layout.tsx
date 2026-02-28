
'use client';

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Scale, AlertTriangle } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { auth, user, isUserLoading, firestore: db } = useFirebase();
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading) return;
    
    if (!user && auth) {
      signInAnonymously(auth).catch((err: any) => {
        if (err.code === 'auth/admin-restricted-operation') {
          setLoginError('Provedor Anônimo Desativado');
        } else {
          console.error("Erro de login:", err);
        }
      });
    } else if (user && db) {
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

  // Tela de Erro Crítico (Configuração do Firebase)
  if (loginError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background flex-col gap-6 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-destructive/20 animate-pulse">
          <AlertTriangle className="text-destructive h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-headline font-bold text-white">Configuração Necessária</h1>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Dr. Reinaldo, o provedor de autenticação <strong>Anônimo</strong> precisa ser ativado no seu Console do Firebase para que o LexFlow possa operar com segurança.
          </p>
        </div>
        <div className="p-4 bg-secondary/50 border border-border/50 rounded-xl font-mono text-xs text-primary">
          Firebase Console &gt; Authentication &gt; Sign-in method &gt; Anonymous (Enable)
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 gold-gradient text-background font-bold rounded-lg shadow-xl shadow-primary/10 transition-transform active:scale-95"
        >
          Já ativei, recarregar sistema
        </button>
      </div>
    );
  }

  // Tela de Carregamento Estratégico
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
