
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  Users2,
  Building2,
  Scale,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Briefcase,
  Gavel,
  Zap,
  Mail,
  Phone,
  Edit3,
  Trash2
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
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FreelancerForm } from "@/components/correspondents/freelancer-form"
import { CounterpartyForm } from "@/components/correspondents/counterparty-form"
import { FreelanceDiligenceForm } from "@/components/correspondents/freelance-diligence-form"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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

  const freelancersQuery = useMemoFirebase(() => db ? query(collection(db, "freelancers"), orderBy("name", "asc")) : null, [db])
  const { data: freelancers, isLoading: loadingFreelancers } = useCollection(freelancersQuery)

  const counterpartiesQuery = useMemoFirebase(() => db ? query(collection(db, "counterparties"), orderBy("name", "asc")) : null, [db])
  const { data: counterparties, isLoading: loadingCounterparties } = useCollection(counterpartiesQuery)

  const diligencesQuery = useMemoFirebase(() => db ? query(collection(db, "freelance_diligences"), orderBy("createdAt", "desc")) : null, [db])
  const { data: diligences, isLoading: loadingDiligences } = useCollection(diligencesQuery)

  const stats = useMemo(() => {
    if (!diligences) return { total: 0, pending: 0, revenue: 0, cost: 0, margin: 0, freelanceHearings: 0 }
    const total = diligences.length
    const pending = diligences.filter(d => d.status !== 'Faturada' && d.status !== 'Cancelada').length
    const freelanceHearings = diligences.filter(d => d.type === 'Audiência Freelance').length
    const revenue = diligences.reduce((acc, d) => acc + (Number(d.valueToCharge) || 0), 0)
    const cost = diligences.reduce((acc, d) => acc + (Number(d.valueToPay) || 0) + (Number(d.extraExpenses) || 0), 0)
    return { total, pending, revenue, cost, margin: revenue - cost, freelanceHearings }
  }, [diligences])

  const filteredDiligences = useMemo(() => {
    if (!diligences) return []
    return diligences.filter(d => 
      d.freelancerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.type?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [diligences, searchTerm])

  const handleSaveDiligence = async (data: any) => {
    if (!db) return
    let docRefId = "";
    if (editingItem) {
      docRefId = editingItem.id;
      updateDocumentNonBlocking(doc(db, "freelance_diligences", docRefId), { ...data, updatedAt: serverTimestamp() })
    } else {
      const result = await addDocumentNonBlocking(collection(db, "freelance_diligences"), { ...data, createdAt: serverTimestamp() })
      docRefId = (result as any).id;
    }

    // Injeção na Agenda se for Audiência Freelance
    if (data.type === 'Audiência Freelance') {
      const agendaPayload = {
        title: `[FREELANCE] ${data.processNumber || 'ATO'} - ${data.city}`,
        type: "Audiência Freelance",
        startDateTime: `${data.serviceDate}T${data.serviceTime || '09:00'}:00`,
        processNumber: data.processNumber,
        clientName: data.solicitorName,
        location: `${data.city}${data.court ? ' - ' + data.court : ''}`,
        status: "Agendado",
        isFreelance: true,
        diligenceId: docRefId,
        updatedAt: serverTimestamp()
      }
      addDocumentNonBlocking(collection(db, "hearings"), {
        ...agendaPayload,
        createdAt: serverTimestamp()
      })
    }

    if (data.status === 'Faturada' && !editingItem?.financialSynced) {
      addDocumentNonBlocking(collection(db, "financial_titles"), { 
        description: `PGTO FREELANCE: ${data.type.toUpperCase()} - ${data.freelancerName}`, 
        type: "Saída (Despesa)", 
        category: "Diligência Terceirizada", 
        value: Number(data.valueToPay) + (Number(data.extraExpenses) || 0), 
        dueDate: data.serviceDate || format(new Date(), 'yyyy-MM-dd'), 
        status: "Pendente", 
        entityName: data.freelancerName, 
        destinationBank: data.freelancerPix || "PIX FREELANCER", 
        createdAt: serverTimestamp() 
      })
      addDocumentNonBlocking(collection(db, "financial_titles"), { 
        description: `REC. ${data.type.toUpperCase()}: ${data.solicitorName}`, 
        type: "Entrada (Receita)", 
        category: "Diligência / Atos", 
        value: Number(data.valueToCharge), 
        dueDate: data.serviceDate || format(new Date(), 'yyyy-MM-dd'), 
        status: "Pendente", 
        clientName: data.solicitorName, 
        createdAt: serverTimestamp() 
      })
      if (editingItem) updateDocumentNonBlocking(doc(db, "freelance_diligences", docRefId), { financialSynced: true })
    }
    setIsDiligenceOpen(false); setEditingItem(null); toast({ title: "Registro Concluído" })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Handshake className="h-3 w-3" />
            <span>Logística Externa</span>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">Correspondentes</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Gestão de Atos Freelance</h1>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Filtrar..." className="pl-12 glass border-white/5 h-12 text-xs text-white rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          
          {activeTab === 'diligencias' && (
            <Button onClick={() => { setEditingItem(null); setIsDiligenceOpen(true); }} className="gold-gradient text-background font-black gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-xl shadow-xl">
              <Plus className="h-4 w-4" /> NOVA ORDEM FREELANCE
            </Button>
          )}
          {activeTab === 'freelancers' && (
            <Button onClick={() => { setEditingItem(null); setIsFreelancerOpen(true); }} className="gold-gradient text-background font-black gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-xl shadow-xl">
              <UserPlus className="h-4 w-4" /> NOVO CORRESPONDENTE
            </Button>
          )}
          {activeTab === 'entidades' && (
            <Button onClick={() => { setEditingItem(null); setIsCounterpartyOpen(true); }} className="gold-gradient text-background font-black gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-xl shadow-xl">
              <Building2 className="h-4 w-4" /> NOVO SOLICITANTE
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="glass border-primary/20 bg-primary/5 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Gavel className="h-12 w-12" /></div>
          <p className="text-[9px] font-black text-primary uppercase mb-2 flex items-center gap-2"><Briefcase className="h-3 w-3" /> Total de Atos</p>
          <div className="text-3xl font-black text-white">{stats.total}</div>
          <p className="text-[8px] font-bold text-primary/40 uppercase mt-1">{stats.freelanceHearings} Audiências Freelance</p>
        </Card>
        <Card className="glass border-white/5 p-6 rounded-2xl flex flex-col justify-center shadow-lg">
          <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 flex items-center gap-2"><Clock className="h-3 w-3" /> Pendentes</p>
          <div className="text-3xl font-black text-white">{stats.pending}</div>
        </Card>
        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-6 rounded-2xl shadow-lg">
          <p className="text-[9px] font-black text-emerald-500 uppercase mb-2 flex items-center gap-2"><ArrowUpRight className="h-3 w-3" /> Receita Atos</p>
          <div className="text-3xl font-black text-white tabular-nums">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-rose-500/20 bg-rose-500/5 p-6 rounded-2xl shadow-lg">
          <p className="text-[9px] font-black text-rose-500 uppercase mb-2 flex items-center gap-2"><ArrowDownRight className="h-3 w-3" /> Custo Freelancer</p>
          <div className="text-3xl font-black text-white tabular-nums">R$ {stats.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-blue-500/20 bg-blue-500/5 p-6 rounded-2xl shadow-lg">
          <p className="text-[9px] font-black text-blue-400 uppercase mb-2 flex items-center gap-2"><Wallet className="h-3 w-3" /> Margem Lucro</p>
          <div className="text-3xl font-black text-white tabular-nums">R$ {stats.margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/5 h-14 p-1.5 gap-1.5 w-full justify-start rounded-2xl">
          <TabsTrigger value="diligencias" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl tracking-widest">Ordens de Serviço</TabsTrigger>
          <TabsTrigger value="freelancers" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl tracking-widest">Banco de Correspondentes</TabsTrigger>
          <TabsTrigger value="entidades" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl tracking-widest">Solicitantes</TabsTrigger>
        </TabsList>

        <div className="min-h-[500px]">
          <TabsContent value="diligencias" className="m-0 p-0 animate-in fade-in duration-500">
            <Card className="glass border-white/5 overflow-hidden rounded-3xl shadow-2xl">
              {loadingDiligences ? (
                <div className="py-32 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : filteredDiligences.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {filteredDiligences.map((d) => (
                    <div key={d.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer group" onClick={() => { setEditingItem(d); setIsDiligenceOpen(true); }}>
                      <div className="flex items-center gap-8">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl transition-all group-hover:scale-110",
                          d.type === 'Audiência Freelance' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-white/5 border-white/10 text-muted-foreground"
                        )}>
                          {d.type === 'Audiência Freelance' ? <Gavel className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-white uppercase text-lg tracking-tight">{d.type} • {d.city}</h4>
                            <Badge className={cn(
                              "text-[9px] font-black uppercase border-0 px-3", 
                              d.status === 'Faturada' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                              {d.status}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                            PROFISSIONAL: {d.freelancerName} • DATA: {d.serviceDate} {d.serviceTime || ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Fluxo de Caixa</p>
                          <div className="flex items-center gap-6">
                            <div className="text-sm font-bold text-rose-400">-{ Number(d.valueToPay).toLocaleString('pt-BR') }</div>
                            <div className="text-sm font-black text-emerald-400">+ { Number(d.valueToCharge).toLocaleString('pt-BR') }</div>
                          </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-48 text-center opacity-20">
                  <Zap className="h-20 w-20 mx-auto mb-6" />
                  <p className="text-xs font-black uppercase tracking-[0.5em]">Nenhuma ordem de serviço ativa</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="freelancers" className="m-0 p-0 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingFreelancers ? (
                <div className="col-span-full py-32 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : freelancers?.map(f => (
                <Card key={f.id} className="glass border-white/5 p-8 rounded-3xl hover:border-primary/30 transition-all group cursor-pointer shadow-xl" onClick={() => { setEditingItem(f); setIsFreelancerOpen(true); }}>
                  <div className="flex items-start justify-between mb-6">
                    <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-lg">
                      <AvatarFallback className="bg-secondary text-primary font-black text-lg">{f.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary bg-primary/5 px-3">CORRESPONDENTE</Badge>
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors truncate">{f.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 mb-6">{f.city} - {f.state}</p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">Audiência Freelance</p>
                      <p className="text-sm font-black text-white">R$ {f.prices?.audiencia?.toLocaleString('pt-BR') || '---'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">Atos / Protocolos</p>
                      <p className="text-sm font-black text-white">R$ {f.prices?.protocolo?.toLocaleString('pt-BR') || '---'}</p>
                    </div>
                  </div>
                </Card>
              ))}
              <Card className="glass border-dashed border-2 border-white/10 p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:border-primary/40 cursor-pointer transition-all" onClick={() => { setEditingItem(null); setIsFreelancerOpen(true); }}>
                <UserPlus className="h-10 w-10 text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cadastrar Correspondente</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="entidades" className="m-0 p-0 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingCounterparties ? (
                <div className="col-span-full py-32 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : counterparties?.map(c => (
                <Card key={c.id} className="glass border-white/5 p-8 rounded-3xl shadow-xl hover:border-primary/30 transition-all cursor-pointer" onClick={() => { setEditingItem(c); setIsCounterpartyOpen(true); }}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-primary">
                      {c.type === 'Escritório Parceiro' ? <Scale className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-white uppercase truncate">{c.name}</h3>
                      <Badge className="bg-blue-500/10 text-blue-400 border-0 text-[8px] font-black uppercase mt-1 px-2">{c.type}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-2"><Mail className="h-3 w-3" /> {c.email || 'NÃO INFORMADO'}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-2"><Phone className="h-3 w-3" /> {c.phone || 'NÃO INFORMADO'}</p>
                  </div>
                </Card>
              ))}
              <Card className="glass border-dashed border-2 border-white/10 p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:border-primary/40 cursor-pointer transition-all" onClick={() => { setEditingItem(null); setIsCounterpartyOpen(true); }}>
                <Building2 className="h-10 w-10 text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cadastrar Solicitante</p>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={isFreelancerOpen} onOpenChange={setIsFreelancerOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[800px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Perfil do Correspondente</DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1">Dossiê de parceiro e tabela de honorários por ato.</DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[75vh]">
            <div className="p-10 bg-[#0a0f1e]/50">
              <FreelancerForm initialData={editingItem} onSubmit={async (data: any) => { 
                if(editingItem) await updateDocumentNonBlocking(doc(db!, "freelancers", editingItem.id), data); 
                else await addDocumentNonBlocking(collection(db!, "freelancers"), data); 
                setIsFreelancerOpen(false); toast({title: "Dossiê Salvo com Sucesso"}); 
              }} onCancel={() => setIsFreelancerOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isCounterpartyOpen} onOpenChange={setIsCounterpartyOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Dados do Solicitante</DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1">Quem contrata a logística da banca.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 bg-[#0a0f1e]/50">
            <CounterpartyForm initialData={editingItem} onSubmit={async (data: any) => { 
              if(editingItem) await updateDocumentNonBlocking(doc(db!, "counterparties", editingItem.id), data); 
              else await addDocumentNonBlocking(collection(db!, "counterparties"), data); 
              setIsCounterpartyOpen(false); toast({title: "Entidade Registrada"}); 
            }} onCancel={() => setIsCounterpartyOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDiligenceOpen} onOpenChange={setIsDiligenceOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Ordem de Serviço Freelance</DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1">Requisição tática de ato de correspondência.</DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[80vh]">
            <div className="p-10 bg-[#0a0f1e]/50">
              <FreelanceDiligenceForm initialData={editingItem} freelancers={freelancers || []} counterparties={counterparties || []} onSubmit={handleSaveDiligence} onCancel={() => setIsDiligenceOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
