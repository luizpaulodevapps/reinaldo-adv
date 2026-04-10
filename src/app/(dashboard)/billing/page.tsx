
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
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, limit, where } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfWeek, endOfWeek, subDays, startOfDay, addDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type CycleMode = "monthly" | "biweekly" | "weekly"

export default function BillingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState<any>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [cycleMode, setCycleMode] = useState<CycleMode>("monthly")
  const [quickFilter, setQuickFilter] = useState<{type?: string, status?: string} | null>(null)
  
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
    if (!transactions) return { entradas: 0, saídas: 0, saldo: 0, pendenteEntrada: 0, pendenteSaída: 0, previsao: 0 }
    
    const entradas = transactions.filter(t => t.type?.includes('Entrada')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
    const saídas = transactions.filter(t => t.type?.includes('Saída')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
    const pendenteEntrada = transactions.filter(t => t.status === 'Pendente' && t.type?.includes('Entrada')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
    const pendenteSaída = transactions.filter(t => t.status === 'Pendente' && t.type?.includes('Saída')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    return { 
      entradas, 
      saídas, 
      saldo: entradas - saídas, 
      pendenteEntrada,
      pendenteSaída,
      previsao: (entradas + pendenteEntrada) - (saídas + pendenteSaída)
    }
  }, [transactions])

  const teamBalanceList = useMemo(() => {
    if (!teamMembers || !transactions || !isAdmin || selectedStaffMember) return []
    // Para a lista de equipe, calculamos os saldos baseados nos lançamentos totais daquele membro
    return teamMembers.map(member => {
      const email = member.id?.toLowerCase().trim()
      const memberTrans = (transactions || []).filter(t => 
        t.responsibleStaffId?.toLowerCase().trim() === email || 
        t.responsibleStaffName === member.name
      )
      
      // Nas carteiras de repasse, o "Pendente" do advogado é o que o escritório tem como "Saída Pendente" para ele
      const pending = memberTrans
        .filter(t => t.status === 'Pendente' && t.type?.includes('Saída') && t.category?.includes('REPASSE'))
        .reduce((acc, t) => acc + (Number(t.value) || 0), 0)
        
      const liquidated = memberTrans
        .filter(t => (t.status === 'Liquidado' || t.status === 'Pago') && t.type?.includes('Saída') && t.category?.includes('REPASSE'))
        .reduce((acc, t) => acc + (Number(t.value) || 0), 0)
        
      return { ...member, pending, liquidated }
    })
  }, [teamMembers, transactions, isAdmin, selectedStaffMember])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    let result = transactions.filter(t => 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.entityName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (quickFilter) {
      if (quickFilter.type) result = result.filter(t => t.type?.includes(quickFilter.type!))
      if (quickFilter.status) result = result.filter(t => t.status === quickFilter.status)
    }

    return result
  }, [transactions, searchTerm, quickFilter])

  const chartData = useMemo(() => {
    if (!transactions) return []
    const days: Record<string, any> = {}
    
    // Inicializa todos os dias do período para não ter buracos no gráfico
    const start = parseISO(dateRange.start)
    const end = parseISO(dateRange.end)
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const dayKey = format(d, 'dd/MM')
      days[dayKey] = { name: dayKey, Entradas: 0, Saídas: 0, Saldo: 0 }
    }

    transactions.forEach(t => {
      const dayKey = format(parseISO(t.dueDate), 'dd/MM')
      if (days[dayKey]) {
        if (t.type?.includes('Entrada')) days[dayKey].Entradas += Number(t.value) || 0
        else days[dayKey].Saídas += Number(t.value) || 0
        days[dayKey].Saldo = days[dayKey].Entradas - days[dayKey].Saídas
      }
    })

    return Object.values(days)
  }, [transactions, dateRange])

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return
    
    const title = transactions?.find(t => t.id === id)

    updateDocumentNonBlocking(doc(db, "financial_titles", id), {
      status: newStatus,
      updatedAt: serverTimestamp()
    })

    // Notificação de Liquidação
    if (newStatus === 'Liquidado' && title && title.responsibleStaffId) {
      addDocumentNonBlocking(collection(db, "notifications"), {
        userId: title.responsibleStaffId,
        title: "Repasse Liberado",
        message: `O título ${title.description.toUpperCase()} foi marcado como liquidado.`,
        type: "financial",
        severity: "info",
        read: false,
        link: "/financial",
        createdAt: serverTimestamp()
      })
    }

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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card 
          onClick={() => setQuickFilter(null)}
          className={cn(
            "glass p-6 rounded-2xl flex flex-col justify-center shadow-2xl relative overflow-hidden group cursor-pointer transition-all border-white/5",
            !quickFilter ? "border-primary/40 bg-primary/10" : "hover:border-white/20"
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Landmark className="h-8 w-8" /></div>
          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">Fluxo Global</p>
          <div className={cn("text-2xl font-black tabular-nums tracking-tighter", stats.saldo >= 0 ? "text-white" : "text-rose-400")}>R$ {stats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card 
          onClick={() => setQuickFilter({type: 'Entrada'})}
          className={cn(
            "glass p-6 rounded-2xl flex flex-col justify-center shadow-xl cursor-pointer transition-all border-white/5",
            quickFilter?.type === 'Entrada' ? "border-emerald-500/40 bg-emerald-500/10" : "hover:border-white/20"
          )}
        >
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">Receita Bruto</p>
          <div className="text-2xl font-black text-white tabular-nums tracking-tighter">R$ {stats.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card 
          onClick={() => setQuickFilter({type: 'Saída'})}
          className={cn(
            "glass p-6 rounded-2xl flex flex-col justify-center shadow-xl cursor-pointer transition-all border-white/5",
            quickFilter?.type === 'Saída' ? "border-rose-500/40 bg-rose-500/10" : "hover:border-white/20"
          )}
        >
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">Custo Operacional</p>
          <div className="text-2xl font-black text-white tabular-nums tracking-tighter">R$ {stats.saídas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card 
          onClick={() => setQuickFilter({status: 'Pendente'})}
          className={cn(
            "glass p-6 rounded-2xl flex flex-col justify-center shadow-xl cursor-pointer transition-all border-white/5",
            quickFilter?.status === 'Pendente' ? "border-amber-500/40 bg-amber-500/10" : "hover:border-white/20"
          )}
        >
          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">Pendente Receber</p>
          <div className="text-2xl font-black text-white tabular-nums tracking-tighter">R$ {stats.pendenteEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card 
          className="glass border-cyan-500/20 bg-cyan-500/5 p-6 rounded-2xl flex flex-col justify-center shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10"><Target className="h-8 w-8 text-cyan-500" /></div>
          <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-2">Saúde de Ciclo</p>
          <div className="text-2xl font-black text-white tabular-nums tracking-tighter">R$ {stats.previsao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black/20 p-10">
        <div className="flex items-center justify-between mb-10">
           <div className="flex items-center gap-4">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Fluxo de Caixa Consolidado</h3>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500/50" /><span className="text-[8px] font-black text-white/40 uppercase">Entradas</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500/50" /><span className="text-[8px] font-black text-white/40 uppercase">Saídas</span></div>
           </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSaídas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#ffffff40', fontWeight: 'bold'}} />
              <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#ffffff40', fontWeight: 'bold'}} tickFormatter={(v) => `R$ ${v}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0f1e', border: '1px solid #ffffff10', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                labelStyle={{ color: '#ffffff40', fontSize: '9px', fontWeight: '900', marginBottom: '8px' }}
              />
              <Area type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorEntradas)" />
              <Area type="monotone" dataKey="Saídas" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorSaídas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-10">Lançamento / Info</th>
                <th className="p-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Categoria</th>
                <th className="p-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Vencimento</th>
                <th className="p-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Cliente / Ente</th>
                <th className="p-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-right pr-10">Valor Bruto</th>
                <th className="p-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoadingTransactions ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6 pl-10">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border",
                          t.type?.includes("Saída") ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        )}><DollarSign className="h-5 w-5" /></div>
                        <div>
                          <p className="text-[11px] font-black text-white uppercase tracking-tight">{t.description}</p>
                          <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest opacity-40">ID: {t.id.slice(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6"><Badge variant="outline" className="text-[9px] font-black border-white/10 text-muted-foreground uppercase px-3">{t.category}</Badge></td>
                    <td className="p-6 text-[10px] font-black text-white/60 font-mono">{t.dueDate}</td>
                    <td className="p-6 text-[10px] font-black text-primary/70 uppercase truncate max-w-[200px]">{t.clientName || t.entityName || "GERAL"}</td>
                    <td className="p-6 text-right pr-10">
                       <p className={cn("text-sm font-black tabular-nums", t.type?.includes("Saída") ? "text-rose-400" : "text-emerald-400")}>
                        {t.type?.includes("Saída") ? "-" : "+"} R$ {(Number(t.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                       </p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center">
                        <Badge className={cn(
                          "text-[8px] font-black uppercase h-5 px-3 border-0", 
                          t.status === 'Pendente' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                        )}>{t.status}</Badge>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="py-32 text-center opacity-20 text-[10px] font-black uppercase tracking-widest italic">Silêncio no fluxo de caixa...</td></tr>
              )}
            </tbody>
          </table>
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
                onSubmit={async (data) => {
                  if(editingTitle) {
                    const ref = doc(db!, "financial_titles", editingTitle.id);
                    updateDocumentNonBlocking(ref, {...data, value: data.numericValue, updatedAt: serverTimestamp()});
                  } else {
                    const ref = await addDocumentNonBlocking(collection(db!, "financial_titles"), {...data, value: data.numericValue, createdAt: serverTimestamp(), updatedAt: serverTimestamp()});
                    
                    // Notificação de Novo Lançamento para o Responsável
                    if (data.responsibleStaffId) {
                      addDocumentNonBlocking(collection(db!, "notifications"), {
                        userId: data.responsibleStaffId,
                        title: "Novo Título Vinculado",
                        message: `Um lançamento de R$ ${data.numericValue.toLocaleString('pt-BR')} foi atribuído à sua carteira.`,
                        type: "financial",
                        severity: "info",
                        read: false,
                        link: "/financial",
                        createdAt: serverTimestamp()
                      })
                    }
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
