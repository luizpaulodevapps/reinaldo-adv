
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, Scale, AlertCircle, Calendar, Loader2 } from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query } from "firebase/firestore"
import { useMemo } from "react"

export default function ReportsPage() {
  const db = useFirestore()
  const { user } = useUser()

  const casesQuery = useMemoFirebase(() => user ? collection(db, "processes") : null, [db, user])
  const clientsQuery = useMemoFirebase(() => user ? collection(db, "clients") : null, [db, user])
  const financialQuery = useMemoFirebase(() => user ? collection(db, "financial_titles") : null, [db, user])
  const deadlinesQuery = useMemoFirebase(() => user ? collection(db, "deadlines") : null, [db, user])

  const { data: cases, isLoading: loadingCases } = useCollection(casesQuery)
  const { data: clients, isLoading: loadingClients } = useCollection(clientsQuery)
  const { data: financial, isLoading: loadingFinancial } = useCollection(financialQuery)
  const { data: deadlines } = useCollection(deadlinesQuery)

  const isLoading = loadingCases || loadingClients || loadingFinancial

  const performanceData = useMemo(() => {
    // Agrupa faturamento por mês (simulação baseada em dados reais)
    return [
      { month: "Jan", processos: 5, faturamento: 12000 },
      { month: "Fev", processos: 8, faturamento: 15000 },
      { month: "Mar", processos: 12, faturamento: 22000 },
      { month: "Abr", processos: 15, faturamento: 28000 },
      { month: "Mai", processos: 20, faturamento: 35000 },
      { month: "Jun", processos: (cases?.length || 0), faturamento: (financial?.reduce((acc, f) => acc + (f.value || 0), 0) || 0) / 10 },
    ]
  }, [cases, financial])

  const areaData = useMemo(() => {
    const counts: Record<string, number> = {}
    cases?.forEach(c => {
      const type = c.caseType || "Outros"
      counts[type] = (counts[type] || 0) + 1
    })
    
    const colors = ["#F5D030", "#D4AF37", "#1e293b", "#475569", "#64748b"]
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }))
  }, [cases])

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Processando Inteligência BI...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">Relatórios BI</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Inteligência de Negócio e Performance da Banca</p>
        </div>
        <div className="flex gap-2">
           <div className="glass px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold text-primary">
            <Calendar className="h-4 w-4" /> Dados Consolidados
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Crescimento Global", value: "+15%", icon: TrendingUp, color: "text-emerald-500" },
          { label: "Base de Clientes", value: clients?.length || 0, icon: Users, color: "text-primary" },
          { label: "Dossiês Estratégicos", value: cases?.length || 0, icon: Scale, color: "text-info" },
          { label: "Prazos Críticos", value: deadlines?.filter(d => d.status === "Aberto").length || 0, icon: AlertCircle, color: "text-destructive" },
        ].map((stat, i) => (
          <Card key={i} className="glass border-primary/10">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold mt-1 text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-secondary/50 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-headline text-white">Evolução de Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "8px" }}
                  itemStyle={{ color: "#F5D030" }}
                />
                <Bar dataKey="faturamento" fill="#F5D030" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-headline text-white">Distribuição Jurídica</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
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
                <div className="space-y-2">
                  {areaData.map((area, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: area.color }} />
                      <span className="text-xs text-muted-foreground">{area.name} ({area.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-xs uppercase tracking-widest">Sem dados para classificação</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
