
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftRight, Plus, Receipt, Clock, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { useMemo } from "react"

export default function RefundsPage() {
  const db = useFirestore()
  const { user } = useUser()

  const refundsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "financial_titles"), where("type", "==", "Reembolso"), orderBy("dueDate", "desc"))
  }, [db, user])

  const { data: refunds, isLoading } = useCollection(refundsQuery)

  const stats = useMemo(() => {
    if (!refunds) return { pendente: 0, pago: 0 }
    return {
      pendente: refunds.filter(r => r.status === 'Pendente').reduce((acc, r) => acc + (r.value || 0), 0),
      pago: refunds.filter(r => r.status === 'Recebido').reduce((acc, r) => acc + (r.value || 0), 0),
    }
  }, [refunds])

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">Reembolsos</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Gestão de Despesas e Prestação de Contas</p>
        </div>
        <Button className="gold-gradient text-background font-bold gap-2">
          <Plus className="h-4 w-4" /> Solicitar Reembolso
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="glass border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg font-headline text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" /> Histórico de Despesas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : refunds && refunds.length > 0 ? (
                refunds.map((ref, i) => (
                  <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-primary/5 hover-gold transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-white truncate max-w-[250px]">{ref.description}</h5>
                      <span className="text-lg font-bold text-primary">R$ {ref.value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      <span>{ref.dueDate} • #{ref.id.substring(0,6).toUpperCase()}</span>
                      <Badge variant={ref.status === 'Recebido' ? 'default' : 'outline'} className={ref.status === 'Recebido' ? 'bg-emerald-500' : ''}>
                        {ref.status === 'Recebido' ? 'Pago' : ref.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-muted-foreground italic text-xs uppercase tracking-widest">
                  Nenhuma solicitação de reembolso.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg font-headline text-white">Resumo de Fluxo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-secondary/50 border border-primary/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Aguardando Liquidação</p>
                    <p className="text-2xl font-bold text-white">R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground opacity-20" />
              </div>

              <div className="flex items-center justify-between p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Pagos Recentemente</p>
                    <p className="text-2xl font-bold text-white">R$ {stats.pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
