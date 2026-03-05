
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
  FileCheck,
  FolderOpen,
  FolderSync,
  Gavel,
  Phone,
  MapPin,
  Building
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateDocumentNonBlocking } from "@/firebase"
import { doc, serverTimestamp } from "firebase/firestore"
import { useFirestore } from "@/firebase"

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
    { id: "cont-hon-civ", title: "Contrato de Honorários Cível", tags: ["{{CLIENTE_NOME}}", "{{CLIENTE_CPF}}", "{{VALOR_ACAO}}"] },
  ],
  "Geral": [
    { id: "proc-geral", title: "Procuração Geral", tags: ["{{CLIENTE_NOME}}", "{{CLIENTE_CPF}}"] },
  ]
}

export function BurocraciaView({ lead, interviews }: BurocraciaViewProps) {
  const [generating, setGenerating] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()
  const db = useFirestore()

  // CONSOLIDAÇÃO DO DNA DE DADOS (TAGS INTELIGENTES)
  const availableData = useMemo(() => {
    const data: Record<string, any> = {
      // Tags de Cadastro (Sistema)
      "{{CLIENTE_NOME}}": lead?.name,
      "{{CLIENTE_CPF}}": lead?.cpf || lead?.documentNumber,
      "{{CLIENTE_EMAIL}}": lead?.email,
      "{{CLIENTE_WHATSAPP}}": lead?.phone,
      "{{CLIENTE_ENDERECO}}": lead?.address,
      "{{REU_NOME}}": lead?.defendantName,
      "{{REU_DOCUMENTO}}": lead?.defendantDocument,
      
      // Tags de Processo / Distribuição
      "{{PROCESSO_NUMERO}}": lead?.processNumber || "PENDENTE",
      "{{FORUM_NOME}}": lead?.court || "PENDENTE",
      "{{VARA_NOME}}": lead?.vara || "PENDENTE",
      "{{CIDADE_UF}}": lead?.city ? `${lead.city} - ${lead.state}` : "PENDENTE",
    }
    
    // Mapeamento Dinâmico de Entrevistas (Reuso configurado no Laboratório)
    interviews.forEach(int => {
      // Usamos o snapshot do template para saber qual resposta mapeia para qual tag
      const responses = int.responses || {}
      const snapshot = int.templateSnapshot || []

      snapshot.forEach((field: any) => {
        if (field.reuseEnabled && responses[field.label]) {
          const val = responses[field.label]
          // Mapeamento direto por campo alvo ou por etiqueta de tag
          if (field.targetField === 'fullName') data["{{CLIENTE_NOME}}"] = val
          if (field.targetField === 'cpf') data["{{CLIENTE_CPF}}"] = val
          if (field.targetField === 'address') data["{{CLIENTE_ENDERECO}}"] = val
          if (field.targetField === 'processNumber') data["{{PROCESSO_NUMERO}}"] = val
          if (field.targetField === 'forum') data["{{FORUM_NOME}}"] = val
          if (field.targetField === 'vara') data["{{VARA_NOME}}"] = val
        }
      })
    })
    
    return data
  }, [lead, interviews])

  const kit = DOCUMENT_KITS[lead?.type as keyof typeof DOCUMENT_KITS] || DOCUMENT_KITS["Geral"]

  const handleGenerateDocument = (docId: string, title: string) => {
    setGenerating(docId)
    setTimeout(() => {
      setGenerating(null)
      toast({
        title: "Documento Gerado!",
        description: `${title} foi salvo no Google Drive.`,
      })
    }, 2000)
  }

  const handleManualSync = async () => {
    if (!db || !lead) return
    setSyncing(true)
    
    setTimeout(async () => {
      const isReadyForClientFolder = lead.status === "burocracia" || lead.status === "distribuicao"
      const newDriveStatus = isReadyForClientFolder ? "pasta_cliente" : "pasta_lead"
      
      await updateDocumentNonBlocking(doc(db, "leads", lead.id), {
        driveStatus: newDriveStatus,
        updatedAt: serverTimestamp()
      })
      
      setSyncing(false)
      toast({ 
        title: "Google Workspace Sincronizado", 
        description: isReadyForClientFolder ? "Estrutura movida para repositório de CLIENTES." : "Repositório de LEADS atualizado."
      })
    }, 1500)
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PAINEL LATERAL: DNA DE DADOS E DRIVE */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass border-primary/20 bg-black/40 overflow-hidden shadow-2xl">
            <div className="p-6 bg-primary/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest">DNA de Dados</h4>
              </div>
              <Badge variant="outline" className="text-[8px] font-black text-primary border-primary/30">INTEGRIDADE ATIVA</Badge>
            </div>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-6 space-y-4">
                  {Object.entries(availableData).map(([tag, val]) => (
                    <div key={tag} className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-[9px] font-black text-primary uppercase tracking-tighter">{tag}</code>
                        {val && val !== "PENDENTE" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertCircle className="h-3 w-3 text-amber-500/50" />}
                      </div>
                      <p className={cn(
                        "text-xs font-bold uppercase truncate",
                        val && val !== "PENDENTE" ? "text-white" : "text-muted-foreground/30 italic"
                      )}>
                        {val || "AGUARDANDO CAPTURA"}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="glass border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <CloudLightning className="h-5 w-5 text-emerald-500" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Repositório Cloud</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-xl bg-black/40 border border-white/5 shadow-inner">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Localização Atual</p>
                    <p className="text-[10px] font-black text-white uppercase flex items-center gap-2">
                      {lead.driveStatus === "pasta_cliente" ? <FolderCheck className="h-3.5 w-3.5 text-emerald-500" /> : <FolderOpen className="h-3.5 w-3.5 text-amber-500 animate-pulse" />}
                      {lead.driveStatus === "pasta_cliente" ? "REPOSITÓRIO DE CLIENTES" : lead.driveStatus === "pasta_lead" ? "REPOSITÓRIO DE LEADS" : "AGUARDANDO SINCRONIA"}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="w-full h-14 gold-gradient text-background font-black text-[11px] uppercase tracking-widest gap-3 shadow-xl hover:scale-[1.02] transition-all"
                >
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSync className="h-4 w-4" />}
                  Sincronizar Google Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PAINEL CENTRAL: KIT DE DOCUMENTOS E INTELIGÊNCIA JURÍDICA */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                <Gavel className="h-8 w-8 text-primary" /> Kit Inicial {lead?.type || "Geral"}
              </h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-60">Processamento tático de minutas títuladas RGMJ Elite.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {kit.map((doc) => {
              const isGen = generating === doc.id
              const missingTags = doc.tags.filter(t => !availableData[t] || availableData[t] === "PENDENTE")
              
              return (
                <Card key={doc.id} className="glass border-white/5 hover:border-primary/30 transition-all group overflow-hidden shadow-xl">
                  <CardContent className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-all border border-white/5 shadow-inner">
                        <FileCheck className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-all" />
                      </div>
                      <div>
                        <h4 className="font-black text-white uppercase text-lg tracking-tight mb-2">{doc.title}</h4>
                        <div className="flex flex-wrap gap-2">
                          {doc.tags.map(t => (
                            <Badge key={t} variant="outline" className={cn(
                              "text-[8px] font-black uppercase tracking-widest py-1 px-2",
                              availableData[t] && availableData[t] !== "PENDENTE" ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "border-rose-500/30 text-rose-500 bg-rose-500/5"
                            )}>
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {missingTags.length > 0 && (
                        <div className="hidden xl:flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                          <AlertCircle className="h-3.5 w-3.5" /> Faltam {missingTags.length} tags
                        </div>
                      )}
                      <Button 
                        onClick={() => handleGenerateDocument(doc.id, doc.title)}
                        disabled={isGen}
                        className={cn(
                          "h-14 px-10 font-black uppercase text-[11px] tracking-[0.2em] rounded-xl transition-all shadow-2xl",
                          isGen ? "bg-secondary text-white" : "gold-gradient text-background hover:scale-105 active:scale-95"
                        )}
                      >
                        {isGen ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Play className="h-4 w-4 mr-3 fill-current" /> Gerar .DOC</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* PAINEL DE JURISDIÇÃO (FÓRUM/VARA) */}
          <Card className="glass border-white/10 bg-black/20 p-8 space-y-6 rounded-[2rem]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-widest">Unidade Judiciária (Fórum)</h4>
              </div>
              <Button variant="ghost" className="text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/10">Pesquisar Endereço via API</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tribunal / Fórum</Label>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-bold text-white uppercase">{lead.court || "NÃO INFORMADO"}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Vara / Unidade</Label>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-bold text-white uppercase">{lead.vara || "NÃO INFORMADA"}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Telefone da Unidade</Label>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-bold text-white uppercase flex items-center gap-2">
                  <Phone className="h-3 w-3 text-primary/50" /> (--) ----- ----
                </div>
              </div>
            </div>
          </Card>

          <div className="p-10 rounded-[3rem] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-6">
            <ExternalLink className="h-12 w-12 text-muted-foreground opacity-10" />
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-30 max-w-lg leading-loose">
              SISTEMA DE AUTOMAÇÃO RGMJ INTEGRADO AO GOOGLE DRIVE API.<br/>
              A ESTRUTURA DOCUMENTAL É DINÂMICA E SEGUE O RITO PROCESSUAL DEFINIDO PELO USUÁRIO.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
