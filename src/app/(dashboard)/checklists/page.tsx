
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Plus, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

const checklists = [
  {
    title: "Protocolo de Inicial - Trabalhista",
    category: "Operacional",
    progress: 65,
    items: [
      { text: "Conferir cálculos de liquidação", completed: true },
      { text: "Verificar procuração e declaração", completed: true },
      { text: "Anexar CTPS e extratos FGTS", completed: true },
      { text: "Revisar fundamentação de insalubridade", completed: false },
      { text: "Protocolar no PJE", completed: false },
    ]
  },
  {
    title: "Diligência de Audiência",
    category: "Pauta",
    progress: 100,
    items: [
      { text: "Contatar preposto", completed: true },
      { text: "Reunião de alinhamento com testemunhas", completed: true },
      { text: "Verificar link da audiência virtual", completed: true },
    ]
  },
  {
    title: "Onboarding de Novo Cliente",
    category: "CRM",
    progress: 30,
    items: [
      { text: "Enviar e-mail de boas-vindas", completed: true },
      { text: "Solicitar documentos base", completed: false },
      { text: "Cadastrar no drive jurídico", completed: false },
    ]
  }
]

export default function ChecklistsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">Checklists Estratégicos</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Padronização e Controle de Qualidade RGMJ</p>
        </div>
        <Button className="gold-gradient text-background font-bold gap-2">
          <Plus className="h-4 w-4" /> Criar Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {checklists.map((list, idx) => (
          <Card key={idx} className="glass border-primary/10 hover-gold transition-all">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-[9px] uppercase border-primary/30 text-primary">{list.category}</Badge>
                <span className="text-xs font-bold text-primary">{list.progress}%</span>
              </div>
              <CardTitle className="text-lg font-headline text-white">{list.title}</CardTitle>
              <Progress value={list.progress} className="h-1 bg-secondary mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {list.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <Checkbox checked={item.completed} id={`check-${idx}-${i}`} className="mt-1 border-primary/50 data-[state=checked]:bg-primary" />
                  <label htmlFor={`check-${idx}-${i}`} className={`text-sm leading-tight cursor-pointer ${item.completed ? 'text-muted-foreground line-through' : 'text-white'}`}>
                    {item.text}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
