"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  ShieldCheck
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"

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
      setFormData(prev => ({ ...prev, ...initialData, name: initialData.name || "" }))
      setSearchTerm(initialData.name || "")
      if (initialData.court) {
        setCourtSearchTerm(initialData.court)
        setIsManualAddressEntry(false)
      }
    }
  }, [initialData])

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
    setIsCourtSearchOpen(false)
    setIsManualAddressEntry(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    const finalName = formData.name || searchTerm
    if (!finalName?.trim() || !formData.phone?.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "Nome e WhatsApp obrigatórios." })
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

  const inputClass = "bg-black/40 border-white/10 h-9 text-xs text-white uppercase font-bold focus:ring-primary/50"

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] font-sans overflow-hidden">
      <div className="px-6 pt-4 pb-1 flex-none bg-[#0a0f1e]/50 border-b border-white/5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1a1f2e] w-full p-1 h-10 rounded-lg gap-1">
            <TabsTrigger value="autor" className="flex-1 text-[9px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-md gap-2 h-full transition-all">
              <User className="h-3 w-3" /> AUTOR
            </TabsTrigger>
            <TabsTrigger value="reu" className="flex-1 text-[9px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-md gap-2 h-full transition-all">
              <Building className="h-3 w-3" /> RÉU
            </TabsTrigger>
            <TabsTrigger value="demanda" className="flex-1 text-[9px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-md gap-2 h-full transition-all">
              <Scale className="h-3 w-3" /> DEMANDA
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 bg-[#0a0f1e]/20">
        <div className="px-6 py-4 max-w-4xl mx-auto space-y-6 pb-24">
          
          {activeTab === "autor" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-4">
                <SectionTitle icon={Fingerprint}>Dados Pessoais</SectionTitle>
                <div className="space-y-1.5" ref={searchRef}>
                  <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Nome do Cliente *</Label>
                  <div className="relative" onClick={() => !lockMode && setIsSearchOpen(true)}>
                    <Input placeholder="PESQUISAR OU INSERIR NOME..." className={cn(inputClass, "h-10 text-xs", lockMode && "opacity-60")} value={formData.name || searchTerm} readOnly={!isSearchOpen && !lockMode} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">WhatsApp *</Label>
                    <Input className={inputClass} value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">E-mail</Label>
                    <Input className={cn(inputClass, "lowercase")} value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <SectionTitle icon={FileText}>Qualificação</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase">CPF / CNPJ</Label>
                    <Input className={cn(inputClass, "font-mono")} value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase">RG</Label>
                    <Input className={inputClass} value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase">Profissão</Label>
                    <Input className={inputClass} value={formData.profession} onChange={(e) => handleInputChange("profession", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reu" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <SectionTitle icon={Building}>Dados do Réu</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase">Nome do Réu *</Label>
                  <Input className={cn(inputClass, "h-10")} value={formData.defendantName} onChange={(e) => handleInputChange("defendantName", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase">CNPJ / CPF</Label>
                  <Input className={cn(inputClass, "h-10 font-mono")} value={formData.defendantDocument} onChange={(e) => handleInputChange("defendantDocument", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "demanda" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <SectionTitle icon={Gavel}>Logística Judiciária</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5" ref={courtSearchRef}>
                  <Label className="text-[9px] font-black text-primary uppercase">Órgão / Fórum</Label>
                  <Input placeholder="BUSCAR FÓRUM..." className={cn(inputClass, "h-10")} value={courtSearchTerm || formData.court} onChange={(e) => setCourtSearchTerm(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-primary uppercase">Vara</Label>
                  <Input className={cn(inputClass, "h-10")} value={formData.vara} onChange={(e) => handleInputChange("vara", e.target.value.toUpperCase())} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black text-muted-foreground uppercase">Resumo da Demanda</Label>
                <textarea className="w-full bg-black/40 border border-white/10 min-h-[100px] text-white text-xs uppercase resize-none p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value.toUpperCase())} />
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      <div className="p-4 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between shadow-2xl z-30 flex-none">
        <Button variant="ghost" className="text-muted-foreground font-black uppercase text-[9px] tracking-widest px-4 h-9" onClick={onCancel}>ABORTAR</Button>
        <Button onClick={handleSubmit} className="gold-gradient text-background font-black h-10 text-[9px] uppercase tracking-widest shadow-xl rounded-md px-8 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5" /> SALVAR DOSSIÊ
        </Button>
      </div>
    </div>
  )
}