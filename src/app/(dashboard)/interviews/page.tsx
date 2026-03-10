
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
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
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
    // Busca global de todas as entrevistas concluídas pela banca
    return query(collection(db!, "interviews"), orderBy("createdAt", "desc"))
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
    await deleteDocumentNonBlocking(doc(db!, "interviews", id))
    toast({ variant: "destructive", title: "Entrevista Excluída" })
  }

  const handleRunInterviewAnalysis = async (interview: any) => {
    setIsAiAnalyzing(true); setInterviewAnalysis(null)
    try {
      const result = await aiAnalyzeFullInterview({ clientName: interview.clientName, interviewType: interview.interviewType, responses: interview.responses })
      setInterviewAnalysis(result)
      if (db) updateDocumentNonBlocking(doc(db, "interviews", interview.id), { aiAnalysis: result, updatedAt: serverTimestamp() })
    } catch (e) { toast({ variant: "destructive", title: "Erro na análise" }) } finally { setIsAiAnalyzing(false) }
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
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[80vh]">
          <div className="p-5 bg-[#0a0f1e] border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 flex-none">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><FileSearch className="h-5 w-5 text-primary" /></div>
              <div><DialogTitle className="text-white text-lg font-bold uppercase tracking-widest">{viewingInterview?.interviewType}</DialogTitle><DialogDescription className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-50 flex items-center gap-2"><span>DR(A). {viewingInterview?.interviewerName}</span></DialogDescription></div>
            </div>
            <Button onClick={() => handleRunInterviewAnalysis(viewingInterview)} disabled={isAiAnalyzing} className="h-10 px-5 gold-gradient text-background font-black uppercase text-[9px] gap-2.5 rounded-lg shadow-lg">{isAiAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} ANALISAR IA</Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="transcricao" className="h-full flex flex-col">
              <div className="px-5 bg-black/20 border-b border-white/5 flex-none"><TabsList className="bg-transparent h-10 gap-6 p-0"><TabsTrigger value="transcricao" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full tracking-widest">Transcrição</TabsTrigger><TabsTrigger value="analise" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full tracking-widest">Análise IA</TabsTrigger></TabsList></div>
              <div className="flex-1 overflow-hidden p-5">
                <TabsContent value="transcricao" className="h-full mt-0">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-5 max-w-3xl mx-auto pb-10">
                      {(viewingInterview?.templateSnapshot || Object.keys(viewingInterview?.responses || {})).map((item: any, i: number) => {
                        const label = typeof item === 'string' ? item : item.label; 
                        const answer = viewingInterview?.responses?.[label]; 
                        if (!answer) return null;
                        return (
                          <div key={i} className="space-y-1.5">
                            <h5 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</h5>
                            <p className="text-sm text-white font-medium uppercase leading-relaxed text-justify border-l border-white/5 pl-3">{String(answer)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="analise" className="h-full mt-0">{isAiAnalyzing ? (<div className="h-full flex flex-col items-center justify-center space-y-4"><Brain className="h-12 w-12 text-primary animate-pulse" /><p className="text-[10px] font-bold text-white uppercase tracking-widest">Processando...</p></div>) : interviewAnalysis ? (<ScrollArea className="h-full pr-4"><div className="space-y-6 max-w-4xl mx-auto pb-10"><Card className="glass border-primary/20 bg-primary/5 p-5 rounded-2xl shadow-lg"><h5 className="text-[10px] font-black text-primary uppercase mb-3">Resumo Executivo</h5><p className="text-sm text-white/90 leading-relaxed font-medium">{interviewAnalysis.summary}</p></Card><div className="grid grid-cols-2 gap-4"><Card className="glass border-rose-500/20 bg-rose-500/5 p-5 rounded-2xl"><h5 className="text-[10px] font-black text-rose-500 uppercase mb-3">Teses & Riscos</h5><p className="text-xs text-white/80 leading-relaxed font-medium">{interviewAnalysis.legalAnalysis}</p></Card><Card className="glass border-emerald-500/20 bg-emerald-500/5 p-5 rounded-2xl"><h5 className="text-[10px] font-black text-emerald-500 uppercase mb-3">Recomendações</h5><p className="text-xs text-white/80 leading-relaxed font-medium">{interviewAnalysis.recommendations}</p></Card></div></div></ScrollArea>) : (<div className="h-full flex flex-col items-center justify-center opacity-20 space-y-3"><Sparkles className="h-10 w-10" /><p className="text-[10px] font-black uppercase tracking-widest">Aguardando Comando</p></div>)}</TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
