/**
 * REDIRECIONADOR TÁTICO RGMJ
 * Este arquivo foi neutralizado para resolver o conflito de rota raiz (/) com a Landing Page.
 * A Landing Page reside agora em src/app/page.tsx como autoridade única.
 */
import { redirect } from 'next/navigation';

export default function DashboardRootRedirect() {
  redirect('/dashboard');
}
