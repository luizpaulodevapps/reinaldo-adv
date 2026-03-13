
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { maskPhone, maskCPFOrCNPJ } from "@/lib/utils"
import { 
  User, 
  MapPin, 
  Wallet, 
  Tag, 
  DollarSign, 
  Landmark,
  ShieldCheck,
  Smartphone,
  Mail
} from "lucide-react"

export function FreelancerForm({ initialData, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: "",
    documentNumber: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    pixKey: "",
    bankName: "",
    notes: "",
    isActive: true,
    prices: {
      audiencia: 0,
      protocolo: 0,
      copias: 0,
      despacho: 0
    }
  })

  useEffect(() => {
    if (initialData) setFormData({ ...formData, ...initialData })
  }, [initialData])

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 block"
  const inputClass = "bg-black/40 border-white/10 h-12 text-white text-xs font-bold uppercase focus:ring-1 focus:ring-primary/50"

  const handlePriceChange = (act: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      prices: { ...prev.prices, [act]: Number(val) }
    }))
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bloco de Identificação */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <User className="h-4 w-4 text-primary" />
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Identidade Profissional</h4>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className={labelMini}>Nome Completo / Razão Social *</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelMini}>CPF / CNPJ *</Label>
                <Input value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: maskCPFOrCNPJ(e.target.value)})} className={inputClass} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>WhatsApp Direct</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} className={cn(inputClass, "pl-10")} placeholder="(00) 00000-0000" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelMini}>Cidade Atuação</Label>
                <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value.toUpperCase()})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className={labelMini}>Estado (UF)</Label>
                <Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} maxLength={2} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco de Tabela de Preços */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <Tag className="h-4 w-4 text-primary" />
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Tabela de Preços (Referência)</h4>
          </div>
          <div className="grid grid-cols-2 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="space-y-2">
              <Label className={labelMini}>Audiência Base</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black text-[10px]">R$</span>
                <Input type="number" value={formData.prices.audiencia} onChange={e => handlePriceChange('audiencia', e.target.value)} className={cn(inputClass, "pl-10")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={labelMini}>Protocolo / Ato</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black text-[10px]">R$</span>
                <Input type="number" value={formData.prices.protocolo} onChange={e => handlePriceChange('protocolo', e.target.value)} className={cn(inputClass, "pl-10")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={labelMini}>Despacho</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black text-[10px]">R$</span>
                <Input type="number" value={formData.prices.despacho} onChange={e => handlePriceChange('despacho', e.target.value)} className={cn(inputClass, "pl-10")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={labelMini}>Cópia / Digitaliz.</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black text-[10px]">R$</span>
                <Input type="number" value={formData.prices.copias} onChange={e => handlePriceChange('copias', e.target.value)} className={cn(inputClass, "pl-10")} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Financeiro / Bancário */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <Wallet className="h-4 w-4 text-primary" />
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Ritual de Pagamento (PIX)</h4>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className={labelMini}>Chave PIX Oficial</Label>
              <Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} className={inputClass} placeholder="CPF, CELULAR OU E-MAIL" />
            </div>
            <div className="space-y-2">
              <Label className={labelMini}>Banco / Instituição</Label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
                <Input value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value.toUpperCase()})} className={cn(inputClass, "pl-10")} />
              </div>
            </div>
          </div>
        </div>

        {/* Status e Notas */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Soberania e Notas</h4>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white uppercase">Status Operacional</span>
                <p className="text-[9px] text-muted-foreground uppercase">Habilitar recebimento de ordens</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={v => setFormData({...formData, isActive: v})} className="data-[state=checked]:bg-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label className={labelMini}>Notas Técnicas</Label>
              <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="bg-black/40 border-white/10 min-h-[80px] text-white text-[11px] resize-none p-4 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-10 border-t border-white/5">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-10 h-14">CANCELAR</Button>
        <Button onClick={() => onSubmit(formData)} className="gold-gradient text-background font-black h-14 px-16 rounded-2xl shadow-2xl uppercase text-[11px] tracking-widest">
          {initialData ? "ATUALIZAR CADASTRO" : "SALVAR NO BANCO DE TALENTOS"}
        </Button>
      </div>
    </div>
  )
}
