
"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function RotinasRedirect() {
  useEffect(() => {
    redirect("/agenda/rotinas")
  }, [])
  return null
}
