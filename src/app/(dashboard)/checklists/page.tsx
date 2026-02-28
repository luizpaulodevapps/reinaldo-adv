
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Plus, Search, Filter, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query } from "firebase/firestore"

export default function ChecklistsPage() {
  const db = useFirestore()
  const { user } = useUser()

  // Nota: Implementação real depende de uma coleção de checklists se o senhor desejar dinamismo total
  const checklistsQuery = useMemoFirebase(() => user ? collection(db, "checklists") : null, [db, user])
  const { data: checklists, isLoading } = useCollection(checklistsQuery)

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
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : checklists && checklists.length > 0 ? (
          checklists.map((list, idx) => (
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
                {list.items?.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <Checkbox checked={item.completed} id={`check-${idx}-${i}`} className="mt-1 border-primary/50 data-[state=checked]:bg-primary" />
                    <label htmlFor={`check-${idx}-${i}`} className={`text-sm leading-tight cursor-pointer ${item.completed ? 'text-muted-foreground line-through' : 'text-white'}`}>
                      {item.text}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-primary/10">
            <ClipboardList className="h-12 w-12 text-muted-foreground opacity-20" />
            <div className="text-center">
              <p className="text-sm font-bold text-white uppercase tracking-widest">Sem Templates de Auditoria</p>
              <p className="text-xs text-muted-foreground mt-2">Inicie a padronização dos processos da banca RGMJ.</p>
            </div>
            <Button variant="outline" className="glass border-primary/20 text-primary font-bold">Configurar Primeiro Checklist</Button>
          </div>
        )}
      </div>
    </div>
  )
}
