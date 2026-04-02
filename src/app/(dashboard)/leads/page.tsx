"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  PlusCircle, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  Clock, 
  Zap, 
  Brain,
  Loader2,
  LayoutGrid,
  Video,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  UserCog,
  Building,
  CloudLightning,
  Archive,
  Trash2,
  Fingerprint,
  Navigation,
  ShieldAlert,
  User,
  Gavel,
  MessageCircle,
  FileCheck,
  Edit3,
  ArrowRight,
  ArrowLeft,
  Lock,
  Plus,
  AlertTriangle,
  GripVertical,
  Calendar,
  FileSearch,
  Sparkles,
  FileText,
  Home,
  MessageSquare,
  Save,
  Map as MapIcon,
  MoreVertical,
  X,
  Share2,
  ExternalLink,
  BookOpen,
  ClipboardList,
  Target,
  ListTodo,
  ShieldQuestion,
  TrendingUp,
  AlertCircle,
  Scale,
  Copy,
  FileDown,
  History,
  Calculator,
  Star,
  TriangleAlert,
  CalendarDays,
  ChevronDown,
  Library,
  Globe,
  RotateCcw
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
} from "@/components/ui/sheet"
import { 
  Dialog, 
  DialogContent,
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { LeadForm } from "@/components/leads/lead-form"
import { collection, query, serverTimestamp, doc, where, limit, orderBy } from "firebase/firestore"
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc, setDocumentNonBlocking } from "@/firebase"
import { cn, maskCEP } from "@/lib/utils"
import { DynamicInterviewExecution } from "@/components/interviews/dynamic-interview-execution"
import { BurocraciaView } from "@/components/leads/burocracia-view"
import { ProcessForm } from "@/components/cases/process-form"
import Link from "next/link"
import { generateCaseSummary, type GenerateCaseSummaryOutput } from "@/ai/flows/ai-generate-case-summary"
import { aiAnalyzeFullInterview, type AnalyzeInterviewOutput } from "@/ai/flows/ai-analyze-full-interview"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ActivityManager } from "@/components/leads/activity-manager"
import { aiParseDjePublication } from "@/ai/flows/ai-parse-dje-publication"
import { format, addDays, addBusinessDays, parseISO } from "date-fns"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { getValidGoogleAccessToken } from "@/services/google-token"
import { syncActToGoogleCalendar } from "@/services/google-calendar-sync"
import { normalizeGoogleWorkspaceSettings } from "@/services/google-workspace"

