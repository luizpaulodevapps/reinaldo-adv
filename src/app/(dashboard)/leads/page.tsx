
"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  MoreVertical, 
  Search, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  MessageCircle, 
  Calendar,
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
  X,
  UserPlus,
  FileText
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
      title: isClient ? "Cliente Cadastrado!" : "Lead Criado!",
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
          {/* Botão Novo Lead - Rápido */}
          <Dialog open={isNewLeadDialogOpen} onOpenChange={setIsNewLeadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glass text-primary font-bold gap-2 border-primary/20 hover:bg-primary/10">
                <Plus className="h-4 w-4" /> Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-primary/20 sm:max-w-[500px] p-0 overflow-hidden">
              <div className="p-6 bg-secondary/50 border-b border-primary/20">
                <DialogHeader>
                  <DialogTitle className="text-primary font-headline text-2xl flex items-center gap-2">
                    <Zap className="h-6 w-6" /> Triagem Rápida
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-6">
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

          {/* Botão Novo Cliente - Completo */}
          <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient text-background font-bold gap-2">
                <UserPlus className="h-4 w-4" /> Cadastrar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-primary/20 sm:max-w-[700px] p-0 overflow-hidden">
              <div className="p-6 bg-secondary/50 border-b border-primary/20">
                <DialogHeader>
                  <DialogTitle className="text-primary font-headline text-2xl flex items-center gap-2">
                    <FileText className="h-6 w-6" /> Ficha Completa de Cliente
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-6">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Pipeline Total", value: `R$ ${(totalValue / 1000).toFixed(0)}k`, icon: DollarSign, color: "text-emerald-500" },
          { label: "Leads Quentes", value: hotLeadsCount, icon: AlertCircle, color: "text-destructive" },
          { label: "Novos na Semana", value: "08", icon: Users, color: "text-primary" },
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

      {/* Seção de Ferramentas Estratégicas */}
      <div className="space-y-4">
        <h2 className="text-xl font-headline font-bold text-primary flex items-center gap-2">
          <Wrench className="h-5 w-5" /> Caixa de Ferramentas de Conversão
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calculadora de Viabilidade */}
          <Dialog>
            <DialogTrigger asChild>
              <Card className="glass border-primary/20 hover:border-primary/50 transition-all group cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" /> Calculadora de Viabilidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">Estime honorários e probabilidade de êxito em segundos.</p>
                  <Button className="w-full gold-gradient text-background font-bold uppercase py-5">
                    Abrir Simulador <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="glass border-primary/20 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-primary font-headline text-2xl">Simulador de Viabilidade Técnica</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Valor Estimado da Causa (R$)</Label>
                  <Input 
                    placeholder="Ex: 50000" 
                    className="glass" 
                    value={calcValue} 
                    onChange={(e) => setCalcValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Probabilidade de Êxito (%)</Label>
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
                      <span className="text-muted-foreground">Honorários Estimados (30%):</span>
                      <span className="font-bold text-primary">{calcResult.fee}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expectativa Realista:</span>
                      <span className="font-bold text-emerald-500">{calcResult.expected}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Risco Processual:</span>
                      <Badge variant={calcResult.risk === "Alto" ? "destructive" : "outline"} className="font-bold uppercase text-[10px]">
                        {calcResult.risk}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleCalculate} className="gold-gradient text-background font-bold w-full py-6">
                  Calcular Viabilidade
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Scripts de WhatsApp */}
          <Card className="glass border-primary/20 hover:border-primary/50 transition-all group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" /> Scripts de WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Modelos de mensagens de alta conversão para triagem.</p>
              <Button 
                variant="outline" 
                className="w-full glass font-bold uppercase py-5 border-primary/20 hover:bg-primary/10"
                onClick={() => copyToClipboard(
                  "Olá! Dr. Reinaldo Gonçalves aqui. Recebi seu contato e gostaria de agendar uma breve conversa técnica para entender melhor os detalhes do seu caso e definir a melhor estratégia. Qual o melhor horário para falarmos hoje?",
                  "Script Base Copiado!"
                )}
              >
                Copiar Script Base <Copy className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Checklist de Documentos */}
          <Dialog>
            <DialogTrigger asChild>
              <Card className="glass border-primary/20 hover:border-primary/50 transition-all group cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-blue-400" /> Checklist de Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">Gere a lista de documentos necessária por área do Direito.</p>
                  <Button variant="outline" className="w-full glass font-bold uppercase py-5 border-primary/20 hover:bg-primary/10">
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
                <div className="space-y-2">
                  <Label>Área do Direito</Label>
                  <Select value={checklistArea} onValueChange={setChecklistArea}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                      <SelectItem value="Civil">Civil</SelectItem>
                      <SelectItem value="Previdenciário">Previdenciário</SelectItem>
                      <SelectItem value="Empresarial">Empresarial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {generatedChecklist.length > 0 && (
                  <ScrollArea className="h-[200px] w-full rounded-md border border-primary/10 bg-primary/5 p-4">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-primary uppercase">Documentos Necessários ({checklistArea}):</p>
                      {generatedChecklist.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          {doc}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
              <DialogFooter className="flex-col gap-2">
                <Button onClick={handleGenerateChecklist} className="w-full glass border-primary/20">
                  Gerar Itens
                </Button>
                {generatedChecklist.length > 0 && (
                  <Button 
                    onClick={() => copyToClipboard(
                      `Olá! Conforme conversamos, para darmos início ao seu caso de área ${checklistArea}, preciso que me envie os seguintes documentos:\n\n${generatedChecklist.join('\n')}\n\nFico no aguardo!`,
                      "Lista Copiada!"
                    )} 
                    className="gold-gradient text-background font-bold w-full"
                  >
                    Copiar Lista para WhatsApp
                  </Button>
                )}
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
                  <Card 
                    key={lead.id} 
                    className="glass hover-gold transition-all cursor-pointer group relative overflow-hidden"
                    onClick={() => handleOpenLead(lead)}
                  >
                    {lead.priority === 'alta' && (
                      <div className="absolute top-0 right-0 p-1">
                        <Badge variant="destructive" className="text-[8px] uppercase font-bold px-1.5 py-0">Urgente</Badge>
                      </div>
                    )}
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-lg group-hover:text-primary transition-colors">{lead.name}</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-tighter font-bold flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> Recebido {lead.date}
                          </div>
                        </div>
                        <MoreVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
                          {lead.type}
                        </Badge>
                        <span className="text-emerald-500 font-bold text-sm">
                          R$ {(lead.value / 1000).toFixed(0)}k
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">RG</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-emerald-500/10 hover:text-emerald-500">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
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

      {/* Lead Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl glass border-l border-primary/20 p-0">
          {selectedLead && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-border/50">
                <SheetHeader className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="gold-gradient text-background font-bold uppercase text-[10px]">
                      {selectedLead.stage.replace('_', ' ')}
                    </Badge>
                    {selectedLead.priority === 'alta' && <Badge variant="destructive">Alta Prioridade</Badge>}
                  </div>
                  <SheetTitle className="text-3xl font-headline font-bold text-primary">
                    {selectedLead.name}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-4 text-sm mt-2">
                    <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {selectedLead.phone}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-500">Expectativa: R$ {selectedLead.value.toLocaleString()}</span>
                  </SheetDescription>
                </SheetHeader>
              </div>

              <Tabs defaultValue="dossie" className="flex-1 flex flex-col">
                <div className="px-6 border-b border-border/50 bg-secondary/20">
                  <TabsList className="bg-transparent border-none w-full justify-start h-12 gap-6 p-0">
                    <TabsTrigger value="dossie" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest">Dossiê</TabsTrigger>
                    <TabsTrigger value="documentos" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest">Docs</TabsTrigger>
                    <TabsTrigger value="ferramentas" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest">Tools</TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1 p-6">
                  <TabsContent value="dossie" className="m-0 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Checklist de Fase
                        </h3>
                        <span className="text-[10px] text-muted-foreground font-bold">40% COMPLETO</span>
                      </div>
                      <Progress value={40} className="h-1.5" />
                      <div className="grid gap-3 pt-2">
                        {stageChecklists[selectedLead.stage]?.map((item, i) => (
                          <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30 border border-border/50 group hover:border-primary/30 transition-colors">
                            <Checkbox id={`check-${i}`} />
                            <label htmlFor={`check-${i}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {item}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Info className="h-12 w-12" />
                      </div>
                      <h3 className="font-bold text-sm uppercase tracking-widest text-primary flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4" /> IA Insight
                      </h3>
                      <p className="text-sm text-foreground/80 leading-relaxed italic">
                        "Lead estratégico para Dr. Reinaldo. Alta probabilidade de êxito baseada em casos similares da comarca."
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Notas</h3>
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-sm text-muted-foreground min-h-[100px]">
                        {selectedLead.notes}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="documentos" className="m-0 space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Arquivos</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" className="w-full border-dashed py-8">
                        <Plus className="h-4 w-4 mr-2" /> Upload de Documentos
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="ferramentas" className="m-0 space-y-6">
                    <div className="grid gap-4">
                      <Button className="w-full gold-gradient text-background font-bold py-6 justify-between">
                        Gerar Proposta <Zap className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="w-full py-6 justify-between glass">
                        Gerar Procuração <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              <div className="p-6 border-t border-border/50 bg-background">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="destructive" className="font-bold opacity-50 hover:opacity-100">Descartar</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Avançar Fase</Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
