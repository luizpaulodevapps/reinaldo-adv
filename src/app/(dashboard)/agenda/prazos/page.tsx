
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
  Scale,
  Plus,
  Edit3,
  Trash2,
  Save,
  FileText,
  Calendar,
  Eye,
  ShieldAlert,
  Zap,
  X,
  Brain,
  Calculator,
  Star,
  TriangleAlert,
  CalendarDays,
  Target,
  ChevronDown,
  Library,
  Video,
  MapPin,
  AlarmClock,
  ArrowRight
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp, limit as firestoreLimit } from "firebase/firestore"
import { format, parseISO, isBefore, startOfDay, isSameDay, addDays, addBusinessDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { aiParseDjePublication } from "@/ai/flows/ai-parse-dje-publication"

export default function PrazosSubpage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<any>(null)
  const [viewingDeadline, setViewingDeadline] = useState<any>(null)
  
  // Estados para Controle de Fluxo Multi-Step
  const [step, setStep] = useState(1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [deadlineDuration, setDeadlineDuration] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    pubDate: format(new Date(), 'yyyy-MM-dd'),
    publicationText: "",
    calculationType: "Dias Úteis (CPC/CLT)",
    modality: "VIRTUAL", // Novo campo
    strategicNotes: "",
    processId: "",
    status: "Aberto",
    priority: "normal"
  })

  const deadlinesQuery = useMemoFirebase(() => {
    if (!db) return null
    // Limitando em 150 para evitar travamento de renderização se a base for gigante
    return query(collection(db, "deadlines"), orderBy("dueDate", "asc"), firestoreLimit(150))
  }, [db])

  const { data: deadlines, isLoading, error: queryError } = useCollection(deadlinesQuery)
  
  if (queryError) {
    console.error("Erro de Índice no Firestore:", queryError)
  }

  const searchParams = useSearchParams()
  const selectedAdvogado = searchParams.get("advogado")
  const searchQuery = searchParams.get("q")

  const activeDeadlines = useMemo(() => {
    if (!deadlines) return []
    return deadlines
      .filter(d => d.status === "Aberto")
      .filter(d => {
        if (!selectedAdvogado) return true
        return d.responsibleLawyer === selectedAdvogado
      })
      .filter(d => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
          d.title?.toLowerCase().includes(q) || 
          d.description?.toLowerCase().includes(q) || 
          d.processId?.toLowerCase().includes(q)
        )
      })
  }, [deadlines, selectedAdvogado, searchQuery])

  const handleOpenCreate = () => {
    setEditingDeadline(null)
    setFormData({
      title: "PRAZO PARA RÉPLICA",
      description: "",
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      pubDate: format(new Date(), 'yyyy-MM-dd'),
      publicationText: "",
      calculationType: "Dias Úteis (CPC/CLT)",
      modality: "VIRTUAL",
      strategicNotes: "",
      processId: "",
      status: "Aberto",
      priority: "normal"
    })
    setDeadlineDuration("")
    setStep(1) // Reset para o primeiro passo
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (deadline: any) => {
    setEditingDeadline(deadline)
    setFormData({
      title: deadline.title || "",
      description: deadline.description || "",
      dueDate: deadline.dueDate || "",
      pubDate: deadline.pubDate || format(new Date(), 'yyyy-MM-dd'),
      publicationText: deadline.publicationText || "",
      calculationType: deadline.calculationType || "Dias Úteis (CPC/CLT)",
      modality: deadline.modality || "VIRTUAL",
      strategicNotes: deadline.strategicNotes || "",
      processId: deadline.processId || "",
      status: deadline.status || "Aberto",
      priority: deadline.priority || "normal"
    })
    setIsDialogOpen(true)
    setIsViewOpen(false)
  }

  const handleOpenView = (deadline: any) => {
    setViewingDeadline(deadline)
    setIsViewOpen(true)
  }

  const handleAiParsePublication = async () => {
    if (!formData.publicationText) return
    setIsAnalyzing(true)
    try {
      const result = await aiParseDjePublication({ publicationText: formData.publicationText })
      setFormData(prev => ({
        ...prev,
        title: result.deadlineType?.toUpperCase() || prev.title,
        dueDate: result.dueDate || prev.dueDate,
        description: result.summary?.toUpperCase() || prev.description
      }))
      toast({ title: "Inteligência RGMJ Concluída", description: "Dados extraídos do despacho." })
    } catch (e) {
      toast({ variant: "destructive", title: "Erro na Análise IA" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApplyDeadlineCalculation = () => {
    const days = parseInt(deadlineDuration)
    if (isNaN(days)) {
      toast({ variant: "destructive", title: "Duração Inválida" })
      return
    }
    
    const baseDate = parseISO(formData.pubDate)
    let calculatedDate: Date
    
    if (formData.calculationType.includes("Úteis")) {
      calculatedDate = addBusinessDays(baseDate, days)
    } else {
      calculatedDate = addDays(baseDate, days)
    }
    
    setFormData(prev => ({ ...prev, dueDate: format(calculatedDate, 'yyyy-MM-dd') }))
    toast({ title: "Vencimento Projetado", description: `Data fatal calculada para ${format(calculatedDate, 'dd/MM/yyyy')}.` })
  }

  const handleSave = async () => {
    if (!db || !formData.title || !formData.dueDate) {
      toast({ variant: "destructive", title: "Dados Incompletos" })
      return
    }

    const payload = {
      ...formData,
      title: formData.title.toUpperCase(),
      description: formData.description.toUpperCase(),
      strategicNotes: formData.strategicNotes.toUpperCase(),
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

      // Notificação de Novo Prazo
      if (user) {
        addDocumentNonBlocking(collection(db, "notifications"), {
          userId: user.uid,
          title: "Novo Prazo Injetado",
          message: `O termo ${formData.title.toUpperCase()} foi adicionado ao radar fatal.`,
          type: "deadline",
          severity: "warning",
          read: false,
          link: "/agenda/prazos",
          createdAt: serverTimestamp()
        })
      }

      toast({ title: "Prazo Injetado no Radar" })
    }
    setIsDialogOpen(false)
  }

  const handleMarkAsDone = (id: string) => {
    if (!db) return
    
    const deadline = activeDeadlines.find(d => d.id === id)

    updateDocumentNonBlocking(doc(db, "deadlines", id), {
      status: "Concluído",
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Notificação de Cumprimento
    if (user && deadline) {
      addDocumentNonBlocking(collection(db, "notifications"), {
        userId: user.uid,
        title: "Prazo Cumprido",
        message: `O ato ${deadline.title.toUpperCase()} foi arquivado como concluído.`,
        type: "deadline",
        severity: "info",
        read: false,
        link: "/agenda/prazos",
        createdAt: serverTimestamp()
      })
    }

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

                  <div className="flex-1 p-10 space-y-5 flex flex-col justify-center min-w-0 cursor-pointer" onClick={() => handleOpenView(d)}>
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

                  <div className="p-10 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/5 gap-4 flex-none bg-white/[0.01]">
                    <Button 
                      onClick={() => handleMarkAsDone(d.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black gap-3 text-[10px] uppercase h-14 px-10 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                      <CheckCircle2 className="h-5 w-5" /> Registrar Cumprimento
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="bg-[#f5d030] hover:bg-[#f5d030]/90 text-background h-14 w-14 rounded-xl shadow-xl transition-all hover:scale-105">
                          <MoreVertical className="h-6 w-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 bg-[#0d121f] border-white/10 text-white p-2 rounded-2xl shadow-2xl font-sans">
                        <div className="p-1">
                          <Button 
                            onClick={() => handleOpenEdit(d)}
                            className="w-full gold-gradient text-background font-black uppercase text-[11px] tracking-widest h-12 rounded-xl mb-2 hover:scale-[1.02] transition-transform"
                          >
                            EDITAR ATO
                          </Button>
                          <DropdownMenuItem onClick={() => handleMarkAsDone(d.id)} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest h-12 rounded-xl cursor-pointer text-emerald-400 hover:bg-emerald-500/10 focus:bg-emerald-500/10 transition-colors">
                            <CheckCircle2 className="h-5 w-5" /> MARCAR CUMPRIDO
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(d.id)} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest h-12 rounded-xl cursor-pointer text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 transition-colors">
                            <Trash2 className="h-5 w-5" /> EXCLUIR PRAZO
                          </DropdownMenuItem>
                        </div>
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

      {/* DIÁLOGO DE VISUALIZAÇÃO DE DETALHES (DOSSIÊ DO PRAZO) */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[850px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col font-sans h-[90vh]">
          <div className="p-10 bg-[#0a0f1e] flex items-center justify-between relative shadow-2xl border-b border-white/5 flex-none">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/30 text-primary shadow-[0_0_20px_rgba(245,208,48,0.15)]">
                <FileText className="h-8 w-8" />
              </div>
              <div className="text-left space-y-1.5">
                <Badge className="bg-[#f5d030]/10 text-[#f5d030] border-0 text-[10px] font-black uppercase tracking-[0.2em] px-4 h-6 rounded-full">
                  DOSSIÊ DO PRAZO
                </Badge>
                <DialogTitle className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">
                  {viewingDeadline?.title}
                </DialogTitle>
              </div>
            </div>

            <Button 
              onClick={() => handleOpenEdit(viewingDeadline)} 
              variant="outline" 
              className="bg-white/5 border-white/10 text-white font-black text-[11px] uppercase tracking-widest h-12 px-8 rounded-xl hover:bg-primary hover:text-background transition-all"
            >
              <Edit3 className="h-4 w-4 mr-3" /> EDITAR
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-12 space-y-12 bg-[#0a0f1e]/50 pb-20">
              {/* Grid de Dados Expandido */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Vencimento Fatal</Label>
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4 shadow-inner">
                    <Calendar className="h-5 w-5 text-rose-500" />
                    <span className="text-sm font-black text-white uppercase truncate">
                      {viewingDeadline?.dueDate ? format(parseISO(viewingDeadline.dueDate.split('T')[0]), "dd/MM/yyyy") : '---'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Publicação</Label>
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4 shadow-inner">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-black text-white uppercase truncate">
                      {viewingDeadline?.pubDate ? format(parseISO(viewingDeadline.pubDate), "dd/MM/yyyy") : '---'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Protocolo CNJ</Label>
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4 shadow-inner">
                    <Scale className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold text-white font-mono truncate">
                      {viewingDeadline?.processId || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Metodologia</Label>
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4 shadow-inner">
                    <ShieldAlert className="h-5 w-5 text-emerald-500" />
                    <span className="text-[10px] font-black text-white uppercase truncate">
                      {viewingDeadline?.calculationType || 'DIAS ÚTEIS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Providência */}
              <div className="space-y-4">
                <Label className="text-[11px] font-black text-primary uppercase tracking-[0.25em] flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4" /> Providência / Tarefa
                </Label>
                <div className="p-10 rounded-[2.5rem] bg-black/20 border-2 border-[#f5d030]/20 shadow-[0_0_40px_rgba(245,208,48,0.05)]">
                  <p className="text-xl text-white/90 leading-relaxed font-serif font-black italic text-justify uppercase tracking-tight">
                    {viewingDeadline?.description || "SEM PROVIDÊNCIA TÉCNICA REGISTRADA."}
                  </p>
                </div>
              </div>

              {/* Texto do Despacho */}
              {viewingDeadline?.publicationText && (
                <div className="space-y-4">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.25em] flex items-center gap-3">
                    <Library className="h-4 w-4" /> Texto da Publicação (Despacho)
                  </Label>
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 shadow-inner">
                    <p className="text-xs text-white/60 leading-relaxed font-mono whitespace-pre-wrap uppercase">
                      {viewingDeadline.publicationText}
                    </p>
                  </div>
                </div>
              )}

              {/* Observações Estratégicas */}
              {viewingDeadline?.strategicNotes && (
                <div className="space-y-4">
                  <Label className="text-[11px] font-black text-primary uppercase tracking-[0.25em] flex items-center gap-3">
                    <Target className="h-4 w-4" /> Inteligência Tática / Alertas
                  </Label>
                  <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 shadow-xl">
                    <p className="text-sm text-white/80 leading-relaxed italic font-medium uppercase">
                      {viewingDeadline.strategicNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-10 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between flex-none shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-4">
              <Zap className="h-5 w-5 text-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Soberania Técnica RGMJ</span>
            </div>
            <button 
              onClick={() => setIsViewOpen(false)} 
              className="text-muted-foreground uppercase font-black text-[12px] tracking-[0.3em] px-10 h-14 hover:text-white transition-colors"
            >
              FECHAR DOSSIÊ
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE GESTÃO DE PRAZO (MULTI-STEP) */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) setStep(1)
      }}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[850px] w-[95vw] h-auto max-h-[90vh] p-0 overflow-hidden shadow-2xl rounded-[2.5rem] font-sans flex flex-col">
          
          {/* HEADER MULTI-STEP */}
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none">
            <div className="flex flex-row items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-[0_0_30px_rgba(245,208,48,0.1)]">
                {step === 1 ? <AlarmClock className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
              </div>
              <div className="text-left">
                <DialogTitle className="text-white font-black uppercase tracking-tighter text-2xl">
                  {step === 1 ? "LANÇAR PRAZO FATAL" : "Lançar Prazo Judicial"}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-1.5">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black uppercase tracking-[0.2em] px-3 h-5 rounded-md">
                    PASSO {step} DE 5
                  </Badge>
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">
                    {step === 1 ? "INTEGRAÇÃO WORKSPACE" : "CONFIGURAÇÃO DE VENCIMENTOS"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsDialogOpen(false)} className="text-white/20 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-12">
              
              {/* PASSO 1: MODALIDADE */}
              {step === 1 && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center space-y-2">
                    <h3 className="text-sm font-black text-white/90 uppercase tracking-[0.3em]">1. QUAL A MODALIDADE?</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button 
                      onClick={() => setFormData({...formData, modality: 'VIRTUAL'})}
                      className={cn(
                        "group relative p-12 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-6 overflow-hidden",
                        formData.modality === 'VIRTUAL' 
                          ? "bg-primary/5 border-primary shadow-[0_0_50px_rgba(245,208,48,0.1)]" 
                          : "bg-white/[0.02] border-white/5 hover:border-white/20"
                      )}
                    >
                      <Video className={cn("h-12 w-12 transition-transform group-hover:scale-110", formData.modality === 'VIRTUAL' ? "text-primary" : "text-white/20")} />
                      <span className={cn("text-sm font-black uppercase tracking-[0.4em]", formData.modality === 'VIRTUAL' ? "text-white" : "text-white/40")}>Virtual</span>
                    </button>

                    <button 
                      onClick={() => setFormData({...formData, modality: 'PRESENCIAL'})}
                      className={cn(
                        "group relative p-12 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-6 overflow-hidden",
                        formData.modality === 'PRESENCIAL' 
                          ? "bg-primary/5 border-primary shadow-[0_0_50px_rgba(245,208,48,0.1)]" 
                          : "bg-white/[0.02] border-white/5 hover:border-white/20"
                      )}
                    >
                      <MapPin className={cn("h-12 w-12 transition-transform group-hover:scale-110", formData.modality === 'PRESENCIAL' ? "text-primary" : "text-white/20")} />
                      <span className={cn("text-sm font-black uppercase tracking-[0.4em]", formData.modality === 'PRESENCIAL' ? "text-white" : "text-white/40")}>Presencial</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PASSO 2: DETALHES DO PRAZO */}
              {step === 2 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col gap-1.5 border-l-4 border-primary pl-6 py-2">
                    <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Configure o compromisso fatal para:</h4>
                    <p className="text-white text-base font-black uppercase leading-tight">
                      {formData.processId ? `PROCESSO: ${formData.processId}` : "RT - KELLY PEREIRA DE CARVALHO X FUNDACAO DO ABC"}
                    </p>
                  </div>

                  {/* Texto da Publicação IA */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                        <FileText className="h-4 w-4 text-primary" /> Texto da Publicação / Despacho
                      </Label>
                      <Button 
                        onClick={handleAiParsePublication} 
                        disabled={isAnalyzing || !formData.publicationText}
                        variant="outline" 
                        className="h-10 bg-black/40 border-white/10 text-primary font-black uppercase text-[9px] tracking-widest hover:bg-primary/10 transition-all gap-2"
                      >
                        {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                        ANALISAR COM IA
                      </Button>
                    </div>
                    <Textarea 
                      placeholder="Cole aqui o texto oficial do Diário da Justiça para que a IA ajude no preenchimento..." 
                      className="bg-black/60 border-white/5 min-h-[140px] text-white/80 text-xs font-bold p-6 rounded-2xl resize-none placeholder:text-white/20"
                      value={formData.publicationText}
                      onChange={(e) => setFormData({...formData, publicationText: e.target.value.toUpperCase()})}
                    />
                  </div>

                  {/* Tipo de Prazo e Resumo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Tipo de Prazo *</Label>
                      <div className="relative">
                        <select 
                          className="w-full bg-black/60 border-white/5 h-14 pl-6 pr-12 text-white font-black text-xs uppercase rounded-xl appearance-none outline-none focus:border-primary/50 transition-colors"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        >
                          <option value="">Selecione o tipo...</option>
                          <option value="RÉPLICA À CONTESTAÇÃO">RÉPLICA À CONTESTAÇÃO</option>
                          <option value="RECURSO ORDINÁRIO">RECURSO ORDINÁRIO</option>
                          <option value="MANIFESTAÇÃO LAUDO">MANIFESTAÇÃO LAUDO</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary shadow-lg flex flex-col items-center justify-center gap-1">
                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Dias Úteis</span>
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-primary" />
                          <span className="text-2xl font-black text-white">0</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-1 opacity-40">
                        <span className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em]">Corridos</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="text-2xl font-black text-white">0</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metodologia */}
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Metodologia de Contagem</Label>
                    <RadioGroup 
                      value={formData.calculationType} 
                      onValueChange={(v) => setFormData({...formData, calculationType: v})}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div className={cn(
                        "p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-5",
                        formData.calculationType === "Dias Úteis (CPC/CLT)" ? "bg-primary/5 border-primary shadow-xl" : "bg-black/40 border-white/5"
                      )} onClick={() => setFormData({...formData, calculationType: "Dias Úteis (CPC/CLT)"})}>
                        <RadioGroupItem value="Dias Úteis (CPC/CLT)" className="border-primary text-primary h-5 w-5" />
                        <div>
                          <p className="text-[12px] font-black text-white uppercase tracking-wider">Dias Úteis (CPC/CLT)</p>
                          <p className="text-[9px] text-white/30 uppercase mt-1">Exclui sábados e domingos</p>
                        </div>
                      </div>
                      <div className={cn(
                        "p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-5",
                        formData.calculationType === "Dias Corridos (Material)" ? "bg-primary/5 border-primary shadow-xl" : "bg-black/40 border-white/5"
                      )} onClick={() => setFormData({...formData, calculationType: "Dias Corridos (Material)"})}>
                        <RadioGroupItem value="Dias Corridos (Material)" className="border-primary text-primary h-5 w-5" />
                        <div>
                          <p className="text-[12px] font-black text-white uppercase tracking-wider">Dias Corridos (Material)</p>
                          <p className="text-[9px] text-white/30 uppercase mt-1">Conta todos os dias</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Calculadora */}
                  <div className="p-10 rounded-[2rem] border-2 border-primary/20 bg-primary/5 space-y-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Calculator className="h-24 w-24 text-primary" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                      <Calculator className="h-5 w-5 text-primary" />
                      <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Calculadora de Vencimento</h4>
                    </div>
                    <div className="flex flex-col md:flex-row items-end gap-8 relative z-10">
                      <div className="flex-1 space-y-3 w-full">
                        <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Duração do Prazo (Dias)</Label>
                        <Input 
                          type="number" 
                          placeholder="Ex: 5, 15, 30..." 
                          className="bg-black/60 border-white/5 h-16 text-white font-black text-2xl text-center rounded-2xl placeholder:text-white/10"
                          value={deadlineDuration}
                          onChange={(e) => setDeadlineDuration(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={handleApplyDeadlineCalculation}
                        variant="ghost" 
                        className="h-16 px-12 border-2 border-primary/40 text-primary font-black uppercase text-[10px] tracking-[0.2em] gap-3 hover:bg-primary hover:text-background transition-all rounded-2xl"
                      >
                        <Zap className="h-5 w-5" /> APLICAR PRAZO
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </ScrollArea>

          <div className="p-10 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between flex-none">
            <button 
              onClick={() => step === 1 ? setIsDialogOpen(false) : setStep(1)} 
              className="text-white/30 uppercase font-black text-[11px] tracking-[0.3em] px-8 h-12 hover:text-white transition-colors"
            >
              {step === 1 ? "CANCELAR" : "VOLTAR"}
            </button>
            <Button 
              onClick={() => step === 1 ? setStep(2) : handleSave()}
              className="gold-gradient text-background font-black uppercase text-[10px] tracking-[0.25em] px-12 h-16 rounded-2xl shadow-3xl hover:scale-105 transition-all flex items-center gap-4"
            >
              {step === 1 ? (
                <>PRÓXIMO RITO <ArrowRight className="h-4 w-4" /></>
              ) : (
                <><Save className="h-5 w-5" /> CONFIRMAR LANÇAMENTO</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
