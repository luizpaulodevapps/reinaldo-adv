
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { maskCPFOrCNPJ, maskPhone } from "@/lib/utils"

export function CounterpartyForm({ initialData, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: "",
    type: "Cliente",
    documentNumber: "",
    email: "",
    phone: ""
  })

  useEffect(() => {
    if (initialData) setFormData({ ...initialData })
  }, [initialData])

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block"
  const inputClass = "bg-[#0d121f] border-white/10 h-12 text-white text-xs font-bold"

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className={labelMini}>Nome da Entidade *</Label>
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className={labelMini}>Tipo de Solicitante</Label>
            <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
              <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d121f] text-white">
                <SelectItem value="Cliente">Cliente Interno</SelectItem>
                <SelectItem value="Escritório Parceiro">Escritório Parceiro</SelectItem>
                <SelectItem value="Empresa">Empresa Contratante</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={labelMini}>CPF / CNPJ</Label>
            <Input value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: maskCPFOrCNPJ(e.target.value)})} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className={labelMini}>E-mail</Label>
            <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className={labelMini}>Telefone</Label>
            <Input value={formData.phone} onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-white/5">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground uppercase font-black text-[10px] tracking-widest px-8 h-12">CANCELAR</Button>
        <Button onClick={() => onSubmit(formData)} className="gold-gradient text-background font-black uppercase text-[10px] tracking-widest px-12 h-12 rounded-xl shadow-xl">
          {initialData ? "ATUALIZAR DADOS" : "CADASTRAR ENTIDADE"}
        </Button>
      </div>
    </div>
  )
}
