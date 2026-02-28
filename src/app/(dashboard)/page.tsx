import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  Scale, 
  Clock, 
  TrendingUp,
  AlertCircle
} from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Bem-vindo ao LexFlow</h1>
        <p className="text-muted-foreground">Visão geral da operação jurídica hoje.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Leads Ativos", value: "24", icon: Users, color: "text-info" },
          { label: "Processos em Curso", value: "142", icon: Scale, color: "text-primary" },
          { label: "Prazos da Semana", value: "12", icon: Clock, color: "text-destructive" },
          { label: "Repasses Disponíveis", value: "R$ 4.250", icon: TrendingUp, color: "text-emerald-500" },
        ].map((stat, i) => (
          <Card key={i} className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass">
          <CardHeader>
            <CardTitle className="font-headline">Próximas Audiências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "09:30", type: "Instrução", party: "Silva vs. TechCorp", room: "Vara 04" },
                { time: "11:00", type: "Conciliação", party: "Oliveira vs. FoodDeliv", room: "Vara 12" },
                { time: "14:30", type: "Julgamento", party: "Souza vs. Logistix", room: "Vara 01" },
              ].map((hearing, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border/50">
                  <div className="flex gap-4 items-center">
                    <div className="text-primary font-bold">{hearing.time}</div>
                    <div>
                      <div className="font-semibold">{hearing.party}</div>
                      <div className="text-xs text-muted-foreground">{hearing.type} • {hearing.room}</div>
                    </div>
                  </div>
                  <button className="text-xs text-primary underline">Detalhes</button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="font-headline">Alertas Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded bg-destructive/10 border-l-4 border-destructive text-sm">
                <strong>Processo 00123:</strong> Prazo de réplica vencendo amanhã!
              </div>
              <div className="p-3 rounded bg-warning/10 border-l-4 border-primary text-sm">
                <strong>Lead Pedro:</strong> Sem contato há 48h (Fase Burocracia).
              </div>
              <div className="p-3 rounded bg-info/10 border-l-4 border-info text-sm">
                <strong>Financeiro:</strong> 3 repasses pendentes de conferência.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
