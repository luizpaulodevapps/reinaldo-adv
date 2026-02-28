"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Rota raiz do grupo Dashboard. 
 * Alterada para renderização nula para evitar conflito com a Landing Page (src/app/page.tsx).
 */
export default function DashboardRootRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Se por algum motivo o usuário cair aqui, redirecionamos para o dashboard real
    router.replace("/dashboard")
  }, [router])

  return null
}
