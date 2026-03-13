
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
  Wallet,
  Handshake,
  CheckCircle2,
  Scale,
  Calendar,
  AlertCircle,
  Zap,
  ArrowRightLeft,
  Landmark,
  ArrowLeft,
  Filter,
  Check,
  X,
  User as UserIcon,
  CreditCard,
  History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, where, doc } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { useToast } from "@/hooks/use-toast"
import { addMonths, format, parseISO } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function FinancialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewTitleOpen, setIsNewTitleOpen] = useState(false)
  const [selectedStaffMember, setSelectedStaffMember] = useState<any>(null)
  
  const db = useFirestore()
  const { user, role, profile } = useUser()
  const { toast } = useToast()

  const isAdmin = role === 'admin'

  // Busca todos os títulos se for admin, ou apenas os próprios se for advogado
  const financialQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    if (isAdmin && !selectedStaffMember) {
      return query(collection(db!, "financial_titles"), orderBy("dueDate", "desc"))
    }
    // Se for admin vendo um específico ou se for usuário comum vendo a própria carteira
    const targetId = selectedStaffMember ? selectedStaffMember.id : user.uid
    return query(
      collection(db!, "financial_titles"), 
      where("responsibleStaffId", "==", targetId),
      orderBy("dueDate", "desc")
    )
  }, [db, user, isAdmin, selectedStaffMember])

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection(financialQuery)

  // Busca todos os perfis da equipe para a lista master (apenas admin)
  const staffQuery = useMemoFirebase(() => {
    if (!user || !db || !isAdmin) return null
    return query(collection(db!, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user, isAdmin])
  const { data: teamMembers, isLoading: isLoadingTeam } = useCollection(staffQuery)

  const isLoading = isLoadingTransactions || isLoadingTeam

  // Cálculo de estatísticas globais ou do membro selecionado
  const stats = useMemo(() => {
    if (!transactions) return { entradas: 0, saidas: 0, saldo: 0, pendentes: 0, liquidados: 0 }
    
    const relevantTransactions = transactions.filter(t => 
      !selectedStaffMember || t.responsibleStaffId === selectedStaffMember.id
    )

    const entradas = relevantTransactions
      .filter(t => t.type?.includes('Entrada'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const saidas = relevantTransactions
      .filter(t => t.type?.includes('Saída'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const pendentes = relevantTransactions
      .filter(t => t.status === 'Pendente')
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const liquidados = relevantTransactions
      .filter(t => t.status === 'Liquidado' || t.status === 'Pago' || t.status === 'Recebido')
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    return { entradas, saidas, saldo: entradas - saidas, pendentes, liquidados }
  }, [transactions, selectedStaffMember])

  // Processamento da lista de membros com saldos (Visão Master)
  const teamBalanceList = useMemo(() => {
    if (!teamMembers || !transactions || !isAdmin) return []
    
    return teamMembers.map(member => {
      const memberTrans = transactions.filter(t => t.responsibleStaffId === member.id)
      const pending = memberTrans.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + (Number(t.value) || 0), 0)
      const liquidated = memberTrans.filter(t => t.status === 'Liquidado' || t.status === 'Pago').reduce((acc, t) => acc + (Number(t.value) || 0), 0)
      
      return {
        ...member,
        pending,
        liquidated
      }
    })
  }, [teamMembers, transactions, isAdmin])

  const filteredTeam = useMemo(() => {
    return teamBalanceList.filter(m => 
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [teamBalanceList, searchTerm])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.processNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transactions, searchTerm])

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "financial_titles", id), {
      status: newStatus,
      updatedAt: serverTimestamp()
    })
    toast({ 
      title: newStatus === 'Liquidado' ? "Pagamento Processado" : "Título Cancelado",
      description: `O status do lançamento foi atualizado para ${newStatus}.`
    })
  }

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

  const TransactionCard = ({ t }: { t: any }) => (
    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/[0.02] transition-all border-b border-white/5 last:border-0 group gap-6">
      <div className="flex items-start gap-6">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-110",
          t.type?.includes("Saída") ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
        )}>
          {t.category?.includes("Honorários") ? <Scale className="h-6 w-6" /> : <Handshake className="h-6 w-6" />}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h4 className="font-bold text-white uppercase text-sm tracking-tight">{t.description}</h4>
            <Badge variant="outline" className="text-[8px] border-white/10 text-muted-foreground uppercase font-black">{t.category}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
              <Calendar className="h-3 w-3 opacity-40 text-primary" /> VENC: {t.dueDate}
            </p>
            <p className="text-[9px] text-primary font-black uppercase tracking-widest flex items-center gap-2">
              <Users className="h-3 w-3 opacity-40" /> {t.clientName || "GERAL"}
            </p>
            {t.originBank && (
              <p className="text-[9px] text-white/30 uppercase font-bold flex items-center gap-2">
                <Landmark className="h-3 w-3" /> DE: {t.originBank}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="text-right">
          <div className={cn(
            "text-xl font-black tabular-nums tracking-tighter",
            t.type?.includes("Saída") ? "text-rose-400" : "text-emerald-400"
          )}>
            {t.type?.includes("Saída") ? "-" : "+"} R$ {(Number(t.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <Badge className={cn(
            "text-[8px] font-black uppercase h-5 px-2 border-0 mt-1",
            t.status === 'Liquidado' || t.status === 'Pago' ? "bg-emerald-500/10 text-emerald-500" : t.status === 'Cancelado' ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
          )}>
            {t.status}
          </Badge>
        </div>

        {isAdmin && t.status === 'Pendente' && (
          <div className="flex items-center gap-2 pl-6 border-l border-white/5">
            <Button 
              size="icon" 
              variant="outline" 
              className="h-9 w-9 rounded-lg border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white"
              onClick={() => handleUpdateStatus(t.id, 'Liquidado')}
              title="Processar Pagamento"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              className="h-9 w-9 rounded-lg border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white"
              onClick={() => handleUpdateStatus(t.id, 'Cancelado')}
              title="Reprovar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto pb-20">
      {/* HEADER DE COMANDO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Wallet className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-primary transition-colors uppercase">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">
              {isAdmin ? "CONTROLADORIA DE REPASSES" : "MEU EXTRATO FINANCEIRO"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {selectedStaffMember && (
              <Button variant="ghost" size="icon" onClick={() => setSelectedStaffMember(null)} className="h-10 w-10 text-primary hover:bg-primary/10 rounded-full mr-2">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            )}
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
              {selectedStaffMember ? selectedStaffMember.name.split(' ')[0] : (isAdmin ? "Controladoria de Repasses" : "Minha Carteira")}
            </h1>
          </div>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
            {isAdmin ? "GESTÃO INTEGRADA DE HONORÁRIOS E CRÉDITOS DE EQUIPE." : "HISTÓRICO INDIVIDUAL DE HONORÁRIOS E REMUNERAÇÃO RGMJ."}
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar em lançamentos..." 
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

      {/* MÉTRICAS DE COMANDO */}
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
            R$ {stats.liquidados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

      {/* CONTEÚDO PRINCIPAL: LISTA MASTER OU DOSSIÊ INDIVIDUAL */}
      {!selectedStaffMember && isAdmin ? (
        <Card className="glass border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Users className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-black text-white uppercase tracking-widest">Equipe & Saldos de Repasse</h3>
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[10px] px-4 py-1 h-8">Soberania Financeira</Badge>
          </div>
          
          <div className="min-h-[500px]">
            {isLoading ? (
              <div className="py-32 flex flex-col items-center justify-center space-y-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">Auditando Carteiras...</span>
              </div>
            ) : filteredTeam.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-white/5">
                {filteredTeam.map(member => (
                  <div 
                    key={member.id} 
                    onClick={() => setSelectedStaffMember(member)}
                    className="p-10 hover:bg-white/[0.02] transition-all group cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity"><CreditCard className="h-20 w-20" /></div>
                    <div className="flex items-center gap-6 mb-8">
                      <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-2xl group-hover:scale-110 transition-transform">
                        <AvatarFallback className="bg-[#1a1f2e] text-primary text-xl font-black uppercase">{member.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{member.name}</h4>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">{member.role} • {member.paymentType}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                      <div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Pendente</p>
                        <p className="text-lg font-black text-rose-400 tabular-nums">R$ {member.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Liquidado</p>
                        <p className="text-lg font-black text-emerald-400 tabular-nums">R$ {member.liquidated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">
                        <History className="h-3.5 w-3.5" /> Abrir Extrato
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-48 text-center opacity-20 space-y-8">
                <Users className="h-20 w-20 mx-auto" />
                <p className="text-xs font-black uppercase tracking-[0.5em]">Nenhum membro vinculado na rede</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="glass border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Wallet className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-black text-white uppercase tracking-widest">
                {selectedStaffMember ? `Dossiê Individual: ${selectedStaffMember.name}` : "Dossiê de Minhas Movimentações"}
              </h3>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 h-10 px-6 rounded-lg border border-primary/20">
                <Printer className="h-4 w-4 mr-2" /> Gerar Comprovante
              </Button>
            </div>
          </div>
          <div className="min-h-[500px]">
            {isLoadingTransactions ? (
              <div className="py-32 flex flex-col items-center justify-center space-y-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">Auditando Extrato...</span>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredTransactions.map(t => <TransactionCard key={t.id} t={t} />)}
              </div>
            ) : (
              <div className="py-48 flex flex-col items-center justify-center space-y-8 opacity-20 text-center">
                <Handshake className="h-20 w-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] max-w-xs leading-loose">NENHUM LANÇAMENTO REGISTRADO PARA ESTE PERFIL</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* DIÁLOGO DE LANÇAMENTO */}
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
