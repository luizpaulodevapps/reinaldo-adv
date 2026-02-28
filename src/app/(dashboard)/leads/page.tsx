"use client"

import { useState, useMemo } from "react"
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
  Wrench, 
  Calculator, 
  FileCheck, 
  Zap, 
  Copy, 
  ArrowRight, 
  UserPlus, 
  FileText, 
  PlusCircle, 
  Target, 
  Calendar as CalendarIcon
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { LeadForm } from "@/components/leads/lead-form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
    name: "Luiz Paulo Gonçalves", 
    type: "Trabalhista", 
    date: "2h atrás", 
    stage: "novo", 
    value: 15000, 
    priority: "alta",
    phone: "11948486470",
    email: "luiz@email.com",
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
]

const stageChecklists: Record<string, string[]> = {
  novo: ["Primeiro contato via WhatsApp", "Agendar reunião inicial", "Coletar resumo dos fatos"],
  atendimento: ["Reunião de diagnóstico realizada", "Análise de viabilidade técnica", "Documentação básica solicitada"],
  contratual: ["Proposta de honorários enviada", "Contrato assinado", "Procuração assinada"],
  burocracia: ["Cópias de CTPS/Documentos", "Cálculos iniciais prontos", "Aprovação final do cliente"],
  distribuicao: ["Petição finalizada", "Protocolo realizado", "Número do processo inserido"],
}

const businessHours = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", 
  "17:00", "17:30", "18:00"
]

