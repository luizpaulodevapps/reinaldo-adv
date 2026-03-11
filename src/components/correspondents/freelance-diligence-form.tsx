
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Scale, 
  MapPin, 
  Users, 
  Building2, 
  Calendar, 
  Clock, 
  DollarSign, 
  Tag,
  Briefcase,
  AlertCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function FreelanceDiligenceForm({ initialData, freelancers, counterparties, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    type: "Audiência",
    processNumber: "",
    court: "",
    city: "",
    serviceDate: new Date().toISOString().split('T')[0],
    deadline: "",
    freelancerId: "",
    freelancerName: "",
    solicitorId: "",
    solicitorName: "",
    valueToPay: 0,
    valueToCharge: 0,
    extraExpenses: 0,
    status: "Criada",
    notes: ""
  })

  useEffect(() => {
    if (initialData) setFormData({ ...initialData })
  }, [initialData])

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block"
  const inputClass = "bg-black/40 border-white/10 h-12 text-white text-xs font-bold uppercase"

  const margin = formData.valueToCharge - (formData.valueToPay + formData.extraExpenses)

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-2">
              <Tag className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Escopo do Serviço</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className={labelMini}>Tipo de Diligência *</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    <SelectItem value="Audiência">🏛️ AUDIÊNCIA</SelectItem>
                    <SelectItem value="Protocolo">📝 PROTOCOLO</SelectItem>
                    <SelectItem value="Cópias">📄 CÓPIAS / DIGITALIZAÇÃO</SelectItem>
                    <SelectItem value="Despacho">🗣️ DESPACHO</SelectItem>
                    <SelectItem value="Certidão">📑 CERTIDÃO</SelectItem>
                    <SelectItem value="Outro">🌐 OUTRO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>Processo Relacionado (CNJ)</Label>
                <Input value={formData.processNumber} onChange={e => setFormData({...formData, processNumber: e.target.value})} className={inputClass} placeholder="0000000-00.0000.0.00.0000" />
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>Fórum / Órgão</Label>
                <Input value={formData.court} onChange={e => setFormData({...formData, court: e.target.value.toUpperCase()})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>Cidade do Serviço</Label>
                <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value.toUpperCase()})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>Data do Serviço</Label>
                <Input type="date" value={formData.serviceDate} onChange={e => setFormData({...formData, serviceDate: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>Prazo Fatal</Label>
                <Input type="datetime-local" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-2">
              <Users className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Responsáveis</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className={labelMini}>Freelancer / Correspondente *</Label>
                <Select 
                  value={formData.freelancerId} 
                  onValueChange={v => {
                    const f = freelancers.find((item: any) => item.id === v)
                    setFormData({...formData, freelancerId: v, freelancerName: f?.name || ""})
                  }}
                >
                  <SelectTrigger className={inputClass}><SelectValue placeholder="SELECIONE O PROFISSIONAL" /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    {freelancers.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>{f.name.toUpperCase()} ({f.city})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>Entidade Solicitante *</Label>
                <Select 
                  value={formData.solicitorId} 
                  onValueChange={v => {
                    const c = counterparties.find((item: any) => item.id === v)
                    setFormData({...formData, solicitorId: v, solicitorName: c?.name || ""})
                  }}
                >
                  <SelectTrigger className={inputClass}><SelectValue placeholder="QUEM SOLICITOU?" /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    {counterparties.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name.toUpperCase()} ({c.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className={labelMini}>Instruções Adicionais</Label>
            <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="bg-black/40 border-white/10 min-h-[120px] text-white text-xs resize-none" placeholder="REGRAS DE CONDUÇÃO, ACESSOS, ETC..." />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="p-8 rounded-[2rem] bg-[#0d121f] border border-white/5 space-y-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Painel Financeiro</h4>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Valor a Pagar (Custo) *</Label>
                <Input 
                  type="number" 
                  value={formData.valueToPay} 
                  onChange={e => setFormData({...formData, valueToPay: Number(e.target.value)})} 
                  className="bg-rose-500/5 border-rose-500/20 h-14 text-white text-lg font-black"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Valor a Cobrar (Receita) *</Label>
                <Input 
                  type="number" 
                  value={formData.valueToCharge} 
                  onChange={e => setFormData({...formData, valueToCharge: Number(e.target.value)})} 
                  className="bg-emerald-500/5 border-emerald-500/20 h-14 text-white text-lg font-black"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Despesas Adicionais (Reembolso)</Label>
                <Input 
                  type="number" 
                  value={formData.extraExpenses} 
                  onChange={e => setFormData({...formData, extraExpenses: Number(e.target.value)})} 
                  className="bg-white/5 border-white/10 h-12 text-white font-bold"
                />
              </div>
            </div>

            <div className={cn(
              "p-6 rounded-2xl border flex flex-col items-center justify-center text-center gap-2",
              margin >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
            )}>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Margem Estimada</span>
              <span className={cn("text-2xl font-black", margin >= 0 ? "text-emerald-400" : "text-rose-400")}>
                R$ {margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Label className={labelMini}>Status Operacional</Label>
            <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
              <SelectTrigger className="bg-primary/10 border-primary/20 h-14 text-primary font-black uppercase text-xs rounded-xl shadow-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d121f] text-white">
                {["Criada", "Ofertada", "Aceita", "Em Execução", "Entregue", "Aprovada", "Faturada", "Cancelada"].map(s => (
                  <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-400/70 font-bold uppercase leading-relaxed">
                Ao alterar para <span className="text-white">FATURADA</span>, o sistema irá injetar automaticamente os registros na Central Financeira.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-10 border-t border-white/5">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-10 h-14">CANCELAR</Button>
        <Button onClick={() => onSubmit(formData)} className="gold-gradient text-background font-black h-14 px-16 rounded-2xl shadow-2xl uppercase text-xs tracking-widest flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" /> FINALIZAR LANÇAMENTO
        </Button>
      </div>
    </div>
  )
}
