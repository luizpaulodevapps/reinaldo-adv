
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

  // Queries
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
    const revenue = diligences.reduce((acc, d) => acc + (d.valueToCharge || 0), 0)
    const cost = diligences.reduce((acc, d) => acc + (d.valueToPay || 0) + (d.extraExpenses || 0), 0)
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
      updatedAt: serverTimestamp(),
      financialSynced: data.financialSynced || false
    }

    if (editingItem) {
      updateDocumentNonBlocking(doc(db, "freelance_diligences", editingItem.id), payload)
      toast({ title: "Diligência Atualizada" })
    } else {
      addDocumentNonBlocking(collection(db, "freelance_diligences"), { ...payload, createdAt: serverTimestamp() })
      toast({ title: "Diligência Registrada" })
    }

    // Lógica Financeira: Se marcada como aprovada/faturada, cria títulos financeiros
    if (data.status === 'Faturada' && !editingItem?.financialSynced) {
      // Título de Saída (Pagar ao Freelancer)
      addDocumentNonBlocking(collection(db, "financial_titles"), {
        description: `PAGTO CORRESPONDENTE: ${data.freelancerName} - ${data.type}`,
        type: "Saída (Despesa)",
        category: "Diligência / Atos",
        value: data.valueToPay + (data.extraExpenses || 0),
        dueDate: data.deadline || format(new Date(), 'yyyy-MM-dd'),
        status: "Pendente",
        createdAt: serverTimestamp()
      })
      // Título de Entrada (Cobrar do Solicitante)
      addDocumentNonBlocking(collection(db, "financial_titles"), {
        description: `COBRANÇA DILIGÊNCIA: ${data.solicitorName} - ${data.type}`,
        type: "Entrada (Receita)",
        category: "Diligência / Atos",
        value: data.valueToCharge,
        dueDate: data.deadline || format(new Date(), 'yyyy-MM-dd'),
        status: "Pendente",
        createdAt: serverTimestamp()
      })
      
      // Marcar como sincronizado
      if (editingItem) {
        updateDocumentNonBlocking(doc(db, "freelance_diligences", editingItem.id), { financialSynced: true })
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
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Freelancers & Diligências</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-60">
            GESTÃO TÁTICA DE ATOS EXTERNOS E REPASSES.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrar cidade, profissional..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => { setEditingItem(null); setIsDiligenceOpen(true); }}
            className="gold-gradient text-background font-black gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-lg shadow-xl"
          >
            <Plus className="h-4 w-4" /> Nova Ordem
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="glass border-primary/20 bg-primary/5 p-6 rounded-xl flex flex-col justify-center shadow-lg">
          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
            <Briefcase className="h-3 w-3" /> Total Diligências
          </p>
          <div className="text-2xl font-black text-white">{stats.total}</div>
        </Card>
        <Card className="glass border-white/5 p-6 rounded-xl flex flex-col justify-center">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
            <Clock className="h-3 w-3" /> Pendentes
          </p>
          <div className="text-2xl font-black text-white">{stats.pending}</div>
        </Card>
        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-6 rounded-xl flex flex-col justify-center">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <ArrowUpRight className="h-3 w-3" /> Faturamento
          </p>
          <div className="text-2xl font-black text-white">R$ {stats.revenue.toLocaleString('pt-BR')}</div>
        </Card>
        <Card className="glass border-rose-500/20 bg-rose-500/5 p-6 rounded-xl flex flex-col justify-center">
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <ArrowDownRight className="h-3 w-3" /> Custos
          </p>
          <div className="text-2xl font-black text-white">R$ {stats.cost.toLocaleString('pt-BR')}</div>
        </Card>
        <Card className="glass border-blue-500/20 bg-blue-500/5 p-6 rounded-xl flex flex-col justify-center">
          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Wallet className="h-3 w-3" /> Margem Operacional
          </p>
          <div className="text-2xl font-black text-white">R$ {stats.margin.toLocaleString('pt-BR')}</div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/5 h-14 p-1 gap-1 w-full justify-start rounded-xl overflow-x-auto scrollbar-hide">
          <TabsTrigger value="diligencias" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">
            <Scale className="h-4 w-4 mr-2" /> Diligências
          </TabsTrigger>
          <TabsTrigger value="freelancers" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">
            <Users2 className="h-4 w-4 mr-2" /> Freelancers
          </TabsTrigger>
          <TabsTrigger value="entidades" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">
            <Building2 className="h-4 w-4 mr-2" /> Entidades Solicitantes
          </TabsTrigger>
        </TabsList>

        <div className="glass rounded-xl border-white/5 min-h-[500px] overflow-hidden">
          <TabsContent value="diligencias" className="m-0 p-0 animate-in fade-in slide-in-from-left-4 duration-500">
            {loadingDiligences ? (
              <div className="py-32 flex flex-col items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : filteredDiligences.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredDiligences.map((d) => (
                  <div key={d.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => { setEditingItem(d); setIsDiligenceOpen(true); }}>
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-primary">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-white uppercase text-base tracking-tight">{d.type} • {d.city}</h4>
                          <Badge variant="outline" className={cn(
                            "text-[8px] font-black uppercase border-0 px-2",
                            d.status === 'Faturada' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            {d.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1 flex items-center gap-2">
                          Profissional: {d.freelancerName} • Data: {d.serviceDate} {d.processNumber && `• Proc: ${d.processNumber}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Repasse / Lucro</p>
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-bold text-rose-400">- R$ {(d.valueToPay || 0).toLocaleString('pt-BR')}</div>
                          <div className="text-sm font-black text-emerald-400">+ R$ {(d.valueToCharge || 0).toLocaleString('pt-BR')}</div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center opacity-30 gap-4">
                <Scale className="h-16 w-16" />
                <p className="text-[11px] font-black uppercase tracking-widest">Nenhuma diligência no radar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="freelancers" className="m-0 p-0">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Banco de Correspondentes</h3>
              <Button onClick={() => { setEditingItem(null); setIsFreelancerOpen(true); }} size="sm" className="gold-gradient text-background font-black text-[10px] uppercase">
                <UserPlus className="h-3.5 w-3.5 mr-2" /> Novo Freelancer
              </Button>
            </div>
            {loadingFreelancers ? (
              <div className="py-32 flex flex-col items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : freelancers?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {freelancers.map(f => (
                  <Card key={f.id} className="glass border-white/5 hover:border-primary/30 transition-all p-6 rounded-xl shadow-xl group cursor-pointer" onClick={() => { setEditingItem(f); setIsFreelancerOpen(true); }}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                        <Users className="h-6 w-6" />
                      </div>
                      <Badge className={f.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}>
                        {f.isActive ? "ATIVO" : "INATIVO"}
                      </Badge>
                    </div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{f.name}</h4>
                    <div className="space-y-2 mt-4 border-t border-white/5 pt-4">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> {f.city} - {f.state}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5 text-primary" /> PIX: {f.pixKey || "Não informado"}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center opacity-30 gap-4">
                <Users className="h-16 w-16" />
                <p className="text-[11px] font-black uppercase tracking-widest">Nenhum profissional cadastrado</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="entidades" className="m-0 p-0">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Entidades Solicitantes (Counterparties)</h3>
              <Button onClick={() => { setEditingItem(null); setIsCounterpartyOpen(true); }} size="sm" className="gold-gradient text-background font-black text-[10px] uppercase">
                <Building2 className="h-3.5 w-3.5 mr-2" /> Nova Entidade
              </Button>
            </div>
            {loadingCounterparties ? (
              <div className="py-32 flex flex-col items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : counterparties?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {counterparties.map(c => (
                  <Card key={c.id} className="glass border-white/5 hover:border-primary/30 transition-all p-6 rounded-xl shadow-xl group cursor-pointer" onClick={() => { setEditingItem(c); setIsCounterpartyOpen(true); }}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-[8px] border-white/10 text-muted-foreground uppercase">{c.type}</Badge>
                    </div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{c.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">{c.documentNumber}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center opacity-30 gap-4">
                <Building2 className="h-16 w-16" />
                <p className="text-[11px] font-black uppercase tracking-widest">Nenhuma entidade cadastrada</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* DIALOGS */}
      <Dialog open={isFreelancerOpen} onOpenChange={setIsFreelancerOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[700px] p-0 overflow-hidden shadow-2xl font-sans rounded-2xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                {editingItem ? "Editar Freelancer" : "Novo Freelancer / Correspondente"}
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Cadastro técnico de parceiro externo RGMJ.</DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[70vh]">
            <div className="p-10">
              <FreelancerForm initialData={editingItem} onSubmit={handleSaveFreelancer} onCancel={() => setIsFreelancerOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isCounterpartyOpen} onOpenChange={setIsCounterpartyOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl font-sans rounded-2xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                {editingItem ? "Editar Entidade" : "Nova Entidade Solicitante"}
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Configuração de contratante de diligências.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10">
            <CounterpartyForm initialData={editingItem} onSubmit={handleSaveCounterparty} onCancel={() => setIsCounterpartyOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDiligenceOpen} onOpenChange={setIsDiligenceOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[900px] w-[95vw] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingItem ? "Gestão de Diligência" : "Lançar Nova Ordem de Serviço"}
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Controle de atos freelance e sincronismo financeiro.</DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[75vh]">
            <div className="p-10">
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
}