export default function LeadsPage() {
  const [leads, setLeads] = useState(initialLeadsData)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false)
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
  const { toast } = useToast()

  // Estados para Agendamento
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() + 1)))
  const [scheduledTime, setScheduledTime] = useState("10:00")
  const [isScheduling, setIsScheduling] = useState(false)

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
    const fee = val * 0.3 
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
      Civil: ["RG/CPF", "Comprovante de residência", "Contratos relacionados", "Provas documentais (fotos/prints)", "Rol de testemunhas"]
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

  const handleConfirmSchedule = () => {
    if (!scheduledDate) return
    setIsScheduling(false)
    toast({
      title: "Reunião Agendada",
      description: `Agendado para ${format(scheduledDate, "dd/MM/yyyy")} às ${scheduledTime}.`,
    })
  }

  const totalValue = leads.reduce((acc, lead) => acc + (lead.value || 0), 0)
  const hotLeadsCount = leads.filter(l => l.priority === 'alta').length

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary mb-2">CRM & Triagem de Elite</h1>
          <p className="text-muted-foreground">Gestão estratégica por Dr. Reinaldo Gonçalves Miguel de Jesus.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Dialog open={isNewLeadDialogOpen} onOpenChange={setIsNewLeadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glass text-primary font-bold gap-2 border-primary/20 hover:bg-primary/10">
                <PlusCircle className="h-4 w-4" /> Nova Triagem
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-[#2d3748] sm:max-w-[700px] p-0 overflow-hidden bg-[#0a0f1e]">
              <div className="p-6 bg-[#0a0f1e] border-b border-[#1a1f2e]">
                <DialogHeader>
                  <DialogTitle className="text-white font-headline text-2xl flex items-center gap-4 uppercase tracking-tighter">
                    <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    Nova Triagem
                  </DialogTitle>
                </DialogHeader>
              </div>
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
            </DialogContent>
          </Dialog>

          <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient text-background font-bold gap-2">
                <UserPlus className="h-4 w-4" /> Cadastrar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-[#2d3748] sm:max-w-[800px] p-0 overflow-hidden bg-[#0a0f1e]">
              <div className="p-6 bg-[#0a0f1e] border-b border-[#1a1f2e]">
                <DialogHeader>
                  <DialogTitle className="text-white font-headline text-2xl flex items-center gap-4 uppercase tracking-tighter">
                    <FileText className="h-7 w-7 text-primary" /> Ficha de Cliente
                  </DialogTitle>
                </DialogHeader>
              </div>
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
            </DialogContent>
          </Dialog>
        </div>
      </div>

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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl glass border-l border-primary/20 p-0 flex flex-col bg-[#0a0f1e] h-full overflow-hidden">
          {selectedLead && (
            <>
              {/* Header Fixo */}
              <div className="p-8 pb-4 shrink-0">
                <SheetHeader className="text-left space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase text-[9px]">NOVO</Badge>
                  </div>
                  <SheetTitle className="text-4xl font-headline font-bold text-primary leading-tight">
                    {selectedLead.name}
                  </SheetTitle>
                  <SheetDescription className="text-lg text-muted-foreground font-light flex items-center gap-2">
                    {selectedLead.phone} <span className="text-muted-foreground/30">•</span> {selectedLead.type}
                  </SheetDescription>
                </SheetHeader>
              </div>

              {/* Tabs Container - Expande e gerencia o scroll internamente */}
              <Tabs defaultValue="dossie" className="flex-1 flex flex-col min-h-0">
                <TabsList className="px-8 bg-transparent border-b border-border/30 justify-start h-12 gap-8 p-0 rounded-none w-full shrink-0">
                  <TabsTrigger 
                    value="dossie" 
                    className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-black data-[state=active]:text-white px-4 font-bold transition-all"
                  >
                    Dossiê
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ferramentas" 
                    className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-black data-[state=active]:text-white px-4 font-bold transition-all"
                  >
                    Ferramentas
                  </TabsTrigger>
                </TabsList>

                {/* Área de Scroll Única para o Conteúdo das Tabs */}
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-8">
                    <TabsContent value="dossie" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-primary">Checklist de Fase</h3>
                        </div>
                        
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-1 text-xs flex rounded bg-secondary/30">
                            <div style={{ width: "33%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"></div>
                          </div>
                        </div>

                        <div className="grid gap-3 pt-2">
                          {stageChecklists[selectedLead.stage]?.map((item, i) => (
                            <div key={i}>
                              {item === "Agendar reunião inicial" ? (
                                <Popover open={isScheduling} onOpenChange={setIsScheduling}>
                                  <PopoverTrigger asChild>
                                    <div className="flex items-center space-x-4 p-4 rounded-xl bg-secondary/20 border border-border/30 hover:bg-secondary/40 transition-colors group cursor-pointer">
                                      <Checkbox 
                                        id={`check-${i}`} 
                                        className="w-5 h-5 border-2 border-primary/50 data-[state=checked]:bg-primary"
                                      />
                                      <div className="flex-1 flex items-center justify-between">
                                        <label 
                                          htmlFor={`check-${i}`} 
                                          className="text-base font-medium leading-none cursor-pointer group-hover:text-primary transition-colors"
                                        >
                                          {item}
                                        </label>
                                        {scheduledDate && (
                                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                                            {format(scheduledDate, "dd/MM")} às {scheduledTime}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[300px] p-0 bg-[#0a0f1e] border-primary/40 shadow-2xl z-50" align="start">
                                    <div className="p-6 space-y-6">
                                      <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Escolher Data</Label>
                                        <Input 
                                          type="date" 
                                          className="bg-[#1a1f2e] border-[#2d3748] h-11 text-white" 
                                          value={scheduledDate ? format(scheduledDate, "yyyy-MM-dd") : ""}
                                          onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value + "T00:00:00") : undefined;
                                            setScheduledDate(date);
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Horário Comercial</Label>
                                        <Select value={scheduledTime} onValueChange={setScheduledTime}>
                                          <SelectTrigger className="bg-[#1a1f2e] border-[#2d3748] h-11 text-white">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="bg-[#1a1f2e] border-[#2d3748] text-white">
                                            {businessHours.map(h => (
                                              <SelectItem key={h} value={h}>{h}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <Button 
                                        onClick={handleConfirmSchedule}
                                        className="w-full gold-gradient text-background font-bold h-12 shadow-lg rounded-lg"
                                      >
                                        Confirmar Agendamento
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <div className="flex items-center space-x-4 p-4 rounded-xl bg-secondary/20 border border-border/30 hover:bg-secondary/40 transition-colors group">
                                  <Checkbox 
                                    id={`check-${i}`} 
                                    className="w-5 h-5 border-2 border-primary/50 data-[state=checked]:bg-primary"
                                  />
                                  <label 
                                    htmlFor={`check-${i}`} 
                                    className="text-base font-medium leading-none cursor-pointer group-hover:text-primary transition-colors"
                                  >
                                    {item}
                                  </label>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-primary">Briefing Inicial</h3>
                        <div className="p-6 rounded-xl bg-secondary/10 border-l-4 border-primary/50 italic text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          "{selectedLead.notes}"
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="ferramentas" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                      <Button className="w-full gold-gradient text-background font-bold h-14 flex justify-between px-6 rounded-xl shadow-lg">
                        Gerar Proposta Estratégica <Zap className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" className="w-full h-14 flex justify-between px-6 glass rounded-xl border-primary/20 hover:border-primary/50">
                        Gerar Procuração de Plenos Poderes <ArrowRight className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" className="w-full h-14 flex justify-between px-6 glass rounded-xl border-primary/20 hover:border-primary/50">
                        Scripts de Fechamento <MessageCircle className="h-5 w-5" />
                      </Button>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>

              {/* Footer Fixo com Botões de Ação */}
              <div className="p-8 pt-4 border-t border-border/30 bg-[#0a0f1e] grid grid-cols-2 gap-4 shrink-0">
                <Button 
                  className="bg-[#7f1d1d] hover:bg-[#991b1b] text-white font-bold h-14 text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                >
                  Descartar
                </Button>
                <Button 
                  className="bg-[#10b981] hover:bg-[#059669] text-white font-bold h-14 text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                >
                  Avançar Fase
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
