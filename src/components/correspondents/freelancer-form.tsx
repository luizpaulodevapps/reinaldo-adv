
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { maskPhone, maskCPFOrCNPJ } from "@/lib/utils"

export function FreelancerForm({ initialData, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: "",
    documentNumber: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    pixKey: "",
    notes: "",
    isActive: true
  })

  useEffect(() => {
    if (initialData) setFormData({ ...initialData })
  }, [initialData])

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block"
  const inputClass = "bg-[#0d121f] border-white/10 h-12 text-white text-xs font-bold"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className={labelMini}>Nome Completo / Razão *</Label>
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className={inputClass} />
        </div>
        <div className="space-y-2">
          <Label className={labelMini}>CPF / CNPJ *</Label>
          <Input value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: maskCPFOrCNPJ(e.target.value)})} className={inputClass} placeholder="000.000.000-00" />
        </div>
        <div className="space-y-2">
          <Label className={labelMini}>WhatsApp / Celular</Label>
          <Input value={formData.phone} onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} className={inputClass} placeholder="(00) 00000-0000" />
        </div>
        <div className="space-y-2">
          <Label className={labelMini}>E-mail de Contato</Label>
          <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} className={inputClass} />
        </div>
        <div className="space-y-2">
          <Label className={labelMini}>Cidade</Label>
          <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value.toUpperCase()})} className={inputClass} />
        </div>
        <div className="space-y-2">
          <Label className={labelMini}>Estado (UF)</Label>
          <Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} maxLength={2} className={inputClass} />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label className={labelMini}>Chave PIX / Dados Bancários</Label>
          <Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} className={inputClass} placeholder="CPF, E-mail, Celular ou Aleatória" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label className={labelMini}>Observações Técnicas</Label>
          <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="bg-[#0d121f] border-white/10 min-h-[100px] text-white text-xs resize-none" />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
        <div className="space-y-0.5">
          <Label className="text-xs font-bold text-white uppercase">Status do Parceiro</Label>
          <p className="text-[10px] text-muted-foreground uppercase">Habilitar ou suspender o recebimento de novas ordens.</p>
        </div>
        <Switch checked={formData.isActive} onCheckedChange={v => setFormData({...formData, isActive: v})} className="data-[state=checked]:bg-emerald-500" />
      </div>

      <div className="flex justify-between pt-6 border-t border-white/5">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground uppercase font-black text-[10px] tracking-widest px-8 h-12">CANCELAR</Button>
        <Button onClick={() => onSubmit(formData)} className="gold-gradient text-background font-black uppercase text-[10px] tracking-widest px-12 h-12 rounded-xl shadow-xl">
          {initialData ? "ATUALIZAR PARCEIRO" : "SALVAR NO BANCO"}
        </Button>
      </div>
    </div>
  )
}
