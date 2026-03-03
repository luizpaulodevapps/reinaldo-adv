
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Building2, 
  Briefcase, 
  Scale, 
  Zap, 
  ShieldCheck, 
  CheckCircle2,
  Brain,
  Plus
} from "lucide-react"
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase"
import { collection, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const steps = [
  { id: 1, label: "Identificação", icon: Users },
  { id: 2, label: "Vínculo", icon: Briefcase },
  { id: 3, label: "Causa", icon: Gavel },
  { id: 4, label: "Estratégia", icon: Target },
]

import { Gavel, Target } from "lucide-react"

export function InterviewForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) {
  const [currentStep, setCurrentStep] = useState(1)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    clientName: "",
    clientCpf: "",
    companyName: "",
    admissionalDate: "",
    demissionalDate: "",
    lastSalary: "",
    role: "",
    workingHours: "",
    overtimeInfo: "",
    insalubrityHazard: "Não",
    moralDamagesReason: "",
    generalNotes: "",
    interviewType: "Inicial Trabalhista"
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const progress = (currentStep / 4) * 100

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] font-sans">
      <div className="px-10 py-8 border-b border-white/5">
        <div className="flex justify-between items-center relative max-w-2xl mx-auto">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-white/5 z-0" />
          {steps.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all border-2",
                currentStep === step.id ? "bg-primary border-primary text-background" : "bg-[#1a1f2e] border-white/10 text-muted-foreground"
              )}>
                {step.id}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-10 max-w-3xl mx-auto space-y-10">
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Identificação do Cliente</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Nome do Cliente</Label>
                  <Input value={formData.clientName} onChange={(e) => handleInputChange("clientName", e.target.value.toUpperCase())} className="bg-black/20 border-white/10 h-14" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">CPF</Label>
                  <Input value={formData.clientCpf} onChange={(e) => handleInputChange("clientCpf", e.target.value)} className="bg-black/20 border-white/10 h-14" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4">
                <Briefcase className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Histórico de Vínculo</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Empresa / Reclamada</Label>
                  <Input value={formData.companyName} onChange={(e) => handleInputChange("companyName", e.target.value.toUpperCase())} className="bg-black/20 border-white/10 h-14" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Admissão</Label>
                  <Input type="date" value={formData.admissionalDate} onChange={(e) => handleInputChange("admissionalDate", e.target.value)} className="bg-black/20 border-white/10 h-14" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Demissão</Label>
                  <Input type="date" value={formData.demissionalDate} onChange={(e) => handleInputChange("demissionalDate", e.target.value)} className="bg-black/20 border-white/10 h-14" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4">
                <Gavel className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Verbas & Pedidos</h2>
              </div>
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Informações sobre Jornada / Horas Extras</Label>
                  <Textarea value={formData.overtimeInfo} onChange={(e) => handleInputChange("overtimeInfo", e.target.value)} className="bg-black/20 border-white/10 min-h-[100px]" placeholder="Relate o horário real de trabalho..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Danos Morais / Assédio</Label>
                  <Textarea value={formData.moralDamagesReason} onChange={(e) => handleInputChange("moralDamagesReason", e.target.value)} className="bg-black/20 border-white/10 min-h-[100px]" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4">
                <Brain className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Resumo Estratégico</h2>
              </div>
              <div className="p-8 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 space-y-6">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest text-center">A IA da banca RGMJ está pronta para consolidar esta entrevista em uma tese jurídica preliminar.</p>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Notas do Entrevistador</Label>
                  <Textarea value={formData.generalNotes} onChange={(e) => handleInputChange("generalNotes", e.target.value)} className="bg-black/20 border-white/10 min-h-[150px]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-10 border-t border-white/5 bg-black/40 flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="text-muted-foreground font-black uppercase text-[11px] tracking-widest px-8">
          Anterior
        </Button>
        {currentStep < 4 ? (
          <Button onClick={handleNext} className="bg-primary text-background font-black uppercase text-[11px] px-12 h-14 rounded-xl shadow-xl">
            Próximo <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => onSubmit(formData)} className="gold-gradient font-black uppercase text-[11px] px-12 h-14 rounded-xl shadow-xl">
            Concluir Entrevista <ShieldCheck className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
