
"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function DeadlinesRedirect() {
  useEffect(() => {
    redirect("/agenda/prazos")
  }, [])
  return null
}
