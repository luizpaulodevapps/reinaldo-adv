"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Clock, 
  Zap, 
  UserPlus, 
  Brain,
  Scale,
  Loader2,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  MessageCircle,
  Sparkles,
  X,
  PlusCircle,
  LayoutGrid,
  FileText,
  Phone,
  Mail,
  MapPin,
  History,
  Trash2,
  ExternalLink,
  Edit3,
  Save,
  Video,
  Link as LinkIcon
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
} from "@/components/ui/sheet"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LeadForm } from "@/components/leads/lead-form"
import { collection, query, serverTimestamp, doc, where, limit, orderBy } from "firebase/firestore"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { cn } from "@/lib/utils"
import { DynamicInterviewExecution } from "@/components/interviews/dynamic-interview-execution"
import { aiSummarizeInterviewCaseDetails } from "@/ai/flows/ai-summarize-interview-case-details"
import Link from "next/link"

const columns = [
  { id: "novo", title: "NOVO", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-emerald-400" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

export default function LeadsPage() {
  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const leadsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "leads"), orderBy("updatedAt", "desc"), limit(100))
  }, [db, user])

  const { data: leadsData, isLoading } = useCollection(leadsQuery)
  const leads = leadsData || []

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false)
  const [executingTemplate, setExecutingTemplate] = useState<any>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  const [isEditInterviewOpen, setIsEditInterviewOpen] = useState(false)
  const [interviewToEdit, setInterviewToEdit] = useState<any>(null)
  const [editResponses, setEditResponses] = useState<Record<string, any>>({})

  const templatesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "checklists"), orderBy("title", "asc"))
  }, [db, user])
  const { data: templates } = useCollection(templatesQuery)

  const leadInterviewsQuery = useMemoFirebase(() => {
    if (!user || !db || !selectedLead) return null
    return query(
      collection(db!, "interviews"), 
      where("clientId", "==", selectedLead.id),
      orderBy("createdAt", "desc")
    )
  }, [db, user, selectedLead])
  const { data: leadInterviews } = useCollection(leadInterviewsQuery)

  const getDrawerWidthClass = () => {
    const pref = profile?.themePreferences?.drawerWidth || "extra-largo"
    switch (pref) {
      case "padrão": return "sm:max-w-lg"
      case "largo": return "sm:max-w-2xl"
      case "extra-largo": return "sm:max-w-4xl"
      case "full": return "sm:max-w-full"
      default: return "sm:max-w-4xl"
    }
  }

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead)
    setIsSheetOpen(true)
  }

  const handleCreateEntry = async (data: any) => {
    if (!user || !db) return
    const newLead = {
      ...data,
      assignedStaffId: user.uid,
      status: "novo",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await addDocumentNonBlocking(collection(db!, "leads"), newLead)
    setIsNewEntryOpen(false)
    toast({ title: "Triagem Iniciada!" })
  }

  const handleUpdateStatus = async (status: string) => {
    if (!selectedLead || !db) return
    await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
      status,
      updatedAt: serverTimestamp()
    })
    setSelectedLead({ ...selectedLead, status })
    toast({ title: "Fluxo Atualizado", description: `Mover para ${status.toUpperCase()}.` })
  }

  const handleDeleteLead = async () => {
    if (!selectedLead || !db) return
    if (confirm("Deseja remover permanentemente este lead?")) {
      await deleteDocumentNonBlocking(doc(db!, "leads", selectedLead.id))
      setIsSheetOpen(false)
      toast({ variant: "destructive", title: "Lead Removido" })
    }
  }

  const handleStartInterview = (template: any) => {
    setExecutingTemplate(template)
    setIsInterviewDialogOpen(true)
  }

  const handleFinishInterview = async (payload: { responses: any; templateSnapshot: any[] }) => {
    if (!db || !selectedLead || !user) return
    const interviewData = {
      clientId: selectedLead.id,
      clientName: selectedLead.name,
      templateId: executingTemplate.id,
      interviewType: executingTemplate.title,
      responses: payload.responses,
      templateSnapshot: payload.templateSnapshot,
      interviewerId: user.uid,
      interviewerName: user.displayName || "Advogado RGMJ",
      status: "Concluída",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await addDocumentNonBlocking(collection(db!, "interviews"), interviewData)
    await updateDocumentNonBlocking(doc(db!, "leads", selectedLead.id), {
      status: "atendimento",
      updatedAt: serverTimestamp()
    })
    setIsInterviewDialogOpen(false)
    setExecutingTemplate(null)
    toast({ title: "Entrevista Registrada" })
  }

  const handleWhatsApp = () => {
    if (!selectedLead?.phone) return
    const phone = selectedLead.phone.replace(/\D/g, "")
    const text = encodeURIComponent(`Olá ${selectedLead.name}, aqui é da RGMJ Advogados. Gostaria de agendar seu atendimento.`)
    window.open(`https://wa.me/55${phone}?text=${text}`, "_blank")
  }

  const normalizeLeadStatus = (status?: string) => status || "novo"

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Funil de Leads</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Leads</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-black opacity-60">Triagem Estratégica RGMJ.</p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-background font-black gap-3 px-8 h-12 rounded-xl shadow-xl">
          <PlusCircle className="h-5 w-5" /> NOVO ATENDIMENTO
        </Button>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Funil...</span>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => normalizeLeadStatus(l.status) === col.id)
            return (
              <div key={col.id} className="min-w-[320px] flex-1">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                    <h3 className={`font-black text-[10px] tracking-[0.2em] uppercase ${col.color}`}>{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/50 text-[10px] border-white/5 font-black">{leadsInCol.length}</Badge>
                </div>
                <div className="space-y-4">
                  {leadsInCol.map((lead) => (
                    <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group" onClick={() => handleOpenLead(lead)}>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-base text-white group-hover:text-primary transition-colors uppercase tracking-tight flex-1 truncate">{lead.name}</div>
                          {lead.meetingType === 'online' && <Video className="h-4 w-4 text-primary animate-pulse" />}
                        </div>
                        {lead.scheduledDate && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <Clock className="h-3 w-3 text-amber-500" />
                            <span className="text-[9px] font-black text-amber-500 uppercase">
                              {new Date(lead.scheduledDate).toLocaleDateString('pt-BR')} 
                              {lead.scheduledTime && ` às ${lead.scheduledTime}`}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase">{lead.updatedAt?.toDate ? new Date(lead.updatedAt.toDate()).toLocaleDateString() : 'Recente'}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className={cn("w-full min-h-0 overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]", getDrawerWidthClass())}>
          <SheetHeader className="sr-only"><SheetTitle>{selectedLead?.name}</SheetTitle><SheetDescription>Dossiê Lead</SheetDescription></SheetHeader>
          {selectedLead && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-10 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase font-black px-3 tracking-[0.2em] bg-primary/5">{normalizeLeadStatus(selectedLead.status).toUpperCase()}</Badge>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{selectedLead.name}</h2>
                    <div className="flex items-center gap-4 mt-4">
                      <Button onClick={handleWhatsApp} variant="outline" className="h-10 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white text-[9px] font-black uppercase gap-2 tracking-widest">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Direct
                      </Button>
                      <div className="flex gap-1">
                        {columns.map(c => (
                          <Button key={c.id} onClick={() => handleUpdateStatus(c.id)} variant="ghost" className={cn("h-10 text-[8px] font-black uppercase tracking-tighter px-3 border border-white/5", selectedLead.status === c.id ? "bg-white/10 text-white" : "text-muted-foreground")}>{c.title}</Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)} className="h-12 w-12 text-white/20 hover:text-white"><X className="h-6 w-6" /></Button>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-10">
                  <Tabs defaultValue="overview" className="space-y-10">
                    <TabsList className="bg-transparent border-b border-white/5 h-12 w-full justify-start rounded-none p-0 gap-8">
                      <TabsTrigger value="overview" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all">VISÃO GERAL</TabsTrigger>
                      <TabsTrigger value="entrevistas" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all">ENTREVISTAS ({leadInterviews?.length || 0})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-10">
                      {(selectedLead.scheduledDate || selectedLead.meetingType) && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Clock className="h-4 w-4" /> Dados do Agendamento</h4>
                          <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div><p className="text-[8px] font-black text-amber-500/70 uppercase tracking-widest mb-1">DATA E HORA</p><p className="text-sm font-bold text-white uppercase">{new Date(selectedLead.scheduledDate).toLocaleDateString('pt-BR')} ÀS {selectedLead.scheduledTime || "--:--"}</p></div>
                                <div><p className="text-[8px] font-black text-amber-500/70 uppercase tracking-widest mb-1">TIPO</p><p className="text-sm font-bold text-white uppercase">{selectedLead.meetingType === 'online' ? '🖥️ VIDEOCHAMADA' : '🏢 PRESENCIAL'}</p></div>
                              </div>
                              {selectedLead.meetingType === 'online' && selectedLead.meetingLink && (
                                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                                  <p className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><Video className="h-3 w-3" /> CANAL DE ATENDIMENTO</p>
                                  <a href={selectedLead.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-black text-white hover:text-primary transition-colors truncate">
                                    <LinkIcon className="h-3 w-3" /> {selectedLead.meetingLink}
                                  </a>
                                  <Button asChild variant="outline" className="w-full h-10 border-primary/30 text-primary text-[10px] font-black uppercase hover:bg-primary hover:text-background">
                                    <a href={selectedLead.meetingLink} target="_blank" rel="noreferrer">INICIAR CHAMADA AGORA</a>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Síntese RGMJ IA</h4>
                        <div className="p-8 rounded-2xl bg-primary/5 border border-primary/10 font-serif text-white/80 leading-relaxed whitespace-pre-wrap text-justify">
                          {selectedLead.aiSummary || "Aguardando conclusão de entrevista para consolidação de fatos."}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="entrevistas" className="space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        {templates?.map((t) => (
                          <Button key={t.id} onClick={() => handleStartInterview(t)} variant="outline" className="glass border-primary/20 text-primary font-black uppercase text-[10px] h-12 gap-3 hover:bg-primary hover:text-background transition-all">
                            <Plus className="h-4 w-4" /> Iniciar {t.title}
                          </Button>
                        ))}
                      </div>
                      
                      <div className="space-y-4 mt-8">
                        {leadInterviews?.map((int) => (
                          <div key={int.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group">
                            <div>
                              <p className="text-xs font-black text-white uppercase">{int.interviewType}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">POR: {int.interviewerName} • {new Date(int.createdAt.toDate()).toLocaleDateString()}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><ChevronRight className="h-5 w-5" /></Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[1000px] p-0 overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
          {executingTemplate && (
            <DynamicInterviewExecution 
              template={executingTemplate} 
              onSubmit={handleFinishInterview}
              onCancel={() => { setIsInterviewDialogOpen(false); setExecutingTemplate(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <SheetContent className={cn("w-full min-h-0 overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]", getDrawerWidthClass())}>
          <div className="p-8 border-b border-white/5"><SheetHeader><SheetTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Novo Lead RGMJ</SheetTitle></SheetHeader></div>
          <LeadForm 
            existingLeads={leads} 
            onSubmit={handleCreateEntry} 
            onSelectExisting={(l) => { handleOpenLead(l); setIsNewEntryOpen(false); }} 
            defaultResponsibleLawyer={user?.displayName || ""}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
