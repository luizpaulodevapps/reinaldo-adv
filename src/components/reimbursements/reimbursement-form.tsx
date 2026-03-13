
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Receipt, 
  Calendar, 
  Tag, 
  DollarSign, 
  ShieldCheck,
  MapPin,
  Car,
  FileText,
  Utensils
} from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface ReimbursementFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

const CATEGORIES = [
  { id: "Viagem", label: "Viagem / Deslocamento", icon: Car },
  { id: "Refeição", label: "Refeição / Alimentação", icon: Utensils },
  { id: "Cópias", label: "Cópias / Digitalização", icon: FileText },
  { id: "Custas Judiciais", label: "Custas Judiciais", icon: Receipt },
  { id: "Outros", label: "Outros Suprimentos", icon: Tag },
]

export function ReimbursementForm({ onSubmit, onCancel }: ReimbursementFormProps) {
  const { user, profile } = useUser()
  const db = useFirestore()
  
  const [formData, setFormData] = useState({
    amount: "0,00",
    description: "",
    category: "Outros",
    date: new Date().toISOString().split('T')[0],
    destinationAccount: ""
  })

  // Busca dados bancários do colaborador para sugerir o PIX de piso
  const employeeRef = useMemoFirebase(() => (user && db) ? doc(db!, "employees", user.uid) : null, [db, user])
  const { data: employeeData } = useDoc(employeeRef)

  useEffect(() => {
    if (employeeData?.pixKey) {
      setFormData(prev => ({ ...prev, destinationAccount: employeeData.pixKey }))
    }
  }, [employeeData])

  const handleValueChange = (val: string) => {
    let clean = val.replace(/\D/g, "")
    let formatted = (Number(clean) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    setFormData({ ...formData, amount: formatted })
  }

  const handleConfirm = () => {
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount.replace(/\./g, '').replace(',', '.')),
    })
  }

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block"
  const inputClass = "bg-black/40 border-white/10 h-14 text-white font-bold focus:ring-1 focus:ring-primary/50"

  return (
    <div className="space-y-8 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Label className={labelMini}>Valor do Desembolso (R$) *</Label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-lg">R$</span>
            <Input 
              className="bg-black/60 border-primary/30 h-16 pl-16 text-3xl font-black text-white rounded-xl shadow-inner"
              value={formData.amount}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-3">
          <Label className={labelMini}>Data da Despesa *</Label>
          <Input 
            type="date"
            className={cn(inputClass, "rounded-xl h-16")}
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Label className={labelMini}>Classificação da Despesa</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
            <SelectTrigger className={cn(inputClass, "rounded-xl h-14")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0d121f] border-white/10 text-white">
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-3 uppercase font-black text-[10px] tracking-widest">
                    <cat.icon className="h-4 w-4 opacity-50 text-primary" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className={labelMini}>Chave PIX para Recebimento</Label>
          <Input 
            placeholder="PIX CADASTRADO NO D.P." 
            className={cn(inputClass, "rounded-xl h-14 font-bold")}
            value={formData.destinationAccount}
            onChange={(e) => setFormData({...formData, destinationAccount: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className={labelMini}>Descrição / Motivação da Despesa *</Label>
        <Textarea 
          placeholder="DESCREVA O MOTIVO E O CONTEXTO (EX: VIAGEM PARA AUDIÊNCIA EM CAMPINAS)..." 
          className="bg-black/40 border-white/10 min-h-[120px] text-white text-sm font-bold p-6 rounded-2xl resize-none"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
        />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5">
        <button onClick={onCancel} className="text-muted-foreground font-black uppercase text-[11px] tracking-widest px-10 h-14 hover:text-white transition-colors">
          CANCELAR
        </button>
        <Button 
          onClick={handleConfirm}
          disabled={!formData.description || formData.amount === "0,00"}
          className="w-full md:w-[350px] h-16 gold-gradient text-background font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
        >
          <ShieldCheck className="h-6 w-6" /> ENVIAR PARA AUDITORIA
        </Button>
      </div>
    </div>
  )
}
