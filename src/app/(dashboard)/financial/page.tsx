"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  RefreshCw, 
  Zap, 
  ChevronRight, 
  Users, 
  ShieldCheck, 
  Building2, 
  History, 
  Scale,
  Loader2,
  Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function FinancialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const db = useFirestore()
  const { user } = useUser()

  // Sincroniza perfil para autorização
  const profileRef = useMemoFirebase(() => user ? doc(db, 'staff_profiles', user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)
  
  const isOwner = user?.email === 'luizao16@gmail.com' || user?.email === 'luizpaulo.dev.apps@gmail.com'
  const canQuery = !!(user && (isOwner || profile?.role))

  // Busca Equipe
  const staffQuery = useMemoFirebase(() => {
    if (!canQuery) return null
    return query(collection(db, "staff_profiles"), orderBy("name", "asc"))
  }, [db, canQuery])
  const { data: team, isLoading: loadingTeam } = useCollection(staffQuery)

  // Busca Créditos/Repasses
  const creditsQuery = useMemoFirebase(() => {
    if (!canQuery) return null
    return collection(db, "staff_credits")
  }, [db, canQuery])
  const { data: credits, isLoading: loadingCredits } = useCollection(creditsQuery)

  // Cálculos de Métricas
  const stats = useMemo(() => {
    if (!credits) return { liquidado: 0, liberado: 0, retido: 0, ativos: 0 }
    
    const liquidado = credits.filter(c => c.status === 'Pago').reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
    const liberado = credits.filter(c => c.status === 'Disponível').reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
    const retido = credits.filter(c => c.status === 'Retido').reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
    const ativos = new Set(credits.filter(c => c.status === 'Disponível').map(c => c.staffId)).size

    return { liquidado, liberado, retido, ativos }
  }, [credits])

  const filteredTeam = useMemo(() => {
    if (!team) return []
    return team.filter(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [team, searchTerm])

  const getStaffBalance = (staffId: string) => {
    if (!credits) return 0
    return credits
      .filter(c => c.staffId === staffId && c.status === 'Disponível')
      .reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
  }

  const isLoading = loadingTeam || loadingCredits

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <Link href="/dashboard" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span>Dashboard</span>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">Carteira & Repasses</span>
          </div>
          <h1 className="text-4xl font-headline font-bold text-white tracking-tight">Gestão de Carteiras & Repasses</h1>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest opacity-70">
            Auditoria de saldos vinculados e controle de honorários da banca.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="glass border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase h-11 gap-2 px-6 hover:bg-emerald-500/10">
            <Zap className="h-3.5 w-3.5" /> Rodar Folha Mensal
          </Button>
          <Button variant="outline" className="glass border-primary/20 text-primary text-[10px] font-bold uppercase h-11 gap-2 px-6" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5" /> Recarregar Saldos
          </Button>
        </div>
      </div>

      {/* Métricas Horizontais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-emerald-500/10 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-emerald-500/70 uppercase tracking-[0.2em] mb-2">Total Liquidado (Mês)</p>
            <div className="text-3xl font-black text-white tabular-nums">
              R$ {stats.liquidado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-primary/10 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-primary/70 uppercase tracking-[0.2em] mb-2">Saldos Liberados (Banca)</p>
            <div className="text-3xl font-black text-white tabular-nums">
              R$ {stats.liberado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-blue-500/10 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-blue-500/70 uppercase tracking-[0.2em] mb-2">Honorários Retidos (Futuro)</p>
            <div className="text-3xl font-black text-white tabular-nums">
              R$ {stats.retido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Ativos p/ Liquidação</p>
            <div className="text-3xl font-black text-white">
              {stats.ativos}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Abas e Listagem */}
      <Tabs defaultValue="advogados" className="space-y-6">
        <TabsList className="bg-[#0a1420]/50 border border-white/5 h-12 p-1 gap-1 w-full justify-start rounded-xl">
          <TabsTrigger value="advogados" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-6 gap-2">
            <Scale className="h-3.5 w-3.5" /> Advogados
          </TabsTrigger>
          <TabsTrigger value="colaboradores" className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-6 gap-2">
            <Users className="h-3.5 w-3.5" /> Colaboradores
          </TabsTrigger>
          <TabsTrigger value="provedores" className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-6 gap-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Provedores
          </TabsTrigger>
          <TabsTrigger value="banca" className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-6 gap-2 border-l border-white/10 ml-2">
            <Building2 className="h-3.5 w-3.5 text-emerald-500" /> Banca (RGMJ)
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-6 gap-2">
            <History className="h-3.5 w-3.5" /> Histórico Geral
          </TabsTrigger>
        </TabsList>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar colaborador..." 
            className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50 max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="glass border-white/5 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Sincronizando Carteiras...</span>
              </div>
            ) : filteredTeam.length > 0 ? (
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest py-6 pl-10">Nome do Colaborador</TableHead>
                    <TableHead className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest py-6 text-center">Perfil</TableHead>
                    <TableHead className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest py-6 text-right">Total Disponível</TableHead>
                    <TableHead className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest py-6 text-right pr-10">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeam.map((member) => {
                    const balance = getStaffBalance(member.id)
                    return (
                      <TableRow key={member.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <TableCell className="py-6 pl-10">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-primary/20 bg-secondary">
                              <AvatarFallback className="text-[10px] font-black text-primary uppercase">
                                {member.name ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '??'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-bold text-white uppercase tracking-tight">
                              {member.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/10 text-muted-foreground py-1 px-3">
                            {member.role || "MEMBRO"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-white text-sm tabular-nums">
                          R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex items-center justify-end gap-6">
                            <button className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-all">
                              VER CARTEIRA
                            </button>
                            <button className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-all">
                              QUITAR SALDO
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center space-y-6 opacity-30">
                <Wallet className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-center">Nenhum saldo encontrado para os filtros.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}