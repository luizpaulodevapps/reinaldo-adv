
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
  AlertCircle,
  TrendingUp,
  Landmark,
  FileText,
  ShieldCheck,
  Gavel
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function FreelanceDiligenceForm({ initialData, freelancers, counterparties, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    type: "Audiência Freelance",
    processNumber: "",
    court: "",
    city: "",
    serviceDate: new Date().toISOString().split('T')[0],
    serviceTime: "09:00",
    deadline: "",
    freelancerId: "",
    freelancerName: "",
    freelancerPix: "",
    solicitorId: "",
    solicitorName: "",
    valueToPay: 0,
    valueToCharge: 0,
    extraExpenses: 0,
    status: "Criada",
    notes: ""
  })

  useEffect(() => {
    if (initialData) setFormData({ ...formData, ...initialData })
  }, [initialData])

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block"
  const inputClass = "bg-black/40 border-white/10 h-12 text-white text-xs font-bold uppercase focus:ring-1 focus:ring-primary/50"

  const handleSelectFreelancer = (id: string) => {
    const f = freelancers.find((item: any) => item.id === id)
    if (!f) return
    
    const actType = formData.type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    let defaultValue = 0
    if (actType.includes('audiencia')) defaultValue = f.prices?.audiencia || 0
    else if (actType.includes('protocolo')) defaultValue = f.prices?.protocolo || 0
    else if (actType.includes('copia')) defaultValue = f.prices?.copias || 0
    else if (actType.includes('despacho')) defaultValue = f.prices?.despacho || 0

    setFormData(prev => ({
      ...prev,
      freelancerId: id,
      freelancerName: f.name,
      freelancerPix: f.pixKey || "",
      valueToPay: defaultValue > 0 ? defaultValue : prev.valueToPay,
      city: f.city || prev.city
    }))
  }

  const margin = Number(formData.valueToCharge) - (Number(formData.valueToPay) + (Number(formData.extraExpenses) || 0))

  return (
    <div className="space-y-10 font-sans pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Escopo da Ordem de Serviço</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className={labelMini}>Natureza do Ato Freelance *</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger className={cn(inputClass, "h-14")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    <SelectItem value="Audiência Freelance" className="font-black text-primary uppercase">🏛️ AUDIÊNCIA FREELANCE</SelectItem>
                    <SelectItem value="Protocolo Freelance">📝 PROTOCOLO FREELANCE</SelectItem>
                    <SelectItem value="Despacho Freelance">🗣️ DESPACHO FREELANCE</SelectItem>
                    <SelectItem value="Cópias / Digitalização">📄 CÓPIAS / DIGITALIZAÇÃO</SelectItem>
                    <SelectItem value="Outro Ato de Logística">🌐 OUTRO ATO DE LOGÍSTICA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>Processo Relacionado (CNJ)</Label>
                <Input value={formData.processNumber} onChange={e => setFormData({...formData, processNumber: e.target.value})} className={cn(inputClass, "h-14 font-mono")} placeholder="0000000-00.0000.0.00.0000" />
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>Tribunal / Órgão</Label>
                <Input value={formData.court} onChange={e => setFormData({...formData, court: e.target.value.toUpperCase()})} className={cn(inputClass, "h-14")} />
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>Comarca / Cidade</Label>
                <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value.toUpperCase()})} className={cn(inputClass, "h-14")} />
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-2">
                  <Label className={labelMini}>Data do Serviço</Label>
                  <Input type="date" value={formData.serviceDate} onChange={e => setFormData({...formData, serviceDate: e.target.value})} className={cn(inputClass, "h-14")} />
                </div>
                <div className="space-y-2">
                  <Label className={labelMini}>Horário do Ato</Label>
                  <Input type="time" value={formData.serviceTime} onChange={e => setFormData({...formData, serviceTime: e.target.value})} className={cn(inputClass, "h-14")} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <Users className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Alocação de Correspondente</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className={labelMini}>Membro Executor *</Label>
                <Select value={formData.freelancerId} onValueChange={handleSelectFreelancer}>
                  <SelectTrigger className={cn(inputClass, "h-14")}><SelectValue placeholder="SELECIONE O PROFISSIONAL" /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    {freelancers.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-black uppercase text-xs">{f.name}</span>
                          <span className="text-[9px] opacity-40 font-bold">{f.city} - {f.state}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>Entidade Contratante *</Label>
                <Select 
                  value={formData.solicitorId} 
                  onValueChange={v => {
                    const c = counterparties.find((item: any) => item.id === v)
                    setFormData({...formData, solicitorId: v, solicitorName: c?.name || ""})
                  }}
                >
                  <SelectTrigger className={cn(inputClass, "h-14")}><SelectValue placeholder="QUEM SOLICITOU O ATO?" /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    {counterparties.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-black uppercase text-xs">{c.name}</span>
                          <span className="text-[9px] opacity-40 font-bold">{c.type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className={labelMini}>Instruções para o Freelancer</Label>
            <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="bg-black/40 border-white/10 min-h-[150px] text-white text-xs resize-none p-6 rounded-2xl" placeholder="DETALHES DA PAUTA, LINKS DE ACESSO OU PROCEDIMENTOS..." />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="p-8 rounded-[2.5rem] bg-[#0d121f] border border-white/10 space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><DollarSign className="h-20 w-20" /></div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Controle de Repasse</h4>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                  <Landmark className="h-3 w-3" /> Valor Freelance (Custo) *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 font-black text-sm">R$</span>
                  <Input 
                    type="number" 
                    value={formData.valueToPay} 
                    onChange={e => setFormData({...formData, valueToPay: Number(e.target.value)})} 
                    className="bg-rose-500/5 border-rose-500/20 h-16 pl-12 text-white text-xl font-black rounded-xl"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign className="h-3 w-3" /> Valor Cobrado (Receita) *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-sm">R$</span>
                  <Input 
                    type="number" 
                    value={formData.valueToCharge} 
                    onChange={e => setFormData({...formData, valueToCharge: Number(e.target.value)})} 
                    className="bg-emerald-500/5 border-emerald-500/20 h-16 pl-12 text-white text-xl font-black rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Despesas Adicionais (KM/Estac.)</Label>
                <Input 
                  type="number" 
                  value={formData.extraExpenses} 
                  onChange={e => setFormData({...formData, extraExpenses: Number(e.target.value)})} 
                  className="bg-white/5 border-white/10 h-12 text-white font-bold"
                />
              </div>
            </div>

            <div className={cn(
              "p-8 rounded-3xl border-2 flex flex-col items-center justify-center text-center gap-2 shadow-inner",
              margin >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"
            )}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Resultado Operacional</span>
              <span className={cn("text-3xl font-black tabular-nums", margin >= 0 ? "text-emerald-400" : "text-rose-400")}>
                R$ {margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className={labelMini}>Status Operacional</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger className="bg-primary/10 border-primary/20 h-16 text-primary font-black uppercase text-xs rounded-2xl shadow-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d121f] text-white">
                  {["Criada", "Ofertada", "Aceita", "Em Execução", "Entregue", "Aprovada", "Faturada", "Cancelada"].map(s => (
                    <SelectItem key={s} value={s} className="uppercase text-[10px] font-black">{s.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-4 shadow-lg">
              <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-400/70 font-bold uppercase leading-relaxed tracking-wider">
                Ao faturar a <span className="text-white">ORDEM FREELANCE</span>, o sistema lançará automaticamente o débito do executor e o crédito do solicitante na central financeira.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-white/5 gap-6">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-10 h-14 hover:text-white">DESCARTAR</Button>
        <Button onClick={() => onSubmit(formData)} className="w-full md:w-[450px] gold-gradient text-background font-black h-16 px-16 rounded-2xl shadow-[0_20px_50px_rgba(245,208,48,0.2)] uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95">
          <ShieldCheck className="h-6 w-6" /> {initialData ? "ATUALIZAR ORDEM" : "REGISTRAR ATO FREELANCE"}
        </Button>
      </div>
    </div>
  )
}
