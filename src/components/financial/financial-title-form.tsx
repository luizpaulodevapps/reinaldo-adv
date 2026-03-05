"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calculator, 
  Building2, 
  UserCircle, 
  Zap,
  Scale,
  Gavel,
  Wallet,
  ShieldCheck,
  X,
  Loader2
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"

interface FinancialTitleFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function FinancialTitleForm({ initialData, onSubmit, onCancel }: FinancialTitleFormProps) {
  const db = useFirestore()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    type: "Entrada (Receita)",
    category: "Honorários Contratuais",
    processId: "",
    processNumber: "",
    description: "",
    value: "0,00",
    dueDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurrenceMonths: 1,
    status: "Pendente"
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        value: (initialData.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      })
    }
  }, [initialData])

  const canQuery = !!user && !!db

  const processesQuery = useMemoFirebase(() => {
    if (!canQuery) return null
    return query(collection(db!, "processes"), orderBy("createdAt", "desc"))
  }, [db, canQuery])

  const { data: processes } = useCollection(processesQuery)

  const handleValueChange = (val: string) => {
    let clean = val.replace(/\D/g, "")
    let formatted = (Number(clean) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    setFormData({ ...formData, value: formatted })
  }

  const handleConfirm = () => {
    setLoading(true)
    onSubmit({
      ...formData,
      numericValue: parseFloat(formData.value.replace(/\./g, '').replace(',', '.')),
      status: formData.status || (formData.type.includes("Entrada") ? "Recebido" : "Pendente")
    })
  }

  const revenueCategories = [
    { id: "Honorários Contratuais", label: "Honorários Contratuais", icon: Scale },
    { id: "Honorários Sucumbenciais", label: "Honorários Sucumbenciais", icon: Gavel },
    { id: "Acordo Judicial", label: "Verba de Acordo", icon: Zap },
    { id: "Diligência / Atos", label: "Diligência / Atos", icon: Calculator },
    { id: "Custas Reembolsadas", label: "Custas Reembolsadas", icon: Wallet },
  ]

  const expenseCategories = [
    { id: "Folha de Pagamento", label: "Folha de Pagamento", icon: UserCircle },
    { id: "Aluguel & Manutenção", label: "Aluguel & Manutenção", icon: Building2 },
    { id: "Softwares & Licenças", label: "Softwares & Licenças", icon: Calculator },
    { id: "Marketing & Publicidade", label: "Marketing & Publicidade", icon: Zap },
    { id: "Impostos & Tributos", label: "Impostos & Tributos", icon: ShieldCheck },
    { id: "Suprimentos / Outros", label: "Suprimentos / Outros", icon: X },
  ]

  const currentCategories = formData.type.includes("Entrada") ? revenueCategories : expenseCategories

  return (
    <div className="space-y-8 py-4 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tipo de Fluxo *</Label>
          <Select value={formData.type} onValueChange={(v) => {
            setFormData({...formData, type: v, category: v.includes("Entrada") ? "Honorários Contratuais" : "Folha de Pagamento"})
          }}>
            <SelectTrigger className="glass border-primary/20 h-14 text-white focus:ring-primary/50 text-sm font-bold uppercase tracking-tight">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 text-white">
              <SelectItem value="Entrada (Receita)">💰 ENTRADA (RECEITA)</SelectItem>
              <SelectItem value="Saída (Despesa)">💸 SAÍDA (DESPESA)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Classificação Estratégica *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
            <SelectTrigger className="glass border-white/10 h-14 text-white focus:ring-primary/50 text-sm font-bold uppercase tracking-tight">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 text-white">
              {currentCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-3">
                    <cat.icon className="h-4 w-4 opacity-50" />
                    {cat.label.toUpperCase()}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Descrição do Lançamento *</Label>
        <Input 
          placeholder="EX: PAGAMENTO DE HONORÁRIOS CONTRATUAIS" 
          className="glass border-white/10 h-14 text-white font-bold uppercase"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
        />
      </div>

      <div className="p-10 rounded-2xl border border-primary/20 bg-primary/5 grid grid-cols-1 md:grid-cols-2 gap-10 relative overflow-hidden shadow-2xl">
        <div className="space-y-3 relative z-10">
          <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Valor Nominal (R$) *</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-sm">R$</span>
            <Input 
              className="glass border-primary/30 h-16 pl-12 text-2xl font-black text-white focus:ring-primary/50"
              value={formData.value}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Data de Vencimento *</Label>
          <Input 
            type="date"
            className="glass border-primary/30 h-16 text-sm text-white font-black uppercase focus:ring-primary/50"
            value={formData.dueDate}
            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground font-black uppercase text-[11px] tracking-widest px-10 h-14">
          Cancelar Operação
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={loading || !formData.description || formData.value === "0,00"}
          className="w-full md:w-[320px] h-16 gold-gradient text-background font-black uppercase text-[12px] tracking-widest shadow-2xl rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          {initialData ? "ATUALIZAR REGISTRO" : "REGISTRAR NO FLUXO"}
        </Button>
      </div>
    </div>
  )
}
