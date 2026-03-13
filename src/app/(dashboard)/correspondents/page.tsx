
"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  Loader2, 
  Handshake, 
  UserPlus, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  ChevronRight,
  Filter,
  Users,
  Users2,
  Building2,
  Scale,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  useFirestore, 
  useCollection, 
  useUser, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FreelancerForm } from "@/components/correspondents/freelancer-form"
import { CounterpartyForm } from "@/components/correspondents/counterparty-form"
import { FreelanceDiligenceForm } from "@/components/correspondents/freelance-diligence-form"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function CorrespondentsModule() {
  const [activeTab, setActiveTab] = useState("diligencias")
  const [searchTerm, setSearchTerm] = useState("")
  
  const [isFreelancerOpen, setIsFreelancerOpen] = useState(false)
  const [isCounterpartyOpen, setIsCounterpartyOpen] = useState(false)
  const [isDiligenceOpen, setIsDiligenceOpen] = useState(false)
  
  const [editingItem, setEditingItem] = useState<any>(null)

  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  // Queries estratégicas
  const freelancersQuery = useMemoFirebase(() => db ? query(collection(db, "freelancers"), orderBy("name", "asc")) : null, [db])
  const { data: freelancers, isLoading: loadingFreelancers } = useCollection(freelancersQuery)

  const counterpartiesQuery = useMemoFirebase(() => db ? query(collection(db, "counterparties"), orderBy("name", "asc")) : null, [db])
  const { data: counterparties, isLoading: loadingCounterparties } = useCollection(counterpartiesQuery)

  const diligencesQuery = useMemoFirebase(() => db ? query(collection(db, "freelance_diligences"), orderBy("createdAt", "desc")) : null, [db])
  const { data: diligences, isLoading: loadingDiligences } = useCollection(diligencesQuery)

  const stats = useMemo(() => {
    if (!diligences) return { total: 0, pending: 0, revenue: 0, cost: 0, margin: 0 }
    const total = diligences.length
    const pending = diligences.filter(d => d.status !== 'Faturada' && d.status !== 'Cancelada').length
    const revenue = diligences.reduce((acc, d) => acc + (Number(d.valueToCharge) || 0), 0)
    const cost = diligences.reduce((acc, d) => acc + (Number(d.valueToPay) || 0) + (Number(d.extraExpenses) || 0), 0)
    const margin = revenue - cost
    return { total, pending, revenue, cost, margin }
  }, [diligences])

  const filteredDiligences = useMemo(() => {
    if (!diligences) return []
    return diligences.filter(d => 
      d.freelancerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.processNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [diligences, searchTerm])

  const handleSaveFreelancer = async (data: any) => {
    if (!db) return
    if (editingItem) {
      updateDocumentNonBlocking(doc(db, "freelancers", editingItem.id), { ...data, updatedAt: serverTimestamp() })
      toast({ title: "Freelancer Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db, "freelancers"), { ...data, createdAt: serverTimestamp(), isActive: true })
      toast({ title: "Freelancer Cadastrado" })
    }
    setIsFreelancerOpen(false)
    setEditingItem(null)
  }

  const handleSaveCounterparty = async (data: any) => {
    if (!db) return
    if (editingItem) {
      updateDocumentNonBlocking(doc(db, "counterparties", editingItem.id), { ...data, updatedAt: serverTimestamp() })
      toast({ title: "Entidade Atualizada" })
    } else {
      addDocumentNonBlocking(collection(db, "counterparties"), { ...data, createdAt: serverTimestamp() })
      toast({ title: "Entidade Cadastrada" })
    }
    setIsCounterpartyOpen(false)
    setEditingItem(null)
  }

  const handleSaveDiligence = async (data: any) => {
    if (!db) return
    const payload = {
      ...data,
      updatedAt: serverTimestamp()
    }

    if (editingItem) {
      updateDocumentNonBlocking(doc(db, "freelance_diligences", editingItem.id), payload)
      toast({ title: "Diligência Atualizada" })
    } else {
      addDocumentNonBlocking(collection(db, "freelance_diligences"), { ...payload, createdAt: serverTimestamp(), financialSynced: false })
      toast({ title: "Diligência Registrada" })
    }

    // Lógica Financeira Integrada: Se marcada como 'Faturada' e ainda não sincronizada
    if (data.status === 'Faturada' && !editingItem?.financialSynced) {
      // 1. Título de Saída (Pagar ao Freelancer)
      addDocumentNonBlocking(collection(db, "financial_titles"), {
        description: `PAGTO CORRESPONDENTE: ${data.freelancerName} - ${data.type}`,
        type: "Saída (Despesa)",
        category: "Diligência Terceirizada",
        value: Number(data.valueToPay) + (Number(data.extraExpenses) || 0),
        dueDate: data.serviceDate || format(new Date(), 'yyyy-MM-dd'),
        status: "Pendente",
        entityName: data.freelancerName,
        destinationBank: data.freelancerPix || "PIX FREELANCER",
        originBank: "CONTA RGMJ",
        createdAt: serverTimestamp()
      })

      // 2. Título de Entrada (Receber do Solicitante)
      addDocumentNonBlocking(collection(db, "financial_titles"), {
        description: `REPASSE DILIGÊNCIA: ${data.solicitorName} - ${data.type}`,
        type: "Entrada (Receita)",
        category: "Diligência / Atos",
        value: Number(data.valueToCharge),
        dueDate: data.serviceDate || format(new Date(), 'yyyy-MM-dd'),
        status: "Pendente",
        clientName: data.solicitorName,
        processNumber: data.processNumber,
        createdAt: serverTimestamp()
      })
      
      // Marcar rito como sincronizado para evitar duplicidade
      if (editingItem) {
        updateDocumentNonBlocking(doc(db, "freelance_diligences", editingItem.id), { financialSynced: true })
      } else {
        // Para novos, o sincronismo já ocorreu na injeção acima (mas para simplificar, o faturar costuma ser edição)
      }
    }

    setIsDiligenceOpen(false)
    setEditingItem(null)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Handshake className="h-3 w-3" />
            <span>Módulo de Parcerias</span>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">Correspondentes Jurídicos</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Gestão Freelance</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-60">
            CONTROLE DE ATOS EXTERNOS, PREÇOS E REPASSES BANCÁRIOS.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrar diligência, cidade..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => { setEditingItem(null); setIsDiligenceOpen(true); }}
            className="gold-gradient text-background font-black gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-xl shadow-xl"
          >
            <Plus className="h-4 w-4" /> NOVA ORDEM
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="glass border-primary/20 bg-primary/5 p-6 rounded-2xl flex flex-col justify-center shadow-lg">
          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
            <Briefcase className="h-3 w-3" /> Atos Processados
          </p>
          <div className="text-3xl font-black text-white">{stats.total}</div>
        </Card>
        <Card className="glass border-white/5 p-6 rounded-2xl flex flex-col justify-center">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
            <Clock className="h-3 w-3" /> Em Aberto
          </p>
          <div className="text-3xl font-black text-white">{stats.pending}</div>
        </Card>
        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-6 rounded-2xl flex flex-col justify-center">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <ArrowUpRight className="h-3 w-3" /> Faturamento Bruto
          </p>
          <div className="text-3xl font-black text-white tabular-nums">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-rose-500/20 bg-rose-500/5 p-6 rounded-2xl flex flex-col justify-center">
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <ArrowDownRight className="h-3 w-3" /> Custos Externos
          </p>
          <div className="text-3xl font-black text-white tabular-nums">R$ {stats.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-blue-500/20 bg-blue-500/5 p-6 rounded-2xl flex flex-col justify-center">
          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Wallet className="h-3 w-3" /> Margem RGMJ
          </p>
          <div className="text-3xl font-black text-white tabular-nums">R$ {stats.margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/5 h-14 p-1.5 gap-1.5 w-full justify-start rounded-2xl overflow-x-auto scrollbar-hide">
          <TabsTrigger value="diligencias" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl transition-all tracking-widest">
            <Scale className="h-4 w-4 mr-2" /> Diligências em Curso
          </TabsTrigger>
          <TabsTrigger value="freelancers" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl transition-all tracking-widest">
            <Users2 className="h-4 w-4 mr-2" /> Banco de Talentos
          </TabsTrigger>
          <TabsTrigger value="entidades" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl transition-all tracking-widest">
            <Building2 className="h-4 w-4 mr-2" /> Solicitantes
          </TabsTrigger>
        </TabsList>

        <div className="min-h-[500px]">
          <TabsContent value="diligencias" className="m-0 p-0 animate-in fade-in slide-in-from-left-4 duration-500">
            <Card className="glass border-white/5 overflow-hidden rounded-3xl">
              {loadingDiligences ? (
                <div className="py-32 flex flex-col items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : filteredDiligences.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {filteredDiligences.map((d) => (
                    <div 
                      key={d.id} 
                      className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors group cursor-pointer" 
                      onClick={() => { setEditingItem(d); setIsDiligenceOpen(true); }}
                    >
                      <div className="flex items-center gap-8">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-primary shadow-xl group-hover:scale-110 transition-transform">
                          <FileText className="h-7 w-7" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-white uppercase text-lg tracking-tight leading-none">{d.type} • {d.city}</h4>
                            <Badge className={cn(
                              "text-[9px] font-black uppercase h-6 px-3 border-0",
                              d.status === 'Faturada' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                              {d.status}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-3 opacity-60">
                            <span>PROFISSIONAL: {d.freelancerName}</span>
                            <span>•</span>
                            <span>DATA: {d.serviceDate}</span>
                            {d.processNumber && <span>• CNJ: {d.processNumber}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Fluxo de Caixa (OS)</p>
                          <div className="flex items-center gap-6">
                            <div className="text-sm font-bold text-rose-400">-{ (Number(d.valueToPay) + (Number(d.extraExpenses) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }</div>
                            <div className="text-sm font-black text-emerald-400">+ { Number(d.valueToCharge).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }</div>
                          </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-48 flex flex-col items-center justify-center opacity-20 gap-6">
                  <Scale className="h-20 w-20" />
                  <p className="text-xs font-black uppercase tracking-[0.5em]">Nenhuma ordem de serviço ativa</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="freelancers" className="m-0 p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button 
                onClick={handleOpenCreateFreelancer}
                className="h-full min-h-[200px] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="h-7 w-7 text-primary" />
                </div>
                <span className="text-[11px] font-black text-white uppercase tracking-widest">Novo Freelancer</span>
              </button>
              
              {loadingFreelancers ? (
                <div className="col-span-2 py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : freelancers?.map(f => (
                <Card 
                  key={f.id} 
                  className="glass border-white/5 hover:border-primary/30 transition-all p-8 rounded-3xl shadow-2xl group cursor-pointer relative overflow-hidden" 
                  onClick={() => { setEditingItem(f); setIsFreelancerOpen(true); }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                      <Users className="h-7 w-7" />
                    </div>
                    <Badge className={f.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}>
                      {f.isActive ? "ATIVO" : "INATIVO"}
                    </Badge>
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight mb-2">{f.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                    <MapPin className="h-3.5 w-3.5" /> {f.city} / {f.state}
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">Audiência (Ref)</p>
                      <p className="text-xs font-black text-white tabular-nums">R$ {Number(f.prices?.audiencia || 0).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">Protocolo (Ref)</p>
                      <p className="text-xs font-black text-white tabular-nums">R$ {Number(f.prices?.protocolo || 0).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="entidades" className="m-0 p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button 
                onClick={() => { setEditingItem(null); setIsCounterpartyOpen(true); }}
                className="h-full min-h-[200px] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-blue-400/40 hover:bg-blue-400/5 transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-blue-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="h-7 w-7 text-blue-400" />
                </div>
                <span className="text-[11px] font-black text-white uppercase tracking-widest">Nova Entidade</span>
              </button>

              {loadingCounterparties ? (
                <div className="col-span-2 py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : counterparties?.map(c => (
                <Card 
                  key={c.id} 
                  className="glass border-white/5 hover:border-blue-400/30 transition-all p-8 rounded-3xl shadow-2xl group cursor-pointer" 
                  onClick={() => { setEditingItem(c); setIsCounterpartyOpen(true); }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-400/10 flex items-center justify-center border border-blue-400/20 text-blue-400 shadow-xl">
                      <Building2 className="h-7 w-7" />
                    </div>
                    <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground uppercase font-black">{c.type}</Badge>
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors leading-tight">{c.name}</h4>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-2 opacity-60">{c.documentNumber}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* DIALOGS ESTRATÉGICOS */}
      <Dialog open={isFreelancerOpen} onOpenChange={setIsFreelancerOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[800px] w-[95vw] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingItem ? "Perfil do Correspondente" : "Nova Admissão Externa"}
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-black text-muted-foreground mt-1.5 opacity-60">REGISTRO TÉCNICO E TABELA DE PREÇOS RGMJ.</DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[75vh]">
            <div className="p-10 bg-[#0a0f1e]/50">
              <FreelancerForm initialData={editingItem} onSubmit={handleSaveFreelancer} onCancel={() => setIsFreelancerOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isCounterpartyOpen} onOpenChange={setIsCounterpartyOpen}>
        <DialogContent className="glass border-blue-400/20 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                Entidade Solicitante
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-black text-muted-foreground mt-1.5 opacity-60">CONFIGURAÇÃO DE CONTRATANTE DE ATOS.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 bg-[#0a0f1e]/50">
            <CounterpartyForm initialData={editingItem} onSubmit={handleSaveCounterparty} onCancel={() => setIsCounterpartyOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDiligenceOpen} onOpenChange={setIsDiligenceOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingItem ? "Gestão de Atividade Externa" : "Ordem de Serviço (Diligência)"}
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-black text-muted-foreground mt-1.5 opacity-60">CONTROLE DE LOGÍSTICA E MARGEM OPERACIONAL.</DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[80vh]">
            <div className="p-10 bg-[#0a0f1e]/50">
              <FreelanceDiligenceForm 
                initialData={editingItem} 
                freelancers={freelancers || []}
                counterparties={counterparties || []}
                onSubmit={handleSaveDiligence} 
                onCancel={() => setIsDiligenceOpen(false)} 
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )

  function handleOpenCreateFreelancer() {
    setEditingItem(null)
    setIsFreelancerOpen(true)
  }
}
