
"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  MapPin, 
  Scale, 
  AlertCircle, 
  User, 
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Filter,
  Loader2
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { format, isSameDay, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function AgendaPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const db = useFirestore()
  const { user } = useUser()

  // Busca Audiências - Protegido por user
  const hearingsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "hearings"), orderBy("startDateTime", "asc"))
  }, [db, user])
  
  const { data: hearings, isLoading: loadingHearings } = useCollection(hearingsQuery)

  // Busca Prazos - Protegido por user
  const deadlinesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "deadlines"), orderBy("dueDate", "asc"))
  }, [db, user])
  
  const { data: deadlines, isLoading: loadingDeadlines } = useCollection(deadlinesQuery)

  // Filtra eventos para o dia selecionado
  const dailyEvents = useMemo(() => {
    if (!date) return []

    const dayHearings = (hearings || []).filter(h => {
      if (!h.startDateTime) return false
      try {
        const hDate = typeof h.startDateTime === 'string' 
          ? parseISO(h.startDateTime) 
          : (h.startDateTime.toDate ? h.startDateTime.toDate() : new Date(h.startDateTime));
        return isSameDay(hDate, date)
      } catch (e) {
        return false;
      }
    }).map(h => ({ ...h, eventType: 'audiencia' }))

    const dayDeadlines = (deadlines || []).filter(d => {
      if (!d.dueDate) return false
      try {
        const dDate = typeof d.dueDate === 'string' 
          ? parseISO(d.dueDate) 
          : (d.dueDate.toDate ? d.dueDate.toDate() : new Date(d.dueDate));
        return isSameDay(dDate, date)
      } catch (e) {
        return false;
      }
    }).map(d => ({ ...d, eventType: 'prazo' }))

    return [...dayHearings, ...dayDeadlines].sort((a, b) => {
      const timeA = new Date(a.startDateTime || a.dueDate).getTime();
      const timeB = new Date(b.startDateTime || b.dueDate).getTime();
      return timeA - timeB;
    })
  }, [date, hearings, deadlines])

  const isLoading = loadingHearings || loadingDeadlines;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary mb-2">Agenda Estratégica</h1>
          <p className="text-muted-foreground">Controle absoluto de audiências, prazos e reuniões.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="glass gap-2 border-primary/20">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button className="gold-gradient text-background font-bold gap-2">
            <Plus className="h-4 w-4" /> Novo Compromisso
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Esquerdo: Calendário e Stats */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass border-primary/20 p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
              locale={ptBR}
            />
          </Card>

          <Card className="glass border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary/5 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" /> Resumo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                <span className="text-sm text-muted-foreground">Audiências</span>
                <span className="font-bold text-primary">{dailyEvents.filter(e => e.eventType === 'audiencia').length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                <span className="text-sm text-muted-foreground">Prazos Fatais</span>
                <span className="font-bold text-destructive">{dailyEvents.filter(e => e.eventType === 'prazo').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Timeline do Dia */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-headline font-bold flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-primary" />
              {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
            </h3>
            <Badge variant="outline" className="glass border-primary/30 text-primary">
              {isLoading ? "Sincronizando..." : `${dailyEvents.length} compromissos`}
            </Badge>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="h-[400px] flex flex-col items-center justify-center p-12 glass rounded-2xl border-dashed border-2 border-border/50 text-muted-foreground">
                <Loader2 className="h-10 w-10 mb-4 animate-spin text-primary" />
                <p className="text-center font-light">
                  Acessando dossiê de compromissos...
                </p>
              </div>
            ) : dailyEvents.length > 0 ? (
              dailyEvents.map((event, i) => (
                <Card key={i} className="glass hover-gold transition-all group border-l-4 border-l-primary/50">
                  <CardContent className="p-6 flex items-center justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-secondary/50 border border-border/50 shrink-0">
                        <Clock className="h-4 w-4 text-primary mb-1" />
                        <span className="text-sm font-bold">
                          {event.startDateTime 
                            ? format(new Date(typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toDate()), "HH:mm") 
                            : "--:--"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={event.eventType === 'audiencia' ? 'destructive' : 'secondary'}
                            className="text-[9px] uppercase font-bold tracking-tighter"
                          >
                            {event.eventType === 'audiencia' ? 'Audiência' : 'Prazo Judicial'}
                          </Badge>
                          {event.status === 'vencido' && <Badge variant="destructive" className="animate-pulse">URGENTE</Badge>}
                        </div>
                        <h4 className="text-xl font-bold group-hover:text-primary transition-colors">{event.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-light">
                          <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> Dr. Reinaldo G.</span>
                          {event.location && (
                            <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {event.location}</span>
                          )}
                          <span className="flex items-center gap-1.5"><Scale className="h-3 w-3" /> Proc: {event.processId || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center p-12 glass rounded-2xl border-dashed border-2 border-border/50 text-muted-foreground">
                <CalendarIcon className="h-16 w-16 mb-4 opacity-10" />
                <p className="text-center font-light italic">
                  Nenhum compromisso estratégico registrado <br/> para este dia.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
