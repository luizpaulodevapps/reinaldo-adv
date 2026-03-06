
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
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
  Database,
  Save,
  ExternalLink,
  Lock,
  Unlock,
  Library
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, where, serverTimestamp } from "firebase/firestore"

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
  
  const [courtSearchTerm, setCourtSearchTerm] = useState("")
  const [isCourtSearchOpen, setIsCourtSearchOpen] = useState(false)
  const [isManualAddressEntry, setIsManualAddressEntry] = useState(false)
  const [loadingCep, setLoadingCep] = useState<"client" | "defendant" | "court" | null>(null)
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const courtSearchRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()

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
    courtMapsLink: "",
    value: ""
  })

  const courtsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "courts"), orderBy("name", "asc"))
  }, [db])
  const { data: dbCourts } = useCollection(courtsQuery)

  const filteredCourts = useMemo(() => {
    if (!courtSearchTerm || courtSearchTerm.length < 2) return []
    return (dbCourts || []).filter(c => 
      c.name.toLowerCase().includes(courtSearchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(courtSearchTerm.toLowerCase())
    )
  }, [courtSearchTerm, dbCourts])

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        name: initialData.name || ""
      }))
      setSearchTerm(initialData.name || "")
      if (initialData.court) {
        setCourtSearchTerm(initialData.court)
        setIsManualAddressEntry(false)
      }
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

  const handleSelectCourt = (court: any) => {
    setFormData(prev => ({
      ...prev,
      court: court.name,
      courtZipCode: court.zipCode || "",
      courtAddress: court.address || "",
      courtNumber: court.number || "",
      courtComplement: court.complement || "",
      courtNeighborhood: court.neighborhood || "",
      courtCity: court.city || "",
      courtState: court.state || "",
      courtMapsLink: court.mapsLink || ""
    }))
    setCourtSearchTerm(court.name)
    setIsCourtSearchOpen(false)
    setIsManualAddressEntry(false)
    toast({ title: "Órgão Selecionado" })
  }

  const handleSaveCourtToDatabase = async () => {
    const finalName = (formData.court || courtSearchTerm || "").trim()
    if (!db || !finalName) {
      toast({ variant: "destructive", title: "Nome obrigatório" })
      return
    }
    setIsSavingToDatabase(true)
    try {
      await addDocumentNonBlocking(collection(db, "courts"), {
        name: finalName.toUpperCase(),
        zipCode: formData.courtZipCode,
        address: formData.courtAddress,
        number: formData.courtNumber,
        neighborhood: formData.courtNeighborhood,
        city: formData.courtCity,
        state: formData.courtState,
        mapsLink: formData.courtMapsLink || generateMapsLink(),
        createdBy: user?.uid,
        createdAt: serverTimestamp()
      })
      toast({ title: "Fórum Salvo na Base" })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar" })
    } finally {
      setIsSavingToDatabase(false)
    }
  }

  const generateMapsLink = () => {
    const { courtAddress, courtNumber, courtCity, courtState } = formData
    if (!courtAddress || !courtCity) return ""
    const query = encodeURIComponent(`${courtAddress} ${courtNumber} ${courtCity} ${courtState}`)
    return `https://www.google.com/maps/search/?api=1&query=${query}`
  }

  const handleOpenMaps = () => {
    const link = formData.courtMapsLink || generateMapsLink()
    if (link) window.open(link, "_blank")
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
      toast({ variant: "destructive", title: "Campos Obrigatórios", description: "Nome e WhatsApp são pilares RGMJ." })
      return
    }
    onSubmit({ ...formData, name: finalName, courtMapsLink: formData.courtMapsLink || generateMapsLink() })
  }

  const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode, icon: any }) => (
    <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/5">
      <Icon className="h-6 w-6 text-primary" />
      <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">{children}</h4>
    </div>
  )

  const isFieldDisabled = (fieldName: string) => {
    if (isManualAddressEntry) return false
    const isCourtFromDb = dbCourts?.some(c => c.name === formData.court)
    return isCourtFromDb && !!formData[fieldName as keyof typeof formData]
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] font-sans overflow-hidden">
      <div className="px-12 pt-10 pb-6 flex-none bg-[#0a0f1e]/50 border-b border-white/5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1a1f2e] w-full p-1.5 h-16 rounded-2xl gap-2">
            <TabsTrigger value="autor" className="flex-1 text-xs uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-xl gap-3 h-full transition-all tracking-widest">
              <User className="h-5 w-5" /> AUTOR (CLIENTE)
            </TabsTrigger>
            <TabsTrigger value="reu" className="flex-1 text-xs uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-xl gap-3 h-full transition-all tracking-widest">
              <Building className="h-5 w-5" /> RÉU (PARTE CONTRÁRIA)
            </TabsTrigger>
            <TabsTrigger value="demanda" className="flex-1 text-xs uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-xl gap-3 h-full transition-all tracking-widest">
              <Scale className="h-5 w-5" /> DADOS DA DEMANDA
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 min-h-0 bg-[#0a0f1e]/20">
        <div className="px-12 py-12 max-w-6xl mx-auto space-y-16 pb-40">
          
          {activeTab === "autor" && (
            <div className="space-y-16 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="space-y-10">
                <SectionTitle icon={Fingerprint}>Identificação & Contato Estratégico</SectionTitle>
                <div className="relative" ref={searchRef}>
                  <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-3 block">Nome Completo (Conforme Documento) *</Label>
                  <div className="relative" onClick={() => !lockMode && setIsSearchOpen(true)}>
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                    <div className={cn(
                      "pl-14 bg-black/40 border-2 border-white/5 rounded-2xl h-20 flex items-center text-lg font-black text-white uppercase transition-all shadow-inner",
                      !lockMode && "hover:border-primary/40 cursor-pointer",
                      lockMode && "opacity-60 cursor-not-allowed"
                    )}>
                      {formData.name || searchTerm || "PESQUISAR OU INSERIR NOME DO LEAD..."}
                    </div>
                  </div>

                  {isSearchOpen && !lockMode && (
                    <div className="absolute z-50 w-full mt-3 bg-[#0a0f1e] border-2 border-primary/30 shadow-[0_30px_60px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95">
                      <div className="p-6 border-b border-white/5 bg-black/20">
                        <Input placeholder="Digitar nome para busca na base..." autoFocus className="bg-black/40 border-primary/20 h-14 text-white uppercase font-black text-base px-6 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                      <ScrollArea className="max-h-[400px]">
                        {filteredLeads.length > 0 ? (
                          filteredLeads.map(lead => (
                            <button key={lead.id} onClick={() => handleSelectLead(lead)} className="w-full p-8 flex items-center justify-between hover:bg-primary/10 border-b border-white/5 last:border-0 transition-colors">
                              <div className="text-left space-y-1">
                                <p className="font-black text-white text-base uppercase tracking-tight">{lead.name}</p>
                                <p className="text-xs text-muted-foreground font-mono font-bold tracking-widest">{lead.phone} • {lead.cpf || 'SEM CPF'}</p>
                              </div>
                              <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary uppercase px-4 py-1.5">VINCULAR</Badge>
                            </button>
                          ))
                        ) : (
                          <div className="p-16 text-center opacity-40"><p className="text-xs font-black text-muted-foreground uppercase tracking-[0.4em]">Nenhum registro tático encontrado</p></div>
                        )}
                      </ScrollArea>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">WhatsApp Direct *</Label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500/60" />
                      <Input placeholder="(00) 00000-0000" className="pl-14 bg-black/40 border-2 border-white/5 h-16 text-lg font-black text-white rounded-2xl shadow-inner" value={formData.phone} onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">E-mail de Notificação</Label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                      <Input placeholder="CLIENTE@EMAIL.COM" className="pl-14 bg-black/40 border-2 border-white/5 h-16 text-lg font-black text-white rounded-2xl shadow-inner lowercase" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <SectionTitle icon={FileText}>Qualificação Jurídica</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">CPF / CNPJ</Label>
                    <Input placeholder="000.000.000-00" className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-mono font-black rounded-2xl" value={formData.cpf} onChange={(e) => handleInputChange("cpf", formatCpfCnpj(e.target.value))} />
                  </div>
                  
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 space-y-3">
                      <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">RG / Número</Label>
                      <Input placeholder="00.000.000-0" className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-mono font-black rounded-2xl" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Emissor</Label>
                      <Input placeholder="SSP" className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-black text-center rounded-2xl" value={formData.rgIssuer} onChange={(e) => handleInputChange("rgIssuer", e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">UF RG</Label>
                      <Select value={formData.rgState} onValueChange={(v) => handleInputChange("rgState", v)}>
                        <SelectTrigger className="bg-black/40 border-2 border-white/5 h-16 text-white font-black text-center text-sm rounded-2xl">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d121f] text-white">
                          {BRAZIL_STATES.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Data Emissão RG</Label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                      <Input type="date" className="pl-14 bg-black/40 border-2 border-white/5 h-16 text-base text-white font-black rounded-2xl" value={formData.rgIssueDate} onChange={(e) => handleInputChange("rgIssueDate", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Estado Civil</Label>
                    <Select value={formData.maritalStatus} onValueChange={(v) => handleInputChange("maritalStatus", v)}>
                      <SelectTrigger className="bg-black/40 border-2 border-white/5 h-16 text-white font-black text-sm uppercase rounded-2xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0d121f] text-white">
                        {["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"].map(status => <SelectItem key={status} value={status}>{status.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Profissão Oficial</Label>
                    <Input placeholder="EX: ENGENHEIRO DE DADOS" className="bg-black/40 border-2 border-white/5 h-16 text-base text-white font-black uppercase rounded-2xl" value={formData.profession} onChange={(e) => handleInputChange("profession", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <SectionTitle icon={MapPin}>Logística Residencial (Citação)</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                  <div className="md:col-span-1 space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">CEP Postal</Label>
                    <div className="relative">
                      <Input placeholder="00000-000" className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-mono font-black rounded-2xl focus:ring-primary/50 shadow-inner" value={formData.zipCode} onChange={(e) => handleInputChange("zipCode", formatCep(e.target.value))} onBlur={() => handleCepBlur("client")} />
                      {loadingCep === "client" && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 animate-spin text-primary" />}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Logradouro / Avenida</Label>
                    <Input placeholder="ENDEREÇO COMPLETO..." className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-black uppercase rounded-2xl shadow-inner" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Número</Label>
                    <Input placeholder="123" className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-black rounded-2xl text-center shadow-inner" value={formData.number} onChange={(e) => handleInputChange("number", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Bairro</Label>
                    <Input className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-black uppercase rounded-2xl shadow-inner" value={formData.neighborhood} onChange={(e) => handleInputChange("neighborhood", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Cidade</Label>
                    <Input className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-black uppercase rounded-2xl shadow-inner" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">UF</Label>
                    <Input maxLength={2} className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-black text-center rounded-2xl shadow-inner" value={formData.state} onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reu" && (
            <div className="space-y-16 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="space-y-10">
                <SectionTitle icon={Building}>Dados da Parte Contrária (Polo Passivo)</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Razão Social / Nome Fantasia *</Label>
                    <Input placeholder="NOME DO RÉU OU EMPRESA..." className="bg-black/40 border-2 border-white/5 h-20 text-xl font-black text-white uppercase rounded-2xl shadow-2xl" value={formData.defendantName} onChange={(e) => handleInputChange("defendantName", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">CNPJ / CPF do Réu</Label>
                    <Input placeholder="00.000.000/0000-00" className="bg-black/40 border-2 border-white/5 h-20 text-xl font-black text-white font-mono rounded-2xl shadow-2xl" value={formData.defendantDocument} onChange={(e) => handleInputChange("defendantDocument", formatCpfCnpj(e.target.value))} />
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <SectionTitle icon={MapPin}>Endereço do Réu (Para Citação)</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                  <div className="md:col-span-1 space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">CEP Postal (Réu)</Label>
                    <div className="relative">
                      <Input placeholder="00000-000" className="bg-black/40 border-2 border-white/5 h-16 text-lg font-black text-white font-mono rounded-2xl shadow-inner" value={formData.defendantZipCode} onChange={(e) => handleInputChange("defendantZipCode", formatCep(e.target.value))} onBlur={() => handleCepBlur("defendant")} />
                      {loadingCep === "defendant" && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 animate-spin text-rose-500" />}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Logradouro / Avenida</Label>
                    <Input placeholder="AVENIDA, RUA, ETC..." className="bg-black/40 border-2 border-white/5 h-16 text-lg font-black text-white uppercase rounded-2xl shadow-inner" value={formData.defendantAddress} onChange={(e) => handleInputChange("defendantAddress", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Número</Label>
                    <Input placeholder="123" className="bg-black/40 border-2 border-white/5 h-16 text-lg font-black text-white rounded-2xl text-center shadow-inner" value={formData.defendantNumber} onChange={(e) => handleInputChange("defendantNumber", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Bairro</Label>
                    <Input className="bg-black/40 border-2 border-white/5 h-16 text-lg font-black text-white uppercase rounded-2xl shadow-inner" value={formData.defendantNeighborhood} onChange={(e) => handleInputChange("neighborhood", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Cidade</Label>
                    <Input className="bg-black/40 border-2 border-white/5 h-16 text-lg font-black text-white uppercase rounded-2xl shadow-inner" value={formData.defendantCity} onChange={(e) => handleInputChange("defendantCity", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">UF</Label>
                    <Input maxLength={2} className="bg-black/40 border-2 border-white/5 h-16 text-lg font-black text-white text-center rounded-2xl shadow-inner" value={formData.defendantState} onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "demanda" && (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="space-y-10">
                <SectionTitle icon={FileText}>Identificação da Ação Judicial</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="md:col-span-2 space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Título da Demanda (Resumo do Objeto)</Label>
                    <Input placeholder="EX: RECLAMAÇÃO TRABALHISTA - HORAS EXTRAS E ASSÉDIO" className="bg-black/40 border-2 border-white/5 h-20 text-xl font-black text-white uppercase rounded-2xl shadow-2xl" value={formData.demandTitle} onChange={(e) => handleInputChange("demandTitle", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Área Jurídica Especializada</Label>
                    <Select value={formData.type} onValueChange={(v) => handleInputChange("type", v)}>
                      <SelectTrigger className="bg-black/40 border-2 border-white/5 h-20 text-white font-black text-sm uppercase rounded-2xl shadow-2xl px-8"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0d121f] text-white">
                        {["Trabalhista", "Cível", "Criminal", "Previdenciário", "Tributário"].map(area => <SelectItem key={area} value={area}>{area.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <SectionTitle icon={Gavel}>Logística de Unidade Judiciária</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4 relative" ref={courtSearchRef}>
                    <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-3">
                      <Database className="h-5 w-5" /> Órgão Judicial / Fórum
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-primary/40" />
                      <Input 
                        placeholder="Digite o nome do fórum ou comarca..." 
                        className="pl-16 bg-black/40 border-2 border-primary/20 h-20 text-white font-black uppercase text-base focus:border-primary transition-all rounded-2xl shadow-2xl" 
                        value={courtSearchTerm || formData.court} 
                        onChange={(e) => {
                          const val = e.target.value
                          setCourtSearchTerm(val)
                          setIsCourtSearchOpen(true)
                          handleInputChange("court", val.toUpperCase())
                        }}
                        onFocus={() => setIsCourtSearchOpen(true)}
                      />
                    </div>

                    {isCourtSearchOpen && courtSearchTerm.length >= 2 && (
                      <div className="absolute z-50 w-full mt-3 bg-[#0a0f1e] border-2 border-primary/30 shadow-[0_30px_60px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        <ScrollArea className="max-h-[350px]">
                          {filteredCourts.length > 0 ? (
                            filteredCourts.map(c => (
                              <button key={c.id} onClick={() => handleSelectCourt(c)} className="w-full p-8 flex items-center justify-between hover:bg-primary/10 border-b border-white/5 last:border-0 transition-colors">
                                <div className="text-left space-y-1">
                                  <p className="font-black text-white text-base uppercase tracking-tight">{c.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-black mt-1 uppercase tracking-widest">{c.city} - {c.state}</p>
                                </div>
                                <Badge variant="outline" className="text-[10px] font-black border-emerald-500/30 text-emerald-500 uppercase bg-emerald-500/5 px-4 py-1.5">BASE OFICIAL</Badge>
                              </button>
                            ))
                          ) : (
                            <div className="p-16 text-center opacity-40">
                              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.4em]">Órgão novo no radar da banca</p>
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-3">
                      <Scale className="h-5 w-5" /> Vara / Unidade Específica
                    </Label>
                    <Input placeholder="EX: 45ª VARA DO TRABALHO" className="bg-black/40 border-2 border-primary/20 h-20 text-white font-black uppercase text-base focus:border-primary transition-all rounded-2xl shadow-2xl px-8" value={formData.vara} onChange={(e) => handleInputChange("vara", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>

              <div className="space-y-10 p-12 rounded-[3rem] bg-white/[0.02] border-2 border-white/5 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
                  <SectionTitle icon={MapPin}>Endereço Estratégico do Juízo</SectionTitle>
                  <div className="flex gap-4 mb-8">
                    {!isManualAddressEntry && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsManualAddressEntry(true)}
                        className="h-12 text-[10px] font-black uppercase border-white/10 bg-white/5 gap-3 rounded-xl px-6"
                      >
                        <Unlock className="h-4 w-4" /> EDITAR MANUALMENTE
                      </Button>
                    )}
                    {isManualAddressEntry && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsManualAddressEntry(false)}
                        className="h-12 text-[10px] font-black uppercase border-emerald-500/20 bg-emerald-500/5 text-emerald-500 gap-3 rounded-xl px-6"
                      >
                        <Lock className="h-4 w-4" /> BLOQUEAR CAMPOS
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                  <div className="md:col-span-1 space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">CEP Judicial</Label>
                    <div className="relative">
                      <Input 
                        placeholder="00000-000" 
                        className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-mono font-black rounded-2xl focus:ring-primary/50 shadow-inner" 
                        value={formData.courtZipCode} 
                        disabled={isFieldDisabled("courtZipCode")}
                        onChange={(e) => handleInputChange("courtZipCode", formatCep(e.target.value))} 
                        onBlur={() => handleCepBlur("court")} 
                      />
                      {loadingCep === "court" && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 animate-spin text-primary" />}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Logradouro / Prédio</Label>
                    <div className="flex gap-3">
                      <Input 
                        placeholder="AVENIDA, RUA, ETC..." 
                        className="flex-1 bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-black uppercase rounded-2xl shadow-inner" 
                        value={formData.courtAddress} 
                        disabled={isFieldDisabled("courtAddress")}
                        onChange={(e) => handleInputChange("courtAddress", e.target.value.toUpperCase())} 
                      />
                      <Input 
                        placeholder="Nº" 
                        className="w-24 bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-black rounded-2xl text-center shadow-inner" 
                        value={formData.courtNumber} 
                        onChange={(e) => handleInputChange("courtNumber", e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Bairro Judicial</Label>
                    <Input 
                      className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-black uppercase rounded-2xl shadow-inner" 
                      value={formData.courtNeighborhood} 
                      disabled={isFieldDisabled("courtNeighborhood")}
                      onChange={(e) => handleInputChange("courtNeighborhood", e.target.value.toUpperCase())} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Comarca / Cidade</Label>
                    <Input 
                      className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-black uppercase rounded-2xl shadow-inner" 
                      value={formData.courtCity} 
                      disabled={isFieldDisabled("courtCity")}
                      onChange={(e) => handleInputChange("courtCity", e.target.value.toUpperCase())} 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">UF Estado</Label>
                    <Input 
                      maxLength={2} 
                      className="bg-black/40 border-2 border-white/5 h-16 text-lg text-white font-black text-center rounded-2xl shadow-inner" 
                      value={formData.courtState} 
                      disabled={isFieldDisabled("courtState")}
                      onChange={(e) => handleInputChange("courtState", e.target.value.toUpperCase())} 
                    />
                  </div>
                  <div className="flex flex-col justify-end gap-3">
                    <Label className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em]">Geolocalização</Label>
                    <Button 
                      type="button" 
                      onClick={handleOpenMaps} 
                      variant="outline" 
                      disabled={!formData.courtAddress}
                      className="h-16 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg"
                    >
                      <ExternalLink className="h-6 w-6 mr-3" /> ABRIR NO GOOGLE MAPS
                    </Button>
                  </div>
                </div>

                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                      <Library className="h-8 w-8" />
                    </div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest max-w-[400px] leading-relaxed">
                      Alimente a base estratégica da banca. Salve este fórum para acelerar futuros protocolos e garantir a uniformidade logística da equipe.
                    </p>
                  </div>
                  <Button 
                    type="button"
                    onClick={handleSaveCourtToDatabase}
                    disabled={isSavingToDatabase || !(formData.court || courtSearchTerm)}
                    className="w-full md:w-auto h-16 gold-gradient text-background font-black text-xs uppercase px-12 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all tracking-widest"
                  >
                    {isSavingToDatabase ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
                    SALVAR NA BIBLIOTECA RGMJ
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-10">
                <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Relato dos Fatos (DNA Técnico do Caso)</Label>
                <Textarea placeholder="DESCREVA AQUI O RELATO TÉCNICO E OS FUNDAMENTOS INICIAIS DA DEMANDA..." className="bg-black/40 border-2 border-white/5 min-h-[300px] text-white text-lg leading-relaxed uppercase resize-none rounded-[2.5rem] focus:ring-primary/50 shadow-2xl p-10" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value.toUpperCase())} />
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      <div className="p-10 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between shadow-[0_-20px_60px_rgba(0,0,0,0.6)] z-30 flex-none">
        <Button variant="ghost" className="text-muted-foreground hover:text-white font-black uppercase tracking-[0.3em] text-xs px-12 h-16 hover:bg-white/5 rounded-2xl" onClick={onCancel}>ABORTAR OPERAÇÃO</Button>
        <Button onClick={handleSubmit} className="w-[450px] gold-gradient text-background font-black h-20 text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(245,208,48,0.2)] rounded-[2rem] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
          <ShieldCheck className="h-8 w-8" /> 
          {initialData ? "SALVAR ALTERAÇÕES TÁTICAS" : "PROTOCOLAR NOVO ATENDIMENTO"}
        </Button>
      </div>
    </div>
  )
}
