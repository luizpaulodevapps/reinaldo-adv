
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Página de redirecionamento passivo para evitar conflito com a raiz (Landing Page).
 * O Next.js 15 exige que a rota raiz seja única para evitar erros de manifesto (ENOENT).
 */
export default function DashboardRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard")
  }, [router])

  return null
}
