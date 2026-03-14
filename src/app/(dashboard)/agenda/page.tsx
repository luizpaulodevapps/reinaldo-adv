
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
  CalendarDays,
  ShieldCheck,
  FileText,
  Save
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
import { cn, maskCEP } from "@/lib/utils"
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
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { pushActToGoogleCalendar } from "@/services/google-calendar"

type CreateMode = 'audiencia' | 'freelance' | 'prazo' | 'diligencia' | 'atendimento'

export default function MasterAgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createMode, setCreateMode] = useState<CreateMode>('atendimento')
  const [viewingEvent, setViewingEvent] = useState<any>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  
  // Estados para Wizard
  const [currentStep, setCurrentStep] = useState(1)
  const [isSyncingWorkspace, setIsSyncingWorkspace] = useState(false)
  const [loadingMeetingCep, setLoadingMeetingCep] = useState(false)

  const [newEventData, setNewEventData] = useState<any>({
    title: "",
    date: "",
    time: "09:00",
    location: "Sede RGMJ",
    locationType: "sede",
    notes: "",
    clientName: "",
    processNumber: "",
    meetingType: "online",
    autoMeet: true,
    calculationType: "Dias Úteis (CPC/CLT)",
    pubDate: format(new Date(), 'yyyy-MM-dd'),
    publicationText: "",
    partyContact: "",
    assigneeId: "",
    zipCode: "",
    address: "",
    number: "",
    neighborhood: "",
    city: "",
    state: ""
  })

  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const handleMeetingCepBlur = async () => {
    const cep = newEventData.zipCode.replace(/\D/g, "")
    if (cep.length !== 8) return
    setLoadingMeetingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setNewEventData((prev: any) => ({
          ...prev,
          address: data.logradouro.toUpperCase(),
          neighborhood: data.bairro.toUpperCase(),
          city: data.localidade.toUpperCase(),
          state: data.uf.toUpperCase()
        }))
      }
    } catch (e) {
      console.error("CEP error")
    } finally {
      setLoadingMeetingCep(false)
    }
  }

  const staffQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "staff_profiles"), orderBy("name", "asc")) : null, [db, user])
  const { data: staffMembers } = useCollection(staffQuery)

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
    setCurrentStep(1)
    if (existingEvent) {
      setEditingEventId(existingEvent.id)
      const d = existingEvent.date || parseDate(existingEvent.startDateTime || existingEvent.dueDate)
      setNewEventData({
        ...existingEvent,
        date: d ? format(d, 'yyyy-MM-dd') : format(date, 'yyyy-MM-dd'),
        time: d ? format(d, 'HH:mm') : "09:00",
        meetingType: existingEvent.meetingType || "online",
        locationType: existingEvent.locationType || "sede",
        autoMeet: existingEvent.autoMeet ?? true,
        calculationType: existingEvent.calculationType || "Dias Úteis (CPC/CLT)",
        zipCode: existingEvent.zipCode || "",
        address: existingEvent.address || "",
        number: existingEvent.number || "",
        neighborhood: existingEvent.neighborhood || "",
        city: existingEvent.city || "",
        state: existingEvent.state || ""
      })
    } else {
      setEditingEventId(null)
      setNewEventData({
        title: mode === 'atendimento' ? "REUNIÃO TÁTICA" : mode === 'audiencia' ? "AUDIÊNCIA UNA" : "",
        date: format(date, 'yyyy-MM-dd'),
        time: "09:00",
        location: mode === 'atendimento' ? "Sede RGMJ" : "",
        locationType: "sede",
        notes: "",
        clientName: "",
        processNumber: "",
        meetingType: "online",
        autoMeet: true,
        calculationType: "Dias Úteis (CPC/CLT)",
        priority: "normal",
        pubDate: format(date, 'yyyy-MM-dd'),
        publicationText: "",
        partyContact: "",
        assigneeId: user?.uid || "",
        zipCode: "",
        address: "",
        number: "",
        neighborhood: "",
        city: "",
        state: ""
      })
    }
    setIsCreateOpen(true)
  }

  const handleSaveEvent = async () => {
    if (!db || !newEventData.date) return
    setIsSyncingWorkspace(true)
    
    const dateTime = `${newEventData.date}T${newEventData.time || '09:00'}:00`
    let targetCollection = "appointments"
    
    let finalLocation = ""
    if (createMode === 'atendimento') {
      if (newEventData.meetingType === 'online') {
        finalLocation = newEventData.location || 'Google Meet'
      } else {
        if (newEventData.locationType === 'sede') {
          finalLocation = 'Sede RGMJ'
        } else {
          finalLocation = `${newEventData.address}, ${newEventData.number} - ${newEventData.neighborhood}, ${newEventData.city}/${newEventData.state}`
        }
      }
    } else {
      finalLocation = newEventData.location
    }

    const payload: any = {
      title: newEventData.title.toUpperCase(),
      notes: newEventData.notes,
      clientName: newEventData.clientName,
      processNumber: newEventData.processNumber,
      location: finalLocation,
      updatedAt: serverTimestamp()
    }

    let typeForGoogle: any = 'atendimento'

    if (createMode === 'audiencia') {
      targetCollection = 'hearings'
      payload.startDateTime = dateTime
      payload.status = "Agendado"
      typeForGoogle = 'audiencia'
    } else if (createMode === 'atendimento') {
      targetCollection = 'appointments'
      payload.startDateTime = dateTime
      payload.meetingType = newEventData.meetingType
      payload.locationType = newEventData.locationType
      payload.status = "Agendado"
      payload.zipCode = newEventData.zipCode
      payload.address = newEventData.address
      payload.number = newEventData.number
      payload.neighborhood = newEventData.neighborhood
      payload.city = newEventData.city
      payload.state = newEventData.state
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
      payload.assigneeId = newEventData.assigneeId
      payload.status = "Pendente"
      typeForGoogle = 'diligencia'
    } else if (createMode === 'freelance') {
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
        
        if (calRes && (calRes.id || calRes.hangoutLink)) {
          generatedMeetLink = calRes.hangoutLink || "";
          updateDocumentNonBlocking(doc(db, targetCollection, finalDocId), {
            meetingUrl: generatedMeetLink,
            calendarEventId: calRes.id,
            updatedAt: serverTimestamp()
          })
        }
      }
    } catch (e) { console.warn("Google Sync Error", e) }

    if (newEventData.partyContact || (createMode === 'atendimento' && newEventData.clientName)) {
      const contact = newEventData.partyContact || "";
      if (contact) {
        const cleanPhone = contact.replace(/\D/g, "");
        const meetPart = generatedMeetLink ? ` Link da reunião: ${generatedMeetLink}` : "";
        const locPart = createMode === 'atendimento' && newEventData.meetingType === 'presencial' ? ` Local: ${payload.location}` : "";
        const msg = `Olá! Confirmamos o agendamento de ${payload.title} para o dia ${new Date(newEventData.date).toLocaleDateString('pt-BR')} às ${newEventData.time}.${locPart}${meetPart} Dr. Reinaldo - RGMJ.`
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

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block"

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 animate-in fade-in duration-1000">
      <div className="xl:col-span-3 space-y-6">
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

          <div className="flex items-center gap-6 bg-black/20 px-6 py-3 rounded-xl border border-white/5 shadow-inner">
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
          <Plus className="h-5 w-5" /> Agendar Atendimento
        </Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[750px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col h-[90vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none shadow-xl">
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border shadow-xl transition-all",
                isSyncingWorkspace && "animate-pulse bg-emerald-500/20 border-emerald-500",
                !isSyncingWorkspace && (
                  createMode === 'audiencia' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                  createMode === 'prazo' ? "bg-primary/10 border-primary/20 text-primary" :
                  "bg-amber-500/10 border-amber-500/20 text-amber-500"
                )
              )}>
                {isSyncingWorkspace ? <Loader2 className="h-6 w-6 animate-spin" /> : (createMode === 'audiencia' ? <Gavel className="h-6 w-6" /> : createMode === 'prazo' ? <Clock className="h-6 w-6" /> : <Target className="h-6 w-6" />)}
              </div>
              <div className="text-left">
                <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                  {editingEventId ? "Retificar Registro" : createMode === 'audiencia' ? "Injetar Audiência" : createMode === 'prazo' ? "Lançar Prazo" : "Rito de Atendimento"}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">Passo {currentStep} de 5</Badge>
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-50">Sincronismo Digital</span>
                </div>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 bg-[#0a0f1e]/50">
            <div className="p-10 space-y-10">
              {createMode === 'atendimento' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  {currentStep === 1 && (
                    <div className="space-y-8 animate-in zoom-in-95 duration-300">
                      <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">1. Qual a Modalidade?</Label>
                      <RadioGroup value={newEventData.meetingType} onValueChange={(v: any) => setNewEventData({...newEventData, meetingType: v, location: v === 'online' ? 'Google Meet' : 'Sede RGMJ'})} className="grid grid-cols-2 gap-6">
                        <div className={cn("p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4", newEventData.meetingType === 'online' ? "bg-emerald-500/10 border-emerald-500" : "bg-black/20 border-white/5")} onClick={() => setNewEventData({...newEventData, meetingType: 'online'})}>
                          <Video className={cn("h-8 w-8", newEventData.meetingType === 'online' ? "text-emerald-500" : "text-muted-foreground")} /><span className="text-sm font-black text-white uppercase tracking-widest">Virtual</span>
                        </div>
                        <div className={cn("p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4", newEventData.meetingType === 'presencial' ? "bg-primary/10 border-primary" : "bg-black/20 border-white/5")} onClick={() => setNewEventData({...newEventData, meetingType: 'presencial'})}>
                          <MapPin className={cn("h-8 w-8", newEventData.meetingType === 'presencial' ? "text-primary" : "text-muted-foreground")} /><span className="text-sm font-black text-white uppercase tracking-widest">Presencial</span>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  {currentStep === 2 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                      <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">2. Cronograma</Label>
                      <div className="grid grid-cols-2 gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-2xl shadow-xl">
                        <div className="space-y-2"><Label className={labelMini}>Data</Label><Input type="date" value={newEventData.date} onChange={e => setNewEventData({...newEventData, date: e.target.value})} className="bg-black/40 h-14 text-white font-bold" /></div>
                        <div className="space-y-2"><Label className={labelMini}>Hora</Label><Input type="time" value={newEventData.time} onChange={e => setNewEventData({...newEventData, time: e.target.value})} className="bg-black/40 h-14 text-white font-bold" /></div>
                      </div>
                    </div>
                  )}
                  {currentStep === 3 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                      <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">3. Identificação</Label>
                      <div className="space-y-6">
                        <div className="space-y-2"><Label className={labelMini}>Título do Ato *</Label><Input value={newEventData.title} onChange={e => setNewEventData({...newEventData, title: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-black" /></div>
                        <div className="space-y-2"><Label className={labelMini}>Notas Estratégicas</Label><Textarea value={newEventData.notes} onChange={e => setNewEventData({...newEventData, notes: e.target.value})} className="bg-black/40 min-h-[150px] text-white p-6 rounded-2xl" placeholder="Descreva os objetivos..." /></div>
                      </div>
                    </div>
                  )}
                  {currentStep === 4 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                      <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">4. Logística</Label>
                      {newEventData.meetingType === 'online' ? (
                        <Card className="p-10 rounded-[2.5rem] bg-emerald-500/5 border-2 border-emerald-500/20 text-center space-y-6 shadow-2xl">
                          <Video className="h-12 w-12 text-emerald-500 mx-auto" /><h4 className="text-xl font-black text-white uppercase tracking-widest">Google Meet Hub</h4>
                          <div className="flex items-center justify-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                            <Switch checked={newEventData.autoMeet} onCheckedChange={v => setNewEventData({...newEventData, autoMeet: v})} className="data-[state=checked]:bg-emerald-500" />
                            <Label className="text-[10px] font-black text-white uppercase">Gerar Link via Workspace?</Label>
                          </div>
                        </Card>
                      ) : (
                        <div className="space-y-6">
                          <RadioGroup value={newEventData.locationType} onValueChange={v => setNewEventData({...newEventData, locationType: v})} className="grid grid-cols-2 gap-4">
                            <div className={cn("p-6 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all", newEventData.locationType === 'sede' ? "bg-primary/10 border-primary" : "bg-black/20 border-white/5")} onClick={() => setNewEventData({...newEventData, locationType: 'sede', location: 'Sede RGMJ'})}>
                              <Building2 className="h-4 w-4 text-primary" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Sede RGMJ</span>
                            </div>
                            <div className={cn("p-6 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all", newEventData.locationType === 'externo' ? "bg-primary/10 border-primary" : "bg-black/20 border-white/5")} onClick={() => setNewEventData({...newEventData, locationType: 'externo'})}>
                              <MapPin className="h-4 w-4 text-primary" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Externo</span>
                            </div>
                          </RadioGroup>
                          {newEventData.locationType === 'externo' && (
                            <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2"><Label className={labelMini}>CEP</Label><div className="relative"><Input value={newEventData.zipCode} onChange={e => setNewEventData({...newEventData, zipCode: maskCEP(e.target.value)})} onBlur={handleMeetingCepBlur} className="bg-black/40 h-12 text-white font-mono rounded-xl" placeholder="00000-000" />{loadingMeetingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}</div></div>
                                <div className="md:col-span-2 space-y-2"><Label className={labelMini}>Logradouro</Label><Input value={newEventData.address} onChange={e => setNewEventData({...newEventData, address: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white rounded-xl" /></div>
                                <div className="space-y-2"><Label className={labelMini}>Nº</Label><Input value={newEventData.number} onChange={e => setNewEventData({...newEventData, number: e.target.value})} className="bg-black/40 h-12 text-white rounded-xl" /></div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label className={labelMini}>Bairro</Label><Input value={newEventData.neighborhood} onChange={e => setNewEventData({...newEventData, neighborhood: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white rounded-xl" /></div>
                                <div className="space-y-2"><Label className={labelMini}>Cidade</Label><Input value={newEventData.city} onChange={e => setNewEventData({...newEventData, city: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white rounded-xl" /></div>
                                <div className="space-y-2"><Label className={labelMini}>UF</Label><Input value={newEventData.state} onChange={e => setNewEventData({...newEventData, state: e.target.value.toUpperCase()})} maxLength={2} className="bg-black/40 h-12 text-white rounded-xl" /></div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {currentStep === 5 && (
                    <div className="space-y-8 animate-in zoom-in-95 duration-300 text-center">
                      <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block mb-8">5. Consolidação</Label>
                      <Card className="glass border-primary/30 bg-primary/5 p-10 rounded-[2.5rem] shadow-2xl space-y-8">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-500 shadow-xl"><ShieldCheck className="h-8 w-8" /></div>
                        <div className="space-y-2"><h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{newEventData.title}</h4><p className="text-sm font-bold text-primary uppercase tracking-widest">{new Date(newEventData.date).toLocaleDateString()} às {newEventData.time}</p></div>
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 shadow-inner"><p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-relaxed">Sincronismo Workspace Ativo. O rito disparará o convite Google e preparará a mensagem WhatsApp.</p></div>
                      </Card>
                    </div>
                  )}
                </div>
              )}
              {createMode !== 'atendimento' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                   <div className="space-y-3"><Label className={labelMini}>Título do Ato *</Label><Input value={newEventData.title} onChange={e => setNewEventData({...newEventData, title: e.target.value.toUpperCase()})} className="bg-black/40 border-white/10 h-14 text-white font-black" /></div>
                   <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><Label className={labelMini}>Data</Label><Input type="date" value={newEventData.date} onChange={e => setNewEventData({...newEventData, date: e.target.value})} className="bg-black/40 h-12 text-white" /></div>
                    <div className="space-y-3"><Label className={labelMini}>Horário</Label><Input type="time" value={newEventData.time} onChange={e => setNewEventData({...newEventData, time: e.target.value})} className="bg-black/40 h-12 text-white" /></div>
                  </div>
                  <div className="space-y-3"><Label className={labelMini}>Localização / Juízo</Label><Input value={newEventData.location} onChange={e => setNewEventData({...newEventData, location: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-bold" /></div>
                  <div className="space-y-3"><Label className={labelMini}>Notas / Referências</Label><Textarea value={newEventData.notes} onChange={e => setNewEventData({...newEventData, notes: e.target.value})} className="bg-black/40 min-h-[100px] text-white" /></div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none shadow-xl">
            <Button variant="ghost" onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setIsCreateOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12">
              {currentStep > 1 ? "ANTERIOR" : "CANCELAR"}
            </Button>
            {createMode === 'atendimento' ? (
              currentStep < 5 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)} className="gold-gradient text-background font-black uppercase text-[11px] px-12 h-14 rounded-xl shadow-xl transition-all hover:scale-[1.02] gap-3">
                  PRÓXIMO RITO <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSaveEvent} disabled={isSyncingWorkspace} className="gold-gradient text-background font-black uppercase text-[11px] px-16 h-16 rounded-2xl shadow-[0_15px_40px_rgba(245,208,48,0.25)] transition-all hover:scale-[1.02] gap-4">
                  {isSyncingWorkspace ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  CONFIRMAR E SINCRONIZAR
                </Button>
              )
            ) : (
              <Button onClick={handleSaveEvent} disabled={isSyncingWorkspace} className="gold-gradient text-background font-black uppercase text-[11px] px-16 h-16 rounded-2xl shadow-[0_15px_40px_rgba(245,208,48,0.25)] transition-all hover:scale-[1.02] gap-4">
                {isSyncingWorkspace ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                {editingEventId ? "ATUALIZAR REGISTRO" : "CONFIRMAR E SINCRONIZAR"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingEvent} onOpenChange={(open) => !open && setViewingEvent(null)}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[750px] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[85vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none shadow-xl">
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl",
                viewingEvent?.eventType === 'audiencia' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : 
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
                  <p className="text-lg font-black text-white uppercase leading-none">{viewingEvent?.clientName || 'NÃO VINCULADO'}</p>
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>Processo / CNJ</Label>
                  <p className="text-sm font-mono font-bold text-white/60 leading-none">{viewingEvent?.processNumber || '---'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 border-y border-white/5 py-10">
                <div className="flex items-center gap-4">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                  <div><p className={labelMini}>Data</p><p className="text-base font-bold text-white uppercase leading-none">{viewingEvent?.date ? format(viewingEvent.date, "dd 'de' MMMM", { locale: ptBR }) : '---'}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <Clock className="h-6 w-6 text-primary" />
                  <div><p className={labelMini}>Horário</p><p className="text-base font-bold text-white font-mono leading-none">{viewingEvent?.date ? format(viewingEvent.date, "HH:mm") : '--:--'}</p></div>
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
                      <span className="text-sm font-bold text-white uppercase leading-none">{viewingEvent.location}</span>
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
            <Button variant="ghost" onClick={() => setViewingEvent(null)} className="text-muted-foreground uppercase font-black text-[11px] px-8 h-12 hover:text-white transition-colors">FECHAR</Button>
            <Button 
              variant="outline" 
              onClick={() => handleOpenSchedule(viewingEvent.date || new Date(), viewingEvent.eventType, viewingEvent)}
              className="border-primary/30 text-primary font-black uppercase text-[11px] px-10 h-12 rounded-xl hover:bg-primary hover:text-background transition-all"
            >
              <Edit3 className="h-4 w-4 mr-3" /> RETIFICAR ATO
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
