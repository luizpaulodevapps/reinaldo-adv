
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
  ChevronRight,
  Video,
  Lock,
  ExternalLink,
  Zap
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

  const appointmentsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "appointments"), orderBy("startDateTime", "asc"))
  }, [db, user])
  
  const { data: appointments, isLoading: loadingAppointments } = useCollection(appointmentsQuery)

  const isLoading = loadingHearings || loadingDeadlines || loadingAppointments

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

    const dayAppointments = (appointments || []).filter(a => {
      const aDate = parseDate(a.startDateTime)
      return aDate && isSameDay(aDate, selectedDate)
    }).map(a => ({ ...a, eventType: 'atendimento' }))

    return [...dayHearings, ...dayDeadlines, ...dayAppointments].sort((a, b) => {
      const dateA = parseDate(a.startDateTime || a.dueDate)
      const dateB = parseDate(b.startDateTime || b.dueDate)
      const timeA = dateA?.getTime() || 0
      const timeB = dateB?.getTime() || 0
      return timeA - timeB
    })
  }, [selectedDate, hearings, deadlines, appointments])

  const hasEventsOnDay = (day: Date) => {
    const hasHearing = (hearings || []).some(h => {
      const d = parseDate(h.startDateTime)
      return d && isSameDay(d, day)
    })
    const hasDeadline = (deadlines || []).some(d => {
      const date = parseDate(d.dueDate)
      return date && isSameDay(date, day)
    })
    const hasAppointment = (appointments || []).some(a => {
      const date = parseDate(a.startDateTime)
      return date && isSameDay(aDate, day)
    })
    return { hasHearing, hasDeadline, hasAppointment }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Agenda de Compromissos</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-[0.2em] font-black opacity-60">Visão global de pauta física e virtual RGMJ.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="glass border-white/10 text-[11px] font-black uppercase tracking-widest gap-3 h-12 px-6">
            <Filter className="h-4 w-4" /> Filtrar Agendas
          </Button>
          <Button variant="outline" className="glass border-white/10 text-[11px] font-black uppercase tracking-widest gap-3 h-12 px-6" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Sincronizar
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 pb-2">
        <Button className="gold-gradient text-background font-black gap-3 text-xs uppercase tracking-[0.2em] h-12 px-8 rounded-xl shadow-xl">
          <CalendarIcon className="h-4 w-4" /> Calendário Mensal
        </Button>
        <Button variant="ghost" className="text-muted-foreground hover:text-white font-black gap-3 text-xs uppercase tracking-[0.2em] h-12 px-8">
          <Clock className="h-4 w-4" /> Próximos Atos
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/5" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button variant="secondary" className="h-10 px-6 text-[11px] font-black uppercase bg-[#1a1f2e] text-white border border-white/5" onClick={() => setCurrentMonth(new Date())}>Hoje</Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/5" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="glass rounded-[2rem] overflow-hidden border-white/5 shadow-2xl bg-white/[0.01]">
            <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.03]">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                <div key={day} className="py-5 text-center text-[10px] font-black text-muted-foreground tracking-[0.3em] border-r border-white/5 last:border-r-0 uppercase">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const { hasHearing, hasDeadline, hasAppointment } = hasEventsOnDay(day)
                const isSelected = isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, currentMonth)

                return (
                  <div 
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[140px] p-5 border-r border-b border-white/5 cursor-pointer transition-all hover:bg-primary/5 group relative",
                      !isCurrentMonth && "opacity-10 pointer-events-none",
                      isSelected && "bg-primary/5 ring-2 ring-inset ring-primary/30"
                    )}
                  >
                    <span className={cn("text-sm font-black transition-colors", isSelected ? "text-primary scale-125 inline-block" : "text-muted-foreground group-hover:text-white")}>
                      {format(day, "d")}
                    </span>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {hasHearing && <div className="h-2.5 w-2.5 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.6)]" title="Audiência" />}
                      {hasDeadline && <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(245,208,48,0.6)]" title="Prazo" />}
                      {hasAppointment && <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" title="Atendimento" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="pb-4 border-b border-white/5">
              <h3 className="text-primary font-black uppercase tracking-[0.3em] text-xs">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
            </div>

            <div className="space-y-4 min-h-[500px] flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Auditando Pauta...</span>
                </div>
              ) : selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event, idx) => (
                  <Card key={idx} className="glass border-l-4 border-l-primary/50 hover-gold transition-all shadow-xl rounded-2xl overflow-hidden bg-white/[0.02]">
                    <CardContent className="p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={event.eventType === 'audiencia' ? 'destructive' : event.eventType === 'atendimento' ? 'secondary' : 'outline'}
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-3 py-1",
                            event.eventType === 'atendimento' && "bg-amber-500 text-background border-0"
                          )}
                        >
                          {event.eventType === 'atendimento' ? 'Atendimento Lead' : event.hearingType === 'Virtual' ? 'Audiência Virtual' : event.eventType === 'audiencia' ? 'Audiência Física' : 'Prazo'}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono font-bold flex items-center gap-2">
                          <Clock className="h-3 w-3" /> {event.startDateTime ? format(parseDate(event.startDateTime)!, "HH:mm") : "--:--"}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-base text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{event.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-2 font-black uppercase tracking-[0.15em]">
                          {event.eventType === 'atendimento' ? <Zap className="h-3.5 w-3.5 text-amber-500" /> : <Scale className="h-3.5 w-3.5 text-primary" />}
                          {event.eventType === 'atendimento' ? `Lead: ${event.clientName}` : `Proc: ${event.processNumber || event.processId || "N/A"}`}
                        </p>
                      </div>

                      {(event.hearingType === 'Virtual' || event.meetingType === 'online') ? (
                        <div className="space-y-3 pt-4 border-t border-white/5">
                          <div className="text-[10px] text-emerald-500 flex items-center gap-2 font-black uppercase tracking-[0.2em]">
                            <Video className="h-4 w-4" /> Sala Virtual Liberada
                          </div>
                          {event.meetingLink && (
                            <a href={event.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-white hover:text-primary transition-colors font-bold truncate underline decoration-primary/30">
                              <ExternalLink className="h-3.5 w-3.5" /> {event.meetingLink}
                            </a>
                          )}
                          {event.accessCode && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-black uppercase tracking-widest bg-black/20 p-2 rounded-lg border border-white/5">
                              <Lock className="h-3.5 w-3.5" /> Chave: <span className="text-white ml-1">{event.accessCode}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        event.location && (
                          <div className="text-[10px] text-muted-foreground flex items-start gap-3 font-bold uppercase tracking-widest pt-4 border-t border-white/5">
                            <MapPin className="h-4 w-4 text-primary shrink-0" /> 
                            <span className="leading-relaxed">{event.location}</span>
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20 space-y-6">
                  <CalendarIcon className="h-16 w-16 text-muted-foreground" />
                  <p className="text-xs font-black uppercase tracking-[0.4em] leading-relaxed">Pauta limpa para este ciclo</p>
                </div>
              )}
            </div>

            <Button className="w-full gold-gradient text-background font-black gap-3 py-8 rounded-2xl shadow-2xl uppercase text-[11px] tracking-[0.2em] hover:scale-[1.02] transition-all">
              Agendar Ato de Elite
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
