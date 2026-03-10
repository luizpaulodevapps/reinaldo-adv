
"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
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
  ExternalLink
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
import { collection, query, serverTimestamp, doc, where, limit, orderBy, getDocs } from "firebase/firestore"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { cn } from "@/lib/utils"
import { DynamicInterviewExecution } from "@/components/interviews/dynamic-interview-execution"
import { BurocraciaView } from "@/components/leads/burocracia-view"
import { ProcessForm } from "@/components/cases/process-form"
import Link from "next/link"
import { generateCaseSummary, type GenerateCaseSummaryOutput } from "@/ai/flows/ai-generate-case-summary"
import { aiAnalyzeFullInterview, type AnalyzeInterviewOutput } from "@/ai/flows/ai-analyze-full-interview"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"

const columns = [
  { id: "novo", title: "NOVO LEAD", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-emerald-400" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

const DOSSIER_TABS = ["overview", "entrevistas", "burocracia", "revisao"]

export default function LeadsPage() {
  const db = useFirestore()
  const { user, profile } = useUser()
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

  const [viewingInterview, setViewingInterview] = useState<any>(null)
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false)
  const [interviewAnalysis, setInterviewAnalysis] = useState<AnalyzeInterviewOutput | null>(null)

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

  const [isSchedulingIntake, setIsSchedulingIntake] = useState(false)
  const [intakeSuccess, setIntakeSuccess] = useState(false)
  const [intakeData, setIntakeData] = useState({
    date: "",
    time: "",
    type: "online",
    locationType: "sede", 
    customAddress: "",
    observations: ""
  })

  const [locationSearch, setLocationSearch] = useState("")
  const [locationResults, setLocationResults] = useState<any[]>([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)

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
      setIntakeSuccess(false)
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
        type: selectedLead.meetingType || "online",
        locationType: selectedLead.locationType || "sede",
        customAddress: selectedLead.customAddress || "",
        observations: selectedLead.intakeObservations || ""
      })
      setLocationSearch(selectedLead.customAddress || "")
    }
  }, [selectedLead?.id, selectedLead?.status])

  const handleMapSearch = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setLocationResults([])
      return
    }
    setIsSearchingLocation(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=br`)
      const data = await response.json()
      setLocationResults(data)
    } catch (error) {
      console.error("Erro ao buscar mapas:", error)
    } finally {
      setIsSearchingLocation(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationSearch && locationSearch !== intakeData.customAddress) {
        handleMapSearch(locationSearch)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [locationSearch, intakeData.customAddress, handleMapSearch])

  const handleSelectLocation = (place: any) => {
    const address = place.display_name
    setIntakeData(prev => ({ ...prev, customAddress: address }))
    setLocationSearch(address)
    setLocationResults([])
  }

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
      console.error("Erro GenAI:", error);
      toast({ variant: "destructive", title: "Erro na Análise", description: "O rito de IA falhou. Verifique a conexão." })
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

    const meetLink = intakeData.type === 'online' 
      ? `https://meet.google.com/rgmj-atend-${Math.random().toString(36).substring(7)}` 
      : "";

    const finalLocation = intakeData.type === 'online' 
      ? 'Virtual RGMJ' 
      : (intakeData.locationType === 'sede' ? 'Sede RGMJ (Rua do Advogado, 123)' : intakeData.customAddress)

    const payload = {
      scheduledDate: intakeData.date,
      scheduledTime: intakeData.time,
      meetingType: intakeData.type,
      locationType: intakeData.locationType,
      customAddress: intakeData.customAddress,
      meetingLocation: finalLocation,
      meetingLink: meetLink,
      intakeObservations: intakeData.observations,
      updatedAt: serverTimestamp()
    }

    updateDocumentNonBlocking(doc(db, "leads", selectedLead.id), payload)

    const appointmentPayload = {
      title: `Atendimento: ${selectedLead.name}`,
      type: "Atendimento",
      startDateTime: `${intakeData.date}T${intakeData.time}:00`,
      clientId: selectedLead.id,
      clientName: selectedLead.name,
      meetingType: intakeData.type,
      location: finalLocation,
      meetingLink: meetLink,
      observations: intakeData.observations,
      status: "Agendado",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    addDocumentNonBlocking(collection(db, "appointments"), appointmentPayload)

    setSelectedLead({ ...selectedLead, ...payload })
    setIntakeSuccess(true)
    
    toast({ 
      title: "Atendimento Agendado", 
      description: "O ato foi sincronizado com o Google Calendar da banca." 
    })
  }

  const handleShareIntake = (method: 'whatsapp' | 'email') => {
    if (!selectedLead) return
    
    const date = new Date(selectedLead.scheduledDate).toLocaleDateString('pt-BR')
    const time = selectedLead.scheduledTime
    const location = selectedLead.meetingLocation
    const link = selectedLead.meetingLink
    
    let message = `Olá ${selectedLead.name},\n\nConfirmamos seu agendamento com a banca RGMJ Advogados.\n\n📅 Data: ${date}\n⏰ Horário: ${time}\n📍 Local: ${location}`
    
    if (link) {
      message += `\n🔗 Link da Reunião: ${link}`
    }
    
    message += `\n\nAtenciosamente,\nDr. Reinaldo Gonçalves.`

    if (method === 'whatsapp') {
      const phone = selectedLead.phone?.replace(/\D/g, '')
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank")
    } else {
      const subject = encodeURIComponent("Confirmação de Agendamento - RGMJ Advogados")
      window.open(`mailto:${selectedLead.email}?subject=${subject}&body=${encodeURIComponent(message)}`, "_blank")
    }
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

  const handleRunInterviewAnalysis = async (interview: any) => {
    setIsAiAnalyzing(true)
    setInterviewAnalysis(null)
    try {
      const result = await aiAnalyzeFullInterview({
        clientName: selectedLead.name,
        interviewType: interview.interviewType,
        responses: interview.responses
      })
      setInterviewAnalysis(result)
      if (db) {
        updateDocumentNonBlocking(doc(db, "interviews", interview.id), {
          aiAnalysis: result,
          updatedAt: serverTimestamp()
        })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na análise IA" })
    } finally {
      setIsAiAnalyzing(false)
    }
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

  const handleArchiveLead = (leadId: string) => {
    if (!db) return
    if (!confirm("Confirmar o arquivamento deste lead? Ele será removido do funil ativo.")) return
    updateDocumentNonBlocking(doc(db, "leads", leadId), {
      status: "arquivado",
      updatedAt: serverTimestamp()
    })
    toast({ title: "Lead Arquivado", description: "Registro movido para o histórico passivo." })
  }

  const handleDeleteLead = (leadId: string) => {
    if (!db) return
    if (!confirm("Deseja EXCLUIR PERMANENTEMENTE este lead? Esta ação não pode ser desfeita.")) return
    deleteDocumentNonBlocking(doc(db, "leads", leadId))
    toast({ variant: "destructive", title: "Lead Removido", description: "O dossiê foi apagado da base tática." })
    setIsSheetOpen(false)
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
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 mb-2">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">FUNIL DE LEADS</span>
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Triagem de Oportunidades</h1>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] mt-1 opacity-60">Arraste para mover • Respeite os ritos técnicos.</p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-black font-black gap-3 px-6 h-11 rounded-xl text-xs tracking-widest shadow-xl hover:scale-105 transition-all">
          <PlusCircle className="h-4 w-4" /> NOVO ATENDIMENTO ESTRATÉGICO
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sincronizando Banco de Dados RGMJ...</span>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-12 scrollbar-hide min-h-[700px]">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => {
              const currentStatus = l.status || "novo"
              return currentStatus === col.id
            })
            
            return (
              <div 
                key={col.id} 
                className="min-w-[340px] flex-1 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
              >
                <div className="flex items-center justify-between mb-4 px-4 bg-white/[0.02] py-2.5 rounded-xl border border-white/5 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", col.color.replace('text-', 'bg-'))} />
                    <h3 className={cn("font-black text-[10px] tracking-[0.25em] uppercase", col.color)}>{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/5 text-[10px] border-white/5 font-black h-6 px-2.5 rounded-lg">{leadsInCol.length}</Badge>
                </div>

                <div className={cn(
                  "space-y-4 flex-1 bg-white/[0.01] rounded-2xl p-3 border border-white/5 transition-all duration-300",
                  draggedLeadId && "ring-1 ring-primary/20 bg-primary/[0.01]"
                )}>
                  <AnimatePresence>
                    {leadsInCol.map((lead) => (
                      <motion.div
                        key={lead.id}
                        layoutId={lead.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        className="relative"
                      >
                        <Card 
                          className={cn(
                            "glass hover-gold transition-all cursor-grab active:cursor-grabbing group border-white/5 shadow-lg rounded-xl overflow-hidden",
                            draggedLeadId === lead.id && "opacity-50 grayscale scale-95"
                          )} 
                          onClick={() => handleOpenLead(lead)}
                        >
                          <CardContent className="p-4 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="font-bold text-sm text-white group-hover:text-primary transition-colors uppercase tracking-tight leading-snug truncate">{lead.name}</div>
                                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">ID: {lead.id.substring(0, 8).toUpperCase()}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {lead.meetingType === 'online' && <Video className="h-3.5 w-3.5 text-primary shrink-0 opacity-60" />}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <button className="h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all">
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-[#0d121f] border-white/10 text-white w-44 p-1.5 rounded-xl shadow-2xl">
                                    <DropdownMenuItem onClick={() => handleOpenLead(lead)} className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer rounded-lg h-9">
                                      <Edit3 className="h-3.5 w-3.5" /> Ver Dossiê
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleArchiveLead(lead.id)} className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer rounded-lg h-9 text-amber-500">
                                      <Archive className="h-3.5 w-3.5" /> Arquivar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer rounded-lg h-9 text-rose-500">
                                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <GripVertical className="h-3.5 w-3.5 text-white/10 group-hover:text-primary/40 transition-colors" />
                              </div>
                            </div>
                            
                            <div className="space-y-2.5">
                              {lead.scheduledDate && (
                                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 w-fit">
                                  <Clock className="h-3 w-3 text-amber-500" />
                                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                    {new Date(lead.scheduledDate).toLocaleDateString('pt-BR')} {lead.scheduledTime}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground font-bold uppercase tracking-widest px-0.5">
                                <Building className="h-3 w-3 opacity-40 shrink-0" /> <span className="truncate">{lead.defendantName || "RÉU PENDENTE"}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <div className="flex gap-1.5">
                                {lead.cpf && <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5 font-black uppercase px-1.5 py-0">CPF OK</Badge>}
                                {lead.interviewsCount > 0 && <Badge variant="outline" className="text-[8px] border-primary/20 text-primary bg-primary/5 font-black uppercase px-1.5 py-0">ENTREVISTA</Badge>}
                              </div>
                              <div className="flex items-center gap-1.5 text-primary font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                                ABRIR <ArrowRight className="h-3 w-3" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {leadsInCol.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl opacity-20 space-y-3">
                      <LayoutGrid className="h-6 w-6" />
                      <span className="text-[9px] font-black uppercase tracking-[0.4em]">Vazio</span>
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
              <SheetHeader className="p-6 border-b border-white/5 bg-[#0a0f1e] z-10 flex-none shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
                      <Fingerprint className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <SheetTitle className="text-lg font-bold uppercase tracking-tight text-white">{selectedLead.name}</SheetTitle>
                      <SheetDescription className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.25em] flex items-center gap-2" asChild>
                        <span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> 
                          DOSSIÊ ESTRATÉGICO • ID {selectedLead.id.substring(0, 12).toUpperCase()}
                        </span>
                      </SheetDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => { handleDeleteLead(selectedLead.id); }} variant="outline" className="h-9 border-white/10 bg-white/5 text-[9px] font-black uppercase px-4 rounded-lg gap-2.5 hover:bg-rose-500/10 hover:text-rose-500 text-rose-400">
                      <Trash2 className="h-3.5 w-3.5" /> EXCLUIR
                    </Button>
                    <Button onClick={() => handleSyncDrive()} disabled={isSyncingDrive} variant="outline" className="h-9 border-white/10 bg-white/5 text-[9px] font-black uppercase px-4 rounded-lg gap-2.5 hover:bg-primary/5">
                      {isSyncingDrive ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <CloudLightning className="h-3.5 w-3.5 text-amber-500" />} SINC. DRIVE
                    </Button>
                    <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="h-9 border-white/10 bg-white/5 text-[9px] font-black uppercase px-4 rounded-lg gap-2.5 hover:bg-primary/5">
                      <UserCog className="h-3.5 w-3.5 text-primary" /> EDITAR
                    </Button>
                    <Button onClick={() => setIsSheetOpen(false)} variant="ghost" className="h-9 text-[9px] font-black uppercase px-4 rounded-lg gap-2.5 text-muted-foreground hover:text-white">
                      <X className="h-3.5 w-3.5" /> FECHAR
                    </Button>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="p-4 bg-[#0a0f1e]/60 border-b border-white/5 flex-none overflow-x-auto scrollbar-hide">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-[800px]">
                  {[
                    { label: "Status Operacional", value: selectedLead.status?.toUpperCase() || "NOVO", icon: Zap, color: "text-primary" },
                    { label: "Réu Principal", value: selectedLead.defendantName || "NÃO INFORMADO", icon: Building, color: "text-muted-foreground" },
                    { label: "Canal WhatsApp", value: selectedLead.phone, icon: Phone, color: "text-emerald-500" },
                    { label: "Jurisdição", value: selectedLead.city ? `${selectedLead.city}-${selectedLead.state}` : "N/A", icon: MapPin, color: "text-muted-foreground" },
                  ].map((item, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3.5 shadow-lg">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center bg-black/20 border border-white/5", item.color)}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 opacity-50">{item.label}</p>
                        <p className="text-xs font-bold text-white uppercase truncate tracking-tight">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 bg-[#05070a]">
                <div className="p-6 space-y-6 w-full max-w-[1400px] mx-auto pb-32">
                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-6">
                    <TabsList className="bg-transparent border-b border-white/5 h-10 w-full justify-start rounded-none p-0 gap-8 flex-none overflow-x-auto scrollbar-hide">
                      {[
                        { id: "overview", label: "VISÃO GERAL" },
                        { id: "entrevistas", label: "ENTREVISTAS" },
                        { id: "burocracia", label: "BUROCRACIA" },
                        { id: "revisao", label: "REVISÃO" }
                      ].map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-[0.2em]">{tab.label}</TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500 outline-none w-full">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card 
                          className="glass border-white/5 p-6 rounded-2xl shadow-xl bg-white/[0.01] relative overflow-hidden group cursor-pointer hover:border-amber-500/30 transition-all"
                          onClick={() => setIsSchedulingIntake(true)}
                        >
                          <div className="absolute top-0 right-0 p-6 opacity-5"><Clock className="h-16 w-16" /></div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em] flex items-center gap-2.5"><Clock className="h-4 w-4" /> Cronograma</h4>
                            {selectedLead.scheduledDate && (
                              <div className="flex gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10 rounded-lg" onClick={(e) => { e.stopPropagation(); handleShareIntake('whatsapp'); }}>
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg" onClick={(e) => { e.stopPropagation(); handleShareIntake('email'); }}>
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            <p className="text-lg font-bold text-white uppercase tracking-tighter">
                              {selectedLead.scheduledDate ? `${new Date(selectedLead.scheduledDate).toLocaleDateString('pt-BR')} às ${selectedLead.scheduledTime}` : "AGUARDANDO AGENDAMENTO"}
                            </p>
                            <Badge variant="outline" className="text-[10px] font-black text-muted-foreground border-white/10 px-3 py-1 rounded-lg uppercase tracking-widest bg-white/[0.02]">
                              {selectedLead.meetingType === 'online' ? '🖥️ VIRTUAL RGMJ' : `🏢 PRESENCIAL: ${selectedLead.meetingLocation || 'LOCAL A DEFINIR'}`}
                            </Badge>
                            {selectedLead.meetingLink && (
                              <p className="text-[10px] text-primary font-mono font-bold truncate mt-2 opacity-60">LINK: {selectedLead.meetingLink}</p>
                            )}
                          </div>
                        </Card>
                        <Card className="glass border-primary/15 p-6 rounded-2xl shadow-xl bg-primary/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-5"><Brain className="h-16 w-16" /></div>
                          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2.5 mb-4"><Brain className="h-4 w-4" /> Síntese Estratégica</h4>
                          <p className="text-sm text-white/80 leading-relaxed italic text-justify font-medium">
                            {selectedLead.aiSummary || "Aguardando entrevistas técnicas para consolidar fatos."}
                          </p>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="entrevistas" className="w-full space-y-8 animate-in fade-in duration-700">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 border-b border-white/5 pb-2.5">
                          <PlusCircle className="h-3.5 w-3.5 text-primary" />
                          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Nova Captura Técnica</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {templates?.map(t => (
                            <Button 
                              key={t.id} 
                              onClick={() => handleStartInterview(t)} 
                              variant="outline" 
                              className="glass border-primary/15 text-primary font-black uppercase text-[10px] h-16 gap-4 rounded-xl justify-start px-5 hover:bg-primary hover:text-background transition-all shadow-lg border-2"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Zap className="h-4 w-4" /></div>
                              <span className="truncate flex-1 text-left leading-tight">{t.title}</span>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {leadInterviews && leadInterviews.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2.5 border-b border-white/5 pb-2.5">
                            <FileSearch className="h-3.5 w-3.5 text-emerald-500" />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Entrevistas Concluídas</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {leadInterviews.map((int, idx) => (
                              <Card key={idx} className="glass border-white/5 hover-gold transition-all p-6 rounded-2xl bg-white/[0.01] flex flex-col h-full group shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                  <Badge variant="outline" className="text-[8px] font-black uppercase border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-3 h-6">
                                    CONCLUÍDA
                                  </Badge>
                                  <div className="text-[9px] font-mono font-bold text-muted-foreground uppercase opacity-40 flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    {int.createdAt?.toDate ? new Date(int.createdAt.toDate()).toLocaleDateString('pt-BR') : '---'}
                                  </div>
                                </div>
                                <h4 className="text-base font-bold text-white uppercase tracking-tight mb-6 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                                  {int.interviewType}
                                </h4>
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                  <Button 
                                    variant="outline"
                                    onClick={() => {
                                      setViewingInterview(int);
                                      setInterviewAnalysis(int.aiAnalysis || null);
                                    }}
                                    className="h-10 glass border-white/10 text-white font-black uppercase text-[9px] tracking-widest rounded-lg"
                                  >
                                    VER DOSSIÊ
                                  </Button>
                                  <Button 
                                    onClick={() => handleRunInterviewAnalysis(int)}
                                    className="h-10 gold-gradient text-background font-black uppercase text-[9px] tracking-widest rounded-lg shadow-lg flex items-center gap-2"
                                  >
                                    <Brain className="h-3.5 w-3.5" /> IA
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="burocracia" className="w-full">
                      <BurocraciaView lead={selectedLead} interviews={leadInterviews || []} onEdit={() => setIsEditModeOpen(true)} />
                    </TabsContent>

                    <TabsContent value="revisao" className="space-y-6 animate-in fade-in duration-700 w-full">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg">
                            <ShieldCheck className="h-6 w-6 text-emerald-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest leading-none">Auditoria de Protocolo</h3>
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1.5 opacity-50">Validação final de DNA Jurídico RGMJ.</p>
                          </div>
                        </div>
                        <Button onClick={handleGenerateStrategicSummary} disabled={isGeneratingSummary} className="h-11 px-6 glass border-primary/20 text-primary font-black uppercase text-[10px] gap-2.5 rounded-lg shadow-lg hover:bg-primary/5 transition-all">
                          {isGeneratingSummary ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Brain className="h-4 w-4" />} CONSOLIDAR IA
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {[
                          { title: "Polo Ativo (Autor)", icon: User, data: [
                            { label: "Nome Civil", value: selectedLead.name },
                            { label: "CPF/CNPJ", value: selectedLead.cpf || selectedLead.documentNumber || "NÃO INFORMADO" },
                            { label: "WhatsApp", value: selectedLead.phone },
                            { label: "Endereço", value: selectedLead.address ? `${selectedLead.address}, ${selectedLead.city}` : "PENDENTE" },
                          ]},
                          { title: "Polo Passivo (Réu)", icon: Building, data: [
                            { label: "Razão Social", value: selectedLead.defendantName || "NÃO INFORMADO" },
                            { label: "Documento", value: selectedLead.defendantDocument || "NÃO INFORMADO" },
                            { label: "Endereço", value: selectedLead.defendantAddress || "NÃO MAPEADO" },
                          ]},
                          { title: "Logística", icon: Gavel, data: [
                            { label: "Tribunal", value: selectedLead.court || "NÃO MAPEADO" },
                            { label: "Vara", value: selectedLead.vara || "NÃO MAPEADA" },
                            { label: "Endereço Juízo", value: selectedLead.courtAddress || "PENDENTE" },
                          ]}
                        ].map((section, idx) => (
                          <Card key={idx} className="glass border-white/5 p-6 rounded-2xl space-y-5 shadow-xl bg-white/[0.01]">
                            <div className="flex items-center gap-3.5 border-b border-white/5 pb-3.5">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><section.icon className="h-3.5 w-3.5 text-primary" /></div>
                              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{section.title}</span>
                            </div>
                            <div className="space-y-4">
                              {section.data.map(item => (
                                <div key={item.label}>
                                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 opacity-40">{item.label}</p>
                                  <p className="text-xs font-bold text-white uppercase tracking-tight">{item.value}</p>
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>

                      {strategicSummary && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-2 duration-700">
                          {[
                            { t: "Fatos", v: strategicSummary.keyFacts, c: "text-primary", icon: Brain, bg: "bg-primary/5" },
                            { t: "Riscos", v: strategicSummary.risksAndChallenges, c: "text-rose-500", icon: ShieldAlert, bg: "bg-rose-500/5" },
                            { t: "Tese", v: strategicSummary.strategicAnalysis, icon: Zap, c: "text-emerald-500", bg: "bg-emerald-500/5" }
                          ].map(s => (
                            <div key={s.t} className={cn("p-6 rounded-2xl border border-white/5 space-y-4 shadow-xl relative overflow-hidden", s.bg)}>
                              <div className="flex items-center gap-2.5">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 border border-white/5", s.c)}>
                                  <s.icon className="h-4 w-4" />
                                </div>
                                <h5 className={cn("text-[9px] font-black uppercase tracking-[0.25em]", s.c)}>{s.t}</h5>
                              </div>
                              <p className="text-xs text-white/80 leading-relaxed text-justify font-medium">{s.v}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/20 flex flex-col md:flex-row items-end gap-6 w-full shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><FileCheck className="h-16 w-16 text-purple-500" /></div>
                        <div className="flex-1 space-y-3 w-full relative z-10">
                          <Label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.25em] flex items-center gap-2.5">
                            <FileCheck className="h-4 w-4" /> PROTOCOLO CNJ *
                          </Label>
                          <Input 
                            placeholder="0000000-00.0000.0.00.0000" 
                            className="bg-black/60 border-purple-500/30 h-14 text-white font-mono text-lg font-black w-full tracking-[0.15em] rounded-xl px-6" 
                            value={selectedLead.processNumber || ""} 
                            onChange={(e) => setSelectedLead({...selectedLead, processNumber: e.target.value})} 
                          />
                        </div>
                        <Button 
                          onClick={() => setIsConversionOpen(true)} 
                          className="gold-gradient text-black font-black h-14 px-8 rounded-xl uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-all relative z-10"
                        >
                          PROTOCOLAR E CONVERTER
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              <div className="flex-none p-4 border-t border-white/5 bg-[#0a0f1e] flex items-center justify-between z-20 shadow-2xl">
                <Button 
                  variant="ghost" 
                  onClick={handlePrevTab} 
                  disabled={!canGoBack}
                  className="text-muted-foreground uppercase font-black text-[9px] tracking-widest gap-2.5 px-6 h-10 hover:text-white transition-all"
                >
                  <ArrowLeft className="h-4 w-4" /> ANTERIOR
                </Button>

                <div className="hidden md:flex gap-3">
                  {DOSSIER_TABS.map((tab, i) => (
                    <div 
                      key={tab} 
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-500",
                        activeDossierTab === tab ? "bg-primary shadow-[0_0_8px_rgba(245,208,48,0.5)] scale-125" : i < currentTabIndex ? "bg-emerald-500" : "bg-white/10"
                      )} 
                    />
                  ))}
                </div>

                {canGoNext ? (
                  <Button 
                    onClick={handleNextTab} 
                    className="gold-gradient text-black font-black h-10 px-8 rounded-lg uppercase text-[9px] tracking-widest gap-2.5 shadow-lg hover:scale-102 transition-all"
                  >
                    PRÓXIMO RITO <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="px-6 h-10 flex items-center bg-white/5 rounded-lg border border-white/5">
                    <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> FASE FINAL
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!viewingInterview} onOpenChange={(open) => !open && setViewingInterview(null)}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[80vh]">
          <div className="p-5 bg-[#0a0f1e] border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 flex-none">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
                <FileSearch className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold uppercase tracking-widest">Dossiê de Atendimento</DialogTitle>
                <DialogDescription className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-50 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> AUDITORIA RGMJ
                </DialogDescription>
              </div>
            </div>
            <Button 
              onClick={() => handleRunInterviewAnalysis(viewingInterview)} 
              disabled={isAiAnalyzing}
              className="h-10 px-5 gold-gradient text-background font-black uppercase text-[9px] gap-2.5 rounded-lg shadow-lg hover:scale-105 transition-all"
            >
              {isAiAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Sparkles className="h-3.5 w-3.5" />} ANALISAR IA
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="transcricao" className="h-full flex flex-col">
              <div className="px-5 bg-black/20 border-b border-white/5 flex-none">
                <TabsList className="bg-transparent h-10 gap-6 p-0">
                  <TabsTrigger value="transcricao" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary tracking-widest">
                    Transcrição
                  </TabsTrigger>
                  <TabsTrigger value="analise" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary tracking-widest">
                    Análise IA
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden p-5">
                <TabsContent value="transcricao" className="h-full mt-0">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-5 max-w-3xl mx-auto pb-10">
                      {viewingInterview && Object.entries(viewingInterview.responses || {}).map(([q, a]: any, i) => (
                        <div key={i} className="space-y-1.5">
                          <h5 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{q}</h5>
                          <p className="text-sm text-white font-medium uppercase leading-relaxed text-justify border-l border-white/5 pl-3">
                            {String(a)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="analise" className="h-full mt-0">
                  {isAiAnalyzing ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                      <Brain className="h-12 w-12 text-primary animate-pulse" />
                      <p className="text-[10px] font-bold text-white uppercase tracking-widest">Processando Inteligência...</p>
                    </div>
                  ) : interviewAnalysis ? (
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-6 max-w-4xl mx-auto pb-10">
                        <Card className="glass border-primary/20 bg-primary/5 p-5 rounded-2xl shadow-lg">
                          <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Resumo Executivo</h5>
                          <p className="text-sm text-white/90 leading-relaxed font-medium">{interviewAnalysis.summary}</p>
                        </Card>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="glass border-rose-500/20 bg-rose-500/5 p-5 rounded-2xl">
                            <h5 className="text-[10px] font-black text-rose-500 uppercase mb-3">Teses & Riscos</h5>
                            <p className="text-xs text-white/80 leading-relaxed font-medium">{interviewAnalysis.legalAnalysis}</p>
                          </Card>
                          <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-5 rounded-2xl">
                            <h5 className="text-[10px] font-black text-emerald-500 uppercase mb-3">Recomendações</h5>
                            <p className="text-xs text-white/80 leading-relaxed font-medium">{interviewAnalysis.recommendations}</p>
                          </Card>
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-3">
                      <Sparkles className="h-10 w-10" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aguardando Comando</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSchedulingIntake} onOpenChange={(open) => {
        setIsSchedulingIntake(open);
        if (!open) setIntakeSuccess(false);
      }}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl font-sans rounded-2xl">
          {!intakeSuccess ? (
            <>
              <div className="p-6 bg-[#0a0f1e] border-b border-white/5">
                <DialogHeader>
                  <DialogTitle className="text-white font-headline text-lg uppercase tracking-widest flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-amber-500" /> Agendar Atendimento
                  </DialogTitle>
                </DialogHeader>
              </div>
              
              <ScrollArea className="max-h-[60vh]">
                <div className="p-8 space-y-6 bg-[#0a0f1e]/50">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Modalidade</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setIntakeData({...intakeData, type: 'online'})}
                        className={cn(
                          "h-14 flex items-center justify-center gap-3 rounded-xl border-2 transition-all font-black uppercase text-[10px] tracking-widest",
                          intakeData.type === 'online' 
                            ? "bg-primary text-background border-primary shadow-[0_0_15px_rgba(245,208,48,0.3)]" 
                            : "bg-white/[0.02] border-white/5 text-white hover:border-white/20"
                        )}
                      >
                        <Video className="h-4 w-4" /> REUNIÃO ONLINE
                      </button>
                      <button 
                        onClick={() => setIntakeData({...intakeData, type: 'presencial'})}
                        className={cn(
                          "h-14 flex items-center justify-center gap-3 rounded-xl border-2 transition-all font-black uppercase text-[10px] tracking-widest",
                          intakeData.type === 'presencial' 
                            ? "bg-primary text-background border-primary shadow-[0_0_15px_rgba(245,208,48,0.3)]" 
                            : "bg-white/[0.02] border-white/5 text-white hover:border-white/20"
                        )}
                      >
                        <MapPin className="h-4 w-4" /> PRESENCIAL
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data</Label>
                      <Input type="date" value={intakeData.date} onChange={(e) => setIntakeData({...intakeData, date: e.target.value})} className="glass h-12 text-white font-bold border-white/10 text-xs rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Horário</Label>
                      <Input type="time" value={intakeData.time} onChange={(e) => setIntakeData({...intakeData, time: e.target.value})} className="glass h-12 text-white font-bold border-white/10 text-xs rounded-xl" />
                    </div>
                  </div>

                  {intakeData.type === 'presencial' && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Local do Atendimento</Label>
                      <Select value={intakeData.locationType} onValueChange={(v) => setIntakeData({...intakeData, locationType: v})}>
                        <SelectTrigger className="glass h-12 text-white font-bold uppercase text-[10px] rounded-xl border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d121f] text-white">
                          <SelectItem value="sede">🏢 SEDE RGMJ (OFICIAL)</SelectItem>
                          <SelectItem value="externo">📍 ENDEREÇO EXTERNO</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {intakeData.locationType === 'externo' && (
                        <div className="relative mt-2">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                          <Input 
                            placeholder="BUSCAR ENDEREÇO..." 
                            className="glass h-12 pl-12 text-white text-xs font-bold uppercase rounded-xl border-white/10"
                            value={locationSearch}
                            onChange={(e) => setLocationSearch(e.target.value)}
                          />
                          {isSearchingLocation && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                          
                          {locationResults.length > 0 && (
                            <div className="absolute z-[100] w-full mt-2 bg-[#0d121f] border border-primary/20 rounded-xl overflow-hidden shadow-2xl">
                              {locationResults.map((place, i) => (
                                <button key={i} onClick={() => handleSelectLocation(place)} className="w-full p-4 text-left hover:bg-primary/10 border-b border-white/5 last:border-0 transition-all">
                                  <p className="text-[10px] font-bold text-white uppercase leading-tight">{place.display_name}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Observações Táticas</Label>
                    <Textarea 
                      placeholder="INSTRUÇÕES PARA O RITO..."
                      className="glass min-h-[100px] text-white text-[11px] uppercase font-bold border-white/10 focus:ring-primary/50 resize-none p-4 rounded-xl"
                      value={intakeData.observations}
                      onChange={(e) => setIntakeData({...intakeData, observations: e.target.value})}
                    />
                  </div>
                </div>
              </ScrollArea>

              <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
                <button 
                  onClick={() => setIsSchedulingIntake(false)} 
                  className="text-muted-foreground font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                >
                  CANCELAR
                </button>
                <Button 
                  onClick={handleScheduleIntake} 
                  className="gold-gradient text-black font-black h-14 px-10 rounded-xl uppercase text-[11px] tracking-widest shadow-2xl hover:scale-[1.02] transition-all"
                >
                  CONFIRMAR AGENDA
                </Button>
              </div>
            </>
          ) : (
            <div className="p-12 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Atendimento Agendado</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">O rito foi sincronizado com a pauta estratégica.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <Button 
                  onClick={() => handleShareIntake('whatsapp')}
                  className="h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest gap-3 rounded-xl"
                >
                  <MessageCircle className="h-4 w-4" /> ENVIAR WHATSAPP
                </Button>
                <Button 
                  onClick={() => handleShareIntake('email')}
                  variant="outline"
                  className="h-14 glass border-white/10 text-white font-black uppercase text-[10px] tracking-widest gap-3 rounded-xl"
                >
                  <Mail className="h-4 w-4" /> NOTIFICAR POR E-MAIL
                </Button>
              </div>
              
              <button 
                onClick={() => setIsSchedulingIntake(false)}
                className="text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:text-white transition-colors pt-4"
              >
                FECHAR E RETORNAR AO FUNIL
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl">
          <DialogHeader className="p-5 bg-[#0a0f1e] border-b border-white/5">
            <DialogTitle className="text-white font-bold uppercase tracking-widest text-lg">Atendimento Técnico Estratégico</DialogTitle>
          </DialogHeader>
          {executingTemplate && (
            <DynamicInterviewExecution template={executingTemplate} onSubmit={handleFinishInterview} onCancel={() => setIsInterviewDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[80vh]">
          <DialogHeader className="p-5 bg-[#0a0f1e] border-b border-white/5 flex-none">
            <DialogTitle className="text-white text-lg font-bold uppercase tracking-widest">Migração para Acervo Ativo</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
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
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl h-full">
          <SheetHeader className="p-5 border-b border-white/5 bg-[#0a0f1e] shadow-xl flex-none">
            <SheetTitle className="text-lg font-bold text-white uppercase tracking-widest">Novo Atendimento RGMJ</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0">
            <LeadForm 
              existingLeads={leads} 
              onSubmit={(data) => {
                addDocumentNonBlocking(collection(db!, "leads"), { ...data, assignedStaffId: user?.uid, status: "novo", driveStatus: "pendente", createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
                setIsNewEntryOpen(false)
                toast({ title: "Atendimento Iniciado" })
              }} 
              onSelectExisting={(l) => { handleOpenLead(l); setIsNewEntryOpen(false); }} 
              onCancel={() => setIsNewEntryOpen(false)}
              defaultResponsibleLawyer={user?.displayName || ""}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isEditModeOpen} onOpenChange={setIsEditModeOpen}>
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl h-full">
          <SheetHeader className="p-5 border-b border-white/5 bg-[#0a0f1e] shadow-xl flex-none">
            <SheetTitle className="text-lg font-bold text-white uppercase tracking-widest">Qualificação Estratégica</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0">
            {selectedLead && (
              <LeadForm 
                existingLeads={[]}
                initialData={selectedLead}
                lockMode={true}
                onSubmit={async (data) => {
                  await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), { ...data, updatedAt: serverTimestamp() })
                  setSelectedLead({ ...selectedLead, ...data })
                  setIsEditModeOpen(false)
                  toast({ title: "Qualificação Atualizada" })
                }}
                onSelectExisting={() => {}}
                onCancel={() => setIsEditModeOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
