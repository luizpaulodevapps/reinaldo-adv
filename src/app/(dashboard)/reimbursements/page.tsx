
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Receipt, 
  Plus, 
  Search, 
  Loader2, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  User, 
  AlertCircle,
  FileText,
  Landmark,
  ShieldCheck,
  History,
  Navigation
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, where, serverTimestamp, doc, limit } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ReimbursementForm } from "@/components/reimbursements/reimbursement-form"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

export default function ReimbursementsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)
  const [processingItem, setProcessingItem] = useState<any>(null)
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  
  const db = useFirestore()
  const { user, profile, role } = useUser()
  const { toast } = useToast()

  const isAdmin = role === 'admin'

  const reimbursementsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    const base = collection(db!, "reimbursements")
    if (isAdmin) {
      return query(base, orderBy("createdAt", "desc"), limit(100))
    }
    return query(base, where("requesterId", "==", user.uid), orderBy("createdAt", "desc"))
  }, [db, user, isAdmin])

  const { data: requests, isLoading } = useCollection(reimbursementsQuery)

  const filtered = useMemo(() => {
    if (!requests) return []
    return requests.filter(r => 
      r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requesterName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [requests, searchTerm])

  const handleCreateRequest = (data: any) => {
    if (!user || !db) return
    addDocumentNonBlocking(collection(db!, "reimbursements"), {
      ...data,
      requesterId: user.uid,
      requesterName: profile?.name || user.displayName || "Usuário",
      status: "Pendente",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    setIsNewRequestOpen(false)
    toast({ title: "Pedido de Reembolso Enviado", description: "A cúpula administrativa foi notificada para auditoria." })
  }

  const handleProcessReimbursement = async (action: 'Aprovado' | 'Recusado' | 'Pago', extraData: any = {}) => {
    if (!db || !processingItem) return

    const updateData = {
      status: action,
      updatedAt: serverTimestamp(),
      ...extraData
    }

    await updateDocumentNonBlocking(doc(db, "reimbursements", processingItem.id), updateData)

    if (action === 'Pago') {
      // Injeta na central financeira como um Repasse/Saída já liquidado
      await addDocumentNonBlocking(collection(db, "financial_titles"), {
        type: "Saída (Despesa)",
        category: "Reembolso",
        description: `REEMBOLSO: ${processingItem.description.toUpperCase()}`,
        value: Number(processingItem.amount),
        dueDate: new Date().toISOString().split('T')[0],
        status: "Liquidado",
        responsibleStaffId: processingItem.requesterId,
        responsibleStaffName: processingItem.requesterName,
        originBank: extraData.originAccount || "CONTA MESTRE RGMJ (DR. REINALDO)",
        destinationBank: extraData.destinationAccount || "PIX CADASTRADO",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Notificação para o solicitante
      await addDocumentNonBlocking(collection(db, "notifications"), {
        userId: processingItem.requesterId,
        title: "Reembolso Pago",
        message: `O valor de R$ ${processingItem.amount.toLocaleString('pt-BR')} foi transferido para sua conta.`,
        type: "financial",
        severity: "info",
        read: false,
        link: "/reimbursements",
        createdAt: serverTimestamp()
      })
    }

    setIsProcessDialogOpen(false)
    setProcessingItem(null)
    toast({ title: `Pedido ${action}` })
  }

  const stats = useMemo(() => {
    if (!requests) return { pending: 0, total: 0 }
    const pending = requests.filter(r => r.status === 'Pendente').length
    const total = requests.filter(r => r.status === 'Pago').reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
    return { pending, total }
  }, [requests])

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Receipt className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">CONTROLE DE REEMBOLSOS</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Gestão de Despesas</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-70">RESSARCIMENTO TÁTICO E AUDITORIA DE CUSTOS.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por descrição..." 
              className="pl-12 glass border-white/5 h-14 text-sm text-white focus:ring-primary/50 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsNewRequestOpen(true)} className="gold-gradient text-background font-black gap-2 px-10 h-14 uppercase text-[11px] tracking-widest rounded-xl shadow-xl hover:scale-105 transition-all">
            <Plus className="h-5 w-5" /> SOLICITAR REEMBOLSO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-primary/20 bg-primary/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
            <Clock className="h-4 w-4" /> PEDIDOS EM AUDITORIA
          </p>
          <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
            {stats.pending} SOLICITAÇÕES
          </div>
        </Card>
        <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4" /> TOTAL RESSARCIDO
          </p>
          <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
            R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </Card>
        <Card className="glass border-white/5 p-8 rounded-2xl flex flex-col justify-center shadow-xl">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-3 flex items-center gap-3">
            <ShieldCheck className="h-4 w-4" /> SOBERANIA TÉCNICA
          </p>
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
            Todas as transações são auditadas e registradas no log de segurança RGMJ.
          </div>
        </Card>
      </div>

      <Card className="glass border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="min-h-[500px]">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Dossiês...</span>
            </div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-white/5">
              {filtered.map(r => (
                <div key={r.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-white/[0.01] transition-all group">
                  <div className="flex items-start gap-8">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl transition-transform group-hover:scale-110",
                      r.status === 'Pago' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : 
                      r.status === 'Recusado' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-primary/10 border-primary/20 text-primary"
                    )}>
                      <Receipt className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h4 className="font-black text-white uppercase text-lg tracking-tight">{r.description}</h4>
                        <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground uppercase font-black px-3 h-6">{r.category}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                          <User className="h-3.5 w-3.5 opacity-40 text-primary" /> SOLICITANTE: {r.requesterName}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 opacity-40 text-primary" /> DATA: {r.date}
                        </p>
                        {r.destinationAccount && (
                          <p className="text-[9px] text-emerald-500 font-bold uppercase flex items-center gap-2">
                            <Landmark className="h-3 w-3" /> PIX: {r.destinationAccount}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <div className="text-2xl font-black text-white tabular-nums tracking-tighter">
                        R$ {Number(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <Badge className={cn(
                        "text-[9px] font-black uppercase mt-1 px-3 border-0",
                        r.status === 'Pago' ? "bg-emerald-500/10 text-emerald-500" : 
                        r.status === 'Recusado' ? "bg-rose-500/10 text-rose-500" : 
                        r.status === 'Aprovado' ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {r.status}
                      </Badge>
                    </div>

                    {isAdmin && r.status === 'Pendente' && (
                      <div className="flex items-center gap-3 pl-8 border-l border-white/5">
                        <Button 
                          onClick={() => { setProcessingItem(r); setIsProcessDialogOpen(true); }}
                          className="gold-gradient text-background font-black text-[10px] uppercase h-11 px-6 rounded-xl shadow-lg"
                        >
                          AUDITAR
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-48 text-center opacity-20 space-y-6">
              <Receipt className="h-20 w-20 mx-auto" />
              <p className="text-xs font-black uppercase tracking-[0.5em]">Nenhum pedido registrado no radar</p>
            </div>
          )}
        </div>
      </Card>

      {/* DIÁLOGO NOVA SOLICITAÇÃO */}
      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[650px] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">Solicitar Reembolso</DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">RITO DE PRESTAÇÃO DE CONTAS RGMJ.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 bg-[#0a0f1e]/50">
            <ReimbursementForm onSubmit={handleCreateRequest} onCancel={() => setIsNewRequestOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO AUDITORIA (ADMIN) */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Auditoria de Despesa</DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">COMANDO DE APROVAÇÃO FINANCEIRA.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 space-y-8 bg-[#0a0f1e]/50">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Solicitante</p>
                  <p className="text-sm font-bold text-white uppercase">{processingItem?.requesterName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Valor</p>
                  <p className="text-xl font-black text-primary tabular-nums">R$ {processingItem?.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Motivação</p>
                <p className="text-sm text-white/80 italic">"{processingItem?.description}"</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Conta de Destino (Creditar em)</Label>
                <Input 
                  placeholder="CHAVE PIX OU DADOS BANCÁRIOS..." 
                  className="bg-black/40 border-white/10 h-12 text-white font-bold"
                  value={processingItem?.destinationAccount || ""}
                  onChange={(e) => setProcessingItem({...processingItem, destinationAccount: e.target.value})}
                />
                <p className="text-[8px] text-primary/60 font-black uppercase">Verifique se este é o "PIX DE PISO" cadastrado na ficha do colaborador.</p>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Conta de Origem (Debitar de)</Label>
                <Input 
                  className="bg-black/40 border-white/10 h-12 text-white font-bold"
                  value={processingItem?.originAccount || "CONTA MESTRE RGMJ (DR. REINALDO)"}
                  onChange={(e) => setProcessingItem({...processingItem, originAccount: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => handleProcessReimbursement('Recusado')} className="text-rose-500 uppercase font-black text-[11px] tracking-widest px-8">RECUSAR</Button>
            <div className="flex gap-3">
              <Button onClick={() => handleProcessReimbursement('Aprovado')} variant="outline" className="border-primary/20 text-primary font-black text-[11px] h-12 px-8 rounded-xl">APROVAR AUDITORIA</Button>
              <Button onClick={() => handleProcessReimbursement('Pago')} className="gold-gradient text-background font-black text-[11px] h-12 px-10 rounded-xl shadow-xl flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4" /> EFETUAR PAGAMENTO
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
