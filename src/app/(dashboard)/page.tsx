import { redirect } from 'next/navigation';

/**
 * Redirecionamento tático para evitar conflitos de rota raiz (/)
 * A Landing Page oficial reside em src/app/page.tsx.
 * Este arquivo como componente de servidor puro evita erros de manifesto na Vercel.
 */
export default function DashboardRedirectPage() {
  redirect('/dashboard');
  return null;
}
