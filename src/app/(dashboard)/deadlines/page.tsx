
"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Brain, Sparkles, Loader2, Calendar as CalendarIcon, FileText, Save } from "lucide-react"
import { aiParseDjePublication } from "@/ai/flows/ai-parse-dje-publication"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase"
import { collection, serverTimestamp } from "firebase/firestore"

export default function DeadlinesPage() {
  const [publicationText, setPublicationText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()

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

  const handleSave = () => {
    if (!result || !user) return
    setSaving(true)
    
    // Converte os dados da IA em uma entidade de Deadline real no Firestore
    const newDeadline = {
      title: result.deadlineType || "Prazo Identificado por IA",
      description: result.summary,
      dueDate: result.dueDate || "",
      calculationType: "Dias Úteis (IA)",
      publicationDate: new Date().toISOString().split('T')[0],
      publicationText: publicationText,
      status: "Aberto",
      staffId: user.uid,
      processId: result.caseNumbers?.[0] || "Não Vinculado", 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    addDocumentNonBlocking(collection(db, "deadlines"), newDeadline)
      .then(() => {
        toast({ 
          title: "Prazo Registrado", 
          description: "A data fatal foi salva e já aparece na sua Agenda." 
        })
        setResult(null)
        setPublicationText("")
      })
      .finally(() => setSaving(false))
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Prazos & IA Parser</h1>
        <p className="text-muted-foreground">Extração automática e salvamento de datas fatais via Inteligência Artificial.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="glass overflow-hidden border-primary/20">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="font-headline text-lg">Parser de DJE</CardTitle>
              </div>
            </Header>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground font-light">
                Cole abaixo o texto bruto da publicação do Diário de Justiça Eletrônico. A IA identificará o tipo de prazo e a data de vencimento.
              </p>
              <Textarea 
                placeholder="Ex: TRIBUNAL REGIONAL DO TRABALHO... Fica a reclamada intimada para manifestação em 15 dias..."
                className="min-h-[250px] glass font-mono text-sm border-primary/10 focus:border-primary p-4 leading-relaxed"
                value={publicationText}
                onChange={(e) => setPublicationText(e.target.value)}
              />
              <Button 
                onClick={handleParse} 
                className="w-full gold-gradient text-background font-bold gap-2 py-6 text-lg"
                disabled={parsing || !publicationText}
              >
                {parsing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Analisar com IA
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {result ? (
            <Card className="glass border-emerald-500/50 animate-in fade-in slide-in-from-right-4 duration-500">
              <CardHeader className="border-b border-border/30 bg-emerald-500/5">
                <CardTitle className="flex items-center gap-2 text-emerald-500">
                  <Sparkles className="h-5 w-5" />
                  Inteligência de Prazo
                </CardTitle>
              </Header>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50">
                    <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest font-bold">Tipo de Ato</div>
                    <div className="font-bold text-primary text-lg">{result.deadlineType || "Não identificado"}</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50">
                    <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest font-bold">Data Fatal Estimada</div>
                    <div className="font-bold text-emerald-500 text-lg flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      {result.dueDate || "A definir"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-muted-foreground mb-3 uppercase tracking-widest font-bold">Vínculos Processuais Detectados</div>
                  <div className="flex flex-wrap gap-2">
                    {result.caseNumbers?.length > 0 ? result.caseNumbers.map((num: string) => (
                      <Badge key={num} variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20 px-3 py-1 text-xs">
                        {num}
                      </Badge>
                    )) : <span className="text-sm italic text-muted-foreground">Nenhum número detectado pela IA</span>}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-muted-foreground mb-3 uppercase tracking-widest font-bold">Resumo Estratégico</div>
                  <div className="p-6 rounded-2xl bg-background/50 border border-border/50 italic text-sm text-foreground/90 leading-relaxed shadow-inner">
                    "{result.summary}"
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    className="flex-1 h-14 font-bold border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-500" 
                    variant="outline"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar na Agenda
                  </Button>
                  <Button className="flex-1 gold-gradient text-background font-bold h-14">
                    Gerar Task Google
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 glass rounded-2xl border-dashed border-2 text-muted-foreground border-border/50 bg-secondary/5">
              <FileText className="h-16 w-16 mb-6 opacity-10 text-primary" />
              <p className="text-center text-sm font-light">
                Aguardando entrada de dados para análise de elite...<br/>
                Os resultados e o salvamento aparecerão aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
