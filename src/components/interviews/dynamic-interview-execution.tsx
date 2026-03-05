"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, ShieldCheck, Brain, Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface DynamicInterviewProps {
  template: any
  onSubmit: (payload: { responses: any; templateSnapshot: any[] }) => void
  onCancel: () => void
}

export function DynamicInterviewExecution({ template, onSubmit, onCancel }: DynamicInterviewProps) {
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Carregar cache local ao montar o componente para evitar perda de dados
  useEffect(() => {
    if (typeof window !== 'undefined' && template?.id) {
      const cacheKey = `rgmj_interview_v1_${template.id}`
      const savedData = localStorage.getItem(cacheKey)
      if (savedData) {
        try {
          setResponses(JSON.parse(savedData))
        } catch (e) {
          console.error("Erro ao restaurar cache da entrevista", e)
        }
      }
    }
  }, [template?.id])

  // Salvar automaticamente no cache a cada mudança
  useEffect(() => {
    if (typeof window !== 'undefined' && template?.id && Object.keys(responses).length > 0) {
      const cacheKey = `rgmj_interview_v1_${template.id}`
      localStorage.setItem(cacheKey, JSON.stringify(responses))
      
      setIsSaved(true)
      const timer = setTimeout(() => setIsSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [responses, template?.id])

  const handleInputChange = (label: string, value: any) => {
    setResponses(prev => ({ ...prev, [label]: value }))
  }

  const handleFinalize = () => {
    const missingFields = template.items?.filter((item: any) => (item.required || item.balizaObrigatoria) && !responses[item.label])
    if (missingFields?.length > 0) {
      alert(`Os seguintes campos são obrigatórios para a banca: ${missingFields.map((f: any) => f.label).join(", ")}`)
      return
    }

    const templateSnapshot = (template.items || []).map((item: any) => ({
      label: item.label,
      type: item.type,
      required: Boolean(item.required),
      reuseEnabled: Boolean(item.reuseEnabled),
      reuseTarget: item.reuseTarget || "caseDetails",
      targetField: item.targetField || "",
      reusePriority: item.reusePriority || "media",
      balizaObrigatoria: Boolean(item.balizaObrigatoria),
    }))

    setLoading(true)
    setTimeout(() => {
      onSubmit({ responses, templateSnapshot })
      // Limpa cache após envio bem sucedido
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`rgmj_interview_v1_${template.id}`)
      }
      setLoading(false)
    }, 800)
  }

  if (!template) return null

  return (
    <div className="flex flex-col h-[85vh] bg-[#0a0f1e] font-sans">
      <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{template.title}</h3>
            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.25em] mt-2 opacity-60">Triagem Técnica RGMJ Elite</p>
          </div>
        </div>
        
        {isSaved && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
            <Save className="h-3 w-3 text-emerald-500" />
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Protegido em Cache</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-10 space-y-12 pb-32">
          {template.items?.map((field: any, idx: number) => (
            <div key={idx} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 40}ms` }}>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(245,208,48,0.5)]" />
                <Label className="text-xs font-black text-white uppercase tracking-[0.15em] leading-relaxed">
                  {field.label} {field.required && <span className="text-destructive font-bold">*</span>}
                </Label>
              </div>

              <div className="pl-4 border-l border-white/5 space-y-4">
                {field.type === 'text' && (
                  <Textarea 
                    className="bg-black/30 border-white/10 min-h-[120px] text-white focus:ring-1 focus:ring-primary/50 text-sm resize-none p-5 rounded-xl transition-all"
                    placeholder="Relato técnico detalhado..."
                    value={responses[field.label] || ""}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                  />
                )}

                {field.type === 'number' && (
                  <Input 
                    type="number"
                    className="bg-black/30 border-white/10 h-14 text-white text-lg font-black focus:ring-1 focus:ring-primary/50 rounded-xl px-5"
                    placeholder="0,00"
                    value={responses[field.label] || ""}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                  />
                )}

                {field.type === 'boolean' && (
                  <RadioGroup 
                    value={responses[field.label]} 
                    onValueChange={(v) => handleInputChange(field.label, v)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className={cn(
                      "flex items-center gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer group",
                      responses[field.label] === "Sim" ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-white/5 bg-white/[0.02] hover:border-white/10"
                    )}>
                      <RadioGroupItem value="Sim" id={`yes-${idx}`} className="border-emerald-500 text-emerald-500" />
                      <Label htmlFor={`yes-${idx}`} className="text-xs font-black text-white uppercase cursor-pointer tracking-widest">Sim</Label>
                    </div>
                    <div className={cn(
                      "flex items-center gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer group",
                      responses[field.label] === "Não" ? "border-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-white/5 bg-white/[0.02] hover:border-white/10"
                    )}>
                      <RadioGroupItem value="Não" id={`no-${idx}`} className="border-rose-500 text-rose-500" />
                      <Label htmlFor={`no-${idx}`} className="text-xs font-black text-white uppercase cursor-pointer tracking-widest">Não</Label>
                    </div>
                  </RadioGroup>
                )}

                {field.type === 'boolean_partial' && (
                  <RadioGroup 
                    value={responses[field.label]} 
                    onValueChange={(v) => handleInputChange(field.label, v)}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                      responses[field.label] === "Sim" ? "border-emerald-500 bg-emerald-500/10" : "border-white/5 bg-white/[0.02]"
                    )}>
                      <RadioGroupItem value="Sim" id={`pyes-${idx}`} className="border-emerald-500 text-emerald-500" />
                      <Label htmlFor={`pyes-${idx}`} className="text-[10px] font-black text-white uppercase cursor-pointer">Sim</Label>
                    </div>
                    <div className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                      responses[field.label] === "Parcial" ? "border-amber-500 bg-amber-500/10" : "border-white/5 bg-white/[0.02]"
                    )}>
                      <RadioGroupItem value="Parcial" id={`ppart-${idx}`} className="border-amber-500 text-amber-500" />
                      <Label htmlFor={`ppart-${idx}`} className="text-[10px] font-black text-white uppercase cursor-pointer">Parcial</Label>
                    </div>
                    <div className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                      responses[field.label] === "Não" ? "border-rose-500 bg-rose-500/10" : "border-white/5 bg-white/[0.02]"
                    )}>
                      <RadioGroupItem value="Não" id={`pno-${idx}`} className="border-rose-500 text-rose-500" />
                      <Label htmlFor={`pno-${idx}`} className="text-[10px] font-black text-white uppercase cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                )}
              </div>
            </div>
          ))}

          {(!template.items || template.items.length === 0) && (
            <div className="py-32 text-center space-y-6 opacity-20">
              <CheckCircle2 className="h-20 w-20 mx-auto text-muted-foreground" />
              <p className="text-[11px] font-black uppercase tracking-[0.5em]">Matriz de dados vazia.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <Button 
          variant="ghost" 
          onClick={onCancel} 
          className="text-muted-foreground font-black uppercase text-[11px] tracking-[0.2em] px-10 h-14 hover:text-white transition-colors"
        >
          Abortar Ato
        </Button>
        <Button 
          onClick={handleFinalize} 
          disabled={loading}
          className="gold-gradient text-background font-black h-16 px-16 rounded-xl shadow-2xl uppercase text-[12px] tracking-[0.2em] gap-4 transition-all hover:scale-[1.02] active:scale-95"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
          Protocolar Entrevista
        </Button>
      </div>
    </div>
  )
}
