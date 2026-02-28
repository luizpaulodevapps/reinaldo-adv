
"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  X,
  Star,
  DollarSign,
  MessageSquare,
  Megaphone,
  Shield,
  Type,
  Hash,
  ToggleLeft,
  Settings2,
  BookOpen,
  ChevronRight
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

const CATEGORIES = [
  { id: "Operacional", label: "Operacional", icon: Star, color: "text-amber-400" },
  { id: "Financeiro", label: "Financeiro", icon: DollarSign, color: "text-emerald-400" },
  { id: "Entrevista de Triagem", label: "Entrevista de Triagem", icon: MessageSquare, color: "text-purple-400" },
  { id: "Comercial", label: "Comercial", icon: Megaphone, color: "text-rose-400" },
  { id: "Gestão", label: "Gestão", icon: Shield, color: "text-blue-400" },
]

const ITEM_TYPES = [
  { id: "checkbox", label: "Checklist Simples", icon: CheckCircle2 },
  { id: "boolean", label: "Sim / Não", icon: ToggleLeft },
  { id: "ternary", label: "Sim / Não / Parcial", icon: AlertCircle },
  { id: "text", label: "Resposta em Texto", icon: Type },
  { id: "number", label: "Valor Numérico", icon: Hash },
]

export default function LaboratorioChecklistsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingList, setEditingList] = useState<any>(null)

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Operacional")
  const [description, setDescription] = useState("")
  const [legalArea, setLegalArea] = useState("Trabalhista")
  const [items, setItems] = useState<{ text: string; type: string }[]>([])
  const [newItemText, setNewItemText] = useState("")
  const [newItemType, setNewItemType] = useState("checkbox")

  const db = useFirestore()
  const { user, role } = useUser()
  const { toast } = useToast()

  const isOwner = user?.email === 'luizao16@gmail.com' || user?.email === 'luizpaulo.dev.apps@gmail.com'
  const canManage = isOwner || role === 'admin'

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

  const handleAddItem = () => {
    if (!newItemText.trim()) return
    setItems([...items, { text: newItemText.toUpperCase(), type: newItemType }])
    setNewItemText("")
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleOpenCreate = () => {
    setEditingList(null)
    setTitle("")
    setCategory("Operacional")
    setDescription("")
    setLegalArea("Trabalhista")
    setItems([])
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (list: any) => {
    setEditingList(list)
    setTitle(list.title)
    setCategory(list.category)
    setDescription(list.description || "")
    setLegalArea(list.legalArea || "Trabalhista")
    setItems(list.items || [])
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!title || items.length === 0) {
      toast({ variant: "destructive", title: "Dados Incompletos", description: "Título e Itens são necessários." })
      return
    }

    const listData = {
      title: title.toUpperCase(),
      category,
      description,
      legalArea,
      items,
      updatedAt: serverTimestamp()
    }

    if (editingList) {
      updateDocumentNonBlocking(doc(db, "checklists", editingList.id), listData)
      toast({ title: "Matriz Atualizada", description: "Modelo modificado." })
    } else {
      addDocumentNonBlocking(collection(db, "checklists"), {
        ...listData,
        createdAt: serverTimestamp()
      })
      toast({ title: "Nova Matriz Criada", description: "Roteiro pronto para uso." })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente remover esta matriz?")) {
      deleteDocumentNonBlocking(doc(db, "checklists", id))
      toast({ variant: "destructive", title: "Matriz Removida" })
    }
  }

  if (!canManage && !isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center">
        <Shield className="h-16 w-16 text-destructive animate-pulse" />
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-bold text-white">ACESSO RESTRITO</h2>
          <p className="text-muted-foreground max-w-md">Apenas administradores da banca RGMJ acessam o laboratório.</p>
        </div>
        <Button asChild variant="outline" className="glass border-primary/20 text-primary">
          <Link href="/checklists/execucao">Ir para Rotinas</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-headline font-bold text-white tracking-tighter">Laboratório de Matrizes</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">Design Estratégico RGMJ.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar matrizes..." 
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sincronizando...</span>
          </div>
        ) : filteredChecklists.length > 0 ? (
          filteredChecklists.map((list) => {
            const CatIcon = CATEGORIES.find(c => c.id === list.category)?.icon || Star
            return (
              <Card key={list.id} className="glass border-primary/10 hover-gold transition-all group relative overflow-hidden flex flex-col h-full">
                <div className="h-1 w-full bg-primary/20 group-hover:bg-primary transition-all" />
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5 px-3 flex items-center gap-2">
                      <CatIcon className="h-3 w-3" /> {list.category}
                    </Badge>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenEdit(list)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(list.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <CardTitle className="text-lg font-headline font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                    {list.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 flex-1">
                  <p className="text-[10px] text-muted-foreground line-clamp-2 italic mb-4">
                    {list.description || "Sem descrição técnica."}
                  </p>
                </CardContent>
                <div className="p-6 pt-0 border-t border-white/5 mt-4">
                   <Button asChild variant="ghost" className="w-full text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5">
                     <Link href="/checklists/execucao">Simular Rotina <ChevronRight className="h-3 w-3 ml-2" /></Link>
                   </Button>
                </div>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed">
            <BookOpen className="h-16 w-16 text-muted-foreground opacity-30" />
            <Button onClick={handleOpenCreate} className="gold-gradient text-background font-bold gap-2 px-8">
              Criar Matriz Inicial
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[900px] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter flex items-center gap-3">
                <Settings2 className="h-7 w-7 text-[#f5d030]" /> Editor de Matriz
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest opacity-60">
                Defina o roteiro para a equipe técnica.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-10 bg-[#0a0f1e]/50 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TÍTULO DA MATRIZ *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value.toUpperCase())} className="bg-[#0d121f] border-white/10 h-14 text-white" />
              </div>
              <div className="md:col-span-4 space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CATEGORIA</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-[#0d121f] border-white/10 h-14 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                    {CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px]">CANCELAR</Button>
            <Button onClick={handleSave} className="gold-gradient h-16 px-12 rounded-xl font-black uppercase text-[12px]">Salvar Matriz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
