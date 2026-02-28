"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Página de Reembolsos (Módulo Desativado).
 * Redireciona silenciosamente para o Dashboard para evitar 404 ou erros de build.
 */
export default function RefundsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/")
  }, [router])

  return null
}
