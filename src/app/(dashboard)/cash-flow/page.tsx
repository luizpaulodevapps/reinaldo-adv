
"use client"

import { useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts"
import { TrendingUp, ArrowUpRight, ArrowDownRight, Calculator, Loader2, ChevronRight, LayoutGrid, Calendar } from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function CashFlowPage() {
  const db = useFirestore()
  const { user } = useUser()

  const financialQuery = useMemoFirebase(() => (user && db) ? query(collection(db!, "financial_titles"), orderBy("dueDate", "asc")) : null, [db, user])
  const { data: transactions, isLoading } = useCollection(financialQuery)

  const chartData = useMemo(() => {
    if (!transactions) return []

    // 6 meses retroativos para análise
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        label: format(date, "MMM", { locale: ptBR }).toUpperCase()
      }
    })

    return months.map(m => {
      const monthTransactions = transactions.filter(t => {
        const date = t.dueDate ? parseISO(t.dueDate) : null
        return date && isWithinInterval(date, { start: m.start, end: m.end })
      })

      const entries = monthTransactions.filter(t => t.type?.includes('Entrada')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
      const exits = monthTransactions.filter(t => t.type?.includes('Saída')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
      const balance = entries - exits

      return {
        name: m.label,
        Entradas: entries,
        Saídas: exits,
        Saldo: balance
      }
    })
  }, [transactions])

  const totals = useMemo(() => {
    if (!transactions) return { revenue: 0, expenses: 0, balance: 0 }
    const revenue = transactions.filter(t => t.type?.includes('Entrada')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
    const expenses = transactions.filter(t => t.type?.includes('Saída')).reduce((acc, t) => acc + (Number(t.value) || 0), 0)
    return { revenue, expenses, balance: revenue - expenses }
  }, [transactions])

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Auditando Fluxo de Caixa...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Calculator className="h-3 w-3" />
            <Link href="/billing" className="hover:text-primary transition-colors">CENTRAL</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">FLUXO DE CAIXA</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Análise de Liquidez</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-60">VISÃO TÁTICA DE ENTRADAS, SAÍDAS E PROJEÇÕES RGMJ.</p>
        </div>
        <div className="glass px-6 py-3 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary border-primary/20">
          <Calendar className="h-4 w-4" /> Últimos 6 Meses
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-3"><ArrowUpRight className="h-4 w-4" /> TOTAL RECEITAS</p>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-rose-500/20 bg-rose-500/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-3"><ArrowDownRight className="h-4 w-4" /> TOTAL DESPESAS</p>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {totals.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-primary/20 bg-primary/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-3"><TrendingUp className="h-4 w-4" /> SALDO CONSOLIDADO</p>
          <div className={cn("text-3xl font-black tabular-nums tracking-tighter", totals.balance >= 0 ? "text-white" : "text-rose-400")}>R$ {totals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass border-white/5 shadow-2xl overflow-hidden rounded-[2rem]">
          <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
            <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Comparativo de Movimentação</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] p-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px" }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 shadow-2xl overflow-hidden rounded-[2rem]">
          <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
            <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Evolução do Saldo</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] p-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px" }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="Saldo" stroke="#F5D030" strokeWidth={3} dot={{ r: 4, fill: "#F5D030" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
