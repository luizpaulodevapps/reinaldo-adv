
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
  ArrowLeft
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
    <div className="space-y-10 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-sm uppercase tracking-widest font-black text-muted-foreground/40 mb-3">
            <LayoutGrid className="h-5 w-5" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">FUNIL ESTRATÉGICO DE LEADS</span>
          </div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">Triagem de Oportunidades</h1>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-background font-black gap-4 px-10 h-14 rounded-xl text-sm tracking-widest shadow-2xl">
          <PlusCircle className="h-6 w-6" /> NOVO ATENDIMENTO
        </Button>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sincronizando Banco de Dados...</span>
        </div>
      ) : (
        <div className="flex gap-8 overflow-x-auto pb-10 scrollbar-hide min-h-[700px]">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => (l.status || "novo") === col.id)
            return (
              <div key={col.id} className="min-w-[360px] flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6 px-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                    <h3 className={`font-black text-sm tracking-[0.25em] uppercase ${col.color}`}>{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/5 text-sm border-white/5 font-black h-7 px-3">{leadsInCol.length}</Badge>
                </div>
                <div className="space-y-5 flex-1 bg-white/[0.01] rounded-3xl p-3 border border-white/5">
                  {leadsInCol.map((lead) => (
                    <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group border-white/5 shadow-2xl" onClick={() => handleOpenLead(lead)}>
                      <CardContent className="p-6 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="font-bold text-base text-white group-hover:text-primary transition-colors uppercase tracking-tight flex-1 leading-snug">{lead.name}</div>
                          {lead.meetingType === 'online' && <Video className="h-5 w-5 text-primary shrink-0" />}
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          {lead.scheduledDate && (
                            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 w-fit">
                              <Clock className="h-4 w-4 text-amber-500" />
                              <span className="text-xs font-black text-amber-500 uppercase tracking-widest">
                                {new Date(lead.scheduledDate).toLocaleDateString('pt-BR')} {lead.scheduledTime}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground/60 uppercase font-black tracking-widest">
                            <Building className="h-4 w-4" /> {lead.defendantName || "Réu não informado"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-5 border-t border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-widest">
                              ID: {lead.id.substring(0, 6)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                            ABRIR DOSSIÊ <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {leadsInCol.length === 0 && (
                    <div className="h-40 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl opacity-20">
                      <span className="text-sm font-black uppercase tracking-widest">Vazio</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full lg:w-[calc(100vw-18rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl">
          {selectedLead && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-8 border-b border-white/5 bg-[#0a0f1e] z-10 flex-none shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/5">
                      <Fingerprint className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <SheetTitle className="text-white text-3xl font-bold uppercase tracking-tight">{selectedLead.name}</SheetTitle>
                      <SheetDescription className="text-sm text-muted-foreground uppercase font-black tracking-[0.3em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> DOSSIÊ ESTRATÉGICO RGMJ
                      </SheetDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <Button onClick={() => handleSyncDrive()} disabled={isSyncingDrive} variant="outline" className="h-14 border-white/10 bg-white/5 text-sm font-black uppercase px-8 rounded-xl gap-4 transition-all hover:bg-primary/5 hover:border-primary/20 shadow-xl">
                      {isSyncingDrive ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <CloudLightning className="h-5 w-5 text-amber-500" />} SINC. DRIVE
                    </Button>
                    <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="h-14 border-white/10 bg-white/5 text-sm font-black uppercase px-8 rounded-xl gap-4 transition-all hover:bg-primary/5 hover:border-primary/20 shadow-xl">
                      <UserCog className="h-5 w-5 text-primary" /> EDITAR
                    </Button>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="p-6 bg-[#0a0f1e]/60 border-b border-white/5 flex-none overflow-x-auto scrollbar-hide">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 min-w-[900px]">
                  {[
                    { label: "Status Operacional", value: selectedLead.status?.toUpperCase() || "NOVO", icon: Zap, color: "text-primary" },
                    { label: "Polo Passivo (Réu)", value: selectedLead.defendantName || "NÃO INFORMADO", icon: Building, color: "text-muted-foreground" },
                    { label: "WhatsApp Direto", value: selectedLead.phone, icon: Phone, color: "text-emerald-500" },
                    { label: "Jurisdição", value: selectedLead.city ? `${selectedLead.city}-${selectedLead.state}` : "N/A", icon: MapPin, color: "text-muted-foreground" },
                  ].map((item, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-5 shadow-inner">
                      <item.icon className={cn("h-6 w-6 shrink-0", item.color)} />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1.5">{item.label}</p>
                        <p className="text-base font-bold text-white uppercase truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 bg-[#05070a]">
                <div className="p-10 space-y-10 w-full max-w-[1800px] mx-auto pb-32">
                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-10">
                    <TabsList className="bg-transparent border-b border-white/5 h-16 w-full justify-start rounded-none p-0 gap-16 flex-none overflow-x-auto scrollbar-hide">
                      {[
                        { id: "overview", label: "VISÃO GERAL" },
                        { id: "entrevistas", label: "ENTREVISTAS" },
                        { id: "burocracia", label: "BUROCRACIA" },
                        { id: "revisao", label: "REVISÃO & PROTOCOLO" }
                      ].map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:text-primary text-muted-foreground font-black text-sm uppercase h-full rounded-none px-0 border-b-4 border-transparent data-[state=active]:border-primary transition-all tracking-[0.3em]">{tab.label}</TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-10 animate-in fade-in duration-300 outline-none w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <Card className="glass border-white/5 p-10 rounded-3xl shadow-2xl bg-white/[0.01]">
                          <h4 className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-4 mb-8"><Clock className="h-6 w-6" /> Agenda do Atendimento</h4>
                          <div className="space-y-6">
                            <p className="text-2xl font-bold text-white uppercase tracking-tight">
                              {selectedLead.scheduledDate ? `${new Date(selectedLead.scheduledDate).toLocaleDateString('pt-BR')} às ${selectedLead.scheduledTime}` : "AGUARDANDO AGENDAMENTO"}
                            </p>
                            <Badge variant="outline" className="text-sm font-black text-muted-foreground border-white/10 px-6 py-2.5 uppercase tracking-widest">
                              {selectedLead.meetingType === 'online' ? '🖥️ REUNIÃO VIRTUAL' : '🏢 VISITA PRESENCIAL'}
                            </Badge>
                          </div>
                        </Card>
                        <Card className="glass border-primary/15 p-10 rounded-3xl shadow-2xl bg-primary/5">
                          <h4 className="text-sm font-black text-primary uppercase tracking-[0.3em] flex items-center gap-4 mb-8"><Brain className="h-6 w-6" /> Síntese Preliminar (IA)</h4>
                          <p className="text-base text-white/80 leading-relaxed italic text-justify font-light">
                            {selectedLead.aiSummary || "Aguardando conclusão das entrevistas técnicas para consolidação dos fatos e geração da tese jurídica preliminar RGMJ. A inteligência analisará depoimentos e documentos sincronizados."}
                          </p>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="entrevistas" className="w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {templates?.map(t => (
                          <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/10 text-primary font-black uppercase text-sm h-20 gap-5 rounded-2xl justify-start px-8 hover:bg-primary/5 transition-all shadow-xl group">
                            <Zap className="h-6 w-6 group-hover:scale-110 transition-transform" /> 
                            <span className="truncate">{t.title}</span>
                          </Button>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="burocracia" className="w-full">
                      <BurocraciaView lead={selectedLead} interviews={leadInterviews || []} onEdit={() => setIsEditModeOpen(true)} />
                    </TabsContent>

                    <TabsContent value="revisao" className="space-y-12 animate-in fade-in duration-500 w-full">
                      <div className="flex items-center justify-between pb-8 border-b border-white/5">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <ShieldCheck className="h-8 w-8 text-emerald-500" />
                          </div>
                          <h3 className="text-2xl font-bold text-white uppercase tracking-widest">Check-in de Protocolo 360º</h3>
                        </div>
                        <Button onClick={handleGenerateStrategicSummary} disabled={isGeneratingSummary} className="h-14 px-10 glass border-primary/20 text-primary font-black uppercase text-sm gap-4 rounded-xl shadow-2xl hover:bg-primary/5">
                          {isGeneratingSummary ? <Loader2 className="h-6 w-6 animate-spin" /> : <Brain className="h-6 w-6" />} CONSOLIDAR ESTRATÉGIA IA
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="glass border-white/5 p-10 rounded-3xl space-y-8 shadow-2xl bg-white/[0.01]">
                          <div className="flex items-center gap-5 mb-4">
                            <User className="h-6 w-6 text-primary" />
                            <span className="text-sm font-black text-white uppercase tracking-widest">Qualificação do Autor</span>
                          </div>
                          <div className="space-y-6">
                            {[
                              { label: "Nome Completo", value: selectedLead.name },
                              { label: "Documento CPF", value: selectedLead.cpf || selectedLead.documentNumber || "NÃO INFORMADO" },
                              { label: "WhatsApp", value: selectedLead.phone },
                            ].map(item => (
                              <div key={item.label} className="border-b border-white/5 pb-3">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">{item.label}</p>
                                <p className="text-base font-bold text-white uppercase">{item.value}</p>
                              </div>
                            ))}
                            <div className="pt-3">
                              <p className="text-xs font-black text-muted-foreground uppercase mb-3">Endereço Residencial</p>
                              <p className="text-sm text-white/70 leading-relaxed uppercase">{selectedLead.address || "CADASTRO PENDENTE"}</p>
                            </div>
                          </div>
                        </Card>

                        <Card className="glass border-white/5 p-10 rounded-3xl space-y-8 shadow-2xl bg-white/[0.01]">
                          <div className="flex items-center gap-5 mb-4">
                            <Building className="h-6 w-6 text-primary" />
                            <span className="text-sm font-black text-white uppercase tracking-widest">Polo Passivo</span>
                          </div>
                          <div className="space-y-6">
                            {[
                              { label: "Empresa / Réu", value: selectedLead.defendantName || "NÃO INFORMADO" },
                              { label: "CNPJ / CPF", value: selectedLead.defendantDocument || "NÃO INFORMADO" },
                            ].map(item => (
                              <div key={item.label} className="border-b border-white/5 pb-3">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">{item.label}</p>
                                <p className="text-base font-bold text-white uppercase">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <Card className="glass border-white/5 p-10 rounded-3xl space-y-8 shadow-2xl bg-white/[0.01]">
                          <div className="flex items-center gap-5 mb-4">
                            <Gavel className="h-6 w-6 text-primary" />
                            <span className="text-sm font-black text-white uppercase tracking-widest">Logística Judiciária</span>
                          </div>
                          <div className="space-y-6">
                            {[
                              { label: "Tribunal Selecionado", value: selectedLead.court || "NÃO MAPEADO" },
                              { label: "Vara / Unidade", value: selectedLead.vara || "NÃO MAPEADA" },
                            ].map(item => (
                              <div key={item.label} className="border-b border-white/5 pb-3">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">{item.label}</p>
                                <p className="text-base font-bold text-white uppercase">{item.value}</p>
                              </div>
                            ))}
                            <div className="pt-3">
                              <p className="text-xs font-black text-muted-foreground uppercase mb-3">Endereço do Juízo</p>
                              <p className="text-sm text-white/70 leading-relaxed uppercase truncate">{selectedLead.courtAddress || "ENDEREÇO PENDENTE"}</p>
                            </div>
                          </div>
                        </Card>
                      </div>

                      <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-3xl">
                        <div className="p-8 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <MessageCircle className="h-7 w-7 text-primary" />
                            <span className="text-lg font-bold text-white uppercase tracking-widest">DNA de Atendimento & Fatos</span>
                          </div>
                          <Badge variant="outline" className="text-xs font-black border-primary/20 text-primary px-6 py-2 uppercase">{leadInterviews?.length || 0} Atos de Triagem</Badge>
                        </div>
                        <div className="p-10">
                          {leadInterviews && leadInterviews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {leadInterviews.slice(0, 4).map((int, idx) => (
                                <div key={idx} className="p-8 rounded-3xl bg-black/30 border border-white/5 space-y-6 shadow-2xl hover:border-primary/20 transition-all">
                                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <span className="text-sm font-bold text-primary uppercase tracking-widest">{int.interviewType}</span>
                                    <span className="text-sm text-muted-foreground font-mono">{int.createdAt?.toDate ? new Date(int.createdAt.toDate()).toLocaleDateString('pt-BR') : '---'}</span>
                                  </div>
                                  <div className="space-y-5">
                                    {Object.entries(int.responses || {}).slice(0, 3).map(([q, a]: any) => (
                                      <div key={q}>
                                        <p className="text-xs font-black text-muted-foreground uppercase opacity-50 mb-2">{q}</p>
                                        <p className="text-sm text-white/90 font-medium uppercase leading-relaxed">{String(a)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-24 flex flex-col items-center justify-center opacity-20 space-y-6">
                              <MessageCircle className="h-16 w-16" />
                              <p className="text-sm font-black uppercase tracking-[0.4em]">Sem histórico de atendimento técnico.</p>
                            </div>
                          )}
                        </div>
                      </Card>

                      {strategicSummary && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                          {[
                            { t: "Fatos Críticos", v: strategicSummary.keyFacts, c: "text-primary", icon: Brain },
                            { t: "Riscos & Desafios", v: strategicSummary.risksAndChallenges, c: "text-rose-500", icon: ShieldAlert },
                            { t: "Análise Estratégica", v: strategicSummary.strategicAnalysis, icon: Zap, c: "text-emerald-500" }
                          ].map(s => (
                            <div key={s.t} className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6 shadow-2xl hover:border-primary/20 transition-all">
                              <div className="flex items-center gap-4">
                                <s.icon className={cn("h-7 w-7", s.c)} />
                                <h5 className={cn("text-sm font-black uppercase tracking-[0.3em]", s.c)}>{s.t}</h5>
                              </div>
                              <p className="text-base text-white/80 leading-relaxed text-justify font-light">{s.v}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-10 rounded-[2.5rem] bg-purple-500/5 border border-purple-500/15 flex flex-col md:flex-row items-end gap-10 w-full shadow-2xl">
                        <div className="flex-1 space-y-4 w-full">
                          <Label className="text-sm font-black text-purple-400 uppercase tracking-widest flex items-center gap-4">
                            <FileCheck className="h-7 w-7" /> NÚMERO DO PROCESSO (CNJ) *
                          </Label>
                          <Input 
                            placeholder="0000000-00.0000.0.00.0000" 
                            className="bg-black/60 border-purple-500/20 h-20 text-white font-mono text-2xl font-black w-full tracking-[0.2em] focus:ring-purple-500/50 rounded-2xl px-8" 
                            value={selectedLead.processNumber || ""} 
                            onChange={(e) => setSelectedLead({...selectedLead, processNumber: e.target.value})} 
                          />
                        </div>
                        <Button 
                          onClick={() => setIsConversionOpen(true)} 
                          className="gold-gradient text-background font-black h-20 px-16 rounded-2xl uppercase text-sm tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all shrink-0 w-full md:w-auto"
                        >
                          PROTOCOLAR E CONVERTER DEFINITIVAMENTE
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              {/* BARRA DE NAVEGAÇÃO DO DOSSIÊ (RODAPÉ) */}
              <div className="flex-none p-6 border-t border-white/5 bg-[#0a0f1e] flex items-center justify-between z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <Button 
                  variant="ghost" 
                  onClick={handlePrevTab} 
                  disabled={!canGoBack}
                  className="text-muted-foreground uppercase font-black text-xs tracking-[0.2em] gap-3 px-8 h-14 hover:text-white transition-all disabled:opacity-20"
                >
                  <ArrowLeft className="h-5 w-5" /> VOLTAR
                </Button>

                <div className="hidden md:flex gap-3">
                  {DOSSIER_TABS.map((tab, i) => (
                    <div 
                      key={tab} 
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all duration-500",
                        activeDossierTab === tab ? "bg-primary shadow-[0_0_10px_rgba(245,208,48,0.5)] scale-125" : i < currentTabIndex ? "bg-emerald-500" : "bg-white/10"
                      )} 
                    />
                  ))}
                </div>

                {canGoNext ? (
                  <Button 
                    onClick={handleNextTab} 
                    className="gold-gradient text-background font-black h-14 px-12 rounded-xl uppercase text-xs tracking-[0.2em] gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    PRÓXIMO PASSO <ArrowRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <div className="px-8 h-14 flex items-center">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em]">Fim do Rito de Triagem</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogTitle className="text-white text-2xl font-bold uppercase tracking-tight">Execução de Atendimento Técnico</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground uppercase font-black tracking-widest mt-3">Captura estruturada de fatos e teses RGMJ</DialogDescription>
          </DialogHeader>
          {executingTemplate && (
            <DynamicInterviewExecution template={executingTemplate} onSubmit={handleFinishInterview} onCancel={() => setIsInterviewDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogTitle className="text-white text-2xl font-bold uppercase tracking-tight">Migração para Base de Ativos</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground uppercase font-black tracking-widest mt-3">O dossiê do lead será encerrado e um novo processo ativo será iniciado no ecossistema.</DialogDescription>
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
        <SheetContent className="w-full lg:w-[calc(100vw-18rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl">
          <SheetHeader className="p-8 border-b border-white/5 bg-[#0a0f1e] shadow-xl">
            <SheetTitle className="text-2xl font-bold text-white uppercase tracking-tight">Novo Atendimento RGMJ</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground uppercase font-black tracking-widest mt-3">Cadastro de nova oportunidade estratégica no funil comercial</SheetDescription>
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
        <SheetContent className="w-full lg:w-[calc(100vw-18rem)] lg:max-w-none overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#05070a] shadow-2xl">
          <SheetHeader className="p-8 border-b border-white/5 bg-[#0a0f1e] shadow-xl">
            <SheetTitle className="text-2xl font-bold text-white uppercase tracking-tight">Saneamento de Dossiê</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground uppercase font-black tracking-widest mt-3">Retificação técnica de dados cadastrais e logísticos</SheetDescription>
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
