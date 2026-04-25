"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Loader2, 
  FileText, 
  Clock, 
  ChevronRight,
  Brain,
  ClipboardList,
  Building2,
  Trash2,
  Edit3,
  Save,
  User,
  FileSearch,
  Sparkles,
  Copy,
  FileDown,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, collectionGroup } from "firebase/firestore"
import { InterviewForm } from "@/components/interviews/interview-form"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { aiAnalyzeFullInterview, type AnalyzeInterviewOutput } from "@/ai/flows/ai-analyze-full-interview"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function InterviewsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFormOpen, setIsNewFormOpen] = useState(false)
  
  const [viewingInterview, setViewingInterview] = useState<any>(null)
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false)
  const [interviewAnalysis, setInterviewAnalysis] = useState<AnalyzeInterviewOutput | null>(null)

  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const interviewsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    // Utiliza collectionGroup para buscar todas as entrevistas em todas as subcoleções de leads
    return query(collectionGroup(db!, "interviews"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: interviews, isLoading } = useCollection(interviewsQuery)

  const handleCreateInterview = (data: any) => {
    if (!user || !db) return
    const newInterview = { 
      ...data, 
      interviewerId: user.uid, 
      interviewerName: user.displayName, 
      status: "Concluída", 
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    }
    addDocumentNonBlocking(collection(db!, "interviews"), newInterview)
      .then(() => { setIsNewFormOpen(false); toast({ title: "Entrevista Registrada" }) })
  }

  const handleDeleteInterview = async (id: string) => {
    if (!db || !confirm("Deseja apagar esta entrevista?")) return
    // Nota: Como estamos em collectionGroup, o doc(db, "interviews", id) pode não funcionar 
    // se não soubermos o path completo. Idealmente deletar via LeadsPage.
    toast({ variant: "destructive", title: "Função Restrita ao Dossiê do Lead" })
  }

  const handleRunInterviewAnalysis = async (interview: any) => {
    setIsAiAnalyzing(true); setInterviewAnalysis(null)
    try {
      const result = await aiAnalyzeFullInterview({ clientName: interview.clientName, interviewType: interview.interviewType, responses: interview.responses })
      setInterviewAnalysis(result)
      // Aqui precisaríamos do path completo para atualizar. O item do useCollection já vem com o path? 
      // Por agora, apenas exibimos.
    } catch (e) { toast({ variant: "destructive", title: "Erro na análise" }) } finally { setIsAiAnalyzing(false) }
  }

  const handleExportToGoogleDocs = () => {
    if (!interviewAnalysis) return
    
    const content = `
REINALDO GONÇALVES MIGUEL DE JESUS - ADVOCACIA ESTRATÉGICA
CLIENTE: ${viewingInterview?.clientName}
QUALIFICAÇÃO: ${viewingInterview?.responses?.["IDENTIFICACAO: CPF"] || 'Não informado'}
TIPO: ${viewingInterview?.interviewType}
DATA: ${new Date().toLocaleDateString('pt-BR')}

--------------------------------------------------
MINUTA ESTRUTURADA DE PETIÇÃO INICIAL
--------------------------------------------------

${interviewAnalysis.draftPetition || `
1. RESUMO EXECUTIVO DOS FATOS
${interviewAnalysis.summary}

2. ANÁLISE JURÍDICA E RISCOS
${interviewAnalysis.legalAnalysis}

3. RECOMENDAÇÕES E PRÓXIMOS PASSOS
${interviewAnalysis.recommendations}
`}

--------------------------------------------------
Documento gerado via Inteligência Artificial RGMJ.
`.trim()

    navigator.clipboard.writeText(content).then(() => {
      toast({
        title: "Peça Preparada",
        description: "Estrutura copiada! Redirecionando para novo Google Doc. Use Ctrl+V para colar.",
      })
      setTimeout(() => {
        window.open("https://doc.new", "_blank")
      }, 1500)
    })
  }

  const filteredInterviews = (interviews || []).filter(i => 
    i.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.interviewType?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Central de Atendimento</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Capturas de DNA</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">Triagem e Entrevistas RGMJ.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar dossiês..." className="pl-12 glass border-white/5 h-12 text-xs text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-widest mt-4">Auditando Dossiês...</span></div>
        ) : filteredInterviews.length > 0 ? (
          filteredInterviews.map((item) => (
            <Card key={item.id} className="glass border-white/5 hover-gold transition-all p-0 rounded-2xl bg-white/[0.01] flex flex-col h-full group shadow-2xl relative overflow-hidden">
              {item.aiAnalysis && <div className="absolute top-0 right-0 p-4"><Sparkles className="h-4 w-4 text-primary animate-pulse" /></div>}
              <div className="p-8 space-y-6 flex-1">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-emerald-500/30 text-emerald-500 bg-emerald-500/5 px-2.5 h-6 rounded-md">CONCLUÍDO</Badge>
                  <div className="text-[9px] font-mono font-bold text-muted-foreground uppercase opacity-40 flex items-center gap-2"><Clock className="h-3 w-3" />{item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : '---'}</div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">{item.clientName}</h4>
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-40">{item.interviewType}</p>
                </div>
                <div className="flex items-center gap-2.5 pt-4 border-t border-white/5">
                  <Avatar className="h-6 w-6 border border-white/10"><AvatarFallback className="bg-secondary text-[8px] font-black text-primary">{item.interviewerName?.substring(0, 2)}</AvatarFallback></Avatar>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Dr(a). {item.interviewerName}</span>
                </div>
              </div>
              <div className="p-4 bg-white/[0.02] border-t border-white/5 grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => { setViewingInterview(item); setInterviewAnalysis(item.aiAnalysis || null); }} className="h-10 text-white font-black uppercase text-[9px] tracking-widest rounded-lg hover:bg-white/5 gap-2"><FileSearch className="h-3.5 w-3.5" /> DOSSIÊ</Button>
                <Button onClick={() => handleRunInterviewAnalysis(item)} className="h-10 glass border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest rounded-lg hover:bg-primary hover:text-background gap-2"><Brain className="h-3.5 w-3.5" /> ANALISAR IA</Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-white/5 opacity-30"><MessageSquare className="h-16 w-16 text-muted-foreground" /><p className="text-[11px] font-black uppercase tracking-[0.4em]">Nenhuma captura realizada</p></div>
        )}
      </div>

      <Dialog open={!!viewingInterview} onOpenChange={(open) => !open && setViewingInterview(null)}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[85vh]">
          <DialogHeader className="p-6 bg-[#0a0f1e] border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 flex-none shadow-xl space-y-0 text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><FileSearch className="h-6 w-6 text-primary" /></div>
              <div>
                <DialogTitle className="text-white text-xl font-bold uppercase tracking-widest">{viewingInterview?.interviewType}</DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50 flex items-center gap-2"><span>DR(A). {viewingInterview?.interviewerName}</span></DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {interviewAnalysis && (
                <Button onClick={handleExportToGoogleDocs} variant="outline" className="glass border-primary/30 text-primary font-black uppercase text-[10px] gap-2.5 h-11 px-6 rounded-lg shadow-lg hover:bg-primary/10">
                  <FileDown className="h-4 w-4" /> EXPORTAR DOC.NEW
                </Button>
              )}
              <Button onClick={() => handleRunInterviewAnalysis(viewingInterview)} disabled={isAiAnalyzing} className="h-11 px-6 gold-gradient text-background font-black uppercase text-[10px] gap-2.5 rounded-lg shadow-lg">{isAiAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} ANALISAR IA</Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="transcricao" className="h-full flex flex-col">
              <div className="px-6 bg-black/20 border-b border-white/5 flex-none"><TabsList className="bg-transparent h-12 gap-8 p-0"><TabsTrigger value="transcricao" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full tracking-widest">Transcrição Técnica</TabsTrigger><TabsTrigger value="analise" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full tracking-widest">Diagnóstico IA</TabsTrigger></TabsList></div>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="transcricao" className="h-full mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-10 space-y-8 max-w-4xl mx-auto pb-20">
                      {(viewingInterview?.templateSnapshot || Object.keys(viewingInterview?.responses || {})).map((item: any, i: number) => {
                        const label = typeof item === 'string' ? item : item.label; 
                        const answer = viewingInterview?.responses?.[label]; 
                        if (!answer) return null;
                        return (
                          <div key={i} className="space-y-2 group">
                            <h5 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] group-hover:text-white transition-colors">{label}</h5>
                            <p className="text-base text-white/90 font-serif leading-relaxed text-justify border-l-2 border-white/5 pl-6 py-1">{String(answer)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="analise" className="h-full mt-0">
                  {isAiAnalyzing ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                      <div className="relative">
                        <Brain className="h-16 w-16 text-primary animate-pulse" />
                        <div className="absolute -top-2 -right-2"><Sparkles className="h-6 w-6 text-primary animate-bounce" /></div>
                      </div>
                      <p className="text-[11px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Processando Inteligência RGMJ...</p>
                    </div>
                  ) : interviewAnalysis ? (
                    <ScrollArea className="h-full">
                      <div className="p-10 space-y-10 max-w-5xl mx-auto pb-20">
                        <Card className="glass border-primary/20 bg-primary/5 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-5"><Brain className="h-20 w-20" /></div>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            <h5 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Resumo Executivo dos Fatos</h5>
                          </div>
                          <p className="text-lg text-white font-serif leading-loose text-justify italic whitespace-pre-wrap">
                            {interviewAnalysis.summary}
                          </p>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <Card className="glass border-rose-500/20 bg-rose-500/5 p-8 rounded-2xl shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                              <h5 className="text-[11px] font-black text-rose-400 uppercase tracking-[0.3em]">Teses & Riscos Processuais</h5>
                            </div>
                            <p className="text-sm text-white/90 font-serif leading-relaxed text-justify whitespace-pre-wrap">
                              {interviewAnalysis.legalAnalysis}
                            </p>
                          </Card>

                          <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-8 rounded-2xl shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                              <h5 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em]">Recomendações & Provas</h5>
                            </div>
                            <p className="text-sm text-white/90 font-serif leading-relaxed text-justify whitespace-pre-wrap">
                              {interviewAnalysis.recommendations}
                            </p>
                          </Card>
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                      <Sparkles className="h-16 w-16" />
                      <p className="text-[11px] font-black uppercase tracking-[0.5em]">Aguardando Comando de Inteligência</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
          <DialogFooter className="p-6 bg-black/40 border-t border-white/5 flex-none">
            <Button onClick={() => setViewingInterview(null)} className="h-12 px-10 glass border-white/10 text-white font-black uppercase text-[11px] tracking-widest rounded-xl hover:bg-white/5 transition-all">FECHAR DOSSIÊ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
