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
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { LeadForm } from "@/components/leads/lead-form"
import { collection, query, serverTimestamp, doc, where, limit, orderBy } from "firebase/firestore"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { cn } from "@/lib/utils"
import { DynamicInterviewExecution } from "@/components/interviews/dynamic-interview-execution"
import { BurocraciaView } from "@/components/leads/burocracia-view"
import { ProcessForm } from "@/components/cases/process-form"
import Link from "next/link"

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

  const missingFields = useMemo(() => {
    if (!selectedLead) return []
    const missing = []
    if (!selectedLead.cpf && !selectedLead.documentNumber) missing.push("CPF/CNPJ")
    if (!selectedLead.email) missing.push("E-MAIL")
    if (!selectedLead.phone) missing.push("WHATSAPP")
    if (!selectedLead.city) missing.push("LOCALIDADE")
    if (!selectedLead.defendantName) missing.push("NOME DO RÉU")
    return missing
  }, [selectedLead])

  const isProfileIncomplete = missingFields.length > 0

  const isBureaucracyComplete = useMemo(() => {
    if (!selectedLead) return false
    const hasEssentialData = 
      selectedLead.name && 
      (selectedLead.cpf || selectedLead.documentNumber) && 
      selectedLead.defendantName
    
    const hasDrive = selectedLead.driveStatus === 'pasta_cliente' || selectedLead.driveStatus === 'pasta_lead'
    
    return !!(hasEssentialData && hasDrive)
  }, [selectedLead])

  useEffect(() => {
    if (selectedLead) {
      if (selectedLead.status === 'atendimento') setActiveDossierTab("entrevistas")
      else if (selectedLead.status === 'burocracia') setActiveDossierTab("burocracia")
      else if (selectedLead.status === 'distribuicao') setActiveDossierTab("protocolo")
      else setActiveDossierTab("overview")
    }
  }, [selectedLead?.id, selectedLead?.status])

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

    if (selectedLead.status === 'burocracia' && status === 'distribuicao' && !isBureaucracyComplete) {
      toast({ 
        variant: "destructive", 
        title: "Acesso Bloqueado", 
        description: "Conclua os requisitos mínimos da Burocracia para avançar." 
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
    const text = encodeURIComponent(`Olá ${selectedLead.name}, aqui é da RGMJ Advogados. Gostaria de agendar seu atendimento.`)
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-black text-muted-foreground/40 mb-4">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">FUNIL DE LEADS</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white mb-2 uppercase tracking-tighter">Leads</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">Triagem Estratégica RGMJ.</p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-background font-black gap-3 px-8 h-11 md:h-12 rounded-xl shadow-xl uppercase text-[11px] tracking-widest">
          <PlusCircle className="h-5 w-5" /> NOVO ATENDIMENTO
        </Button>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Funil...</span>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => (l.status || "novo") === col.id)
            return (
              <div key={col.id} className="min-w-[320px] flex-1">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                    <h3 className={`font-black text-[10px] tracking-[0.3em] uppercase ${col.color}`}>{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/50 text-[10px] border-white/5 font-black px-2">{leadsInCol.length}</Badge>
                </div>
                <div className="space-y-4">
                  {leadsInCol.map((lead) => (
                    <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group border-white/5" onClick={() => handleOpenLead(lead)}>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-black text-sm text-white group-hover:text-primary transition-colors uppercase tracking-tight flex-1 truncate leading-tight">{lead.name}</div>
                          {lead.meetingType === 'online' && <Video className="h-4 w-4 text-primary animate-pulse" />}
                        </div>
                        {lead.scheduledDate && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <Clock className="h-3 w-3 text-amber-500" />
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                              {new Date(lead.scheduledDate).toLocaleDateString('pt-BR')} 
                              {lead.scheduledTime && ` ÀS ${lead.scheduledTime}`}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground/40" />
                            <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{lead.updatedAt?.toDate ? new Date(lead.updatedAt.toDate()).toLocaleDateString() : 'RECENTE'}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
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
        <SheetContent className={cn("w-full min-h-0 overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]", getDrawerWidthClass())}>
          <SheetHeader className="sr-only"><SheetTitle>{selectedLead?.name}</SheetTitle><SheetDescription>Dossiê Lead</SheetDescription></SheetHeader>
          {selectedLead && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-5 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[8px] border-primary/30 text-primary uppercase font-black px-2 tracking-[0.15em] bg-primary/5">
                        {(selectedLead.status || "novo").toUpperCase()}
                      </Badge>
                      
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <Database className="h-2 w-2 text-blue-400" />
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.15em]">BANCO DE DADOS: PROTEGIDO</span>
                      </div>

                      <div className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                        isAlreadyClient ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20 animate-pulse"
                      )}>
                        <UserPlus className={cn("h-2 w-2", isAlreadyClient ? "text-emerald-500" : "text-amber-500")} />
                        <span className={cn("text-[8px] font-black uppercase tracking-[0.15em]", isAlreadyClient ? "text-emerald-500" : "text-amber-500")}>
                          {isAlreadyClient ? "PERFIL VINCULADO" : "CLIENTE NÃO OFICIALIZADO"}
                        </span>
                      </div>

                      <div className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                        selectedLead.driveStatus === 'pasta_cliente' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10"
                      )}>
                        <CloudLightning className={cn("h-2 w-2", selectedLead.driveStatus === 'pasta_cliente' ? "text-emerald-500" : "text-muted-foreground/40")} />
                        <span className={cn("text-[8px] font-black uppercase tracking-[0.15em]", selectedLead.driveStatus === 'pasta_cliente' ? "text-emerald-500" : "text-muted-foreground/40")}>
                          DRIVE: {selectedLead.driveStatus === 'pasta_cliente' ? 'SINCRONIZADO' : 'PENDENTE'}
                        </span>
                      </div>
                    </div>
                    
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-tight">{selectedLead.name}</h2>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <Button onClick={handleWhatsApp} variant="outline" className="h-9 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white text-[8px] font-black uppercase gap-2 tracking-[0.15em] rounded-lg">
                        <MessageCircle className="h-3 w-3" /> WHATSAPP
                      </Button>

                      <Button onClick={handleSyncDrive} disabled={isSyncingDrive} variant="outline" className="h-9 border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-white text-[8px] font-black uppercase gap-2 tracking-[0.15em] rounded-lg">
                        {isSyncingDrive ? <Loader2 className="h-3 w-3 animate-spin" /> : <CloudLightning className="h-3 w-3" />} SINCRONIZAR DRIVE
                      </Button>

                      <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10 text-[8px] font-black uppercase gap-2 tracking-[0.15em] rounded-lg">
                        <UserCog className="h-3.5 w-3.5" /> EDITAR CADASTRO
                      </Button>

                      <div className="flex p-0.5 rounded-lg bg-black/40 border border-white/5 ml-auto overflow-hidden">
                        {columns.map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => handleUpdateStatus(c.id)} 
                            disabled={c.id === 'distribuicao' && !isBureaucracyComplete}
                            className={cn(
                              "h-7 px-3 text-[7px] font-black uppercase tracking-widest rounded transition-all whitespace-nowrap flex items-center gap-1.5",
                              selectedLead.status === c.id 
                                ? "bg-white/10 text-white" 
                                : "text-muted-foreground hover:text-white",
                              c.id === 'distribuicao' && !isBureaucracyComplete && "opacity-30 cursor-not-allowed"
                            )}
                          >
                            {c.id === 'distribuicao' && !isBureaucracyComplete && <Lock className="h-2 w-2" />}
                            {c.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "RÉU / EMPRESA", value: selectedLead.defendantName || "NÃO DEFINIDO", icon: Building },
                    { label: "WHATSAPP", value: selectedLead.phone, icon: Phone },
                    { label: "EMAIL", value: selectedLead.email || "NÃO INFORMADO", icon: Mail },
                    { label: "LOCALIDADE", value: selectedLead.city ? `${selectedLead.city} - ${selectedLead.state}` : "N/A - N/A", icon: MapPin },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground/40"><item.icon className="h-3.5 w-3.5" /></div>
                      <div>
                        <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                        <p className="text-[9px] font-bold text-white uppercase truncate max-w-[120px]">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-6 pb-24 space-y-8">
                  {/* ALERTA DE PERFIL INCOMPLETO */}
                  {isProfileIncomplete && (
                    <Card className="glass border-amber-500/30 bg-amber-500/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
                      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <ShieldAlert className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Atenção: Dossiê de Lead Incompleto</h4>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                              Faltam dados táticos: <span className="text-amber-400">{missingFields.join(", ")}</span>.
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => setIsEditModeOpen(true)}
                          className="w-full md:w-auto h-12 px-8 gold-gradient text-background font-black uppercase text-[10px] tracking-widest rounded-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                          <UserPlus className="h-4 w-4 mr-2" /> Saneamento Imediato
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-6">
                    <TabsList className="bg-transparent border-b border-white/5 h-10 w-full justify-start rounded-none p-0 gap-6 overflow-x-auto scrollbar-hide">
                      <TabsTrigger value="overview" className="data-[state=active]:text-primary text-muted-foreground font-black text-[8px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-[0.15em]">VISÃO GERAL</TabsTrigger>
                      <TabsTrigger value="entrevistas" className="data-[state=active]:text-primary text-muted-foreground font-black text-[8px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-[0.15em]">ENTREVISTAS ({leadInterviews?.length || 0})</TabsTrigger>
                      <TabsTrigger value="burocracia" className="data-[state=active]:text-primary text-muted-foreground font-black text-[8px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-[0.15em]">BUROCRACIA</TabsTrigger>
                      <TabsTrigger value="gestao" className="data-[state=active]:text-primary text-muted-foreground font-black text-[8px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-[0.15em]">GESTÃO</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
                      {(selectedLead.scheduledDate || selectedLead.meetingType) && (
                        <div className="space-y-4">
                          <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.25em] flex items-center gap-2"><Clock className="h-3 w-3" /> SALA DE ATENDIMENTO</h4>
                          <div className="p-6 rounded-xl bg-amber-500/5 border border-amber-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                              <Gavel className="h-24 text-amber-500" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                              <div className="md:col-span-7 grid grid-cols-2 gap-4 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0">
                                <div><p className="text-[7px] font-black text-amber-500/70 uppercase tracking-[0.2em] mb-1.5">DATA E HORA</p><p className="text-sm font-black text-white uppercase tracking-tight">{new Date(selectedLead.scheduledDate).toLocaleDateString('pt-BR')} ÀS {selectedLead.scheduledTime || "--:--"}</p></div>
                                <div><p className="text-[7px] font-black text-amber-500/70 uppercase tracking-[0.2em] mb-1.5">TIPO</p><p className="text-sm font-black text-white uppercase tracking-tight">{selectedLead.meetingType === 'online' ? '🖥️ VIDEOCHAMADA' : '🏢 PRESENCIAL'}</p></div>
                                {selectedLead.meetingType === 'online' && selectedLead.meetingLink && (
                                  <div className="col-span-2 pt-2"><p className="text-[7px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">LINK DA SALA</p><a href={selectedLead.meetingLink} target="_blank" rel="noreferrer" className="text-[9px] font-black text-white hover:text-primary transition-colors underline truncate block">{selectedLead.meetingLink}</a></div>
                                )}
                              </div>
                              <div className="md:col-span-5 flex flex-col justify-center gap-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em]">PROTOCOLO EM ANDAMENTO</span>
                                </div>
                                {templates?.slice(0, 1).map((t) => (
                                  <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/30 text-primary font-black uppercase text-[8px] h-10 gap-2 hover:bg-primary hover:text-background transition-all tracking-widest truncate">
                                    <ClipboardList className="h-3.5 w-3.5" /> {t.title}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h4 className="text-[9px] font-black text-white uppercase tracking-[0.25em] flex items-center gap-2"><Brain className="h-3 w-3 text-primary" /> SÍNTESE RGMJ IA</h4>
                        <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 font-serif text-white/80 leading-relaxed text-xs md:text-sm italic shadow-inner">
                          {selectedLead.aiSummary || "Aguardando conclusão de entrevista para consolidação de fatos."}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="entrevistas" className="space-y-6">
                      <div className="p-6 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 mb-4 text-center space-y-4">
                        <p className="text-[8px] font-black text-primary uppercase tracking-[0.25em]">INICIAR NOVA CAPTURA TÁTICA:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {templates?.map((t) => (
                            <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/30 text-primary font-black uppercase text-[8px] h-11 gap-2 hover:bg-primary hover:text-background transition-all tracking-[0.15em] truncate">
                              <Zap className="h-3.5 w-3.5" /> {t.title}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {leadInterviews && leadInterviews.length > 0 ? (
                          leadInterviews.map((int) => (
                            <div key={int.id} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all">
                              <div className="space-y-1">
                                <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-tight">{int.interviewType}</p>
                                <p className="text-[7px] md:text-[8px] text-muted-foreground uppercase font-black tracking-widest">POR: {int.interviewerName?.toUpperCase() || 'EQUIPE RGMJ'} • {int.createdAt?.toDate ? new Date(int.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-primary rounded-full"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center opacity-20">
                            <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                            <p className="text-[8px] font-black uppercase tracking-[0.4em]">NENHUMA ENTREVISTA PROTOCOLADA.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="burocracia" className="space-y-6">
                      {!isBureaucracyComplete && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                          <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Pendente: Preencha os dados do Réu e Sincronize o Drive para liberar o Protocolo.</p>
                        </div>
                      )}
                      <BurocraciaView lead={selectedLead} interviews={leadInterviews || []} />
                    </TabsContent>

                    <TabsContent value="protocolo" className="space-y-8 animate-in fade-in duration-500">
                      <div className="p-8 rounded-[2rem] border border-purple-500/20 bg-purple-500/5 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <CheckSquare className="h-6 w-6 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Checklist de Distribuição</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Auditoria final antes do protocolo judiciário.</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {[
                            { id: "c1", label: "Petição Inicial Elaborada (Minuta IA Revisada)", checked: true },
                            { id: "c2", label: "Kit de Procuração e Contrato Assinado", checked: true },
                            { id: "c3", label: "Provas Documentais Organizadas no Drive", checked: isBureaucracyComplete },
                            { id: "c4", label: "Cálculos Judiciais Anexados", checked: false },
                            { id: "c5", label: "Declaração de Hipossuficiência Pronta", checked: true },
                          ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                              <span className="text-[11px] font-bold text-white uppercase tracking-tight">{item.label}</span>
                              {item.checked ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500/50" />}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center text-center space-y-6 py-10">
                        <Scale className="h-12 w-12 text-primary opacity-20" />
                        <div className="space-y-2">
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">Pronto para Oficializar?</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] max-w-md">Ao protocolar, este lead será convertido em um Processo Ativo na base RGMJ.</p>
                        </div>
                        <Button onClick={() => setIsConversionOpen(true)} className="gold-gradient text-background font-black h-16 px-16 rounded-xl shadow-2xl uppercase text-[12px] tracking-[0.2em] gap-4">
                          <ShieldCheck className="h-6 w-6" /> PROTOCOLAR E CONVERTER
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="gestao" className="space-y-6 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="glass border-primary/20 p-5 space-y-4 rounded-xl">
                          <div><h4 className="text-xs font-black text-white uppercase tracking-tighter mb-1">EDITAR FICHA</h4><p className="text-[7px] md:text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Retificar dados cadastrais.</p></div>
                          <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="w-full h-10 border-primary/30 text-primary hover:bg-primary hover:text-background font-black uppercase text-[8px] tracking-[0.2em] gap-2 rounded-lg">
                            <UserCog className="h-3.5 w-3.5" /> ATUALIZAR CADASTRO
                          </Button>
                        </Card>
                        <Card className="glass border-rose-500/20 p-5 space-y-4 rounded-xl">
                          <div><h4 className="text-xs font-black text-white uppercase tracking-tighter mb-1">ARQUIVAR LEAD</h4><p className="text-[7px] md:text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Mover para acervo passivo.</p></div>
                          <Button 
                            onClick={() => handleUpdateStatus("arquivado")} 
                            variant="outline" 
                            className="w-full h-10 border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white font-black uppercase text-[8px] tracking-[0.2em] rounded-lg"
                          >
                            ENCERRAR ATENDIMENTO
                          </Button>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              <div className="p-6 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                <Button 
                  variant="ghost" 
                  onClick={handlePrevStage} 
                  disabled={selectedLead.status === 'novo'}
                  className="text-muted-foreground font-black uppercase text-[10px] tracking-[0.2em] gap-2 h-12 px-6"
                >
                  <ArrowLeft className="h-4 w-4" /> Retroceder Etapa
                </Button>

                <div className="hidden md:flex gap-1.5">
                  {columns.map(c => (
                    <div key={c.id} className={cn(
                      "w-8 h-1 rounded-full",
                      selectedLead.status === c.id ? "bg-primary shadow-[0_0_8px_rgba(245,208,48,0.5)]" : "bg-white/5"
                    )} />
                  ))}
                </div>

                <Button 
                  onClick={handleNextStage}
                  disabled={selectedLead.status === 'distribuicao' || (selectedLead.status === 'burocracia' && !isBureaucracyComplete)}
                  className={cn(
                    "h-14 px-10 font-black uppercase text-[11px] tracking-[0.2em] rounded-xl shadow-2xl gap-3 transition-all",
                    (selectedLead.status === 'burocracia' && !isBureaucracyComplete) 
                      ? "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed" 
                      : "gold-gradient text-background hover:scale-105 active:scale-95"
                  )}
                >
                  {selectedLead.status === 'burocracia' && !isBureaucracyComplete ? <Lock className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  Próxima Etapa
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1000px] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
          <div className="p-6 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter flex items-center gap-3">
                <Brain className="h-6 w-6 text-primary" /> Execução de Entrevista
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Captura estruturada de fatos para a banca RGMJ.
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
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1000px] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
          <div className="p-6 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter flex items-center gap-3">
                <Scale className="h-6 w-6 text-primary" /> Oficialização de Dossiê
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Converta este Lead em um Processo Ativo na base oficial.
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
        <SheetContent className={cn("w-full min-h-0 overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]", getDrawerWidthClass())}>
          <div className="p-8 border-b border-white/5"><SheetHeader><SheetTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Novo Lead RGMJ</SheetTitle></SheetHeader></div>
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
              toast({ title: "Triagem Iniciada!" })
            }} 
            onSelectExisting={(l) => { handleOpenLead(l); setIsNewEntryOpen(false); }} 
            onCancel={() => setIsNewEntryOpen(false)}
            defaultResponsibleLawyer={user?.displayName || ""}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={isEditModeOpen} onOpenChange={setIsEditModeOpen}>
        <SheetContent className={cn("w-full min-h-0 overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]", getDrawerWidthClass())}>
          <div className="p-8 border-b border-white/5"><SheetHeader><SheetTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Retificar Lead RGMJ</SheetTitle></SheetHeader></div>
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
