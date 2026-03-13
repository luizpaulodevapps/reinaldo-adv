
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
  Printer,
  TrendingUp,
  Building2,
  Users,
  Wallet,
  Handshake,
  CheckCircle2,
  Scale,
  Calendar,
  AlertCircle,
  Zap,
  ArrowRightLeft,
  Landmark
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, where } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { useToast } from "@/hooks/use-toast"
import { addMonths, format, parseISO } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function FinancialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewTitleOpen, setIsNewTitleOpen] = useState(false)
  const db = useFirestore()
  const { user, role, profile } = useUser()
  const { toast } = useToast()

  const isAdmin = role === 'admin'

  const financialQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    if (isAdmin) {
      return query(collection(db!, "financial_titles"), orderBy("dueDate", "desc"))
    }
    // Para advogados, mostra apenas os títulos onde ele é o responsável
    return query(
      collection(db!, "financial_titles"), 
      where("responsibleStaffId", "==", user.uid),
      orderBy("dueDate", "desc")
    )
  }, [db, user, isAdmin])

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection(financialQuery)

  const isLoading = isLoadingTransactions

  const stats = useMemo(() => {
    if (!transactions) return { entradas: 0, saidas: 0, saldo: 0, pendentes: 0 }
    
    const entradas = transactions
      .filter(t => t.type?.includes('Entrada'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const saidas = transactions
      .filter(t => t.type?.includes('Saída'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const pendentes = transactions
      .filter(t => t.status === 'Pendente')
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    return { entradas, saidas, saldo: entradas - saidas, pendentes }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.processNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transactions, searchTerm])

  const handleCreateTitle = (data: any) => {
    if (!user || !db) return

    const iterations = data.isRecurring ? (data.recurrenceMonths || 1) : 1
    const baseDueDate = parseISO(data.dueDate)

    for (let i = 0; i < iterations; i++) {
      const currentDueDate = addMonths(baseDueDate, i)
      const formattedDueDate = format(currentDueDate, 'yyyy-MM-dd')
      
      const newTitle = {
        ...data,
        dueDate: formattedDueDate,
        value: data.numericValue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      
      delete newTitle.numericValue
      delete newTitle.recurrenceMonths

      addDocumentNonBlocking(collection(db!, "financial_titles"), newTitle)
    }

    setIsNewTitleOpen(false)
    toast({ title: "Operação Registrada" })
  }

  const RepasseCard = ({ t }: { t: any }) => (
    <div className="p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/[0.02] transition-all border-b border-white/5 last:border-0 group gap-6">
      <div className="flex items-start gap-6">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl transition-transform group-hover:scale-110",
          t.type?.includes("Saída") ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
        )}>
          {t.category?.includes("Honorários") ? <Scale className="h-7 w-7" /> : <Handshake className="h-7 w-7" />}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h4 className="font-black text-white uppercase text-base tracking-tight">{t.description}</h4>
            <Badge variant="outline" className="text-[8px] border-white/10 text-muted-foreground uppercase font-black">{t.category}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 opacity-40 text-primary" /> VENC: {t.dueDate}
            </p>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-2">
              <Users className="h-3.5 w-3.5 opacity-40" /> {t.clientName || "CLIENTE GERAL"}
            </p>
            {t.originBank && (
              <p className="text-[9px] text-white/40 uppercase font-bold flex items-center gap-2">
                <Landmark className="h-3 w-3" /> DE: {t.originBank}
              </p>
            )}
            {t.destinationBank && (
              <p className="text-[9px] text-white/40 uppercase font-bold flex items-center gap-2">
                <ArrowRightLeft className="h-3 w-3" /> PARA: {t.destinationBank}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className={cn(
          "text-2xl font-black tabular-nums tracking-tighter",
          t.type?.includes("Saída") ? "text-rose-400" : "text-emerald-400"
        )}>
          {t.type?.includes("Saída") ? "-" : "+"} R$ {(Number(t.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <Badge className={cn(
          "text-[9px] font-black uppercase h-6 px-3 border-0",
          t.status === 'Liquidado' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
        )}>
          {t.status}
        </Badge>
      </div>
    </div>
  )

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Wallet className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-primary transition-colors uppercase">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">
              {isAdmin ? "GESTOR DE REPASSES" : `CARTEIRA: DR(A). ${profile?.name?.split(' ')[0] || 'ADVOGADO'}`}
            </span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
            {isAdmin ? "Controladoria de Repasses" : "Meu Extrato Financeiro"}
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
            {isAdmin ? "GESTÃO INTEGRADA DE HONORÁRIOS E CRÉDITOS DE EQUIPE." : "HISTÓRICO INDIVIDUAL DE HONORÁRIOS E REMUNERAÇÃO RGMJ."}
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar em meus lançamentos..." 
              className="pl-12 glass border-white/5 h-14 text-sm text-white focus:ring-primary/50 rounded-xl font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsNewTitleOpen(true)}
              className="gold-gradient text-background font-black gap-2 px-10 h-14 uppercase text-[11px] tracking-widest rounded-xl shadow-xl hover:scale-105 transition-all"
            >
              <Plus className="h-5 w-5" /> LANÇAR REPASSE
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass border-primary/20 bg-primary/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
            <Scale className="h-4 w-4" /> HONORÁRIOS TOTAIS
          </p>
          <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
            R$ {stats.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </Card>

        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4" /> TOTAL LIQUIDADO
          </p>
          <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
            R$ {(stats.entradas - stats.pendentes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </Card>

        <Card className="glass border-amber-500/20 bg-amber-500/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
            <AlertCircle className="h-4 w-4" /> SALDO PENDENTE
          </p>
          <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
            R$ {stats.pendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </Card>

        <Card className="glass border-white/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
            <Landmark className="h-4 w-4" /> SALDO EM CONTA
          </p>
          <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
            R$ {stats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </Card>
      </div>

      <Card className="glass border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Wallet className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Dossiê de Movimentações</h3>
          </div>
          <Button variant="ghost" className="text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 h-10 px-6 rounded-lg border border-primary/20">
            <Printer className="h-4 w-4 mr-2" /> Gerar Comprovante
          </Button>
        </div>
        <div className="min-h-[500px]">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">Auditando Carteira...</span>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="divide-y divide-white/5">
              {filteredTransactions.map(t => <RepasseCard key={t.id} t={t} />)}
            </div>
          ) : (
            <div className="py-48 flex flex-col items-center justify-center space-y-8 opacity-20">
              <Handshake className="h-20 w-20" />
              <p className="text-xs font-black uppercase tracking-[0.5em]">Nenhum lançamento registrado para seu perfil</p>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={isNewTitleOpen} onOpenChange={setIsNewTitleOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[750px] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Lançamento de Repasse</DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-black tracking-[0.2em] mt-1.5 opacity-60">DISTRIBUIÇÃO TÉCNICA DE HONORÁRIOS E CRÉDITOS.</DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[70vh]">
            <div className="p-10 bg-[#0a0f1e]/50">
              <FinancialTitleForm onSubmit={handleCreateTitle} onCancel={() => setIsNewTitleOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
