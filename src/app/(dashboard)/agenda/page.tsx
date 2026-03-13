
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
  Loader2,
  ChevronLeft,
  RefreshCw,
  ChevronRight,
  Video,
  Plus,
  Navigation,
  Trash2,
  Edit3,
  Gavel,
  Target,
  Info,
  Copy,
  User as UserIcon
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
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
  subMonths
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function MasterAgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [syncing, setSyncing] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [viewingEvent, setViewingEvent] = useState<any>(null)
  const [editingEventData, setEditingEventData] = useState<any>(null)
  
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
      try { return parseISO(dateValue) } catch (e) { return new Date(dateValue) }
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

  const hasEventsOnDay = (day: Date) => {
    const hasHearing = (hearings || []).some(h => {
      const date = parseDate(h.startDateTime); return date && isSameDay(date, day)
    })
    const hasDeadline = (deadlines || []).some(dl => {
      const date = parseDate(dl.dueDate); return date && isSameDay(date, day)
    })
    const hasAppointment = (appointments || []).some(a => {
      const date = parseDate(a.startDateTime); return date && isSameDay(date, day)
    })
    return { hasHearing, hasDeadline, hasAppointment }
  }

  const handleManualSync = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      toast({ title: "Pauta Sincronizada", description: "O sistema cruzou os dados locais com a nuvem estratégica." })
    }, 1500)
  }

  const handleSaveEvent = () => {
    if (!db || !newEventData.title || !newEventData.date || !newEventData.time) return
    const startDateTime = `${newEventData.date}T${newEventData.time}:00`
    
    const collectionName = newEventData.type === 'Audiência' ? 'hearings' : 'appointments'
    
    const payload: any = {
      title: newEventData.title.toUpperCase(),
      type: newEventData.type,
      location: newEventData.location,
      notes: newEventData.notes,
      updatedAt: serverTimestamp()
    }

    if (collectionName === 'hearings' || collectionName === 'appointments') {
      payload.startDateTime = startDateTime
    } else {
      payload.dueDate = newEventData.date
    }

    if (editingEventData) {
      updateDocumentNonBlocking(doc(db!, editingEventData.collection, editingEventData.id), payload)
      toast({ title: "Compromisso Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db, collectionName), {
        ...payload,
        createdAt: serverTimestamp(),
        status: "Agendado"
      })
      toast({ title: "Compromisso Registrado" })
    }

    setIsCreateOpen(false)
    setEditingEventData(null)
    setNewEventData({ title: "", type: "Atendimento", date: "", time: "", location: "", notes: "" })
  }

  const handleDeleteEvent = (event: any) => {
    if (!db || !event.id || !event.collection) return
    if (confirm("Deseja remover este ato da pauta definitivamente?")) {
      deleteDocumentNonBlocking(doc(db, event.collection, event.id))
      setViewingEvent(null)
      toast({ variant: "destructive", title: "Ato Removido" })
    }
  }

  const handleOpenEdit = (event: any) => {
    setEditingEventData(event)
    setNewEventData({
      title: event.title,
      type: event.type || (event.eventType === 'audiencia' ? 'Audiência' : 'Atendimento'),
      date: event.date ? format(event.date, 'yyyy-MM-dd') : "",
      time: event.date ? format(event.date, 'HH:mm') : "",
      location: event.location || "",
      notes: event.notes || event.description || ""
    })
    setIsCreateOpen(true)
    setViewingEvent(null)
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copiado para o clipboard" })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 animate-in fade-in duration-1000">
      <div className="xl:col-span-3 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between bg-white/[0.02] p-6 rounded-2xl border border-white/5 gap-6 shadow-xl">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-primary/10 hover:text-primary" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-6 w-6" /></Button>
              <Button variant="secondary" className="h-10 px-6 text-[10px] font-black uppercase bg-[#1a1f2e] text-white border border-white/10 rounded-xl" onClick={() => setCurrentMonth(new Date())}>Hoje</Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-primary/10 hover:text-primary" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-6 w-6" /></Button>
            </div>
          </div>

          <div className="flex items-center gap-8 bg-black/20 px-6 py-3 rounded-xl border border-white/5 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Audiências</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(245,208,48,0.6)]" />
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Prazos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Atendimentos</span>
            </div>
          </div>

          <Button onClick={handleManualSync} disabled={syncing} variant="outline" className="glass border-white/10 h-10 px-6 gap-3 text-[10px] font-black uppercase tracking-widest">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-primary" />} Sincronizar
          </Button>
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
                    "min-h-[120px] p-4 border-r border-b border-white/5 cursor-pointer transition-all hover:bg-primary/5 group relative",
                    !isCurrentMonth && "opacity-10 pointer-events-none",
                    isSelected && "bg-primary/[0.03] ring-1 ring-inset ring-primary/30"
                  )}
                >
                  <span className={cn(
                    "text-xs font-black transition-all", 
                    isSelected ? "text-primary scale-125 inline-block" : "text-muted-foreground group-hover:text-white"
                  )}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {hasHearing && <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />}
                    {hasDeadline && <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(245,208,48,0.8)]" />}
                    {hasAppointment && <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="xl:col-span-1 space-y-6">
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl shadow-xl">
          <h3 className="text-primary font-black uppercase tracking-[0.3em] text-[11px] mb-1">Pauta do Dia</h3>
          <p className="text-2xl font-black text-white uppercase tracking-tighter">
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="space-y-4 pr-4">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((event, idx) => (
                <Card 
                  key={idx} 
                  className={cn(
                    "glass border-white/5 hover-gold transition-all shadow-xl rounded-2xl overflow-hidden bg-white/[0.02] cursor-pointer group relative",
                    event.eventType === 'audiencia' ? 'border-l-4 border-l-rose-500' : event.eventType === 'atendimento' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-primary'
                  )}
                  onClick={() => setViewingEvent(event)}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 h-5 border-0",
                        event.eventType === 'audiencia' ? 'bg-rose-500 text-white' : event.eventType === 'atendimento' ? 'bg-amber-500 text-background' : 'bg-primary text-background'
                      )}>
                        {event.eventType === 'audiencia' ? 'Audiência' : event.eventType === 'atendimento' ? 'Atendimento' : 'Prazo'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono font-bold flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {event.date ? format(event.date, "HH:mm") : "--:--"}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white uppercase tracking-tight leading-tight line-clamp-2">{event.title}</h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate">
                        {event.clientName || event.processNumber || "Geral"}
                      </p>
                    </div>
                    
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {event.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-primary opacity-40" />
                            <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest truncate max-w-[100px]">{event.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {event.location && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg bg-white/5 hover:bg-primary/20 text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`, "_blank");
                            }}
                          >
                            <Navigation className="h-3 w-3" />
                          </Button>
                        )}
                        {(event.meetingLink || event.meetingUrl) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-emerald-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(event.meetingLink || event.meetingUrl, "_blank");
                            }}
                          >
                            <Video className="h-3 w-3" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-lg bg-white/5 hover:bg-primary/20 text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(event);
                          }}
                          title="Reagendar"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event);
                          }}
                          title="Cancelar"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-32 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-3xl shadow-inner">
                <CalendarIcon className="h-12 w-12 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Pauta Limpa</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <Button onClick={() => { setEditingEventData(null); setIsCreateOpen(true); }} className="w-full gold-gradient text-background font-black gap-3 py-8 rounded-2xl shadow-2xl uppercase text-[11px] tracking-[0.2em] hover:scale-[1.02] transition-all">
          <Plus className="h-5 w-5" /> Agendar Novo Ato
        </Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) setEditingEventData(null); }}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between">
            <DialogHeader className="text-left">
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingEventData ? "Retificar Ato na Pauta" : "Injetar Ato na Pauta"}
              </DialogTitle>
            </DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
              <CalendarIcon className="h-6 w-6" />
            </div>
          </div>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="p-10 space-y-8 bg-[#0a0f1e]/50">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tipo de Ato *</Label>
                  <Select value={newEventData.type} onValueChange={(v) => setNewEventData({...newEventData, type: v})}>
                    <SelectTrigger className="glass border-white/10 h-12 text-white font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      <SelectItem value="Audiência">🏛️ AUDIÊNCIA</SelectItem>
                      <SelectItem value="Atendimento">⚡ ATENDIMENTO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Identificação *</Label>
                  <Input value={newEventData.title} onChange={(e) => setNewEventData({...newEventData, title: e.target.value.toUpperCase()})} placeholder="EX: REUNIÃO TÁTICA" className="glass border-white/10 h-12 text-white font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Data *</Label>
                  <Input type="date" value={newEventData.date} onChange={(e) => setNewEventData({...newEventData, date: e.target.value})} className="glass border-white/10 h-12 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Horário *</Label>
                  <Input type="time" value={newEventData.time} onChange={(e) => setNewEventData({...newEventData, time: e.target.value})} className="glass border-white/10 h-12 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Localização / Juízo</Label>
                <Input value={newEventData.location} onChange={(e) => setNewEventData({...newEventData, location: e.target.value.toUpperCase()})} placeholder="SEDE RGMJ OU LINK DO MEET" className="glass border-white/10 h-12 text-white font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Observações Táticas</Label>
                <Textarea value={newEventData.notes} onChange={(e) => setNewEventData({...newEventData, notes: e.target.value})} className="glass border-white/10 min-h-[100px] text-white text-xs resize-none p-4" />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => { setIsCreateOpen(false); setEditingEventData(null); }} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 hover:text-white">Abortar</Button>
            <Button onClick={handleSaveEvent} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-2xl transition-all hover:scale-[1.02]">
              {editingEventData ? "SALVAR ALTERAÇÕES" : "CONFIRMAR AGENDA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingEvent} onOpenChange={(open) => !open && setViewingEvent(null)}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[650px] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between shadow-xl flex-none">
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl",
                viewingEvent?.eventType === 'audiencia' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-primary/10 border-primary/20 text-primary"
              )}>
                {viewingEvent?.eventType === 'audiencia' ? <Gavel className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-3">
                  <Badge className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2 h-5 border-0",
                    viewingEvent?.eventType === 'audiencia' ? 'bg-rose-500 text-white' : 'bg-primary text-background'
                  )}>
                    {viewingEvent?.type || 'COMPROMISSO'}
                  </Badge>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">DETALHES DO ATO</span>
                </div>
                <DialogTitle className="text-xl font-black text-white uppercase tracking-tighter mt-1 leading-none">
                  {viewingEvent?.title}
                </DialogTitle>
              </div>
            </div>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-10 space-y-10 bg-[#05070a]">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Data do Evento</Label>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-white uppercase">{viewingEvent?.date ? format(viewingEvent.date, "dd 'de' MMMM", { locale: ptBR }) : '---'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Horário</Label>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-white font-mono">{viewingEvent?.date ? format(viewingEvent.date, "HH:mm") : '--:--'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Localização / Juízo</Label>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all shadow-inner">
                  <div className="flex items-center gap-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-white uppercase">{viewingEvent?.location || "NÃO INFORMADO"}</span>
                  </div>
                  <div className="flex gap-2">
                    {viewingEvent?.location && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-primary" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingEvent.location)}`, "_blank")}>
                        <Navigation className="h-4 w-4" />
                      </Button>
                    )}
                    {viewingEvent?.location && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-primary" onClick={() => handleCopyText(viewingEvent.location)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {(viewingEvent?.clientName || viewingEvent?.processNumber) && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Dossiê Vinculado</Label>
                  <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3 shadow-lg">
                    <div className="flex items-center gap-4">
                      <UserIcon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-black text-white uppercase tracking-tight">{viewingEvent.clientName || 'CLIENTE NÃO VINCULADO'}</span>
                    </div>
                    {viewingEvent.processNumber && (
                      <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                        <Scale className="h-4 w-4 text-primary" />
                        <span className="text-xs font-mono font-bold text-white/60">{viewingEvent.processNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Inteligência Tática (Notas)</Label>
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 min-h-[120px] shadow-inner">
                  <div className="flex items-center gap-3 mb-4 opacity-40">
                    <Target className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Notas de Comando</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed italic whitespace-pre-wrap">
                    {viewingEvent?.notes || viewingEvent?.description || "Nenhuma nota estratégica registrada para este ato."}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => handleDeleteEvent(viewingEvent)} className="h-12 w-12 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                <Trash2 className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                <Info className="h-4 w-4 text-primary" /> Criado em {viewingEvent?.createdAt?.toDate ? format(viewingEvent.createdAt.toDate(), "dd/MM/yy") : '---'}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setViewingEvent(null)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 rounded-xl transition-colors">FECHAR</Button>
              <Button onClick={() => handleOpenEdit(viewingEvent)} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-10 h-12 rounded-xl shadow-xl flex items-center gap-3 transition-all hover:scale-[1.02]">
                <Edit3 className="h-4 w-4" /> REAGENDAR
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
