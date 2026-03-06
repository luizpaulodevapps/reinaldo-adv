
"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  Loader2, 
  Building, 
  User, 
  MapPin, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Fingerprint,
  FileText,
  Gavel,
  Scale,
  Calendar,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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
  onCancel: () => void
  defaultResponsibleLawyer?: string
  initialData?: any
  initialMode?: "quick" | "complete"
  lockMode?: boolean
}

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

// BASE DE DADOS TÁTICA RGMJ - ENDEREÇOS DE TRIBUNAIS
const FORUM_DATABASE: Record<string, any> = {
  "VARA DO TRABALHO DE DIADEMA": {
    zipCode: "09911-160",
    address: "AVENIDA ANTÔNIO PIRANGA",
    number: "1162",
    neighborhood: "CENTRO",
    city: "DIADEMA",
    state: "SP"
  },
  "VARA DO TRABALHO DE SÃO BERNARDO DO CAMPO": {
    zipCode: "09751-250",
    address: "AVENIDA GETÚLIO VARGAS",
    number: "57",
    neighborhood: "BAETA NEVES",
    city: "SÃO BERNARDO DO CAMPO",
    state: "SP"
  },
  "VARA DO TRABALHO DE SANTO ANDRÉ": {
    zipCode: "09080-000",
    address: "AVENIDA DOM PEDRO II",
    number: "555",
    neighborhood: "JARDIM",
    city: "SANTO ANDRÉ",
    state: "SP"
  },
  "VARA DO TRABALHO DE SÃO CAETANO DO SUL": {
    zipCode: "09521-160",
    address: "RUA MANOEL COELHO",
    number: "600",
    neighborhood: "CENTRO",
    city: "SÃO CAETANO DO SUL",
    state: "SP"
  },
  "FÓRUM TRABALHISTA RUY BARBOSA (BARRA FUNDA)": {
    zipCode: "01133-020",
    address: "AVENIDA DR. ABRÃO RIBEIRO",
    number: "313",
    neighborhood: "BOM RETIRO",
    city: "SÃO PAULO",
    state: "SP"
  },
  "FÓRUM TRABALHISTA DA ZONA SUL (SP)": {
    zipCode: "04795-100",
    address: "AVENIDA DAS NAÇÕES UNIDAS",
    number: "22939",
    neighborhood: "VILA ALMEIDA",
    city: "SÃO PAULO",
    state: "SP"
  },
  "FÓRUM TRABALHISTA DA ZONA LESTE (SP)": {
    zipCode: "03064-000",
    address: "AVENIDA CELSO GARCIA",
    number: "3500",
    neighborhood: "TATUAPÉ",
    city: "SÃO PAULO",
    state: "SP"
  }
}

const COMMON_COURTS = [
  "VARA DO TRABALHO DE DIADEMA",
  "VARA DO TRABALHO DE SÃO BERNARDO DO CAMPO",
  "VARA DO TRABALHO DE SANTO ANDRÉ",
  "VARA DO TRABALHO DE SÃO CAETANO DO SUL",
  "FÓRUM TRABALHISTA RUY BARBOSA (BARRA FUNDA)",
  "FÓRUM TRABALHISTA DA ZONA SUL (SP)",
  "FÓRUM TRABALHISTA DA ZONA LESTE (SP)",
  "TRT 2ª REGIÃO (SP-CAPITAL)",
  "TRT 15ª REGIÃO (CAMPINAS)",
  "TRT 1ª REGIÃO (RJ)",
  "TRT 3ª REGIÃO (MG)",
  "TRT 4ª REGIÃO (RS)",
  "TJSP - TRIBUNAL DE JUSTIÇA DE SÃO PAULO"
]

