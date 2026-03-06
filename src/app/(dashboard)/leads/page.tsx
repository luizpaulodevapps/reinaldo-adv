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
  DialogDescription
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
    if (!selectedLead.driveStatus || selectedLead.driveStatus === 'pendente') missing.push("DRIVE")
    
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
      else if (selectedLead.status === 'distribuicao') setActiveDossierTab("revisão")
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
      toast({ variant: "destructive", title: "Bloqueado", description: `Pendências: ${bureaucracyReport.missing.join(", ")}` })
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
    if (confirm(`Excluir permanentemente o lead ${selectedLead.name}?`)) {
      await deleteDocumentNonBlocking(doc(db!, "leads", selectedLead.id))
      setIsSheetOpen(false)
      setSelectedLead(null)
      toast({ variant: "destructive", title: "Lead Excluído" })
    }
  }

  const handleArchiveLead = async () => {
    if (!selectedLead || !db) return
    if (confirm(`Arquivar o lead ${selectedLead.name}?`)) {
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
    <div className="space-y-3 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-muted-foreground/40 mb-0.5">
            <LayoutGrid className="h-2.5 w-2.5" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-1.5 w-1.5" />
            <span className="text-white">FUNIL DE LEADS</span>
          </div>
          <h1 className="text-lg font-bold text-white uppercase tracking-tight">Triagem de Leads</h1>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-background font-bold gap-1.5 px-3 h-8 rounded text-[9px] tracking-wider">
          <PlusCircle className="h-3 w-3" /> NOVO LEAD
        </Button>
      </div>

      {isLoading ? (
        <div className="py-10 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Sincronizando...</span>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => (l.status || "novo") === col.id)
            return (
              <div key={col.id} className="min-w-[220px] flex-1">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                    <h3 className={`font-bold text-[9px] tracking-wider uppercase ${col.color}`}>{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/50 text-[8px] border-white/5 font-bold h-3.5 px-1">{leadsInCol.length}</Badge>
                </div>
                <div className="space-y-1.5">
                  {leadsInCol.map((lead) => (
                    <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group border-white/5 shadow-sm" onClick={() => handleOpenLead(lead)}>
                      <CardContent className="p-2.5 space-y-1.5">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="font-bold text-[10px] text-white group-hover:text-primary transition-colors uppercase tracking-tight flex-1 truncate">{lead.name}</div>
                          {lead.meetingType === 'online' && <Video className="h-2.5 w-2.5 text-primary" />}
                        </div>
                        {lead.scheduledDate && (
                          <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-amber-500/5 border border-amber-500/10">
                            <Clock className="h-2 w-2 text-amber-500" />
                            <span className="text-[8px] font-bold text-amber-500 uppercase">
                              {new Date(lead.scheduledDate).toLocaleDateString('pt-BR')} {lead.scheduledTime}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <span className="text-[7px] font-bold text-muted-foreground/40 uppercase">
                            {lead.updatedAt?.toDate ? new Date(lead.updatedAt.toDate()).toLocaleDateString() : 'HOJE'}
                          </span>
                          <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 group-hover:text-primary" />
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
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a]">
          {selectedLead && (
            <div className="flex flex-col h-full">
              <SheetHeader className="sr-only">
                <SheetTitle>{selectedLead.name}</SheetTitle>
                <SheetDescription>Dossiê detalhado do lead RGMJ</SheetDescription>
              </SheetHeader>
              
              <div className="p-3 md:p-4 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl space-y-3 flex-none shadow-lg">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[8px] border-primary/20 text-primary uppercase font-bold px-1.5 py-0 tracking-wider bg-primary/5">
                        {(selectedLead.status || "novo").toUpperCase()}
                      </Badge>
                      <div className={cn("flex items-center gap-1 px-1 py-0 rounded-full border", isAlreadyClient ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20")}>
                        <Fingerprint className={cn("h-2 w-2", isAlreadyClient ? "text-emerald-500" : "text-amber-500")} />
                        <span className={cn("text-[7px] font-bold uppercase tracking-wider", isAlreadyClient ? "text-emerald-500" : "text-amber-500")}>
                          {isAlreadyClient ? "VINCULADO" : "PENDENTE"}
                        </span>
                      </div>
                    </div>
                    <h2 className="text-base md:text-lg font-bold text-white uppercase tracking-tight">{selectedLead.name}</h2>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="h-6 border-white/10 bg-white/5 text-white text-[8px] font-bold uppercase px-2 rounded">
                        <UserCog className="h-2.5 w-2.5 mr-1" /> EDITAR
                      </Button>
                      <Button onClick={handleSyncDrive} disabled={isSyncingDrive} variant="outline" className="h-6 border-amber-500/20 bg-amber-500/5 text-amber-500 text-[8px] font-bold uppercase px-2 rounded">
                        {isSyncingDrive ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <CloudLightning className="h-2.5 w-2.5 mr-1" />} DRIVE
                      </Button>
                      <Button onClick={handleArchiveLead} variant="outline" className="h-6 border-blue-500/20 bg-blue-500/5 text-blue-400 text-[8px] font-bold uppercase px-2 rounded">
                        <Archive className="h-2.5 w-2.5 mr-1" /> ARQUIVAR
                      </Button>
                      <Button onClick={handleDeleteLead} variant="outline" className="h-6 border-rose-500/20 bg-rose-500/5 text-rose-500 text-[8px] font-bold uppercase px-2 rounded">
                        <Trash2 className="h-2.5 w-2.5 mr-1" /> EXCLUIR
                      </Button>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-0.5 rounded flex flex-col gap-0.5 w-full lg:w-36">
                    {columns.map(c => (
                      <button key={c.id} onClick={() => handleUpdateStatus(c.id)} className={cn("h-6 px-1.5 text-[8px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-between", selectedLead.status === c.id ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
                        {c.title} {selectedLead.status === c.id && <CheckCircle2 className="h-2 w-2 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
                  {[
                    { label: "RÉU", value: selectedLead.defendantName || "N/D", icon: Building },
                    { label: "WHATSAPP", value: selectedLead.phone, icon: Phone },
                    { label: "EMAIL", value: selectedLead.email || "N/I", icon: Mail },
                    { label: "LOCALIDADE", value: selectedLead.city ? `${selectedLead.city}-${selectedLead.state}` : "N/A", icon: MapPin },
                  ].map((item, i) => (
                    <div key={i} className="p-1.5 rounded bg-white/[0.02] border border-white/5 flex items-center gap-1.5">
                      <item.icon className="h-2.5 w-2.5 text-primary/60 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[7px] font-bold text-muted-foreground uppercase">{item.label}</p>
                        <p className="text-[8px] font-bold text-white uppercase truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 bg-[#05070a]">
                <div className="p-3 md:p-4 pb-16 space-y-4 max-w-5xl mx-auto">
                  {isProfileIncomplete && (
                    <div className="p-2 rounded bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="h-3 w-3 text-amber-500" />
                        <p className="text-[8px] font-bold text-white uppercase tracking-wider">Pendências: <span className="text-amber-400">{missingFields.join(", ")}</span></p>
                      </div>
                      <Button onClick={() => setIsEditModeOpen(true)} className="h-5 px-2 gold-gradient text-background font-bold uppercase text-[7px] rounded">SANEAR</Button>
                    </div>
                  )}

                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-3">
                    <TabsList className="bg-transparent border-b border-white/5 h-7 w-full justify-start rounded-none p-0 gap-3">
                      {["VISÃO GERAL", "ENTREVISTAS", "BUROCRACIA", "REVISÃO & PROTOCOLO"].map(label => (
                        <TabsTrigger key={label} value={label.toLowerCase().split(' ')[0]} className="data-[state=active]:text-primary text-muted-foreground font-bold text-[9px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-wider">{label}</TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-3 animate-in fade-in duration-300 outline-none">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Card className="glass border-white/5 p-3 rounded">
                          <h4 className="text-[8px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 mb-2"><Clock className="h-2.5 w-2.5" /> AGENDAMENTO</h4>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-white uppercase">{selectedLead.scheduledDate ? `${new Date(selectedLead.scheduledDate).toLocaleDateString()} ÀS ${selectedLead.scheduledTime}` : "SEM AGENDAMENTO"}</p>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">{selectedLead.meetingType === 'online' ? '🖥️ VIRTUAL' : '🏢 PRESENCIAL'}</p>
                          </div>
                        </Card>
                        <Card className="glass border-primary/10 p-3 rounded">
                          <h4 className="text-[8px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-2"><Brain className="h-2.5 w-2.5" /> SÍNTESE IA</h4>
                          <p className="text-[9px] text-white/70 leading-relaxed italic line-clamp-3">{selectedLead.aiSummary || "Aguardando consolidação..."}</p>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="entrevistas" className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {templates?.map(t => (
                        <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/10 text-primary font-bold uppercase text-[8px] h-8 gap-1.5 rounded justify-start px-2">
                          <Zap className="h-2.5 w-2.5" /> {t.title}
                        </Button>
                      ))}
                    </TabsContent>

                    <TabsContent value="burocracia">
                      <BurocraciaView lead={selectedLead} interviews={leadInterviews || []} onEdit={() => setIsEditModeOpen(true)} />
                    </TabsContent>

                    <TabsContent value="revisão" className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <h3 className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-primary" /> Check-in de Protocolo</h3>
                        <Button onClick={handleGenerateStrategicSummary} disabled={isGeneratingSummary} className="h-7 px-3 glass border-primary/20 text-primary font-bold uppercase text-[8px] gap-1.5 rounded">
                          {isGeneratingSummary ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Brain className="h-2.5 w-2.5" />} CONSOLIDAR
                        </Button>
                      </div>
                      
                      {strategicSummary && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                          {[
                            { t: "Fatos Críticos", v: strategicSummary.keyFacts, c: "text-primary" },
                            { t: "Riscos", v: strategicSummary.risksAndChallenges, c: "text-rose-500" },
                            { t: "Análise", v: strategicSummary.strategicAnalysis, c: "text-emerald-500" }
                          ].map(s => (
                            <div key={s.t} className="p-2 rounded bg-white/[0.02] border border-white/5">
                              <h5 className={cn("text-[7px] font-bold uppercase tracking-wider mb-1", s.c)}>{s.t}</h5>
                              <p className="text-[9px] text-white/60 leading-relaxed">{s.v}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-3 rounded bg-purple-500/5 border border-purple-500/10 space-y-2">
                        <Label className="text-[8px] font-bold text-muted-foreground uppercase">NÚMERO DO PROCESSO (CNJ) *</Label>
                        <div className="flex gap-1.5">
                          <Input placeholder="0000000-00.0000.0.00.0000" className="glass border-white/10 h-8 text-white font-mono text-xs font-bold" value={selectedLead.processNumber || ""} onChange={(e) => setSelectedLead({...selectedLead, processNumber: e.target.value})} />
                          <Button onClick={() => setIsConversionOpen(true)} className="gold-gradient text-background font-bold h-8 px-4 rounded uppercase text-[8px] tracking-wider">CONVERTER</Button>
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
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[700px] w-[95vw] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Execução de Entrevista</DialogTitle>
            <DialogDescription>Preenchimento estruturado do roteiro de triagem</DialogDescription>
          </DialogHeader>
          {executingTemplate && (
            <DynamicInterviewExecution template={executingTemplate} onSubmit={handleFinishInterview} onCancel={() => setIsInterviewDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[700px] w-[95vw] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Protocolar Processo</DialogTitle>
            <DialogDescription>Migração final do lead para a base de processos ativos</DialogDescription>
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
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a]">
          <SheetHeader className="p-3 border-b border-white/5">
            <SheetTitle className="text-[11px] font-bold text-white uppercase tracking-tight">Novo Atendimento RGMJ</SheetTitle>
            <SheetDescription className="sr-only">Cadastro de novo lead no funil comercial</SheetDescription>
          </SheetHeader>
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
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a]">
          <SheetHeader className="p-3 border-b border-white/5">
            <SheetTitle className="text-[11px] font-bold text-white uppercase tracking-tight">Saneamento de Dossiê</SheetTitle>
            <SheetDescription className="sr-only">Retificação de dados cadastrais do lead</SheetDescription>
          </SheetHeader>
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
