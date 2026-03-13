
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  MoreVertical,
  History,
  Scale
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { format, parseISO, isBefore, startOfDay, isAfter, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function PrazosSubpage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const deadlinesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "deadlines"), orderBy("dueDate", "asc"))
  }, [db, user])
  const { data: deadlines, isLoading } = useCollection(deadlinesQuery)

  const activeDeadlines = useMemo(() => {
    if (!deadlines) return []
    const today = startOfDay(new Date())
    return deadlines
      .filter(d => d.status === "Aberto")
      .filter(d => {
        const date = d.dueDate ? parseISO(d.dueDate) : null
        return date && (isSameDay(date, today) || isAfter(date, today) || isBefore(date, today))
      })
  }, [deadlines])

  const handleMarkAsDone = (id: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "deadlines", id), {
      status: "Concluído",
      updatedAt: serverTimestamp()
    })
    toast({ title: "Prazo Cumprido", description: "O ato foi arquivado com sucesso." })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Radar de Prazos Fatais</h2>
        <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary bg-primary/5 px-4 h-8 uppercase tracking-widest">
          {activeDeadlines.length} Termos em Aberto
        </Badge>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Auditando Radar de Riscos...</span>
        </div>
      ) : activeDeadlines.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {activeDeadlines.map((d) => {
            const dueDate = d.dueDate ? parseISO(d.dueDate) : null
            const isExp = dueDate && isBefore(dueDate, startOfDay(new Date()))
            
            return (
              <Card key={d.id} className="glass border-white/5 hover-gold transition-all group overflow-hidden rounded-2xl">
                <CardContent className="p-0 flex flex-col md:flex-row">
                  <div className={cn(
                    "p-8 md:w-40 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 group-hover:bg-primary/5 transition-all",
                    isExp && "bg-rose-500/5"
                  )}>
                    <span className="text-[10px] font-black text-muted-foreground uppercase mb-1">{dueDate ? format(dueDate, "MMM", { locale: ptBR }).toUpperCase() : "---"}</span>
                    <span className={cn("text-3xl font-black", isExp ? "text-rose-500" : "text-white")}>{dueDate ? format(dueDate, "dd") : "--"}</span>
                  </div>

                  <div className="flex-1 p-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase font-black px-3 bg-primary/5 tracking-[0.1em]">
                        {d.title}
                      </Badge>
                      {isExp && <Badge variant="destructive" className="text-[9px] font-black animate-pulse">URGENTE / EXPIRADO</Badge>}
                    </div>
                    
                    <h4 className="text-xl font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">
                      {d.description || "Sem descrição técnica"}
                    </h4>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Scale className="h-3.5 w-3.5 text-primary/40" /> CNJ: {d.processId || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/5 gap-4">
                    <Button 
                      onClick={() => handleMarkAsDone(d.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black gap-3 text-[10px] uppercase h-12 px-8 rounded-xl shadow-xl transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Registrar Cumprimento
                    </Button>
                    <Button variant="ghost" size="icon" className="h-12 w-12 text-white/20 hover:text-white rounded-xl border border-white/5"><MoreVertical className="h-5 w-5" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="py-48 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-[3rem]">
          <Clock className="h-20 w-20 mb-6" />
          <p className="text-sm font-black uppercase tracking-[0.5em]">Radar de riscos limpo</p>
        </div>
      )}
    </div>
  )
}
