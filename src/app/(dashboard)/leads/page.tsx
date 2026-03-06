
"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  Clock, 
  Zap, 
  Brain,
  Loader2,
  X,
  PlusCircle,
  LayoutGrid,
  Video,
  Link as LinkIcon,
  MessageCircle,
  ShieldCheck,
  Play,
  ArrowRight,
  ArrowLeft,
  Gavel,
  Scale,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  UserCog,
  Building,
  Database,
  CloudLightning,
  FolderOpen,
  UserPlus,
  FileText,
  Save,
  CheckSquare,
  Lock,
  ShieldAlert,
  Trash2,
  Archive,
  Sparkles,
  TrendingUp,
  Fingerprint,
  Navigation
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
  DialogFooter,
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
    
    return {
      isComplete: missing.length === 0,
      missing
    }
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
      toast({ title: "Análise IA Concluída", description: "O Conselho de Guerra foi atualizado." })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na Análise", description: "Falha ao processar inteligência estratégica." })
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const getDrawerWidthClass = () => {
    // Para atender ao pedido de ocupar a tela toda até o menu
    // Usamos classes responsivas que respeitam a largura da sidebar
    return "w-full lg:w-[calc(100vw-var(--sidebar-width))] lg:max-w-none"
  }

  const isAlreadyClient = useMemo(() => {
    if (!selectedLead || !clients) return false
    const leadDoc = (selectedLead.cpf || selectedLead.documentNumber || "").replace(/\D/g, "")
    if (!leadDoc) return false
    return clients.some(c => (c.documentNumber || "").replace(/\D/g, "") === leadDoc)
  }, [selectedLead, clients])

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead)
    setIsSheetOpen(true)
  }

  const handleUpdateStatus = async (status: string) => {
    if (!selectedLead || !db) return
    if (status === 'distribuicao' && !isBureaucracyComplete) {
      toast({ 
        variant: "destructive", 
        title: "Acesso Bloqueado", 
        description: `Pendências: ${bureaucracyReport.missing.join(", ")}`
      })
      return
    }
    await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
      status,
      updatedAt: serverTimestamp()
    })
    setSelectedLead({ ...selectedLead, status })
    toast({ title: "Fluxo Atualizado", description: `Mover para ${status.toUpperCase()}.` })
  }

  const handleDeleteLead = async () => {
    if (!selectedLead || !db) return
    if (confirm(`Deseja EXCLUIR permanentemente o lead ${selectedLead.name}? Esta ação não pode ser desfeita.`)) {
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

  const handleNextStage = () => {
    if (!selectedLead) return
    const currentIndex = columns.findIndex(c => c.id === selectedLead.status)
    if (currentIndex < columns.length - 1) {
      handleUpdateStatus(columns[currentIndex + 1].id)
    }
  }

  const handlePrevStage = () => {
    if (!selectedLead) return
    const currentIndex = columns.findIndex(c => c.id === selectedLead.status)
    if (currentIndex > 0) {
      handleUpdateStatus(columns[currentIndex - 1].id)
    }
  }

  const handleSyncDrive = async () => {
    if (!selectedLead || !db) return
    setIsSyncingDrive(true)
    setTimeout(async () => {
      let nextStatus = "pasta_lead"
      if (selectedLead.status === "distribuicao" || selectedLead.status === "burocracia") {
        nextStatus = "pasta_cliente"
      }
      await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
        driveStatus: nextStatus,
        driveFolderId: "DRIVE_" + Math.random().toString(36).substring(7),
        updatedAt: serverTimestamp()
      })
      setSelectedLead({ ...selectedLead, driveStatus: nextStatus })
      setIsSyncingDrive(false)
      toast({ title: "Drive Sincronizado" })
    }, 2000)
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

  const handleWhatsApp = () => {
    if (!selectedLead?.phone) return
    const phone = selectedLead.phone.replace(/\D/g, "")
    const text = encodeURIComponent(`Olá ${selectedLead.name}, aqui é da RGMJ Advogados. Podemos conversar sobre seu caso?`)
    window.open(`https://wa.me/55${phone}?text=${text}`, "_blank")
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

  const handleSaveProcessNumber = async () => {
    if (!db || !selectedLead) return
    await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
      processNumber: selectedLead.processNumber || "",
      updatedAt: serverTimestamp()
    })
    toast({ title: "Número CNJ Vinculado" })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-black text-muted-foreground/40 mb-4">
            <LayoutGrid className="h-4 w-4" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white uppercase tracking-tighter">FUNIL DE LEADS</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase tracking-tighter">Leads</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-xs font-bold opacity-60">Triagem Estratégica RGMJ.</p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-background font-black gap-3 px-10 h-14 rounded-xl shadow-xl uppercase text-xs tracking-widest">
          <PlusCircle className="h-6 w-6" /> NOVO ATENDIMENTO
        </Button>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Funil...</span>
        </div>
      ) : (
        <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => (l.status || "novo") === col.id)
            return (
              <div key={col.id} className="min-w-[350px] flex-1">
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                    <h3 className={`font-black text-xs tracking-[0.3em] uppercase ${col.color}`}>{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/50 text-xs border-white/5 font-black px-3 py-1">{leadsInCol.length}</Badge>
                </div>
                <div className="space-y-5">
                  {leadsInCol.map((lead) => (
                    <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group border-white/5 shadow-lg" onClick={() => handleOpenLead(lead)}>
                      <CardContent className="p-6 space-y-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-black text-base text-white group-hover:text-primary transition-colors uppercase tracking-tight flex-1 truncate leading-tight">{lead.name}</div>
                          {lead.meetingType === 'online' && <Video className="h-5 w-5 text-primary animate-pulse" />}
                        </div>
                        {lead.scheduledDate && (
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest">
                              {new Date(lead.scheduledDate).toLocaleDateString('pt-BR')} 
                              {lead.scheduledTime && ` ÀS ${lead.scheduledTime}`}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground/40" />
                            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{lead.updatedAt?.toDate ? new Date(lead.updatedAt.toDate()).toLocaleDateString() : 'RECENTE'}</span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
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
        <SheetContent className={cn("min-h-0 overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]", getDrawerWidthClass())}>
          <SheetHeader className="sr-only"><SheetTitle>{selectedLead?.name}</SheetTitle><SheetDescription>Dossiê Lead</SheetDescription></SheetHeader>
          {selectedLead && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header do Drawer Redesenhado */}
              <div className="p-8 md:p-12 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl space-y-8 flex-none shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="space-y-6 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary uppercase font-black px-4 py-1.5 tracking-widest bg-primary/5">
                        {(selectedLead.status || "novo").toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <Database className="h-3 w-3 text-blue-400" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">DADOS PROTEGIDOS</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full border",
                        isAlreadyClient ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20 animate-pulse"
                      )}>
                        <UserPlus className={cn("h-3 w-3", isAlreadyClient ? "text-emerald-500" : "text-amber-500")} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", isAlreadyClient ? "text-emerald-500" : "text-amber-500")}>
                          {isAlreadyClient ? "PERFIL VINCULADO" : "PENDENTE OFICIALIZAÇÃO"}
                        </span>
                      </div>
                    </div>
                    
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">{selectedLead.name}</h2>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <Button onClick={handleWhatsApp} variant="outline" className="h-12 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white text-xs font-black uppercase gap-3 px-6 rounded-xl">
                        <MessageCircle className="h-5 w-5" /> WHATSAPP DIRECT
                      </Button>
                      <Button onClick={handleSyncDrive} disabled={isSyncingDrive} variant="outline" className="h-12 border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-white text-xs font-black uppercase gap-3 px-6 rounded-xl">
                        {isSyncingDrive ? <Loader2 className="h-5 w-5 animate-spin" /> : <CloudLightning className="h-5 w-5" />} SINCRONIZAR DRIVE
                      </Button>
                      <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs font-black uppercase gap-3 px-6 rounded-xl">
                        <UserCog className="h-5 w-5" /> EDITAR
                      </Button>
                      <Button onClick={handleArchiveLead} variant="outline" className="h-12 border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500 hover:text-white text-xs font-black uppercase gap-3 px-6 rounded-xl">
                        <Archive className="h-5 w-5" /> ARQUIVAR
                      </Button>
                      <Button onClick={handleDeleteLead} variant="outline" className="h-12 border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-black uppercase gap-3 px-6 rounded-xl">
                        <Trash2 className="h-5 w-5" /> EXCLUIR
                      </Button>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/5 p-2 rounded-2xl flex flex-col gap-1 w-full lg:w-64">
                    <p className="text-[9px] font-black text-muted-foreground uppercase text-center mb-1 tracking-widest">ETAPA DO FLUXO</p>
                    {columns.map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => handleUpdateStatus(c.id)} 
                        disabled={c.id === 'distribuicao' && !isBureaucracyComplete}
                        className={cn(
                          "h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-between",
                          selectedLead.status === c.id 
                            ? "bg-white/10 text-white shadow-lg" 
                            : "text-muted-foreground hover:text-white",
                          c.id === 'distribuicao' && !isBureaucracyComplete && "opacity-30 cursor-not-allowed"
                        )}
                      >
                        {c.title}
                        {selectedLead.status === c.id && <CheckCircle2 className="h-3 w-3 text-primary" />}
                        {c.id === 'distribuicao' && !isBureaucracyComplete && <Lock className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: "RÉU / EMPRESA", value: selectedLead.defendantName || "NÃO DEFINIDO", icon: Building },
                    { label: "WHATSAPP", value: selectedLead.phone, icon: Phone },
                    { label: "EMAIL", value: selectedLead.email || "NÃO INFORMADO", icon: Mail },
                    { label: "LOCALIDADE", value: selectedLead.city ? `${selectedLead.city} - ${selectedLead.state}` : "N/A - N/A", icon: MapPin },
                  ].map((item, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-5 shadow-inner">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary/60"><item.icon className="h-6 w-6" /></div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-white uppercase truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0 bg-[#0a0f1e]/30">
                <div className="p-8 md:p-12 pb-32 space-y-12 max-w-7xl mx-auto">
                  {isProfileIncomplete && (
                    <Card className="glass border-amber-500/30 bg-amber-500/5 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700 shadow-2xl">
                      <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-8">
                          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                            <ShieldAlert className="h-8 w-8" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-white uppercase tracking-widest">Dossiê de Lead Incompleto</h4>
                            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mt-2">
                              Saneamento pendente: <span className="text-amber-400">{missingFields.join(", ")}</span>.
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => setIsEditModeOpen(true)}
                          className="w-full md:w-auto h-16 px-12 gold-gradient text-background font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-2xl hover:scale-105 transition-all"
                        >
                          <UserPlus className="h-6 w-6 mr-3" /> SANEAR AGORA
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-10">
                    <TabsList className="bg-transparent border-b border-white/5 h-14 w-full justify-start rounded-none p-0 gap-10 overflow-x-auto scrollbar-hide">
                      {[
                        { id: "overview", label: "VISÃO GERAL" },
                        { id: "entrevistas", label: `ENTREVISTAS (${leadInterviews?.length || 0})` },
                        { id: "burocracia", label: "BUROCRACIA" },
                        { id: "protocolo", label: "REVISÃO & PROTOCOLO" },
                        { id: "gestao", label: "GESTÃO" },
                      ].map(tab => (
                        <TabsTrigger 
                          key={tab.id}
                          value={tab.id} 
                          className="data-[state=active]:text-primary text-muted-foreground font-black text-xs uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-[0.2em]"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-12 animate-in fade-in duration-700 outline-none">
                      {(selectedLead.scheduledDate || selectedLead.meetingType) && (
                        <div className="space-y-6">
                          <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-3"><Clock className="h-4 w-4" /> SALA DE ATENDIMENTO</h4>
                          <div className="p-10 rounded-3xl bg-amber-500/5 border border-amber-500/20 relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                              <Gavel className="h-48 text-amber-500" />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-10 border-b lg:border-b-0 lg:border-r border-white/5 pb-10 lg:pb-0 lg:pr-10">
                                <div className="space-y-2"><p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">DATA E HORÁRIO</p><p className="text-2xl font-black text-white uppercase tracking-tight">{new Date(selectedLead.scheduledDate).toLocaleDateString('pt-BR')} ÀS {selectedLead.scheduledTime || "--:--"}</p></div>
                                <div className="space-y-2"><p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">MODALIDADE</p><p className="text-2xl font-black text-white uppercase tracking-tight">{selectedLead.meetingType === 'online' ? '🖥️ VIDEOCHAMADA' : '🏢 PRESENCIAL'}</p></div>
                                {selectedLead.meetingType === 'online' && selectedLead.meetingLink && (
                                  <div className="md:col-span-2 pt-4"><p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">LINK DA SALA VIRTUAL</p><a href={selectedLead.meetingLink} target="_blank" rel="noreferrer" className="text-sm font-black text-white hover:text-primary transition-colors underline truncate block bg-black/40 p-4 rounded-xl border border-white/5">{selectedLead.meetingLink}</a></div>
                                )}
                              </div>
                              <div className="lg:col-span-4 flex flex-col justify-center gap-5">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                  <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">PROTOCOLO ATIVO</span>
                                </div>
                                {templates?.slice(0, 1).map((t) => (
                                  <Button key={t.id} onClick={() => handleStartInterview(t)} className="h-16 glass border-primary/30 text-primary font-black uppercase text-xs gap-4 hover:bg-primary hover:text-background transition-all tracking-[0.2em] rounded-xl shadow-xl">
                                    <ClipboardList className="h-6 w-6" /> INICIAR {t.title}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3"><Brain className="h-4 w-4 text-primary" /> SÍNTESE RGMJ IA</h4>
                        <div className="p-10 rounded-3xl bg-primary/5 border border-primary/10 font-serif text-white/90 leading-relaxed text-lg italic shadow-inner text-justify">
                          {selectedLead.aiSummary || "Aguardando conclusão de entrevista para consolidação tática de fatos."}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="entrevistas" className="space-y-10 animate-in fade-in duration-700 outline-none">
                      <div className="p-10 rounded-[2rem] border-2 border-dashed border-primary/20 bg-primary/5 text-center space-y-8 shadow-2xl">
                        <p className="text-xs font-black text-primary uppercase tracking-[0.4em]">BIBLIOTECA DE CAPTURA TÁTICA</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {templates?.map((t) => (
                            <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/30 text-primary font-black uppercase text-[10px] h-16 gap-4 hover:bg-primary hover:text-background transition-all tracking-[0.2em] rounded-2xl shadow-xl whitespace-normal leading-tight px-6 text-center">
                              <Zap className="h-5 w-5 shrink-0" /> {t.title}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {leadInterviews && leadInterviews.length > 0 ? (
                          leadInterviews.map((int) => (
                            <div key={int.id} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all shadow-xl">
                              <div className="space-y-2">
                                <p className="text-lg font-black text-white uppercase tracking-tight">{int.interviewType}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">EXECUTADO POR: {int.interviewerName?.toUpperCase() || 'SISTEMA RGMJ'} • {int.createdAt?.toDate ? new Date(int.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground/40 hover:text-primary rounded-full border border-white/5 hover:border-primary/20"><ChevronRight className="h-6 w-6" /></Button>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-24 text-center opacity-20 border-2 border-dashed border-white/5 rounded-[2rem]">
                            <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-xs font-black uppercase tracking-[0.5em]">NENHUMA ENTREVISTA PROTOCOLADA.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="burocracia" className="space-y-10 animate-in fade-in duration-700 outline-none">
                      {!isBureaucracyComplete && (
                        <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-8 animate-in fade-in slide-in-from-top-4 shadow-2xl">
                          <AlertCircle className="h-10 w-10 text-amber-500" />
                          <div className="flex-1">
                            <p className="text-lg font-bold text-amber-500 uppercase tracking-widest">
                              Pendências de Distribuição: <span className="text-white ml-2">{bureaucracyReport.missing.join(", ")}</span>.
                            </p>
                            <p className="text-xs text-amber-500/60 uppercase font-black tracking-widest mt-2">Dados obrigatórios para habilitar o rito de protocolo judiciário.</p>
                          </div>
                        </div>
                      )}
                      <BurocraciaView lead={selectedLead} interviews={leadInterviews || []} onEdit={() => setIsEditModeOpen(true)} />
                    </TabsContent>

                    <TabsContent value="protocolo" className="space-y-16 animate-in fade-in duration-700 outline-none pb-20">
                      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 pb-10 border-b border-white/5">
                        <div className="space-y-3">
                          <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter flex items-center gap-6">
                            <ShieldCheck className="h-12 w-12 text-primary" /> Dossiê de Check-in
                          </h3>
                          <p className="text-sm text-muted-foreground font-bold uppercase tracking-[0.4em] opacity-60">Auditoria de alta performance antes da migração definitiva.</p>
                        </div>
                        <Button 
                          onClick={handleGenerateStrategicSummary} 
                          disabled={isGeneratingSummary}
                          className="h-20 px-12 glass border-primary/20 text-primary font-black uppercase text-xs tracking-[0.2em] gap-4 hover:bg-primary/10 transition-all shadow-2xl rounded-2xl"
                        >
                          {isGeneratingSummary ? <Loader2 className="h-6 w-6 animate-spin" /> : <Brain className="h-6 w-6" />}
                          CONSOLIDAR ESTRATÉGIA (IA)
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <Card className="glass border-white/10 overflow-hidden shadow-2xl rounded-3xl">
                          <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
                            <Fingerprint className="h-6 w-6 text-primary" />
                            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em]">Qualificação das Partes</h4>
                          </div>
                          <CardContent className="p-10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-3">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Polo Ativo (Autor)</p>
                                <p className="text-xl font-black text-white uppercase leading-tight">{selectedLead.name}</p>
                                <p className="text-xs font-mono font-bold text-muted-foreground bg-black/40 p-2 rounded-lg inline-block">{selectedLead.cpf || selectedLead.documentNumber || "Documento não informado"}</p>
                              </div>
                              <div className="space-y-3">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Polo Passivo (Réu)</p>
                                <p className="text-xl font-black text-white uppercase leading-tight">{selectedLead.defendantName || "NÃO INFORMADO"}</p>
                                <p className="text-xs font-mono font-bold text-muted-foreground bg-black/40 p-2 rounded-lg inline-block">{selectedLead.defendantDocument || "Documento não informado"}</p>
                              </div>
                            </div>
                            <div className="pt-8 border-t border-white/5">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Geografia do Lead</p>
                              <p className="text-base font-bold text-white uppercase flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /> {selectedLead.city} - {selectedLead.state}</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="glass border-white/10 overflow-hidden shadow-2xl rounded-3xl">
                          <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
                            <Scale className="h-6 w-6 text-primary" />
                            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em]">Logística Judiciária</h4>
                          </div>
                          <CardContent className="p-10 space-y-10">
                            <div className="space-y-8">
                              <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center border border-white/5 shadow-inner"><Gavel className="h-8 w-8 text-muted-foreground" /></div>
                                <div>
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fórum & Vara Destino</p>
                                  <p className="text-2xl font-black text-white uppercase tracking-tight">{selectedLead.court} • {selectedLead.vara}</p>
                                </div>
                              </div>
                              <div className="pt-4">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Endereço de Citação / Localização</p>
                                <p className="text-sm font-bold text-white/80 uppercase leading-relaxed bg-black/40 p-6 rounded-2xl border border-white/5">
                                  {selectedLead.courtAddress}, {selectedLead.courtNumber} - {selectedLead.courtNeighborhood}<br/>
                                  {selectedLead.courtCity}/{selectedLead.courtState} - CEP: {selectedLead.courtZipCode}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {strategicSummary && (
                        <Card className="glass border-primary/30 bg-primary/5 shadow-[0_0_50px_rgba(245,208,48,0.1)] overflow-hidden animate-in zoom-in-95 duration-700 rounded-[2.5rem]">
                          <div className="p-10 border-b border-primary/20 flex items-center justify-between bg-primary/5">
                            <div className="flex items-center gap-6">
                              <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                              <h4 className="text-2xl font-black text-white uppercase tracking-[0.3em]">Conselho de Guerra: Inteligência RGMJ</h4>
                            </div>
                            <Badge className="bg-primary text-background font-black uppercase text-[10px] px-6 py-2 tracking-widest shadow-xl">ANÁLISE DE ALTA PERFORMANCE</Badge>
                          </div>
                          <CardContent className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-16">
                            <div className="space-y-6">
                              <h5 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                                <CheckSquare className="h-5 w-5" /> Fatos Críticos
                              </h5>
                              <p className="text-base text-white/80 leading-relaxed font-serif italic text-justify">
                                {strategicSummary.keyFacts}
                              </p>
                            </div>
                            <div className="space-y-6">
                              <h5 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <AlertCircle className="h-5 w-5" /> Riscos e Desafios
                              </h5>
                              <p className="text-base text-white/80 leading-relaxed font-serif italic text-justify">
                                {strategicSummary.risksAndChallenges}
                              </p>
                            </div>
                            <div className="space-y-6">
                              <h5 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <TrendingUp className="h-5 w-5" /> Análise de Viabilidade
                              </h5>
                              <p className="text-base text-white/80 leading-relaxed font-serif italic text-justify">
                                {strategicSummary.strategicAnalysis}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="space-y-12">
                        <div className="space-y-6">
                          <h4 className="text-xs font-black text-purple-500 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Database className="h-4 w-4" /> IDENTIFICAÇÃO DO FEITO
                          </h4>
                          <div className="p-10 rounded-[2.5rem] bg-purple-500/5 border border-purple-500/20 space-y-8 shadow-2xl">
                            <div className="space-y-4">
                              <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">NÚMERO DO PROCESSO (CNJ) - GERADO NO PROTOCOLO *</Label>
                              <div className="flex flex-col md:flex-row gap-4">
                                <Input 
                                  placeholder="0000000-00.0000.0.00.0000" 
                                  className="glass border-white/10 h-20 text-white font-mono text-3xl font-black focus:ring-purple-500/50 bg-black/40 flex-1 px-8"
                                  value={selectedLead.processNumber || ""}
                                  onChange={(e) => setSelectedLead({...selectedLead, processNumber: e.target.value})}
                                />
                                <Button 
                                  onClick={handleSaveProcessNumber}
                                  className="h-20 px-12 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl transition-all active:scale-95 shrink-0"
                                >
                                  VINCULAR AO DOSSIÊ
                                </Button>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] italic flex items-center gap-2">
                                <AlertCircle className="h-3 w-3" /> O NÚMERO SERÁ HERDADO AUTOMATICAMENTE NA CONVERSÃO FINAL.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-12 rounded-[3rem] border border-purple-500/20 bg-purple-500/5 space-y-10 shadow-2xl">
                          <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-3xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-inner">
                              <CheckSquare className="h-10 w-10 text-purple-400" />
                            </div>
                            <div>
                              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Checklist de Distribuição</h3>
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.3em] mt-2">Auditoria final de documentação tática RGMJ.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                              { id: "c1", label: "Petição Inicial Elaborada (IA Revisada)", checked: true },
                              { id: "c2", label: "Procuração e Contrato Assinado", checked: true },
                              { id: "c3", label: "Provas no Google Drive", checked: isBureaucracyComplete },
                              { id: "c4", label: "Cálculos Judiciais Anexados", checked: false },
                              { id: "c5", label: "Custas / Hipossuficiência", checked: true },
                              { id: "c6", label: "Citação do Réu Verificada", checked: !!selectedLead.defendantAddress },
                            ].map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-6 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/30 transition-all group">
                                <span className="text-xs font-black text-white uppercase tracking-widest">{item.label}</span>
                                {item.checked ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <AlertCircle className="h-6 w-6 text-amber-500/30" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center text-center space-y-10 py-16 bg-white/[0.01] rounded-[4rem] border border-white/5">
                        <Scale className="h-20 w-20 text-primary opacity-20" />
                        <div className="space-y-4">
                          <h4 className="text-2xl font-black text-white uppercase tracking-widest">Pronto para Oficializar?</h4>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.4em] max-w-2xl leading-relaxed mx-auto">
                            Ao confirmar o protocolo, este Lead será convertido em um Processo Ativo na base oficial da banca RGMJ. Toda a inteligência capturada será migrada definitivamente para o prontuário jurídico.
                          </p>
                        </div>
                        <Button onClick={() => setIsConversionOpen(true)} className="gold-gradient text-background font-black h-24 px-20 rounded-[2rem] shadow-[0_20px_60px_rgba(245,208,48,0.2)] uppercase text-sm tracking-[0.3em] gap-6 hover:scale-105 active:scale-95 transition-all">
                          <ShieldCheck className="h-8 w-8" /> PROTOCOLAR E CONVERTER DEFINITIVAMENTE
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="gestao" className="space-y-10 animate-in fade-in duration-700 outline-none">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="glass border-primary/20 p-10 space-y-6 rounded-3xl shadow-2xl">
                          <div><h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">RETIFICAÇÃO DE DADOS</h4><p className="text-xs text-muted-foreground uppercase font-black tracking-widest opacity-60 leading-relaxed">Ajustar informações cadastrais e qualificação das partes para manter a integridade do rito.</p></div>
                          <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="w-full h-16 border-primary/30 text-primary hover:bg-primary hover:text-background font-black uppercase text-xs tracking-[0.2em] gap-4 rounded-xl">
                            <UserCog className="h-6 w-6" /> ATUALIZAR FICHA CADASTRAL
                          </Button>
                        </Card>
                        <Card className="glass border-rose-500/20 p-10 space-y-6 rounded-3xl shadow-2xl">
                          <div><h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">ENCERRAMENTO TÁTICO</h4><p className="text-xs text-muted-foreground uppercase font-black tracking-widest opacity-60 leading-relaxed">Mover o atendimento para o acervo passivo ou descartar lead improcedente.</p></div>
                          <Button 
                            onClick={handleArchiveLead} 
                            variant="outline" 
                            className="w-full h-16 border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl"
                          >
                            ARQUIVAR ATENDIMENTO
                          </Button>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              {/* Footer do Drawer Redesenhado */}
              <div className="p-8 md:p-10 bg-[#0a0f1e] border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] z-30 flex-none">
                <Button 
                  variant="ghost" 
                  onClick={handlePrevStage} 
                  disabled={selectedLead.status === 'novo'}
                  className="text-muted-foreground font-black uppercase text-xs tracking-[0.3em] gap-4 h-16 px-10 hover:text-white transition-all"
                >
                  <ArrowLeft className="h-5 w-5" /> RETROCEDER ETAPA
                </Button>

                <div className="hidden md:flex gap-3">
                  {columns.map(c => (
                    <div key={c.id} className={cn(
                      "w-12 h-1.5 rounded-full transition-all duration-500",
                      selectedLead.status === c.id ? "bg-primary shadow-[0_0_15px_rgba(245,208,48,0.6)]" : "bg-white/5"
                    )} />
                  ))}
                </div>

                <Button 
                  onClick={handleNextStage}
                  disabled={selectedLead.status === 'distribuicao' || (selectedLead.status === 'burocracia' && !isBureaucracyComplete)}
                  className={cn(
                    "h-20 px-16 font-black uppercase text-xs tracking-[0.3em] rounded-2xl shadow-2xl gap-4 transition-all",
                    (selectedLead.status === 'burocracia' && !isBureaucracyComplete) 
                      ? "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed" 
                      : "gold-gradient text-background hover:scale-105 active:scale-95"
                  )}
                >
                  {selectedLead.status === 'burocracia' && !isBureaucracyComplete ? <Lock className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                  AVANÇAR FLUXO
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Outros Sheets e Dialogs permanecem com a mesma lógica de largura expansiva */}
      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1200px] w-[95vw] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-4xl uppercase tracking-tighter flex items-center gap-4">
                <Brain className="h-10 w-10 text-primary" /> Execução de Entrevista
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">
                Captura de DNA Jurídico para a banca RGMJ.
              </DialogDescription>
            </DialogHeader>
          </div>
          {executingTemplate && (
            <DynamicInterviewExecution 
              template={executingTemplate} 
              onSubmit={handleFinishInterview}
              onCancel={() => { setIsInterviewDialogOpen(false); setExecutingTemplate(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1200px] w-[95vw] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-4xl uppercase tracking-tighter flex items-center gap-4">
                <Scale className="h-10 w-10 text-primary" /> Oficialização de Dossiê
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">
                Conversão definitiva de Lead para Processo Ativo.
              </DialogDescription>
            </DialogHeader>
          </div>
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
                description: selectedLead.demandTitle || selectedLead.notes?.substring(0, 100),
                responsibleStaffId: user?.uid
              }}
              onSubmit={handleConvertProcess}
              onCancel={() => setIsConversionOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <SheetContent className={cn("min-h-0 overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]", getDrawerWidthClass())}>
          <div className="p-10 border-b border-white/5 flex-none"><SheetHeader><SheetTitle className="text-white font-headline text-4xl uppercase tracking-tighter">Novo Lead RGMJ</SheetTitle></SheetHeader></div>
          <LeadForm 
            existingLeads={leads} 
            onSubmit={(data) => {
              const newLead = {
                ...data,
                assignedStaffId: user?.uid,
                status: "novo",
                driveStatus: "pendente",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              }
              addDocumentNonBlocking(collection(db!, "leads"), newLead)
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
        <SheetContent className={cn("min-h-0 overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]", getDrawerWidthClass())}>
          <div className="p-10 border-b border-white/5 flex-none"><SheetHeader><SheetTitle className="text-white font-headline text-4xl uppercase tracking-tighter">Retificar Dossiê</SheetTitle></SheetHeader></div>
          {selectedLead && (
            <LeadForm 
              existingLeads={[]}
              initialData={selectedLead}
              initialMode="complete"
              lockMode={true}
              onSubmit={async (data) => {
                await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
                  ...data,
                  updatedAt: serverTimestamp()
                })
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
