
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  FolderCheck, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  Database,
  CloudLightning,
  FileCheck
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BurocraciaViewProps {
  lead: any
  interviews: any[]
}

const DOCUMENT_KITS = {
  "Trabalhista": [
    { id: "proc-trab", title: "Procuração Ad Judicia", tags: ["{{CLIENTE_NOME}}", "{{CLIENTE_CPF}}", "{{CLIENTE_ENDERECO}}"] },
    { id: "cont-hon", title: "Contrato de Honorários", tags: ["{{CLIENTE_NOME}}", "{{CLIENTE_CPF}}", "{{VALOR_ACAO}}"] },
    { id: "decl-hipo", title: "Declaração de Hipossuficiência", tags: ["{{CLIENTE_NOME}}", "{{CLIENTE_CPF}}"] },
    { id: "pet-inicial", title: "Minuta de Inicial (IA)", tags: ["{{CLIENTE_NOME}}", "{{REU_NOME}}", "{{FATOS_RESUMO}}"] },
  ],
  "Cível": [
    { id: "proc-civ", title: "Procuração Cível", tags: ["{{CLIENTE_NOME}}", "{{CLIENTE_CPF}}"] },
    { id: "cont-hon-civ", title: "Contrato de Honorários Cível", tags: ["{{CLIENTE_NOME}}", "{{VALOR_ACAO}}"] },
  ],
  "Geral": [
    { id: "proc-geral", title: "Procuração Geral", tags: ["{{CLIENTE_NOME}}", "{{CLIENTE_CPF}}"] },
  ]
}

export function BurocraciaView({ lead, interviews }: BurocraciaViewProps) {
  const [generating, setGenerating] = useState<string | null>(null)
  const { toast } = useToast()

  // Simulação de verificação de preenchimento de tags baseada nas entrevistas
  const availableData = useMemo(() => {
    const data: Record<string, any> = {
      "{{CLIENTE_NOME}}": lead?.name,
      "{{CLIENTE_CPF}}": lead?.cpf || lead?.documentNumber,
      "{{CLIENTE_ENDERECO}}": lead?.address,
    }
    
    interviews.forEach(int => {
      Object.entries(int.responses || {}).forEach(([label, value]) => {
        // Mapeamento simples de tags por labels conhecidos
        if (label.includes("NOME")) data["{{CLIENTE_NOME}}"] = value
        if (label.includes("CPF")) data["{{CLIENTE_CPF}}"] = value
        if (label.includes("EMPRESA")) data["{{REU_NOME}}"] = value
        if (label.includes("SALÁRIO")) data["{{VALOR_ACAO}}"] = value
      })
    })
    
    return data
  }, [lead, interviews])

  const kit = DOCUMENT_KITS[lead?.type as keyof typeof DOCUMENT_KITS] || DOCUMENT_KITS["Geral"]

  const handleGenerateDocument = (docId: string, title: string) => {
    setGenerating(docId)
    
    // Simulação de integração com Google Docs API
    setTimeout(() => {
      setGenerating(null)
      toast({
        title: "Documento Gerado!",
        description: `${title} foi salvo na pasta do cliente no Google Drive.`,
      })
    }, 2000)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel de Tags Detectadas */}
        <Card className="lg:col-span-1 glass border-white/5 bg-black/20">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <h4 className="text-xs font-black text-white uppercase tracking-widest">DNA de Dados</h4>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3 pr-4">
                {Object.entries(availableData).map(([tag, val]) => (
                  <div key={tag} className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-[8px] font-black text-primary uppercase tracking-tighter mb-1">{tag}</p>
                    <p className="text-[10px] font-bold text-white truncate">{val || "PENDENTE"}</p>
                  </div>
                ))}
                {interviews.length === 0 && (
                  <div className="py-10 text-center opacity-30">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-[9px] font-black uppercase">Aguardando Entrevista</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Kit de Documentos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                <FolderCheck className="h-6 w-6 text-emerald-500" /> Kit Inicial {lead?.type || "Geral"}
              </h3>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Processamento tático de minutas títuladas RGMJ.</p>
            </div>
            <Button variant="outline" className="glass border-primary/20 text-primary font-black text-[9px] uppercase tracking-widest gap-2">
              <CloudLightning className="h-3.5 w-3.5" /> Sincronizar Drive
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {kit.map((doc) => {
              const isGen = generating === doc.id
              const missingTags = doc.tags.filter(t => !availableData[t])
              
              return (
                <Card key={doc.id} className="glass border-white/5 hover:border-primary/20 transition-all group overflow-hidden">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-all">
                        <FileCheck className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-all" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white uppercase text-sm tracking-tight">{doc.title}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {doc.tags.map(t => (
                            <Badge key={t} variant="outline" className={cn(
                              "text-[7px] font-black uppercase tracking-tighter",
                              availableData[t] ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "border-rose-500/30 text-rose-500 bg-rose-500/5"
                            )}>
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {missingTags.length > 0 && (
                        <div className="hidden md:flex items-center gap-2 text-[8px] font-black text-rose-500 uppercase tracking-widest">
                          <AlertCircle className="h-3 w-3" /> Faltam {missingTags.length} tags
                        </div>
                      )}
                      <Button 
                        onClick={() => handleGenerateDocument(doc.id, doc.title)}
                        disabled={isGen}
                        className={cn(
                          "h-12 px-8 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all",
                          isGen ? "bg-secondary text-white" : "gold-gradient text-background shadow-xl hover:scale-105"
                        )}
                      >
                        {isGen ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-3.5 w-3.5 mr-2" /> Gerar .DOC</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="p-8 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-4">
            <ExternalLink className="h-8 w-8 text-muted-foreground opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">
              Gerenciamento de Arquivos em conformidade com Google Cloud Storage & Drive API.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
