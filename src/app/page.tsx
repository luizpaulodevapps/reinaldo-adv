import { redirect } from "next/navigation"

export default function Home() {
  // Redireciona para o Dashboard (que está em (dashboard)/page.tsx)
  // O erro anterior era redirect("/"), o que causava um loop infinito.
  // Em Next.js, se o Dashboard está no grupo (dashboard), a rota é a raiz /.
  // No entanto, para evitar conflito com este arquivo, vamos redirecionar para /cases
  // que é uma página central da operação.
  redirect("/cases")
}
