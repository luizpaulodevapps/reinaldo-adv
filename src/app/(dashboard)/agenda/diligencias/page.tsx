
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Navigation, 
  MapPin, 
  User, 
  CheckCircle2, 
  Loader2, 
  MoreVertical,
  FileSignature,
  Scale
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { format, parseISO, isBefore, startOfDay, isAfter, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function DiligenciasSubpage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const diligencesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "diligences"), orderBy("dueDate", "asc"))
  }, [db, user])
  const { data: diligences, isLoading } = useCollection(diligencesQuery)

  const activeDiligences = useMemo(() => {
    if (!diligences) return []
    const today = startOfDay(new Date())
    return diligences
      .filter(d => d.status !== "Concluída")
      .filter(d => {
        const date = d.dueDate ? parseISO(d.dueDate) : null
        return date && (isSameDay(date, today) || isAfter(date, today) || isBefore(date, today))
      })
  }, [diligences])

  const handleComplete = (id: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "diligences", id), {
      status: "Concluída",
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    toast({ title: "Tarefa Concluída", description: "O ato externo foi arquivado." })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Pauta de Atos Externos</h2>
        <Badge variant="outline" className="text-[10px] font-black border-blue-500/30 text-blue-400 bg-blue-500/5 px-4 h-8 uppercase tracking-widest">
          {activeDiligences.length} Atribuições Ativas
        </Badge>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Pauta Externa...</span>
        </div>
      ) : activeDiligences.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {activeDiligences.map((d) => {
            const dueDate = d.dueDate ? parseISO(d.dueDate) : null
            const isOverdue = dueDate && isBefore(dueDate, startOfDay(new Date()))
            
            return (
              <Card key={d.id} className="glass border-white/5 hover-gold transition-all group overflow-hidden rounded-2xl">
                <CardContent className="p-0 flex flex-col md:flex-row">
                  <div className={cn(
                    "p-8 md:w-40 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 group-hover:bg-primary/5 transition-all",
                    isOverdue && "bg-rose-500/5"
                  )}>
                    <span className="text-[10px] font-black text-muted-foreground uppercase mb-1">{dueDate ? format(dueDate, "MMM", { locale: ptBR }).toUpperCase() : "---"}</span>
                    <span className={cn("text-3xl font-black", isOverdue ? "text-rose-500" : "text-white")}>{dueDate ? format(dueDate, "dd") : "--"}</span>
                    <span className="text-[10px] font-mono font-bold text-primary mt-2">{dueDate ? format(dueDate, "HH:mm") : "--:--"}</span>
                  </div>

                  <div className="flex-1 p-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 border-0",
                        d.type === 'Física' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {d.type === 'Física' ? '🏢 DILIGÊNCIA FÍSICA' : '🖥️ DILIGÊNCIA VIRTUAL'}
                      </Badge>
                      {d.requiresSubestabelecimento && <Badge className="bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase">SUBESTABELECIMENTO REQUERIDO</Badge>}
                    </div>
                    
                    <h4 className="text-xl font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">{d.title}</h4>
                    
                    <div className="flex flex-wrap items-center gap-8 pt-2">
                      <p className="text-[10px] text-white/80 font-black uppercase tracking-widest flex items-center gap-2.5">
                        <User className="h-4 w-4 text-emerald-500" /> Executor: {d.assigneeName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2.5">
                        <Scale className="h-4 w-4 text-primary/40" /> {d.clientName} • {d.processNumber}
                      </p>
                    </div>
                  </div>

                  <div className="p-8 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/5 gap-4">
                    <Button 
                      onClick={() => handleComplete(d.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black gap-3 text-[10px] uppercase h-12 px-8 rounded-xl shadow-xl transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Finalizar Task
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
          <Navigation className="h-20 w-20 mb-6" />
          <p className="text-sm font-black uppercase tracking-[0.5em]">Nenhuma diligência pendente</p>
        </div>
      )}
    </div>
  )
}
