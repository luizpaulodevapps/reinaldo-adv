
"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  MessageCircle, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  Zap, 
  ArrowRight, 
  UserPlus, 
  FileText, 
  PlusCircle, 
  Target,
  Brain,
  Scale,
  Hash,
  Type
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LeadForm } from "@/components/leads/lead-form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { collection, query, serverTimestamp, doc, where } from "firebase/firestore"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"

const columns = [
  { id: "novo", title: "NOVO", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "contratual", title: "CONTRATUAL", color: "text-emerald-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-primary" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

export default function LeadsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const leadsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "leads"))
  }, [db, user])

  const { data: leadsData, isLoading } = useCollection(leadsQuery)
  const leads = leadsData || []

  // Busca Entrevistas Padrão
  const interviewsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "checklists"), where("category", "==", "Entrevista de Triagem"))
  }, [db, user])
  const { data: interviewModels } = useCollection(interviewsQuery)

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false)
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead)
    setIsSheetOpen(true)
  }

  const handleCreateEntry = (data: any) => {
    if (!user) return
    const newLead = {
      ...data,
      assignedStaffId: user.uid,
      status: data.mode === "complete" ? "contratual" : "novo",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    addDocumentNonBlocking(collection(db, "leads"), newLead)
    setIsNewLeadDialogOpen(false)
    setIsNewClientDialogOpen(false)
    toast({ title: data.mode === "complete" ? "Cliente Cadastrado!" : "Triagem Iniciada!", description: `${data.name} foi adicionado com sucesso.` })
  }

  const handleAdvanceStage = () => {
    if (!selectedLead) return
    const currentIndex = columns.findIndex(col => col.id === selectedLead.status)
    if (currentIndex < columns.length - 1) {
      const nextStatus = columns[currentIndex + 1].id
      updateDocumentNonBlocking(doc(db, "leads", selectedLead.id), { status: nextStatus, updatedAt: serverTimestamp() })
      setIsSheetOpen(false)
      toast({ title: "Fase Avançada", description: `O lead foi movido para ${nextStatus.toUpperCase()}.` })
    }
  }

  const handleDiscardLead = () => {
    if (!selectedLead) return
    deleteDocumentNonBlocking(doc(db, "leads", selectedLead.id))
    setIsSheetOpen(false)
    toast({ variant: "destructive", title: "Lead Descartado" })
  }

  const activeInterview = interviewModels?.find(m => m.legalArea === selectedLead?.type)

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary mb-2">CRM & Triagem de Elite</h1>
          <p className="text-muted-foreground">Gestão estratégica por Dr. Reinaldo Gonçalves Miguel de Jesus.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsNewLeadDialogOpen(true)} className="glass text-primary font-bold gap-2 border-primary/20 hover:bg-primary/10">
            <PlusCircle className="h-4 w-4" /> Nova Triagem
          </Button>
          <Button onClick={() => setIsNewClientDialogOpen(true)} className="gold-gradient text-background font-bold gap-2 px-8">
            <UserPlus className="h-4 w-4" /> Cadastrar Cliente
          </Button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
        {columns.map((col) => {
          const leadsInCol = leads.filter(l => l.status === col.id)
          return (
            <div key={col.id} className="min-w-[300px] flex-1">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                  <h3 className={`font-bold text-xs tracking-widest ${col.color}`}>{col.title}</h3>
                </div>
                <Badge variant="secondary" className="bg-secondary/50 text-[10px]">{leadsInCol.length}</Badge>
              </div>
              <div className="space-y-4">
                {leadsInCol.map((lead) => (
                  <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group relative overflow-hidden" onClick={() => handleOpenLead(lead)}>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <div className="font-bold text-lg group-hover:text-primary transition-colors uppercase tracking-tight">{lead.name}</div>
                        <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">Área: {lead.type}</div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <Badge variant="outline" className="text-[8px] uppercase border-primary/20 text-primary">Ativo</Badge>
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-3xl glass border-l border-primary/20 p-0 flex flex-col bg-[#0a0f1e]">
          {selectedLead && (
            <>
              <div className="p-8 pb-4">
                <SheetHeader className="text-left space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase text-[9px]">{selectedLead.status?.toUpperCase()}</Badge>
                    <Badge variant="outline" className="text-[9px] uppercase border-purple-500/20 text-purple-400">Área: {selectedLead.type}</Badge>
                  </div>
                  <SheetTitle className="text-4xl font-headline font-bold text-white leading-tight uppercase tracking-tighter">
                    {selectedLead.name}
                  </SheetTitle>
                </SheetHeader>
              </div>

              <Tabs defaultValue="entrevista" className="flex-1 flex flex-col min-h-0">
                <TabsList className="px-8 bg-transparent border-b border-white/5 justify-start h-12 gap-8 p-0 w-full">
                  <TabsTrigger value="entrevista" className="h-full px-4 font-bold text-[10px] uppercase tracking-widest data-[state=active]:text-primary">
                    Entrevista Estratégica (Multimodal)
                  </TabsTrigger>
                  <TabsTrigger value="briefing" className="h-full px-4 font-bold text-[10px] uppercase tracking-widest data-[state=active]:text-primary">
                    Briefing & Notas
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                  <div className="p-8">
                    <TabsContent value="entrevista" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      {activeInterview ? (
                        <div className="space-y-8">
                          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
                            <h3 className="text-[#f5d030] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                              <Brain className="h-4 w-4" /> Script Estruturado: {activeInterview.title}
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                              "{activeInterview.description || "Colete as informações conforme os tipos de resposta abaixo."}"
                            </p>
                          </div>

                          <div className="space-y-6">
                            {activeInterview.items?.map((item: any, i: number) => (
                              <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/10 transition-all space-y-4">
                                <Label className="text-xs font-black text-white/90 uppercase tracking-tight block leading-relaxed">
                                  {i + 1}. {item.text}
                                </Label>

                                {/* Renderização Dinâmica conforme Tipo */}
                                {(!item.type || item.type === 'checkbox') && (
                                  <div className="flex items-center gap-3">
                                    <Checkbox id={`step-${i}`} className="border-primary/50 data-[state=checked]:bg-primary" />
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Confirmar Requisito</span>
                                  </div>
                                )}

                                {item.type === 'boolean' && (
                                  <RadioGroup defaultValue="none" className="flex gap-6">
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="sim" id={`sim-${i}`} className="border-emerald-500 text-emerald-500" />
                                      <Label htmlFor={`sim-${i}`} className="text-[10px] font-bold text-emerald-500 uppercase">SIM</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="nao" id={`nao-${i}`} className="border-rose-500 text-rose-500" />
                                      <Label htmlFor={`nao-${i}`} className="text-[10px] font-bold text-rose-500 uppercase">NÃO</Label>
                                    </div>
                                  </RadioGroup>
                                )}

                                {item.type === 'ternary' && (
                                  <RadioGroup defaultValue="none" className="flex gap-6">
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="sim" id={`tsim-${i}`} className="border-emerald-500" />
                                      <Label htmlFor={`tsim-${i}`} className="text-[10px] font-bold uppercase">SIM</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="nao" id={`tnao-${i}`} className="border-rose-500" />
                                      <Label htmlFor={`tnao-${i}`} className="text-[10px] font-bold uppercase">NÃO</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="parcial" id={`tparcial-${i}`} className="border-amber-500" />
                                      <Label htmlFor={`tparcial-${i}`} className="text-[10px] font-bold uppercase">PARCIAL</Label>
                                    </div>
                                  </RadioGroup>
                                )}

                                {item.type === 'text' && (
                                  <Textarea 
                                    placeholder="Descreva a resposta do cliente..."
                                    className="bg-black/20 border-white/10 min-h-[80px] text-xs focus:ring-primary/30"
                                  />
                                )}

                                {item.type === 'number' && (
                                  <div className="relative max-w-[200px]">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input 
                                      type="number" 
                                      placeholder="0,00"
                                      className="pl-10 bg-black/20 border-white/10 h-10 text-xs"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center space-y-6 opacity-30 text-center">
                          <AlertCircle className="h-12 w-12 text-muted-foreground" />
                          <div className="space-y-2">
                            <p className="text-sm font-bold uppercase tracking-widest">Sem Roteiro para {selectedLead.type}</p>
                            <p className="text-[10px] max-w-xs mx-auto">Configure um modelo de 'Entrevista de Triagem' no Laboratório de Checklists para esta área.</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="briefing" className="mt-0 space-y-6 animate-in fade-in duration-500">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Resumo do Caso</Label>
                        <div className="p-6 rounded-xl bg-white/5 border border-white/5 italic text-white/70 leading-relaxed text-sm">
                          {selectedLead.notes || "Nenhuma nota preliminar registrada."}
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>

              <div className="p-8 border-t border-white/5 bg-black/40 grid grid-cols-2 gap-4">
                <Button onClick={handleDiscardLead} className="bg-rose-950/50 hover:bg-rose-900 text-rose-400 font-bold h-14 uppercase text-[10px] tracking-widest rounded-xl">
                  Descartar Lead
                </Button>
                <Button onClick={handleAdvanceStage} className="bg-[#10b981] hover:bg-[#059669] text-[#0a0f1e] font-black h-14 uppercase text-[10px] tracking-widest rounded-xl shadow-xl">
                  Avançar para {columns[columns.findIndex(c => c.id === selectedLead.status) + 1]?.title || 'CONCLUÍDO'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isNewLeadDialogOpen} onOpenChange={setIsNewLeadDialogOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-[700px] p-0 bg-[#0a0f1e]">
          <div className="p-6 border-b border-white/5">
            <DialogHeader><DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Iniciar Triagem Estratégica</DialogTitle></DialogHeader>
          </div>
          <LeadForm existingLeads={leads} onSubmit={handleCreateEntry} onSelectExisting={(l) => { handleOpenLead(l); setIsNewLeadDialogOpen(false); }} initialMode="quick" lockMode={true} />
        </DialogContent>
      </Dialog>

      <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-[800px] p-0 bg-[#0a0f1e]">
          <div className="p-6 border-b border-white/5">
            <DialogHeader><DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Ficha de Novo Cliente</DialogTitle></DialogHeader>
          </div>
          <LeadForm existingLeads={leads} onSubmit={handleCreateEntry} onSelectExisting={(l) => { handleOpenLead(l); setIsNewClientDialogOpen(false); }} initialMode="complete" lockMode={true} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
