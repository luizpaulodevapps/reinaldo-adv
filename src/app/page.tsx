import { redirect } from "next/navigation"

export default function Home() {
  // Redireciona para a página de processos para evitar conflito de rotas e loop infinito.
  redirect("/cases")
}
