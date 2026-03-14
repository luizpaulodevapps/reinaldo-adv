
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Scale, 
  Search, 
  Plus, 
  Loader2, 
  Zap,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Edit3,
  Archive,
  List,
  LayoutGrid,
  Gavel,
  ShieldCheck,
  TrendingUp,
  FileText,
  User as UserIcon,
  Calendar,
  Clock,
  History,
  AlarmClock,
  FilePlus,
  FolderPlus,
  DollarSign,
  Brain,
  Sparkles,
  Navigation,
  Trash2,
  Target,
  Building2,
  ListTodo,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  ZapOff,
  X,
  Calculator,
  Library,
  Star,
  TriangleAlert,
  CalendarDays,
  Video,
  MapPin,
  Globe,
  Save
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, limit, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ProcessForm } from "@/components/cases/process-form"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { aiParseDjePublication } from "@/ai/flows/ai-parse-dje-publication"
import { format, addDays, addBusinessDays, parseISO } from "date-fns"
import { pushActToGoogleCalendar } from "@/services/google-calendar"

const AREAS = [
  { id: "todos", label: "TODOS" },
  { id: "trabalhista", label: "TRABALHISTA" },
  { id: "cível", label: "CÍVEL" },
  { id: "previdenciário", label: "PREVIDENCIÁRIO" },
  { id: "tributário", label: "TRIBUTÁRIO" },
]

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeArea, setActiveArea] = useState("todos")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<any>(null)
  const [listLimit, setListLimit] = useState(25)
  
  const [viewingProcess, setViewingProcess] = useState<any>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  
  const [activeActionProcess, setActiveActionProcess] = useState<any>(null)
  const [isMeetingOpen, setIsMeetingOpen] = useState(false)
  const [meetingStep, setMeetingStep] = useState(1)
  
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false)
  const [isHearingOpen, setIsHearingOpen] = useState(false)
  const [isFinancialOpen, setIsFinancialOpen] = useState(false)
  const [isDiligenceOpen, setIsDiligenceOpen] = useState(false)
  const [syncingDriveId, setSyncingDriveId] = useState<string | null>(null)
  const [isSyncingAct, setIsSyncingAct] = useState(false)

  // Estados para Atendimento Wizard
  const [meetingData, setMeetingData] = useState({ 
    title: "", 
    date: "", 
    time: "09:00", 
    type: "online" as "online" | "presencial", 
    location: "Google Meet",
    locationType: "sede",
    notes: "",
    autoMeet: true
  })

  // Outros estados...
  const [deadlineData, setDeadlineData] = useState({ title: "", pubDate: format(new Date(), 'yyyy-MM-dd'), fatalDate: "", description: "", priority: "normal", calculationType: "Dias Úteis (CPC/CLT)" })
  const [publicationText, setPublicationText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [deadlineDuration, setDeadlineDuration] = useState("")
  const [hearingData, setHearingData] = useState({ type: "UNA", date: "", time: "", location: "" })
  const [diligenceData, setDiligenceData] = useState({ title: "", description: "", date: "", time: "", type: "Física", location: "", assigneeId: "", requiresSubestabelecimento: false })

  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const googleSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleConfig } = useDoc(googleSettingsRef)

  const processesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "processes"), orderBy("createdAt", "desc"), limit(listLimit))
  }, [db, user, listLimit])

  const { data: processesData, isLoading } = useCollection(processesQuery)
  const processes = processesData || []

  const staffQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user])
  const { data: staffMembers } = useCollection(staffQuery)

  const filteredProcesses = useMemo(() => {
    return processes.filter(proc => {
      if (proc.status === "Arquivado") return false
      const matchesSearch = proc.processNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || proc.description?.toLowerCase().includes(searchTerm.toLowerCase()) || proc.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || proc.defendantName?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesArea = activeArea === "todos" || proc.caseType?.toLowerCase() === activeArea.toLowerCase()
      return matchesSearch && matchesArea
    })
  }, [processes, searchTerm, activeArea])

  const metrics = useMemo(() => {
    const activeOnes = processes.filter(p => p.status !== "Arquivado")
    const total = activeOnes.length
    const valorEmRisco = activeOnes.reduce((acc, p) => acc + (Number(p.value) || 0), 0)
    const ticketMedio = total > 0 ? valorEmRisco / total : 0
    return { total, valorEmRisco, ticketMedio }
  }, [processes])

  const handleScheduleMeeting = async () => {
    if (!db || !activeActionProcess) return
    setIsSyncingAct(true)
    const finalLocation = meetingData.type === 'online' ? (meetingData.location || 'GOOGLE MEET RGMJ') : (meetingData.locationType === 'sede' ? 'Sede RGMJ' : meetingData.location)
    
    // 1. Injeção no Firestore
    const payload = {
      title: meetingData.title.toUpperCase() || `REUNIÃO: ${activeActionProcess.clientName}`,
      type: "Atendimento",
      startDateTime: `${meetingData.date}T${meetingData.time}:00`,
      clientId: activeActionProcess.clientId || "",
      clientName: activeActionProcess.clientName,
      processId: activeActionProcess.id,
      meetingType: meetingData.type,
      locationType: meetingData.locationType,
      location: finalLocation,
      notes: meetingData.notes,
      status: "Agendado",
      createdAt: serverTimestamp()
    }
    const docRefRes = await addDocumentNonBlocking(collection(db, "appointments"), payload)
    const docRefId = (docRefRes as any).id;

    // 2. Sincronismo Workspace
    let meetLink = "";
    try {
      const accessToken = localStorage.getItem('google_access_token') || localStorage.getItem('access_token');
      if (accessToken) {
        const calRes = await pushActToGoogleCalendar({
          accessToken,
          act: {
            title: payload.title,
            description: payload.notes,
            location: payload.location,
            startDateTime: payload.startDateTime,
            type: 'atendimento',
            processNumber: activeActionProcess.processNumber,
            clientName: payload.clientName,
            useMeet: meetingData.type === 'online' && meetingData.autoMeet
          }
        })

        if (calRes && (calRes.id || calRes.hangoutLink)) {
          meetLink = calRes.hangoutLink || "";
          updateDocumentNonBlocking(doc(db, "appointments", docRefId), {
            meetingUrl: meetLink,
            calendarEventId: calRes.id,
            updatedAt: serverTimestamp()
          })
        }
      }
    } catch (e) { console.warn("Calendar error", e) }

    // 3. Disparo WhatsApp
    if (activeActionProcess.phone || activeActionProcess.registrationData?.phone) {
      const phone = activeActionProcess.phone || activeActionProcess.registrationData?.phone;
      const cleanPhone = phone.replace(/\D/g, "");
      const meetPart = meetLink ? ` Link Meet: ${meetLink}` : "";
      const locPart = meetingData.type === 'presencial' ? ` Local: ${finalLocation}` : "";
      const msg = `Olá ${activeActionProcess.clientName}! Confirmamos sua REUNIÃO para o dia ${new Date(meetingData.date).toLocaleDateString('pt-BR')} às ${meetingData.time}.${locPart}${meetPart} Dr. Reinaldo - RGMJ.`
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank")
    }

    setIsSyncingAct(false)
    setIsMeetingOpen(false)
    toast({ title: "Atendimento Protocolado" })
  }

  const handleLaunchDeadline = async () => { if (!db || !activeActionProcess) return; setIsSyncingAct(true); await addDocumentNonBlocking(collection(db, "deadlines"), { title: deadlineData.title.toUpperCase(), dueDate: deadlineData.fatalDate, pubDate: deadlineData.pubDate, description: deadlineData.description.toUpperCase(), priority: deadlineData.priority, calculationType: deadlineData.calculationType, processId: activeActionProcess.processNumber || activeActionProcess.id, status: "Aberto", createdAt: serverTimestamp() }); setIsSyncingAct(false); setIsDeadlineOpen(false); toast({ title: "Prazo Injetado" }); }
  const handleAiParsePublication = async () => { if (!publicationText) return; setIsAnalyzing(true); try { const result = await aiParseDjePublication({ publicationText }); setDeadlineData({ ...deadlineData, title: result.deadlineType || "PRAZO JUDICIAL", fatalDate: result.dueDate || "", description: result.summary || "" }); toast({ title: "Inteligência Concluída" }); } catch (e) { toast({ variant: "destructive", title: "Erro IA" }); } finally { setIsAnalyzing(false); } }
  const handleApplyDeadlineCalculation = () => { const days = parseInt(deadlineDuration); if (isNaN(days)) return; const baseDate = parseISO(deadlineData.pubDate); let calculatedDate: Date; if (deadlineData.calculationType.includes("Úteis")) calculatedDate = addBusinessDays(baseDate, days); else calculatedDate = addDays(baseDate, days); setDeadlineData({ ...deadlineData, fatalDate: format(calculatedDate, 'yyyy-MM-dd') }); }

  const ProcessActionsMenu = ({ proc }: { proc: any }) => (
    <DropdownMenuContent align="end" className="w-64 bg-[#0d121f] border-white/10 text-white rounded-xl p-2 shadow-2xl">
      <DropdownMenuLabel className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] px-3 py-2">GESTÃO DO CASO</DropdownMenuLabel>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewingProcess(proc); setIsViewOpen(true); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5"><History className="h-4 w-4 text-muted-foreground" /> Ver Processo Completo</DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setActiveActionProcess(proc); setMeetingStep(1); setMeetingData({...meetingData, title: `REUNIÃO: ${proc.clientName}`}); setIsMeetingOpen(true); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-emerald-400"><Calendar className="h-4 w-4" /> Agendar Atendimento</DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setActiveActionProcess(proc); setIsDeadlineOpen(true); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-rose-400"><AlarmClock className="h-4 w-4" /> Lançar Prazo Fatal</DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setActiveActionProcess(proc); setIsHearingOpen(true); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-amber-400"><Gavel className="h-4 w-4" /> Agendar Audiência</DropdownMenuItem>
      <DropdownMenuSeparator className="bg-white/5 my-1" />
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingProcess(proc); setIsSheetOpen(true); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5"><Edit3 className="h-4 w-4 text-muted-foreground" /> Editar Processo</DropdownMenuItem>
    </DropdownMenuContent>
  )

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block"

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40 mb-3">
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">ACERVO DE PROCESSOS</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-1 uppercase tracking-tight">Gestão de Processos</h1>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar..." className="pl-12 glass border-white/5 h-11 text-xs text-white rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={() => { setEditingProcess(null); setIsSheetOpen(true); }} className="gold-gradient text-background font-black gap-3 px-8 h-11 uppercase text-[10px] tracking-widest rounded-xl shadow-2xl">
            <Plus className="h-4 w-4" /> NOVO PROCESSO
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-32 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : filteredProcesses.map((proc) => (
          <Card key={proc.id} className="glass border-white/5 hover-gold transition-all group overflow-hidden cursor-pointer rounded-xl" onClick={() => setViewingProcess(proc)}>
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-lg"><UserIcon className="h-6 w-6" /></div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-white uppercase truncate">{proc.clientName}</h3>
                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase">vs</span>
                    <h3 className="text-sm font-bold text-white/60 uppercase truncate">{proc.defendantName || "NÃO MAPEADO"}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-[8px] border-primary/20 text-primary uppercase">{proc.caseType}</Badge>
                    <span className="text-[10px] font-mono text-muted-foreground/40">{proc.processNumber}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={(e) => { e.stopPropagation(); setActiveActionProcess(proc); setMeetingStep(1); setIsMeetingOpen(true); }} className="h-10 px-4 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2"><Video className="h-3.5 w-3.5" /> ATENDIMENTO</button>
                <DropdownMenu><DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-white/20 hover:text-white border border-white/5"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger><ProcessActionsMenu proc={proc} /></DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DIÁLOGO AGENDAR REUNIÃO - STEP WIZARD */}
      <Dialog open={isMeetingOpen} onOpenChange={setIsMeetingOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[650px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col h-[80vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none shadow-xl">
            <div className="flex items-center gap-6">
              <div className={cn("w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500", isSyncingAct && "animate-pulse")}>
                {isSyncingAct ? <Loader2 className="h-6 w-6 animate-spin" /> : <Calendar className="h-6 w-6" />}
              </div>
              <div>
                <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Agendar Atendimento</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">Passo {meetingStep} de 5</Badge>
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-50">{activeActionProcess?.clientName}</span>
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-[#0a0f1e]/50">
            <div className="p-10 space-y-10">
              
              {meetingStep === 1 && (
                <div className="space-y-8 animate-in zoom-in-95 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">1. Qual a Modalidade?</Label>
                  <RadioGroup value={meetingData.type} onValueChange={(v: any) => setMeetingData({...meetingData, type: v, location: v === 'online' ? 'Google Meet' : ''})} className="grid grid-cols-2 gap-6">
                    <div className={cn("p-8 rounded-3xl border-2 cursor-pointer flex flex-col items-center gap-4", meetingData.type === 'online' ? "bg-emerald-500/10 border-emerald-500" : "bg-black/20")} onClick={() => setMeetingData({...meetingData, type: 'online', location: 'Google Meet'})}>
                      <Video className={cn("h-8 w-8", meetingData.type === 'online' ? "text-emerald-500" : "text-muted-foreground")} /><span className="text-sm font-black text-white uppercase">Virtual</span>
                    </div>
                    <div className={cn("p-8 rounded-3xl border-2 cursor-pointer flex flex-col items-center gap-4", meetingData.type === 'presencial' ? "bg-primary/10 border-primary" : "bg-black/20")} onClick={() => setMeetingData({...meetingData, type: 'presencial'})}>
                      <MapPin className={cn("h-8 w-8", meetingData.type === 'presencial' ? "text-primary" : "text-muted-foreground")} /><span className="text-sm font-black text-white uppercase">Presencial</span>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {meetingStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">2. Cronograma do Atendimento</Label>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className={labelMini}>Data</Label><Input type="date" className="bg-black/40 h-14 text-white font-bold rounded-xl" value={meetingData.date} onChange={e => setMeetingData({...meetingData, date: e.target.value})} /></div>
                    <div className="space-y-2"><Label className={labelMini}>Hora</Label><Input type="time" className="bg-black/40 h-14 text-white font-bold rounded-xl" value={meetingData.time} onChange={e => setMeetingData({...meetingData, time: e.target.value})} /></div>
                  </div>
                </div>
              )}

              {meetingStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">3. Identificação & Pauta</Label>
                  <div className="space-y-6">
                    <div className="space-y-2"><Label className={labelMini}>Título da Pauta *</Label><Input value={meetingData.title} onChange={e => setMeetingData({...meetingData, title: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-black px-6 rounded-xl" /></div>
                    <div className="space-y-2"><Label className={labelMini}>Notas Estratégicas</Label><Textarea value={meetingData.notes} onChange={e => setMeetingData({...meetingData, notes: e.target.value})} className="bg-black/40 min-h-[150px] text-white p-6 rounded-2xl" /></div>
                  </div>
                </div>
              )}

              {meetingStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">4. Logística do Encontro</Label>
                  {meetingData.type === 'online' ? (
                    <Card className="p-10 rounded-[2.5rem] bg-emerald-500/5 border-2 border-emerald-500/20 text-center space-y-6">
                      <Video className="h-12 w-12 text-emerald-500 mx-auto" /><h4 className="text-xl font-black text-white uppercase">Google Meet Hub</h4>
                      <div className="flex items-center justify-center gap-4 bg-black/40 p-4 rounded-xl">
                        <Switch checked={meetingData.autoMeet} onCheckedChange={v => setMeetingData({...meetingData, autoMeet: v})} className="data-[state=checked]:bg-emerald-500" />
                        <Label className="text-[10px] font-black text-white uppercase">Habilitar Link Workspace?</Label>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <RadioGroup value={meetingData.locationType} onValueChange={v => setMeetingData({...meetingData, locationType: v})} className="grid grid-cols-2 gap-4">
                        <div className={cn("p-6 rounded-2xl border-2 cursor-pointer flex items-center gap-3", meetingData.locationType === 'sede' ? "bg-primary/10 border-primary" : "bg-black/20")} onClick={() => setMeetingData({...meetingData, locationType: 'sede', location: 'Sede RGMJ'})}>
                          <Building2 className="h-4 w-4 text-primary" /><span className="text-[10px] font-black text-white uppercase">Sede RGMJ</span>
                        </div>
                        <div className={cn("p-6 rounded-2xl border-2 cursor-pointer flex items-center gap-3", meetingData.locationType === 'externo' ? "bg-primary/10 border-primary" : "bg-black/20")} onClick={() => setMeetingData({...meetingData, locationType: 'externo'})}>
                          <MapPin className="h-4 w-4 text-primary" /><span className="text-[10px] font-black text-white uppercase">Externo</span>
                        </div>
                      </RadioGroup>
                      {meetingData.locationType === 'externo' && (
                        <div className="space-y-2"><Label className={labelMini}>Endereço do Atendimento</Label><Input value={meetingData.location} onChange={e => setMeetingData({...meetingData, location: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-bold" placeholder="DIGITE O LOCAL..." /></div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {meetingStep === 5 && (
                <div className="space-y-8 animate-in zoom-in-95 duration-300 text-center">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block mb-8">5. Resumo do Protocolo</Label>
                  <Card className="glass border-primary/30 bg-primary/5 p-10 rounded-[2.5rem] shadow-2xl space-y-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-500 shadow-xl"><ShieldCheck className="h-8 w-8" /></div>
                    <div className="space-y-2"><h4 className="text-2xl font-black text-white uppercase tracking-tighter">{activeActionProcess?.clientName}</h4><p className="text-sm font-bold text-primary uppercase tracking-widest">{new Date(meetingData.date).toLocaleDateString()} às {meetingData.time}</p></div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-relaxed">
                      O rito de sincronismo disparará o convite Google e o disparo WhatsApp.
                    </p>
                  </Card>
                </div>
              )}

            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none">
            <Button variant="ghost" onClick={() => meetingStep > 1 ? setMeetingStep(meetingStep - 1) : setIsMeetingOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8">
              {meetingStep > 1 ? "ANTERIOR" : "CANCELAR"}
            </Button>
            {meetingStep < 5 ? (
              <Button onClick={() => setMeetingStep(meetingStep + 1)} className="gold-gradient text-background font-black uppercase text-[11px] px-12 h-14 rounded-xl shadow-xl transition-all hover:scale-[1.02] gap-3">
                PRÓXIMO RITO <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleScheduleMeeting} disabled={isSyncingAct} className="gold-gradient text-background font-black uppercase text-[11px] px-16 h-16 rounded-2xl shadow-2xl transition-all hover:scale-[1.02] gap-4">
                {isSyncingAct ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                CONFIRMAR E SINCRONIZAR
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Outros Diálogos (Prazo, Audiência, Financeiro) permanecem... */}
      <Dialog open={isDeadlineOpen} onOpenChange={setIsDeadlineOpen}><DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[750px] w-[95vw] h-[90vh] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col"><div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex flex-row items-center gap-5 flex-none shadow-xl"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl"><Clock className="h-6 w-6" /></div><div className="text-left"><DialogTitle className="text-white font-black uppercase tracking-tighter text-2xl">Lançar Prazo Judicial</DialogTitle></div></div><ScrollArea className="flex-1 bg-[#0a0f1e]/50"><div className="p-10 space-y-10 pb-20"><div className="space-y-4"><div className="flex items-center justify-between"><Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3"><FileText className="h-4 w-4" /> Despacho IA</Label><Button onClick={handleAiParsePublication} disabled={isAnalyzing || !publicationText} variant="outline" className="h-10 border-primary/30 text-primary font-black uppercase text-[9px] gap-2">{isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />} ANALISAR COM IA</Button></div><Textarea placeholder="COLE O TEXTO AQUI..." className="bg-black/40 border-white/10 min-h-[120px] text-white text-xs font-bold p-5 rounded-2xl" value={publicationText} onChange={(e) => setPublicationText(e.target.value.toUpperCase())} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-3"><Label className={labelMini}>Título do Ato *</Label><Input value={deadlineData.title} onChange={(e) => setDeadlineData({...deadlineData, title: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-black" /></div><div className="space-y-3"><Label className={labelMini}>Duração (Dias)</Label><div className="flex gap-4"><Input type="number" className="bg-black/60 h-14 text-white font-black text-center" value={deadlineDuration} onChange={(e) => setDeadlineDuration(e.target.value)} /><Button onClick={handleApplyDeadlineCalculation} variant="outline" className="h-14 border-primary text-primary font-black text-[10px] px-6">CALCULAR</Button></div></div></div><div className="grid grid-cols-2 gap-8"><div className="space-y-3"><Label className={labelMini}>Data Publicação</Label><Input type="date" value={deadlineData.pubDate} onChange={e => setDeadlineData({...deadlineData, pubDate: e.target.value})} className="bg-black/40 h-12" /></div><div className="space-y-3"><Label className="text-[10px] font-black text-rose-500 uppercase">Data Fatal *</Label><Input type="date" value={deadlineData.fatalDate} onChange={e => setDeadlineData({...deadlineData, fatalDate: e.target.value})} className="bg-black/40 border-rose-500/30 h-12 text-rose-400 font-black" /></div></div></div></ScrollArea><DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none shadow-xl"><Button variant="ghost" onClick={() => setIsDeadlineOpen(false)} className="text-muted-foreground uppercase font-black text-[11px]">CANCELAR</Button><Button onClick={handleLaunchDeadline} disabled={isSyncingAct} className="gold-gradient text-background font-black uppercase text-[11px] px-12 h-14 rounded-xl shadow-2xl">{isSyncingAct ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-3" />} CONFIRMAR</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
