
"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, UserPlus, UserCheck, MapPin, FileText, Smartphone, Loader2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

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
    phone: "",
    email: "",
    type: "Trabalhista",
    priority: "media",
    notes: "",
    value: "",
    // Dados Completos
    cpf: "",
    rg: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    maritalStatus: "",
    profession: ""
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
  }

  const handleSubmit = () => {
    onSubmit({ ...formData, name: formData.name || searchTerm, mode })
  }

  return (
    <div className="space-y-6">
      {/* Seção de Busca/Nome Principal */}
      <div className="relative space-y-2">
        <Label className="text-primary font-bold uppercase text-[10px] tracking-widest">
          {mode === "quick" ? "Buscar ou Nomear Lead" : "Buscar ou Nomear Cliente"}
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Ex: João da Silva..." 
            className="pl-9 glass border-primary/20 focus:border-primary h-12 text-lg" 
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
        </div>

        {/* Resultados da Busca (Overlay) */}
        {filteredLeads.length > 0 && (
          <div className="absolute z-50 w-full mt-1 glass border-primary/30 shadow-2xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-2 bg-primary/10 border-b border-primary/20 text-[10px] font-bold text-primary uppercase flex items-center gap-2">
              <UserCheck className="h-3 w-3" /> Registro Encontrado na Base
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase">{lead.type}</Badge>
                    <Badge className="bg-emerald-500 text-[10px] font-bold">ABRIR DOSSIÊ</Badge>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>
        )}

        {/* Aviso de Novo Cadastro */}
        {searchTerm.length >= 3 && filteredLeads.length === 0 && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase animate-in fade-in">
            <AlertCircle className="h-3 w-3" /> Nenhum registro idêntico. Prossiga com o novo cadastro.
          </div>
        )}
      </div>

      <div className="space-y-4">
        {!lockMode && (
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
              Alternar Modo de Cadastro
            </Label>
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-auto">
              <TabsList className="glass border-primary/10">
                <TabsTrigger value="quick" className="text-xs">Rápido</TabsTrigger>
                <TabsTrigger value="complete" className="text-xs">Completo</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              <Smartphone className="h-3 w-3 text-emerald-500" /> WhatsApp / Telefone
            </Label>
            <Input 
              placeholder="(11) 99999-9999" 
              className="glass" 
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Área do Direito</Label>
            <Select value={formData.type} onValueChange={(v) => handleInputChange("type", v)}>
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

          {mode === "complete" && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  <FileText className="h-3 w-3" /> CPF
                </Label>
                <Input placeholder="000.000.000-00" className="glass" value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  <FileText className="h-3 w-3" /> RG
                </Label>
                <Input placeholder="00.000.000-0" className="glass" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  <MapPin className="h-3 w-3" /> CEP
                  {loadingCep && <Loader2 className="h-3 w-3 animate-spin ml-2 text-primary" />}
                </Label>
                <Input 
                  placeholder="00000-000" 
                  className="glass" 
                  value={formData.zipCode} 
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  onBlur={handleCepBlur}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Bairro</Label>
                <Input placeholder="Ex: Centro" className="glass" value={formData.neighborhood} onChange={(e) => handleInputChange("neighborhood", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Endereço / Logradouro</Label>
                <Input placeholder="Rua, Número, Complemento" className="glass" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Cidade</Label>
                <Input placeholder="Cidade" className="glass" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Estado (UF)</Label>
                <Input placeholder="UF" className="glass" value={formData.state} onChange={(e) => handleInputChange("state", e.target.value)} />
              </div>
            </>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              {mode === "quick" ? "Notas Iniciais (Fatos Narrados)" : "Histórico / Observações Estratégicas"}
            </Label>
            <Textarea 
              placeholder="Descreva aqui o resumo do caso para triagem..." 
              className="glass min-h-[120px]" 
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSubmit} 
        className="w-full gold-gradient text-background font-bold h-14 text-lg shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform"
      >
        {mode === "quick" ? <UserPlus className="mr-2 h-5 w-5" /> : <FileText className="mr-2 h-5 w-5" />}
        {mode === "quick" ? "Finalizar Triagem Rápida" : "Salvar Ficha Completa do Cliente"}
      </Button>
    </div>
  )
}
