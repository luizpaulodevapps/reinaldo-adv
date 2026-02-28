
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Scale, ExternalLink, FolderOpen, MoreVertical, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"

export default function CasesPage() {
  const db = useFirestore()
  const { user } = useUser()

  const processesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "processes"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: processesData, isLoading } = useCollection(processesQuery)
  const processes = processesData || []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary mb-2">Gestão Processual</h1>
          <p className="text-muted-foreground">Controle total do dossiê judicial e pastas no Drive.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="glass gap-2">
            <FolderOpen className="h-4 w-4" /> Google Drive
          </Button>
          <Button className="gold-gradient text-background font-bold gap-2">
            Novo Processo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground glass rounded-xl border-dashed border-2">
            Carregando dossiês estratégicos...
          </div>
        ) : processes.length > 0 ? (
          processes.map((proc) => (
            <Card key={proc.id} className="glass hover:border-primary/50 transition-all">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Scale className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-muted-foreground">{proc.processNumber}</span>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">{proc.status}</Badge>
                    </div>
                    <h3 className="text-xl font-bold">{proc.description}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 text-emerald-500 font-bold">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> {proc.caseType}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
                        <FileText className="h-4 w-4" /> Dossiê Digital
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="hover:text-primary"><ExternalLink className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="hover:text-primary"><MoreVertical className="h-4 w-4" /></Button>
                  <Button className="bg-secondary hover:bg-secondary/80 text-foreground">Acessar Dossiê</Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="p-12 text-center text-muted-foreground glass rounded-xl border-dashed border-2">
            Nenhum processo ativo encontrado no sistema.
          </div>
        )}
      </div>
    </div>
  )
}
