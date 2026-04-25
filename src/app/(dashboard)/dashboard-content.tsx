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
import { motion, AnimatePresence } from "framer-motion"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"

export function DashboardContent() {
  const db = useFirestore()
  const { user, profile } = useUser()

  const canQuery = !!user && !!db

  const leadsQuery = useMemoFirebase(() => canQuery ? query(collection(db, "leads"), orderBy("updatedAt", "desc"), limit(50)) : null, [db, canQuery])
  const casesQuery = useMemoFirebase(() => canQuery ? query(collection(db, "processes"), orderBy("createdAt", "desc"), limit(50)) : null, [db, canQuery])
  const deadlinesQuery = useMemoFirebase(() => canQuery ? query(collection(db, "deadlines"), where("status", "==", "Aberto"), limit(10)) : null, [db, canQuery])
  const hearingsQuery = useMemoFirebase(() => canQuery ? query(collection(db, "hearings"), orderBy("startDateTime", "asc"), limit(5)) : null, [db, canQuery])
  const financialQuery = useMemoFirebase(() => canQuery ? query(collection(db, "financial_titles"), orderBy("dueDate", "desc"), limit(50)) : null, [db, canQuery])
  const notificationsQuery = useMemoFirebase(() => canQuery ? query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(4)) : null, [db, canQuery, user])

  const { data: leads, isLoading: loadingLeads } = useCollection(leadsQuery)
  const { data: cases, isLoading: loadingCases } = useCollection(casesQuery)
  const { data: deadlines } = useCollection(deadlinesQuery)
  const { data: recentHearings, isLoading: loadingHearings } = useCollection(hearingsQuery)
  const { data: financial } = useCollection(financialQuery)
  const { data: recentNotifications } = useCollection(notificationsQuery)

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

  const displayName = profile?.name || user?.displayName || "MEMBRO RGMJ"
  
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "BOM DIA"
    if (hour < 18) return "BOA TARDE"
    return "BOA NOITE"
  }, [])

  // Mock data for the main chart (in a real app, this would come from a query)
  const chartData = [
    { name: "SEG", leads: 12, cases: 5 },
    { name: "TER", leads: 18, cases: 8 },
    { name: "QUA", leads: 15, cases: 12 },
    { name: "QUI", leads: 22, cases: 10 },
    { name: "SEX", leads: 30, cases: 15 },
    { name: "SAB", leads: 25, cases: 7 },
    { name: "DOM", leads: 10, cases: 3 },
  ]

  if (loadingLeads || loadingCases || loadingHearings || !canQuery) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-white font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-gold-100" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Sincronizando Ecossistema RGMJ...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-gold-200/10 pb-10">
        <div className="space-y-4">
          <Badge variant="outline" className="bg-gold-200/5 text-gold-100 border-gold-200/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full backdrop-blur-sm">
            {greeting} • Painel Estratégico
          </Badge>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">
            DR. <span className="text-gradient-gold">{displayName.split(' ')[0]}</span>
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
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <Card className={cn("bg-card/40 backdrop-blur-xl border-gold-200/10 shadow-2xl hover-gold group relative overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-gold-200/5", stat.bg)}>
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon className="h-12 w-12" />
              </div>
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-3">
                  <stat.icon className={cn("h-4 w-4", stat.color)} /> {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">{stat.value}</div>
                  <div className="h-8 w-16 opacity-30 group-hover:opacity-60 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.slice(0, 5)}>
                        <Area type="monotone" dataKey="leads" stroke="currentColor" fill="currentColor" fillOpacity={0.1} strokeWidth={2} className={stat.color} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Card className="bg-card/40 backdrop-blur-xl border-gold-200/10 shadow-2xl overflow-hidden rounded-3xl">
          <CardHeader className="p-8 border-b border-gold-200/10 bg-black/40 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-[0.25em] flex items-center gap-4">
                <TrendingUp className="h-5 w-5 text-gold-100" /> Desempenho Operacional
              </CardTitle>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest pl-9">Fluxo de Triagem vs. Protocolos (Últimos 7 dias)</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold-100" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Triagem</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Processos</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-10">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DFC88E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#DFC88E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff10" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#ffffff40', fontWeight: 'bold' }}
                  />
                  <YAxis hide />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#141B2D', border: '1px solid #DFC88E20', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="#DFC88E" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={3} />
                  <Area type="monotone" dataKey="cases" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCases)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="h-full bg-card border-gold-200/10 shadow-2xl overflow-hidden flex flex-col rounded-3xl">
          <CardHeader className="p-8 border-b border-gold-200/10 bg-black/40 flex flex-row items-center justify-between backdrop-blur-md">
            <CardTitle className="text-xs font-bold text-white uppercase tracking-[0.25em] flex items-center gap-4">
              <div className="p-2 bg-gold-200/10 rounded-lg">
                <Gavel className="h-5 w-5 text-gold-100" />
              </div>
              Próximas Audiências
            </CardTitle>
            <Button variant="ghost" asChild className="text-[10px] font-bold text-gold-100 uppercase h-9 px-5 hover:bg-gold-200/10 rounded-xl transition-all hover:gap-3">
              <Link href="/agenda" className="flex items-center">Visualizar Pauta <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-8 flex-1">
            {recentHearings && recentHearings.length > 0 ? (
              <div className="space-y-4">
                {recentHearings.map((hearing, i) => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-gold-200/30 transition-all group hover:bg-white/[0.05]">
                    <div className="flex gap-6 items-center">
                      <div className="flex flex-col items-center justify-center bg-secondary h-16 w-20 rounded-xl border border-white/10 shadow-2xl group-hover:border-gold-200/20 transition-colors">
                        <span className="text-[11px] font-black text-gold-100 uppercase leading-none">
                          {hearing.startDateTime ? new Date(hearing.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-lg text-white truncate group-hover:text-gold-100 transition-colors leading-tight uppercase tracking-tight">{hearing.title}</div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-2 opacity-50 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-100/40 animate-pulse" />
                          {hearing.location || "Virtual RGMJ"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-gold-100 transition-all group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 opacity-40 space-y-6">
                <div className="p-6 bg-gold-200/5 rounded-full border border-gold-200/10">
                  <Gavel className="h-10 w-10 text-gold-100/30" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-gold-100/60">Pauta Judiciária Limpa</p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Nenhuma audiência agendada para hoje</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Card className="bg-card/40 backdrop-blur-xl border-rose-500/20 shadow-2xl relative overflow-hidden rounded-3xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500/40" />
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-[0.25em] flex items-center gap-4">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-rose-500" />
                </div>
                Radar de Riscos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-4">
                {deadlines && deadlines.length > 0 ? (
                  deadlines.slice(0, 3).map((d, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 group hover:border-rose-500/40 transition-all hover:bg-rose-500/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2.5 py-0.5 rounded-sm">
                          <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping" />
                          URGENTE
                        </span>
                        <span className="text-[10px] font-mono font-bold text-white/30">{d.dueDate}</span>
                      </div>
                      <p className="text-white text-xs font-bold truncate uppercase leading-tight group-hover:text-rose-500 transition-colors">{d.title}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-10 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center text-center space-y-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Ambiente Seguro</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" asChild className="w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground h-11 hover:text-gold-100 hover:bg-gold-200/10 rounded-xl border border-white/5 transition-all">
                <Link href="/deadlines" className="flex items-center justify-center">Auditoria Completa <ArrowRight className="h-3.5 w-3.5 ml-3 group-hover:translate-x-1 transition-transform" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-8 space-y-6 shadow-2xl rounded-3xl">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-100/40" />
              Log de Proatividade
            </h4>
            <div className="space-y-5">
              {recentNotifications && recentNotifications.length > 0 ? (
                recentNotifications.map((n, i) => (
                  <div key={i} className="flex gap-4 items-start group">
                    <div className={cn(
                      "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border transition-all group-hover:scale-110 group-hover:rotate-3 shadow-lg",
                      n.type === 'deadline' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                      n.type === 'lead' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                      n.type === 'financial' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                      "bg-primary/10 border-primary/20 text-primary"
                    )}>
                      {n.type === 'deadline' ? <Clock className="h-4 w-4" /> :
                       n.type === 'lead' ? <Zap className="h-4 w-4" /> :
                       n.type === 'financial' ? <TrendingUp className="h-4 w-4" /> :
                       <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[11px] font-bold text-white uppercase truncate leading-tight group-hover:text-gold-100 transition-colors">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1.5 truncate opacity-40 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest text-center py-4 opacity-20">Sem alertas recentes</p>
              )}
            </div>
            <Button variant="ghost" asChild className="w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground h-11 hover:text-gold-100 hover:bg-gold-200/10 rounded-xl transition-all">
              <Link href="/notifications" className="flex items-center justify-center">Ver Histórico <ChevronRight className="h-3.5 w-3.5 ml-2" /></Link>
            </Button>
          </Card>

          <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-8 space-y-6 shadow-2xl rounded-3xl">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-100/40" />
              Comandos Rápidos
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="bg-white/[0.03] border-white/5 h-24 rounded-2xl hover:border-gold-200/40 group transition-all text-white p-0 hover:bg-gold-200/5 hover:-translate-y-1">
                <Link href="/leads" className="flex flex-col items-center justify-center w-full h-full gap-3">
                  <div className="p-2.5 bg-gold-200/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Zap className="h-5 w-5 text-gold-100" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Triagem</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-white/[0.03] border-white/5 h-24 rounded-2xl hover:border-gold-200/40 group transition-all text-white p-0 hover:bg-gold-200/5 hover:-translate-y-1">
                <Link href="/drafting" className="flex flex-col items-center justify-center w-full h-full gap-3">
                  <div className="p-2.5 bg-gold-200/10 rounded-xl group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5 text-gold-100" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Minutas</span>
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
