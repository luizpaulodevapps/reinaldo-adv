"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, AlertCircle, CheckCircle2, ShieldAlert, X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn, validateCPF, validateCNPJ } from "@/lib/utils"

interface Lead {
  id: string
  name: string
  phone: string
  type: string
  cpf?: string
  documentNumber?: string
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
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isQuickRegOpen, setIsQuickRegOpen] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
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

  const [quickRegData, setQuickRegData] = useState({
    firstName: "",
    lastName: "",
    cpfCnpj: "",
    whatsapp: "",
    area: "Trabalhista"
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredLeads = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return []
    return existingLeads.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (l.phone && l.phone.includes(searchTerm)) ||
      (l.cpf && l.cpf.includes(searchTerm)) ||
      (l.documentNumber && l.documentNumber.includes(searchTerm))
    )
  }, [searchTerm, existingLeads])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCepBlur = async () => {
    const cep = formData.zipCode.replace(/\D/g, "")
    if (cep.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }))
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na busca do CEP" })
    } finally {
      setLoadingCep(false)
    }
  }

  const handleSelectLead = (lead: Lead) => {
    onSelectExisting(lead)
    setIsSearchOpen(false)
    setSearchTerm("")
    setFormData(prev => ({ 
      ...prev, 
      name: lead.name, 
      phone: lead.phone || "",
      cpf: lead.cpf || lead.documentNumber || "",
      type: lead.type || "Trabalhista"
    }))
  }

  const handleOpenQuickReg = () => {
    const names = searchTerm.split(" ")
    setQuickRegData({
      ...quickRegData,
      firstName: names[0] || "",
      lastName: names.slice(1).join(" ") || "",
      cpfCnpj: "",
      whatsapp: "",
      area: "Trabalhista"
    })
    setIsQuickRegOpen(true)
    setIsSearchOpen(false)
  }

  const handleSaveQuickClient = () => {
    const fullName = `${quickRegData.firstName} ${quickRegData.lastName}`.trim()
    const doc = quickRegData.cpfCnpj.replace(/\D/g, "");
    
    if (!fullName) {
      toast({ variant: "destructive", title: "Nome obrigatório" })
      return
    }

    if (doc.length > 0) {
      const isValid = doc.length === 11 ? validateCPF(doc) : doc.length === 14 ? validateCNPJ(doc) : false;
      if (!isValid) {
        toast({ variant: "destructive", title: "Documento Inválido", description: "O CPF/CNPJ não passou na validação matemática." });
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      name: fullName,
      phone: quickRegData.whatsapp,
      cpf: quickRegData.cpfCnpj,
      type: quickRegData.area
    }))

    setIsQuickRegOpen(false)
    setSearchTerm(fullName)
    toast({ title: "Cliente Pronto", description: `${fullName} pronto para triagem.` })
  }

  const handleSubmit = () => {
    const finalName = formData.name || searchTerm
    if (!finalName) {
      toast({ variant: "destructive", title: "Selecione ou busque um cliente." })
      return
    }
    onSubmit({ ...formData, name: finalName, mode })
  }

  const isQuickDocValid = () => {
    const doc = quickRegData.cpfCnpj.replace(/\D/g, "");
    if (doc.length === 11) return validateCPF(doc);
    if (doc.length === 14) return validateCNPJ(doc);
    return false;
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e]">
      <ScrollArea className="flex-1 px-8 py-4 max-h-[70vh]">
        <div className="space-y-6 pb-6">
          {!lockMode && (
            <div className="flex items-center justify-between mb-4">
              <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Modo de Operação</Label>
              <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-auto">
                <TabsList className="bg-[#1a1f2e] border-0">
                  <TabsTrigger value="quick" className="text-[10px] uppercase font-bold data-[state=active]:bg-primary data-[state=active]:text-background">Triagem</TabsTrigger>
                  <TabsTrigger value="complete" className="text-[10px] uppercase font-bold data-[state=active]:bg-primary data-[state=active]:text-background">Completo</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          <div className="relative space-y-2" ref={searchRef}>
            <Label className="text-[#a0a5b1] font-bold uppercase text-[10px] tracking-widest flex items-center gap-1">CLIENTE PRINCIPAL <span className="text-destructive">*</span></Label>
            <div className="relative cursor-pointer" onClick={() => setIsSearchOpen(true)}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
              <div className="pl-12 bg-[#1a1f2e] border border-[#2d3748] rounded-md h-12 flex items-center text-white text-sm">
                {formData.name || searchTerm || "Pesquisar cliente..."}
              </div>
            </div>

            {isSearchOpen && (
              <div className="absolute z-50 w-full mt-2 bg-[#0a0f1e] border border-[#2d3748] shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-4 border-b border-[#2d3748]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input placeholder="Nome ou CPF/CNPJ..." autoFocus className="pl-10 bg-[#0a0f1e] border-primary/50 focus:border-primary h-11 text-white ring-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="min-h-[140px] flex flex-col justify-center items-center p-4">
                  {searchTerm.length < 2 ? (
                    <p className="text-[#4a5568] text-sm">Digite pelo menos 2 caracteres para buscar</p>
                  ) : filteredLeads.length > 0 ? (
                    <ScrollArea className="w-full max-h-[300px]">
                      {filteredLeads.map(lead => (
                        <button key={lead.id} onClick={() => handleSelectLead(lead)} className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors border-b border-[#2d3748] last:border-0">
                          <div className="text-left">
                            <div className="font-bold text-white">{lead.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{lead.phone || lead.cpf || lead.documentNumber}</div>
                          </div>
                          <Badge variant="outline" className="text-[9px] uppercase border-primary/40 text-primary">Selecionar</Badge>
                        </button>
                      ))}
                    </ScrollArea>
                  ) : (
                    <div className="text-center space-y-2">
                      <p className="text-[#4a5568] text-sm italic">Nenhum registro encontrado para "{searchTerm}".</p>
                    </div>
                  )}
                </div>
                <button onClick={handleOpenQuickReg} className="w-full p-4 border-t border-[#2d3748] flex items-center gap-3 text-primary hover:bg-primary/10 transition-colors font-bold text-xs uppercase tracking-widest bg-primary/5">
                  <Plus className="h-4 w-4" /> CRIAR NOVO CLIENTE
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[#a0a5b1] font-bold uppercase text-[10px] tracking-widest">TÍTULO DA DEMANDA <span className="text-destructive">*</span></Label>
            <Input placeholder="Ex: Revisional de Horas Extras..." className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white" value={formData.demandTitle} onChange={(e) => handleInputChange("demandTitle", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[#a0a5b1] font-bold uppercase text-[10px] tracking-widest">ADVOGADO RESPONSÁVEL <span className="text-destructive">*</span></Label>
              <Select value={formData.responsibleLawyer} onValueChange={(v) => handleInputChange("responsibleLawyer", v)}>
                <SelectTrigger className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2d3748] text-white">
                  <SelectItem value="Dr. Reinaldo Gonçalves">Dr. Reinaldo Gonçalves</SelectItem>
                  <SelectItem value="Equipe de Apoio">Equipe de Apoio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#a0a5b1] font-bold uppercase text-[10px] tracking-widest">ÁREA JURÍDICA <span className="text-destructive">*</span></Label>
              <Select value={formData.type} onValueChange={(v) => handleInputChange("type", v)}>
                <SelectTrigger className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2d3748] text-white">
                  <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                  <SelectItem value="Previdenciário">Previdenciário</SelectItem>
                  <SelectItem value="Empresarial">Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#a0a5b1] font-bold uppercase text-[10px] tracking-widest">BRIEFING INICIAL</Label>
            <Textarea placeholder="Relato inicial do caso..." className="bg-[#1a1f2e] border-[#2d3748] min-h-[140px] text-white focus:border-primary/50 resize-none" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#1a1f2e]">
            <div className="space-y-2">
              <Label className={cn("text-[10px] uppercase font-bold", formData.cpf.length >= 11 && (validateCPF(formData.cpf) || validateCNPJ(formData.cpf) ? "text-emerald-500" : "text-rose-500"))}>
                CPF / CNPJ <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="000.000.000-00" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white" value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#a0a5b1]">CEP</Label>
              <Input placeholder="00000-000" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white" value={formData.zipCode} onChange={(e) => handleInputChange("zipCode", e.target.value)} onBlur={handleCepBlur} />
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-8 bg-[#0a0f1e] border-t border-[#1a1f2e] flex flex-col md:flex-row gap-4 items-center justify-between">
        <Button variant="ghost" className="text-[#a0a5b1] hover:text-white font-bold uppercase tracking-widest text-[11px]" onClick={() => setFormData({ ...formData, name: "" })}>Cancelar</Button>
        <Button onClick={handleSubmit} className="w-full md:w-[240px] bg-primary text-white font-bold h-14 text-[12px] uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3">
          Confirmar Cadastro
        </Button>
      </div>

      <Dialog open={isQuickRegOpen} onOpenChange={setIsQuickRegOpen}>
        <DialogContent className="bg-[#0a0f1e] border-[#1a1f2e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 space-y-2">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl flex items-center gap-2">Novo Cadastro RGMJ</DialogTitle>
              <p className="text-[#4a5568] text-sm">Validação estrutural ativa para garantir integridade sem custos.</p>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-8 border-t border-[#1a1f2e]/50">
            <div className="space-y-4">
              <Label className={cn("text-[#a0a5b1] font-bold uppercase text-[10px] tracking-widest", quickRegData.cpfCnpj.length >= 11 && (isQuickDocValid() ? "text-emerald-500" : "text-rose-500"))}>
                CPF / CNPJ * {quickRegData.cpfCnpj.length >= 11 && (isQuickDocValid() ? "(VÁLIDO)" : "(INVÁLIDO)")}
              </Label>
              <Input placeholder="000.000.000-00 ou 00.000.000/0000-00" className="bg-[#0a0f1e] border-[#2d3748] h-12 text-white focus:ring-1 focus:ring-primary/50" value={quickRegData.cpfCnpj} onChange={(e) => setQuickRegData({...quickRegData, cpfCnpj: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[#a0a5b1] font-bold uppercase text-[10px] tracking-widest">NOME / RAZÃO *</Label>
                <Input placeholder="Ex: João" className="bg-[#0a0f1e] border-[#2d3748] h-12 text-white focus:border-primary/50" value={quickRegData.firstName} onChange={(e) => setQuickRegData({...quickRegData, firstName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#a0a5b1] font-bold uppercase text-[10px] tracking-widest">SOBRENOME / FANTASIA</Label>
                <Input placeholder="Ex: Silva" className="bg-[#0a0f1e] border-[#2d3748] h-12 text-white focus:border-primary/50" value={quickRegData.lastName} onChange={(e) => setQuickRegData({...quickRegData, lastName: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="p-8 bg-[#0d121f] border-t border-[#1a1f2e] flex items-center justify-between">
            <Button variant="ghost" className="text-[#a0a5b1] hover:text-white font-bold uppercase tracking-widest text-[11px]" onClick={() => setIsQuickRegOpen(false)}>CANCELAR</Button>
            <Button onClick={handleSaveQuickClient} className="bg-primary text-white font-bold h-14 px-8 text-[12px] uppercase tracking-widest shadow-2xl flex items-center gap-2 rounded-lg">SALVAR CLIENTE</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
