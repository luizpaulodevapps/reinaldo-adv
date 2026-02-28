
"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, UserCheck, MapPin, FileText, Smartphone, Loader2, AlertCircle, Calendar as CalendarIcon, Target, Heart } from "lucide-react"
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
        toast({
          title: "Endereço localizado",
          description: `${data.logradouro}, ${data.localidade} - ${data.uf}`
        })
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
    <div className="space-y-6">
      {!lockMode && (
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
            Alternar Modo de Cadastro
          </Label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-auto">
            <TabsList className="glass border-primary/10">
              <TabsTrigger value="quick" className="text-xs">Triagem</TabsTrigger>
              <TabsTrigger value="complete" className="text-xs">Ficha Completa</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Interface Inspirada */}
      <div className="space-y-5">
        {/* Cliente Principal */}
        <div className="relative space-y-2">
          <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest flex items-center gap-1">
            Cliente Principal <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar cliente..." 
              className="pl-10 glass border-border focus:border-primary/50 h-11" 
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>

          {filteredLeads.length > 0 && (
            <div className="absolute z-50 w-full mt-1 glass border-primary/30 shadow-2xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-2 bg-primary/10 border-b border-primary/20 text-[10px] font-bold text-primary uppercase flex items-center gap-2">
                <UserCheck className="h-3 w-3" /> Registro Encontrado
              </div>
              <ScrollArea className="max-h-[200px]">
                {filteredLeads.map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectLead(lead)}
                    className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0"
                  >
                    <div className="text-left">
                      <div className="font-bold text-foreground">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.phone}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase">ABRIR DOSSIÊ</Badge>
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Título da Demanda */}
        <div className="space-y-2">
          <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest flex items-center gap-1">
            Título da Demanda <span className="text-destructive">*</span>
          </Label>
          <Input 
            placeholder="Ex: Revisional de Horas Extras..." 
            className="glass border-border focus:border-primary/50 h-11" 
            value={formData.demandTitle}
            onChange={(e) => handleInputChange("demandTitle", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Advogado Responsável */}
          <div className="space-y-2">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest flex items-center gap-1">
              Advogado Responsável <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.responsibleLawyer} onValueChange={(v) => handleInputChange("responsibleLawyer", v)}>
              <SelectTrigger className="glass border-border h-11">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dr. Reinaldo Gonçalves">Dr. Reinaldo Gonçalves</SelectItem>
                <SelectItem value="Dra. Equipe 01">Equipe de Apoio 01</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Área Jurídica */}
          <div className="space-y-2">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest flex items-center gap-1">
              Área Jurídica <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.type} onValueChange={(v) => handleInputChange("type", v)}>
              <SelectTrigger className="glass border-border h-11">
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

          {/* Prioridade */}
          <div className="space-y-2">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
              Prioridade
            </Label>
            <Select value={formData.priority} onValueChange={(v) => handleInputChange("priority", v)}>
              <SelectTrigger className="glass border-border h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data de Prescrição */}
          <div className="space-y-2">
            <Label className="text-destructive font-bold uppercase text-[10px] tracking-widest flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Data de Prescrição
            </Label>
            <div className="relative">
              <Input 
                type="date" 
                className="glass border-border h-11 pr-10" 
                value={formData.prescriptionDate}
                onChange={(e) => handleInputChange("prescriptionDate", e.target.value)}
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Fonte de Captação */}
        <div className="space-y-2">
          <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest flex items-center gap-1">
            Fonte de Captação <span className="text-destructive">*</span>
          </Label>
          <Select value={formData.source} onValueChange={(v) => handleInputChange("source", v)}>
            <SelectTrigger className="glass border-border h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indicação"><span className="flex items-center gap-2">🤝 Indicação</span></SelectItem>
              <SelectItem value="google"><span className="flex items-center gap-2">🔍 Google Ads</span></SelectItem>
              <SelectItem value="instagram"><span className="flex items-center gap-2">📸 Instagram</span></SelectItem>
              <SelectItem value="site"><span className="flex items-center gap-2">🌐 Site LexFlow</span></SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Briefing Inicial */}
        <div className="space-y-2">
          <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
            Briefing Inicial
          </Label>
          <Textarea 
            placeholder="Relato inicial do cliente..." 
            className="glass border-border min-h-[120px] resize-none" 
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
          />
        </div>

        {mode === "complete" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">WhatsApp</Label>
              <Input placeholder="(11) 99999-9999" className="glass h-11" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">CPF</Label>
              <Input placeholder="000.000.000-00" className="glass h-11" value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                CEP {loadingCep && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </Label>
              <Input placeholder="00000-000" className="glass h-11" value={formData.zipCode} onChange={(e) => handleInputChange("zipCode", e.target.value)} onBlur={handleCepBlur} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Endereço</Label>
              <Input className="glass h-11" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-border/50">
        <Button 
          variant="ghost" 
          className="flex-1 text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest text-xs h-12"
          onClick={() => toast({ title: "Triagem Cancelada" })}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="flex-1 gold-gradient text-background font-bold h-12 text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
        >
          <Target className="h-4 w-4" />
          Iniciar Triagem
        </Button>
      </div>
    </div>
  )
}
