
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
  updateDocumentNonBlocking 
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
    if (!diligences) return { total: 0, pending: 0, revenue: 0, cost: 0, margin: 0 }
    const total = diligences.length
    const pending = diligences.filter(d => d.status !== 'Faturada' && d.status !== 'Cancelada').length
    const revenue = diligences.reduce((acc, d) => acc + (Number(d.valueToCharge) || 0), 0)
    const cost = diligences.reduce((acc, d) => acc + (Number(d.valueToPay) || 0) + (Number(d.extraExpenses) || 0), 0)
    return { total, pending, revenue, cost, margin: revenue - cost }
  }, [diligences])

  const filteredDiligences = useMemo(() => {
    if (!diligences) return []
    return diligences.filter(d => d.freelancerName?.toLowerCase().includes(searchTerm.toLowerCase()) || d.city?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [diligences, searchTerm])

  const handleSaveDiligence = async (data: any) => {
    if (!db) return
    if (editingItem) updateDocumentNonBlocking(doc(db, "freelance_diligences", editingItem.id), { ...data, updatedAt: serverTimestamp() })
    else addDocumentNonBlocking(collection(db, "freelance_diligences"), { ...data, createdAt: serverTimestamp() })

    if (data.status === 'Faturada' && !editingItem?.financialSynced) {
      addDocumentNonBlocking(collection(db, "financial_titles"), { description: `PGTO FREELANCER: ${data.freelancerName}`, type: "Saída (Despesa)", category: "Diligência Terceirizada", value: Number(data.valueToPay) + (Number(data.extraExpenses) || 0), dueDate: data.serviceDate || format(new Date(), 'yyyy-MM-dd'), status: "Pendente", entityName: data.freelancerName, destinationBank: data.freelancerPix || "PIX FREELANCER", createdAt: serverTimestamp() })
      addDocumentNonBlocking(collection(db, "financial_titles"), { description: `RECEITA DILIGÊNCIA: ${data.solicitorName}`, type: "Entrada (Receita)", category: "Diligência / Atos", value: Number(data.valueToCharge), dueDate: data.serviceDate || format(new Date(), 'yyyy-MM-dd'), status: "Pendente", clientName: data.solicitorName, createdAt: serverTimestamp() })
      if (editingItem) updateDocumentNonBlocking(doc(db, "freelance_diligences", editingItem.id), { financialSynced: true })
    }
    setIsDiligenceOpen(false); setEditingItem(null); toast({ title: "Registro Concluído" })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1"><div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4"><Handshake className="h-3 w-3" /><span>Logística Externa</span><ChevronRight className="h-2 w-2" /><span className="text-white">Correspondentes</span></div><h1 className="text-4xl font-black text-white uppercase tracking-tighter">Gestão Freelance</h1></div>
        <div className="flex items-center gap-3 w-full md:w-auto"><div className="relative flex-1 md:w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Filtrar diligência ou cidade..." className="pl-12 glass border-white/5 h-12 text-xs text-white rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><Button onClick={() => { setEditingItem(null); setIsDiligenceOpen(true); }} className="gold-gradient text-background font-black gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-xl shadow-xl"><Plus className="h-4 w-4" /> NOVA ORDEM</Button></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="glass border-primary/20 bg-primary/5 p-6 rounded-2xl shadow-lg"><p className="text-[9px] font-black text-primary uppercase mb-2 flex items-center gap-2"><Briefcase className="h-3 w-3" /> Atos Processados</p><div className="text-3xl font-black text-white">{stats.total}</div></Card>
        <Card className="glass border-white/5 p-6 rounded-2xl flex flex-col justify-center"><p className="text-[9px] font-black text-muted-foreground uppercase mb-2 flex items-center gap-2"><Clock className="h-3 w-3" /> Pendentes</p><div className="text-3xl font-black text-white">{stats.pending}</div></Card>
        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-6 rounded-2xl"><p className="text-[9px] font-black text-emerald-500 uppercase mb-2 flex items-center gap-2"><ArrowUpRight className="h-3 w-3" /> Receita</p><div className="text-3xl font-black text-white tabular-nums">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></Card>
        <Card className="glass border-rose-500/20 bg-rose-500/5 p-6 rounded-2xl"><p className="text-[9px] font-black text-rose-500 uppercase mb-2 flex items-center gap-2"><ArrowDownRight className="h-3 w-3" /> Custos</p><div className="text-3xl font-black text-white tabular-nums">R$ {stats.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></Card>
        <Card className="glass border-blue-500/20 bg-blue-500/5 p-6 rounded-2xl"><p className="text-[9px] font-black text-blue-400 uppercase mb-2 flex items-center gap-2"><Wallet className="h-3 w-3" /> Margem</p><div className="text-3xl font-black text-white tabular-nums">R$ {stats.margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/5 h-14 p-1.5 gap-1.5 w-full justify-start rounded-2xl"><TabsTrigger value="diligencias" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl tracking-widest">Diligências em Curso</TabsTrigger><TabsTrigger value="freelancers" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl tracking-widest">Banco de Talentos</TabsTrigger><TabsTrigger value="entidades" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-xl tracking-widest">Solicitantes</TabsTrigger></TabsList>
        <div className="min-h-[500px]">
          <TabsContent value="diligencias" className="m-0 p-0 animate-in fade-in duration-500"><Card className="glass border-white/5 overflow-hidden rounded-3xl">{loadingDiligences ? <div className="py-32 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div> : filteredDiligences.length > 0 ? <div className="divide-y divide-white/5">{filteredDiligences.map((d) => (<div key={d.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer group" onClick={() => { setEditingItem(d); setIsDiligenceOpen(true); }}><div className="flex items-center gap-8"><div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-primary shadow-xl"><FileText className="h-7 w-7" /></div><div className="space-y-1.5"><div className="flex items-center gap-3"><h4 className="font-black text-white uppercase text-lg tracking-tight">{d.type} • {d.city}</h4><Badge className={cn("text-[9px] font-black uppercase", d.status === 'Faturada' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>{d.status}</Badge></div><p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">PROFISSIONAL: {d.freelancerName} • DATA: {d.serviceDate}</p></div></div><div className="flex items-center gap-12"><div className="text-right"><p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Fluxo de Caixa</p><div className="flex items-center gap-6"><div className="text-sm font-bold text-rose-400">-{ Number(d.valueToPay).toLocaleString('pt-BR') }</div><div className="text-sm font-black text-emerald-400">+ { Number(d.valueToCharge).toLocaleString('pt-BR') }</div></div></div><ChevronRight className="h-6 w-6 text-muted-foreground/20 group-hover:text-primary transition-all" /></div></div>))}</div> : <div className="py-48 text-center opacity-20"><Scale className="h-20 w-20 mx-auto mb-6" /><p className="text-xs font-black uppercase tracking-[0.5em]">Nenhuma ordem de serviço ativa</p></div>}</Card></TabsContent>
        </div>
      </Tabs>

      <Dialog open={isFreelancerOpen} onOpenChange={setIsFreelancerOpen}><DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[800px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl"><div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl"><DialogHeader><DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Perfil do Correspondente</DialogTitle></DialogHeader></div><ScrollArea className="max-h-[75vh]"><div className="p-10 bg-[#0a0f1e]/50"><FreelancerForm initialData={editingItem} onSubmit={async (data: any) => { if(editingItem) await updateDocumentNonBlocking(doc(db!, "freelancers", editingItem.id), data); else await addDocumentNonBlocking(collection(db!, "freelancers"), data); setIsFreelancerOpen(false); toast({title: "Freelancer Salvo"}); }} onCancel={() => setIsFreelancerOpen(false)} /></div></ScrollArea></DialogContent></Dialog>
      <Dialog open={isDiligenceOpen} onOpenChange={setIsDiligenceOpen}><DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl"><div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl"><DialogHeader><DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Ordem de Serviço</DialogTitle></DialogHeader></div><ScrollArea className="max-h-[80vh]"><div className="p-10 bg-[#0a0f1e]/50"><FreelanceDiligenceForm initialData={editingItem} freelancers={freelancers || []} counterparties={counterparties || []} onSubmit={handleSaveDiligence} onCancel={() => setIsDiligenceOpen(false)} /></div></ScrollArea></DialogContent></Dialog>
    </div>
  )
}
