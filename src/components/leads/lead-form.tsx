
"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, UserCheck, Smartphone, Loader2, AlertCircle, Calendar as CalendarIcon, Target, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Lead {
  id: string
  name: string
  phone: string
  type: string
  [key: string]: any
}

interface LeadFormProps {
  existingLeads: Lead[]
  onSubmit: (leadData: any) => void
  onSelectExisting: (lead: Lead) => void
  initialMode?: "quick" | "complete"
  lockMode?: boolean
}

export function LeadForm({ existingLeads, onSubmit, onSelectExisting, initialMode = "quick", lockMode = false }: LeadFormProps) {
  const [mode, setMode] = useState<"quick" | "complete">(initialMode)
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingCep, setLoadingCep] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    demandTitle: "",
    responsibleLawyer: "Dr. Reinaldo Gonçalves",
    type: "Trabalhista",
    priority: "media",
    prescriptionDate: "",
    source: "indicação",
    notes: "",
    phone: "",
    email: "",
    // Dados Completos
    cpf: "",
    rg: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    maritalStatus: "",
    profession: "",
    value: ""
  })

  const filteredLeads = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return []
    return existingLeads.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.phone.includes(searchTerm)
    )
  }, [searchTerm, existingLeads])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === "name") setSearchTerm(value)
  }

  const handleCepBlur = async () => {
    const cep = formData.zipCode.replace(/\D/g, "")
    if (cep.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        toast({
          variant: "destructive",
          title: "CEP não encontrado",
          description: "Por favor, verifique o número digitado."
        })
      } else {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }))
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: "Não foi possível consultar o CEP agora."
      })
    } finally {
      setLoadingCep(false)
    }
  }

  const handleSelectLead = (lead: Lead) => {
    onSelectExisting(lead)
    setSearchTerm("")
    setFormData(prev => ({ ...prev, name: lead.name, phone: lead.phone }))
  }

  const handleSubmit = () => {
    onSubmit({ ...formData, name: formData.name || searchTerm, mode })
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e]">
      <ScrollArea className="flex-1 px-8 py-4 max-h-[70vh]">
        <div className="space-y-6 pb-6">
          {/* Alternar Modo se não bloqueado */}
          {!lockMode && (
            <div className="flex items-center justify-between mb-4">
              <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                Modo de Operação
              </Label>
              <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-auto">
                <TabsList className="bg-[#1a1f2e] border-0">
                  <TabsTrigger value="quick" className="text-[10px] uppercase font-bold data-[state=active]:bg-primary data-[state=active]:text-background">Triagem</TabsTrigger>
                  <TabsTrigger value="complete" className="text-[10px] uppercase font-bold data-[state=active]:bg-primary data-[state=active]:text-background">Completo</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Cliente Principal com Busca */}
          <div className="relative space-y-2">
            <Label className="text-[#a0a5b1] font-bold uppercase text-[11px] tracking-widest flex items-center gap-1">
              Cliente Principal <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
              <Input 
                placeholder="Pesquisar cliente..." 
                className="pl-12 bg-[#1a1f2e] border-[#2d3748] focus:border-primary/50 h-12 text-white placeholder:text-[#4a5568]" 
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            {filteredLeads.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-[#1a1f2e] border border-primary/30 shadow-2xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 bg-primary/10 border-b border-primary/20 text-[10px] font-bold text-primary uppercase flex items-center gap-2">
                  <UserCheck className="h-3 w-3" /> Registro em Base
                </div>
                <ScrollArea className="max-h-[200px]">
                  {filteredLeads.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => handleSelectLead(lead)}
                      className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors border-b border-[#2d3748] last:border-0"
                    >
                      <div className="text-left">
                        <div className="font-bold text-white">{lead.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{lead.phone}</div>
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase border-primary/40 text-primary">Abrir Dossiê</Badge>
                    </button>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Título da Demanda */}
          <div className="space-y-2">
            <Label className="text-[#a0a5b1] font-bold uppercase text-[11px] tracking-widest flex items-center gap-1">
              Título da Demanda <span className="text-destructive">*</span>
            </Label>
            <Input 
              placeholder="Ex: Revisional de Horas Extras..." 
              className="bg-[#1a1f2e] border-[#2d3748] focus:border-primary/50 h-12 text-white" 
              value={formData.demandTitle}
              onChange={(e) => handleInputChange("demandTitle", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Advogado Responsável */}
            <div className="space-y-2">
              <Label className="text-[#a0a5b1] font-bold uppercase text-[11px] tracking-widest flex items-center gap-1">
                Advogado Responsável <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.responsibleLawyer} onValueChange={(v) => handleInputChange("responsibleLawyer", v)}>
                <SelectTrigger className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2d3748] text-white">
                  <SelectItem value="Dr. Reinaldo Gonçalves">Dr. Reinaldo Gonçalves</SelectItem>
                  <SelectItem value="Dra. Equipe 01">Equipe de Apoio 01</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Área Jurídica */}
            <div className="space-y-2">
              <Label className="text-[#a0a5b1] font-bold uppercase text-[11px] tracking-widest flex items-center gap-1">
                Área Jurídica <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.type} onValueChange={(v) => handleInputChange("type", v)}>
                <SelectTrigger className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2d3748] text-white">
                  <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                  <SelectItem value="Previdenciário">Previdenciário</SelectItem>
                  <SelectItem value="Empresarial">Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label className="text-[#a0a5b1] font-bold uppercase text-[11px] tracking-widest">
                Prioridade
              </Label>
              <Select value={formData.priority} onValueChange={(v) => handleInputChange("priority", v)}>
                <SelectTrigger className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2d3748] text-white">
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data de Prescrição */}
            <div className="space-y-2">
              <Label className="text-[#e53e3e] font-bold uppercase text-[11px] tracking-widest flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Data de Prescrição
              </Label>
              <div className="relative">
                <Input 
                  type="date" 
                  className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white pr-10" 
                  value={formData.prescriptionDate}
                  onChange={(e) => handleInputChange("prescriptionDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Fonte de Captação */}
          <div className="space-y-2">
            <Label className="text-[#a0a5b1] font-bold uppercase text-[11px] tracking-widest flex items-center gap-1">
              Fonte de Captação <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.source} onValueChange={(v) => handleInputChange("source", v)}>
              <SelectTrigger className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2d3748] text-white">
                <SelectItem value="indicação">🤝 Indicação</SelectItem>
                <SelectItem value="google">🔍 Google Ads</SelectItem>
                <SelectItem value="instagram">📸 Instagram</SelectItem>
                <SelectItem value="site">🌐 Site LexFlow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Briefing Inicial */}
          <div className="space-y-2">
            <Label className="text-[#a0a5b1] font-bold uppercase text-[11px] tracking-widest">
              Briefing Inicial
            </Label>
            <Textarea 
              placeholder="Relato inicial do cliente..." 
              className="bg-[#1a1f2e] border-[#2d3748] min-h-[140px] resize-none text-white focus:border-primary/50" 
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </div>

          {/* Campos Adicionais para Modo Completo */}
          {mode === "complete" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-[#a0a5b1]">WhatsApp / Celular</Label>
                <Input placeholder="(11) 99999-9999" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-[#a0a5b1]">CPF</Label>
                <Input placeholder="000.000.000-00" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white" value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-[#a0a5b1] flex items-center gap-2">
                  CEP {loadingCep && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </Label>
                <Input placeholder="00000-000" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white" value={formData.zipCode} onChange={(e) => handleInputChange("zipCode", e.target.value)} onBlur={handleCepBlur} />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label className="text-[10px] uppercase font-bold text-[#a0a5b1]">Endereço</Label>
                <Input className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Fixo */}
      <div className="p-8 bg-[#0a0f1e] border-t border-[#1a1f2e] flex flex-col md:flex-row gap-4 items-center justify-between">
        <Button 
          variant="ghost" 
          className="w-full md:w-auto text-[#a0a5b1] hover:text-white font-bold uppercase tracking-widest text-[11px]"
          onClick={() => {
            setFormData({ ...formData, name: "" })
            toast({ title: "Triagem Cancelada" })
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="w-full md:w-[240px] gold-gradient text-background font-bold h-14 text-[12px] uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
        >
          <Target className="h-5 w-5" />
          Iniciar Triagem
        </Button>
      </div>
    </div>
  )
}
