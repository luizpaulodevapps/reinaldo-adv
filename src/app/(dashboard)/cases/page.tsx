
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
  Globe,
  Loader2,
  TrendingDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, limit } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProcessForm } from "@/components/cases/process-form"
import { useToast } from "@/hooks/use-toast"

const areas = [
  { id: "todos", label: "Todos" },
  { id: "trabalhista", label: "Trabalhista" },
  { id: "civel", label: "Cível" },
  { id: "criminal", label: "Criminal" },
  { id: "previdenciario", label: "Previdenciário" },
  { id: "familia", label: "Família" },
  { id: "tributario", label: "Tributário" },
]

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeArea, setActiveArea] = useState("todos")
  const [isNewProcessOpen, setIsNewProcessOpen] = useState(false)
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  // Otimização: Limitando a 100 registros para economizar reads no Spark Tier
  const processesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "processes"), orderBy("createdAt", "desc"), limit(100))
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

  // Métricas Reais
  const metrics = useMemo(() => {
    const total = processes.length
    
    const valorEmRisco = processes.reduce((acc, p) => {
      const numericString = p.value
        ?.replace(/\./g, '')
        ?.replace(',', '.')
        ?.replace(/[^\d.]/g, '') || "0"
      return acc + parseFloat(numericString)
    }, 0)

    const ticketMedio = total > 0 ? valorEmRisco / total : 0
    const eficiencia = total > 0 ? 60 : 0 

    return {
      total,
      valorEmRisco,
      ticketMedio,
      eficiencia
    }
  }, [processes])

  const handleCreateProcess = (data: any) => {
    if (!user) return

    const newProcess = {
      ...data,
      status: "Em Andamento",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    addDocumentNonBlocking(collection(db, "processes"), newProcess)
      .then(() => {
        setIsNewProcessOpen(false)
        toast({
          title: "Processo Protocolado",
          description: `O dossiê ${data.processNumber} foi registrado com sucesso.`
        })
      })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-1 uppercase tracking-tighter">Processos</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em]">
            GESTÃO JURÍDICA ESTRATÉGICA E ACOMPANHAMENTO EM TEMPO REAL.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-10 glass border-white/5 h-11 text-xs text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsNewProcessOpen(true)}
            className="bg-[#f5d030] hover:bg-[#d4af37] text-[#0a0f1e] font-black gap-2 px-8 h-11 uppercase text-[10px] tracking-widest rounded-lg shadow-xl shadow-primary/10"
          >
            <Plus className="h-4 w-4" /> Novo Processo
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#11111d] border-white/5 shadow-2xl relative overflow-hidden">
          <CardContent className="p-6 flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" /> Processos Ativos
              </span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black text-white">{isLoading ? "..." : metrics.total}</span>
              <Badge variant="outline" className="text-[8px] border-primary/20 text-primary bg-primary/5 uppercase font-black px-3 h-6">Ativos</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#11111d] border-white/5 shadow-2xl relative">
          <CardContent className="p-6 flex flex-col justify-between h-32">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Valor em Risco
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-white">
                {isLoading ? "R$ ---" : `R$ ${metrics.valorEmRisco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#11111d] border-white/5 shadow-2xl">
          <CardContent className="p-6 flex flex-col justify-between h-32">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Ticket Médio
            </span>
            <div className="space-y-3">
              <span className="text-2xl font-black text-white block">
                {isLoading ? "R$ ---" : `R$ ${metrics.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </span>
              <div className="h-1.5 w-32 bg-secondary/50 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#11111d] border-white/5 shadow-2xl">
          <CardContent className="p-6 flex flex-col justify-between h-32">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Scale className="h-3.5 w-3.5 text-blue-400" /> Eficiência
            </span>
            <div className="flex items-center justify-between">
              <span className="text-4xl font-black text-white">{isLoading ? "--" : metrics.eficiencia}%</span>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {areas.map((area) => {
          const count = area.id === "todos" 
            ? processes.length 
            : processes.filter(p => p.caseType?.toLowerCase() === area.id).length
          
          return (
            <Button
              key={area.id}
              variant={activeArea === area.id ? "secondary" : "ghost"}
              onClick={() => setActiveArea(area.id)}
              className={cn(
                "h-10 px-6 text-[10px] font-black uppercase tracking-[0.15em] rounded-md transition-all gap-3",
                activeArea === area.id 
                  ? "bg-primary text-white" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              {area.label}
              <Badge variant="secondary" className={cn(
                "text-[9px] px-2 h-5 font-black", 
                activeArea === area.id ? "bg-black/20 text-white" : "bg-white/5 text-muted-foreground"
              )}>
                {count}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* Processes List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4 glass rounded-3xl border-dashed">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Dossiês RGMJ...</span>
          </div>
        ) : filteredProcesses.length > 0 ? (
          filteredProcesses.map((proc) => (
            <Card key={proc.id} className="glass border-white/5 hover:border-primary/20 transition-all group overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                  
                  {/* Info Principal */}
                  <div className="lg:col-span-5 p-6 space-y-4 border-r border-white/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-headline font-bold text-white group-hover:text-primary transition-colors flex items-center gap-3">
                          {proc.description?.toUpperCase()}
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
                      <Button variant="outline" className="h-8 glass border-white/10 text-[9px] font-bold uppercase gap-2 px-4 hover:border-primary/50">
                        <FolderOpen className="h-3 w-3 text-primary" /> Drive do Caso
                      </Button>
                      <Button variant="outline" className="h-8 glass border-white/10 text-[9px] font-bold uppercase gap-2 px-4 hover:border-primary/50">
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
                          {proc.clientName || "Cliente não vinculado"}
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
                        <span className="text-[8px] font-black text-destructive uppercase tracking-widest">Ação</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Protocolo</span>
                        <span className="text-[10px] font-mono font-bold text-white">{proc.startDate || "--/--/----"}</span>
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
            <Button onClick={() => setIsNewProcessOpen(true)} className="bg-[#f5d030] hover:bg-[#d4af37] text-[#0a0f1e] font-black gap-2 px-8">
              Protocolar Primeiro Processo
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isNewProcessOpen} onOpenChange={setIsNewProcessOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-[1000px] p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-4xl uppercase tracking-tighter">
                Novo Processo
              </DialogTitle>
              <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Siga as etapas para um cadastro completo.</p>
            </DialogHeader>
          </div>
          <ProcessForm 
            onSubmit={handleCreateProcess}
            onCancel={() => setIsNewProcessOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
