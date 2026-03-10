"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle2, 
  ShieldCheck, 
  Brain, 
  Loader2, 
  Save, 
  AlertCircle, 
  ChevronRight, 
  ListChecks,
  Activity,
  Bookmark,
  GripVertical
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/firebase"

interface DynamicInterviewProps {
  template: any
  onSubmit: (payload: { responses: any; templateSnapshot: any[] }) => void
  onCancel: () => void
}

export function DynamicInterviewExecution({ template, onSubmit, onCancel }: DynamicInterviewProps) {
  const { user } = useUser()
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [activeGroup, setActiveGroup] = useState<string>("")
  const { toast } = useToast()

  // Agrupamento Dinâmico por Prefixo (ex: "IDENTIFICACAO:")
  const questionGroups = useMemo(() => {
    const groups: Record<string, any[]> = {}
    template?.items?.forEach((item: any) => {
      const groupName = item.label.includes(":") ? item.label.split(":")[0] : "GERAL"
      if (!groups[groupName]) groups[groupName] = []
      groups[groupName].push(item)
    })
    return groups
  }, [template?.items])

  const groupKeys = useMemo(() => Object.keys(questionGroups), [questionGroups])

  useEffect(() => {
    if (groupKeys.length > 0 && !activeGroup) {
      setActiveGroup(groupKeys[0])
    }
  }, [groupKeys, activeGroup])

  // Restauração de Cache
  useEffect(() => {
    if (typeof window !== 'undefined' && template?.id) {
      const cacheKey = `rgmj_interview_v2_${template.id}`
      const savedData = localStorage.getItem(cacheKey)
      if (savedData) {
        try {
          setResponses(JSON.parse(savedData))
        } catch (e) {
          console.error("Erro ao restaurar cache", e)
        }
      }
    }
  }, [template?.id])

  // Persistência de Cache
  useEffect(() => {
    if (typeof window !== 'undefined' && template?.id && Object.keys(responses).length > 0) {
      const cacheKey = `rgmj_interview_v2_${template.id}`
      localStorage.setItem(cacheKey, JSON.stringify(responses))
      setIsSaved(true)
      const timer = setTimeout(() => setIsSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [responses, template?.id])

  const handleInputChange = (label: string, value: any) => {
    setResponses(prev => ({ ...prev, [label]: value }))
    if (value && errors[label]) {
      setErrors(prev => ({ ...prev, [label]: false }))
    }
  }

  // Métricas de Progresso
  const totalRequired = template?.items?.filter((i: any) => i.required || i.balizaObrigatoria).length || 0
  const filledRequired = template?.items?.filter((i: any) => (i.required || i.balizaObrigatoria) && responses[i.label]).length || 0
  const progressPercent = template?.items?.length > 0 ? Math.round((Object.keys(responses).length / template.items.length) * 100) : 0

  const handleFinalize = async () => {
    const newErrors: Record<string, boolean> = {}
    const missingFields = template.items?.filter((item: any) => {
      const isMissing = (item.required || item.balizaObrigatoria) && !responses[item.label]
      if (isMissing) newErrors[item.label] = true
      return isMissing
    })

    if (missingFields?.length > 0) {
      setErrors(newErrors)
      // Pula para o grupo do primeiro erro encontrado
      const firstMissing = missingFields[0]
      const groupOfError = firstMissing.label.includes(":") ? firstMissing.label.split(":")[0] : "GERAL"
      setActiveGroup(groupOfError)
      
      toast({
        variant: "destructive",
        title: "Dados Obrigatórios Pendentes",
        description: `Existem ${missingFields.length} campos essenciais vazios no capítulo ${groupOfError}.`,
      })
      return
    }

    const templateSnapshot = (template.items || []).map((item: any) => ({ ...item }))

    setLoading(true)
    try {
      await onSubmit({ responses, templateSnapshot })
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`rgmj_interview_v2_${template.id}`)
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Falha no Protocolo" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[90vh] bg-[#02040a] font-sans overflow-hidden border border-white/5 rounded-3xl">
      {/* Header Estratégico */}
      <div className="flex-none p-6 md:p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between shadow-2xl relative z-20">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5">
            <Brain className="h-7 w-7 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{template?.title}</h3>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="text-[9px] font-black border-primary/30 text-primary uppercase bg-primary/5 px-3">CAPTURA EM CURSO</Badge>
              <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-40">RGMJ ADVOGADOS • PROTOCOLO DIGITAL</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-4">
            {isSaved && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
                <Save className="h-3 w-3 text-emerald-500" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Sincronizado</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Status da Triagem</p>
              <p className="text-xs font-mono font-bold text-primary">{filledRequired}/{totalRequired} Balizas OK</p>
            </div>
          </div>
          <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <Progress value={progressPercent} className="h-full bg-primary shadow-[0_0_10px_rgba(245,208,48,0.3)] transition-all duration-700" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de Capítulos */}
        <div className="w-72 border-r border-white/5 bg-[#0a0f1e]/40 flex-none flex flex-col shadow-inner">
          <div className="p-6 border-b border-white/5 bg-black/20 flex items-center gap-3">
            <ListChecks className="h-4 w-4 text-primary" />
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Índice Tático</h4>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {groupKeys.map((group) => {
                const groupItems = questionGroups[group]
                const groupFilled = groupItems.filter(i => responses[i.label]).length
                const isActive = activeGroup === group
                
                return (
                  <button
                    key={group}
                    onClick={() => setActiveGroup(group)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl transition-all border group relative overflow-hidden",
                      isActive 
                        ? "bg-primary/10 border-primary/30 shadow-lg" 
                        : "bg-transparent border-transparent hover:bg-white/5 text-muted-foreground"
                    )}
                  >
                    {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-primary" />}
                    <div className="flex flex-col gap-1 relative z-10">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest leading-tight transition-colors",
                        isActive ? "text-primary" : "group-hover:text-white"
                      )}>
                        {group}
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5">
                          {groupFilled === groupItems.length ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                          )}
                          <span className="text-[8px] font-bold uppercase opacity-40">{groupFilled}/{groupItems.length} itens</span>
                        </div>
                        {isActive && <ChevronRight className="h-3 w-3 text-primary animate-in slide-in-from-left-2" />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
          
          <div className="p-6 border-t border-white/5 bg-black/40">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Ritmo de Coleta</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Completude</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Área de Captura */}
        <ScrollArea className="flex-1 bg-[#05070a] relative">
          <div className="max-w-4xl mx-auto p-10 md:p-16 space-y-12 pb-40">
            
            {/* Header da Categoria */}
            <div className="space-y-3 border-b border-white/5 pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Bookmark className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Capítulo em Foco</h4>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{activeGroup}</h2>
                </div>
              </div>
            </div>

            <div className="space-y-16">
              {questionGroups[activeGroup]?.map((field: any, idx: number) => {
                const isError = errors[field.label]
                const isFilled = !!responses[field.label]
                
                return (
                  <div 
                    key={idx} 
                    className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500" 
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-1 h-6 rounded-full transition-all mt-1",
                          isError ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : 
                          isFilled ? "bg-emerald-500" : "bg-white/10"
                        )} />
                        <div className="space-y-1.5">
                          <Label className={cn(
                            "text-sm font-bold uppercase tracking-widest leading-relaxed transition-colors",
                            isError ? "text-rose-400" : isFilled ? "text-white" : "text-white/70"
                          )}>
                            {field.label.replace(`${activeGroup}:`, "").trim()} 
                            {(field.required || field.balizaObrigatoria) && <span className="text-destructive ml-1 text-lg">*</span>}
                          </Label>
                          {field.balizaObrigatoria && (
                            <div className="flex items-center gap-2 text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 w-fit px-2 py-0.5 rounded-sm">
                              <Brain className="h-2.5 w-2.5" /> Baliza de Inteligência IA
                            </div>
                          )}
                        </div>
                      </div>
                      {isError && (
                        <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-widest animate-pulse border-0 bg-rose-500/20 text-rose-400 h-6 px-3">
                          Pendente
                        </Badge>
                      )}
                    </div>

                    <div className={cn(
                      "pl-5 transition-all duration-300",
                      isError ? "border-l border-rose-500/30" : "border-l border-white/5"
                    )}>
                      {field.type === 'text' && (
                        <div className="relative group">
                          <Textarea 
                            className={cn(
                              "bg-black/40 border-white/10 min-h-[140px] text-white focus:ring-1 focus:ring-primary/50 text-sm leading-relaxed resize-none p-6 rounded-2xl transition-all shadow-inner",
                              isError && "border-rose-500/30 bg-rose-500/5",
                              isFilled && "border-emerald-500/20"
                            )}
                            placeholder="Descreva aqui o relato técnico..."
                            value={responses[field.label] || ""}
                            onChange={(e) => handleInputChange(field.label, e.target.value)}
                          />
                          <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-20 transition-opacity">
                            <GripVertical className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      )}

                      {field.type === 'number' && (
                        <div className="relative max-w-sm">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-sm">R$</span>
                          <Input 
                            type="number"
                            className={cn(
                              "bg-black/40 border-white/10 h-16 pl-14 text-white text-xl font-black focus:ring-1 focus:ring-primary/50 rounded-2xl shadow-inner",
                              isError && "border-rose-500/30 bg-rose-500/5"
                            )}
                            placeholder="0,00"
                            value={responses[field.label] || ""}
                            onChange={(e) => handleInputChange(field.label, e.target.value)}
                          />
                        </div>
                      )}

                      {field.type === 'boolean' && (
                        <RadioGroup 
                          value={responses[field.label]} 
                          onValueChange={(v) => handleInputChange(field.label, v)}
                          className="grid grid-cols-2 gap-4 max-w-lg"
                        >
                          {[
                            { v: "Sim", c: "emerald" },
                            { v: "Não", c: "rose" }
                          ].map(opt => (
                            <div 
                              key={opt.v}
                              onClick={() => handleInputChange(field.label, opt.v)}
                              className={cn(
                                "flex items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer group shadow-lg",
                                responses[field.label] === opt.v 
                                  ? `border-${opt.c}-500 bg-${opt.c}-500/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]` 
                                  : "border-white/5 bg-white/[0.02] hover:border-white/10"
                              )}
                            >
                              <RadioGroupItem value={opt.v} className={cn(`border-${opt.c}-500 text-${opt.c}-500`)} />
                              <Label className="text-xs font-black text-white uppercase cursor-pointer tracking-[0.2em]">{opt.v}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {field.type === 'boolean_partial' && (
                        <RadioGroup 
                          value={responses[field.label]} 
                          onValueChange={(v) => handleInputChange(field.label, v)}
                          className="grid grid-cols-3 gap-4"
                        >
                          {[
                            { v: "Sim", c: "emerald" },
                            { v: "Parcial", c: "amber" },
                            { v: "Não", c: "rose" }
                          ].map(opt => (
                            <div 
                              key={opt.v}
                              onClick={() => handleInputChange(field.label, opt.v)}
                              className={cn(
                                "flex items-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-lg",
                                responses[field.label] === opt.v 
                                  ? `border-${opt.c}-500 bg-${opt.c}-500/10` 
                                  : "border-white/5 bg-white/[0.02] hover:border-white/10"
                              )}
                            >
                              <RadioGroupItem value={opt.v} className={cn(`border-${opt.c}-500 text-${opt.c}-500`)} />
                              <Label className="text-[10px] font-black text-white uppercase cursor-pointer tracking-widest">{opt.v}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Footer de Ação */}
      <div className="flex-none p-8 border-t border-white/5 bg-black/60 flex items-center justify-between shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative z-20">
        <Button 
          variant="ghost" 
          onClick={onCancel} 
          disabled={loading}
          className="text-muted-foreground font-black uppercase text-[11px] tracking-widest px-10 h-14 hover:text-white transition-all"
        >
          Abortar Coleta
        </Button>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end gap-1">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Responsável Técnico</span>
            <span className="text-xs font-bold text-white uppercase">{user?.displayName}</span>
          </div>
          <Button 
            onClick={handleFinalize} 
            disabled={loading}
            className="gold-gradient text-background font-black h-16 px-16 rounded-2xl shadow-2xl uppercase text-[13px] tracking-[0.2em] gap-4 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6 transition-transform group-hover:scale-110" />}
            PROTOCOLAR ATENDIMENTO
            <div className="absolute top-0 -left-full w-full h-full bg-white/10 skew-x-[45deg] group-hover:left-[200%] transition-all duration-1000" />
          </Button>
        </div>
      </div>
    </div>
  )
}