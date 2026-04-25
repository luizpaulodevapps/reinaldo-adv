"use client"

import { useState, useMemo, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronRight,
  Clock,
  Loader2,
  Video,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Building,
  Archive,
  Trash2,
  Fingerprint,
  LayoutGrid,
  History,
  ArrowLeft,
  ArrowRight,
  X,
  FileText,
  Save,
  MessageCircle,
  MoreVertical,
  Calendar,
  User,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  Brain,
  Plus,
  CloudLightning,
  FolderCheck,
  FolderOpen,
  CreditCard,
  Landmark,
  Zap,
  MessageSquare,
  Gavel
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useAuth, useMemoFirebase, useDoc, useCollection, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase"
import { doc, collection, query, serverTimestamp, orderBy, limit } from "firebase/firestore"
import { cn, maskCEP, maskPhone, maskCPFOrCNPJ } from "@/lib/utils"
import { ActivityManager } from "@/components/leads/activity-manager"
import { DynamicInterviewExecution } from "@/components/interviews/dynamic-interview-execution"
import { normalizeGoogleWorkspaceSettings, toGoogleDriveFolderUrl } from "@/services/google-workspace"
import { syncActToGoogleCalendar } from "@/services/google-calendar-sync"
import { getValidGoogleAccessToken } from "@/services/google-token"
import * as DriveService from "@/services/google-drive";
import Link from "next/link"
import { LeadWorkflow, WorkflowData, Defendant } from "@/components/leads/lead-workflow"

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const db = useFirestore()
  const auth = useAuth()
  const { user } = useUser()
  const { toast } = useToast()

  const leadRef = useMemoFirebase(() => db ? doc(db, "leads", id) : null, [db, id])
  const { data: lead, isLoading } = useDoc(leadRef)

  const googleSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleSettingsData } = useDoc(googleSettingsRef)
  const googleSettings = useMemo(() => normalizeGoogleWorkspaceSettings(googleSettingsData), [googleSettingsData])

  const financialSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'financial') : null, [db])
  const { data: financialSettings } = useDoc(financialSettingsRef)

  const [activeDossierTab, setActiveDossierTab] = useState("atividades")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSharingBank, setIsSharingBank] = useState(false)
  const [isInterviewing, setIsInterviewing] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const interviewsQuery = useMemoFirebase(() => {
    if (!db || !id) return null
    return query(collection(db, "leads", id, "interviews"), orderBy("createdAt", "desc"), limit(5))
  }, [db, id])
  const { data: interviews } = useCollection(interviewsQuery)
  const [selectedInterviewIndex, setSelectedInterviewIndex] = useState(0)
  const latestInterview = interviews?.[selectedInterviewIndex] || interviews?.[0]

  const [isSchedulingIntake, setIsSchedulingIntake] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (lead && searchParams.get('action') === 'schedule') {
      setIsSchedulingIntake(true)
    }
  }, [lead, searchParams])

  const [intakeStep, setIntakeStep] = useState(1)
  const [intakeData, setIntakeData] = useState({
    date: "",
    time: "09:00",
    type: "online",
    locationType: "sede",
    customAddress: "",
    observations: "",
    autoMeet: true,
    zipCode: "",
    address: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    priority: "media"
  })
  const [newDocName, setNewDocName] = useState("")
  const [isSyncingIntake, setIsSyncingIntake] = useState(false)
  const [loadingIntakeCep, setLoadingIntakeCep] = useState(false)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [isEditingLead, setIsEditingLead] = useState(false)
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(1)

  const templatesQuery = useMemoFirebase(() => db ? query(collection(db, "checklists")) : null, [db])
  const { data: templates } = useCollection(templatesQuery)

  const modelsQuery = useMemoFirebase(() => db ? query(collection(db, "document_templates")) : null, [db])
  const { data: models } = useCollection(modelsQuery)

  const [isSyncingDrive, setIsSyncingDrive] = useState(false)
  const [isDistributing, setIsDistributing] = useState(false)

  const autoSelectedTemplate = useMemo(() => {
    if (!templates || !lead) return null
    return templates.find(t => t.type?.toLowerCase() === lead.type?.toLowerCase() || t.title?.toLowerCase().includes(lead.type?.toLowerCase())) || templates[0]
  }, [templates, lead])

  useEffect(() => {
    if (lead) {
      setIntakeData({
        date: lead.scheduledDate || "",
        time: lead.scheduledTime || "09:00",
        type: lead.meetingType || "online",
        locationType: lead.locationType || "sede",
        customAddress: lead.customAddress || "",
        observations: lead.intakeObservations || "",
        autoMeet: true,
        zipCode: lead.zipCode || "",
        address: lead.address || "",
        number: lead.number || "",
        neighborhood: lead.neighborhood || "",
        city: lead.city || "",
        state: lead.state || "",
        priority: lead.priority || "media"
      })
    }
  }, [lead?.id])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copiado", description: `${label} copiado para a área de transferência.` })
  }

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "")
    window.open(`https://wa.me/55${cleanPhone}`, "_blank")
  }

  const handleIntakeCepBlur = async () => {
    const cep = intakeData.zipCode?.replace(/\D/g, "")
    if (!cep || cep.length !== 8) return
    setLoadingIntakeCep(true)
    try {
      const response = await fetch("https://viacep.com.br/ws/" + cep + "/json/")
      const data = await response.json()
      if (!data.erro) {
        setIntakeData(prev => ({
          ...prev,
          address: data.logradouro.toUpperCase(),
          neighborhood: data.bairro.toUpperCase(),
          city: data.localidade.toUpperCase(),
          state: data.uf.toUpperCase()
        }))
      }
    } catch (e) { console.error("CEP error") } finally { setLoadingIntakeCep(false) }
  }

  const handleDistributeLead = async () => {
    if (!db || !lead || !user) return

    const confirmDist = confirm(`Deseja converter o lead "${lead.name}" em um cliente ativo?\n\nIsso moverá a pasta no Google Drive e criará o registro oficial de cliente.`)
    if (!confirmDist) return

    setIsDistributing(true)
    try {
      const accessToken = await getValidGoogleAccessToken(auth)
      if (!accessToken) throw new Error("Não foi possível obter permissão do Google.")

      // 1. Mover pasta no Drive se existir
      if (lead.driveFolderId && googleSettings.isDriveActive && googleSettings.clientsFolderId) {
        // Mover para a pasta de clientes
        await DriveService.moveFile(accessToken, lead.driveFolderId || "", googleSettings.clientsFolderId || "", googleSettings.leadsFolderId || "")

        // Renomear para remover o prefixo [LEAD]
        const cleanName = lead.name.toUpperCase()
        await fetch(`https://www.googleapis.com/drive/v3/files/${lead.driveFolderId || ""}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName })
        })
      }

      // 2. Criar Cliente
      const clientRef = doc(collection(db, "clients"))
      const clientData = {
        id: clientRef.id,
        name: lead.name.toUpperCase(),
        documentNumber: lead.cpf || "",
        email: lead.email || "",
        phone: lead.phone || "",
        type: 'individual',
        status: "Ativo",
        source: lead.source || "LEAD CONVERTIDO",
        responsibleLawyer: lead.responsibleLawyer || "",
        driveFolderId: lead.driveFolderId || "",
        driveFolderUrl: lead.driveFolderUrl || "",
        leadId: lead.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      setDocumentNonBlocking(clientRef, clientData, { merge: true })

      // 3. Atualizar Lead
      await updateDocumentNonBlocking(doc(db, "leads", lead.id), {
        status: 'distribuído',
        clientId: clientRef.id,
        updatedAt: serverTimestamp()
      })

      // 4. Registrar Atividade
      await addDocumentNonBlocking(collection(db, "activities"), {
        leadId: lead.id,
        userId: user.uid,
        userName: user.displayName || user.email,
        type: "Sistema",
        subject: "LEAD DISTRIBUÍDO",
        description: `Lead convertido em cliente ativo: ${lead.name}`,
        responsibleId: user.uid,
        status: "Realizado",
        createdAt: serverTimestamp()
      })

      toast({ title: "Lead Distribuído", description: "O cliente foi criado e a pasta movida com sucesso." })
      router.push(`/clients`)
    } catch (error) {
      console.error("Distribution Error", error)
      toast({ variant: "destructive", title: "Erro na Distribuição", description: "Não foi possível completar a conversão." })
    } finally {
      setIsDistributing(false)
    }
  }

  const handleScheduleIntake = async () => {
    if (!db || !lead || !intakeData.date) {
      toast({ variant: "destructive", title: "Dados Incompletos" })
      return
    }
    setIsSyncingIntake(true)

    let finalLocation = ""
    if (intakeData.type === 'online') {
      finalLocation = "GOOGLE MEET RGMJ"
    } else {
      if (intakeData.locationType === 'sede') {
        finalLocation = 'Sede RGMJ'
      } else {
        const addr = intakeData.address || ""
        const num = intakeData.number || ""
        const neigh = intakeData.neighborhood || ""
        const cit = intakeData.city || ""
        const st = intakeData.state || ""
        finalLocation = `${addr}, ${num} - ${neigh}, ${cit}/${st}`
      }
    }

    const timeVal = intakeData.time || "09:00"
    const dateTimeStr = intakeData.date + "T" + timeVal + ":00";
    const appRef = doc(collection(db, "appointments"));
    const docRefId = appRef.id;

    updateDocumentNonBlocking(doc(db, "leads", lead.id), {
      scheduledDate: intakeData.date,
      scheduledTime: intakeData.time,
      meetingType: intakeData.type,
      meetingLocation: finalLocation,
      updatedAt: serverTimestamp()
    })

    setDocumentNonBlocking(appRef, {
      id: docRefId,
      title: "TRIAGEM: " + lead.name,
      type: "Atendimento",
      startDateTime: dateTimeStr,
      clientId: lead.id,
      clientName: lead.name,
      location: finalLocation,
      status: "Agendado",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true })

    const calendarSync = await syncActToGoogleCalendar({
      auth,
      googleSettings,
      staffEmail: user?.email ?? undefined,
      firestore: db,
      act: {
        title: "[TRIAGEM] " + lead.name,
        description: `Triagem inicial do lead RGMJ.\n\nObservações: ${intakeData.observations || 'N/A'}`,
        location: finalLocation,
        startDateTime: dateTimeStr,
        type: 'atendimento',
        clientName: lead.name,
        clientPhone: lead.phone || '',
        useMeet: intakeData.type === 'online' && intakeData.autoMeet
      }
    })

    if (calendarSync.status === 'synced') {
      updateDocumentNonBlocking(appRef, {
        meetingUrl: calendarSync.meetingUrl || "",
        calendarEventId: calendarSync.calendarEventId,
        calendarSyncStatus: 'synced',
        updatedAt: serverTimestamp()
      })
    }

    setIsSyncingIntake(false)
    setIsSchedulingIntake(false)

    if (user) {
      addDocumentNonBlocking(collection(db, "notifications"), {
        userId: user.uid,
        title: "Agendamento Realizado",
        message: `Triagem agendada para ${lead.name.toUpperCase()} em ${intakeData.date} às ${intakeData.time}.`,
        type: "lead",
        severity: "info",
        read: false,
        link: `/leads/${lead.id}`,
        createdAt: serverTimestamp()
      })
    }

    toast({ title: "Atendimento Protocolado" })
  }

  const handleArchiveLead = async () => {
    if (!db || !user || !lead) return
    try {
      await updateDocumentNonBlocking(doc(db, "leads", lead.id), {
        status: 'arquivado',
        updatedAt: serverTimestamp()
      })

      await addDocumentNonBlocking(collection(db, "activities"), {
        leadId: lead.id,
        type: "Sistema",
        subject: "LEAD ARQUIVADO",
        description: `O lead foi arquivado por ${user.displayName || user.email}`,
        responsibleId: user.uid,
        responsibleName: user.displayName || "Sistema",
        status: "Realizado",
        createdAt: serverTimestamp()
      })

      await addDocumentNonBlocking(collection(db, "activities"), {
        leadId: lead.id,
        userId: user.uid,
        userName: user.displayName || user.email,
        type: "Sistema",
        subject: "LEAD ARQUIVADO",
        description: `Arquivou o lead: ${lead.name}`,
        responsibleId: user.uid,
        responsibleName: user.displayName || "Sistema",
        status: "Realizado",
        createdAt: serverTimestamp()
      })

      toast({ title: "Lead Arquivado", description: "O lead foi removido do funil ativo." })
      router.push("/leads")
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao arquivar lead" })
    }
  }

  const mapResponsesToLeadUpdates = (responses: Record<string, any>) => {
    const updates: any = { updatedAt: serverTimestamp() }

    Object.entries(responses).forEach(([label, value]) => {
      const l = label.toUpperCase()
      const v = String(value).trim()
      if (!v || v === "---") return

      // Dados Pessoais
      if (l.includes("CPF") && !l.includes("RÉU") && !l.includes("EMPRESA")) updates.cpf = maskCPFOrCNPJ(v)
      if ((l.includes("NOME COMPLETO") || l === "NOME") && !l.includes("RÉU") && !l.includes("EMPRESA")) updates.name = v.toUpperCase()
      if (l.includes("TELEFONE")) updates.phone = maskPhone(v)
      if (l.includes("EMAIL")) updates.email = v.toLowerCase()
      if (l.includes("CEP")) updates.zipCode = maskCEP(v)
      if (l.includes("ENDEREÇO") || l.includes("LOGRADOURO")) updates.address = v.toUpperCase()

      // Polo Passivo
      if (l.includes("RÉU") || l.includes("REQUERIDO") || l.includes("EMPRESA") || l.includes("POLO PASSIVO") || l.includes("CONTRA QUEM")) {
        if (!l.includes("CPF") && !l.includes("CNPJ") && !l.includes("DOCUMENTO")) {
          updates.defendantName = v.toUpperCase()
        } else {
          updates.defendantDocument = maskCPFOrCNPJ(v)
        }
      }

      // Detalhes do Caso
      if (l.includes("OBJETO") || l.includes("ASSUNTO") || l.includes("PEDIDO PRINCIPAL")) {
        updates.demandTitle = v.toUpperCase()
      }
      if (l.includes("RELATO") || l.includes("FATOS") || l.includes("O QUE ACONTECEU")) {
        updates.notes = v
      }
    })

    return updates
  }

  const handleFinishInterview = async (payload: { responses: any; templateSnapshot: any[] }) => {
    if (!db || !lead || !user) return

    setIsInterviewing(false)
    const { responses, templateSnapshot } = payload

    // 1. Extrair dados para completar o cadastro
    const updates = mapResponsesToLeadUpdates(responses)

    // 2. Salvar o lead com os novos dados
    await updateDocumentNonBlocking(doc(db, "leads", lead.id), updates)

    // 3. Registrar a entrevista na subcoleção do lead
    const interviewData = {
      responses,
      templateSnapshot,
      clientName: lead.name,
      leadId: lead.id,
      interviewType: autoSelectedTemplate?.title || "Triagem Geral",
      interviewerId: user.uid,
      interviewerName: user.displayName || user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "Concluída"
    }

    await addDocumentNonBlocking(collection(db, "leads", lead.id, "interviews"), interviewData)

    // 4. Registrar atividade no histórico
    await addDocumentNonBlocking(collection(db, "activities"), {
      leadId: lead.id,
      type: "Entrevista",
      subject: `ENTREVISTA CONCLUÍDA: ${interviewData.interviewType}`,
      description: `A triagem técnica foi finalizada e os dados foram integrados ao dossiê.`,
      responsibleId: user.uid,
      responsibleName: user.displayName || "Sistema",
      status: "Realizado",
      createdAt: serverTimestamp()
    })

    toast({ title: "Atendimento Protocolado", description: "Dados sincronizados com sucesso." })
  }

  const handleSyncInterviewData = async () => {
    if (!db || !lead || !latestInterview) return

    try {
      const updates = mapResponsesToLeadUpdates(latestInterview.responses || {})
      await updateDocumentNonBlocking(doc(db, "leads", lead.id), updates)
      toast({ title: "Dados Sincronizados", description: "O perfil do lead foi atualizado com as respostas da entrevista." })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na sincronização", description: "Não foi possível extrair os dados." })
    }
  }

  useEffect(() => {
    const validateDrive = async () => {
      if (!db || !lead || !googleSettings.isDriveActive || !auth.currentUser) return

      // Se já tem ID, verificar se ainda existe
      if (lead.driveFolderId) {
        const accessToken = await getValidGoogleAccessToken(auth)
        if (!accessToken) return

        const exists = await DriveService.checkFolderExists(accessToken, lead.driveFolderId)
        if (!exists) {
          // Pasta sumiu ou ID inválido -> tentar achar por nome
          const isLead = lead.status !== "distribuicao" && lead.status !== "concluido"
          const rootId = isLead ? (googleSettings.leadsFolderId || googleSettings.rootFolderId) : (googleSettings.clientsFolderId || googleSettings.rootFolderId)
          const folderName = isLead ? `[LEAD] ${lead.name.toUpperCase()}` : lead.name.toUpperCase()

          const found = await DriveService.findFolderByName(accessToken, folderName, rootId)
          if (found) {
            updateDocumentNonBlocking(doc(db, "leads", lead.id), {
              driveFolderId: found.id,
              driveFolderUrl: toGoogleDriveFolderUrl(found.id),
              driveStatus: "recuperado"
            })
          } else {
            updateDocumentNonBlocking(doc(db, "leads", lead.id), {
              driveStatus: "desconectado"
            })
          }
        } else if (lead.driveStatus !== "ativo") {
          updateDocumentNonBlocking(doc(db, "leads", lead.id), {
            driveStatus: "ativo"
          })
        }
      }
    }

    validateDrive()
  }, [lead?.id, googleSettings.isDriveActive])

  const handleSaveWorkflow = async (data: WorkflowData) => {
    if (!db || !lead) return
    try {
      const payload: any = {
        ...data,
        updatedAt: serverTimestamp()
      }

      // Compatibilidade legada
      if (data.defendants?.length > 0) {
        payload.defendantName = data.defendants[0].name
        payload.defendantDocument = data.defendants[0].document
      }

      await updateDocumentNonBlocking(doc(db, "leads", lead.id), payload)
      toast({ title: "Perfil Atualizado", description: "As alterações foram salvas no dossiê." })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Verifique a conexão e tente novamente." })
    }
  }

  const handleGenerateDraft = async (model: any) => {
    if (!lead || !db) return

    // Preparar Tags para Substituição
    const tagMap: Record<string, string> = {
      "{{NOME}}": lead.name || "---",
      "{{CPF}}": lead.cpf || "---",
      "{{EMAIL}}": lead.email || "---",
      "{{TELEFONE}}": lead.phone || "---",
      "{{ENDEREÇO}}": lead.address || "---",
      "{{CIDADE}}": lead.city || "---",
      "{{UF}}": lead.state || "---",
      "{{DATA}}": new Date().toLocaleDateString('pt-BR'),
      "{{AREA}}": lead.type || "Geral",
      "{{ADVOGADO}}": lead.responsibleLawyer || "Reinaldo Gonçalves"
    }

    // Tentar automação real via Google Drive se disponível
    if (lead.driveFolderId && model.googleDocId) {
      const accessToken = await getValidGoogleAccessToken(auth)
      if (accessToken) {
        setIsGeneratingDoc(true)
        try {
          const fileName = `${model.title} - ${lead.name.toUpperCase()}`
          const newDoc = await DriveService.copyFile(accessToken, model.googleDocId, lead.driveFolderId, fileName)
          await DriveService.replaceDocTags(accessToken, newDoc.id, tagMap)

          toast({
            title: "Documento Automatizado",
            description: "O documento foi criado na pasta do cliente e as tags foram injetadas."
          })

          window.open(`https://docs.google.com/document/d/${newDoc.id}/edit`, "_blank")

          // Registrar no histórico
          addDocumentNonBlocking(collection(db, "activities"), {
            leadId: lead.id,
            type: "Documento",
            subject: `DOCUMENTO AUTOMATIZADO: ${model.title}`,
            description: `O documento real foi gerado no Google Drive com injeção de dados.`,
            responsibleId: user?.uid,
            responsibleName: user?.displayName || "Sistema",
            status: "Realizado",
            createdAt: serverTimestamp()
          })
          return
        } catch (e) {
          console.error("Erro na automação real, caindo para fallback:", e)
        } finally {
          setIsGeneratingDoc(false)
        }
      }
    }

    // FALLBACK: Método Clipboard + docs.new
    let content = `REINALDO GONÇALVES MIGUEL DE JESUS - ADVOCACIA ESTRATÉGICA\n`
    content += `${model.title}\n\n`

    // Se houver tags específicas no modelo, tentamos preencher
    let draftText = `ESTRUTURA DE ${model.title}\n\n`
    model.tags?.forEach((tag: string) => {
      const value = tagMap[tag] || "______"
      draftText += `${tag.replace("{{", "").replace("}}", "")}: ${value}\n`
    })

    const finalContent = `${content}${draftText}\n\nDocumento gerado automaticamente via RGMJ Digital.`

    navigator.clipboard.writeText(finalContent).then(() => {
      toast({
        title: "Minuta Preparada",
        description: "Os dados foram injetados e a minuta foi copiada. Use Ctrl+V no Google Docs."
      })
      setTimeout(() => {
        window.open("https://docs.new", "_blank")
      }, 1000)
    })

    // Registrar no histórico
    addDocumentNonBlocking(collection(db, "activities"), {
      leadId: lead.id,
      type: "Documento",
      subject: `DOCUMENTO GERADO: ${model.title}`,
      description: `A minuta foi gerada e exportada para o Google Docs (via clipboard).`,
      responsibleId: user?.uid,
      responsibleName: user?.displayName || "Sistema",
      status: "Realizado",
      createdAt: serverTimestamp()
    })
  }

  const handleSyncDrive = async () => {
    if (!db || !lead) return;

    if (!googleSettings.isDriveActive) {
      toast({ 
        variant: "destructive", 
        title: "Drive Desativado", 
        description: "O módulo de Google Drive não está ativo. Vá em Configurações > Google Workspace para ativar." 
      })
      return
    }

    const accessToken = await getValidGoogleAccessToken(auth)
    if (!accessToken) {
      toast({ 
        variant: "destructive", 
        title: "Sessão Expirada", 
        description: "Sua conexão com o Google expirou. Por favor, faça login novamente na aba Configurações." 
      })
      return
    }

    setIsSyncingDrive(true)
    try {
      const isLead = lead.status !== "distribuicao" && lead.status !== "concluido"
      
      // Tentar IDs na ordem de prioridade: Pasta Específica -> Pasta Raiz -> Erro
      const rootId = isLead 
        ? (googleSettings.leadsFolderId || googleSettings.rootFolderId) 
        : (googleSettings.clientsFolderId || googleSettings.rootFolderId);

      if (!rootId) {
        throw new Error("ID da pasta raiz não configurado. Defina a pasta de destino nas configurações do Google Workspace.");
      }

      const folderName = isLead ? `[LEAD] ${lead.name.toUpperCase()}` : lead.name.toUpperCase()
      
      toast({ title: "Iniciando Drive...", description: "Criando infraestrutura documental..." })

      // Verificar se já existe por nome para evitar duplicatas
      const existingFolder = await DriveService.findFolderByName(accessToken, folderName, rootId)

      let workspace;
      if (existingFolder) {
        workspace = {
          success: true,
          clientFolderId: existingFolder.id,
          clientFolderUrl: toGoogleDriveFolderUrl(existingFolder.id),
        }
      } else {
        workspace = await DriveService.setupClientWorkspace({
          accessToken,
          rootFolderId: rootId,
          clientName: lead.name,
          isLead,
          processInfo: lead.processNumber ? {
            number: lead.processNumber,
            description: lead.demandTitle || lead.notes?.substring(0, 30) || "DEMANDA"
          } : undefined
        })
      }

      if (!workspace || !workspace.clientFolderId) {
        throw new Error("A API do Google retornou sucesso, mas não forneceu o ID da pasta.");
      }

      const driveStatus = "ativo"
      const folderId = workspace.processFolderId || workspace.clientFolderId
      const folderUrl = workspace.processFolderUrl || workspace.clientFolderUrl

      await updateDocumentNonBlocking(doc(db, "leads", lead.id), {
        driveStatus,
        driveFolderId: folderId,
        driveFolderUrl: folderUrl,
        updatedAt: serverTimestamp()
      })

      // Registrar atividade
      await addDocumentNonBlocking(collection(db, "activities"), {
        leadId: lead.id,
        type: "Sistema",
        subject: "WORKSPACE DRIVE CRIADO",
        description: `Infraestrutura documental criada com sucesso no Google Drive.`,
        responsibleId: user?.uid,
        responsibleName: user?.displayName || "Sistema",
        status: "Realizado",
        createdAt: serverTimestamp()
      })

      toast({ title: "Workspace Ativo", description: "Pasta criada e vinculada com sucesso!" })
      
      // Abrir a pasta automaticamente após criar
      if (folderUrl) {
        window.open(folderUrl, "_blank")
      }
    } catch (e: any) {
      console.error("Sync Drive Error:", e)
      toast({ 
        variant: "destructive", 
        title: "Falha na Infraestrutura", 
        description: e.message || "Erro desconhecido ao criar pasta no Drive." 
      })
    } finally {
      setIsSyncingDrive(false)
    }
  }

  const handleDeleteLead = async () => {
    if (!db || !user || !lead) return
    try {
      await deleteDocumentNonBlocking(doc(db, "leads", lead.id))

      await addDocumentNonBlocking(collection(db, "activities"), {
        leadId: lead.id,
        userId: user.uid,
        userName: user.displayName || user.email,
        type: "Sistema",
        subject: "LEAD EXCLUÍDO",
        description: `Excluiu permanentemente o lead: ${lead.name}`,
        responsibleId: user.uid,
        responsibleName: user.displayName || "Sistema",
        status: "Realizado",
        createdAt: serverTimestamp()
      })

      toast({ title: "Lead Excluído", description: "O registro foi removido permanentemente." })
      router.push("/leads")
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir lead" })
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#05070a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Carregando dossiê...</p>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-[#05070a]">
        <AlertCircle className="h-16 w-16 text-white/10" />
        <h2 className="text-xl font-black text-white uppercase tracking-widest">Lead não encontrado</h2>
        <Button onClick={() => router.push("/leads")} variant="outline" className="text-xs font-black uppercase tracking-widest h-11 px-8 border-white/10">Voltar para o Funil</Button>
      </div>
    )
  }

  const labelMini = "text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 block"

  return (
    <div>
      <div className="flex flex-col h-screen bg-[#05070a] animate-in fade-in duration-500 overflow-hidden font-sans">
        {/* HEADER COMPACTO */}
        <div className="px-6 py-4 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-md flex-none flex items-center justify-between shadow-2xl z-20">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" onClick={() => router.push("/leads")} className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(245,208,48,0.1)]">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-lg font-black uppercase text-white tracking-tight leading-none">{lead.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-black uppercase h-5 tracking-widest">LEAD ATIVO</Badge>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{lead.type || 'Área não definida'}</span>
                </div>
              </div>
            </div>
          </div>

          {lead.status !== 'distribuído' && (
            <Button
              onClick={handleDistributeLead}
              disabled={isDistributing}
              className="gold-gradient text-background font-black text-[9px] uppercase tracking-widest h-9 px-6 rounded-lg shadow-lg gap-2 hover:scale-105 transition-all"
            >
              {isDistributing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              Distribuir Lead
            </Button>
          )}

          {!lead.driveFolderId && (
            <Button
              onClick={handleSyncDrive}
              disabled={isSyncingDrive}
              variant="outline"
              className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 font-black text-[9px] uppercase tracking-widest h-9 px-4 gap-2 transition-all mr-4 animate-pulse hover:animate-none"
            >
              {isSyncingDrive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudLightning className="h-3.5 w-3.5" />}
              Ativar Workspace Drive
            </Button>
          )}
          {lead.driveFolderId && (
            <Button
              variant="outline"
              onClick={() => {
                const url = lead.driveFolderUrl || toGoogleDriveFolderUrl(lead.driveFolderId);
                if (url) window.open(url, "_blank");
                else toast({ variant: "destructive", title: "Erro de Link", description: "O ID da pasta é inválido." });
              }}
              className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 font-black text-[8px] uppercase tracking-widest h-9 px-4 flex items-center gap-2 mr-4 transition-all"
            >
              <FolderCheck className="h-3.5 w-3.5" /> Workspace Ativo
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleArchiveLead}
            className="border-white/5 hover:border-amber-500/50 hover:bg-amber-500/10 text-white/60 hover:text-amber-500 font-black text-[9px] uppercase tracking-widest h-9 px-4 gap-2 transition-all"
          >
            <Archive className="h-3.5 w-3.5" /> Arquivar
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="border-white/5 hover:border-red-500/50 hover:bg-red-500/10 text-white/60 hover:text-red-500 font-black text-[9px] uppercase tracking-widest h-9 px-4 gap-2 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
        </div>
        <div className="flex flex-1 overflow-hidden">

          {/* COLUNA ESQUERDA: CONTEÚDO PRINCIPAL (TABS) */}
          <div className="flex-1 flex flex-col border-r border-white/5">
            <div className="px-8 pt-6 pb-2 border-b border-white/5 bg-white/[0.01]">
              <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab} className="w-full">
                <TabsList className="bg-transparent border-b border-white/5 w-full h-12 p-0 gap-8 justify-start rounded-none">
                  <TabsTrigger value="atividades" className="data-[state=active]:border-primary border-b-2 border-transparent text-white/40 data-[state=active]:text-white font-black text-[10px] uppercase h-full px-0 rounded-none gap-2 tracking-widest transition-all"><History className="h-4 w-4" /> Atribuições</TabsTrigger>
                  <TabsTrigger value="entrevista" className="data-[state=active]:border-primary border-b-2 border-transparent text-white/40 data-[state=active]:text-white font-black text-[10px] uppercase h-full px-0 rounded-none gap-2 tracking-widest transition-all"><Brain className="h-4 w-4" /> Entrevista & Tags</TabsTrigger>
                  <TabsTrigger value="overview" className="data-[state=active]:border-primary border-b-2 border-transparent text-white/40 data-[state=active]:text-white font-black text-[10px] uppercase h-full px-0 rounded-none gap-2 tracking-widest transition-all"><LayoutGrid className="h-4 w-4" /> Detalhes do Caso</TabsTrigger>
                  <TabsTrigger value="burocracia" className="data-[state=active]:border-primary border-b-2 border-transparent text-white/40 data-[state=active]:text-white font-black text-[10px] uppercase h-full px-0 rounded-none gap-2 tracking-widest transition-all"><FileText className="h-4 w-4" /> Burocracia & Docs</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-8 pb-32">
                <Tabs value={activeDossierTab} onValueChange={setActiveDossierTab}>
                  <TabsContent value="atividades" className="m-0 focus:outline-none">
                    <ActivityManager leadId={lead.id} onNavigateToTab={(t) => setActiveDossierTab(t)} />
                  </TabsContent>

                  <TabsContent value="entrevista" className="m-0 focus:outline-none space-y-10 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      {/* TAGS PARA DOCUMENTOS */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500">
                            <Fingerprint className="h-4 w-4" />
                          </div>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">Tags para Documentos</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { tag: "{{NOME}}", val: lead.name },
                            { tag: "{{CPF}}", val: lead.cpf },
                            { tag: "{{EMAIL}}", val: lead.email },
                            { tag: "{{TELEFONE}}", val: lead.phone },
                            { tag: "{{ENDEREÇO}}", val: lead.address },
                            { tag: "{{CIDADE}}", val: lead.city },
                            { tag: "{{UF}}", val: lead.state },
                            { tag: "{{AREA}}", val: lead.type },
                            { tag: "{{ADVOGADO}}", val: lead.responsibleLawyer },
                            { tag: "{{DATA}}", val: new Date().toLocaleDateString('pt-BR') },
                          ].map(t => (
                            <div key={t.tag} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                              <code
                                onClick={() => copyToClipboard(t.tag, "Tag")}
                                className="text-[11px] font-bold text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10 tracking-tight cursor-pointer hover:bg-primary/10 transition-all"
                                title="Clique para copiar a Tag"
                              >
                                {t.tag}
                              </code>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-medium text-white/70 truncate max-w-[180px]">{t.val || "---"}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(t.val || "", t.tag)}
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all text-white/20 hover:text-primary"
                                  title={`Copiar ${t.tag.replace(/[{}]/g, '')}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* DADOS DA ENTREVISTA TÉCNICA */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                            <Brain className="h-4 w-4" />
                          </div>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">Respostas da Entrevista</h4>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Histórico de Sessões</p>
                          {latestInterview && (
                            <Button
                              onClick={handleSyncInterviewData}
                              variant="outline"
                              className="h-8 px-4 text-[9px] font-black uppercase text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/5 gap-2"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Sincronizar com Perfil
                            </Button>
                          )}
                        </div>

                        {(interviews?.length ?? 0) > 1 && (
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {interviews?.map((int, idx) => (
                              <Button
                                key={int.id}
                                onClick={() => setSelectedInterviewIndex(idx)}
                                variant={selectedInterviewIndex === idx ? "default" : "outline"}
                                className={cn(
                                  "h-8 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                                  selectedInterviewIndex === idx ? "gold-gradient text-background" : "border-white/10 text-white/40 hover:text-white"
                                )}
                              >
                                {int.interviewType || "Entrevista"} ({idx + 1})
                              </Button>
                            ))}
                          </div>
                        )}

                        {latestInterview ? (
                          <ScrollArea className="h-[500px] border border-white/5 rounded-2xl bg-black/20 p-6">
                            <div className="space-y-6">
                              {Object.entries(latestInterview.responses || {}).map(([key, value]) => (
                                <div key={key} className="space-y-2 border-b border-white/5 pb-5">
                                  <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-loose">{key}</Label>
                                  <p className="text-sm font-medium text-white leading-relaxed tracking-wide">{String(value)}</p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01] p-10 text-center space-y-4">
                            <ShieldCheck className="h-10 w-10 text-white/5" />
                            <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em] max-w-[200px]">Nenhuma entrevista técnica realizada ainda.</p>
                            <Button onClick={() => setIsInterviewing(true)} variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/20 hover:bg-primary/5 h-10 px-6">Iniciar Agora</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="overview" className="m-0 focus:outline-none space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="glass border-white/5 p-6 bg-white/[0.01] hover:border-primary/20 transition-all rounded-2xl group cursor-pointer" onClick={() => { setIntakeStep(1); setIsSchedulingIntake(true); }}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Próxima Triagem
                          </span>
                          <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-black text-white uppercase tracking-tighter">
                            {lead.scheduledDate ? (lead.scheduledDate + " - " + lead.scheduledTime) : "AGUARDANDO AGENDAMENTO"}
                          </p>
                          <p className="text-[10px] font-bold text-white/40 uppercase">{lead.meetingLocation || "Local indefinido"}</p>
                        </div>
                      </Card>

                      <Card
                        className="glass border-white/5 p-6 bg-white/[0.01] hover:border-emerald-500/40 transition-all rounded-2xl group cursor-pointer"
                        onClick={() => { setActiveWorkflowStep(1); setIsEditingLead(true); }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Building className="h-4 w-4" /> Pólo Passivo
                          </span>
                          <ArrowRight className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                        <div className="space-y-4">
                          {lead.defendants?.length > 0 ? (
                            lead.defendants.map((def: Defendant, i: number) => (
                              <div key={i} className="space-y-1">
                                <p className="text-sm font-black text-white uppercase tracking-tighter leading-none">{def.name}</p>
                                <p className="text-[9px] font-bold text-white/40 uppercase">{def.document || "Sem Documento"}</p>
                                {def.street && (
                                  <p className="text-[8px] font-medium text-white/30 uppercase truncate">
                                    {def.street}{def.number ? `, ${def.number}` : ''} - {def.neighborhood} ({def.city}/{def.state})
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="space-y-1">
                              <p className="text-xl font-black text-white uppercase tracking-tighter leading-none">{lead.defendantName || "NÃO INFORMADO"}</p>
                              <p className="text-[10px] font-bold text-white/40 uppercase">{lead.defendantDocument || "Sem registro de CNPJ"}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className={labelMini}>Histórico Preliminar / Fatos</Label>
                        <button
                          onClick={() => { setActiveWorkflowStep(2); setIsEditingLead(true); }}
                          className="text-[9px] font-black text-primary uppercase hover:underline"
                        >
                          Editar Fatos
                        </button>
                      </div>
                      <div
                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 min-h-[150px] text-xs font-bold text-white/60 uppercase leading-relaxed tracking-wide italic cursor-pointer hover:border-white/20 transition-all"
                        onClick={() => { setActiveWorkflowStep(2); setIsEditingLead(true); }}
                      >
                        {lead.notes || "O ADVERSO NÃO INFORMOU FATOS NO MOMENTO DA TRIAGEM INICIAL."}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="burocracia" className="m-0 focus:outline-none space-y-12 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* COLETA DE PROVAS */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </div>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">Coleta de Provas</h4>
                        </div>
                        <div className="space-y-3 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                          {[
                            { id: 'rg', label: 'RG / CNH (FRENTE E VERSO)' },
                            { id: 'comprovante', label: 'COMPROVANTE DE ENDEREÇO' },
                            { id: 'ctps', label: 'CTPS / EXTRATO FGTS' },
                            { id: 'outros', label: 'PROVAS DO FATO (FOTOS/ÁUDIOS)' }
                          ].map(docReq => (
                            <div key={docReq.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all">
                              <span className="text-[10px] font-bold text-white/60 uppercase">{docReq.label}</span>
                              <Switch
                                checked={lead.evidenceChecklist?.[docReq.id] || false}
                                onCheckedChange={(v) => {
                                  updateDocumentNonBlocking(doc(db!, "leads", lead.id), {
                                    [`evidenceChecklist.${docReq.id}`]: v,
                                    updatedAt: serverTimestamp()
                                  })
                                }}
                                className="data-[state=checked]:bg-emerald-500"
                              />
                            </div>
                          ))}

                          {/* DOCUMENTOS CUSTOMIZADOS */}
                          {lead.customDocuments && Object.entries(lead.customDocuments).map(([id, docData]: [string, any]) => (
                            <div key={id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5 group hover:border-primary/30 transition-all">
                              <span className="text-[10px] font-bold text-white/60 uppercase">{docData.label}</span>
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={async () => {
                                    const { [id]: _, ...rest } = lead.customDocuments;
                                    await updateDocumentNonBlocking(doc(db!, "leads", lead.id), {
                                      customDocuments: rest,
                                      updatedAt: serverTimestamp()
                                    })
                                  }}
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 transition-all"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <Switch
                                  checked={docData.checked || false}
                                  onCheckedChange={(v) => {
                                    updateDocumentNonBlocking(doc(db!, "leads", lead.id), {
                                      [`customDocuments.${id}.checked`]: v,
                                      updatedAt: serverTimestamp()
                                    })
                                  }}
                                  className="data-[state=checked]:bg-emerald-500"
                                />
                              </div>
                            </div>
                          ))}

                          {/* INPUT PARA ADICIONAR NOVO */}
                          <div className="pt-4 flex items-center gap-2">
                            <Input
                              value={newDocName}
                              onChange={e => setNewDocName(e.target.value)}
                              placeholder="ADICIONAR OUTRO DOCUMENTO..."
                              className="bg-black/40 border-white/10 h-9 text-[9px] font-black uppercase tracking-widest placeholder:text-white/10"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (newDocName.trim()) {
                                    updateDocumentNonBlocking(doc(db!, "leads", lead.id), {
                                      [`customDocuments.doc_${Date.now()}`]: { label: newDocName.trim().toUpperCase(), checked: false },
                                      updatedAt: serverTimestamp()
                                    })
                                    setNewDocName("")
                                  }
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                if (newDocName.trim()) {
                                  updateDocumentNonBlocking(doc(db!, "leads", lead.id), {
                                    [`customDocuments.doc_${Date.now()}`]: { label: newDocName.trim().toUpperCase(), checked: false },
                                    updatedAt: serverTimestamp()
                                  })
                                  setNewDocName("")
                                }
                              }}
                              className="h-9 w-9 bg-white/5 border-white/10 hover:border-primary/50 text-white/40 hover:text-primary transition-all"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* GERAÇÃO DE DOCUMENTOS */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <FileText className="h-4 w-4 text-blue-400" />
                          </div>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">Geração de Peças</h4>
                        </div>
                        <div className="space-y-4">
                          <Select
                            onValueChange={(val) => {
                              const model = models?.find(m => m.id === val)
                              if (model) handleGenerateDraft(model)
                            }}
                          >
                            <SelectTrigger className="bg-black/40 border-white/5 h-14 text-white font-black text-[10px] uppercase">
                              <div className="flex items-center gap-3">
                                {isGeneratingDoc && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                <SelectValue placeholder="SELECIONAR MODELO (CONTRATO, PROCURAÇÃO...)" />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-[#0d121f] text-white">
                              {models?.map(m => (
                                <SelectItem key={m.id} value={m.id} className="uppercase text-[10px] font-black">{m.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[8px] text-muted-foreground uppercase font-black text-center opacity-40">Os dados do lead serão injetados automaticamente via tags.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] space-y-4">
                      <Label className={labelMini}>Status de Documentação</Label>
                      <div className="flex gap-4">
                        <Badge className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest", lead.cpf ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                          {lead.cpf ? "CPF OK" : "CPF PENDENTE"}
                        </Badge>
                        <Badge className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest", lead.address ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                          {lead.address ? "ENDEREÇO OK" : "ENDEREÇO PENDENTE"}
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>

          {/* COLUNA DIREITA: INFO & AÇÕES RÁPIDAS */}
          <div className="w-[360px] bg-[#0a0f1e]/40 border-l border-white/5 p-6 space-y-8 overflow-y-auto hidden lg:block">

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] pb-3 border-b border-white/10">Contato & Social</h3>

              <div className="space-y-4">
                <div className="group">
                  <Label className={labelMini}>WhatsApp Principal</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/40 h-11 px-4 flex items-center justify-between rounded-xl border border-white/5 group-hover:border-primary/20 transition-all">
                      <span className="text-xs font-black text-white font-mono tracking-tighter">{lead.phone || 'SEM TELEFONE'}</span>
                      <button onClick={() => lead.phone && copyToClipboard(lead.phone, "WhatsApp")} className="text-white/20 hover:text-primary transition-colors">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {lead.phone && (
                      <Button onClick={() => openWhatsApp(lead.phone)} variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div
                  className="group cursor-pointer"
                  onClick={() => { setActiveWorkflowStep(1); setIsEditingLead(true); }}
                >
                  <Label className={labelMini}>Endereço Eletrônico</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/40 h-11 px-4 flex items-center justify-between rounded-xl border border-white/5 group-hover:border-primary/20 transition-all">
                      <span className="text-xs font-black text-white lowercase tracking-tight truncate">{lead.email || 'sem_email@rgmj.adv'}</span>
                      <button onClick={(e) => { e.stopPropagation(); lead.email && copyToClipboard(lead.email, "E-mail"); }} className="text-white/20 hover:text-primary transition-colors">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition-all">
                      <Mail className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] pb-3 border-b border-white/10">Metadados</h3>
              <div className="grid grid-cols-1 gap-4">
                {/* JURISDIÇÃO */}
                <div
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 cursor-pointer hover:border-primary/20 transition-all"
                  onClick={() => { setActiveWorkflowStep(3); setIsEditingLead(true); }}
                >
                  <Label className={labelMini}>Foro / Jurisdição</Label>
                  <p className="text-[11px] font-black text-white uppercase">
                    {lead.jurisdictionCity ? `${lead.jurisdictionCity} / ${lead.jurisdictionState}` : "NÃO DEFINIDO"}
                  </p>
                </div>

                {/* RESPONSÁVEL */}
                <div
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 cursor-pointer hover:border-primary/20 transition-all"
                  onClick={() => { setActiveWorkflowStep(1); setIsEditingLead(true); }}
                >
                  <Label className={labelMini}>Responsável Técnico</Label>
                  <p className="text-[11px] font-black text-white uppercase">{lead.responsibleLawyer || "A REPARTIR"}</p>
                </div>

                {/* ORIGEM */}
                <div
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 cursor-pointer hover:border-primary/20 transition-all"
                  onClick={() => { setActiveWorkflowStep(1); setIsEditingLead(true); }}
                >
                  <Label className={labelMini}>Origem do Lead</Label>
                  <p className="text-[11px] font-black text-white uppercase">{lead.source || "TRAFEGO DIRETO"}</p>
                </div>

                {/* DATA CAPTAÇÃO */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <Label className={labelMini}>Data de Captação</Label>
                  <p className="text-[11px] font-black text-white tracking-widest">{lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString('pt-BR') : 'SINCRONIZANDO...'}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsInterviewing(true)}
              className="w-full h-14 gold-gradient text-background font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] transition-all gap-3"
            >
              <Brain className="h-5 w-5" /> Iniciar Entrevista Técnica
            </Button>

            <Button
              onClick={() => setIsSharingBank(true)}
              variant="outline"
              className="w-full h-14 border-white/5 bg-white/[0.02] text-white/60 hover:text-primary hover:border-primary/20 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all gap-3"
            >
              <CreditCard className="h-5 w-5" /> Cartão de Pagamento
            </Button>
          </div>
        </div>

      <LeadWorkflow 
        open={isEditingLead}
        onOpenChange={setIsEditingLead}
        initialData={{
          defendants: lead.defendants || [],
          demandTitle: lead.demandTitle || "",
          notes: lead.notes || "",
          jurisdictionCity: lead.jurisdictionCity || "",
          jurisdictionState: lead.jurisdictionState || "",
          jurisdictionCourt: lead.jurisdictionCourt || ""
        }}
        onSave={handleSaveWorkflow}
        initialStep={activeWorkflowStep}
      />

      {/* DIÁLOGO DE ENTREVISTA DINÂMICA */}
      <Dialog open={isInterviewing} onOpenChange={setIsInterviewing}>
        <DialogContent className="max-w-[95vw] w-[1200px] p-0 bg-transparent border-none">
          <DialogTitle className="sr-only">Entrevista Técnica</DialogTitle>
          {autoSelectedTemplate ? (
            <DynamicInterviewExecution
              template={autoSelectedTemplate}
              leadId={lead.id}
              onSubmit={handleFinishInterview}
              onCancel={() => setIsInterviewing(false)}
            />
          ) : (
            <div className="bg-[#0a0f1e] p-20 rounded-3xl border border-white/10 text-center space-y-6">
              <AlertCircle className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-xl font-black text-white uppercase">Nenhum Template Configurado</h2>
              <p className="text-white/40 text-xs">Aguarde a carga dos modelos de triagem ou configure-os no painel de controle.</p>
              <Button onClick={() => setIsInterviewing(false)} variant="outline" className="border-white/10 text-white uppercase font-black text-[10px] tracking-widest">Fechar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSharingBank} onOpenChange={setIsSharingBank}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[450px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans">
          <div className="p-10 bg-[#0a0f1e] border-b border-white/5 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto shadow-2xl">
              <Landmark className="h-8 w-8 text-background" />
            </div>
            <div>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Cartão de Pagamento</DialogTitle>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-1">Dados Bancários Oficiais da Banca</p>
            </div>
          </div>

          <div className="p-10 space-y-6">
            <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-6 shadow-inner">
              <div className="space-y-1">
                <Label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Banco</Label>
                <p className="text-sm font-black text-white uppercase">{financialSettings?.masterBank || "BANCO NÃO INFORMADO"}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Agência</Label>
                  <p className="text-sm font-black text-white font-mono">{financialSettings?.masterAgency || "----"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Conta</Label>
                  <p className="text-sm font-black text-white font-mono">{financialSettings?.masterAccount || "-------"}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Favorecido</Label>
                <p className="text-xs font-black text-white uppercase">{financialSettings?.masterHolderName || "NOME DO FAVORECIDO"}</p>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-1">
                <Label className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <Zap className="h-3 w-3 fill-primary" /> Chave PIX
                </Label>
                <div className="flex items-center justify-between group cursor-pointer" onClick={() => financialSettings?.masterPix && copyToClipboard(financialSettings.masterPix, "Chave PIX")}>
                  <p className="text-sm font-black text-white truncate mr-4">{financialSettings?.masterPix || "SEM CHAVE PIX"}</p>
                  <Copy className="h-3.5 w-3.5 text-white/20 group-hover:text-primary transition-all" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button onClick={() => setIsSharingBank(false)} variant="outline" className="h-12 border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-xl">Fechar</Button>
              <Button
                onClick={() => {
                  const text = `🏦 *DADOS BANCÁRIOS - RGMJ ADVOGADOS*\n\n*Favorecido:* ${financialSettings?.masterHolderName || 'Não informado'}\n*Banco:* ${financialSettings?.masterBank || 'Não informado'}\n*Agência:* ${financialSettings?.masterAgency || '---'}\n*Conta:* ${financialSettings?.masterAccount || '---'}\n\n⚡ *Chave PIX:* ${financialSettings?.masterPix || 'Não informada'}\n\n_Favor enviar o comprovante após o pagamento._`
                  if (lead.phone) {
                    const url = `https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
                    window.open(url, '_blank')
                  } else {
                    copyToClipboard(text, "Cartão Digital")
                  }
                }}
                className="h-12 gold-gradient text-background font-black uppercase text-[10px] tracking-widest rounded-xl shadow-xl gap-2"
              >
                <MessageSquare className="h-4 w-4" /> Enviar p/ WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSchedulingIntake} onOpenChange={setIsSchedulingIntake}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[650px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col h-[80vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none">
            <div className="flex items-center gap-6">
              <div className={cn("w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 shadow-xl", isSyncingIntake && "animate-pulse")}>
                {isSyncingIntake ? <Loader2 className="h-6 w-6 animate-spin" /> : <Clock className="h-6 w-6" />}
              </div>
              <div className="text-left">
                <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Agendar Atendimento</DialogTitle>
                <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase mt-1">Passo {intakeStep} de 5</Badge>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-black/20">
            <div className="p-10">
              {intakeStep === 1 && (
                <div className="space-y-8 animate-in zoom-in-95 duration-300">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block text-center mb-8">Qual a Modalidade?</Label>
                  <div className="grid grid-cols-2 gap-6">
                    <div className={cn("p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4", intakeData.type === 'online' ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5 hover:border-white/10")} onClick={() => setIntakeData({ ...intakeData, type: 'online' })}>
                      <Video className={cn("h-8 w-8", intakeData.type === 'online' ? "text-primary" : "text-white/20")} />
                      <span className="text-xs font-black text-white uppercase tracking-widest">Virtual</span>
                    </div>
                    <div className={cn("p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4", intakeData.type === 'presencial' ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5 hover:border-white/10")} onClick={() => setIntakeData({ ...intakeData, type: 'presencial' })}>
                      <MapPin className={cn("h-8 w-8", intakeData.type === 'presencial' ? "text-primary" : "text-white/20")} />
                      <span className="text-xs font-black text-white uppercase tracking-widest">Presencial</span>
                    </div>
                  </div>
                </div>
              )}

              {intakeStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block text-center">Cronograma de Triagem</Label>
                  <div className="grid grid-cols-2 gap-6 p-8 bg-black/40 border border-white/5 rounded-2xl">
                    <div className="space-y-2"><Label className={labelMini}>Data</Label><Input type="date" className="bg-white/5 h-12 text-white font-bold rounded-xl border-white/10" value={intakeData.date} onChange={e => setIntakeData({ ...intakeData, date: e.target.value })} /></div>
                    <div className="space-y-2"><Label className={labelMini}>Hora</Label><Input type="time" className="bg-white/5 h-12 text-white font-bold rounded-xl border-white/10" value={intakeData.time} onChange={e => setIntakeData({ ...intakeData, time: e.target.value })} /></div>
                  </div>
                </div>
              )}

              {intakeStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block text-center">Identificação & Pauta</Label>

                  {/* CONTEXTO DO LEAD */}
                  <Card className="bg-white/[0.02] border-white/5 p-4 rounded-xl">
                    <Label className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2 block">Contexto Original do Lead</Label>
                    <p className="text-[10px] font-bold text-white/60 italic leading-relaxed">
                      "{lead?.notes || "Nenhum detalhe prévio informado."}"
                    </p>
                  </Card>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className={labelMini}>Assunto Geral</Label>
                        <Input value={"TRIAGEM: " + (lead?.name?.toUpperCase() || "")} className="bg-black/40 h-11 text-[10px] text-white font-black border-white/10" readOnly disabled />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelMini}>Nível de Prioridade</Label>
                        <Select value={intakeData.priority} onValueChange={v => setIntakeData({ ...intakeData, priority: v })}>
                          <SelectTrigger className="bg-black/40 h-11 border-white/10 text-[10px] font-black uppercase text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d121f] text-white">
                            <SelectItem value="baixa">🟢 BAIXA PRIORIDADE</SelectItem>
                            <SelectItem value="media">🟡 MÉDIA PRIORIDADE</SelectItem>
                            <SelectItem value="alta">🔴 ALTA PRIORIDADE (URGENTE)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <Label className={labelMini}>Pauta Detalhada / Observações</Label>
                      <Textarea
                        value={intakeData.observations}
                        onChange={e => setIntakeData({ ...intakeData, observations: e.target.value })}
                        className="bg-black/40 min-h-[120px] text-[11px] font-bold text-white p-4 rounded-xl border-white/10 focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-white/10"
                        placeholder="DESCREVA O QUE DEVE SER ABORDADO NA ENTREVISTA..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {intakeStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block text-center">Logística de Atendimento</Label>
                  {intakeData.type === 'online' ? (
                    <Card className="p-10 rounded-[2.5rem] bg-primary/5 border-2 border-primary/20 text-center space-y-6">
                      <Video className="h-10 w-10 text-primary mx-auto" /><h4 className="text-xl font-black text-white uppercase tracking-widest leading-none">Google Meet Sync</h4>
                      <div className="flex items-center justify-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                        <Switch checked={intakeData.autoMeet} onCheckedChange={v => setIntakeData({ ...intakeData, autoMeet: v })} className="data-[state=checked]:bg-primary" />
                        <Label className="text-[9px] font-black text-white uppercase">Sincronizar com Workspace?</Label>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className={cn("p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3", intakeData.locationType === 'sede' ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5")} onClick={() => setIntakeData({ ...intakeData, locationType: 'sede' })}>
                          <Building className="h-4 w-4 text-primary" /><span className="text-[9px] font-black text-white uppercase">Sede RGMJ</span>
                        </div>
                        <div className={cn("p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3", intakeData.locationType === 'custom' ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5")} onClick={() => setIntakeData({ ...intakeData, locationType: 'custom' })}>
                          <MapPin className="h-4 w-4 text-primary" /><span className="text-[9px] font-black text-white uppercase">Externo</span>
                        </div>
                      </div>
                      {intakeData.locationType === 'custom' && (
                        <div className="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><Label className={labelMini}>CEP</Label><Input value={intakeData.zipCode} onChange={e => setIntakeData({ ...intakeData, zipCode: maskCEP(e.target.value) })} onBlur={handleIntakeCepBlur} className="bg-black/40 h-10 border-white/10 text-xs font-bold text-white" /></div>
                            <div className="space-y-1.5"><Label className={labelMini}>UF/Cidade</Label><Input value={intakeData.city} className="bg-black/40 h-10 border-white/10 text-xs font-bold text-white px-3" readOnly disabled /></div>
                          </div>
                          <div className="space-y-1.5"><Label className={labelMini}>Endereço Completo</Label><Input value={intakeData.address} onChange={e => setIntakeData({ ...intakeData, address: e.target.value })} className="bg-black/40 h-10 border-white/10 text-xs font-bold text-white" /></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {intakeStep === 5 && (
                <div className="space-y-8 animate-in zoom-in-95 duration-300 text-center">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block text-center">Protocolar Compromisso</Label>
                  <Card className="glass border-primary/30 bg-primary/5 p-8 rounded-3xl space-y-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/30 shadow-[0_0_20px_rgba(245,208,48,0.1)]">
                      <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">{lead?.name}</h4>
                      <div className="flex items-center justify-center gap-4 text-xs font-bold text-primary uppercase">
                        <span>{intakeData.date}</span>
                        <div className="w-1 h-1 rounded-full bg-primary/30" />
                        <span>{intakeData.time}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none">
            <Button variant="ghost" onClick={() => intakeStep > 1 ? setIntakeStep(intakeStep - 1) : setIsSchedulingIntake(false)} className="text-white/40 uppercase font-black text-[9px] tracking-widest px-6 h-10">
              {intakeStep > 1 ? "Anterior" : "Cancelar"}
            </Button>
            {intakeStep < 5 ? (
              <Button onClick={() => setIntakeStep(intakeStep + 1)} className="gold-gradient text-background font-black uppercase text-[9px] tracking-widest px-10 h-12 rounded-xl transition-all gap-2">
                Próximo Passo <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleScheduleIntake} disabled={isSyncingIntake} className="gold-gradient text-background font-black uppercase text-[10px] px-12 h-14 rounded-xl shadow-xl transition-all gap-3">
                {isSyncingIntake ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Confirmar & Salvar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass border-white/10 bg-[#0a0f1e] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white uppercase font-black tracking-tight">Exclusão Permanente</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 uppercase text-[9px] font-bold tracking-widest leading-relaxed">
              ATENÇÃO: Este processo é irreversível. O lead <span className="text-white font-black">{lead?.name}</span> será removido de todos os sistemas de triagem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="bg-white/5 border-white/5 text-white/60 uppercase font-black text-[9px] tracking-widest h-10 rounded-xl">Abortar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white uppercase font-black text-[9px] tracking-widest h-10 rounded-xl transition-all"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
  )
}
