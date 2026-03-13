
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
  User as UserIcon,
  CloudLightning,
  AlertCircle,
  Briefcase,
  Search,
  CheckCircle2,
  Handshake,
  DollarSign,
  Car,
  Receipt
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, Timestamp, doc, serverTimestamp, where } from "firebase/firestore"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type CreateMode = 'audiencia' | 'freelance' | 'prazo' | 'diligencia' | 'atendimento'

export default function MasterAgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [syncing, setSyncing] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createMode, setCreateMode] = useState<CreateMode>('atendimento')
  const [viewingEvent, setViewingEvent] = useState<any>(null)
  
  const [newEventData, setNewEventData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    notes: "",
    clientName: "",
    processNumber: "",
    freelancerId: "",
    freelancerName: "",
    solicitorId: "",
    solicitorName: "",
    valueToPay: 0,
    valueToCharge: 0,
    extraExpenses: 0
  })

  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  // Queries para a Pauta Consolidada
  const hearingsQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "hearings"), orderBy("startDateTime", "asc")) : null, [db, user])
  const { data: hearings, isLoading: loadingHearings } = useCollection(hearingsQuery)

  const deadlinesQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "deadlines"), orderBy("dueDate", "asc")) : null, [db, user])
  const { data: deadlines, isLoading: loadingDeadlines } = useCollection(deadlinesQuery)

  const appointmentsQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "appointments"), orderBy("startDateTime", "asc")) : null, [db, user])
  const { data: appointments, isLoading: loadingAppointments } = useCollection(appointmentsQuery)

  const internalDiligencesQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "diligences"), orderBy("dueDate", "asc")) : null, [db, user])
  const { data: internalDiligences, isLoading: loadingDiligences } = useCollection(internalDiligencesQuery)

  // Queries para suporte aos agendamentos
  const freelancersQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "freelancers"), orderBy("name", "asc")) : null, [db, user])
  const { data: freelancers } = useCollection(freelancersQuery)

  const counterpartiesQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "counterparties"), orderBy("name", "asc")) : null, [db, user])
  const { data: counterparties } = useCollection(counterpartiesQuery)

  const isLoading = loadingHearings || loadingDeadlines || loadingAppointments || loadingDiligences

  const parseDate = (dateValue: any) => {
    if (!dateValue) return null
    if (dateValue instanceof Timestamp) return dateValue.toDate()
    if (typeof dateValue === 'string') {
      try { return parseISO(dateValue) } catch (e) { return new Date(dateValue) }
    }
    return new Date(dateValue)
  }

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const allEvents = useMemo(() => {
    const h = (hearings || []).map(h => ({ ...h, eventType: h.isFreelance ? 'freelance' : 'audiencia', collection: 'hearings', date: parseDate(h.startDateTime) }))
    const d = (deadlines || []).map(d => ({ ...d, eventType: 'prazo', collection: 'deadlines', date: parseDate(d.dueDate) }))
    const a = (appointments || []).map(a => ({ ...a, eventType: 'atendimento', collection: 'appointments', date: parseDate(a.startDateTime) }))
    const i = (internalDiligences || []).map(i => ({ ...i, eventType: 'diligencia', collection: 'diligences', date: parseDate(i.dueDate) }))
    return [...h, ...d, ...a, ...i]
  }, [hearings, deadlines, appointments, internalDiligences])

  const selectedDayEvents = useMemo(() => {
    return allEvents
      .filter(e => e.date && isSameDay(e.date, selectedDate))
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
  }, [selectedDate, allEvents])

  const hasEventsOnDay = (day: Date) => {
    const dayEvents = allEvents.filter(e => e.date && isSameDay(e.date, day))
    return {
      hasHearing: dayEvents.some(e => e.eventType === 'audiencia'),
      hasDeadline: dayEvents.some(e => e.eventType === 'prazo'),
      hasAppointment: dayEvents.some(e => e.eventType === 'atendimento'),
      hasFreelance: dayEvents.some(e => e.eventType === 'freelance'),
      hasDiligence: dayEvents.some(e => e.eventType === 'diligencia'),
    }
  }

  const handleOpenSchedule = (date: Date, mode: CreateMode) => {
    setSelectedDate(date)
    setCreateMode(mode)
    setNewEventData({
      title: "",
      date: format(date, 'yyyy-MM-dd'),
      time: "09:00",
      location: "",
      notes: "",
      clientName: "",
      processNumber: "",
      freelancerId: "",
      freelancerName: "",
      solicitorId: "",
      solicitorName: "",
      valueToPay: 0,
      valueToCharge: 0,
      extraExpenses: 0
    })
    setIsCreateOpen(true)
  }

  const handleSaveEvent = async () => {
    if (!db || !newEventData.title || !newEventData.date) return
    const dateTime = `${newEventData.date}T${newEventData.time || '09:00'}:00`
    
    let targetCollection = "appointments"
    const payload: any = {
      title: newEventData.title.toUpperCase(),
      notes: newEventData.notes,
      clientName: newEventData.clientName,
      processNumber: newEventData.processNumber,
      updatedAt: serverTimestamp()
    }

    if (createMode === 'audiencia') {
      targetCollection = 'hearings'
      payload.startDateTime = dateTime
      payload.location = newEventData.location
      payload.status = "Agendado"
    } else if (createMode === 'atendimento') {
      targetCollection = 'appointments'
      payload.startDateTime = dateTime
      payload.location = newEventData.location
      payload.status = "Agendado"
    } else if (createMode === 'prazo') {
      targetCollection = 'deadlines'
      payload.dueDate = newEventData.date
      payload.status = "Aberto"
    } else if (createMode === 'diligencia') {
      targetCollection = 'diligences'
      payload.dueDate = dateTime
      payload.location = newEventData.location
      payload.status = "Pendente"
    } else if (createMode === 'freelance') {
      // Rito Especial: Salva em freelance_diligences e injeta em hearings
      const flDoc = await addDocumentNonBlocking(collection(db, "freelance_diligences"), {
        type: "Audiência Freelance",
        freelancerId: newEventData.freelancerId,
        freelancerName: newEventData.freelancerName,
        solicitorId: newEventData.solicitorId,
        solicitorName: newEventData.solicitorName,
        serviceDate: newEventData.date,
        serviceTime: newEventData.time,
        processNumber: newEventData.processNumber,
        valueToPay: newEventData.valueToPay,
        valueToCharge: newEventData.valueToCharge,
        extraExpenses: newEventData.extraExpenses || 0,
        status: "Criada",
        createdAt: serverTimestamp()
      })

      targetCollection = 'hearings'
      payload.isFreelance = true
      payload.title = `[FREELANCE] ${newEventData.title.toUpperCase()}`
      payload.startDateTime = dateTime
      payload.diligenceId = (flDoc as any).id
      payload.status = "Agendado"
    }

    addDocumentNonBlocking(collection(db, targetCollection), {
      ...payload,
      createdAt: serverTimestamp()
    })

    toast({ title: "Ato Injetado na Pauta" })
    setIsCreateOpen(false)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 animate-in fade-in duration-1000">
      <div className="xl:col-span-3 space-y-6">
        {/* Header Calendário */}
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

          <div className="flex items-center gap-6 bg-black/20 px-6 py-3 rounded-xl border border-white/5 shadow-inner overflow-x-auto scrollbar-hide max-w-full">
            {[
              { label: 'Audiências', color: 'bg-rose-500', glow: 'rgba(239,68,68,0.6)' },
              { label: 'Freelance', color: 'bg-cyan-400', glow: 'rgba(34,211,238,0.6)' },
              { label: 'Prazos', color: 'bg-primary', glow: 'rgba(245,208,48,0.6)' },
              { label: 'Diligências', color: 'bg-blue-500', glow: 'rgba(59,130,246,0.6)' },
              { label: 'Atendimentos', color: 'bg-amber-500', glow: 'rgba(245,158,11,0.6)' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 shrink-0">
                <div className={cn("h-2 w-2 rounded-full", l.color)} style={{ boxShadow: `0 0 8px ${l.glow}` }} />
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{l.label}</span>
              </div>
            ))}
          </div>

          <Button onClick={() => setSyncing(true)} disabled={syncing} variant="outline" className="glass border-white/10 h-10 px-6 gap-3 text-[10px] font-black uppercase tracking-widest hidden md:flex">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-primary" />} Sincronizar
          </Button>
        </div>

        {/* Grade do Calendário */}
        <div className="glass rounded-[2rem] overflow-hidden border-white/5 shadow-2xl bg-white/[0.01]">
          <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.03]">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
              <div key={day} className="py-5 text-center text-[10px] font-black text-muted-foreground tracking-[0.3em] border-r border-white/5 last:border-r-0 uppercase">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const { hasHearing, hasDeadline, hasAppointment, hasFreelance, hasDiligence } = hasEventsOnDay(day)
              const isSelected = isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              const isCurrentMonth = isSameMonth(day, currentMonth)

              return (
                <DropdownMenu key={i}>
                  <DropdownMenuTrigger asChild>
                    <div className={cn(
                      "min-h-[130px] p-4 border-r border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 group relative",
                      !isCurrentMonth && "opacity-10 pointer-events-none",
                      isSelected && "bg-primary/[0.03] ring-1 ring-inset ring-primary/30"
                    )}>
                      <span className={cn(
                        "text-xs font-black transition-all", 
                        isToday ? "bg-primary text-background h-6 w-6 rounded-full flex items-center justify-center scale-110 shadow-lg" : isSelected ? "text-primary scale-125 inline-block" : "text-muted-foreground group-hover:text-white"
                      )}>
                        {format(day, "d")}
                      </span>
                      
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {hasHearing && <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />}
                        {hasFreelance && <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}
                        {hasDeadline && <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(245,208,48,0.8)]" />}
                        {hasDiligence && <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
                        {hasAppointment && <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />}
                      </div>

                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-40 transition-opacity">
                        <Plus className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-[#0d121f] border-white/10 text-white rounded-xl p-2 shadow-2xl">
                    <DropdownMenuLabel className="text-[9px] font-black text-primary uppercase tracking-[0.2em] px-3 py-2">Comando de Pauta ({format(day, "dd/MM")})</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={() => handleOpenSchedule(day, 'audiencia')} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest h-11 rounded-lg hover:bg-rose-500/10 text-rose-400 cursor-pointer"><Gavel className="h-4 w-4" /> Audiência Interna</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenSchedule(day, 'freelance')} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest h-11 rounded-lg hover:bg-cyan-500/10 text-cyan-400 cursor-pointer"><Handshake className="h-4 w-4" /> Audiência Freelance</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenSchedule(day, 'prazo')} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest h-11 rounded-lg hover:bg-primary/10 text-primary cursor-pointer"><Clock className="h-4 w-4" /> Prazo Judicial</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenSchedule(day, 'diligencia')} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest h-11 rounded-lg hover:bg-blue-500/10 text-blue-400 cursor-pointer"><Navigation className="h-4 w-4" /> Diligência / Ato</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenSchedule(day, 'atendimento')} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest h-11 rounded-lg hover:bg-amber-500/10 text-amber-500 cursor-pointer"><Target className="h-4 w-4" /> Atendimento / Lead</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lado Direito: Pauta do Dia */}
      <div className="xl:col-span-1 space-y-6">
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl shadow-xl">
          <h3 className="text-primary font-black uppercase tracking-[0.3em] text-[11px] mb-1">Pauta do Dia</h3>
          <p className="text-2xl font-black text-white uppercase tracking-tighter">
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-450px)]">
          <div className="space-y-4 pr-4">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((event, idx) => (
                <Card 
                  key={idx} 
                  className={cn(
                    "glass border-white/5 hover-gold transition-all shadow-xl rounded-2xl overflow-hidden bg-white/[0.02] cursor-pointer group relative",
                    event.eventType === 'audiencia' ? 'border-l-4 border-l-rose-500' : 
                    event.eventType === 'freelance' ? 'border-l-4 border-l-cyan-400' :
                    event.eventType === 'prazo' ? 'border-l-4 border-l-primary' : 
                    event.eventType === 'diligencia' ? 'border-l-4 border-l-blue-500' :
                    'border-l-4 border-l-amber-500'
                  )}
                  onClick={() => setViewingEvent(event)}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 h-5 border-0",
                        event.eventType === 'audiencia' ? 'bg-rose-500 text-white' : 
                        event.eventType === 'freelance' ? 'bg-cyan-500 text-black' :
                        event.eventType === 'prazo' ? 'bg-primary text-background' :
                        event.eventType === 'diligencia' ? 'bg-blue-500 text-white' :
                        'bg-amber-500 text-background'
                      )}>
                        {event.eventType?.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono font-bold flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {event.date ? format(event.date, "HH:mm") : "--:--"}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white uppercase tracking-tight leading-tight line-clamp-2">{event.title}</h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate">
                        {event.clientName || event.processNumber || "Acervo Geral"}
                      </p>
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

        <Button onClick={() => handleOpenSchedule(selectedDate, 'atendimento')} className="w-full gold-gradient text-background font-black gap-3 py-8 rounded-2xl shadow-2xl uppercase text-[11px] tracking-[0.2em] hover:scale-[1.02] transition-all">
          <Plus className="h-5 w-5" /> Agendar Novo Ato
        </Button>
      </div>

      {/* DIÁLOGO DE CRIAÇÃO MULTIMODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[650px] p-0 overflow-hidden shadow-2xl rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border shadow-xl",
                createMode === 'audiencia' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                createMode === 'freelance' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                createMode === 'prazo' ? "bg-primary/10 border-primary/20 text-primary" :
                "bg-amber-500/10 border-amber-500/20 text-amber-500"
              )}>
                {createMode === 'audiencia' ? <Gavel className="h-6 w-6" /> : createMode === 'prazo' ? <Clock className="h-6 w-6" /> : <Target className="h-6 w-6" />}
              </div>
              <DialogHeader className="text-left">
                <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                  {createMode === 'audiencia' ? "Injetar Audiência" : createMode === 'freelance' ? "Ordem Freelance" : createMode === 'prazo' ? "Lançar Prazo" : "Agendar Atendimento"}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-50">
                  RITO DE AGENDAMENTO ESTRATÉGICO RGMJ.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="p-10 space-y-8 bg-[#0a0f1e]/50">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Identificação do Ato *</Label>
                <Input value={newEventData.title} onChange={(e) => setNewEventData({...newEventData, title: e.target.value.toUpperCase()})} placeholder="EX: REUNIÃO TÁTICA / INICIAL TRABALHISTA" className="bg-black/20 border-white/10 h-12 text-white font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Data</Label>
                  <Input type="date" value={newEventData.date} onChange={(e) => setNewEventData({...newEventData, date: e.target.value})} className="bg-black/20 border-white/10 h-12 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Horário</Label>
                  <Input type="time" value={newEventData.time} onChange={(e) => setNewEventData({...newEventData, time: e.target.value})} className="bg-black/20 border-white/10 h-12 text-white" />
                </div>
              </div>

              {createMode === 'freelance' && (
                <div className="space-y-8 p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 shadow-inner">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Correspondente *</Label>
                      <Select value={newEventData.freelancerId} onValueChange={(v) => {
                        const f = freelancers?.find(i => i.id === v)
                        setNewEventData({...newEventData, freelancerId: v, freelancerName: f?.name || ""})
                      }}>
                        <SelectTrigger className="bg-black/40 border-cyan-500/20 h-12 text-white text-[10px] font-black uppercase"><SelectValue placeholder="SELECIONE O PROFISSIONAL" /></SelectTrigger>
                        <SelectContent className="bg-[#0d121f] text-white">
                          {freelancers?.map(f => <SelectItem key={f.id} value={f.id}>{f.name.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Solicitante *</Label>
                      <Select value={newEventData.solicitorId} onValueChange={(v) => {
                        const c = counterparties?.find(i => i.id === v)
                        setNewEventData({...newEventData, solicitorId: v, solicitorName: c?.name || ""})
                      }}>
                        <SelectTrigger className="bg-black/40 border-cyan-500/20 h-12 text-white text-[10px] font-black uppercase"><SelectValue placeholder="QUEM CONTRATOU?" /></SelectTrigger>
                        <SelectContent className="bg-[#0d121f] text-white">
                          {counterparties?.map(c => <SelectItem key={c.id} value={c.id}>{c.name.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Honorário (Pagar)</Label>
                      <Input type="number" value={newEventData.valueToPay} onChange={e => setNewEventData({...newEventData, valueToPay: Number(e.target.value)})} className="bg-black/40 border-rose-500/20 h-12 text-white font-black" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Extras (KM/Cópia)</Label>
                      <Input type="number" value={newEventData.extraExpenses} onChange={e => setNewEventData({...newEventData, extraExpenses: Number(e.target.value)})} className="bg-black/40 border-amber-500/20 h-12 text-white font-black" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Receita (Cobrar)</Label>
                      <Input type="number" value={newEventData.valueToCharge} onChange={e => setNewEventData({...newEventData, valueToCharge: Number(e.target.value)})} className="bg-black/40 border-emerald-500/20 h-12 text-white font-black" />
                    </div>
                  </div>
                </div>
              )}

              {(createMode === 'audiencia' || createMode === 'atendimento' || createMode === 'diligencia') && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Localização / Link</Label>
                  <Input value={newEventData.location} onChange={(e) => setNewEventData({...newEventData, location: e.target.value.toUpperCase()})} placeholder="SEDE RGMJ, FÓRUM OU LINK DO MEET" className="bg-black/20 border-white/10 h-12 text-white font-bold" />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Dossiê Vinculado (Cliente/Processo)</Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input value={newEventData.clientName} onChange={(e) => setNewEventData({...newEventData, clientName: e.target.value.toUpperCase()})} placeholder="VINCULAR CLIENTE OU PROCESSO..." className="bg-black/20 border-white/10 h-12 pl-12 text-white font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Notas Estratégicas</Label>
                <Textarea value={newEventData.notes} onChange={(e) => setNewEventData({...newEventData, notes: e.target.value})} className="bg-black/20 border-white/10 min-h-[100px] text-white text-xs resize-none p-4 rounded-xl" />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 hover:text-white">Abortar</Button>
            <Button onClick={handleSaveEvent} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-2xl transition-all hover:scale-[1.02]">
              CONFIRMAR AGENDA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE VISUALIZAÇÃO DETALHADA */}
      <Dialog open={!!viewingEvent} onOpenChange={(open) => !open && setViewingEvent(null)}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[650px] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between shadow-xl flex-none">
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl",
                viewingEvent?.eventType === 'audiencia' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : 
                viewingEvent?.eventType === 'freelance' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                "bg-primary/10 border-primary/20 text-primary"
              )}>
                <Gavel className="h-7 w-7" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-3">
                  <Badge className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2 h-5 border-0",
                    viewingEvent?.eventType === 'audiencia' ? 'bg-rose-500 text-white' : 
                    viewingEvent?.eventType === 'freelance' ? 'bg-cyan-500 text-black' :
                    'bg-primary text-background'
                  )}>
                    {viewingEvent?.eventType?.toUpperCase()}
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
              
              {viewingEvent?.isFreelance && (
                <Card className="glass border-cyan-500/20 bg-cyan-500/5 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <Handshake className="h-5 w-5 text-cyan-400" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Dossiê Logístico Freelance</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">Repasse Honorário</p>
                      <p className="text-sm font-black text-white">R$ {Number(viewingEvent.valueToPay || 0).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">Reembolsos Extras</p>
                      <p className="text-sm font-black text-amber-400">R$ {Number(viewingEvent.extraExpenses || 0).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </Card>
              )}

              {viewingEvent?.location && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Localização / Juízo</Label>
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all shadow-inner">
                    <div className="flex items-center gap-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="text-sm font-bold text-white uppercase">{viewingEvent.location}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-primary" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingEvent.location)}`, "_blank")}>
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {viewingEvent?.notes && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Inteligência Tática</Label>
                  <div className="p-6 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                    <p className="text-sm text-white/80 leading-relaxed italic whitespace-pre-wrap">{viewingEvent.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex justify-end flex-none">
            <Button variant="ghost" onClick={() => setViewingEvent(null)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12">FECHAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
