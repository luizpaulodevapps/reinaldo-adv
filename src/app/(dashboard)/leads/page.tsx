
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
  ArrowRight
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

const columns = [
  { id: "novo", title: "NOVO", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "contratual", title: "CONTRATUAL", color: "text-emerald-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-primary" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

const initialLeads = [
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
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { toast } = useToast()

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead)
    setIsSheetOpen(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado para a área de transferência",
      description: "O script está pronto para ser enviado.",
    })
  }

  const totalValue = initialLeads.reduce((acc, lead) => acc + lead.value, 0)
  const hotLeadsCount = initialLeads.filter(l => l.priority === 'alta').length

  return (
    <div className="space-y-8">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary mb-2">CRM & Triagem de Elite</h1>
          <p className="text-muted-foreground">Conversão estratégica de potenciais clientes para Dr. Reinaldo.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="glass flex-1 md:flex-none font-bold">
            <TrendingUp className="h-4 w-4 mr-2 text-primary" /> Relatórios
          </Button>
          <Button className="gold-gradient text-background font-bold gap-2 flex-1 md:flex-none">
            <Plus className="h-4 w-4" /> Novo Lead
          </Button>
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
          <Card className="glass border-primary/20 hover:border-primary/50 transition-all group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" /> Calculadora de Viabilidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Estime honorários e probabilidade de êxito em segundos.</p>
              <Button variant="outline" size="sm" className="w-full glass text-[10px] font-bold uppercase group-hover:bg-primary group-hover:text-background transition-colors">
                Abrir Simulador <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>

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
                size="sm" 
                className="w-full glass text-[10px] font-bold uppercase group-hover:bg-primary group-hover:text-background transition-colors"
                onClick={() => copyToClipboard("Olá! Dr. Reinaldo Gonçalves aqui. Recebi seu contato sobre [Assunto] e gostaria de agendar uma breve conversa técnica...")}
              >
                Copiar Script Base <Copy className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/50 transition-all group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-400" /> Checklist de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Gere a lista de documentos necessária por área do Direito.</p>
              <Button variant="outline" size="sm" className="w-full glass text-[10px] font-bold uppercase group-hover:bg-primary group-hover:text-background transition-colors">
                Gerar Lista <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar leads por nome ou especialidade..." className="pl-9 glass" />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0">
        {columns.map((col) => {
          const leadsInCol = initialLeads.filter(l => l.stage === col.id)
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
                
                <Button variant="ghost" className="w-full border-2 border-dashed border-border/30 hover:border-primary/50 h-16 text-muted-foreground group">
                  <Plus className="h-4 w-4 mr-2 group-hover:text-primary" /> 
                  <span className="group-hover:text-foreground">Novo Lead nesta fase</span>
                </Button>
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
                    <TabsTrigger value="dossie" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest">Dossiê do Lead</TabsTrigger>
                    <TabsTrigger value="documentos" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest">Documentação</TabsTrigger>
                    <TabsTrigger value="ferramentas" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full px-0 font-bold text-xs uppercase tracking-widest">Ferramentas</TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1 p-6">
                  <TabsContent value="dossie" className="m-0 space-y-8">
                    {/* Checklist Section */}
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

                    {/* IA Insights Section */}
                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Info className="h-12 w-12" />
                      </div>
                      <h3 className="font-bold text-sm uppercase tracking-widest text-primary flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4" /> IA Insight de Viabilidade
                      </h3>
                      <p className="text-sm text-foreground/80 leading-relaxed italic">
                        "Lead com alto potencial baseado no tempo de serviço e tipo de demissão. Recomendamos priorizar a coleta da CTPS e extrato do FGTS para cálculo exato de horas extras."
                      </p>
                      <Button variant="link" className="text-xs p-0 text-primary mt-3 h-auto">Gerar análise detalhada com IA</Button>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Notas do Caso</h3>
                      <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-sm text-muted-foreground min-h-[100px]">
                        {selectedLead.notes}
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs text-primary underline">Editar Notas</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="documentos" className="m-0 space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Arquivos Recebidos</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-4 border rounded-lg flex items-center justify-between glass">
                        <div className="flex items-center gap-3">
                          <FileCheck className="h-5 w-5 text-primary" />
                          <div className="text-sm">RG_e_CPF_Digitalizado.pdf</div>
                        </div>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </div>
                      <Button variant="outline" className="w-full border-dashed py-8">
                        <Plus className="h-4 w-4 mr-2" /> Upload de Documentos
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="ferramentas" className="m-0 space-y-6">
                    <div className="grid gap-4">
                      <Button className="w-full gold-gradient text-background font-bold py-6 justify-between">
                        Gerar Proposta de Honorários <Zap className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="w-full py-6 justify-between glass">
                        Gerar Procuração Técnica <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="w-full py-6 justify-between glass">
                        Enviar Script de Agendamento <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              <div className="p-6 border-t border-border/50 bg-background">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="destructive" className="font-bold opacity-50 hover:opacity-100">Descartar Lead</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Mover p/ Próxima Fase</Button>
                </div>
                <div className="flex gap-4 mt-4">
                  <Button className="flex-1 gold-gradient text-background font-bold gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                  <Button variant="outline" className="flex-1 glass font-bold gap-2">
                    <Calendar className="h-4 w-4" /> Reunião
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
