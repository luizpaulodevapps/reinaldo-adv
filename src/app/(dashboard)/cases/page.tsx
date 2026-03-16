
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
  Tag,
  History,
  ListChecks,
  RotateCcw,
  CloudLightning,
  Archive
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc, setDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, limit } from "firebase/firestore"
import { cn, maskCurrency, parseCurrencyToNumber, maskCEP } from "@/lib/utils"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { getValidGoogleAccessToken } from "@/services/google-token"
import { syncActToGoogleCalendar, updateActInGoogleCalendar } from "@/services/google-calendar-sync"
import { setupClientWorkspace } from "@/services/google-drive"
import { normalizeGoogleWorkspaceSettings } from "@/services/google-workspace"

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
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null)
  const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null)
  
  const [isSyncingAct, setIsSyncingAct] = useState(false)
  const [syncingDriveId, setSyncingDriveId] = useState<string | null>(null)
  const [loadingMeetingCep, setLoadingMeetingCep] = useState(false)

  const [meetingData, setMeetingData] = useState({ 
    title: "", 
    date: format(new Date(), 'yyyy-MM-dd'), 
    time: "09:00", 
    type: "online" as "online" | "presencial", 
    location: "Google Meet",
    locationType: "sede",
    notes: "",
    autoMeet: true,
    zipCode: "",
    address: "",
    number: "",
    neighborhood: "",
    city: "",
    state: ""
  })

  const db = useFirestore()
  const auth = useAuth()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const processesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "processes"), orderBy("createdAt", "desc"), limit(listLimit))
  }, [db, user, listLimit])

  const { data: processesData, isLoading } = useCollection(processesQuery)
  const processes = processesData || []

  const googleSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleSettingsData } = useDoc(googleSettingsRef)
  const googleConfig = useMemo(() => normalizeGoogleWorkspaceSettings(googleSettingsData), [googleSettingsData])

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

  const handleSyncDrive = async (proc: any) => {
    if (!db || !proc) return
    if (!googleConfig.isDriveActive) {
      toast({ variant: "destructive", title: "Drive Desativado" })
      return
    }
    const accessToken = await getValidGoogleAccessToken(auth);
    if (!accessToken) return
    setSyncingDriveId(proc.id)
    try {
      const workspace = await setupClientWorkspace({
        accessToken,
        rootFolderId: googleConfig.rootFolderId,
        clientName: proc.clientName,
        processInfo: { number: proc.processNumber, description: proc.description || "DEMANDA" }
      });
      updateDocumentNonBlocking(doc(db, "processes", proc.id), {
        driveFolderId: workspace.processFolderId || workspace.clientFolderId,
        driveFolderUrl: workspace.processFolderUrl || workspace.clientFolderUrl,
        updatedAt: serverTimestamp()
      })
      toast({ title: "Dossiê Sincronizado" })
    } catch (e) {
      toast({ variant: "destructive", title: "Erro Sincronismo" })
    } finally {
      setSyncingDriveId(null)
    }
  }

  const handleOpenAtendimento = (proc: any, existing?: any) => {
    setActiveActionProcess(proc)
    setMeetingStep(1)
    if (existing) {
      setEditingMeetingId(existing.id)
      setEditingCalendarId(existing.calendarEventId)
      setMeetingData({
        title: existing.title || "REUNIÃO TÁTICA",
        date: existing.startDateTime?.split('T')[0] || format(new Date(), 'yyyy-MM-dd'),
        time: existing.startDateTime?.split('T')[1]?.substring(0, 5) || "09:00",
        type: existing.meetingType || "online",
        location: existing.location || "Google Meet",
        locationType: existing.locationType || "sede",
        notes: existing.notes || "",
        autoMeet: existing.autoMeet ?? true,
        zipCode: existing.zipCode || "",
        address: existing.address || "",
        number: existing.number || "",
        neighborhood: existing.neighborhood || "",
        city: existing.city || "",
        state: existing.state || ""
      })
    } else {
      setEditingMeetingId(null)
      setEditingCalendarId(null)
      setMeetingData({ 
        title: "REUNIÃO TÁTICA", 
        date: format(new Date(), 'yyyy-MM-dd'), 
        time: "09:00", 
        type: "online", 
        location: "Google Meet",
        locationType: "sede",
        notes: "",
        autoMeet: true,
        zipCode: "",
        address: "",
        number: "",
        neighborhood: "",
        city: "",
        state: ""
      })
    }
    setIsMeetingOpen(true)
  }

  const handleScheduleMeeting = async () => {
    if (!db || !activeActionProcess || !meetingData.date) {
      toast({ variant: "destructive", title: "Dados Incompletos" })
      return
    }
    setIsSyncingAct(true)
    
    let finalLocation = ""
    if (meetingData.type === 'online') {
      finalLocation = meetingData.location || "GOOGLE MEET RGMJ"
    } else {
      if (meetingData.locationType === 'sede') {
        finalLocation = 'Sede RGMJ'
      } else {
        finalLocation = `${meetingData.address || ""}, ${meetingData.number || ""} - ${meetingData.neighborhood || ""}, ${meetingData.city || ""}/${meetingData.state || ""}`
      }
    }
    
    const dateTimeStr = `${meetingData.date}T${meetingData.time || "09:00"}:00`;
    const appRef = editingMeetingId ? doc(db, "appointments", editingMeetingId) : doc(collection(db, "appointments"));
    const finalDocId = appRef.id;

    const payload: any = {
      id: finalDocId,
      title: meetingData.title.toUpperCase(),
      type: "Atendimento",
      startDateTime: dateTimeStr,
      clientName: activeActionProcess.clientName,
      processId: activeActionProcess.id,
      processNumber: activeActionProcess.processNumber,
      meetingType: meetingData.type,
      locationType: meetingData.locationType,
      location: finalLocation,
      zipCode: meetingData.zipCode,
      address: meetingData.address,
      number: meetingData.number,
      neighborhood: meetingData.neighborhood,
      city: meetingData.city,
      state: meetingData.state,
      notes: meetingData.notes,
      autoMeet: meetingData.autoMeet,
      status: "Agendado",
      updatedAt: serverTimestamp()
    }

    if (!editingMeetingId) payload.createdAt = serverTimestamp()

    setDocumentNonBlocking(appRef, payload, { merge: true });

    const preparedGoogleToken = googleConfig.isCalendarActive ? await getValidGoogleAccessToken(auth) : null;
    const actForGoogle = {
      title: payload.title,
      description: payload.notes,
      location: payload.location,
      startDateTime: dateTimeStr,
      type: 'atendimento' as const,
      processNumber: activeActionProcess.processNumber,
      clientName: payload.clientName,
      useMeet: meetingData.type === 'online' && meetingData.autoMeet
    }

    const calendarSync = editingCalendarId 
      ? await updateActInGoogleCalendar({ auth, calendarEventId: editingCalendarId, accessToken: preparedGoogleToken, googleSettings: googleConfig, act: actForGoogle })
      : await syncActToGoogleCalendar({ auth, accessToken: preparedGoogleToken, googleSettings: googleConfig, act: actForGoogle })

    if (calendarSync.status === 'synced') {
      updateDocumentNonBlocking(appRef, {
        meetingUrl: calendarSync.meetingUrl || "",
        calendarEventId: calendarSync.calendarEventId,
        calendarSyncStatus: 'synced',
        updatedAt: serverTimestamp()
      })
    }

    setIsSyncingAct(false)
    setIsMeetingOpen(false)
    toast({ title: editingMeetingId ? "Registro Retificado" : "Atendimento Protocolado" })
  }

  const handleMeetingCepBlur = async () => {
    const cep = meetingData.zipCode?.replace(/\D/g, "")
    if (!cep || cep.length !== 8) return
    setLoadingMeetingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setMeetingData(prev => ({
          ...prev,
          address: data.logradouro.toUpperCase(),
          neighborhood: data.bairro.toUpperCase(),
          city: data.localidade.toUpperCase(),
          state: data.uf.toUpperCase()
        }))
      }
    } catch (e) { console.error("CEP error") } finally { setLoadingMeetingCep(false) }
  }

  const labelMini = "text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block"

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans pb-20 max-w-[1800px] w-[95%] mx-auto">
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
          <Button onClick={() => { setEditingProcess(null); setIsSheetOpen(true); }} className="gold-gradient text-background font-black gap-3 px-8 h-12 uppercase text-[10px] tracking-widest rounded-xl shadow-[0_15px_40px_rgba(245,208,48,0.2)]">
            <Plus className="h-4 w-4" /> NOVO PROCESSO
          </Button>
        </div>
      </div>

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

      <div className="space-y-6">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-widest">Auditando Acervo...</span></div>
        ) : filteredProcesses.map((proc) => (
          <Card key={proc.id} className="bg-[#0d1117] border-white/5 hover:border-primary/30 transition-all group overflow-hidden rounded-2xl shadow-2xl relative">
            <CardContent className="p-10 space-y-10">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all group/menu shadow-2xl">
                        <MoreVertical className="h-6 w-6 text-muted-foreground group-hover/menu:text-primary transition-colors" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[320px] bg-[#0d121f] border-white/10 text-white p-2 rounded-2xl shadow-2xl font-sans">
                      <div className="px-4 py-2 text-[9px] font-black text-primary uppercase tracking-[0.2em] opacity-50 border-b border-white/5 mb-2">Gestão do Caso</div>
                      <DropdownMenuItem onClick={() => handleOpenAtendimento(proc)} className="flex items-center gap-4 py-4 px-5 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500/10 text-emerald-400 cursor-pointer">
                        <Calendar className="h-5 w-5" /> AGENDAR ATENDIMENTO
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-4 py-4 px-5 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500/10 text-blue-400 cursor-pointer">
                        <Navigation className="h-5 w-5" /> GESTÃO DE DILIGÊNCIAS
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-4 py-4 px-5 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500/10 text-rose-400 cursor-pointer">
                        <AlarmClock className="h-5 w-5" /> LANÇAR PRAZO FATAL
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-4 py-4 px-5 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500/10 text-amber-400 cursor-pointer">
                        <Gavel className="h-5 w-5" /> PAUTA DE AUDIÊNCIA
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-4 py-4 px-5 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500/10 text-emerald-400 cursor-pointer">
                        <DollarSign className="h-5 w-5" /> FLUXO FINANCEIRO
                      </DropdownMenuItem>
                      <div className="h-px bg-white/5 my-2" />
                      <DropdownMenuItem onClick={() => { setEditingProcess(proc); setIsSheetOpen(true); }} className="flex items-center gap-4 py-4 px-5 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 text-white/60 cursor-pointer">
                        <Edit3 className="h-5 w-5" /> EDITAR PROCESSO
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-4 py-4 px-5 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500/10 text-rose-500 cursor-pointer">
                        <Archive className="h-5 w-5" /> ARQUIVAR DOSSIÊ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

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
                    <span className="text-[10px] font-black text-white/60 uppercase truncate">{proc.vara || "---"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>VALOR DA CAUSA</Label>
                  <div className="h-12 bg-black/40 border border-white/5 rounded-xl flex items-center px-4 gap-3">
                    <TrendingUp className="h-4 w-4 text-emerald-500/40" />
                    <span className="text-xs font-black text-emerald-400">R$ {maskCurrency(proc.value || 0)}</span>
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

              <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 gap-6">
                <div className="flex gap-4">
                  <Button 
                    onClick={() => handleSyncDrive(proc)}
                    disabled={syncingDriveId === proc.id}
                    variant="outline" 
                    className="h-11 border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest px-8 rounded-xl gap-3 hover:bg-primary hover:text-background transition-all"
                  >
                    {syncingDriveId === proc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSync className="h-4 w-4" />}
                    SINCRONIZAR DRIVE
                  </Button>
                  <Button variant="outline" className="h-11 border-white/10 text-white/40 font-black uppercase text-[10px] tracking-widest px-8 rounded-xl gap-3 hover:bg-white/5 transition-all">
                    <ExternalLink className="h-4 w-4" /> PORTAL JUDICIÁRIO
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isMeetingOpen} onOpenChange={setIsMeetingOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[650px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col h-[80vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none shadow-xl">
            <div className="flex items-center gap-6">
              <div className={cn("w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500", isSyncingAct && "animate-pulse")}>
                {isSyncingAct ? <Loader2 className="h-6 w-6 animate-spin" /> : <Calendar className="h-6 w-6" />}
              </div>
              <div>
                <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                  {editingMeetingId ? "Retificar Atendimento" : "Agendar Atendimento"}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">Passo {meetingStep} de 5</Badge>
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
                    <div className={cn("p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4", meetingData.type === 'online' ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-black/20 border-white/5 hover:border-white/20")} onClick={() => setMeetingData({...meetingData, type: 'online', location: 'Google Meet'})}>
                      <Video className={cn("h-8 w-8", meetingData.type === 'online' ? "text-emerald-500" : "text-muted-foreground")} />
                      <span className="text-sm font-black text-white uppercase tracking-widest">Virtual</span>
                    </div>
                    <div className={cn("p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4", meetingData.type === 'presencial' ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(245,208,48,0.2)]" : "bg-black/20 border-white/5 hover:border-white/20")} onClick={() => setMeetingData({...meetingData, type: 'presencial', location: 'Sede RGMJ'})}>
                      <MapPin className={cn("h-8 w-8", meetingData.type === 'presencial' ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm font-black text-white uppercase tracking-widest">Presencial</span>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {meetingStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">2. Cronograma</Label>
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
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">4. Logística</Label>
                  {meetingData.type === 'online' ? (
                    <Card className="p-10 rounded-[2.5rem] bg-emerald-500/5 border-2 border-emerald-500/20 text-center space-y-6 shadow-2xl">
                      <Video className="h-12 w-12 text-emerald-500 mx-auto" />
                      <h4 className="text-xl font-black text-white uppercase tracking-widest">Google Meet Hub</h4>
                      <div className="flex items-center justify-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                        <Switch checked={meetingData.autoMeet} onCheckedChange={v => setMeetingData({...meetingData, autoMeet: v})} className="data-[state=checked]:bg-emerald-500" />
                        <Label className="text-[10px] font-black text-white uppercase">Gerar Link via Workspace?</Label>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <RadioGroup value={meetingData.locationType} onValueChange={v => setMeetingData({...meetingData, locationType: v})} className="grid grid-cols-2 gap-4">
                        <div className={cn("p-6 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all shadow-lg", meetingData.locationType === 'sede' ? "bg-primary/10 border-primary" : "bg-black/20 border-white/5 hover:border-white/20")} onClick={() => setMeetingData({...meetingData, locationType: 'sede', location: 'Sede RGMJ'})}>
                          <Building2 className="h-4 w-4 text-primary" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Sede RGMJ</span>
                        </div>
                        <div className={cn("p-6 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all shadow-lg", meetingData.locationType === 'externo' ? "bg-primary/10 border-primary" : "bg-black/20 border-white/5 hover:border-white/20")} onClick={() => setMeetingData({...meetingData, locationType: 'externo'})}>
                          <MapPin className="h-4 w-4 text-primary" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Externo</span>
                        </div>
                      </RadioGroup>
                      {meetingData.locationType === 'externo' && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className={labelMini}>CEP</Label>
                              <div className="relative">
                                <Input 
                                  value={meetingData.zipCode} 
                                  onChange={e => setMeetingData({...meetingData, zipCode: maskCEP(e.target.value)})} 
                                  onBlur={handleMeetingCepBlur}
                                  className="bg-black/40 border-white/10 h-12 text-white font-mono rounded-xl" 
                                  placeholder="00000-000"
                                />
                                {loadingMeetingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                              </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label className={labelMini}>Logradouro</Label>
                              <Input value={meetingData.address} onChange={e => setMeetingData({...meetingData, address: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className={labelMini}>Nº</Label>
                              <Input value={meetingData.number} onChange={e => setMeetingData({...meetingData, number: e.target.value})} className="bg-black/40 h-12 text-white rounded-xl" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label className={labelMini}>Bairro</Label><Input value={meetingData.neighborhood} onChange={e => setMeetingData({...meetingData, neighborhood: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white rounded-xl" /></div>
                            <div className="space-y-2"><Label className={labelMini}>Cidade</Label><Input value={meetingData.city} onChange={e => setMeetingData({...meetingData, city: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white rounded-xl" /></div>
                            <div className="space-y-2"><Label className={labelMini}>UF</Label><Input value={meetingData.state} onChange={e => setMeetingData({...meetingData, state: e.target.value.toUpperCase()})} maxLength={2} className="bg-black/40 h-12 text-white rounded-xl" /></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {meetingStep === 5 && (
                <div className="space-y-8 animate-in zoom-in-95 duration-300 text-center">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">5. Consolidação</Label>
                  <Card className="glass border-primary/30 bg-primary/5 p-10 rounded-[2.5rem] shadow-2xl space-y-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-500 shadow-xl"><ShieldCheck className="h-8 w-8" /></div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{activeActionProcess?.clientName}</h4>
                      <p className="text-sm font-bold text-primary uppercase tracking-widest">{meetingData.date} às {meetingData.time}</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-relaxed">
                        {meetingData.type === 'online' ? "Sincronismo Workspace Ativo. O Meet link será gerado." : "Atendimento Presencial Programado."}
                      </p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none shadow-[0_-20px_50px_rgba(0,0,0,0.6)]">
            <Button variant="ghost" onClick={() => meetingStep > 1 ? setMeetingStep(meetingStep - 1) : setIsMeetingOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 hover:text-white">
              {meetingStep > 1 ? "ANTERIOR" : "CANCELAR"}
            </Button>
            {meetingStep < 5 ? (
              <Button onClick={() => setMeetingStep(meetingStep + 1)} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-xl transition-all hover:scale-[1.02] gap-3">
                PRÓXIMO RITO <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleScheduleMeeting} disabled={isSyncingAct} className="gold-gradient text-background font-black uppercase text-[11px] px-16 h-16 rounded-2xl shadow-2xl transition-all hover:scale-[1.02] gap-4">
                {isSyncingAct ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                CONFIRMAR E SINCRONIZAR
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex flex-col h-full glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl sm:max-w-[1200px]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none">
            <SheetHeader>
              <SheetTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingProcess ? "Retificar Dossiê" : "Novo Processo"}
              </SheetTitle>
            </SheetHeader>
          </div>
          <ProcessForm 
            initialData={editingProcess}
            onSubmit={(data) => {
              if (editingProcess) {
                updateDocumentNonBlocking(doc(db!, "processes", editingProcess.id), { ...data, updatedAt: serverTimestamp() })
                toast({ title: "Atualizado" })
              } else {
                addDocumentNonBlocking(collection(db!, "processes"), { ...data, status: "Em Andamento", createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
                toast({ title: "Protocolado" })
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
