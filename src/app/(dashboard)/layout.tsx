
'use client';

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';

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
