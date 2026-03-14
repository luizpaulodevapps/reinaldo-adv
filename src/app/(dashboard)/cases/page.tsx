
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
  MoreVertical,
  Edit3,
  Gavel,
  ShieldCheck,
  TrendingUp,
  FileText,
  User as UserIcon,
  Calendar,
  Clock,
  AlarmClock,
  DollarSign,
  Brain,
  Sparkles,
  Navigation,
  Trash2,
  Target,
  Building2,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  X,
  Calculator,
  Library,
  Star,
  TriangleAlert,
  CalendarDays,
  Video,
  MapPin,
  Globe,
  Save,
  FolderSync,
  LayoutGrid,
  List,
  Briefcase,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, limit } from "firebase/firestore"
import { cn, maskCurrency, parseCurrencyToNumber } from "@/lib/utils"
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
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ProcessForm } from "@/components/cases/process-form"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  const [listLimit, setListLimit] = useState(50)
  
  const [activeActionProcess, setActiveActionProcess] = useState<any>(null)
  const [isMeetingOpen, setIsMeetingOpen] = useState(false)
  const [meetingStep, setMeetingStep] = useState(1)
  
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false)
  const [isSyncingAct, setIsSyncingAct] = useState(false)

  // Estados para Atendimento Wizard (Rito de 5 Passos)
  const [meetingData, setMeetingData] = useState({ 
    title: "", 
    date: format(new Date(), 'yyyy-MM-dd'), 
    time: "09:00", 
    type: "online" as "online" | "presencial", 
    location: "Google Meet",
    locationType: "sede",
    notes: "",
    autoMeet: true
  })

  // Estados para Prazo
  const [deadlineData, setDeadlineData] = useState({ 
    title: "", 
    pubDate: format(new Date(), 'yyyy-MM-dd'), 
    fatalDate: "", 
    description: "", 
    priority: "normal", 
    calculationType: "Dias Úteis (CPC/CLT)" 
  })
  const [publicationText, setPublicationText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [deadlineDuration, setDeadlineDuration] = useState("")

  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const processesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "processes"), orderBy("createdAt", "desc"), limit(listLimit))
  }, [db, user, listLimit])

  const { data: processesData, isLoading } = useCollection(processesQuery)
  const processes = processesData || []

  const filteredProcesses = useMemo(() => {
    return processes.filter(proc => {
      if (proc.status === "Arquivado") return false
      const matchesSearch = proc.processNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           proc.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           proc.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           proc.defendantName?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesArea = activeArea === "todos" || proc.caseType?.toLowerCase() === activeArea.toLowerCase()
      return matchesSearch && matchesArea
    })
  }, [processes, searchTerm, activeArea])

  const stats = useMemo(() => {
    const active = filteredProcesses.length
    const totalValue = filteredProcesses.reduce((acc, p) => acc + (parseCurrencyToNumber(p.value) || 0), 0)
    const ticket = active > 0 ? totalValue / active : 0
    return { active, totalValue, ticket }
  }, [filteredProcesses])

  const handleScheduleMeeting = async () => {
    if (!db || !activeActionProcess) return
    setIsSyncingAct(true)
    const finalLocation = meetingData.type === 'online' ? (meetingData.location || 'GOOGLE MEET RGMJ') : (meetingData.locationType === 'sede' ? 'Sede RGMJ' : meetingData.location)
    
    const payload: any = {
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

    if (activeActionProcess.phone) {
      const cleanPhone = activeActionProcess.phone.replace(/\D/g, "");
      const meetPart = meetLink ? ` Link da Reunião: ${meetLink}` : "";
      const locPart = meetingData.type === 'presencial' ? ` Local: ${finalLocation}` : "";
      const msg = `Olá ${activeActionProcess.clientName}! Confirmamos seu AGENDAMENTO para o dia ${new Date(meetingData.date).toLocaleDateString('pt-BR')} às ${meetingData.time}.${locPart}${meetPart} Dr. Reinaldo - RGMJ.`
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank")
    }

    setIsSyncingAct(false)
    setIsMeetingOpen(false)
    toast({ title: "Atendimento Protocolado e Sincronizado" })
  }

  const handleLaunchDeadline = async () => { 
    if (!db || !activeActionProcess) return; 
    setIsSyncingAct(true); 
    await addDocumentNonBlocking(collection(db, "deadlines"), { 
      title: deadlineData.title.toUpperCase(), 
      dueDate: deadlineData.fatalDate, 
      pubDate: deadlineData.pubDate, 
      description: deadlineData.description.toUpperCase(), 
      priority: deadlineData.priority, 
      calculationType: deadlineData.calculationType, 
      processId: activeActionProcess.processNumber || activeActionProcess.id, 
      clientName: activeActionProcess.clientName,
      status: "Aberto", 
      createdAt: serverTimestamp() 
    }); 
    setIsSyncingAct(false); 
    setIsDeadlineOpen(false); 
    toast({ title: "Prazo Injetado no Radar" }); 
  }

  const handleAiParsePublication = async () => { 
    if (!publicationText) return; 
    setIsAnalyzing(true); 
    try { 
      const result = await aiParseDjePublication({ publicationText }); 
      setDeadlineData({ ...deadlineData, title: result.deadlineType?.toUpperCase() || "PRAZO JUDICIAL", fatalDate: result.dueDate || "", description: result.summary?.toUpperCase() || "" }); 
      toast({ title: "Inteligência RGMJ Concluída" }); 
    } catch (e) { toast({ variant: "destructive", title: "Erro na Análise IA" }); } finally { setIsAnalyzing(false); } 
  }

  const handleApplyDeadlineCalculation = () => { 
    const days = parseInt(deadlineDuration); 
    if (isNaN(days)) return; 
    const baseDate = parseISO(deadlineData.pubDate); 
    let calculatedDate: Date; 
    if (deadlineData.calculationType.includes("Úteis")) calculatedDate = addBusinessDays(baseDate, days); 
    else calculatedDate = addDays(baseDate, days); 
    setDeadlineData({ ...deadlineData, fatalDate: format(calculatedDate, 'yyyy-MM-dd') }); 
  }

  const labelMini = "text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block"

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans pb-20">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-black text-muted-foreground/40 mb-4">
            <span>INÍCIO</span><ChevronRight className="h-2 w-2" /><span>DASHBOARD</span><ChevronRight className="h-2 w-2" /><span className="text-white">ACERVO DE PROCESSOS</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-1 uppercase tracking-tighter">Gestão de Processos</h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">CONTROLE JURÍDICO ESTRATÉGICO RGMJ.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar..." className="pl-12 glass border-white/5 h-12 text-xs text-white rounded-xl focus:ring-primary/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={() => { setEditingProcess(null); setIsSheetOpen(true); }} className="gold-gradient text-background font-black gap-3 px-8 h-12 uppercase text-[10px] tracking-widest rounded-xl shadow-[0_15px_40px_rgba(245,208,48,0.2)] hover:scale-105 transition-all">
            <Plus className="h-4 w-4" /> NOVO PROCESSO
          </Button>
        </div>
      </div>

      {/* Stats BI Topo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#141B2D] border-white/5 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Scale className="h-12 w-12" /></div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-3"><Zap className="h-3.5 w-3.5" /> PROCESSOS ATIVOS</p>
          <div className="text-4xl font-black text-white tracking-tighter">{stats.active}</div>
        </Card>
        <Card className="bg-[#141B2D] border-white/5 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="h-12 w-12" /></div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-3"><DollarSign className="h-3.5 w-3.5" /> VALOR SOB GESTÃO</p>
          <div className="text-4xl font-black text-white tracking-tighter tabular-nums">R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
        </Card>
        <Card className="bg-[#141B2D] border-white/5 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Target className="h-12 w-12" /></div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-3"><Briefcase className="h-3.5 w-3.5" /> TICKET MÉDIO</p>
          <div className="text-4xl font-black text-white tracking-tighter tabular-nums">R$ {stats.ticket.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
        </Card>
      </div>

      {/* Filtros e Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="flex flex-wrap gap-8 items-center">
          {AREAS.map(area => (
            <button 
              key={area.id} 
              onClick={() => setActiveArea(area.id)}
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.25em] transition-all relative pb-2",
                activeArea === area.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              {area.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
          <Button onClick={() => setViewMode("list")} variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className={cn("h-10 w-10", viewMode === "list" && "bg-primary text-background")}><List className="h-4 w-4" /></Button>
          <Button onClick={() => setViewMode("grid")} variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className={cn("h-10 w-10", viewMode === "grid" && "bg-primary text-background")}><LayoutGrid className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Lista de Processos - Fidelidade à Imagem */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-widest">Auditando Acervo...</span></div>
        ) : filteredProcesses.map((proc) => (
          <Card key={proc.id} className="bg-[#0d1117] border-white/5 hover:border-primary/30 transition-all group overflow-hidden rounded-2xl shadow-2xl relative">
            <CardContent className="p-10 space-y-10">
              {/* Header Card: Título e Ações Rápidas */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-black uppercase tracking-[0.3em] text-[11px]">PROCESSO:</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-0 h-5 px-2 text-[8px] font-black uppercase tracking-widest">ATIVO</Badge>
                  </div>
                  <div className="flex items-center gap-6">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{proc.clientName}</h3>
                    <span className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-widest">vs</span>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><UserIcon className="h-5 w-5 text-muted-foreground/40" /></div>
                      <h3 className="text-xl font-bold text-white/60 uppercase tracking-tight">{proc.defendantName || "NÃO MAPEADO"}</h3>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); setActiveActionProcess(proc); setMeetingStep(1); setIsMeetingOpen(true); }} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"><CalendarDays className="h-5 w-5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setActiveActionProcess(proc); setIsDeadlineOpen(true); }} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"><Clock className="h-5 w-5" /></button>
                  <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"><DollarSign className="h-5 w-5" /></button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"><MoreVertical className="h-5 w-5" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0d121f] border-white/10 text-white">
                      <DropdownMenuItem onClick={() => { setEditingProcess(proc); setIsSheetOpen(true); }} className="gap-2 text-[10px] font-black uppercase"><Edit3 className="h-3.5 w-3.5" /> Editar Dossiê</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteDocumentNonBlocking(doc(db!, "processes", proc.id))} className="gap-2 text-[10px] font-black uppercase text-rose-500"><Trash2 className="h-3.5 w-3.5" /> Arquivar Feito</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Grid de Metadados Internos */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                <div className="space-y-2">
                  <Label className={labelMini}>PROTOCOLO CNJ</Label>
                  <div className="h-12 bg-black/40 border border-white/5 rounded-xl flex items-center px-4 shadow-inner">
                    <span className="text-[11px] font-mono font-bold text-white/80 truncate tracking-wider">{proc.processNumber || "---"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>ÁREA / MATÉRIA</Label>
                  <div className="h-12 bg-black/40 border border-white/5 rounded-xl flex items-center px-4 gap-3">
                    <Tag className="h-4 w-4 text-primary/40" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{proc.caseType?.toUpperCase()}</span>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label className={labelMini}>JUÍZO / COMARCA</Label>
                  <div className="h-12 bg-black/40 border border-white/5 rounded-xl flex items-center px-4 gap-3 overflow-hidden">
                    <Gavel className="h-4 w-4 text-primary/40 flex-none" />
                    <span className="text-[10px] font-black text-white/60 uppercase truncate">{proc.vara || "---"} — ({proc.court || "---"})</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>VALOR DA CAUSA</Label>
                  <div className="h-12 bg-black/40 border border-white/5 rounded-xl flex items-center px-4 gap-3">
                    <TrendingUp className="h-4 w-4 text-emerald-500/40" />
                    <span className="text-xs font-black text-emerald-400 tabular-nums">R$ {maskCurrency(proc.value || 0)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>RESPONSÁVEL</Label>
                  <div className="h-12 bg-black/40 border border-white/5 rounded-xl flex items-center px-4 gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center"><UserIcon className="h-3 w-3 text-primary" /></div>
                    <span className="text-[9px] font-black text-white/40 uppercase truncate">{proc.responsibleStaffName || "NÃO ATRIBUÍDO"}</span>
                  </div>
                </div>
              </div>

              {/* Footer Card: Ações Secundárias */}
              <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 gap-6">
                <div className="flex gap-4">
                  <Button variant="outline" className="h-11 border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest px-8 rounded-xl gap-3 hover:bg-primary hover:text-background transition-all">
                    <FolderSync className="h-4 w-4" /> SINCRONIZAR DRIVE
                  </Button>
                  <Button variant="outline" className="h-11 border-white/10 text-white/40 font-black uppercase text-[10px] tracking-widest px-8 rounded-xl gap-3 hover:bg-white/5 transition-all">
                    <ExternalLink className="h-4 w-4" /> PORTAL JUDICIÁRIO
                  </Button>
                </div>
                <div className="flex items-center gap-2.5 opacity-20 group-hover:opacity-40 transition-opacity">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">PROTOCOLO: {proc.id.substring(0,8).toUpperCase()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DIÁLOGO ATENDIMENTO (Wizard 5 Steps) */}
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
                  <RadioGroup value={meetingData.type} onValueChange={(v: any) => setMeetingData({...meetingData, type: v, location: v === 'online' ? 'Google Meet' : 'Sede RGMJ'})} className="grid grid-cols-2 gap-6">
                    <div className={cn("p-8 rounded-3xl border-2 cursor-pointer flex flex-col items-center gap-4 transition-all", meetingData.type === 'online' ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-black/20 border-white/5")} onClick={() => setMeetingData({...meetingData, type: 'online', location: 'Google Meet'})}>
                      <Video className={cn("h-8 w-8", meetingData.type === 'online' ? "text-emerald-500" : "text-muted-foreground")} />
                      <span className="text-sm font-black text-white uppercase">Virtual</span>
                    </div>
                    <div className={cn("p-8 rounded-3xl border-2 cursor-pointer flex flex-col items-center gap-4 transition-all", meetingData.type === 'presencial' ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(245,208,48,0.2)]" : "bg-black/20 border-white/5")} onClick={() => setMeetingData({...meetingData, type: 'presencial', location: 'Sede RGMJ'})}>
                      <MapPin className={cn("h-8 w-8", meetingData.type === 'presencial' ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm font-black text-white uppercase">Presencial</span>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {meetingStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">2. Cronograma do Atendimento</Label>
                  <div className="grid grid-cols-2 gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-2xl shadow-xl">
                    <div className="space-y-2"><Label className={labelMini}>Data</Label><Input type="date" className="bg-black/40 h-14 text-white font-bold rounded-xl" value={meetingData.date} onChange={e => setMeetingData({...meetingData, date: e.target.value})} /></div>
                    <div className="space-y-2"><Label className={labelMini}>Hora</Label><Input type="time" className="bg-black/40 h-14 text-white font-bold rounded-xl" value={meetingData.time} onChange={e => setMeetingData({...meetingData, time: e.target.value})} /></div>
                  </div>
                </div>
              )}

              {meetingStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">3. Identificação & Pauta</Label>
                  <div className="space-y-6">
                    <div className="space-y-2"><Label className={labelMini}>Título da Pauta *</Label><Input value={meetingData.title} onChange={e => setMeetingData({...meetingData, title: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-black px-6 rounded-xl" placeholder="EX: REUNIÃO TÁTICA" /></div>
                    <div className="space-y-2"><Label className={labelMini}>Notas Estratégicas</Label><Textarea value={meetingData.notes} onChange={e => setMeetingData({...meetingData, notes: e.target.value})} className="bg-black/40 min-h-[150px] text-white p-6 rounded-2xl" placeholder="Descreva os objetivos da reunião..." /></div>
                  </div>
                </div>
              )}

              {meetingStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">4. Logística do Encontro</Label>
                  {meetingData.type === 'online' ? (
                    <Card className="p-10 rounded-[2.5rem] bg-emerald-500/5 border-2 border-emerald-500/20 text-center space-y-6 shadow-2xl">
                      <Video className="h-12 w-12 text-emerald-500 mx-auto" />
                      <h4 className="text-xl font-black text-white uppercase">Google Meet Hub</h4>
                      <div className="flex items-center justify-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                        <Switch checked={meetingData.autoMeet} onCheckedChange={v => setMeetingData({...meetingData, autoMeet: v})} className="data-[state=checked]:bg-emerald-500" />
                        <Label className="text-[10px] font-black text-white uppercase">Gerar Link via Workspace?</Label>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <RadioGroup value={meetingData.locationType} onValueChange={v => setMeetingData({...meetingData, locationType: v})} className="grid grid-cols-2 gap-4">
                        <div className={cn("p-6 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all", meetingData.locationType === 'sede' ? "bg-primary/10 border-primary shadow-lg" : "bg-black/20 border-white/5")} onClick={() => setMeetingData({...meetingData, locationType: 'sede', location: 'Sede RGMJ'})}>
                          <Building2 className="h-4 w-4 text-primary" /><span className="text-[10px] font-black text-white uppercase">Sede RGMJ</span>
                        </div>
                        <div className={cn("p-6 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all", meetingData.locationType === 'externo' ? "bg-primary/10 border-primary shadow-lg" : "bg-black/20 border-white/5")} onClick={() => setMeetingData({...meetingData, locationType: 'externo'})}>
                          <MapPin className="h-4 w-4 text-primary" /><span className="text-[10px] font-black text-white uppercase">Externo</span>
                        </div>
                      </RadioGroup>
                      {meetingData.locationType === 'externo' && (
                        <div className="space-y-2 animate-in fade-in">
                          <Label className={labelMini}>Endereço do Atendimento</Label>
                          <Input value={meetingData.location} onChange={e => setMeetingData({...meetingData, location: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-bold px-6 rounded-xl" placeholder="DIGITE O LOCAL..." />
                        </div>
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
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{activeActionProcess?.clientName}</h4>
                      <p className="text-sm font-bold text-primary uppercase tracking-widest">{new Date(meetingData.date).toLocaleDateString()} às {meetingData.time}</p>
                    </div>
                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl shadow-inner">
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-relaxed">
                        O rito de sincronismo disparará o convite Google e preparará o disparo WhatsApp com o link tático.
                      </p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none shadow-[0_-20px_50px_rgba(0,0,0,0.6)]">
            <Button variant="ghost" onClick={() => meetingStep > 1 ? setMeetingStep(meetingStep - 1) : setIsMeetingOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12">
              {meetingStep > 1 ? "ANTERIOR" : "CANCELAR"}
            </Button>
            {meetingStep < 5 ? (
              <Button onClick={() => setMeetingStep(meetingStep + 1)} className="gold-gradient text-background font-black uppercase text-[11px] px-12 h-14 rounded-xl shadow-xl transition-all hover:scale-[1.02] gap-3">
                PRÓXIMO RITO <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleScheduleMeeting} disabled={isSyncingAct} className="gold-gradient text-background font-black uppercase text-[11px] px-16 h-16 rounded-2xl shadow-[0_15px_40px_rgba(245,208,48,0.25)] transition-all hover:scale-[1.02] gap-4">
                {isSyncingAct ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                CONFIRMAR E SINCRONIZAR
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO PRAZO JUDICIAL */}
      <Dialog open={isDeadlineOpen} onOpenChange={setIsDeadlineOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[750px] w-[95vw] h-[90vh] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex flex-row items-center gap-5 flex-none shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl"><Clock className="h-6 w-6" /></div>
            <div className="text-left">
              <DialogTitle className="text-white font-black uppercase tracking-tighter text-2xl">Lançar Prazo Judicial</DialogTitle>
              <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-50">CONTROLE TÁTICO DE VENCIMENTOS RGMJ.</DialogDescription>
            </div>
          </div>
          <ScrollArea className="flex-1 bg-[#0a0f1e]/50">
            <div className="p-10 space-y-10 pb-20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3"><FileText className="h-4 w-4" /> Despacho IA</Label>
                  <Button onClick={handleAiParsePublication} disabled={isAnalyzing || !publicationText} variant="outline" className="h-10 border-primary/30 text-primary font-black uppercase text-[9px] gap-2">{isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />} ANALISAR COM IA</Button>
                </div>
                <Textarea placeholder="COLE O TEXTO AQUI..." className="bg-black/40 border-white/10 min-h-[120px] text-white text-xs font-bold p-5 rounded-2xl resize-none" value={publicationText} onChange={(e) => setPublicationText(e.target.value.toUpperCase())} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3"><Label className={labelMini}>Título do Ato *</Label><Input value={deadlineData.title} onChange={(e) => setDeadlineData({...deadlineData, title: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-black" /></div>
                <div className="space-y-3"><Label className={labelMini}>Duração (Dias)</Label><div className="flex gap-4"><Input type="number" className="bg-black/60 h-14 text-white font-black text-center" value={deadlineDuration} onChange={(e) => setDeadlineDuration(e.target.value)} /><Button onClick={handleApplyDeadlineCalculation} variant="outline" className="h-14 border-primary text-primary font-black text-[10px] px-6">CALCULAR</Button></div></div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3"><Label className={labelMini}>Data Publicação</Label><Input type="date" value={deadlineData.pubDate} onChange={e => setDeadlineData({...deadlineData, pubDate: e.target.value})} className="bg-black/40 h-12" /></div>
                <div className="space-y-3"><Label className="text-[10px] font-black text-rose-500 uppercase">Data Fatal *</Label><Input type="date" value={deadlineData.fatalDate} onChange={e => setDeadlineData({...deadlineData, fatalDate: e.target.value})} className="bg-black/40 border-rose-500/30 h-12 text-rose-400 font-black" /></div>
              </div>
              <div className="space-y-3"><Label className={labelMini}>Providência / Tarefa *</Label><Input value={deadlineData.description} onChange={(e) => setDeadlineData({...deadlineData, description: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-black" /></div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none shadow-xl">
            <Button variant="ghost" onClick={() => setIsDeadlineOpen(false)} className="text-muted-foreground uppercase font-black text-[11px]">CANCELAR</Button>
            <Button onClick={handleLaunchDeadline} disabled={isSyncingAct} className="gold-gradient text-background font-black uppercase text-[11px] px-12 h-14 rounded-xl shadow-2xl">{isSyncingAct ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-3" />} CONFIRMAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex flex-col h-full glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl sm:max-w-[1200px]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none">
            <SheetHeader>
              <SheetTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingProcess ? "Retificar Dossiê" : "Novo Processo"}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                {editingProcess ? "Ajuste de metadados processuais." : "Injeção estratégica de novo feito no acervo."}
              </SheetDescription>
            </SheetHeader>
          </div>
          <ProcessForm 
            initialData={editingProcess}
            onSubmit={(data) => {
              if (editingProcess) {
                updateDocumentNonBlocking(doc(db!, "processes", editingProcess.id), { ...data, updatedAt: serverTimestamp() })
                toast({ title: "Processo Atualizado" })
              } else {
                addDocumentNonBlocking(collection(db!, "processes"), { ...data, status: "Em Andamento", createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
                toast({ title: "Processo Protocolado" })
              }
              setIsSheetOpen(false)
            }}
            onCancel={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
