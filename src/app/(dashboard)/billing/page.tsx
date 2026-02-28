
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Wallet, 
  Calculator, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Receipt,
  Loader2,
  BarChart3,
  Gavel,
  Scale,
  FileText,
  DollarSign,
  AlertCircle,
  X,
  Printer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { useToast } from "@/hooks/use-toast"

export default function BillingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewTitleOpen, setIsNewTitleOpen] = useState(false)
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  const canQuery = !!user

  const financialQuery = useMemoFirebase(() => {
    if (!canQuery) return null
    return query(collection(db, "financial_titles"), orderBy("dueDate", "desc"))
  }, [db, canQuery])

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection(financialQuery)

  const isLoading = isUserLoading || isLoadingTransactions

  const stats = useMemo(() => {
    if (!transactions) return { real: 0, bruto: 0, pendente: 0, acordos: 0 }
    
    const bruto = transactions
      .filter(t => t.status === 'Recebido' && (t.type === 'Entrada (Receita)' || t.type === 'Honorário'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const pendente = transactions
      .filter(t => t.status === 'Pendente' && t.type?.includes('Entrada'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const acordos = transactions
      .filter(t => t.category?.includes('Acordo') || t.category?.includes('Sentença'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const real = bruto * 0.7 // Simulando 70% para a banca

    return { real, bruto, pendente, acordos }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.processNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transactions, searchTerm])

  const handleCreateTitle = (data: any) => {
    if (!user) return

    const newTitle = {
      ...data,
      clientId: data.clientId || "AUTO",
      value: data.numericValue,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    addDocumentNonBlocking(collection(db, "financial_titles"), newTitle)
      .then(() => {
        setIsNewTitleOpen(false)
        toast({
          title: "Lançamento Confirmado",
          description: `O título de R$ ${data.value} foi registrado no caixa.`
        })
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
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h4 className="font-bold text-white uppercase text-sm tracking-tight">{t.description}</h4>
                <Badge variant="outline" className="text-[8px] font-black border-white/10 text-muted-foreground">{t.category?.toUpperCase()}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1 flex items-center gap-2">
                Vencimento: {t.dueDate} • Proc: {t.processNumber || "N/A"}
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
                variant={t.status === 'Recebido' ? 'default' : 'outline'}
                className={cn("text-[9px] font-black uppercase h-5", t.status === 'Recebido' ? "bg-emerald-500 text-white" : "border-white/10")}
              >
                {t.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary" title="Gerar Recibo" onClick={() => window.print()}>
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <Link href="/dashboard" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span>Dashboard</span>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">Faturamento</span>
          </div>
          <h1 className="text-4xl font-headline font-bold text-white tracking-tight">Faturamento & Caixa</h1>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest opacity-70">
            Controle de honorários, acordos, sentenças e fluxo de capitais.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por processo ou descrição..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsNewTitleOpen(true)}
            className="gold-gradient text-background font-black gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-lg shadow-lg shadow-primary/10"
          >
            <Plus className="h-4 w-4" /> Novo Lançamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-primary/20 relative overflow-hidden h-32 flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <Scale className="h-3 w-3" /> Receita da Banca (70%)
            </p>
            <div className="text-3xl font-black text-white tabular-nums">
              R$ {stats.real.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-emerald-500/10 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-emerald-500/70 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <DollarSign className="h-3 w-3" /> Bruto Recebido
            </p>
            <div className="text-3xl font-black text-white tabular-nums">
              R$ {stats.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-amber-500/10 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-amber-500/70 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <Gavel className="h-3 w-3" /> Acordos & Sentenças
            </p>
            <div className="text-3xl font-black text-white tabular-nums">
              R$ {stats.acordos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-rose-500/10 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-rose-500/70 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" /> Receitas Pendentes
            </p>
            <div className="text-3xl font-black text-white tabular-nums">
              R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todos" className="space-y-0">
        <TabsList className="bg-white/5 border border-white/5 h-14 p-1 gap-1 w-full justify-start rounded-t-xl rounded-b-none border-b-0 overflow-x-auto scrollbar-hide">
          <TabsTrigger value="todos" className="text-muted-foreground font-bold text-[10px] uppercase h-full px-8 gap-2">
            <Calculator className="h-3.5 w-3.5" /> Todos
          </TabsTrigger>
          <TabsTrigger value="acordos" className="text-muted-foreground font-bold text-[10px] uppercase h-full px-8 gap-2">
            <Gavel className="h-3.5 w-3.5" /> Acordos & Sentenças
          </TabsTrigger>
          <TabsTrigger value="honorarios" className="text-muted-foreground font-bold text-[10px] uppercase h-full px-8 gap-2">
            <Scale className="h-3.5 w-3.5" /> Honorários
          </TabsTrigger>
          <TabsTrigger value="diligencias" className="text-muted-foreground font-bold text-[10px] uppercase h-full px-8 gap-2">
            <FileText className="h-3.5 w-3.5" /> Diligências & Atos
          </TabsTrigger>
        </TabsList>

        <div className="glass rounded-b-xl border-t-0 p-0 min-h-[500px] flex flex-col relative overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Caixa RGMJ...</span>
            </div>
          ) : (
            <>
              <TabsContent value="todos" className="w-full m-0 p-0">
                {filteredTransactions.length > 0 ? (
                  <TransactionList items={filteredTransactions} />
                ) : (
                  <EmptyState />
                )}
              </TabsContent>
              
              <TabsContent value="acordos" className="w-full m-0 p-0">
                <TransactionList items={filteredTransactions.filter(t => t.category?.includes('Acordo') || t.category?.includes('Sentença'))} />
              </TabsContent>

              <TabsContent value="honorarios" className="w-full m-0 p-0">
                <TransactionList items={filteredTransactions.filter(t => t.category?.includes('Honorário'))} />
              </TabsContent>

              <TabsContent value="diligencias" className="w-full m-0 p-0">
                <TransactionList items={filteredTransactions.filter(t => t.category?.includes('Diligência') || t.category?.includes('Custas'))} />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      <Dialog open={isNewTitleOpen} onOpenChange={setIsNewTitleOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[700px] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                Novo Título Financeiro
              </DialogTitle>
              <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Lançamento manual de entrada ou saída para controle de caixa.</p>
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

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-6 opacity-30">
      <Calculator className="h-16 w-16 text-muted-foreground" />
      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center">Nenhum lançamento no radar</p>
    </div>
  )
}
