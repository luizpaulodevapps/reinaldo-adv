
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  ChevronRight, 
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
  FolderOpen
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

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [isEditModeOpen, setIsEditModeOpen] = useState(false)
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

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead)
    setIsSheetOpen(true)
  }

  const handleCreateEntry = async (data: any) => {
    if (!user || !db) return
    const newLead = {
      ...data,
      assignedStaffId: user.uid,
      status: "novo",
      driveStatus: "pendente",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await addDocumentNonBlocking(collection(db!, "leads"), newLead)
    setIsNewEntryOpen(false)
    toast({ title: "Triagem Iniciada!" })
  }

  const handleUpdateLead = async (data: any) => {
    if (!selectedLead || !db) return
    await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
      ...data,
      updatedAt: serverTimestamp()
    })
    setSelectedLead({ ...selectedLead, ...data })
    setIsEditModeOpen(false)
    toast({ title: "Cadastro Atualizado" })
  }

  const handleUpdateStatus = async (status: string) => {
    if (!selectedLead || !db) return
    await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
      status,
      updatedAt: serverTimestamp()
    })
    setSelectedLead({ ...selectedLead, status })
    toast({ title: "Fluxo Atualizado", description: `Mover para ${status.toUpperCase()}.` })
  }

  const handleSyncDrive = async () => {
    if (!selectedLead || !db) return
    setIsSyncingDrive(true)
    
    // Simulação de lógica de pastas Google Drive RGMJ
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
      toast({ 
        title: "Sincronia Drive Concluída", 
        description: nextStatus === "pasta_cliente" ? "Estrutura movida para pasta de Clientes." : "Pasta de Lead gerada com sucesso."
      })
    }, 2000)
  }

  const handleStartInterview = (template: any) => {
    setExecutingTemplate(template)
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

  const normalizeLeadStatus = (status?: string) => status || "novo"

  const isProfileComplete = (lead: any) => {
    if (!lead) return false
    const required = [lead.name, lead.phone, lead.email, lead.cpf, lead.city, lead.state]
    return required.every(field => field && field.trim() !== "" && field !== "NÃO INFORMADO" && field !== "N/A")
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
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Leads</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">Triagem Estratégica RGMJ.</p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-background font-black gap-3 px-8 h-12 rounded-xl shadow-xl uppercase text-[11px] tracking-widest">
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
            const leadsInCol = leads.filter(l => normalizeLeadStatus(l.status) === col.id)
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
              <div className="p-8 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl space-y-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase font-black px-3 py-1 tracking-[0.2em] bg-primary/5">
                        {normalizeLeadStatus(selectedLead.status).toUpperCase()}
                      </Badge>
                      
                      {/* STATUS BANCO DE DADOS */}
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <Database className="h-3 w-3 text-blue-400" />
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">Banco de Dados: Protegido</span>
                      </div>

                      {/* STATUS GOOGLE DRIVE */}
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full border",
                        selectedLead.driveStatus === "pasta_cliente" ? "bg-emerald-500/10 border-emerald-500/20" : 
                        selectedLead.driveStatus === "pasta_lead" ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5 border-white/10 opacity-50"
                      )}>
                        <CloudLightning className={cn("h-3 w-3", selectedLead.driveStatus ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", selectedLead.driveStatus === "pasta_cliente" ? "text-emerald-500" : selectedLead.driveStatus === "pasta_lead" ? "text-amber-500" : "text-muted-foreground")}>
                          Drive: {selectedLead.driveStatus === "pasta_cliente" ? "Estrutura de Cliente" : selectedLead.driveStatus === "pasta_lead" ? "Pasta de Lead" : "Pendente"}
                        </span>
                      </div>

                      {isProfileComplete(selectedLead) ? (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em]">Perfil Aprovado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-[0.2em]">Cadastro Pendente</span>
                          </div>
                          <Button onClick={() => setIsEditModeOpen(true)} variant="link" className="text-[8px] font-black text-primary uppercase tracking-[0.3em] p-0 h-auto hover:text-white transition-colors">
                            COMPLETAR FICHA
                          </Button>
                        </div>
                      )}
                    </div>
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">{selectedLead.name}</h2>
                    
                    <div className="flex items-center gap-6">
                      <Button onClick={handleWhatsApp} variant="outline" className="h-12 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white text-[10px] font-black uppercase gap-3 tracking-[0.2em] rounded-xl transition-all">
                        <MessageCircle className="h-4 w-4" /> WHATSAPP DIRECT
                      </Button>

                      <Button 
                        onClick={handleSyncDrive} 
                        disabled={isSyncingDrive}
                        variant="outline" 
                        className="h-12 border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-background text-[10px] font-black uppercase gap-3 tracking-[0.2em] rounded-xl transition-all"
                      >
                        {isSyncingDrive ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudLightning className="h-4 w-4" />} 
                        Sincronizar Drive
                      </Button>
                      
                      <div className="flex p-1 rounded-xl bg-black/40 border border-white/5">
                        {columns.map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => handleUpdateStatus(c.id)} 
                            className={cn(
                              "h-10 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                              selectedLead.status === c.id 
                                ? "bg-white/10 text-white ring-1 ring-white/20" 
                                : "text-muted-foreground hover:text-white"
                            )}
                          >
                            {c.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {selectedLead.status === 'distribuicao' && (
                      <Button className="gold-gradient text-background font-black h-16 px-10 rounded-xl shadow-2xl uppercase text-[12px] tracking-[0.3em] gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                        <Scale className="h-6 w-6" /> CONVERTER EM PROCESSO
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)} className="h-12 w-12 text-white/20 hover:text-white transition-colors">
                      <X className="h-8 w-8" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">RÉU / EMPRESA</p>
                      <p className="text-xs font-black text-white uppercase truncate max-w-[180px] tracking-tight">{selectedLead.defendantName || "NÃO DEFINIDO"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                      <Phone className="h-5 w-5 text-muted-foreground/60" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">WHATSAPP</p>
                      <p className="text-xs font-black text-white tracking-tight">{selectedLead.phone || "NÃO INFORMADO"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                      <Mail className="h-5 w-5 text-muted-foreground/60" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">EMAIL</p>
                      <p className="text-xs font-black text-white uppercase truncate max-w-[180px] tracking-tight">{selectedLead.email || "NÃO INFORMADO"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                      <MapPin className="h-5 w-5 text-muted-foreground/60" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">LOCALIDADE</p>
                      <p className="text-xs font-black text-white uppercase truncate tracking-tight">
                        {selectedLead.city ? `${selectedLead.city} - ${selectedLead.state}` : "N/A - N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-8">
                  <Tabs defaultValue="overview" className="space-y-10">
                    <TabsList className="bg-transparent border-b border-white/5 h-12 w-full justify-start rounded-none p-0 gap-10">
                      <TabsTrigger value="overview" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-[0.2em]">VISÃO GERAL</TabsTrigger>
                      <TabsTrigger value="entrevistas" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-[0.2em]">ENTREVISTAS ({leadInterviews?.length || 0})</TabsTrigger>
                      <TabsTrigger value="burocracia" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-[0.2em]">BUROCRACIA</TabsTrigger>
                      <TabsTrigger value="gestao" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all tracking-[0.2em]">GESTÃO</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-12">
                      {(selectedLead.scheduledDate || selectedLead.meetingType) && (
                        <div className="space-y-6">
                          <h4 className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-3"><Clock className="h-4 w-4" /> SALA DE ATENDIMENTO</h4>
                          <div className="p-10 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                              <Gavel className="h-32 w-32 text-amber-500" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 relative z-10">
                              <div className="md:col-span-7 grid grid-cols-2 gap-10 border-r border-white/5">
                                <div><p className="text-[9px] font-black text-amber-500/70 uppercase tracking-[0.3em] mb-2">DATA E HORA</p><p className="text-lg font-black text-white uppercase tracking-tight">{new Date(selectedLead.scheduledDate).toLocaleDateString('pt-BR')} ÀS {selectedLead.scheduledTime || "--:--"}</p></div>
                                <div><p className="text-[9px] font-black text-amber-500/70 uppercase tracking-[0.3em] mb-2">TIPO</p><p className="text-lg font-black text-white uppercase tracking-tight">{selectedLead.meetingType === 'online' ? '🖥️ VIDEOCHAMADA' : '🏢 PRESENCIAL'}</p></div>
                                {selectedLead.meetingType === 'online' && selectedLead.meetingLink && (
                                  <div className="col-span-2 pt-4"><p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-2">LINK DA SALA</p><a href={selectedLead.meetingLink} target="_blank" rel="noreferrer" className="text-xs font-black text-white hover:text-primary transition-colors underline truncate block">{selectedLead.meetingLink}</a></div>
                                )}
                              </div>
                              <div className="md:col-span-5 flex flex-col justify-center gap-4">
                                {selectedLead.status === 'novo' ? (
                                  <Button 
                                    onClick={() => handleUpdateStatus("atendimento")}
                                    className="w-full h-16 gold-gradient text-background font-black uppercase text-[12px] tracking-[0.25em] gap-3 shadow-2xl hover:scale-[1.02] transition-all"
                                  >
                                    <Play className="h-5 w-5 fill-current" /> INICIAR PROTOCOLO TÉCNICO
                                  </Button>
                                ) : (
                                  <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">PROTOCOLO EM ANDAMENTO</span>
                                    </div>
                                    {templates?.slice(0, 2).map((t) => (
                                      <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/30 text-primary font-black uppercase text-[10px] h-14 gap-3 hover:bg-primary hover:text-background transition-all tracking-widest">
                                        <ClipboardList className="h-4 w-4" /> {t.title}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                                {selectedLead.meetingType === 'online' && selectedLead.meetingLink && (
                                  <Button asChild variant="outline" className="w-full h-14 border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.25em] hover:bg-primary hover:text-background">
                                    <a href={selectedLead.meetingLink} target="_blank" rel="noreferrer"><Video className="h-4 w-4 mr-2" /> ENTRAR NA CHAMADA</a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedLead.status !== 'novo' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                          <h4 className="text-sm font-black text-white/80 uppercase tracking-[0.3em] flex items-center gap-3"><ClipboardList className="h-4 w-4 text-primary" /> AÇÕES RÁPIDAS DE ATENDIMENTO</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates?.map((t) => (
                              <Button 
                                key={t.id} 
                                onClick={() => handleStartInterview(t)} 
                                variant="outline" 
                                className="glass border-white/10 h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 hover:border-primary/40 group transition-all"
                              >
                                <Zap className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black text-white uppercase text-center px-6 line-clamp-2 tracking-widest leading-tight">{t.title}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-6">
                        <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3"><Brain className="h-4 w-4 text-primary" /> SÍNTESE RGMJ IA</h4>
                        <div className="p-10 rounded-[2rem] bg-primary/5 border border-primary/10 font-serif text-white/80 leading-relaxed whitespace-pre-wrap text-justify text-lg italic shadow-inner">
                          {selectedLead.aiSummary || "Aguardando conclusão de entrevista para consolidação de fatos."}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="entrevistas" className="space-y-8">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-10 rounded-[2rem] border-2 border-dashed border-primary/20 bg-primary/5 mb-6 text-center space-y-6">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">ESCOLHA A MATRIZ PARA INICIAR A CAPTURA DE DADOS:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates?.map((t) => (
                              <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/30 text-primary font-black uppercase text-[11px] h-16 gap-4 hover:bg-primary hover:text-background transition-all tracking-[0.2em] shadow-lg">
                                <Zap className="h-5 w-5" /> {t.title}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-6">HISTÓRICO DE ATOS CAPTURADOS</h4>
                        {leadInterviews && leadInterviews.length > 0 ? (
                          leadInterviews.map((int) => (
                            <div key={int.id} className="p-8 rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                              <div className="space-y-2">
                                <p className="text-sm font-black text-white uppercase tracking-tight">{int.interviewType}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">POR: {int.interviewerName?.toUpperCase()} • {new Date(int.createdAt.toDate()).toLocaleDateString()}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-full transition-all"><ChevronRight className="h-6 w-6" /></Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center opacity-20">
                            <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-[11px] font-black uppercase tracking-[0.5em]">NENHUMA ENTREVISTA PROTOCOLADA.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="burocracia" className="space-y-8">
                      <BurocraciaView lead={selectedLead} interviews={leadInterviews || []} />
                    </TabsContent>

                    <TabsContent value="gestao" className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="glass border-primary/20 p-10 space-y-8 rounded-[2rem] shadow-2xl">
                          <div><h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">EDITAR FICHA DO LEAD</h4><p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Retificar dados cadastrais e de agendamento.</p></div>
                          <Button onClick={() => setIsEditModeOpen(true)} variant="outline" className="w-full h-16 border-primary/30 text-primary hover:bg-primary hover:text-background font-black uppercase text-[11px] tracking-[0.3em] gap-3 rounded-xl shadow-lg transition-all">
                            <UserCog className="h-5 w-5" /> ATUALIZAR CADASTRO
                          </Button>
                        </Card>
                        <Card className="glass border-rose-500/20 p-10 space-y-8 rounded-[2rem] shadow-2xl">
                          <div><h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">ARQUIVAR LEAD</h4><p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Mover para acervo passivo (Desistência/Risco).</p></div>
                          <Button variant="outline" className="w-full h-16 border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-xl transition-all">ENCERRAR ATENDIMENTO</Button>
                        </Card>
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
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1000px] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
          {executingTemplate && (
            <DynamicInterviewExecution 
              template={executingTemplate} 
              onSubmit={handleFinishInterview}
              onCancel={() => { setIsInterviewDialogOpen(false); setExecutingTemplate(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <SheetContent className={cn("w-full min-h-0 overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]", getDrawerWidthClass())}>
          <div className="p-8 border-b border-white/5"><SheetHeader><SheetTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Novo Lead RGMJ</SheetTitle></SheetHeader></div>
          <LeadForm 
            existingLeads={leads} 
            onSubmit={handleCreateEntry} 
            onSelectExisting={(l) => { handleOpenLead(l); setIsNewEntryOpen(false); }} 
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
              onSubmit={handleUpdateLead}
              onSelectExisting={() => {}}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
