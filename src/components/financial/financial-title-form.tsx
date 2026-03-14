
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
  Loader2,
  Handshake,
  DollarSign,
  Tag,
  ArrowRightLeft,
  Landmark
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { cn, maskCurrency, parseCurrencyToNumber } from "@/lib/utils"

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
    clientId: "",
    clientName: "",
    responsibleStaffId: "",
    responsibleStaffName: "",
    entityName: "", 
    description: "",
    value: "0,00",
    dueDate: new Date().toISOString().split('T')[0],
    originBank: "CONTA MESTRE RGMJ (DR. REINALDO)",
    destinationBank: "",
    isRecurring: false,
    recurrenceMonths: 1,
    status: "Pendente"
  })

  const staffQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user])
  const { data: staffMembers } = useCollection(staffQuery)

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        value: maskCurrency(initialData.value || 0)
      })
    }
  }, [initialData])

  const handleConfirm = () => {
    setLoading(true)
    onSubmit({
      ...formData,
      numericValue: parseCurrencyToNumber(formData.value),
      status: formData.status || "Pendente"
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
    { id: "Folha de Pagamento", label: "Folha / Salários", icon: UserCircle },
    { id: "Repasse Associado", label: "Repasse Associado", icon: Handshake },
    { id: "Aluguel & Manutenção", label: "Aluguel & Sede", icon: Building2 },
    { id: "Softwares & TI", label: "Softwares & TI", icon: Calculator },
    { id: "Marketing & Comercial", label: "Marketing & Leads", icon: Zap },
    { id: "Impostos & Tributos", label: "Impostos & Taxas", icon: ShieldCheck },
    { id: "Diligência Terceirizada", label: "Correspondente / Atos", icon: Handshake },
    { id: "Retirada Sócio", label: "Pró-Labore / Retirada", icon: Wallet },
    { id: "Outros", label: "Suprimentos / Diversos", icon: Tag },
  ]

  const currentCategories = formData.type.includes("Entrada") ? revenueCategories : expenseCategories

  return (
    <div className="space-y-8 py-4 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tipo de Operação *</Label>
          <Select value={formData.type} onValueChange={(v) => {
            setFormData({...formData, type: v, category: v.includes("Entrada") ? "Honorários Contratuais" : "Folha de Pagamento"})
          }}>
            <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white focus:ring-1 focus:ring-primary/50 text-sm font-bold uppercase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0d121f] border-white/10 text-white">
              <SelectItem value="Entrada (Receita)">💰 ENTRADA (RECEITA)</SelectItem>
              <SelectItem value="Saída (Despesa)">💸 SAÍDA (DESPESA)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Classificação Técnica *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
            <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white focus:ring-1 focus:ring-primary/50 text-sm font-bold uppercase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0d121f] border-white/10 text-white">
              {currentCategories.map(cat => (
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
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Descrição do Lançamento *</Label>
          <Input 
            placeholder="EX: HONORÁRIOS CONTRATUAIS - CLIENTE X" 
            className="bg-black/40 border-white/10 h-14 text-white font-bold uppercase placeholder:opacity-20"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vincular Profissional (Repasse)</Label>
            <Select value={formData.responsibleStaffId} onValueChange={(v) => {
              const s = staffMembers?.find(sm => sm.id === v)
              setFormData({...formData, responsibleStaffId: v, responsibleStaffName: s?.name || ""})
            }}>
              <SelectTrigger className="bg-black/40 border-white/10 h-12 text-white text-[10px] uppercase font-bold"><SelectValue placeholder="SELECIONE O ADVOGADO" /></SelectTrigger>
              <SelectContent className="bg-[#0d121f] text-white">
                {staffMembers?.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Número do Processo (CNJ)</Label>
            <Input 
              value={formData.processNumber} 
              onChange={(e) => setFormData({...formData, processNumber: e.target.value})}
              className="bg-black/40 border-white/10 h-12 text-white font-mono text-xs"
              placeholder="0000000-00.0000.0.00.0000"
            />
          </div>
        </div>
      </div>

      <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] space-y-6">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Telemetria Bancária</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase">Conta de Origem (Debitado de)</Label>
            <div className="relative">
              <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input value={formData.originBank} onChange={(e) => setFormData({...formData, originBank: e.target.value.toUpperCase()})} className="bg-black/40 border-white/10 h-12 pl-12 text-white text-[10px] font-black" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase">Conta de Destino (Creditado em)</Label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input value={formData.destinationBank} onChange={(e) => setFormData({...formData, destinationBank: e.target.value.toUpperCase()})} className="bg-black/40 border-white/10 h-12 pl-12 text-white text-[10px] font-black" placeholder="EX: CONTA MESTRE RGMJ" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-10 rounded-[2rem] border border-primary/20 bg-primary/5 grid grid-cols-1 md:grid-cols-2 gap-10 relative overflow-hidden shadow-2xl">
        <div className="space-y-3 relative z-10">
          <Label className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Valor da Operação (R$)</Label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-xl">R$</span>
            <Input 
              className="bg-black/60 border-primary/30 h-20 pl-16 text-3xl font-black text-white focus:ring-primary/50 shadow-inner"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: maskCurrency(e.target.value)})}
            />
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <Label className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Vencimento / Repasse</Label>
          <Input 
            type="date"
            className="bg-black/60 border-primary/30 h-20 text-lg text-white font-black uppercase focus:ring-primary/50 shadow-inner px-8"
            value={formData.dueDate}
            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status Atual</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
            <SelectTrigger className="bg-black/40 border-white/10 h-12 text-white font-black text-[10px] uppercase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0d121f] text-white">
              <SelectItem value="Pendente">⌛ AGUARDANDO (PENDENTE)</SelectItem>
              <SelectItem value="Liquidado">✅ CONCLUÍDO / TRANSFERIDO</SelectItem>
              <SelectItem value="Cancelado">❌ CANCELADO</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between px-6 border-l border-white/5">
          <div className="space-y-0.5">
            <Label className="text-[10px] font-black text-white uppercase tracking-widest">Lançamento Recorrente?</Label>
            <p className="text-[9px] text-muted-foreground uppercase font-bold">Repetir mensalmente.</p>
          </div>
          <Input 
            type="number" 
            placeholder="MÊS" 
            className="w-20 bg-black/40 border-white/10 text-center font-black h-10" 
            value={formData.recurrenceMonths}
            onChange={(e) => setFormData({...formData, recurrenceMonths: parseInt(e.target.value), isRecurring: parseInt(e.target.value) > 1})}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5">
        <button onClick={onCancel} className="text-muted-foreground font-black uppercase text-[11px] tracking-widest px-10 h-14 hover:text-white transition-colors">
          ABORTAR OPERAÇÃO
        </button>
        <Button 
          onClick={handleConfirm}
          disabled={loading || !formData.description || formData.value === "0,00"}
          className="w-full md:w-[380px] h-16 gold-gradient text-background font-black uppercase text-[13px] tracking-[0.2em] shadow-[0_20px_50px_rgba(245,208,48,0.2)] rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
          {initialData ? "ATUALIZAR REGISTRO TÁTICO" : "INJETAR NO FLUXO RGMJ"}
        </Button>
      </div>
    </div>
  )
}
