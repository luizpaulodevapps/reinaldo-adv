
"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, UserPlus, UserCheck, MapPin, FileText, Smartphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
}

export function LeadForm({ existingLeads, onSubmit, onSelectExisting }: LeadFormProps) {
  const [mode, setMode] = useState<"quick" | "complete">("quick")
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    type: "Trabalhista",
    priority: "media",
    notes: "",
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

  const handleSelectLead = (lead: Lead) => {
    onSelectExisting(lead)
    setSearchTerm("")
  }

  const handleSubmit = () => {
    onSubmit({ ...formData, mode })
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="space-y-2">
          <Label className="text-primary font-bold uppercase text-[10px] tracking-widest">
            Nome Completo ou Pesquisa
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
        </div>

        {/* Sugestões de Pesquisa */}
        {filteredLeads.length > 0 && (
          <div className="absolute z-50 w-full mt-1 glass border-primary/30 shadow-2xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-2 bg-primary/10 border-b border-primary/20 text-[10px] font-bold text-primary uppercase flex items-center gap-2">
              <UserCheck className="h-3 w-3" /> Clientes Encontrados na Base
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
                  <Badge variant="outline" className="text-[10px] uppercase">{lead.type}</Badge>
                </button>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
            Tipo de Cadastro
          </Label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-auto">
            <TabsList className="glass border-primary/10">
              <TabsTrigger value="quick" className="text-xs">Rápido</TabsTrigger>
              <TabsTrigger value="complete" className="text-xs">Completo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Smartphone className="h-3 w-3" /> WhatsApp / Telefone</Label>
            <Input 
              placeholder="(11) 99999-9999" 
              className="glass" 
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Área do Direito</Label>
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
                <Label className="flex items-center gap-2"><FileText className="h-3 w-3" /> CPF</Label>
                <Input placeholder="000.000.000-00" className="glass" value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><FileText className="h-3 w-3" /> RG</Label>
                <Input placeholder="00.000.000-0" className="glass" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Endereço Completo</Label>
                <Input placeholder="Rua, Número, Complemento" className="glass" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input placeholder="Ex: Centro" className="glass" value={formData.neighborhood} onChange={(e) => handleInputChange("neighborhood", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cidade/Estado</Label>
                <Input placeholder="Ex: São Paulo - SP" className="glass" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} />
              </div>
            </>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label>Notas do Caso</Label>
            <Textarea 
              placeholder="Fatos iniciais narrados pelo cliente..." 
              className="glass min-h-[100px]" 
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSubmit} 
        className="w-full gold-gradient text-background font-bold h-14 text-lg shadow-lg shadow-primary/20"
      >
        <UserPlus className="mr-2 h-5 w-5" /> 
        {mode === "quick" ? "Finalizar Triagem Rápida" : "Salvar Cadastro Completo"}
      </Button>
    </div>
  )
}
