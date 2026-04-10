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

  const leadsQuery = useMemoFirebase(() => canQuery ? query(collection(db, "leads"), orderBy("updatedAt", "desc"), limit(50)) : null, [db, canQuery])
  const casesQuery = useMemoFirebase(() => canQuery ? query(collection(db, "processes"), orderBy("createdAt", "desc"), limit(50)) : null, [db, canQuery])
  const deadlinesQuery = useMemoFirebase(() => canQuery ? query(collection(db, "deadlines"), where("status", "==", "Aberto"), limit(10)) : null, [db, canQuery])
  const hearingsQuery = useMemoFirebase(() => canQuery ? query(collection(db, "hearings"), orderBy("startDateTime", "asc"), limit(5)) : null, [db, canQuery])
  const financialQuery = useMemoFirebase(() => canQuery ? query(collection(db, "financial_titles"), orderBy("dueDate", "desc"), limit(50)) : null, [db, canQuery])

  const { data: leads, isLoading: loadingLeads } = useCollection(leadsQuery)
  const { data: cases, isLoading: loadingCases } = useCollection(casesQuery)
  const { data: deadlines } = useCollection(deadlinesQuery)
  const { data: recentHearings, isLoading: loadingHearings } = useCollection(hearingsQuery)
  const { data: financial } = useCollection(financialQuery)

  const stats = useMemo(() => {
    const activeLeads = (leads || []).filter(l => l.status !== 'arquivado').length
    const activeCases = (cases || []).filter(c => c.status !== 'Arquivado').length
    const totalRepasses = (financial || [])
      .filter(f => f.type?.includes('Entrada') && f.category?.includes('Acordo') && f.status === 'Pendente')
      .reduce((acc, f) => acc + (Number(f.value) || 0), 0)

    return [
      { label: "TRIAGEM ATIVA", value: activeLeads, icon: Zap, color: "text-gold-100", bg: "bg-gold-200/5" },
      { label: "PROCESSOS ATIVOS", value: activeCases, icon: Scale, color: "text-gold-100", bg: "bg-gold-200/5" },
      { label: "PRAZOS ABERTOS", value: deadlines?.length || 0, icon: Clock, color: "text-rose-500", bg: "bg-rose-500/5" },
      { label: "REPASSES ACORDO", value: totalRepasses > 0 ? `R$ ${totalRepasses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : "R$ 0", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/5" },
    ]
  }, [leads, cases, deadlines, financial])

  if (loadingLeads || loadingCases || loadingHearings || !canQuery) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-white font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-gold-100" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Sincronizando Ecossistema RGMJ...</p>
      </div>
    )
  }

  const displayName = profile?.name || user?.displayName || "MEMBRO RGMJ"

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-gold-200/10 pb-8">
        <div className="space-y-3">
          <Badge variant="outline" className="bg-gold-200/5 text-gold-100 border-gold-200/20 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
            Painel Estratégico de Comando
          </Badge>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            DR. <span className="text-gold-100">{displayName.split(' ')[0]}</span>
          </h1>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none gold-outline h-12 px-8 text-[10px] font-black uppercase tracking-widest rounded-xl" asChild>
            <Link href="/leads"><Zap className="mr-2.5 h-4 w-4" /> Triagem</Link>
          </Button>
          <Button className="flex-1 md:flex-none gold-gradient text-background font-black h-12 px-10 text-[10px] uppercase tracking-widest rounded-xl shadow-xl hover:scale-105 transition-all" asChild>
            <Link href="/cases"><Plus className="mr-2.5 h-4 w-4" /> Novo Processo</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className={cn("bg-card border-gold-200/10 shadow-2xl hover-gold group relative overflow-hidden rounded-2xl", stat.bg)}>
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-3">
                <stat.icon className={cn("h-4 w-4", stat.color)} /> {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-3xl font-black text-white tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card border-gold-200/10 shadow-2xl overflow-hidden flex flex-col rounded-3xl">
          <CardHeader className="p-8 border-b border-gold-200/10 bg-black/20 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black text-white uppercase tracking-[0.25em] flex items-center gap-4">
              <Gavel className="h-5 w-5 text-gold-100" /> Próximas Audiências
            </CardTitle>
            <Button variant="ghost" asChild className="text-[10px] font-black text-gold-100 uppercase h-9 px-5 hover:bg-gold-200/5 rounded-lg">
              <Link href="/agenda" className="flex items-center">Visualizar Pauta <ChevronRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-8 flex-1">
            {recentHearings && recentHearings.length > 0 ? (
              <div className="space-y-4">
                {recentHearings.map((hearing, i) => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-gold-200/30 transition-all group">
                    <div className="flex gap-6 items-center">
                      <div className="flex flex-col items-center justify-center bg-secondary h-14 w-20 rounded-xl border border-white/5 shadow-inner">
                        <span className="text-xs font-black text-gold-100 uppercase leading-none">
                          {hearing.startDateTime ? new Date(hearing.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-base text-white uppercase truncate group-hover:text-gold-100 transition-colors leading-tight">{hearing.title}</div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1.5 opacity-50">{hearing.location || "Virtual RGMJ"}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-gold-100 transition-all group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20 space-y-4">
                <Gavel className="h-12 w-12 text-muted-foreground" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground text-center">Pauta Judiciária Limpa</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="bg-card border-rose-500/20 shadow-2xl relative overflow-hidden rounded-3xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500/40" />
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xs font-black text-white uppercase tracking-[0.25em] flex items-center gap-4">
                <AlertCircle className="h-5 w-5 text-rose-500" /> Radar de Riscos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-4">
                {deadlines && deadlines.length > 0 ? (
                  deadlines.slice(0, 3).map((d, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 group hover:border-rose-500/30 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2.5 py-0.5 rounded-sm">URGENTE</span>
                        <span className="text-[10px] font-mono font-bold text-white/30">{d.dueDate}</span>
                      </div>
                      <p className="text-white text-xs font-black truncate uppercase leading-tight">{d.title}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-10 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center text-center space-y-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ambiente Seguro</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" asChild className="w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground h-10 hover:text-gold-100 hover:bg-gold-200/5 rounded-xl border border-white/5">
                <Link href="/deadlines" className="flex items-center justify-center">Auditoria Completa <ArrowRight className="h-3.5 w-3.5 ml-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5 p-8 space-y-6 shadow-2xl rounded-3xl">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Comandos Rápidos</h4>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="bg-white/[0.02] border-white/5 h-20 rounded-2xl hover:border-gold-200/40 group transition-all text-white p-0">
                <Link href="/leads" className="flex flex-col items-center justify-center w-full h-full gap-2">
                  <Zap className="h-5 w-5 text-gold-100 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Triagem</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-white/[0.02] border-white/5 h-20 rounded-2xl hover:border-gold-200/40 group transition-all text-white p-0">
                <Link href="/drafting" className="flex flex-col items-center justify-center w-full h-full gap-2">
                  <FileText className="h-5 w-5 text-gold-100 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Minutas</span>
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
