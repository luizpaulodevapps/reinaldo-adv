
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  MapPin, 
  Scale, 
  Calendar as CalendarIcon,
  Filter,
  Loader2,
  ChevronLeft,
  RefreshCw,
  History,
  ChevronRight,
  Video,
  Lock,
  ExternalLink
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, orderBy, Timestamp } from "firebase/firestore"
import { 
  format, 
  isSameDay, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  subMonths 
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function AgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const db = useFirestore()
  const { user } = useUser()

  const hearingsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "hearings"), orderBy("startDateTime", "asc"))
  }, [db, user])
  
  const { data: hearings, isLoading: loadingHearings } = useCollection(hearingsQuery)

  const deadlinesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "deadlines"), orderBy("dueDate", "asc"))
  }, [db, user])
  
  const { data: deadlines, isLoading: loadingDeadlines } = useCollection(deadlinesQuery)

  const isLoading = loadingHearings || loadingDeadlines

  const parseDate = (dateValue: any) => {
    if (!dateValue) return null
    if (dateValue instanceof Timestamp) return dateValue.toDate()
    if (typeof dateValue === 'string') return parseISO(dateValue)
    if (dateValue?.toDate) return dateValue.toDate()
    return new Date(dateValue)
  }

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const selectedDayEvents = useMemo(() => {
    const dayHearings = (hearings || []).filter(h => {
      const hDate = parseDate(h.startDateTime)
      return hDate && isSameDay(hDate, selectedDate)
    }).map(h => ({ ...h, eventType: 'audiencia' }))

    const dayDeadlines = (deadlines || []).filter(d => {
      const dDate = parseDate(d.dueDate)
      return dDate && isSameDay(dDate, selectedDate)
    }).map(d => ({ ...d, eventType: 'prazo' }))

    return [...dayHearings, ...dayDeadlines].sort((a, b) => {
      const dateA = parseDate(a.startDateTime || a.dueDate)
      const dateB = parseDate(b.startDateTime || b.dueDate)
      const timeA = dateA?.getTime() || 0
      const timeB = dateB?.getTime() || 0
      return timeA - timeB
    })
  }, [selectedDate, hearings, deadlines])

  const hasEventsOnDay = (day: Date) => {
    const hasHearing = (hearings || []).some(h => {
      const d = parseDate(h.startDateTime)
      return d && isSameDay(d, day)
    })
    const hasDeadline = (deadlines || []).some(d => {
      const date = parseDate(d.dueDate)
      return date && isSameDay(date, day)
    })
    return { hasHearing, hasDeadline }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Agenda de Compromissos</h1>
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black opacity-60">Visão global de pauta física e virtual RGMJ.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="glass border-primary/20 text-[10px] font-black uppercase tracking-widest gap-2">
            <Filter className="h-3.5 w-3.5" /> Filtrar Agendas
          </Button>
          <Button variant="outline" className="glass border-primary/20 text-[10px] font-black uppercase tracking-widest gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5" /> Sincronizar
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2 overflow-x-auto scrollbar-hide">
        <Button variant="secondary" className="bg-primary text-background font-black gap-2 text-[10px] uppercase tracking-widest h-9 px-6 rounded-md">
          <CalendarIcon className="h-3.5 w-3.5" /> Calendário Mensal
        </Button>
        <Button variant="ghost" className="text-muted-foreground hover:text-white font-black gap-2 text-[10px] uppercase tracking-widest h-9 px-6">
          <Clock className="h-3.5 w-3.5" /> Próximos Atos
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="secondary" className="h-8 px-4 text-[10px] font-black uppercase bg-secondary/50" onClick={() => setCurrentMonth(new Date())}>Hoje</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="glass rounded-xl overflow-hidden border-border/40 shadow-2xl">
            <div className="grid grid-cols-7 border-b border-border/40 bg-secondary/20">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                <div key={day} className="py-3 text-center text-[10px] font-black text-muted-foreground tracking-[0.2em] border-r border-border/40 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const { hasHearing, hasDeadline } = hasEventsOnDay(day)
                const isSelected = isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, currentMonth)

                return (
                  <div 
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[120px] p-3 border-r border-b border-border/40 cursor-pointer transition-all hover:bg-primary/5 group relative",
                      !isCurrentMonth && "opacity-20 pointer-events-none",
                      isSelected && "bg-primary/10 ring-1 ring-inset ring-primary/50"
                    )}
                  >
                    <span className={cn("text-[10px] font-black", isSelected ? "text-primary" : "text-muted-foreground")}>
                      {format(day, "d")}
                    </span>
                    <div className="mt-2 space-y-1">
                      {hasHearing && <div className="h-1.5 w-1.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                      {hasDeadline && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(245,208,48,0.5)]" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="pb-4 border-b border-white/5">
              <h3 className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
            </div>

            <div className="space-y-4 min-h-[500px] flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</span>
                </div>
              ) : selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event, idx) => (
                  <Card key={idx} className="glass border-l-4 border-l-primary/50 hover-gold transition-all shadow-xl">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={event.eventType === 'audiencia' ? 'destructive' : 'outline'}
                          className="text-[8px] font-black uppercase tracking-widest px-2"
                        >
                          {event.hearingType === 'Virtual' ? 'Audiência Virtual' : event.eventType === 'audiencia' ? 'Audiência Física' : 'Prazo'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono font-bold">
                          {event.startDateTime ? format(parseDate(event.startDateTime)!, "HH:mm") : "--:--"}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-sm text-white uppercase tracking-tight leading-tight">{event.title}</h4>
                        <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1 font-bold uppercase tracking-widest">
                          <Scale className="h-3 w-3" /> Proc: {event.processNumber || event.processId || "N/A"}
                        </p>
                      </div>

                      {event.hearingType === 'Virtual' ? (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div className="text-[9px] text-emerald-500 flex items-center gap-2 font-black uppercase tracking-widest">
                            <Video className="h-3.5 w-3.5" /> Sala Virtual Ativa
                          </div>
                          {event.meetingLink && (
                            <a href={event.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] text-white hover:text-primary transition-colors font-bold truncate underline">
                              <ExternalLink className="h-3 w-3" /> {event.meetingLink}
                            </a>
                          )}
                          {event.accessCode && (
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                              <Lock className="h-3 w-3" /> Senha: <span className="text-white ml-1">{event.accessCode}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        event.location && (
                          <div className="text-[9px] text-muted-foreground flex items-start gap-2 font-bold uppercase tracking-widest pt-2 border-t border-white/5">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> 
                            <span className="leading-relaxed">{event.location}</span>
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">Sem compromissos nesta data</p>
                </div>
              )}
            </div>

            <Button className="w-full gold-gradient text-background font-black gap-2 py-8 rounded-xl shadow-2xl uppercase text-[11px] tracking-widest">
              Agendar Ato de Elite
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
