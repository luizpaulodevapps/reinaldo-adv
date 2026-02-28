
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Redirecionador de Rota Raiz do Dashboard.
 * Este arquivo foi neutralizado para evitar conflitos com a Landing Page (src/app/page.tsx).
 * O dashboard real agora vive em /dashboard.
 */
export default function DashboardRootRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard")
  }, [router])

  return null
}
