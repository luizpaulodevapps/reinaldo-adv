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
    <div className="animate-in fade-in duration-700 font-sans w-full">
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        
        {/* Lado Esquerdo: DNA e Cloud */}
        <div className="w-full lg:w-72 flex-none space-y-4">
          <Card className="glass border-primary/20 bg-black/40 overflow-hidden shadow-xl rounded-xl">
            <div className="p-3 bg-primary/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">DNA de Dados</h4>
              </div>
              <Badge variant="outline" className="text-[8px] font-black text-primary border-primary/30 px-1.5 h-4">ATIVO</Badge>
            </div>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                <div className="p-2 space-y-2">
                  {Object.entries(availableData).map(([tag, val]) => (
                    <div key={tag} className="p-2 rounded bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all shadow-inner group">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded-sm">{tag}</code>
                        {val && val !== "PENDENTE" ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> : <AlertCircle className="h-2.5 w-2.5 text-amber-500/20" />}
                      </div>
                      <p className={cn(
                        "text-[10px] font-bold uppercase truncate leading-tight transition-colors",
                        val && val !== "PENDENTE" ? "text-white" : "text-muted-foreground/20 italic"
                      )}>
                        {val || "AGUARDANDO"}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="glass border-emerald-500/20 bg-emerald-500/5 rounded-xl shadow-xl p-3 space-y-3">
            <div className="flex items-center gap-2">
              <CloudLightning className="h-4 w-4 text-emerald-500" />
              <h4 className="text-[10px] font-black text-white uppercase tracking-tighter">Repositório Cloud</h4>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5 shadow-inner">
              <p className="text-[10px] font-black text-white uppercase flex items-center gap-2">
                {lead.driveStatus === "pasta_cliente" ? <FolderCheck className="h-3 w-3 text-emerald-500" /> : <FolderOpen className="h-3 w-3 text-amber-500" />}
                {lead.driveStatus === "pasta_cliente" ? "CLIENTES" : lead.driveStatus === "pasta_lead" ? "LEADS" : "AGUARDANDO"}
              </p>
            </div>
            <Button 
              onClick={handleManualSync}
              disabled={syncing}
              className="w-full h-8 gold-gradient text-background font-black text-[9px] uppercase tracking-wider gap-2 shadow-xl hover:scale-105 transition-all rounded"
            >
              {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <FolderSync className="h-3 w-3" />}
              SINC. WORKSPACE
            </Button>
          </Card>
        </div>

        {/* Lado Direito: Kits e Logística */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-2">
            <Gavel className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-tighter">Kit Documental RGMJ</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kit.map((doc) => {
              const isGen = generating === doc.id
              return (
                <Card key={doc.id} className="glass border-white/5 hover:border-primary/40 transition-all group overflow-hidden shadow-lg rounded-xl">
                  <CardContent className="p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded bg-white/5 flex-none flex items-center justify-center group-hover:bg-primary/10 transition-all border border-white/5">
                        <FileCheck className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-white uppercase text-[11px] tracking-tight truncate">{doc.title}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.tags.slice(0, 2).map(t => (
                            <Badge key={t} variant="outline" className={cn(
                              "text-[7px] font-black uppercase py-0 px-1 border-0",
                              availableData[t] && availableData[t] !== "PENDENTE" ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                            )}>
                              {t.replace('{{', '').replace('}}', '')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleGenerateDocument(doc.id, doc.title)}
                      disabled={isGen}
                      className="h-8 px-4 font-black uppercase text-[9px] tracking-wider rounded transition-all flex-none"
                    >
                      {isGen ? <Loader2 className="h-3 w-3 animate-spin" /> : "GERAR .DOCX"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className={cn(
            "glass p-4 rounded-2xl relative overflow-hidden group shadow-xl transition-all",
            !isJurisdictionComplete ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-black/20"
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border transition-all shadow-inner",
                  !isJurisdictionComplete ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-primary/10 text-primary border-primary/20"
                )}>
                  {!isJurisdictionComplete ? <ShieldAlert className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Unidade Judiciária</h4>
                  {!isJurisdictionComplete && <p className="text-[8px] text-amber-500 font-black uppercase mt-0.5 animate-pulse">PENDÊNCIA DE LOGÍSTICA</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleOpenMaps} variant="outline" className="border-emerald-500/30 text-emerald-500 h-8 px-4 text-[9px] font-black uppercase rounded-md">
                  <Navigation className="h-3.5 w-3.5 mr-2" /> MAPS
                </Button>
                <Button onClick={onEdit} variant="outline" className="border-primary/30 text-primary h-8 px-4 text-[9px] font-black uppercase rounded-md">
                  <Edit3 className="h-3.5 w-3.5 mr-2" /> SANEAMENTO
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Tribunal</Label>
                <div className="p-2 rounded bg-black/40 border border-white/5 text-[10px] font-black uppercase text-white truncate h-10 flex items-center">
                  {lead.court || "NÃO MAPEADO"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Vara</Label>
                <div className="p-2 rounded bg-black/40 border border-white/5 text-[10px] font-black uppercase text-white truncate h-10 flex items-center">
                  {lead.vara || "NÃO MAPEADA"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">CEP Posta</Label>
                <div className="p-2 rounded bg-black/40 border border-white/5 text-[10px] font-black uppercase text-white h-10 flex items-center">
                  {lead.courtZipCode || "NÃO MAPEADO"}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
