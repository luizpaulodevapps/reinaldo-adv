
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
  Calendar,
  Plus,
  ArrowRight,
  CheckCircle2,
  FileText,
  Target
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
      { label: "PIPELINE (LEADS)", value: leads?.length || 0, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/5" },
      { label: "DOSSIÊS ATIVOS", value: cases?.length || 0, icon: Scale, color: "text-primary", bg: "bg-primary/5" },
      { label: "PRAZOS EM ABERTO", value: deadlines?.length || 0, icon: Clock, color: "text-destructive", bg: "bg-destructive/5" },
      { label: "REPASSES PENDENTES", value: totalRepasses > 0 ? `R$ ${totalRepasses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : "R$ 0", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/5" },
    ]
  }, [leads, cases, deadlines, financial])

  if (loadingLeads || loadingCases || loadingHearings || !canQuery) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-white">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Scale className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 animate-pulse">Sincronizando Centro de Comando RGMJ...</p>
      </div>
    )
  }

  const displayName = profile?.name || user?.displayName || "REINALDO GONÇALVES"

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 text-[9px] font-black uppercase tracking-widest">
            Sessão de Comando Ativa
          </Badge>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
            DR. <span className="text-primary">{displayName.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.3em]">Monitoramento Estratégico da Banca RGMJ Elite.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="glass border-white/10 text-[10px] font-black uppercase tracking-widest h-12 px-6" asChild>
            <Link href="/interviews"><Calendar className="mr-2 h-4 w-4 text-primary" /> Realizar Entrevista</Link>
          </Button>
          <Button className="gold-gradient font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-xl shadow-xl shadow-primary/10" asChild>
            <Link href="/cases"><Plus className="mr-2 h-4 w-4" /> Novo Processo</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className={cn("glass border-white/5 shadow-2xl hover-gold transition-all group relative overflow-hidden", stat.bg)}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <stat.icon className="h-16 w-16" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <stat.icon className={cn("h-3.5 w-3.5", stat.color)} /> {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white mb-4 tracking-tighter">{stat.value}</div>
              <div className="flex items-center gap-2 text-[9px] text-emerald-500 font-black uppercase tracking-widest">
                <TrendingUp className="h-3 w-3" /> Tendência Positiva
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 glass border-white/5 shadow-2xl overflow-hidden flex flex-col">
          <CardHeader className="p-8 border-b border-white/5 bg-[#0a0f1e]/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Gavel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">Pauta de Audiências</CardTitle>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Compromissos agendados para os próximos 7 dias</p>
              </div>
            </div>
            <Button variant="ghost" asChild className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors">
              <Link href="/agenda" className="flex items-center">Acessar Agenda <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-8 flex-1">
            {recentHearings && recentHearings.length > 0 ? (
              <div className="space-y-4">
                {recentHearings.map((hearing, i) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all group">
                    <div className="flex gap-6 items-center">
                      <div className="flex flex-col items-center justify-center bg-secondary/50 h-14 w-20 rounded-xl border border-white/5 group-hover:border-primary/20 transition-all shadow-lg">
                        <span className="text-[10px] font-black text-primary uppercase leading-none">
                          {hearing.startDateTime ? new Date(hearing.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-black uppercase mt-1">H</span>
                      </div>
                      <div>
                        <div className="font-black text-white text-base uppercase tracking-tight group-hover:text-primary transition-colors">{hearing.title}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Badge variant="outline" className="text-[8px] font-black border-white/10 text-muted-foreground">{hearing.type?.toUpperCase()}</Badge>
                          <span className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-widest flex items-center gap-1.5">
                            <Target className="h-3 w-3" /> {hearing.location || "Sala Virtual RGMJ"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground group-hover:text-primary">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20 space-y-4">
                <Gavel className="h-12 w-12" />
                <p className="text-xs font-black uppercase tracking-[0.3em]">Pauta Limpa</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="glass border-destructive/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-destructive/50" />
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive animate-pulse" />
                <CardTitle className="text-xs font-black text-white uppercase tracking-[0.2em]">Radar de Riscos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-4">
                {deadlines && deadlines.length > 0 ? (
                  deadlines.slice(0, 3).map((d, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-3 group hover:border-destructive/30 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-destructive uppercase tracking-widest">Atenção Crítica</span>
                        <span className="text-[9px] font-mono text-white/40">{d.dueDate}</span>
                      </div>
                      <p className="text-white text-xs font-bold leading-relaxed line-clamp-2 uppercase tracking-tight">{d.title}</p>
                      <button className="text-[8px] font-black text-destructive hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1">
                        Verificar Peça <ArrowRight className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-10 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center text-center space-y-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ambiente Seguro</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" asChild className="w-full text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary hover:bg-primary/5 h-12">
                <Link href="/deadlines" className="flex items-center justify-center">Auditoria Completa <ChevronRight className="h-3 w-3 ml-2" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-white/5 p-8 space-y-6">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Protocolo Rápido</h4>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="glass border-white/5 h-20 rounded-2xl flex flex-col gap-2 hover:border-primary/30 group transition-all text-white">
                <Link href="/leads" className="flex flex-col items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] font-black uppercase">Triagem</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="glass border-white/5 h-20 rounded-2xl flex flex-col gap-2 hover:border-primary/30 group transition-all text-white">
                <Link href="/drafting" className="flex flex-col items-center gap-2">
                  <FileText className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] font-black uppercase">Minuta IA</span>
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
