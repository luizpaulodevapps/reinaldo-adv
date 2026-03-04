
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
  PlusCircle
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
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  caseDetails: [
    { id: "caseDetails", label: "Detalhes do Caso" },
  ],
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

const MIN_QUESTIONS_REQUIRED = 1

type EditorStep = "geral" | "perguntas" | "revisao"

const EDITOR_STEPS: Array<{ id: EditorStep; label: string }> = [
  { id: "geral", label: "GERAL" },
  { id: "perguntas", label: "PERGUNTAS" },
  { id: "revisao", label: "REVISÃO" },
]

export default function LaboratorioChecklistsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  const currentStepIndex = EDITOR_STEPS.findIndex(step => step.id === editorStep)
  const canGoBack = currentStepIndex > 0
  const isLastStep = currentStepIndex === EDITOR_STEPS.length - 1

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

  const handleAddField = () => {
    setItems([
      ...items,
      {
        label: "",
        type: "boolean",
        required: true,
        reuseEnabled: false,
        reuseTarget: "caseDetails",
        targetField: "caseDetails",
        reusePriority: "media",
        balizaObrigatoria: false,
      },
    ])
  }

  const handleUpdateField = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleRemoveField = (index: number) => {
    const targetItem = items[index]
    const hasContent = Boolean(targetItem?.label?.trim())

    if (hasContent) {
      const confirmed = window.confirm("Esta pergunta possui conteúdo preenchido. Deseja remover mesmo assim?")
      if (!confirmed) return
    }

    setItems(items.filter((_, i) => i !== index))
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
      toast({ title: "Nova Matriz de Elite Criada" })
    }
    setIsDialogOpen(false)
  }

  const handleNextStep = () => {
    if (editorStep === "geral" && !title.trim()) {
      toast({ variant: "destructive", title: "Título Necessário" })
      return
    }

    if (editorStep === "perguntas" && items.length < MIN_QUESTIONS_REQUIRED) {
      toast({ variant: "destructive", title: "Adicione ao menos uma pergunta" })
      return
    }

    const nextStep = EDITOR_STEPS[currentStepIndex + 1]
    if (nextStep) {
      setEditorStep(nextStep.id)
    }
  }

  const handlePreviousStep = () => {
    const previousStep = EDITOR_STEPS[currentStepIndex - 1]
    if (previousStep) {
      setEditorStep(previousStep.id)
    }
  }

  if (!canManage && !isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 font-sans">
        <Shield className="h-16 w-16 text-destructive animate-pulse" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Negado</h2>
        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">O Laboratório é restrito à alta cúpula RGMJ.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans">
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
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
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
                    {db && (
                      <button onClick={() => deleteDocumentNonBlocking(doc(db, "checklists", list.id))} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl font-black text-white uppercase tracking-tight leading-tight">
                  {list.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Scale className="h-3 w-3 text-primary/50" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{list.legalArea || "GERAL"}</span>
                </div>
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
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[95vh] font-sans">
          {/* Header Editor de Modelo */}
          <div className="p-8 md:p-10 bg-[#0a0f1e] border-b border-white/5 space-y-6">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <FileEdit className="h-8 w-8 text-primary" />
                <DialogTitle className="text-white font-headline text-4xl uppercase tracking-tighter">
                  Editor de Modelo
                </DialogTitle>
              </div>
              <DialogDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Desenvolva o passo a passo padrão para as rotinas do escritório.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">
                  ETAPA {currentStepIndex + 1}/{EDITOR_STEPS.length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {EDITOR_STEPS[currentStepIndex]?.label}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {EDITOR_STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setEditorStep(step.id)}
                    className={cn(
                      "h-11 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                      editorStep === step.id
                        ? "border-primary bg-primary text-[#0a0f1e]"
                        : "border-white/10 bg-black/30 text-muted-foreground hover:text-white hover:border-primary/40",
                      index <= currentStepIndex && editorStep !== step.id && "text-white/80"
                    )}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-8 md:p-10 space-y-12">
              {editorStep === "geral" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-8 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TÍTULO DO CHECKLIST *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.toUpperCase())}
                      placeholder="Ex: PROTOCOLO DE INICIAL TRABALHISTA"
                      className="bg-black/40 border-white/10 h-14 text-white font-bold focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CATEGORIA</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-black/40 border-primary h-14 text-white ring-1 ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <cat.icon className="h-3.5 w-3.5 opacity-50" />
                              {cat.label.toUpperCase()}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-12 space-y-2">
                    <Label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Scale className="h-3.5 w-3.5" /> ÁREA JURÍDICA VINCULADA
                    </Label>
                    <Select value={legalArea} onValueChange={setLegalArea}>
                      <SelectTrigger className="bg-black/40 border-primary h-14 text-white ring-1 ring-primary/20">
                        <SelectValue placeholder="Selecione a área para vincular esta entrevista..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                        {LEGAL_AREAS.map(area => (
                          <SelectItem key={area} value={area}>{area.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[9px] text-muted-foreground italic font-medium uppercase tracking-tight">
                      * ESTE FORMULÁRIO APARECERÁ AUTOMATICAMENTE AO TRIAR NOVOS LEADS DESTA ÁREA.
                    </p>
                  </div>

                  <div className="md:col-span-12 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">DESCRIÇÃO / FINALIDADE</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva quando e por quem este checklist deve ser executado..."
                      className="bg-black/40 border-white/10 min-h-[120px] text-white text-sm focus:ring-1 focus:ring-primary/50 resize-none"
                    />
                  </div>
                </div>
              )}

              {editorStep === "perguntas" && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                        <LayoutGrid className="h-5 w-5" /> ELEMENTOS DA ENTREVISTA
                      </h4>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Defina as perguntas e campos de captura de dados.</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
                            items.length >= MIN_QUESTIONS_REQUIRED
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                              : "border-amber-500/40 text-amber-300 bg-amber-500/5"
                          )}
                        >
                          {items.length} PERGUNTA{items.length === 1 ? "" : "S"} CRIADA{items.length === 1 ? "" : "S"}
                        </Badge>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          mínimo: {MIN_QUESTIONS_REQUIRED}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleAddField}
                      className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest gap-2 h-12 px-8 rounded-xl shadow-xl shadow-primary/10"
                    >
                      <Plus className="h-4 w-4" /> ADICIONAR PERGUNTA
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {items.length === 0 ? (
                      <div className="p-20 border-2 border-dashed border-white/5 rounded-[2rem] text-center space-y-6 opacity-20">
                        <div className="w-20 h-20 rounded-full border border-white/10 mx-auto flex items-center justify-center">
                          <ListPlus className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.5em]">Nenhum elemento tático definido.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {items.map((item, idx) => (
                          <div key={idx} className="p-5 rounded-[1.25rem] bg-white/[0.02] border border-white/5 space-y-4 relative group hover:border-primary/20 transition-all">
                            <div className="flex justify-between items-center">
                              <Badge variant="outline" className="text-[10px] font-black text-primary border-primary/20 bg-primary/5 px-4">ITEM #{idx + 1}</Badge>
                              <button
                                onClick={() => handleRemoveField(idx)}
                                className="text-rose-500 hover:text-white hover:bg-rose-500/20 p-2.5 rounded-xl transition-all"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                              <div className="md:col-span-7 space-y-2">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">PERGUNTA / RÓTULO DE CAMPO</Label>
                                <Input
                                  value={item.label}
                                  onChange={(e) => handleUpdateField(idx, 'label', e.target.value.toUpperCase())}
                                  className="bg-black/20 border-white/10 h-12 text-sm text-white font-bold focus:ring-1 focus:ring-primary/50"
                                  placeholder="EX: QUAL O ÚLTIMO SALÁRIO NOMINAL?"
                                />
                              </div>
                              <div className="md:col-span-3 space-y-2">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">INTELIGÊNCIA DE RESPOSTA</Label>
                                <Select value={item.type} onValueChange={(v) => handleUpdateField(idx, 'type', v)}>
                                  <SelectTrigger className="bg-black/20 border-primary h-12 text-[10px] text-white uppercase font-black ring-1 ring-primary/20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                                    {FIELD_TYPES.map(type => (
                                      <SelectItem key={type.id} value={type.id}>
                                        <div className="flex items-center gap-3">
                                          <type.icon className="h-4 w-4 opacity-50" />
                                          {type.label.toUpperCase()}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="md:col-span-2 flex items-center gap-3 pb-2">
                                <Switch
                                  id={`req-${idx}`}
                                  checked={item.required}
                                  onCheckedChange={(v) => handleUpdateField(idx, 'required', v)}
                                  className="data-[state=checked]:bg-emerald-500"
                                />
                                <Label htmlFor={`req-${idx}`} className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> OBRIGATÓRIO
                                </Label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                              <div className="md:col-span-3 flex items-center gap-3 pb-2">
                                <Switch
                                  id={`reuse-${idx}`}
                                  checked={Boolean(item.reuseEnabled)}
                                  onCheckedChange={(v) => handleUpdateField(idx, 'reuseEnabled', v)}
                                  className="data-[state=checked]:bg-primary"
                                />
                                <Label htmlFor={`reuse-${idx}`} className="text-[9px] font-black text-white uppercase tracking-widest cursor-pointer">
                                  REAPROVEITAR
                                </Label>
                              </div>

                              <div className="md:col-span-3 space-y-2">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">DESTINO</Label>
                                <Select
                                  value={item.reuseTarget || "caseDetails"}
                                  onValueChange={(v) => {
                                    const fallbackField = TARGET_FIELDS_BY_REUSE_TARGET[v]?.[0]?.id || ""
                                    setItems((prev) => {
                                      const next = [...prev]
                                      next[idx] = {
                                        ...next[idx],
                                        reuseTarget: v,
                                        targetField: fallbackField,
                                      }
                                      return next
                                    })
                                  }}
                                  disabled={!item.reuseEnabled}
                                >
                                  <SelectTrigger className="bg-black/20 border-primary h-11 text-[10px] text-white uppercase font-black ring-1 ring-primary/20 disabled:opacity-50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                                    {REUSE_TARGETS.map(target => (
                                      <SelectItem key={target.id} value={target.id}>{target.label.toUpperCase()}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="md:col-span-4 space-y-2">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CAMPO DE DESTINO</Label>
                                <Select
                                  value={item.targetField || TARGET_FIELDS_BY_REUSE_TARGET[item.reuseTarget || "caseDetails"]?.[0]?.id || ""}
                                  onValueChange={(v) => handleUpdateField(idx, 'targetField', v)}
                                  disabled={!item.reuseEnabled}
                                >
                                  <SelectTrigger className="bg-black/20 border-primary h-11 text-[10px] text-white uppercase font-black ring-1 ring-primary/20 disabled:opacity-50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                                    {(TARGET_FIELDS_BY_REUSE_TARGET[item.reuseTarget || "caseDetails"] || []).map((field) => (
                                      <SelectItem key={field.id} value={field.id}>{field.label.toUpperCase()}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="md:col-span-2 space-y-2">
                                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">PRIORIDADE</Label>
                                <Select
                                  value={item.reusePriority || "media"}
                                  onValueChange={(v) => handleUpdateField(idx, 'reusePriority', v)}
                                  disabled={!item.reuseEnabled}
                                >
                                  <SelectTrigger className="bg-black/20 border-primary h-11 text-[10px] text-white uppercase font-black ring-1 ring-primary/20 disabled:opacity-50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                                    {REUSE_PRIORITIES.map(priority => (
                                      <SelectItem key={priority.id} value={priority.id}>{priority.label.toUpperCase()}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="md:col-span-3 flex items-center gap-3 pb-2">
                                <Switch
                                  id={`baliza-${idx}`}
                                  checked={Boolean(item.balizaObrigatoria)}
                                  onCheckedChange={(v) => handleUpdateField(idx, 'balizaObrigatoria', v)}
                                  className="data-[state=checked]:bg-amber-500"
                                />
                                <Label htmlFor={`baliza-${idx}`} className="text-[9px] font-black text-white uppercase tracking-widest cursor-pointer">
                                  BALIZA OBRIGATÓRIA
                                </Label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editorStep === "revisao" && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 flex items-start gap-4">
                    {title.trim() && items.length > 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Validação do Modelo</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {title.trim() && items.length > 0
                          ? "Modelo pronto para disponibilizar na banca."
                          : "Complete os dados obrigatórios para finalizar a publicação."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-white/[0.02] border-white/10">
                      <CardContent className="p-6 space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Dados Gerais</p>
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Título</p>
                          <p className="text-sm font-black text-white">{title || "NÃO INFORMADO"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Categoria</p>
                          <p className="text-sm font-black text-white">{category.toUpperCase()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Área Jurídica</p>
                          <p className="text-sm font-black text-white">{legalArea.toUpperCase()}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/[0.02] border-white/10">
                      <CardContent className="p-6 space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Elementos da Entrevista</p>
                        <p className="text-3xl font-black text-white">{items.length}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">perguntas configuradas</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary bg-primary/5">
                            {items.filter((item) => item.reuseEnabled).length} REAPROVEITÁVEIS
                          </Badge>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-amber-500/30 text-amber-300 bg-amber-500/5">
                            {items.filter((item) => item.balizaObrigatoria).length} BALIZAS
                          </Badge>
                        </div>
                        <Button
                          onClick={() => setEditorStep("perguntas")}
                          variant="outline"
                          className="mt-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" /> Ajustar Perguntas
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-white/[0.02] border-white/10">
                    <CardContent className="p-6 space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Descrição / Finalidade</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {description || "Sem descrição informada."}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Editor de Modelo */}
          <div className="p-8 md:p-10 bg-black/40 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <button 
              onClick={() => setIsDialogOpen(false)} 
              className="text-muted-foreground uppercase font-black text-[11px] tracking-[0.2em] hover:text-white transition-colors"
            >
              DESCARTAR ALTERAÇÕES
            </button>

            <div className="w-full md:w-auto flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                disabled={!canGoBack}
                className="h-12 border-white/15 bg-transparent text-white hover:bg-white/5 disabled:opacity-40"
              >
                VOLTAR
              </Button>

              {isLastStep ? (
                <Button
                  onClick={handleSave}
                  className="w-full md:w-auto gold-gradient text-background font-black uppercase text-[12px] tracking-widest px-10 h-12 rounded-xl shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  <ShieldCheck className="h-5 w-5" /> SALVAR E DISPONIBILIZAR NA BANCA
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full md:w-auto gold-gradient text-background font-black uppercase text-[12px] tracking-widest px-10 h-12 rounded-xl shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  PRÓXIMO <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
