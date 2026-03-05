import { redirect } from 'next/navigation';

/**
 * Redirecionador tático para o dashboard principal.
 * Resolve o conflito de rota raiz entre a Landing Page e o ecossistema LexFlow.
 */
export default function DashboardIndexPage() {
  redirect('/dashboard');
}