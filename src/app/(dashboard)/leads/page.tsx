"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreVertical, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const columns = [
  { id: "novo", title: "NOVO" },
  { id: "atendimento", title: "ATENDIMENTO" },
  { id: "contratual", title: "CONTRATUAL" },
  { id: "burocracia", title: "BUROCRACIA" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO" },
]

const leads = [
  { id: "1", name: "Ricardo Santos", type: "Trabalhista", date: "2h atrás", stage: "novo", value: "R$ 15k est." },
  { id: "2", name: "Maria Oliveira", type: "Trabalhista", date: "1d atrás", stage: "atendimento", value: "R$ 45k est." },
  { id: "3", name: "Bruno Fernandes", type: "Trabalhista", date: "3d atrás", stage: "contratual", value: "R$ 120k est." },
  { id: "4", name: "Ana Paula", type: "Trabalhista", date: "5d atrás", stage: "burocracia", value: "R$ 22k est." },
]

export default function LeadsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary mb-2">CRM & Triagem</h1>
          <p className="text-muted-foreground">Gerencie o fluxo de novos clientes e conversão.</p>
        </div>
        <Button className="gold-gradient text-background font-bold gap-2">
          <Plus className="h-4 w-4" /> Novo Lead
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." className="pl-9 glass" />
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6">
        {columns.map((col) => (
          <div key={col.id} className="min-w-[280px] flex-1">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-sm tracking-widest text-muted-foreground">{col.title}</h3>
              <Badge variant="secondary">{leads.filter(l => l.stage === col.id).length}</Badge>
            </div>
            <div className="space-y-3">
              {leads.filter(l => l.stage === col.id).map((lead) => (
                <Card key={lead.id} className="glass hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="font-bold">{lead.name}</div>
                      <MoreVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
                        {lead.type}
                      </Badge>
                      <span>•</span>
                      <span>{lead.date}</span>
                    </div>
                    <div className="text-sm font-semibold text-emerald-500">
                      {lead.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="ghost" className="w-full border-2 border-dashed border-border/50 hover:border-primary/50 h-20 text-muted-foreground">
                <Plus className="h-4 w-4 mr-2" /> Arrastar para cá
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
