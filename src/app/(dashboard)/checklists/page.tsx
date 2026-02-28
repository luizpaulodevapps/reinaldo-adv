
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
  BookOpen
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
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

  // Estados do Formulário
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

  // Somente Admins acessam o Laboratório
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
      toast({ title: "Matriz Atualizada", description: "O modelo estratégico foi modificado." })
    } else {
      addDocumentNonBlocking(collection(db, "checklists"), {
        ...listData,
        createdAt: serverTimestamp()
      })
      toast({ title: "Nova Matriz Criada", description: "O roteiro está pronto para uso na rotina da equipe." })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente remover esta matriz estratégica? Isso não afetará rotinas já iniciadas.")) {
      deleteDocumentNonBlocking(doc(db, "checklists", id))
      toast({ variant: "destructive", title: "Matriz Removida" })
    }
  }

  if (!canManage && !isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center">
        <Shield className="h-16 w-16 text-destructive animate-pulse" />
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-bold text-white">ACESSO RESTRITO AO COMANDO</h2>
          <p className="text-muted-foreground max-w-md">Apenas administradores da banca RGMJ podem definir matrizes e roteiros estratégicos no laboratório.</p>
        </div>
        <Button asChild variant="outline" className="glass border-primary/20 text-primary">
          <Link href="/checklists/execucao">Ir para Rotinas Operacionais</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-headline font-bold text-white tracking-tighter">Laboratório de Matrizes</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">Design Estratégico de Protocolos e Entrevistas RGMJ.</p>
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sincronizando Biblioteca...</span>
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
                  <CardTitle className="text-lg font-headline font-bold text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {list.title}
                  </CardTitle>
                  {list.category === "Entrevista de Triagem" && (
                    <Badge className="mt-2 bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px] font-black uppercase tracking-widest">
                      Área: {list.legalArea || "Geral"}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 flex-1">
                  <p className="text-[10px] text-muted-foreground line-clamp-2 italic mb-4">
                    {list.description || "Sem descrição estratégica definida."}
                  </p>
                  <div className="divide-y divide-white/5 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                    {list.items?.map((item: any, i: number) => {
                      const TypeIcon = ITEM_TYPES.find(t => t.id === item.type)?.icon || CheckCircle2
                      return (
                        <div key={i} className="flex items-center gap-3 py-3 first:pt-0 group/item">
                          <TypeIcon className="h-3.5 w-3.5 text-primary/40" />
                          <span className="text-[11px] font-bold uppercase tracking-wide text-white/80 leading-relaxed truncate">
                            {item.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>
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
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-white/5 opacity-30">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-white uppercase tracking-widest">Biblioteca de Matrizes Vazia</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Desenhe o primeiro protocolo padrão para garantir a excelência da banca RGMJ.</p>
            </div>
            <Button onClick={handleOpenCreate} className="gold-gradient text-background font-bold gap-2 px-8">
              Configurar Matriz Inicial
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[900px] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter flex items-center gap-3">
                <Settings2 className="h-7 w-7 text-[#f5d030]" /> Editor de Matriz Estratégica
              </DialogTitle>
              <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest opacity-60">Defina o roteiro obrigatório e o tipo de coleta para a equipe técnica.</p>
            </DialogHeader>
          </div>

          <div className="p-8 md:p-10 space-y-10 bg-[#0a0f1e]/50 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 space-y-3">
                <Label className="text-[10px] font-black text-[#a0a5b1] uppercase tracking-[0.2em]">TÍTULO DA MATRIZ *</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value.toUpperCase())}
                  className="bg-[#0d121f] border-white/10 h-14 text-white text-base focus:ring-1 focus:ring-[#f5d030]/50"
                  placeholder="Ex: Protocolo de Inicial Trabalhista"
                />
              </div>
              <div className="md:col-span-4 space-y-3">
                <Label className="text-[10px] font-black text-[#a0a5b1] uppercase tracking-[0.2em]">CATEGORIA</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-[#0d121f] border-white/10 h-14 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <cat.icon className={cn("h-4 w-4", cat.color)} />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 space-y-3">
                <Label className="text-[10px] font-black text-[#a0a5b1] uppercase tracking-[0.2em]">DESCRIÇÃO / FINALIDADE</Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o objetivo técnico deste protocolo..."
                  className="bg-[#0d121f] border-white/10 min-h-[100px] text-white focus:ring-1 focus:ring-[#f5d030]/50 resize-none"
                />
              </div>
              {category === "Entrevista de Triagem" && (
                <div className="md:col-span-4 space-y-3">
                  <Label className="text-[10px] font-black text-[#a0a5b1] uppercase tracking-[0.2em]">ÁREA JURÍDICA</Label>
                  <Select value={legalArea} onValueChange={setLegalArea}>
                    <SelectTrigger className="bg-[#0d121f] border-white/10 h-14 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                      <SelectItem value="Trabalhista">⚖️ Trabalhista</SelectItem>
                      <SelectItem value="Cível">🏠 Cível</SelectItem>
                      <SelectItem value="Previdenciário">👴 Previdenciário</SelectItem>
                      <SelectItem value="Criminal">🚔 Criminal</SelectItem>
                      <SelectItem value="Família">❤️ Família</SelectItem>
                      <SelectItem value="Tributário">💰 Tributário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-6 pt-6 border-t border-white/5">
              <Label className="text-[11px] font-black text-[#f5d030] uppercase tracking-[0.3em] flex items-center gap-3">
                <ClipboardList className="h-5 w-5" /> Configurar Itens / Perguntas
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-7">
                  <Input 
                    value={newItemText} 
                    onChange={(e) => setNewItemText(e.target.value)}
                    className="bg-[#0d121f] border-white/10 h-14 text-white"
                    placeholder="Enunciado do passo..."
                  />
                </div>
                <div className="md:col-span-4">
                  <Select value={newItemType} onValueChange={setNewItemType}>
                    <SelectTrigger className="bg-[#0d121f] border-white/10 h-14 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                      {ITEM_TYPES.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <t.icon className="h-4 w-4" />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1">
                  <Button 
                    onClick={handleAddItem}
                    className="w-full h-14 gold-gradient rounded-lg"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const TypeIcon = ITEM_TYPES.find(t => t.id === item.type)?.icon || CheckCircle2
                  return (
                    <div key={index} className="flex items-center justify-between p-5 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-[#f5d030]/30 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="w-6 h-6 rounded-full bg-[#f5d030]/10 text-[#f5d030] text-[11px] font-black flex items-center justify-center border border-[#f5d030]/20">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white/90 uppercase tracking-tight">{item.text}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-black flex items-center gap-1 mt-1">
                            <TypeIcon className="h-2.5 w-2.5" /> Coleta: {ITEM_TYPES.find(t => t.id === item.type)?.label}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveItem(index)} className="text-muted-foreground hover:text-destructive p-2 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 md:p-10 bg-black/40 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest hover:text-white transition-colors">
              CANCELAR
            </Button>
            <Button 
              onClick={handleSave} 
              className="w-full md:w-auto gold-gradient h-16 px-16 rounded-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 font-black uppercase text-[12px] tracking-[0.2em]"
            >
              <CheckCircle2 className="h-5 w-5" /> Salvar Matriz Estratégica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
