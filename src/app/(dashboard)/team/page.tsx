
"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

/**
 * @fileOverview Redireciona para o módulo central de Equipe unificado.
 * Conforme rito de saneamento, a gestão de membros e permissões foi centralizada 
 * para evitar redundâncias na soberania digital.
 */
export default function TeamRedirectPage() {
  useEffect(() => {
    redirect("/staff")
  }, [])

  return null
}
