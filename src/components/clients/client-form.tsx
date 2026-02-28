
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, CheckCircle2, ShieldAlert, X, Building2, User } from "lucide-react"
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
  
  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "clients"))
  }, [db, user])
  const { data: existingClients } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    registrationStatus: "Ativo",
    personType: "Pessoa Física",
    cpf: "", // Usado para CPF ou CNPJ conforme personType
    firstName: "", // Nome ou Razão Social
    lastName: "", // Sobrenome ou Nome Fantasia
    nationality: "Brasileiro(a)",
    maritalStatus: "Solteiro(a)",
    profession: "",
    rg: "", // RG ou Inscrição Estadual
    rgIssuer: "", // Órgão Emissor ou Inscrição Municipal
    rgIssueDate: "",
    motherName: "", // Nome da Mãe ou Representante Legal
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
      toast({ variant: "destructive", title: "Dados Obrigatórios", description: "Nome/Razão e CPF/CNPJ são necessários." })
      return
    }
    if (!isDocumentValid()) {
      const type = formData.personType === "Pessoa Física" ? "CPF" : "CNPJ";
      toast({ variant: "destructive", title: `${type} Inválido`, description: `O ${type} informado não é matematicamente válido.` })
      return
    }
    if (checkDuplicate()) {
      toast({ 
        variant: "destructive", 
        title: "Registro Duplicado", 
        description: `O documento ${formData.cpf} já consta na base de dados da banca RGMJ.` 
      })
      return
    }
    onSubmit(formData)
  }

  const sectionLabelClass = "text-2xl font-headline font-bold text-white mb-6 border-b border-white/5 pb-2 flex items-center gap-3"
  const inputLabelClass = "text-[10px] font-black text-[#a0a5b1] uppercase tracking-[0.15em] mb-2 block"
  const inputClass = "bg-[#0d121f] border-white/10 h-12 text-white text-sm focus:ring-1 focus:ring-primary/50"

  const isPJ = formData.personType === "Pessoa Jurídica";

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e]">
      <ScrollArea className="flex-1 px-10 py-8 max-h-[80vh]">
        <div className="space-y-12">
          {/* SEÇÃO I: IDENTIDADE E TIPO */}
          <section>
            <h2 className={sectionLabelClass}>
              {isPJ ? <Building2 className="h-6 w-6 text-primary" /> : <User className="h-6 w-6 text-primary" />}
              {isPJ ? "Dados da Pessoa Jurídica" : "Dados da Pessoa Física"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className={inputLabelClass}>Status do Cadastro *</Label>
                <Select value={formData.registrationStatus} onValueChange={(v) => handleInputChange("registrationStatus", v)}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className={inputLabelClass}>Tipo de Pessoa *</Label>
                <Select value={formData.personType} onValueChange={(v) => handleInputChange("personType", v)}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                    <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                    <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className={cn(inputLabelClass, formData.cpf.length > 5 && (isDocumentValid() ? "text-emerald-500" : "text-rose-500"))}>
                  {isPJ ? "CNPJ *" : "CPF *"}
                </Label>
                <div className="relative">
                  <Input 
                    placeholder={isPJ ? "00.000.000/0000-00" : "000.000.000-00"} 
                    className={cn(
                      inputClass, 
                      formData.cpf.length >= 11 && (isDocumentValid() ? "border-emerald-500/50" : "border-rose-500/50")
                    )} 
                    value={formData.cpf} 
                    onChange={(e) => handleInputChange("cpf", e.target.value)} 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {formData.cpf.length >= 11 && (
                      isDocumentValid() ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className={inputLabelClass}>{isPJ ? "Razão Social *" : "Nome *"}</Label>
                <Input placeholder={isPJ ? "Razão Social Oficial" : "Nome oficial"} className={inputClass} value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value.toUpperCase())} />
              </div>

              <div className="space-y-1">
                <Label className={inputLabelClass}>{isPJ ? "Nome Fantasia" : "Sobrenome"}</Label>
                <Input placeholder={isPJ ? "Nome Fantasia" : "Complemento do nome"} className={inputClass} value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value.toUpperCase())} />
              </div>

              {!isPJ ? (
                <>
                  <div className="space-y-1">
                    <Label className={inputLabelClass}>Nacionalidade</Label>
                    <Input placeholder="brasileiro(a)" className={inputClass} value={formData.nationality} onChange={(e) => handleInputChange("nationality", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className={inputLabelClass}>Estado Civil</Label>
                    <Select value={formData.maritalStatus} onValueChange={(v) => handleInputChange("maritalStatus", v)}>
                      <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                        <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                        <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                        <SelectItem value="União Estável">União Estável</SelectItem>
                        <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                        <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className={inputLabelClass}>Profissão</Label>
                    <Input placeholder="Ex: ajudante geral" className={inputClass} value={formData.profession} onChange={(e) => handleInputChange("profession", e.target.value)} />
                  </div>
                </>
              ) : (
                <div className="space-y-1 md:col-span-2">
                  <Label className={inputLabelClass}>Data de Fundação</Label>
                  <Input type="date" className={inputClass} value={formData.rgIssueDate} onChange={(e) => handleInputChange("rgIssueDate", e.target.value)} />
                </div>
              )}

              <div className="space-y-1">
                <Label className={inputLabelClass}>{isPJ ? "Inscrição Estadual" : "RG"}</Label>
                <Input placeholder={isPJ ? "ISENTO ou Número" : "00.000.000-0"} className={inputClass} value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label className={inputLabelClass}>{isPJ ? "Inscrição Municipal" : "Órgão Emissor"}</Label>
                <Input placeholder={isPJ ? "Nº Inscrição Municipal" : "Ex: SSP/SP"} className={inputClass} value={formData.rgIssuer} onChange={(e) => handleInputChange("rgIssuer", e.target.value.toUpperCase())} />
              </div>

              {!isPJ && (
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Data Expedição</Label>
                  <Input type="date" className={inputClass} value={formData.rgIssueDate} onChange={(e) => handleInputChange("rgIssueDate", e.target.value)} />
                </div>
              )}

              <div className="space-y-1 md:col-span-2">
                <Label className={inputLabelClass}>{isPJ ? "Representante Legal / Sócio Responsável" : "Nome da Mãe"}</Label>
                <Input placeholder={isPJ ? "Nome do Sócio/Representante" : "Nome completo da mãe"} className={inputClass} value={formData.motherName} onChange={(e) => handleInputChange("motherName", e.target.value.toUpperCase())} />
              </div>

              {!isPJ && (
                <>
                  <div className="space-y-1">
                    <Label className={inputLabelClass}>CTPS</Label>
                    <Input placeholder="Nº da Carteira de Trabalho" className={inputClass} value={formData.ctps} onChange={(e) => handleInputChange("ctps", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className={inputLabelClass}>PIS/PASEP</Label>
                    <Input placeholder="Nº do PIS/PASEP" className={inputClass} value={formData.pisPasep} onChange={(e) => handleInputChange("pisPasep", e.target.value)} />
                  </div>
                </>
              )}

              <div className="space-y-1 md:col-span-2">
                <Label className={inputLabelClass}>Área Jurídica de Atendimento</Label>
                <Select value={formData.legalArea} onValueChange={(v) => handleInputChange("legalArea", v)}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                    <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                    <SelectItem value="Cível">Cível</SelectItem>
                    <SelectItem value="Previdenciário">Previdenciário</SelectItem>
                    <SelectItem value="Família">Família</SelectItem>
                    <SelectItem value="Empresarial">Empresarial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* SEÇÃO II: CONTATO & ENDEREÇO */}
          <section>
            <h2 className={sectionLabelClass}>Contato & Endereço</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <Label className={inputLabelClass}>Email *</Label>
                <Input placeholder="contato@empresa.com.br" className={inputClass} value={formData.email} onChange={(e) => handleInputChange("email", e.target.value.toLowerCase())} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Celular / WhatsApp Principal *</Label>
                  <Input placeholder="(00) 00000-0000" className={inputClass} value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Telefone Fixo / PABX</Label>
                  <Input placeholder="(00) 0000-0000" className={inputClass} value={formData.fixedPhone} onChange={(e) => handleInputChange("fixedPhone", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>CEP {loadingCep && <Loader2 className="h-3 w-3 animate-spin inline ml-2" />}</Label>
                <div className="relative">
                  <Input placeholder="00000-000" className={inputClass} value={formData.zipCode} onChange={(e) => handleInputChange("zipCode", e.target.value)} onBlur={handleCepBlur} />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Logradouro</Label>
                <Input placeholder="Rua, avenida, etc" className={inputClass} value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Número</Label>
                  <Input placeholder="123" className={inputClass} value={formData.number} onChange={(e) => handleInputChange("number", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Complemento</Label>
                  <Input placeholder="Conjunto, sala, andar" className={inputClass} value={formData.complement} onChange={(e) => handleInputChange("complement", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Bairro</Label>
                  <Input placeholder="Centro" className={inputClass} value={formData.neighborhood} onChange={(e) => handleInputChange("neighborhood", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Cidade</Label>
                  <Input placeholder="Cidade" className={inputClass} value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Estado</Label>
                  <Input placeholder="UF" className={inputClass} value={formData.state} onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())} maxLength={2} />
                </div>
              </div>
            </div>
          </section>

          {/* SEÇÃO III: FINANCEIRO */}
          <section>
            <h2 className={sectionLabelClass}>Dados Bancários p/ Recebimento</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <Label className={inputLabelClass}>Nome do Favorecido</Label>
                <Input placeholder="Deixe em branco se for o próprio cliente" className={inputClass} value={formData.bankAccountHolder} onChange={(e) => handleInputChange("bankAccountHolder", e.target.value.toUpperCase())} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Banco</Label>
                  <Input placeholder="Ex: Itaú, Santander..." className={inputClass} value={formData.bankName} onChange={(e) => handleInputChange("bankName", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Agência</Label>
                  <Input placeholder="0000" className={inputClass} value={formData.bankAgency} onChange={(e) => handleInputChange("bankAgency", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Conta Corrente</Label>
                  <Input placeholder="00000-0" className={inputClass} value={formData.bankAccount} onChange={(e) => handleInputChange("bankAccount", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Chave PIX</Label>
                  <Input placeholder="CNPJ, E-mail ou Telefone" className={inputClass} value={formData.pixKey} onChange={(e) => handleInputChange("pixKey", e.target.value)} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="p-8 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-end gap-4">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="bg-primary hover:bg-primary/90 text-white font-black h-12 px-10 rounded-lg shadow-xl uppercase text-[11px] tracking-widest transition-all"
        >
          Salvar Cadastro
        </Button>
      </div>
    </div>
  )
}
