"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Scale, Search, Plus, Loader2, Zap, ChevronRight, MoreVertical, Edit3, TrendingUp, DollarSign, Target, Briefcase, List, LayoutGrid, Archive, Folder, ExternalLink, Gavel, User as UserIcon, Tag, Calendar, Navigation, AlarmClock
} from "lucide-react"
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, useDoc, setDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, limit } from "firebase/firestore"
import { cn, parseCurrencyToNumber } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProcessForm } from "@/components/cases/process-form"
import { useToast } from "@/hooks/use-toast"

const AREAS = [
  { id: "todos", label: "TODOS" },
  { id: "trabalhista", label: "TRABALHISTA" },
  { id: "cível", label: "CÍVEL" },
  { id: "previdenciário", label: "PREVIDENCIÁRIO" },
  { id: "tributário", label: "TRIBUTÁRIO" },
]

export default function CasesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <CasesPageContent />
    </Suspense>
  )
}

function CasesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [activeArea, setActiveArea] = useState("todos")
  
  // Sincroniza o busca do URL com o estado interno
  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearchTerm(q)
  }, [searchParams])

  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<any>(null)
  const [listLimit, setListLimit] = useState(50)

  const processesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "processes"), orderBy("createdAt", "desc"), limit(listLimit))
  }, [db, user, listLimit])

  const { data: processesData, isLoading } = useCollection(processesQuery)
  const processes = processesData || []

  const filteredProcesses = useMemo(() => {
    return processes.filter(proc => {
      if (proc.status === "Arquivado") return false
      const s = searchTerm.toLowerCase()
      const matchesSearch = proc.processNumber?.toLowerCase().includes(s) || 
                           proc.clientName?.toLowerCase().includes(s) ||
                           proc.defendantName?.toLowerCase().includes(s)
      const matchesArea = activeArea === "todos" || proc.caseType?.toLowerCase() === activeArea.toLowerCase()
      return matchesSearch && matchesArea
    })
  }, [processes, searchTerm, activeArea])

  const stats = useMemo(() => {
    const active = filteredProcesses.length
    const totalValue = filteredProcesses.reduce((acc, p) => acc + (parseCurrencyToNumber(p.value) || 0), 0)
    const ticket = active > 0 ? totalValue / active : 0
    return { active, totalValue, ticket }
  }, [filteredProcesses])

  const handleArchiveProcess = async (procId: string) => {
    if (!db || !window.confirm("Arquivar este dossiê?")) return
    try {
      await updateDocumentNonBlocking(doc(db, "processes", procId), { status: "Arquivado", updatedAt: serverTimestamp() })
      toast({ title: "Arquivo Confirmado" })
    } catch (e) { toast({ variant: "destructive", title: "Erro ao arquivar" }) }
  }

  const labelMini = "text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block"

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans pb-20 max-w-[1800px] w-[95%] mx-auto relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-black text-muted-foreground/40 mb-4">
            <span>INÍCIO</span><ChevronRight className="h-2 w-2" /><span>DASHBOARD</span><ChevronRight className="h-2 w-2" /><span className="text-white">ACERVO DE PROCESSOS</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-1 uppercase tracking-tighter">Gestão de Processos</h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">CONTROLE JURÍDICO ESTRATÉGICO RGMJ.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Pesquisar..." className="w-80 glass border-white/5 h-12 pl-12 text-xs text-white rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={() => { setEditingProcess(null); setIsSheetOpen(true); }} className="gold-gradient text-background font-black h-12 rounded-xl px-8 uppercase text-[10px] tracking-widest gap-2">
            <Plus className="h-4 w-4" /> NOVO PROCESSO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#141B2D] border-white/5 p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Scale className="h-12 w-12 text-white" /></div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-3"><Zap className="h-3.5 w-3.5" /> PROCESSOS ATIVOS</p>
          <div className="text-4xl font-black text-white tracking-tighter">{stats.active}</div>
        </Card>
        <Card className="bg-[#141B2D] border-white/5 p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="h-12 w-12 text-white" /></div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-3"><DollarSign className="h-3.5 w-3.5" /> VALOR SOB GESTÃO</p>
          <div className="text-4xl font-black text-white tracking-tighter tabular-nums text-emerald-500">R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
        </Card>
        <Card className="bg-[#141B2D] border-white/5 p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Target className="h-12 w-12 text-white" /></div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-3"><Briefcase className="h-3.5 w-3.5" /> TICKET MÉDIO</p>
          <div className="text-4xl font-black text-white tracking-tighter tabular-nums">R$ {stats.ticket.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
        </Card>
      </div>

      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex gap-10">
          {AREAS.map(area => (
            <button key={area.id} onClick={() => setActiveArea(area.id)} className={cn("text-[10px] font-black uppercase tracking-[0.2em] pb-3 transition-all relative", activeArea === area.id ? "text-primary " : "text-white/20 hover:text-white")}>
              {area.label}
              {activeArea === area.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in" />}
            </button>
          ))}
        </div>
        <div className="flex items-center p-1 bg-white/[0.03] border border-white/5 rounded-2xl gap-1">
          <button 
            onClick={() => setViewMode("list")} 
            className={cn(
              "h-10 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
              viewMode === "list" ? "bg-primary text-background shadow-lg scale-100" : "text-white/20 hover:text-white/40 border-transparent"
            )}
          >
            <List className="h-4 w-4" />
            {viewMode === "list" && <span className="text-[10px] font-black uppercase tracking-widest">Lista</span>}
          </button>
          <button 
            onClick={() => setViewMode("grid")} 
            className={cn(
              "h-10 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
              viewMode === "grid" ? "bg-primary text-background shadow-lg scale-100" : "text-white/20 hover:text-white/40 border-transparent"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            {viewMode === "grid" && <span className="text-[10px] font-black uppercase tracking-widest">Grade</span>}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Auditando Acervo...</span>
          </div>
        ) : filteredProcesses.map(proc => (
          <Card key={proc.id} className="bg-[#0d1117] border-white/5 p-10 rounded-3xl group transition-all hover:border-primary/10 shadow-3xl">
            <CardContent className="p-0 space-y-10">
              {/* Top Section */}
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">PROCESSO:</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase px-3 h-5 rounded-md">ATIVO</Badge>
                  </div>
                  <div className="flex items-center gap-6">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter group-hover:text-primary transition-colors">{proc.clientName}</h3>
                    <span className="text-white/10 font-black text-sm italic">vs</span>
                    <h3 className="text-xl font-black text-white/60 uppercase tracking-tighter">{proc.defendantName || "EM DEFINIÇÃO"}</h3>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" className="h-14 w-14 border-white/10 rounded-2xl hover:bg-white/5"><MoreVertical className="h-6 w-6" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent className="glass bg-[#0a0f1e] text-white p-3 rounded-[1.5rem] border-white/10 shadow-3xl w-72">
                    <div className="px-4 py-3 mb-2">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Gestão do Caso</p>
                    </div>
                    
                    <DropdownMenuItem className="p-4 rounded-xl hover:bg-emerald-500/10 cursor-pointer flex gap-5 items-center group" onClick={() => router.push(`/prazos-fatal?procId=${proc.id}&mode=atendimento`)}>
                       <Calendar className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Agendar Atendimento</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="p-4 rounded-xl hover:bg-blue-500/10 cursor-pointer flex gap-5 items-center group" onClick={() => router.push(`/prazos-fatal?procId=${proc.id}&mode=diligencia`)}>
                       <Navigation className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Gestão de Diligências</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="p-4 rounded-xl hover:bg-rose-500/10 cursor-pointer flex gap-5 items-center group" onClick={() => router.push(`/prazos-fatal?procId=${proc.id}&mode=prazo`)}>
                       <AlarmClock className="h-5 w-5 text-rose-500 group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Lançar Prazo Fatal</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="p-4 rounded-xl hover:bg-yellow-500/10 cursor-pointer flex gap-5 items-center group" onClick={() => router.push(`/prazos-fatal?procId=${proc.id}&mode=audiencia`)}>
                       <Gavel className="h-5 w-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Pauta de Audiência</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="p-4 rounded-xl hover:bg-emerald-500/10 cursor-pointer flex gap-5 items-center group" onClick={() => router.push(`/prazos-fatal?procId=${proc.id}&mode=financeiro`)}>
                       <DollarSign className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Fluxo Financeiro</span>
                    </DropdownMenuItem>

                    <div className="h-px bg-white/5 my-2 mx-2" />

                    <DropdownMenuItem className="p-4 rounded-xl hover:bg-white/5 cursor-pointer flex gap-5 items-center group" onClick={() => { setEditingProcess(proc); setIsSheetOpen(true); }}>
                       <Edit3 className="h-5 w-5 text-white/40 group-hover:text-white transition-colors" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Editar Processo</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="p-4 rounded-xl hover:bg-rose-500/10 cursor-pointer flex gap-5 items-center group text-rose-500" onClick={() => handleArchiveProcess(proc.id)}>
                       <Archive className="h-5 w-5 group-hover:scale-110 transition-transform" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Arquivar Dossiê</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Middle Section - Grid Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <span className={labelMini}>PROTOCOLO CNJ</span>
                  <div className="h-12 bg-black/40 border border-white/5 rounded-xl flex items-center px-4">
                    <span className="text-[11px] font-bold text-white font-mono">{proc.processNumber}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className={labelMini}>ÁREA / MATÉRIA</span>
                  <div className="h-12 bg-black/40 border border-white/5 rounded-xl flex items-center px-4 gap-3">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black text-white uppercase">{proc.caseType || "CÍVEL"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className={labelMini}>JUÍZO / COMARCA</span>
                  <div className="h-12 bg-black/40 border border-white/5 rounded-xl flex items-center px-4 gap-3">
                    <Gavel className="h-4 w-4 text-white/20" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter truncate">{proc.courtName || "---"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className={labelMini}>VALOR DA CAUSA</span>
                  <div className="h-12 bg-black/40 border border-primary/20 rounded-xl flex items-center px-4 gap-3">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-[11px] font-black text-emerald-500">R$ {proc.value || "0,00"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className={labelMini}>RESPONSÁVEL</span>
                  <div className="h-12 bg-black/40 border border-white/5 rounded-xl flex items-center px-4 gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center"><UserIcon className="h-3 w-3 text-primary" /></div>
                    <span className="text-[10px] font-black text-white uppercase truncate">{proc.responsibleStaffName || "REINALDO DE JESUS"}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[10px] font-black uppercase h-12 px-8 rounded-xl gap-3 hover:bg-emerald-500 hover:text-white transition-all">
                  <Folder className="h-4 w-4" /> VER DRIVE
                </Button>
                <Button variant="outline" className="border-white/10 bg-white/5 text-white/40 text-[10px] font-black uppercase h-12 px-8 rounded-xl gap-3 hover:bg-white/10 transition-all">
                  <ExternalLink className="h-4 w-4" /> PORTAL JUDICIÁRIO
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex flex-col h-full glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl sm:max-w-[1200px]">
          <div className="p-10 bg-[#0a0f1e] border-b border-white/5 flex-none shadow-xl">
            <SheetHeader>
              <SheetTitle className="text-white font-black text-4xl uppercase tracking-tighter">
                {editingProcess ? "Retificar Dossiê" : "Novo Processo Judicial"}
              </SheetTitle>
              <SheetDescription className="sr-only">Formulário de Entrada de Dados</SheetDescription>
            </SheetHeader>
          </div>
          <ProcessForm 
            initialData={editingProcess}
            onSubmit={(data) => {
              if (editingProcess) {
                updateDocumentNonBlocking(doc(db!, "processes", editingProcess.id), { ...data, updatedAt: serverTimestamp() })
                toast({ title: "Atualizado com Sucesso" })
              } else {
                addDocumentNonBlocking(collection(db!, "processes"), { ...data, status: "Em Andamento", createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
                toast({ title: "Processo Protocolado" })
              }
              setIsSheetOpen(false)
            }}
            onCancel={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
