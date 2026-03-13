
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
  Handshake,
  ChevronDown,
  FolderOpen,
  ExternalLink,
  User,
  History,
  CalendarDays,
  AlarmClock,
  FilePlus,
  DollarSign,
  Brain,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Navigation,
  UserPlus,
  ShieldAlert,
  MapPin,
  Fingerprint,
  Target,
  X,
  Building2,
  ListTodo,
  CloudLightning,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking, useDoc } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, limit, doc, where } from "firebase/firestore"
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

  const [meetingData, setMeetingData] = useState({ title: "", date: "", time: "", type: "online", notes: "" })
  const [deadlineData, setDeadlineData] = useState({ title: "", date: "", description: "" })
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
  const [aiDocInitialDetails, setAiDocInitialDetails] = useState("")

  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const googleSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleConfig } = useDoc(googleSettingsRef)

  const processesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "processes"), orderBy("createdAt", "desc"), limit(100))
  }, [db, user])

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
    setIsSheetOpen(true)
    setIsViewOpen(false)
  }

  const handleOpenView = (proc: any) => {
    setViewingProcess(proc)
    setIsViewOpen(true)
  }

  const handleSaveProcess = (data: any) => {
    if (!user || !db) return
    
    if (editingProcess) {
      updateDocumentNonBlocking(doc(db!, "processes", editingProcess.id), {
        ...data,
        updatedAt: serverTimestamp(),
      })
      toast({ title: "Processo Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db!, "processes"), {
        ...data,
        status: "Em Andamento",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast({ title: "Processo Protocolado" })
    }
    setIsSheetOpen(false)
  }

  const handleArchiveProcess = (id: string) => {
    if (!db) return
    if (!confirm("Confirmar arquivamento estratégico?")) return
    updateDocumentNonBlocking(doc(db!, "processes", id), {
      status: "Arquivado",
      updatedAt: serverTimestamp()
    })
    toast({ title: "Processo Arquivado" })
  }

  const handleScheduleMeeting = async () => {
    if (!db || !activeActionProcess) return
    const payload = {
      title: meetingData.title || `REUNIÃO: ${activeActionProcess.clientName}`,
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
      description: deadlineData.description,
      processId: activeActionProcess.processNumber || activeActionProcess.id,
      status: "Aberto",
      calculationType: "Dias Úteis (CPC)",
      createdAt: serverTimestamp()
    }
    await addDocumentNonBlocking(collection(db, "deadlines"), payload)
    setIsDeadlineOpen(false)
    toast({ title: "Prazo Lançado na Pauta" })
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
    toast({ title: "Audiência Injetada na Agenda" })
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
      syncGoogleTasks: googleConfig?.isTasksActive || false,
      createdAt: serverTimestamp()
    }
    await addDocumentNonBlocking(collection(db, "diligences"), payload)
    setIsDiligenceOpen(false)
    
    if (googleConfig?.isTasksActive) {
      toast({ 
        title: "Tarefa Agendada", 
        description: "O ato foi delegado e sincronizado com o Google Tasks.",
        duration: 5000 
      })
    } else {
      toast({ title: "Diligência Agendada", description: "O ato foi delegado internamente." })
    }
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
      toast({ 
        variant: "destructive", 
        title: "Configuração Pendente", 
        description: "O Root Folder ID do Google Drive não foi configurado nas configurações." 
      })
      return
    }

    setSyncingDriveId(proc.id)
    try {
      // Simulação de criação de infraestrutura
      // Em produção, isso chamaria uma Cloud Function ou Server Action com Auth do Google
      const driveUrl = `https://drive.google.com/drive/u/0/folders/${googleConfig.rootFolderId}`
      
      await updateDocumentNonBlocking(doc(db, "processes", proc.id), {
        driveStatus: "synced",
        driveUrl: driveUrl,
        updatedAt: serverTimestamp()
      })
      
      toast({ 
        title: "Drive Sincronizado", 
        description: `Estrutura de pastas criada para o processo ${proc.processNumber || proc.id}.` 
      })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no Sincronismo" })
    } finally {
      setSyncingDriveId(null)
    }
  }

  const getDrawerWidthClass = () => {
    const pref = profile?.themePreferences?.drawerWidth || "extra-largo"
    switch (pref) {
      case "padrão": return "sm:max-w-lg"
      case "largo": return "sm:max-w-2xl"
      case "extra-largo": return "sm:max-w-4xl"
      case "full": return "sm:max-w-full"
      default: return "sm:max-w-4xl"
    }
  }

  const ProcessActionsMenu = ({ proc }: { proc: any }) => (
    <DropdownMenuContent align="end" className="w-64 bg-[#0d121f] border-white/10 text-white rounded-xl p-2 shadow-2xl">
      <DropdownMenuLabel className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] px-3 py-2">GESTÃO DO CASO</DropdownMenuLabel>
      
      <DropdownMenuItem onClick={() => { handleOpenView(proc); }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5">
        <History className="h-4 w-4 text-muted-foreground" /> Ver Processo Completo
      </DropdownMenuItem>
      
      <DropdownMenuItem onClick={() => { 
        setActiveActionProcess(proc); 
        setMeetingData({
          title: `REUNIÃO ESTRATÉGICA: ${proc.clientName}`,
          date: "",
          time: "",
          type: "online",
          notes: `Alinhamento sobre o processo ${proc.processNumber || proc.id}.`
        });
        setIsMeetingOpen(true); 
      }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-emerald-400">
        <CalendarDays className="h-4 w-4" /> Agendar Reunião/Atend.
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => { 
        setActiveActionProcess(proc); 
        setDiligenceData({
          title: `DILIGÊNCIA: ${proc.clientName}`,
          description: `Realizar ato técnico no processo ${proc.processNumber || proc.id}.`,
          date: "",
          time: "",
          type: "Física",
          location: proc.courtAddress || `${proc.court || ""} - ${proc.vara || ""}`.trim(),
          assigneeId: user?.uid || "",
          requiresSubestabelecimento: false
        });
        setIsDiligenceOpen(true); 
      }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest h-11 rounded-lg hover:bg-white/5 text-blue-400 cursor-pointer">
        <ListTodo className="h-4 w-4" /> Agendar Diligência (Task)
      </DropdownMenuItem>
      
      <DropdownMenuItem onClick={() => { 
        setActiveActionProcess(proc); 
        setDeadlineData({
          title: "PRAZO PARA ",
          date: "",
          description: `Providência fatal referente ao processo ${proc.processNumber || proc.id}.`
        });
        setIsDeadlineOpen(true); 
      }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-rose-400">
        <AlarmClock className="h-4 w-4" /> Lançar Prazo Fatal
      </DropdownMenuItem>
      
      <DropdownMenuItem onClick={() => { 
        setActiveActionProcess(proc); 
        setHearingData({
          type: "UNA",
          date: "",
          time: "",
          location: proc.courtAddress || `${proc.court || ""} - ${proc.vara || ""}`.trim()
        });
        setIsHearingOpen(true); 
      }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-amber-400">
        <Gavel className="h-4 w-4" /> Agendar Audiência
      </DropdownMenuItem>
      
      <DropdownMenuItem onClick={() => { 
        setActiveActionProcess(proc); 
        const details = `DADOS DO PROCESSO:\nCNJ: ${proc.processNumber}\nCLIENTE (AUTOR): ${proc.clientName}\nPARTE CONTRÁRIA (RÉU): ${proc.defendantName || 'NÃO INFORMADO'}\nJUÍZO: ${proc.court} - ${proc.vara}\n\nRESUMO DO OBJETO:\n${proc.description}\n\nESTRATÉGIA DEFINIDA:\n${proc.strategyNotes || 'Sem notas táticas informadas.'}`;
        setAiDocInitialDetails(details);
        setIsAiDocOpen(true); 
      }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-emerald-400">
        <FilePlus className="h-4 w-4" /> Gerar Documento (IA)
      </DropdownMenuItem>
      
      <DropdownMenuSeparator className="bg-white/5 my-1" />
      
      <DropdownMenuItem onClick={() => {
        setActiveActionProcess(proc);
        setIsFinancialOpen(true);
      }} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-blue-400">
        <DollarSign className="h-4 w-4" /> Evento Financeiro
      </DropdownMenuItem>
      
      <DropdownMenuSeparator className="bg-white/5 my-1" />
      
      <DropdownMenuItem onClick={() => handleOpenEdit(proc)} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5">
        <Edit3 className="h-4 w-4 text-muted-foreground" /> Editar Processo
      </DropdownMenuItem>
      
      <DropdownMenuItem onClick={() => handleArchiveProcess(proc.id)} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-rose-500">
        <Archive className="h-4 w-4" /> Arquivar Processo
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
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
          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-[0.25em] opacity-60">
            CONTROLE JURÍDICO ESTRATÉGICO RGMJ.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-12 glass border-white/5 h-11 text-xs text-white focus:ring-primary/50 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleOpenCreate}
            className="gold-gradient text-background font-black gap-3 px-8 h-11 uppercase text-[10px] tracking-widest rounded-xl shadow-2xl hover:scale-[1.02] transition-all"
          >
            <Plus className="h-4 w-4" /> NOVO PROCESSO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/5 relative overflow-hidden h-24 flex flex-col justify-center shadow-xl rounded-xl group hover:border-primary/20 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary/50 transition-all" />
          <CardContent className="p-5">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5 flex items-center gap-3">
              <Zap className="h-3.5 w-3.5" /> PROCESSOS ATIVOS
            </p>
            <div className="text-xl font-black text-white tracking-tighter">
              {isLoading ? "..." : metrics.total}
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-white/5 relative overflow-hidden h-24 flex flex-col justify-center rounded-xl">
          <CardContent className="p-5">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5 flex items-center gap-3">
              <Scale className="h-3.5 w-3.5" /> VALOR SOB GESTÃO
            </p>
            <div className="text-xl font-black text-white tracking-tighter tabular-nums">
              R$ {metrics.valorEmRisco.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 relative overflow-hidden h-24 flex flex-col justify-center rounded-xl">
          <CardContent className="p-5">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">TICKET MÉDIO</p>
            <div className="text-xl font-black text-white tracking-tighter tabular-nums">
              R$ {metrics.ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-2">
        <Tabs value={activeArea} onValueChange={setActiveArea} className="w-full md:w-auto">
          <TabsList className="bg-transparent h-10 p-0 gap-8 justify-start">
            {AREAS.map(area => (
              <TabsTrigger 
                key={area.id} 
                value={area.id}
                className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-[0.25em] h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all"
              >
                {area.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
          <Button 
            onClick={() => setViewMode("list")}
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "list" ? "bg-primary text-background" : "text-muted-foreground")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => setViewMode("grid")}
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "grid" ? "bg-primary text-background" : "text-muted-foreground")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Base Jurídica...</span>
          </div>
        ) : filteredProcesses.length > 0 ? (
          <div className={cn(
            "grid gap-4 transition-all duration-500",
            viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {filteredProcesses.map((proc) => (
              <Card 
                key={proc.id} 
                className={cn(
                  "glass border-white/5 hover-gold transition-all group overflow-hidden cursor-pointer",
                  viewMode === "list" ? "rounded-xl" : "rounded-3xl"
                )}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  handleOpenView(proc);
                }}
              >
                <CardContent className={cn("p-6", viewMode === "list" ? "" : "flex-col space-y-6")}>
                  {viewMode === "list" ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1 min-w-0">
                          <div className="flex items-center gap-4">
                            <h3 className="text-[#F5D030] font-black text-base uppercase tracking-tight truncate leading-tight">PROCESSO: {proc.description}</h3>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] h-5 px-2 rounded-full font-black shrink-0">ATIVO</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">VS</span>
                            <span className="text-sm font-bold text-white uppercase truncate">{proc.defendantName || "NÃO MAPEADO"}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-12 shrink-0 ml-8">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">CLIENTE / OUTORGANTE</span>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-primary">
                                <User className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-bold text-white uppercase">{proc.clientName}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center border border-amber-500/30 bg-amber-500/5 px-2 py-1 rounded-lg">
                              <Calendar className="h-3 w-3 text-amber-500 mb-0.5" />
                              <span className="text-[8px] font-black text-amber-500">PAUTA</span>
                            </div>
                            <div className="flex flex-col items-center justify-center border border-rose-500/30 bg-rose-500/5 px-2 py-1 rounded-lg">
                              <Clock className="h-3 w-3 text-rose-500 mb-0.5" />
                              <span className="text-[8px] font-black text-rose-500 uppercase">PRAZOS</span>
                            </div>
                            <div className="flex items-center gap-2 pl-4 border-l border-white/5">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <button className="h-9 w-9 rounded-xl flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all outline-none border border-white/5">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <ProcessActionsMenu proc={proc} />
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Protocolo CNJ</p>
                          <div className="bg-black/20 border border-white/10 px-2 py-1 rounded font-mono text-[10px] font-bold text-white tracking-tight w-fit">
                            {proc.processNumber}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Área / Matéria</p>
                          <div className="flex items-center gap-1.5 text-amber-500">
                            <Scale className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{proc.caseType?.toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Juízo / Unidade</p>
                          <div className="flex items-center gap-1.5 text-white/80">
                            <Gavel className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[10px] font-bold uppercase truncate">{proc.court || "---"} • {proc.vara || "---"}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Valor da Causa</p>
                          <div className="flex items-center gap-1.5 text-emerald-500 font-black tabular-nums text-[11px]">
                            <TrendingUp className="h-3.5 w-3.5" /> R$ {Number(proc.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Responsável</p>
                          <div className="flex items-center gap-1.5 text-emerald-500">
                            <UserIcon className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest truncate">DR(A). {proc.responsibleStaffName || "EQUIPE RGMJ"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={cn(
                              "h-8 text-[9px] font-black uppercase tracking-widest px-3 rounded-lg transition-all",
                              proc.driveStatus === 'synced' 
                                ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10" 
                                : "border-amber-500/30 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10"
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (proc.driveStatus === 'synced') {
                                window.open(proc.driveUrl || "#", "_blank")
                              } else {
                                handleSyncDrive(proc)
                              }
                            }}
                            disabled={syncingDriveId === proc.id}
                          >
                            {syncingDriveId === proc.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            ) : (
                              <FolderOpen className={cn("h-3.5 w-3.5 mr-2", proc.driveStatus === 'synced' ? "text-emerald-500" : "text-amber-500")} />
                            )}
                            {proc.driveStatus === 'synced' ? "ACESSAR PASTA DRIVE" : "SINCRONIZAR DRIVE"}
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 border-blue-500/30 text-blue-400 bg-blue-500/5 text-[9px] font-black uppercase tracking-widest px-3 rounded-lg hover:bg-blue-500/10 transition-all">
                            <ExternalLink className="h-3.5 w-3.5 mr-2" /> PORTAL JUDICIÁRIO
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground/40">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-widest">PROTOCOLO: {proc.startDate || "---"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-6">
                      <div className="space-y-3 min-w-0 flex-1">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-[9px] font-black border-primary/30 text-primary bg-primary/5 uppercase tracking-[0.15em] px-3 h-6">
                            {proc.caseType?.toUpperCase() || "GERAL"}
                          </Badge>
                          <span className="text-[11px] font-mono font-bold text-muted-foreground tracking-widest truncate">{proc.processNumber}</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight truncate">
                            {proc.description}
                          </h3>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1.5 opacity-50 flex items-center gap-2">
                            <Gavel className="h-3 w-3" /> {proc.court} • {proc.vara}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black uppercase">ATIVO</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white rounded-lg bg-white/5 outline-none">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <ProcessActionsMenu proc={proc} />
                          </DropdownMenu>
                          <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all border border-white/5">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center space-y-8 glass rounded-3xl border-dashed border-2 border-white/5 opacity-20">
            <Scale className="h-20 w-20 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-base font-black text-white uppercase tracking-[0.4em]">Pauta Vazia</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Nenhum processo estratégico nesta categoria.</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[85vh] font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none flex flex-row items-center justify-between shadow-xl space-y-0">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-2xl">
                <Scale className="h-7 w-7" />
              </div>
              <DialogHeader className="space-y-0 text-left">
                <DialogTitle className="text-xl font-black text-white uppercase tracking-tighter leading-none">{viewingProcess?.description}</DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2 flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary uppercase">{viewingProcess?.caseType}</Badge>
                  <span className="text-[11px] font-mono font-bold text-muted-foreground tracking-widest">{viewingProcess?.processNumber}</span>
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="flex gap-3 pr-8">
              <Button onClick={() => handleOpenEdit(viewingProcess)} variant="outline" className="glass border-white/10 text-white font-black text-[10px] uppercase h-11 px-6 rounded-xl gap-2 hover:bg-primary hover:text-background transition-all">
                <Edit3 className="h-4 w-4" /> EDITAR PROCESSO
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="resumo" className="h-full flex flex-col">
              <div className="px-8 bg-[#0a0f1e]/50 border-b border-white/5 flex-none">
                <TabsList className="bg-transparent h-12 gap-8 p-0">
                  <TabsTrigger value="resumo" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary tracking-widest">DADOS GERAIS</TabsTrigger>
                  <TabsTrigger value="timeline" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary tracking-widest">TIMELINE & FASES</TabsTrigger>
                  <TabsTrigger value="estrategia" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary tracking-widest">ESTRATÉGIA</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-10 space-y-10">
                    <TabsContent value="resumo" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="glass bg-white/[0.01] border-white/5 p-6 rounded-2xl space-y-6">
                          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                            <User className="h-4 w-4 text-primary" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Polo Ativo (Cliente)</h4>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Nome Civil / Razão</p>
                              <p className="text-sm font-bold text-white uppercase">{viewingProcess?.clientName}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">ID do Cliente</p>
                              <p className="text-xs font-mono text-white/60">{viewingProcess?.clientId}</p>
                            </div>
                          </div>
                        </Card>

                        <Card className="glass bg-white/[0.01] border-white/5 p-6 rounded-2xl space-y-6">
                          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                            <Building2 className="h-4 w-4 text-primary" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Polo Passivo (Réu)</h4>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Empresa / Reclamada</p>
                              <p className="text-sm font-bold text-white uppercase">{viewingProcess?.defendantName || "NÃO INFORMADO"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">CNPJ / Documento</p>
                              <p className="text-sm font-mono text-white/60">{viewingProcess?.defendantDocument || "NÃO MAPEADO"}</p>
                            </div>
                          </div>
                        </Card>

                        <Card className="glass bg-white/[0.01] border-white/5 p-6 rounded-2xl space-y-6 md:col-span-2">
                          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                            <Gavel className="h-4 w-4 text-primary" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Informações de Juízo</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Tribunal / Instância</p>
                              <p className="text-sm font-bold text-white uppercase">{viewingProcess?.court || "NÃO MAPEADO"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Vara / Unidade</p>
                              <p className="text-sm font-bold text-white uppercase">{viewingProcess?.vara || "NÃO MAPEADA"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Data do Protocolo</p>
                              <p className="text-sm font-bold text-emerald-500 uppercase">{viewingProcess?.startDate || "PENDENTE"}</p>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-white/5">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Endereço do Juízo</p>
                            <p className="text-sm font-bold text-white uppercase">{viewingProcess?.courtAddress || "NÃO MAPEADO"}</p>
                          </div>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="timeline" className="mt-0 animate-in fade-in duration-500">
                      <div className="relative pl-10 space-y-12">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/5" />
                        {[
                          { date: "PROTOCOLADO", type: "Fase Inicial", title: "Processo Protocolado na Base", desc: "Ação distribuída e injetada no ecossistema RGMJ.", icon: ShieldCheck, color: "bg-emerald-500" },
                          { date: "EM ANDAMENTO", type: "Fluxo", title: "Aguardando Citação", desc: "Processo em fase de comunicação oficial à parte contrária.", icon: Clock, color: "bg-amber-500" },
                        ].map((ev, i) => (
                          <div key={i} className="relative">
                            <div className={cn("absolute -left-[31px] top-0 w-5 h-5 rounded-full z-10 flex items-center justify-center shadow-lg", ev.color)}>
                              <ev.icon className="h-3 w-3 text-background font-black" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{ev.date}</span>
                                <Badge variant="secondary" className="bg-white/5 text-[8px] font-black uppercase text-muted-foreground px-2">{ev.type}</Badge>
                              </div>
                              <h4 className="text-base font-bold text-white uppercase tracking-tight">{ev.title}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed italic">{ev.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="estrategia" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <Card className="glass border-primary/20 bg-primary/5 p-8 rounded-3xl space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                          <Target className="h-6 w-6 text-primary" />
                          <h3 className="text-lg font-bold text-white uppercase tracking-widest">Plano de Batalha Jurídica</h3>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <Label className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 block">Objeto e Teses</Label>
                            <p className="text-sm text-white/80 leading-relaxed text-justify font-medium uppercase italic">
                              {viewingProcess?.description || "Sem objeto definido."}
                            </p>
                          </div>
                          <div className="border-t border-white/10 pt-6">
                            <Label className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 block">Notas Estratégicas Internas</Label>
                            <p className="text-sm text-white/60 leading-relaxed text-justify">
                              {viewingProcess?.strategyNotes || "Nenhuma nota tática registrada para este processo."}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>
            </Tabs>
          </div>

          <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Responsável Técnico</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 border border-primary/20"><AvatarFallback className="text-[8px] bg-secondary text-primary font-black">RG</AvatarFallback></Avatar>
                  <span className="text-xs font-bold text-white uppercase">DR. {viewingProcess?.responsibleStaffName || "EQUIPE RGMJ"}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setIsViewOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12">FECHAR</Button>
              <Button className="gold-gradient text-background font-black h-12 px-10 rounded-xl shadow-2xl uppercase text-[11px] tracking-widest flex items-center gap-3">
                <Brain className="h-4 w-4" /> ANÁLISE IA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className={cn("flex flex-col h-full glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl", getDrawerWidthClass())}>
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none shadow-xl">
            <SheetHeader>
              <div className="flex items-center gap-5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <SheetTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                    {editingProcess ? "GESTÃO ESTRATÉGICA" : "Novo Processo"}
                  </SheetTitle>
                  <SheetDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] mt-1.5 opacity-60">
                    {editingProcess ? "Retificação de dados técnicos RGMJ." : "Protocolo estruturado no ecossistema."}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>
          <ProcessForm 
            initialData={editingProcess}
            onSubmit={handleSaveProcess}
            onCancel={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* MODAIS DE OPERAÇÃO COM SCROLL FIXED */}
      <Dialog open={isMeetingOpen} onOpenChange={setIsMeetingOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-6 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader className="flex flex-row items-center gap-4 space-y-0">
              <CalendarDays className="h-6 w-6 text-emerald-500" />
              <div>
                <DialogTitle className="text-white font-bold uppercase tracking-widest">Agendar Reunião</DialogTitle>
                <DialogDescription className="text-[9px] uppercase font-black text-muted-foreground">Configure os detalhes da reunião estratégica.</DialogDescription>
              </div>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase">Título da Pauta</Label>
                <Input className="glass h-12 text-white uppercase font-bold" value={meetingData.title} onChange={e => setMeetingData({...meetingData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Data</Label>
                  <Input type="date" className="glass h-12 text-white" value={meetingData.date} onChange={e => setMeetingData({...meetingData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Hora</Label>
                  <Input type="time" className="glass h-12 text-white" value={meetingData.time} onChange={e => setMeetingData({...meetingData, time: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase">Modalidade</Label>
                <Select value={meetingData.type} onValueChange={v => setMeetingData({...meetingData, type: v})}>
                  <SelectTrigger className="glass h-12 text-white uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    <SelectItem value="online">🖥️ ONLINE / VIRTUAL</SelectItem>
                    <SelectItem value="presencial">🏢 PRESENCIAL (SEDE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase">Notas Táticas</Label>
                <Textarea className="glass min-h-[100px] text-white" value={meetingData.notes} onChange={e => setMeetingData({...meetingData, notes: e.target.value})} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsMeetingOpen(false)} className="text-muted-foreground uppercase font-black text-[10px]">Cancelar</Button>
            <Button onClick={handleScheduleMeeting} className="gold-gradient text-background font-black uppercase text-[10px] px-8 h-12 rounded-xl">Confirmar Agenda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeadlineOpen} onOpenChange={setIsDeadlineOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-6 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader className="flex flex-row items-center gap-4 space-y-0">
              <AlarmClock className="h-6 w-6 text-rose-500" />
              <div>
                <DialogTitle className="text-white font-bold uppercase tracking-widest">Lançar Prazo Fatal</DialogTitle>
                <DialogDescription className="text-[9px] uppercase font-black text-muted-foreground">Registro de prazo judicial preclusivo.</DialogDescription>
              </div>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase">Título do Ato</Label>
                <Input placeholder="EX: PRAZO PARA RÉPLICA" className="glass h-12 text-white uppercase font-bold" value={deadlineData.title} onChange={e => setDeadlineData({...deadlineData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase">Vencimento (Termo Final)</Label>
                <Input type="date" className="glass h-12 text-white" value={deadlineData.date} onChange={e => setDeadlineData({...deadlineData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase">Descrição da Providência</Label>
                <Textarea className="glass min-h-[100px] text-white" value={deadlineData.description} onChange={e => setDeadlineData({...deadlineData, description: e.target.value})} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsDeadlineOpen(false)} className="text-muted-foreground uppercase font-black text-[10px]">Cancelar</Button>
            <Button onClick={handleLaunchDeadline} className="bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[10px] px-8 h-12 rounded-xl">Registrar Prazo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHearingOpen} onOpenChange={setIsHearingOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-6 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader className="flex flex-row items-center gap-4 space-y-0">
              <Gavel className="h-6 w-6 text-amber-500" />
              <div>
                <DialogTitle className="text-white font-bold uppercase tracking-widest">Agendar Audiência</DialogTitle>
                <DialogDescription className="text-[9px] uppercase font-black text-muted-foreground">Cadastro de pauta judiciária para o caso.</DialogDescription>
              </div>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Tipo</Label>
                  <Select value={hearingData.type} onValueChange={v => setHearingData({...hearingData, type: v})}>
                    <SelectTrigger className="glass h-12 text-white font-bold text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      <SelectItem value="UNA">UNA</SelectItem>
                      <SelectItem value="Instrução">INSTRUÇÃO</SelectItem>
                      <SelectItem value="Conciliação">CONCILIAÇÃO</SelectItem>
                      <SelectItem value="Virtual">VIRTUAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Data</Label>
                  <Input type="date" className="glass h-12 text-white" value={hearingData.date} onChange={e => setHearingData({...hearingData, date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Horário</Label>
                  <Input type="time" className="glass h-12 text-white" value={hearingData.time} onChange={e => setHearingData({...hearingData, time: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Local / Juízo</Label>
                  <Input className="glass h-12 text-white uppercase font-bold" value={hearingData.location} onChange={e => setHearingData({...hearingData, location: e.target.value})} />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsHearingOpen(false)} className="text-muted-foreground uppercase font-black text-[10px]">Cancelar</Button>
            <Button onClick={handleScheduleHearing} className="gold-gradient text-background font-black uppercase text-[10px] px-8 h-12 rounded-xl shadow-xl">Confirmar Pauta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDiligenceOpen} onOpenChange={setIsDiligenceOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl rounded-2xl font-sans">
          <div className="p-6 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-4">
                <ListTodo className="h-6 w-6 text-blue-400" />
                <div>
                  <DialogTitle className="text-white font-bold uppercase tracking-widest">Agendar Diligência (Task)</DialogTitle>
                  <DialogDescription className="text-[9px] uppercase font-black text-muted-foreground mt-1">Atribuição de tarefa operacional ou externa.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Título da Diligência</Label>
                  <Input placeholder="EX: RETIRADA DE ALVARÁ" className="glass h-12 text-white uppercase font-bold" value={diligenceData.title} onChange={e => setDiligenceData({...diligenceData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Modalidade</Label>
                  <Select value={diligenceData.type} onValueChange={v => setDiligenceData({...diligenceData, type: v})}>
                    <SelectTrigger className="glass h-12 text-white uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      <SelectItem value="Física">🏢 FÍSICA / PRESENCIAL</SelectItem>
                      <SelectItem value="Virtual">🖥️ VIRTUAL / DIGITAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Data Limite</Label>
                  <Input type="date" className="glass h-12 text-white" value={diligenceData.date} onChange={e => setDiligenceData({...diligenceData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Horário</Label>
                  <Input type="time" className="glass h-12 text-white" value={diligenceData.time} onChange={e => setDiligenceData({...diligenceData, time: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase">Responsável / Executor</Label>
                <Select value={diligenceData.assigneeId} onValueChange={(v) => setDiligenceData({...diligenceData, assigneeId: v})}>
                  <SelectTrigger className="glass h-12 text-white font-bold text-[10px]"><SelectValue placeholder="Selecione o advogado ou assistente" /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    <SelectItem value={user?.uid || "self"}>DR(A). {user?.displayName?.toUpperCase() || "EU MESMO"}</SelectItem>
                    {staffMembers?.filter(s => s.id !== user?.uid).map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>{staff.name.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <div className="space-y-0.5">
                  <Label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Requer Subestabelecimento</Label>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Ativar se o executor não for o patrono original.</p>
                </div>
                <Switch checked={diligenceData.requiresSubestabelecimento} onCheckedChange={v => setDiligenceData({...diligenceData, requiresSubestabelecimento: v})} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase">Localização / Juízo</Label>
                <Input className="glass h-12 text-white uppercase font-bold" value={diligenceData.location} onChange={e => setDiligenceData({...diligenceData, location: e.target.value})} placeholder="FÓRUM, REPARTIÇÃO OU LINK" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase">Instruções Técnicas</Label>
                <Textarea className="glass min-h-[80px] text-white" value={diligenceData.description} onChange={e => setDiligenceData({...diligenceData, description: e.target.value})} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsDiligenceOpen(false)} className="text-muted-foreground uppercase font-black text-[10px]">Cancelar</Button>
            <Button onClick={handleScheduleDiligence} className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] px-8 h-12 rounded-xl shadow-xl">Confirmar Delegação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAiDocOpen} onOpenChange={setIsAiDocOpen}>
        <DialogContent className="glass border-primary/20 sm:max-w-[1100px] bg-[#0a0f1e] p-0 overflow-hidden shadow-2xl rounded-3xl">
          <DialogHeader className="p-6 bg-[#0a0f1e] border-b border-white/5 flex flex-row items-center gap-4 space-y-0">
            <Brain className="h-7 w-7 text-primary" />
            <div>
              <DialogTitle className="text-white font-bold uppercase tracking-widest text-xl">Minuta Estratégica IA</DialogTitle>
              <DialogDescription className="text-[9px] text-muted-foreground uppercase font-black">Geração de peça jurídica fundamentada via Inteligência RGMJ.</DialogDescription>
            </div>
          </DialogHeader>
          <div className="p-10 max-h-[80vh] overflow-y-auto">
            <DraftingTool initialCaseDetails={aiDocInitialDetails} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFinancialOpen} onOpenChange={setIsFinancialOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[700px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans">
          <DialogHeader className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Evento Financeiro</DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Lançamento de honorários ou custas para o processo.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="px-10 py-8 bg-[#0a0f1e]/50">
              <FinancialTitleForm 
                initialData={{ description: `HONORÁRIOS: ${activeActionProcess?.clientName}`, processNumber: activeActionProcess?.processNumber }}
                onSubmit={handleSaveFinancial} 
                onCancel={() => setIsFinancialOpen(false)} 
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
