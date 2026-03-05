
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  ClipboardList, 
  Search, 
  Plus, 
  Play, 
  Clock, 
  Loader2, 
  User,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ChecklistExecutionPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  // Busca Templates (Matrizes)
  const templatesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "checklists"), orderBy("title", "asc"))
  }, [db, user])
  const { data: templates } = useCollection(templatesQuery)

  // Busca Execuções Ativas (Instâncias)
  const executionsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "checklist_executions"), orderBy("updatedAt", "desc"))
  }, [db, user])
  const { data: executions, isLoading } = useCollection(executionsQuery)

  const filteredExecutions = useMemo(() => {
    if (!executions) return []
    return executions.filter(e => 
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.status?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [executions, searchTerm])

  const handleStartExecution = (template: any) => {
    if (!user || !db) return

    const newExecution = {
      templateId: template.id,
      title: template.title,
      category: template.category,
      executorId: user.uid,
      executorName: user.displayName || "Advogado RGMJ",
      status: "Em Execução",
      progress: 0,
      responses: {},
      items: template.items || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    addDocumentNonBlocking(collection(db, "checklist_executions"), newExecution)
      .then(() => {
        setIsStartDialogOpen(false)
        toast({
          title: "Rotina Iniciada",
          description: `Você iniciou a execução da rotina: ${template.title}`,
        })
      })
  }

  const handleMarkComplete = (executionId: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "checklist_executions", executionId), {
      status: "Finalizado",
      progress: 100,
      updatedAt: serverTimestamp()
    })
    toast({ title: "Rotina Concluída", description: "A rotina estratégica foi arquivada como concluída." })
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Rotinas Estratégicas</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Rotinas Operacionais</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">Execução padronizada RGMJ Elite.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar rotinas..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsStartDialogOpen(true)}
            className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-6 w-6 text-[#0a0f1e]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sincronizando Rotinas...</span>
          </div>
        ) : filteredExecutions.length > 0 ? (
          filteredExecutions.map((exec) => (
            <Card key={exec.id} className="glass border-primary/10 hover-gold transition-all group overflow-hidden flex flex-col shadow-2xl">
              <div className={cn(
                "h-1.5 w-full transition-all",
                exec.status === 'Finalizado' ? "bg-emerald-500" : "bg-amber-500"
              )} />
              
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5 px-3">
                      {exec.category?.toUpperCase() || "GERAL"}
                    </Badge>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">
                      {exec.title}
                    </h3>
                  </div>
                  <Badge className={cn(
                    "text-[8px] font-black uppercase tracking-widest border-0",
                    exec.status === 'Finalizado' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {exec.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                    <span>Nível de Conformidade</span>
                    <span className="text-white">{exec.progress}%</span>
                  </div>
                  <Progress value={exec.progress} className="h-1.5 bg-secondary" />
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <User className="h-3 w-3" /> Responsável
                    </p>
                    <p className="text-xs font-bold text-white uppercase">{exec.executorName}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 justify-end">
                      <Clock className="h-3 w-3" /> Último Ato
                    </p>
                    <p className="text-xs font-mono font-bold text-white">
                      {exec.updatedAt?.toDate ? format(exec.updatedAt.toDate(), "dd/MM HH:mm") : "--/--"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest">
                    <ArrowRight className="h-4 w-4" /> Retomar Auditoria
                  </button>
                  {exec.status !== 'Finalizado' && (
                    <button 
                      onClick={() => handleMarkComplete(exec.id)}
                      className="flex items-center gap-2 text-[10px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                    >
                      <ShieldCheck className="h-4 w-4" /> Finalizar
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-[2rem] border-dashed border-2 border-white/5 opacity-30">
            <ClipboardList className="h-16 w-16 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Nenhuma rotina técnica em execução</p>
            <Button onClick={() => setIsStartDialogOpen(true)} className="gold-gradient text-background font-black uppercase text-[11px] px-8 h-12">
              Nova Rotina de Elite
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                Matrizes de Rotina
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                Escolha o roteiro para iniciar a execução técnica.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 bg-[#0a0f1e]/50">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {templates?.map((template) => (
                  <button 
                    key={template.id}
                    onClick={() => handleStartExecution(template)}
                    className="w-full flex items-center justify-between p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/50 transition-all group text-left"
                  >
                    <div>
                      <Badge variant="outline" className="text-[8px] border-primary/20 text-primary uppercase font-bold mb-2">
                        {template.category}
                      </Badge>
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                        {template.title}
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsStartDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px]">
              Cancelar Operação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
