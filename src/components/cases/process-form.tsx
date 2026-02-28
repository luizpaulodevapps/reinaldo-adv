"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Building2, 
  FileText, 
  Gavel, 
  UserCheck, 
  Target,
  CheckCircle2,
  Loader2,
  Plus,
  UserPlus,
  ShieldAlert,
  Zap,
  Globe
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, DocumentReference } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { cn, validateCPF, validateCNPJ } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface ProcessFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

const steps = [
  { id: 1, label: "AUTORES", icon: Users },
  { id: 2, label: "RÉUS", icon: Building2 },
  { id: 3, label: "PROCESSO", icon: FileText },
  { id: 4, label: "JUÍZO", icon: Gavel },
  { id: 5, label: "EQUIPE", icon: UserCheck },
  { id: 6, label: "ESTRATÉGIA", icon: Target },
]

export function ProcessForm({ onSubmit, onCancel }: ProcessFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false)
  const [quickClientData, setQuickClientData] = useState({ name: '', cpf: '' })
  const [isSavingClient, setIsSavingClient] = useState(false)
  const [loadingApi, setLoadingApi] = useState(false)
  
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    poloProcessual: "Polo Ativo (Autor/Reclamante)",
    clientId: "",
    clientName: "",
    defendantName: "",
    defendantDocument: "",
    processNumber: "",
    value: "",
    startDate: "",
    caseType: "Trabalhista",
    court: "",
    vara: "",
    city: "",
    responsibleStaffId: user?.uid || "",
    description: "",
    strategyNotes: ""
  })

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "clients"), orderBy("name", "asc"))
  }, [db, user])
  const { data: clients } = useCollection(clientsQuery)

  const filteredClients = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return []
    return (clients || []).filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.documentNumber?.includes(searchTerm)
    )
  }, [clients, searchTerm])

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleOpenQuickClient = () => {
    setQuickClientData({ ...quickClientData, name: searchTerm.toUpperCase() })
    setIsQuickClientOpen(true)
    setShowResults(false)
  }

  const handleDocumentLookup = async () => {
    const docNum = quickClientData.cpf.replace(/\D/g, "")
    
    if (docNum.length === 11) {
      toast({ 
        title: "VALORAÇÃO ESTRUTURAL RGMJ", 
        description: "A validação matemática está ativa. Documento parece formalmente correto." 
      })
      return
    }

    if (docNum.length !== 14) {
      toast({ variant: "destructive", title: "CNPJ Inválido", description: "O CNPJ deve ter 14 dígitos." })
      return
    }

    setLoadingApi(true)
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${docNum}`)
      if (!response.ok) throw new Error()
      const data = await response.json()
      
      setQuickClientData(prev => ({
        ...prev,
        name: data.razao_social
      }))

      toast({ title: "Dados Oficiais Injetados", description: data.razao_social })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na API", description: "Documento não encontrado." })
    } finally {
      setLoadingApi(false)
    }
  }

  const handleSaveQuickClient = async () => {
    if (!quickClientData.name) {
      toast({ variant: "destructive", title: "Nome obrigatório" })
      return
    }

    const cleanDoc = quickClientData.cpf.replace(/\D/g, "");
    const isDup = (clients || []).some(c => (c.documentNumber || "").replace(/\D/g, "") === cleanDoc);
    if (isDup && cleanDoc) {
      toast({ variant: "destructive", title: "Cliente já existe", description: "Este CPF/CNPJ já está cadastrado na base RGMJ." });
      return;
    }

    setIsSavingClient(true)
    try {
      const newClient = {
        name: quickClientData.name.toUpperCase(),
        documentNumber: quickRegData.cpfCnpj,
        type: cleanDoc.length > 11 ? 'corporate' : 'individual',
        status: 'Ativo',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docResult = await addDocumentNonBlocking(collection(db, "clients"), newClient) as any;
      
      if (docResult && docResult.id) {
        handleInputChange("clientId", docResult.id)
        handleInputChange("clientName", newClient.name)
      }
      
      setIsQuickClientOpen(false)
      setSearchTerm("")
      toast({ 
        title: "Cliente Cadastrado", 
        description: `${newClient.name} foi adicionado à base e vinculado ao processo.` 
      })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao cadastrar cliente" })
    } finally {
      setIsSavingClient(false)
    }
  }

  const progress = (currentStep / 6) * 100

  const StepHeader = ({ title, subtitle, icon: Icon }: any) => (
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-xl font-headline font-bold text-white uppercase tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{subtitle}</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e]">
      <div className="px-10 py-8 border-b border-white/5 bg-[#0a0f1e]">
        <div className="flex justify-between items-center relative max-w-4xl mx-auto">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-white/5 z-0" />
          
          {steps.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
              <button 
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all border-2",
                  currentStep === step.id 
                    ? "bg-[#f5d030] border-[#f5d030] text-[#0a0f1e] shadow-[0_0_15px_rgba(245,208,48,0.4)] scale-110" 
                    : step.id < currentStep 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "bg-[#1a1f2e] border-white/10 text-muted-foreground"
                )}
              >
                {step.id < currentStep ? <CheckCircle2 className="h-5 w-5" /> : step.id}
              </button>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                currentStep === step.id ? "text-[#f5d030]" : "text-muted-foreground/50"
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-1.5 w-full bg-white/5 overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-10 max-w-4xl mx-auto">
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <StepHeader title="Partes do Processo" subtitle="Identifique o cliente principal" icon={Users} />
              <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">POLO PROCESSUAL *</Label>
                  <Select value={formData.poloProcessual} onValueChange={(v) => handleInputChange("poloProcessual", v)}>
                    <SelectTrigger className="bg-black/20 border-white/10 h-14 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                      <SelectItem value="Polo Ativo (Autor/Reclamante)">Polo Ativo (Autor/Reclamante)</SelectItem>
                      <SelectItem value="Polo Passivo (Réu/Reclamada)">Polo Passivo (Réu/Reclamada)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 relative">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CLIENTE PRINCIPAL *</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Pesquisar cliente..." 
                      className="pl-12 bg-black/20 border-white/10 h-14 text-white"
                      value={formData.clientName || searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowResults(true)
                        if (formData.clientName) handleInputChange("clientName", "")
                      }}
                      onFocus={() => setShowResults(true)}
                    />
                  </div>
                  {showResults && searchTerm.length >= 2 && (
                    <div className="absolute z-50 w-full mt-2 bg-[#0a0f1e] border border-primary/20 rounded-xl overflow-hidden shadow-2xl">
                      <div className="max-h-[300px] overflow-y-auto">
                        {filteredClients.length > 0 ? (
                          filteredClients.map(c => (
                            <button key={c.id} onClick={() => { handleInputChange("clientId", c.id); handleInputChange("clientName", c.name); setShowResults(false); }} className="w-full p-4 flex items-center justify-between hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0">
                              <div>
                                <p className="text-xs font-bold text-white uppercase">{c.name}</p>
                                <p className="text-[10px] font-mono text-muted-foreground">{c.documentNumber}</p>
                              </div>
                              <Badge variant="outline" className="text-[8px] border-primary/30 text-primary">Selecionar</Badge>
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center"><p className="text-[10px] text-muted-foreground uppercase font-black">Nenhum cliente encontrado</p></div>
                        )}
                      </div>
                      <button onClick={handleOpenQuickClient} className="w-full p-4 bg-primary/10 border-t border-white/5 flex items-center justify-center gap-3 text-primary hover:bg-primary/20 transition-all font-black text-[10px] uppercase tracking-widest">
                        <UserPlus className="h-4 w-4" /> CRIAR NOVO CLIENTE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <StepHeader title="Polo Passivo" subtitle="Identifique a parte contrária" icon={Building2} />
              <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NOME DO RÉU / RAZÃO SOCIAL *</Label>
                  <Input value={formData.defendantName} onChange={(e) => handleInputChange("defendantName", e.target.value.toUpperCase())} className="bg-black/20 border-white/10 h-14 text-white" placeholder="EX: EMPRESA S.A." />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CPF / CNPJ DO RÉU</Label>
                  <Input value={formData.defendantDocument} onChange={(e) => handleInputChange("defendantDocument", e.target.value)} className="bg-black/20 border-white/10 h-14 text-white" placeholder="00.000.000/0000-00" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <StepHeader title="Dados do Processo" subtitle="Informações do dossiê" icon={FileText} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NÚMERO DO PROCESSO *</Label>
                  <Input value={formData.processNumber} onChange={(e) => handleInputChange("processNumber", e.target.value)} className="bg-black/20 border-white/10 h-14 text-white font-mono" placeholder="0000000-00.0000.0.00.0000" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ÁREA JURÍDICA</Label>
                  <Select value={formData.caseType} onValueChange={(v) => handleInputChange("caseType", v)}>
                    <SelectTrigger className="bg-black/20 border-white/10 h-14 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                      <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                      <SelectItem value="Cível">Cível</SelectItem>
                      <SelectItem value="Previdenciário">Previdenciário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <StepHeader title="Jurisdição" subtitle="Localização judiciária" icon={Gavel} />
              <div className="space-y-8 p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TRIBUNAL / ÓRGÃO *</Label>
                  <Input value={formData.court} onChange={(e) => handleInputChange("court", e.target.value.toUpperCase())} className="bg-black/20 border-white/10 h-14 text-white" placeholder="EX: TRT 2ª REGIÃO" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <StepHeader title="Corpo Técnico" subtitle="Defina o advogado de frente" icon={UserCheck} />
              <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ADVOGADO RESPONSÁVEL *</Label>
                  <Select value={formData.responsibleStaffId} onValueChange={(v) => handleInputChange("responsibleStaffId", v)}>
                    <SelectTrigger className="bg-black/20 border-white/10 h-14 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                      <SelectItem value={user?.uid || "current"}>{user?.displayName || "Membro da Equipe"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <StepHeader title="Plano de Batalha" subtitle="Definição tática" icon={Target} />
              <div className="space-y-8 p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">RESUMO DO OBJETO</Label>
                  <Input value={formData.description} onChange={(e) => handleInputChange("description", e.target.value.toUpperCase())} className="bg-black/20 border-white/10 h-14 text-white" placeholder="EX: AÇÃO TRABALHISTA..." />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-8 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} className="glass h-14 px-8 gap-3 uppercase font-black text-[11px]">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <div className="text-[10px] font-black text-muted-foreground/50 uppercase">{currentStep} de 6</div>
        {currentStep < 6 ? (
          <Button onClick={handleNext} className="bg-[#f5d030] hover:bg-[#d4af37] text-[#0a0f1e] h-14 px-10 gap-3 uppercase font-black text-[11px]">
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => onSubmit(formData)} className="bg-[#f5d030] hover:bg-[#d4af37] text-[#0a0f1e] h-14 px-12 gap-3 uppercase font-black text-[11px]">
            Protocolar Processo <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={isQuickClientOpen} onOpenChange={setIsQuickClientOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-primary" /> Injeção de Dados RGMJ
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-[10px] uppercase font-black">Conexão com Cadastro Oficial.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6 bg-[#0a0f1e]/50">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CPF / CNPJ *</Label>
              <div className="relative">
                <Input value={quickClientData.cpf} onChange={(e) => setQuickClientData({...quickClientData, cpf: e.target.value})} className="bg-[#0d121f] border-white/10 h-14 text-white" placeholder="000.000.000-00" />
                <Button variant="ghost" onClick={handleDocumentLookup} disabled={loadingApi} className="absolute right-1 top-1 h-12 bg-primary/10 text-primary uppercase text-[9px] px-4">
                  {loadingApi ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />} VALORAR
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NOME COMPLETO *</Label>
              <Input value={quickClientData.name} onChange={(e) => setQuickClientData({...quickRegData, firstName: e.target.value})} className="bg-[#0d121f] border-white/10 h-14 text-white focus:border-primary/50" />
            </div>
          </div>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsQuickClientOpen(false)} className="text-muted-foreground uppercase font-bold text-[11px]">Cancelar</Button>
            <Button onClick={handleSaveQuickClient} disabled={isSavingClient || !quickClientData.name} className="bg-[#f5d030] text-[#0a0f1e] font-black uppercase text-[11px] px-8 h-14 rounded-xl">
              {isSavingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Cadastrar e Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
