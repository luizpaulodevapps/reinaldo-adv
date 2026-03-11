
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  ArrowDownRight, 
  Loader2, 
  Scale, 
  Calendar, 
  Building2, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Clock, 
  Wallet,
  Calculator,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, where } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FinancialTitleForm } from "@/components/financial/financial-title-form"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function PayablesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState<any>(null)
  
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const payablesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db!, "financial_titles"), 
      where("type", "==", "Saída (Despesa)"),
      orderBy("dueDate", "asc")
    )
  }, [db, user])

  const { data: payables, isLoading } = useCollection(payablesQuery)

  const stats = useMemo(() => {
    if (!payables) return { total: 0, pending: 0, paid: 0 }
    const total = payables.reduce((acc, p) => acc + (Number(p.value) || 0), 0)
    const pending = payables.filter(p => p.status === 'Pendente').reduce((acc, p) => acc + (Number(p.value) || 0), 0)
    const paid = payables.filter(p => p.status === 'Pago').reduce((acc, p) => acc + (Number(p.value) || 0), 0)
    return { total, pending, paid }
  }, [payables])

  const filtered = useMemo(() => {
    if (!payables) return []
    return payables.filter(p => 
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [payables, searchTerm])

  const handleSave = (data: any) => {
    if (!user || !db) return
    if (editingTitle) {
      updateDocumentNonBlocking(doc(db!, "financial_titles", editingTitle.id), {
        ...data,
        value: data.numericValue,
        updatedAt: serverTimestamp()
      })
      toast({ title: "Título Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db!, "financial_titles"), {
        ...data,
        value: data.numericValue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      toast({ title: "Conta a Pagar Registrada" })
    }
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Calculator className="h-3 w-3" />
            <Link href="/billing" className="hover:text-primary transition-colors">CENTRAL</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">CONTAS A PAGAR</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Custos & Obrigações</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-60">GESTÃO DO POLO PASSIVO FINANCEIRO RGMJ.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Input 
            placeholder="Pesquisar obrigações..." 
            className="glass border-white/5 h-12 text-xs text-white md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button onClick={() => { setEditingTitle(null); setIsDialogOpen(true); }} className="bg-rose-600 hover:bg-rose-500 text-white font-black gap-2 px-8 h-12 uppercase text-[10px] rounded-lg shadow-xl">
            <Plus className="h-4 w-4" /> NOVO DÉBITO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-rose-500/20 bg-rose-500/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-3"><ArrowDownRight className="h-4 w-4" /> TOTAL A PAGAR</p>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-amber-500/20 bg-amber-500/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-3"><Clock className="h-4 w-4" /> VENCIMENTOS EM ABERTO</p>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-white/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-3"><CheckCircle2 className="h-4 w-4" /> TOTAL LIQUIDADO</p>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      <Card className="glass border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="min-h-[500px]">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auditando Prazos Financeiros...</span>
            </div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-white/5">
              {filtered.map(p => (
                <div key={p.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-lg">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-white uppercase text-sm tracking-tight">{p.description}</h4>
                        <Badge variant="outline" className="text-[8px] border-white/10 text-muted-foreground uppercase font-black">{p.category}</Badge>
                      </div>
                      <div className="flex items-center gap-6 mt-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-black flex items-center gap-2"><Calendar className="h-3 w-3 opacity-40" /> VENC: {p.dueDate}</p>
                        <p className="text-[10px] text-primary uppercase font-black flex items-center gap-2"><Building2 className="h-3 w-3 opacity-40" /> {p.entityName || "FORNECEDOR GERAL"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-xl font-black text-rose-400 tabular-nums tracking-tighter">R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <Badge className={cn("text-[8px] font-black uppercase mt-1", p.status === 'Pago' ? "bg-rose-500 text-white" : "bg-amber-500/10 text-amber-500")}>{p.status}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingTitle(p); setIsDialogOpen(true); }} className="h-10 w-10 rounded-lg text-white/20 hover:text-white"><Edit3 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-48 text-center opacity-20"><ArrowDownRight className="h-16 w-16 mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma despesa no radar</p></div>
          )}
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[750px] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Conta a Pagar</DialogTitle>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[70vh]">
            <div className="p-10 bg-[#0a0f1e]/50">
              <FinancialTitleForm initialData={{...editingTitle, type: "Saída (Despesa)"}} onSubmit={handleSave} onCancel={() => setIsDialogOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
