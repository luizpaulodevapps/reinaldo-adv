
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
  ShieldAlert,
  User,
  Gavel,
  MessageCircle
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
  const { user } = useUser()
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
              <SheetHeader className="p-3 border-b border-white/5 bg-[#0a0f1e] z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Fingerprint className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <SheetTitle className="text-white text-sm font-bold uppercase tracking-tight">{selectedLead.name}</SheetTitle>
                      <SheetDescription className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Dossiê Estratégico RGMJ</SheetDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleSyncDrive()} disabled={isSyncingDrive} variant="outline" className="h-7 border-white/10 bg-white/5 text-[8px] font-bold uppercase px-3 rounded">
                      {isSyncingDrive ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <CloudLightning className="h-3 w-3 mr-1.5 text-amber-500" />} SINC. DRIVE
                    </Button>
                    <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="h-7 border-white/10 bg-white/5 text-[8px] font-bold uppercase px-3 rounded">
                      <UserCog className="h-3 w-3 mr-1.5 text-primary" /> EDITAR
                    </Button>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="p-3 bg-[#0a0f1e]/40 border-b border-white/5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {[
                    { label: "Status", value: selectedLead.status, icon: Zap, color: "text-primary" },
                    { label: "Réu", value: selectedLead.defendantName || "Não Informado", icon: Building, color: "text-muted-foreground" },
                    { label: "WhatsApp", value: selectedLead.phone, icon: Phone, color: "text-emerald-500" },
                    { label: "Localidade", value: selectedLead.city ? `${selectedLead.city}-${selectedLead.state}` : "N/A", icon: MapPin, color: "text-muted-foreground" },
                  ].map((item, i) => (
                    <div key={i} className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
                      <item.icon className={cn("h-3 w-3 shrink-0", item.color)} />
                      <div className="min-w-0">
                        <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                        <p className="text-[9px] font-bold text-white uppercase truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 bg-[#05070a]">
                <div className="p-4 space-y-4 w-full">
                  {isProfileIncomplete && (
                    <div className="p-2.5 rounded bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                        <p className="text-[9px] font-bold text-white uppercase tracking-wider">Campos Pendentes: <span className="text-amber-400 font-black">{missingFields.join(", ")}</span></p>
                      </div>
                      <Button onClick={() => setIsEditModeOpen(true)} className="h-6 px-3 gold-gradient text-background font-black uppercase text-[8px] rounded">SANEAMENTO IMEDIATO</Button>
                    </div>
                  )}

                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-4">
                    <TabsList className="bg-transparent border-b border-white/5 h-8 w-full justify-start rounded-none p-0 gap-6">
                      {["VISÃO GERAL", "ENTREVISTAS", "BUROCRACIA", "REVISÃO & PROTOCOLO"].map(label => (
                        <TabsTrigger key={label} value={label.toLowerCase().split(' ')[0]} className="data-[state=active]:text-primary text-muted-foreground font-bold text-[10px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-wider">{label}</TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 animate-in fade-in duration-300 outline-none">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="glass border-white/5 p-4 rounded-xl">
                          <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-3"><Clock className="h-3.5 w-3.5" /> Agenda do Atendimento</h4>
                          <div className="space-y-1.5">
                            <p className="text-sm font-bold text-white uppercase">{selectedLead.scheduledDate ? `${new Date(selectedLead.scheduledDate).toLocaleDateString()} às ${selectedLead.scheduledTime}` : "SEM DATA REGISTRADA"}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black">{selectedLead.meetingType === 'online' ? '🖥️ REUNIÃO VIRTUAL' : '🏢 VISITA PRESENCIAL'}</p>
                          </div>
                        </Card>
                        <Card className="glass border-primary/10 p-4 rounded-xl">
                          <h4 className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2 mb-3"><Brain className="h-3.5 w-3.5" /> Síntese Preliminar (IA)</h4>
                          <p className="text-[11px] text-white/70 leading-relaxed italic line-clamp-4">{selectedLead.aiSummary || "Aguardando conclusão da entrevista para consolidação de fatos..."}</p>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="entrevistas" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {templates?.map(t => (
                        <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/10 text-primary font-bold uppercase text-[9px] h-10 gap-2 rounded-lg justify-start px-4 hover:bg-primary/5 transition-all">
                          <Zap className="h-3.5 w-3.5" /> {t.title}
                        </Button>
                      ))}
                    </TabsContent>

                    <TabsContent value="burocracia" className="w-full">
                      <BurocraciaView lead={selectedLead} interviews={leadInterviews || []} onEdit={() => setIsEditModeOpen(true)} />
                    </TabsContent>

                    <TabsContent value="revisão" className="space-y-4 animate-in fade-in duration-500">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          <h3 className="text-xs font-bold text-white uppercase tracking-tight">Check-in de Protocolo</h3>
                        </div>
                        <Button onClick={handleGenerateStrategicSummary} disabled={isGeneratingSummary} className="h-7 px-3 glass border-primary/20 text-primary font-bold uppercase text-[8px] gap-1.5 rounded">
                          {isGeneratingSummary ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Brain className="h-2.5 w-2.5" />} CONSOLIDAR ESTRATÉGIA IA
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {/* Bloco Autor */}
                        <Card className="glass border-white/5 p-3 rounded-lg space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3 w-3 text-primary" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Qualificação do Autor</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-white font-bold uppercase">{selectedLead.name}</p>
                            <p className="text-[9px] text-muted-foreground font-mono">{selectedLead.cpf || selectedLead.documentNumber || "CPF NÃO INFORMADO"}</p>
                            <p className="text-[9px] text-muted-foreground">{selectedLead.phone}</p>
                            <p className="text-[9px] text-muted-foreground truncate">{selectedLead.address || "ENDEREÇO PENDENTE"}</p>
                          </div>
                        </Card>

                        {/* Bloco Réu */}
                        <Card className="glass border-white/5 p-3 rounded-lg space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Building className="h-3 w-3 text-primary" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Polo Passivo</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-white font-bold uppercase">{selectedLead.defendantName || "RÉU NÃO INFORMADO"}</p>
                            <p className="text-[9px] text-muted-foreground font-mono">{selectedLead.defendantDocument || "CNPJ NÃO INFORMADO"}</p>
                          </div>
                        </Card>

                        {/* Bloco Juízo */}
                        <Card className="glass border-white/5 p-3 rounded-lg space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Gavel className="h-3 w-3 text-primary" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Logística Judiciária</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-white font-bold uppercase">{selectedLead.court || "TRIBUNAL NÃO INFORMADO"}</p>
                            <p className="text-[9px] text-white/70">{selectedLead.vara || "VARA PENDENTE"}</p>
                            <p className="text-[9px] text-muted-foreground truncate">{selectedLead.courtAddress || "ENDEREÇO DO FÓRUM PENDENTE"}</p>
                          </div>
                        </Card>
                      </div>

                      {/* Resumo das Entrevistas */}
                      <Card className="glass border-white/5 overflow-hidden">
                        <div className="p-2 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                          <MessageCircle className="h-3 w-3 text-primary" />
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">Histórico de Atendimento</span>
                        </div>
                        <div className="p-3">
                          {leadInterviews && leadInterviews.length > 0 ? (
                            <div className="space-y-3">
                              {leadInterviews.map((int, idx) => (
                                <div key={idx} className="p-2 rounded bg-black/20 border border-white/5">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[8px] font-black text-primary uppercase">{int.interviewType}</span>
                                    <span className="text-[8px] text-muted-foreground font-mono">{int.createdAt?.toDate ? new Date(int.createdAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {Object.entries(int.responses || {}).slice(0, 6).map(([q, a]: any) => (
                                      <div key={q} className="space-y-0.5">
                                        <p className="text-[7px] font-black text-muted-foreground uppercase truncate">{q}</p>
                                        <p className="text-[9px] text-white font-medium truncate">{String(a)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[9px] text-muted-foreground italic text-center py-4">Nenhuma entrevista realizada para este lead.</p>
                          )}
                        </div>
                      </Card>

                      {strategicSummary && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          {[
                            { t: "Fatos Críticos", v: strategicSummary.keyFacts, c: "text-primary", icon: Brain },
                            { t: "Riscos & Desafios", v: strategicSummary.risksAndChallenges, c: "text-rose-500", icon: ShieldAlert },
                            { t: "Análise Estratégica", v: strategicSummary.strategicAnalysis, icon: Zap, c: "text-emerald-500" }
                          ].map(s => (
                            <div key={s.t} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <s.icon className={cn("h-3 w-3", s.c)} />
                                <h5 className={cn("text-[8px] font-black uppercase tracking-widest", s.c)}>{s.t}</h5>
                              </div>
                              <p className="text-[10px] text-white/70 leading-relaxed text-justify">{s.v}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex flex-col md:flex-row items-end gap-4 max-w-3xl">
                        <div className="flex-1 space-y-1.5 w-full">
                          <Label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Número do Processo (CNJ) *</Label>
                          <Input 
                            placeholder="0000000-00.0000.0.00.0000" 
                            className="bg-black/40 border-purple-500/20 h-9 text-white font-mono text-sm font-bold w-full" 
                            value={selectedLead.processNumber || ""} 
                            onChange={(e) => setSelectedLead({...selectedLead, processNumber: e.target.value})} 
                          />
                        </div>
                        <Button 
                          onClick={() => setIsConversionOpen(true)} 
                          className="gold-gradient text-background font-black h-9 px-6 rounded uppercase text-[9px] tracking-widest shadow-lg shrink-0 w-full md:w-auto"
                        >
                          PROTOCOLAR E CONVERTER
                        </Button>
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
          <DialogHeader className="p-6 bg-[#0a0f1e] border-b border-white/5">
            <DialogTitle className="text-white text-xl font-bold uppercase">Execução de Entrevista</DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Preenchimento estruturado do rito de triagem RGMJ</DialogDescription>
          </DialogHeader>
          {executingTemplate && (
            <DynamicInterviewExecution template={executingTemplate} onSubmit={handleFinishInterview} onCancel={() => setIsInterviewDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[700px] w-[95vw] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 bg-[#0a0f1e] border-b border-white/5">
            <DialogTitle className="text-white text-xl font-bold uppercase">Migração para Base de Ativos</DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground uppercase font-bold mt-1">O dossiê do lead será encerrado e um novo processo será aberto.</DialogDescription>
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
          <SheetHeader className="p-4 border-b border-white/5 bg-[#0a0f1e]">
            <SheetTitle className="text-sm font-bold text-white uppercase tracking-tight">Novo Atendimento RGMJ</SheetTitle>
            <SheetDescription className="text-[9px] text-muted-foreground uppercase font-bold mt-1">Cadastro de nova oportunidade no funil estratégico</SheetDescription>
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
          <SheetHeader className="p-4 border-b border-white/5 bg-[#0a0f1e]">
            <SheetTitle className="text-sm font-bold text-white uppercase tracking-tight">Saneamento de Dossiê</SheetTitle>
            <SheetDescription className="text-[9px] text-muted-foreground uppercase font-bold mt-1">Retificação técnica de dados cadastrais</SheetDescription>
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
