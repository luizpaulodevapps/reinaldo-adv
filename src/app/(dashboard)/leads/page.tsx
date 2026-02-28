
"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  MoreVertical, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  MessageCircle, 
  ChevronRight,
  Info,
  Clock,
  AlertCircle,
  Wrench,
  Calculator,
  FileCheck,
  Zap,
  Copy,
  ArrowRight,
  UserPlus,
  FileText,
  PlusCircle,
  Target
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
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { LeadForm } from "@/components/leads/lead-form"

const columns = [
  { id: "novo", title: "NOVO", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "contratual", title: "CONTRATUAL", color: "text-emerald-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-primary" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

const initialLeadsData = [
  { 
    id: "1", 
    name: "Ricardo Santos", 
    type: "Trabalhista", 
    date: "2h atrás", 
    stage: "novo", 
    value: 15000, 
    priority: "alta",
    phone: "(11) 98888-7777",
    email: "ricardo@email.com",
    notes: "Demitido após 10 anos sem justa causa. Reclamação de horas extras."
  },
  { 
    id: "2", 
    name: "Maria Oliveira", 
    type: "Civil", 
    date: "1d atrás", 
    stage: "atendimento", 
    value: 45000, 
    priority: "media",
    phone: "(11) 97777-6666",
    email: "maria@email.com",
    notes: "Danos morais por atraso em entrega de imóvel."
  },
  { 
    id: "3", 
    name: "Bruno Fernandes", 
    type: "Empresarial", 
    date: "3d atrás", 
    stage: "contratual", 
    value: 120000, 
    priority: "alta",
    phone: "(11) 96666-5555",
    email: "bruno@empresa.com",
    notes: "Revisão de contrato social e blindagem patrimonial."
  },
  { 
    id: "4", 
    name: "Ana Paula", 
    type: "Previdenciário", 
    date: "5d atrás", 
    stage: "burocracia", 
    value: 22000, 
    priority: "baixa",
    phone: "(11) 95555-4444",
    email: "ana@email.com",
    notes: "Aposentadoria especial por tempo de serviço insalubre."
  },
]

const stageChecklists: Record<string, string[]> = {
  novo: ["Primeiro contato via WhatsApp", "Agendar reunião inicial", "Coletar resumo dos fatos"],
  atendimento: ["Reunião de diagnóstico realizada", "Análise de viabilidade técnica", "Documentação básica solicitada"],
  contratual: ["Proposta de honorários enviada", "Contrato assinado", "Procuração assinada"],
  burocracia: ["Cópias de CTPS/Documentos", "Cálculos iniciais prontos", "Aprovação final do cliente"],
  distribuicao: ["Petição finalizada", "Protocolo realizado", "Número do processo inserido"],
}

export default function LeadsPage() {
  const [leads, setLeads] = useState(initialLeadsData)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false)
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
  const { toast } = useToast()

  // Ferramentas State
  const [calcValue, setCalcValue] = useState("")
  const [calcProb, setCalcProb] = useState("70")
  const [calcResult, setCalcResult] = useState<any>(null)
  
  const [checklistArea, setChecklistArea] = useState("Trabalhista")
  const [generatedChecklist, setGeneratedChecklist] = useState<string[]>([])

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead)
    setIsSheetOpen(true)
  }

  const copyToClipboard = (text: string, title: string = "Copiado!") => {
    navigator.clipboard.writeText(text)
    toast({
      title,
      description: "O conteúdo está pronto para ser enviado.",
    })
  }

  const handleCalculate = () => {
    const val = parseFloat(calcValue.replace(/\D/g, "")) || 0
    const prob = parseInt(calcProb) || 0
    const fee = val * 0.3 // 30% base honorários
    const successExpected = fee * (prob / 100)
    
    setCalcResult({
      fee: fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      expected: successExpected.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      risk: prob < 50 ? "Alto" : prob < 80 ? "Moderado" : "Baixo"
    })
  }

  const handleGenerateChecklist = () => {
    const lists: Record<string, string[]> = {
      Trabalhista: ["CTPS (Original ou Digital)", "TRCT (Termo de Rescisão)", "3 últimos holerites", "Extrato FGTS", "Documentos de identificação"],
      Civil: ["RG/CPF", "Comprovante de residência", "Contratos relacionados", "Provas documentais (fotos/prints)", "Rol de testemunhas"],
      Previdenciário: ["CNIS atualizado", "Laudos médicos", "PPP (Perfil Profissiográfico)", "CTPS", "Comprovante de períodos especiais"],
      Empresarial: ["Contrato Social", "Cartão CNPJ", "Balanços contábeis", "Contratos com fornecedores", "Certidões negativas"]
    }
    setGeneratedChecklist(lists[checklistArea] || [])
  }

  const handleCreateEntry = (data: any) => {
    const isClient = data.mode === "complete"
    const newEntry = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      date: "Agora",
      stage: isClient ? "contratual" : "novo",
      value: parseFloat(data.value) || 0,
      priority: data.priority || "media"
    }

    setLeads([newEntry, ...leads])
    setIsNewLeadDialogOpen(false)
    setIsNewClientDialogOpen(false)
    toast({
      title: isClient ? "Cliente Cadastrado!" : "Triagem Iniciada!",
      description: `${newEntry.name} foi adicionado com sucesso.`
    })
  }

  const totalValue = leads.reduce((acc, lead) => acc + (lead.value || 0), 0)
  const hotLeadsCount = leads.filter(l => l.priority === 'alta').length

  return (
    <div className="space-y-8">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary mb-2">CRM & Triagem de Elite</h1>
          <p className="text-muted-foreground">Gestão estratégica por Dr. Reinaldo Gonçalves Miguel de Jesus.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {/* Botão Nova Triagem - Estilo Inspirado */}
          <Dialog open={isNewLeadDialogOpen} onOpenChange={setIsNewLeadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glass text-primary font-bold gap-2 border-primary/20 hover:bg-primary/10">
                <PlusCircle className="h-4 w-4" /> Nova Triagem
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border sm:max-w-[600px] p-0 overflow-hidden">
              <div className="p-6 bg-[#0a0f1e]/80 border-b border-border">
                <DialogHeader>
                  <DialogTitle className="text-white font-headline text-2xl flex items-center gap-3 uppercase tracking-tight">
                    <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    Nova Triagem
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-8 bg-[#0a0f1e]">
                <LeadForm 
                  existingLeads={leads} 
                  onSubmit={handleCreateEntry}
                  onSelectExisting={(lead) => {
                    handleOpenLead(lead)
                    setIsNewLeadDialogOpen(false)
                  }}
                  initialMode="quick"
                  lockMode={true}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient text-background font-bold gap-2">
                <UserPlus className="h-4 w-4" /> Ficha Completa
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border sm:max-w-[700px] p-0 overflow-hidden">
              <div className="p-6 bg-[#0a0f1e]/80 border-b border-border">
                <DialogHeader>
                  <DialogTitle className="text-white font-headline text-2xl flex items-center gap-3 uppercase tracking-tight">
                    <FileText className="h-6 w-6 text-primary" /> Ficha de Cliente
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-8 bg-[#0a0f1e]">
                <LeadForm 
                  existingLeads={leads} 
                  onSubmit={handleCreateEntry}
                  onSelectExisting={(lead) => {
                    handleOpenLead(lead)
                    setIsNewClientDialogOpen(false)
                  }}
                  initialMode="complete"
                  lockMode={true}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Pipeline Total", value: `R$ ${(totalValue / 1000).toFixed(0)}k`, icon: DollarSign, color: "text-emerald-500" },
          { label: "Leads Quentes", value: hotLeadsCount, icon: AlertCircle, color: "text-destructive" },
          { label: "Novos na Semana", value: "08", icon: PlusCircle, color: "text-primary" },
          { label: "Taxa de Conversão", value: "68%", icon: CheckCircle2, color: "text-blue-500" },
        ].map((stat, i) => (
          <Card key={i} className="glass border-primary/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-secondary/50 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Caixa de Ferramentas */}
      <div className="space-y-4">
        <h2 className="text-xl font-headline font-bold text-primary flex items-center gap-2">
          <Wrench className="h-5 w-5" /> Caixa de Ferramentas de Conversão
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Dialog>
            <DialogTrigger asChild>
              <Card className="glass border-primary/20 hover:border-primary/50 transition-all group cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" /> Calculadora de Viabilidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">Estime honorários e probabilidade de êxito.</p>
                  <Button className="w-full gold-gradient text-background font-bold uppercase py-5">
                    Abrir Simulador <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="glass border-primary/20 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-primary font-headline text-2xl">Simulador de Viabilidade</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Valor Estimado (R$)</Label>
                  <Input placeholder="Ex: 50000" className="glass" value={calcValue} onChange={(e) => setCalcValue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Probabilidade (%)</Label>
                  <Select value={calcProb} onValueChange={setCalcProb}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90% - Muito Alta</SelectItem>
                      <SelectItem value="70">70% - Alta</SelectItem>
                      <SelectItem value="50">50% - Moderada</SelectItem>
                      <SelectItem value="30">30% - Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {calcResult && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Honorários (30%):</span>
                      <span className="font-bold text-primary">{calcResult.fee}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expectativa:</span>
                      <span className="font-bold text-emerald-500">{calcResult.expected}</span>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleCalculate} className="gold-gradient text-background font-bold w-full py-6">Calcular</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="glass border-primary/20 hover:border-primary/50 transition-all group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" /> Scripts de WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Modelos de alta conversão para triagem.</p>
              <Button variant="outline" className="w-full glass font-bold uppercase py-5" onClick={() => copyToClipboard("Olá! Dr. Reinaldo aqui. Gostaria de entender melhor o seu caso.", "Script Copiado!")}>
                Copiar Script Base <Copy className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Dialog>
            <DialogTrigger asChild>
              <Card className="glass border-primary/20 hover:border-primary/50 transition-all group cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-blue-400" /> Checklist de Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">Gere a lista de documentos por área.</p>
                  <Button variant="outline" className="w-full glass font-bold uppercase py-5">
                    Gerar Lista <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="glass border-primary/20 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-primary font-headline text-2xl">Gerador de Checklist</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Select value={checklistArea} onValueChange={setChecklistArea}>
                  <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                    <SelectItem value="Civil">Civil</SelectItem>
                  </SelectContent>
                </Select>
                {generatedChecklist.length > 0 && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-sm space-y-1">
                    {generatedChecklist.map((doc, i) => <div key={i}>• {doc}</div>)}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleGenerateChecklist} className="w-full glass border-primary/20">Gerar</Button>
                {generatedChecklist.length > 0 && <Button onClick={() => copyToClipboard(generatedChecklist.join('\n'), "Checklist Copiado!")} className="gold-gradient text-background font-bold w-full">Copiar</Button>}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar leads ou clientes..." className="pl-9 glass" />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0">
        {columns.map((col) => {
          const leadsInCol = leads.filter(l => l.stage === col.id)
          return (
            <div key={col.id} className="min-w-[300px] flex-1">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                  <h3 className={`font-bold text-sm tracking-widest ${col.color}`}>{col.title}</h3>
                </div>
                <Badge variant="secondary" className="bg-secondary/50">{leadsInCol.length}</Badge>
              </div>
              
              <div className="space-y-4">
                {leadsInCol.map((lead) => (
                  <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group relative overflow-hidden" onClick={() => handleOpenLead(lead)}>
                    {lead.priority === 'alta' && (
                      <div className="absolute top-0 right-0 p-1">
                        <Badge variant="destructive" className="text-[8px] uppercase font-bold px-1.5 py-0">Urgente</Badge>
                      </div>
                    )}
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <div className="font-bold text-lg group-hover:text-primary transition-colors">{lead.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-tighter font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> Recebido {lead.date}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">{lead.type}</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-emerald-500/10 hover:text-emerald-500"><MessageCircle className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl glass border-l border-primary/20 p-0">
          {selectedLead && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-border/50">
                <SheetHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="gold-gradient text-background font-bold uppercase text-[10px]">{selectedLead.stage}</Badge>
                  </div>
                  <SheetTitle className="text-3xl font-headline font-bold text-primary">{selectedLead.name}</SheetTitle>
                  <SheetDescription>{selectedLead.phone} • {selectedLead.type}</SheetDescription>
                </SheetHeader>
              </div>
              <Tabs defaultValue="dossie" className="flex-1 flex flex-col">
                <TabsList className="px-6 bg-secondary/20 border-b border-border/50 justify-start h-12 gap-6 p-0 rounded-none">
                  <TabsTrigger value="dossie" className="h-full">Dossiê</TabsTrigger>
                  <TabsTrigger value="tools" className="h-full">Ferramentas</TabsTrigger>
                </TabsList>
                <ScrollArea className="flex-1 p-6">
                  <TabsContent value="dossie" className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-bold text-sm uppercase text-primary">Checklist de Fase</h3>
                      <Progress value={40} className="h-1.5" />
                      <div className="grid gap-2">
                        {stageChecklists[selectedLead.stage]?.map((item, i) => (
                          <div key={i} className="flex items-center space-x-2 p-2 rounded bg-secondary/30">
                            <Checkbox id={`check-${i}`} />
                            <label htmlFor={`check-${i}`} className="text-sm">{item}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 italic text-sm italic">
                      "Lead estratégico. Alta probabilidade de êxito."
                    </div>
                  </TabsContent>
                  <TabsContent value="tools" className="space-y-4">
                    <Button className="w-full gold-gradient text-background font-bold h-12 flex justify-between">Gerar Proposta <Zap className="h-4 w-4" /></Button>
                    <Button variant="outline" className="w-full h-12 flex justify-between glass">Gerar Procuração <ArrowRight className="h-4 w-4" /></Button>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
              <div className="p-6 border-t border-border/50 bg-background grid grid-cols-2 gap-4">
                <Button variant="destructive" className="font-bold opacity-50">Descartar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Avançar Fase</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
