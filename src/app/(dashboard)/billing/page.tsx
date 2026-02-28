
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Wallet, 
  Calculator, 
  ChevronRight, 
  LayoutGrid, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Receipt,
  Loader2,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function BillingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const db = useFirestore()
  const { user } = useUser()

  // Sincroniza perfil para autorização de query
  const profileRef = useMemoFirebase(() => user ? doc(db, 'staff_profiles', user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)
  const canQuery = !!(user && profile?.role)

  // Busca todos os títulos financeiros
  const financialQuery = useMemoFirebase(() => {
    if (!canQuery) return null
    return query(collection(db, "financial_titles"), orderBy("dueDate", "desc"))
  }, [db, canQuery])

  const { data: transactions, isLoading } = useCollection(financialQuery)

  // Cálculos de métricas baseados no screenshot
  const stats = useMemo(() => {
    if (!transactions) return { real: 0, bruto: 0, pendente: 0, custos: 0 }
    
    const bruto = transactions
      .filter(t => t.status === 'Recebido' && (t.type === 'Honorário' || t.type === 'Repasse'))
      .reduce((acc, t) => acc + (t.value || 0), 0)

    const pendente = transactions
      .filter(t => t.status === 'Pendente' && t.type === 'Honorário')
      .reduce((acc, t) => acc + (t.value || 0), 0)

    const custos = transactions
      .filter(t => t.type === 'Custo Processual' || t.type === 'Reembolso')
      .reduce((acc, t) => acc + (t.value || 0), 0)

    // Receita Real simula 30% dos honorários recebidos conforme label do screenshot
    const real = bruto * 0.3

    return { real, bruto, pendente, custos }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transactions, searchTerm])

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
            <span className="text-white">Financeiro</span>
          </div>
          <h1 className="text-4xl font-headline font-bold text-white tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest opacity-70">
            Controle estratégico de faturamento e despesas operacionais.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar lançamentos..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="glass border-primary/20 text-[10px] font-bold uppercase h-12 gap-2 px-6">
            <Wallet className="h-4 w-4 text-primary" /> Ir para Repasses & Folha
          </Button>
          <Button className="gold-gradient text-background font-bold gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-lg shadow-lg shadow-primary/10">
            <Plus className="h-4 w-4" /> Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Grid de Métricas (Screenshot Style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Receita Real */}
        <Card className="glass border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-3">Receita Real (Honorários 30%)</p>
            <div className="text-3xl font-black text-primary tabular-nums">
              R$ {stats.real.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        {/* Total Bruto */}
        <Card className="glass border-emerald-500/10 relative overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-emerald-500/70 uppercase tracking-[0.2em] mb-3">Total Bruto Recebido</p>
            <div className="text-3xl font-black text-emerald-500 tabular-nums">
              R$ {stats.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        {/* Receitas Pendentes */}
        <Card className="glass border-amber-500/10 relative overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-amber-500/70 uppercase tracking-[0.2em] mb-3">Receitas Pendentes</p>
            <div className="text-3xl font-black text-amber-500 tabular-nums">
              R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        {/* Total de Custos */}
        <Card className="glass border-rose-500/10 relative overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-rose-500/70 uppercase tracking-[0.2em] mb-3">Total de Custos (Saídas)</p>
            <div className="text-3xl font-black text-rose-500 tabular-nums">
              R$ {stats.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Content Area */}
      <Tabs defaultValue="receitas" className="space-y-0">
        <TabsList className="bg-white/5 border border-white/5 h-14 p-1 gap-1 w-full justify-start rounded-t-xl rounded-b-none border-b-0">
          <TabsTrigger 
            value="receitas" 
            className="data-[state=active]:bg-[#0a1420] data-[state=active]:text-emerald-400 text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-10 gap-2 transition-all"
          >
            <ArrowUpRight className="h-3.5 w-3.5" /> Receitas
          </TabsTrigger>
          <TabsTrigger 
            value="despesas" 
            className="data-[state=active]:bg-[#0a1420] data-[state=active]:text-rose-400 text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-10 gap-2 transition-all"
          >
            <ArrowDownRight className="h-3.5 w-3.5" /> Despesas
          </TabsTrigger>
          <TabsTrigger 
            value="bi" 
            className="data-[state=active]:bg-[#0a1420] data-[state=active]:text-primary text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-10 gap-2 transition-all"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Painel BI
          </TabsTrigger>
        </TabsList>

        <div className="glass rounded-b-xl border-t-0 p-0 min-h-[500px] flex flex-col items-center justify-center relative">
          <TabsContent value="receitas" className="w-full m-0 p-0 h-full flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Lançamentos...</span>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="divide-y divide-white/5 w-full">
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white uppercase text-sm tracking-tight">{t.description}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                          Vencimento: {t.dueDate} • {t.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-lg font-black text-white">R$ {t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <Badge 
                          variant={t.status === 'Recebido' ? 'default' : 'outline'}
                          className={cn("text-[9px] font-black uppercase h-5", t.status === 'Recebido' ? "bg-emerald-500 text-white" : "border-white/10")}
                        >
                          {t.status}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary transition-all">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-30">
                <Calculator className="h-16 w-16 text-muted-foreground" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center">Nenhuma receita encontrada</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="despesas" className="w-full m-0 p-0 flex-1 flex flex-col">
             <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-30">
                <Calculator className="h-16 w-16 text-muted-foreground" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center">Nenhuma despesa registrada</p>
              </div>
          </TabsContent>

          <TabsContent value="bi" className="w-full m-0 p-0 flex-1 flex flex-col">
             <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <BarChart3 className="h-16 w-16 text-primary opacity-20" />
                <div className="text-center space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em]">Módulo BI em Processamento</p>
                  <Button variant="link" asChild className="text-primary text-[10px] font-black uppercase tracking-widest">
                    <Link href="/reports">Ver Relatórios Completos <ChevronRight className="h-3 w-3 ml-1" /></Link>
                  </Button>
                </div>
              </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
