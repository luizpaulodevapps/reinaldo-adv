
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MoreVertical, 
  Sparkles, 
  Brain, 
  Loader2, 
  Plus,
  History,
  LayoutGrid,
  ChevronRight,
  X
} from "lucide-react"
import { 
  useFirestore, 
  useCollection, 
  useUser, 
  useMemoFirebase, 
  updateDocumentNonBlocking, 
  addDocumentNonBlocking 
} from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { format, isBefore, startOfDay, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { aiParseDjePublication } from "@/ai/flows/ai-parse-dje-publication"
import { useToast } from "@/hooks/use-toast"

export default function DeadlinesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"pendentes" | "cumpridos" | "historico">("pendentes")
  const [isAiParserOpen, setIsAiParserOpen] = useState(false)
  const [publicationText, setPublicationText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)

  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  // Busca Prazos
  const deadlinesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "deadlines"), orderBy("dueDate", "asc"))
  }, [db, user])

  const { data: deadlinesData, isLoading } = useCollection(deadlinesQuery)
  const deadlines = deadlinesData || []

  // Filtros
  const filteredDeadlines = useMemo(() => {
    return deadlines.filter(d => {
      const matchesSearch = 
        d.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.processId?.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (activeTab === "pendentes") return matchesSearch && d.status === "Aberto"
      if (activeTab === "cumpridos") return matchesSearch && d.status === "Concluído"
      return matchesSearch
    })
  }, [deadlines, searchTerm, activeTab])

  // Lógica de Prazos Expirados
  const expiredDeadlines = useMemo(() => {
    const today = startOfDay(new Date())
    return deadlines.filter(d => d.status === "Aberto" && d.dueDate && isBefore(parseISO(d.dueDate), today))
  }, [deadlines])

  const handleMarkAsDone = (deadlineId: string) => {
    const dRef = doc(db, "deadlines", deadlineId)
    updateDocumentNonBlocking(dRef, {
      status: "Concluído",
      updatedAt: serverTimestamp()
    })
    toast({
      title: "Prazo Cumprido",
      description: "O ato foi registrado como concluído com sucesso."
    })
  }

  const handleAiParse = async () => {
    if (!publicationText) return
    setParsing(true)
    try {
      const output = await aiParseDjePublication({ publicationText })
      setAiResult(output)
      toast({ title: "Publicação Analisada", description: "Dados extraídos pela Inteligência RGMJ." })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na Análise", description: "Falha ao processar o DJE." })
    } finally {
      setParsing(false)
    }
  }

  const handleSaveAiDeadline = () => {
    if (!aiResult || !user) return
    const newDeadline = {
      title: aiResult.deadlineType || "Prazo via IA",
      description: aiResult.summary,
      dueDate: aiResult.dueDate || "",
      calculationType: "Dias Úteis (CPC)",
      publicationDate: new Date().toISOString().split('T')[0],
      publicationText: publicationText,
      status: "Aberto",
      staffId: user.uid,
      processId: aiResult.caseNumbers?.[0] || "N/A",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    addDocumentNonBlocking(collection(db, "deadlines"), newDeadline)
    setIsAiParserOpen(false)
    setAiResult(null)
    setPublicationText("")
    toast({ title: "Prazo Registrado", description: "O novo prazo foi adicionado à pauta global." })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-white tracking-tight">Agenda de Prazos</h1>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em]">Controle global de obrigações do escritório</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por processo ou tipo..." 
              className="pl-10 glass border-primary/10 h-10 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAiParserOpen} onOpenChange={setIsAiParserOpen}>
            <DialogTrigger asChild>
              <Button className="glass border-primary/20 text-primary font-bold gap-2 text-xs h-10 px-4">
                <Brain className="h-4 w-4" /> Analisar DJE
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-primary/20 sm:max-w-[700px] bg-[#0a0f1e]">
              <DialogHeader>
                <DialogTitle className="text-white font-headline text-2xl flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" /> IA Parser de Publicações
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea 
                  placeholder="Cole o texto bruto do DJE aqui..." 
                  className="min-h-[200px] glass font-mono text-sm"
                  value={publicationText}
                  onChange={(e) => setPublicationText(e.target.value)}
                />
                {aiResult && (
                  <div className="p-4 rounded-lg bg-secondary/30 border border-primary/20 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Tipo Detectado:</span>
                      <span className="text-xs font-bold text-primary">{aiResult.deadlineType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Data Fatal:</span>
                      <span className="text-xs font-bold text-emerald-500">{aiResult.dueDate}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground italic leading-relaxed">
                      "{aiResult.summary}"
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleAiParse} 
                    disabled={parsing || !publicationText}
                    className="flex-1 gold-gradient text-background font-bold h-12"
                  >
                    {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                    Processar com IA
                  </Button>
                  {aiResult && (
                    <Button onClick={handleSaveAiDeadline} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12">
                      Confirmar e Salvar
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerta Crítico */}
      {expiredDeadlines.length > 0 && (activeTab === "pendentes" || activeTab === "historico") && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs font-black text-destructive uppercase tracking-widest">Atenção Crítica</h4>
            <p className="text-sm text-white/90">Existem {expiredDeadlines.length} prazo(s) com vencimento expirado!</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 pb-2">
        <Button 
          variant={activeTab === "pendentes" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("pendentes")}
          className={cn(
            "h-9 px-6 text-[10px] font-bold uppercase tracking-widest gap-2",
            activeTab === "pendentes" ? "bg-primary text-background" : "text-muted-foreground"
          )}
        >
          Pendentes <Badge className="h-4 px-1.5 text-[8px] bg-black/20">{deadlines.filter(d => d.status === "Aberto").length}</Badge>
        </Button>
        <Button 
          variant={activeTab === "cumpridos" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("cumpridos")}
          className={cn(
            "h-9 px-6 text-[10px] font-bold uppercase tracking-widest gap-2",
            activeTab === "cumpridos" ? "bg-emerald-500 text-white" : "text-muted-foreground"
          )}
        >
          Cumpridos
        </Button>
        <Button 
          variant={activeTab === "historico" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("historico")}
          className={cn(
            "h-9 px-6 text-[10px] font-bold uppercase tracking-widest gap-2",
            activeTab === "historico" ? "bg-secondary text-white" : "text-muted-foreground"
          )}
        >
          <History className="h-3 w-3" /> Histórico
        </Button>
      </div>

      {/* Listagem de Prazos */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 glass rounded-3xl border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sincronizando Pauta Judicial...</span>
          </div>
        ) : filteredDeadlines.length > 0 ? (
          filteredDeadlines.map((deadline) => {
            const isExpired = deadline.status === "Aberto" && deadline.dueDate && isBefore(parseISO(deadline.dueDate), startOfDay(new Date()))
            const dueDay = deadline.dueDate ? format(parseISO(deadline.dueDate), "dd") : "--"
            const dueMonth = deadline.dueDate ? format(parseISO(deadline.dueDate), "MMM", { locale: ptBR }).toUpperCase() : "---"

            return (
              <Card key={deadline.id} className="glass border-primary/5 hover:border-primary/20 transition-all group relative overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-center">
                    
                    {/* Data Block */}
                    <div className="p-6 md:w-24 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 bg-secondary/20">
                      <span className="text-[10px] font-bold text-muted-foreground tracking-tighter">{dueMonth}</span>
                      <span className="text-2xl font-black text-white">{dueDay}</span>
                    </div>

                    {/* Info Block */}
                    <div className="flex-1 p-6 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase font-bold px-2 bg-primary/5">
                          {deadline.title}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground uppercase font-bold px-2">
                          <Clock className="h-2 w-2 mr-1" /> {deadline.calculationType}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                          {deadline.description || "Sem descrição disponível"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-tighter">
                            {deadline.processId}
                          </span>
                          <span className="text-[10px] text-muted-foreground opacity-50 uppercase tracking-widest">• TRABALHISTA</span>
                        </div>
                      </div>

                      {/* Expiry Line */}
                      {isExpired && (
                        <div className="flex items-center gap-3 pt-2">
                          <div className="h-1 flex-1 bg-destructive/30 rounded-full overflow-hidden">
                            <div className="h-full bg-destructive w-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                          </div>
                          <span className="text-[9px] font-black text-destructive uppercase tracking-widest">Prazo Expirado</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Block */}
                    <div className="p-6 flex items-center gap-4">
                      {deadline.status === "Aberto" ? (
                        <Button 
                          onClick={() => handleMarkAsDone(deadline.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 text-[10px] uppercase h-10 px-6 rounded-lg shadow-lg shadow-emerald-900/10"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Marcar Cumprido
                        </Button>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-0 uppercase font-black tracking-widest text-[9px] h-10 px-4">
                          Finalizado
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-primary/10">
            <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center">
              <Clock className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-white uppercase tracking-widest">Pauta de Prazos Limpa</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Nenhum compromisso pendente foi encontrado para o filtro atual.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
