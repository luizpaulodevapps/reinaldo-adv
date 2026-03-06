'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Scale,
  Clock,
  TrendingUp,
  AlertCircle,
  Gavel,
  Zap,
  ChevronRight,
  Plus,
  ArrowRight,
  CheckCircle2,
  FileText
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit, orderBy } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

export function DashboardContent() {
  const db = useFirestore()
  const { user, profile } = useUser()

  const canQuery = !!user && !!db

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
      { label: "LEADS", value: leads?.length || 0, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/5" },
      { label: "DOSSIÊS ATIVOS", value: cases?.length || 0, icon: Scale, color: "text-primary", bg: "bg-primary/5" },
      { label: "PRAZOS ABERTOS", value: deadlines?.length || 0, icon: Clock, color: "text-destructive", bg: "bg-destructive/5" },
      { label: "REPASSES", value: totalRepasses > 0 ? `R$ ${totalRepasses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : "R$ 0", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/5" },
    ]
  }, [leads, cases, deadlines, financial])

  if (loadingLeads || loadingCases || loadingHearings || !canQuery) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center space-y-2 text-white font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">Sincronizando...</p>
      </div>
    )
  }

  const displayName = profile?.name || user?.displayName || "REINALDO GONÇALVES"

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-3 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
            Painel Estratégico
          </Badge>
          <h1 className="text-xl font-bold text-white uppercase tracking-tight">
            DR. <span className="text-primary">{displayName.split(' ')[0]}</span>
          </h1>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none glass border-white/10 text-[9px] font-bold uppercase h-8 px-3" asChild>
            <Link href="/leads"><Zap className="mr-1.5 h-3 w-3 text-amber-500" /> Triagem</Link>
          </Button>
          <Button className="flex-1 md:flex-none gold-gradient font-bold text-[9px] uppercase h-8 px-4 rounded shadow-md" asChild>
            <Link href="/cases"><Plus className="mr-1.5 h-3 w-3" /> Novo Processo</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <Card key={i} className={cn("glass border-white/5 shadow-md hover-gold transition-all group relative overflow-hidden", stat.bg)}>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <stat.icon className={cn("h-3 w-3", stat.color)} /> {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-bold text-white tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 glass border-white/5 shadow-md overflow-hidden flex flex-col">
          <CardHeader className="p-3 border-b border-white/5 bg-white/[0.01] flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Gavel className="h-3 w-3 text-primary" /> Próximas Audiências
            </CardTitle>
            <Button variant="ghost" asChild className="text-[9px] font-bold text-primary uppercase h-6 px-2">
              <Link href="/agenda" className="flex items-center">Ver Tudo <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            {recentHearings && recentHearings.length > 0 ? (
              <div className="space-y-2">
                {recentHearings.map((hearing, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                    <div className="flex gap-3 items-center">
                      <div className="flex flex-col items-center justify-center bg-secondary/50 h-8 w-10 rounded border border-white/5">
                        <span className="text-[9px] font-bold text-primary uppercase leading-none">
                          {hearing.startDateTime ? new Date(hearing.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] text-white uppercase truncate group-hover:text-primary transition-colors">{hearing.title}</div>
                        <p className="text-[8px] text-muted-foreground/60 uppercase font-bold tracking-wider mt-0.5">{hearing.location || "Virtual"}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 opacity-20 space-y-1.5">
                <Gavel className="h-6 w-6" />
                <p className="text-[9px] font-bold uppercase tracking-wider">Pauta Limpa</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass border-destructive/20 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-0.5 h-full bg-destructive/50" />
            <CardHeader className="p-3 pb-1.5">
              <CardTitle className="text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3 text-destructive" /> Radar de Riscos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="space-y-1.5">
                {deadlines && deadlines.length > 0 ? (
                  deadlines.slice(0, 3).map((d, i) => (
                    <div key={i} className="p-2 rounded bg-destructive/5 border border-destructive/10 group hover:border-destructive/30 transition-all">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[8px] font-bold text-destructive uppercase">URGENTE</span>
                        <span className="text-[8px] font-mono text-white/40">{d.dueDate}</span>
                      </div>
                      <p className="text-white text-[10px] font-bold truncate uppercase">{d.title}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center text-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <p className="text-[9px] font-bold text-emerald-500 uppercase mt-1.5">Ambiente Seguro</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" asChild className="w-full text-[8px] font-bold uppercase tracking-wider text-muted-foreground h-6 hover:text-primary">
                <Link href="/deadlines">Auditoria Completa <ArrowRight className="h-2.5 w-2.5 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-white/5 p-3 space-y-3">
            <h4 className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Acesso Rápido</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="glass border-white/5 h-10 rounded-lg hover:border-primary/30 group transition-all text-white p-0">
                <Link href="/leads" className="flex flex-col items-center justify-center w-full h-full gap-0.5">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span className="text-[7px] font-bold uppercase">Triagem</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="glass border-white/5 h-10 rounded-lg hover:border-primary/30 group transition-all text-white p-0">
                <Link href="/drafting" className="flex flex-col items-center justify-center w-full h-full gap-0.5">
                  <FileText className="h-3 w-3 text-primary" />
                  <span className="text-[7px] font-bold uppercase">Minuta IA</span>
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { Loader2 } from "lucide-react"