
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Receipt, CreditCard, Download, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const invoices = [
  { id: "INV-001", client: "João Silva", value: 4500, date: "15/05/2024", status: "Pago" },
  { id: "INV-002", client: "TechCorp LTDA", value: 12500, date: "20/05/2024", status: "Pendente" },
  { id: "INV-003", client: "Maria Oliveira", value: 3200, date: "10/05/2024", status: "Pago" },
  { id: "INV-004", client: "Logistix S.A", value: 8700, date: "25/05/2024", status: "Vencido" },
]

export default function BillingPage() {
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
            <div className="text-3xl font-bold text-emerald-500">R$ 28.900,00</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +15% em relação a Abril
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendências Financeiras</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">R$ 21.200,00</div>
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
            <div className="text-3xl font-bold text-destructive">R$ 8.700,00</div>
            <p className="text-xs text-muted-foreground mt-2">
              Títulos vencidos há mais de 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-primary/10 overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-primary/10 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Faturas Emitidas</h3>
          <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold text-muted-foreground">Ver Todas</Button>
        </div>
        <div className="divide-y divide-primary/10">
          {invoices.map((inv, i) => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-6">
                <div className="font-mono text-xs text-muted-foreground">{inv.id}</div>
                <div>
                  <h5 className="font-bold text-white">{inv.client}</h5>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Emissão: {inv.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="font-bold text-white text-lg">R$ {inv.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <Badge 
                    variant={inv.status === 'Pago' ? 'default' : inv.status === 'Vencido' ? 'destructive' : 'outline'}
                    className={inv.status === 'Pago' ? 'bg-emerald-500' : ''}
                  >
                    {inv.status}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 hover:text-primary"><Download className="h-5 w-5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
