import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FinancialPage() {
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
            <div className="text-3xl font-bold text-emerald-500">R$ 12.450,00</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Retido (StaffCredits)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">R$ 45.800,00</div>
            <p className="text-xs text-muted-foreground mt-2">
              Aguardando liquidação processual
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Honorários Previstos</CardTitle>
            <TrendingUp className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 152k</div>
            <p className="text-xs text-muted-foreground mt-2">
              Baseado em acordos em fase de homologação
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
            {[
              { id: "TX-01", type: "Repasse", client: "João da Silva", amount: "R$ 1.250,00", status: "pago", date: "Hoje, 10:30" },
              { id: "TX-02", type: "Honorário", client: "Empresa ABC", amount: "R$ 5.000,00", status: "pendente", date: "Ontem, 16:45" },
              { id: "TX-03", type: "Custas", client: "Processo 0042", amount: "R$ 420,00", status: "pago", date: "15/10/2023" },
            ].map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex gap-4 items-center">
                  <div className={`p-2 rounded-full ${tx.status === 'pago' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                    {tx.status === 'pago' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-semibold">{tx.client}</div>
                    <div className="text-xs text-muted-foreground">{tx.type} • {tx.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{tx.amount}</div>
                  <Badge variant={tx.status === 'pago' ? 'default' : 'outline'} className={tx.status === 'pago' ? 'bg-emerald-500' : ''}>
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
