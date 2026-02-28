"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Search, ShieldCheck, Wallet, Gavel, Scale, Loader2, X, Plus, Calculator } from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface FinancialTitleFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function FinancialTitleForm({ onSubmit, onCancel }: FinancialTitleFormProps) {
  const db = useFirestore()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [processSearch, setProcessSearch] = useState("")
  const [showProcessSearch, setShowProcessSearch] = useState(false)

  const [formData, setFormData] = useState({
    type: "Entrada (Receita)",
    category: "Outras Operações",
    processId: "",
    processNumber: "",
    description: "",
    value: "0,00",
    dueDate: new Date().toISOString().split('T')[0],
    isRecurring: false
  })

  // Busca processos para vínculo
  const processesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "processes"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: processes } = useCollection(processesQuery)

  const filteredProcesses = (processes || []).filter(p => 
    p.processNumber?.includes(processSearch) || 
    p.description?.toLowerCase().includes(processSearch.toLowerCase())
  )

  const handleValueChange = (val: string) => {
    // Máscara simples para R$
    let clean = val.replace(/\D/g, "")
    let formatted = (Number(clean) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    setFormData({ ...formData, value: formatted })
  }

  const handleConfirm = () => {
    setLoading(true)
    onSubmit({
      ...formData,
      numericValue: parseFloat(formData.value.replace('.', '').replace(',', '.')),
      status: formData.type.includes("Entrada") ? "Recebido" : "Pendente"
    })
  }

  return (
    <div className="space-y-8 py-4">
      {/* Grid Superior */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tipo de Operação *</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
            <SelectTrigger className="glass border-primary/20 h-14 text-white focus:ring-primary/50 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-white/10">
              <SelectItem value="Entrada (Receita)">💰 Entrada (Receita)</SelectItem>
              <SelectItem value="Saída (Despesa)">💸 Saída (Despesa)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Categoria / Origem *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
            <SelectTrigger className="glass border-white/10 h-14 text-white focus:ring-primary/50 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-white/10">
              <SelectItem value="Honorários Contratuais">⚖️ Honorários Contratuais</SelectItem>
              <SelectItem value="Honorários Sucumbenciais">🏆 Honorários Sucumbenciais</SelectItem>
              <SelectItem value="Acordo Judicial">🤝 Verba de Acordo</SelectItem>
              <SelectItem value="Diligência / Atos">🚗 Diligência / Atos</SelectItem>
              <SelectItem value="Sentença / Execução">🏛️ Sentença / Execução</SelectItem>
              <SelectItem value="Custas Processuais">📑 Custas Processuais</SelectItem>
              <SelectItem value="Outras Operações">📦 Outras Operações</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vínculo Processual */}
      <div className="space-y-2">
        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Scale className="h-3.5 w-3.5 text-primary" /> Vínculo Processual (Opcional)
        </Label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar processo para vincular..." 
            className="pl-12 glass border-white/10 h-14 text-sm text-white"
            value={formData.processNumber || processSearch}
            onChange={(e) => {
              setProcessSearch(e.target.value)
              setShowProcessSearch(true)
            }}
            onFocus={() => setShowProcessSearch(true)}
          />
          {showProcessSearch && processSearch.length > 1 && (
            <div className="absolute z-50 w-full mt-2 glass border-primary/20 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2">
              {filteredProcesses.length > 0 ? (
                filteredProcesses.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      setFormData({...formData, processId: p.id, processNumber: p.processNumber})
                      setShowProcessSearch(false)
                    }}
                    className="w-full p-4 flex items-center justify-between hover:bg-primary/10 text-left transition-colors border-b border-white/5 last:border-0"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{p.description.toUpperCase()}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{p.processNumber}</p>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-[10px] text-muted-foreground uppercase font-bold">Nenhum processo encontrado</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Descrição do Lançamento *</Label>
        <Input 
          placeholder="Ex: Honorários Contratuais 1ª Instância" 
          className="glass border-white/10 h-14 text-sm text-white"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      {/* Valores e Datas Box */}
      <div className="p-8 rounded-2xl border border-primary/20 bg-primary/5 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Valor do Título (R$) *</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-sm">R$</span>
            <Input 
              className="glass border-primary/30 h-14 pl-12 text-xl font-black text-white focus:ring-primary/50"
              value={formData.value}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Vencimento da Parcela *</Label>
          <Input 
            type="date"
            className="glass border-primary/30 h-14 text-sm text-white focus:ring-primary/50"
            value={formData.dueDate}
            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
          />
        </div>
      </div>

      {/* Recorrência Switch */}
      <div className="p-6 rounded-xl glass border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white uppercase tracking-tight">Habilitar Recorrência?</h4>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">O sistema gerará os próximos meses automaticamente</p>
        </div>
        <Switch 
          checked={formData.isRecurring} 
          onCheckedChange={(v) => setFormData({...formData, isRecurring: v})}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* Footer do Form */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground font-bold uppercase text-[11px] tracking-widest px-8">
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={loading || !formData.description || formData.value === "0,00"}
          className="w-full md:w-[280px] h-16 gold-gradient text-background font-black uppercase text-[12px] tracking-widest shadow-2xl shadow-primary/20 rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          Confirmar Lançamento
        </Button>
      </div>
    </div>
  )
}
