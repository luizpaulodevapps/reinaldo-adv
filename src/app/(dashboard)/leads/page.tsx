"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  PlusCircle, 
  Search, 
  ChevronRight, 
  Clock, 
  Zap, 
  Brain,
  Loader2,
  LayoutGrid,
  Video,
  MessageCircle,
  ShieldCheck,
  Gavel,
  Scale,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  UserCog,
  Building,
  Database,
  CloudLightning,
  UserPlus,
  Archive,
  Trash2,
  Sparkles,
  TrendingUp,
  Fingerprint,
  Navigation,
  ArrowLeft,
  ArrowRight,
  Lock,
  CheckSquare,
  ShieldAlert
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
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { LeadForm } from "@/components/leads/lead-form"
import { collection, query, serverTimestamp, doc, where, limit, orderBy } from "firebase/firestore"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { cn } from "@/lib/utils"
import { DynamicInterviewExecution } from "@/components/interviews/dynamic-interview-execution"
import { BurocraciaView } from "@/components/leads/burocracia-view"
import { ProcessForm } from "@/components/cases/process-form"
import Link from "next/link"
import { generateCaseSummary, type GenerateCaseSummaryOutput } from "@/ai/flows/ai-generate-case-summary"

const columns = [
  { id: "novo", title: "NOVO", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-emerald-400" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

export default function LeadsPage() {
  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const leadsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "leads"), orderBy("updatedAt", "desc"), limit(100))
  }, [db, user])

  const { data: leadsData, isLoading } = useCollection(leadsQuery)
  const leads = leadsData || []

  const clientsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "clients"))
  }, [db, user])
  const { data: clients } = useCollection(clientsQuery)

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [isEditModeOpen, setIsEditModeOpen] = useState(false)
  const [isConversionOpen, setIsConversionOpen] = useState(false)
  const [activeDossierTab, setActiveDossierTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [isSyncingDrive, setIsSyncingDrive] = useState(false)
  
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false)
  const [executingTemplate, setExecutingTemplate] = useState<any>(null)

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [strategicSummary, setStrategicSummary] = useState<GenerateCaseSummaryOutput | null>(null)

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

  const bureaucracyReport = useMemo(() => {
    if (!selectedLead) return { isComplete: false, missing: [] }
    const missing = []
    if (!selectedLead.defendantName) missing.push("NOME DO RÉU")
    if (!selectedLead.court) missing.push("ÓRGÃO JUDICIAL")
    if (!selectedLead.vara) missing.push("VARA")
    if (!selectedLead.driveStatus || selectedLead.driveStatus === 'pendente') missing.push("SINCRONISMO DRIVE")
    
    return { isComplete: missing.length === 0, missing }
  }, [selectedLead])

  const isBureaucracyComplete = bureaucracyReport.isComplete

  const missingFields = useMemo(() => {
    if (!selectedLead) return []
    const missing = []
    if (!selectedLead.cpf && !selectedLead.documentNumber) missing.push("CPF/CNPJ")
    if (!selectedLead.email) missing.push("E-MAIL")
    if (!selectedLead.phone) missing.push("WHATSAPP")
    if (!selectedLead.city) missing.push("LOCALIDADE")
    return missing
  }, [selectedLead])

  const isProfileIncomplete = missingFields.length > 0

  useEffect(() => {
    if (selectedLead) {
      if (selectedLead.status === 'atendimento') setActiveDossierTab("entrevistas")
      else if (selectedLead.status === 'burocracia') setActiveDossierTab("burocracia")
      else if (selectedLead.status === 'distribuicao') setActiveDossierTab("protocolo")
      else setActiveDossierTab("overview")
      setStrategicSummary(null)
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

  const handleUpdateStatus = async (status: string) => {
    if (!selectedLead || !db) return
    if (status === 'distribuicao' && !isBureaucracyComplete) {
      toast({ variant: "destructive", title: "Acesso Bloqueado", description: `Pendências: ${bureaucracyReport.missing.join(", ")}` })
      return
    }
    await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
      status,
      updatedAt: serverTimestamp()
    })
    setSelectedLead({ ...selectedLead, status })
    toast({ title: "Status Atualizado" })
  }

  const handleDeleteLead = async () => {
    if (!selectedLead || !db) return
    if (confirm(`Deseja EXCLUIR permanentemente o lead ${selectedLead.name}?`)) {
      await deleteDocumentNonBlocking(doc(db!, "leads", selectedLead.id))
      setIsSheetOpen(false)
      setSelectedLead(null)
      toast({ variant: "destructive", title: "Lead Excluído" })
    }
  }

  const handleArchiveLead = async () => {
    if (!selectedLead || !db) return
    if (confirm(`Deseja ARQUIVAR o lead ${selectedLead.name}?`)) {
      await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
        status: "arquivado",
        updatedAt: serverTimestamp()
      })
      setIsSheetOpen(false)
      setSelectedLead(null)
      toast({ title: "Lead Arquivado" })
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
    }, 1500)
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
    if (selectedLead.status === 'novo') {
      await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
        status: "atendimento",
        updatedAt: serverTimestamp()
      })
    }
    setIsInterviewDialogOpen(false)
    setExecutingTemplate(null)
    toast({ title: "Entrevista Registrada" })
  }

  const handleConvertProcess = (data: any) => {
    if (!db || !selectedLead) return
    const processPayload = {
      ...data,
      leadId: selectedLead.id,
      status: "Em Andamento",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    addDocumentNonBlocking(collection(db!, "processes"), processPayload)
    updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
      status: "arquivado",
      convertedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    setIsConversionOpen(false)
    setIsSheetOpen(false)
    toast({ title: "Processo Protocolado" })
  }

  const isAlreadyClient = useMemo(() => {
    if (!selectedLead || !clients) return false
    const leadDoc = (selectedLead.cpf || selectedLead.documentNumber || "").replace(/\D/g, "")
    if (!leadDoc) return false
    return clients.some(c => (c.documentNumber || "").replace(/\D/g, "") === leadDoc)
  }, [selectedLead, clients])

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-black text-muted-foreground/40 mb-2">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">FUNIL DE LEADS</span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Leads</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[9px] font-bold opacity-60">Triagem Estratégica RGMJ.</p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-background font-black gap-2 px-6 h-10 rounded-lg shadow-lg uppercase text-[10px] tracking-widest">
          <PlusCircle className="h-4 w-4" /> NOVO ATENDIMENTO
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando...</span>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => (l.status || "novo") === col.id)
            return (
              <div key={col.id} className="min-w-[280px] flex-1">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                    <h3 className={`font-black text-[10px] tracking-widest uppercase ${col.color}`}>{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/50 text-[9px] border-white/5 font-black h-5 px-2">{leadsInCol.length}</Badge>
                </div>
                <div className="space-y-3">
                  {leadsInCol.map((lead) => (
                    <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group border-white/5 shadow-md" onClick={() => handleOpenLead(lead)}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs text-white group-hover:text-primary transition-colors uppercase tracking-tight flex-1 truncate">{lead.name}</div>
                          {lead.meetingType === 'online' && <Video className="h-3.5 w-3.5 text-primary animate-pulse" />}
                        </div>
                        {lead.scheduledDate && (
                          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-amber-500/5 border border-amber-500/10">
                            <Clock className="h-3 w-3 text-amber-500" />
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                              {new Date(lead.scheduledDate).toLocaleDateString('pt-BR')} {lead.scheduledTime}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                            {lead.updatedAt?.toDate ? new Date(lead.updatedAt.toDate()).toLocaleDateString() : 'HOJE'}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]">
          {selectedLead && (
            <div className="flex flex-col h-full">
              <div className="p-6 md:p-8 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl space-y-6 flex-none shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase font-black px-3 py-1 tracking-widest bg-primary/5">
                        {(selectedLead.status || "novo").toUpperCase()}
                      </Badge>
                      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full border", isAlreadyClient ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20")}>
                        <Fingerprint className={cn("h-3 w-3", isAlreadyClient ? "text-emerald-500" : "text-amber-500")} />
                        <span className={cn("text-[8px] font-black uppercase tracking-widest", isAlreadyClient ? "text-emerald-500" : "text-amber-500")}>
                          {isAlreadyClient ? "VINCULADO" : "PENDENTE"}
                        </span>
                      </div>
                    </div>
                    <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight">{selectedLead.name}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="h-8 border-white/10 bg-white/5 text-white hover:bg-white/10 text-[9px] font-black uppercase gap-2 px-4 rounded-md">
                        <UserCog className="h-3.5 w-3.5" /> EDITAR
                      </Button>
                      <Button onClick={handleSyncDrive} disabled={isSyncingDrive} variant="outline" className="h-8 border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-white text-[9px] font-black uppercase gap-2 px-4 rounded-md">
                        {isSyncingDrive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudLightning className="h-3.5 w-3.5" />} DRIVE
                      </Button>
                      <Button onClick={handleArchiveLead} variant="outline" className="h-8 border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500 hover:text-white text-[9px] font-black uppercase gap-2 px-4 rounded-md">
                        <Archive className="h-3.5 w-3.5" /> ARQUIVAR
                      </Button>
                      <Button onClick={handleDeleteLead} variant="outline" className="h-8 border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white text-[9px] font-black uppercase gap-2 px-4 rounded-md">
                        <Trash2 className="h-3.5 w-3.5" /> EXCLUIR
                      </Button>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-1.5 rounded-xl flex flex-col gap-1 w-full lg:w-48">
                    {columns.map(c => (
                      <button key={c.id} onClick={() => handleUpdateStatus(c.id)} className={cn("h-8 px-3 text-[9px] font-black uppercase tracking-widest rounded-md transition-all flex items-center justify-between", selectedLead.status === c.id ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
                        {c.title} {selectedLead.status === c.id && <CheckCircle2 className="h-3 w-3 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "RÉU / EMPRESA", value: selectedLead.defendantName || "N/D", icon: Building },
                    { label: "WHATSAPP", value: selectedLead.phone, icon: Phone },
                    { label: "EMAIL", value: selectedLead.email || "N/I", icon: Mail },
                    { label: "LOCALIDADE", value: selectedLead.city ? `${selectedLead.city}-${selectedLead.state}` : "N/A", icon: MapPin },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-primary/60 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                        <p className="text-[10px] font-bold text-white uppercase truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 bg-[#0a0f1e]/30">
                <div className="p-6 md:p-8 pb-20 space-y-8 max-w-6xl mx-auto">
                  {isProfileIncomplete && (
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">Saneamento Pendente: <span className="text-amber-400">{missingFields.join(", ")}</span></p>
                      </div>
                      <Button onClick={() => setIsEditModeOpen(true)} className="h-8 px-4 gold-gradient text-background font-black uppercase text-[9px] tracking-widest rounded-md">SANEAR</Button>
                    </div>
                  )}

                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-6">
                    <TabsList className="bg-transparent border-b border-white/5 h-10 w-full justify-start rounded-none p-0 gap-6">
                      {["VISÃO GERAL", "ENTREVISTAS", "BUROCRACIA", "REVISÃO & PROTOCOLO"].map(label => (
                        <TabsTrigger key={label} value={label.toLowerCase().split(' ')[0]} className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-widest">{label}</TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500 outline-none">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="glass border-white/5 p-6 rounded-2xl">
                          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-4"><Clock className="h-3.5 w-3.5" /> AGENDAMENTO</h4>
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-white uppercase">{selectedLead.scheduledDate ? `${new Date(selectedLead.scheduledDate).toLocaleDateString()} ÀS ${selectedLead.scheduledTime}` : "SEM DATA AGENDADA"}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black">{selectedLead.meetingType === 'online' ? '🖥️ VIRTUAL' : '🏢 PRESENCIAL'}</p>
                          </div>
                        </Card>
                        <Card className="glass border-primary/10 p-6 rounded-2xl">
                          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 mb-4"><Brain className="h-3.5 w-3.5" /> SÍNTESE IA</h4>
                          <p className="text-[11px] text-white/80 leading-relaxed italic line-clamp-4">{selectedLead.aiSummary || "Aguardando consolidação..."}</p>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="entrevistas" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {templates?.map(t => (
                          <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/20 text-primary font-black uppercase text-[9px] h-12 gap-2 rounded-xl">
                            <Zap className="h-3.5 w-3.5" /> {t.title}
                          </Button>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="burocracia">
                      <BurocraciaView lead={selectedLead} interviews={leadInterviews || []} onEdit={() => setIsEditModeOpen(true)} />
                    </TabsContent>

                    <TabsContent value="revisão" className="space-y-8">
                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-primary" /> Check-in de Protocolo</h3>
                        <Button onClick={handleGenerateStrategicSummary} disabled={isGeneratingSummary} className="h-10 px-6 glass border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-lg">
                          {isGeneratingSummary ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />} CONSOLIDAR ESTRATÉGIA
                        </Button>
                      </div>
                      
                      {strategicSummary && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {[
                            { t: "Fatos Críticos", v: strategicSummary.keyFacts, c: "text-primary" },
                            { t: "Riscos", v: strategicSummary.risksAndChallenges, c: "text-rose-500" },
                            { t: "Análise", v: strategicSummary.strategicAnalysis, c: "text-emerald-500" }
                          ].map(s => (
                            <div key={s.t} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                              <h5 className={cn("text-[9px] font-black uppercase tracking-widest mb-2", s.c)}>{s.t}</h5>
                              <p className="text-[10px] text-white/70 leading-relaxed text-justify">{s.v}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/10 space-y-4">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NÚMERO DO PROCESSO (CNJ) *</Label>
                        <div className="flex gap-2">
                          <Input placeholder="0000000-00.0000.0.00.0000" className="glass border-white/10 h-12 text-white font-mono text-lg font-black focus:ring-purple-500/50" value={selectedLead.processNumber || ""} onChange={(e) => setSelectedLead({...selectedLead, processNumber: e.target.value})} />
                          <Button onClick={() => setIsConversionOpen(true)} className="gold-gradient text-background font-black h-12 px-8 rounded-xl uppercase text-[10px] tracking-widest shadow-lg">CONVERTER</Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
          {executingTemplate && (
            <DynamicInterviewExecution template={executingTemplate} onSubmit={handleFinishInterview} onCancel={() => setIsInterviewDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
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
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]">
          <div className="p-6 border-b border-white/5"><h2 className="text-xl font-black text-white uppercase tracking-tight">Novo Lead RGMJ</h2></div>
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
        </SheetContent>
      </Sheet>

      <Sheet open={isEditModeOpen} onOpenChange={setIsEditModeOpen}>
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]">
          <div className="p-6 border-b border-white/5"><h2 className="text-xl font-black text-white uppercase tracking-tight">Retificar Dossiê</h2></div>
          {selectedLead && (
            <LeadForm 
              existingLeads={[]}
              initialData={selectedLead}
              initialMode="complete"
              lockMode={true}
              onSubmit={async (data) => {
                await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), { ...data, updatedAt: serverTimestamp() })
                setSelectedLead({ ...selectedLead, ...data })
                setIsEditModeOpen(false)
                toast({ title: "Cadastro Atualizado" })
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