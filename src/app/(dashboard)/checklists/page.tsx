
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
  Eye,
  Star, 
  DollarSign, 
  MessageSquare, 
  Megaphone, 
  Shield, 
  ChevronRight,
  ListPlus,
  Type,
  Hash,
  ToggleLeft,
  X,
  Scale,
  FileEdit,
  ShieldCheck,
  LayoutGrid,
  Circle,
  FileText,
  AlertCircle,
  Gavel,
  CheckCircle2,
  PlusCircle,
  MapPin,
  Fingerprint,
  Phone,
  Calendar,
  Sparkles,
  ArrowLeft,
  Settings2,
  Layers,
  ChevronDown
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
import { Switch } from "@/components/ui/switch"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const CATEGORIES = [
  { id: "Entrevista de Triagem", label: "Entrevista de Triagem", icon: MessageSquare },
  { id: "Operacional", label: "Operacional", icon: Star },
  { id: "Financeiro", label: "Financeiro", icon: DollarSign },
  { id: "Comercial", label: "Comercial", icon: Megaphone },
  { id: "Gestão", label: "Gestão", icon: Shield },
]

const LEGAL_AREAS = [
  "Trabalhista",
  "Cível",
  "Criminal",
  "Previdenciário",
  "Tributário",
  "Família",
  "Empresarial",
  "Geral"
]

const FIELD_TYPES = [
  { id: "boolean", label: "Sim / Não", icon: ToggleLeft },
  { id: "boolean_partial", label: "Sim / Não / Parcial", icon: Circle },
  { id: "text", label: "Resposta em Texto", icon: FileText },
  { id: "number", label: "Valor Numérico", icon: Hash },
  { id: "cep", label: "CEP / Endereço Automático", icon: MapPin },
  { id: "cpf_cnpj", label: "CPF / CNPJ", icon: Fingerprint },
  { id: "phone", label: "WhatsApp / Telefone", icon: Phone },
  { id: "date", label: "Data", icon: Calendar },
]

const REUSE_TARGETS = [
  { id: "caseDetails", label: "Detalhes do Caso" },
  { id: "distribution", label: "Distribuição" },
  { id: "client", label: "Cadastro do Cliente" },
  { id: "claimant", label: "Cadastro do Reclamante" },
]

const REUSE_PRIORITIES = [
  { id: "alta", label: "Alta" },
  { id: "media", label: "Média" },
  { id: "baixa", label: "Baixa" },
]

const TARGET_FIELDS_BY_REUSE_TARGET: Record<string, Array<{ id: string; label: string }>> = {
  caseDetails: [{ id: "caseDetails", label: "Detalhes do Caso" }],
  distribution: [
    { id: "processTitle", label: "Título do Processo" },
    { id: "processNumber", label: "Número CNJ" },
    { id: "link", label: "Link CNJ" },
    { id: "forum", label: "Tribunal/Fórum" },
    { id: "vara", label: "Vara" },
    { id: "hearingDate", label: "Data da Audiência" },
  ],
  client: [
    { id: "fullName", label: "Nome Completo" },
    { id: "cpf", label: "CPF" },
    { id: "rg", label: "RG" },
    { id: "rgIssueDate", label: "Data Expedição RG" },
    { id: "motherName", label: "Nome da Mãe" },
    { id: "ctps", label: "CTPS" },
    { id: "zipCode", label: "CEP" },
    { id: "address", label: "Endereço" },
    { id: "neighborhood", label: "Bairro" },
    { id: "city", label: "Cidade" },
    { id: "state", label: "UF" },
  ],
  claimant: [
    { id: "fullName", label: "Nome Completo" },
    { id: "documentNumber", label: "CPF/CNPJ" },
    { id: "documentType", label: "Tipo Documento" },
    { id: "zipCode", label: "CEP" },
    { id: "address", label: "Endereço" },
    { id: "neighborhood", label: "Bairro" },
    { id: "city", label: "Cidade" },
    { id: "state", label: "UF" },
  ],
}

type ReadyQuestionTemplate = {
  id: string
  label: string
  type: string
  required?: boolean
  reuseEnabled?: boolean
  reuseTarget?: string
  targetField?: string
  reusePriority?: string
  balizaObrigatoria?: boolean
}

