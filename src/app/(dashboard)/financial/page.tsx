
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"

export default function FinancialPage() {
  const db = useFirestore()
  const { user } = useUser()

  const financialQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "financial_titles"), orderBy("dueDate", "desc"))
  }, [db, user])

  const { data: financialData, isLoading } = useCollection(financialQuery)
  const titles = financialData || []

  const totalValue = titles.reduce((acc, t) => acc + (t.value || 0), 0)
  const pendingValue = titles.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + (t.value || 0), 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary mb-2">Financeiro & Repasses</h1>
          <p className="text-muted-foreground">Gestão de honorários e carteira profissional.</p>
        </div>
        <Button className="gold-gradient text-background font-bold gap-2">
          <Printer className="h-4 w-4" /> Relatório Completo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disponível para Repasse</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> Atualizado em tempo real
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Honorários Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">R$ {pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Aguardando confirmação de pagamento
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projeção do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {(totalValue * 1.2).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Baseado no volume de processos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="font-headline">Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Sincronizando fluxo de caixa...</div>
            ) : titles.length > 0 ? (
              titles.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex gap-4 items-center">
                    <div className={`p-2 rounded-full ${tx.status === 'Recebido' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                      {tx.status === 'Recebido' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-semibold">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">{tx.type} • {tx.dueDate}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">R$ {tx.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <Badge variant={tx.status === 'Recebido' ? 'default' : 'outline'} className={tx.status === 'Recebido' ? 'bg-emerald-500' : ''}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground italic">Nenhum título financeiro registrado.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
