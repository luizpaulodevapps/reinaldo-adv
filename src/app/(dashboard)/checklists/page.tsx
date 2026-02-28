
"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function ChecklistsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingList, setEditingStaff] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Estados do Formulário
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Estratégico")
  const [items, setItems] = useState<{ text: string; completed: boolean }[]>([])
  const [newItemText, setNewItemText] = useState("")

  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const checklistsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "checklists"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: checklists, isLoading } = useCollection(checklistsQuery)

  const filteredChecklists = useMemo(() => {
    if (!checklists) return []
    return checklists.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [checklists, searchTerm])

  const handleAddItem = () => {
    if (!newItemText.trim()) return
    setItems([...items, { text: newItemText.toUpperCase(), completed: false }])
    setNewItemText("")
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleOpenCreate = () => {
    setEditingStaff(null)
    setTitle("")
    setCategory("Estratégico")
    setItems([])
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (list: any) => {
    setEditingStaff(list)
    setTitle(list.title)
    setCategory(list.category)
    setItems(list.items || [])
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!title || items.length === 0) {
      toast({ variant: "destructive", title: "Dados Incompletos", description: "O título e pelo menos um item são necessários." })
      return
    }

    const progress = Math.round((items.filter(i => i.completed).length / items.length) * 100)

    const listData = {
      title: title.toUpperCase(),
      category,
      items,
      progress,
      updatedAt: serverTimestamp()
    }

    if (editingList) {
      updateDocumentNonBlocking(doc(db, "checklists", editingList.id), listData)
      toast({ title: "Template Atualizado", description: "O protocolo foi modificado no acervo." })
    } else {
      addDocumentNonBlocking(collection(db, "checklists"), {
        ...listData,
        id: crypto.randomUUID(),
        createdAt: serverTimestamp()
      })
      toast({ title: "Novo Protocolo Criado", description: "O checklist foi adicionado à base estratégica." })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente remover este template estratégico?")) {
      deleteDocumentNonBlocking(doc(db, "checklists", id))
      toast({ variant: "destructive", title: "Template Removido" })
    }
  }

  const toggleItemCompletion = (list: any, itemIndex: number) => {
    const newItems = [...list.items]
    newItems[itemIndex].completed = !newItems[itemIndex].completed
    
    const progress = Math.round((newItems.filter(i => i.completed).length / newItems.length) * 100)
    
    updateDocumentNonBlocking(doc(db, "checklists", list.id), {
      items: newItems,
      progress,
      updatedAt: serverTimestamp()
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">Checklists Estratégicos</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">Padronização e Controle de Qualidade RGMJ</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar protocolos..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenCreate}
            className="w-12 h-12 rounded-xl bg-[#f5d030] flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all border-2 border-[#f5d030] ring-offset-2 ring-offset-[#0a0f1e] ring-1 ring-[#f5d030]/50"
          >
            <Plus className="h-6 w-6 text-[#0a0f1e]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sincronizando Auditoria...</span>
          </div>
        ) : filteredChecklists.length > 0 ? (
          filteredChecklists.map((list) => (
            <Card key={list.id} className="glass border-primary/10 hover-gold transition-all group relative overflow-hidden flex flex-col h-full">
              <div className={cn(
                "h-1 w-full",
                list.progress === 100 ? "bg-emerald-500" : "bg-primary"
              )} />
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5 px-3">
                    {list.category}
                  </Badge>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenEdit(list)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(list.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <CardTitle className="text-lg font-headline font-bold text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
                  {list.title}
                </CardTitle>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{list.progress}% CONCLUÍDO</span>
                  {list.progress === 100 && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </div>
                <Progress value={list.progress} className="h-1 bg-secondary/30 mt-2" />
              </CardHeader>

              <CardContent className="space-y-3 flex-1">
                <div className="divide-y divide-white/5">
                  {list.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 py-3 first:pt-0 group/item">
                      <Checkbox 
                        checked={item.completed} 
                        onCheckedChange={() => toggleItemCompletion(list, i)}
                        id={`check-${list.id}-${i}`} 
                        className="mt-0.5 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                      />
                      <label 
                        htmlFor={`check-${list.id}-${i}`} 
                        className={cn(
                          "text-[11px] font-bold uppercase tracking-wide cursor-pointer transition-all leading-relaxed",
                          item.completed ? 'text-muted-foreground/40 line-through' : 'text-white/80 hover:text-white'
                        )}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-white/5 opacity-30">
            <ClipboardList className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-white uppercase tracking-widest">Sem Templates de Auditoria</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Inicie a padronização dos processos e entregas da banca RGMJ para garantir a excelência técnica.</p>
            </div>
            <Button onClick={handleOpenCreate} className="gold-gradient text-background font-bold gap-2 px-8">
              Configurar Primeiro Protocolo
            </Button>
          </div>
        )}
      </div>

      {/* DIALOG DE CRIAÇÃO/EDIÇÃO */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[650px] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter flex items-center gap-3">
                {editingList ? <Edit2 className="h-7 w-7 text-primary" /> : <ClipboardList className="h-7 w-7 text-primary" />}
                {editingList ? "EDITAR PROTOCOLO" : "NOVO PROTOCOLO"}
              </DialogTitle>
              <p className="text-muted-foreground text-[10px] uppercase font-black tracking-[0.3em] opacity-60">DEFINIÇÃO DE PADRÕES E REQUISITOS TÉCNICOS.</p>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-8 bg-[#0a0f1e]/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Título do Checklist</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value.toUpperCase())}
                  className="bg-[#0d121f] border-white/10 h-12 text-white text-sm"
                  placeholder="EX: PADRÃO PETIÇÃO INICIAL"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Categoria Tática</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-[#0d121f] border-white/10 h-12 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                    <SelectItem value="Estratégico">🏆 Estratégico</SelectItem>
                    <SelectItem value="Qualidade">💎 Qualidade</SelectItem>
                    <SelectItem value="Compliance">🛡️ Compliance</SelectItem>
                    <SelectItem value="Operacional">⚙️ Operacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <Label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Itens de Verificação
              </Label>
              
              <div className="flex gap-2">
                <Input 
                  value={newItemText} 
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                  className="bg-[#0d121f] border-white/10 h-12 text-white flex-1"
                  placeholder="Adicionar requisito..."
                />
                <Button onClick={handleAddItem} className="bg-primary hover:bg-primary/80 text-white h-12 px-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center border border-primary/20">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-tight">{item.text}</span>
                    </div>
                    <button onClick={() => handleRemoveItem(index)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-[10px] uppercase font-bold tracking-widest opacity-30 border-2 border-dashed border-white/5 rounded-xl">
                    Nenhum item adicionado ao protocolo.
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-bold text-[11px] tracking-[0.1em]">
              Descartar
            </Button>
            <Button onClick={handleSave} className="w-full md:w-auto bg-[#f5d030] hover:bg-[#d4af37] text-[#0a0f1e] font-black uppercase text-[12px] tracking-widest px-12 h-16 rounded-xl shadow-2xl transition-all flex items-center justify-center gap-3">
              <CheckCircle2 className="h-5 w-5" /> SALVAR PROTOCOLO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
