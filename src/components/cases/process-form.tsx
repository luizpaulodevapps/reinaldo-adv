
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
  UserPlus,
  ShieldAlert
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, DocumentReference, DocumentData } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

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
    if (!user || !db) return null
    return query(collection(db!, "clients"), orderBy("name", "asc"))
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

  const handleSaveQuickClient = async () => {
    if (!quickClientData.name || !db) {
      toast({ variant: "destructive", title: "Nome obrigatório" })
      return
    }

    setIsSavingClient(true)
    try {
      const newClient = {
        name: quickClientData.name.toUpperCase(),
        documentNumber: quickClientData.cpf,
        type: quickClientData.cpf.replace(/\D/g, "").length > 11 ? 'corporate' : 'individual',
        status: 'Ativo',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const result = await addDocumentNonBlocking(collection(db!, "clients"), newClient);
      const docRef = result as DocumentReference<any, DocumentData>;
      
      if (docRef && docRef.id) {
        handleInputChange("clientId", docRef.id)
        handleInputChange("clientName", newClient.name)
      }
      
      setIsQuickClientOpen(false)
      setSearchTerm("")
      toast({ title: "Cliente Cadastrado e Vinculado" })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao cadastrar cliente" })
    } finally {
      setIsSavingClient(false)
    }
  }

  const progress = (currentStep / 6) * 100

  const StepHeader = ({ title, subtitle, icon: Icon }: any) => (
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-xl font-headline font-bold text-white uppercase tracking-tight leading-none">{title}</h3>
        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1.5 opacity-60">{subtitle}</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] font-sans">
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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <StepHeader title="Partes do Processo" subtitle="Identifique o cliente principal RGMJ" icon={Users} />
              <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] space-y-8 shadow-2xl">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">POLO PROCESSUAL *</Label>
                  <Select value={formData.poloProcessual} onValueChange={(v) => handleInputChange("poloProcessual", v)}>
                    <SelectTrigger className="bg-black/20 border-white/10 h-14 text-white focus:ring-1 focus:ring-primary/50"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                      <SelectItem value="Polo Ativo (Autor/Reclamante)">POLO ATIVO (AUTOR)</SelectItem>
                      <SelectItem value="Polo Passivo (Réu/Reclamada)">POLO PASSIVO (RÉU)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 relative">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CLIENTE PRINCIPAL *</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Pesquisar por nome ou CPF..." 
                      className="pl-12 bg-black/20 border-white/10 h-14 text-white text-sm font-bold"
                      value={formData.clientName || searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setSearchTerm(e.target.value)
                        setShowResults(true)
                        if (formData.clientName) handleInputChange("clientName", "")
                      }}
                      onFocus={() => setShowResults(true)}
                    />
                  </div>
                  {showResults && searchTerm.length >= 2 && (
                    <div className="absolute z-50 w-full mt-2 bg-[#0a0f1e] border border-primary/20 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
                      <div className="max-h-[300px] overflow-y-auto">
                        {filteredClients.length > 0 ? (
                          filteredClients.map(c => (
                            <button key={c.id} onClick={() => { handleInputChange("clientId", c.id); handleInputChange("clientName", c.name); setShowResults(false); }} className="w-full p-5 flex items-center justify-between hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0 text-left group">
                              <div>
                                <p className="text-xs font-black text-white uppercase group-hover:text-primary transition-colors">{c.name}</p>
                                <p className="text-[10px] font-mono text-muted-foreground font-bold mt-1">{c.documentNumber}</p>
                              </div>
                              <Badge variant="outline" className="text-[8px] font-black border-primary/30 text-primary uppercase">Selecionar</Badge>
                            </button>
                          ))
                        ) : (
                          <div className="p-10 text-center opacity-40"><p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Nenhum cliente no radar</p></div>
                        )}
                      </div>
                      <button onClick={handleOpenQuickClient} className="w-full p-5 bg-primary/10 border-t border-white/5 flex items-center justify-center gap-3 text-primary hover:bg-primary/20 transition-all font-black text-[10px] uppercase tracking-widest">
                        <UserPlus className="h-4 w-4" /> INJETAR NOVO CLIENTE NA BASE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <StepHeader title="Polo Passivo" subtitle="Identifique a parte contrária da demanda" icon={Building2} />
              <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] space-y-8 shadow-2xl">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">RAZÃO SOCIAL / NOME DO RÉU *</Label>
                  <Input value={formData.defendantName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("defendantName", e.target.value.toUpperCase())} className="bg-black/20 border-white/10 h-14 text-white font-bold" placeholder="EX: EMPRESA DE SERVIÇOS S.A." />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">DOCUMENTO (CPF / CNPJ)</Label>
                  <Input value={formData.defendantDocument} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("defendantDocument", e.target.value)} className="bg-black/20 border-white/10 h-14 text-white font-mono" placeholder="00.000.000/0000-00" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <StepHeader title="Dados Processuais" subtitle="Identificação técnica do dossiê" icon={FileText} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-2xl border border-white/5 bg-white/[0.02] shadow-2xl">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NÚMERO DO PROCESSO (CNJ) *</Label>
                  <Input value={formData.processNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("processNumber", e.target.value)} className="bg-black/20 border-white/10 h-14 text-white font-mono text-lg font-black" placeholder="0000000-00.0000.0.00.0000" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ÁREA JURÍDICA</Label>
                  <Select value={formData.caseType} onValueChange={(v) => handleInputChange("caseType", v)}>
                    <SelectTrigger className="bg-black/20 border-white/10 h-14 text-white font-black text-[10px] uppercase tracking-widest"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                      <SelectItem value="Trabalhista">⚖️ TRABALHISTA</SelectItem>
                      <SelectItem value="Cível">🏛️ CÍVEL</SelectItem>
                      <SelectItem value="Previdenciário">👴 PREVIDENCIÁRIO</SelectItem>
                      <SelectItem value="Tributário">💰 TRIBUTÁRIO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <StepHeader title="Jurisdição" subtitle="Localização judiciária do feito" icon={Gavel} />
              <div className="space-y-8 p-8 rounded-2xl border border-white/5 bg-white/[0.02] shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TRIBUNAL / ÓRGÃO *</Label>
                    <Input value={formData.court} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("court", e.target.value.toUpperCase())} className="bg-black/20 border-white/10 h-14 text-white font-bold" placeholder="EX: TRT 2ª REGIÃO" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">VARA / CÂMARA</Label>
                    <Input value={formData.vara} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("vara", e.target.value.toUpperCase())} className="bg-black/20 border-white/10 h-14 text-white font-bold" placeholder="EX: 45ª VARA DO TRABALHO" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <StepHeader title="Corpo Técnico" subtitle="Defina o advogado responsável pela frente" icon={UserCheck} />
              <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] space-y-8 shadow-2xl">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ADVOGADO DE FRENTE *</Label>
                  <Select value={formData.responsibleStaffId} onValueChange={(v) => handleInputChange("responsibleStaffId", v)}>
                    <SelectTrigger className="bg-black/20 border-white/10 h-14 text-white font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                      <SelectItem value={user?.uid || "current"}>{user?.displayName?.toUpperCase() || "MEMBRO DA EQUIPE"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <StepHeader title="Plano de Batalha" subtitle="Definição tática e resumo do objeto" icon={Target} />
              <div className="space-y-8 p-8 rounded-2xl border border-white/5 bg-white/[0.02] shadow-2xl">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">OBJETO DA AÇÃO (RESUMO)</Label>
                  <Input value={formData.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("description", e.target.value.toUpperCase())} className="bg-black/20 border-white/10 h-14 text-white font-bold" placeholder="EX: RECLAMAÇÃO TRABALHISTA - HORAS EXTRAS E ASSÉDIO" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ESTRATÉGIA / NOTAS INTERNAS</Label>
                  <Textarea 
                    value={formData.strategyNotes} 
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("strategyNotes", e.target.value)} 
                    className="bg-black/20 border-white/10 min-h-[150px] text-white resize-none text-sm" 
                    placeholder="Inisira as teses principais ou alertas para a audiência..." 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-8 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-10 h-14">
          <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        <div className="hidden md:flex gap-2">
          {steps.map(s => (
            <div key={s.id} className={cn("w-2 h-2 rounded-full", currentStep === s.id ? "bg-primary shadow-[0_0_8px_rgba(245,208,48,0.5)]" : "bg-white/5")} />
          ))}
        </div>
        {currentStep < 6 ? (
          <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-background h-14 px-12 gap-3 uppercase font-black text-[11px] tracking-widest rounded-xl">
            Próximo Passo <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => onSubmit(formData)} className="gold-gradient text-background h-14 px-14 gap-3 uppercase font-black text-[11px] tracking-widest rounded-xl shadow-2xl">
            Protocolar Processo <CheckCircle2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Dialog open={isQuickClientOpen} onOpenChange={setIsQuickClientOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-primary" /> Injeção de Dados RGMJ
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">
                Cadastro veloz de novo cliente para protocolo imediato.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6 bg-[#0a0f1e]/50">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NOME COMPLETO *</Label>
              <Input value={quickClientData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickClientData({...quickClientData, name: e.target.value.toUpperCase()})} className="bg-[#0d121f] border-white/10 h-14 text-white uppercase font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CPF / CNPJ *</Label>
              <Input value={quickClientData.cpf} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickClientData({...quickClientData, cpf: e.target.value})} className="bg-[#0d121f] border-white/10 h-14 text-white font-mono" />
            </div>
          </div>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsQuickClientOpen(false)} className="text-muted-foreground uppercase font-black text-[11px]">Cancelar</Button>
            <Button onClick={handleSaveQuickClient} disabled={isSavingClient} className="bg-primary text-background font-black uppercase text-[11px] px-10 h-14 rounded-xl">
              {isSavingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Cadastro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