export function LeadForm({ 
  existingLeads, 
  onSubmit, 
  onSelectExisting, 
  onCancel,
  defaultResponsibleLawyer, 
  initialData, 
  initialMode = "complete", 
  lockMode = false 
}: LeadFormProps) {
  const [activeTab, setActiveTab] = useState("autor")
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [loadingCep, setLoadingCep] = useState<"client" | "defendant" | "court" | null>(null)
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
    rgIssuer: "",
    rgState: "",
    rgIssueDate: "",
    maritalStatus: "Solteiro(a)",
    profession: "",
    zipCode: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    defendantName: "",
    defendantDocument: "",
    defendantZipCode: "",
    defendantAddress: "",
    defendantNumber: "",
    defendantComplement: "",
    defendantNeighborhood: "",
    defendantCity: "",
    defendantState: "",
    court: "",
    vara: "",
    courtZipCode: "",
    courtAddress: "",
    courtNumber: "",
    courtComplement: "",
    courtNeighborhood: "",
    courtCity: "",
    courtState: "",
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
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  const handleCepBlur = async (type: "client" | "defendant" | "court") => {
    let cep = ""
    if (type === "client") cep = formData.zipCode.replace(/\D/g, "")
    else if (type === "defendant") cep = formData.defendantZipCode.replace(/\D/g, "")
    else if (type === "court") cep = formData.courtZipCode.replace(/\D/g, "")
    
    if (cep.length !== 8) return

    setLoadingCep(type)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        const updateMap: any = {
          client: { address: 'address', neighborhood: 'neighborhood', city: 'city', state: 'state' },
          defendant: { address: 'defendantAddress', neighborhood: 'defendantNeighborhood', city: 'defendantCity', state: 'defendantState' },
          court: { address: 'courtAddress', neighborhood: 'courtNeighborhood', city: 'courtCity', state: 'courtState' }
        }
        const map = updateMap[type]
        setFormData(prev => ({
          ...prev,
          [map.address]: data.logradouro.toUpperCase(),
          [map.neighborhood]: data.bairro.toUpperCase(),
          [map.city]: data.localidade.toUpperCase(),
          [map.state]: data.uf.toUpperCase()
        }))
      }
    } catch (error) {
      console.error("CEP fetch error")
    } finally {
      setLoadingCep(null)
    }
  }

  const handleCourtChange = (value: string) => {
    const upperVal = value.toUpperCase()
    handleInputChange("court", upperVal)
    
    // Busca Inteligente de Fórum (RGMJ Exclusive Database)
    const forum = FORUM_DATABASE[upperVal]
    if (forum) {
      setFormData(prev => ({
        ...prev,
        courtZipCode: forum.zipCode,
        courtAddress: forum.address,
        courtNumber: forum.number,
        courtNeighborhood: forum.neighborhood,
        courtCity: forum.city,
        courtState: forum.state
      }))
      toast({ 
        title: "Endereço do Fórum Localizado", 
        description: "A logística da unidade foi preenchida automaticamente." 
      })
    }
  }

  const filteredLeads = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return []
    return (existingLeads || []).filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (l.phone && l.phone.includes(searchTerm)) ||
      (l.cpf && l.cpf.includes(searchTerm))
    )
  }, [searchTerm, existingLeads])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSelectLead = (lead: Lead) => {
    onSelectExisting(lead)
    setIsSearchOpen(false)
  }

  const handleSubmit = () => {
    const finalName = formData.name || searchTerm
    if (!finalName?.trim() || !formData.phone?.trim()) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Nome e Telefone são essenciais para a banca." })
      return
    }
    onSubmit({ ...formData, name: finalName })
  }

  const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode, icon: any }) => (
    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/5">
      <Icon className="h-4 w-4 text-primary" />
      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.25em]">{children}</h4>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] font-sans overflow-hidden">
      <div className="px-10 pt-8 pb-4 flex-none">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1a1f2e] w-full p-1 h-14 rounded-xl gap-1">
            <TabsTrigger value="autor" className="flex-1 text-[10px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-lg gap-2 h-full transition-all">
              <User className="h-3.5 w-3.5" /> AUTOR (CLIENTE)
            </TabsTrigger>
            <TabsTrigger value="reu" className="flex-1 text-[10px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-lg gap-2 h-full transition-all">
              <Building className="h-3.5 w-3.5" /> RÉU (PARTE CONTRÁRIA)
            </TabsTrigger>
            <TabsTrigger value="demanda" className="flex-1 text-[10px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-lg gap-2 h-full transition-all">
              <Scale className="h-3.5 w-3.5" /> DADOS DA DEMANDA
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-10 py-6 max-w-5xl mx-auto space-y-12 pb-32">
          
          {activeTab === "autor" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="space-y-6">
                <SectionTitle icon={Fingerprint}>Identificação & Contato</SectionTitle>
                <div className="relative" ref={searchRef}>
                  <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-2 block">Nome Completo (Conforme Documento) *</Label>
                  <div className="relative" onClick={() => !lockMode && setIsSearchOpen(true)}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
                    <div className={cn(
                      "pl-12 bg-black/40 border border-white/10 rounded-xl h-14 flex items-center text-white text-sm font-bold uppercase transition-all",
                      !lockMode && "hover:border-primary/50 cursor-pointer",
                      lockMode && "opacity-60 cursor-not-allowed"
                    )}>
                      {formData.name || searchTerm || "PESQUISAR OU INSERIR NOME..."}
                    </div>
                  </div>

                  {isSearchOpen && !lockMode && (
                    <div className="absolute z-50 w-full mt-2 bg-[#0a0f1e] border border-primary/20 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95">
                      <div className="p-4 border-b border-white/5">
                        <Input placeholder="Digitar nome para busca..." autoFocus className="bg-black/40 border-primary/20 h-12 text-white uppercase font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                      <ScrollArea className="max-h-[300px]">
                        {filteredLeads.length > 0 ? (
                          filteredLeads.map(lead => (
                            <button key={lead.id} onClick={() => handleSelectLead(lead)} className="w-full p-5 flex items-center justify-between hover:bg-primary/10 border-b border-white/5 last:border-0 transition-colors">
                              <div className="text-left">
                                <p className="font-black text-white text-xs uppercase">{lead.name}</p>
                                <p className="text-[9px] text-muted-foreground font-mono mt-1">{lead.phone} • {lead.cpf || 'SEM CPF'}</p>
                              </div>
                              <Badge variant="outline" className="text-[8px] font-black border-primary/30 text-primary uppercase">Selecionar</Badge>
                            </button>
                          ))
                        ) : (
                          <div className="p-10 text-center opacity-40"><p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Nenhum registro encontrado</p></div>
                        )}
                      </ScrollArea>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">WhatsApp *</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/40" />
                      <Input placeholder="(00) 00000-0000" className="pl-12 bg-black/40 border border-white/10 h-14 text-white font-bold rounded-xl" value={formData.phone} onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">E-mail Corporativo/Pessoal</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                      <Input placeholder="CLIENTE@EMAIL.COM" className="pl-12 bg-black/40 border border-white/10 h-14 text-white font-bold rounded-xl lowercase" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <SectionTitle icon={FileText}>Qualificação & Documentação</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CPF / CNPJ</Label>
                    <Input placeholder="000.000.000-00" className="bg-black/40 border-white/10 h-14 text-white font-mono" value={formData.cpf} onChange={(e) => handleInputChange("cpf", formatCpfCnpj(e.target.value))} />
                  </div>
                  
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">RG / Número</Label>
                      <Input placeholder="00.000.000-0" className="bg-black/40 border-white/10 h-14 text-white font-mono" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Emissor</Label>
                      <Input placeholder="SSP" className="bg-black/40 border-white/10 h-14 text-white font-black text-center" value={formData.rgIssuer} onChange={(e) => handleInputChange("rgIssuer", e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">UF</Label>
                      <Select value={formData.rgState} onValueChange={(v) => handleInputChange("rgState", v)}>
                        <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white font-black text-center text-xs">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d121f] text-white">
                          {BRAZIL_STATES.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Data de Emissão (RG)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                      <Input type="date" className="pl-12 bg-black/40 border border-white/10 h-14 text-white" value={formData.rgIssueDate} onChange={(e) => handleInputChange("rgIssueDate", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Estado Civil</Label>
                    <Select value={formData.maritalStatus} onValueChange={(v) => handleInputChange("maritalStatus", v)}>
                      <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white font-bold text-xs uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0d121f] text-white">
                        {["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"].map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1 space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Profissão Atual</Label>
                    <Input placeholder="EX: ENGENHEIRO MECÂNICO" className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase" value={formData.profession} onChange={(e) => handleInputChange("profession", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <SectionTitle icon={MapPin}>Endereço Residencial</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CEP</Label>
                    <div className="relative">
                      <Input placeholder="00000-000" className="bg-black/40 border border-white/10 h-14 text-white font-mono rounded-xl focus:ring-primary/50" value={formData.zipCode} onChange={(e) => handleInputChange("zipCode", formatCep(e.target.value))} onBlur={() => handleCepBlur("client")} />
                      {loadingCep === "client" && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Logradouro</Label>
                    <Input placeholder="AVENIDA, RUA, ETC..." className="bg-black/40 border border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Número</Label>
                    <Input placeholder="123" className="bg-black/40 border border-white/10 h-14 text-white font-bold rounded-xl" value={formData.number} onChange={(e) => handleInputChange("number", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Bairro</Label>
                    <Input className="bg-black/40 border border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.neighborhood} onChange={(e) => handleInputChange("neighborhood", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Cidade</Label>
                    <Input className="bg-black/40 border border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">UF</Label>
                    <Input maxLength={2} className="bg-black/40 border border-white/10 h-14 text-white font-black text-center rounded-xl" value={formData.state} onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reu" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-8">
                <SectionTitle icon={Building}>Dados da Parte Contrária (Réu)</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Razão Social / Nome Oficial *</Label>
                    <Input placeholder="NOME DO RÉU OU EMPRESA..." className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.defendantName} onChange={(e) => handleInputChange("defendantName", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CNPJ / CPF do Réu</Label>
                    <Input placeholder="00.000.000/0000-00" className="bg-black/40 border-white/10 h-14 text-white font-mono rounded-xl" value={formData.defendantDocument} onChange={(e) => handleInputChange("defendantDocument", formatCpfCnpj(e.target.value))} />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <SectionTitle icon={MapPin}>Endereço para Citação</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CEP (Réu)</Label>
                    <div className="relative">
                      <Input placeholder="00000-000" className="bg-black/40 border border-white/10 h-14 text-white font-mono rounded-xl" value={formData.defendantZipCode} onChange={(e) => handleInputChange("defendantZipCode", formatCep(e.target.value))} onBlur={() => handleCepBlur("defendant")} />
                      {loadingCep === "defendant" && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-rose-500" />}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Logradouro</Label>
                    <Input placeholder="AVENIDA, RUA, ETC..." className="bg-black/40 border border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.defendantAddress} onChange={(e) => handleInputChange("defendantAddress", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Número</Label>
                    <Input placeholder="123" className="bg-black/40 border border-white/10 h-14 text-white font-bold rounded-xl" value={formData.defendantNumber} onChange={(e) => handleInputChange("defendantNumber", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Bairro</Label>
                    <Input className="bg-black/40 border border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.defendantNeighborhood} onChange={(e) => handleInputChange("defendantNeighborhood", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Cidade</Label>
                    <Input className="bg-black/40 border border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.defendantCity} onChange={(e) => handleInputChange("defendantCity", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">UF</Label>
                    <Input maxLength={2} className="bg-black/40 border border-white/10 h-14 text-white font-black text-center rounded-xl" value={formData.defendantState} onChange={(e) => handleInputChange("defendantState", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "demanda" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-8">
                <SectionTitle icon={Gavel}>Objeto da Ação & Jurisdição</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Título da Demanda (Objeto)</Label>
                    <Input placeholder="EX: RECLAMAÇÃO TRABALHISTA - HORAS EXTRAS" className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.demandTitle} onChange={(e) => handleInputChange("demandTitle", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Área Jurídica</Label>
                    <Select value={formData.type} onValueChange={(v) => handleInputChange("type", v)}>
                      <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white font-black text-[10px] uppercase rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0d121f] text-white">
                        {["Trabalhista", "Cível", "Criminal", "Previdenciário", "Tributário"].map(a => <SelectItem key={a} value={a}>{a.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Scale className="h-3 w-3" /> Tribunal / Fórum Sugerido
                    </Label>
                    <div className="relative group">
                      <Input 
                        placeholder="PESQUISAR NOME DO FÓRUM (EX: DIADEMA, BARRA FUNDA...)" 
                        list="court-suggestions"
                        className="bg-black/40 border-primary/20 h-14 text-white font-black uppercase text-xs focus:border-primary transition-all rounded-xl" 
                        value={formData.court} 
                        onChange={(e) => handleCourtChange(e.target.value)} 
                      />
                      <datalist id="court-suggestions">
                        {COMMON_COURTS.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Gavel className="h-3 w-3" /> Vara / Unidade
                    </Label>
                    <Input placeholder="EX: 45ª VARA DO TRABALHO" className="bg-black/40 border-primary/20 h-14 text-white font-black uppercase text-xs focus:border-primary transition-all rounded-xl" value={formData.vara} onChange={(e) => handleInputChange("vara", e.target.value.toUpperCase())} />
                  </div>
                </div>

                {/* ENDEREÇO DO FÓRUM */}
                <div className="space-y-6 pt-4">
                  <SectionTitle icon={MapPin}>Endereço do Fórum / Tribunal</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1 space-y-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CEP (Fórum)</Label>
                      <div className="relative">
                        <Input placeholder="00000-000" className="bg-black/40 border border-white/10 h-14 text-white font-mono rounded-xl focus:ring-primary/50" value={formData.courtZipCode} onChange={(e) => handleInputChange("courtZipCode", formatCep(e.target.value))} onBlur={() => handleCepBlur("court")} />
                        {loadingCep === "court" && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Logradouro (Fórum)</Label>
                      <Input placeholder="AVENIDA, RUA, ETC..." className="bg-black/40 border border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.courtAddress} onChange={(e) => handleInputChange("courtAddress", e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Número</Label>
                      <Input placeholder="123" className="bg-black/40 border border-white/10 h-14 text-white font-bold rounded-xl" value={formData.courtNumber} onChange={(e) => handleInputChange("courtNumber", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Bairro</Label>
                      <Input className="bg-black/40 border border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.courtNeighborhood} onChange={(e) => handleInputChange("courtNeighborhood", e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Cidade</Label>
                      <Input className="bg-black/40 border border-white/10 h-14 text-white font-bold uppercase rounded-xl" value={formData.courtCity} onChange={(e) => handleInputChange("courtCity", e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">UF</Label>
                      <Input maxLength={2} className="bg-black/40 border border-white/10 h-14 text-white font-black text-center rounded-xl" value={formData.courtState} onChange={(e) => handleInputChange("courtState", e.target.value.toUpperCase())} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Relato dos Fatos (Breve Resumo)</Label>
                  <Textarea placeholder="DESCREVA AQUI O RELATO TÉCNICO DO CLIENTE..." className="bg-black/40 border-white/10 min-h-[200px] text-white text-sm leading-relaxed uppercase resize-none rounded-xl" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value.toUpperCase())} />
                </div>
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      <div className="p-8 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 flex-none">
        <Button variant="ghost" className="text-muted-foreground hover:text-white font-black uppercase tracking-widest text-[10px] px-8 h-12" onClick={onCancel}>CANCELAR OPERAÇÃO</Button>
        <Button onClick={handleSubmit} className="w-[350px] gold-gradient text-background font-black h-16 text-[11px] uppercase tracking-[0.2em] shadow-2xl rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
          <ShieldCheck className="h-6 w-6" /> 
          {initialData ? "SALVAR ALTERAÇÕES TÁTICAS" : "PROTOCOLAR NOVO CLIENTE"}
        </Button>
      </div>
    </div>
  )
}
