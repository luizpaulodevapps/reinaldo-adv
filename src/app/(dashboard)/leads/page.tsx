
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
  Calendar as CalendarIcon,
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
  ChevronDown
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
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from "@/firebase"
import { cn } from "@/lib/utils"
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

const columns = [
  { id: "novo", title: "NOVO LEAD", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-emerald-400" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

const DOSSIER_TABS = ["overview", "atividades", "captura", "dossies", "burocracia", "revisao"]

export default function LeadsPage() {
  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()
  const [listLimit, setListLimit] = useState(50)

  const leadsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "leads"), orderBy("updatedAt", "desc"), limit(listLimit))
  }, [db, user, listLimit])

  const { data: leadsData, isLoading } = useCollection(leadsQuery)
  const leads = useMemo(() => (leadsData || []).filter(l => l.status !== 'arquivado'), [leadsData])

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

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [strategicSummary, setStrategicSummary] = useState<GenerateCaseSummaryOutput | null>(null)

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  const [isSchedulingIntake, setIsSchedulingIntake] = useState(false)
  const [intakeData, setIntakeData] = useState({ date: "", time: "", type: "online", locationType: "sede", customAddress: "", observations: "" })

  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false)
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

  const currentTabIndex = DOSSIER_TABS.indexOf(activeDossierTab)
  const canGoBack = currentTabIndex > 0
  const canGoNext = currentTabIndex < DOSSIER_TABS.length - 1

  const handleNextTab = () => { if (canGoNext) setActiveDossierTab(DOSSIER_TABS[currentTabIndex + 1]) }
  const handlePrevTab = () => { if (canGoBack) setActiveDossierTab(DOSSIER_TABS[currentTabIndex - 1]) }

  const getDrawerWidthClass = () => {
    return "sm:max-w-[95vw] w-[95vw]"
  }

  const templatesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "checklists"), orderBy("title", "asc"))
  }, [db, user])
  const { data: templates } = useCollection(templatesQuery)

  const leadInterviewsQuery = useMemoFirebase(() => {
    const leadId = activeLead?.id || selectedLead?.id
    if (!user || !db || !leadId) return null
    return collection(db!, "leads", leadId, "interviews")
  }, [db, user, activeLead?.id, selectedLead?.id])
  const { data: leadInterviewsRaw, isLoading: isLoadingInterviews } = useCollection(leadInterviewsQuery)
  
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
      setStrategicSummary(null)
      setIntakeData({ 
        date: activeLead.scheduledDate || "", 
        time: activeLead.scheduledTime || "", 
        type: activeLead.meetingType || "online", 
        locationType: activeLead.locationType || "sede", 
        customAddress: activeLead.customAddress || "", 
        observations: activeLead.intakeObservations || "" 
      })
    }
  }, [activeLead?.id])

  const handleOpenLead = (lead: any) => { 
    setSelectedLead(lead)
    setIsSheetOpen(true)
    setActiveDossierTab("overview")
  }

  const handleCreateLead = async (data: any) => {
    if (!user || !db) return
    const leadRef = await addDocumentNonBlocking(collection(db!, "leads"), { 
      ...data, 
      assignedStaffId: user?.uid, 
      status: "novo", 
      driveStatus: "pendente", 
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    });

    addDocumentNonBlocking(collection(db, "notifications"), {
      userId: user.uid,
      title: "Novo Lead na Triagem",
      message: `O cliente ${data.name.toUpperCase()} iniciou um novo rito de triagem.`,
      type: "lead",
      severity: "info",
      read: false,
      link: "/leads",
      createdAt: serverTimestamp()
    });

    setIsNewEntryOpen(false); 
    toast({ title: "Atendimento Iniciado" });
  }

  const handleScheduleIntake = async () => {
    if (!db || !activeLead || !intakeData.date || !intakeData.time) return
    const finalLocation = intakeData.type === 'online' ? 'Virtual RGMJ' : (intakeData.locationType === 'sede' ? 'Sede RGMJ' : intakeData.customAddress)
    const payload = { 
      scheduledDate: intakeData.date, 
      scheduledTime: intakeData.time, 
      meetingType: intakeData.type, 
      meetingLocation: finalLocation, 
      updatedAt: serverTimestamp() 
    }
    updateDocumentNonBlocking(doc(db, "leads", activeLead.id), payload)
    addDocumentNonBlocking(collection(db, "appointments"), { 
      title: `Atendimento: ${activeLead.name}`, 
      type: "Atendimento", 
      startDateTime: `${intakeData.date}T${intakeData.time}:00`, 
      clientId: activeLead.id, 
      clientName: activeLead.name, 
      location: finalLocation, 
      status: "Agendado", 
      createdAt: serverTimestamp() 
    })
    setIsSchedulingIntake(false)
    toast({ title: "Atendimento Agendado" })
  }

  const handleStartInterview = (t: any) => { setExecutingTemplate(t); setIsInterviewDialogOpen(true); }

  const handleFinishInterview = async (payload: { responses: any; templateSnapshot: any[] }) => {
    if (!db || !activeLead || !user) return
    const leadId = activeLead.id
    
    addDocumentNonBlocking(collection(db!, "leads", leadId, "interviews"), { 
      clientId: leadId, 
      clientName: activeLead.name, 
      templateId: executingTemplate.id, 
      interviewType: executingTemplate.title, 
      responses: payload.responses, 
      templateSnapshot: payload.templateSnapshot, 
      interviewerId: user.uid, 
      interviewerName: user.displayName, 
      status: "Concluída", 
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    })
    
    if (activeLead.status === 'novo') {
      updateDocumentNonBlocking(doc(db!, "leads", activeLead.id), { 
        status: "atendimento", 
        updatedAt: serverTimestamp() 
      })
    }
    
    setIsInterviewDialogOpen(false)
    setExecutingTemplate(null)
    setActiveDossierTab("dossies")
    toast({ title: "Protocolo Concluído" })
  }

  const handleRunInterviewAnalysis = async (interview: any) => {
    setIsAiAnalyzing(true); setInterviewAnalysis(null)
    try {
      const result = await aiAnalyzeFullInterview({ clientName: activeLead.name, interviewType: interview.interviewType, responses: interview.responses })
      setInterviewAnalysis(result)
      if (db) updateDocumentNonBlocking(doc(db, "leads", activeLead.id, "interviews", interview.id), { aiAnalysis: result, updatedAt: serverTimestamp() })
    } catch (e) { toast({ variant: "destructive", title: "Erro na análise" }) } finally { setIsAiAnalyzing(false) }
  }

  const handleGenerateStrategicSummary = async () => {
    if (!activeLead) return
    setIsGeneratingSummary(true)
    const interviewContext = (leadInterviews || []).map(int => {
      const responses = Object.entries(int.responses || {}).map(([q, a]) => `${q}: ${a}`).join("\n")
      return `ENTREVISTA (${int.interviewType}):\n${responses}`
    }).join("\n\n")
    try {
      const result = await generateCaseSummary({ 
        caseId: activeLead.id, 
        clientName: activeLead.name, 
        caseTitle: activeLead.demandTitle || "Demanda Estratégica", 
        caseDescription: interviewContext || activeLead.notes || "Aguardando entrevistas.", 
        currentStatus: "Triagem", 
        lastEvents: ["Entrevista"], 
        nextDeadlines: ["Protocolo"], 
        relatedParties: [activeLead.defendantName || "Réu"], 
        financialStatus: "" 
      })
      setStrategicSummary(result)
      toast({ title: "DNA Consolidado" })
    } catch (e) { toast({ variant: "destructive", title: "Erro IA" }) } finally { setIsGeneratingSummary(false) }
  }

  const handleConvertProcess = async (data: any) => {
    if (!db || !activeLead) return
    await addDocumentNonBlocking(collection(db!, "processes"), { ...data, leadId: activeLead.id, status: "Em Andamento", createdAt: serverTimestamp() })
    updateDocumentNonBlocking(doc(db!, "leads", activeLead.id), { status: "arquivado", convertedAt: serverTimestamp(), updatedAt: serverTimestamp() })
    
    addDocumentNonBlocking(collection(db, "notifications"), {
      userId: user?.uid,
      title: "Processo Protocolado",
      message: `O lead ${activeLead.name.toUpperCase()} foi convertido em processo ativo.`,
      type: "system",
      severity: "info",
      read: false,
      link: "/cases",
      createdAt: serverTimestamp()
    });

    setIsConversionOpen(false); setIsSheetOpen(false); toast({ title: "Processo Ativo" })
  }

  const handleAiParsePublication = async () => {
    if (!publicationText) return
    setIsAnalyzing(true)
    try {
      const result = await aiParseDjePublication({ publicationText })
      setDeadlineData({
        ...deadlineData,
        title: result.deadlineType || "PRAZO JUDICIAL",
        fatalDate: result.dueDate || "",
        description: result.summary || ""
      })
      toast({ title: "Análise Concluída" })
    } catch (e) { toast({ variant: "destructive", title: "Erro IA" }) } finally { setIsAnalyzing(false) }
  }

  const handleApplyDeadlineCalculation = () => {
    const days = parseInt(deadlineDuration)
    if (isNaN(days)) return
    const baseDate = parseISO(deadlineData.pubDate)
    let calculatedDate: Date
    if (deadlineData.calculationType.includes("Úteis")) {
      calculatedDate = addBusinessDays(baseDate, days)
    } else {
      calculatedDate = addDays(baseDate, days)
    }
    setDeadlineData({ ...deadlineData, fatalDate: format(calculatedDate, 'yyyy-MM-dd') })
  }

  const handleLaunchDeadline = async () => {
    if (!db || !activeLead) return
    await addDocumentNonBlocking(collection(db!, "deadlines"), {
      title: deadlineData.title.toUpperCase(),
      dueDate: deadlineData.fatalDate,
      pubDate: deadlineData.pubDate,
      description: deadlineData.description.toUpperCase(),
      priority: deadlineData.priority,
      calculationType: deadlineData.calculationType,
      leadId: activeLead.id,
      status: "Aberto",
      createdAt: serverTimestamp()
    })
    setIsDeadlineOpen(false)
    toast({ title: "Prazo Lançado" })
  }

  const handleExportToGoogleDocs = () => {
    if (!interviewAnalysis) return
    const content = `REGINALDO GONÇALVES MIGUEL DE JESUS - ADVOCACIA ESTRATÉGICA\nCLIENTE: ${activeLead?.name}\n--------------------------------------------------\n${interviewAnalysis.draftPetition || interviewAnalysis.summary}\n--------------------------------------------------\nDocumento gerado via Inteligência Artificial RGMJ.`.trim()
    navigator.clipboard.writeText(content).then(() => {
      toast({ title: "Peça Preparada", description: "Copiado! Redirecionando para novo Google Doc." })
      setTimeout(() => { window.open("https://doc.new", "_blank") }, 1500)
    })
  }

  const handleDragStart = (id: string) => setDraggedLeadId(id)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = async (status: string) => {
    if (!draggedLeadId || !db) return
    updateDocumentNonBlocking(doc(db, "leads", draggedLeadId), { status, updatedAt: serverTimestamp() })
    setDraggedLeadId(null)
  }

  const handleDeleteLead = (id: string) => { 
    if (!db || !confirm("Excluir Lead?")) return; 
    deleteDocumentNonBlocking(doc(db, "leads", id)); 
    toast({ title: "Lead Removido" }); 
    setIsSheetOpen(false); 
  }

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

      {isLoading && leads.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-6"><Loader2 className="h-10 w-10 animate-spin text-primary" /><span className="text-xs font-bold uppercase tracking-widest">Auditando Banco...</span></div>
      ) : (
        <div className="space-y-10">
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
                    <AnimatePresence>
                      {leadsInCol.map((lead) => (
                        <motion.div key={lead.id} layoutId={lead.id} draggable onDragStart={() => handleDragStart(lead.id)}>
                          <Card className={cn("glass hover-gold transition-all cursor-grab active:cursor-grabbing border-white/5 shadow-lg rounded-xl overflow-hidden", draggedLeadId === lead.id && "opacity-50")} onClick={() => handleOpenLead(lead)}>
                            <CardContent className="p-4 space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 flex-1 min-w-0"><div className="font-bold text-sm text-white group-hover:text-primary uppercase truncate">{lead.name}</div><span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">ID: {lead.id.substring(0, 8).toUpperCase()}</span></div>
                                <DropdownMenu><DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><button className="h-7 w-7 text-white/20 hover:text-white"><MoreVertical className="h-4 w-4" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-[#0d121f] border-white/10 text-white w-44"><DropdownMenuItem onClick={() => handleOpenLead(lead)}>Ver Dossiê</DropdownMenuItem><DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="text-rose-500">Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex gap-1.5">
                                  {lead.cpf && <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5 uppercase">CPF OK</Badge>}
                                  {leadInterviews?.filter(i => i.clientId === lead.id).length > 0 && <Badge variant="outline" className="text-[8px] border-primary/20 text-primary bg-primary/5 uppercase">DNA CAPTURADO</Badge>}
                                </div>
                                <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })}
          </div>
          {leadsData && leadsData.length >= listLimit && (
            <div className="flex justify-center">
              <Button onClick={() => setListLimit(prev => prev + 50)} variant="outline" className="glass border-white/10 text-muted-foreground font-black uppercase text-[10px] tracking-widest h-12 px-10 rounded-xl">
                <ChevronDown className="h-4 w-4 mr-2" /> Expandir Funil de Atendimento
              </Button>
            </div>
          )}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className={cn("glass border-white/10 p-0 bg-[#05070a] shadow-2xl flex flex-col h-full transition-all duration-500", getDrawerWidthClass())}>
          {activeLead && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-8 border-b border-white/5 bg-[#0a0f1e] z-10 flex-none shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><Fingerprint className="h-6 w-6 text-primary" /></div>
                    <div className="space-y-1">
                      <SheetTitle className="text-2xl font-black uppercase text-white tracking-tight leading-none">{activeLead.name}</SheetTitle>
                      <SheetDescription className="text-xs text-muted-foreground uppercase font-black tracking-widest flex items-center gap-3 opacity-50">
                        <span>ID: {activeLead.id.toUpperCase()}</span>
                        <span>•</span>
                        <span>{activeLead.scheduledDate ? `Atendimento em ${new Date(activeLead.scheduledDate).toLocaleDateString()}` : 'Aguardando agendamento'}</span>
                      </SheetDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pr-8">
                    <Button onClick={() => handleDeleteLead(activeLead.id)} variant="outline" className="h-11 text-[10px] font-black uppercase px-5 rounded-xl text-rose-400 border-white/10 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></Button>
                    <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="h-11 text-[10px] font-black uppercase px-6 rounded-xl text-primary border-white/10 hover:bg-primary/5">EDITAR QUALIFICAÇÃO</Button>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="p-6 bg-[#0a0f1e]/60 border-b border-white/5 flex-none shadow-inner">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Status do Funil", value: activeLead.status?.toUpperCase() || "NOVO", icon: Zap, color: "text-primary" },
                    { label: "Parte Contrária", value: activeLead.defendantName || "NÃO MAPEADO", icon: Building, color: "text-muted-foreground" },
                    { label: "Canal de Entrada", value: activeLead.phone, icon: Phone, color: "text-emerald-500" },
                    { label: "Unidade Federativa", value: activeLead.city ? `${activeLead.city}/${activeLead.state}` : "NÃO INFORMADA", icon: MapPin, color: "text-muted-foreground" },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group hover:border-white/10 transition-colors">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-black/20 border border-white/5 transition-all group-hover:scale-110", item.color)}><item.icon className="h-5 w-5" /></div>
                      <div className="min-w-0"><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">{item.label}</p><p className="text-xs font-black text-white uppercase truncate tracking-tight">{item.value}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 bg-[#05070a]">
                <div className="p-10 space-y-10 w-full mx-auto pb-40">
                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-10">
                    <TabsList className="bg-white/5 border border-white/10 h-14 p-1.5 gap-1.5 w-full justify-start rounded-2xl shadow-2xl">
                      <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl gap-3 transition-all flex items-center tracking-[0.2em]"><LayoutGrid className="h-4 w-4" /> OVERVIEW</TabsTrigger>
                      <TabsTrigger value="atividades" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl gap-3 transition-all flex items-center tracking-[0.2em]"><History className="h-4 w-4" /> ATRIBUICÕES</TabsTrigger>
                      <TabsTrigger value="captura" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl gap-3 transition-all flex items-center tracking-[0.2em]"><Zap className="h-4 w-4" /> CAPTURA DNA</TabsTrigger>
                      <TabsTrigger value="dossies" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl gap-3 transition-all flex items-center tracking-[0.2em]"><MessageSquare className="h-4 w-4" /> DOSSIÊS</TabsTrigger>
                      <TabsTrigger value="burocracia" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl gap-3 transition-all flex items-center tracking-[0.2em]"><ClipboardList className="h-4 w-4" /> BUROCRACIA</TabsTrigger>
                      <TabsTrigger value="revisao" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl gap-3 transition-all flex items-center tracking-[0.2em]"><ShieldCheck className="h-4 w-4" /> REVISÃO</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="animate-in fade-in duration-500 outline-none w-full space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="glass border-white/5 p-10 rounded-3xl shadow-2xl bg-white/[0.01] relative overflow-hidden group cursor-pointer hover:border-amber-500/30 transition-all" onClick={() => setIsSchedulingIntake(true)}>
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-3"><Clock className="h-5 w-5" /> Cronograma de Triagem</h4>
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight className="h-5 w-5 text-amber-500" /></div>
                          </div>
                          <div className="space-y-4">
                            <p className="text-3xl font-black text-white uppercase tracking-tighter">{activeLead.scheduledDate ? `${new Date(activeLead.scheduledDate).toLocaleDateString()} ${activeLead.scheduledTime}` : "AGUARDANDO DEFINIÇÃO"}</p>
                            <Badge variant="outline" className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] h-8 px-4 border-white/10">{activeLead.meetingLocation || "LOCAL NÃO INFORMADO"}</Badge>
                          </div>
                        </Card>
                        <Card className="glass border-primary/15 p-10 rounded-3xl shadow-2xl bg-primary/5 relative overflow-hidden">
                          <h4 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3 mb-6"><Brain className="h-5 w-5" /> Síntese Estratégica IA</h4>
                          <p className="text-base text-white/80 leading-relaxed italic font-medium text-justify">{activeLead.aiSummary || "Aguardando capturas de DNA jurídico para consolidar a tese."}</p>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="atividades" className="w-full">
                      <ActivityManager leadId={activeLead.id} />
                    </TabsContent>

                    <TabsContent value="captura" className="w-full space-y-10 animate-in fade-in duration-700 outline-none">
                      <div className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                          <Zap className="h-6 w-6 text-primary" />
                          <h3 className="text-base font-black text-white uppercase tracking-[0.3em]">Protocolo de Captura Técnica</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {templates?.map(t => (
                            <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-white/10 text-white font-black uppercase text-xs h-20 gap-6 rounded-2xl justify-start px-8 hover:border-primary/40 hover:bg-primary/5 transition-all group border-2">
                              <Zap className="h-6 w-6 text-primary shrink-0 group-hover:scale-125 transition-transform" />
                              <div className="flex flex-col items-start min-w-0"><span className="truncate w-full text-left tracking-tight text-sm">{t.title}</span><span className="text-[9px] opacity-40 uppercase tracking-widest mt-1">Iniciar Rito Digital</span></div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="dossies" className="w-full space-y-10 animate-in fade-in duration-700 outline-none">
                      <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <div className="flex items-center gap-4">
                            <MessageSquare className="h-6 w-6 text-primary" />
                            <h3 className="text-base font-black text-white uppercase tracking-[0.3em]">Acervo de Dossiês Concluídos</h3>
                          </div>
                        </div>
                        {isLoadingInterviews ? (
                          <div className="py-32 flex flex-col items-center justify-center opacity-40 gap-6"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-xs font-black uppercase tracking-[0.5em]">Auditando banco de dados...</p></div>
                        ) : leadInterviews && leadInterviews.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {leadInterviews.map((int) => (
                              <Card key={int.id} className="glass border-white/5 hover-border-primary/20 transition-all p-0 rounded-3xl bg-white/[0.01] flex flex-col group shadow-2xl relative overflow-hidden">
                                {int.aiAnalysis && <div className="absolute top-0 right-0 p-6"><Sparkles className="h-5 w-5 text-primary animate-pulse shadow-[0_0_15px_rgba(245,208,48,0.3)]" /></div>}
                                <div className="p-8 space-y-8 flex-1">
                                  <div className="flex justify-between items-start">
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-0 h-7 px-3 text-[10px] font-black uppercase tracking-widest">PROTOCOLO OK</Badge>
                                    <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-40 font-bold">{int.createdAt?.toDate ? new Date(int.createdAt.toDate()).toLocaleDateString() : '---'}</span>
                                  </div>
                                  <h4 className="text-lg font-black text-white uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">{int.interviewType}</h4>
                                  <div className="flex items-center gap-3 pt-6 border-t border-white/5"><Avatar className="h-8 w-8 border border-white/10"><AvatarFallback className="bg-secondary text-[10px] font-black text-primary">{int.interviewerName?.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">DR(A). {int.interviewerName}</span></div>
                                </div>
                                <div className="p-6 bg-white/[0.02] border-t border-white/5 grid grid-cols-2 gap-3">
                                  <Button variant="ghost" onClick={() => { setViewingInterview(int); setInterviewAnalysis(int.aiAnalysis || null); }} className="h-12 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white/5 gap-3"><FileSearch className="h-4 w-4" /> VER DOSSIÊ</Button>
                                  <Button onClick={() => handleRunInterviewAnalysis(int)} className="h-12 glass border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-primary hover:text-background gap-3 shadow-lg"><Brain className="h-4 w-4" /> ANALISAR IA</Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="py-48 flex flex-col items-center justify-center opacity-20 space-y-8 glass rounded-[3rem] border-dashed border-2 border-white/5 bg-white/[0.01]"><ClipboardList className="h-16 w-16 text-muted-foreground" /><p className="text-xs font-black uppercase tracking-[0.6em] text-center">Nenhum dossiê técnico capturado para este lead.</p></div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="burocracia" className="w-full">
                      <BurocraciaView lead={activeLead} interviews={leadInterviews || []} onEdit={() => setIsEditModeOpen(true)} />
                    </TabsContent>

                    <TabsContent value="revisao" className="w-full space-y-10 animate-in fade-in duration-700 outline-none">
                      <div className="flex flex-col lg:flex-row gap-10">
                        <div className="w-full lg:w-96 flex-none space-y-8">
                          <Card className="glass border-primary/20 bg-black/40 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-6 bg-primary/5 border-b border-white/5 flex items-center gap-4"><ShieldCheck className="h-6 w-6 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" /><h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Integridade de Dados</h4></div>
                            <div className="p-6 space-y-5">
                              {[
                                { label: "Polo Ativo (Qualificação)", ok: !!activeLead.name && !!activeLead.cpf },
                                { label: "Polo Passivo (Réu)", ok: !!activeLead.defendantName },
                                { label: "Jurisdição Escolhida", ok: !!activeLead.court && !!activeLead.vara },
                                { label: "Dossiês Técnicos (DNA)", ok: (leadInterviews?.length || 0) > 0 },
                                { label: "Logística Judiciária", ok: !!activeLead.courtAddress },
                              ].map((audit, i) => (
                                <div key={i} className="flex items-center justify-between gap-6 p-3 rounded-xl hover:bg-white/5 transition-all group">
                                  <span className="text-xs font-bold text-muted-foreground group-hover:text-white uppercase tracking-wider transition-colors">{audit.label}</span>
                                  {audit.ok ? <Badge className="bg-emerald-500/10 text-emerald-500 border-0 h-6 px-3 text-[10px] font-black uppercase shadow-[0_0_15px_rgba(16,185,129,0.1)]">SANEADO</Badge> : <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-500 bg-amber-500/5 px-3 h-6 font-black uppercase tracking-widest">PENDENTE</Badge>}
                                </div>
                              ))}
                            </div>
                          </Card>
                        </div>

                        <div className="flex-1 space-y-10">
                          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-8 gap-6">
                            <div className="flex items-center gap-6"><div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/5"><Brain className="h-9 w-9 text-primary animate-pulse" /></div><div><h3 className="text-3xl font-black text-white uppercase tracking-tighter">Missão Estratégica</h3><p className="text-xs text-muted-foreground uppercase font-black tracking-widest opacity-50">Diagnóstico consolidado via inteligência de elite.</p></div></div>
                            <Button onClick={handleGenerateStrategicSummary} disabled={isGeneratingSummary} className="h-16 px-12 gold-gradient text-background font-black uppercase text-sm gap-5 rounded-2xl shadow-[0_20px_50px_rgba(245,208,48,0.2)] transition-all hover:scale-105 active:scale-95 group">{isGeneratingSummary ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />} CONSOLIDAR DNA (IA)</Button>
                          </div>

                          {strategicSummary ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500">
                              <Card className="glass border-primary/20 bg-primary/[0.03] p-10 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><FileText className="h-16 w-16" /></div><div className="flex items-center gap-4"><div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(245,208,48,0.5)]" /><h5 className="text-xs font-black text-primary uppercase tracking-[0.4em]">Fatos Relevantes</h5></div><p className="text-base text-white/90 leading-relaxed font-serif text-justify italic whitespace-pre-wrap">{strategicSummary.keyFacts}</p></Card>
                              <Card className="glass border-emerald-500/20 bg-emerald-500/[0.03] p-10 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="h-16 w-16" /></div><div className="flex items-center gap-4"><div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" /><h5 className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em]">Próximos Passos</h5></div><p className="text-base text-white/90 leading-relaxed font-medium whitespace-pre-wrap">{strategicSummary.potentialNextSteps}</p></Card>
                              <Card className="glass border-rose-500/20 bg-rose-500/[0.03] p-10 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><AlertCircle className="h-16 w-16" /></div><div className="flex items-center gap-4"><div className="w-1.5 h-8 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]" /><h5 className="text-xs font-black text-rose-400 uppercase tracking-[0.4em]">Riscos & Desafios</h5></div><p className="text-base text-white/90 leading-relaxed font-medium whitespace-pre-wrap">{strategicSummary.risksAndChallenges}</p></Card>
                              <Card className="glass border-blue-500/20 bg-blue-500/[0.03] p-10 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Target className="h-16 w-16" /></div><div className="flex items-center gap-4"><div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" /><h5 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em]">Análise Tática Final</h5></div><p className="text-base text-white/90 leading-relaxed font-medium whitespace-pre-wrap">{strategicSummary.strategicAnalysis}</p></Card>
                            </div>
                          ) : (
                            <div className="py-56 flex flex-col items-center justify-center space-y-10 glass rounded-[4rem] border-dashed border-2 border-white/5 opacity-30 shadow-inner group"><div className="relative"><Brain className="h-24 w-24 text-muted-foreground group-hover:text-primary transition-colors duration-700" /><div className="absolute -top-4 -right-4"><Sparkles className="h-10 w-10 text-primary animate-pulse" /></div></div><p className="text-sm font-black uppercase tracking-[0.6em] text-center max-w-[450px] leading-loose">Aguardando comando de inteligência para consolidar os dossiês técnicos da banca.</p></div>
                          )}

                          <div className="p-12 rounded-[4rem] bg-purple-500/5 border border-purple-500/20 flex flex-col md:flex-row items-end gap-12 w-full shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group"><div className="absolute top-0 right-0 p-16 opacity-5 group-hover:opacity-10 transition-all duration-1000 -rotate-12 group-hover:rotate-0"><Scale className="h-72 w-72 text-white" /></div><div className="flex-1 space-y-6 w-full relative z-10"><Label className="text-sm font-black text-purple-400 uppercase tracking-[0.3em] flex items-center gap-5"><FileCheck className="h-8 w-8" /> PROTOCOLO CNJ (ESTRUTURAÇÃO) *</Label><Input placeholder="0000000-00.0000.0.00.0000" className="bg-black/60 border-purple-500/30 h-24 text-white font-mono text-4xl font-black w-full tracking-[0.25em] px-12 rounded-3xl focus:ring-4 focus:ring-purple-500/30 shadow-inner transition-all" value={activeLead.processNumber || ""} onChange={(e) => setSelectedLead({...activeLead, processNumber: e.target.value})} /></div><Button onClick={() => setIsConversionOpen(true)} className="gold-gradient text-background font-black h-24 px-20 rounded-3xl uppercase text-lg tracking-[0.4em] shadow-2xl hover:scale-[1.03] transition-all relative z-10 w-full md:w-auto active:scale-95 group">PROTOCOLAR <ChevronRight className="ml-4 h-7 w-7 group-hover:translate-x-3 transition-transform" /></Button></div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              <div className="flex-none p-6 border-t border-white/5 bg-[#0a0f1e] flex items-center justify-between z-20 shadow-[0_-20px_60px_rgba(0,0,0,0.6)]">
                <Button variant="ghost" onClick={handlePrevTab} disabled={!canGoBack} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest gap-4 px-10 h-12 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /> ANTERIOR</Button>
                <div className="hidden md:flex gap-4">{DOSSIER_TABS.map((tab, i) => (<div key={tab} className={cn("w-3 h-3 rounded-full transition-all duration-700", activeDossierTab === tab ? "bg-primary shadow-[0_0_15px_rgba(245,208,48,0.6)] scale-150" : i < currentTabIndex ? "bg-emerald-500" : "bg-white/10")} />))}</div>
                {canGoNext ? <Button onClick={handleNextTab} className="gold-gradient text-black font-black h-12 px-12 rounded-xl uppercase text-[11px] tracking-widest gap-4 shadow-xl transition-all hover:scale-105">PRÓXIMO RITO <ArrowRight className="h-5 w-5" /></Button> : <div className="px-10 h-12 flex items-center bg-white/5 rounded-xl border border-white/5 shadow-inner"><span className="text-[11px] font-black text-primary/60 uppercase tracking-widest flex items-center gap-3"><ShieldCheck className="h-5 w-5" /> FASE FINAL DO RITO</span></div>}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!viewingInterview} onOpenChange={(open) => !open && setViewingInterview(null)}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[85vh]">
          <DialogHeader className="p-6 bg-[#0a0f1e] border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 flex-none shadow-xl space-y-0 text-left">
            <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><FileSearch className="h-6 w-6 text-primary" /></div><div><DialogTitle className="text-white text-xl font-bold uppercase tracking-widest">{viewingInterview?.interviewType}</DialogTitle><DialogDescription className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50 flex items-center gap-2"><span>DR(A). {viewingInterview?.interviewerName}</span></DialogDescription></div></div>
            <div className="flex items-center gap-3">{interviewAnalysis && (<Button onClick={handleExportToGoogleDocs} variant="outline" className="glass border-primary/30 text-primary font-black uppercase text-[10px] gap-2.5 h-11 px-6 rounded-lg shadow-lg hover:bg-primary/10"><FileDown className="h-4 w-4" /> EXPORTAR DOC.NEW</Button>)}<Button onClick={() => handleRunInterviewAnalysis(viewingInterview)} disabled={isAiAnalyzing} className="h-11 px-6 gold-gradient text-background font-black uppercase text-[10px] gap-2.5 rounded-lg shadow-lg">{isAiAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} ANALISAR IA</Button></div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="transcricao" className="h-full flex flex-col">
              <div className="px-6 bg-black/20 border-b border-white/5 flex-none"><TabsList className="bg-transparent h-12 gap-8 p-0"><TabsTrigger value="transcricao" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full tracking-widest">Transcrição Técnica</TabsTrigger><TabsTrigger value="analise" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full tracking-widest">Diagnóstico IA</TabsTrigger></TabsList></div>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="transcricao" className="h-full mt-0"><ScrollArea className="h-full"><div className="p-10 space-y-8 max-w-4xl mx-auto pb-20">{(viewingInterview?.templateSnapshot || Object.keys(viewingInterview?.responses || {})).map((item: any, i: number) => { const label = typeof item === 'string' ? item : item.label; const answer = viewingInterview?.responses?.[label]; if (!answer) return null; return (<div key={i} className="space-y-2 group"><h5 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] group-hover:text-white transition-colors">{label}</h5><p className="text-base text-white/90 font-serif leading-relaxed text-justify border-l-2 border-white/5 pl-6 py-1">{String(answer)}</p></div>) })}</div></ScrollArea></TabsContent>
                <TabsContent value="analise" className="h-full mt-0">{isAiAnalyzing ? (<div className="h-full flex flex-col items-center justify-center space-y-6"><div className="relative"><Brain className="h-16 w-16 text-primary animate-pulse" /><div className="absolute -top-2 -right-2"><Sparkles className="h-6 w-6 text-primary animate-bounce" /></div></div><p className="text-[11px] font-black text-white uppercase tracking-widest animate-pulse">Processando Inteligência RGMJ...</p></div>) : interviewAnalysis ? (<ScrollArea className="h-full"><div className="p-10 space-y-10 max-w-5xl mx-auto pb-20"><Card className="glass border-primary/20 bg-primary/5 p-8 rounded-2xl shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-5"><Brain className="h-20 w-20" /></div><div className="flex items-center gap-3 mb-6"><div className="w-1.5 h-6 bg-primary rounded-full" /><h5 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Resumo Executivo dos Fatos</h5></div><p className="text-lg text-white font-serif leading-loose text-justify italic whitespace-pre-wrap">{interviewAnalysis.summary}</p></Card><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><Card className="glass border-rose-500/20 bg-rose-500/5 p-8 rounded-2xl shadow-xl"><div className="flex items-center gap-3 mb-6"><div className="w-1.5 h-6 bg-rose-500 rounded-full" /><h5 className="text-[11px] font-black text-rose-400 uppercase tracking-[0.3em]">Teses & Riscos Processuais</h5></div><p className="text-sm text-white/90 font-serif leading-relaxed text-justify whitespace-pre-wrap">{interviewAnalysis.legalAnalysis}</p></Card><Card className="glass border-emerald-500/20 bg-emerald-500/5 p-8 rounded-2xl shadow-xl"><div className="flex items-center gap-3 mb-6"><div className="w-1.5 h-6 bg-emerald-500 rounded-full" /><h5 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em]">Recomendações & Provas</h5></div><p className="text-sm text-white/90 font-serif leading-relaxed text-justify whitespace-pre-wrap">{interviewAnalysis.recommendations}</p></Card></div></div></ScrollArea>) : (<div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4"><Sparkles className="h-16 w-16" /><p className="text-[11px] font-black uppercase tracking-[0.5em]">Aguardando Comando de Inteligência</p></div>)}</TabsContent>
              </div>
            </Tabs>
          </div>
          <DialogFooter className="p-6 bg-black/40 border-t border-white/5 flex-none"><Button onClick={() => setViewingInterview(null)} className="h-12 px-10 glass border-white/10 text-white font-black uppercase text-[11px] tracking-widest rounded-xl hover:bg-white/5 transition-all">FECHAR DOSSIÊ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}><DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl"><DialogHeader className="p-5 bg-[#0a0f1e] border-b border-white/5 text-left"><DialogTitle className="text-white font-bold uppercase tracking-widest text-lg">Atendimento Técnico Estratégico</DialogTitle><DialogDescription className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">Rito de captura de DNA jurídico RGMJ.</DialogDescription></DialogHeader>{executingTemplate && (<DynamicInterviewExecution template={executingTemplate} leadId={activeLead.id} onSubmit={handleFinishInterview} onCancel={() => setIsInterviewDialogOpen(false)} />)}</DialogContent></Dialog>
      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}><DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[80vh]"><DialogHeader className="p-5 bg-[#0a0f1e] border-b border-white/5 flex-none text-left"><DialogTitle className="text-white text-lg font-bold uppercase tracking-widest">Migração para Acervo Ativo</DialogTitle><DialogDescription className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">Conversão estratégica de Lead em Processo Judicial.</DialogDescription></DialogHeader><div className="flex-1 min-h-0">{activeLead && (<ProcessForm initialData={{ clientName: activeLead.name, clientId: activeLead.id, defendantName: activeLead.defendantName, caseType: activeLead.type, court: activeLead.court, vara: activeLead.vara, processNumber: activeLead.processNumber || "", responsibleStaffId: user?.uid }} onSubmit={handleConvertProcess} onCancel={() => setIsConversionOpen(false)} />)}</div></DialogContent></Dialog>
      <Sheet open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}><SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl h-full"><SheetHeader className="p-5 border-b border-white/5 bg-[#0a0f1e] shadow-xl flex-none"><SheetTitle className="text-lg font-bold text-white uppercase tracking-widest">Novo Atendimento</SheetTitle></SheetHeader><div className="flex-1 min-h-0"><LeadForm existingLeads={leads} onSubmit={handleCreateLead} onSelectExisting={(l) => { handleOpenLead(l); setIsNewEntryOpen(false); }} onCancel={() => setIsNewEntryOpen(false)} defaultResponsibleLawyer={user?.displayName || ""} /></div></SheetContent></Sheet>
      <Sheet open={isEditModeOpen} onOpenChange={setIsEditModeOpen}><SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl h-full"><SheetHeader className="p-5 border-b border-white/5 bg-[#0a0f1e] shadow-xl flex-none"><SheetTitle className="text-lg font-bold text-white uppercase tracking-widest">Qualificação Estratégica</SheetTitle></SheetHeader><div className="flex-1 min-h-0">{activeLead && (<LeadForm existingLeads={[]} initialData={activeLead} lockMode={true} onSubmit={async (data) => { await updateDocumentNonBlocking(doc(db!, "leads", activeLead.id), { ...data, updatedAt: serverTimestamp() }); setIsEditModeOpen(false); toast({ title: "Qualificação Atualizada" }) }} onSelectExisting={() => {}} onCancel={() => setIsEditModeOpen(false)} />)}</div></SheetContent></Sheet>
      
      {/* DIÁLOGO LANÇAR PRAZO - FIDELIDADE ABSOLUTA AO MODELO REFERÊNCIA */}
      <Dialog open={isDeadlineOpen} onOpenChange={setIsDeadlineOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[750px] w-[95vw] h-[90vh] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none">
            <DialogHeader className="flex flex-row items-center gap-5 space-y-0 text-left">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-white font-black uppercase tracking-tighter text-2xl flex items-center gap-3">
                  Lançar Prazo Judicial
                </DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-50">
                  Configure o compromisso fatal para: <span className="text-white">{activeLead?.name}</span>
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1 w-full h-full">
            <div className="p-10 space-y-10 bg-[#0a0f1e]/50 pb-20">
              
              {/* SEÇÃO DESPACHO IA */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                    <FileText className="h-4 w-4" /> Texto da Publicação / Despacho
                  </Label>
                  <Button 
                    onClick={handleAiParsePublication} 
                    disabled={isAnalyzing || !publicationText}
                    variant="outline" 
                    className="h-10 border-primary/30 text-primary font-black uppercase text-[9px] tracking-widest hover:bg-primary/10 transition-all gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                    ANALISAR COM IA
                  </Button>
                </div>
                <Textarea 
                  placeholder="Cole aqui o texto oficial do Diário da Justiça para que a IA ajude no preenchimento..." 
                  className="bg-black/40 border-white/10 min-h-[120px] text-white text-xs font-bold p-5 rounded-2xl resize-none uppercase"
                  value={publicationText}
                  onChange={(e) => setPublicationText(e.target.value.toUpperCase())}
                />
              </div>

              {/* TIPO E CONTADORES */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-7 space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Tipo de Prazo *</Label>
                  <Select value={deadlineData.title} onValueChange={v => setDeadlineData({...deadlineData, title: v})}>
                    <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white font-bold text-sm">
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      {["Manifestação", "Petição Inicial", "Réplica", "Recurso Ordinário", "Contestação", "Cumprimento de Sentença"].map(t => (
                        <SelectItem key={t} value={t.toUpperCase()}>{t.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-5 flex gap-2">
                  <div className="flex-1 bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-black text-primary uppercase mb-1">Dias Úteis</p>
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-3 w-3 text-primary fill-primary" />
                      <span className="text-xl font-black text-white">0</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Corridos</p>
                    <div className="flex items-center justify-center gap-2">
                      <CalendarDays className="h-3 w-3 text-muted-foreground opacity-40" />
                      <span className="text-xl font-black text-white">0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* METODOLOGIA */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Metodologia de Contagem</Label>
                <RadioGroup 
                  value={deadlineData.calculationType} 
                  onValueChange={(v) => setDeadlineData({...deadlineData, calculationType: v})}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className={cn(
                    "p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4",
                    deadlineData.calculationType === "Dias Úteis (CPC/CLT)" ? "bg-primary/5 border-primary shadow-lg shadow-primary/10" : "bg-black/20 border-white/5"
                  )} onClick={() => setDeadlineData({...deadlineData, calculationType: "Dias Úteis (CPC/CLT)"})}>
                    <RadioGroupItem value="Dias Úteis (CPC/CLT)" className="border-primary text-primary" />
                    <div>
                      <p className="text-[11px] font-black text-white uppercase">Dias Úteis (CPC/CLT)</p>
                      <p className="text-[9px] text-muted-foreground uppercase mt-0.5">Exclui sábados e domingos</p>
                    </div>
                  </div>
                  <div className={cn(
                    "p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4",
                    deadlineData.calculationType === "Dias Corridos (Material)" ? "bg-primary/5 border-primary shadow-lg shadow-primary/10" : "bg-black/20 border-white/5"
                  )} onClick={() => setDeadlineData({...deadlineData, calculationType: "Dias Corridos (Material)"})}>
                    <RadioGroupItem value="Dias Corridos (Material)" className="border-primary text-primary" />
                    <div>
                      <p className="text-[11px] font-black text-white uppercase">Dias Corridos (Material)</p>
                      <p className="text-[9px] text-muted-foreground uppercase mt-0.5">Conta todos os dias</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* CALCULADORA */}
              <div className="p-8 rounded-3xl border-2 border-primary/20 bg-primary/5 space-y-6 shadow-2xl relative overflow-hidden group">
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
                      className="bg-black/60 border-white/10 h-16 text-white font-black text-2xl text-center rounded-2xl focus:border-primary/50"
                      value={deadlineDuration}
                      onChange={(e) => setDeadlineDuration(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleApplyDeadlineCalculation}
                    variant="outline" 
                    className="h-16 px-10 border-primary text-primary font-black uppercase text-xs tracking-widest gap-3 hover:bg-primary hover:text-background transition-all rounded-2xl"
                  >
                    <Zap className="h-5 w-5" /> APLICAR PRAZO
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic font-medium uppercase tracking-tight opacity-50">
                  O cálculo excluirá o dia da publicação e seguirá a metodologia acima.
                </p>
              </div>

              {/* DATAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Data da Publicação *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                    <Input 
                      type="date" 
                      className="bg-black/40 border-white/10 h-14 pl-12 text-white font-bold rounded-xl" 
                      value={deadlineData.pubDate} 
                      onChange={e => setDeadlineData({...deadlineData, pubDate: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <TriangleAlert className="h-3.5 w-3.5" /> Data Fatal (Vencimento) *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500/40" />
                    <Input 
                      type="date" 
                      className="bg-black/40 border-rose-500/30 h-14 pl-12 text-rose-400 font-black rounded-xl focus:border-rose-500" 
                      value={deadlineData.fatalDate} 
                      onChange={e => setDeadlineData({...deadlineData, fatalDate: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              {/* OBSERVAÇÕES */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Observações Estratégicas</Label>
                <Textarea 
                  placeholder="Observações internas sobre o cumprimento deste prazo..." 
                  className="bg-black/40 border-white/10 min-h-[140px] text-white text-xs font-bold p-6 rounded-2xl resize-none uppercase"
                  value={deadlineData.description}
                  onChange={e => setDeadlineData({...deadlineData, description: e.target.value.toUpperCase()})}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 flex-none">
            <button 
              onClick={() => setIsDeadlineOpen(false)} 
              className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 hover:text-white transition-colors"
            >
              CANCELAR
            </button>
            <Button 
              onClick={handleLaunchDeadline} 
              className="bg-[#f5d030] hover:bg-[#ffcc00] text-background font-black uppercase text-[12px] tracking-[0.25em] px-16 h-16 rounded-2xl shadow-[0_15px_40px_rgba(245,208,48,0.25)] transition-all hover:scale-[1.03] active:scale-95 gap-4"
            >
              <Calendar className="h-5 w-5" /> CONFIRMAR LANÇAMENTO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSchedulingIntake} onOpenChange={setIsSchedulingIntake}><DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-2xl"><div className="p-6 bg-[#0a0f1e] border-b border-white/5"><DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left"><Clock className="h-6 w-6 text-amber-500" /><div><DialogTitle className="text-white font-bold uppercase tracking-widest">Agendar Atendimento</DialogTitle><DialogDescription className="text-[9px] uppercase font-black text-muted-foreground">Configure a data e hora do rito de triagem.</DialogDescription></div></DialogHeader></div><ScrollArea className="max-h-[60vh]"><div className="p-8 space-y-6"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase">Data</Label><Input type="date" className="glass h-12 text-white" value={intakeData.date} onChange={e => setIntakeData({...intakeData, date: e.target.value})} /></div><div className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase">Hora</Label><Input type="time" className="glass h-12 text-white" value={intakeData.time} onChange={e => setIntakeData({...intakeData, time: e.target.value})} /></div></div><div className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase">Modalidade</Label><Select value={intakeData.type} onValueChange={v => setIntakeData({...intakeData, type: v})}><SelectTrigger className="glass h-12 text-white uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#0d121f] text-white"><SelectItem value="online">🖥️ ONLINE / VIRTUAL</SelectItem><SelectItem value="presencial">🏢 PRESENCIAL (SEDE)</SelectItem></SelectContent></Select></div></div></ScrollArea><DialogFooter className="p-6 bg-black/40 border-t border-white/5"><Button variant="ghost" onClick={() => setIsSchedulingIntake(false)} className="text-muted-foreground uppercase font-black text-[10px]">Cancelar</Button><Button onClick={handleScheduleIntake} className="gold-gradient text-background font-black uppercase text-[10px] px-8 h-12 rounded-xl">Confirmar Agenda</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
