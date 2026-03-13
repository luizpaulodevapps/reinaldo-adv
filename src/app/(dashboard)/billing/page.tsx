
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Calculator, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  Building2,
  Users,
  Wallet,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  Landmark,
  Handshake,
  ShieldCheck,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, limit } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function BillingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState<any>(null)
  const [listLimit, setListLimit] = useState(50)
  
  const db = useFirestore()
  const { user, isUserLoading, profile } = useUser()
  const { toast } = useToast()

  const financialQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "financial_titles"), orderBy("dueDate", "desc"), limit(listLimit))
  }, [db, user, listLimit])

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection(financialQuery)

  const staffQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "staff_profiles"))
  }, [db, user])
  const { data: staffMembers } = useCollection(staffQuery)

  const isLoading = isUserLoading || isLoadingTransactions

  const stats = useMemo(() => {
    if (!transactions) return { entradas: 0, saídas: 0, repassesPrevistos: 0, lucroBanca: 0, pendente: 0 }
    
    const entradas = transactions.filter(t => t.type?.includes('Entrada')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
    const saídas = transactions.filter(t => t.type?.includes('Saída')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    let repassesPrevistos = 0
    transactions.filter(t => t.type?.includes('Entrada') && t.category?.includes('Honorários')).forEach(t => {
      const staff = staffMembers?.find(s => s.id === t.responsibleStaffId)
      if (staff && staff.paymentType === "Parceria (Porcentagem)") {
        repassesPrevistos += (Number(t.value) * (staff.commissionPercentage || 0)) / 100
      }
    })

    const pendente = transactions.filter(t => t.status === 'Pendente' && t.type?.includes('Entrada')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
    const lucroBanca = entradas - saídas - repassesPrevistos

    return { entradas, saídas, repassesPrevistos, lucroBanca, pendente }
  }, [transactions, staffMembers])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transactions, searchTerm])

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Calculator className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">CENTRAL FINANCEIRA</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Comando Financeiro</h1>
            {profile?.isOwner && <Badge className="bg-primary text-background font-black text-[10px] uppercase h-6 px-3">CONTA MESTRE</Badge>}
          </div>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-60">DASHBOARD CONSOLIDADO RGMJ.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto"><Input placeholder="Pesquisar..." className="glass border-white/10 h-14 text-sm text-white md:w-96 rounded-xl font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><Button onClick={() => { setEditingTitle(null); setIsTitleDialogOpen(true); }} className="gold-gradient text-background font-black gap-3 px-10 h-14 uppercase text-[11px] rounded-xl shadow-xl hover:scale-[1.02] transition-all"><Plus className="h-5 w-5" /> NOVO LANÇAMENTO</Button></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="glass border-primary/20 bg-primary/5 p-8 rounded-2xl h-36 flex flex-col justify-center shadow-2xl group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Landmark className="h-16 w-16" /></div>
          <p className="text-[10px] font-black text-primary uppercase mb-3 flex items-center gap-3"><Landmark className="h-4 w-4" /> PATRIMÔNIO DA BANCA</p>
          <div className={cn("text-3xl font-black tabular-nums tracking-tighter", stats.lucroBanca >= 0 ? "text-white" : "text-rose-400")}>R$ {stats.lucroBanca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <p className="text-[8px] text-primary/40 font-bold uppercase mt-1 tracking-widest">Lucro líquido projetado</p>
        </Card>
        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-8 rounded-2xl h-36 flex flex-col justify-center"><p className="text-[10px] font-black text-emerald-500 uppercase mb-3 flex items-center gap-3"><ArrowUpRight className="h-4 w-4" /> RECEITA BRUTA</p><div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></Card>
        <Card className="glass border-rose-500/20 bg-rose-500/5 p-8 rounded-2xl h-36 flex flex-col justify-center"><p className="text-[10px] font-black text-rose-500 uppercase mb-3 flex items-center gap-3"><ArrowDownRight className="h-4 w-4" /> TOTAL DESPESAS</p><div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.saídas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></Card>
        <Card className="glass border-amber-500/20 bg-amber-500/5 p-8 rounded-2xl h-36 flex flex-col justify-center"><p className="text-[10px] font-black text-amber-500 uppercase mb-3 flex items-center gap-3"><Handshake className="h-4 w-4" /> REPASSES PREVISTOS</p><div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.repassesPrevistos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></Card>
        <Card className="glass border-white/5 p-8 rounded-2xl h-36 flex flex-col justify-center"><p className="text-[10px] font-black text-muted-foreground uppercase mb-3 flex items-center gap-3"><AlertCircle className="h-4 w-4" /> PENDENTE RECEBER</p><div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="p-8 bg-white/[0.02] border-b border-white/5 flex items-center justify-between"><h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3"><ArrowUpRight className="h-5 w-5 text-emerald-500" /> Atividade de Receitas</h3><Button asChild variant="ghost" className="text-primary font-black uppercase text-[10px] h-10 px-6 rounded-lg"><Link href="/receivables">Gerenciar Contas <ArrowRight className="h-4 w-4 ml-2" /></Link></Button></div>
          <div className="min-h-[400px]">{isLoading ? <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : filteredTransactions.filter(t => t.type?.includes('Entrada')).slice(0, 10).map(t => (<div key={t.id} className="p-6 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.01] transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><DollarSign className="h-5 w-5" /></div><div><h4 className="text-sm font-bold text-white uppercase">{t.description}</h4><p className="text-[10px] text-muted-foreground font-black uppercase mt-1">{t.dueDate} • {t.clientName || "GERAL"}</p></div></div><div className="text-right"><p className="text-sm font-black text-emerald-400 tabular-nums">R$ {Number(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><Badge variant="outline" className="text-[8px] h-5 border-white/10 uppercase font-black">{t.status}</Badge></div></div>))}</div>
        </Card>
        <Card className="glass border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="p-8 bg-white/[0.02] border-b border-white/5 flex items-center justify-between"><h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3"><ArrowDownRight className="h-5 w-5 text-rose-500" /> Atividade de Despesas</h3><Button asChild variant="ghost" className="text-primary font-black uppercase text-[10px] h-10 px-6 rounded-lg"><Link href="/payables">Gerenciar Obrigações <ArrowRight className="h-4 w-4 ml-2" /></Link></Button></div>
          <div className="min-h-[400px]">{isLoading ? <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : filteredTransactions.filter(t => t.type?.includes('Saída')).slice(0, 10).map(t => (<div key={t.id} className="p-6 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.01] transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500"><Wallet className="h-5 w-5" /></div><div><h4 className="text-sm font-bold text-white uppercase">{t.description}</h4><p className="text-[10px] text-muted-foreground font-black uppercase mt-1">{t.dueDate} • {t.entityName || "GERAL"}</p></div></div><div className="text-right"><p className="text-sm font-black text-rose-400 tabular-nums">R$ {Number(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><Badge variant="outline" className="text-[8px] h-5 border-white/10 uppercase font-black">{t.status}</Badge></div></div>))}</div>
        </Card>
      </div>

      {transactions && transactions.length >= listLimit && (
        <div className="flex justify-center pt-10">
          <Button onClick={() => setListLimit(prev => prev + 50)} variant="outline" className="glass border-white/10 text-muted-foreground hover:text-white font-black uppercase text-[10px] tracking-widest h-12 px-10 rounded-xl">
            <ChevronDown className="h-4 w-4 mr-2" /> Auditar Lançamentos Antigos
          </Button>
        </div>
      )}

      <Dialog open={isTitleDialogOpen} onOpenChange={setIsTitleDialogOpen}><DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[850px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl"><div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl"><DialogHeader><DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Lançamento Financeiro</DialogTitle><DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">SISTEMA INTEGRADO DE CONCILIAÇÃO BANCÁRIA RGMJ.</DialogDescription></DialogHeader></div><ScrollArea className="max-h-[75vh]"><div className="p-10 bg-[#0a0f1e]/50"><FinancialTitleForm initialData={editingTitle} onSubmit={(data) => { if(editingTitle) { const ref = doc(db!, "financial_titles", editingTitle.id); updateDocumentNonBlocking(ref, {...data, value: data.numericValue, updatedAt: serverTimestamp()}); } else { addDocumentNonBlocking(collection(db!, "financial_titles"), {...data, value: data.numericValue, createdAt: serverTimestamp(), updatedAt: serverTimestamp()}); } setIsTitleDialogOpen(false); toast({title: "Lançamento Concluído"}); }} onCancel={() => setIsTitleDialogOpen(false)} /></div></ScrollArea></DialogContent></Dialog>
    </div>
  )
}
