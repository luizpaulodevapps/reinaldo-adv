
/**
 * REDIRECIONADOR TÁTICO RGMJ
 * Arquivo neutralizado para evitar conflito de rota raiz (/) com a Landing Page.
 * A Vercel exige apenas uma página na raiz para evitar erros de manifesto.
 */
import { redirect } from 'next/navigation';

export default function DashboardRootRedirect() {
  redirect('/dashboard');
}
