
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
  Scale
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

const columns = [
  { id: "novo", title: "NOVO LEAD", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-emerald-400" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

const DOSSIER_TABS = ["overview", "captura", "dossies", "burocracia", "revisao"]

export default function LeadsPage() {
  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const leadsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "leads"), orderBy("updatedAt", "desc"), limit(100))
  }, [db, user])

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

  const templatesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "checklists"), orderBy("title", "asc"))
  }, [db, user])
  const { data: templates } = useCollection(templatesQuery)

  const leadInterviewsQuery = useMemoFirebase(() => {
    const leadId = activeLead?.id
    if (!user || !db || !leadId) return null
    return query(
      collection(db!, "interviews"), 
      where("clientId", "==", leadId), 
      orderBy("createdAt", "desc")
    )
  }, [db, user, activeLead?.id])
  const { data: leadInterviews, isLoading: isLoadingInterviews } = useCollection(leadInterviewsQuery)

  const currentTabIndex = DOSSIER_TABS.indexOf(activeDossierTab)
  const canGoBack = currentTabIndex > 0
  const canGoNext = currentTabIndex < DOSSIER_TABS.length - 1

  const handleNextTab = () => { if (canGoNext) setActiveDossierTab(DOSSIER_TABS[currentTabIndex + 1]) }
  const handlePrevTab = () => { if (canGoBack) setActiveDossierTab(DOSSIER_TABS[currentTabIndex - 1]) }

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
    addDocumentNonBlocking(collection(db!, "interviews"), { 
      clientId: activeLead.id, 
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
      if (db) updateDocumentNonBlocking(doc(db, "interviews", interview.id), { aiAnalysis: result, updatedAt: serverTimestamp() })
    } catch (e) { toast({ variant: "destructive", title: "Erro Análise" }) } finally { setIsAiAnalyzing(false) }
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
    setIsConversionOpen(false); setIsSheetOpen(false); toast({ title: "Processo Ativo" })
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
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
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

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-6"><Loader2 className="h-10 w-10 animate-spin text-primary" /><span className="text-xs font-bold uppercase tracking-widest">Auditando Banco...</span></div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-12 scrollbar-hide min-h-[700px]">
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
                        <Card 
                          className={cn(
                            "glass hover-gold transition-all cursor-grab active:cursor-grabbing border-white/5 shadow-lg rounded-xl overflow-hidden", 
                            draggedLeadId === lead.id && "opacity-50"
                          )} 
                          onClick={() => handleOpenLead(lead)}
                        >
                          <CardContent className="p-4 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1 min-w-0"><div className="font-bold text-sm text-white group-hover:text-primary uppercase truncate">{lead.name}</div><span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">ID: {lead.id.substring(0, 8).toUpperCase()}</span></div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><button className="h-7 w-7 text-white/20 hover:text-white"><MoreVertical className="h-4 w-4" /></button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0d121f] border-white/10 text-white w-44"><DropdownMenuItem onClick={() => handleOpenLead(lead)}>Ver Dossiê</DropdownMenuItem><DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="text-rose-500">Excluir</DropdownMenuItem></DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <div className="flex gap-1.5">
                                {lead.cpf && <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5 uppercase">CPF OK</Badge>}
                                {(leadInterviews?.filter(i => i.clientId === lead.id).length || 0) > 0 && <Badge variant="outline" className="text-[8px] border-primary/20 text-primary bg-primary/5 uppercase">DNA CAPTURADO</Badge>}
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
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className={cn("glass border-white/10 p-0 bg-[#05070a] shadow-2xl flex flex-col h-full", getDrawerWidthClass())}>
          {activeLead && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 border-b border-white/5 bg-[#0a0f1e] z-10 flex-none shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><Fingerprint className="h-5 w-5 text-primary" /></div>
                    <div className="space-y-0.5">
                      <SheetTitle className="text-lg font-bold uppercase text-white">{activeLead.name}</SheetTitle>
                      <SheetDescription className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2"><span>ID {activeLead.id.toUpperCase()}</span></SheetDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleDeleteLead(activeLead.id)} variant="outline" className="h-9 text-[9px] font-black uppercase px-4 rounded-lg text-rose-400 border-white/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                    <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="h-9 text-[9px] font-black uppercase px-4 rounded-lg text-primary border-white/10">EDITAR</Button>
                    <Button onClick={() => setIsSheetOpen(false)} variant="ghost" className="h-9 text-[9px] font-black uppercase text-muted-foreground hover:text-white"><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="p-4 bg-[#0a0f1e]/60 border-b border-white/5 flex-none">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Status", value: activeLead.status?.toUpperCase() || "NOVO", icon: Zap, color: "text-primary" },
                    { label: "Réu", value: activeLead.defendantName || "---", icon: Building, color: "text-muted-foreground" },
                    { label: "Canal", value: activeLead.phone, icon: Phone, color: "text-emerald-500" },
                    { label: "Jurisdição", value: activeLead.city || "---", icon: MapPin, color: "text-muted-foreground" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-black/20 border border-white/5", item.color)}><item.icon className="h-4 w-4" /></div>
                      <div className="min-w-0"><p className="text-[8px] font-black text-muted-foreground uppercase opacity-50">{item.label}</p><p className="text-[10px] font-bold text-white uppercase truncate">{item.value}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 bg-[#05070a]">
                <div className="p-6 space-y-6 w-full max-w-[1400px] mx-auto pb-32">
                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-6">
                    <TabsList className="bg-white/5 border border-white/10 h-12 p-1 gap-1 w-full justify-start rounded-xl mb-6 shadow-inner">
                      <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[10px] uppercase h-full px-6 rounded-lg gap-2 transition-all flex items-center tracking-widest">
                        <LayoutGrid className="h-3.5 w-3.5" /> OVERVIEW
                      </TabsTrigger>
                      <TabsTrigger value="captura" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[10px] uppercase h-full px-6 rounded-lg gap-2 transition-all flex items-center tracking-widest">
                        <Zap className="h-3.5 w-3.5" /> CAPTURA
                      </TabsTrigger>
                      <TabsTrigger value="dossies" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[10px] uppercase h-full px-6 rounded-lg gap-2 transition-all flex items-center tracking-widest">
                        <MessageSquare className="h-3.5 w-3.5" /> DOSSIÊS {leadInterviews && leadInterviews.length > 0 && <Badge className="bg-emerald-500/20 text-emerald-500 ml-1 border-0 h-4 px-1.5 text-[8px]">{leadInterviews.length}</Badge>}
                      </TabsTrigger>
                      <TabsTrigger value="burocracia" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[10px] uppercase h-full px-6 rounded-lg gap-2 transition-all flex items-center tracking-widest">
                        <ClipboardList className="h-3.5 w-3.5" /> BUROCRACIA
                      </TabsTrigger>
                      <TabsTrigger value="revisao" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[10px] uppercase h-full px-6 rounded-lg gap-2 transition-all flex items-center tracking-widest">
                        <ShieldCheck className="h-3.5 w-3.5" /> REVISÃO
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="animate-in fade-in duration-500 outline-none w-full">
                      <div className="grid grid-cols-2 gap-6">
                        <Card className="glass border-white/5 p-6 rounded-2xl shadow-xl bg-white/[0.01] relative overflow-hidden group cursor-pointer hover:border-amber-500/30 transition-all" onClick={() => setIsSchedulingIntake(true)}>
                          <div className="flex items-center justify-between mb-4"><h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Clock className="h-4 w-4" /> Cronograma</h4></div>
                          <div className="space-y-3">
                            <p className="text-lg font-bold text-white uppercase tracking-tighter">{activeLead.scheduledDate ? `${new Date(activeLead.scheduledDate).toLocaleDateString()} ${activeLead.scheduledTime}` : "AGUARDANDO"}</p>
                            <Badge variant="outline" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{activeLead.meetingLocation || "LOCAL A DEFINIR"}</Badge>
                          </div>
                        </Card>
                        <Card className="glass border-primary/15 p-6 rounded-2xl shadow-xl bg-primary/5 relative overflow-hidden">
                          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 mb-4"><Brain className="h-4 w-4" /> Síntese Estratégica</h4>
                          <p className="text-sm text-white/80 leading-relaxed italic font-medium">{activeLead.aiSummary || "Aguardando capturas técnicas."}</p>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="captura" className="w-full space-y-10 animate-in fade-in duration-700 outline-none">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Nova Captura Técnica</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {templates?.map(t => (
                            <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-white/10 text-white font-black uppercase text-[10px] h-16 gap-4 rounded-xl justify-start px-5 hover:border-primary/40 hover:bg-primary/5 transition-all group border-2">
                              <Zap className="h-4 w-4 text-primary shrink-0" /><span className="truncate flex-1 text-left tracking-tight">{t.title}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="dossies" className="w-full space-y-10 animate-in fade-in duration-700 outline-none">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">
                            Dossiês Concluídos {(leadInterviews?.length || 0) > 0 && <Badge className="bg-emerald-500/20 text-emerald-500 ml-2 border-0 font-black h-5">{leadInterviews.length}</Badge>}
                          </h3>
                        </div>
                        {isLoadingInterviews ? (
                          <div className="py-20 flex flex-col items-center justify-center opacity-40 gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-[10px] font-black uppercase tracking-[0.4em]">Auditando...</p></div>
                        ) : leadInterviews && leadInterviews.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {leadInterviews.map((int) => (
                              <Card key={int.id} className="glass border-white/5 hover:border-primary/20 transition-all p-0 rounded-2xl bg-white/[0.01] flex flex-col group shadow-2xl relative overflow-hidden">
                                {int.aiAnalysis && <div className="absolute top-0 right-0 p-4"><Sparkles className="h-4 w-4 text-primary animate-pulse" /></div>}
                                <div className="p-6 space-y-6 flex-1">
                                  <div className="flex justify-between items-start"><Badge variant="outline" className="text-[8px] font-black uppercase border-emerald-500/30 text-emerald-500 h-6">CONCLUÍDO</Badge><span className="text-[9px] font-mono text-muted-foreground uppercase opacity-40">{int.createdAt?.toDate ? new Date(int.createdAt.toDate()).toLocaleDateString() : '---'}</span></div>
                                  <h4 className="text-sm font-bold text-white uppercase tracking-tight line-clamp-2 leading-snug">{int.interviewType}</h4>
                                  <div className="flex items-center gap-2.5 pt-4 border-t border-white/5"><Avatar className="h-6 w-6 border border-white/10"><AvatarFallback className="bg-secondary text-[8px] font-black text-primary">{int.interviewerName?.substring(0, 2)}</AvatarFallback></Avatar><span className="text-[9px] font-black text-muted-foreground uppercase">Dr(a). {int.interviewerName}</span></div>
                                </div>
                                <div className="p-4 bg-white/[0.02] border-t border-white/5 grid grid-cols-2 gap-2">
                                  <Button variant="ghost" onClick={() => { setViewingInterview(int); setInterviewAnalysis(int.aiAnalysis || null); }} className="h-10 text-white font-black uppercase text-[9px] rounded-lg hover:bg-white/5 gap-2"><FileSearch className="h-3.5 w-3.5" /> DOSSIÊ</Button>
                                  <Button onClick={() => handleRunInterviewAnalysis(int)} className="h-10 glass border-primary/20 text-primary font-black uppercase text-[9px] rounded-lg hover:bg-primary hover:text-background gap-2 shadow-lg"><Brain className="h-3.5 w-3.5" /> ANALISAR IA</Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="py-32 flex flex-col items-center justify-center opacity-20 space-y-6 glass rounded-[2.5rem] border-dashed border-2 border-white/5 bg-white/[0.01]"><ClipboardList className="h-10 w-10 text-muted-foreground" /><p className="text-[11px] font-black uppercase tracking-[0.5em]">Nenhuma captura realizada</p></div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="burocracia" className="w-full">
                      <BurocraciaView lead={activeLead} interviews={leadInterviews || []} onEdit={() => setIsEditModeOpen(true)} />
                    </TabsContent>

                    <TabsContent value="revisao" className="w-full space-y-8 animate-in fade-in duration-700 outline-none">
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="w-full lg:w-80 flex-none space-y-6">
                          <Card className="glass border-white/5 bg-black/40 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-5 bg-white/[0.03] border-b border-white/5 flex items-center gap-3">
                              <ShieldCheck className="h-5 w-5 text-emerald-500" />
                              <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Integridade DNA</h4>
                            </div>
                            <div className="p-5 space-y-4">
                              {[
                                { label: "Polo Ativo", ok: !!activeLead.name && !!activeLead.cpf },
                                { label: "Polo Passivo", ok: !!activeLead.defendantName },
                                { label: "Jurisdição", ok: !!activeLead.court && !!activeLead.vara },
                                { label: "DNA Jurídico", ok: (leadInterviews?.length || 0) > 0 },
                                { label: "Audit Logístico", ok: !!activeLead.courtAddress },
                              ].map((audit, i) => (
                                <div key={i} className="flex items-center justify-between gap-4">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{audit.label}</span>
                                  {audit.ok ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-0 h-5 px-2 text-[8px] font-black uppercase">SANEADO</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[8px] border-amber-500/20 text-amber-500 bg-amber-500/5 px-2 h-5 font-black uppercase">PENDENTE</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </Card>

                          <div className="p-6 rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center text-center space-y-4 opacity-40">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">O protocolo criará um novo processo no acervo ativo.</p>
                          </div>
                        </div>

                        <div className="flex-1 space-y-8">
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Brain className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Análise Estratégica Consolidada</h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">Diagnóstico unificado de todas as entrevistas.</p>
                              </div>
                            </div>
                            <Button 
                              onClick={handleGenerateStrategicSummary} 
                              disabled={isGeneratingSummary} 
                              className="h-12 px-8 gold-gradient text-background font-black uppercase text-[11px] gap-3 rounded-xl shadow-xl transition-all hover:scale-105"
                            >
                              {isGeneratingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              CONSOLIDAR DNA (IA)
                            </Button>
                          </div>

                          {strategicSummary ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-500">
                              <Card className="glass border-primary/20 bg-primary/5 p-6 rounded-2xl space-y-4 shadow-xl">
                                <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Fatos Relevantes</h5>
                                <p className="text-xs text-white/90 leading-relaxed font-medium text-justify italic">{strategicSummary.keyFacts}</p>
                              </Card>
                              <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-6 rounded-2xl space-y-4">
                                <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Próximos Passos</h5>
                                <p className="text-xs text-white/90 leading-relaxed font-medium">{strategicSummary.potentialNextSteps}</p>
                              </Card>
                              <Card className="glass border-rose-500/20 bg-rose-500/5 p-6 rounded-2xl space-y-4">
                                <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5" /> Riscos & Desafios</h5>
                                <p className="text-xs text-white/90 leading-relaxed font-medium">{strategicSummary.risksAndChallenges}</p>
                              </Card>
                              <Card className="glass border-blue-500/20 bg-blue-500/5 p-6 rounded-2xl space-y-4">
                                <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2"><Target className="h-3.5 w-3.5" /> Análise Tática</h5>
                                <p className="text-xs text-white/90 leading-relaxed font-medium">{strategicSummary.strategicAnalysis}</p>
                              </Card>
                            </div>
                          ) : (
                            <div className="py-32 flex flex-col items-center justify-center space-y-6 glass rounded-[3rem] border-dashed border-2 border-white/5 opacity-20">
                              <Brain className="h-16 w-16 text-muted-foreground" />
                              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-center max-w-[300px]">Aguardando consolidação de dados para gerar o parecer estratégico.</p>
                            </div>
                          )}

                          <div className="p-8 rounded-[2.5rem] bg-purple-500/5 border border-purple-500/20 flex flex-col md:flex-row items-end gap-8 w-full shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><Scale className="h-40 w-40" /></div>
                            <div className="flex-1 space-y-4 w-full relative z-10">
                              <Label className="text-[11px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-3">
                                <FileCheck className="h-5 w-5" /> PROTOCOLO CNJ (AUTOMAÇÃO) *
                              </Label>
                              <Input 
                                placeholder="0000000-00.0000.0.00.0000" 
                                className="bg-black/60 border-purple-500/30 h-16 text-white font-mono text-2xl font-black w-full tracking-[0.2em] px-8 rounded-2xl focus:ring-1 focus:ring-purple-500/50" 
                                value={activeLead.processNumber || ""} 
                                onChange={(e) => setSelectedLead({...activeLead, processNumber: e.target.value})} 
                              />
                            </div>
                            <Button 
                              onClick={() => setIsConversionOpen(true)} 
                              className="gold-gradient text-black font-black h-16 px-12 rounded-2xl uppercase text-[13px] tracking-widest shadow-2xl hover:scale-[1.02] transition-all relative z-10 w-full md:w-auto"
                            >
                              PROTOCOLAR E CONVERTER
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              <div className="flex-none p-4 border-t border-white/5 bg-[#0a0f1e] flex items-center justify-between z-20 shadow-2xl">
                <Button variant="ghost" onClick={handlePrevTab} disabled={!canGoBack} className="text-muted-foreground uppercase font-black text-[9px] tracking-widest gap-2.5 px-6 h-10 hover:text-white"><ArrowLeft className="h-4 w-4" /> ANTERIOR</Button>
                <div className="hidden md:flex gap-3">{DOSSIER_TABS.map((tab, i) => (<div key={tab} className={cn("w-2.5 h-2.5 rounded-full transition-all duration-500", activeDossierTab === tab ? "bg-primary shadow-[0_0_8px_rgba(245,208,48,0.5)] scale-125" : i < currentTabIndex ? "bg-emerald-500" : "bg-white/10")} />))}</div>
                {canGoNext ? <Button onClick={handleNextTab} className="gold-gradient text-black font-black h-10 px-8 rounded-lg uppercase text-[9px] tracking-widest gap-2.5 shadow-lg">PRÓXIMO RITO <ArrowRight className="h-4 w-4" /></Button> : <div className="px-6 h-10 flex items-center bg-white/5 rounded-lg border border-white/5"><span className="text-[9px] font-black text-primary/60 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> FASE FINAL</span></div>}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!viewingInterview} onOpenChange={(open) => !open && setViewingInterview(null)}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[80vh]">
          <DialogHeader className="p-5 bg-[#0a0f1e] border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 flex-none shadow-xl space-y-0 text-left">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><FileSearch className="h-5 w-5 text-primary" /></div>
              <div>
                <DialogTitle className="text-white text-lg font-bold uppercase tracking-widest">{viewingInterview?.interviewType}</DialogTitle>
                <DialogDescription className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-50 flex items-center gap-2"><span>DR(A). {viewingInterview?.interviewerName}</span></DialogDescription>
              </div>
            </div>
            <Button onClick={() => handleRunInterviewAnalysis(viewingInterview)} disabled={isAiAnalyzing} className="h-10 px-5 gold-gradient text-background font-black uppercase text-[9px] gap-2.5 rounded-lg shadow-lg">{isAiAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} ANALISAR IA</Button>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="transcricao" className="h-full flex flex-col">
              <div className="px-5 bg-black/20 border-b border-white/5 flex-none"><TabsList className="bg-transparent h-10 gap-6 p-0"><TabsTrigger value="transcricao" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full tracking-widest">Transcrição</TabsTrigger><TabsTrigger value="analise" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full tracking-widest">Análise IA</TabsTrigger></TabsList></div>
              <div className="flex-1 overflow-hidden p-5">
                <TabsContent value="transcricao" className="h-full mt-0"><ScrollArea className="h-full pr-4"><div className="space-y-5 max-w-3xl mx-auto pb-10">{(viewingInterview?.templateSnapshot || Object.keys(viewingInterview?.responses || {})).map((item: any, i: number) => {
                  const label = typeof item === 'string' ? item : item.label; const answer = viewingInterview?.responses?.[label]; if (!answer) return null;
                  return (<div key={i} className="space-y-1.5"><h5 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</h5><p className="text-sm text-white font-medium uppercase leading-relaxed text-justify border-l border-white/5 pl-3">{String(answer)}</p></div>)
                })}</div></ScrollArea></TabsContent>
                <TabsContent value="analise" className="h-full mt-0">{isAiAnalyzing ? (<div className="h-full flex flex-col items-center justify-center space-y-4"><Brain className="h-12 w-12 text-primary animate-pulse" /><p className="text-[10px] font-bold text-white uppercase tracking-widest">Processando...</p></div>) : interviewAnalysis ? (<ScrollArea className="h-full pr-4"><div className="space-y-6 max-w-4xl mx-auto pb-10"><Card className="glass border-primary/20 bg-primary/5 p-5 rounded-2xl shadow-lg"><div className="flex items-center justify-between mb-3"><h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Resumo Executivo</h5></div><p className="text-sm text-white/90 leading-relaxed font-medium">{interviewAnalysis.summary}</p></Card><div className="grid grid-cols-2 gap-4"><Card className="glass border-rose-500/20 bg-rose-500/5 p-5 rounded-2xl"><h5 className="text-[10px] font-black text-rose-500 uppercase mb-3">Teses & Riscos</h5><p className="text-xs text-white/80 leading-relaxed font-medium">{interviewAnalysis.legalAnalysis}</p></Card><Card className="glass border-emerald-500/20 bg-emerald-500/5 p-5 rounded-2xl"><h5 className="text-[10px] font-black text-emerald-500 uppercase mb-3">Recomendações</h5><p className="text-xs text-white/80 leading-relaxed font-medium">{interviewAnalysis.recommendations}</p></Card></div></div></ScrollArea>) : (<div className="h-full flex flex-col items-center justify-center opacity-20 space-y-3"><Sparkles className="h-10 w-10" /><p className="text-[10px] font-black uppercase tracking-widest">Aguardando Comando</p></div>)}</TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl">
          <DialogHeader className="p-5 bg-[#0a0f1e] border-b border-white/5 text-left">
            <DialogTitle className="text-white font-bold uppercase tracking-widest text-lg">Atendimento Técnico Estratégico</DialogTitle>
            <DialogDescription className="sr-only">Rito de captura de DNA jurídico RGMJ.</DialogDescription>
          </DialogHeader>
          {executingTemplate && (<DynamicInterviewExecution template={executingTemplate} onSubmit={handleFinishInterview} onCancel={() => setIsInterviewDialogOpen(false)} />)}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[80vh]">
          <DialogHeader className="p-5 bg-[#0a0f1e] border-b border-white/5 flex-none text-left">
            <DialogTitle className="text-white text-lg font-bold uppercase tracking-widest">Migração para Acervo Ativo</DialogTitle>
            <DialogDescription className="sr-only">Conversão estratégica de Lead em Processo Judicial.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">{activeLead && (<ProcessForm initialData={{ clientName: activeLead.name, clientId: activeLead.id, defendantName: activeLead.defendantName, caseType: activeLead.type, court: activeLead.court, vara: activeLead.vara, processNumber: activeLead.processNumber || "", responsibleStaffId: user?.uid }} onSubmit={handleConvertProcess} onCancel={() => setIsConversionOpen(false)} />)}</div>
        </DialogContent>
      </Dialog>
      
      <Sheet open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}><SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl h-full"><SheetHeader className="p-5 border-b border-white/5 bg-[#0a0f1e] shadow-xl flex-none"><SheetTitle className="text-lg font-bold text-white uppercase tracking-widest">Novo Atendimento</SheetTitle></SheetHeader><div className="flex-1 min-h-0"><LeadForm existingLeads={leads} onSubmit={(data) => { addDocumentNonBlocking(collection(db!, "leads"), { ...data, assignedStaffId: user?.uid, status: "novo", driveStatus: "pendente", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); setIsNewEntryOpen(false); toast({ title: "Atendimento Iniciado" }) }} onSelectExisting={(l) => { handleOpenLead(l); setIsNewEntryOpen(false); }} onCancel={() => setIsNewEntryOpen(false)} defaultResponsibleLawyer={user?.displayName || ""} /></div></SheetContent></Sheet>
      <Sheet open={isEditModeOpen} onOpenChange={setIsEditModeOpen}><SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl h-full"><SheetHeader className="p-5 border-b border-white/5 bg-[#0a0f1e] shadow-xl flex-none"><SheetTitle className="text-lg font-bold text-white uppercase tracking-widest">Qualificação Estratégica</SheetTitle></SheetHeader><div className="flex-1 min-h-0">{activeLead && (<LeadForm existingLeads={[]} initialData={activeLead} lockMode={true} onSubmit={async (data) => { await updateDocumentNonBlocking(doc(db!, "leads", activeLead.id), { ...data, updatedAt: serverTimestamp() }); setIsEditModeOpen(false); toast({ title: "Qualificação Atualizada" }) }} onSelectExisting={() => {}} onCancel={() => setIsEditModeOpen(false)} />)}</div></SheetContent></Sheet>
      
      <Dialog open={isSchedulingIntake} onOpenChange={setIsSchedulingIntake}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-6 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left">
              <Clock className="h-6 w-6 text-amber-500" />
              <div>
                <DialogTitle className="text-white font-bold uppercase tracking-widest">Agendar Atendimento</DialogTitle>
                <DialogDescription className="text-[9px] uppercase font-black text-muted-foreground">Configure a data e hora do rito de triagem.</DialogDescription>
              </div>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Data</Label>
                  <Input type="date" className="glass h-12 text-white" value={intakeData.date} onChange={e => setIntakeData({...intakeData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Hora</Label>
                  <Input type="time" className="glass h-12 text-white" value={intakeData.time} onChange={e => setIntakeData({...intakeData, time: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase">Modalidade</Label>
                <Select value={intakeData.type} onValueChange={v => setIntakeData({...intakeData, type: v})}>
                  <SelectTrigger className="glass h-12 text-white uppercase font-bold text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    <SelectItem value="online">🖥️ ONLINE / VIRTUAL</SelectItem>
                    <SelectItem value="presencial">🏢 PRESENCIAL (SEDE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsSchedulingIntake(false)} className="text-muted-foreground uppercase font-black text-[10px]">Cancelar</Button>
            <Button onClick={handleScheduleIntake} className="gold-gradient text-background font-black uppercase text-[10px] px-8 h-12 rounded-xl">Confirmar Agenda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
