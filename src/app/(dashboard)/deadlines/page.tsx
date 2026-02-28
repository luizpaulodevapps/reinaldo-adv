"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Brain, Sparkles, Loader2, Calendar as CalendarIcon, FileText } from "lucide-react"
import { aiParseDjePublication } from "@/ai/flows/ai-parse-dje-publication"
import { useToast } from "@/hooks/use-toast"

export default function DeadlinesPage() {
  const [publicationText, setPublicationText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const handleParse = async () => {
    if (!publicationText) return
    setParsing(true)
    try {
      const output = await aiParseDjePublication({ publicationText })
      setResult(output)
      toast({
        title: "Publicação Analisada",
        description: "Os dados foram extraídos com sucesso pela IA.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na Análise",
        description: "Não foi possível interpretar a publicação.",
      })
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Prazos & IA Parser</h1>
        <p className="text-muted-foreground">Extração automática de datas fatais via Inteligência Artificial.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="glass overflow-hidden border-primary/20">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="font-headline text-lg">Parser de DJE</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Cole abaixo o texto bruto da publicação do Diário de Justiça Eletrônico para identificar prazos automaticamente.
              </p>
              <Textarea 
                placeholder="Ex: TRIBUNAL REGIONAL DO TRABALHO... Fica a reclamada intimada para manifestação em 15 dias..."
                className="min-h-[250px] glass font-mono text-sm border-primary/10 focus:border-primary"
                value={publicationText}
                onChange={(e) => setPublicationText(e.target.value)}
              />
              <Button 
                onClick={handleParse} 
                className="w-full gold-gradient text-background font-bold gap-2"
                disabled={parsing || !publicationText}
              >
                {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Processar com IA
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {result ? (
            <Card className="glass border-emerald-500/50 animate-in fade-in slide-in-from-right-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  Resultado da Análise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Tipo de Prazo</div>
                    <div className="font-bold text-primary">{result.deadlineType || "Não identificado"}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Vencimento Est.</div>
                    <div className="font-bold text-emerald-500 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {result.dueDate || "A definir"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Números dos Processos</div>
                  <div className="flex flex-wrap gap-2">
                    {result.caseNumbers?.length > 0 ? result.caseNumbers.map((num: string) => (
                      <Badge key={num} variant="secondary" className="font-mono">{num}</Badge>
                    )) : <span className="text-sm italic">Nenhum número detectado</span>}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Resumo Estratégico</div>
                  <div className="p-4 rounded-lg bg-background/50 border italic text-sm text-foreground/80 leading-relaxed">
                    "{result.summary}"
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline">Salvar no Processo</Button>
                  <Button className="flex-1 gold-gradient text-background">Criar Google Task</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 glass rounded-lg border-dashed border-2 text-muted-foreground border-border/50">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-center text-sm">Aguardando dados para análise...<br/>Os resultados aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
