
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, Scale, AlertCircle, Calendar, Loader2, ChevronRight, LayoutGrid } from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query } from "firebase/firestore"
import { useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function ReportsPage() {
  const db = useFirestore()
  const { user } = useUser()

  const canQuery = !!user && !!db

  const casesQuery = useMemoFirebase(() => (user && db) ? collection(db!, "processes") : null, [db, user])
  const clientsQuery = useMemoFirebase(() => (user && db) ? collection(db!, "clients") : null, [db, user])
  const financialQuery = useMemoFirebase(() => (user && db) ? collection(db!, "financial_titles") : null, [db, user])
  const deadlinesQuery = useMemoFirebase(() => (user && db) ? collection(db!, "deadlines") : null, [db, user])

  const { data: cases, isLoading: loadingCases } = useCollection(casesQuery)
  const { data: clients, isLoading: loadingClients } = useCollection(clientsQuery)
  const { data: financial, isLoading: loadingFinancial } = useCollection(financialQuery)
  const { data: deadlines } = useCollection(deadlinesQuery)

  const isLoading = loadingCases || loadingClients || loadingFinancial

  const performanceData = useMemo(() => {
    if (!cases || !financial) return []

    // Calcula os últimos 6 meses dinamicamente
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        label: format(date, "MMM", { locale: ptBR }).toUpperCase()
      }
    })

    return months.map(m => {
      const processesCount = cases.filter(c => {
        const createdAt = c.createdAt?.toDate ? c.createdAt.toDate() : null
        return createdAt && isWithinInterval(createdAt, { start: m.start, end: m.end })
      }).length

      const revenue = financial
        .filter(f => {
          const dueDate = f.dueDate ? parseISO(f.dueDate) : null
          return f.type?.includes('Entrada') && dueDate && isWithinInterval(dueDate, { start: m.start, end: m.end })
        })
        .reduce((acc, f) => acc + (Number(f.value) || 0), 0)

      return {
        month: m.label,
        processos: processesCount,
        faturamento: revenue
      }
    })
  }, [cases, financial])

  const areaData = useMemo(() => {
    const counts: Record<string, number> = {}
    if (!cases || cases.length === 0) return []

    cases.forEach(c => {
      const type = c.caseType || "Geral"
      counts[type] = (counts[type] || 0) + 1
    })
    
    const colors = ["#F5D030", "#D4AF37", "#1e293b", "#475569", "#64748b", "#fbbf24", "#a855f7"]
    return Object.entries(counts).map(([name, value], i) => ({
      name: name.toUpperCase(),
      value,
      color: colors[i % colors.length]
    }))
  }, [cases])

  const totals = useMemo(() => {
    const openDeadlines = (deadlines || []).filter(d => d.status === "Aberto").length
    const growth = "0%" // Logica de crescimento pode ser implementada comparando meses
    
    return {
      growth,
      clients: clients?.length || 0,
      cases: cases?.length || 0,
      deadlines: openDeadlines
    }
  }, [clients, cases, deadlines])

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Processando Inteligência BI...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Business Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Relatórios BI</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-black opacity-60">Inteligência de Negócio RGMJ.</p>
        </div>
        <div className="flex gap-2">
           <div className="glass px-6 py-3 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary border-primary/20">
            <Calendar className="h-4 w-4" /> Dados Consolidados
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Performance Mês", value: totals.growth, icon: TrendingUp, color: "text-emerald-500" },
          { label: "Base de Clientes", value: totals.clients, icon: Users, color: "text-primary" },
          { label: "Processos Ativos", value: totals.cases, icon: Scale, color: "text-blue-400" },
          { label: "Prazos Críticos", value: totals.deadlines, icon: AlertCircle, color: "text-rose-500" },
        ].map((stat, i) => (
          <Card key={i} className="glass border-white/5 hover-gold transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black mt-1 text-white tracking-tighter">{stat.value}</p>
              </div>
              <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-primary/20 shadow-2xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg font-black text-white uppercase tracking-widest">Evolução Financeira (R$)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] p-8">
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#F5D030", fontWeight: 'bold', fontSize: '10px' }}
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                  />
                  <Bar dataKey="faturamento" fill="#F5D030" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center opacity-20"><p className="text-[10px] font-black uppercase tracking-widest">Sem histórico financeiro</p></div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-primary/20 shadow-2xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg font-black text-white uppercase tracking-widest">Distribuição por Área</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center p-8">
            {areaData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areaData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {areaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 pl-8 border-l border-white/5">
                  {areaData.map((area, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: area.color }} />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{area.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">({area.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-[10px] uppercase tracking-[0.4em] font-black opacity-30">Sem dados para classificação</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
