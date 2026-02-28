"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  Scale, 
  Clock, 
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Gavel,
  Zap,
  ChevronRight,
  Loader2
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit, orderBy } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useMemo } from "react"

export default function DashboardPage() {
  const db = useFirestore()
  const { user, role, profile } = useUser()

  const canQuery = !!user

  const leadsQuery = useMemoFirebase(() => canQuery ? collection(db, "leads") : null, [db, canQuery])
  const casesQuery = useMemoFirebase(() => canQuery ? collection(db, "processes") : null, [db, canQuery])
  const deadlinesQuery = useMemoFirebase(() => canQuery ? query(collection(db, "deadlines"), where("status", "==", "Aberto"), limit(10)) : null, [db, canQuery])
  const hearingsQuery = useMemoFirebase(() => canQuery ? query(collection(db, "hearings"), orderBy("startDateTime", "asc"), limit(5)) : null, [db, canQuery])
  const financialQuery = useMemoFirebase(() => canQuery ? collection(db, "financial_titles") : null, [db, canQuery])

  const { data: leads, isLoading: loadingLeads } = useCollection(leadsQuery)
  const { data: cases, isLoading: loadingCases } = useCollection(casesQuery)
  const { data: deadlines } = useCollection(deadlinesQuery)
  const { data: recentHearings, isLoading: loadingHearings } = useCollection(hearingsQuery)
  const { data: financial } = useCollection(financialQuery)

  const stats = useMemo(() => {
    const totalRepasses = (financial || [])
      .filter(f => f.type === 'Repasse' && f.status === 'Pendente')
      .reduce((acc, f) => acc + (Number(f.value) || 0), 0)

    return [
      { label: "Pipeline (Leads)", value: leads?.length || 0, icon: Zap, color: "text-amber-500" },
      { label: "Dossiês Ativos", value: cases?.length || 0, icon: Scale, color: "text-primary" },
      { label: "Prazos em Aberto", value: deadlines?.length || 0, icon: Clock, color: "text-destructive" },
      { label: "Repasses Pendentes", value: totalRepasses > 0 ? `R$ ${totalRepasses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : 0, icon: TrendingUp, color: "text-emerald-500" },
    ]
  }, [leads, cases, deadlines, financial])

  if (loadingLeads || loadingCases || loadingHearings || !canQuery) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Centro de Comando...</p>
      </div>
    )
  }

  const displayName = profile?.name || user?.displayName || "Dr. Reinaldo Gonçalves"

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold text-[#213B37] tracking-tight">
          Bem-vindo, <span className="text-[#213B37]">{displayName}</span>
        </h1>
        <p className="text-[#818258] uppercase tracking-[0.2em] text-[10px] font-bold">Centro de Comando Estratégico RGMJ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border/60 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#213B37] mb-4">{stat.value}</div>
              <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold uppercase tracking-widest">
                <ArrowUpRight className="h-3 w-3" /> Atualizado agora
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/60 shadow-sm min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 mb-6">
            <CardTitle className="text-xs font-bold text-[#213B37] flex items-center gap-3 uppercase tracking-widest">
              <Gavel className="h-4 w-4 text-primary/60" /> Próximas Audiências
            </CardTitle>
            <Link href="/agenda" className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline">Ver Pauta Completa</Link>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full">
            {recentHearings && recentHearings.length > 0 ? (
              <div className="w-full space-y-4">
                {recentHearings.map((hearing, i) => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-lg bg-[#F8F9FA] border border-border/40 hover:border-primary/20 transition-colors group">
                    <div className="flex gap-5 items-center">
                      <div className="text-primary font-bold text-xs bg-primary/5 h-10 w-16 flex items-center justify-center rounded border border-primary/10">
                        {hearing.startDateTime ? new Date(hearing.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                      </div>
                      <div>
                        <div className="font-bold text-[#213B37] text-sm uppercase tracking-tight">{hearing.title}</div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mt-1">{hearing.type} • {hearing.location || "Sala Virtual"}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[8px] border-primary/20 text-primary uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Detalhes</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground italic text-sm opacity-60">
                Nenhuma audiência agendada para os próximos dias.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-border/40 mb-6">
            <AlertCircle className="h-4 w-4 text-destructive/70" />
            <CardTitle className="text-xs font-bold text-[#213B37] uppercase tracking-widest">Alertas Críticos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {deadlines && deadlines.length > 0 ? (
                deadlines.slice(0, 3).map((d, i) => (
                  <div key={i} className="p-5 rounded-lg bg-destructive/5 border-l-4 border-destructive/60 text-xs space-y-2">
                    <div className="font-bold text-destructive uppercase tracking-widest text-[9px]">Atenção ao Prazo</div>
                    <p className="text-[#213B37] font-medium truncate">{d.title}</p>
                    <p className="text-muted-foreground text-[10px] font-bold">{d.dueDate}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-lg bg-emerald-50 border-l-4 border-emerald-500/60 space-y-2">
                  <div className="font-bold text-emerald-700 uppercase tracking-widest text-[10px]">Tudo em Dia</div>
                  <p className="text-emerald-800/70 text-xs font-medium">Nenhum alerta crítico pendente no radar.</p>
                </div>
              )}
            </div>
            <Button variant="ghost" asChild className="w-full mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary hover:bg-primary/5">
              <Link href="/deadlines">Ver todos os alertas <ChevronRight className="h-3 w-3 ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}