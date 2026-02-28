import { redirect } from 'next/navigation';

/**
 * Rota interna neutralizada para evitar conflito com a Landing Page (src/app/page.tsx).
 * O acesso ao Dashboard é feito exclusivamente via /dashboard.
 * Usamos um redirecionamento de servidor para garantir que não haja conflito de rotas.
 */
export default function DashboardRootPlaceholder() {
  redirect('/dashboard');
}
