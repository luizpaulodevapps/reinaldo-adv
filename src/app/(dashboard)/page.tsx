/**
 * REDIRECIONADOR TÁTICO RGMJ
 * Este arquivo foi neutralizado para resolver o conflito de rota raiz (/) com a Landing Page.
 * O dashboard agora reside exclusivamente em /dashboard.
 */
import { redirect } from 'next/navigation';

export default function DashboardRootRedirect() {
  redirect('/dashboard');
}
