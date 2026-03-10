
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, Sparkles, Loader2, Copy, Trash2 } from "lucide-react"
import { aiAssistDocumentDrafting } from "@/ai/flows/ai-assist-document-drafting"
import { useToast } from "@/hooks/use-toast"

interface DraftingToolProps {
  initialCaseDetails?: string;
}

export function DraftingTool({ initialCaseDetails = "" }: DraftingToolProps) {
  const [caseDetails, setCaseDetails] = useState(initialCaseDetails)
  const [documentType, setDocumentType] = useState("Petição Inicial")
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (initialCaseDetails) {
      setCaseDetails(initialCaseDetails);
    }
  }, [initialCaseDetails]);

  const handleDraft = async () => {
    if (!caseDetails) return
    setLoading(true)
    try {
      const result = await aiAssistDocumentDrafting({
        caseDetails,
        documentType,
        specificInstructions: "Focar em fundamentação jurídica técnica e jurisprudência atualizada baseada nos fatos informados."
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-headline font-bold text-white flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" /> Minuta Inteligente
          </h2>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em]">Assistente de Redação Jurídica RGMJ</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tipo de Documento</label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="glass border-white/10 h-14 text-white focus:ring-primary/50">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="glass border-white/10">
                <SelectItem value="Petição Inicial">Petição Inicial</SelectItem>
                <SelectItem value="Recurso Ordinário">Recurso Ordinário</SelectItem>
                <SelectItem value="Contestação">Contestação</SelectItem>
                <SelectItem value="Manifestação">Manifestação</SelectItem>
                <SelectItem value="Contrato">Contrato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fatos e Estratégia</label>
            <Textarea 
              placeholder="Descreva os fatos principais, teses jurídicas e pedidos..."
              className="min-h-[300px] glass border-white/10 p-6 text-white text-sm leading-relaxed resize-none focus:ring-primary/50"
              value={caseDetails}
              onChange={(e) => setCaseDetails(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleDraft} 
            className="w-full gold-gradient text-background font-black gap-3 py-8 text-sm uppercase tracking-widest rounded-xl shadow-2xl shadow-primary/10 hover:scale-[1.01] transition-transform"
            disabled={loading || !caseDetails}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            Gerar Rascunho de Elite
          </Button>
        </div>
      </div>

      <div className="relative min-h-[600px]">
        {draft ? (
          <div className="h-full flex flex-col glass border-primary/20 rounded-2xl overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl">
            <div className="p-5 bg-secondary/30 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Minuta Gerada via IA</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors" onClick={() => {
                  navigator.clipboard.writeText(draft)
                  toast({ title: "Copiado para o clipboard!" })
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors" onClick={() => setDraft(null)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 p-10">
              <div className="font-serif leading-relaxed text-base whitespace-pre-wrap text-white/90 text-justify">
                {draft}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 glass rounded-2xl border-dashed border-2 border-white/5 opacity-40">
            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] max-w-[200px] leading-loose">
              Aguardando parâmetros para iniciar a redação estratégica.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
