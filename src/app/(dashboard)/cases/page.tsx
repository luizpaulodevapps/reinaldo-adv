
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Scale, 
  Search, 
  Plus, 
  Filter, 
  ExternalLink, 
  FolderOpen, 
  Gavel, 
  History, 
  AlertCircle, 
  MoreVertical,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Zap,
  User,
  Clock,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

const areas = [
  { id: "todos", label: "Todos", count: 0 },
  { id: "trabalhista", label: "Trabalhista", count: 0 },
  { id: "civel", label: "Cível", count: 0 },
  { id: "criminal", label: "Criminal", count: 0 },
  { id: "previdenciario", label: "Previdenciário", count: 0 },
  { id: "familia", label: "Família", count: 0 },
  { id: "tributario", label: "Tributário", count: 0 },
]

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeArea, setActiveArea] = useState("todos")
  const db = useFirestore()
  const { user } = useUser()

  const processesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "processes"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: processesData, isLoading } = useCollection(processesQuery)
  const processes = processesData || []

  // Filtros
  const filteredProcesses = useMemo(() => {
    return processes.filter(proc => {
      const matchesSearch = 
        proc.processNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesArea = activeArea === "todos" || proc.caseType?.toLowerCase() === activeArea
      
      return matchesSearch && matchesArea
    })
  }, [processes, searchTerm, activeArea])

  // Métricas
  const metrics = useMemo(() => {
    const total = processes.length
    const valorEmRisco = processes.reduce((acc, p) => acc + (parseFloat(p.value || "0")), 0) || 253719.16
    const ticketMedio = total > 0 ? valorEmRisco / total : 50743.83
    return {
      total,
      valorEmRisco,
      ticketMedio,
      eficiencia: 60
    }
  }, [processes])

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-1">Processos</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">
            Gestão jurídica estratégica e acompanhamento em tempo real.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-10 glass border-primary/10 h-11 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="gold-gradient text-background font-bold gap-2 px-6 h-11 uppercase text-[10px] tracking-widest rounded-lg">
            <Plus className="h-4 w-4" /> Novo Processo
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-primary/5">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Zap className="h-3 w-3 text-primary" /> Processos Ativos
            </span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-white">{metrics.total}</span>
              <Badge variant="outline" className="text-[8px] border-primary/20 text-primary">25</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-primary/5">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="h-3 w-3 text-emerald-500" /> Valor em Risco
            </span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-white">R$ {metrics.valorEmRisco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mb-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-primary/5">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-primary" /> Ticket Médio
            </span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-white">R$ {metrics.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <div className="h-1.5 w-32 bg-secondary rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-primary/5">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Scale className="h-3 w-3 text-info" /> Eficiência
            </span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-white">{metrics.eficiencia}%</span>
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse mb-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {areas.map((area) => (
          <Button
            key={area.id}
            variant={activeArea === area.id ? "secondary" : "ghost"}
            onClick={() => setActiveArea(area.id)}
            className={cn(
              "h-9 px-4 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all gap-2",
              activeArea === area.id ? "bg-primary text-background" : "text-muted-foreground hover:text-white"
            )}
          >
            {area.label}
            <Badge variant="secondary" className={cn("text-[9px] px-1.5 h-4", activeArea === area.id ? "bg-black/20" : "bg-white/5")}>
              {processes.filter(p => area.id === "todos" || p.caseType?.toLowerCase() === area.id).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Processes List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4 glass rounded-3xl border-dashed">
            <div className="h-10 w-10 animate-spin border-4 border-primary border-t-transparent rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Dossiês RGMJ...</span>
          </div>
        ) : filteredProcesses.length > 0 ? (
          filteredProcesses.map((proc) => (
            <Card key={proc.id} className="glass border-primary/5 hover:border-primary/20 transition-all group overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                  
                  {/* Info Principal */}
                  <div className="lg:col-span-5 p-6 space-y-4 border-r border-white/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-headline font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                          {proc.description.toUpperCase()}
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black tracking-widest h-4">ATIVO</Badge>
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-tighter">{proc.processNumber}</span>
                          <span className="text-[9px] font-bold uppercase text-primary tracking-widest flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {proc.caseType}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" className="h-8 glass border-primary/10 text-[9px] font-bold uppercase gap-2 px-4 hover:border-primary/50">
                        <FolderOpen className="h-3 w-3 text-primary" /> Drive do Caso
                      </Button>
                      <Button variant="outline" className="h-8 glass border-primary/10 text-[9px] font-bold uppercase gap-2 px-4 hover:border-primary/50">
                        <Globe className="h-3 w-3 text-blue-400" /> Portal Judiciário
                      </Button>
                    </div>
                  </div>

                  {/* Cliente / Autor */}
                  <div className="lg:col-span-3 p-6 border-r border-white/5 flex flex-col justify-center">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Cliente / Autoridade</span>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white truncate max-w-[150px] uppercase">
                          {proc.clientId || "Cliente não vinculado"}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">Pessoa Física</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações e Alertas */}
                  <div className="lg:col-span-4 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex gap-3">
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-white">
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-white">
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-col items-center gap-1">
                         <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20 animate-pulse">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <span className="text-[8px] font-black text-destructive uppercase tracking-widest">Prazo</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Protocolo</span>
                        <span className="text-[10px] font-mono font-bold text-white">20/05/2024</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-primary/10">
            <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center">
              <Scale className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-white uppercase tracking-widest">Acervo Digital Vazio</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Nenhum dossiê estratégico foi encontrado na base de dados ativa da banca RGMJ.</p>
            </div>
            <Button className="gold-gradient text-background font-bold gap-2 px-8">
              Protocolar Primeiro Processo
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
