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
  const { user, role } = useUser()

  // O dono (e-mail específico) ou qualquer um com role na sessão pode disparar as queries
  const isOwner = user?.email === 'luizao16@gmail.com' || user?.email === 'luizpaulo.dev.apps@gmail.com'
  const canQuery = !!(user && (isOwner || role))

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
      { label: "Repasses Pendentes", value: `R$ ${totalRepasses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, icon: TrendingUp, color: "text-emerald-500" },
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

  const displayName = user?.displayName || "Dr. Reinaldo Gonçalves"

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-headline font-bold text-white mb-2">
          Bem-vindo, <span className="text-primary">{displayName}</span>
        </h1>
        <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Centro de Comando Estratégico RGMJ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="glass border-primary/10 hover-gold transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-500 font-bold uppercase">
                <ArrowUpRight className="h-3 w-3" /> Atualizado agora
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline text-white flex items-center gap-2">
              <Gavel className="h-5 w-5 text-primary" /> Próximas Audiências
            </CardTitle>
            <Link href="/agenda" className="text-[10px] font-bold text-primary uppercase hover:underline">Ver Pauta Completa</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentHearings && recentHearings.length > 0 ? (
                recentHearings.map((hearing, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-primary/5 hover:bg-secondary/50 transition-colors group">
                    <div className="flex gap-4 items-center">
                      <div className="text-primary font-bold text-sm bg-primary/10 h-10 w-14 flex items-center justify-center rounded-lg">
                        {hearing.startDateTime ? new Date(hearing.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{hearing.title}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{hearing.type} • {hearing.location || "Sala Virtual"}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-primary/20 text-primary opacity-0 group-hover:opacity-100 transition-opacity">Detalhes</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground italic text-sm">
                  Nenhuma audiência agendada para os próximos dias.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-destructive/20">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="font-headline text-white">Alertas Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deadlines && deadlines.length > 0 ? (
                deadlines.slice(0, 3).map((d, i) => (
                  <div key={i} className="p-4 rounded-xl bg-destructive/10 border-l-4 border-destructive text-xs space-y-1">
                    <div className="font-bold text-destructive uppercase tracking-widest">Atenção ao Prazo</div>
                    <p className="text-white/80 truncate">{d.title}: {d.dueDate}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-primary/10 border-l-4 border-primary text-xs space-y-1">
                  <div className="font-bold text-primary uppercase tracking-widest">Tudo em Dia</div>
                  <p className="text-white/80">Nenhum alerta crítico pendente no radar.</p>
                </div>
              )}
            </div>
            <Button variant="ghost" asChild className="w-full mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white">
              <Link href="/deadlines">Ver todos os alertas <ChevronRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}