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
  MessageCircle,
  FileCheck,
  Edit3
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

  useEffect(() => {
    if (selectedLead) {
      if (selectedLead.status === 'atendimento') setActiveDossierTab("entrevistas")
      else if (selectedLead.status === 'burocracia') setActiveDossierTab("burocracia")
      else if (selectedLead.status === 'distribuicao') setActiveDossierTab("revisao")
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

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/40 mb-1">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">FUNIL DE LEADS</span>
          </div>
          <h1 className="text-xl font-bold text-white uppercase tracking-tight">Triagem de Leads</h1>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-background font-black gap-2 px-4 h-9 rounded-md text-[10px] tracking-wider shadow-lg">
          <PlusCircle className="h-4 w-4" /> NOVO LEAD
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sincronizando Ecossistema...</span>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => (l.status || "novo") === col.id)
            return (
              <div key={col.id} className="min-w-[260px] flex-1">
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                    <h3 className={`font-bold text-[10px] tracking-widest uppercase ${col.color}`}>{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/50 text-[9px] border-white/5 font-bold h-4 px-1.5">{leadsInCol.length}</Badge>
                </div>
                <div className="space-y-2">
                  {leadsInCol.map((lead) => (
                    <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group border-white/5 shadow-md" onClick={() => handleOpenLead(lead)}>
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-[11px] text-white group-hover:text-primary transition-colors uppercase tracking-tight flex-1 truncate">{lead.name}</div>
                          {lead.meetingType === 'online' && <Video className="h-3.5 w-3.5 text-primary" />}
                        </div>
                        {lead.scheduledDate && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/5 border border-amber-500/10 w-fit">
                            <Clock className="h-2.5 w-2.5 text-amber-500" />
                            <span className="text-[9px] font-black text-amber-500 uppercase">
                              {new Date(lead.scheduledDate).toLocaleDateString('pt-BR')} {lead.scheduledTime}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                            {lead.updatedAt?.toDate ? new Date(lead.updatedAt.toDate()).toLocaleDateString() : 'HOJE'}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary" />
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
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl">
          {selectedLead && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-4 border-b border-white/5 bg-[#0a0f1e] z-10 flex-none shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
                      <Fingerprint className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <SheetTitle className="text-white text-sm font-bold uppercase tracking-tight">{selectedLead.name}</SheetTitle>
                      <SheetDescription className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1">Dossiê Estratégico RGMJ</SheetDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={() => handleSyncDrive()} disabled={isSyncingDrive} variant="outline" className="h-9 border-white/10 bg-white/5 text-[9px] font-black uppercase px-4 rounded-lg gap-2 transition-all hover:bg-primary/5 hover:border-primary/20 shadow-md">
                      {isSyncingDrive ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <CloudLightning className="h-3.5 w-3.5 text-amber-500" />} SINC. DRIVE
                    </Button>
                    <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="h-9 border-white/10 bg-white/5 text-[9px] font-black uppercase px-4 rounded-lg gap-2 transition-all hover:bg-primary/5 hover:border-primary/20 shadow-md">
                      <UserCog className="h-3.5 w-3.5 text-primary" /> EDITAR
                    </Button>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="p-3 bg-[#0a0f1e]/40 border-b border-white/5 flex-none">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Status Operacional", value: selectedLead.status, icon: Zap, color: "text-primary" },
                    { label: "Polo Passivo (Réu)", value: selectedLead.defendantName || "Não Informado", icon: Building, color: "text-muted-foreground" },
                    { label: "Canal WhatsApp", value: selectedLead.phone, icon: Phone, color: "text-emerald-500" },
                    { label: "Unidade Federativa", value: selectedLead.city ? `${selectedLead.city}-${selectedLead.state}` : "N/A", icon: MapPin, color: "text-muted-foreground" },
                  ].map((item, i) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-3 shadow-inner">
                      <item.icon className={cn("h-4 w-4 shrink-0", item.color)} />
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                        <p className="text-[10px] font-bold text-white uppercase truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 bg-[#05070a]">
                <div className="p-6 space-y-6 w-full">
                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-6">
                    <TabsList className="bg-transparent border-b border-white/5 h-10 w-full justify-start rounded-none p-0 gap-8 flex-none overflow-x-auto scrollbar-hide">
                      {["VISÃO GERAL", "ENTREVISTAS", "BUROCRACIA", "REVISÃO & PROTOCOLO"].map(label => (
                        <TabsTrigger key={label} value={label.toLowerCase().split(' ')[0]} className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-[0.2em]">{label}</TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300 outline-none w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="glass border-white/5 p-5 rounded-xl shadow-lg">
                          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em] flex items-center gap-2 mb-4"><Clock className="h-4 w-4" /> Agenda do Atendimento</h4>
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-white uppercase">{selectedLead.scheduledDate ? `${new Date(selectedLead.scheduledDate).toLocaleDateString()} às ${selectedLead.scheduledTime}` : "SEM DATA REGISTRADA"}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{selectedLead.meetingType === 'online' ? '🖥️ REUNIÃO VIRTUAL' : '🏢 VISITA PRESENCIAL'}</p>
                          </div>
                        </Card>
                        <Card className="glass border-primary/10 p-5 rounded-xl shadow-lg bg-primary/5">
                          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.25em] flex items-center gap-2 mb-4"><Brain className="h-4 w-4" /> Síntese Preliminar (IA)</h4>
                          <p className="text-[11px] text-white/80 leading-relaxed italic line-clamp-6 text-justify">{selectedLead.aiSummary || "Aguardando conclusão da entrevista para consolidação de fatos e geração da tese inicial RGMJ..."}</p>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="entrevistas" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
                      {templates?.map(t => (
                        <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/15 text-primary font-black uppercase text-[10px] h-12 gap-3 rounded-lg justify-start px-4 hover:bg-primary/5 transition-all shadow-md group">
                          <Zap className="h-4 w-4 group-hover:scale-110 transition-transform" /> {t.title}
                        </Button>
                      ))}
                    </TabsContent>

                    <TabsContent value="burocracia" className="w-full">
                      <BurocraciaView lead={selectedLead} interviews={leadInterviews || []} onEdit={() => setIsEditModeOpen(true)} />
                    </TabsContent>

                    <TabsContent value="revisao" className="space-y-6 animate-in fade-in duration-500 w-full">
                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-emerald-500" />
                          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.25em]">Check-in de Protocolo 360º</h3>
                        </div>
                        <Button onClick={handleGenerateStrategicSummary} disabled={isGeneratingSummary} className="h-10 px-5 glass border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-lg shadow-lg hover:bg-primary/5">
                          {isGeneratingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />} CONSOLIDAR ESTRATÉGIA IA
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Qualificação do Autor */}
                        <Card className="glass border-white/5 p-5 rounded-xl space-y-4 shadow-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Qualificação do Autor</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">Nome Completo:</span>
                              <span className="text-[11px] text-white font-bold uppercase">{selectedLead.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">Documento CPF:</span>
                              <span className="text-[11px] text-white font-mono font-bold">{selectedLead.cpf || selectedLead.documentNumber || "NÃO INFORMADO"}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">WhatsApp:</span>
                              <span className="text-[11px] text-white font-bold">{selectedLead.phone}</span>
                            </div>
                            <div className="pt-2">
                              <p className="text-[9px] font-black text-muted-foreground uppercase mb-1.5">Endereço Residencial:</p>
                              <p className="text-[11px] text-white/80 leading-relaxed uppercase">{selectedLead.address || "CADASTRO PENDENTE"}</p>
                            </div>
                          </div>
                        </Card>

                        {/* Polo Passivo */}
                        <Card className="glass border-white/5 p-5 rounded-xl space-y-4 shadow-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
                              <Building className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Polo Passivo</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">Empresa / Réu:</span>
                              <span className="text-[11px] text-white font-bold uppercase">{selectedLead.defendantName || "NÃO INFORMADO"}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">CNPJ / CPF:</span>
                              <span className="text-[11px] text-white font-mono font-bold">{selectedLead.defendantDocument || "NÃO INFORMADO"}</span>
                            </div>
                          </div>
                        </Card>

                        {/* Logística Judiciária */}
                        <Card className="glass border-white/5 p-5 rounded-xl space-y-4 shadow-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
                              <Gavel className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Logística Judiciária</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">Tribunal:</span>
                              <span className="text-[11px] text-white font-bold uppercase">{selectedLead.court || "NÃO MAPEADO"}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">Vara:</span>
                              <span className="text-[11px] text-white uppercase font-bold">{selectedLead.vara || "NÃO MAPEADA"}</span>
                            </div>
                            <div className="pt-2">
                              <p className="text-[9px] font-black text-muted-foreground uppercase mb-1.5">Endereço do Juízo:</p>
                              <p className="text-[11px] text-white/80 leading-relaxed truncate uppercase">{selectedLead.courtAddress || "ENDEREÇO PENDENTE"}</p>
                            </div>
                          </div>
                        </Card>
                      </div>

                      {/* Histórico de Atendimento Integrado */}
                      <Card className="glass border-white/5 overflow-hidden shadow-xl">
                        <div className="p-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MessageCircle className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.25em]">DNA de Atendimento</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary bg-primary/5 uppercase">{leadInterviews?.length || 0} Atos de Triagem</Badge>
                        </div>
                        <div className="p-4">
                          {leadInterviews && leadInterviews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {leadInterviews.slice(0, 4).map((int, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 shadow-inner group hover:border-primary/20 transition-all">
                                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{int.interviewType}</span>
                                    <span className="text-[9px] text-muted-foreground font-mono font-bold">{int.createdAt?.toDate ? new Date(int.createdAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(int.responses || {}).slice(0, 3).map(([q, a]: any) => (
                                      <div key={q} className="space-y-1">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase truncate opacity-50 tracking-tighter">{q}</p>
                                        <p className="text-[10px] text-white/90 font-medium truncate uppercase">{String(a)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-8 flex flex-col items-center justify-center opacity-20">
                              <MessageCircle className="h-8 w-8 mb-2" />
                              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sem histórico de atendimento consolidado.</p>
                            </div>
                          )}
                        </div>
                      </Card>

                      {strategicSummary && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-700">
                          {[
                            { t: "Fatos Críticos", v: strategicSummary.keyFacts, c: "text-primary", icon: Brain },
                            { t: "Riscos & Desafios", v: strategicSummary.risksAndChallenges, c: "text-rose-500", icon: ShieldAlert },
                            { t: "Análise Estratégica", v: strategicSummary.strategicAnalysis, icon: Zap, c: "text-emerald-500" }
                          ].map(s => (
                            <div key={s.t} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3 shadow-lg hover:border-primary/20 transition-all">
                              <div className="flex items-center gap-2">
                                <s.icon className={cn("h-4 w-4", s.c)} />
                                <h5 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", s.c)}>{s.t}</h5>
                              </div>
                              <p className="text-[11px] text-white/80 leading-relaxed text-justify line-clamp-6">{s.v}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/15 flex flex-col md:flex-row items-end gap-4 w-full shadow-2xl">
                        <div className="flex-1 space-y-2 w-full">
                          <Label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.25em] flex items-center gap-2">
                            <FileCheck className="h-4 w-4" /> Número do Processo (CNJ) *
                          </Label>
                          <Input 
                            placeholder="0000000-00.0000.0.00.0000" 
                            className="bg-black/40 border-purple-500/20 h-12 text-white font-mono text-base font-black w-full tracking-widest focus:ring-purple-500/50" 
                            value={selectedLead.processNumber || ""} 
                            onChange={(e) => setSelectedLead({...selectedLead, processNumber: e.target.value})} 
                          />
                        </div>
                        <Button 
                          onClick={() => setIsConversionOpen(true)} 
                          className="gold-gradient text-background font-black h-12 px-10 rounded-xl uppercase text-[11px] tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all shrink-0 w-full md:w-auto"
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
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[800px] w-[95vw] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-5 bg-[#0a0f1e] border-b border-white/5">
            <DialogTitle className="text-white text-lg font-bold uppercase tracking-tight">Execução de Entrevista</DialogTitle>
            <DialogDescription className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1.5">Preenchimento estruturado do rito de triagem RGMJ</DialogDescription>
          </DialogHeader>
          {executingTemplate && (
            <DynamicInterviewExecution template={executingTemplate} onSubmit={handleFinishInterview} onCancel={() => setIsInterviewDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[800px] w-[95vw] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-5 bg-[#0a0f1e] border-b border-white/5">
            <DialogTitle className="text-white text-lg font-bold uppercase tracking-tight">Migração para Base de Ativos</DialogTitle>
            <DialogDescription className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1.5">O dossiê do lead será encerrado e um novo processo ativo será aberto.</DialogDescription>
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
          <SheetHeader className="p-4 border-b border-white/5 bg-[#0a0f1e] shadow-md">
            <SheetTitle className="text-sm font-bold text-white uppercase tracking-tight">Novo Atendimento RGMJ</SheetTitle>
            <SheetDescription className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1.5">Cadastro de nova oportunidade no funil estratégico comercial</SheetDescription>
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
        <SheetContent className="w-full lg:w-[calc(100vw-16rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl">
          <SheetHeader className="p-4 border-b border-white/5 bg-[#0a0f1e] shadow-md">
            <SheetTitle className="text-sm font-bold text-white uppercase tracking-tight">Saneamento de Dossiê</SheetTitle>
            <SheetDescription className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1.5">Retificação técnica de dados cadastrais e logísticos</SheetDescription>
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