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
import { updateDocumentNonBlocking, useAuth, useDoc, useMemoFirebase } from "@/firebase"
import { doc, serverTimestamp } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { setupClientWorkspace } from "@/services/google-drive"
import { getValidGoogleAccessToken } from "@/services/google-token"
import { normalizeGoogleWorkspaceSettings } from "@/services/google-workspace"

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
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()
  const db = useFirestore()
  const auth = useAuth()

  const googleSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleSettingsData } = useDoc(googleSettingsRef)
  const googleConfig = useMemo(() => normalizeGoogleWorkspaceSettings(googleSettingsData), [googleSettingsData])

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
    if (!googleConfig.isDocsActive) {
      toast({
        variant: "destructive",
        title: "Google Docs Desativado",
        description: "Ative o Google Docs no Hub Google para liberar a automação documental.",
      })
      return
    }

    toast({
      variant: "destructive",
      title: "Automação Documental Indisponível",
      description: `${title} ainda não possui um gerador real conectado a templates do Google Docs.`,
    })
  }

  const handleManualSync = async () => {
    if (!db || !lead) {
      toast({ 
        variant: "destructive", 
        title: "Configuração Pendente", 
        description: "A integração do Google Drive não está pronta para este lead." 
      })
      return
    }

    if (!googleConfig.isDriveActive) {
      toast({
        variant: "destructive",
        title: "Google Drive Desativado",
        description: "Ative o Google Drive no Hub Google para liberar a criação de pastas.",
      })
      return
    }

    if (!googleConfig.rootFolderId) {
      toast({ 
        variant: "destructive", 
        title: "Configuração Pendente", 
        description: "O Root Folder ID do Google Drive não foi configurado." 
      })
      return
    }

    const accessToken = await getValidGoogleAccessToken(auth)
    if (!accessToken) {
      toast({
        variant: "destructive",
        title: "Google Desconectado",
        description: "Reconecte a conta Google para criar a estrutura no Drive.",
      })
      return
    }

    setSyncing(true)
    try {
      const workspace = await setupClientWorkspace({
        accessToken,
        rootFolderId: googleConfig.rootFolderId,
        clientName: lead.name,
        processInfo: lead.processNumber ? {
          number: lead.processNumber,
          description: lead.demandTitle || lead.notes?.substring(0, 30) || "DEMANDA"
        } : undefined
      })

      const isReadyForClientFolder = lead.status === "burocracia" || lead.status === "distribuicao"
      const newDriveStatus = isReadyForClientFolder ? "pasta_cliente" : "pasta_lead"
      
      await updateDocumentNonBlocking(doc(db, "leads", lead.id), {
        driveStatus: newDriveStatus,
        driveFolderId: workspace.processFolderId || workspace.clientFolderId,
        driveFolderUrl: workspace.processFolderUrl || workspace.clientFolderUrl,
        updatedAt: serverTimestamp()
      })
      
      toast({ 
        title: "Infraestrutura Sincronizada", 
        description: "Estrutura real criada no Google Drive seguindo o padrão operacional RGMJ." 
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no Sincronismo",
        description: error instanceof Error ? error.message : "Falha ao criar infraestrutura no Drive."
      })
    } finally {
      setSyncing(false)
    }
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
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        
        {/* Lado Esquerdo: DNA e Cloud */}
        <div className="w-full lg:w-80 flex-none space-y-6">
          <Card className="glass border-primary/20 bg-black/40 overflow-hidden shadow-xl rounded-xl">
            <div className="p-4 bg-primary/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest">DNA de Dados</h4>
              </div>
              <Badge variant="outline" className="text-[9px] font-black text-primary border-primary/30 px-2 h-5">ATIVO</Badge>
            </div>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-3 space-y-3">
                  {Object.entries(availableData).map(([tag, val]) => (
                    <div key={tag} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all shadow-inner group">
                      <div className="flex items-center justify-between mb-1.5">
                        <code className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-sm">{tag}</code>
                        {val && val !== "PENDENTE" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertCircle className="h-3 w-3 text-amber-500/20" />}
                      </div>
                      <p className={cn(
                        "text-[11px] font-bold uppercase truncate leading-tight transition-colors",
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

          <Card className="glass border-emerald-500/20 bg-emerald-500/5 rounded-xl shadow-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <CloudLightning className="h-5 w-5 text-emerald-500" />
              <h4 className="text-[11px] font-black text-white uppercase tracking-tighter">Repositório Cloud</h4>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 shadow-inner">
              <p className="text-[11px] font-black text-white uppercase flex items-center gap-3">
                {lead.driveStatus === "pasta_cliente" ? <FolderCheck className="h-4 w-4 text-emerald-500" /> : <FolderOpen className="h-4 w-4 text-amber-500" />}
                {lead.driveStatus === "pasta_cliente" ? "ESTRUTURA: CLIENTE" : lead.driveStatus === "pasta_lead" ? "ESTRUTURA: LEAD" : "AGUARDANDO SINCR."}
              </p>
            </div>
            <Button 
              onClick={handleManualSync}
              disabled={syncing}
              className="w-full h-10 gold-gradient text-background font-black text-[10px] uppercase tracking-wider gap-3 shadow-xl hover:scale-105 transition-all rounded-lg"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSync className="h-4 w-4" />}
              SINC. WORKSPACE
            </Button>
            {lead.driveFolderUrl && (
              <Button
                onClick={() => window.open(lead.driveFolderUrl, "_blank")}
                variant="outline"
                className="w-full h-10 border-emerald-500/30 text-emerald-500 font-black text-[10px] uppercase tracking-wider gap-3 rounded-lg"
              >
                <ExternalLink className="h-4 w-4" />
                ABRIR PASTA
              </Button>
            )}
          </Card>
        </div>

        {/* Lado Direito: Kits e Logística */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4 border-b border-white/5 pb-3">
            <Gavel className="h-6 w-6 text-primary" />
            <h3 className="text-base font-bold text-white uppercase tracking-tighter">Kit Documental RGMJ</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kit.map((doc) => {
              return (
                <Card key={doc.id} className="glass border-white/5 hover:border-primary/40 transition-all group overflow-hidden shadow-lg rounded-xl">
                  <CardContent className="p-4 flex items-center justify-between gap-5">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex-none flex items-center justify-center group-hover:bg-primary/10 transition-all border border-white/5">
                        <FileCheck className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-all" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-white uppercase text-xs tracking-tight truncate">{doc.title}</h4>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {doc.tags.slice(0, 2).map(t => (
                            <Badge key={t} variant="outline" className={cn(
                              "text-[8px] font-black uppercase py-0.5 px-2 border-0",
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
                      className="h-9 px-5 font-black uppercase text-[10px] tracking-wider rounded-lg transition-all flex-none"
                    >
                      {googleConfig.isDocsActive ? "AUTOMAÇÃO DOCS" : "DOCS OFF"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className={cn(
            "glass p-5 rounded-2xl relative overflow-hidden group shadow-xl transition-all",
            !isJurisdictionComplete ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-black/20"
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-5">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border transition-all shadow-inner",
                  !isJurisdictionComplete ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-primary/10 text-primary border-primary/20"
                )}>
                  {!isJurisdictionComplete ? <ShieldAlert className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Unidade Judiciária de Atuação</h4>
                  {!isJurisdictionComplete && <p className="text-[9px] text-amber-500 font-black uppercase mt-1 animate-pulse tracking-widest">PENDÊNCIA DE LOGÍSTICA</p>}
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleOpenMaps} variant="outline" className="border-emerald-500/30 text-emerald-500 h-9 px-5 text-[10px] font-black uppercase rounded-lg">
                  <Navigation className="h-4 w-4 mr-2" /> MAPS
                </Button>
                <Button onClick={onEdit} variant="outline" className="border-primary/30 text-primary h-9 px-5 text-[10px] font-black uppercase rounded-lg">
                  <Edit3 className="h-4 w-4 mr-2" /> SANEAMENTO
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tribunal / Instância</Label>
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] font-black uppercase text-white truncate h-11 flex items-center">
                  {lead.court || "NÃO MAPEADO"}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Vara / Unidade</Label>
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] font-black uppercase text-white truncate h-11 flex items-center">
                  {lead.vara || "NÃO MAPEADA"}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Código Postal (CEP)</Label>
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] font-black uppercase text-white h-11 flex items-center font-mono">
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
