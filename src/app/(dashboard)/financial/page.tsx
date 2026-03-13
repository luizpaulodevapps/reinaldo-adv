
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Calculator, 
  ChevronRight, 
  ChevronLeft,
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
  History,
  LayoutGrid
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
import { addMonths, format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function FinancialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewTitleOpen, setIsNewTitleOpen] = useState(false)
  const [selectedStaffMember, setSelectedStaffMember] = useState<any>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const db = useFirestore()
  const { user, role, profile } = useUser()
  const { toast } = useToast()

  const isAdmin = role === 'admin'

  const dateRange = useMemo(() => ({
    start: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
    end: format(endOfMonth(currentMonth), 'yyyy-MM-dd')
  }), [currentMonth])

  // Busca todos os títulos do mês se for admin, ou apenas os próprios se for advogado
  const financialQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    const baseRef = collection(db!, "financial_titles")
    
    if (isAdmin && !selectedStaffMember) {
      return query(
        baseRef, 
        where("dueDate", ">=", dateRange.start),
        where("dueDate", "<=", dateRange.end),
        orderBy("dueDate", "desc")
      )
    }
    
    const targetId = selectedStaffMember ? selectedStaffMember.id : user.uid
    return query(
      baseRef, 
      where("responsibleStaffId", "==", targetId),
      where("dueDate", ">=", dateRange.start),
      where("dueDate", "<=", dateRange.end),
      orderBy("dueDate", "desc")
    )
  }, [db, user, isAdmin, selectedStaffMember, dateRange])

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection(financialQuery)

  const staffQuery = useMemoFirebase(() => {
    if (!user || !db || !isAdmin) return null
    return query(collection(db!, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user, isAdmin])
  const { data: teamMembers, isLoading: isLoadingTeam } = useCollection(staffQuery)

  const isLoading = isLoadingTransactions || isLoadingTeam

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
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transactions, searchTerm])

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "financial_titles", id), {
      status: newStatus,
      updatedAt: serverTimestamp()
    })
    toast({ title: "Status Atualizado" })
  }

  const handleCreateTitle = (data: any) => {
    if (!user || !db) return
    const payload = {
      ...data,
      value: data.numericValue,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    delete payload.numericValue
    addDocumentNonBlocking(collection(db!, "financial_titles"), payload)
    setIsNewTitleOpen(false)
    toast({ title: "Operação Registrada" })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Wallet className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Controladoria de Repasses</span>
          </div>
          <div className="flex items-center gap-4">
            {selectedStaffMember && (
              <Button variant="ghost" size="icon" onClick={() => setSelectedStaffMember(null)} className="h-10 w-10 text-primary hover:bg-primary/10 rounded-full">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            )}
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              {selectedStaffMember ? selectedStaffMember.name : (isAdmin ? "Saldos de Repasse" : "Minha Carteira")}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/5">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-10 w-10 text-white hover:text-primary transition-colors"><ChevronLeft className="h-5 w-5" /></Button>
          <div className="px-4 text-center min-w-[140px]">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">{format(currentMonth, 'yyyy')}</p>
            <p className="text-xs font-black text-white uppercase tracking-tighter">{format(currentMonth, 'MMMM', { locale: ptBR })}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-10 w-10 text-white hover:text-primary transition-colors"><ChevronRight className="h-5 w-5" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass border-primary/20 bg-primary/5 p-6 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2"><Scale className="h-3.5 w-3.5" /> Honorários Ciclo</p>
          <div className="text-2xl font-black text-white tracking-tighter tabular-nums">R$ {stats.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-rose-500/20 bg-rose-500/5 p-6 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5" /> Pendente</p>
          <div className="text-2xl font-black text-white tracking-tighter tabular-nums">R$ {stats.pendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-6 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> Liquidado</p>
          <div className="text-2xl font-black text-white tracking-tighter tabular-nums">R$ {stats.liquidados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-white/5 p-6 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2"><Wallet className="h-3.5 w-3.5" /> Saldo Período</p>
          <div className="text-2xl font-black text-white tracking-tighter tabular-nums">R$ {stats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      {!selectedStaffMember && isAdmin ? (
        <Card className="glass border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-[#0a0f1e]/40 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Users className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Equipe & Saldos de Repasse</h3>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary font-black uppercase text-[10px] px-4 py-1.5 rounded-full tracking-widest">Soberania Financeira</Badge>
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
                    <div className="flex items-center gap-6 mb-10">
                      <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-2xl transition-transform group-hover:scale-110">
                        <AvatarFallback className="bg-[#1a1f2e] text-primary text-xl font-black uppercase">{member.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{member.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">{member.role} • {member.paymentType}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 mb-10">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Pendente</p>
                        <p className="text-2xl font-black text-rose-500 tabular-nums tracking-tighter">R$ {member.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Liquidado</p>
                        <p className="text-2xl font-black text-emerald-500 tabular-nums tracking-tighter">R$ {member.liquidated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-primary/40 group-hover:text-primary transition-all">
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                        <History className="h-4 w-4" /> Abrir Extrato
                      </div>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-48 text-center opacity-20"><Users className="h-20 w-20 mx-auto mb-6" /><p className="text-[10px] font-black uppercase tracking-[0.5em]">Nenhuma atividade no ciclo</p></div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="glass border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-[#0a0f1e]/40 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <History className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Extrato de Movimentação</h3>
            </div>
            <div className="flex gap-3">
              <Input placeholder="Filtrar lançamentos..." className="h-10 bg-black/40 border-white/10 text-xs w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              {isAdmin && <Button onClick={() => setIsNewTitleOpen(true)} className="gold-gradient text-background font-black h-10 px-6 uppercase text-[10px] tracking-widest rounded-lg shadow-lg"><Plus className="h-4 w-4" /></Button>}
            </div>
          </div>
          <div className="divide-y divide-white/5 min-h-[400px]">
            {isLoadingTransactions ? (
              <div className="py-32 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map(t => (
                <div key={t.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/[0.01] transition-all gap-6">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg",
                      t.type?.includes("Saída") ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    )}><Scale className="h-6 w-6" /></div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight">{t.description}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{t.dueDate} • {t.clientName || "GERAL"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className={cn("text-xl font-black tabular-nums tracking-tighter", t.type?.includes("Saída") ? "text-rose-400" : "text-emerald-400")}>
                        {t.type?.includes("Saída") ? "-" : "+"} R$ {(Number(t.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge className={cn("text-[8px] font-black uppercase h-5 mt-1", t.status === 'Pendente' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500")}>{t.status}</Badge>
                    </div>
                    {isAdmin && t.status === 'Pendente' && (
                      <div className="flex gap-2 pl-6 border-l border-white/5">
                        <Button size="icon" variant="outline" className="h-9 w-9 rounded-lg text-emerald-500" onClick={() => handleUpdateStatus(t.id, 'Liquidado')}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="outline" className="h-9 w-9 rounded-lg text-rose-500" onClick={() => handleUpdateStatus(t.id, 'Cancelado')}><X className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-32 text-center opacity-20 space-y-4"><Handshake className="h-16 w-16 mx-auto" /><p className="text-[10px] font-black uppercase tracking-[0.4em]">Agenda limpa para este ciclo</p></div>
            )}
          </div>
        </Card>
      )}

      <Dialog open={isNewTitleOpen} onOpenChange={setIsNewTitleOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[750px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl"><DialogHeader><DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Lançamento de Repasse</DialogTitle></DialogHeader></div>
          <ScrollArea className="max-h-[70vh]"><div className="p-10 bg-[#0a0f1e]/50"><FinancialTitleForm onSubmit={handleCreateTitle} onCancel={() => setIsNewTitleOpen(false)} /></div></ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
