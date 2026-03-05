
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { useToast } from "@/hooks/use-toast"
import { addMonths, format, parseISO } from "date-fns"

export default function FinancialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewTitleOpen, setIsNewTitleOpen] = useState(false)
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  const financialQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "financial_titles"), orderBy("dueDate", "desc"))
  }, [db, user])

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection(financialQuery)

  const isLoading = isUserLoading || isLoadingTransactions

  const stats = useMemo(() => {
    if (!transactions) return { entradas: 0, saídas: 0, saldo: 0, repasses: 0 }
    
    const entradas = transactions
      .filter(t => t.type?.includes('Entrada'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const saídas = transactions
      .filter(t => t.type?.includes('Saída'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const repasses = transactions
      .filter(t => t.type === 'Repasse')
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const saldo = entradas - saídas

    return { entradas, saídas, saldo, repasses }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    toast({
      title: iterations > 1 ? "Recorrência Programada" : "Operação Registrada",
      description: iterations > 1 
        ? `${iterations} lançamentos de R$ ${data.value} foram injetados no fluxo.`
        : `O lançamento de R$ ${data.value} foi injetado no fluxo.`
    })
  }

  const TransactionList = ({ items }: { items: any[] }) => (
    <div className="divide-y divide-white/5 w-full">
      {items.map((t) => (
        <div key={t.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center border",
              t.type?.includes("Saída") ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            )}>
              {t.type?.includes("Saída") ? <ArrowDownRight className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h4 className="font-bold text-white uppercase text-sm tracking-tight">{t.description}</h4>
                <Badge variant="outline" className="text-[8px] font-black border-white/10 text-muted-foreground">{t.category?.toUpperCase()}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1 flex items-center gap-2">
                Vencimento: {t.dueDate} {t.processNumber ? `• Proc: ${t.processNumber}` : "• Despesa Admin"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className={cn(
                "text-lg font-black",
                t.type?.includes("Saída") ? "text-rose-400" : "text-emerald-400"
              )}>
                {t.type?.includes("Saída") ? "-" : "+"} R$ {(Number(t.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <Badge 
                variant={t.status === 'Recebido' || t.status === 'Pago' ? 'default' : 'outline'}
                className={cn("text-[9px] font-black uppercase h-5", (t.status === 'Recebido' || t.status === 'Pago') ? "bg-emerald-500 text-white" : "border-white/10")}
              >
                {t.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary" onClick={() => window.print()}>
                <Printer className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <Link href="/" className="hover:text-primary transition-colors uppercase">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="uppercase">Dashboard</span>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Carteira & Repasses</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase tracking-tighter">Gestão de Repasses</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-70">
            CONTROLE DE CRÉDITOS E HONORÁRIOS RGMJ.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsNewTitleOpen(true)}
            className="gold-gradient text-background font-black gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-lg shadow-xl"
          >
            <Plus className="h-4 w-4" /> Novo Crédito
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-primary/20 relative overflow-hidden h-32 flex flex-col justify-center shadow-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <Wallet className="h-3 w-3" /> Saldo em Carteira
            </p>
            <div className={cn("text-3xl font-black tabular-nums tracking-tighter", stats.saldo >= 0 ? "text-white" : "text-rose-400")}>
              R$ {stats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-emerald-500/70 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <ArrowUpRight className="h-3 w-3" /> Total Créditos
            </p>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
              R$ {stats.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-rose-500/70 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <ArrowDownRight className="h-3 w-3" /> Repasses Efetuados
            </p>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
              R$ {stats.saídas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <Users className="h-3 w-3" /> Volume de Equipe
            </p>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
              {transactions?.length || 0} Atos
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="glass rounded-xl border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Auditando Carteira RGMJ...</span>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <TransactionList items={filteredTransactions} />
        ) : (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-30">
            <Calculator className="h-16 w-16 text-muted-foreground" />
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center">Nenhum repasse no radar</p>
          </div>
        )}
      </div>

      <Dialog open={isNewTitleOpen} onOpenChange={setIsNewTitleOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[700px] p-0 overflow-hidden shadow-2xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                Novo Registro Financeiro
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                Lançamento em carteira técnica RGMJ.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-10 py-8 bg-[#0a0f1e]/50">
            <FinancialTitleForm onSubmit={handleCreateTitle} onCancel={() => setIsNewTitleOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
