
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * REDIRECIONADOR TÁTICO RGMJ
 * Neutraliza o conflito de rota raiz (/) no grupo (dashboard).
 * Garante que a Landing Page em src/app/page.tsx seja a autoridade primária.
 */
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null;
}
