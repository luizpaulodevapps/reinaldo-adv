
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Landmark,
  Calendar,
  Clock,
  ChevronRight
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, serverTimestamp, DocumentReference, DocumentData } from "firebase/firestore"
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
    category: "Honorários",
    subcategory: "",
    processId: "",
    processNumber: "",
    clientId: "",
    clientName: "",
    responsibleStaffId: "",
    responsibleStaffName: "",
    description: "",
    value: "0,00",
    dueDate: new Date().toISOString().split('T')[0],
    competenceDate: new Date().toISOString().split('T')[0],
    originBank: "CONTA MESTRE RGMJ (BANCO ITAÚ)",
    destinationBank: "",
    paymentMethod: "Pix",
    favoredName: "",
    favoredDocument: "",
    pixKey: "",
    isRecurring: false,
    recurrenceMonths: 1,
    status: "Pendente"
  })

  const staffQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user])
  const { data: staffMembers } = useCollection(staffQuery)

  const processQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "legal_processes"), orderBy("processNumber", "asc"), limit(200))
  }, [db, user])
  const { data: processes } = useCollection(processQuery)

  const [processSearch, setProcessSearch] = useState("")
  const filteredProcesses = processes?.filter(p => 
    p.processNumber?.toLowerCase().includes(processSearch.toLowerCase()) ||
    p.clientName?.toLowerCase().includes(processSearch.toLowerCase()) ||
    p.description?.toLowerCase().includes(processSearch.toLowerCase())
  )

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
    { id: "Honorários", label: "HONORÁRIOS", icon: Scale, subs: ["CONTRATUAIS", "SUCUMBENCIAIS", "AD EXITUM", "MENSALISTAS"] },
    { id: "Acordos", label: "ACORDOS / ALVARÁS", icon: Zap, subs: ["VERBA INDENIZATÓRIA", "DANOS MORAIS", "RETENÇÃO CONTRATUAL"] },
    { id: "Consultoria", label: "CONSULTORIA", icon: Calculator, subs: ["PARECER TÉCNICO", "AUDITORIA", "DILIGÊNCIA"] },
  ]

  const expenseCategories = [
    { id: "Pessoal", label: "PESSOAL / RH", icon: UserCircle, subs: ["SALÁRIOS", "REPASSE ASSOCIADO", "ESTAGIÁRIOS", "ENCARGOS"] },
    { id: "Operacional", label: "OPERACIONAL", icon: Building2, subs: ["ALUGUEL", "ENERGIA/INTERNET", "CONTAS DE CONSUMO (ÁGUA/LUZ)", "TELEFONIA / MÓVEL", "SOFTWARES", "LIMPEZA"] },
    { id: "Tributário", label: "TRIBUTÁRIO", icon: ShieldCheck, subs: ["ISS", "IRPJ", "DAS/SIMPLES", "TAXAS OAB"] },
    { id: "Marketing", label: "MARKETING", icon: Zap, subs: ["GOOGLE ADS", "SOCIAL MEDIA", "EVENTOS"] },
  ]

  const currentCategories = formData.type.includes("Entrada") ? revenueCategories : expenseCategories
  const selectedCat = currentCategories.find(c => c.id === formData.category)

  return (
    <div className="space-y-8 py-6 font-sans">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Novo Título Financeiro</h2>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">Lançamento tático de entrada ou saída para controle soberano de caixa.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Descrição do Lançamento *</Label>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/0 rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-1000"></div>
          <Input 
            placeholder="EX: ALUGUEL MENSAL, HONORÁRIOS PROCESSO X..." 
            className="relative bg-[#0d121f] border-primary/20 h-16 text-white font-black uppercase placeholder:opacity-20 text-sm px-6 rounded-2xl focus:ring-primary/50"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Tipo de Operação *</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v, category: v.includes("Entrada") ? "Honorários" : "Pessoal", subcategory: ""})}>
            <SelectTrigger className="bg-black/40 border-white/5 h-14 text-white font-black uppercase text-[11px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0d121f] text-white">
              <SelectItem value="Entrada (Receita)">💰 ENTRADA (RECEITA)</SelectItem>
              <SelectItem value="Saída (Despesa)">💸 SAÍDA (DESPESA)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Grupo de Contas / Gestão *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v, subcategory: ""})}>
            <SelectTrigger className="bg-black/40 border-white/5 h-14 text-white font-black uppercase text-[11px] rounded-xl">
              <SelectValue placeholder="SELECIONE CATEGORIA..." />
            </SelectTrigger>
            <SelectContent className="bg-[#0d121f] text-white">
              {currentCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subcategoria Detalhada</Label>
            <Badge className="bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border-0">Dinâmico</Badge>
          </div>
          <Select value={formData.subcategory} onValueChange={(v) => setFormData({...formData, subcategory: v})}>
            <SelectTrigger className="bg-black/40 border-white/5 h-14 text-white font-black uppercase text-[11px] rounded-xl">
              <SelectValue placeholder="SELECIONE DETALHE..." />
            </SelectTrigger>
            <SelectContent className="bg-[#0d121f] text-white">
              {selectedCat?.subs.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Valor do Título (R$) *</Label>
          <div className="relative">
             <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-sm">R$</div>
             <Input 
                className="bg-black/40 border-white/5 h-14 pl-12 text-lg font-black text-white rounded-xl focus:ring-primary/50"
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: maskCurrency(e.target.value)})}
             />
          </div>
        </div>
      </div>

      {/* VINCULAÇÃO JURÍDICA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-[2rem] border border-white/5 bg-white/[0.02]">
        <div className="space-y-3 relative">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Vincular Processo (CNJ ou Cliente)</Label>
          <div className="relative group">
            <Gavel className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-50 z-20" />
            <Input 
              placeholder="DIGITE PARA BUSCAR PROCESSO..." 
              value={formData.processNumber || processSearch} 
              onChange={(e) => {
                setProcessSearch(e.target.value)
                if (formData.processId) setFormData({...formData, processId: "", processNumber: "", clientName: ""})
              }}
              className="bg-black/40 border-white/5 h-14 pl-14 text-white font-black uppercase text-[11px] rounded-xl focus:ring-primary/50 relative z-10"
            />
            {formData.processId && (
              <button 
                onClick={() => {
                  setFormData({...formData, processId: "", processNumber: "", clientName: ""})
                  setProcessSearch("")
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-primary/20 hover:bg-primary/40 p-1.5 rounded-full text-primary transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            
            {(processSearch && !formData.processId) && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#0d121f] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] max-h-[300px] overflow-y-auto divide-y divide-white/5 animate-in fade-in zoom-in-95 duration-200">
                {filteredProcesses && filteredProcesses.length > 0 ? (
                  filteredProcesses.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setFormData({...formData, processId: p.id, processNumber: p.processNumber, clientName: p.clientName})
                        setProcessSearch("")
                      }}
                      className="p-4 hover:bg-primary/10 cursor-pointer transition-colors group"
                    >
                      <p className="text-[10px] font-black text-white group-hover:text-primary transition-colors">{p.processNumber}</p>
                      <p className="text-[8px] text-muted-foreground font-black uppercase mt-1 opacity-50">{p.clientName}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center opacity-30 text-[9px] font-black uppercase italic">Nenhum processo encontrado...</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Advogado p/ Auditoria (Repasse)</Label>
          <Select 
            value={formData.responsibleStaffId} 
            onValueChange={(v) => {
              const s = staffMembers?.find(sm => sm.id === v)
              setFormData({...formData, responsibleStaffId: v, responsibleStaffName: s?.name || ""})
            }}
          >
            <SelectTrigger className="bg-black/40 border-white/5 h-14 text-white font-black uppercase text-[11px] rounded-xl flex items-center gap-4">
               <UserCircle className="h-4 w-4 text-primary opacity-50" />
               <SelectValue placeholder="SELECIONE O ADVOGADO..." />
            </SelectTrigger>
            <SelectContent className="bg-[#0d121f] text-white">
              {staffMembers?.map(s => (
                <SelectItem key={s.id} value={s.id} className="text-[10px] font-black uppercase">{s.name.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DATAS */}
      <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 pl-1">
            <Calendar className="h-3.5 w-3.5 text-primary" /> Data de Vencimento *
          </Label>
          <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="bg-[#0a0f1e] border-white/5 h-14 text-white font-black uppercase text-xs rounded-xl px-6" />
        </div>
        <div className="space-y-3">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 pl-1">
            <Clock className="h-3.5 w-3.5 text-primary" /> Mês de Competência
          </Label>
          <Input type="date" value={formData.competenceDate} onChange={(e) => setFormData({...formData, competenceDate: e.target.value})} className="bg-[#0a0f1e] border-white/5 h-14 text-white font-black uppercase text-xs rounded-xl px-6" />
        </div>
      </div>

      {/* RECORRÊNCIA */}
      <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] flex items-center justify-between group cursor-pointer hover:bg-white/[0.04] transition-colors">
        <div className="flex items-center gap-5">
           <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Clock className="h-6 w-6" />
           </div>
           <div>
              <h4 className="text-sm font-black text-white uppercase tracking-tighter">Parcelamento / Recorrência</h4>
              <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">Habilite para repetir este lançamento mensalmente.</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           {formData.isRecurring && (
             <Input type="number" value={formData.recurrenceMonths} onChange={(e) => setFormData({...formData, recurrenceMonths: parseInt(e.target.value)})} className="w-20 bg-black/40 border-white/10 text-center font-black h-12 rounded-xl" placeholder="MÊS" />
           )}
           <Switch checked={formData.isRecurring} onCheckedChange={(v) => setFormData({...formData, isRecurring: v})} className="data-[state=checked]:bg-primary" />
        </div>
      </div>

      <div className="p-10 rounded-[2.5rem] border border-white/5 bg-[#0a0f1e]/40 space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
           <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-2xl">
              <UserCircle className="h-5 w-5" />
           </div>
           <div>
              <h4 className="text-sm font-black text-white uppercase tracking-tighter">Favorecido / Beneficiário</h4>
              <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">DESTINAÇÃO FINAL DA LIQUIDAÇÃO.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">Nome do Favorecido</Label>
            <Input value={formData.favoredName} onChange={(e) => setFormData({...formData, favoredName: e.target.value.toUpperCase()})} className="bg-black/40 border-white/5 h-14 text-white font-black uppercase text-[11px] rounded-xl" placeholder="NOME DO FAVORECIDO..." />
          </div>
          <div className="space-y-3">
            <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">Meio de Pagamento</Label>
            <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({...formData, paymentMethod: v})}>
              <SelectTrigger className="bg-black/40 border-white/5 h-14 text-white font-black uppercase text-[11px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d121f] text-white">
                <SelectItem value="Pix">PIX</SelectItem>
                <SelectItem value="TED">TRANSFERÊNCIA (TED/DOC)</SelectItem>
                <SelectItem value="Boleto">BOLETO BANCÁRIO</SelectItem>
                <SelectItem value="Cartão">CARTÃO DE CRÉDITO</SelectItem>
                <SelectItem value="Espécie">ESPÉCIE (DINHEIRO)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">Documento do Favorecido</Label>
            <Input value={formData.favoredDocument} onChange={(e) => setFormData({...formData, favoredDocument: e.target.value})} className="bg-black/40 border-white/5 h-14 text-white font-mono text-[11px] rounded-xl" placeholder="CPF OU CNPJ..." />
          </div>
          <div className="space-y-3">
            <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">Chave Pix ou Dados Financeiros</Label>
            <Input value={formData.pixKey} onChange={(e) => setFormData({...formData, pixKey: e.target.value})} className="bg-black/40 border-white/5 h-14 text-white font-bold text-[11px] rounded-xl" placeholder="EMAIL, CPF, CELULAR OU CHAVE ALEATÓRIA..." />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5">
        <button onClick={onCancel} className="text-muted-foreground font-black uppercase text-[11px] tracking-widest px-10 h-14 hover:text-white transition-colors">
          CANCELAR
        </button>
        <Button 
          onClick={handleConfirm}
          disabled={loading || !formData.description || formData.value === "0,00"}
          className="w-full md:w-[380px] h-16 gold-gradient text-background font-black uppercase text-[13px] tracking-[0.2em] shadow-[0_20px_50px_rgba(245,208,48,0.2)] rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
          REVISAR LANÇAMENTO
        </Button>
      </div>
    </div>
  )
}
