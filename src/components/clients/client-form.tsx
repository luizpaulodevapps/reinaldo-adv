
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, CheckCircle2, ShieldAlert, User, Building2, MapPin, Wallet, Fingerprint } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn, validateCPF, validateCNPJ } from "@/lib/utils"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query } from "firebase/firestore"

interface ClientFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function ClientForm({ initialData, onSubmit, onCancel }: ClientFormProps) {
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  const [loadingCep, setLoadingCep] = useState(false)
  const [activeTab, setActiveTab] = useState("identidade")
  
  const canQuery = !!user && !!db

  const [formData, setFormData] = useState({
    registrationStatus: "Ativo",
    personType: "Pessoa Física",
    cpf: "",
    firstName: "",
    lastName: "",
    nationality: "Brasileiro(a)",
    maritalStatus: "Solteiro(a)",
    profession: "",
    rg: "",
    rgIssuer: "",
    rgIssueDate: "",
    motherName: "",
    ctps: "",
    pisPasep: "",
    legalArea: "Trabalhista",
    email: "",
    phone: "",
    fixedPhone: "",
    zipCode: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    bankAccountHolder: "",
    bankName: "",
    bankAgency: "",
    bankAccount: "",
    pixKeyType: "CPF",
    pixKey: ""
  })

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Garante que o nome seja mapeado corretamente se vier de formatos diferentes
        firstName: initialData.firstName || initialData.name || "",
        cpf: initialData.cpf || initialData.documentNumber || ""
      }))
    }
  }, [initialData])

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
          address: data.logradouro.toUpperCase(),
          neighborhood: data.bairro.toUpperCase(),
          city: data.localidade.toUpperCase(),
          state: data.uf.toUpperCase()
        }))
      }
    } catch (error) {
      console.error("CEP error")
    } finally {
      setLoadingCep(false)
    }
  }

  const handleSubmit = () => {
    if (!formData.firstName && !formData.lastName) {
      toast({ variant: "destructive", title: "Dados Obrigatórios", description: "Nome é um pilar do rito RGMJ." })
      return
    }
    onSubmit(formData)
  }

  const labelMini = "text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-2 block"
  const inputClass = "bg-[#0d121f] border-white/10 h-14 text-white text-sm font-bold focus:ring-1 focus:ring-primary/50 transition-all rounded-xl"

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] font-sans">
      <div className="px-10 pt-8 pb-4 flex-none">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1a1f2e] w-full p-1 h-14 rounded-xl gap-1">
            <TabsTrigger value="identidade" className="flex-1 text-[10px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-lg gap-2 h-full transition-all">
              <User className="h-3.5 w-3.5" /> DADOS PESSOAIS
            </TabsTrigger>
            <TabsTrigger value="endereco" className="flex-1 text-[10px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-lg gap-2 h-full transition-all">
              <MapPin className="h-3.5 w-3.5" /> ENDEREÇO & CONTATO
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex-1 text-[10px] uppercase font-black data-[state=active]:bg-primary data-[state=active]:text-background rounded-lg gap-2 h-full transition-all">
              <Wallet className="h-3.5 w-3.5" /> FINANCEIRO / PIX
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-10 max-w-4xl mx-auto space-y-10 pb-32">
          
          <div className={cn(activeTab !== "identidade" && "hidden")}>
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <Fingerprint className="h-5 w-5 text-primary" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Identidade Oficial</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className={labelMini}>Natureza Jurídica</Label>
                  <Select value={formData.personType} onValueChange={(v) => handleInputChange("personType", v)}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      <SelectItem value="Pessoa Física">👤 PESSOA FÍSICA</SelectItem>
                      <SelectItem value="Pessoa Jurídica">🏢 PESSOA JURÍDICA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>CPF / CNPJ *</Label>
                  <Input className={cn(inputClass, "font-mono")} value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className={labelMini}>Nome Completo / Razão Social *</Label>
                  <Input className={inputClass} value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>WhatsApp / Celular</Label>
                  <Input className={inputClass} value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>E-mail Principal</Label>
                  <Input className={cn(inputClass, "lowercase")} value={formData.email} onChange={(e) => handleInputChange("email", e.target.value.toLowerCase())} />
                </div>
              </div>
            </div>
          </div>

          <div className={cn(activeTab !== "endereco" && "hidden")}>
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Localização Residencial</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1 space-y-2">
                  <Label className={labelMini}>CEP {loadingCep && <Loader2 className="h-3 w-3 animate-spin inline ml-2" />}</Label>
                  <Input className={cn(inputClass, "font-mono")} value={formData.zipCode} onChange={(e) => handleInputChange("zipCode", e.target.value)} onBlur={handleCepBlur} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className={labelMini}>Logradouro</Label>
                  <Input className={inputClass} value={formData.address} onChange={(e) => handleInputChange("address", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>Número</Label>
                  <Input className={inputClass} value={formData.number} onChange={(e) => handleInputChange("number", e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className={labelMini}>Bairro</Label>
                  <Input className={inputClass} value={formData.neighborhood} onChange={(e) => handleInputChange("neighborhood", e.target.value.toUpperCase())} />
                </div>
                <div className="md:col-span-1 space-y-2">
                  <Label className={labelMini}>Cidade</Label>
                  <Input className={inputClass} value={formData.city} onChange={(e) => handleInputChange("city", e.target.value.toUpperCase())} />
                </div>
                <div className="md:col-span-1 space-y-2">
                  <Label className={labelMini}>UF</Label>
                  <Input className={inputClass} value={formData.state} onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())} maxLength={2} />
                </div>
              </div>
            </div>
          </div>

          <div className={cn(activeTab !== "financeiro" && "hidden")}>
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Informações de Repasse</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className={labelMini}>Banco</Label>
                  <Input className={inputClass} value={formData.bankName} onChange={(e) => handleInputChange("bankName", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>Chave PIX</Label>
                  <Input className={inputClass} value={formData.pixKey} onChange={(e) => handleInputChange("pixKey", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </ScrollArea>

      <div className="p-10 bg-black/40 border-t border-white/5 flex items-center justify-between mt-auto flex-none sticky bottom-0 z-10">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground uppercase font-black text-[10px] tracking-widest px-10 h-14">CANCELAR</Button>
        <Button onClick={handleSubmit} className="gold-gradient text-background font-black h-14 px-14 rounded-xl shadow-2xl uppercase text-[11px] tracking-widest">
          {initialData ? "ATUALIZAR CADASTRO" : "SALVAR CADASTRO ESTRATÉGICO"}
        </Button>
      </div>
    </div>
  )
}
