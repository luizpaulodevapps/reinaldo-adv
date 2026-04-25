
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Gavel, 
  MapPin, 
  Clock, 
  Loader2, 
  ChevronRight, 
  Video,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Scale,
  Navigation,
  Edit3
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { format, parseISO, isAfter, startOfDay, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

export default function AudienciasSubpage() {
  const db = useFirestore()
  const { user } = useUser()

  const hearingsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "hearings"), orderBy("startDateTime", "asc"))
  }, [db, user])
  const { data: hearings, isLoading } = useCollection(hearingsQuery)

  const searchParams = useSearchParams()
  const selectedAdvogado = searchParams.get("advogado")
  const searchQuery = searchParams.get("q")

  const upcomingHearings = useMemo(() => {
    if (!hearings) return []
    const today = startOfDay(new Date())
    return hearings
      .filter(h => {
        const date = h.startDateTime ? parseISO(h.startDateTime) : null
        return date && (isSameDay(date, today) || isAfter(date, today))
      })
      .filter(h => h.status !== "Realizada")
      .filter(h => {
        if (!selectedAdvogado) return true
        return h.responsibleLawyer === selectedAdvogado
      })
      .filter(h => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
          h.title?.toLowerCase().includes(q) || 
          h.clientName?.toLowerCase().includes(q) || 
          h.processNumber?.toLowerCase().includes(q)
        )
      })
  }, [hearings, selectedAdvogado, searchQuery])

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Pauta de Audiências Futuras</h2>
        <Badge variant="outline" className="text-[10px] font-black border-rose-500/30 text-rose-500 bg-rose-500/5 px-4 h-8 uppercase tracking-widest">
          {upcomingHearings.length} Atos Pendentes
        </Badge>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Auditando Pauta Judiciária...</span>
        </div>
      ) : upcomingHearings.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {upcomingHearings.map((h) => {
            const date = h.startDateTime ? parseISO(h.startDateTime) : null
            return (
              <Card key={h.id} className="glass border-white/5 hover-gold transition-all group overflow-hidden rounded-2xl">
                <CardContent className="p-0 flex flex-col md:flex-row">
                  <div className="p-8 md:w-40 flex flex-col items-center justify-center bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/5 group-hover:bg-primary/5 transition-all">
                    <span className="text-[10px] font-black text-muted-foreground uppercase mb-1">{date ? format(date, "MMM", { locale: ptBR }).toUpperCase() : "---"}</span>
                    <span className="text-3xl font-black text-white">{date ? format(date, "dd") : "--"}</span>
                    <span className="text-[10px] font-mono font-bold text-primary mt-2">{date ? format(date, "HH:mm") : "--:--"}</span>
                  </div>
                  
                  <div className="flex-1 p-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-rose-500/10 text-rose-500 border-0 text-[9px] font-black uppercase tracking-widest px-3">
                        {h.type || 'AUDIÊNCIA'}
                      </Badge>
                      {h.type === 'Virtual' && <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500 uppercase font-black bg-emerald-500/5">VIRTUAL</Badge>}
                    </div>
                    
                    <h4 className="text-xl font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">{h.title}</h4>
                    
                    <div className="flex flex-wrap items-center gap-8 pt-2">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2.5">
                        <Scale className="h-4 w-4 text-primary/40" /> {h.processNumber || 'N/A'} • {h.clientName}
                      </p>
                      {h.location && (
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2.5">
                          <MapPin className="h-4 w-4 text-primary/40" /> {h.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-8 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/5 gap-3">
                    {h.location && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-12 w-12 border-primary/20 text-primary hover:bg-primary/10 rounded-xl"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.location)}`, "_blank")}
                      >
                        <Navigation className="h-5 w-5" />
                      </Button>
                    )}
                    {(h.meetingLink || h.meetingUrl) && (
                      <Button 
                        variant="outline" 
                        className="h-12 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 font-black text-[10px] uppercase gap-3 px-6 rounded-xl"
                        onClick={() => window.open(h.meetingLink || h.meetingUrl, "_blank")}
                      >
                        <Video className="h-4 w-4" /> Sala Virtual
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-12 w-12 text-white/20 hover:text-white rounded-xl border border-white/5"><Edit3 className="h-5 w-5" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="py-48 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-[3rem]">
          <Gavel className="h-20 w-20 mb-6" />
          <p className="text-sm font-black uppercase tracking-[0.5em]">Nenhuma audiência futura na pauta</p>
        </div>
      )}
    </div>
  )
}
