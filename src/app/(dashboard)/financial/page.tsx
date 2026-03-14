
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
  Wallet,
  CheckCircle2,
  Scale,
  Calendar,
  AlertCircle,
  ArrowRightLeft,
  Landmark,
  ArrowLeft,
  Check,
  X,
  History,
  LayoutGrid,
  CalendarDays,
  Target,
  User as UserIcon,
  Handshake
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, where, doc } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { useToast } from "@/hooks/use-toast"
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfWeek, endOfWeek, subDays, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"

type CycleMode = "monthly" | "biweekly" | "weekly"

export default function FinancialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewTitleOpen, setIsNewTitleOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [cycleMode, setCycleMode] = useState<CycleMode>("monthly")
  
  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

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

  // Visão Privativa: O usuário vê APENAS os seus próprios repasses
  const financialQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db!, "financial_titles"), 
      where("responsibleStaffId", "==", user.uid),
      where("dueDate", ">=", dateRange.start),
      where("dueDate", "<=", dateRange.end),
      orderBy("dueDate", "desc")
    )
  }, [db, user, dateRange])

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection(financialQuery)

  const stats = useMemo(() => {
    if (!transactions) return { entradas: 0, pendentes: 0, liquidados: 0 }
    
    const entradas = transactions
      .filter(t => t.type?.includes('Entrada'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const pendentes = transactions
      .filter(t => t.status === 'Pendente' && t.type?.includes('Entrada'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    const liquidados = transactions
      .filter((t) => (t.status === 'Liquidado' || t.status === 'Recebido' || t.status === 'Pago') && t.type?.includes('Entrada'))
      .reduce((acc, t) => acc + (Number(t.value) || 0), 0)

    return { entradas, pendentes, liquidados }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transactions, searchTerm])

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Wallet className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Minha Carteira Digital</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Extrato de Honorários</h1>
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass border-primary/20 bg-primary/5 p-8 rounded-3xl flex flex-col justify-center shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Scale className="h-12 w-12" /></div>
          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-3"><Scale className="h-3.5 w-3.5" /> Honorários Acumulados</p>
          <div className="text-3xl font-black text-white tracking-tighter tabular-nums">R$ {stats.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-rose-500/20 bg-rose-500/5 p-8 rounded-3xl flex flex-col justify-center shadow-xl">
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-3"><AlertCircle className="h-3.5 w-3.5" /> Saldo Pendente</p>
          <div className="text-3xl font-black text-rose-400 tracking-tighter tabular-nums">R$ {stats.pendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-8 rounded-3xl flex flex-col justify-center shadow-xl">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-3"><CheckCircle2 className="h-3.5 w-3.5" /> Total Pago/Recebido</p>
          <div className="text-3xl font-black text-white tracking-tighter tabular-nums">R$ {stats.liquidados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-white/5 p-8 rounded-3xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-3"><UserIcon className="h-3.5 w-3.5" /> Carteira Ativa</p>
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
            Extrato consolidado de comissões e parcerias vinculadas ao seu perfil.
          </div>
        </Card>
      </div>

      <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black/20">
        <div className="p-10 border-b border-white/5 bg-[#0a0f1e]/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl">
              <Target className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Extrato de Repasses</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-2 opacity-40">MOVIMENTAÇÃO DE COMISSÕES DO CICLO {cycleMode.toUpperCase()}.</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input placeholder="Filtrar por cliente ou descrição..." className="h-12 bg-black/40 border-white/10 text-xs w-72 pl-12 rounded-xl text-white font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="divide-y divide-white/5 min-h-[500px]">
          {isLoadingTransactions ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auditando Extrato...</span>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="bg-black/10">
              {filteredTransactions.map(t => (
                <div key={t.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all gap-8 border-b border-white/5 last:border-0 group">
                  <div className="flex items-center gap-8">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl transition-transform group-hover:scale-110",
                      t.status === 'Liquidado' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"
                    )}><ArrowRightLeft className="h-7 w-7" /></div>
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
                          <Scale className="h-3.5 w-3.5 opacity-40 text-primary" /> {t.clientName || "GERAL"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white tabular-nums tracking-tighter">
                      + R$ {(Number(t.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <Badge className={cn(
                      "text-[9px] font-black uppercase h-6 mt-2 px-3 border-0", 
                      t.status === 'Pendente' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {t.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-48 flex flex-col items-center justify-center opacity-20 space-y-6 text-center">
              <Handshake className="h-24 w-24 mx-auto" />
              <p className="text-sm font-black uppercase tracking-[0.5em]">Nenhum repasse no ciclo {cycleMode.toUpperCase()}.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
