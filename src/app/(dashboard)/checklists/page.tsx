
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
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
  List,
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
  ChevronDown,
  Zap,
  Target,
  ShieldQuestion,
  Bookmark,
  ExternalLink,
  BookOpen,
  History,
  Brain,
  Calculator,
  Save,
  Library,
  CloudLightning,
  Tag,
  ShieldAlert
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
import { collection, query, orderBy, serverTimestamp, doc, writeBatch } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  { id: "text", label: "Texto Livre (IA)", icon: FileText },
  { id: "boolean_partial", label: "Sim/Não/Parcial", icon: Circle },
  { id: "number", label: "Moeda/Valor", icon: DollarSign },
  { id: "cep", label: "CEP (Automação)", icon: MapPin },
  { id: "cpf_cnpj", label: "Documentos", icon: Fingerprint },
  { id: "phone", label: "WhatsApp", icon: Phone },
  { id: "date", label: "Data/Calendário", icon: Calendar },
]

const PRESET_MATRICES = [
  {
    title: "TRIAGEM INICIAL TRABALHISTA",
    category: "Entrevista de Triagem",
    legalArea: "Trabalhista",
    description: "Matriz completa para captura de DNA em Reclamações Trabalhistas. Inclui balizas para jornada, verbas rescisórias e danos morais.",
    items: [
      { label: "IDENTIFICACAO: NOME COMPLETO", type: "text", required: true, reuseEnabled: true, reuseTarget: "client", targetField: "fullName", reusePriority: "alta", balizaObrigatoria: true },
      { label: "IDENTIFICACAO: CPF", type: "cpf_cnpj", required: true, reuseEnabled: true, reuseTarget: "client", targetField: "cpf", reusePriority: "alta", balizaObrigatoria: true },
      { label: "VINCULO: DATA ADMISSAO", type: "date", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "startDate", reusePriority: "media", balizaObrigatoria: true },
      { label: "VINCULO: DATA DEMISSAO", type: "date", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "endDate", reusePriority: "media", balizaObrigatoria: true },
      { label: "VINCULO: ULTIMO SALARIO", type: "number", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "value", reusePriority: "media", balizaObrigatoria: false },
      { label: "JORNADA: HORARIO TRABALHO", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "workHours", reusePriority: "alta", balizaObrigatoria: true },
      { label: "JORNADA: FAZIA HORAS EXTRAS?", type: "boolean_partial", required: true, reuseEnabled: false, balizaObrigatoria: true },
      { label: "DANOS: SOFREU ASSEDIO OU ACIDENTE?", type: "text", required: false, reuseEnabled: false, balizaObrigatoria: true },
    ]
  },
  {
    title: "DIVORCIO E ALIMENTOS",
    category: "Entrevista de Triagem",
    legalArea: "Família",
    description: "Roteiro tático para ações de Família. Mapeamento de regime de bens, guarda e binômio necessidade/possibilidade.",
    items: [
      { label: "CASAMENTO: DATA DA UNIAO", type: "date", required: true, reuseEnabled: false, balizaObrigatoria: true },
      { label: "BENS: EXISTE PATRIMONIO COMUM?", type: "boolean_partial", required: true, reuseEnabled: false, balizaObrigatoria: true },
      { label: "ALIMENTOS: QUANTIDADE DE FILHOS", type: "number", required: true, reuseEnabled: false, balizaObrigatoria: true },
    ]
  },
  {
    title: "ACAO INDENIZATORIA CIVEL",
    category: "Entrevista de Triagem",
    legalArea: "Cível",
    description: "Estrutura focada em Responsabilidade Civil, Danos Morais e Materiais. Captura o nexo causal e a extensão do dano.",
    items: [
      { label: "FATOS: RESUMO DO OCORRIDO", type: "text", required: true, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "summary", reusePriority: "alta", balizaObrigatoria: true },
      { label: "DANO: VALOR DO PREJUIZO MATERIAL", type: "number", required: false, reuseEnabled: true, reuseTarget: "caseDetails", targetField: "materialDamage", reusePriority: "media", balizaObrigatoria: false },
      { label: "REU: DADOS DA EMPRESA/PESSOA", type: "text", required: true, reuseEnabled: true, reuseTarget: "distribution", targetField: "defendantName", reusePriority: "alta", balizaObrigatoria: true },
    ]
  },
  {
    title: "EXECUCAO FISCAL TRIBUTARIA",
    category: "Entrevista de Triagem",
    legalArea: "Tributário",
    description: "Análise de nulidades em Certidões de Dívida Ativa (CDA), prescrição e teses de defesa em execuções fiscais.",
    items: [
      { label: "DEBITO: ORIGEM DA DIVIDA", type: "text", required: true, reuseEnabled: false, balizaObrigatoria: true },
      { label: "DEBITO: VALOR CONSOLIDADO", type: "number", required: true, reuseEnabled: false, balizaObrigatoria: true },
      { label: "DEFESA: EXISTE PRESCRIÇÃO?", type: "boolean_partial", required: true, reuseEnabled: false, balizaObrigatoria: true },
    ]
  }
]

