
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Este arquivo na raiz do dashboard causava conflito com a landing page em src/app/page.tsx.
 * Neutralizamos o conflito redirecionando para a sub-rota específica de comando.
 */
export default function DashboardIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0a0a14]">
      <div className="animate-pulse text-primary font-black uppercase tracking-[0.4em] text-[10px]">
        Acessando Centro de Comando...
      </div>
    </div>
  );
}
