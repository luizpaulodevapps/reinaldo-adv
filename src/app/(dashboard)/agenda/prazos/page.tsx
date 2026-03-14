
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  MoreVertical,
  History,
  Scale,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  FileText,
  Calendar
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { format, parseISO, isBefore, startOfDay, isAfter, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function PrazosSubpage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    processId: "",
    status: "Aberto"
  })

  const deadlinesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "deadlines"), orderBy("dueDate", "asc"))
  }, [db, user])
  const { data: deadlines, isLoading } = useCollection(deadlinesQuery)

  const activeDeadlines = useMemo(() => {
    if (!deadlines) return []
    return deadlines.filter(d => d.status === "Aberto")
  }, [deadlines])

  const handleOpenCreate = () => {
    setEditingDeadline(null)
    setFormData({
      title: "PRAZO PARA RÉPLICA",
      description: "",
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      processId: "",
      status: "Aberto"
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (deadline: any) => {
    setEditingDeadline(deadline)
    setFormData({
      title: deadline.title || "",
      description: deadline.description || "",
      dueDate: deadline.dueDate || "",
      processId: deadline.processId || "",
      status: deadline.status || "Aberto"
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!db || !formData.title || !formData.dueDate) {
      toast({ variant: "destructive", title: "Dados Incompletos" })
      return
    }

    const payload = {
      ...formData,
      title: formData.title.toUpperCase(),
      updatedAt: serverTimestamp()
    }

    if (editingDeadline) {
      updateDocumentNonBlocking(doc(db, "deadlines", editingDeadline.id), payload)
      toast({ title: "Ato Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db, "deadlines"), {
        ...payload,
        createdAt: serverTimestamp()
      })
      toast({ title: "Prazo Injetado no Radar" })
    }
    setIsDialogOpen(false)
  }

  const handleMarkAsDone = (id: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "deadlines", id), {
      status: "Concluído",
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    toast({ title: "Prazo Cumprido", description: "O ato foi arquivado com sucesso." })
  }

  const handleDelete = (id: string) => {
    if (!db || !confirm("Remover este prazo do radar?")) return
    deleteDocumentNonBlocking(doc(db, "deadlines", id))
    toast({ variant: "destructive", title: "Ato Removido" })
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Radar de Prazos Fatais</h2>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-50">CONTROLE DE RISCO E CUMPRIMENTO RGMJ.</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary bg-primary/5 px-4 h-9 uppercase tracking-widest">
            {activeDeadlines.length} Termos em Aberto
          </Badge>
          <Button onClick={handleOpenCreate} className="gold-gradient text-background font-black h-9 px-6 rounded-lg text-[10px] uppercase tracking-widest gap-2">
            <Plus className="h-4 w-4" /> Novo Prazo
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Auditando Radar de Riscos...</span>
        </div>
      ) : activeDeadlines.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {activeDeadlines.map((d) => {
            const dueDate = d.dueDate ? (d.dueDate.includes('T') ? parseISO(d.dueDate) : parseISO(`${d.dueDate}T00:00:00`)) : null
            const isExp = dueDate && isBefore(dueDate, startOfDay(new Date()))
            const isToday = dueDate && isSameDay(dueDate, new Date())
            
            return (
              <Card key={d.id} className="bg-[#0d1117] border-white/5 hover:border-primary/20 transition-all group overflow-hidden rounded-2xl shadow-2xl">
                <CardContent className="p-0 flex flex-col md:flex-row min-h-[160px]">
                  {/* Bloco de Data - Estética Imagem */}
                  <div className={cn(
                    "p-8 md:w-40 flex flex-col items-center justify-center bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/5 group-hover:bg-primary/5 transition-all flex-none",
                    isExp && "bg-rose-500/5",
                    isToday && "bg-amber-500/5"
                  )}>
                    <span className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-widest">
                      {dueDate ? format(dueDate, "MMM", { locale: ptBR }).toUpperCase() : "---"}
                    </span>
                    <span className={cn(
                      "text-4xl font-black tabular-nums", 
                      isExp ? "text-rose-500" : isToday ? "text-amber-500" : "text-white"
                    )}>
                      {dueDate ? format(dueDate, "dd") : "--"}
                    </span>
                  </div>

                  {/* Conteúdo Central - Estética Imagem */}
                  <div className="flex-1 p-10 space-y-5 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase font-black px-4 h-6 bg-primary/5 tracking-[0.15em] rounded-full">
                        {d.title}
                      </Badge>
                      {isExp && <Badge variant="destructive" className="text-[8px] font-black animate-pulse px-2 h-5">URGENTE / EXPIRADO</Badge>}
                    </div>
                    
                    <h4 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight truncate">
                      {d.description || `PROVIDÊNCIA FATAL REFERENTE AO PROCESSO ${d.processId || 'N/A'}.`}
                    </h4>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-mono font-black text-muted-foreground/40 uppercase tracking-widest flex items-center gap-3">
                        <Scale className="h-4 w-4 text-primary/40" /> CNJ: {d.processId || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Ações Laterais - Estética Imagem */}
                  <div className="p-10 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/5 gap-4 flex-none bg-white/[0.01]">
                    <Button 
                      onClick={() => handleMarkAsDone(d.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black gap-3 text-[10px] uppercase h-14 px-10 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                      <CheckCircle2 className="h-5 w-5" /> Registrar Cumprimento
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-background h-14 w-14 rounded-xl shadow-xl transition-all hover:scale-105">
                          <MoreVertical className="h-6 w-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-[#0d121f] border-white/10 text-white p-2 rounded-xl shadow-2xl">
                        <DropdownMenuItem onClick={() => handleOpenEdit(d)} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest h-11 rounded-lg cursor-pointer">
                          <Edit3 className="h-4 w-4 text-primary" /> Editar Ato
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkAsDone(d.id)} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest h-11 rounded-lg cursor-pointer text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" /> Marcar Cumprido
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(d.id)} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest h-11 rounded-lg cursor-pointer text-rose-500">
                          <Trash2 className="h-4 w-4" /> Excluir Prazo
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
        <div className="py-48 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
          <Clock className="h-20 w-20 mb-6" />
          <p className="text-sm font-black uppercase tracking-[0.5em]">Radar de riscos limpo</p>
        </div>
      )}

      {/* DIÁLOGO DE GESTÃO DE PRAZO */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                <Clock className="h-6 w-6" />
              </div>
              <DialogHeader className="text-left">
                <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                  {editingDeadline ? "Retificar Prazo" : "Lançar Prazo Fatal"}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-50">
                  CONTROLE TÁTICO DE VENCIMENTOS RGMJ.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-10 space-y-8 bg-[#0a0f1e]/50">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Título do Ato *</Label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value.toUpperCase()})} 
                  placeholder="EX: RÉPLICA À CONTESTAÇÃO" 
                  className="bg-black/40 border-white/10 h-14 text-white font-black text-sm uppercase" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Data de Vencimento *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                    <Input 
                      type="date" 
                      value={formData.dueDate} 
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                      className="bg-black/40 border-white/10 h-14 pl-12 text-white font-bold" 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Protocolo CNJ</Label>
                  <div className="relative">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                    <Input 
                      value={formData.processId} 
                      onChange={(e) => setFormData({...formData, processId: e.target.value})} 
                      placeholder="0000000-00.0000.0.00.0000"
                      className="bg-black/40 border-white/10 h-14 pl-12 text-white font-mono text-xs" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Detalhamento / Providência</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})} 
                  className="bg-black/40 border-white/10 min-h-[120px] text-white text-xs font-bold p-5 rounded-2xl resize-none uppercase" 
                  placeholder="DESCREVA A TAREFA OU ALERTA ESTRATÉGICO..."
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 hover:text-white">Abortar</Button>
            <Button onClick={handleSave} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-2xl hover:scale-105 transition-all">
              <Save className="h-5 w-5 mr-3" /> {editingDeadline ? "ATUALIZAR REGISTRO" : "LANÇAR NO RADAR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
