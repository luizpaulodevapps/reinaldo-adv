
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ClipboardList, 
  Play, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  User, 
  ShieldCheck 
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function RotinasSubpage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const executionsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "checklist_executions"), orderBy("updatedAt", "desc"))
  }, [db, user])
  const { data: executions, isLoading } = useCollection(executionsQuery)

  const searchParams = useSearchParams()
  const selectedAdvogado = searchParams.get("advogado")
  const searchQuery = searchParams.get("q")

  const activeRotinas = useMemo(() => {
    if (!executions) return []
    return executions
      .filter(e => e.status === "Em Execução")
      .filter(e => {
        if (!selectedAdvogado) return true
        return e.executorName === selectedAdvogado
      })
      .filter(e => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
          e.title?.toLowerCase().includes(q) || 
          e.category?.toLowerCase().includes(q)
        )
      })
  }, [executions, selectedAdvogado, searchQuery])

  const handleMarkComplete = (id: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "checklist_executions", id), {
      status: "Finalizado",
      progress: 100,
      updatedAt: serverTimestamp()
    })
    toast({ title: "Rotina Concluída" })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Rotinas...</span>
        </div>
      ) : activeRotinas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeRotinas.map((exec) => (
            <Card key={exec.id} className="glass border-primary/10 hover-gold transition-all group overflow-hidden flex flex-col shadow-2xl rounded-2xl">
              <div className="h-1.5 w-full bg-amber-500" />
              
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5 px-3">
                      {exec.category?.toUpperCase() || "GERAL"}
                    </Badge>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">
                      {exec.title}
                    </h3>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase border-0">EM EXECUÇÃO</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                    <span>Nível de Conformidade</span>
                    <span className="text-white">{exec.progress}%</span>
                  </div>
                  <Progress value={exec.progress} className="h-1.5 bg-secondary" />
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <User className="h-3 w-3" /> Executor
                    </p>
                    <p className="text-xs font-bold text-white uppercase truncate">{exec.executorName}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 justify-end">
                      <Clock className="h-3 w-3" /> Atualizado
                    </p>
                    <p className="text-xs font-mono font-bold text-white">
                      {exec.updatedAt?.toDate ? format(exec.updatedAt.toDate(), "dd/MM HH:mm") : "--/--"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest">
                    <ArrowRight className="h-4 w-4" /> Retomar Auditoria
                  </button>
                  <button 
                    onClick={() => handleMarkComplete(exec.id)}
                    className="flex items-center gap-2 text-[10px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                  >
                    <ShieldCheck className="h-4 w-4" /> Finalizar
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-48 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-[3rem]">
          <ClipboardList className="h-20 w-20 mb-6" />
          <p className="text-sm font-black uppercase tracking-[0.5em]">Nenhuma rotina técnica ativa</p>
        </div>
      )}
    </div>
  )
}
