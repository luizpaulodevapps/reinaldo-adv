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
  Calendar as CalendarIcon
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
import { collection, query, serverTimestamp, doc, where, limit, orderBy, getDocs } from "firebase/firestore"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { cn } from "@/lib/utils"
import { DynamicInterviewExecution } from "@/components/interviews/dynamic-interview-execution"
import { BurocraciaView } from "@/components/leads/burocracia-view"
import { ProcessForm } from "@/components/cases/process-form"
import Link from "next/link"
import { generateCaseSummary, type GenerateCaseSummaryOutput } from "@/ai/flows/ai-generate-case-summary"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"

const columns = [
  { id: "novo", title: "NOVO LEAD", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-emerald-400" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

const DOSSIER_TABS = ["overview", "entrevistas", "burocracia", "revisao"]

export default function LeadsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const leadsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db!, "leads"), 
      orderBy("updatedAt", "desc"), 
      limit(100)
    )
  }, [db, user])

  const { data: leadsData, isLoading } = useCollection(leadsQuery)
  
  const leads = useMemo(() => {
    if (!leadsData) return []
    return leadsData.filter(l => l.status !== 'arquivado')
  }, [leadsData])

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [isEditModeOpen, setIsEditModeOpen] = useState(false)
  const [isConversionOpen, setIsConversionOpen] = useState(false)
  const [activeDossierTab, setActiveDossierTab] = useState("overview")
  const [isSyncingDrive, setIsSyncingDrive] = useState(false)
  
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false)
  const [executingTemplate, setExecutingTemplate] = useState<any>(null)

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [strategicSummary, setStrategicSummary] = useState<GenerateCaseSummaryOutput | null>(null)

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  const [isSchedulingHearing, setIsSchedulingHearing] = useState(false)
  const [hearingData, setHearingData] = useState({
    type: "UNA",
    date: "",
    time: "",
    meetingLink: "",
    accessCode: "",
    location: ""
  })

  // State for Scheduling Intake Meeting (Atendimento)
  const [isSchedulingIntake, setIsSchedulingIntake] = useState(false)
  const [intakeData, setIntakeData] = useState({
    date: "",
    time: "",
    type: "online"
  })

  const templatesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "checklists"), orderBy("title", "asc"))
  }, [db, user])
  const { data: templates } = useCollection(templatesQuery)

  const leadInterviewsQuery = useMemoFirebase(() => {
    if (!user || !db || !selectedLead) return null
    return query(
      collection(db!, "interviews"), 
      where("clientId", "==", selectedLead.id),
      orderBy("createdAt", "desc")
    )
  }, [db, user, selectedLead])
  const { data: leadInterviews } = useCollection(leadInterviewsQuery)

  useEffect(() => {
    if (selectedLead) {
      if (selectedLead.status === 'atendimento') setActiveDossierTab("entrevistas")
      else if (selectedLead.status === 'burocracia') setActiveDossierTab("burocracia")
      else if (selectedLead.status === 'distribuicao') setActiveDossierTab("revisao")
      else setActiveDossierTab("overview")
      setStrategicSummary(null)
      setIsSchedulingHearing(false)
      setHearingData({
        type: "UNA",
        date: "",
        time: "",
        meetingLink: "",
        accessCode: "",
        location: ""
      })
      setIntakeData({
        date: selectedLead.scheduledDate || "",
        time: selectedLead.scheduledTime || "",
        type: selectedLead.meetingType || "online"
      })
    }
  }, [selectedLead?.id, selectedLead?.status])

  const handleGenerateStrategicSummary = async () => {
    if (!selectedLead) return
    setIsGeneratingSummary(true)
    try {
      const result = await generateCaseSummary({
        caseId: selectedLead.id,
        clientName: selectedLead.name,
        caseTitle: selectedLead.demandTitle || "Reclamação Trabalhista",
        caseDescription: selectedLead.notes || "Sem descrição adicional.",
        currentStatus: "Fase de Distribuição (Pré-Protocolo)",
        lastEvents: ["Entrevista de Triagem Realizada", "Documentação Coletada"],
        nextDeadlines: ["Protocolo da Inicial", "Audiência Inicial (Agendar)"],
        relatedParties: [selectedLead.defendantName || "Réu não identificado"],
        financialStatus: "Aguardando definição de valor da causa."
      })
      setStrategicSummary(result)
      toast({ title: "Análise IA Concluída" })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na Análise" })
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead)
    setIsSheetOpen(true)
  }

  const handleScheduleIntake = async () => {
    if (!db || !selectedLead || !intakeData.date || !intakeData.time) {
      toast({ variant: "destructive", title: "Dados Incompletos", description: "Defina data e hora para o atendimento." })
      return
    }

    const payload = {
      scheduledDate: intakeData.date,
      scheduledTime: intakeData.time,
      meetingType: intakeData.type,
      updatedAt: serverTimestamp()
    }

    // Update lead
    updateDocumentNonBlocking(doc(db, "leads", selectedLead.id), payload)

    // Create entry in appointments collection
    const appointmentPayload = {
      title: `Atendimento: ${selectedLead.name}`,
      type: "Atendimento",
      startDateTime: `${intakeData.date}T${intakeData.time}:00`,
      clientId: selectedLead.id,
      clientName: selectedLead.name,
      meetingType: intakeData.type,
      location: intakeData.type === 'online' ? "Virtual RGMJ" : "Sede RGMJ",
      status: "Agendado",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    addDocumentNonBlocking(collection(db, "appointments"), appointmentPayload)

    setSelectedLead({ ...selectedLead, ...payload })
    setIsSchedulingIntake(false)
    
    // Feedback de Sincronismo com Google
    toast({ 
      title: "Atendimento Agendado", 
      description: "O ato foi sincronizado com o Google Calendar da banca." 
    })
  }

  const handleSyncDrive = async () => {
    if (!selectedLead || !db) return
    setIsSyncingDrive(true)
    setTimeout(async () => {
      let nextStatus = "pasta_lead"
      if (selectedLead.status === "distribuicao" || selectedLead.status === "burocracia") nextStatus = "pasta_cliente"
      await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
        driveStatus: nextStatus,
        driveFolderId: "DRIVE_" + Math.random().toString(36).substring(7),
        updatedAt: serverTimestamp()
      })
      setSelectedLead({ ...selectedLead, driveStatus: nextStatus })
      setIsSyncingDrive(false)
      toast({ title: "Drive Sincronizado" })
    }, 1000)
  }

  const handleStartInterview = (t: any) => {
    setExecutingTemplate(t)
    setIsInterviewDialogOpen(true)
  }

  const handleFinishInterview = async (payload: { responses: any; templateSnapshot: any[] }) => {
    if (!db || !selectedLead || !user) return
    const interviewData = {
      clientId: selectedLead.id,
      clientName: selectedLead.name,
      templateId: executingTemplate.id,
      interviewType: executingTemplate.title,
      responses: payload.responses,
      templateSnapshot: payload.templateSnapshot,
      interviewerId: user.uid,
      interviewerName: user.displayName || "Advogado RGMJ",
      status: "Concluída",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await addDocumentNonBlocking(collection(db!, "interviews"), interviewData)
    if (selectedLead.status === 'novo' || !selectedLead.status) {
      await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
        status: "atendimento",
        updatedAt: serverTimestamp()
      })
    }
    setIsInterviewDialogOpen(false)
    setExecutingTemplate(null)
    toast({ title: "Entrevista Registrada" })
  }

  const handleConvertProcess = async (data: any) => {
    if (!db || !selectedLead) return
    const processPayload = {
      ...data,
      leadId: selectedLead.id,
      status: "Em Andamento",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const processRef = await addDocumentNonBlocking(collection(db!, "processes"), processPayload)
    
    if (isSchedulingHearing && hearingData.date && hearingData.time) {
      const hearingPayload = {
        title: `Audiência ${hearingData.type}: ${selectedLead.name}`,
        type: hearingData.type,
        startDateTime: `${hearingData.date}T${hearingData.time}:00`,
        processId: (processRef as any).id,
        processNumber: processPayload.processNumber,
        clientName: selectedLead.name,
        clientId: selectedLead.id,
        location: hearingData.type === 'Virtual' ? 'SALA VIRTUAL RGMJ' : (hearingData.location || selectedLead.courtAddress || 'Fórum'),
        meetingLink: hearingData.meetingLink,
        accessCode: hearingData.accessCode,
        hearingType: hearingData.type === 'Virtual' ? 'Virtual' : 'Física',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      await addDocumentNonBlocking(collection(db!, "hearings"), hearingPayload)
    }

    updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
      status: "arquivado",
      convertedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    setIsConversionOpen(false)
    setIsSheetOpen(false)
    toast({ title: "Processo Protocolado e Agenda Sincronizada" })
  }

  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetStatus: string) => {
    if (!draggedLeadId || !db) return
    const lead = leads.find(l => l.id === draggedLeadId)
    if (!lead) return

    if (targetStatus === 'burocracia') {
      const interviewsSnap = await getDocs(query(collection(db, "interviews"), where("clientId", "==", lead.id)))
      if (interviewsSnap.empty) {
        toast({
          variant: "destructive",
          title: "Bloqueio de Rito",
          description: "É obrigatório realizar ao menos uma entrevista técnica antes da burocracia."
        })
        setDraggedLeadId(null)
        return
      }
    }

    if (targetStatus === 'distribuicao') {
      const hasCpf = !!(lead.cpf || lead.documentNumber)
      const hasAddress = !!lead.address
      const hasDefendant = !!lead.defendantName

      if (!hasCpf || !hasAddress || !hasDefendant) {
        toast({
          variant: "destructive",
          title: "Bloqueio de Distribuição",
          description: "Dados incompletos: Nome, CPF, Endereço e Réu são obrigatórios."
        })
        setDraggedLeadId(null)
        return
      }
    }

    if (lead.status !== targetStatus) {
      await updateDocumentNonBlocking(doc(db, "leads", lead.id), {
        status: targetStatus,
        updatedAt: serverTimestamp()
      })
      toast({
        title: "Movimentação Concluída",
        description: `${lead.name} avançou para a etapa de ${targetStatus.toUpperCase()}.`
      })
    }
    setDraggedLeadId(null)
  }

  const currentTabIndex = DOSSIER_TABS.indexOf(activeDossierTab)
  const canGoBack = currentTabIndex > 0
  const canGoNext = currentTabIndex < DOSSIER_TABS.length - 1

  const handleNextTab = () => {
    if (canGoNext) setActiveDossierTab(DOSSIER_TABS[currentTabIndex + 1])
  }

  const handlePrevTab = () => {
    if (canGoBack) setActiveDossierTab(DOSSIER_TABS[currentTabIndex - 1])
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-base uppercase tracking-widest font-black text-muted-foreground/40 mb-3">
            <LayoutGrid className="h-6 w-6" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-5 w-5" />
            <span className="text-white">FUNIL DE LEADS</span>
          </div>
          <h1 className="text-5xl font-bold text-white uppercase tracking-tight">Triagem de Oportunidades</h1>
          <p className="text-muted-foreground text-base uppercase tracking-[0.2em] mt-3 opacity-60">Arraste para mover • Respeite os ritos técnicos.</p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-black font-black gap-4 px-10 h-16 rounded-xl text-base tracking-widest shadow-2xl hover:scale-105 transition-all">
          <PlusCircle className="h-7 w-7" /> NOVO ATENDIMENTO ESTRATÉGICO
        </Button>
      </div>

      {isLoading ? (
        <div className="py-40 flex flex-col items-center justify-center space-y-8">
          <Loader2 className="h-20 w-20 animate-spin text-primary" />
          <span className="text-base font-bold uppercase tracking-widest text-muted-foreground">Sincronizando Banco de Dados RGMJ...</span>
        </div>
      ) : (
        <div className="flex gap-10 overflow-x-auto pb-16 scrollbar-hide min-h-[800px] px-2">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => {
              const currentStatus = l.status || "novo"
              return currentStatus === col.id
            })
            
            return (
              <div 
                key={col.id} 
                className="min-w-[400px] flex-1 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
              >
                <div className="flex items-center justify-between mb-8 px-6 bg-white/[0.02] py-4 rounded-xl border border-white/5 shadow-inner">
                  <div className="flex items-center gap-5">
                    <div className={cn("w-4 h-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]", col.color.replace('text-', 'bg-'))} />
                    <h3 className={cn("font-black text-base tracking-[0.3em] uppercase", col.color)}>{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/5 text-sm border-white/5 font-black h-8 px-4 rounded-lg">{leadsInCol.length}</Badge>
                </div>

                <div className={cn(
                  "space-y-6 flex-1 bg-white/[0.01] rounded-[2.5rem] p-6 border border-white/5 transition-all duration-300",
                  draggedLeadId && "ring-2 ring-primary/20 bg-primary/[0.02]"
                )}>
                  <AnimatePresence>
                    {leadsInCol.map((lead) => (
                      <motion.div
                        key={lead.id}
                        layoutId={lead.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        className="relative"
                      >
                        <Card 
                          className={cn(
                            "glass hover-gold transition-all cursor-grab active:cursor-grabbing group border-white/5 shadow-2xl rounded-3xl overflow-hidden",
                            draggedLeadId === lead.id && "opacity-50 grayscale scale-95"
                          )} 
                          onClick={() => handleOpenLead(lead)}
                        >
                          <CardContent className="p-8 space-y-6">
                            <div className="flex items-start justify-between gap-6">
                              <div className="space-y-2 flex-1">
                                <div className="font-bold text-xl text-white group-hover:text-primary transition-colors uppercase tracking-tight leading-snug">{lead.name}</div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-widest">ID: {lead.id.substring(0, 8).toUpperCase()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {lead.meetingType === 'online' && <Video className="h-6 w-6 text-primary shrink-0 opacity-60" />}
                                <GripVertical className="h-6 w-6 text-white/10 group-hover:text-primary/40 transition-colors" />
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              {lead.scheduledDate && (
                                <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 w-fit">
                                  <Clock className="h-5 w-5 text-amber-500" />
                                  <span className="text-sm font-black text-amber-500 uppercase tracking-widest">
                                    {new Date(lead.scheduledDate).toLocaleDateString('pt-BR')} {lead.scheduledTime}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground font-bold uppercase tracking-widest px-1">
                                <Building className="h-5 w-5 opacity-40" /> {lead.defendantName || "RÉU PENDENTE"}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                              <div className="flex gap-3">
                                {lead.cpf && <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5 font-black uppercase px-3 py-1">CPF OK</Badge>}
                                {lead.interviewsCount > 0 && <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-primary/5 font-black uppercase px-3 py-1">ENTREVISTA</Badge>}
                              </div>
                              <div className="flex items-center gap-3 text-primary font-black text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                                ABRIR DOSSIÊ <ArrowRight className="h-5 w-5" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {leadsInCol.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20 space-y-6">
                      <LayoutGrid className="h-14 w-14" />
                      <span className="text-sm font-black uppercase tracking-[0.5em]">Limbo Operacional</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl">
          {selectedLead && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-10 border-b border-white/5 bg-[#0a0f1e] z-10 flex-none shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
                      <Fingerprint className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <SheetTitle className="text-white text-4xl font-bold uppercase tracking-tight">{selectedLead.name}</SheetTitle>
                      <SheetDescription className="text-base text-muted-foreground uppercase font-black tracking-[0.3em] flex items-center gap-4" asChild>
                        <span>
                          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" /> 
                          DOSSIÊ ESTRATÉGICO RGMJ • ID {selectedLead.id.substring(0, 12).toUpperCase()}
                        </span>
                      </SheetDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <Button onClick={() => handleSyncDrive()} disabled={isSyncingDrive} variant="outline" className="h-16 border-white/10 bg-white/5 text-sm font-black uppercase px-10 rounded-2xl gap-5 transition-all hover:bg-primary/5 shadow-2xl">
                      {isSyncingDrive ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <CloudLightning className="h-6 w-6 text-amber-500" />} SINC. DRIVE
                    </Button>
                    <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="h-16 border-white/10 bg-white/5 text-sm font-black uppercase px-10 rounded-2xl gap-5 transition-all hover:bg-primary/5 shadow-2xl">
                      <UserCog className="h-6 w-6 text-primary" /> EDITAR QUALIFICAÇÃO
                    </Button>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="p-8 bg-[#0a0f1e]/60 border-b border-white/5 flex-none overflow-x-auto scrollbar-hide">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 min-w-[1200px]">
                  {[
                    { label: "Status Operacional", value: selectedLead.status?.toUpperCase() || "NOVO", icon: Zap, color: "text-primary" },
                    { label: "Réu Principal", value: selectedLead.defendantName || "NÃO INFORMADO", icon: Building, color: "text-muted-foreground" },
                    { label: "Canal WhatsApp", value: selectedLead.phone, icon: Phone, color: "text-emerald-500" },
                    { label: "Jurisdição", value: selectedLead.city ? `${selectedLead.city}-${selectedLead.state}` : "N/A", icon: MapPin, color: "text-muted-foreground" },
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex items-center gap-6 shadow-xl">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-black/20 border border-white/5", item.color)}>
                        <item.icon className="h-7 w-7" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-50">{item.label}</p>
                        <p className="text-lg font-bold text-white uppercase truncate tracking-tight">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 bg-[#05070a]">
                <div className="p-12 space-y-12 w-full max-w-[1800px] mx-auto pb-40">
                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-12">
                    <TabsList className="bg-transparent border-b border-white/5 h-16 w-full justify-start rounded-none p-0 gap-20 flex-none overflow-x-auto scrollbar-hide">
                      {[
                        { id: "overview", label: "VISÃO GERAL" },
                        { id: "entrevistas", label: "ENTREVISTAS TÉCNICAS" },
                        { id: "burocracia", label: "BUROCRACIA & KITS" },
                        { id: "revisao", label: "REVISÃO & PROTOCOLO" }
                      ].map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:text-primary text-muted-foreground font-black text-base uppercase h-full rounded-none px-0 border-b-4 border-transparent data-[state=active]:border-primary transition-all tracking-[0.3em]">{tab.label}</TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-12 animate-in fade-in duration-500 outline-none w-full">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <Card 
                          className="glass border-white/5 p-12 rounded-[3rem] shadow-2xl bg-white/[0.01] relative overflow-hidden group cursor-pointer hover:border-amber-500/30 transition-all"
                          onClick={() => setIsSchedulingIntake(true)}
                        >
                          <div className="absolute top-0 right-0 p-12 opacity-5"><Clock className="h-40 w-40" /></div>
                          <h4 className="text-base font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-5 mb-10"><Clock className="h-7 w-7" /> Cronograma de Atendimento</h4>
                          <div className="space-y-8">
                            <p className="text-4xl font-bold text-white uppercase tracking-tighter">
                              {selectedLead.scheduledDate ? `${new Date(selectedLead.scheduledDate).toLocaleDateString('pt-BR')} às ${selectedLead.scheduledTime}` : "AGUARDANDO AGENDAMENTO"}
                            </p>
                            <Badge variant="outline" className="text-sm font-black text-muted-foreground border-white/10 px-8 py-4 rounded-2xl uppercase tracking-widest bg-white/[0.02]">
                              {selectedLead.meetingType === 'online' ? '🖥️ REUNIÃO VIRTUAL RGMJ' : '🏢 VISITA PRESENCIAL À BANCA'}
                            </Badge>
                            <div className="pt-4 text-xs font-black text-amber-500/40 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">CLIQUE PARA EDITAR CRONOGRAMA</div>
                          </div>
                        </Card>
                        <Card className="glass border-primary/15 p-12 rounded-[3rem] shadow-2xl bg-primary/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-12 opacity-5"><Brain className="h-40 w-40" /></div>
                          <h4 className="text-base font-black text-primary uppercase tracking-[0.4em] flex items-center gap-5 mb-10"><Brain className="h-7 w-7" /> Síntese Estratégica (IA)</h4>
                          <p className="text-xl text-white/80 leading-relaxed italic text-justify font-medium">
                            {selectedLead.aiSummary || "O sistema aguarda a conclusão das entrevistas técnicas para consolidar os fatos e gerar a tese jurídica preliminar RGMJ. A inteligência analisará depoimentos e documentos sincronizados para propor a melhor abordagem processual."}
                          </p>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="entrevistas" className="w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {templates?.map(t => (
                          <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/15 text-primary font-black uppercase text-sm h-24 gap-6 rounded-3xl justify-start px-10 hover:bg-primary/5 transition-all shadow-2xl group border-2">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Zap className="h-7 w-7" /></div>
                            <div className="flex flex-col items-start min-w-0">
                              <span className="truncate w-full text-left">{t.title}</span>
                              <span className="text-[10px] opacity-40 tracking-[0.2em] mt-2">INICIAR CAPTURA</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="burocracia" className="w-full">
                      <BurocraciaView lead={selectedLead} interviews={leadInterviews || []} onEdit={() => setIsEditModeOpen(true)} />
                    </TabsContent>

                    <TabsContent value="revisao" className="space-y-12 animate-in fade-in duration-700 w-full">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 pb-12 border-b border-white/5">
                        <div className="flex items-center gap-8">
                          <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-2xl">
                            <ShieldCheck className="h-10 w-10 text-emerald-500" />
                          </div>
                          <div>
                            <h3 className="text-4xl font-bold text-white uppercase tracking-widest">Auditoria de Protocolo</h3>
                            <p className="text-sm text-muted-foreground uppercase font-black tracking-[0.3em] mt-2 opacity-50">Validação final de DNA Jurídico antes da conversão.</p>
                          </div>
                        </div>
                        <Button onClick={handleGenerateStrategicSummary} disabled={isGeneratingSummary} className="h-20 px-12 glass border-primary/30 text-primary font-black uppercase text-base gap-5 rounded-[1.5rem] shadow-2xl hover:bg-primary/5 transition-all">
                          {isGeneratingSummary ? <Loader2 className="h-7 w-7 animate-spin" /> : <Brain className="h-7 w-7" />} CONSOLIDAR ESTRATÉGIA IA
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <Card className="glass border-white/5 p-12 rounded-[3rem] space-y-10 shadow-2xl bg-white/[0.01]">
                          <div className="flex items-center gap-6 border-b border-white/5 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><User className="h-6 w-6 text-primary" /></div>
                            <span className="text-base font-black text-white uppercase tracking-[0.3em]">Polo Ativo (Autor)</span>
                          </div>
                          <div className="space-y-8">
                            {[
                              { label: "Nome Civil", value: selectedLead.name },
                              { label: "Identificação Fiscal", value: selectedLead.cpf || selectedLead.documentNumber || "NÃO INFORMADO" },
                              { label: "WhatsApp Direct", value: selectedLead.phone },
                              { label: "Residência Atual", value: selectedLead.address ? `${selectedLead.address}, ${selectedLead.city}` : "PENDENTE" },
                            ].map(item => (
                              <div key={item.label} className="group">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 opacity-40 group-hover:opacity-100 transition-opacity">{item.label}</p>
                                <p className="text-lg font-bold text-white uppercase tracking-tight">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <Card className="glass border-white/5 p-12 rounded-[3rem] space-y-10 shadow-2xl bg-white/[0.01]">
                          <div className="flex items-center gap-6 border-b border-white/5 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Building className="h-6 w-6 text-primary" /></div>
                            <span className="text-base font-black text-white uppercase tracking-[0.3em]">Polo Passivo (Réu)</span>
                          </div>
                          <div className="space-y-8">
                            {[
                              { label: "Razão Social / Nome", value: selectedLead.defendantName || "NÃO INFORMADO" },
                              { label: "Documento (CNPJ/CPF)", value: selectedLead.defendantDocument || "NÃO INFORMADO" },
                              { label: "Sede / Filial", value: selectedLead.defendantAddress || "NÃO MAPEADO" },
                            ].map(item => (
                              <div key={item.label} className="group">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 opacity-40 group-hover:opacity-100 transition-opacity">{item.label}</p>
                                <p className="text-lg font-bold text-white uppercase tracking-tight">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <Card className="glass border-white/5 p-12 rounded-[3rem] space-y-10 shadow-2xl bg-white/[0.01]">
                          <div className="flex items-center gap-6 border-b border-white/5 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Gavel className="h-6 w-6 text-primary" /></div>
                            <span className="text-base font-black text-white uppercase tracking-[0.3em]">Logística Judiciária</span>
                          </div>
                          <div className="space-y-8">
                            {[
                              { label: "Tribunal Superior / Região", value: selectedLead.court || "NÃO MAPEADO" },
                              { label: "Vara / Unidade Judiciária", value: selectedLead.vara || "NÃO MAPEADA" },
                              { label: "CEP do Edifício", value: selectedLead.courtZipCode || "NÃO INFORMADO" },
                              { label: "Logradouro do Juízo", value: selectedLead.courtAddress || "PENDENTE" },
                            ].map(item => (
                              <div key={item.label} className="group">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 opacity-40 group-hover:opacity-100 transition-opacity">{item.label}</p>
                                <p className="text-lg font-bold text-white uppercase tracking-tight">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>

                      <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-[3.5rem]">
                        <div className="p-10 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-2xl"><MessageCircle className="h-7 w-7" /></div>
                            <div className="space-y-2">
                              <span className="text-2xl font-bold text-white uppercase tracking-widest">DNA de Atendimento</span>
                              <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.3em] opacity-50">Resumo dos fatos capturados nas entrevistas.</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-sm font-black border-primary/20 text-primary px-8 py-3 rounded-2xl uppercase tracking-widest bg-primary/5">{leadInterviews?.length || 0} Atendimentos Realizados</Badge>
                        </div>
                        <div className="p-12">
                          {leadInterviews && leadInterviews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              {leadInterviews.slice(0, 4).map((int, idx) => (
                                <div key={idx} className="p-10 rounded-[3rem] bg-black/30 border border-white/5 space-y-8 shadow-2xl hover:border-primary/20 transition-all group">
                                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                    <span className="text-base font-black text-primary uppercase tracking-widest group-hover:scale-105 transition-transform origin-left">{int.interviewType}</span>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono font-bold">
                                      <Clock className="h-4 w-4" /> {int.createdAt?.toDate ? new Date(int.createdAt.toDate()).toLocaleDateString('pt-BR') : '---'}
                                    </div>
                                  </div>
                                  <div className="space-y-8">
                                    {Object.entries(int.responses || {}).slice(0, 2).map(([q, a]: any) => (
                                      <div key={q}>
                                        <p className="text-xs font-black text-muted-foreground uppercase opacity-40 mb-3 tracking-[0.2em]">{q}</p>
                                        <p className="text-base text-white/90 font-medium uppercase leading-relaxed text-justify">{String(a)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-32 flex flex-col items-center justify-center opacity-20 space-y-8">
                              <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center"><MessageCircle className="h-12 w-12" /></div>
                              <p className="text-base font-black uppercase tracking-[0.6em]">Nenhum fato registrado até o momento.</p>
                            </div>
                          )}
                        </div>
                      </Card>

                      {strategicSummary && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-4 duration-1000">
                          {[
                            { t: "DNA de Fatos", v: strategicSummary.keyFacts, c: "text-primary", icon: Brain, bg: "bg-primary/5" },
                            { t: "Radar de Riscos", v: strategicSummary.risksAndChallenges, c: "text-rose-500", icon: ShieldAlert, bg: "bg-rose-500/5" },
                            { t: "Tese Estratégica", v: strategicSummary.strategicAnalysis, icon: Zap, c: "text-emerald-500", bg: "bg-emerald-500/5" }
                          ].map(s => (
                            <div key={s.t} className={cn("p-12 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl hover:border-primary/30 transition-all relative overflow-hidden", s.bg)}>
                              <div className="flex items-center gap-5">
                                <div className={cn("w-14 h-14 rounded-[1.5rem] flex items-center justify-center bg-black/40 border border-white/5 shadow-2xl", s.c)}>
                                  <s.icon className="h-7 w-7" />
                                </div>
                                <h5 className={cn("text-base font-black uppercase tracking-[0.3em]", s.c)}>{s.t}</h5>
                              </div>
                              <p className="text-lg text-white/80 leading-relaxed text-justify font-medium">{s.v}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <Card className="glass border-amber-500/30 bg-amber-500/5 p-10 rounded-[3rem] space-y-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5"><Gavel className="h-40 w-40 text-amber-500" /></div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-amber-500/10 pb-8 gap-8 relative z-10">
                          <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-2xl">
                              <Gavel className="h-10 w-10 text-amber-500" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-3xl font-bold text-white uppercase tracking-widest">Agendamento de Pauta</h3>
                              <p className="text-sm text-amber-500/60 uppercase font-black tracking-[0.3em] opacity-70">Opcional: Sincronismo nativo com Agenda Google Cloud.</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 bg-black/40 p-6 rounded-[1.5rem] border border-white/5 shadow-inner">
                            <span className="text-sm font-black text-white uppercase tracking-[0.3em]">HABILITAR ATO?</span>
                            <Switch checked={isSchedulingHearing} onCheckedChange={setIsSchedulingHearing} className="data-[state=checked]:bg-amber-500 shadow-2xl scale-125" />
                          </div>
                        </div>

                        {isSchedulingHearing && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 animate-in slide-in-from-top-4 duration-700 relative z-10">
                            <div className="space-y-4">
                              <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">TIPO DE AUDIÊNCIA</Label>
                              <Select value={hearingData.type} onValueChange={(v) => setHearingData({...hearingData, type: v})}>
                                <SelectTrigger className="glass border-white/10 h-16 text-white font-bold text-base uppercase tracking-tight shadow-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0d121f] text-white border-white/10">
                                  <SelectItem value="UNA">AUDIÊNCIA UNA</SelectItem>
                                  <SelectItem value="Conciliação">CONCILIAÇÃO</SelectItem>
                                  <SelectItem value="Instrução">INSTRUÇÃO</SelectItem>
                                  <SelectItem value="Virtual">SALA VIRTUAL RGMJ</SelectItem>
                                  <SelectItem value="Julgamento">JULGAMENTO</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-4">
                              <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">DATA DO ATO</Label>
                              <Input type="date" className="glass border-white/10 h-16 text-white font-black text-base shadow-xl" value={hearingData.date} onChange={(e) => setHearingData({...hearingData, date: e.target.value})} />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">HORÁRIO</Label>
                              <Input type="time" className="glass border-white/10 h-16 text-white font-black text-base shadow-xl" value={hearingData.time} onChange={(e) => setHearingData({...hearingData, time: e.target.value})} />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">LOCALIZAÇÃO FÍSICA</Label>
                              <Input 
                                placeholder={hearingData.type === 'Virtual' ? "Sala Virtual RGMJ" : "Fórum Trabalhista / Outro"}
                                className="glass border-white/10 h-16 text-white font-bold text-base shadow-xl" 
                                value={hearingData.location} 
                                onChange={(e) => setHearingData({...hearingData, location: e.target.value})} 
                              />
                            </div>

                            {hearingData.type === 'Virtual' && (
                              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-white/5">
                                <div className="space-y-4">
                                  <Label className="text-sm font-black text-emerald-500 uppercase flex items-center gap-4 tracking-[0.3em]">
                                    <Video className="h-6 w-6" /> LINK DE ACESSO (MEET/ZOOM)
                                  </Label>
                                  <Input className="glass border-emerald-500/20 h-16 text-white font-bold text-base shadow-2xl focus:ring-emerald-500/50" placeholder="https://..." value={hearingData.meetingLink} onChange={(e) => setHearingData({...hearingData, meetingLink: e.target.value})} />
                                </div>
                                <div className="space-y-4">
                                  <Label className="text-sm font-black text-emerald-500 uppercase flex items-center gap-4 tracking-[0.3em]">
                                    <Lock className="h-6 w-6" /> SENHA / CÓDIGO DE ACESSO
                                  </Label>
                                  <Input className="glass border-emerald-500/20 h-16 text-white font-bold text-base shadow-2xl focus:ring-emerald-500/50" placeholder="SENHA DE ACESSO" value={hearingData.accessCode} onChange={(e) => setHearingData({...hearingData, accessCode: e.target.value})} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>

                      <div className="p-12 rounded-[3rem] bg-purple-500/5 border border-purple-500/20 flex flex-col md:flex-row items-end gap-12 w-full shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform"><FileCheck className="h-40 w-40 text-purple-500" /></div>
                        <div className="flex-1 space-y-6 w-full relative z-10">
                          <Label className="text-sm font-black text-purple-400 uppercase tracking-[0.4em] flex items-center gap-5">
                            <FileCheck className="h-7 w-7" /> PROTOCOLO CNJ DO PROCESSO *
                          </Label>
                          <Input 
                            placeholder="0000000-00.0000.0.00.0000" 
                            className="bg-black/60 border-purple-500/30 h-24 text-white font-mono text-4xl font-black w-full tracking-[0.3em] focus:ring-purple-500/50 rounded-2xl px-12 shadow-inner" 
                            value={selectedLead.processNumber || ""} 
                            onChange={(e) => setSelectedLead({...selectedLead, processNumber: e.target.value})} 
                          />
                          <p className="text-xs text-purple-400/50 font-black uppercase tracking-[0.2em]">Inisira o número CNJ ou marque "Aguardando Número" no rito de saneamento.</p>
                        </div>
                        <Button 
                          onClick={() => setIsConversionOpen(true)} 
                          className="gold-gradient text-black font-black h-24 px-20 rounded-[2rem] uppercase text-base tracking-[0.3em] shadow-[0_25px_60px_rgba(245,208,48,0.3)] hover:scale-[1.02] active:scale-95 transition-all shrink-0 w-full md:w-auto relative z-10"
                        >
                          PROTOCOLAR E CONVERTER PARA ATIVO
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              <div className="flex-none p-8 border-t border-white/5 bg-[#0a0f1e] flex items-center justify-between z-20 shadow-[0_-25px_60px_rgba(0,0,0,0.5)]">
                <Button 
                  variant="ghost" 
                  onClick={handlePrevTab} 
                  disabled={!canGoBack}
                  className="text-muted-foreground uppercase font-black text-sm tracking-[0.4em] gap-6 px-12 h-16 hover:text-white disabled:opacity-20 transition-all"
                >
                  <ArrowLeft className="h-6 w-6" /> VOLTAR AO PASSO ANTERIOR
                </Button>

                <div className="hidden md:flex gap-6">
                  {DOSSIER_TABS.map((tab, i) => (
                    <div 
                      key={tab} 
                      className={cn(
                        "w-4 h-4 rounded-full transition-all duration-700",
                        activeDossierTab === tab ? "bg-primary shadow-[0_0_20px_rgba(245,208,48,0.6)] scale-150" : i < currentTabIndex ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-white/10"
                      )} 
                    />
                  ))}
                </div>

                {canGoNext ? (
                  <Button 
                    onClick={handleNextTab} 
                    className="gold-gradient text-black font-black h-16 px-16 rounded-2xl uppercase text-sm tracking-[0.3em] gap-6 shadow-2xl hover:scale-[1.02] transition-all"
                  >
                    AVANÇAR NO RITO TÉCNICO <ArrowRight className="h-6 w-6" />
                  </Button>
                ) : (
                  <div className="px-12 h-16 flex items-center bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-sm font-black text-primary/60 uppercase tracking-[0.4em] flex items-center gap-4">
                      <ShieldCheck className="h-6 w-6" /> ETAPA FINAL DE PROTOCOLO
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Intake Scheduling Dialog */}
      <Dialog open={isSchedulingIntake} onOpenChange={setIsSchedulingIntake}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter flex items-center gap-4">
                <CalendarIcon className="h-8 w-8 text-amber-500" /> Agendar Atendimento
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs uppercase font-bold tracking-[0.2em] mt-2">
                Defina o rito inicial para o lead na pauta da banca.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-8 bg-[#0a0f1e]/50">
            <div className="space-y-4">
              <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Modalidade</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => setIntakeData({...intakeData, type: 'online'})}
                  variant={intakeData.type === 'online' ? 'secondary' : 'outline'}
                  className={cn("h-14 font-black uppercase text-[10px] tracking-widest gap-3 rounded-xl", intakeData.type === 'online' ? 'bg-primary text-background' : 'glass border-white/10')}
                >
                  <Video className="h-4 w-4" /> Reunião Online
                </Button>
                <Button 
                  onClick={() => setIntakeData({...intakeData, type: 'presencial'})}
                  variant={intakeData.type === 'presencial' ? 'secondary' : 'outline'}
                  className={cn("h-14 font-black uppercase text-[10px] tracking-widest gap-3 rounded-xl", intakeData.type === 'presencial' ? 'bg-primary text-background' : 'glass border-white/10')}
                >
                  <Building className="h-4 w-4" /> Presencial
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Data</Label>
                <Input type="date" value={intakeData.date} onChange={(e) => setIntakeData({...intakeData, date: e.target.value})} className="glass h-14 text-white font-bold border-white/20" />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Horário</Label>
                <Input type="time" value={intakeData.time} onChange={(e) => setIntakeData({...intakeData, time: e.target.value})} className="glass h-14 text-white font-bold border-white/20" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsSchedulingIntake(false)} className="text-muted-foreground font-black uppercase text-[11px] tracking-widest">Cancelar</Button>
            <Button onClick={handleScheduleIntake} className="gold-gradient text-black font-black h-16 px-12 rounded-xl uppercase text-sm tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
              Confirmar Agenda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1100px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-[3rem]">
          <DialogHeader className="p-10 bg-[#0a0f1e] border-b border-white/5">
            <DialogTitle className="text-white text-3xl font-bold uppercase tracking-widest">Atendimento Técnico Estratégico</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground uppercase font-black tracking-[0.4em] mt-4 opacity-50 flex items-center gap-4">
              <span className="w-3 h-3 rounded-full bg-primary animate-pulse" /> CAPTURA ESTRUTURADA DE FATOS RGMJ
            </DialogDescription>
          </DialogHeader>
          {executingTemplate && (
            <DynamicInterviewExecution template={executingTemplate} onSubmit={handleFinishInterview} onCancel={() => setIsInterviewDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1100px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-[3rem]">
          <DialogHeader className="p-10 bg-[#0a0f1e] border-b border-white/5">
            <DialogTitle className="text-white text-3xl font-bold uppercase tracking-widest">Migração para Acervo Ativo</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground uppercase font-black tracking-[0.4em] mt-4 opacity-50">O dossiê do lead será encerrado e um novo processo tático será iniciado na base RGMJ.</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <ProcessForm 
              initialData={{
                clientName: selectedLead.name,
                clientId: selectedLead.id,
                defendantName: selectedLead.defendantName,
                caseType: selectedLead.type,
                court: selectedLead.court,
                vara: selectedLead.vara,
                processNumber: selectedLead.processNumber || "",
                responsibleStaffId: user?.uid
              }}
              onSubmit={handleConvertProcess}
              onCancel={() => setIsConversionOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl">
          <SheetHeader className="p-10 border-b border-white/5 bg-[#0a0f1e] shadow-2xl">
            <SheetTitle className="text-3xl font-bold text-white uppercase tracking-widest">Novo Atendimento RGMJ</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground uppercase font-black tracking-[0.4em] mt-4 opacity-50">Cadastro de nova oportunidade estratégica no funil comercial de elite.</SheetDescription>
          </SheetHeader>
          <LeadForm 
            existingLeads={leads} 
            onSubmit={(data) => {
              addDocumentNonBlocking(collection(db!, "leads"), { ...data, assignedStaffId: user?.uid, status: "novo", driveStatus: "pendente", createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
              setIsNewEntryOpen(false)
              toast({ title: "Atendimento Iniciado", description: "O rito de triagem foi injetado na pauta." })
            }} 
            onSelectExisting={(l) => { handleOpenLead(l); setIsNewEntryOpen(false); }} 
            onCancel={() => setIsNewEntryOpen(false)}
            defaultResponsibleLawyer={user?.displayName || ""}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={isEditModeOpen} onOpenChange={setIsEditModeOpen}>
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl">
          <SheetHeader className="p-10 border-b border-white/5 bg-[#0a0f1e] shadow-2xl">
            <SheetTitle className="text-3xl font-bold text-white uppercase tracking-widest">Saneamento de Dossiê</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground uppercase font-black tracking-[0.4em] mt-4 opacity-50">Retificação técnica de dados cadastrais para o rito de distribuição.</SheetDescription>
          </SheetHeader>
          {selectedLead && (
            <LeadForm 
              existingLeads={[]}
              initialData={selectedLead}
              lockMode={true}
              onSubmit={async (data) => {
                await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), { ...data, updatedAt: serverTimestamp() })
                setSelectedLead({ ...selectedLead, ...data })
                setIsEditModeOpen(false)
                toast({ title: "Qualificação Atualizada", description: "Os dados foram retificados com sucesso." })
              }}
              onSelectExisting={() => {}}
              onCancel={() => setIsEditModeOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
