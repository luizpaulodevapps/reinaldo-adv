
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, CheckCircle2, ShieldAlert, User, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn, validateCPF, validateCNPJ } from "@/lib/utils"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query } from "firebase/firestore"

interface ClientFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function ClientForm({ onSubmit, onCancel }: ClientFormProps) {
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  const [loadingCep, setLoadingCep] = useState(false)
  
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
      } else {
        toast({ variant: "destructive", title: "CEP não encontrado" })
      }
    } catch (error) {
      console.error("Erro no CEP")
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

  const checkDuplicate = () => {
    const newDoc = formData.cpf.replace(/\D/g, "");
    if (!newDoc) return false;
    return (existingClients || []).some(c => (c.documentNumber || "").replace(/\D/g, "") === newDoc);
  }

  const handleSubmit = () => {
    if (!formData.firstName || !formData.cpf) {
      toast({ variant: "destructive", title: "Dados Obrigatórios", description: "Nome e documento são necessários." })
      return
    }
    if (!isDocumentValid()) {
      toast({ variant: "destructive", title: "Documento Inválido" })
      return
    }
    if (checkDuplicate()) {
      toast({ variant: "destructive", title: "Registro Duplicado" })
      return
    }
    onSubmit(formData)
  }

  const sectionLabelClass = "text-2xl font-black text-white mb-8 border-b border-white/5 pb-3 flex items-center gap-4 uppercase tracking-tighter"
  const inputLabelClass = "text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 block"
  const inputClass = "bg-[#0d121f] border-white/10 h-14 text-white text-sm font-bold focus:ring-1 focus:ring-primary/50 transition-all"

  const isPJ = formData.personType === "Pessoa Jurídica";

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] font-sans">
      <ScrollArea className="flex-1 px-10 py-10 max-h-[80vh]">
        <div className="space-y-16 max-w-4xl mx-auto">
          {/* SEÇÃO I: IDENTIDADE */}
          <section>
            <h2 className={sectionLabelClass}>
              {isPJ ? <Building2 className="h-7 w-7 text-primary" /> : <User className="h-7 w-7 text-primary" />}
              Identificação do Cliente
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className={inputLabelClass}>Natureza Jurídica *</Label>
                <Select value={formData.personType} onValueChange={(v) => handleInputChange("personType", v)}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    <SelectItem value="Pessoa Física">👤 PESSOA FÍSICA</SelectItem>
                    <SelectItem value="Pessoa Jurídica">🏢 PESSOA JURÍDICA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={cn(inputLabelClass, formData.cpf.length >= 11 && (isDocumentValid() ? "text-emerald-500" : "text-rose-500"))}>
                  {isPJ ? "CNPJ *" : "CPF *"}
                </Label>
                <div className="relative">
                  <Input 
                    placeholder={isPJ ? "00.000.000/0000-00" : "000.000.000-00"} 
                    className={cn(inputClass, "font-mono", formData.cpf.length >= 11 && (isDocumentValid() ? "border-emerald-500/40" : "border-rose-500/40"))} 
                    value={formData.cpf} 
                    onChange={(e) => handleInputChange("cpf", e.target.value)} 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {formData.cpf.length >= 11 && (isDocumentValid() ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <ShieldAlert className="h-5 w-5 text-rose-500" />)}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className={inputLabelClass}>{isPJ ? "Razão Social Oficial *" : "Nome Completo *"}</Label>
                <Input placeholder="NOME CONFORME DOCUMENTO" className={inputClass} value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value.toUpperCase())} />
              </div>
            </div>
          </section>

          {/* SEÇÃO II: LOCALIZAÇÃO */}
          <section>
            <h2 className={sectionLabelClass}>Endereço & Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-2">
                <Label className={inputLabelClass}>CEP {loadingCep && <Loader2 className="h-3 w-3 animate-spin inline ml-2" />}</Label>
                <div className="relative">
                  <Input placeholder="00000-000" className={cn(inputClass, "font-mono")} value={formData.zipCode} onChange={(e) => handleInputChange("zipCode", e.target.value)} onBlur={handleCepBlur} />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className={inputLabelClass}>Logradouro</Label>
                <Input placeholder="AVENIDA, RUA, ETC" className={inputClass} value={formData.address} onChange={(e) => handleInputChange("address", e.target.value.toUpperCase())} />
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="p-10 bg-black/40 border-t border-white/5 flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-10 h-14">Cancelar</Button>
        <Button onClick={handleSubmit} className="gold-gradient text-background font-black h-14 px-14 rounded-xl shadow-2xl uppercase text-[11px] tracking-widest transition-all">Salvar Cadastro Estratégico</Button>
      </div>
    </div>
  )
}
