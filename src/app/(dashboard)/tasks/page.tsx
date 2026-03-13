
"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function TasksRedirect() {
  useEffect(() => {
    redirect("/agenda/diligencias")
  }, [])
  return null
}