const columns = [
  { id: "novo", title: "NOVO LEAD", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-emerald-400" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

export default function LeadsPage() {
  const db = useFirestore()
  const auth = useAuth()
  const { user, profile } = useUser()
  const { toast } = useToast()
  const [listLimit, setListLimit] = useState(50)
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  const leadsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "leads"), orderBy("updatedAt", "desc"), limit(listLimit))
  }, [db, user, listLimit])

  const { data: leadsData, isLoading } = useCollection(leadsQuery)
  const leads = useMemo(() => (leadsData || []).filter(l => l.status !== 'arquivado'), [leadsData])

  const googleSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleSettingsData } = useDoc(googleSettingsRef)
  const googleSettings = useMemo(() => normalizeGoogleWorkspaceSettings(googleSettingsData), [googleSettingsData])

  const [selectedLead, setSelectedLead] = useState<any>(null)
  
  const activeLead = useMemo(() => {
    if (!selectedLead || !leads) return selectedLead
    return leads.find(l => l.id === selectedLead.id) || selectedLead
  }, [leads, selectedLead?.id])

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [isEditModeOpen, setIsEditModeOpen] = useState(false)
  const [isConversionOpen, setIsConversionOpen] = useState(false)
  const [activeDossierTab, setActiveDossierTab] = useState("overview")
  
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false)
  const [executingTemplate, setExecutingTemplate] = useState<any>(null)

  const [viewingInterview, setViewingInterview] = useState<any>(null)
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false)
  const [interviewAnalysis, setInterviewAnalysis] = useState<AnalyzeInterviewOutput | null>(null)

  const [isSchedulingIntake, setIsSchedulingIntake] = useState(false)
  const [intakeStep, setIntakeStep] = useState(1)
  const [intakeData, setIntakeData] = useState({ 
    date: "", 
    time: "09:00", 
    type: "online", 
    locationType: "sede", 
    customAddress: "", 
    observations: "", 
    autoMeet: true,
    zipCode: "",
    address: "",
    number: "",
    neighborhood: "",
    city: "",
    state: ""
  })
  const [isSyncingIntake, setIsSyncingIntake] = useState(false)
  const [loadingIntakeCep, setLoadingIntakeCep] = useState(false)

  const leadInterviewsQuery = useMemoFirebase(() => {
    const leadId = activeLead?.id || selectedLead?.id
    if (!user || !db || !leadId) return null
    return collection(db!, "leads", leadId, "interviews")
  }, [db, user, activeLead?.id, selectedLead?.id])
  const { data: leadInterviewsRaw } = useCollection(leadInterviewsQuery)
  
  const leadInterviews = useMemo(() => {
    if (!leadInterviewsRaw) return []
    return [...leadInterviewsRaw].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || a.createdAt || 0
      const dateB = b.createdAt?.toDate?.() || b.createdAt || 0
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
  }, [leadInterviewsRaw])

  useEffect(() => {
    if (activeLead) {
      setIntakeData({ 
        date: activeLead.scheduledDate || "", 
        time: activeLead.scheduledTime || "09:00", 
        type: activeLead.meetingType || "online", 
        locationType: activeLead.locationType || "sede", 
        customAddress: activeLead.customAddress || "", 
        observations: activeLead.intakeObservations || "",
        autoMeet: true,
        zipCode: activeLead.zipCode || "",
        address: activeLead.address || "",
        number: activeLead.number || "",
        neighborhood: activeLead.neighborhood || "",
        city: activeLead.city || "",
        state: activeLead.state || ""
      })
    }
  }, [activeLead?.id])

  const handleIntakeCepBlur = async () => {
    const cep = intakeData.zipCode?.replace(/\D/g, "")
    if (!cep || cep.length !== 8) return
    setLoadingIntakeCep(true)
    try {
      const response = await fetch("https://viacep.com.br/ws/" + cep + "/json/")
      const data = await response.json()
      if (!data.erro) {
        setIntakeData(prev => ({
          ...prev,
          address: data.logradouro.toUpperCase(),
          neighborhood: data.bairro.toUpperCase(),
          city: data.localidade.toUpperCase(),
          state: data.uf.toUpperCase()
        }))
      }
    } catch (e) { console.error("CEP error") } finally { setLoadingIntakeCep(false) }
  }

  const handleOpenLead = (lead: any) => { 
    setSelectedLead(lead)
    setIsSheetOpen(true)
    setActiveDossierTab("overview")
  }

  const handleScheduleIntake = async () => {
    if (!db || !activeLead || !intakeData.date) {
      toast({ variant: "destructive", title: "Dados Incompletos" })
      return
    }
    setIsSyncingIntake(true)
    
    let finalLocation = ""
    if (intakeData.type === 'online') {
      finalLocation = "GOOGLE MEET RGMJ"
    } else {
      if (intakeData.locationType === 'sede') {
        finalLocation = 'Sede RGMJ'
      } else {
        const addr = intakeData.address || ""
        const num = intakeData.number || ""
        const neigh = intakeData.neighborhood || ""
        const cit = intakeData.city || ""
        const st = intakeData.state || ""
        finalLocation = `${addr}, ${num} - ${neigh}, ${cit}/${st}`
      }
    }
    
    const timeVal = intakeData.time || "09:00"
    const dateTimeStr = intakeData.date + "T" + timeVal + ":00";
    const appRef = doc(collection(db, "appointments"));
    const docRefId = appRef.id;

    updateDocumentNonBlocking(doc(db, "leads", activeLead.id), { 
      scheduledDate: intakeData.date, 
      scheduledTime: intakeData.time, 
      meetingType: intakeData.type, 
      meetingLocation: finalLocation, 
      updatedAt: serverTimestamp() 
    })
    
    setDocumentNonBlocking(appRef, { 
      id: docRefId,
      title: "TRIAGEM: " + activeLead.name, 
      type: "Atendimento", 
      startDateTime: dateTimeStr, 
      clientId: activeLead.id, 
      clientName: activeLead.name, 
      location: finalLocation, 
      status: "Agendado", 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true })

    const calendarSync = await syncActToGoogleCalendar({
      auth,
      googleSettings,
      staffEmail: user?.email ?? undefined,
      firestore: db,
      act: {
        title: "[TRIAGEM] " + activeLead.name,
        description: "Atendimento inicial do lead RGMJ.",
        location: finalLocation,
        startDateTime: dateTimeStr,
        type: 'atendimento',
        clientName: activeLead.name,
        useMeet: intakeData.type === 'online' && intakeData.autoMeet
      }
    })

    if (calendarSync.status === 'synced') {
      updateDocumentNonBlocking(appRef, {
        meetingUrl: calendarSync.meetingUrl || "",
        calendarEventId: calendarSync.calendarEventId,
        calendarSyncStatus: 'synced',
        updatedAt: serverTimestamp()
      })
    }

    setIsSyncingIntake(false)
    setIsSchedulingIntake(false)
    toast({ title: "Atendimento Protocolado" })
  }

  const handleDragStart = (id: string) => setDraggedLeadId(id)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = async (status: string) => {
    if (!draggedLeadId || !db) return
    updateDocumentNonBlocking(doc(db, "leads", draggedLeadId), { status, updatedAt: serverTimestamp() })
    setDraggedLeadId(null)
  }

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block"

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 mb-2">
            <LayoutGrid className="h-3 w-3" /><Link href="/">INÍCIO</Link><ChevronRight className="h-2 w-2" /><span className="text-white">FUNIL DE LEADS</span>
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Triagem de Oportunidades</h1>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-black font-black gap-3 px-6 h-11 rounded-xl text-xs tracking-widest shadow-xl">
          <PlusCircle className="h-4 w-4" /> NOVO ATENDIMENTO
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-12 scrollbar-hide min-h-[600px]">
        {columns.map((col) => {
          const leadsInCol = leads.filter(l => (l.status || "novo") === col.id)
          return (
            <div key={col.id} className="min-w-[340px] flex-1 flex flex-col" onDragOver={handleDragOver} onDrop={() => handleDrop(col.id)}>
              <div className="flex items-center justify-between mb-4 px-4 bg-white/[0.02] py-2.5 rounded-xl border border-white/5 shadow-inner">
                <div className="flex items-center gap-3"><div className={cn("w-2 h-2 rounded-full", col.color.replace('text-', 'bg-'))} /><h3 className={cn("font-black text-[10px] tracking-[0.25em] uppercase", col.color)}>{col.title}</h3></div>
                <Badge variant="secondary" className="bg-white/5 text-[10px] border-white/5 font-black h-6 px-2.5 rounded-lg">{leadsInCol.length}</Badge>
              </div>
              <div className={cn("space-y-4 flex-1 bg-white/[0.01] rounded-2xl p-3 border border-white/5 transition-all", draggedLeadId && "ring-1 ring-primary/20")}>
                {leadsInCol.map((lead) => (
                  <Card key={lead.id} draggable onDragStart={() => handleDragStart(lead.id)} className={cn("glass hover-gold transition-all cursor-grab active:cursor-grabbing border-white/5 shadow-lg rounded-xl overflow-hidden", draggedLeadId === lead.id && "opacity-50")} onClick={() => handleOpenLead(lead)}>
                    <CardContent className="p-4 space-y-4">
                      <div className="font-bold text-sm text-white group-hover:text-primary uppercase truncate leading-none">{lead.name}</div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex gap-1.5">
                          {lead.cpf && <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5 uppercase">CPF OK</Badge>}
                        </div>
                        <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="glass border-white/10 p-0 bg-[#05070a] shadow-2xl flex flex-col h-full sm:max-w-[95vw] w-[95vw]">
          {activeLead && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-8 border-b border-white/5 bg-[#0a0f1e] z-10 flex-none shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><Fingerprint className="h-6 w-6 text-primary" /></div>
                    <div className="space-y-1">
                      <SheetTitle className="text-2xl font-black uppercase text-white tracking-tight leading-none">{activeLead.name}</SheetTitle>
                      <SheetDescription className="text-xs text-muted-foreground uppercase font-black tracking-widest opacity-50">
                        {activeLead.scheduledDate ? ("TRIAGEM: " + activeLead.scheduledDate) : 'AGUARDANDO AGENDAMENTO'}
                      </SheetDescription>
                    </div>
                  </div>
                </div>
              </SheetHeader>
              
              <ScrollArea className="flex-1 bg-[#05070a]">
                <div className="p-10 space-y-10 w-full mx-auto pb-40">
                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-10">
                    <TabsList className="bg-white/5 border border-white/10 h-14 p-1.5 gap-1.5 w-full justify-start rounded-2xl shadow-2xl">
                      <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl gap-3 tracking-[0.2em]"><LayoutGrid className="h-4 w-4" /> OVERVIEW</TabsTrigger>
                      <TabsTrigger value="atividades" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl gap-3 tracking-[0.2em]"><History className="h-4 w-4" /> ATRIBUIÇÕES</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="animate-in fade-in duration-500 outline-none w-full space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="glass border-white/5 p-10 rounded-3xl shadow-2xl bg-white/[0.01] relative overflow-hidden group cursor-pointer hover:border-amber-500/30 transition-all" onClick={() => { setIntakeStep(1); setIsSchedulingIntake(true); }}>
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-3"><Clock className="h-5 w-5" /> Cronograma de Triagem</h4>
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center"><ArrowRight className="h-5 w-5 text-amber-500" /></div>
                          </div>
                          <div className="space-y-4">
                            <p className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{activeLead.scheduledDate ? (activeLead.scheduledDate + " " + activeLead.scheduledTime) : "AGUARDANDO DEFINIÇÃO"}</p>
                            <Badge variant="outline" className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] h-8 px-4 border-white/10">{activeLead.meetingLocation || "LOCAL NÃO INFORMADO"}</Badge>
                          </div>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="atividades" className="animate-in fade-in duration-500 outline-none w-full">
                      <ActivityManager leadId={activeLead.id} />
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isSchedulingIntake} onOpenChange={setIsSchedulingIntake}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[650px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col h-[80vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none shadow-xl">
            <div className="flex items-center gap-6">
              <div className={cn("w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 shadow-xl", isSyncingIntake && "animate-pulse")}>
                {isSyncingIntake ? <Loader2 className="h-6 w-6 animate-spin" /> : <Clock className="h-6 w-6" />}
              </div>
              <div className="text-left">
                <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Agendar Atendimento</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">Passo {intakeStep} de 5</Badge>
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-[#0a0f1e]/50">
            <div className="p-10 space-y-8">
              {intakeStep === 1 && (
                <div className="space-y-8 animate-in zoom-in-95 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">1. Qual a Modalidade?</Label>
                  <RadioGroup value={intakeData.type} onValueChange={(v: any) => setIntakeData({...intakeData, type: v})} className="grid grid-cols-2 gap-6">
                    <div className={cn("p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4", intakeData.type === 'online' ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-black/20 border-white/5 hover:border-white/20")} onClick={() => setIntakeData({...intakeData, type: 'online'})}>
                      <Video className={cn("h-8 w-8", intakeData.type === 'online' ? "text-emerald-500" : "text-muted-foreground")} /><span className="text-sm font-black text-white uppercase tracking-widest">Virtual</span>
                    </div>
                    <div className={cn("p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4", intakeData.type === 'presencial' ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(245,208,48,0.2)]" : "bg-black/20 border-white/5 hover:border-white/20")} onClick={() => setIntakeData({...intakeData, type: 'presencial'})}>
                      <MapPin className={cn("h-8 w-8", intakeData.type === 'presencial' ? "text-primary" : "text-muted-foreground")} /><span className="text-sm font-black text-white uppercase tracking-widest">Presencial</span>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {intakeStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">2. Cronograma de Triagem</Label>
                  <div className="grid grid-cols-2 gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-2xl shadow-xl">
                    <div className="space-y-2"><Label className={labelMini}>Data</Label><Input type="date" className="bg-black/40 h-14 text-white font-bold rounded-xl" value={intakeData.date} onChange={e => setIntakeData({...intakeData, date: e.target.value})} /></div>
                    <div className="space-y-2"><Label className={labelMini}>Hora</Label><Input type="time" className="bg-black/40 h-14 text-white font-bold rounded-xl" value={intakeData.time} onChange={e => setIntakeData({...intakeData, time: e.target.value})} /></div>
                  </div>
                </div>
              )}

              {intakeStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">3. Identificação do Lead</Label>
                  <div className="space-y-6">
                    <div className="space-y-2"><Label className={labelMini}>Identificação do Compromisso</Label><Input value={"TRIAGEM: " + (activeLead?.name || "")} className="bg-black/40 h-14 text-white font-black" disabled /></div>
                    <div className="space-y-2"><Label className={labelMini}>Pauta / Observações</Label><Textarea value={intakeData.observations} onChange={e => setIntakeData({...intakeData, observations: e.target.value})} className="bg-black/40 min-h-[150px] text-white p-6 rounded-2xl" placeholder="Assuntos a tratar..." /></div>
                  </div>
                </div>
              )}

              {intakeStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">4. Logística de Atendimento</Label>
                  {intakeData.type === 'online' ? (
                    <Card className="p-10 rounded-[2.5rem] bg-emerald-500/5 border-2 border-emerald-500/20 text-center space-y-6 shadow-2xl">
                      <Video className="h-12 w-12 text-emerald-500 mx-auto" /><h4 className="text-xl font-black text-white uppercase tracking-widest">Google Meet Hub</h4>
                      <div className="flex items-center justify-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                        <Switch checked={intakeData.autoMeet} onCheckedChange={v => setIntakeData({...intakeData, autoMeet: v})} className="data-[state=checked]:bg-emerald-500" />
                        <Label className="text-[10px] font-black text-white uppercase">Gerar Link via Workspace?</Label>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <RadioGroup value={intakeData.locationType} onValueChange={v => setIntakeData({...intakeData, locationType: v})} className="grid grid-cols-2 gap-4">
                        <div className={cn("p-6 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all", intakeData.locationType === 'sede' ? "bg-primary/10 border-primary" : "bg-black/20 border-white/5 hover:border-white/20")} onClick={() => setIntakeData({...intakeData, locationType: 'sede'})}>
                          <Building className="h-4 w-4 text-primary" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Sede RGMJ</span>
                        </div>
                        <div className={cn("p-6 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all", intakeData.locationType === 'custom' ? "bg-primary/10 border-primary" : "bg-black/20 border-white/5 hover:border-white/20")} onClick={() => setIntakeData({...intakeData, locationType: 'custom'})}>
                          <MapPin className="h-4 w-4 text-primary" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Externo</span>
                        </div>
                      </RadioGroup>
                      {intakeData.locationType === 'custom' && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className={labelMini}>CEP</Label>
                              <div className="relative">
                                <Input 
                                  value={intakeData.zipCode} 
                                  onChange={e => setIntakeData({...intakeData, zipCode: maskCEP(e.target.value)})} 
                                  onBlur={handleIntakeCepBlur}
                                  className="bg-black/40 border-white/10 h-12 text-white font-mono rounded-xl" 
                                  placeholder="00000-000"
                                />
                                {loadingIntakeCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                              </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label className={labelMini}>Logradouro</Label>
                              <Input value={intakeData.address} onChange={e => setIntakeData({...intakeData, address: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className={labelMini}>Nº</Label>
                              <Input value={intakeData.number} onChange={e => setIntakeData({...intakeData, number: e.target.value})} className="bg-black/40 h-12 text-white rounded-xl" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className={labelMini}>Bairro</Label>
                              <Input value={intakeData.neighborhood} onChange={e => setIntakeData({...intakeData, neighborhood: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className={labelMini}>Cidade</Label>
                              <Input value={intakeData.city} onChange={e => setIntakeData({...intakeData, city: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className={labelMini}>UF</Label>
                              <Input value={intakeData.state} onChange={e => setIntakeData({...intakeData, state: e.target.value.toUpperCase()})} maxLength={2} className="bg-black/40 h-12 text-white rounded-xl" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {intakeStep === 5 && (
                <div className="space-y-8 animate-in zoom-in-95 duration-300 text-center">
                  <Label className="text-xs font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">5. Consolidação</Label>
                  <Card className="glass border-primary/30 bg-primary/5 p-10 rounded-[2.5rem] shadow-2xl space-y-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-500 shadow-xl">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{activeLead?.name}</h4>
                      <p className="text-sm font-bold text-primary uppercase tracking-widest">{intakeData.date} às {intakeData.time}</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-relaxed">
                        {intakeData.type === 'online' ? "Sincronismo Google Meet + Calendar Ativo." : "Atendimento Presencial Programado."}
                      </p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none shadow-[0_-20px_50px_rgba(0,0,0,0.6)]">
            <Button variant="ghost" onClick={() => intakeStep > 1 ? setIntakeStep(intakeStep - 1) : setIsSchedulingIntake(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 hover:text-white">
              {intakeStep > 1 ? "ANTERIOR" : "CANCELAR"}
            </Button>
            {intakeStep < 5 ? (
              <Button onClick={() => setIntakeStep(intakeStep + 1)} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-xl transition-all hover:scale-[1.02] gap-3">
                PRÓXIMO RITO <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleScheduleIntake} disabled={isSyncingIntake} className="gold-gradient text-background font-black uppercase text-[11px] px-16 h-16 rounded-2xl shadow-2xl transition-all hover:scale-[1.02] gap-4">
                {isSyncingIntake ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                CONFIRMAR E SINCRONIZAR
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}