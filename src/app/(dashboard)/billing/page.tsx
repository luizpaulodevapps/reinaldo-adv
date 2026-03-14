
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  Building2,
  Wallet,
  Calendar,
  AlertCircle,
  DollarSign,
  Landmark,
  Handshake,
  TrendingUp,
  CalendarDays,
  Target,
  History,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, limit, where } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfWeek, endOfWeek, subDays, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type CycleMode = "monthly" | "biweekly" | "weekly"

export default function BillingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState<any>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [cycleMode, setCycleMode] = useState<CycleMode>("monthly")
  
  // Estado para Auditoria de Membro Específico
  const [selectedStaffMember, setSelectedStaffMember] = useState<any>(null)
  
  const db = useFirestore()
  const { user, profile, role } = useUser()
  const { toast } = useToast()

  const isAdmin = role === 'admin'

  // Engenharia de Ciclos de Data
  const dateRange = useMemo(() => {
    const today = startOfDay(new Date())
    if (cycleMode === "weekly") {
      return {
        start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      }
    }
    if (cycleMode === "biweekly") {
      return {
        start: format(subDays(today, 15), 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd')
      }
    }
    return {
      start: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      end: format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    }
  }, [currentMonth, cycleMode])

  // Busca financeira global ou filtrada por membro da equipe
  const financialQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    let q = query(
      collection(db!, "financial_titles"), 
      where("dueDate", ">=", dateRange.start),
      where("dueDate", "<=", dateRange.end),
      orderBy("dueDate", "desc")
    )

    if (selectedStaffMember) {
      q = query(q, where("responsibleStaffId", "==", selectedStaffMember.id))
    }

    return q
  }, [db, user, dateRange, selectedStaffMember])

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection(financialQuery)

  // Busca equipe para o dashboard de repasses
  const staffQuery = useMemoFirebase(() => {
    if (!user || !db || !isAdmin) return null
    return query(collection(db!, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user, isAdmin])
  const { data: teamMembers } = useCollection(staffQuery)

  const stats = useMemo(() => {
    if (!transactions) return { entradas: 0, saídas: 0, saldo: 0, pendente: 0 }
    
    const entradas = transactions.filter(t => t.type?.includes('Entrada')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
    const saídas = transactions.filter(t => t.type?.includes('Saída')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
    const pendente = transactions.filter(t => t.status === 'Pendente' && t.type?.includes('Entrada')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    return { entradas, saídas, saldo: entradas - saídas, pendente }
  }, [transactions])

  const teamBalanceList = useMemo(() => {
    if (!teamMembers || !transactions || !isAdmin || selectedStaffMember) return []
    // Para a lista de equipe, calculamos os saldos baseados nos lançamentos totais daquele membro
    return teamMembers.map(member => {
      const memberTrans = (transactions || []).filter(t => t.responsibleStaffId === member.id)
      const pending = memberTrans.filter(t => t.status === 'Pendente' && t.type?.includes('Entrada')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
      const liquidated = memberTrans.filter(t => (t.status === 'Liquidado' || t.status === 'Recebido') && t.type?.includes('Entrada')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
      return { ...member, pending, liquidated }
    })
  }, [teamMembers, transactions, isAdmin, selectedStaffMember])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.entityName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transactions, searchTerm])

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "financial_titles", id), {
      status: newStatus,
      updatedAt: serverTimestamp()
    })
    toast({ title: "Título Atualizado" })
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Calculator className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Soberania Financeira</span>
          </div>
          <div className="flex items-center gap-4">
            {selectedStaffMember && (
              <Button variant="ghost" size="icon" onClick={() => setSelectedStaffMember(null)} className="h-10 w-10 text-primary hover:bg-primary/10 rounded-full">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            )}
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
              {selectedStaffMember ? `Extrato: ${selectedStaffMember.name}` : "Caixa da Banca"}
            </h1>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="bg-white/5 p-1 rounded-xl border border-white/5 flex gap-1">
            {['weekly', 'biweekly', 'monthly'].map(c => (
              <button
                key={c}
                onClick={() => setCycleMode(c as CycleMode)}
                className={cn(
                  "px-4 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                  cycleMode === c ? "bg-primary text-background shadow-lg" : "text-muted-foreground hover:text-white"
                )}
              >
                {c === 'weekly' ? 'SEMANAL' : c === 'biweekly' ? 'QUINZENAL' : 'MENSAL'}
              </button>
            ))}
          </div>

          {cycleMode === "monthly" && (
            <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/5 shadow-xl">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-10 w-10 text-white hover:text-primary transition-colors"><ChevronLeft className="h-5 w-5" /></Button>
              <div className="px-4 text-center min-w-[140px]">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">{format(currentMonth, 'yyyy')}</p>
                <p className="text-xs font-black text-white uppercase tracking-tighter">{format(currentMonth, 'MMMM', { locale: ptBR })}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-10 w-10 text-white hover:text-primary transition-colors"><ChevronRight className="h-5 w-5" /></Button>
            </div>
          )}
          
          <Button onClick={() => { setEditingTitle(null); setIsTitleDialogOpen(true); }} className="gold-gradient text-background font-black gap-3 px-10 h-14 uppercase text-[11px] rounded-xl shadow-xl hover:scale-[1.02] transition-all">
            <Plus className="h-5 w-5" /> NOVO LANÇAMENTO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass border-primary/20 bg-primary/5 p-8 rounded-[2rem] flex flex-col justify-center shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Landmark className="h-12 w-12" /></div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-3"><TrendingUp className="h-3.5 w-3.5" /> Patrimônio Líquido</p>
          <div className={cn("text-3xl font-black tabular-nums tracking-tighter", stats.saldo >= 0 ? "text-white" : "text-rose-400")}>R$ {stats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <p className="text-[8px] text-primary/40 font-bold uppercase mt-1 tracking-widest">Saldo real em caixa no ciclo</p>
        </Card>
        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-8 rounded-[2rem] flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-3"><ArrowUpRight className="h-3.5 w-3.5" /> Receita Bruta</p>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-rose-500/20 bg-rose-500/5 p-8 rounded-[2rem] flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-3"><ArrowDownRight className="h-3.5 w-3.5" /> Custo Operacional</p>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.saídas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-white/5 p-8 rounded-[2rem] flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-3"><AlertCircle className="h-3.5 w-3.5" /> Pendente Receber</p>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      {/* SEÇÃO DE EQUIPE (EXCLUSIVA ADMIN NA BANCA) */}
      {isAdmin && !selectedStaffMember && (
        <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black/20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="p-8 border-b border-white/5 bg-[#0a0f1e]/40 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <History className="h-6 w-6 text-primary" />
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Equipe & Carteiras de Repasse</h3>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary font-black uppercase text-[9px] px-4 py-1.5 rounded-full tracking-widest">Auditoria em Lote</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-white/5 border-t border-white/5">
            {teamBalanceList.map(member => (
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
                    <History className="h-4 w-4" /> Ver Extrato Completo
                  </div>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* HISTÓRICO DE FLUXO DE CAIXA (GLOBAL OU DO MEMBRO SELECIONADO) */}
      <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black/20">
        <div className="p-10 border-b border-white/5 bg-[#0a0f1e]/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl">
              <Target className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                {selectedStaffMember ? `Lançamentos: ${selectedStaffMember.name}` : "Histórico de Fluxo de Caixa"}
              </h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-2 opacity-40">LANÇAMENTOS OFICIAIS DO ECOSSISTEMA RGMJ.</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input placeholder="Filtrar por cliente, fornecedor ou descrição..." className="h-12 bg-black/40 border-white/10 text-xs w-96 pl-12 rounded-xl text-white font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="divide-y divide-white/5 min-h-[500px]">
          {isLoadingTransactions ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Livro Diário...</span>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="bg-black/10">
              {filteredTransactions.map(t => (
                <div key={t.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/[0.02] transition-all gap-8 border-b border-white/5 last:border-0 group">
                  <div className="flex items-center gap-8">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl transition-transform group-hover:scale-110",
                      t.type?.includes("Saída") ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    )}><DollarSign className="h-7 w-7" /></div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h4 className="font-black text-white uppercase text-lg tracking-tight">{t.description}</h4>
                        <Badge variant="outline" className="text-[9px] font-black border-white/10 text-muted-foreground uppercase px-3 h-6">{t.category}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-10 gap-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2.5">
                          <CalendarDays className="h-3.5 w-3.5 opacity-40 text-primary" /> VENC: {t.dueDate}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2.5">
                          <Building2 className="h-3.5 w-3.5 opacity-40 text-primary" /> {t.clientName || t.entityName || "GERAL"}
                        </p>
                        {t.destinationBank && (
                          <p className="text-[9px] text-emerald-500 font-bold uppercase flex items-center gap-2">
                            <Landmark className="h-3.5 w-3.5" /> CRÉDITO: {t.destinationBank}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <p className={cn("text-2xl font-black tabular-nums tracking-tighter", t.type?.includes("Saída") ? "text-rose-400" : "text-emerald-400")}>
                        {t.type?.includes("Saída") ? "-" : "+"} R$ {(Number(t.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge className={cn(
                        "text-[9px] font-black uppercase h-6 mt-2 px-3 border-0", 
                        t.status === 'Pendente' ? "bg-amber-500/10 text-amber-500" : 
                        t.status === 'Pago' || t.status === 'Recebido' || t.status === 'Liquidado' ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-muted-foreground"
                      )}>
                        {t.status}
                      </Badge>
                    </div>
                    {isAdmin && t.status === 'Pendente' && (
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(t.id, t.type.includes('Entrada') ? 'Recebido' : 'Pago')} className="h-10 w-10 text-emerald-500 hover:bg-emerald-500/10 rounded-xl"><Plus className="h-5 w-5" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-48 flex flex-col items-center justify-center opacity-20 space-y-6 text-center">
              <Landmark className="h-24 w-24 mx-auto" />
              <p className="text-sm font-black uppercase tracking-[0.5em]">Nenhuma atividade financeira no ciclo {cycleMode.toUpperCase()}.</p>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={isTitleDialogOpen} onOpenChange={setIsTitleDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[850px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-[2.5rem]">
          <div className="p-10 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Lançamento de Caixa</DialogTitle>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[75vh]">
            <div className="p-10 bg-[#0a0f1e]/50">
              <FinancialTitleForm 
                initialData={editingTitle} 
                onSubmit={(data) => {
                  if(editingTitle) {
                    const ref = doc(db!, "financial_titles", editingTitle.id);
                    updateDocumentNonBlocking(ref, {...data, value: data.numericValue, updatedAt: serverTimestamp()});
                  } else {
                    addDocumentNonBlocking(collection(db!, "financial_titles"), {...data, value: data.numericValue, createdAt: serverTimestamp(), updatedAt: serverTimestamp()});
                  }
                  setIsTitleDialogOpen(false);
                  toast({title: "Fluxo de Caixa Atualizado"});
                }} 
                onCancel={() => setIsTitleDialogOpen(false)} 
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
