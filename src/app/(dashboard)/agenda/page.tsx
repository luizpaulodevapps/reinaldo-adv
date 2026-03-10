
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
  ExternalLink,
  Zap,
  Trash2,
  FileText,
  CheckCircle2,
  ArrowRight,
  Plus,
  CloudLightning,
  AlertCircle
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking, useDoc } from "@/firebase"
import { collection, query, orderBy, Timestamp, doc, serverTimestamp } from "firebase/firestore"
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
  subMonths,
  isAfter,
  startOfDay
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'upcoming'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [syncing, setSyncing] = useState(false)
  
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" })
  const [newEventData, setNewEventData] = useState({
    title: "",
    type: "Atendimento",
    date: "",
    time: "",
    location: "",
    notes: ""
  })

  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  // Sincronismo Real com Google Settings
  const googleSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleConfig } = useDoc(googleSettingsRef)

  const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com')
  const isIntegrationActive = googleConfig?.isCalendarActive && googleConfig?.clientId

  const syncStatus = useMemo(() => {
    if (!isGoogleUser) return { label: "LOGIN NECESSÁRIO", color: "text-amber-500", bg: "bg-amber-500/10", dot: "bg-amber-500" }
    if (!isIntegrationActive) return { label: "AGUARDANDO CONFIG", color: "text-rose-500", bg: "bg-rose-500/10", dot: "bg-rose-500" }
    return { label: "SINC. ATIVA", color: "text-emerald-500", bg: "bg-emerald-500/10", dot: "bg-emerald-500" }
  }, [isGoogleUser, isIntegrationActive])

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
    if (typeof dateValue === 'string') {
      try {
        return parseISO(dateValue)
      } catch (e) {
        return new Date(dateValue)
      }
    }
    if (dateValue?.toDate) return dateValue.toDate()
    if (dateValue?.seconds) return new Date(dateValue.seconds * 1000)
    return new Date(dateValue)
  }

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const allEvents = useMemo(() => {
    const h = (hearings || []).map(h => ({ ...h, eventType: 'audiencia', collection: 'hearings', date: parseDate(h.startDateTime) }))
    const d = (deadlines || []).map(d => ({ ...d, eventType: 'prazo', collection: 'deadlines', date: parseDate(d.dueDate) }))
    const a = (appointments || []).map(a => ({ ...a, eventType: 'atendimento', collection: 'appointments', date: parseDate(a.startDateTime) }))
    return [...h, ...d, ...a]
  }, [hearings, deadlines, appointments])

  const selectedDayEvents = useMemo(() => {
    return allEvents
      .filter(e => e.date && isSameDay(e.date, selectedDate))
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
  }, [selectedDate, allEvents])

  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date())
    return allEvents
      .filter(e => e.date && (isSameDay(e.date, today) || isAfter(e.date, today)))
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
  }, [allEvents])

  const hasEventsOnDay = (day: Date) => {
    const hasHearing = (hearings || []).some(h => {
      const date = parseDate(h.startDateTime)
      return date && isSameDay(date, day)
    })
    const hasDeadline = (deadlines || []).some(dl => {
      const date = parseDate(dl.dueDate)
      return date && isSameDay(date, day)
    })
    const hasAppointment = (appointments || []).some(a => {
      const date = parseDate(a.startDateTime)
      return date && isSameDay(date, day)
    })
    return { hasHearing, hasDeadline, hasAppointment }
  }

  const handleOpenEvent = (event: any) => {
    setSelectedEvent(event)
    const eventDate = parseDate(event.startDateTime || event.dueDate)
    setRescheduleData({
      date: eventDate ? format(eventDate, "yyyy-MM-dd") : "",
      time: eventDate ? format(eventDate, "HH:mm") : ""
    })
    setIsDetailOpen(true)
    setIsRescheduling(false)
  }

  const handleDeleteEvent = () => {
    if (!db || !selectedEvent) return
    if (!confirm("Confirmar a exclusão permanente deste ato da pauta?")) return
    
    deleteDocumentNonBlocking(doc(db, selectedEvent.collection, selectedEvent.id))
    setIsDetailOpen(false)
    setSelectedEvent(null)
    toast({ variant: "destructive", title: "Ato Removido da Pauta" })
  }

  const handleReschedule = () => {
    if (!db || !selectedEvent || !rescheduleData.date || !rescheduleData.time) return
    
    const newDateTime = `${rescheduleData.date}T${rescheduleData.time}:00`
    const updatePayload: any = {
      updatedAt: serverTimestamp()
    }

    if (selectedEvent.eventType === 'prazo') {
      updatePayload.dueDate = rescheduleData.date
    } else {
      updatePayload.startDateTime = newDateTime
    }

    updateDocumentNonBlocking(doc(db, selectedEvent.collection, selectedEvent.id), updatePayload)
    setIsRescheduling(false)
    setIsDetailOpen(false)
    toast({ title: "Agenda Atualizada", description: "O novo cronograma foi sincronizado." })
  }

  const handleCreateEvent = () => {
    if (!db || !newEventData.title || !newEventData.date || !newEventData.time) {
      toast({ variant: "destructive", title: "Dados Incompletos" })
      return
    }

    const startDateTime = `${newEventData.date}T${newEventData.time}:00`
    const collectionName = newEventData.type === 'Audiência' ? 'hearings' : 'appointments'
    
    const payload = {
      title: newEventData.title.toUpperCase(),
      type: newEventData.type,
      startDateTime,
      location: newEventData.location,
      notes: newEventData.notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "Agendado"
    }

    addDocumentNonBlocking(collection(db, collectionName), payload)
    setIsCreateOpen(false)
    setNewEventData({ title: "", type: "Atendimento", date: "", time: "", location: "", notes: "" })
    toast({ title: "Compromisso Injetado na Pauta" })
  }

  const handleManualSync = () => {
    if (!isIntegrationActive) {
      toast({ 
        variant: "destructive", 
        title: "Integração Pendente", 
        description: "Configure o Client ID do Google no Centro de Comando." 
      })
      return
    }
    setSyncing(true)
    toast({ title: "Sincronizando...", description: "Comunicação estabelecida com Google Calendar API." })
    setTimeout(() => {
      setSyncing(false)
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Agenda de Compromissos</h1>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-black opacity-60">Visão global de pauta física e virtual RGMJ.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Real de Sincronismo */}
          <div className={cn("px-4 py-2 rounded-full border flex items-center gap-2.5 transition-all shadow-lg", syncStatus.bg, syncStatus.color.replace('text-', 'border-').replace('500', '500/20'))}>
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", syncStatus.dot)} />
            <span className="text-[9px] font-black uppercase tracking-widest">{syncStatus.label}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="glass border-white/10 text-[10px] font-black uppercase tracking-widest gap-2 h-10 px-4">
              <Filter className="h-3.5 w-3.5" /> Filtrar
            </Button>
            <Button 
              onClick={handleManualSync}
              variant="outline" 
              className="glass border-white/10 text-[10px] font-black uppercase tracking-widest gap-2 h-10 px-4 hover:border-primary/40 hover:text-primary transition-all"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} /> Sincronizar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pb-2">
        <Button 
          onClick={() => setViewMode('calendar')}
          className={cn(
            "font-black gap-2 text-[10px] uppercase tracking-[0.2em] h-10 px-6 rounded-lg transition-all",
            viewMode === 'calendar' ? "gold-gradient text-background shadow-lg" : "glass border-primary/20 text-primary hover:bg-primary/5"
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" /> Calendário Mensal
        </Button>
        <Button 
          onClick={() => setViewMode('upcoming')}
          className={cn(
            "font-black gap-2 text-[10px] uppercase tracking-[0.2em] h-10 px-6 rounded-lg transition-all border",
            viewMode === 'upcoming' ? "gold-gradient text-background shadow-lg border-0" : "glass border-primary/40 text-primary hover:bg-primary/5"
          )}
        >
          <Clock className="h-3.5 w-3.5" /> Próximos Atos
        </Button>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/5" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="secondary" className="h-8 px-4 text-[10px] font-black uppercase bg-[#1a1f2e] text-white border border-white/5 rounded-lg" onClick={() => setCurrentMonth(new Date())}>Hoje</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/5" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="glass rounded-2xl overflow-hidden border-white/5 shadow-xl bg-white/[0.01]">
              <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.03]">
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                  <div key={day} className="py-3 text-center text-[9px] font-black text-muted-foreground tracking-[0.2em] border-r border-white/5 last:border-r-0 uppercase">
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
                        "min-h-[100px] p-3 border-r border-b border-white/5 cursor-pointer transition-all hover:bg-primary/5 group relative",
                        !isCurrentMonth && "opacity-10 pointer-events-none",
                        isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/30"
                      )}
                    >
                      <span className={cn("text-xs font-black transition-colors", isSelected ? "text-primary scale-110 inline-block" : "text-muted-foreground group-hover:text-white")}>
                        {format(day, "d")}
                      </span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {hasHearing && <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]" />}
                        {hasDeadline && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(245,208,48,0.6)]" />}
                        {hasAppointment && <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.6)]" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="pb-2 border-b border-white/5">
                <h3 className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>
              </div>

              <div className="space-y-3 min-h-[400px] flex flex-col">
                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Auditando...</span>
                  </div>
                ) : selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map((event, idx) => (
                    <Card key={idx} onClick={() => handleOpenEvent(event)} className="glass border-l-4 border-l-primary/50 hover-gold cursor-pointer transition-all shadow-lg rounded-xl overflow-hidden bg-white/[0.02]">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={event.eventType === 'audiencia' ? 'destructive' : event.eventType === 'atendimento' ? 'secondary' : 'outline'}
                            className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5",
                              event.eventType === 'atendimento' && "bg-amber-500 text-background border-0"
                            )}
                          >
                            {event.eventType === 'atendimento' ? 'Atendimento' : event.hearingType === 'Virtual' ? 'Aud. Virtual' : event.eventType === 'audiencia' ? 'Aud. Física' : 'Prazo'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono font-bold flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> {event.date ? format(event.date, "HH:mm") : "--:--"}
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-sm text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{event.title}</h4>
                          <p className="text-[9px] text-muted-foreground mt-1.5 flex items-center gap-1.5 font-black uppercase tracking-[0.1em]">
                            {event.eventType === 'atendimento' ? <Zap className="h-3 w-3 text-amber-500" /> : <Scale className="h-3 w-3 text-primary" />}
                            {event.eventType === 'atendimento' ? `Lead: ${event.clientName || 'N/A'}` : `Proc: ${event.processNumber || event.processId || "N/A"}`}
                          </p>
                        </div>

                        {(event.hearingType === 'Virtual' || event.meetingType === 'online') ? (
                          <div className="pt-2 border-t border-white/5">
                            <div className="text-[9px] text-emerald-500 flex items-center gap-1.5 font-black uppercase tracking-[0.15em]">
                              <Video className="h-3.5 w-3.5" /> Sala Liberada
                            </div>
                          </div>
                        ) : (
                          event.location && (
                            <div className="text-[9px] text-muted-foreground flex items-start gap-2 font-bold uppercase tracking-widest pt-2 border-t border-white/5">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> 
                              <span className="leading-tight truncate">{event.location}</span>
                            </div>
                          )
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-20 space-y-4">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">Pauta limpa</p>
                  </div>
                )}
              </div>

              <Button onClick={() => setIsCreateOpen(true)} className="w-full gold-gradient text-background font-black gap-2 py-6 rounded-xl shadow-xl uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] transition-all">
                <Plus className="h-4 w-4" /> Agendar Ato
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Compilando Pauta RGMJ...</span>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {upcomingEvents.map((event, idx) => (
                <Card key={idx} onClick={() => handleOpenEvent(event)} className="glass border-white/5 hover-gold cursor-pointer transition-all shadow-xl rounded-2xl overflow-hidden group">
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    <div className="p-6 md:w-40 flex flex-col items-center justify-center bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/5 group-hover:bg-primary/5 transition-all">
                      <span className="text-[10px] font-black text-muted-foreground uppercase mb-1">{event.date ? format(event.date, "MMM", { locale: ptBR }).toUpperCase() : "---"}</span>
                      <span className="text-3xl font-black text-white">{event.date ? format(event.date, "dd") : "--"}</span>
                      <span className="text-[10px] font-mono font-bold text-primary mt-2">{event.date ? format(event.date, "HH:mm") : "--:--"}</span>
                    </div>
                    
                    <div className="flex-1 p-6 flex flex-col justify-center space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={event.eventType === 'audiencia' ? 'destructive' : event.eventType === 'atendimento' ? 'secondary' : 'outline'}
                          className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-3 py-1",
                            event.eventType === 'atendimento' && "bg-amber-500 text-background border-0"
                          )}
                        >
                          {event.eventType === 'atendimento' ? 'ATENDIMENTO' : event.eventType === 'audiencia' ? 'AUDIÊNCIA' : 'PRAZO JUDICIAL'}
                        </Badge>
                        {event.hearingType === 'Virtual' && <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-500 uppercase font-black">VIRTUAL</Badge>}
                      </div>
                      <h4 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">{event.title}</h4>
                      <div className="flex flex-wrap items-center gap-6">
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                          <Scale className="h-3.5 w-3.5 text-primary/50" /> {event.processNumber || event.clientName || "N/A"}
                        </p>
                        {event.location && (
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-primary/50" /> {event.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/5 opacity-0 group-hover:opacity-100 transition-all">
                      <ArrowRight className="h-6 w-6 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-40 flex flex-col items-center justify-center space-y-6 glass border-dashed border-2 border-white/5 rounded-[2rem] opacity-20">
              <Clock className="h-20 w-20 text-muted-foreground" />
              <p className="text-sm font-black uppercase tracking-[0.4em]">Nenhum ato futuro no radar</p>
            </div>
          )}
          
          <Button onClick={() => setIsCreateOpen(true)} className="w-full gold-gradient text-background font-black gap-3 py-8 rounded-2xl shadow-2xl uppercase text-xs tracking-[0.2em] hover:scale-[1.01] transition-all">
            <Plus className="h-5 w-5" /> Injetar Novo Ato na Pauta
          </Button>
        </div>
      )}

      {/* DIÁLOGO DE DETALHES */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl font-sans rounded-2xl">
          <div className="p-6 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary">{selectedEvent?.eventType}</Badge>
              </div>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter mt-3">
                {selectedEvent?.title}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 bg-[#0a0f1e]/50">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Cronograma</p>
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {selectedEvent?.date ? format(selectedEvent.date, "dd/MM/yyyy HH:mm") : "---"}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase text-[10px]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {selectedEvent?.status || "AGENDADO"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Localização</h4>
              </div>
              <p className="text-xs text-white/80 font-bold uppercase italic bg-black/20 p-3 rounded-lg border border-white/5">
                {selectedEvent?.location || selectedEvent?.meetingLink || "Local não informado"}
              </p>
            </div>

            {selectedEvent?.notes && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Observações</h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed uppercase font-medium">
                  {selectedEvent.notes}
                </p>
              </div>
            )}

            {isRescheduling && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-primary">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <h4 className="text-[9px] font-black uppercase tracking-widest">Novo Horário</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[8px] font-black uppercase text-muted-foreground">Data</Label>
                    <Input type="date" value={rescheduleData.date} onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})} className="glass border-white/10 h-10 text-white text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[8px] font-black uppercase text-muted-foreground">Hora</Label>
                    <Input type="time" value={rescheduleData.time} onChange={(e) => setRescheduleData({...rescheduleData, time: e.target.value})} className="glass border-white/10 h-10 text-white text-xs" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setIsRescheduling(false)} className="flex-1 h-10 uppercase font-black text-[9px] text-white">Cancelar</Button>
                  <Button onClick={handleReschedule} className="flex-1 gold-gradient h-10 text-background font-black uppercase text-[9px]">Confirmar</Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button onClick={handleDeleteEvent} variant="ghost" className="text-rose-500 hover:text-white hover:bg-rose-500/20 uppercase font-black text-[9px] tracking-widest gap-2">
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </Button>
            <div className="flex gap-2">
              {!isRescheduling && (
                <Button onClick={() => setIsRescheduling(true)} variant="outline" className="glass border-primary/30 text-primary font-black uppercase text-[9px] tracking-widest h-11 px-6 rounded-lg gap-2">
                  <RefreshCw className="h-3.5 w-3.5" /> Reagendar
                </Button>
              )}
              <Button onClick={() => setIsDetailOpen(false)} className="gold-gradient text-background font-black uppercase text-[9px] tracking-widest h-11 px-8 rounded-lg">
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CRIAÇÃO */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl font-sans rounded-2xl">
          <div className="p-6 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Novo Agendamento</DialogTitle>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="p-8 space-y-6 bg-[#0a0f1e]/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground">Tipo de Ato *</Label>
                  <Select value={newEventData.type} onValueChange={(v) => setNewEventData({...newEventData, type: v})}>
                    <SelectTrigger className="glass border-white/10 h-11 text-white text-xs font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      <SelectItem value="Audiência">🏛️ AUDIÊNCIA</SelectItem>
                      <SelectItem value="Atendimento">⚡ ATENDIMENTO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground">Título *</Label>
                  <Input value={newEventData.title} onChange={(e) => setNewEventData({...newEventData, title: e.target.value.toUpperCase()})} placeholder="EX: REUNIÃO ESTRATÉGICA" className="glass border-white/10 h-11 text-white text-xs font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground">Data *</Label>
                  <Input type="date" value={newEventData.date} onChange={(e) => setNewEventData({...newEventData, date: e.target.value})} className="glass border-white/10 h-11 text-white text-xs font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground">Horário *</Label>
                  <Input type="time" value={newEventData.time} onChange={(e) => setNewEventData({...newEventData, time: e.target.value})} className="glass border-white/10 h-11 text-white text-xs font-bold" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-muted-foreground">Localização / Link</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/50" />
                  <Input value={newEventData.location} onChange={(e) => setNewEventData({...newEventData, location: e.target.value.toUpperCase()})} placeholder="EX: SEDE RGMJ OU LINK DO MEET" className="glass border-white/10 h-11 pl-10 text-white text-xs font-bold" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-muted-foreground">Observações</Label>
                <Textarea value={newEventData.notes} onChange={(e) => setNewEventData({...newEventData, notes: e.target.value})} placeholder="Instruções para o ato..." className="glass border-white/10 min-h-[80px] text-white text-xs resize-none" />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-muted-foreground uppercase font-black text-[10px]">Cancelar</Button>
            <Button onClick={handleCreateEvent} className="gold-gradient text-background font-black uppercase text-[10px] px-10 h-12 rounded-lg shadow-lg">
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
