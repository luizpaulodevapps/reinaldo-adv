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
      { label: "PIPELINE (LEADS)", value: leads?.length || 0, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/5" },
      { label: "DOSSIÊS ATIVOS", value: cases?.length || 0, icon: Scale, color: "text-primary", bg: "bg-primary/5" },
      { label: "PRAZOS EM ABERTO", value: deadlines?.length || 0, icon: Clock, color: "text-destructive", bg: "bg-destructive/5" },
      { label: "REPASSES", value: totalRepasses > 0 ? `R$ ${totalRepasses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : "R$ 0", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/5" },
    ]
  }, [leads, cases, deadlines, financial])

  if (loadingLeads || loadingCases || loadingHearings || !canQuery) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-white font-sans">
        <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Sincronizando...</p>
      </div>
    )
  }

  const displayName = profile?.name || user?.displayName || "REINALDO GONÇALVES"

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-0.5 text-[8px] font-black uppercase tracking-widest">
            Sessão Ativa
          </Badge>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
            DR. <span className="text-primary">{displayName.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest opacity-60">Monitoramento Estratégico RGMJ.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none glass border-white/10 text-[9px] font-black uppercase tracking-widest h-10 px-4" asChild>
            <Link href="/leads"><Zap className="mr-2 h-3.5 w-3.5 text-amber-500" /> Triagem</Link>
          </Button>
          <Button className="flex-1 md:flex-none gold-gradient font-black text-[9px] uppercase tracking-widest h-10 px-6 rounded-lg shadow-lg" asChild>
            <Link href="/cases"><Plus className="mr-2 h-3.5 w-3.5" /> Novo Processo</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className={cn("glass border-white/5 shadow-xl hover-gold transition-all group relative overflow-hidden", stat.bg)}>
            <CardHeader className="p-4 pb-1">
              <CardTitle className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <stat.icon className={cn("h-3 w-3", stat.color)} /> {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-white tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass border-white/5 shadow-xl overflow-hidden flex flex-col">
          <CardHeader className="p-4 border-b border-white/5 bg-[#0a0f1e]/50 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Gavel className="h-3.5 w-3.5 text-primary" /> Próximas Audiências
            </CardTitle>
            <Button variant="ghost" asChild className="text-[8px] font-black text-primary uppercase tracking-widest h-8 px-2">
              <Link href="/agenda" className="flex items-center">Ver Tudo <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            {recentHearings && recentHearings.length > 0 ? (
              <div className="space-y-3">
                {recentHearings.map((hearing, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                    <div className="flex gap-4 items-center">
                      <div className="flex flex-col items-center justify-center bg-secondary/50 h-10 w-12 rounded-lg border border-white/5">
                        <span className="text-[9px] font-black text-primary uppercase leading-none">
                          {hearing.startDateTime ? new Date(hearing.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white uppercase truncate group-hover:text-primary transition-colors">{hearing.title}</div>
                        <p className="text-[8px] text-muted-foreground/60 uppercase font-black tracking-widest mt-0.5">{hearing.location || "Virtual"}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-20 space-y-2">
                <Gavel className="h-8 w-8" />
                <p className="text-[9px] font-black uppercase tracking-widest">Pauta Limpa</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass border-destructive/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-destructive/50" />
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-destructive animate-pulse" /> Radar de Riscos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="space-y-2">
                {deadlines && deadlines.length > 0 ? (
                  deadlines.slice(0, 3).map((d, i) => (
                    <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 group hover:border-destructive/30 transition-all">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black text-destructive uppercase">Atenção</span>
                        <span className="text-[8px] font-mono text-white/40">{d.dueDate}</span>
                      </div>
                      <p className="text-white text-[10px] font-bold truncate uppercase">{d.title}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center text-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-2">Seguro</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" asChild className="w-full text-[8px] font-black uppercase tracking-widest text-muted-foreground h-8 hover:text-primary">
                <Link href="/deadlines">Auditoria Completa <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-white/5 p-4 space-y-4">
            <h4 className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Atalhos</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="glass border-white/5 h-12 rounded-xl hover:border-primary/30 group transition-all text-white p-0">
                <Link href="/leads" className="flex flex-col items-center justify-center w-full h-full gap-1">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[7px] font-black uppercase">Triagem</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="glass border-white/5 h-12 rounded-xl hover:border-primary/30 group transition-all text-white p-0">
                <Link href="/drafting" className="flex flex-col items-center justify-center w-full h-full gap-1">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[7px] font-black uppercase">Minuta IA</span>
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}