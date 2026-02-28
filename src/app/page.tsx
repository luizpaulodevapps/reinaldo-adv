
import { redirect } from "next/navigation"

export default function Home() {
  // Redireciona para o dashboard principal para evitar conflitos de rotas no Next.js
  redirect("/dashboard")
}
