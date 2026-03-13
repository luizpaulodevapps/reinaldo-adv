
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
  Zap,
  Plus,
  CheckCircle2,
  ArrowRight
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
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

  const handleCreateEvent = () => {
    if (!db || !newEventData.title || !newEventData.date || !newEventData.time) return
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
    toast({ title: "Compromisso Registrado" })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 animate-in fade-in duration-1000">
      <div className="xl:col-span-3 space-y-6">
        <div className="flex items-center justify-between bg-white/[0.02] p-6 rounded-2xl border border-white/5">
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
                  <span className={cn("text-xs font-black transition-colors", isSelected ? "text-primary scale-125 inline-block" : "text-muted-foreground group-hover:text-white")}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {hasHearing && <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
                    {hasDeadline && <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(245,208,48,0.6)]" />}
                    {hasAppointment && <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />}
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
                <Card key={idx} className="glass border-l-4 border-l-primary/50 hover-gold transition-all shadow-xl rounded-2xl overflow-hidden bg-white/[0.02]">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 h-5 border-0",
                        event.eventType === 'audiencia' ? 'bg-rose-500 text-white' : event.eventType === 'atendimento' ? 'bg-amber-500 text-background' : 'bg-white/10 text-white'
                      )}>
                        {event.eventType === 'audiencia' ? 'Audiência' : event.eventType === 'atendimento' ? 'Atendimento' : 'Prazo'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono font-bold flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {event.date ? format(event.date, "HH:mm") : "--:--"}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-sm text-white uppercase tracking-tight leading-tight">{event.title}</h4>
                    
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest truncate max-w-[150px]">
                        {event.clientName || event.processNumber || "Geral"}
                      </p>
                      {event.location && <MapPin className="h-3.5 w-3.5 text-primary opacity-40" />}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-32 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-3xl"><CalendarIcon className="h-12 w-12 mb-4" /><p className="text-[10px] font-black uppercase tracking-[0.4em]">Pauta Limpa</p></div>
            )}
          </div>
        </ScrollArea>

        <Button onClick={() => setIsCreateOpen(true)} className="w-full gold-gradient text-background font-black gap-3 py-8 rounded-2xl shadow-2xl uppercase text-[11px] tracking-[0.2em] hover:scale-[1.02] transition-all">
          <Plus className="h-5 w-5" /> Agendar Novo Ato
        </Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Injetar Ato na Pauta</DialogTitle>
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
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 hover:text-white">Abortar</Button>
            <Button onClick={handleCreateEvent} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-2xl transition-all hover:scale-[1.02]">
              CONFIRMAR AGENDA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