type EditorStep = "geral" | "perguntas" | "revisao"

const EDITOR_STEPS: Array<{ id: EditorStep; label: string; icon: any }> = [
  { id: "geral", label: "CONTEXTO", icon: Settings2 },
  { id: "perguntas", label: "DNA CAPTURA", icon: Zap },
  { id: "revisao", label: "SANEAMENTO", icon: ShieldCheck },
]

export default function LaboratorioChecklistsPage() {
  const [activeMainTab, setActiveMainTab] = useState("matrizes")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
  const [isInjecting, setIsInjecting] = useState(false)
  
  const [viewingList, setViewingList] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingList, setEditingList] = useState<any>(null)
  const [editingModel, setEditingModel] = useState<any>(null)
  const [editorStep, setEditorStep] = useState<EditorStep>("geral")
  
  // Estados Matriz
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Entrevista de Triagem")
  const [legalArea, setLegalArea] = useState("Trabalhista")
  const [description, setDescription] = useState("")
  const [items, setItems] = useState<any[]>([])

  // Estados Modelo Petição
  const [modelFormData, setModelFormData] = useState({
    title: "",
    area: "Trabalhista",
    googleDocId: "",
    tags: ""
  })

  const db = useFirestore()
  const { user, role } = useUser()
  const { toast } = useToast()

  const canManage = role === 'admin'

  const checklistsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "checklists"), orderBy("createdAt", "desc"))
  }, [db, user])
  const { data: checklists, isLoading: isLoadingChecklists } = useCollection(checklistsQuery)

  const modelsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "document_templates"), orderBy("createdAt", "desc"))
  }, [db, user])
  const { data: models, isLoading: isLoadingModels } = useCollection(modelsQuery)

  const filteredChecklists = useMemo(() => {
    if (!checklists) return []
    return checklists.filter(c => 
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [checklists, searchTerm])

  const filteredModels = useMemo(() => {
    if (!models) return []
    return models.filter(m => 
      m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.area?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [models, searchTerm])

  const handleOpenCreate = () => {
    if (activeMainTab === "matrizes") {
      setEditingList(null); setTitle(""); setCategory("Entrevista de Triagem"); setLegalArea("Trabalhista"); setDescription(""); setItems([]); setEditorStep("geral"); setIsDialogOpen(true);
    } else {
      setEditingModel(null); setModelFormData({ title: "", area: "Trabalhista", googleDocId: "", tags: "" }); setIsModelDialogOpen(true);
    }
  }

  const handleInjectPresets = async () => {
    if (!db) return
    setIsInjecting(true)
    try {
      const batch = writeBatch(db)
      const existingTitles = new Set((checklists || []).map(c => c.title.toUpperCase()))
      let addedCount = 0
      PRESET_MATRICES.forEach(matrix => {
        if (!existingTitles.has(matrix.title.toUpperCase())) {
          const newDocRef = doc(collection(db, "checklists"))
          batch.set(newDocRef, { ...matrix, id: newDocRef.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), isPreset: true })
          addedCount++
        }
      })
      if (addedCount > 0) {
        await batch.commit()
        toast({ title: "Biblioteca Injetada", description: `${addedCount} matrizes inéditas instaladas.` })
      } else {
        toast({ title: "Biblioteca Sincronizada", description: "Todos os modelos já constam no acervo." })
      }
    } catch (e) { toast({ variant: "destructive", title: "Erro na Injeção" }) } finally { setIsInjecting(false) }
  }

  const handleSave = () => {
    if (!title || !db) return
    const listData = { title: title.toUpperCase(), category, legalArea, description, items, updatedAt: serverTimestamp() }
    if (editingList) updateDocumentNonBlocking(doc(db, "checklists", editingList.id), listData)
    else addDocumentNonBlocking(collection(db, "checklists"), { ...listData, createdAt: serverTimestamp() })
    setIsDialogOpen(false); toast({ title: "Matriz Atualizada" })
  }

  const handleSaveModel = () => {
    if (!db || !modelFormData.title) return
    const tagsArray = modelFormData.tags.split(",").map(t => t.trim().toUpperCase()).filter(t => t !== "")
    const payload = { title: modelFormData.title.toUpperCase(), area: modelFormData.area, googleDocId: modelFormData.googleDocId, tags: tagsArray, updatedAt: serverTimestamp() }
    if (editingModel) updateDocumentNonBlocking(doc(db!, "document_templates", editingModel.id), payload)
    else addDocumentNonBlocking(collection(db!, "document_templates"), { ...payload, createdAt: serverTimestamp() })
    setIsModelDialogOpen(false); toast({ title: "Acervo de Petições Atualizado" })
  }

  const currentStepIndex = EDITOR_STEPS.findIndex(s => s.id === editorStep)

  return (
    <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-10 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">ARQUITETURA JURÍDICA</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Laboratório de Matrizes</h1>
          <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em] opacity-60">Gestão de roteiros de triagem e inteligência de dados.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Filtrar modelos..." className="pl-12 glass border-white/5 h-14 text-sm text-white focus:ring-primary/50 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleInjectPresets} disabled={isInjecting} variant="outline" className="glass border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest h-14 px-6 rounded-xl gap-3">
              {isInjecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Library className="h-4 w-4" />} INJETAR BIBLIOTECA
            </Button>
            <Button onClick={handleOpenCreate} className="gold-gradient text-background font-black h-14 w-14 rounded-xl shadow-2xl hover:scale-105 transition-all"><Plus className="h-6 w-6" /></Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="bg-white/5 border border-white/10 p-1.5 rounded-full w-fit shadow-2xl">
          <TabsList className="bg-transparent h-12 p-0 gap-1">
            <TabsTrigger value="matrizes" className={cn("text-muted-foreground font-black text-[10px] uppercase h-full px-8 rounded-full transition-all tracking-widest gap-2", activeMainTab === "matrizes" && "bg-primary text-background shadow-[0_0_20px_rgba(245,208,48,0.3)]")}>
              <Zap className="h-3.5 w-3.5" /> Matrizes de DNA (Triagem)
            </TabsTrigger>
            <TabsTrigger value="peticoes" className={cn("text-muted-foreground font-black text-[10px] uppercase h-full px-8 rounded-full transition-all tracking-widest gap-2", activeMainTab === "peticoes" && "bg-primary text-background shadow-[0_0_20px_rgba(245,208,48,0.3)]")}>
              <FileText className="h-3.5 w-3.5" /> Modelos de Petição
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/5 shadow-xl">
          <Button onClick={() => setViewMode("grid")} variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className={cn("h-10 w-10 rounded-lg transition-all", viewMode === "grid" ? "bg-primary text-background" : "text-muted-foreground")}><LayoutGrid className="h-4 w-4" /></Button>
          <Button onClick={() => setViewMode("list")} variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className={cn("h-10 w-10 rounded-lg transition-all", viewMode === "list" ? "bg-primary text-background" : "text-muted-foreground")}><List className="h-4 w-4" /></Button>
        </div>
      </div>

      <TabsContent value="matrizes" className="m-0 outline-none animate-in fade-in duration-500">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingChecklists ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auditando biblioteca...</span></div>
            ) : filteredChecklists.map((list) => (
              <Card key={list.id} className="bg-[#0d1117] border-primary/20 hover:border-primary/50 transition-all group overflow-hidden flex flex-col rounded-[2.5rem] shadow-2xl border min-h-[400px]">
                <div className="p-10 space-y-8 flex-1 relative">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/30 text-primary bg-primary/5 px-4 h-7 rounded-full tracking-widest">{list.category?.toUpperCase()}</Badge>
                    <div className="flex gap-4">
                      <button onClick={() => { setViewingList(list); setIsViewDialogOpen(true); }} className="text-white/20 hover:text-primary transition-all"><Eye className="h-5 w-5" /></button>
                      <button onClick={() => { setEditingList(list); setTitle(list.title); setCategory(list.category); setLegalArea(list.legalArea || "Trabalhista"); setDescription(list.description || ""); setItems(list.items || []); setEditorStep("geral"); setIsDialogOpen(true); }} className="text-white/20 hover:text-white transition-all"><Edit3 className="h-5 w-5" /></button>
                      <button onClick={() => deleteDocumentNonBlocking(doc(db!, "checklists", list.id))} className="text-white/20 hover:text-rose-500 transition-all"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-[#F5D030] uppercase tracking-tighter leading-none group-hover:brightness-125 transition-all">{list.title}</h3>
                  <div className="flex items-center gap-3 text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-60"><Scale className="h-4 w-4 opacity-50" /> {list.legalArea?.toUpperCase()}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 italic uppercase font-medium tracking-wide">{list.description}</p>
                </div>
                <div className="px-10 py-8 bg-black/40 border-t border-white/5 flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-4 text-[11px] font-black text-primary uppercase tracking-[0.2em]"><Layers className="h-5 w-5 opacity-50" /> {list.items?.length || 0} CAMPOS DNA</div>
                  <ChevronRight className="h-5 w-5 text-white/5 group-hover:text-primary transition-all group-hover:translate-x-2" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-[2rem] bg-black/40">
            <Table>
              <TableHeader className="bg-white/[0.03]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black text-primary uppercase py-8 pl-10">DNA TRIAGEM</TableHead>
                  <TableHead className="text-[10px] font-black text-primary uppercase py-8 text-center">CATEGORIA</TableHead>
                  <TableHead className="text-[10px] font-black text-primary uppercase py-8 text-center">ÁREA</TableHead>
                  <TableHead className="text-[10px] font-black text-primary uppercase py-8 text-center">CAMPOS</TableHead>
                  <TableHead className="text-[10px] font-black text-primary uppercase py-8 text-right pr-10">COMANDOS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChecklists.map((list) => (
                  <TableRow key={list.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                    <TableCell className="py-8 pl-10"><span className="text-sm font-black text-white uppercase group-hover:text-[#F5D030] transition-colors tracking-tight">{list.title}</span></TableCell>
                    <TableCell className="py-8 text-center"><Badge variant="outline" className="text-[8px] font-black border-white/10 text-muted-foreground uppercase px-3 py-1 rounded-full">{list.category?.toUpperCase()}</Badge></TableCell>
                    <TableCell className="py-8 text-center"><span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{list.legalArea?.toUpperCase()}</span></TableCell>
                    <TableCell className="py-8 text-center"><div className="flex items-center justify-center gap-3"><Layers className="h-4 w-4 text-primary/40" /><span className="text-xs font-black text-white">{list.items?.length || 0}</span></div></TableCell>
                    <TableCell className="py-8 text-right pr-10">
                      <div className="flex items-center justify-end gap-6">
                        <button onClick={() => { setViewingList(list); setIsViewDialogOpen(true); }} className="text-white/20 hover:text-primary transition-all"><Eye className="h-5 w-5" /></button>
                        <button onClick={() => { setEditingList(list); setTitle(list.title); setCategory(list.category); setLegalArea(list.legalArea || "Trabalhista"); setDescription(list.description || ""); setItems(list.items || []); setEditorStep("geral"); setIsDialogOpen(true); }} className="text-white/20 hover:text-white transition-all"><Edit3 className="h-5 w-5" /></button>
                        <button onClick={() => deleteDocumentNonBlocking(doc(db!, "checklists", list.id))} className="text-white/20 hover:text-rose-500 transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="peticoes" className="m-0 outline-none animate-in fade-in duration-500">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingModels ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auditando acervo...</span></div>
            ) : filteredModels.map((model) => (
              <Card key={model.id} className="bg-[#0d1117] border-white/10 hover:border-primary/40 transition-all group shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col border min-h-[350px]">
                <div className="p-10 space-y-8 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl"><FileText className="h-7 w-7" /></div>
                    <div className="flex gap-3">
                      {model.googleDocId && <button onClick={() => window.open(`https://docs.google.com/document/d/${model.googleDocId}/edit`, "_blank")} className="text-white/20 hover:text-emerald-500 bg-white/5 p-2.5 rounded-xl transition-colors"><ExternalLink className="h-5 w-5" /></button>}
                      <button onClick={() => { setEditingModel(model); setModelFormData({ title: model.title, area: model.area, googleDocId: model.googleDocId || "", tags: (model.tags || []).join(", ") }); setIsModelDialogOpen(true); }} className="text-white/20 hover:text-white bg-white/5 p-2.5 rounded-xl transition-colors"><Settings2 className="h-5 w-5" /></button>
                      <button onClick={() => deleteDocumentNonBlocking(doc(db!, "document_templates", model.id))} className="text-white/20 hover:text-rose-500 bg-white/5 p-2.5 rounded-xl transition-colors"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-[#F5D030] uppercase tracking-tight group-hover:brightness-125 transition-all leading-tight">{model.title}</h3>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20 text-primary bg-primary/5 px-4 h-7 rounded-full tracking-widest">{model.area?.toUpperCase()}</Badge>
                      {model.googleDocId && <Badge className="bg-blue-500/10 text-blue-400 border-0 text-[9px] font-black uppercase tracking-widest px-3 h-7 rounded-full">GOOGLE DOCS OK</Badge>}
                    </div>
                  </div>
                </div>
                <div className="px-10 py-6 bg-black/40 border-t border-white/5 flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                  <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">ID: {model.id.substring(0,8).toUpperCase()}</span>
                  <ChevronRight className="h-5 w-5 text-white/5 group-hover:text-primary transition-all" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-[2rem] bg-black/40">
            <Table>
              <TableHeader className="bg-[#05070a]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black text-[#F5D030] uppercase py-10 pl-10">Minuta Estratégica</TableHead>
                  <TableHead className="text-[10px] font-black text-[#F5D030] uppercase py-10 text-center">ESFERA JURÍDICA</TableHead>
                  <TableHead className="text-[10px] font-black text-[#F5D030] uppercase py-10 text-center">TAGS MAPEADAS</TableHead>
                  <TableHead className="text-[10px] font-black text-[#F5D030] uppercase py-10 text-center">SINCRONISMO</TableHead>
                  <TableHead className="text-[10px] font-black text-[#F5D030] uppercase py-10 text-right pr-10">COMANDOS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.map((model) => (
                  <TableRow key={model.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                    <TableCell className="py-10 pl-10"><span className="text-base font-black text-white uppercase group-hover:text-[#F5D030] transition-colors tracking-tight">{model.title}</span></TableCell>
                    <TableCell className="py-10 text-center"><Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary uppercase px-4 py-1.5 rounded-full bg-primary/5">{model.area?.toUpperCase()}</Badge></TableCell>
                    <TableCell className="py-10 text-center"><div className="flex items-center justify-center gap-3"><Tag className="h-4 w-4 text-primary/40" /><span className="text-xs font-black text-white">{model.tags?.length || 0} VARIÁVEIS</span></div></TableCell>
                    <TableCell className="py-10 text-center">
                      {model.googleDocId ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest"><CloudLightning className="h-4 w-4" /> GOOGLE DOCS ATIVO</div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground/30 font-black text-[10px] uppercase tracking-widest"><ShieldAlert className="h-4 w-4" /> LOCAL ONLY</div>
                      )}
                    </TableCell>
                    <TableCell className="py-10 text-right pr-10">
                      <div className="flex items-center justify-end gap-6">
                        {model.googleDocId && <button onClick={() => window.open(`https://docs.google.com/document/d/${model.googleDocId}/edit`, "_blank")} className="text-white/20 hover:text-emerald-500 transition-all"><ExternalLink className="h-5 w-5" /></button>}
                        <button onClick={() => { setEditingModel(model); setModelFormData({ title: model.title, area: model.area, googleDocId: model.googleDocId || "", tags: (model.tags || []).join(", ") }); setIsModelDialogOpen(true); }} className="text-white/20 hover:text-white transition-all"><Settings2 className="h-5 w-5" /></button>
                        <button onClick={() => deleteDocumentNonBlocking(doc(db!, "document_templates", model.id))} className="text-white/20 hover:text-rose-500 transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </TabsContent>

      {/* DIÁLOGO ENGENHARIA DE MATRIZ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1000px] w-[95vw] h-[90vh] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl"><FileEdit className="h-6 w-6" /></div><div><DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Engenharia de Matriz</DialogTitle><DialogDescription className="text-[10px] uppercase font-black text-muted-foreground opacity-50 tracking-widest">Protocolo de estruturação tática RGMJ.</DialogDescription></div></div>
              <div className="flex items-center gap-3">
                {EDITOR_STEPS.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <button onClick={() => setEditorStep(s.id)} className={cn("px-5 h-9 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", editorStep === s.id ? "bg-primary text-background shadow-lg" : "bg-white/5 text-muted-foreground hover:text-white")}>{s.label}</button>
                    {idx < EDITOR_STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-white/5" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-700 shadow-[0_0_15px_rgba(245,208,48,0.5)]" style={{ width: `${((currentStepIndex + 1) / EDITOR_STEPS.length) * 100}%` }} /></div>
          </div>
          <ScrollArea className="flex-1 bg-[#0a0f1e]/50">
            <div className="p-10 max-w-5xl mx-auto pb-32">
              {editorStep === "geral" && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-8 space-y-3"><Label className="text-[11px] font-black text-primary uppercase tracking-widest">Título da Matriz *</Label><Input value={title} onChange={(e) => setTitle(e.target.value.toUpperCase())} className="bg-black/40 border-white/10 h-14 text-white font-black text-lg rounded-xl" placeholder="EX: TRIAGEM INICIAL TRABALHISTA" /></div>
                    <div className="md:col-span-4 space-y-3"><Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Categoria</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="bg-black/40 border-white/10 h-14 text-white font-bold rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="bg-[#0d121f] text-white">{CATEGORIES.map(c => <SelectItem key={c.id} value={c.id} className="uppercase text-[10px] font-black">{c.label.toUpperCase()}</SelectItem>)}</SelectContent></Select></div>
                    <div className="md:col-span-12 space-y-3"><Label className="text-[11px] font-black text-primary uppercase tracking-widest">Área Jurídica de Atuação</Label><div className="flex flex-wrap gap-3">{LEGAL_AREAS.map(area => (<button key={area} onClick={() => setLegalArea(area)} className={cn("px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border", legalArea === area ? "bg-primary/10 border-primary text-primary shadow-xl" : "bg-black/20 border-white/5 text-muted-foreground hover:text-white")}>{area}</button>))}</div></div>
                    <div className="md:col-span-12 space-y-3"><Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Finalidade Estratégica</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-black/40 border-white/10 min-h-[120px] text-white text-sm resize-none p-6 rounded-2xl" placeholder="Descreva os objetivos desta captura..." /></div>
                  </div>
                </div>
              )}
              {editorStep === "perguntas" && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div><h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">DNA de Captura</h4><p className="text-[10px] text-muted-foreground uppercase font-black opacity-40">Defina os campos e a inteligência de resposta.</p></div>
                    <Button onClick={() => setItems([...items, { label: "", type: "text", required: true, reuseEnabled: false, reuseTarget: "caseDetails", reusePriority: "media", balizaObrigatoria: false }])} className="gold-gradient text-background font-black h-12 px-8 rounded-xl uppercase text-[10px] tracking-widest gap-3"><Plus className="h-4 w-4" /> ADICIONAR ELEMENTO</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {items.map((item, idx) => (
                      <Card key={idx} className="bg-white/[0.02] border-white/5 p-8 rounded-3xl relative group hover:border-primary/20 transition-all shadow-2xl">
                        <div className="flex justify-between items-start mb-8"><Badge className="bg-[#1a1f2e] border-white/10 text-primary font-black uppercase text-[9px] px-4 h-7 rounded-full">ITEM #{idx + 1}</Badge><button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><X className="h-5 w-5" /></button></div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                          <div className="md:col-span-7 space-y-3"><Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Rótulo / Pergunta *</Label><Input value={item.label} onChange={(e) => { const n = [...items]; n[idx].label = e.target.value.toUpperCase(); setItems(n); }} className="bg-black/40 border-white/10 h-14 text-white font-black text-sm uppercase" /></div>
                          <div className="md:col-span-3 space-y-3"><Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tipo</Label><Select value={item.type} onValueChange={(v) => { const n = [...items]; n[idx].type = v; setItems(n); }}><SelectTrigger className="bg-black/40 border-white/10 h-14 text-white font-bold"><SelectValue /></SelectTrigger><SelectContent className="bg-[#0d121f] text-white">{FIELD_TYPES.map(t => (<SelectItem key={t.id} value={t.id} className="uppercase text-[10px] font-black"><div className="flex items-center gap-3"><t.icon className="h-3.5 w-3.5 opacity-50" /> {t.label}</div></SelectItem>))}</SelectContent></Select></div>
                          <div className="md:col-span-2 flex items-center gap-3 pb-3"><Switch checked={item.required} onCheckedChange={(v) => { const n = [...items]; n[idx].required = v; setItems(n); }} className="data-[state=checked]:bg-emerald-500" /><Label className="text-[9px] font-black text-white uppercase tracking-widest">Obrigatoriedade</Label></div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {editorStep === "revisao" && (
                <div className="space-y-10 animate-in zoom-in-95 duration-500 text-center">
                  <div className="p-10 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/20 space-y-6 shadow-2xl">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
                    <div><h3 className="text-3xl font-black text-white uppercase tracking-tighter">Matriz Saneada</h3><p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em]">REVISÃO FINAL CONCLUÍDA.</p></div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-8 bg-black/60 border-t border-white/5 flex items-center justify-between flex-none shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-10 h-12 hover:text-white">Descartar</Button>
            <div className="flex gap-4">
              {currentStepIndex > 0 && <Button variant="outline" onClick={() => setEditorStep(EDITOR_STEPS[currentStepIndex - 1].id)} className="h-12 border-white/10 text-white font-black uppercase text-[11px] px-8 rounded-xl"><ArrowLeft className="h-4 w-4 mr-2" /> ANTERIOR</Button>}
              <Button onClick={editorStep === "revisao" ? handleSave : () => setEditorStep(EDITOR_STEPS[currentStepIndex + 1].id)} className="gold-gradient text-background font-black h-14 px-12 rounded-xl shadow-2xl uppercase text-[11px] tracking-widest gap-3">
                {editorStep === "revisao" ? <ShieldCheck className="h-5 w-5" /> : null}
                {editorStep === "revisao" ? "SALVAR E PUBLICAR NA BANCA" : "PRÓXIMO RITO"}
                {editorStep !== "revisao" ? <ChevronRight className="h-5 w-5" /> : null}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO MODELO PETIÇÃO */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[700px] w-[95vw] h-[90vh] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none shadow-xl">
            <DialogHeader className="text-left"><DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">{editingModel ? "Retificar Modelo de Petição" : "Novo Modelo Estratégico"}</DialogTitle><DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1">Vínculo direto com Google Docs para geração automática.</DialogDescription></DialogHeader>
          </div>
          <ScrollArea className="flex-1 bg-[#0a0f1e]/50">
            <div className="p-10 space-y-8 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3"><Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">TÍTULO DA MINUTA *</Label><Input value={modelFormData.title} onChange={(e) => setModelFormData({...modelFormData, title: e.target.value.toUpperCase()})} className="bg-black/40 border-white/10 h-14 text-white font-black text-sm" /></div>
                <div className="space-y-3"><Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">ÁREA DE ATUAÇÃO</Label><Select value={modelFormData.area} onValueChange={(v) => setModelFormData({...modelFormData, area: v})}><SelectTrigger className="bg-black/40 border-white/10 h-14 text-white uppercase text-[11px] font-black tracking-widest"><SelectValue /></SelectTrigger><SelectContent className="bg-[#0d121f] text-white">{LEGAL_AREAS.map(area => <SelectItem key={area} value={area}>{area.toUpperCase()}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-black text-primary uppercase tracking-widest">ID GOOGLE DOC (MODELO BASE)</Label>
                  {modelFormData.googleDocId && <button onClick={() => window.open(`https://docs.google.com/document/d/${modelFormData.googleDocId}/edit`, "_blank")} className="text-[9px] font-black text-emerald-500 hover:underline uppercase flex items-center gap-2"><ExternalLink className="h-3 w-3" /> Abrir no Drive</button>}
                </div>
                <Input value={modelFormData.googleDocId} onChange={(e) => setModelFormData({...modelFormData, googleDocId: e.target.value})} className="bg-black/40 border-primary/20 h-14 text-white font-mono text-xs" placeholder="Cole o ID que consta na URL do Google Doc..." />
                <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-tight opacity-40">O ID é o código entre /d/ e /edit na URL do seu documento.</p>
              </div>
              <div className="space-y-3"><Label className="text-[11px] font-black text-primary uppercase tracking-widest">TAGS DINÂMICAS (SEPARAR POR VÍRGULA)</Label><Input value={modelFormData.tags} onChange={(e) => setModelFormData({...modelFormData, tags: e.target.value})} className="bg-black/40 border-white/10 h-14 text-white font-bold text-xs" placeholder="{{NOME}}, {{CPF}}, {{DATA}}..." /></div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <Button variant="ghost" onClick={() => setIsModelDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 hover:text-white">ABORTAR</Button>
            <Button onClick={handleSaveModel} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-10 h-14 rounded-xl shadow-2xl transition-all hover:scale-105 active:scale-95"><Save className="h-5 w-5 mr-3" /> SALVAR ACERVO PETIÇÕES</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO VISUALIZAÇÃO MATRIZ */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[800px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[80vh] font-sans">
          <div className="p-10 bg-[#0a0f1e] border-b border-white/5 flex-none shadow-xl"><div className="flex items-center gap-8"><div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-2xl"><Eye className="h-8 w-8" /></div><div className="text-left space-y-2"><DialogTitle className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{viewingList?.title}</DialogTitle><div className="flex items-center gap-4"><Badge className="bg-primary text-background font-black uppercase text-[10px] px-4 h-7 rounded-full">{viewingList?.category}</Badge><span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">• {viewingList?.legalArea}</span></div></div></div></div>
          <ScrollArea className="flex-1"><div className="p-12 space-y-10"><div className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 space-y-4 shadow-inner"><Label className="text-[10px] font-black text-primary uppercase tracking-widest opacity-50">Contexto da Matriz</Label><p className="text-base text-white/80 leading-relaxed font-medium uppercase">{viewingList?.description || "Sem descrição técnica."}</p></div><div className="space-y-6"><div className="flex items-center gap-3 border-b border-white/5 pb-2"><Layers className="h-5 w-5 text-primary" /><h4 className="text-sm font-black text-white uppercase tracking-widest">DNA de Captura ({viewingList?.items?.length || 0})</h4></div><div className="grid grid-cols-1 gap-4">{viewingList?.items?.map((item: any, i: number) => (<div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all shadow-lg"><div className="flex items-center gap-6"><span className="text-xs font-mono font-bold text-muted-foreground/30">#{i + 1}</span><div><p className="text-sm font-bold text-white uppercase tracking-tight">{item.label}</p></div></div></div>))}</div></div></div></ScrollArea>
          <div className="p-8 bg-black/40 border-t border-white/5 flex-none"><Button onClick={() => setIsViewDialogOpen(false)} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-2xl">FECHAR DOSSIÊ</Button></div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
