
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
  Receipt,
  Library,
  Users,
  UserPlus,
  Building2,
  ShieldAlert,
  ExternalLink,
  Globe,
  XCircle,
  Brain,
  Zap,
  Calculator,
  Star,
  TriangleAlert,
  CalendarDays
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from "@/firebase"
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
  subMonths,
  addDays,
  addBusinessDays
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { pushActToGoogleCalendar } from "@/services/google-calendar"
import { aiParseDjePublication } from "@/ai/flows/ai-parse-dje-publication"

type CreateMode = 'audiencia' | 'freelance' | 'prazo' | 'diligencia' | 'atendimento'

export default function MasterAgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [syncing, setSyncing] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createMode, setCreateMode] = useState<CreateMode>('atendimento')
  const [viewingEvent, setViewingEvent] = useState<any>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  
  // Estados para Operação IA e Cálculos
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [deadlineDuration, setDeadlineDuration] = useState("")
  const [isSyncingWorkspace, setIsSyncingWorkspace] = useState(false)

  const [newEventData, setNewEventData] = useState<any>({
    title: "",
    date: "",
    time: "",
    location: "Sede RGMJ",
    notes: "",
    clientName: "",
    processNumber: "",
    freelancerId: "",
    freelancerName: "",
    solicitorId: "",
    solicitorName: "",
    meetingType: "online",
    autoMeet: true,
    calculationType: "Dias Úteis (CPC/CLT)",
    priority: "normal",
    pubDate: format(new Date(), 'yyyy-MM-dd'),
    publicationText: "",
    valueToPay: 0,
    valueToCharge: 0,
    fuelExpense: 0,
    parkingExpense: 0,
    copyExpense: 0,
    miscExpense: 0,
    plaintiffName: "",
    defendantName: "",
    representedSide: "Autor",
    partyContact: "",
    courtName: "",
    assigneeId: ""
  })

  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  // Queries para suporte
  const staffQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "staff_profiles"), orderBy("name", "asc")) : null, [db, user])
  const { data: staffMembers } = useCollection(staffQuery)

  const courtsQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "courts"), orderBy("name", "asc")) : null, [db, user])
  const { data: courts } = useCollection(courtsQuery)

  const freelancersQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "freelancers"), orderBy("name", "asc")) : null, [db, user])
  const { data: freelancers } = useCollection(freelancersQuery)

  const counterpartiesQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "counterparties"), orderBy("name", "asc")) : null, [db, user])
  const { data: counterparties } = useCollection(counterpartiesQuery)

  // Queries da Pauta
  const hearingsQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "hearings"), orderBy("startDateTime", "asc")) : null, [db, user])
  const { data: hearings } = useCollection(hearingsQuery)

  const deadlinesQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "deadlines"), orderBy("dueDate", "asc")) : null, [db, user])
  const { data: deadlines } = useCollection(deadlinesQuery)

  const appointmentsQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "appointments"), orderBy("startDateTime", "asc")) : null, [db, user])
  const { data: appointments } = useCollection(appointmentsQuery)

  const internalDiligencesQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "diligences"), orderBy("dueDate", "asc")) : null, [db, user])
  const { data: internalDiligences } = useCollection(internalDiligencesQuery)

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

  const handleOpenSchedule = (date: Date, mode: CreateMode, existingEvent?: any) => {
    setSelectedDate(date)
    setCreateMode(mode)
    if (existingEvent) {
      setEditingEventId(existingEvent.id)
      const d = existingEvent.date || parseDate(existingEvent.startDateTime || existingEvent.dueDate)
      setNewEventData({
        ...existingEvent,
        date: d ? format(d, 'yyyy-MM-dd') : format(date, 'yyyy-MM-dd'),
        time: d ? format(d, 'HH:mm') : "09:00",
        meetingType: existingEvent.meetingType || "online",
        autoMeet: existingEvent.autoMeet ?? true,
        calculationType: existingEvent.calculationType || "Dias Úteis (CPC/CLT)"
      })
    } else {
      setEditingEventId(null)
      setNewEventData({
        title: mode === 'atendimento' ? "REUNIÃO TÁTICA" : mode === 'audiencia' ? "AUDIÊNCIA UNA" : "",
        date: format(date, 'yyyy-MM-dd'),
        time: "09:00",
        location: mode === 'atendimento' ? "Sede RGMJ" : "",
        notes: "",
        clientName: "",
        processNumber: "",
        meetingType: "online",
        autoMeet: true,
        calculationType: "Dias Úteis (CPC/CLT)",
        priority: "normal",
        pubDate: format(date, 'yyyy-MM-dd'),
        publicationText: "",
        valueToPay: 0,
        valueToCharge: 0,
        fuelExpense: 0,
        parkingExpense: 0,
        copyExpense: 0,
        miscExpense: 0,
        plaintiffName: "",
        defendantName: "",
        representedSide: "Autor",
        partyContact: "",
        courtName: "",
        assigneeId: user?.uid || ""
      })
    }
    setIsCreateOpen(true)
  }

  const handleAiParsePublication = async () => {
    if (!newEventData.publicationText) return
    setIsAnalyzing(true)
    try {
      const result = await aiParseDjePublication({ publicationText: newEventData.publicationText })
      setNewEventData((prev: any) => ({
        ...prev,
        title: result.deadlineType?.toUpperCase() || prev.title,
        date: result.dueDate || prev.date,
        notes: result.summary?.toUpperCase() || prev.notes
      }))
      toast({ title: "Análise IA Concluída" })
    } catch (e) {
      toast({ variant: "destructive", title: "Erro na Análise" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApplyDeadlineCalculation = () => {
    const days = parseInt(deadlineDuration)
    if (isNaN(days)) return
    const baseDate = parseISO(newEventData.pubDate)
    let calculatedDate: Date
    if (newEventData.calculationType.includes("Úteis")) {
      calculatedDate = addBusinessDays(baseDate, days)
    } else {
      calculatedDate = addDays(baseDate, days)
    }
    setNewEventData((prev: any) => ({ ...prev, date: format(calculatedDate, 'yyyy-MM-dd') }))
  }

  const handleSaveEvent = async () => {
    if (!db || !newEventData.date) return
    setIsSyncingWorkspace(true)
    
    const dateTime = `${newEventData.date}T${newEventData.time || '09:00'}:00`
    let targetCollection = "appointments"
    const payload: any = {
      title: newEventData.title.toUpperCase(),
      notes: newEventData.notes,
      clientName: newEventData.clientName,
      processNumber: newEventData.processNumber,
      updatedAt: serverTimestamp()
    }

    let typeForGoogle: any = 'atendimento'

    if (createMode === 'audiencia') {
      targetCollection = 'hearings'
      payload.startDateTime = dateTime
      payload.location = newEventData.location
      payload.status = "Agendado"
      typeForGoogle = 'audiencia'
    } else if (createMode === 'atendimento') {
      targetCollection = 'appointments'
      payload.startDateTime = dateTime
      payload.meetingType = newEventData.meetingType
      payload.location = newEventData.meetingType === 'online' ? (newEventData.location || 'Google Meet') : (newEventData.location || 'Sede RGMJ')
      payload.status = "Agendado"
      typeForGoogle = 'atendimento'
    } else if (createMode === 'prazo') {
      targetCollection = 'deadlines'
      payload.dueDate = newEventData.date
      payload.pubDate = newEventData.pubDate
      payload.calculationType = newEventData.calculationType
      payload.status = "Aberto"
      typeForGoogle = 'prazo'
    } else if (createMode === 'diligencia') {
      targetCollection = 'diligences'
      payload.dueDate = dateTime
      payload.location = newEventData.location
      payload.assigneeId = newEventData.assigneeId
      payload.status = "Pendente"
      typeForGoogle = 'diligencia'
    } else if (createMode === 'freelance') {
      // Lógica Freelance complexa...
      targetCollection = 'hearings'
      payload.isFreelance = true
      payload.startDateTime = dateTime
      payload.status = "Agendado"
      typeForGoogle = 'freelance'
    }

    let finalDocId = "";
    if (editingEventId) {
      updateDocumentNonBlocking(doc(db, targetCollection, editingEventId), payload)
      finalDocId = editingEventId;
    } else {
      const docRefRes = await addDocumentNonBlocking(collection(db, targetCollection), {
        ...payload,
        createdAt: serverTimestamp()
      })
      finalDocId = (docRefRes as any).id;
    }

    // SINCRONISMO GOOGLE HUB
    let generatedMeetLink = "";
    try {
      const accessToken = localStorage.getItem('google_access_token') || localStorage.getItem('access_token');
      if (accessToken) {
        const calRes = await pushActToGoogleCalendar({
          accessToken,
          act: {
            title: payload.title,
            description: payload.notes,
            location: payload.location,
            startDateTime: createMode === 'prazo' ? `${newEventData.date}T00:00:00` : dateTime,
            type: typeForGoogle,
            processNumber: payload.processNumber,
            clientName: payload.clientName,
            useMeet: newEventData.autoMeet && (newEventData.meetingType === 'online' || createMode === 'audiencia')
          }
        })
        
        if (calRes && calRes.id) {
          generatedMeetLink = calRes.hangoutLink || "";
          updateDocumentNonBlocking(doc(db, targetCollection, finalDocId), {
            meetingUrl: generatedMeetLink,
            calendarEventId: calRes.id,
            updatedAt: serverTimestamp()
          })
        }
      }
    } catch (e) { console.warn("Google Sync Error", e) }

    // PROTOCOLO WHATSAPP
    if (newEventData.partyContact || (createMode === 'atendimento' && newEventData.clientName)) {
      const contact = newEventData.partyContact || "";
      if (contact) {
        const cleanPhone = contact.replace(/\D/g, "");
        const meetPart = generatedMeetLink ? ` Link da reunião: ${generatedMeetLink}` : "";
        const msg = `Olá! Confirmamos o agendamento de ${payload.title} para o dia ${new Date(newEventData.date).toLocaleDateString('pt-BR')} às ${newEventData.time}.${meetPart} Dr. Reinaldo - RGMJ.`
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank")
      }
    }

    toast({ title: editingEventId ? "Ato Retificado" : "Ato Injetado na Pauta" })
    setIsSyncingWorkspace(false)
    setIsCreateOpen(false)
    setEditingEventId(null)
  }

  const handleDeleteEvent = (event: any) => {
    if (!db || !event) return
    if (!confirm("Remover permanentemente da pauta?")) return
    deleteDocumentNonBlocking(doc(db, event.collection, event.id))
    toast({ variant: "destructive", title: "Ato Removido" })
    setViewingEvent(null)
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
              <button className="h-10 w-10 text-white hover:bg-primary/10 hover:text-primary flex items-center justify-center rounded-xl" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-6 w-6" /></button>
              <Button variant="secondary" className="h-10 px-6 text-[10px] font-black uppercase bg-[#1a1f2e] text-white border border-white/10 rounded-xl" onClick={() => setCurrentMonth(new Date())}>Hoje</Button>
              <button className="h-10 w-10 text-white hover:bg-primary/10 hover:text-primary flex items-center justify-center rounded-xl" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-6 w-6" /></button>
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
            {selectedDayEvents.length > 0 ? (
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

      {/* DIÁLOGO DE CRIAÇÃO MULTIMODAL - RECONSTRUÍDO PARA SOBERANIA LOGÍSTICA */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[750px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col h-[90vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none shadow-xl">
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border shadow-xl transition-all",
                isSyncingWorkspace && "animate-pulse bg-emerald-500/20 border-emerald-500",
                !isSyncingWorkspace && (
                  createMode === 'audiencia' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                  createMode === 'freelance' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                  createMode === 'prazo' ? "bg-primary/10 border-primary/20 text-primary" :
                  "bg-amber-500/10 border-amber-500/20 text-amber-500"
                )
              )}>
                {isSyncingWorkspace ? <Loader2 className="h-6 w-6 animate-spin" /> : (createMode === 'audiencia' ? <Gavel className="h-6 w-6" /> : createMode === 'prazo' ? <Clock className="h-6 w-6" /> : <Target className="h-6 w-6" />)}
              </div>
              <div className="text-left">
                <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                  {editingEventId ? "Retificar Registro" : createMode === 'audiencia' ? "Injetar Audiência" : createMode === 'freelance' ? "Ordem Freelance" : createMode === 'prazo' ? "Lançar Prazo" : "Agendar Atendimento"}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-50">
                  RITO DE SINCRONISMO WORKSPACE RGMJ.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 bg-[#0a0f1e]/50">
            <div className="p-10 space-y-10">
              
              {/* FORMULÁRIO ATENDIMENTO (FIEL À IMAGEM) */}
              {createMode === 'atendimento' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Identificação da Pauta *</Label>
                    <Input 
                      value={newEventData.title} 
                      onChange={e => setNewEventData({...newEventData, title: e.target.value.toUpperCase()})}
                      placeholder="REUNIÃO: CLIENTE X"
                      className="bg-black/40 border-white/10 h-16 text-white font-black text-sm uppercase px-6 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data do Compromisso</Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                        <Input type="date" value={newEventData.date} onChange={e => setNewEventData({...newEventData, date: e.target.value})} className="bg-black/40 border-white/10 h-14 pl-12 text-white font-bold" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Horário</Label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                        <Input type="time" value={newEventData.time} onChange={e => setNewEventData({...newEventData, time: e.target.value})} className="bg-black/40 border-white/10 h-14 pl-12 text-white font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Modalidade do Atendimento</Label>
                    <RadioGroup 
                      value={newEventData.meetingType} 
                      onValueChange={(v: any) => setNewEventData({...newEventData, meetingType: v, location: v === 'online' ? 'Google Meet' : 'Sede RGMJ'})}
                      className="grid grid-cols-2 gap-6"
                    >
                      <div className={cn(
                        "p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4",
                        newEventData.meetingType === "online" ? "bg-emerald-500/5 border-emerald-500 shadow-lg shadow-emerald-500/10" : "bg-black/20 border-white/5"
                      )} onClick={() => setNewEventData({...newEventData, meetingType: "online"})}>
                        <RadioGroupItem value="online" className="border-emerald-500 text-emerald-500" />
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-emerald-500" />
                          <span className="text-[11px] font-black text-white uppercase tracking-widest">Virtual</span>
                        </div>
                      </div>
                      <div className={cn(
                        "p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4",
                        newEventData.meetingType === "presencial" ? "bg-primary/5 border-primary shadow-lg shadow-primary/10" : "bg-black/20 border-white/5"
                      )} onClick={() => setNewEventData({...newEventData, meetingType: "presencial"})}>
                        <RadioGroupItem value="presencial" className="border-primary text-primary" />
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span className="text-[11px] font-black text-white uppercase tracking-widest">Presencial</span>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Localização da Reunião</Label>
                    <div className="relative">
                      <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                      <Input 
                        value={newEventData.location} 
                        onChange={e => setNewEventData({...newEventData, location: e.target.value.toUpperCase()})}
                        className="bg-black/20 border-primary h-16 pl-12 text-white font-black text-sm rounded-xl focus:ring-4 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pauta / Notas Estratégicas</Label>
                    <Textarea 
                      value={newEventData.notes} 
                      onChange={e => setNewEventData({...newEventData, notes: e.target.value})}
                      placeholder="DESCREVA OS ASSUNTOS A SEREM TRATADOS NO ATENDIMENTO..."
                      className="bg-black/40 border-white/10 min-h-[150px] text-white text-xs p-6 rounded-2xl resize-none uppercase"
                    />
                  </div>
                </div>
              )}

              {/* FORMULÁRIO PRAZO (IA + CALCULADORA) */}
              {createMode === 'prazo' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3"><FileText className="h-4 w-4" /> Despacho / Publicação</Label>
                      <Button onClick={handleAiParsePublication} disabled={isAnalyzing || !newEventData.publicationText} variant="outline" className="h-9 border-primary/30 text-primary font-black uppercase text-[9px] gap-2"><Brain className="h-3.5 w-3.5" /> ANALISAR IA</Button>
                    </div>
                    <Textarea value={newEventData.publicationText} onChange={e => setNewEventData({...newEventData, publicationText: e.target.value})} className="bg-black/40 border-white/10 min-h-[120px] text-white text-xs font-bold p-5 rounded-2xl resize-none uppercase" placeholder="COLE O TEXTO OFICIAL AQUI..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3"><Label className={labelMini}>Título do Ato *</Label><Input value={newEventData.title} onChange={e => setNewEventData({...newEventData, title: e.target.value.toUpperCase()})} className="bg-black/40 border-white/10 h-14 text-white font-black" /></div>
                    <div className="space-y-3"><Label className={labelMini}>Protocolo CNJ</Label><Input value={newEventData.processNumber} onChange={e => setNewEventData({...newEventData, processNumber: e.target.value})} className="bg-black/40 border-white/10 h-14 text-white font-mono" /></div>
                  </div>

                  <div className="p-8 rounded-3xl border-2 border-primary/20 bg-primary/5 space-y-6 shadow-2xl">
                    <div className="flex items-center gap-3"><Calculator className="h-5 w-5 text-primary" /><h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Calculadora de Vencimento</h4></div>
                    <div className="flex flex-col md:flex-row items-end gap-6">
                      <div className="flex-1 space-y-2 w-full"><Label className={labelMini}>Duração (Dias)</Label><Input type="number" className="bg-black/60 border-white/10 h-16 text-white font-black text-2xl text-center rounded-2xl" value={deadlineDuration} onChange={e => setDeadlineDuration(e.target.value)} /></div>
                      <Button onClick={handleApplyDeadlineCalculation} variant="outline" className="h-16 px-10 border-primary text-primary font-black uppercase text-xs tracking-widest gap-3 hover:bg-primary hover:text-background transition-all rounded-2xl"><Zap className="h-5 w-5" /> APLICAR PRAZO</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><Label className={labelMini}>Data Publicação</Label><Input type="date" value={newEventData.pubDate} onChange={e => setNewEventData({...newEventData, pubDate: e.target.value})} className="bg-black/40 h-14 text-white" /></div>
                    <div className="space-y-3"><Label className="text-[10px] font-black text-rose-500 uppercase">Data Fatal (Vencimento) *</Label><Input type="date" value={newEventData.date} onChange={e => setNewEventData({...newEventData, date: e.target.value})} className="bg-black/40 border-rose-500/30 h-14 text-rose-400 font-black" /></div>
                  </div>
                </div>
              )}

              {/* OUTROS FORMULÁRIOS (AUDIÊNCIA / DILIGÊNCIA)... */}
              {(createMode === 'audiencia' || createMode === 'diligencia') && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="space-y-3"><Label className={labelMini}>Título do Ato *</Label><Input value={newEventData.title} onChange={e => setNewEventData({...newEventData, title: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-black" /></div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><Label className={labelMini}>Data</Label><Input type="date" value={newEventData.date} onChange={e => setNewEventData({...newEventData, date: e.target.value})} className="bg-black/40 h-12" /></div>
                    <div className="space-y-3"><Label className={labelMini}>Horário</Label><Input type="time" value={newEventData.time} onChange={e => setNewEventData({...newEventData, time: e.target.value})} className="bg-black/40 h-12" /></div>
                  </div>
                  <div className="space-y-3">
                    <Label className={labelMini}>Localização / Juízo</Label>
                    <Input value={newEventData.location} onChange={e => setNewEventData({...newEventData, location: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-bold" placeholder="FÓRUM, VARA OU ENDEREÇO COMPLETO..." />
                  </div>
                  <div className="space-y-3"><Label className={labelMini}>Notas / Referências</Label><Textarea value={newEventData.notes} onChange={e => setNewEventData({...newEventData, notes: e.target.value})} className="bg-black/40 min-h-[100px] text-white" /></div>
                </div>
              )}

            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none shadow-[0_-20px_50px_rgba(0,0,0,0.6)]">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12">CANCELAR</Button>
            <Button 
              onClick={handleSaveEvent} 
              disabled={isSyncingWorkspace || !newEventData.title || !newEventData.date}
              className="gold-gradient text-background font-black uppercase text-[12px] tracking-[0.25em] px-16 h-16 rounded-2xl shadow-[0_15px_40px_rgba(245,208,48,0.25)] transition-all hover:scale-[1.03] active:scale-95 gap-4"
            >
              {isSyncingWorkspace ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              {editingEventId ? "ATUALIZAR REGISTRO" : "CONFIRMAR E SINCRONIZAR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO VISUALIZAÇÃO DETALHADA */}
      <Dialog open={!!viewingEvent} onOpenChange={(open) => !open && setViewingEvent(null)}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[750px] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[85vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none shadow-xl">
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl",
                viewingEvent?.eventType === 'audiencia' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : 
                viewingEvent?.eventType === 'freelance' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                viewingEvent?.eventType === 'prazo' ? "bg-primary/10 border-primary/20 text-primary" :
                "bg-amber-500/10 border-amber-500/20 text-amber-500"
              )}>
                {viewingEvent?.eventType === 'audiencia' ? <Gavel className="h-7 w-7" /> : viewingEvent?.eventType === 'prazo' ? <Clock className="h-7 w-7" /> : <Target className="h-7 w-7" />}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary text-background text-[9px] font-black uppercase tracking-widest">{viewingEvent?.eventType?.toUpperCase()}</Badge>
                  <span className="text-[10px] font-black text-muted-foreground uppercase">Detalhes Estratégicos</span>
                </div>
                <DialogTitle className="text-2xl font-black text-white uppercase mt-1 leading-none">{viewingEvent?.title}</DialogTitle>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-500 hover:bg-rose-500/10 rounded-xl" onClick={() => handleDeleteEvent(viewingEvent)}><Trash2 className="h-5 w-5" /></Button>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-[#05070a]">
            <div className="p-10 space-y-10 pb-32">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className={labelMini}>Cliente / Lead</Label>
                  <p className="text-lg font-black text-white uppercase">{viewingEvent?.clientName || 'NÃO VINCULADO'}</p>
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>Processo / CNJ</Label>
                  <p className="text-sm font-mono font-bold text-white/60">{viewingEvent?.processNumber || '---'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 border-y border-white/5 py-10">
                <div className="flex items-center gap-4">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                  <div><p className={labelMini}>Data</p><p className="text-base font-bold text-white uppercase">{viewingEvent?.date ? format(viewingEvent.date, "dd 'de' MMMM", { locale: ptBR }) : '---'}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <Clock className="h-6 w-6 text-primary" />
                  <div><p className={labelMini}>Horário</p><p className="text-base font-bold text-white font-mono">{viewingEvent?.date ? format(viewingEvent.date, "HH:mm") : '--:--'}</p></div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className={labelMini}>Localização / Sala Virtual</Label>
                {viewingEvent?.meetingUrl && (
                  <Button onClick={() => window.open(viewingEvent.meetingUrl, "_blank")} className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs gap-4 rounded-2xl shadow-xl transition-all group">
                    <Video className="h-6 w-6 group-hover:scale-110" /> ACESSAR GOOGLE MEET
                  </Button>
                )}
                {viewingEvent?.location && (
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="text-sm font-bold text-white uppercase">{viewingEvent.location}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingEvent.location)}`, "_blank")} className="h-10 w-10 text-primary hover:bg-primary/10 rounded-xl"><Navigation className="h-5 w-5" /></Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label className={labelMini}>Pauta / Notas Internas</Label>
                <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 shadow-inner">
                  {viewingEvent?.notes ? <p className="text-sm text-white/80 leading-relaxed italic whitespace-pre-wrap">{viewingEvent.notes}</p> : <p className="text-[10px] text-muted-foreground/30 font-black uppercase text-center">Nenhuma nota tática.</p>}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none rounded-b-3xl">
            <Button variant="ghost" onClick={() => setViewingEvent(null)} className="text-muted-foreground uppercase font-black text-[11px] px-8 h-12">FECHAR</Button>
            <Button 
              variant="outline" 
              onClick={() => handleOpenSchedule(viewingEvent.date || new Date(), viewingEvent.eventType, viewingEvent)}
              className="border-primary/30 text-primary font-black uppercase text-[11px] px-10 h-12 rounded-xl hover:bg-primary hover:text-background"
            >
              <Edit3 className="h-4 w-4 mr-3" /> RETIFICAR ATO
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block"
