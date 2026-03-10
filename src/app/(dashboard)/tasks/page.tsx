
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  User, 
  MapPin, 
  ShieldAlert, 
  ChevronRight, 
  Loader2,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  FileSignature,
  ListTodo,
  CloudLightning
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { format, isBefore, startOfDay, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function DiligencesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"pendentes" | "concluidas">("pendentes")
  
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  // Google Settings para status de sincronismo
  const googleSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleConfig } = useDoc(googleSettingsRef)

  const diligencesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "diligences"), orderBy("dueDate", "asc"))
  }, [db, user])

  const { data: diligences, isLoading } = useCollection(diligencesQuery)

  const filtered = useMemo(() => {
    if (!diligences) return []
    return diligences.filter(d => {
      const matchesSearch = 
        d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.processNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTab = activeTab === "pendentes" ? d.status !== "Concluída" : d.status === "Concluída"
      
      return matchesSearch && matchesTab
    })
  }, [diligences, searchTerm, activeTab])

  const handleComplete = (id: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "diligences", id), {
      status: "Concluída",
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    toast({ title: "Tarefa Concluída", description: "O ato foi arquivado no sistema e sincronizado." })
  }

  const handleDelete = (id: string) => {
    if (!db || !confirm("Remover esta diligência?")) return
    deleteDocumentNonBlocking(doc(db, "diligences", id))
    toast({ variant: "destructive", title: "Diligência Removida" })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Tasks & Diligências</span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
            <ListTodo className="h-8 w-8 text-primary" /> Pauta de Tarefas
          </h1>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-black opacity-60">Gestão de atos externos e sincronismo com Google Tasks.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {googleConfig?.isTasksActive && (
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-lg">
              <CloudLightning className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sinc. Google Tasks</span>
            </div>
          )}
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar tarefas..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-white/5 pb-2">
        <Button 
          onClick={() => setActiveTab('pendentes')}
          className={cn(
            "h-10 px-8 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
            activeTab === 'pendentes' ? "gold-gradient text-background shadow-lg" : "glass border-primary/20 text-primary hover:bg-primary/5"
          )}
        >
          Pendentes <Badge className="ml-3 bg-black/40 text-[9px] border-0">{diligences?.filter(d => d.status !== 'Concluída').length || 0}</Badge>
        </Button>
        <Button 
          onClick={() => setActiveTab('concluidas')}
          className={cn(
            "h-10 px-8 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border",
            activeTab === 'concluidas' ? "gold-gradient text-background shadow-lg border-0" : "glass border-primary/20 text-primary hover:bg-primary/5"
          )}
        >
          Concluídas
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Pauta Externa...</span>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((task) => {
              const dueDate = task.dueDate ? parseISO(task.dueDate) : null
              const isOverdue = task.status !== 'Concluída' && dueDate && isBefore(dueDate, startOfDay(new Date()))
              
              return (
                <Card key={task.id} className="glass border-white/5 hover-gold transition-all group overflow-hidden">
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    <div className={cn(
                      "p-6 md:w-40 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 group-hover:bg-primary/5 transition-all",
                      isOverdue && "bg-rose-500/5"
                    )}>
                      <span className="text-[10px] font-black text-muted-foreground uppercase mb-1">{dueDate ? format(dueDate, "MMM", { locale: ptBR }).toUpperCase() : "---"}</span>
                      <span className={cn("text-3xl font-black", isOverdue ? "text-rose-500" : "text-white")}>{dueDate ? format(dueDate, "dd") : "--"}</span>
                      <span className="text-[10px] font-mono font-bold text-primary mt-2">{dueDate ? format(dueDate, "HH:mm") : "--:--"}</span>
                    </div>

                    <div className="flex-1 p-6 flex flex-col justify-center space-y-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-3 py-1 border-0",
                          task.type === 'Física' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                        )}>
                          {task.type === 'Física' ? '🏢 DILIGÊNCIA FÍSICA' : '🖥️ DILIGÊNCIA VIRTUAL'}
                        </Badge>
                        {task.requiresSubestabelecimento && (
                          <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-500 uppercase font-black bg-amber-500/5 flex items-center gap-1.5">
                            <FileSignature className="h-3 w-3" /> REQUER SUBESTABELECIMENTO
                          </Badge>
                        )}
                        {isOverdue && <Badge variant="destructive" className="text-[8px] font-black animate-pulse">EXPIRADA</Badge>}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">{task.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                          <Scale className="h-3.5 w-3.5 text-primary/50" /> {task.processNumber} • {task.clientName}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/5">
                        <p className="text-[10px] text-white/80 font-black uppercase tracking-widest flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-emerald-500" /> Executor: {task.assigneeName}
                        </p>
                        {task.location && (
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-primary/50" /> {task.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/5 gap-4">
                      {task.status !== 'Concluída' ? (
                        <Button onClick={() => handleComplete(task.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest h-11 px-6 rounded-lg shadow-xl">
                          <CheckCircle className="h-4 w-4 mr-2" /> Finalizar Task
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase">
                          <CheckCircle2 className="h-5 w-5" /> Task Realizada
                        </div>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-white border border-white/5 rounded-lg">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0d121f] border-white/10 text-white w-48">
                          <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest cursor-pointer gap-2">
                            <Clock className="h-4 w-4" /> Reagendar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-[10px] font-black uppercase tracking-widest cursor-pointer gap-2 text-rose-500">
                            <Trash2 className="h-4 w-4" /> Excluir Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center space-y-8 glass rounded-[3rem] border-dashed border-2 border-white/5 opacity-20">
            <ListTodo className="h-20 w-20 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-base font-black text-white uppercase tracking-[0.4em]">To-Do List Limpo</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Nenhuma tarefa estratégica pendente.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
