
"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  Search, 
  Loader2, 
  Building, 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Fingerprint,
  FileText,
  Gavel,
  Scale,
  Calendar,
  Database,
  Save,
  ExternalLink,
  Lock,
  Unlock,
  Library,
  Navigation,
  ShieldCheck,
  UserPlus,
  CheckCircle2,
  Tag
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn, maskPhone, maskCEP, maskCPFOrCNPJ } from "@/lib/utils"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"

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
  lockMode = false 
}: LeadFormProps) {
  const [activeTab, setActiveTab] = useState("autor")
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [courtSearchTerm, setCourtSearchTerm] = useState("")
  const [isCourtSearchOpen, setIsCourtSearchOpen] = useState(false)
  const [loadingCep, setLoadingCep] = useState<"client" | "defendant" | "court" | null>(null)
  const [availableVaras, setAvailableVaras] = useState<any[]>([])

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
      if (courtSearchRef.current && !courtSearchRef.current.contains(event.target as Node)) {
        setIsCourtSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const courtsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "courts"), orderBy("name", "asc"))
  }, [db])
  const { data: dbCourts } = useCollection(courtsQuery)

  const filteredResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return []
    return (existingLeads || []).filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone?.includes(searchTerm) ||
      l.cpf?.includes(searchTerm) ||
      l.documentNumber?.includes(searchTerm)
    )
  }, [existingLeads, searchTerm])

  const filteredCourts = useMemo(() => {
    if (!courtSearchTerm || courtSearchTerm.length < 2) return []
    
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const term = normalize(courtSearchTerm)

    return (dbCourts || []).filter(c => {
      const matchesName = normalize(c.name).includes(term)
      const matchesCity = c.city ? normalize(c.city).includes(term) : false
      
      const areas = c.legalAreas || []
      const matchesArea = areas.length === 0 || areas.includes(formData.type)
      
      return (matchesName || matchesCity) && matchesArea
    })
  }, [courtSearchTerm, dbCourts, formData.type])

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData, name: initialData.name || "" }))
      setSearchTerm(initialData.name || "")
    }
  }, [initialData])

  // Efeito para sincronizar varas quando dbCourts carrega ou quando o court do formulário muda
  useEffect(() => {
    if (dbCourts && (formData.court || initialData?.court)) {
      const targetCourt = formData.court || initialData?.court
      const court = dbCourts.find(c => c.name === targetCourt)
      if (court) {
        setAvailableVaras(court.varas || [])
      }
    }
  }, [dbCourts, formData.court, initialData?.court])

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
    } catch (e) { console.error(e) } finally { setLoadingCep(null) }
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
    setAvailableVaras(court.varas || [])
    setIsCourtSearchOpen(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    const finalName = formData.name || searchTerm
    if (!finalName?.trim() || !formData.phone?.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "Nome e WhatsApp são pilares obrigatórios." })
      return
    }
    onSubmit({ ...formData, name: finalName })
  }

  const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode, icon: any }) => (
    <div className="flex items-center gap-2 mb-3 pb-1 border-b border-white/5">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{children}</h4>
    </div>
  )

  const inputClass = "bg-black/40 border-white/10 h-10 text-xs text-white uppercase font-bold focus:ring-primary/50"

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] font-sans overflow-hidden">
      <div className="px-6 pt-4 pb-1 flex-none bg-[#0a0f1e]/50 border-b border-white/5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1a1f2e] w-full p-1 h-10 rounded-lg gap-1">
            <TabsTrigger value="autor" className="flex-1 text-[9px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-md gap-2 h-full transition-all">
              <User className="h-3.5 w-3.5" /> POLO ATIVO
            </TabsTrigger>
            <TabsTrigger value="reu" className="flex-1 text-[9px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-md gap-2 h-full transition-all">
              <Building className="h-3.5 w-3.5" /> POLO PASSIVO
            </TabsTrigger>
            <TabsTrigger value="demanda" className="flex-1 text-[9px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-md gap-2 h-full transition-all">
              <Scale className="h-3.5 w-3.5" /> DEMANDA
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 bg-[#0a0f1e]/20">
        <div className="px-6 py-6 max-w-4xl mx-auto space-y-6 pb-32">
          
          {activeTab === "autor" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-4">
                <SectionTitle icon={Fingerprint}>Identificação do Autor</SectionTitle>
                <div className="space-y-1.5 relative" ref={searchRef}>
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nome do Cliente *</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="PESQUISAR OU INSERIR NOME..." 
                      className={cn(inputClass, "h-11 pl-12", lockMode && "opacity-60")} 
                      value={formData.name || searchTerm} 
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setIsSearchOpen(true)
                        if (formData.name) handleInputChange("name", "")
                      }}
                      onFocus={() => !lockMode && setIsSearchOpen(true)}
                      disabled={lockMode}
                    />
                  </div>

                  {isSearchOpen && searchTerm.length >= 2 && !lockMode && (
                    <div className="absolute z-50 w-full mt-2 bg-[#0a0f1e] border border-primary/20 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
                      <div className="max-h-[300px] overflow-y-auto">
                        {filteredResults.length > 0 ? (
                          filteredResults.map(l => (
                            <button 
                              type="button" 
                              key={l.id} 
                              onClick={() => onSelectExisting(l)} 
                              className="w-full p-4 flex items-center justify-between hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0 text-left group"
                            >
                              <div>
                                <p className="text-xs font-black text-white uppercase group-hover:text-primary transition-colors">{l.name}</p>
                                <p className="text-[9px] font-mono text-muted-foreground font-bold mt-1">{l.documentNumber || l.cpf || l.phone}</p>
                              </div>
                              <Badge variant="outline" className="text-[8px] font-black border-primary/30 text-primary uppercase">Selecionar</Badge>
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center opacity-40">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Nenhum registro encontrado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">WhatsApp Direct *</Label>
                    <Input 
                      className={inputClass} 
                      value={formData.phone} 
                      onChange={(e) => handleInputChange("phone", maskPhone(e.target.value))} 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">E-mail Principal</Label>
                    <Input className={cn(inputClass, "lowercase")} value={formData.email} onChange={(e) => handleInputChange("email", e.target.value.toLowerCase())} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <SectionTitle icon={FileText}>Qualificação Técnica</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">CPF / CNPJ</Label>
                    <Input 
                      className={cn(inputClass, "font-mono")} 
                      value={formData.cpf} 
                      onChange={(e) => handleInputChange("cpf", maskCPFOrCNPJ(e.target.value))} 
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">RG / Órgão</Label>
                    <Input className={inputClass} value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">Profissão Atual</Label>
                    <Input className={inputClass} value={formData.profession} onChange={(e) => handleInputChange("profession", e.target.value.toUpperCase())} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">CEP</Label>
                    <div className="relative">
                      <Input 
                        className={cn(inputClass, "font-mono")} 
                        value={formData.zipCode} 
                        onChange={(e) => handleInputChange("zipCode", maskCEP(e.target.value))} 
                        onBlur={() => handleCepBlur("client")}
                        placeholder="00000-000"
                      />
                      {loadingCep === 'client' && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">Logradouro</Label>
                    <Input className={inputClass} value={formData.address} onChange={(e) => handleInputChange("address", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">Nº</Label>
                    <Input className={inputClass} value={formData.number} onChange={(e) => handleInputChange("number", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reu" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <SectionTitle icon={Building}>Qualificação do Réu</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Razão Social / Nome *</Label>
                  <Input className={cn(inputClass)} value={formData.defendantName} onChange={(e) => handleInputChange("defendantName", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">CNPJ / CPF</Label>
                  <Input 
                    className={cn(inputClass, "font-mono")} 
                    value={formData.defendantDocument} 
                    onChange={(e) => handleInputChange("defendantDocument", maskCPFOrCNPJ(e.target.value))} 
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-white/5 pt-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">CEP Sede</Label>
                  <div className="relative">
                    <Input 
                      className={cn(inputClass, "font-mono")} 
                      value={formData.defendantZipCode} 
                      onChange={(e) => handleInputChange("defendantZipCode", maskCEP(e.target.value))} 
                      onBlur={() => handleCepBlur("defendant")}
                      placeholder="00000-000"
                    />
                    {loadingCep === 'defendant' && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Logradouro</Label>
                  <Input className={inputClass} value={formData.defendantAddress} onChange={(e) => handleInputChange("defendantAddress", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Nº</Label>
                  <Input className={inputClass} value={formData.defendantNumber} onChange={(e) => handleInputChange("defendantNumber", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "demanda" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <SectionTitle icon={Gavel}>Logística Judiciária</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Área Jurídica *</Label>
                  <Select value={formData.type} onValueChange={(v) => handleInputChange("type", v)}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      <SelectItem value="Trabalhista">⚖️ TRABALHISTA</SelectItem>
                      <SelectItem value="Cível">🏛️ CÍVEL</SelectItem>
                      <SelectItem value="Criminal">🚔 CRIMINAL</SelectItem>
                      <SelectItem value="Previdenciário">👴 PREVIDENCIÁRIO</SelectItem>
                      <SelectItem value="Tributário">💰 TRIBUTÁRIO</SelectItem>
                      <SelectItem value="Família">🏠 FAMÍLIA</SelectItem>
                      <SelectItem value="Empresarial">🏢 EMPRESARIAL</SelectItem>
                      <SelectItem value="Geral">🌐 GERAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Responsável Técnico</Label>
                  <Input className={inputClass} value={formData.responsibleLawyer} onChange={(e) => handleInputChange("responsibleLawyer", e.target.value.toUpperCase())} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="space-y-1.5 relative" ref={courtSearchRef}>
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <Library className="h-3 w-3" /> Órgão / Tribunal
                  </Label>
                  <div className="relative">
                    <Input 
                      placeholder="PESQUISAR FÓRUM..." 
                      className={cn(inputClass)} 
                      value={courtSearchTerm || formData.court} 
                      onChange={(e) => {
                        setCourtSearchTerm(e.target.value)
                        setIsCourtSearchOpen(true)
                        if (formData.court) handleInputChange("court", "")
                      }}
                      onFocus={() => setIsCourtSearchOpen(true)}
                    />
                  </div>

                  {isCourtSearchOpen && courtSearchTerm.length >= 2 && (
                    <div className="absolute z-50 w-full mt-2 bg-[#0a0f1e] border border-primary/20 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
                      <div className="max-h-[250px] overflow-y-auto">
                        {filteredCourts.length > 0 ? (
                          filteredCourts.map(c => (
                            <button type="button" key={c.id} onClick={() => handleSelectCourt(c)} className="w-full p-4 flex items-center justify-between hover:bg-primary/10 border-b border-white/5 last:border-0 text-left group">
                              <div>
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {(c.legalAreas || []).map((area: string) => (
                                    <Badge key={area} className="text-[7px] font-black uppercase h-3.5 px-1 bg-primary/20 text-primary border-0">{area}</Badge>
                                  ))}
                                </div>
                                <p className="text-xs font-black text-white uppercase group-hover:text-primary transition-colors">{c.name}</p>
                                <p className="text-[9px] text-muted-foreground uppercase mt-1">{c.city} - {c.state}</p>
                              </div>
                              <Badge variant="outline" className="text-[8px] font-black border-primary/30 text-primary">MAPEAR</Badge>
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center opacity-40"><p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Órgão não compatível ou não listado</p></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Vara / Unidade</Label>
                  {availableVaras.length > 0 ? (
                    <Select value={formData.vara} onValueChange={(v) => handleInputChange("vara", v)}>
                      <SelectTrigger className={cn(inputClass, "h-10")}>
                        <SelectValue placeholder="SELECIONE A VARA" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                        {availableVaras.map((v: any) => (
                          <SelectItem key={v.name} value={v.name}>
                            <div className="flex flex-col items-start leading-none gap-1 py-1">
                              <span className="font-bold text-xs">{v.name}</span>
                              {v.phone && <span className="text-[9px] opacity-50 font-black">TEL: {v.phone}</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input className={cn(inputClass)} value={formData.vara} onChange={(e) => handleInputChange("vara", e.target.value.toUpperCase())} placeholder="EX: 45ª VARA DO TRABALHO" />
                  )}
                </div>
              </div>
              <div className="space-y-2 border-t border-white/5 pt-6">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Fatos & Objeto da Ação</Label>
                <textarea 
                  className="w-full bg-black/40 border border-white/10 min-h-[120px] text-white text-xs uppercase font-bold resize-none p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                  value={formData.notes} 
                  onChange={(e) => handleInputChange("notes", e.target.value.toUpperCase())} 
                  placeholder="RELATE OS FATOS PRINCIPAIS..."
                />
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      <div className="p-6 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between shadow-2xl z-30 flex-none">
        <Button variant="ghost" className="text-muted-foreground font-black uppercase text-[9px] tracking-widest px-6 h-10 hover:text-white" onClick={onCancel}>ABORTAR</Button>
        <Button onClick={handleSubmit} className="gold-gradient text-background font-black h-12 text-[10px] uppercase tracking-widest shadow-xl rounded-xl px-10 flex items-center gap-3 hover:scale-[1.02] transition-transform">
          <ShieldCheck className="h-4 w-4" /> SALVAR CADASTRO
        </Button>
      </div>
    </div>
  )
}
