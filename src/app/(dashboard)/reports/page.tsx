
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, Users, Scale, AlertCircle, Calendar } from "lucide-react"

const performanceData = [
  { month: "Jan", processos: 12, faturamento: 45000 },
  { month: "Fev", processos: 18, faturamento: 52000 },
  { month: "Mar", processos: 15, faturamento: 48000 },
  { month: "Abr", processos: 22, faturamento: 61000 },
  { month: "Mai", processos: 25, faturamento: 75000 },
  { month: "Jun", processos: 30, faturamento: 82000 },
]

const areaData = [
  { name: "Trabalhista", value: 45, color: "#F5D030" },
  { name: "Cível", value: 25, color: "#D4AF37" },
  { name: "Empresarial", value: 20, color: "#1e293b" },
  { name: "Outros", value: 10, color: "#475569" },
]

export default function ReportsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">Relatórios BI</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Inteligência de Negócio e Performance da Banca</p>
        </div>
        <div className="flex gap-2">
           <div className="glass px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold text-primary">
            <Calendar className="h-4 w-4" /> Últimos 6 Meses
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Crescimento Mensal", value: "+12.5%", icon: TrendingUp, color: "text-emerald-500" },
          { label: "Novos Clientes", value: "48", icon: Users, color: "text-primary" },
          { label: "Êxito Processual", value: "84%", icon: Scale, color: "text-info" },
          { label: "Prazos em Alerta", value: "03", icon: AlertCircle, color: "text-destructive" },
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
            <CardTitle className="text-lg font-headline text-white">Evolução de Faturamento vs. Processos</CardTitle>
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
            <CardTitle className="text-lg font-headline text-white">Distribuição por Área Jurídica</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
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
                  <span className="text-xs text-muted-foreground">{area.name} ({area.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