const ALL_READY_QUESTION_TEMPLATES: ReadyQuestionTemplate[] = [
  { id: "id-nome", label: "IDENTIFICACAO: NOME COMPLETO", type: "text", required: true, reuseEnabled: true, reuseTarget: "client", targetField: "fullName", reusePriority: "alta", balizaObrigatoria: true },
  { id: "id-cpf", label: "IDENTIFICACAO: CPF", type: "cpf_cnpj", required: true, reuseEnabled: true, reuseTarget: "client", targetField: "cpf", reusePriority: "alta", balizaObrigatoria: true },
  { id: "id-rg", label: "IDENTIFICACAO: RG", type: "text", required: false, reuseEnabled: true, reuseTarget: "client", targetField: "rg", reusePriority: "media" },
  { id: "id-contato", label: "IDENTIFICACAO: TELEFONE, WHATSAPP E EMAIL", type: "phone", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta" },
  { id: "civel-conflito", label: "CIVEL: QUAL E O CONFLITO?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "criminal-acusacao", label: "CRIMINAL: QUAL A ACUSACAO E A DATA DO FATO?", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "contrato-admissao", label: "CONTRATO: DATA DE ADMISSAO", type: "date", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
  { id: "situacao-atual", label: "SITUACAO ATUAL: RESUMO DA DEMANDA", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "caseDetails", reusePriority: "alta", balizaObrigatoria: true },
]

type EditorStep = "geral" | "perguntas" | "revisao"

const EDITOR_STEPS: Array<{ id: EditorStep; label: string; icon: any }> = [
  { id: "geral", label: "CONTEXTO", icon: Settings2 },
  { id: "perguntas", label: "DNA CAPTURA", icon: Zap },
  { id: "revisao", label: "SANEAMENTO", icon: ShieldCheck },
]

export default function LaboratorioChecklistsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingList, setViewingList] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingList, setEditingList] = useState<any>(null)
  const [editorStep, setEditorStep] = useState<EditorStep>("geral")
  
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Entrevista de Triagem")
  const [legalArea, setLegalArea] = useState("Trabalhista")
  const [description, setDescription] = useState("")
  const [items, setItems] = useState<any[]>([])

  const db = useFirestore()
  const { user, role } = useUser()
  const { toast } = useToast()

  const canManage = role === 'admin'

  const checklistsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "checklists"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: checklists, isLoading } = useCollection(checklistsQuery)

  const filteredChecklists = useMemo(() => {
    if (!checklists) return []
    return checklists.filter(c => 
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.legalArea?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [checklists, searchTerm])

  const handleOpenCreate = () => {
    setEditingList(null)
    setTitle("")
    setCategory("Entrevista de Triagem")
    setLegalArea("Trabalhista")
    setDescription("")
    setItems([])
    setEditorStep("geral")
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (list: any) => {
    setEditingList(list)
    setTitle(list.title)
    setCategory(list.category)
    setLegalArea(list.legalArea || "Trabalhista")
    setDescription(list.description || "")
    setItems(list.items || [])
    setEditorStep("geral")
    setIsDialogOpen(true)
  }

  const handleUpdateField = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleRemoveField = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleAddField = () => {
    setItems([
      ...items,
      {
        label: "",
        type: "text",
        required: true,
        reuseEnabled: false,
        reuseTarget: "caseDetails",
        targetField: "caseDetails",
        reusePriority: "media",
        balizaObrigatoria: false,
      },
    ])
  }

  const handleSave = () => {
    if (!title || !db) {
      toast({ variant: "destructive", title: "Dados Incompletos" })
      return
    }

    const listData = {
      title: title.toUpperCase(),
      category,
      legalArea,
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
      toast({ title: "Nova Matriz Criada" })
    }
    setIsDialogOpen(false)
  }

  const currentStepIndex = EDITOR_STEPS.findIndex(s => s.id === editorStep)

  if (!canManage && !isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <Shield className="h-16 w-16 text-rose-500 animate-pulse" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Restrito</h2>
        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">O Laboratório exige permissões de Administrador RGMJ.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">ARQUITETURA JURÍDICA</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Laboratório de Matrizes</h1>
          <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em] opacity-60">Configuração de roteiros de triagem e inteligência de dados.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrar modelos..." 
              className="pl-12 glass border-white/5 h-14 text-sm text-white focus:ring-primary/50 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleOpenCreate} className="gold-gradient text-background font-black h-14 w-14 rounded-xl shadow-2xl hover:scale-105 transition-all">
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auditando biblioteca...</span>
          </div>
        ) : filteredChecklists.map((list) => (
          <Card key={list.id} className="glass border-primary/10 hover:border-primary/30 transition-all group overflow-hidden flex flex-col rounded-[2rem] shadow-2xl">
            <div className="p-8 space-y-6 flex-1">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5 px-3 h-6">
                  {list.category}
                </Badge>
                <div className="flex gap-3">
                  <button onClick={() => { setViewingList(list); setIsViewDialogOpen(true); }} className="text-white/20 hover:text-primary transition-colors"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => handleOpenEdit(list)} className="text-white/20 hover:text-white transition-colors"><Edit3 className="h-4 w-4" /></button>
                  <button onClick={() => deleteDocumentNonBlocking(doc(db!, "checklists", list.id))} className="text-white/20 hover:text-rose-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{list.title}</h3>
              <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                <Scale className="h-3.5 w-3.5" /> {list.legalArea || "GERAL"}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 italic uppercase font-medium">{list.description || "Sem descrição técnica definida."}</p>
            </div>
            <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                <Layers className="h-4 w-4 opacity-50" /> {list.items?.length || 0} CAMPOS DNA
              </div>
              <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1000px] w-[95vw] h-[90vh] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col font-sans">
          {/* Header Editor */}
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                  <FileEdit className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Engenharia de Matriz</DialogTitle>
                  <DialogDescription className="text-[10px] uppercase font-black text-muted-foreground opacity-50 tracking-widest">Protocolo de estruturação tática RGMJ.</DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {EDITOR_STEPS.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <button 
                      onClick={() => setEditorStep(s.id)}
                      className={cn(
                        "px-5 h-9 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                        editorStep === s.id ? "bg-primary text-background shadow-lg" : "bg-white/5 text-muted-foreground hover:text-white"
                      )}
                    >
                      {s.label}
                    </button>
                    {idx < EDITOR_STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-white/5" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-700 shadow-[0_0_15px_rgba(245,208,48,0.5)]" style={{ width: `${((currentStepIndex + 1) / EDITOR_STEPS.length) * 100}%` }} />
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 bg-[#0a0f1e]/50">
            <div className="p-10 max-w-5xl mx-auto pb-32">
              {editorStep === "geral" && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-8 space-y-3">
                      <Label className="text-[11px] font-black text-primary uppercase tracking-widest">Título da Matriz *</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value.toUpperCase())} className="bg-black/40 border-white/10 h-14 text-white font-black text-lg focus:ring-1 focus:ring-primary/50 rounded-xl" placeholder="EX: TRIAGEM INICIAL TRABALHISTA" />
                    </div>
                    <div className="md:col-span-4 space-y-3">
                      <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Categoria</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white font-bold rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#0d121f] text-white">
                          {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id} className="uppercase text-[10px] font-black">{c.label.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-12 space-y-3">
                      <Label className="text-[11px] font-black text-primary uppercase tracking-widest">Área Jurídica de Atuação</Label>
                      <div className="flex flex-wrap gap-3">
                        {LEGAL_AREAS.map(area => (
                          <button 
                            key={area}
                            onClick={() => setLegalArea(area)}
                            className={cn(
                              "px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                              legalArea === area ? "bg-primary/10 border-primary text-primary shadow-xl" : "bg-black/20 border-white/5 text-muted-foreground hover:text-white"
                            )}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-12 space-y-3">
                      <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Finalidade Estratégica</Label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-black/40 border-white/10 min-h-[120px] text-white text-sm resize-none p-6 rounded-2xl" placeholder="Descreva os objetivos desta captura de dados..." />
                    </div>
                  </div>
                </div>
              )}

              {editorStep === "perguntas" && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">DNA de Captura</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-black opacity-40">Defina os campos e a inteligência de resposta.</p>
                    </div>
                    <Button onClick={handleAddField} className="gold-gradient text-background font-black h-12 px-8 rounded-xl shadow-xl uppercase text-[10px] tracking-widest gap-3">
                      <Plus className="h-4 w-4" /> ADICIONAR ELEMENTO
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {items.map((item, idx) => (
                      <Card key={idx} className="bg-white/[0.02] border-white/5 p-8 rounded-3xl relative group hover:border-primary/20 transition-all shadow-2xl">
                        <div className="absolute -left-3 top-8 w-1 h-12 bg-primary rounded-full shadow-[0_0_15px_rgba(245,208,48,0.5)]" />
                        <div className="flex justify-between items-start mb-8">
                          <Badge className="bg-[#1a1f2e] border-white/10 text-primary font-black uppercase text-[9px] px-4 h-7 rounded-full">ITEM #{idx + 1}</Badge>
                          <button onClick={() => handleRemoveField(idx)} className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                          <div className="md:col-span-7 space-y-3">
                            <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Rótulo / Pergunta da Entrevista *</Label>
                            <Input value={item.label} onChange={(e) => handleUpdateField(idx, 'label', e.target.value.toUpperCase())} className="bg-black/40 border-white/10 h-14 text-white font-black text-sm uppercase" />
                          </div>
                          <div className="md:col-span-3 space-y-3">
                            <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tipo de Campo</Label>
                            <Select value={item.type} onValueChange={(v) => handleUpdateField(idx, 'type', v)}>
                              <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                                {FIELD_TYPES.map(t => (
                                  <SelectItem key={t.id} value={t.id} className="uppercase text-[10px] font-black">
                                    <div className="flex items-center gap-3"><t.icon className="h-3.5 w-3.5 opacity-50" /> {t.label}</div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2 flex items-center gap-3 pb-3">
                            <Switch checked={item.required} onCheckedChange={(v) => handleUpdateField(idx, 'required', v)} className="data-[state=checked]:bg-emerald-500" />
                            <Label className="text-[9px] font-black text-white uppercase tracking-widest">Obrigatório</Label>
                          </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-black/20 p-6 rounded-2xl">
                          <div className="md:col-span-3 space-y-4">
                            <div className="flex items-center gap-3">
                              <Switch checked={item.reuseEnabled} onCheckedChange={(v) => handleUpdateField(idx, 'reuseEnabled', v)} className="data-[state=checked]:bg-primary" />
                              <Label className="text-[10px] font-black text-primary uppercase tracking-widest">REUSO DE DADOS</Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <Switch checked={item.balizaObrigatoria} onCheckedChange={(v) => handleUpdateField(idx, 'balizaObrigatoria', v)} className="data-[state=checked]:bg-amber-500" />
                              <Label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">BALIZA IA</Label>
                            </div>
                          </div>

                          {item.reuseEnabled && (
                            <>
                              <div className="md:col-span-3 space-y-3">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase">Destino</Label>
                                <Select value={item.reuseTarget} onValueChange={(v) => handleUpdateField(idx, 'reuseTarget', v)}>
                                  <SelectTrigger className="bg-black/40 border-white/5 h-11 text-white font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-[#0d121f] text-white">
                                    {REUSE_TARGETS.map(t => <SelectItem key={t.id} value={t.id}>{t.label.toUpperCase()}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="md:col-span-4 space-y-3">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase">Campo Mapeado</Label>
                                <Select value={item.targetField} onValueChange={(v) => handleUpdateField(idx, 'targetField', v)}>
                                  <SelectTrigger className="bg-black/40 border-white/5 h-11 text-white font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-[#0d121f] text-white">
                                    {TARGET_FIELDS_BY_REUSE_TARGET[item.reuseTarget || "caseDetails"]?.map(f => (
                                      <SelectItem key={f.id} value={f.id}>{f.label.toUpperCase()}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="md:col-span-2 space-y-3">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase">Prioridade</Label>
                                <Select value={item.reusePriority} onValueChange={(v) => handleUpdateField(idx, 'reusePriority', v)}>
                                  <SelectTrigger className="bg-black/40 border-white/5 h-11 text-white font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-[#0d121f] text-white">
                                    {REUSE_PRIORITIES.map(p => <SelectItem key={p.id} value={p.id}>{p.label.toUpperCase()}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {editorStep === "revisao" && (
                <div className="space-y-10 animate-in zoom-in-95 duration-500">
                  <div className="p-10 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/20 text-center space-y-6 shadow-2xl">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto animate-bounce" />
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Matriz Saneada</h3>
                      <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em]">REVISÃO FINAL DE ARQUITETURA CONCLUÍDA.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="glass border-white/5 p-8 rounded-3xl space-y-6 shadow-xl">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <FileText className="h-5 w-5 text-primary" />
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Consolidado Geral</h4>
                      </div>
                      <div className="space-y-4">
                        <div><p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Título Oficial</p><p className="text-sm font-bold text-white uppercase">{title}</p></div>
                        <div><Badge variant="outline" className="border-primary/30 text-primary font-black uppercase text-[10px] px-4">{category}</Badge></div>
                      </div>
                    </Card>
                    <Card className="glass border-primary/20 bg-primary/5 p-8 rounded-3xl space-y-6 shadow-xl">
                      <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
                        <Layers className="h-5 w-5 text-primary" />
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Resumo Técnico</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-6 text-center">
                        <div className="p-4 bg-black/40 rounded-2xl"><p className="text-2xl font-black text-white">{items.length}</p><p className="text-[8px] font-black text-muted-foreground uppercase">PERGUNTAS</p></div>
                        <div className="p-4 bg-black/40 rounded-2xl"><p className="text-2xl font-black text-primary">{items.filter(i => i.reuseEnabled).length}</p><p className="text-[8px] font-black text-muted-foreground uppercase">REUSO DADOS</p></div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/60 border-t border-white/5 flex items-center justify-between flex-none shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-10 h-12 hover:text-white">Descartar</Button>
            <div className="flex gap-4">
              {currentStepIndex > 0 && <Button variant="outline" onClick={() => setEditorStep(EDITOR_STEPS[currentStepIndex - 1].id)} className="h-12 border-white/10 text-white font-black uppercase text-[11px] px-8 rounded-xl"><ArrowLeft className="h-4 w-4 mr-2" /> ANTERIOR</Button>}
              <Button 
                onClick={editorStep === "revisao" ? handleSave : () => setEditorStep(EDITOR_STEPS[currentStepIndex + 1].id)} 
                className="gold-gradient text-background font-black h-14 px-12 rounded-xl shadow-2xl uppercase text-[11px] tracking-widest gap-3"
              >
                {editorStep === "revisao" ? <ShieldCheck className="h-5 w-5" /> : null}
                {editorStep === "revisao" ? "SALVAR E PUBLICAR NA BANCA" : "PRÓXIMO RITO"}
                {editorStep !== "revisao" ? <ChevronRight className="h-5 w-5" /> : null}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE VISUALIZAÇÃO DETALHADA */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[800px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[80vh] font-sans">
          <div className="p-10 bg-[#0a0f1e] border-b border-white/5 flex-none shadow-xl">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-2xl">
                <Eye className="h-8 w-8" />
              </div>
              <div className="text-left space-y-2">
                <DialogTitle className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{viewingList?.title}</DialogTitle>
                <div className="flex items-center gap-4">
                  <Badge className="bg-primary text-background font-black uppercase text-[10px] px-4 h-7 rounded-full">{viewingList?.category}</Badge>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">• {viewingList?.legalArea}</span>
                </div>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-12 space-y-10">
              <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 space-y-4 shadow-inner">
                <Label className="text-[10px] font-black text-primary uppercase tracking-widest opacity-50">Contexto da Matriz</Label>
                <p className="text-base text-white/80 leading-relaxed font-medium uppercase">{viewingList?.description || "Sem descrição técnica."}</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <Layers className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">DNA de Captura ({viewingList?.items?.length || 0})</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {viewingList?.items?.map((item: any, i: number) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all shadow-lg">
                      <div className="flex items-center gap-6">
                        <span className="text-xs font-mono font-bold text-muted-foreground/30">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-bold text-white uppercase tracking-tight">{item.label}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="secondary" className="bg-white/5 text-[8px] font-black uppercase text-muted-foreground">{item.type}</Badge>
                            {item.required && <Badge className="bg-rose-500/10 text-rose-500 border-0 text-[8px] font-black uppercase">Obrigatório</Badge>}
                            {item.balizaObrigatoria && <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[8px] font-black uppercase">Baliza IA</Badge>}
                          </div>
                        </div>
                      </div>
                      {item.reuseEnabled && <CheckCircle2 className="h-5 w-5 text-primary opacity-20 group-hover:opacity-100 transition-all" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex-none">
            <Button onClick={() => setIsViewDialogOpen(false)} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-2xl">FECHAR DOSSIÊ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
