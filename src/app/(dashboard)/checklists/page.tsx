
"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit3, 
  Star, 
  DollarSign, 
  MessageSquare, 
  Megaphone, 
  Shield, 
  Settings2, 
  BookOpen, 
  ChevronRight,
  ListPlus,
  Type,
  Hash,
  ToggleLeft,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"

const CATEGORIES = [
  { id: "Operacional", label: "Operacional", icon: Star },
  { id: "Financeiro", label: "Financeiro", icon: DollarSign },
  { id: "Entrevista de Triagem", label: "Entrevista de Triagem", icon: MessageSquare },
  { id: "Comercial", label: "Comercial", icon: Megaphone },
  { id: "Gestão", label: "Gestão", icon: Shield },
]

const FIELD_TYPES = [
  { id: "text", label: "Texto Livre", icon: Type },
  { id: "number", label: "Numérico", icon: Hash },
  { id: "boolean", label: "Sim/Não (Check)", icon: ToggleLeft },
  { id: "date", label: "Data", icon: ListPlus },
]

export default function LaboratorioChecklistsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingList, setEditingList] = useState<any>(null)

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Entrevista de Triagem")
  const [description, setDescription] = useState("")
  const [items, setItems] = useState<any[]>([])

  const db = useFirestore()
  const { user, role } = useUser()
  const { toast } = useToast()

  const canManage = role === 'admin'

  const checklistsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "checklists"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: checklists, isLoading } = useCollection(checklistsQuery)

  const filteredChecklists = useMemo(() => {
    if (!checklists) return []
    return checklists.filter(c => 
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [checklists, searchTerm])

  const handleOpenCreate = () => {
    setEditingList(null)
    setTitle("")
    setCategory("Entrevista de Triagem")
    setDescription("")
    setItems([])
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (list: any) => {
    setEditingList(list)
    setTitle(list.title)
    setCategory(list.category)
    setDescription(list.description || "")
    setItems(list.items || [])
    setIsDialogOpen(true)
  }

  const handleAddField = () => {
    setItems([...items, { label: "", type: "text", required: false }])
  }

  const handleUpdateField = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleRemoveField = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!title) {
      toast({ variant: "destructive", title: "Título Necessário" })
      return
    }

    const listData = {
      title: title.toUpperCase(),
      category,
      description,
      items,
      updatedAt: serverTimestamp()
    }

    if (editingList) {
      updateDocumentNonBlocking(doc(db, "checklists", editingList.id), listData)
      toast({ title: "Matriz Atualizada" })
    } else {
      addDocumentNonBlocking(collection(db, "checklists"), {
        ...listData,
        createdAt: serverTimestamp()
      })
      toast({ title: "Nova Matriz de Elite Criada" })
    }
    setIsDialogOpen(false)
  }

  if (!canManage && !isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <Shield className="h-16 w-16 text-destructive animate-pulse" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Negado</h2>
        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">O Laboratório é restrito à alta cúpula RGMJ.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Laboratório de Matrizes</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">
            Arquitetura Jurídica: Configure roteiros de triagem e entrevistas.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrar matrizes..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenCreate}
            className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-6 w-6 text-[#0a0f1e]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Sincronizando Laboratório...</span>
          </div>
        ) : filteredChecklists.map((list) => {
          const CatIcon = CATEGORIES.find(c => c.id === list.category)?.icon || Star
          return (
            <Card key={list.id} className="glass border-primary/10 hover-gold transition-all group overflow-hidden flex flex-col">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5 px-3 py-1">
                    <CatIcon className="h-3 w-3 mr-2" /> {list.category}
                  </Badge>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(list)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteDocumentNonBlocking(doc(db, "checklists", list.id))} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <CardTitle className="text-xl font-black text-white uppercase tracking-tight leading-tight">
                  {list.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-6 line-clamp-2">
                  {list.description || "Roteiro tático sem descrição técnica."}
                </p>
                <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-[0.2em]">
                  <ListPlus className="h-3.5 w-3.5" /> {list.items?.length || 0} Campos Definidos
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[800px] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Configurador de Matriz</DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Defina a estrutura de perguntas para triagem.</DialogDescription>
            </DialogHeader>
            <Button onClick={handleAddField} className="bg-primary/10 text-primary border border-primary/20 font-black uppercase text-[10px] tracking-widest gap-2 h-12 px-6 hover:bg-primary/20">
              <Plus className="h-4 w-4" /> Adicionar Pergunta
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">TÍTULO DA MATRIZ *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value.toUpperCase())} className="bg-black/40 border-white/10 h-14 text-white font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CATEGORIA ESTRATÉGICA</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                      {CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6">
                <Label className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Estrutura do Formulário</Label>
                {items.length === 0 ? (
                  <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-4 opacity-30">
                    <ListPlus className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhuma pergunta cadastrada.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 relative group">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-7 space-y-2">
                            <Label className="text-[8px] font-bold text-muted-foreground uppercase">Pergunta / Rótulo</Label>
                            <Input 
                              value={item.label} 
                              onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                              className="bg-black/20 border-white/5 h-10 text-xs text-white" 
                              placeholder="EX: Qual o último salário?"
                            />
                          </div>
                          <div className="md:col-span-4 space-y-2">
                            <Label className="text-[8px] font-bold text-muted-foreground uppercase">Tipo de Dado</Label>
                            <Select value={item.type} onValueChange={(v) => handleUpdateField(idx, 'type', v)}>
                              <SelectTrigger className="bg-black/20 border-white/5 h-10 text-[10px] text-white uppercase"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                                {FIELD_TYPES.map(type => <SelectItem key={type.id} value={type.id}>{type.label.toUpperCase()}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-1 flex items-end justify-end pb-1">
                            <button onClick={() => handleRemoveField(idx)} className="text-rose-500 hover:text-rose-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[10px] tracking-widest px-8">Cancelar</Button>
            <Button onClick={handleSave} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-xl">
              Salvar Matriz RGMJ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
