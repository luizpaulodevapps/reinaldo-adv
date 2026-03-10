
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Scale, 
  Search, 
  Plus, 
  Loader2, 
  Zap,
  ChevronRight,
  MoreVertical,
  Edit3,
  Trash2,
  Archive,
  LayoutGrid,
  List,
  Gavel,
  ShieldCheck,
  TrendingUp,
  FileText,
  User as UserIcon,
  Calendar,
  Clock,
  Handshake,
  ChevronDown,
  FolderOpen,
  ExternalLink,
  User,
  History,
  CalendarDays,
  AlarmClock,
  FilePlus,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, limit, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ProcessForm } from "@/components/cases/process-form"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const AREAS = [
  { id: "todos", label: "TODOS" },
  { id: "trabalhista", label: "TRABALHISTA" },
  { id: "cível", label: "CÍVEL" },
  { id: "previdenciário", label: "PREVIDENCIÁRIO" },
  { id: "tributário", label: "TRIBUTÁRIO" },
]

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeArea, setActiveArea] = useState("todos")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<any>(null)
  
  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const processesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "processes"), orderBy("createdAt", "desc"), limit(100))
  }, [db, user])

  const { data: processesData, isLoading } = useCollection(processesQuery)
  const processes = processesData || []

  const filteredProcesses = useMemo(() => {
    return processes.filter(proc => {
      if (proc.status === "Arquivado") return false
      
      const matchesSearch = 
        proc.processNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesArea = activeArea === "todos" || proc.caseType?.toLowerCase() === activeArea.toLowerCase()
      
      return matchesSearch && matchesArea
    })
  }, [processes, searchTerm, activeArea])

  const metrics = useMemo(() => {
    const activeOnes = processes.filter(p => p.status !== "Arquivado")
    const total = activeOnes.length
    const valorEmRisco = activeOnes.reduce((acc, p) => {
      const val = typeof p.value === 'number' ? p.value : parseFloat(String(p.value || "0").replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''))
      return acc + (isNaN(val) ? 0 : val)
    }, 0)
    const ticketMedio = total > 0 ? valorEmRisco / total : 0
    return { total, valorEmRisco, ticketMedio }
  }, [processes])

  const handleOpenCreate = () => {
    setEditingProcess(null)
    setIsSheetOpen(true)
  }

  const handleOpenEdit = (proc: any) => {
    setEditingProcess(proc)
    setIsSheetOpen(true)
  }

  const handleSaveProcess = (data: any) => {
    if (!user || !db) return
    
    if (editingProcess) {
      updateDocumentNonBlocking(doc(db!, "processes", editingProcess.id), {
        ...data,
        updatedAt: serverTimestamp(),
      })
      toast({ title: "Processo Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db!, "processes"), {
        ...data,
        status: "Em Andamento",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast({ title: "Processo Protocolado" })
    }
    setIsSheetOpen(false)
  }

  const handleDeleteProcess = (id: string) => {
    if (!db || !confirm("Remover permanentemente este processo?")) return
    deleteDocumentNonBlocking(doc(db!, "processes", id))
    toast({ variant: "destructive", title: "Dossiê Removido" })
  }

  const handleArchiveProcess = (id: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db!, "processes", id), {
      status: "Arquivado",
      updatedAt: serverTimestamp()
    })
    toast({ title: "Processo Arquivado" })
  }

  const getDrawerWidthClass = () => {
    const pref = profile?.themePreferences?.drawerWidth || "extra-largo"
    switch (pref) {
      case "padrão": return "sm:max-w-lg"
      case "largo": return "sm:max-w-2xl"
      case "extra-largo": return "sm:max-w-4xl"
      case "full": return "sm:max-w-full"
      default: return "sm:max-w-4xl"
    }
  }

  const ProcessActionsMenu = ({ proc }: { proc: any }) => (
    <DropdownMenuContent align="end" className="w-64 bg-[#0d121f] border-white/10 text-white rounded-xl p-2 shadow-2xl">
      <DropdownMenuLabel className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] px-3 py-2">GESTÃO DO CASO</DropdownMenuLabel>
      
      <DropdownMenuItem className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5">
        <History className="h-4 w-4 text-muted-foreground" /> Timeline do Processo
      </DropdownMenuItem>
      
      <DropdownMenuItem className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-emerald-400">
        <CalendarDays className="h-4 w-4" /> Agendar Reunião/Atend.
      </DropdownMenuItem>
      
      <DropdownMenuItem className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-rose-400">
        <AlarmClock className="h-4 w-4" /> Lançar Prazo Fatal
      </DropdownMenuItem>
      
      <DropdownMenuItem className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-amber-400">
        <Gavel className="h-4 w-4" /> Agendar Audiência
      </DropdownMenuItem>
      
      <DropdownMenuItem className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-emerald-400">
        <FilePlus className="h-4 w-4" /> Gerar Documento (IA)
      </DropdownMenuItem>
      
      <DropdownMenuSeparator className="bg-white/5 my-1" />
      
      <DropdownMenuItem className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-blue-400">
        <DollarSign className="h-4 w-4" /> Evento Financeiro
      </DropdownMenuItem>
      
      <DropdownMenuSeparator className="bg-white/5 my-1" />
      
      <DropdownMenuItem onClick={() => handleOpenEdit(proc)} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5">
        <FileText className="h-4 w-4 text-muted-foreground" /> Editar Dados
      </DropdownMenuItem>
      
      <DropdownMenuItem onClick={() => handleArchiveProcess(proc.id)} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer h-11 rounded-lg hover:bg-white/5 text-rose-500">
        <Archive className="h-4 w-4" /> Arquivar Caso
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span>DASHBOARD</span>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white">DOSSIÊS ATIVOS</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">Gestão de Processos</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-60">
            CONTROLE JURÍDICO ESTRATÉGICO RGMJ.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-12 glass border-white/5 h-11 text-xs text-white focus:ring-primary/50 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleOpenCreate}
            className="gold-gradient text-background font-black gap-3 px-8 h-11 uppercase text-[11px] tracking-widest rounded-xl shadow-2xl hover:scale-[1.02] transition-all"
          >
            <Plus className="h-4 w-4" /> NOVO PROCESSO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/5 relative overflow-hidden h-28 flex flex-col justify-center shadow-xl rounded-2xl group hover:border-primary/20 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary/50 transition-all" />
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-3">
              <Zap className="h-4 w-4" /> DOSSIÊS ATIVOS
            </p>
            <div className="text-2xl font-black text-white tracking-tighter">
              {isLoading ? "..." : metrics.total}
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-white/5 relative overflow-hidden h-28 flex flex-col justify-center rounded-2xl">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 flex items-center gap-3">
              <Scale className="h-4 w-4" /> VALOR SOB GESTÃO
            </p>
            <div className="text-2xl font-black text-white tracking-tighter tabular-nums">
              R$ {metrics.valorEmRisco.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 relative overflow-hidden h-28 flex flex-col justify-center rounded-2xl">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">TICKET MÉDIO</p>
            <div className="text-2xl font-black text-white tracking-tighter tabular-nums">
              R$ {metrics.ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-2">
        <Tabs value={activeArea} onValueChange={setActiveArea} className="w-full md:w-auto">
          <TabsList className="bg-transparent h-10 p-0 gap-8 justify-start">
            {AREAS.map(area => (
              <TabsTrigger 
                key={area.id} 
                value={area.id}
                className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase tracking-[0.25em] h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all"
              >
                {area.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
          <Button 
            onClick={() => setViewMode("list")}
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "list" ? "bg-primary text-background" : "text-muted-foreground")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => setViewMode("grid")}
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "grid" ? "bg-primary text-background" : "text-muted-foreground")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Base Jurídica...</span>
          </div>
        ) : filteredProcesses.length > 0 ? (
          <div className={cn(
            "grid gap-4 transition-all duration-500",
            viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {filteredProcesses.map((proc) => (
              <Card 
                key={proc.id} 
                className={cn(
                  "glass border-white/5 hover-gold transition-all group overflow-hidden cursor-pointer",
                  viewMode === "list" ? "rounded-xl" : "rounded-3xl"
                )}
                onClick={() => handleOpenEdit(proc)}
              >
                <CardContent className={cn("p-6", viewMode === "list" ? "" : "flex-col space-y-6")}>
                  {viewMode === "list" ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <h3 className="text-[#F5D030] font-black text-sm uppercase tracking-tight">RT- {proc.description}</h3>
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] h-5 px-2 rounded-full font-black">ATIVO</Badge>
                        </div>
                        <div className="flex items-center gap-12">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">CLIENTE / OUTORGANTE</span>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded bg-white/5 flex items-center justify-center border border-white/10 text-primary">
                                <User className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs font-bold text-white uppercase">{proc.clientName}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center border border-amber-500/30 bg-amber-500/5 px-2 py-1 rounded-lg">
                              <Calendar className="h-3 w-3 text-amber-500 mb-0.5" />
                              <span className="text-[8px] font-black text-amber-500">12/03/25</span>
                            </div>
                            <div className="flex items-center justify-center p-2 text-muted-foreground/20">
                              <Handshake className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col items-center justify-center border border-rose-500/30 bg-rose-500/5 px-2 py-1 rounded-lg">
                              <Clock className="h-3 w-3 text-rose-500 mb-0.5" />
                              <span className="text-[8px] font-black text-rose-500 uppercase">PRAZOS</span>
                            </div>
                            <div className="flex items-center gap-2 pl-4 border-l border-white/5">
                              <ChevronDown className="h-4 w-4 text-muted-foreground/40" />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <button className="h-8 w-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all outline-none">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <ProcessActionsMenu proc={proc} />
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1">
                        <div className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-muted-foreground tracking-tight">
                          {proc.processNumber}
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <Scale className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{proc.caseType?.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <UserIcon className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">DR(A). {proc.responsibleStaffName || "EQUIPE RGMJ"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="sm" className="h-8 border-emerald-500/30 text-emerald-500 bg-emerald-500/5 text-[9px] font-black uppercase tracking-widest px-3 rounded-lg hover:bg-emerald-500/10 transition-all">
                            <FolderOpen className="h-3.5 w-3.5 mr-2" /> DRIVE DO CASO
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 border-blue-500/30 text-blue-400 bg-blue-500/5 text-[9px] font-black uppercase tracking-widest px-3 rounded-lg hover:bg-blue-500/10 transition-all">
                            <ExternalLink className="h-3.5 w-3.5 mr-2" /> PORTAL JUDICIÁRIO
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground/40">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-widest">PROTOCOLO: {proc.startDate || "---"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-6">
                      <div className="space-y-3 min-w-0 flex-1">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-[9px] font-black border-primary/30 text-primary bg-primary/5 uppercase tracking-[0.15em] px-3 h-6">
                            {proc.caseType?.toUpperCase() || "GERAL"}
                          </Badge>
                          <span className="text-[11px] font-mono font-bold text-muted-foreground tracking-tight truncate">{proc.processNumber}</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight truncate">
                            {proc.description}
                          </h3>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1.5 opacity-50 flex items-center gap-2">
                            <Gavel className="h-3 w-3" /> {proc.court} • {proc.vara}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black uppercase">ATIVO</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white rounded-lg bg-white/5 outline-none">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <ProcessActionsMenu proc={proc} />
                          </DropdownMenu>
                          <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all border border-white/5">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center space-y-8 glass rounded-3xl border-dashed border-2 border-white/5 opacity-20">
            <Scale className="h-20 w-20 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-base font-black text-white uppercase tracking-[0.4em]">Base Silenciosa</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Nenhum dossiê estratégico nesta categoria.</p>
            </div>
          </div>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className={cn("flex flex-col h-full glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl", getDrawerWidthClass())}>
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none shadow-xl">
            <SheetHeader>
              <div className="flex items-center gap-5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <SheetTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                    {editingProcess ? "GESTÃO ESTRATÉGICA" : "Novo Processo"}
                  </SheetTitle>
                  <SheetDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] mt-1.5 opacity-60">
                    {editingProcess ? "Retificação de dados técnicos RGMJ." : "Protocolo estruturado no ecossistema."}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>
          <ProcessForm 
            initialData={editingProcess}
            onSubmit={handleSaveProcess}
            onCancel={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
