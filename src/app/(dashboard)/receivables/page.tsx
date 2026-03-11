
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  ArrowUpRight, 
  Loader2, 
  Scale, 
  Calendar, 
  Users, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
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
import { addMonths, format, parseISO } from "date-fns"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ReceivablesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState<any>(null)
  
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const receivablesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db!, "financial_titles"), 
      where("type", "==", "Entrada (Receita)"),
      orderBy("dueDate", "asc")
    )
  }, [db, user])

  const { data: receivables, isLoading } = useCollection(receivablesQuery)

  const stats = useMemo(() => {
    if (!receivables) return { total: 0, pending: 0, received: 0 }
    const total = receivables.reduce((acc, r) => acc + (Number(r.value) || 0), 0)
    const pending = receivables.filter(r => r.status === 'Pendente').reduce((acc, r) => acc + (Number(r.value) || 0), 0)
    const received = receivables.filter(r => r.status === 'Recebido').reduce((acc, r) => acc + (Number(r.value) || 0), 0)
    return { total, pending, received }
  }, [receivables])

  const filtered = useMemo(() => {
    if (!receivables) return []
    return receivables.filter(r => 
      r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.processNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [receivables, searchTerm])

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
      toast({ title: "Conta a Receber Lançada" })
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
            <span className="text-white uppercase tracking-tighter">CONTAS A RECEBER</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Honorários & Receitas</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-60">GESTÃO DO POLO ATIVO FINANCEIRO RGMJ.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Input 
            placeholder="Pesquisar faturas..." 
            className="glass border-white/5 h-12 text-xs text-white md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button onClick={() => { setEditingTitle(null); setIsDialogOpen(true); }} className="gold-gradient text-background font-black gap-2 px-8 h-12 uppercase text-[10px] rounded-lg shadow-xl">
            <Plus className="h-4 w-4" /> LANÇAR RECEITA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-3"><ArrowUpRight className="h-4 w-4" /> TOTAL A RECEBER</p>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-amber-500/20 bg-amber-500/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-3"><Clock className="h-4 w-4" /> SALDO EM ABERTO</p>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="glass border-white/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-3"><CheckCircle2 className="h-4 w-4" /> VALORES LIQUIDADOS</p>
          <div className="text-3xl font-black text-white tabular-nums tracking-tighter">R$ {stats.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      <Card className="glass border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="min-h-[500px]">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auditando Receitas...</span>
            </div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-white/5">
              {filtered.map(r => (
                <div key={r.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-white uppercase text-sm tracking-tight">{r.description}</h4>
                        <Badge variant="outline" className="text-[8px] border-white/10 text-muted-foreground uppercase font-black">{r.category}</Badge>
                      </div>
                      <div className="flex items-center gap-6 mt-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-black flex items-center gap-2"><Calendar className="h-3 w-3 opacity-40" /> VENC: {r.dueDate}</p>
                        <p className="text-[10px] text-primary uppercase font-black flex items-center gap-2"><Users className="h-3 w-3 opacity-40" /> {r.clientName || "CLIENTE GERAL"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-xl font-black text-emerald-400 tabular-nums tracking-tighter">R$ {Number(r.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <Badge className={cn("text-[8px] font-black uppercase mt-1", r.status === 'Recebido' ? "bg-emerald-500 text-white" : "bg-amber-500/10 text-amber-500")}>{r.status}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingTitle(r); setIsDialogOpen(true); }} className="h-10 w-10 rounded-lg text-white/20 hover:text-white"><Edit3 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-48 text-center opacity-20"><ArrowUpRight className="h-16 w-16 mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma receita no radar</p></div>
          )}
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[750px] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Conta a Receber</DialogTitle>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[70vh]">
            <div className="p-10 bg-[#0a0f1e]/50">
              <FinancialTitleForm initialData={{...editingTitle, type: "Entrada (Receita)"}} onSubmit={handleSave} onCancel={() => setIsDialogOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
