
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
  Calculator
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useDoc } from "@/firebase"
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
import { ProcessForm } from "@/components/cases/process-form"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { DraftingTool } from "@/components/drafting/drafting-tool"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { aiParseDjePublication } from "@/ai/flows/ai-parse-dje-publication"
import { format, addDays, addBusinessDays } from "date-fns"

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
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false)
  const [isHearingOpen, setIsHearingOpen] = useState(false)
  const [isAiDocOpen, setIsAiDocOpen] = useState(false)
  const [isFinancialOpen, setIsFinancialOpen] = useState(false)
  const [isDiligenceOpen, setIsDiligenceOpen] = useState(false)
  const [syncingDriveId, setSyncingDriveId] = useState<string | null>(null)

  // Estados para Lançamento de Prazo com IA e Calculadora
  const [publicationText, setPublicationText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [deadlineDuration, setDeadlineDuration] = useState("")
  const [meetingData, setMeetingData] = useState({ title: "", date: "", time: "", type: "online", notes: "" })
  const [deadlineData, setDeadlineData] = useState({ title: "", date: "", description: "", priority: "normal", calculationType: "Dias Úteis (CPC)" })
  const [hearingData, setHearingData] = useState({ type: "UNA", date: "", time: "", location: "" })
  const [diligenceData, setDiligenceData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "Física",
    location: "",
    assigneeId: "",
    requiresSubestabelecimento: false
  })

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

  const hearingsQuery = useMemoFirebase(() => db ? query(collection(db, "hearings")) : null, [db])
  const { data: allHearings } = useCollection(hearingsQuery)

  const appointmentsQuery = useMemoFirebase(() => db ? query(collection(db, "appointments")) : null, [db])
  const { data: allAppointments } = useCollection(appointmentsQuery)

  const deadlinesQuery = useMemoFirebase(() => db ? query(collection(db, "deadlines")) : null, [db])
  const { data: allDeadlines } = useCollection(deadlinesQuery)

  const financialQuery = useMemoFirebase(() => db ? query(collection(db, "financial_titles")) : null, [db])
  const { data: allFinancial } = useCollection(financialQuery)

  const filteredProcesses = useMemo(() => {
    return processes.filter(proc => {
      if (proc.status === "Arquivado") return false
      
      const matchesSearch = 
        proc.processNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.defendantName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesArea = activeArea === "todos" || proc.caseType?.toLowerCase() === activeArea.toLowerCase()
      
      return matchesSearch && matchesArea
    })
  }, [processes, searchTerm, activeArea])

  const metrics = useMemo(() => {
    const activeOnes = processes.filter(p => p.status !== "Arquivado")
    const total = activeOnes.length
    const valorEmRisco = activeOnes.reduce((acc, p) => {
      const val = typeof p.value === 'number' ? p.value : parseFloat(String(p.value || "0").replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''))
      return acc + (isNaN(val) ? 0 : val)
    }, 0)
    const ticketMedio = total > 0 ? valorEmRisco / total : 0
    return { total, valorEmRisco, ticketMedio }
  }, [processes])

  const handleOpenCreate = () => {
    setEditingProcess(null)
    setIsSheetOpen(true)
  }

  const handleOpenEdit = (proc: any) => {
    setEditingProcess(proc)
    setIsViewOpen(false)
    setIsSheetOpen(true)
  }

  const handleOpenView = (proc: any) => {
    setViewingProcess(proc)
    setIsViewOpen(true)
  }

  const handleSaveProcess = (data: any) => {
    if (!user || !db) return
    if (editingProcess) {
      updateDocumentNonBlocking(doc(db!, "processes", editingProcess.id), { ...data, updatedAt: serverTimestamp() })
      toast({ title: "Processo Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db!, "processes"), { ...data, status: "Em Andamento", createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      toast({ title: "Processo Protocolado" })
    }
    setIsSheetOpen(false)
  }

  const handleArchiveProcess = (id: string) => {
    if (!db || !confirm("Confirmar arquivamento estratégico?")) return
    updateDocumentNonBlocking(doc(db!, "processes", id), { status: "Arquivado", updatedAt: serverTimestamp() })
    toast({ title: "Processo Arquivado" })
  }

  const handleScheduleMeeting = async () => {
    if (!db || !activeActionProcess) return
    const payload = {
      title: `REUNIÃO: ${activeActionProcess.clientName}`,
      type: "Atendimento",
      startDateTime: `${meetingData.date}T${meetingData.time}:00`,
      clientId: activeActionProcess.clientId,
      clientName: activeActionProcess.clientName,
      processId: activeActionProcess.id,
      meetingType: meetingData.type,
      location: meetingData.type === 'online' ? 'VIRTUAL RGMJ' : 'SEDE RGMJ',
      notes: meetingData.notes,
      status: "Agendado",
      createdAt: serverTimestamp()
    }
    await addDocumentNonBlocking(collection(db, "appointments"), payload)
    setIsMeetingOpen(false)
    toast({ title: "Reunião Agendada" })
  }

  const handleLaunchDeadline = async () => {
    if (!db || !activeActionProcess) return
    const payload = {
      title: deadlineData.title.toUpperCase(),
      dueDate: deadlineData.date,
      description: deadlineData.description.toUpperCase(),
      priority: deadlineData.priority,
      calculationType: deadlineData.calculationType,
      processId: activeActionProcess.processNumber || activeActionProcess.id,
      status: "Aberto",
      createdAt: serverTimestamp()
    }
    await addDocumentNonBlocking(collection(db, "deadlines"), payload)
    setIsDeadlineOpen(false)
    setPublicationText("")
    setDeadlineDuration("")
    toast({ title: "Prazo Lançado" })
  }

  const handleAiParsePublication = async () => {
    if (!publicationText) return
    setIsAnalyzing(true)
    try {
      const result = await aiParseDjePublication({ publicationText })
      setDeadlineData({
        ...deadlineData,
        title: result.deadlineType || "PRAZO JUDICIAL",
        date: result.dueDate || "",
        description: result.summary || ""
      })
      toast({ title: "Inteligência RGMJ Concluída", description: "Dados extraídos do despacho." })
    } catch (e) {
      toast({ variant: "destructive", title: "Erro na Análise IA" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApplyDeadlineCalculation = () => {
    const days = parseInt(deadlineDuration)
    if (isNaN(days)) {
      toast({ variant: "destructive", title: "Duração Inválida" })
      return
    }
    
    const today = new Date()
    let calculatedDate: Date
    
    if (deadlineData.calculationType === "Dias Úteis (CPC)") {
      calculatedDate = addBusinessDays(today, days)
    } else {
      calculatedDate = addDays(today, days)
    }
    
    setDeadlineData({ ...deadlineData, date: format(calculatedDate, 'yyyy-MM-dd') })
    toast({ title: "Vencimento Projetado", description: `Data fatal ajustada para ${format(calculatedDate, 'dd/MM/yyyy')}.` })
  }

  const handleScheduleHearing = async () => {
    if (!db || !activeActionProcess) return
    const payload = {
      title: `AUDIÊNCIA ${hearingData.type}: ${activeActionProcess.clientName}`,
      type: hearingData.type,
      startDateTime: `${hearingData.date}T${hearingData.time}:00`,
      processId: activeActionProcess.id,
      processNumber: activeActionProcess.processNumber,
      clientName: activeActionProcess.clientName,
      location: hearingData.location || activeActionProcess.courtAddress || activeActionProcess.court || "Fórum",
      status: "Agendado",
      createdAt: serverTimestamp()
    }
    await addDocumentNonBlocking(collection(db, "hearings"), payload)
    setIsHearingOpen(false)
    toast({ title: "Audiência Injetada" })
  }

  const handleScheduleDiligence = async () => {
    if (!db || !activeActionProcess) return
    const selectedStaff = staffMembers?.find(s => s.id === diligenceData.assigneeId)
    const payload = {
      title: diligenceData.title.toUpperCase(),
      description: diligenceData.description,
      dueDate: `${diligenceData.date}T${diligenceData.time}:00`,
      processId: activeActionProcess.id,
      processNumber: activeActionProcess.processNumber,
      clientName: activeActionProcess.clientName,
      type: diligenceData.type,
      location: diligenceData.location || activeActionProcess.courtAddress || "Local não informado",
      assigneeId: diligenceData.assigneeId,
      assigneeName: selectedStaff?.name || user?.displayName || "Responsável",
      requiresSubestabelecimento: diligenceData.requiresSubestabelecimento,
      status: "Pendente",
      createdAt: serverTimestamp()
    }
    await addDocumentNonBlocking(collection(db, "diligences"), payload)
    setIsDiligenceOpen(false)
    toast({ title: "Diligência Agendada" })
  }

  const handleSaveFinancial = async (data: any) => {
    if (!db || !activeActionProcess) return
    const payload = {
      ...data,
      value: data.numericValue,
      processId: activeActionProcess.id,
      processNumber: activeActionProcess.processNumber,
      clientId: activeActionProcess.clientId,
      clientName: activeActionProcess.clientName,
      createdAt: serverTimestamp()
    }
    delete payload.numericValue
    await addDocumentNonBlocking(collection(db, "financial_titles"), payload)
    setIsFinancialOpen(false)
    toast({ title: "Evento Financeiro Registrado" })
  }

  const handleSyncDrive = async (proc: any) => {
    if (!db || !googleConfig?.rootFolderId) {
      toast({ variant: "destructive", title: "Configuração Pendente", description: "O Root Folder ID do Google Drive não foi configurado." })
      return
    }
    setSyncingDriveId(proc.id)
    try {
      const driveUrl = `https://drive.google.com/drive/u/0/folders/${googleConfig.rootFolderId}`
      await updateDocumentNonBlocking(doc(db, "processes", proc.id), { driveStatus: "synced", driveUrl: driveUrl, updatedAt: serverTimestamp() })
      toast({ title: "Drive Sincronizado" })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no Sincronismo" })
    } finally {
      setSyncingDriveId(null)
    }
  }

  const ProcessActionsMenu = ({ proc }: { proc: any }) => (
    <DropdownMenuContent align="end" className="w-64 bg-[#0d121f] border-white/10 text-white rounded-xl p-2 shadow-2xl">
      <DropdownMenuLabel className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] px-3 py-2">GESTÃO DO CASO</DropdownMenuLabel>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsViewOpen(false); handleOpenView(proc); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5">
        <History className="h-4 w-4 text-muted-foreground" /> Ver Processo Completo
      </DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsViewOpen(false); setActiveActionProcess(proc); setIsMeetingOpen(true); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-emerald-400">
        <Calendar className="h-4 w-4" /> Agendar Reunião/Atend.
      </DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsViewOpen(false); setActiveActionProcess(proc); setIsDiligenceOpen(true); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest h-11 rounded-lg hover:bg-white/5 text-blue-400 cursor-pointer">
        <ListTodo className="h-4 w-4" /> Agendar Diligência
      </DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsViewOpen(false); setActiveActionProcess(proc); setIsDeadlineOpen(true); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-rose-400">
        <AlarmClock className="h-4 w-4" /> Lançar Prazo Fatal
      </DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsViewOpen(false); setActiveActionProcess(proc); setIsHearingOpen(true); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-amber-400">
        <Gavel className="h-4 w-4" /> Agendar Audiência
      </DropdownMenuItem>
      <DropdownMenuSeparator className="bg-white/5 my-1" />
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsViewOpen(false); setActiveActionProcess(proc); setIsFinancialOpen(true); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-blue-400">
        <DollarSign className="h-4 w-4" /> Evento Financeiro
      </DropdownMenuItem>
      <DropdownMenuSeparator className="bg-white/5 my-1" />
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsViewOpen(false); handleOpenEdit(proc); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5">
        <Edit3 className="h-4 w-4 text-muted-foreground" /> Editar Processo
      </DropdownMenuItem>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsViewOpen(false); handleArchiveProcess(proc.id); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-rose-500">
        <Archive className="h-4 w-4" /> Arquivar Processo
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40 mb-3">
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span>DASHBOARD</span>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">ACERVO DE PROCESSOS</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-1 uppercase tracking-tight">Gestão de Processos</h1>
          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-[0.25em] opacity-60">CONTROLE JURÍDICO ESTRATÉGICO RGMJ.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar..." className="pl-12 glass border-white/5 h-11 text-xs text-white focus:ring-primary/50 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={handleOpenCreate} className="gold-gradient text-background font-black gap-3 px-8 h-11 uppercase text-[10px] tracking-widest rounded-xl shadow-2xl hover:scale-[1.02] transition-all">
            <Plus className="h-4 w-4" /> NOVO PROCESSO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/5 relative overflow-hidden h-24 flex flex-col justify-center shadow-xl rounded-xl group hover:border-primary/20 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary/50" />
          <CardContent className="p-5"><p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5 flex items-center gap-3"><Zap className="h-3.5 w-3.5" /> PROCESSOS ATIVOS</p><div className="text-xl font-black text-white tracking-tighter">{isLoading ? "..." : metrics.total}</div></CardContent>
        </Card>
        <Card className="glass border-white/5 h-24 flex flex-col justify-center rounded-xl"><CardContent className="p-5"><p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5 flex items-center gap-3"><Scale className="h-3.5 w-3.5" /> VALOR SOB GESTÃO</p><div className="text-xl font-black text-white tracking-tighter tabular-nums">R$ {metrics.valorEmRisco.toLocaleString('pt-BR')}</div></CardContent></Card>
        <Card className="glass border-white/5 h-24 flex flex-col justify-center rounded-xl"><CardContent className="p-5"><p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">TICKET MÉDIO</p><div className="text-xl font-black text-white tracking-tighter tabular-nums">R$ {metrics.ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div></CardContent></Card>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-2">
        <Tabs value={activeArea} onValueChange={setActiveArea} className="w-full md:w-auto">
          <TabsList className="bg-transparent h-10 p-0 gap-8 justify-start">
            {AREAS.map(area => (
              <TabsTrigger key={area.id} value={area.id} className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-[0.25em] h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all">{area.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
          <Button onClick={() => setViewMode("list")} variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "list" ? "bg-primary text-background" : "text-muted-foreground")}><List className="h-4 w-4" /></Button>
          <Button onClick={() => setViewMode("grid")} variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "grid" ? "bg-primary text-background" : "text-muted-foreground")}><LayoutGrid className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && processes.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Base Jurídica...</span></div>
        ) : filteredProcesses.length > 0 ? (
          <>
            <div className={cn("grid gap-4 transition-all", viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
              {filteredProcesses.map((proc) => {
                const hasPauta = (allHearings || []).some(h => h.processId === proc.id || h.processNumber === proc.processNumber) || (allAppointments || []).some(a => a.processId === proc.id || a.processNumber === proc.processNumber);
                const hasPrazos = (allDeadlines || []).some(d => d.processId === proc.id || d.processId === proc.processNumber);
                const hasFinancial = (allFinancial || []).some(f => f.processId === proc.id || f.processNumber === proc.processNumber);

                return (
                  <Card key={proc.id} className={cn("glass border-white/5 hover-gold transition-all group overflow-hidden cursor-pointer", viewMode === "list" ? "rounded-xl" : "rounded-3xl")} onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) handleOpenView(proc); }}>
                    <CardContent className={cn("p-6", viewMode === "list" ? "" : "flex-col space-y-6")}>
                      {viewMode === "list" ? (
                        <div className="flex flex-col gap-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1 min-w-0">
                              <div className="flex items-center gap-4"><h3 className="text-[#F5D030] font-black text-lg uppercase tracking-tighter leading-none">PROCESSO:</h3><Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] h-5 px-2 rounded-full font-black">ATIVO</Badge></div>
                              <div className="flex items-center gap-2 text-muted-foreground"><span className="text-base font-bold text-white uppercase truncate tracking-tight">{proc.defendantName || "NÃO MAPEADO"}</span><span className="text-[10px] font-black uppercase tracking-widest opacity-40">vs</span><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-primary shadow-lg"><UserIcon className="h-5 w-5" /></div><span className="text-xl font-black text-white uppercase tracking-tighter">{proc.clientName}</span></div></div>
                            </div>
                            
                            <div className="flex items-center gap-12 shrink-0 ml-8">
                              <div className="flex items-center gap-3">
                                <button onClick={(e) => { e.stopPropagation(); handleOpenView(proc); }} className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-full border transition-all border-white/5 bg-white/[0.02] text-muted-foreground hover:text-primary hover:border-primary/30")}><Calendar className="h-4 w-4" /><span className="text-[7px] font-black mt-0.5">PAUTA</span></button>
                                <button onClick={(e) => { e.stopPropagation(); setActiveActionProcess(proc); setIsDeadlineOpen(true); }} className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-full border transition-all border-white/5 bg-white/[0.02] text-muted-foreground hover:text-rose-500 hover:border-rose-500/30")}><Clock className="h-4 w-4" /><span className="text-[7px] font-black mt-0.5">PRAZOS</span></button>
                                <button onClick={(e) => { e.stopPropagation(); setActiveActionProcess(proc); setIsFinancialOpen(true); }} className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-full border transition-all border-white/5 bg-white/[0.02] text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/30")}><DollarSign className="h-4 w-4" /><span className="text-[7px] font-black mt-0.5">FINANC.</span></button>
                                <div className="flex items-center gap-2 pl-4 border-l border-white/5">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <button className="h-10 w-10 rounded-xl flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all outline-none border border-white/5">
                                        <MoreVertical className="h-5 w-5" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <ProcessActionsMenu proc={proc} />
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
                            <div className="space-y-1"><p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Protocolo CNJ</p><div className="bg-black/40 border border-white/5 px-3 py-2 rounded-lg font-mono text-[11px] font-bold text-white tracking-widest truncate">{proc.processNumber}</div></div>
                            <div className="space-y-1"><p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Área / Matéria</p><div className="flex items-center gap-2 text-amber-500 pt-1"><Scale className="h-4 w-4" /><span className="text-[11px] font-black uppercase">{proc.caseType}</span></div></div>
                            <div className="space-y-1"><p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Juízo / Comarca</p><div className="flex items-center gap-2 text-primary pt-1"><Gavel className="h-4 w-4 text-primary" /><span className="text-[11px] font-bold uppercase truncate">{proc.vara || "VARA ÚNICA"} — {proc.court} ({proc.city || 'Sede'})</span></div></div>
                            <div className="space-y-1"><p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Valor da Causa</p><div className="flex items-center gap-2 text-emerald-500 font-black tabular-nums text-[12px] pt-1"><TrendingUp className="h-4 w-4" /> R$ {Number(proc.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
                            <div className="space-y-1"><p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Responsável</p><div className="flex items-center gap-2 text-emerald-500 pt-1"><UserIcon className="h-4 w-4" /><span className="text-[11px] font-black uppercase truncate">{proc.responsibleStaffName}</span></div></div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="flex items-center gap-3">
                              <Button variant="outline" size="sm" className={cn("h-10 text-[10px] font-black uppercase px-5 rounded-xl transition-all", proc.driveStatus === 'synced' ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "border-amber-500/30 text-amber-500 bg-amber-500/5")} onClick={(e) => { e.stopPropagation(); proc.driveStatus === 'synced' ? window.open(proc.driveUrl || "#", "_blank") : handleSyncDrive(proc); }} disabled={syncingDriveId === proc.id}>{syncingDriveId === proc.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FolderPlus className="h-4 w-4 mr-2" />}{proc.driveStatus === 'synced' ? "ACESSAR DRIVE" : "SINCRONIZAR DRIVE"}</Button>
                              <Button onClick={(e) => e.stopPropagation()} variant="outline" size="sm" className="h-10 border-blue-500/30 text-blue-400 bg-blue-500/5 text-[10px] font-black uppercase px-5 rounded-xl transition-all"><ExternalLink className="h-4 w-4 mr-2" /> PORTAL JUDICIÁRIO</Button>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground/20"><FileText className="h-4 w-4" /><span className="text-[10px] font-black uppercase">PROTOCOLO: {proc.startDate || "---"}</span></div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-6">
                          <div className="space-y-3 min-w-0 flex-1">
                            <div className="flex items-center gap-4"><Badge variant="outline" className="text-[9px] font-black border-primary/30 text-primary uppercase">{proc.caseType}</Badge><span className="text-[11px] font-mono font-bold text-muted-foreground truncate">{proc.processNumber}</span></div>
                            <div><h3 className="text-base font-bold text-white uppercase truncate">{proc.description}</h3><p className="text-[10px] text-muted-foreground font-black uppercase mt-1.5 opacity-50 flex items-center gap-2"><Gavel className="h-3 w-3" /> {proc.court} • {proc.vara}</p></div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-white/5"><div className="flex items-center gap-2"><Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black">ATIVO</Badge></div><div className="flex items-center gap-2"><DropdownMenu><DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white rounded-lg bg-white/5"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><ProcessActionsMenu proc={proc} /></DropdownMenu><div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all border border-white/5"><ChevronRight className="h-4 w-4" /></div></div></div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {processes.length >= listLimit && (
              <div className="flex justify-center pt-10">
                <Button 
                  onClick={() => setListLimit(prev => prev + 25)}
                  variant="outline" 
                  className="glass border-white/10 text-muted-foreground hover:text-white font-black uppercase text-[10px] tracking-widest h-12 px-10 rounded-xl"
                >
                  <ChevronDown className="h-4 w-4 mr-2" /> Carregar Mais Processos
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center space-y-8 glass rounded-3xl border-dashed border-2 border-white/5 opacity-20"><Scale className="h-20 w-20 text-muted-foreground" /><div className="text-center space-y-2"><p className="text-base font-black text-white uppercase tracking-[0.4em]">Acervo Vazio</p></div></div>
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[85vh] font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none flex flex-row items-center justify-between">
            <div className="flex items-center gap-6"><div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-2xl"><Scale className="h-7 w-7" /></div><DialogHeader className="space-y-0 text-left"><DialogTitle className="text-xl font-black text-white uppercase tracking-tighter leading-none">{viewingProcess?.description}</DialogTitle><DialogDescription asChild className="text-[10px] text-muted-foreground uppercase font-black mt-2"><div><Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary uppercase">{viewingProcess?.caseType}</Badge><span className="text-[11px] font-mono font-bold text-muted-foreground ml-3">{viewingProcess?.processNumber}</span></div></DialogDescription></DialogHeader></div>
            <div className="flex gap-3 pr-8"><Button onClick={() => handleOpenEdit(viewingProcess)} variant="outline" className="glass border-white/10 text-white font-black text-[10px] h-11 px-6 rounded-xl hover:bg-primary hover:text-background transition-all"><Edit3 className="h-4 w-4 mr-2" /> EDITAR</Button></div>
          </div>
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="resumo" className="h-full flex flex-col">
              <div className="px-8 bg-[#0a0f1e]/50 border-b border-white/5 flex-none"><TabsList className="bg-transparent h-12 gap-8 p-0"><TabsTrigger value="resumo" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full border-b-2 border-transparent data-[state=active]:border-primary">DADOS GERAIS</TabsTrigger><TabsTrigger value="timeline" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full border-b-2 border-transparent data-[state=active]:border-primary">TIMELINE</TabsTrigger><TabsTrigger value="estrategia" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full border-b-2 border-transparent data-[state=active]:border-primary">ESTRATÉGIA</TabsTrigger></TabsList></div>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-10 space-y-10">
                    <TabsContent value="resumo" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="glass bg-white/[0.01] border-white/5 p-6 rounded-2xl space-y-6"><div className="flex items-center gap-3 border-b border-white/5 pb-3"><UserIcon className="h-4 w-4 text-primary" /><h4 className="text-[10px] font-black text-white uppercase">Polo Ativo (Cliente)</h4></div><div className="space-y-4"><div><p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Nome Civil</p><p className="text-sm font-bold text-white uppercase">{viewingProcess?.clientName}</p></div></div></Card>
                        <Card className="glass bg-white/[0.01] border-white/5 p-6 rounded-2xl space-y-6"><div className="flex items-center gap-3 border-b border-white/5 pb-3"><Building2 className="h-4 w-4 text-primary" /><h4 className="text-[10px] font-black text-white uppercase">Polo Passivo (Réu)</h4></div><div className="space-y-4"><div><p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Empresa / Reclamada</p><p className="text-sm font-bold text-white uppercase">{viewingProcess?.defendantName || "NÃO INFORMADO"}</p></div></div></Card>
                        <Card className="glass bg-white/[0.01] border-white/5 p-6 rounded-2xl space-y-6 md:col-span-2"><div className="flex items-center gap-3 border-b border-white/5 pb-3"><Gavel className="h-4 w-4 text-primary" /><h4 className="text-[10px] font-black text-white uppercase">Jurisdição</h4></div><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div><p className="text-[9px] font-black text-muted-foreground uppercase">Tribunal</p><p className="text-sm font-bold text-white uppercase">{viewingProcess?.court}</p></div><div><p className="text-[9px] font-black text-muted-foreground uppercase">Vara</p><p className="text-sm font-bold text-white uppercase">{viewingProcess?.vara}</p></div><div><p className="text-[9px] font-black text-muted-foreground uppercase">Cidade</p><p className="text-sm font-bold text-white uppercase">{viewingProcess?.city}</p></div></div></Card>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>
            </Tabs>
          </div>
          <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end flex-none rounded-b-3xl"><Button variant="ghost" onClick={() => setIsViewOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] px-8 h-12">FECHAR</Button></div>
        </DialogContent>
      </Dialog>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}><SheetContent className="flex flex-col h-full glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl sm:max-w-4xl"><div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none shadow-xl"><SheetHeader><div className="flex items-center gap-5 mb-4"><div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl"><FileText className="h-6 w-6" /></div><div><SheetTitle className="text-white font-headline text-2xl uppercase tracking-tighter">{editingProcess ? "GESTÃO ESTRATÉGICA" : "Novo Processo"}</SheetTitle><SheetDescription asChild className="text-muted-foreground text-[10px] font-black uppercase mt-1.5 opacity-60"><div>{editingProcess ? "Retificação de dados técnicos RGMJ." : "Protocolo estruturado no ecossistema."}</div></SheetDescription></div></div></SheetHeader></div><ProcessForm initialData={editingProcess} onSubmit={handleSaveProcess} onCancel={() => setIsSheetOpen(false)} /></SheetContent></Sheet>

      {/* MODAIS DE OPERAÇÃO */}
      <Dialog open={isMeetingOpen} onOpenChange={setIsMeetingOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-6 bg-[#0a0f1e] border-b border-white/5"><DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left"><Calendar className="h-6 w-6 text-emerald-500" /><div><DialogTitle className="text-white font-bold uppercase tracking-widest text-sm">Agendar Reunião</DialogTitle></div></DialogHeader></div>
          <div className="p-8 space-y-6"><div className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase">Título</Label><Input className="glass h-12 text-white font-bold" value={meetingData.title} onChange={e => setMeetingData({...meetingData, title: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase">Data</Label><Input type="date" className="glass h-12 text-white" value={meetingData.date} onChange={e => setMeetingData({...meetingData, date: e.target.value})} /></div><div className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase">Hora</Label><Input type="time" className="glass h-12 text-white" value={meetingData.time} onChange={e => setMeetingData({...meetingData, time: e.target.value})} /></div></div></div>
          <DialogFooter className="p-6 bg-black/40 border-t border-white/5"><Button variant="ghost" onClick={() => setIsMeetingOpen(false)} className="text-muted-foreground uppercase font-black text-[10px]">Cancelar</Button><Button onClick={handleScheduleMeeting} className="gold-gradient text-background font-black uppercase text-[10px] px-8 h-12 rounded-xl">Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO LANÇAR PRAZO - FIDELIDADE MODELO REFERÊNCIA */}
      <Dialog open={isDeadlineOpen} onOpenChange={setIsDeadlineOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[650px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between">
            <DialogHeader className="flex flex-row items-center gap-5 space-y-0 text-left">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500 shadow-xl">
                <AlarmClock className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-white font-black uppercase tracking-tighter text-2xl">Lançar Prazo</DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-50">CONTROLE TÁTICO DE VENCIMENTOS RGMJ.</DialogDescription>
              </div>
            </DialogHeader>
            <button onClick={() => setIsDeadlineOpen(false)} className="text-white/20 hover:text-white transition-colors"><X className="h-6 w-6" /></button>
          </div>

          <ScrollArea className="max-h-[75vh]">
            <div className="p-10 space-y-10 bg-[#0a0f1e]/50">
              
              {/* ÁREA DE IA */}
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4 shadow-inner">
                <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                  <Brain className="h-4 w-4" /> Análise de Despacho (IA)
                </Label>
                <Textarea 
                  placeholder="Cole aqui o texto da publicação ou despacho para extração automática..." 
                  className="bg-black/40 border-white/10 min-h-[100px] text-white text-xs font-bold p-4 rounded-xl resize-none uppercase"
                  value={publicationText}
                  onChange={(e) => setPublicationText(e.target.value.toUpperCase())}
                />
                <Button 
                  onClick={handleAiParsePublication} 
                  disabled={isAnalyzing || !publicationText}
                  variant="outline" 
                  className="w-full h-12 border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-background transition-all"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  ANALISAR COM IA RGMJ
                </Button>
              </div>

              {/* CALCULADORA DE VENCIMENTO */}
              <div className="p-8 rounded-[2rem] border-2 border-primary/20 bg-primary/5 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Calculadora de Vencimento</h4>
                </div>
                <div className="flex flex-col md:flex-row items-end gap-6">
                  <div className="flex-1 space-y-2 w-full">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Duração do Prazo (Dias)</Label>
                    <Input 
                      type="number" 
                      placeholder="Ex: 5, 15, 30..." 
                      className="bg-black/40 border-white/10 h-14 text-white font-black text-lg text-center"
                      value={deadlineDuration}
                      onChange={(e) => setDeadlineDuration(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleApplyDeadlineCalculation}
                    variant="outline" 
                    className="h-14 px-10 border-primary text-primary font-black uppercase text-[11px] tracking-widest gap-3 hover:bg-primary hover:text-background transition-all shadow-lg"
                  >
                    <Zap className="h-4 w-4" /> Aplicar Prazo
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground italic font-medium uppercase tracking-tight opacity-50">
                  O cálculo excluirá o dia da publicação e seguirá a metodologia acima.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Ato *</Label>
                <Input 
                  placeholder="EX: RÉPLICA À CONTESTAÇÃO" 
                  className="bg-black/40 border-white/10 h-14 text-white font-black text-sm uppercase placeholder:opacity-20 rounded-xl" 
                  value={deadlineData.title} 
                  onChange={e => setDeadlineData({...deadlineData, title: e.target.value.toUpperCase()})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Data Vencimento *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                    <Input 
                      type="date" 
                      className="bg-black/40 border-white/10 h-14 pl-12 text-white font-bold rounded-xl" 
                      value={deadlineData.date} 
                      onChange={e => setDeadlineData({...deadlineData, date: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Regra de Contagem</Label>
                  <Select value={deadlineData.calculationType} onValueChange={(v) => setDeadlineData({...deadlineData, calculationType: v})}>
                    <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white font-black text-[10px] uppercase rounded-xl">
                      <div className="flex items-center gap-3">
                        <Library className="h-4 w-4 opacity-40" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      <SelectItem value="Dias Úteis (CPC)" className="text-[10px] font-bold">🏛️ DIAS ÚTEIS (CPC)</SelectItem>
                      <SelectItem value="Dias Corridos" className="text-[10px] font-bold">📅 DIAS CORRIDOS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Detalhamento / Providência</Label>
                <Textarea 
                  placeholder="DESCREVA A TAREFA TÉCNICA OU ALERTA ESTRATÉGICO..." 
                  className="bg-black/40 border-white/10 min-h-[120px] text-white text-xs font-bold p-5 rounded-2xl resize-none uppercase"
                  value={deadlineData.description}
                  onChange={e => setDeadlineData({...deadlineData, description: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-3 flex-1 w-full">
                    <Label className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-3">
                      <Zap className="h-4 w-4" /> Nível de Urgência
                    </Label>
                    <Select value={deadlineData.priority} onValueChange={(v) => setDeadlineData({...deadlineData, priority: v})}>
                      <SelectTrigger className="bg-black/40 border-white/10 h-12 text-white font-black text-[10px] uppercase rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d121f] text-white">
                        <SelectItem value="normal" className="text-[10px] font-bold">NORMAL</SelectItem>
                        <SelectItem value="urgente" className="text-[10px] font-bold text-rose-500">🔥 URGENTE / FATAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-start gap-4 opacity-40 w-full md:w-auto">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-relaxed tracking-wider max-w-[150px]">Auditado pelo Radar de Riscos RGMJ.</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsDeadlineOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 hover:text-white">CANCELAR</Button>
            <Button 
              onClick={handleLaunchDeadline} 
              className="bg-[#e11d48] hover:bg-[#be123c] text-white font-black uppercase text-[13px] tracking-[0.2em] px-16 h-16 rounded-2xl shadow-[0_15px_40px_rgba(225,29,72,0.3)] transition-all hover:scale-[1.03] active:scale-95"
            >
              REGISTRAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHearingOpen} onOpenChange={setIsHearingOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-6 bg-[#0a0f1e] border-b border-white/5"><DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left"><Gavel className="h-6 w-6 text-amber-500" /><div><DialogTitle className="text-white font-bold uppercase tracking-widest text-sm">Agendar Audiência</DialogTitle></div></DialogHeader></div>
          <div className="p-8 space-y-6"><div className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase">Tipo</Label><Select value={hearingData.type} onValueChange={v => setHearingData({...hearingData, type: v})}><SelectTrigger className="glass h-12 text-white uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#0d121f] text-white"><SelectItem value="UNA">UNA</SelectItem><SelectItem value="INSTRUÇÃO">INSTRUÇÃO</SelectItem><SelectItem value="CONCILIAÇÃO">CONCILIAÇÃO</SelectItem></SelectContent></Select></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase">Data</Label><Input type="date" className="glass h-12 text-white" value={hearingData.date} onChange={e => setHearingData({...hearingData, date: e.target.value})} /></div><div className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase">Hora</Label><Input type="time" className="glass h-12 text-white" value={hearingData.time} onChange={e => setHearingData({...hearingData, time: e.target.value})} /></div></div></div>
          <DialogFooter className="p-6 bg-black/40 border-t border-white/5"><Button variant="ghost" onClick={() => setIsHearingOpen(false)} className="text-muted-foreground uppercase font-black text-[10px]">Cancelar</Button><Button onClick={handleScheduleHearing} className="gold-gradient text-background font-black uppercase text-[10px] px-8 h-12 rounded-xl">Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFinancialOpen} onOpenChange={setIsFinancialOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[700px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans"><DialogHeader className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl text-left"><DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Evento Financeiro</DialogTitle></DialogHeader><ScrollArea className="max-h-[60vh]"><div className="px-10 py-8 bg-[#0a0f1e]/50"><FinancialTitleForm initialData={{ description: `HONORÁRIOS: ${activeActionProcess?.clientName}`, processNumber: activeActionProcess?.processNumber }} onSubmit={handleSaveFinancial} onCancel={() => setIsFinancialOpen(false)} /></div></ScrollArea></DialogContent>
      </Dialog>
    </div>
  )
}
