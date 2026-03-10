
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
  FileText,
  Loader2
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
    // Filtra apenas leads ativos (não arquivados)
    const activeLeads = (leads || []).filter(l => l.status !== 'arquivado').length
    
    // Filtra apenas processos ativos
    const activeCases = (cases || []).filter(c => c.status !== 'Arquivado').length

    // Soma repasses pendentes reais
    const totalRepasses = (financial || [])
      .filter(f => f.type?.includes('Entrada') && f.category?.includes('Acordo') && f.status === 'Pendente')
      .reduce((acc, f) => acc + (Number(f.value) || 0), 0)

    return [
      { label: "TRIAGEM ATIVA", value: activeLeads, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/5" },
      { label: "PROCESSOS ATIVOS", value: activeCases, icon: Scale, color: "text-primary", bg: "bg-primary/5" },
      { label: "PRAZOS ABERTOS", value: deadlines?.length || 0, icon: Clock, color: "text-rose-500", bg: "bg-rose-500/5" },
      { label: "REPASSES ACORDO", value: totalRepasses > 0 ? `R$ ${totalRepasses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : "R$ 0", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/5" },
    ]
  }, [leads, cases, deadlines, financial])

  if (loadingLeads || loadingCases || loadingHearings || !canQuery) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-white font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest opacity-40">Sincronizando Ecossistema RGMJ...</p>
      </div>
    )
  }

  const displayName = profile?.name || user?.displayName || "MEMBRO RGMJ"

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
            Painel Estratégico de Comando
          </Badge>
          <h1 className="text-3xl font-bold text-white uppercase tracking-tight">
            DR. <span className="text-primary">{displayName.split(' ')[0]}</span>
          </h1>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none glass border-white/10 text-xs font-bold uppercase h-11 px-6" asChild>
            <Link href="/leads"><Zap className="mr-2 h-4 w-4 text-amber-500" /> Triagem</Link>
          </Button>
          <Button className="flex-1 md:flex-none gold-gradient text-background font-bold text-xs uppercase h-11 px-8 rounded-lg shadow-xl" asChild>
            <Link href="/cases"><Plus className="mr-2 h-4 w-4" /> Novo Processo</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className={cn("glass border-white/5 shadow-xl hover-gold transition-all group relative overflow-hidden", stat.bg)}>
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <stat.icon className={cn("h-3.5 w-3.5", stat.color)} /> {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-black text-white tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass border-white/5 shadow-2xl overflow-hidden flex flex-col">
          <CardHeader className="p-6 border-b border-white/5 bg-white/[0.01] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
              <Gavel className="h-5 w-5 text-primary" /> Próximas Audiências
            </CardTitle>
            <Button variant="ghost" asChild className="text-xs font-bold text-primary uppercase h-8 px-4 hover:bg-primary/5">
              <Link href="/agenda" className="flex items-center">Visualizar Pauta <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-6 flex-1">
            {recentHearings && recentHearings.length > 0 ? (
              <div className="space-y-3">
                {recentHearings.map((hearing, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                    <div className="flex gap-4 items-center">
                      <div className="flex flex-col items-center justify-center bg-secondary/50 h-12 w-16 rounded-lg border border-white/5">
                        <span className="text-[10px] font-black text-primary uppercase leading-none">
                          {hearing.startDateTime ? new Date(hearing.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white uppercase truncate group-hover:text-primary transition-colors">{hearing.title}</div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">{hearing.location || "Virtual RGMJ"}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 opacity-20 space-y-3">
                <Gavel className="h-10 w-10 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pauta Judiciária Limpa</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass border-rose-500/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50" />
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-500" /> Radar de Riscos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-3">
                {deadlines && deadlines.length > 0 ? (
                  deadlines.slice(0, 3).map((d, i) => (
                    <div key={i} className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 group hover:border-rose-500/30 transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">URGENTE</span>
                        <span className="text-[10px] font-mono text-white/40">{d.dueDate}</span>
                      </div>
                      <p className="text-white text-xs font-bold truncate uppercase">{d.title}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center text-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    <p className="text-xs font-bold text-emerald-500 uppercase mt-3 tracking-widest">Ambiente Seguro</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" asChild className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground h-8 hover:text-primary hover:bg-primary/5">
                <Link href="/deadlines" className="flex items-center justify-center">Auditoria Completa <ArrowRight className="h-3 w-3 ml-2" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-white/5 p-6 space-y-4 shadow-xl">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Acesso Rápido</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="glass border-white/5 h-16 rounded-xl hover:border-primary/30 group transition-all text-white p-0">
                <Link href="/leads" className="flex flex-col items-center justify-center w-full h-full gap-1">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Triagem</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="glass border-white/5 h-16 rounded-xl hover:border-primary/30 group transition-all text-white p-0">
                <Link href="/drafting" className="flex flex-col items-center justify-center w-full h-full gap-1">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Minutas</span>
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
