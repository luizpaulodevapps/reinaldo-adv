"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Sparkles, Loader2, FileText, Send, Copy } from "lucide-react"
import { aiAssistDocumentDrafting } from "@/ai/flows/ai-assist-document-drafting"
import { useToast } from "@/hooks/use-toast"

export default function DraftingPage() {
  const [caseDetails, setCaseDetails] = useState("")
  const [documentType, setDocumentType] = useState("Petição Inicial")
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDraft = async () => {
    if (!caseDetails) return
    setLoading(true)
    try {
      const result = await aiAssistDocumentDrafting({
        caseDetails,
        documentType,
        specificInstructions: "Focar em horas extras e adicional de insalubridade."
      })
      setDraft(result.draftContent)
      toast({
        title: "Minuta Gerada",
        description: "A IA concluiu o rascunho da peça jurídica.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na Geração",
        description: "Não foi possível gerar a minuta.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Minuta Inteligente</h1>
        <p className="text-muted-foreground">Automação de rascunhos para peças processuais de alta complexidade.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-primary/20 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Parâmetros da Peça
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase">Tipo de Documento</label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="glass">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petição Inicial">Petição Inicial</SelectItem>
                    <SelectItem value="Recurso Ordinário">Recurso Ordinário</SelectItem>
                    <SelectItem value="Contestação">Contestação</SelectItem>
                    <SelectItem value="Manifestação">Manifestação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase">Fatos e Detalhes do Caso</label>
                <Textarea 
                  placeholder="Descreva os fatos principais, datas, valores e pedidos..."
                  className="min-h-[300px] glass"
                  value={caseDetails}
                  onChange={(e) => setCaseDetails(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleDraft} 
                className="w-full gold-gradient text-background font-bold gap-2 py-6 text-lg"
                disabled={loading || !caseDetails}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Gerar Rascunho de Elite
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {draft ? (
            <Card className="glass h-full border-emerald-500/30 overflow-hidden animate-in zoom-in-95 duration-300">
              <CardHeader className="border-b border-border/50 bg-secondary/20 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  Rascunho Sugerido pela IA
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    navigator.clipboard.writeText(draft)
                    toast({ title: "Copiado!" })
                  }}><Copy className="h-4 w-4" /></Button>
                  <Button className="gold-gradient text-background gap-2">
                    <Send className="h-4 w-4" /> Exportar p/ Google Docs
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-8 font-serif leading-relaxed text-foreground/90 whitespace-pre-wrap max-h-[700px] overflow-y-auto">
                  {draft}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 glass rounded-xl border-dashed border-2 border-border/50">
              <Sparkles className="h-16 w-16 mb-6 opacity-10 text-primary" />
              <p className="text-center text-muted-foreground">
                Preencha os dados à esquerda e clique em <br/>
                <span className="text-primary font-bold">"Gerar Rascunho de Elite"</span> <br/>
                para começar a redação automática.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
