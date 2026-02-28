"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Receipt, CreditCard, Download, ArrowUpRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, orderBy, doc } from "firebase/firestore"
import { useMemo } from "react"

export default function BillingPage() {
  const db = useFirestore()
  const { user } = useUser()

  const profileRef = useMemoFirebase(() => user ? doc(db, 'staff_profiles', user.uid) : null, [user, db])
  const { data: profile } = useDoc(profileRef)
  const canQuery = !!(user && profile?.role)

  const billingQuery = useMemoFirebase(() => {
    if (!canQuery) return null
    return query(collection(db, "financial_titles"), where("type", "==", "Honorário"), orderBy("dueDate", "desc"))
  }, [db, canQuery])

  const { data: invoices, isLoading } = useCollection(billingQuery)

  const stats = useMemo(() => {
    if (!invoices) return { faturado: 0, pendente: 0, vencido: 0 }
    return {
      faturado: invoices.filter(i => i.status === 'Recebido').reduce((acc, i) => acc + (i.value || 0), 0),
      pendente: invoices.filter(i => i.status === 'Pendente').reduce((acc, i) => acc + (i.value || 0), 0),
      vencido: invoices.filter(i => i.status === 'Vencido').reduce((acc, i) => acc + (i.value || 0), 0),
    }
  }, [invoices])

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">Faturamento</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Gestão de Honorários e Notas Fiscais</p>
        </div>
        <Button className="gold-gradient text-background font-bold gap-2">
          <Receipt className="h-4 w-4" /> Emitir Nota
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Faturado (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">R$ {stats.faturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> Atualizado agora
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendências Financeiras</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Aguardando liquidação de faturas
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">R$ {stats.vencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Títulos vencidos na pauta
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-primary/10 overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-primary/10 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Faturas e Honorários</h3>
          <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold text-muted-foreground">Ver Todas</Button>
        </div>
        <div className="divide-y divide-primary/10">
          {isLoading || !canQuery ? (
            <div className="p-20 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices && invoices.length > 0 ? (
            invoices.map((inv, i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-6">
                  <div className="font-mono text-xs text-muted-foreground">#{inv.id.substring(0,6).toUpperCase()}</div>
                  <div>
                    <h5 className="font-bold text-white truncate max-w-[200px]">{inv.description}</h5>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Vencimento: {inv.dueDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="font-bold text-white text-lg">R$ {inv.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <Badge 
                      variant={inv.status === 'Recebido' ? 'default' : inv.status === 'Vencido' ? 'destructive' : 'outline'}
                      className={inv.status === 'Recebido' ? 'bg-emerald-500' : ''}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 hover:text-primary"><Download className="h-5 w-5" /></Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center text-muted-foreground italic text-xs uppercase tracking-widest">
              Nenhuma fatura registrada no fluxo.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}