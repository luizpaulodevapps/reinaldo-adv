
"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
  Loader2,
  ChevronLeft,
  RefreshCw,
  History,
  LayoutGrid
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

  // Busca Audiências
  const hearingsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "hearings"), orderBy("startDateTime", "asc"))
  }, [db, user])
  
  const { data: hearings, isLoading: loadingHearings } = useCollection(hearingsQuery)

  // Busca Prazos
  const deadlinesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "deadlines"), orderBy("dueDate", "asc"))
  }, [db, user])
  
  const { data: deadlines, isLoading: loadingDeadlines } = useCollection(deadlinesQuery)

  const isLoading = loadingHearings || loadingDeadlines

  // Helper para converter data do Firestore (Timestamp ou String)
  const parseDate = (dateValue: any) => {
    if (!dateValue) return null
    if (dateValue instanceof Timestamp) return dateValue.toDate()
    if (typeof dateValue === 'string') return parseISO(dateValue)
    if (dateValue?.toDate) return dateValue.toDate()
    return new Date(dateValue)
  }

  // Gera os dias do calendário para o mês atual
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Filtra eventos para o dia selecionado (para o painel lateral)
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
      const timeA = parseDate(a.startDateTime || a.dueDate)?.getTime() || 0
      const timeB = parseDate(b.startDateTime || b.dueDate)?.getTime() || 0
      return timeA - timeB
    })
  }, [selectedDate, hearings, deadlines])

  // Função para verificar se um dia tem eventos (para renderizar indicadores no grid)
  const hasEventsOnDay = (day: Date) => {
    const hasHearing = (hearings || []).some(h => isSameDay(parseDate(h.startDateTime) || new Date(0), day))
    const hasDeadline = (deadlines || []).some(d => isSameDay(parseDate(d.dueDate) || new Date(0), day))
    return { hasHearing, hasDeadline }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-white tracking-tight">Agenda de Compromissos</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Visão global de atendimentos e pauta da banca</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="glass border-primary/20 text-xs font-bold gap-2">
            <Filter className="h-3.5 w-3.5" /> Filtrar por Agendas
          </Button>
          <Button variant="outline" className="glass border-primary/20 text-xs font-bold gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar Agenda
          </Button>
        </div>
      </div>

      {/* Tabs Estilizadas */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto">
        <Button variant="secondary" className="bg-primary text-background font-bold gap-2 text-xs h-9 px-4 rounded-md">
          <CalendarIcon className="h-3.5 w-3.5" /> Calendário Mensal
        </Button>
        <Button variant="ghost" className="text-muted-foreground hover:text-white font-bold gap-2 text-xs h-9 px-4">
          <Clock className="h-3.5 w-3.5" /> Próximos Compromissos
        </Button>
        <Button variant="ghost" className="text-muted-foreground hover:text-white font-bold gap-2 text-xs h-9 px-4">
          <History className="h-3.5 w-3.5" /> Histórico de Atos
        </Button>
      </div>

      {/* Layout Principal Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Coluna do Calendário (3/4) */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-headline font-bold uppercase tracking-widest text-white">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="secondary" className="h-8 px-4 text-[10px] font-bold uppercase bg-secondary/50" onClick={() => setCurrentMonth(new Date())}>
                Hoje
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="glass rounded-xl overflow-hidden border-border/40">
            {/* Dias da Semana */}
            <div className="grid grid-cols-7 border-b border-border/40 bg-secondary/20">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                <div key={day} className="py-3 text-center text-[10px] font-bold text-muted-foreground tracking-widest border-r border-border/40 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de Dias */}
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
                      "min-h-[120px] p-2 border-r border-b border-border/40 cursor-pointer transition-all hover:bg-secondary/20 group relative",
                      !isCurrentMonth && "opacity-20",
                      isSelected && "bg-secondary/30 ring-1 ring-inset ring-primary/50"
                    )}
                  >
                    <span className={cn(
                      "text-xs font-bold",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}>
                      {format(day, "d")}
                    </span>

                    {/* Indicadores de Eventos */}
                    <div className="mt-2 space-y-1">
                      {hasHearing && (
                        <div className="h-1.5 w-1.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      )}
                      {hasDeadline && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(245,208,48,0.5)]" />
                      )}
                    </div>

                    {/* Renderiza nomes curtos de eventos se houver espaço (opcional) */}
                    <div className="absolute bottom-2 left-2 right-2">
                      {hasHearing && <div className="text-[8px] text-destructive font-bold uppercase truncate opacity-50">Audiência</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Coluna Lateral de Detalhes (1/4) */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="pb-4 border-b border-border/40">
              <h3 className="text-primary font-bold uppercase tracking-[0.2em] text-xs">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
            </div>

            <div className="space-y-4 min-h-[500px] flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Sincronizando...</span>
                </div>
              ) : selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event, idx) => (
                  <Card key={idx} className="glass border-l-4 border-l-primary/50 hover-gold transition-all">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={event.eventType === 'audiencia' ? 'destructive' : 'outline'}
                          className="text-[9px] font-bold uppercase tracking-tighter"
                        >
                          {event.eventType === 'audiencia' ? 'Audiência' : 'Prazo'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {event.startDateTime 
                            ? format(parseDate(event.startDateTime)!, "HH:mm") 
                            : "--:--"}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-tight text-white">{event.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Scale className="h-3 w-3" /> Proc: {event.processId || "N/A"}
                        </p>
                      </div>
                      {event.location && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {event.location}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 rounded-full border border-border/40 flex items-center justify-center mb-4 opacity-20">
                    <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">
                    Sem Compromissos
                  </p>
                </div>
              )}
            </div>

            <Button className="w-full gold-gradient text-background font-bold gap-2 py-6 rounded-xl shadow-xl shadow-primary/10">
              <Plus className="h-4 w-4" /> Novo Agendamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
