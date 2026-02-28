
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  Plus, 
  History, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  ChevronRight, 
  X,
  LayoutGrid
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function RefundsPage() {
  const [activeTab, setActiveTab] = useState("meus-pedidos")
  const db = useFirestore()
  const { user } = useUser()

  // Sincroniza dados reais de reembolso
  const refundsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(
      collection(db, "financial_titles"), 
      where("type", "==", "Reembolso"), 
      orderBy("dueDate", "desc")
    )
  }, [db, user])

  const { data: refunds, isLoading } = useCollection(refundsQuery)

  // Cálculos de métricas baseados na pauta real
  const stats = useMemo(() => {
    if (!refunds) return { solicitado: 0, pendente: 0, pago: 0 }
    return {
      solicitado: refunds.reduce((acc, r) => acc + (r.value || 0), 0),
      pendente: refunds.filter(r => r.status === 'Pendente').reduce((acc, r) => acc + (r.value || 0), 0),
      pago: refunds.filter(r => r.status === 'Recebido').reduce((acc, r) => acc + (r.value || 0), 0),
    }
  }, [refunds])

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <Link href="/dashboard" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span>Dashboard</span>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">Reembolsos</span>
          </div>
          <h1 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            <span className="text-primary text-3xl">$</span> Gestão de Reembolsos
          </h1>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest opacity-70">
            Controle de despesas e solicitações de ressarcimento.
          </p>
        </div>
        
        <Button className="gold-gradient text-background font-bold gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-lg shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform">
          <Plus className="h-4 w-4" /> Solicitar Reembolso
        </Button>
      </div>

      {/* Grid de Métricas (Screenshot Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Solicitado */}
        <Card className="glass border-white/5 relative overflow-hidden h-28 flex flex-col justify-center">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Total Solicitado</p>
              <div className="text-2xl font-black text-white tabular-nums">
                R$ {stats.solicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aguardando Aprovação */}
        <Card className="glass border-white/5 relative overflow-hidden h-28 flex flex-col justify-center">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Aguardando Aprovação</p>
              <div className="text-2xl font-black text-white tabular-nums">
                R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Pago */}
        <Card className="glass border-white/5 relative overflow-hidden h-28 flex flex-col justify-center">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Total Pago</p>
              <div className="text-2xl font-black text-white tabular-nums">
                R$ {stats.pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Content Area */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
        <TabsList className="bg-[#0a1420]/50 border border-white/5 h-12 p-1 gap-1 w-full justify-start rounded-xl mb-6 max-w-fit">
          <TabsTrigger 
            value="meus-pedidos" 
            className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-6 gap-2 transition-all rounded-lg"
          >
            Meus Pedidos
          </TabsTrigger>
          <TabsTrigger 
            value="fila-administrativa" 
            className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-6 gap-2 transition-all rounded-lg"
          >
            Fila Administrativa (Todos)
          </TabsTrigger>
        </TabsList>

        <div className="glass rounded-3xl border-white/5 min-h-[450px] flex flex-col items-center justify-center relative border-dashed border-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Despesas...</span>
            </div>
          ) : refunds && refunds.length > 0 ? (
            <div className="w-full p-8 divide-y divide-white/5">
              {refunds.map((ref) => (
                <div key={ref.id} className="py-6 flex items-center justify-between group hover:bg-white/[0.02] -mx-8 px-8 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold uppercase text-sm tracking-tight">{ref.description}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                        Solicitado em: {ref.dueDate} • #{ref.id.substring(0, 6).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-lg font-black text-white">R$ {ref.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <Badge 
                        variant={ref.status === 'Recebido' ? 'default' : 'outline'}
                        className={cn(
                          "text-[9px] font-black uppercase h-5 px-3", 
                          ref.status === 'Recebido' ? "bg-emerald-500 text-white" : "border-white/10 text-muted-foreground"
                        )}
                      >
                        {ref.status === 'Recebido' ? 'PAGO' : 'AGUARDANDO'}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white transition-all">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6 opacity-40">
              <div className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                <X className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Nenhum registro encontrado</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Novas solicitações aparecerão aqui conforme registradas.
                </p>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  )
}
