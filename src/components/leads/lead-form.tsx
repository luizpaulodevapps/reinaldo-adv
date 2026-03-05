
"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, Plus, Video, Link as LinkIcon, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { validateCPF, validateCNPJ } from "@/lib/utils"

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
  onQuickCreateClient?: (clientData: {
    name: string
    phone: string
    documentNumber?: string
    legalArea?: string
  }) => Promise<string | null>
  defaultResponsibleLawyer?: string
  initialData?: any
  initialMode?: "quick" | "complete"
  lockMode?: boolean
}

export function LeadForm({ existingLeads, onSubmit, onSelectExisting, onQuickCreateClient, defaultResponsibleLawyer, initialData, initialMode = "quick", lockMode = false }: LeadFormProps) {
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
    responsibleLawyer: defaultResponsibleLawyer || "Dr. Reinaldo Gonçalves",
    type: "Trabalhista",
    priority: "media",
    prescriptionDate: "",
    source: "indicação",
    sourceDetails: "",
    referredBy: "",
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
    value: "",
    defendantName: "",
    scheduledDate: "",
    scheduledTime: "",
    meetingType: "online",
    meetingLocation: "",
    meetingLink: "",
    meetingCep: "",
    meetingStreet: "",
    meetingNumber: "",
    meetingComplement: "",
    meetingNeighborhood: "",
    meetingCity: "",
    meetingState: "",
    meetingReference: ""
  })

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        name: initialData.name || ""
      }))
      setSearchTerm(initialData.name || "")
    }
  }, [initialData])

  const lawyerOptions = useMemo(() => {
    const options = [defaultResponsibleLawyer, "Dr. Reinaldo Gonçalves", "Equipe de Apoio"].filter(Boolean) as string[]
    return Array.from(new Set(options))
  }, [defaultResponsibleLawyer])

  const [quickRegData, setQuickRegData] = useState({
    firstName: "",
    lastName: "",
    cpfCnpj: "",
    whatsapp: "",
    area: "Trabalhista"
  })

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const formatCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14)
    if (digits.length <= 11) {
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
    }
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

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

  const handleMeetingCepBlur = async () => {
    const cep = formData.meetingCep.replace(/\D/g, "")
    if (cep.length !== 8) return
    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          meetingStreet: data.logradouro,
          meetingNeighborhood: data.bairro,
          meetingCity: data.localidade,
          meetingState: data.uf
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

  const handleSaveQuickClient = async () => {
    const fullName = `${quickRegData.firstName} ${quickRegData.lastName}`.trim()
    if (!fullName || !quickRegData.whatsapp.trim()) {
      toast({ variant: "destructive", title: "Nome e Telefone são obrigatórios" })
      return
    }
    setFormData(prev => ({
      ...prev,
      name: fullName,
      phone: formatPhone(quickRegData.whatsapp),
      cpf: formatCpfCnpj(quickRegData.cpfCnpj),
      type: quickRegData.area
    }))
    setIsQuickRegOpen(false)
    setSearchTerm(fullName)
    toast({ title: "Cliente Pré-cadastrado" })
  }

  const handleSubmit = () => {
    const finalName = formData.name || searchTerm
    if (!finalName?.trim() || !formData.phone?.trim()) {
      toast({ variant: "destructive", title: "Nome e telefone são obrigatórios." })
      return
    }
    onSubmit({ ...formData, name: finalName })
  }

  const isCompleteMode = mode === "complete"

  return (
    <div className="flex min-h-0 flex-col h-full bg-[#0a0f1e] font-sans">
      <ScrollArea className="flex-1 min-h-0 px-8 py-4">
        <div className="space-y-6 pb-6">
          {!lockMode && (
            <div className="flex items-center justify-between mb-4">
              <Label className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Modo de Operação</Label>
              <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-auto">
                <TabsList className="bg-[#1a1f2e] border-0">
                  <TabsTrigger value="quick" className="text-[10px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background">Triagem</TabsTrigger>
                  <TabsTrigger value="complete" className="text-[10px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background">Completo</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          <div className="relative space-y-2" ref={searchRef}>
            <Label className="text-[#a0a5b1] font-black uppercase text-[10px] tracking-widest flex items-center gap-1">CLIENTE PRINCIPAL <span className="text-destructive">*</span></Label>
            <div className="relative cursor-pointer" onClick={() => !lockMode && setIsSearchOpen(true)}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
              <div className={cn(
                "pl-12 bg-[#1a1f2e] border border-[#2d3748] rounded-xl h-12 flex items-center text-white text-sm font-bold uppercase",
                lockMode && "opacity-50 cursor-not-allowed"
              )}>
                {formData.name || searchTerm || "PESQUISAR CLIENTE..."}
              </div>
            </div>

            {isSearchOpen && !lockMode && (
              <div className="absolute z-50 w-full mt-2 bg-[#0a0f1e] border border-[#2d3748] shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-4 border-b border-[#2d3748]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input placeholder="Nome ou CPF/CNPJ..." autoFocus className="pl-10 bg-[#0a0f1e] border-primary/50 h-11 text-white rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="min-h-[100px] p-4">
                  {searchTerm.length < 2 ? (
                    <p className="text-muted-foreground text-center text-xs">Digite para buscar</p>
                  ) : filteredLeads.length > 0 ? (
                    <ScrollArea className="w-full max-h-[250px]">
                      {filteredLeads.map(lead => (
                        <button key={lead.id} onClick={() => handleSelectLead(lead)} className="w-full flex items-center justify-between p-4 hover:bg-primary/5 border-b border-[#2d3748] last:border-0">
                          <div className="text-left"><div className="font-black text-white text-xs uppercase">{lead.name}</div><div className="text-[9px] text-muted-foreground font-mono">{lead.phone || lead.cpf || lead.documentNumber}</div></div>
                          <Badge variant="outline" className="text-[8px] uppercase border-primary/40 text-primary">Selecionar</Badge>
                        </button>
                      ))}
                    </ScrollArea>
                  ) : (
                    <div className="text-center"><p className="text-muted-foreground text-xs italic">Nenhum registro para "{searchTerm}"</p></div>
                  )}
                </div>
                <button onClick={handleOpenQuickReg} className="w-full p-4 border-t border-[#2d3748] flex items-center gap-3 text-primary hover:bg-primary/10 font-black text-[10px] uppercase tracking-widest bg-primary/5">
                  <Plus className="h-4 w-4" /> CRIAR NOVO CLIENTE
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[#a0a5b1] font-black uppercase text-[10px] tracking-widest">EMPRESA / RÉU / PARTE CONTRÁRIA</Label>
            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
              <Input placeholder="NOME DA EMPRESA OU RÉU..." className="pl-12 bg-[#1a1f2e] border-[#2d3748] h-12 text-white font-bold uppercase rounded-xl" value={formData.defendantName} onChange={(e) => handleInputChange("defendantName", e.target.value.toUpperCase())} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#a0a5b1] font-black uppercase text-[10px] tracking-widest">TELEFONE / WHATSAPP <span className="text-destructive">*</span></Label>
              <Input placeholder="(11) 99999-9999" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white font-bold rounded-xl" value={formData.phone} onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-[#a0a5b1] font-black uppercase text-[10px] tracking-widest">E-MAIL DO CLIENTE</Label>
              <Input placeholder="CLIENTE@EMAIL.COM" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white font-bold rounded-xl" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value.toLowerCase())} />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <Label className="text-amber-500 font-black uppercase text-[11px] tracking-widest">Agendamento Estratégico</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#a0a5b1] font-black uppercase text-[10px] tracking-widest">DATA</Label>
                <Input type="date" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white rounded-xl" value={formData.scheduledDate} onChange={(e) => handleInputChange("scheduledDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#a0a5b1] font-black uppercase text-[10px] tracking-widest">HORÁRIO</Label>
                <Input type="time" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white rounded-xl" value={formData.scheduledTime} onChange={(e) => handleInputChange("scheduledTime", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#a0a5b1] font-black uppercase text-[10px] tracking-widest">TIPO DE ATENDIMENTO</Label>
              <Select value={formData.meetingType} onValueChange={(v) => handleInputChange("meetingType", v)}>
                <SelectTrigger className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white font-bold uppercase text-xs rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-[#2d3748] text-white">
                  <SelectItem value="online">🖥️ ONLINE (VIDEOCHAMADA)</SelectItem>
                  <SelectItem value="presencial">🏢 PRESENCIAL (ESCRITÓRIO)</SelectItem>
                  <SelectItem value="domicilio">🏡 NA CASA DO CLIENTE</SelectItem>
                  <SelectItem value="externo">📍 OUTRO LOCAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.meetingType === "online" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <LinkIcon className="h-3 w-3" /> Link da Vídeo Chamada (Google Meet / Zoom)
                </Label>
                <Input 
                  placeholder="https://meet.google.com/..." 
                  className="bg-[#1a1f2e] border-primary/20 h-12 text-white rounded-xl" 
                  value={formData.meetingLink} 
                  onChange={(e) => handleInputChange("meetingLink", e.target.value)} 
                />
              </div>
            )}
          </div>

          {isCompleteMode && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#a0a5b1] font-black uppercase text-[10px] tracking-widest">CPF / CNPJ DO CLIENTE</Label>
                  <Input placeholder="000.000.000-00" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white font-bold rounded-xl" value={formData.cpf} onChange={(e) => handleInputChange("cpf", formatCpfCnpj(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#a0a5b1] font-black uppercase text-[10px] tracking-widest">CIDADE / UF</Label>
                  <div className="flex gap-2">
                    <Input placeholder="CIDADE" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white font-bold flex-1 rounded-xl" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value.toUpperCase())} />
                    <Input placeholder="UF" className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white font-bold w-16 text-center rounded-xl" maxLength={2} value={formData.state} onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#a0a5b1] font-black uppercase text-[10px] tracking-widest">TÍTULO DA DEMANDA</Label>
                <Input placeholder="Ex: REVISIONAL DE HORAS EXTRAS..." className="bg-[#1a1f2e] border-[#2d3748] h-12 text-white font-bold uppercase rounded-xl" value={formData.demandTitle} onChange={(e) => handleInputChange("demandTitle", e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#a0a5b1] font-black uppercase text-[10px] tracking-widest">BRIEFING INICIAL</Label>
                <Textarea placeholder="RELATO INICIAL DO CASO..." className="bg-[#1a1f2e] border-[#2d3748] min-h-[140px] text-white focus:border-primary/50 uppercase rounded-xl" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value.toUpperCase())} />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-6 bg-[#0a0f1e] border-t border-[#1a1f2e] flex items-center justify-between">
        <Button variant="ghost" className="text-muted-foreground hover:text-white font-black uppercase tracking-widest text-[11px]" onClick={() => !lockMode ? setFormData({ ...formData, name: "" }) : setFormData({...formData})}>Cancelar</Button>
        <Button onClick={handleSubmit} className="w-[260px] bg-primary text-background font-black h-14 text-[12px] uppercase tracking-widest shadow-2xl rounded-xl hover:scale-[1.02] transition-all">
          {initialData ? "Atualizar Ficha Técnica" : (isCompleteMode ? "Salvar Cadastro Completo" : "Iniciar Triagem")}
        </Button>
      </div>

      <Dialog open={isQuickRegOpen} onOpenChange={setIsQuickRegOpen}>
        <DialogContent className="bg-[#0a0f1e] border-[#1a1f2e] sm:max-w-[550px] p-0 overflow-hidden shadow-2xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Novo Lead RGMJ</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome</Label>
                <Input value={quickRegData.firstName} onChange={(e) => setQuickRegData({...quickRegData, firstName: e.target.value.toUpperCase()})} className="bg-[#1a1f2e] border-white/10 h-12 text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Sobrenome</Label>
                <Input value={quickRegData.lastName} onChange={(e) => setQuickRegData({...quickRegData, lastName: e.target.value.toUpperCase()})} className="bg-[#1a1f2e] border-white/10 h-12 text-white rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">WhatsApp</Label>
              <Input value={quickRegData.whatsapp} onChange={(e) => setQuickRegData({...quickRegData, whatsapp: formatPhone(e.target.value)})} className="bg-[#1a1f2e] border-white/10 h-12 text-white rounded-xl" />
            </div>
          </div>
          <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" className="text-muted-foreground font-black uppercase text-[11px]" onClick={() => setIsQuickRegOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveQuickClient} className="bg-primary text-background font-black h-12 px-8 uppercase text-[11px] rounded-xl">Confirmar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
