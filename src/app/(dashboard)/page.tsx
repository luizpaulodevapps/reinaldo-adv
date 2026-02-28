
import { redirect } from "next/navigation"

export default function DashboardRoot() {
  // Garante que a raiz do grupo de dashboard também leve à página de conteúdo
  redirect("/dashboard")
}
