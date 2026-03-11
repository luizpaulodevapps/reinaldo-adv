
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
  MoreVertical,
  Edit3,
  Trash2,
  Wallet,
  Calendar,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { useToast } from "@/hooks/use-toast"
import { addMonths, format, parseISO } from "date-fns"

export default function BillingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState<any>(null)
  
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
    if (!transactions) return { entradas: 0, saídas: 0, saldo: 0, admin: 0, pendente: 0 }
    
    const entradas = transactions
      .filter(t => t.type?.includes('Entrada'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const saídas = transactions
      .filter(t => t.type?.includes('Saída'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const admin = transactions
      .filter(t => t.type?.includes('Saída') && (t.category?.includes('Aluguel') || t.category?.includes('Software') || t.category?.includes('Marketing')))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const pendente = transactions
      .filter(t => t.status === 'Pendente' && t.type?.includes('Entrada'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const saldo = entradas - saídas

    return { entradas, saídas, saldo, admin, pendente }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.processNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transactions, searchTerm])

  const handleOpenCreate = () => {
    setEditingTitle(null)
    setIsTitleDialogOpen(true)
  }

  const handleOpenEdit = (title: any) => {
    setEditingTitle(title)
    setIsTitleDialogOpen(true)
  }

  const handleSaveTitle = (data: any) => {
    if (!user || !db) return

    if (editingTitle) {
      updateDocumentNonBlocking(doc(db!, "financial_titles", editingTitle.id), {
        ...data,
        value: data.numericValue,
        updatedAt: serverTimestamp(),
      })
      toast({ title: "Registro Retificado", description: "O lançamento financeiro foi atualizado." })
    } else {
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
      toast({
        title: iterations > 1 ? "Ciclo Programado" : "Operação Concluída",
        description: `Lançamento injetado no fluxo de caixa RGMJ.`
      })
    }

    setIsTitleDialogOpen(false)
  }

  const handleDeleteTitle = (id: string) => {
    if (!db || !confirm("Confirmar a exclusão deste registro financeiro?")) return
    deleteDocumentNonBlocking(doc(db!, "financial_titles", id))
    toast({ variant: "destructive", title: "Lançamento Removido" })
  }

  const TransactionList = ({ items }: { items: any[] }) => (
    <div className="divide-y divide-white/5 w-full bg-white/[0.01]">
      {items.map((t) => (
        <div key={t.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all shadow-lg",
              t.type?.includes("Saída") ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            )}>
              {t.type?.includes("Saída") ? <ArrowDownRight className="h-7 w-7" /> : <ArrowUpRight className="h-7 w-7" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h4 className="font-black text-white uppercase text-base tracking-tight">{t.description}</h4>
                <Badge variant="outline" className="text-[9px] font-black border-white/10 text-muted-foreground uppercase">{t.category}</Badge>
              </div>
              <div className="flex items-center gap-6 mt-2">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 opacity-40" /> VENC: {t.dueDate}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 opacity-40" /> {t.clientName || t.entityName || "GERAL"}
                </p>
                {t.processNumber && (
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-2">
                    <Scale className="h-3.5 w-3.5" /> PROC: {t.processNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-10">
            <div className="text-right space-y-1">
              <div className={cn(
                "text-2xl font-black tabular-nums tracking-tighter",
                t.type?.includes("Saída") ? "text-rose-400" : "text-emerald-400"
              )}>
                {t.type?.includes("Saída") ? "-" : "+"} R$ {(Number(t.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <Badge 
                variant={t.status === 'Recebido' || t.status === 'Pago' ? 'default' : 'outline'}
                className={cn(
                  "text-[9px] font-black uppercase px-3 h-6 rounded-full border-0 shadow-inner", 
                  (t.status === 'Recebido' || t.status === 'Pago') ? "bg-emerald-500 text-white" : "bg-amber-500/10 text-amber-500"
                )}
              >
                {t.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-white border border-white/5 rounded-xl">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0d121f] border-white/10 text-white p-2 rounded-xl w-48 shadow-2xl">
                  <DropdownMenuItem onClick={() => handleOpenEdit(t)} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest h-10 rounded-lg">
                    <Edit3 className="h-4 w-4" /> Editar Lançamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteTitle(t.id)} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest h-10 rounded-lg text-rose-500 focus:text-rose-400">
                    <Trash2 className="h-4 w-4" /> Excluir Registro
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Calculator className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">CENTRAL FINANCEIRA</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Comando Financeiro</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
            CONTROLE 360º: HONORÁRIOS, DESPESAS E FLUXO DE CAIXA RGMJ.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por descrição, cliente ou processo..." 
              className="pl-12 glass border-white/10 h-14 text-sm text-white focus:ring-primary/50 rounded-xl font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleOpenCreate}
            className="gold-gradient text-background font-black gap-3 px-10 h-14 uppercase text-[11px] tracking-widest rounded-xl shadow-[0_20px_50px_rgba(245,208,48,0.2)] hover:scale-[1.02] transition-all"
          >
            <Plus className="h-5 w-5" /> NOVO LANÇAMENTO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="glass border-primary/20 bg-primary/5 relative overflow-hidden h-36 flex flex-col justify-center shadow-2xl rounded-2xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/50" />
          <CardContent className="p-8">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
              <TrendingUp className="h-4 w-4" /> SALDO OPERACIONAL
            </p>
            <div className={cn("text-3xl font-black tabular-nums tracking-tighter", stats.saldo >= 0 ? "text-white" : "text-rose-400")}>
              R$ {stats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 bg-white/[0.01] relative overflow-hidden h-36 flex flex-col justify-center rounded-2xl shadow-xl">
          <CardContent className="p-8">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
              <ArrowUpRight className="h-4 w-4" /> RECEITA BRUTA
            </p>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
              R$ {stats.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 bg-white/[0.01] relative overflow-hidden h-36 flex flex-col justify-center rounded-2xl shadow-xl">
          <CardContent className="p-8">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
              <ArrowDownRight className="h-4 w-4" /> TOTAL DESPESAS
            </p>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
              R$ {stats.saídas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-amber-500/20 bg-amber-500/5 relative overflow-hidden h-36 flex flex-col justify-center rounded-2xl shadow-xl">
          <CardContent className="p-8">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
              <AlertCircle className="h-4 w-4" /> RECEBÍVEL PENDENTE
            </p>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
              R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 bg-white/[0.01] relative overflow-hidden h-36 flex flex-col justify-center rounded-2xl shadow-xl">
          <CardContent className="p-8">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
              <Building2 className="h-4 w-4" /> CUSTO ESTRUTURA
            </p>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
              R$ {stats.admin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todos" className="space-y-0 shadow-2xl rounded-[2rem] overflow-hidden border border-white/5">
        <TabsList className="bg-[#0a0f1e] h-16 p-1.5 gap-1.5 w-full justify-start rounded-none border-b border-white/5 overflow-x-auto scrollbar-hide">
          <TabsTrigger value="todos" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-10 rounded-xl gap-3 transition-all tracking-widest">
            <Calculator className="h-4 w-4" /> TODOS OS LANÇAMENTOS
          </TabsTrigger>
          <TabsTrigger value="receitas" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-10 rounded-xl gap-3 transition-all tracking-widest">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" /> CONTAS A RECEBER
          </TabsTrigger>
          <TabsTrigger value="despesas" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-10 rounded-xl gap-3 transition-all tracking-widest">
            <ArrowDownRight className="h-4 w-4 text-rose-500" /> CONTAS A PAGAR
          </TabsTrigger>
          <TabsTrigger value="administrativo" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-10 rounded-xl gap-3 transition-all tracking-widest">
            <Building2 className="h-4 w-4" /> DESPESAS ADMIN
          </TabsTrigger>
          <TabsTrigger value="folha" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-10 rounded-xl gap-3 transition-all tracking-widest">
            <Users className="h-4 w-4" /> FOLHA DE PGTO
          </TabsTrigger>
        </TabsList>

        <div className="bg-[#05070a] min-h-[600px] relative overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">Auditando Fluxo Financeiro...</span>
            </div>
          ) : (
            <>
              <TabsContent value="todos" className="m-0 p-0 outline-none">
                {filteredTransactions.length > 0 ? <TransactionList items={filteredTransactions} /> : (
                  <div className="py-48 flex flex-col items-center justify-center space-y-8 opacity-20"><Calculator className="h-20 w-20" /><p className="text-sm font-black uppercase tracking-[0.5em]">Nenhum registro no radar</p></div>
                )}
              </TabsContent>
              
              <TabsContent value="receitas" className="m-0 p-0 outline-none">
                <TransactionList items={filteredTransactions.filter(t => t.type?.includes('Entrada'))} />
              </TabsContent>

              <TabsContent value="despesas" className="m-0 p-0 outline-none">
                <TransactionList items={filteredTransactions.filter(t => t.type?.includes('Saída'))} />
              </TabsContent>

              <TabsContent value="administrativo" className="m-0 p-0 outline-none">
                <TransactionList items={filteredTransactions.filter(t => t.type?.includes('Saída') && !t.category?.includes('Folha'))} />
              </TabsContent>

              <TabsContent value="folha" className="m-0 p-0 outline-none">
                <TransactionList items={filteredTransactions.filter(t => t.category?.includes('Folha'))} />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      <Dialog open={isTitleDialogOpen} onOpenChange={setIsTitleDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[850px] w-[95vw] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogHeader>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                    {editingTitle ? "Retificar Registro" : "Novo Lançamento Financeiro"}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-[10px] uppercase font-black tracking-[0.2em] mt-1.5 opacity-60">
                    GESTÃO DE CAIXA E DESPESAS OPERACIONAIS RGMJ.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[75vh]">
            <div className="p-10 bg-[#0a0f1e]/50">
              <FinancialTitleForm 
                initialData={editingTitle}
                onSubmit={handleSaveTitle} 
                onCancel={() => setIsTitleDialogOpen(false)} 
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
