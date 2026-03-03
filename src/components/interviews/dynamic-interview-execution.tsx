
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, ShieldCheck, ArrowRight, Brain, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DynamicInterviewProps {
  template: any
  onSubmit: (responses: any) => void
  onCancel: () => void
}

export function DynamicInterviewExecution({ template, onSubmit, onCancel }: DynamicInterviewProps) {
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const handleInputChange = (label: string, value: any) => {
    setResponses(prev => ({ ...prev, [label]: value }))
  }

  const handleSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      onSubmit(responses)
      setLoading(false)
    }, 800)
  }

  if (!template) return null

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] font-sans">
      <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{template.title}</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Execução de Triagem Técnica RGMJ</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-10">
        <div className="max-w-2xl mx-auto space-y-10 pb-20">
          {template.items?.map((field: any, idx: number) => (
            <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                <Label className="text-xs font-black text-white uppercase tracking-widest leading-relaxed">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
              </div>

              {field.type === 'text' && (
                <Textarea 
                  className="bg-black/20 border-white/10 min-h-[100px] text-white focus:ring-1 focus:ring-primary/50 text-sm resize-none"
                  placeholder="Insira o relato detalhado..."
                  value={responses[field.label] || ""}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                />
              )}

              {field.type === 'number' && (
                <Input 
                  type="number"
                  className="bg-black/20 border-white/10 h-14 text-white text-lg font-bold focus:ring-1 focus:ring-primary/50"
                  value={responses[field.label] || ""}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                />
              )}

              {field.type === 'date' && (
                <Input 
                  type="date"
                  className="bg-black/20 border-white/10 h-14 text-white focus:ring-1 focus:ring-primary/50"
                  value={responses[field.label] || ""}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                />
              )}

              {field.type === 'boolean' && (
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-primary/20 transition-all">
                  <Checkbox 
                    id={`field-${idx}`}
                    checked={responses[field.label] || false}
                    onCheckedChange={(checked) => handleInputChange(field.label, !!checked)}
                    className="border-primary/50 h-6 w-6"
                  />
                  <Label htmlFor={`field-${idx}`} className="text-sm font-bold text-muted-foreground uppercase cursor-pointer group-hover:text-white transition-colors">
                    Confirmado / Sim
                  </Label>
                </div>
              )}
            </div>
          ))}

          {(!template.items || template.items.length === 0) && (
            <div className="py-20 text-center space-y-6 opacity-30">
              <CheckCircle2 className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum campo definido para esta matriz no Laboratório.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground font-black uppercase text-[11px] tracking-widest px-8">
          Abortar
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="gold-gradient text-background font-black h-16 px-12 rounded-xl shadow-2xl uppercase text-[11px] tracking-widest gap-3 transition-all hover:scale-105 active:scale-95"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          Finalizar Coleta de Dados
        </Button>
      </div>
    </div>
  )
}
