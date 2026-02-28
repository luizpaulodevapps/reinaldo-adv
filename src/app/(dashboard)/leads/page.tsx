
"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  Zap, 
  UserPlus, 
  FileText, 
  PlusCircle, 
  Brain,
  Scale,
  Hash,
  Loader2,
  Building2,
  ShieldCheck,
  Gavel,
  Calendar as CalendarIcon,
  ExternalLink,
  ArrowRight,
  ClipboardCheck,
  Send
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LeadForm } from "@/components/leads/lead-form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collection, query, serverTimestamp, doc, where, limit } from "firebase/firestore"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { cn } from "@/lib/utils"

const columns = [
  { id: "novo", title: "NOVO", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "contratual", title: "CONTRATUAL", color: "text-emerald-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-primary" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

const DOCUMENT_KITS: Record<string, string[]> = {
  "Trabalhista": ["Contrato de Honorários", "Procuração Ad Judicia", "Declaração de Hipossuficiência", "Cálculos Prévios"],
  "Civil": ["Contrato de Honorários", "Procuração Ad Judicia", "Kit de Documentos Pessoais"],
  "Previdenciário": ["Contrato de Honorários", "Procuração", "CNIS Atualizado", "Laudo Médico"],
  "Empresarial": ["Contrato de Prestação de Serviços", "Estatuto Social", "Certidões Negativas"],
}

export default function LeadsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const leadsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "leads"), limit(100))
  }, [db, user])

  const { data: leadsData, isLoading } = useCollection(leadsQuery)
  const leads = leadsData || []

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  
  // Estados de formulário para os estágios
  const [atendimentoData, setAtendimentoData] = useState({ defendant: "", viability: "Alta", details: "" })
  const [contractualChecklist, setContractualChecklist] = useState<Record<string, boolean>>({})
  const [distributionData, setDistributionData] = useState({ processNumber: "", forum: "", vara: "", link: "", hearingDate: "" })

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead)
    setAtendimentoData({ 
      defendant: lead.defendant || "", 
      viability: lead.viability || "Alta", 
      details: lead.details || "" 
    })
    setContractualChecklist(lead.contractualChecklist || {})
    setDistributionData(lead.distributionData || { processNumber: "", forum: "", vara: "", link: "", hearingDate: "" })
    setIsSheetOpen(true)
  }

  const handleCreateEntry = (data: any) => {
    if (!user) return
    const newLead = {
      ...data,
      assignedStaffId: user.uid,
      status: "novo",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    addDocumentNonBlocking(collection(db, "leads"), newLead)
    setIsNewEntryOpen(false)
    toast({ title: "Triagem Iniciada!", description: `${data.name} foi adicionado com sucesso.` })
  }

  const handleUpdateLead = () => {
    if (!selectedLead) return
    const leadRef = doc(db, "leads", selectedLead.id)
    updateDocumentNonBlocking(leadRef, {
      ...atendimentoData,
      contractualChecklist,
      distributionData,
      updatedAt: serverTimestamp()
    })
    toast({ title: "Dados Atualizados", description: "O dossiê do lead foi salvo." })
  }

  const handleAdvanceStage = () => {
    if (!selectedLead) return
    const currentIndex = columns.findIndex(col => col.id === selectedLead.status)
    if (currentIndex < columns.length - 1) {
      const nextStatus = columns[currentIndex + 1].id
      const leadRef = doc(db, "leads", selectedLead.id)
      
      updateDocumentNonBlocking(leadRef, { 
        status: nextStatus, 
        ...atendimentoData,
        contractualChecklist,
        distributionData,
        updatedAt: serverTimestamp() 
      })
      
      setIsSheetOpen(false)
      toast({ title: "Fase Avançada", description: `O lead foi movido para ${nextStatus.toUpperCase()}.` })
    }
  }

  const handleDistribute = async () => {
    if (!selectedLead || !distributionData.processNumber) {
      toast({ variant: "destructive", title: "Dados Incompletos", description: "O número do processo é obrigatório para distribuição." })
      return
    }

    // 1. Criar novo processo
    const newProcess = {
      clientId: selectedLead.id, // Ou buscar ID real se já convertido
      clientName: selectedLead.name,
      processNumber: distributionData.processNumber,
      caseType: selectedLead.type,
      status: "Em Andamento",
      court: distributionData.forum,
      vara: distributionData.vara,
      description: selectedLead.demandTitle || "Ação Judicial",
      startDate: new Date().toISOString().split('T')[0],
      responsibleStaffId: user?.uid || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await addDocumentNonBlocking(collection(db, "processes"), newProcess)

    // 2. Agendar audiência se houver data
    if (distributionData.hearingDate) {
      const newHearing = {
        title: `Audiência: ${selectedLead.name}`,
        startDateTime: distributionData.hearingDate,
        processId: distributionData.processNumber,
        location: distributionData.forum,
        type: "Inicial",
        createdAt: serverTimestamp(),
      }
      await addDocumentNonBlocking(collection(db, "hearings"), newHearing)
    }

    // 3. Remover do CRM (ou marcar como concluído)
    deleteDocumentNonBlocking(doc(db, "leads", selectedLead.id))

    setIsSheetOpen(false)
    toast({ title: "PROCESSO DISTRIBUÍDO!", description: "Dossiê migrado para a base de Processos Ativos." })
  }

  const handleDiscardLead = () => {
    if (!selectedLead) return
    deleteDocumentNonBlocking(doc(db, "leads", selectedLead.id))
    setIsSheetOpen(false)
    toast({ variant: "destructive", title: "Lead Descartado" })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">CRM & Triagem Estratégica</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Fluxo de conversão e produção jurídica RGMJ.</p>
        </div>
        <Button 
          onClick={() => setIsNewEntryOpen(true)} 
          className="blue-gradient text-white font-bold gap-3 px-8 h-12 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          <PlusCircle className="h-5 w-5" /> NOVO ATENDIMENTO
        </Button>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4 glass rounded-3xl border-dashed">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Funil...</span>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => l.status === col.id)
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
                    <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group relative overflow-hidden" onClick={() => handleOpenLead(lead)}>
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <div className="font-bold text-base text-white group-hover:text-primary transition-colors uppercase tracking-tight truncate">{lead.name}</div>
                          <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1 flex items-center gap-2">
                            <Scale className="h-3 w-3 text-primary/50" /> {lead.type}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{lead.updatedAt?.toDate ? new Date(lead.updatedAt.toDate()).toLocaleDateString() : 'Agosto/24'}</span>
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
        <SheetContent className="w-full sm:max-w-4xl glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]">
          {selectedLead && (
            <>
              <div className="p-10 pb-6 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-primary/10 text-primary border-primary/30 font-black uppercase text-[9px] px-4 py-1">Fase: {selectedLead.status?.toUpperCase()}</Badge>
                  <Badge variant="outline" className="text-[9px] uppercase border-white/10 text-muted-foreground font-black tracking-widest">{selectedLead.type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <SheetHeader className="text-left p-0">
                    <SheetTitle className="text-4xl font-headline font-bold text-white uppercase tracking-tighter">
                      {selectedLead.name}
                    </SheetTitle>
                    <SheetDescription className="sr-only">Dossiê detalhado e acompanhamento de triagem estratégica.</SheetDescription>
                  </SheetHeader>
                  <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)}><ArrowRight className="h-6 w-6" /></Button>
                </div>
              </div>

              <Tabs defaultValue={selectedLead.status} className="flex-1 flex flex-col">
                <div className="px-10 bg-black/40">
                  <TabsList className="bg-transparent h-14 p-0 gap-8 w-full justify-start rounded-none border-b border-white/5">
                    <TabsTrigger value="atendimento" className="h-full px-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">1. Atendimento</TabsTrigger>
                    <TabsTrigger value="contratual" className="h-full px-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">2. Contratual</TabsTrigger>
                    <TabsTrigger value="burocracia" className="h-full px-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">3. Burocracia</TabsTrigger>
                    <TabsTrigger value="distribuicao" className="h-full px-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">4. Distribuição</TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-10 pb-20 space-y-10">
                    
                    {/* ABA ATENDIMENTO */}
                    <TabsContent value="atendimento" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Réu / Reclamada Principal</Label>
                          <Input 
                            value={atendimentoData.defendant} 
                            onChange={(e) => setAtendimentoData({...atendimentoData, defendant: e.target.value.toUpperCase()})}
                            className="glass border-white/10 h-12 text-white" 
                            placeholder="NOME DA EMPRESA OU RÉU"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Viabilidade Jurídica</Label>
                          <Select value={atendimentoData.viability} onValueChange={(v) => setAtendimentoData({...atendimentoData, viability: v})}>
                            <SelectTrigger className="glass border-white/10 h-12 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="glass border-white/10">
                              <SelectItem value="Alta">⭐⭐⭐ ALTA</SelectItem>
                              <SelectItem value="Média">⭐⭐ MÉDIA</SelectItem>
                              <SelectItem value="Baixa">⭐ BAIXA</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Resumo Estratégico (Briefing)</Label>
                        <Textarea 
                          value={atendimentoData.details}
                          onChange={(e) => setAtendimentoData({...atendimentoData, details: e.target.value})}
                          className="glass border-white/10 min-h-[200px] text-white text-sm focus:ring-primary/50 resize-none"
                          placeholder="Descreva os fatos principais, pedidos e possíveis testemunhas..."
                        />
                      </div>
                    </TabsContent>

                    {/* ABA CONTRATUAL */}
                    <TabsContent value="contratual" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-primary" />
                          <h3 className="text-sm font-black text-white uppercase tracking-tight">Sugestão de Kit: {selectedLead.type}</h3>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Com base na área jurídica, o ecossistema RGMJ recomenda a emissão dos seguintes documentos padrão:</p>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Checklist de Emissão & Assinatura</Label>
                        {(DOCUMENT_KITS[selectedLead.type] || DOCUMENT_KITS["Civil"]).map((docName, i) => (
                          <div key={i} className="flex items-center justify-between p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all group">
                            <div className="flex items-center gap-4">
                              <Checkbox 
                                id={`doc-${i}`} 
                                checked={contractualChecklist[docName] || false}
                                onCheckedChange={(checked) => setContractualChecklist({...contractualChecklist, [docName]: !!checked})}
                                className="border-primary/50 data-[state=checked]:bg-primary"
                              />
                              <Label htmlFor={`doc-${i}`} className="text-xs font-bold text-white uppercase cursor-pointer">{docName}</Label>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button className="w-full glass border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest h-14 gap-2">
                        <Brain className="h-4 w-4" /> Gerar Minutas via IA
                      </Button>
                    </TabsContent>

                    {/* ABA BUROCRACIA */}
                    <TabsContent value="burocracia" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="p-8 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center space-y-6 opacity-50">
                        <ClipboardCheck className="h-12 w-12 text-primary" />
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-tight">Produção de Peças & Provas</h4>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Status: Em elaboração de Petição Inicial</p>
                        </div>
                        <Button variant="outline" className="glass border-white/10 text-white font-bold h-10 px-8">Acessar Pasta no Drive</Button>
                      </div>
                    </TabsContent>

                    {/* ABA DISTRIBUIÇÃO */}
                    <TabsContent value="distribuicao" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Número do Processo Judicial *</Label>
                          <Input 
                            value={distributionData.processNumber}
                            onChange={(e) => setDistributionData({...distributionData, processNumber: e.target.value})}
                            className="glass border-white/10 h-12 text-white font-mono" 
                            placeholder="0000000-00.0000.0.00.0000"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tribunal / Fórum</Label>
                          <Input 
                            value={distributionData.forum}
                            onChange={(e) => setDistributionData({...distributionData, forum: e.target.value.toUpperCase()})}
                            className="glass border-white/10 h-12 text-white" 
                            placeholder="EX: TRT 2ª REGIÃO - SÃO PAULO"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vara Judicial</Label>
                          <Input 
                            value={distributionData.vara}
                            onChange={(e) => setDistributionData({...distributionData, vara: e.target.value.toUpperCase()})}
                            className="glass border-white/10 h-12 text-white" 
                            placeholder="EX: 45ª VARA DO TRABALHO"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data da Audiência (Opcional)</Label>
                          <Input 
                            type="datetime-local"
                            value={distributionData.hearingDate}
                            onChange={(e) => setDistributionData({...distributionData, hearingDate: e.target.value})}
                            className="glass border-white/10 h-12 text-white" 
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Link do Processo (PJe/Esaj)</Label>
                        <div className="relative">
                          <Input 
                            value={distributionData.link}
                            onChange={(e) => setDistributionData({...distributionData, link: e.target.value})}
                            className="glass border-white/10 h-12 text-white pl-12" 
                            placeholder="https://pje.trt2.jus.br/..."
                          />
                          <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">Ação Final de Fluxo</p>
                        <Button 
                          onClick={handleDistribute}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black h-16 px-12 uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 rounded-xl"
                        >
                          Efetuar Distribuição & Criar Processo
                        </Button>
                      </div>
                    </TabsContent>

                  </div>
                </ScrollArea>
              </Tabs>

              <div className="p-10 border-t border-white/5 bg-black/60 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handleDiscardLead} variant="ghost" className="text-rose-500 hover:bg-rose-500/10 font-bold h-14 uppercase text-[10px] tracking-widest">Descartar Lead</Button>
                <Button onClick={handleUpdateLead} className="glass border-white/10 text-white font-bold h-14 uppercase text-[10px] tracking-widest">Salvar Alterações</Button>
                <Button 
                  onClick={handleAdvanceStage} 
                  disabled={selectedLead.status === 'distribuicao'}
                  className="blue-gradient text-white font-black h-14 uppercase text-[10px] tracking-widest shadow-xl rounded-xl"
                >
                  Avançar para Próxima Fase <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-[800px] p-0 bg-[#0a0f1e] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-[#0a0f1e]">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter flex items-center gap-4">
                <UserPlus className="h-8 w-8 text-primary" /> Registro de Novo Atendimento
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                Inicie uma triagem rápida ou realize o cadastro completo na base RGMJ.
              </DialogDescription>
            </DialogHeader>
          </div>
          <LeadForm 
            existingLeads={leads} 
            onSubmit={handleCreateEntry} 
            onSelectExisting={(l) => { handleOpenLead(l); setIsNewEntryOpen(false); }} 
            initialMode="quick" 
            lockMode={false} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
