
"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, Plus, Video, Link as LinkIcon, Building, User, MapPin, ShieldCheck, Mail, Phone, Fingerprint } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const [loadingCep, setLoadingCep] = useState<"client" | "defendant" | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    demandTitle: "",
    responsibleLawyer: defaultResponsibleLawyer || "Dr. Reinaldo Gonçalves",
    type: "Trabalhista",
    priority: "media",
    notes: "",
    phone: "",
    email: "",
    cpf: "",
    rg: "",
    maritalStatus: "Solteiro(a)",
    profession: "",
    // Endereço Autor
    zipCode: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    // Dados Réu
    defendantName: "",
    defendantDocument: "",
    defendantZipCode: "",
    defendantAddress: "",
    defendantNumber: "",
    defendantComplement: "",
    defendantNeighborhood: "",
    defendantCity: "",
    defendantState: "",
    // Agendamento
    scheduledDate: "",
    scheduledTime: "",
    meetingType: "online",
    meetingLink: "",
    value: ""
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

  const handleCepBlur = async (type: "client" | "defendant") => {
    const cep = (type === "client" ? formData.zipCode : formData.defendantZipCode).replace(/\D/g, "")
    if (cep.length !== 8) return

    setLoadingCep(type)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        if (type === "client") {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro.toUpperCase(),
            neighborhood: data.bairro.toUpperCase(),
            city: data.localidade.toUpperCase(),
            state: data.uf.toUpperCase()
          }))
        } else {
          setFormData(prev => ({
            ...prev,
            defendantAddress: data.logradouro.toUpperCase(),
            defendantNeighborhood: data.bairro.toUpperCase(),
            defendantCity: data.localidade.toUpperCase(),
            defendantState: data.uf.toUpperCase()
          }))
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na busca do CEP" })
    } finally {
      setLoadingCep(null)
    }
  }

  const filteredLeads = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return []
    return existingLeads.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (l.phone && l.phone.includes(searchTerm)) ||
      (l.cpf && l.cpf.includes(searchTerm))
    )
  }, [searchTerm, existingLeads])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    const finalName = formData.name || searchTerm
    if (!finalName?.trim() || !formData.phone?.trim()) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Nome e Telefone são essenciais." })
      return
    }
    onSubmit({ ...formData, name: finalName })
  }

  const SectionLabel = ({ icon: Icon, children, color = "text-primary" }: any) => (
    <div className="flex items-center gap-3 pt-6 mb-4 border-t border-white/5 first:border-t-0 first:pt-0">
      <div className={cn("w-1.5 h-6 rounded-full", color.replace('text-', 'bg-'))} />
      <Icon className={cn("h-4 w-4", color)} />
      <Label className={cn("font-black uppercase text-[11px] tracking-[0.25em]", color)}>{children}</Label>
    </div>
  )

  const isCompleteMode = mode === "complete"

  return (
    <div className="flex min-h-0 flex-col h-full bg-[#0a0f1e] font-sans">
      <ScrollArea className="flex-1 min-h-0 px-10 py-8">
        <div className="space-y-10 pb-20 max-w-4xl mx-auto">
          
          {/* MODO DE OPERAÇÃO */}
          {!lockMode && (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-muted-foreground font-black uppercase text-[10px] tracking-widest opacity-50">Inteligência de Fluxo</Label>
                <p className="text-[9px] text-white/40 font-bold uppercase">Escolha o nível de detalhamento do dossiê.</p>
              </div>
              <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-auto">
                <TabsList className="bg-[#1a1f2e] p-1 h-11">
                  <TabsTrigger value="quick" className="text-[10px] px-6 uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background">Triagem</TabsTrigger>
                  <TabsTrigger value="complete" className="text-[10px] px-6 uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background">Dossiê Completo</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* IDENTIFICAÇÃO PRIMÁRIA */}
          <div className="space-y-6">
            <SectionLabel icon={User} color="text-primary">Identificação Básica</SectionLabel>
            
            <div className="relative" ref={searchRef}>
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 block">CLIENTE PRINCIPAL (AUTOR) *</Label>
              <div className="relative" onClick={() => !lockMode && setIsSearchOpen(true)}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
                <div className={cn(
                  "pl-12 bg-black/40 border border-white/10 rounded-xl h-14 flex items-center text-white text-sm font-bold uppercase transition-all",
                  !lockMode && "hover:border-primary/50 cursor-pointer",
                  lockMode && "opacity-60 cursor-not-allowed"
                )}>
                  {formData.name || searchTerm || "PESQUISAR CLIENTE NO BANCO RGMJ..."}
                </div>
              </div>

              {isSearchOpen && !lockMode && (
                <div className="absolute z-50 w-full mt-2 bg-[#0a0f1e] border border-primary/20 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-4 border-b border-white/5">
                    <Input placeholder="Digitar nome para busca..." autoFocus className="bg-black/40 border-primary/20 h-12 text-white uppercase font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <ScrollArea className="max-h-[300px]">
                    {filteredLeads.map(lead => (
                      <button key={lead.id} onClick={() => handleSelectLead(lead)} className="w-full p-5 flex items-center justify-between hover:bg-primary/10 border-b border-white/5 last:border-0 transition-colors">
                        <div className="text-left">
                          <p className="font-black text-white text-xs uppercase">{lead.name}</p>
                          <p className="text-[9px] text-muted-foreground font-mono mt-1">{lead.phone} • {lead.cpf || 'SEM CPF'}</p>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-black border-primary/30 text-primary uppercase">Selecionar</Badge>
                      </button>
                    ))}
                    {searchTerm.length >= 2 && filteredLeads.length === 0 && (
                      <div className="p-10 text-center opacity-40"><p className="text-xs font-bold uppercase tracking-widest">Nenhum registro encontrado.</p></div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">RAZÃO SOCIAL / RÉU CONTRÁRIO *</Label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input placeholder="NOME DA EMPRESA OU RÉU..." className="pl-12 bg-black/40 border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.defendantName} onChange={(e) => handleInputChange("defendantName", e.target.value.toUpperCase())} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">WHATSAPP *</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/40" />
                    <Input placeholder="(00) 00000-0000" className="pl-12 bg-black/40 border-white/10 h-14 text-white font-bold rounded-xl" value={formData.phone} onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">E-MAIL</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input placeholder="CLIENTE@EMAIL.COM" className="pl-12 bg-black/40 border-white/10 h-14 text-white font-bold rounded-xl lowercase" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AGENDAMENTO ESTRATÉGICO */}
          <div className="p-8 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 space-y-8 shadow-inner">
            <SectionLabel icon={Video} color="text-amber-500">Agendamento de Atendimento</SectionLabel>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">DATA DO ATO</Label>
                <Input type="date" className="bg-black/40 border-amber-500/20 h-14 text-white rounded-xl focus:ring-amber-500/50" value={formData.scheduledDate} onChange={(e) => handleInputChange("scheduledDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">HORÁRIO</Label>
                <Input type="time" className="bg-black/40 border-amber-500/20 h-14 text-white rounded-xl focus:ring-amber-500/50" value={formData.scheduledTime} onChange={(e) => handleInputChange("scheduledTime", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">MODO DE REUNIÃO</Label>
                <Select value={formData.meetingType} onValueChange={(v) => handleInputChange("meetingType", v)}>
                  <SelectTrigger className="bg-black/40 border-amber-500/20 h-14 text-white font-black text-[10px] uppercase rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    <SelectItem value="online">🖥️ ONLINE (VÍDEO)</SelectItem>
                    <SelectItem value="presencial">🏢 PRESENCIAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.meetingType === 'online' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <LinkIcon className="h-3 w-3" /> LINK DA SALA VIRTUAL (GOOGLE MEET / ZOOM)
                </Label>
                <Input placeholder="https://meet.google.com/..." className="bg-black/40 border-primary/20 h-14 text-white rounded-xl" value={formData.meetingLink} onChange={(e) => handleInputChange("meetingLink", e.target.value)} />
              </div>
            )}
          </div>

          {/* QUALIFICAÇÃO COMPLETA (AUTOR E RÉU) */}
          {isCompleteMode && (
            <div className="space-y-12 animate-in fade-in duration-700">
              
              {/* DOSSIÊ DO AUTOR */}
              <div className="space-y-8">
                <SectionLabel icon={User} color="text-emerald-500">Qualificação do Autor (Cliente)</SectionLabel>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CPF / CNPJ</Label>
                    <div className="relative">
                      <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/40" />
                      <Input placeholder="000.000.000-00" className="pl-12 bg-black/40 border-white/10 h-14 text-white font-mono" value={formData.cpf} onChange={(e) => handleInputChange("cpf", formatCpfCnpj(e.target.value))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">RG / ÓRGÃO EMISSOR</Label>
                    <Input placeholder="00.000.000-0" className="bg-black/40 border-white/10 h-14 text-white font-mono" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ESTADO CIVIL</Label>
                    <Select value={formData.maritalStatus} onValueChange={(v) => handleInputChange("maritalStatus", v)}>
                      <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white font-bold text-xs uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0d121f] text-white">
                        {["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"].map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CEP (AUTOR)</Label>
                    <div className="relative">
                      <Input placeholder="00000-000" className="bg-black/40 border-white/10 h-14 text-white font-mono" value={formData.zipCode} onChange={(e) => handleInputChange("zipCode", formatCep(e.target.value))} onBlur={() => handleCepBlur("client")} />
                      {loadingCep === "client" && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">LOGRADOURO / RUA</Label>
                    <Input placeholder="EX: AVENIDA PAULISTA" className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NÚMERO</Label>
                    <Input placeholder="123" className="bg-black/40 border-white/10 h-14 text-white font-bold" value={formData.number} onChange={(e) => handleInputChange("number", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">BAIRRO</Label>
                    <Input placeholder="BAIRRO..." className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase" value={formData.neighborhood} onChange={(e) => handleInputChange("neighborhood", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CIDADE</Label>
                    <Input placeholder="CIDADE..." className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">UF</Label>
                    <Input placeholder="SP" maxLength={2} className="bg-black/40 border-white/10 h-14 text-white font-black text-center" value={formData.state} onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>

              {/* DOSSIÊ DO RÉU */}
              <div className="space-y-8">
                <SectionLabel icon={Building} color="text-rose-500">Qualificação do Réu (Parte Contrária)</SectionLabel>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CNPJ / CPF DO RÉU</Label>
                    <Input placeholder="00.000.000/0000-00" className="bg-black/40 border-white/10 h-14 text-white font-mono" value={formData.defendantDocument} onChange={(e) => handleInputChange("defendantDocument", formatCpfCnpj(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">RAZÃO SOCIAL / NOME COMPLETO</Label>
                    <Input placeholder="NOME OFICIAL DO RÉU..." className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase" value={formData.defendantName} onChange={(e) => handleInputChange("defendantName", e.target.value.toUpperCase())} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CEP (RÉU)</Label>
                    <div className="relative">
                      <Input placeholder="00000-000" className="bg-black/40 border-white/10 h-14 text-white font-mono" value={formData.defendantZipCode} onChange={(e) => handleInputChange("defendantZipCode", formatCep(e.target.value))} onBlur={() => handleCepBlur("defendant")} />
                      {loadingCep === "defendant" && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-rose-500" />}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ENDEREÇO DO RÉU</Label>
                    <Input placeholder="AV, RUA, ETC..." className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase" value={formData.defendantAddress} onChange={(e) => handleInputChange("defendantAddress", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NÚMERO</Label>
                    <Input placeholder="SN" className="bg-black/40 border-white/10 h-14 text-white font-bold" value={formData.defendantNumber} onChange={(e) => handleInputChange("defendantNumber", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">BAIRRO (RÉU)</Label>
                    <Input placeholder="BAIRRO..." className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase" value={formData.defendantNeighborhood} onChange={(e) => handleInputChange("defendantNeighborhood", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CIDADE (RÉU)</Label>
                    <Input placeholder="CIDADE..." className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase" value={formData.defendantCity} onChange={(e) => handleInputChange("defendantCity", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">UF</Label>
                    <Input placeholder="SP" maxLength={2} className="bg-black/40 border-white/10 h-14 text-white font-black text-center" value={formData.defendantState} onChange={(e) => handleInputChange("defendantState", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>

              {/* OBJETO DA DEMANDA */}
              <div className="space-y-8">
                <SectionLabel icon={ShieldCheck} color="text-primary">Fatos e Objeto da Demanda</SectionLabel>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TÍTULO DA DEMANDA / OBJETO</Label>
                    <Input placeholder="EX: RECLAMAÇÃO TRABALHISTA - HORAS EXTRAS E ASSÉDIO..." className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase" value={formData.demandTitle} onChange={(e) => handleInputChange("demandTitle", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">BRIEFING INICIAL (RELATO DOS FATOS)</Label>
                    <Textarea placeholder="DESCREVA AQUI O RELATO DO CLIENTE E AS TESES INICIAIS..." className="bg-black/40 border-white/10 min-h-[200px] text-white text-sm leading-relaxed uppercase resize-none" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-8 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
        <Button variant="ghost" className="text-muted-foreground hover:text-white font-black uppercase tracking-widest text-[11px] px-8 h-12" onClick={onCancel}>CANCELAR OPERAÇÃO</Button>
        <Button onClick={handleSubmit} className="w-[320px] gold-gradient text-background font-black h-16 text-[12px] uppercase tracking-widest shadow-2xl rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
          <ShieldCheck className="h-6 w-6" /> 
          {initialData ? "ATUALIZAR FICHA TÉCNICA" : "PROTOCOLAR ATENDIMENTO"}
        </Button>
      </div>

      <Dialog open={isQuickRegOpen} onOpenChange={setIsQuickRegOpen}>
        <DialogContent className="bg-[#0a0f1e] border-white/10 sm:max-w-[550px] p-0 overflow-hidden shadow-2xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Injetar Novo Lead</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome</Label>
                <Input value={quickRegData.firstName} onChange={(e) => setQuickRegData({...quickRegData, firstName: e.target.value.toUpperCase()})} className="bg-black/40 border-white/10 h-12 text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Sobrenome</Label>
                <Input value={quickRegData.lastName} onChange={(e) => setQuickRegData({...quickRegData, lastName: e.target.value.toUpperCase()})} className="bg-black/40 border-white/10 h-12 text-white rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">WhatsApp Principal</Label>
              <Input value={quickRegData.whatsapp} onChange={(e) => setQuickRegData({...quickRegData, whatsapp: formatPhone(e.target.value)})} className="bg-black/40 border-white/10 h-12 text-white rounded-xl" />
            </div>
          </div>
          <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" className="text-muted-foreground font-black uppercase text-[11px]" onClick={() => setIsQuickRegOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveQuickClient} className="bg-primary text-background font-black h-12 px-10 uppercase text-[11px] rounded-xl shadow-lg">Confirmar Entrada</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
