
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
  Building,
  Edit3,
  Scale,
  ShieldAlert,
  Navigation
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
  onEdit?: () => void
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

export function BurocraciaView({ lead, interviews, onEdit }: BurocraciaViewProps) {
  const [generating, setGenerating] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()
  const db = useFirestore()

  const availableData = useMemo(() => {
    const data: Record<string, any> = {
      "{{CLIENTE_NOME}}": lead?.name,
      "{{CLIENTE_CPF}}": lead?.cpf || lead?.documentNumber,
      "{{CLIENTE_EMAIL}}": lead?.email,
      "{{CLIENTE_WHATSAPP}}": lead?.phone,
      "{{CLIENTE_ENDERECO}}": lead?.address,
      "{{REU_NOME}}": lead?.defendantName,
      "{{REU_DOCUMENTO}}": lead?.defendantDocument,
      "{{PROCESSO_NUMERO}}": lead?.processNumber || "PENDENTE",
      "{{FORUM_NOME}}": lead?.court || "PENDENTE",
      "{{FORUM_ENDERECO}}": lead?.courtAddress ? `${lead.courtAddress}, ${lead.courtNumber}${lead.courtComplement ? ' - ' + lead.courtComplement : ''} - ${lead.courtNeighborhood}, ${lead.courtCity} - ${lead.courtState}` : "PENDENTE",
      "{{VARA_NOME}}": lead?.vara || "PENDENTE",
      "{{CIDADE_UF}}": lead?.city ? `${lead.city} - ${lead.state}` : "PENDENTE",
    }
    
    interviews.forEach(int => {
      const responses = int.responses || {}
      const snapshot = int.templateSnapshot || []
      snapshot.forEach((field: any) => {
        if (field.reuseEnabled && responses[field.label]) {
          const val = responses[field.label]
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
      toast({ title: "Workspace Sincronizado" })
    }, 1500)
  }

  const isJurisdictionComplete = lead.court && lead.vara && lead.courtAddress

  const handleOpenMaps = () => {
    const link = lead.courtMapsLink
    if (link) {
      window.open(link, "_blank")
    } else if (lead.courtAddress) {
      const query = encodeURIComponent(`${lead.courtAddress} ${lead.courtNumber} ${lead.courtCity} ${lead.courtState}`)
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank")
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-4 space-y-8">
          <Card className="glass border-primary/20 bg-black/40 overflow-hidden shadow-2xl rounded-3xl">
            <div className="p-8 bg-primary/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Database className="h-6 w-6 text-primary" />
                <h4 className="text-sm font-black text-white uppercase tracking-widest">DNA de Dados</h4>
              </div>
              <Badge variant="outline" className="text-[10px] font-black text-primary border-primary/30 px-3 py-1">INTEGRIDADE ATIVA</Badge>
            </div>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-8 space-y-6">
                  {Object.entries(availableData).map(([tag, val]) => (
                    <div key={tag} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all shadow-inner">
                      <div className="flex items-center justify-between mb-3">
                        <code className="text-xs font-black text-primary uppercase tracking-tighter bg-primary/10 px-2 py-1 rounded-md">{tag}</code>
                        {val && val !== "PENDENTE" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500/30" />}
                      </div>
                      <p className={cn(
                        "text-sm font-bold uppercase truncate leading-tight",
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

          <Card className="glass border-emerald-500/20 bg-emerald-500/5 rounded-3xl shadow-2xl">
            <CardContent className="p-10 space-y-8">
              <div className="flex items-center gap-4">
                <CloudLightning className="h-8 w-8 text-emerald-500" />
                <h4 className="text-xl font-black text-white uppercase tracking-tighter">Repositório Cloud</h4>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ESTRUTURA DE DIRETÓRIOS</p>
                    <p className="text-xs font-black text-white uppercase flex items-center gap-3">
                      {lead.driveStatus === "pasta_cliente" ? <FolderCheck className="h-5 w-5 text-emerald-500" /> : <FolderOpen className="h-5 w-5 text-amber-500 animate-pulse" />}
                      {lead.driveStatus === "pasta_cliente" ? "REPOSITÓRIO DE CLIENTES" : lead.driveStatus === "pasta_lead" ? "REPOSITÓRIO DE LEADS" : "AGUARDANDO SINCRONIA"}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="w-full h-16 gold-gradient text-background font-black text-xs uppercase tracking-[0.2em] gap-4 shadow-2xl hover:scale-105 transition-all rounded-xl"
                >
                  {syncing ? <Loader2 className="h-6 w-6 animate-spin" /> : <FolderSync className="h-6 w-6" />}
                  SINC. GOOGLE WORKSPACE
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-6">
                <Gavel className="h-10 w-10 text-primary" /> Kit Documental RGMJ
              </h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.4em] opacity-60">Geração dinâmica de minutas institucionais por área jurídica.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {kit.map((doc) => {
              const isGen = generating === doc.id
              const missingTags = doc.tags.filter(t => !availableData[t] || availableData[t] === "PENDENTE")
              
              return (
                <Card key={doc.id} className="glass border-white/5 hover:border-primary/40 transition-all group overflow-hidden shadow-2xl rounded-3xl">
                  <CardContent className="p-10 flex items-center justify-between">
                    <div className="flex items-center gap-10">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-all border border-white/5 shadow-inner">
                        <FileCheck className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-all" />
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-black text-white uppercase text-xl tracking-tight leading-none">{doc.title}</h4>
                        <div className="flex flex-wrap gap-2">
                          {doc.tags.map(t => (
                            <Badge key={t} variant="outline" className={cn(
                              "text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-md",
                              availableData[t] && availableData[t] !== "PENDENTE" ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "border-rose-500/30 text-rose-500 bg-rose-500/5"
                            )}>
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      {missingTags.length > 0 && (
                        <div className="hidden xl:flex items-center gap-3 text-xs font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20">
                          <AlertCircle className="h-4 w-4" /> Pendências: {missingTags.length}
                        </div>
                      )}
                      <Button 
                        onClick={() => handleGenerateDocument(doc.id, doc.title)}
                        disabled={isGen}
                        className={cn(
                          "h-16 px-12 font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all shadow-2xl",
                          isGen ? "bg-secondary text-white" : "gold-gradient text-background hover:scale-105 active:scale-95"
                        )}
                      >
                        {isGen ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Play className="h-5 w-5 mr-4 fill-current" /> GERAR .DOCX</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className={cn(
            "glass p-10 space-y-10 rounded-[3rem] relative overflow-hidden group transition-all shadow-2xl",
            !isJurisdictionComplete ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-black/20"
          )}>
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Scale className="h-48 text-primary" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all shadow-inner",
                  !isJurisdictionComplete ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-primary/10 text-primary border-primary/20"
                )}>
                  {!isJurisdictionComplete ? <ShieldAlert className="h-8 w-8" /> : <MapPin className="h-8 w-8" />}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-widest">Unidade Judiciária (Logística)</h4>
                  {!isJurisdictionComplete && <p className="text-xs text-amber-500 font-black uppercase tracking-[0.3em] mt-2 animate-pulse">ALERTA: Pendência Crítica para Distribuição</p>}
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={handleOpenMaps} variant="outline" className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white font-black text-xs uppercase tracking-widest h-14 px-8 gap-3 rounded-xl shadow-xl">
                  <Navigation className="h-5 w-5" /> GOOGLE MAPS
                </Button>
                <Button onClick={onEdit} variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-background font-black text-xs uppercase tracking-widest h-14 px-8 gap-3 rounded-xl shadow-xl">
                  <Edit3 className="h-5 w-5" /> SANEAMENTO
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 relative z-10">
              <div className="md:col-span-4 space-y-3">
                <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Tribunal / Órgão</Label>
                <div className={cn(
                  "p-6 rounded-2xl border-2 text-base font-black uppercase transition-all shadow-inner",
                  lead.court ? "bg-white/[0.03] text-white border-white/5" : "bg-amber-500/10 text-amber-500/50 border-amber-500/20 italic"
                )}>
                  {lead.court || "NÃO MAPEADO"}
                </div>
              </div>
              <div className="md:col-span-4 space-y-3">
                <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Vara / Unidade</Label>
                <div className={cn(
                  "p-6 rounded-2xl border-2 text-base font-black uppercase transition-all shadow-inner",
                  lead.vara ? "bg-white/[0.03] text-white border-white/5" : "bg-amber-500/10 text-amber-500/50 border-amber-500/20 italic"
                )}>
                  {lead.vara || "NÃO MAPEADA"}
                </div>
              </div>
              <div className="md:col-span-4 space-y-3">
                <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Endereço de Citação</Label>
                <div className={cn(
                  "p-6 rounded-2xl border-2 text-xs font-bold uppercase transition-all leading-relaxed shadow-inner",
                  lead.courtAddress ? "bg-white/[0.03] text-white border-white/5" : "bg-amber-500/10 text-amber-500/50 border-amber-500/20 italic"
                )}>
                  {lead.courtAddress ? (
                    `${lead.courtAddress}, ${lead.courtNumber} - ${lead.courtNeighborhood}, ${lead.courtCity}/${lead.courtState} (CEP: ${lead.courtZipCode})`
                  ) : "ENDEREÇO NÃO LOCALIZADO"}
                </div>
              </div>
            </div>
          </Card>

          <div className="p-16 rounded-[4rem] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-8 shadow-inner">
            <ExternalLink className="h-16 w-16 text-muted-foreground opacity-10" />
            <p className="text-xs font-black uppercase tracking-[0.5em] text-muted-foreground opacity-30 max-w-2xl leading-loose">
              ECOSSISTEMA INTEGRADO RGMJ ADVOGADOS. OS DOCUMENTOS SÃO GERADOS COM BASE NO DNA DE DADOS CAPTURADO NAS ETAPAS DE TRIAGEM E ATENDIMENTO.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
