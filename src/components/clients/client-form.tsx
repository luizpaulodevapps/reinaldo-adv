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

  const clientsQuery = useMemoFirebase(() => {
    if (!canQuery) return null
    return query(collection(db!, "clients"))
  }, [db, canQuery])
  const { data: existingClients } = useCollection(clientsQuery)

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
        firstName: initialData.firstName || initialData.name || "",
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

  const isDocumentValid = () => {
    const doc = formData.cpf.replace(/\D/g, "");
    if (formData.personType === "Pessoa Física") {
      return doc.length === 11 && validateCPF(doc);
    } else {
      return doc.length === 14 && validateCNPJ(doc);
    }
  }

  const handleSubmit = () => {
    if (!formData.firstName || !formData.cpf) {
      toast({ variant: "destructive", title: "Dados Obrigatórios", description: "Nome e documento são pilares do rito RGMJ." })
      return
    }
    onSubmit(formData)
  }

  const labelMini = "text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-2 block"
  const inputClass = "bg-[#0d121f] border-white/10 h-14 text-white text-sm font-bold focus:ring-1 focus:ring-primary/50 transition-all rounded-xl"

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] font-sans">
      <div className="px-10 pt-8 pb-4">
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

          <ScrollArea className="h-[calc(100vh-320px)] mt-8">
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
              
              <TabsContent value="identidade" className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-8">
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
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="endereco" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-8">
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
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financeiro" className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-8">
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
              </TabsContent>

            </div>
          </ScrollArea>
        </Tabs>
      </div>

      <div className="p-10 bg-black/40 border-t border-white/5 flex items-center justify-between mt-auto">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground uppercase font-black text-[10px] tracking-widest px-10 h-14">CANCELAR</Button>
        <Button onClick={handleSubmit} className="gold-gradient text-background font-black h-14 px-14 rounded-xl shadow-2xl uppercase text-[11px] tracking-widest">
          SALVAR CADASTRO ESTRATÉGICO
        </Button>
      </div>
    </div>
  )
}
