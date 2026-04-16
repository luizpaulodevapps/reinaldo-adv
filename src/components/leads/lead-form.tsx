
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
  Tag,
  X,
  PlusCircle
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
  const [showAdvanced, setShowAdvanced] = useState(false)
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
    responsibleLawyer: defaultResponsibleLawyer || "Reinaldo Gonçalves",
    type: "Trabalhista",
    source: "Google",
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

  const staffQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "staff_profiles"), orderBy("name", "asc"))
  }, [db])
  const { data: staffData } = useCollection(staffQuery)

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
      <div className="px-8 pt-8 pb-4 flex-none bg-[#0a0f1e]/50 border-b border-white/5">
        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Protocolo de Entrada Rápida</h3>
        <p className="text-[9px] text-white/20 uppercase font-bold mt-1 tracking-widest">Os detalhes técnicos e o polo passivo serão coletados na entrevista técnica.</p>
      </div>

      <ScrollArea className="flex-1 bg-[#0a0f1e]/20">
        <div className="px-8 py-8 max-w-4xl mx-auto space-y-8 pb-32">
          
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* IDENTIFICAÇÃO PRINCIPAL */}
            <div className="space-y-4">
              <SectionTitle icon={User}>Identificação do Cliente</SectionTitle>
              <div className="space-y-1.5 relative" ref={searchRef}>
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nome do Cliente *</Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="PESQUISAR OU INSERIR NOME..." 
                    className={cn(inputClass, "h-12 pl-12", lockMode && "opacity-60")} 
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
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">WhatsApp Direct *</Label>
                  <Input 
                    className={cn(inputClass, "h-11")} 
                    value={formData.phone} 
                    onChange={(e) => handleInputChange("phone", maskPhone(e.target.value))} 
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">E-mail de Contato</Label>
                  <Input className={cn(inputClass, "h-11 lowercase")} value={formData.email} onChange={(e) => handleInputChange("email", e.target.value.toLowerCase())} />
                </div>
              </div>
            </div>

            {/* ATRIBUIÇÃO E ORIGEM */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <SectionTitle icon={ShieldCheck}>Classificação Jurídica</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Área Jurídica</Label>
                  <Select value={formData.type} onValueChange={(v) => handleInputChange("type", v)}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      <SelectItem value="Trabalhista">⚖️ TRABALHISTA</SelectItem>
                      <SelectItem value="Cível">🏛️ CÍVEL</SelectItem>
                      <SelectItem value="Criminal">🚔 CRIMINAL</SelectItem>
                      <SelectItem value="Previdenciário">👴 PREVIDENCIÁRIO</SelectItem>
                      <SelectItem value="Família">🏠 FAMÍLIA</SelectItem>
                      <SelectItem value="Empresarial">🏢 EMPRESARIAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Advogado Responsável</Label>
                  <Select value={formData.responsibleLawyer} onValueChange={(v) => handleInputChange("responsibleLawyer", v)}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      {staffData && staffData.length > 0 ? (
                        staffData.map(m => <SelectItem key={m.id} value={m.name}>{m.name.toUpperCase()}</SelectItem>)
                      ) : (
                        <>
                          <SelectItem value="Reinaldo Gonçalves">REINALDO GONÇALVES</SelectItem>
                          <SelectItem value="Luiz Paulo Miguel">LUIZ PAULO MIGUEL</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Canal de Origem</Label>
                  <Select value={formData.source} onValueChange={(v) => handleInputChange("source", v)}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      <SelectItem value="Google">🔍 GOOGLE</SelectItem>
                      <SelectItem value="Instagram">📸 INSTAGRAM</SelectItem>
                      <SelectItem value="Indicação">🤝 INDICAÇÃO</SelectItem>
                      <SelectItem value="WhatsApp">💬 WHATSAPP</SelectItem>
                      <SelectItem value="Outdoor/Placa">🛣️ PLACA / OUTDOOR</SelectItem>
                      <SelectItem value="Outros">🌐 OUTROS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* RESUMO */}
            <div className="space-y-1.5 pt-4 border-t border-white/5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Resumo do Atendimento (Notas de Entrada)</Label>
              <textarea 
                className="w-full bg-black/40 border border-white/10 min-h-[100px] text-white text-xs uppercase font-bold resize-none p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/10" 
                value={formData.notes} 
                onChange={(e) => handleInputChange("notes", e.target.value.toUpperCase())} 
                placeholder="RELATE BREVEMENTE O CONFLITO OU PEDIDO..."
              />
            </div>

            {/* DADOS AVANÇADOS (OPCIONAIS) */}
            {!showAdvanced ? (
              <div className="pt-4 flex justify-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowAdvanced(true)}
                  className="text-[9px] font-black text-primary/40 hover:text-primary uppercase tracking-[0.2em] gap-2 transition-all"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Adicionar CPF ou Endereço (Opcional)
                </Button>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-top-2 duration-300 bg-white/[0.01] p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <SectionTitle icon={FileText}>Qualificação Complementar</SectionTitle>
                  <button onClick={() => setShowAdvanced(false)} className="text-white/20 hover:text-white"><X className="h-4 w-4" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">CPF / CNPJ</Label>
                    <Input 
                      className={cn(inputClass, "font-mono h-11")} 
                      value={formData.cpf} 
                      onChange={(e) => handleInputChange("cpf", maskCPFOrCNPJ(e.target.value))} 
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">CEP</Label>
                    <div className="relative">
                      <Input 
                        className={cn(inputClass, "font-mono h-11")} 
                        value={formData.zipCode} 
                        onChange={(e) => handleInputChange("zipCode", maskCEP(e.target.value))} 
                        onBlur={() => handleCepBlur("client")}
                        placeholder="00000-000"
                      />
                      {loadingCep === 'client' && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-12 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">Endereço Completo</Label>
                    <Input className={cn(inputClass, "h-11")} value={`${formData.address}${formData.number ? ', ' + formData.number : ''}`} readOnly placeholder="PREENCHIDO VIA CEP..." />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </ScrollArea>

      <div className="p-8 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between shadow-2xl z-30 flex-none">
        <Button variant="ghost" className="text-muted-foreground font-black uppercase text-[10px] tracking-widest px-6 h-12 hover:text-white" onClick={onCancel}>CANCELAR</Button>
        <Button onClick={handleSubmit} className="gold-gradient text-background font-black h-14 text-[11px] uppercase tracking-widest shadow-xl rounded-xl px-12 flex items-center gap-3 hover:scale-[1.02] transition-transform">
          <ShieldCheck className="h-5 w-5" /> SALVAR PROTOCOLO
        </Button>
      </div>
    </div>
  )
}
