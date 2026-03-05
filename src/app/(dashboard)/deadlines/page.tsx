
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
  History,
  ChevronRight
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
import Link from "next/link"

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
    if (!user || !db) return null
    return query(collection(db!, "deadlines"), orderBy("dueDate", "asc"))
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

  const expiredDeadlinesCount = useMemo(() => {
    const today = startOfDay(new Date())
    return deadlines.filter(d => d.status === "Aberto" && d.dueDate && isBefore(parseISO(d.dueDate), today)).length
  }, [deadlines])

  const handleMarkAsDone = (deadlineId: string) => {
    if (!db) return
    const dRef = doc(db!, "deadlines", deadlineId)
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
    if (!aiResult || !user || !db) return
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
    addDocumentNonBlocking(collection(db!, "deadlines"), newDeadline)
    setIsAiParserOpen(false)
    setAiResult(null)
    setPublicationText("")
    toast({ title: "Prazo Registrado", description: "O novo prazo foi adicionado à pauta global." })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Gestão de Prazos</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase tracking-tighter">Agenda de Prazos</h1>
          <p className="text-muted-foreground text-[10px] uppercase font-black tracking-[0.25em] opacity-60">Controle global de atos judiciais.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar atos..." 
              className="pl-10 glass border-white/5 h-11 text-xs text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAiParserOpen} onOpenChange={setIsAiParserOpen}>
            <DialogTrigger asChild>
              <Button className="glass border-primary/20 text-primary font-black gap-2 text-[10px] uppercase h-11 px-6 tracking-widest">
                <Brain className="h-4 w-4" /> Analisar DJE
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-primary/20 sm:max-w-[700px] bg-[#0a0f1e] font-sans">
              <DialogHeader>
                <DialogTitle className="text-white font-headline text-2xl flex items-center gap-3 uppercase tracking-tighter">
                  <Sparkles className="h-6 w-6 text-primary" /> IA Parser de Publicações
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea 
                  placeholder="Cole o texto bruto do DJE aqui..." 
                  className="min-h-[200px] glass font-mono text-sm border-white/10"
                  value={publicationText}
                  onChange={(e) => setPublicationText(e.target.value)}
                />
                {aiResult && (
                  <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ato Detectado:</span>
                      <span className="text-xs font-black text-primary uppercase">{aiResult.deadlineType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vencimento:</span>
                      <span className="text-xs font-black text-emerald-500">{aiResult.dueDate}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground italic leading-relaxed bg-black/20 p-3 rounded-lg">
                      "{aiResult.summary}"
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleAiParse} 
                    disabled={parsing || !publicationText}
                    className="flex-1 gold-gradient text-background font-black h-14 uppercase text-[11px] tracking-widest"
                  >
                    {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Processar com Inteligência"}
                  </Button>
                  {aiResult && (
                    <Button onClick={handleSaveAiDeadline} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black h-14 uppercase text-[11px] tracking-widest">
                      Validar e Salvar
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {expiredDeadlinesCount > 0 && (activeTab === "pendentes" || activeTab === "historico") && (
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-6 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center text-destructive border border-destructive/30">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-destructive uppercase tracking-[0.2em]">Atenção Crítica: Prazo Excedido</h4>
            <p className="text-xs text-white/80 uppercase font-bold tracking-widest">Existem {expiredDeadlinesCount} compromisso(s) fora da janela de cumprimento.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pb-2">
        <Button 
          variant={activeTab === "pendentes" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("pendentes")}
          className={cn(
            "h-9 px-8 text-[10px] font-black uppercase tracking-widest gap-3 transition-all",
            activeTab === "pendentes" ? "bg-primary text-background shadow-lg shadow-primary/10" : "text-muted-foreground hover:text-white"
          )}
        >
          Pendentes <Badge className="h-4 px-1.5 text-[8px] bg-black/40 border-0 font-black">{deadlines.filter(d => d.status === "Aberto").length}</Badge>
        </Button>
        <Button 
          variant={activeTab === "cumpridos" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("cumpridos")}
          className={cn(
            "h-9 px-8 text-[10px] font-black uppercase tracking-widest gap-3 transition-all",
            activeTab === "cumpridos" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/10" : "text-muted-foreground hover:text-white"
          )}
        >
          Cumpridos
        </Button>
        <Button 
          variant={activeTab === "historico" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("historico")}
          className={cn(
            "h-9 px-8 text-[10px] font-black uppercase tracking-widest gap-3 transition-all",
            activeTab === "historico" ? "bg-secondary text-white" : "text-muted-foreground hover:text-white"
          )}
        >
          <History className="h-3.5 w-3.5" /> Histórico
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Pauta Judicial...</span>
          </div>
        ) : filteredDeadlines.length > 0 ? (
          filteredDeadlines.map((deadline) => {
            const isExp = deadline.status === "Aberto" && deadline.dueDate && isBefore(parseISO(deadline.dueDate), startOfDay(new Date()))
            const dueDay = deadline.dueDate ? format(parseISO(deadline.dueDate), "dd") : "--"
            const dueMonth = deadline.dueDate ? format(parseISO(deadline.dueDate), "MMM", { locale: ptBR }).toUpperCase() : "---"

            return (
              <Card key={deadline.id} className="glass border-white/5 hover-gold transition-all group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="p-8 md:w-28 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.02] group-hover:bg-primary/5 transition-all">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{dueMonth}</span>
                      <span className={cn("text-3xl font-black", isExp ? "text-destructive" : "text-white")}>{dueDay}</span>
                    </div>

                    <div className="flex-1 p-8 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase font-black px-3 bg-primary/5 tracking-[0.1em]">
                          {deadline.title}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground uppercase font-bold px-2 tracking-widest">
                          <Clock className="h-2.5 w-2.5 mr-1.5" /> {deadline.calculationType}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                          {deadline.description || "Sem descrição disponível"}
                        </h4>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                            CNJ: {deadline.processId}
                          </span>
                          <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">• DOSSIÊ ESTRATÉGICO</span>
                        </div>
                      </div>

                      {isExp && (
                        <div className="flex items-center gap-4 pt-3">
                          <div className="h-1 flex-1 bg-destructive/20 rounded-full overflow-hidden">
                            <div className="h-full bg-destructive w-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
                          </div>
                          <span className="text-[10px] font-black text-destructive uppercase tracking-[0.2em]">Ato Expirado</span>
                        </div>
                      )}
                    </div>

                    <div className="p-8 flex items-center gap-4">
                      {deadline.status === "Aberto" ? (
                        <Button 
                          onClick={() => handleMarkAsDone(deadline.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black gap-2 text-[10px] uppercase h-12 px-8 rounded-xl shadow-xl transition-all"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Registrar Cumprimento
                        </Button>
                      ) : (
                        <div className="flex items-center gap-3 px-6 h-12 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Concluído</span>
                        </div>
                      )}
                      <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-white border border-white/5 rounded-xl">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="py-40 flex flex-col items-center justify-center space-y-8 glass rounded-[3rem] border-dashed border-2 border-white/5 opacity-20">
            <Clock className="h-20 w-20 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-base font-black text-white uppercase tracking-[0.4em]">Pauta Limpa</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Nenhum compromisso tático pendente no radar.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
