
"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  UserPlus, 
  FileText,
  Loader2,
  Users,
  ChevronRight,
  LayoutGrid,
  List,
  MoreVertical,
  Edit3,
  Trash2,
  UserX,
  Scale,
  Calendar,
  Wallet,
  Zap,
  Plus,
  ArrowLeft,
  Briefcase,
  History,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  DollarSign,
  TrendingUp,
  Gavel,
  AlertCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClientForm } from "@/components/clients/client-form"
import { ProcessForm } from "@/components/cases/process-form"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addMonths, format, parseISO } from "date-fns"
import { Progress } from "@/components/ui/progress"

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [selectedClientDossier, setSelectedClientDossier] = useState<any>(null)
  const [activeDossierTab, setActiveDossierTab] = useState("overview")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const [isNewProcessOpen, setIsNewProcessOpen] = useState(false)
  const [isNewFinancialOpen, setIsNewFinancialOpen] = useState(false)

  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const clientsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db!, "clients"), 
      orderBy("name", "asc")
    )
  }, [db, user])

  const { data: clientsData, isLoading } = useCollection(clientsQuery)

  const filteredClients = useMemo(() => {
    if (!clientsData) return []
    return clientsData.filter(client => {
      const isActive = !client.status || client.status === "Ativo"
      const matchesSearch = 
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.documentNumber?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      return isActive && matchesSearch
    })
  }, [clientsData, searchTerm])

  const clientProcessesQuery = useMemoFirebase(() => {
    if (!db || !selectedClientDossier) return null
    return query(collection(db, "processes"), where("clientId", "==", selectedClientDossier.id))
  }, [db, selectedClientDossier])
  const { data: clientProcesses } = useCollection(clientProcessesQuery)

  const clientAgendaQuery = useMemoFirebase(() => {
    if (!db || !selectedClientDossier) return null
    return query(collection(db, "appointments"), where("clientId", "==", selectedClientDossier.id))
  }, [db, selectedClientDossier])
  const { data: clientAgenda } = useCollection(clientAgendaQuery)
  const clientHearingsQuery = useMemoFirebase(() => {
    if (!db || !selectedClientDossier) return null
    return query(collection(db, "hearings"), where("clientId", "==", selectedClientDossier.id))
  }, [db, selectedClientDossier])
  const { data: clientHearings } = useCollection(clientHearingsQuery)

  const clientDeadlinesQuery = useMemoFirebase(() => {
    if (!db || !selectedClientDossier) return null
    return query(collection(db, "deadlines"), where("clientId", "==", selectedClientDossier.id))
  }, [db, selectedClientDossier])
  const { data: clientDeadlines } = useCollection(clientDeadlinesQuery)

  const combinedClientAgenda = useMemo(() => {
    const a = (clientAgenda || []).map(x => ({ ...x, eventType: 'atendimento' }))
    const h = (clientHearings || []).map(x => ({ ...x, eventType: x.isFreelance ? 'freelance' : 'audiencia' }))
    const d = (clientDeadlines || []).map(x => ({ ...x, eventType: 'prazo' }))

    return [...a, ...h, ...d].sort((x, y) => {
      const dx = new Date(x.startDateTime || x.dueDate || 0).getTime()
      const dy = new Date(y.startDateTime || y.dueDate || 0).getTime()
      return dy - dx
    })
  }, [clientAgenda, clientHearings, clientDeadlines])

  const clientFinancialQuery = useMemoFirebase(() => {
    if (!db || !selectedClientDossier) return null
    return query(collection(db, "financial_titles"), where("clientId", "==", selectedClientDossier.id), orderBy("dueDate", "desc"))
  }, [db, selectedClientDossier])
  const { data: clientTransactions } = useCollection(clientFinancialQuery)

  const financialStats = useMemo(() => {
    if (!clientTransactions) return { totalHonorarios: 0, totalPendente: 0, totalDespesas: 0, totalAcordos: 0 }
    
    let honorarios = 0
    let pendente = 0
    let despesas = 0
    let acordos = 0

    clientTransactions.forEach(t => {
      const val = Number(t.value) || 0
      if (t.type?.includes('Entrada')) {
        if (t.category?.includes('Honorários')) honorarios += val
        if (t.category?.includes('Acordo')) acordos += val
        if (t.status === 'Pendente') pendente += val
      } else {
        despesas += val
      }
    })

    return { totalHonorarios: honorarios, totalPendente: pendente, totalDespesas: despesas, totalAcordos: acordos }
  }, [clientTransactions])

  const calculateCompletion = (client: any) => {
    const fields = [
      client.name,
      client.documentNumber,
      client.email,
      client.phone,
      client.registrationData?.address,
      client.registrationData?.civilStatus,
      client.registrationData?.profession
    ]
    const filled = fields.filter(f => !!f && f !== "").length
    return Math.round((filled / fields.length) * 100)
  }

  const handleOpenCreate = () => {
    setEditingClient(null)
    setIsSheetOpen(true)
  }

  const handleOpenEdit = (client: any) => {
    setEditingClient(client)
    setIsSheetOpen(true)
  }

  const handleOpenDossier = (client: any) => {
    setSelectedClientDossier(client)
    setActiveDossierTab("overview")
  }

  const handleInactivateClient = (id: string) => {
    if (!db || !confirm("Deseja inativar este cliente? Ele será movido para o arquivo digital.")) return
    updateDocumentNonBlocking(doc(db!, "clients", id), {
      status: "Inativo",
      updatedAt: serverTimestamp()
    })
    toast({ title: "Cliente Inativado", description: "O registro foi movido para a base passiva." })
  }

  const handleSaveClient = async (data: any) => {
    if (!user || !db) return
    const fullName = data.firstName || data.name || ""
    const clientPayload: any = {
      name: fullName.toUpperCase(),
      documentNumber: data.cpf || data.documentNumber || "",
      email: data.email || "",
      phone: data.phone || "",
      type: data.personType === 'Pessoa Jurídica' ? 'corporate' : 'individual',
      status: "Ativo",
      registrationData: data,
      updatedAt: serverTimestamp(),
    }

    // Preservar Drive IDs se vierem do Lead
    if (data.driveFolderId) clientPayload.driveFolderId = data.driveFolderId
    if (data.driveFolderUrl) clientPayload.driveFolderUrl = data.driveFolderUrl
    if (data.leadId) clientPayload.leadId = data.leadId

    if (editingClient) {
      updateDocumentNonBlocking(doc(db!, "clients", editingClient.id), clientPayload)
      toast({ title: "Ficha Atualizada" })
    } else {
      const clientRef = doc(collection(db!, "clients"))
      const clientDocId = clientRef.id
      clientPayload.id = clientDocId
      
      setDocumentNonBlocking(clientRef, {
        ...clientPayload,
        createdAt: serverTimestamp(),
      }, { merge: true })

      // Se veio de um Lead, atualizar o Lead
      if (data.leadId) {
        updateDocumentNonBlocking(doc(db!, "leads", data.leadId), {
          status: 'distribuído',
          clientId: clientDocId,
          updatedAt: serverTimestamp()
        })
      }

      toast({ title: "Cliente Cadastrado" })
    }
    setIsSheetOpen(false)
  }

  const handleSaveFinancial = (data: any) => {
    if (!user || !db || !selectedClientDossier) return

    const iterations = data.isRecurring ? (data.recurrenceMonths || 1) : 1
    const baseDueDate = parseISO(data.dueDate)

    for (let i = 0; i < iterations; i++) {
      const currentDueDate = addMonths(baseDueDate, i)
      const formattedDueDate = format(currentDueDate, 'yyyy-MM-dd')
      
      const newTitle = {
        ...data,
        clientId: selectedClientDossier.id,
        clientName: selectedClientDossier.name,
        dueDate: formattedDueDate,
        value: data.numericValue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      
      delete newTitle.numericValue
      delete newTitle.recurrenceMonths

      addDocumentNonBlocking(collection(db!, "financial_titles"), newTitle)
    }

    setIsNewFinancialOpen(false)
    toast({ title: "Lançamento Registrado" })
  }

  const handleDeleteClient = (id: string) => {
    if (!db || !confirm("Deseja remover este cliente permanentemente?")) return
    deleteDocumentNonBlocking(doc(db!, "clients", id))
    toast({ variant: "destructive", title: "Cliente Removido" })
  }

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

  if (selectedClientDossier) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 font-sans">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 border-b border-gold-200/10 pb-10">
          <div className="flex items-center gap-8">
            <Button variant="ghost" onClick={() => setSelectedClientDossier(null)} className="h-14 w-14 rounded-2xl text-gold-100 bg-gold-200/5 border border-gold-200/10 hover:bg-gold-200/20 transition-all group">
              <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-secondary border border-gold-200/10 flex items-center justify-center text-gold-100 text-3xl font-black shadow-2xl">
                {selectedClientDossier.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{selectedClientDossier.name}</h1>
                  <Badge variant="outline" className="text-[10px] font-black border-gold-100/30 text-gold-100 px-4 h-7 rounded-full bg-gold-200/5">DOSSIÊ 360º</Badge>
                </div>
                <div className="flex items-center gap-4 text-gold-100/40 text-[11px] font-bold uppercase tracking-widest">
                   <span>ID: {selectedClientDossier.documentNumber}</span>
                   <span className="w-1 h-1 rounded-full bg-gold-100/20" />
                   <span>INÍCIO: {selectedClientDossier.createdAt?.toDate ? new Date(selectedClientDossier.createdAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                   <span className="w-1 h-1 rounded-full bg-gold-100/20" />
                   <span className="text-emerald-500">{calculateCompletion(selectedClientDossier)}% COMPLETO</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full lg:w-48">
             <div className="flex justify-between text-[8px] font-black text-gold-100/40 uppercase tracking-widest">
                <span>Integridade da Ficha</span>
                <span>{calculateCompletion(selectedClientDossier)}%</span>
             </div>
             <Progress value={calculateCompletion(selectedClientDossier)} className="h-1.5 bg-white/5" />
          </div>
          
          <div className="grid grid-cols-3 gap-6 w-full lg:w-auto">
             <div className="px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                <p className="text-xl font-black text-white tabular-nums">{clientProcesses?.length || 0}</p>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Dossiês</p>
             </div>
             <div className="px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                <p className="text-xl font-black text-emerald-500 tabular-nums">{combinedClientAgenda.length || 0}</p>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Eventos</p>
             </div>
             <div className="px-6 py-4 bg-gold-200/5 border border-gold-200/10 rounded-2xl text-center">
                <p className="text-xl font-black text-gold-100 tabular-nums">R$ {financialStats.totalHonorarios.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                <p className="text-[9px] font-bold text-gold-100/40 uppercase tracking-widest mt-1">Saldo</p>
             </div>
          </div>

          <div className="flex gap-4 w-full lg:w-auto">
            <Button onClick={() => handleOpenEdit(selectedClientDossier)} variant="outline" className="flex-1 lg:flex-none glass border-white/10 text-[10px] font-black uppercase tracking-widest h-12 px-8 rounded-xl gap-2 hover:bg-gold-200/5 hover:border-gold-200/30 transition-all">
              <Edit3 className="h-4 w-4 text-gold-100" /> Editar
            </Button>
            <Button onClick={() => setIsNewProcessOpen(true)} className="flex-1 lg:flex-none gold-gradient text-background font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-xl shadow-xl hover:scale-105 transition-all">
              <Plus className="h-4 w-4" /> Novo Ativo
            </Button>
          </div>
        </div>

        <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="space-y-8">
          <TabsList className="bg-transparent border-b border-white/5 h-12 p-0 gap-8 w-full justify-start rounded-none">
            <TabsTrigger value="overview" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all">VISÃO GERAL</TabsTrigger>
            <TabsTrigger value="processos" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all">PROCESSOS ({clientProcesses?.length || 0})</TabsTrigger>
            <TabsTrigger value="financeiro" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all">FINANCEIRO</TabsTrigger>
            <TabsTrigger value="agenda" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all">AGENDA & ATOS</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass border-white/5 p-6 space-y-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Users className="h-5 w-5" /></div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Informações de Contato</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">WhatsApp / Celular</p>
                    <p className="text-sm font-bold text-white uppercase">{selectedClientDossier.phone || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">E-mail</p>
                    <p className="text-sm font-bold text-white lowercase">{selectedClientDossier.email || "Não informado"}</p>
                  </div>
                </div>
              </Card>

              <Card className="glass border-white/5 p-6 space-y-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Briefcase className="h-5 w-5" /></div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Resumo Processual</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-xl font-black text-white">{clientProcesses?.length || 0}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Dossiês Ativos</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-xl font-black text-emerald-500">{clientAgenda?.length || 0}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Atos Agendados</p>
                  </div>
                </div>
              </Card>

              <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-6 space-y-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4 border-b border-emerald-500/10 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500"><Wallet className="h-5 w-5" /></div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Painel Financeiro</h3>
                </div>
                <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest leading-relaxed">Consulte repasses e honorários vinculados ao CPF deste cliente na Central Financeira.</p>
                <Button onClick={() => setActiveDossierTab("financeiro")} variant="outline" className="w-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest">
                  Acessar Carteira <ChevronRight className="h-3 w-3 ml-2" />
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass border-primary/20 p-5 rounded-2xl">
                <p className="text-[9px] font-black text-primary uppercase mb-2 flex items-center gap-2"><Scale className="h-3 w-3" /> Honorários Totais</p>
                <p className="text-xl font-black text-white tabular-nums">R$ {financialStats.totalHonorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </Card>
              <Card className="glass border-rose-500/20 p-5 rounded-2xl">
                <p className="text-[9px] font-black text-rose-500 uppercase mb-2 flex items-center gap-2"><AlertCircle className="h-3 w-3" /> Saldo Pendente</p>
                <p className="text-xl font-black text-rose-400 tabular-nums">R$ {financialStats.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </Card>
              <Card className="glass border-emerald-500/20 p-5 rounded-2xl">
                <p className="text-[9px] font-black text-emerald-500 uppercase mb-2 flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Verba de Acordos</p>
                <p className="text-xl font-black text-white tabular-nums">R$ {financialStats.totalAcordos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </Card>
              <Card className="glass border-white/5 p-5 rounded-2xl">
                <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 flex items-center gap-2"><Calculator className="h-3 w-3" /> Despesas Totais</p>
                <p className="text-xl font-black text-white tabular-nums">R$ {financialStats.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </Card>
            </div>

            <Card className="glass border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Extrato Financeiro do Cliente</h3>
                <Button onClick={() => setIsNewFinancialOpen(true)} className="h-9 px-5 gold-gradient text-background font-black text-[9px] uppercase tracking-widest gap-2 rounded-lg">
                  <Plus className="h-3.5 w-3.5" /> Lançar Valor
                </Button>
              </div>
              <div className="divide-y divide-white/5">
                {clientTransactions && clientTransactions.length > 0 ? (
                  clientTransactions.map(t => (
                    <div key={t.id} className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border",
                          t.type?.includes("Saída") ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        )}>
                          {t.type?.includes("Saída") ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-tight">{t.description}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-[8px] border-white/10 text-muted-foreground uppercase">{t.category}</Badge>
                            <span className="text-[9px] text-muted-foreground font-mono">VENC: {t.dueDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-base font-black tabular-nums", t.type?.includes("Saída") ? "text-rose-400" : "text-emerald-400")}>
                          {t.type?.includes("Saída") ? "-" : "+"} R$ {(Number(t.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <Badge className={cn(
                          "text-[8px] font-black uppercase mt-1",
                          t.status === 'Pago' || t.status === 'Recebido' ? "bg-emerald-500/10 text-emerald-500 border-0" : "bg-amber-500/10 text-amber-500 border-0"
                        )}>
                          {t.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center opacity-30 space-y-4">
                    <Wallet className="h-12 w-12 mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma transação registrada</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="processos">
            {clientProcesses && clientProcesses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {clientProcesses.map(proc => (
                  <Link key={proc.id} href={`/cases?search=${proc.processNumber}`} className="block group">
                    <Card className="glass border-white/5 p-8 hover:border-primary/30 transition-all rounded-[2rem] shadow-xl bg-white/[0.02] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-all group-hover:scale-110">
                        <Scale className="h-16 w-16" />
                      </div>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary uppercase px-3 h-6">{proc.caseType}</Badge>
                            <span className="text-xs font-mono font-bold text-white/40 tracking-tighter">{proc.processNumber}</span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">{proc.description}</h4>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
                            {proc.court} • {proc.vara}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-white/5">
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Parte Contrária</p>
                            <p className="text-[11px] font-bold text-white uppercase truncate">{proc.defendantName || "---"}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Valor da Causa</p>
                            <p className="text-[11px] font-black text-emerald-500 tabular-nums">R$ {proc.value || "0,00"}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Responsável</p>
                            <p className="text-[11px] font-bold text-white/60 uppercase truncate">{proc.responsibleStaffName || "RGMJ"}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black uppercase h-5">ATIVO</Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center space-y-6 glass border-dashed border-2 border-white/5 opacity-30 rounded-[2rem]">
                <Scale className="h-16 w-16 text-muted-foreground" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">Nenhum processo vinculado</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="agenda">
            {combinedClientAgenda.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {combinedClientAgenda.map(event => (
                  <Card key={event.id} className={cn(
                    "glass border-white/5 p-6 space-y-4 rounded-2xl shadow-lg hover:border-primary/20 transition-all",
                    event.status === 'Realizado' && "opacity-60 bg-white/[0.01]"
                  )}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Badge className={cn(
                          "bg-amber-500/10 text-amber-500 border-0 text-[10px] font-black uppercase",
                          event.eventType === 'audiencia' && "bg-rose-500/10 text-rose-500",
                          event.eventType === 'prazo' && "bg-primary/10 text-primary",
                          event.eventType === 'freelance' && "bg-cyan-500/10 text-cyan-400"
                        )}>
                          {event.eventType}
                        </Badge>
                        {event.status === 'Realizado' && (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px] font-black uppercase flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3" /> REALIZADO
                          </Badge>
                        )}
                        {event.status !== 'Realizado' && new Date(event.startDateTime || event.dueDate) < new Date() && (
                          <Badge className="bg-rose-500/10 text-rose-500 border-0 text-[10px] font-black uppercase">PENDENTE / ATRASADO</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-white uppercase">{event.startDateTime || event.dueDate ? new Date(event.startDateTime || event.dueDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{event.startDateTime ? new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-white uppercase tracking-tight">{event.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{event.notes || event.description || "Nenhuma nota tática."}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-[10px] text-muted-foreground font-bold uppercase border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> {event.location || "Local não informado"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary" /> Criado em {event.createdAt?.toDate ? new Date(event.createdAt.toDate()).toLocaleDateString() : '---'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center space-y-6 glass border-dashed border-2 border-white/5 opacity-30 rounded-[2rem]">
                <Calendar className="h-16 w-16 text-muted-foreground" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">Agenda limpa para este cliente</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Sheet open={isNewProcessOpen} onOpenChange={setIsNewProcessOpen}>
          <SheetContent className="flex flex-col h-full glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl sm:max-w-4xl">
            <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none">
              <SheetHeader>
                <SheetTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Vincular Processo</SheetTitle>
                <SheetDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Novo dossiê estratégico para {selectedClientDossier.name}.</SheetDescription>
              </SheetHeader>
            </div>
            <ProcessForm 
              initialData={{ clientId: selectedClientDossier.id, clientName: selectedClientDossier.name }}
              onSubmit={(data) => {
                addDocumentNonBlocking(collection(db!, "processes"), { ...data, status: "Em Andamento", createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
                setIsNewProcessOpen(false)
                toast({ title: "Processo Vinculado" })
              }}
              onCancel={() => setIsNewProcessOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <Dialog open={isNewFinancialOpen} onOpenChange={setIsNewFinancialOpen}>
          <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[700px] p-0 overflow-hidden shadow-2xl font-sans rounded-2xl">
            <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
              <DialogHeader>
                <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Novo Lançamento RGMJ</DialogTitle>
                <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Registro de crédito ou débito para {selectedClientDossier.name}.</DialogDescription>
              </DialogHeader>
            </div>
            <div className="px-10 py-8 bg-[#0a0f1e]/50">
              <FinancialTitleForm onSubmit={handleSaveFinancial} onCancel={() => setIsNewFinancialOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-gold-200/10 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gold-100/40">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-gold-100 transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">Base de Clientes</span>
          </div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">
            CLIENTES <span className="text-gradient-gold">ATIVOS</span>
          </h1>
          <p className="text-gold-100/40 uppercase tracking-[0.3em] text-[10px] font-bold">Gestão Estratégica RGMJ</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center bg-white/5 p-1.5 rounded-xl border border-white/5 shadow-2xl backdrop-blur-md">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewMode('grid')} 
              className={cn("h-10 w-10 rounded-lg transition-all", viewMode === 'grid' ? "bg-gold-200/10 text-gold-100 border border-gold-200/20" : "text-white/20 hover:text-white")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewMode('list')} 
              className={cn("h-10 w-10 rounded-lg transition-all", viewMode === 'list' ? "bg-gold-200/10 text-gold-100 border border-gold-200/20" : "text-white/20 hover:text-white")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-100/30" />
            <Input 
              placeholder="Pesquisar por nome ou CPF..." 
              className="pl-12 glass border-white/10 h-12 text-xs text-white focus:ring-gold-100/50 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleOpenCreate}
            className="w-full sm:w-auto gold-gradient text-background font-black gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-xl shadow-xl hover:scale-105 transition-all"
          >
            <UserPlus className="h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Base RGMJ...</span>
        </div>
      ) : filteredClients.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredClients.map((client, i) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                >
                  <Card 
                    className="bg-card/40 backdrop-blur-xl border-white/5 hover-gold transition-all duration-500 group relative overflow-hidden flex flex-col shadow-2xl cursor-pointer rounded-3xl"
                    onClick={() => handleOpenDossier(client)}
                  >
                    <CardContent className="p-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 items-center min-w-0">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-secondary border border-white/10 flex items-center justify-center text-gold-100 font-black text-xl shadow-2xl shrink-0 group-hover:border-gold-200/40 transition-colors">
                              {client.name?.charAt(0).toUpperCase()}
                            </div>
                            {calculateCompletion(client) < 100 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-white/10 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight truncate group-hover:text-gold-100 transition-colors">{client.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[8px] border-white/10 text-white/40 uppercase px-2 h-5 font-bold tracking-widest">{client.type === 'corporate' ? 'PJ' : 'PF'}</Badge>
                              <p className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-tighter">{calculateCompletion(client)}% preenchido</p>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-white/20 hover:text-white shrink-0 hover:bg-white/5 rounded-xl">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0d121f] border-gold-200/10 text-white rounded-xl shadow-2xl p-2">
                            <DropdownMenuItem onClick={() => handleOpenDossier(client)} className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-gold-200/10 rounded-lg">
                              <History className="h-4 w-4 text-gold-100" /> Dossiê Completo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(client)} className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-gold-200/10 rounded-lg">
                              <Edit3 className="h-4 w-4 text-gold-100" /> Ver Ficha Técnica
                            </DropdownMenuItem>
                            <div className="h-px bg-white/5 my-2" />
                            <DropdownMenuItem onClick={() => handleInactivateClient(client.id)} className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer text-amber-500 hover:bg-amber-500/5 rounded-lg">
                              <UserX className="h-4 w-4" /> Inativar Cliente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }} className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer text-rose-500 hover:bg-rose-500/5 rounded-lg">
                              <Trash2 className="h-4 w-4" /> Excluir Definitivamente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex gap-4 items-center">
                         <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex flex-col items-center">
                            <span className="text-gold-100 text-sm font-black">---</span>
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Processos</span>
                         </div>
                         <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex flex-col items-center">
                            <span className="text-emerald-500 text-sm font-black">---</span>
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Ativos</span>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[9px] font-black text-white/30 group-hover:text-gold-100 transition-colors uppercase tracking-[0.3em]">
                          <Zap className="h-4 w-4" /> ABRIR DOSSIÊ 360º
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-gold-100 transition-all group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="glass border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 gap-4 p-5 bg-white/[0.03] border-b border-white/5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
              <div className="col-span-4">Cliente / Nome Completo</div>
              <div className="col-span-2">CPF / CNPJ</div>
              <div className="col-span-3">Contato Principal</div>
              <div className="col-span-2">Área / Tipo</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>
            <div className="divide-y divide-white/5">
              {filteredClients.map((client) => (
                <div 
                  key={client.id} 
                  onClick={() => handleOpenDossier(client)}
                  className="grid grid-cols-12 gap-4 p-5 hover:bg-white/[0.02] transition-all items-center cursor-pointer group"
                >
                  <div className="col-span-4">
                    <h4 className="text-sm font-bold text-white uppercase group-hover:text-primary transition-colors">{client.name}</h4>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">{client.documentNumber}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-xs font-medium text-white/60">{client.email || client.phone || 'sem contato'}</span>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-[8px] border-white/10 text-muted-foreground uppercase">{client.type === 'corporate' ? 'PJ' : 'PF'}</Badge>
                  </div>
                  <div className="col-span-1 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0d121f] border-white/10 text-white">
                        <DropdownMenuItem onClick={() => handleOpenDossier(client)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer">
                          <History className="h-4 w-4" /> Dossiê Completo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(client)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer">
                          <Edit3 className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="py-32 flex flex-col items-center justify-center space-y-6 glass rounded-[2rem] border-dashed border-2 border-white/5 opacity-20">
          <Users className="h-16 w-16 text-muted-foreground" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Nenhum cliente ativo no radar</p>
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className={cn("glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl flex flex-col h-full", getDrawerWidthClass())}>
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none">
            <SheetHeader>
              <SheetTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingClient ? "Ficha do Cliente" : "Novo Cliente"}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                {editingClient ? "Dossiê cadastral oficial RGMJ." : "Cadastro estruturado na base de inteligência."}
              </SheetDescription>
            </SheetHeader>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ClientForm 
              initialData={editingClient?.registrationData || editingClient}
              onSubmit={handleSaveClient}
              onCancel={() => setIsSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
