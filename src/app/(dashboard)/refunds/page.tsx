
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RefundsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redireciona para o dashboard já que o módulo foi removido
    router.replace("/dashboard")
  }, [router])

  return null
}
