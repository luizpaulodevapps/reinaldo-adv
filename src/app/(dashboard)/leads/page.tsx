
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  Zap, 
  UserPlus, 
  FileText, 
  PlusCircle, 
  Brain,
  Scale,
  Hash,
  Loader2,
  Building2,
  ShieldCheck,
  Gavel,
  Calendar as CalendarIcon,
  ExternalLink,
  ArrowRight,
  ClipboardCheck,
  Send,
  MessageSquare,
  Sparkles,
  X
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LeadForm } from "@/components/leads/lead-form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collection, query, serverTimestamp, doc, where, limit } from "firebase/firestore"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { cn } from "@/lib/utils"
import { DynamicInterviewExecution } from "@/components/interviews/dynamic-interview-execution"
import { aiSummarizeInterviewCaseDetails } from "@/ai/flows/ai-summarize-interview-case-details"

const columns = [
  { id: "novo", title: "NOVO", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-emerald-400" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

const DOCUMENT_KITS: Record<string, string[]> = {
  "Trabalhista": ["Contrato de Honorários", "Procuração Ad Judicia", "Declaração de Hipossuficiência", "Cálculos Prévios"],
  "Civil": ["Contrato de Honorários", "Procuração Ad Judicia", "Kit de Documentos Pessoais"],
  "Previdenciário": ["Contrato de Honorários", "Procuração", "CNIS Atualizado", "Laudo Médico"],
  "Empresarial": ["Contrato de Prestação de Serviços", "Estatuto Social", "Certidões Negativas"],
}

const LEAD_TABS = ["atendimento", "burocracia", "distribuicao"]
const LEAD_STATUS_ORDER = ["novo", "atendimento", "burocracia", "distribuicao"] as const

export default function LeadsPage() {
  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const leadsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "leads"), limit(100))
  }, [db, user])

  const { data: leadsData, isLoading } = useCollection(leadsQuery)
  const leads = leadsData || []
  const migratedLeadIdsRef = useRef<Set<string>>(new Set())

  // Busca Matrizes de Entrevista do Laboratório
  const checklistsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "checklists"), where("category", "==", "Entrevista de Triagem"))
  }, [db, user])
  const { data: interviewTemplates } = useCollection(checklistsQuery)

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [isInterviewOpen, setIsInterviewOpen] = useState(false)
  
  // Estados de formulário para os estágios
  const [atendimentoData, setAtendimentoData] = useState({ defendant: "", viability: "Alta", details: "" })
  const [contractualChecklist, setContractualChecklist] = useState<Record<string, boolean>>({})
  const [distributionData, setDistributionData] = useState({
    processTitle: "",
    processNumber: "",
    forum: "",
    vara: "",
    link: "",
    hearingDate: "",
    caseDetails: "",
    selectedInterviewKeys: [] as string[],
  })
  const [clientRegistrationData, setClientRegistrationData] = useState({
    fullName: "",
    cpf: "",
    rg: "",
    rgIssueDate: "",
    motherName: "",
    ctps: "",
    zipCode: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
  })
  const [claimantData, setClaimantData] = useState({
    fullName: "",
    documentType: "CPF",
    documentNumber: "",
    zipCode: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
  })
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
    placeType: "office",
    lawyerName: "Dr. Reinaldo Gonçalves",
    meetingLink: "",
    zipCode: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    placeQuery: "",
    placeName: "",
    locationHint: "",
  })
  const [isResolvingCep, setIsResolvingCep] = useState(false)
  const [isResolvingPlace, setIsResolvingPlace] = useState(false)
  const [isResolvingClientCep, setIsResolvingClientCep] = useState(false)
  const [isResolvingClaimantCep, setIsResolvingClaimantCep] = useState(false)
  const [showRegistrationErrors, setShowRegistrationErrors] = useState(false)
  const [isGeneratingCaseDetails, setIsGeneratingCaseDetails] = useState(false)

  const getLoggedLawyerName = () => profile?.name || user?.displayName || "Dr. Reinaldo Gonçalves"

  const getNowStamp = () => new Date().toLocaleString("pt-BR")

  const normalizeLeadStatus = (status?: string) => {
    if (status === "contratual") return "burocracia"
    return status || "novo"
  }

  const splitDateTime = (dateTime?: string) => {
    if (!dateTime || !dateTime.includes("T")) {
      return { date: "", time: "" }
    }

    const [date, fullTime] = dateTime.split("T")
    const time = fullTime?.slice(0, 5) || ""
    return { date, time }
  }

  const getStatusRank = (status?: string) => {
    const normalizedStatus = normalizeLeadStatus(status)
    const index = LEAD_STATUS_ORDER.findIndex((item) => item === normalizedStatus)
    return index >= 0 ? index : 0
  }

  const pickMostAdvancedStatus = (...statuses: Array<string | undefined>) => {
    return statuses.reduce((mostAdvanced, current) => {
      return getStatusRank(current) > getStatusRank(mostAdvanced) ? (current || mostAdvanced) : mostAdvanced
    }, "novo")
  }

  const isContractualStageComplete = (leadType: string, checklist: Record<string, boolean>) => {
    const requiredDocuments = DOCUMENT_KITS[leadType] || DOCUMENT_KITS["Civil"] || []
    if (requiredDocuments.length === 0) return false
    return requiredDocuments.every((docName) => checklist?.[docName] === true)
  }

  const buildProcessProtocol = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 900000) + 100000
    return `PROC-${year}-${random}`
  }

  const getDistributionBlockers = () => {
    const blockers: string[] = []
    if (!isRegistrationComplete()) blockers.push("Cadastro completo de cliente e reclamante")
    if (!selectedLead?.interviewResponses) blockers.push("Entrevista técnica concluída")
    if (!isContractualStageComplete(selectedLead?.type || "Civil", contractualChecklist)) blockers.push("Checklist de burocracia (contratos/procuração)")
    if (!distributionData.processTitle.trim()) blockers.push("Nome da ação/processo")
    if (!distributionData.processNumber.trim()) blockers.push("Número CNJ")
    if (!distributionData.link.trim()) blockers.push("Link do CNJ")
    return blockers
  }

  const computePipelineStatus = (params: {
    currentStatus?: string
    leadType: string
    hasSchedule: boolean
    hasInterview: boolean
    checklist: Record<string, boolean>
    hasProcessNumber: boolean
    hasRegistrationComplete: boolean
  }) => {
    const bySchedule = params.hasSchedule ? "atendimento" : "novo"
    const byInterview = params.hasInterview && params.hasRegistrationComplete ? "burocracia" : "novo"
    const byChecklist = params.hasRegistrationComplete && isContractualStageComplete(params.leadType, params.checklist) ? "burocracia" : "novo"
    const byProcess = params.hasProcessNumber && params.hasRegistrationComplete ? "distribuicao" : "novo"

    return pickMostAdvancedStatus(params.currentStatus, bySchedule, byInterview, byChecklist, byProcess)
  }

  useEffect(() => {
    if (!db) return
    leads.forEach((lead) => {
      if (lead.status !== "contratual") return
      if (migratedLeadIdsRef.current.has(lead.id)) return

      migratedLeadIdsRef.current.add(lead.id)
      updateDocumentNonBlocking(doc(db, "leads", lead.id), {
        status: "burocracia",
        updatedAt: serverTimestamp(),
      })
    })
  }, [leads, db])

  const handleOpenLead = (lead: any) => {
    const appointmentParts = splitDateTime(lead.nextAppointmentAt)

    setSelectedLead(lead)
    setAtendimentoData({ 
      defendant: lead.defendant || "", 
      viability: lead.viability || "Alta", 
      details: lead.details || "" 
    })
    setContractualChecklist(lead.contractualChecklist || {})
    const interviewKeys = lead?.interviewResponses ? Object.keys(lead.interviewResponses) : []
    const reusableKeysFromSnapshot = (lead?.interviewTemplateSnapshot || [])
      .filter((item: any) => item?.reuseEnabled && lead?.interviewResponses?.[item.label] !== undefined)
      .map((item: any) => item.label)
    const savedDistribution = lead.distributionData || {}
    setDistributionData({
      processTitle: savedDistribution.processTitle || "",
      processNumber: savedDistribution.processNumber || "",
      forum: savedDistribution.forum || "",
      vara: savedDistribution.vara || "",
      link: savedDistribution.link || "",
      hearingDate: savedDistribution.hearingDate || "",
      caseDetails: savedDistribution.caseDetails || "",
      selectedInterviewKeys: savedDistribution.selectedInterviewKeys || (reusableKeysFromSnapshot.length > 0 ? reusableKeysFromSnapshot : interviewKeys),
    })
    setClientRegistrationData(lead.clientRegistrationData || {
      fullName: lead.name || "",
      cpf: "",
      rg: "",
      rgIssueDate: "",
      motherName: "",
      ctps: "",
      zipCode: "",
      address: "",
      neighborhood: "",
      city: "",
      state: "",
    })
    setClaimantData(lead.claimantData || {
      fullName: "",
      documentType: "CPF",
      documentNumber: "",
      zipCode: "",
      address: "",
      neighborhood: "",
      city: "",
      state: "",
    })
    setScheduleData({
      date: appointmentParts.date,
      time: appointmentParts.time,
      placeType: "office",
      lawyerName: lead.responsibleLawyer || getLoggedLawyerName(),
      meetingLink: "",
      zipCode: "",
      address: "",
      neighborhood: "",
      city: "",
      state: "",
      placeQuery: "",
      placeName: "",
      locationHint: "",
    })
    setIsSheetOpen(true)
  }

  const handleCreateEntry = async (data: any) => {
    if (!user || !db) {
      toast({
        variant: "destructive",
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao banco de dados."
      })
      return
    }
    const newLead = {
      ...data,
      assignedStaffId: user.uid,
      status: "novo",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const createdRef = await addDocumentNonBlocking(collection(db, "leads"), newLead)

    if (!createdRef?.id) {
      toast({
        variant: "destructive",
        title: "Falha ao Cadastrar Lead"
      })
      return
    }

    setIsNewEntryOpen(false)
    toast({
      title: "Triagem Iniciada!",
      description: `${data.name} salvo no Firestore.`
    })
  }

  const handleQuickCreateClient = async (clientData: {
    name: string
    phone: string
    documentNumber?: string
    legalArea?: string
  }) => {
    if (!user || !db) return null

    const newClient = {
      id: crypto.randomUUID(),
      name: clientData.name,
      documentNumber: clientData.documentNumber || "",
      phone: clientData.phone,
      email: "",
      type: "individual",
      status: "ativo",
      legalArea: clientData.legalArea || "Trabalhista",
      responsibleStaffIds: [user.uid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const createdRef = await addDocumentNonBlocking(collection(db, "clients"), newClient)
    return createdRef?.id || null
  }

  const handleUpdateLead = () => {
    if (!selectedLead || !db) return
    const leadRef = doc(db, "leads", selectedLead.id)
    const scheduleDateTime = scheduleData.date && scheduleData.time
      ? `${scheduleData.date}T${scheduleData.time}`
      : selectedLead.nextAppointmentAt || ""

    const nextStatus = computePipelineStatus({
      currentStatus: selectedLead.status,
      leadType: selectedLead.type,
      hasSchedule: Boolean(scheduleDateTime),
      hasInterview: Boolean(selectedLead.interviewResponses),
      checklist: contractualChecklist,
      hasProcessNumber: Boolean(distributionData.processNumber),
      hasRegistrationComplete: isRegistrationComplete(),
    })

    if (Boolean(selectedLead.interviewResponses) && nextStatus === "atendimento" && !isRegistrationComplete()) {
      notifyRegistrationPending()
    }

    updateDocumentNonBlocking(leadRef, {
      status: nextStatus,
      ...atendimentoData,
      contractualChecklist,
      distributionData,
      clientRegistrationData,
      claimantData,
      nextAppointmentAt: scheduleDateTime,
      nextAppointmentLawyer: scheduleData.lawyerName,
      updatedAt: serverTimestamp()
    })

    setSelectedLead((prev: any) => prev ? {
      ...prev,
      status: nextStatus,
      ...atendimentoData,
      contractualChecklist,
      distributionData,
      clientRegistrationData,
      claimantData,
      nextAppointmentAt: scheduleDateTime,
      nextAppointmentLawyer: scheduleData.lawyerName,
    } : prev)

    toast({ title: "Dados Atualizados" })
  }

  const handleDeleteLead = (leadId: string) => {
    if (!db) return
    const confirmed = window.confirm("Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.")
    if (!confirmed) return

    deleteDocumentNonBlocking(doc(db, "leads", leadId))
    setIsSheetOpen(false)
    toast({ title: "Lead Excluído" })
  }

  const handleAdvanceStage = () => {
    if (!selectedLead || !db) return
    const currentIndex = columns.findIndex(col => col.id === selectedLead.status)
    if (currentIndex < columns.length - 1) {
      const nextStatus = columns[currentIndex + 1].id
      const leadRef = doc(db, "leads", selectedLead.id)
      
      updateDocumentNonBlocking(leadRef, { 
        status: nextStatus, 
        ...atendimentoData,
        contractualChecklist,
        distributionData,
        updatedAt: serverTimestamp() 
      })
      
      setIsSheetOpen(false)
      toast({ title: "Fase Avançada", description: `O lead foi movido para ${nextStatus.toUpperCase()}.` })
    }
  }

  const handleDistribute = async () => {
    if (!selectedLead || !db) return

    const blockers = getDistributionBlockers()
    if (blockers.length > 0) {
      toast({
        variant: "destructive",
        title: "Distribuição bloqueada",
        description: blockers.slice(0, 3).join(" • "),
      })
      return
    }

    const internalProcessProtocol = buildProcessProtocol()

    const newProcess = {
      protocolId: internalProcessProtocol,
      sourceLeadId: selectedLead.id,
      clientId: selectedLead.id,
      clientName: selectedLead.name,
      processNumber: distributionData.processNumber,
      processLink: distributionData.link,
      processTitle: distributionData.processTitle,
      caseDetails: distributionData.caseDetails,
      selectedInterviewKeys: distributionData.selectedInterviewKeys,
      caseType: selectedLead.type,
      status: "Em Andamento",
      court: distributionData.forum,
      vara: distributionData.vara,
      description: distributionData.caseDetails || distributionData.processTitle || selectedLead.demandTitle || "Ação Judicial",
      claimantData,
      clientRegistrationData,
      leadInterviewResponses: selectedLead.interviewResponses || null,
      selectedInterviewResponses: selectedLead.interviewResponses
        ? Object.fromEntries(
            Object.entries(selectedLead.interviewResponses).filter(([question]) =>
              (distributionData.selectedInterviewKeys || []).includes(question)
            )
          )
        : null,
      startDate: new Date().toISOString().split('T')[0],
      responsibleStaffId: user?.uid || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const processRef = await addDocumentNonBlocking(collection(db, "processes"), newProcess)
    if (!processRef?.id) {
      toast({ variant: "destructive", title: "Falha ao protocolar distribuição" })
      return
    }

    if (distributionData.hearingDate) {
      const newHearing = {
        title: `Audiência: ${distributionData.processTitle || selectedLead.name}`,
        startDateTime: distributionData.hearingDate,
        processId: distributionData.processNumber,
        location: distributionData.forum,
        type: "Inicial",
        protocolId: internalProcessProtocol,
        processRefId: processRef.id,
        createdAt: serverTimestamp(),
      }
      await addDocumentNonBlocking(collection(db, "hearings"), newHearing)
    }

    deleteDocumentNonBlocking(doc(db, "leads", selectedLead.id))

    setIsSheetOpen(false)
    toast({ title: "PROCESSO PROTOCOLADO!", description: `Protocolo ${internalProcessProtocol}` })
  }

  const handleInterviewSubmit = (payload: { responses: any; templateSnapshot: any[] }) => {
    if (!db) return
    const responses = payload.responses || {}
    const templateSnapshot = payload.templateSnapshot || []
    const { nextClient, nextClaimant, appliedCount } = applyInterviewTargetsToRegistration({
      responses,
      templateSnapshot,
    })
    const { nextDistribution, appliedCount: distributionAppliedCount } = applyInterviewTargetsToDistribution({
      responses,
      templateSnapshot,
      baseDistribution: distributionData,
    })
    const leadRef = doc(db, "leads", selectedLead.id)
    const nextStatus = computePipelineStatus({
      currentStatus: selectedLead.status,
      leadType: selectedLead.type,
      hasSchedule: Boolean(selectedLead.nextAppointmentAt),
      hasInterview: true,
      checklist: contractualChecklist,
      hasProcessNumber: Boolean(nextDistribution.processNumber),
      hasRegistrationComplete: isRegistrationComplete(),
    })

    if (nextStatus === "atendimento" && !isRegistrationComplete()) {
      notifyRegistrationPending()
    }

    updateDocumentNonBlocking(leadRef, {
      interviewResponses: responses,
      interviewTemplateSnapshot: templateSnapshot,
      clientRegistrationData: nextClient,
      claimantData: nextClaimant,
      distributionData: nextDistribution,
      status: nextStatus,
      updatedAt: serverTimestamp()
    })

    setClientRegistrationData(nextClient)
    setClaimantData(nextClaimant)
    setDistributionData(nextDistribution)

    setSelectedLead((prev: any) => prev ? {
      ...prev,
      interviewResponses: responses,
      interviewTemplateSnapshot: templateSnapshot,
      clientRegistrationData: nextClient,
      claimantData: nextClaimant,
      distributionData: nextDistribution,
      status: nextStatus,
    } : prev)

    setDistributionData((prev) => {
      if (prev.selectedInterviewKeys.length > 0) return prev
      const reusableKeys = templateSnapshot
        .filter((item: any) => item?.reuseEnabled && responses?.[item.label] !== undefined)
        .map((item: any) => item.label)
      return {
        ...prev,
        selectedInterviewKeys: reusableKeys.length > 0 ? reusableKeys : Object.keys(responses || {}),
      }
    })

    setIsInterviewOpen(false)
    toast({ title: "Entrevista Concluída", description: `${appliedCount + distributionAppliedCount} campo(s) reaproveitado(s).` })
  }

  const activeTemplate = useMemo(() => {
    if (!selectedLead || !interviewTemplates) return null
    return interviewTemplates.find(t => t.legalArea === selectedLead.type) || interviewTemplates[0]
  }, [selectedLead, interviewTemplates])

  const interviewTemplateSnapshot = useMemo(() => {
    return selectedLead?.interviewTemplateSnapshot || activeTemplate?.items || []
  }, [selectedLead, activeTemplate])

  const interviewMetaByLabel = useMemo(() => {
    const map: Record<string, any> = {}
    ;(interviewTemplateSnapshot || []).forEach((item: any) => {
      if (!item?.label) return
      map[item.label] = item
    })
    return map
  }, [interviewTemplateSnapshot])

  const interviewEntries = useMemo(() => {
    if (!selectedLead?.interviewResponses) return []
    return Object.entries(selectedLead.interviewResponses) as Array<[string, any]>
  }, [selectedLead])

  const buildInterviewSummary = (selectedKeys?: string[]) => {
    const keysToUse = selectedKeys && selectedKeys.length > 0
      ? selectedKeys
      : interviewEntries.map(([question]) => question)

    return interviewEntries
      .filter(([question]) => keysToUse.includes(question))
      .map(([question, answer]) => `${question}: ${String(answer)}`)
      .join("\n")
  }

  const hasReusableConfigured = useMemo(() => {
    return interviewEntries.some(([question]) => Boolean(interviewMetaByLabel[question]?.reuseEnabled))
  }, [interviewEntries, interviewMetaByLabel])

  const mapClientFieldFromQuestion = (question: string) => {
    const q = question.toLowerCase()
    if ((q.includes("cliente") || q.includes("nome")) && q.includes("mãe")) return "motherName"
    if ((q.includes("cliente") || q.includes("nome")) && q.includes("completo")) return "fullName"
    if (q.includes("cpf")) return "cpf"
    if (q.includes("rg") && q.includes("data")) return "rgIssueDate"
    if (q.includes("rg")) return "rg"
    if (q.includes("ctps") || q.includes("carteira de trabalho")) return "ctps"
    if (q.includes("cep")) return "zipCode"
    if (q.includes("endereço") || q.includes("logradouro")) return "address"
    if (q.includes("bairro")) return "neighborhood"
    if (q.includes("cidade")) return "city"
    if (q.includes("uf") || q.includes("estado")) return "state"
    return null
  }

  const mapClaimantFieldFromQuestion = (question: string) => {
    const q = question.toLowerCase()
    if ((q.includes("reclamante") || q.includes("réu") || q.includes("reclamada") || q.includes("empresa")) && q.includes("nome")) return "fullName"
    if (q.includes("cpf") || q.includes("cnpj")) return "documentNumber"
    if (q.includes("cep")) return "zipCode"
    if (q.includes("endereço") || q.includes("logradouro")) return "address"
    if (q.includes("bairro")) return "neighborhood"
    if (q.includes("cidade")) return "city"
    if (q.includes("uf") || q.includes("estado")) return "state"
    return null
  }

  const normalizeRegistrationValue = (fieldName: string, rawValue: any) => {
    const value = String(rawValue || "").trim()
    if (!value) return ""

    if (fieldName === "cpf" || fieldName === "documentNumber") return formatCpfCnpj(value)
    if (fieldName === "zipCode") return formatCep(value)
    if (fieldName === "state") return value.toUpperCase().slice(0, 2)
    if (fieldName === "rgIssueDate") {
      const dateMatch = value.match(/\d{4}-\d{2}-\d{2}/)
      return dateMatch ? dateMatch[0] : value
    }

    return value.toUpperCase()
  }

  const applyInterviewTargetsToRegistration = (params: { responses: Record<string, any>; templateSnapshot: any[] }) => {
    const responses = params.responses || {}
    const templateSnapshot = params.templateSnapshot || []

    let nextClient = { ...clientRegistrationData }
    let nextClaimant = { ...claimantData }
    let appliedCount = 0
    const allowedClientFields = new Set(["fullName", "cpf", "rg", "rgIssueDate", "motherName", "ctps", "zipCode", "address", "neighborhood", "city", "state"])
    const allowedClaimantFields = new Set(["fullName", "documentNumber", "documentType", "zipCode", "address", "neighborhood", "city", "state"])

    templateSnapshot.forEach((item: any) => {
      if (!item?.reuseEnabled) return
      if (item.reuseTarget !== "client" && item.reuseTarget !== "claimant") return

      const question = item.label
      const answer = responses?.[question]
      if (answer === undefined || answer === null || String(answer).trim() === "") return

      if (item.reuseTarget === "client") {
        const explicitField = item.targetField && allowedClientFields.has(item.targetField) ? item.targetField : null
        const field = explicitField || mapClientFieldFromQuestion(question)
        if (!field) return
        if (String((nextClient as any)[field] || "").trim()) return

        ;(nextClient as any)[field] = normalizeRegistrationValue(field, answer)
        appliedCount += 1
      }

      if (item.reuseTarget === "claimant") {
        const explicitField = item.targetField && allowedClaimantFields.has(item.targetField) ? item.targetField : null
        const field = explicitField || mapClaimantFieldFromQuestion(question)
        if (!field) return
        if (String((nextClaimant as any)[field] || "").trim()) return

        if (field === "documentType") {
          const normalizedType = String(answer || "").toUpperCase()
          if (normalizedType.includes("CNPJ")) {
            nextClaimant.documentType = "CNPJ"
          } else {
            nextClaimant.documentType = "CPF"
          }
          appliedCount += 1
          return
        }

        ;(nextClaimant as any)[field] = normalizeRegistrationValue(field, answer)
        if (field === "documentNumber") {
          const digits = String(answer || "").replace(/\D/g, "")
          nextClaimant.documentType = digits.length > 11 ? "CNPJ" : "CPF"
        }
        appliedCount += 1
      }
    })

    return { nextClient, nextClaimant, appliedCount }
  }

  const normalizeDistributionValue = (fieldName: string, rawValue: any) => {
    const value = String(rawValue || "").trim()
    if (!value) return ""

    if (fieldName === "processTitle" || fieldName === "forum" || fieldName === "vara") return value.toUpperCase()
    return value
  }

  const applyInterviewTargetsToDistribution = (params: {
    responses: Record<string, any>
    templateSnapshot: any[]
    baseDistribution: typeof distributionData
  }) => {
    const responses = params.responses || {}
    const templateSnapshot = params.templateSnapshot || []
    let nextDistribution = { ...params.baseDistribution }
    let appliedCount = 0
    const allowedDistributionFields = new Set(["processTitle", "processNumber", "link", "forum", "vara", "hearingDate", "caseDetails"])

    templateSnapshot.forEach((item: any) => {
      if (!item?.reuseEnabled) return
      if (item.reuseTarget !== "distribution" && item.reuseTarget !== "caseDetails") return

      const question = item.label
      const answer = responses?.[question]
      if (answer === undefined || answer === null || String(answer).trim() === "") return

      const explicitField = item.targetField && allowedDistributionFields.has(item.targetField)
        ? item.targetField
        : (item.reuseTarget === "caseDetails" ? "caseDetails" : null)
      if (!explicitField) return

      const normalizedValue = normalizeDistributionValue(explicitField, answer)
      if (!normalizedValue) return

      if (explicitField === "caseDetails") {
        const fragment = `${question}: ${String(answer)}`
        if (!nextDistribution.caseDetails.trim()) {
          nextDistribution.caseDetails = fragment
          appliedCount += 1
          return
        }

        if (!nextDistribution.caseDetails.includes(fragment)) {
          nextDistribution.caseDetails = `${nextDistribution.caseDetails}\n${fragment}`
          appliedCount += 1
        }
        return
      }

      if (String((nextDistribution as any)[explicitField] || "").trim()) return

      ;(nextDistribution as any)[explicitField] = normalizedValue
      appliedCount += 1
    })

    return { nextDistribution, appliedCount }
  }

  const applyReuseTargetsNow = () => {
    if (!selectedLead?.interviewResponses || !db) {
      toast({ variant: "destructive", title: "Dados ausentes" })
      return
    }

    const { nextClient, nextClaimant, appliedCount } = applyInterviewTargetsToRegistration({
      responses: selectedLead.interviewResponses,
      templateSnapshot: interviewTemplateSnapshot,
    })
    const { nextDistribution, appliedCount: distributionAppliedCount } = applyInterviewTargetsToDistribution({
      responses: selectedLead.interviewResponses,
      templateSnapshot: interviewTemplateSnapshot,
      baseDistribution: distributionData,
    })

    setClientRegistrationData(nextClient)
    setClaimantData(nextClaimant)
    setDistributionData(nextDistribution)
    setSelectedLead((prev: any) => prev ? {
      ...prev,
      clientRegistrationData: nextClient,
      claimantData: nextClaimant,
      distributionData: nextDistribution,
    } : prev)

    updateDocumentNonBlocking(doc(db, "leads", selectedLead.id), {
      clientRegistrationData: nextClient,
      claimantData: nextClaimant,
      distributionData: nextDistribution,
      updatedAt: serverTimestamp(),
    })

    toast({ title: "Dados Injetados" })
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  const formatCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14)
    if (digits.length <= 11) {
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
    }
    return digits
  }

  const toggleInterviewKey = (question: string, checked: boolean) => {
    setDistributionData((prev) => ({
      ...prev,
      selectedInterviewKeys: checked
        ? Array.from(new Set([...prev.selectedInterviewKeys, question]))
        : prev.selectedInterviewKeys.filter((item) => item !== question),
    }))
  }

  const applyInterviewSummaryToCaseDetails = () => {
    const summary = buildInterviewSummary(distributionData.selectedInterviewKeys)
    if (!summary) return

    setDistributionData((prev) => ({
      ...prev,
      caseDetails: summary,
    }))
  }

  const generateCaseDetailsWithGemini = async () => {
    const selectedAnswers = interviewEntries
      .filter(([question]) => distributionData.selectedInterviewKeys.includes(question))
      .map(([question, answer]) => ({
        question,
        answer: String(answer),
        priority: interviewMetaByLabel[question]?.reusePriority || "media",
        target: interviewMetaByLabel[question]?.reuseTarget || "caseDetails",
      }))

    if (selectedAnswers.length === 0) return

    setIsGeneratingCaseDetails(true)
    try {
      const result = await aiSummarizeInterviewCaseDetails({
        legalArea: selectedLead?.type || "Geral",
        leadName: selectedLead?.name || "Cliente",
        selectedAnswers,
      })

      setDistributionData((prev) => ({
        ...prev,
        caseDetails: result.caseDetails,
      }))
    } catch {
      toast({ variant: "destructive", title: "IA Temporariamente Indisponível" })
    } finally {
      setIsGeneratingCaseDetails(false)
    }
  }

  const getDefaultLeadTab = (status?: string) => {
    const normalizedStatus = normalizeLeadStatus(status)
    return LEAD_TABS.includes(normalizedStatus || "") ? (normalizedStatus as "atendimento" | "burocracia" | "distribuicao") : "atendimento"
  }

  const registrationMissingMap = useMemo(() => ({
    "client.fullName": !clientRegistrationData.fullName.trim(),
    "client.cpf": !clientRegistrationData.cpf.trim(),
    "client.rg": !clientRegistrationData.rg.trim(),
    "client.rgIssueDate": !clientRegistrationData.rgIssueDate.trim(),
    "client.motherName": !clientRegistrationData.motherName.trim(),
    "client.ctps": !clientRegistrationData.ctps.trim(),
    "client.zipCode": !clientRegistrationData.zipCode.trim(),
    "client.address": !clientRegistrationData.address.trim(),
    "client.city": !clientRegistrationData.city.trim(),
    "client.state": !clientRegistrationData.state.trim(),
    "claimant.fullName": !claimantData.fullName.trim(),
    "claimant.documentNumber": !claimantData.documentNumber.trim(),
    "claimant.zipCode": !claimantData.zipCode.trim(),
    "claimant.address": !claimantData.address.trim(),
    "claimant.city": !claimantData.city.trim(),
    "claimant.state": !claimantData.state.trim(),
  }), [clientRegistrationData, claimantData])

  const registrationMissingLabels = useMemo(() => {
    const labels: Record<string, string> = {
      "client.fullName": "Cliente: Nome completo",
      "client.cpf": "Cliente: CPF",
      "client.rg": "Cliente: RG",
      "client.rgIssueDate": "Cliente: Data expedição RG",
      "client.motherName": "Cliente: Nome da mãe",
      "client.ctps": "Cliente: CTPS",
      "client.zipCode": "Cliente: CEP",
      "client.address": "Cliente: Endereço",
      "client.city": "Cliente: Cidade",
      "client.state": "Cliente: UF",
      "claimant.fullName": "Reclamante: Nome completo",
      "claimant.documentNumber": "Reclamante: CPF/CNPJ",
      "claimant.zipCode": "Reclamante: CEP",
      "claimant.address": "Reclamante: Endereço",
      "claimant.city": "Reclamante: Cidade",
      "claimant.state": "Reclamante: UF",
    }

    return Object.entries(registrationMissingMap)
      .filter(([, isMissing]) => isMissing)
      .map(([field]) => labels[field])
  }, [registrationMissingMap])

  const isRegistrationComplete = () => registrationMissingLabels.length === 0

  const isMissingRegistrationField = (fieldName: string) => showRegistrationErrors && Boolean(registrationMissingMap[fieldName as keyof typeof registrationMissingMap])

  const notifyRegistrationPending = () => {
    setShowRegistrationErrors(true)
    toast({
      variant: "destructive",
      title: "Cadastro Incompleto",
      description: "Preencha todos os dados obrigatórios para avançar de fase."
    })
  }

  const getStatusLabel = (status?: string) => {
    const normalizedStatus = normalizeLeadStatus(status)
    const found = columns.find((col) => col.id === normalizedStatus)
    return found?.title || String(status || "NOVO").toUpperCase()
  }

  const resolveClientAddressByCep = async () => {
    const cep = clientRegistrationData.zipCode.replace(/\D/g, "")
    if (cep.length !== 8) return
    setIsResolvingClientCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data?.erro) {
        setClientRegistrationData(prev => ({ ...prev, address: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }))
      }
    } finally { setIsResolvingClientCep(false) }
  }

  const resolveClaimantAddressByCep = async () => {
    const cep = claimantData.zipCode.replace(/\D/g, "")
    if (cep.length !== 8) return
    setIsResolvingClaimantCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data?.erro) {
        setClaimantData(prev => ({ ...prev, address: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }))
      }
    } finally { setIsResolvingClaimantCep(false) }
  }

  const handleScheduleAttendance = async () => {
    if (!selectedLead || !db) return
    if (!scheduleData.date || !scheduleData.time) return

    const startDateTime = `${scheduleData.date}T${scheduleData.time}`
    const location = scheduleData.placeType === "office" ? "Escritório RGMJ" : scheduleData.meetingLink || "A definir"
    
    const hearingPayload = {
      title: `Atendimento: ${selectedLead.name}`,
      startDateTime,
      location,
      type: "Atendimento",
      processId: selectedLead.id,
      clientId: selectedLead.id,
      clientName: selectedLead.name,
      responsibleLawyer: scheduleData.lawyerName,
      createdAt: serverTimestamp(),
    }

    await addDocumentNonBlocking(collection(db, "hearings"), hearingPayload)
    handleUpdateLead()
    toast({ title: "Atendimento Agendado" })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2 uppercase tracking-tighter">CRM & Triagem Estratégica</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-black opacity-60">FLUXO DE CONVERSÃO E PRODUÇÃO JURÍDICA RGMJ.</p>
        </div>
        <Button 
          onClick={() => setIsNewEntryOpen(true)} 
          className="blue-gradient text-white font-bold gap-3 px-8 h-12 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          <PlusCircle className="h-5 w-5 text-amber-500" /> NOVO LEAD
        </Button>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4 glass rounded-3xl border-dashed">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Funil...</span>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => {
              if (col.id === "burocracia") return l.status === "burocracia" || l.status === "contratual"
              return l.status === col.id
            })
            return (
              <div key={col.id} className="min-w-[320px] flex-1">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                    <h3 className={`font-black text-[10px] tracking-[0.2em] uppercase ${col.color}`}>{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/50 text-[10px] border-white/5 font-black">{leadsInCol.length}</Badge>
                </div>
                <div className="space-y-4">
                  {leadsInCol.map((lead) => (
                    <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group relative overflow-hidden" onClick={() => handleOpenLead(lead)}>
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <div className="font-bold text-base text-white group-hover:text-primary transition-colors uppercase tracking-tight truncate">{lead.name}</div>
                          <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1 flex items-center gap-2">
                            <Scale className="h-3 w-3 text-primary/50" /> {lead.type}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{lead.updatedAt?.toDate ? new Date(lead.updatedAt.toDate()).toLocaleDateString() : 'Agosto/24'}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className={cn("w-full min-h-0 overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]", getDrawerWidthClass())}>
          {selectedLead && (
            <>
              <div className="p-10 pb-6 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-primary/10 text-primary border-primary/30 font-black uppercase text-[9px] px-4 py-1">Fase: {getStatusLabel(selectedLead.status)}</Badge>
                  <Badge variant="outline" className="text-[9px] uppercase border-white/10 text-muted-foreground font-black tracking-widest">{selectedLead.type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <SheetHeader className="text-left p-0">
                    <SheetTitle className="text-4xl font-headline font-bold text-white uppercase tracking-tighter">
                      {selectedLead.name}
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-1">Dossiê detalhado e acompanhamento de triagem estratégica.</SheetDescription>
                  </SheetHeader>
                  <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)}><ArrowRight className="h-6 w-6" /></Button>
                </div>
              </div>

              <Tabs key={selectedLead.id} defaultValue={getDefaultLeadTab(selectedLead.status)} className="flex-1 min-h-0 flex flex-col">
                <div className="px-10 bg-black/40">
                  <TabsList className="bg-transparent h-14 p-0 gap-8 w-full justify-start rounded-none border-b border-white/5">
                    <TabsTrigger value="atendimento" className="h-full px-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">1. Atendimento</TabsTrigger>
                    <TabsTrigger value="burocracia" className="h-full px-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">2. Burocracia</TabsTrigger>
                    <TabsTrigger value="distribuicao" className="h-full px-0 font-black text-[10px] uppercase tracking-widest data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">3. Distribuição</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="p-10 pb-20 space-y-10">
                    <TabsContent value="atendimento" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="flex gap-4">
                        <Button 
                          onClick={() => setIsInterviewOpen(true)}
                          className="flex-1 h-20 glass border-primary/20 text-primary font-black uppercase text-xs tracking-widest gap-4 hover:bg-primary/10 transition-all rounded-2xl"
                        >
                          <MessageSquare className="h-6 w-6" /> Iniciar Entrevista Técnica
                        </Button>
                        <Button className="flex-1 h-20 glass border-white/5 text-white font-black uppercase text-xs tracking-widest gap-4 hover:bg-white/5 transition-all rounded-2xl">
                          <Brain className="h-6 w-6 text-primary" /> Análise IA do Caso
                        </Button>
                      </div>

                      {selectedLead.interviewResponses && (
                        <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">Entrevista Coletada</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {Object.entries(selectedLead.interviewResponses).map(([q, a]: any) => (
                              <div key={q} className="text-[9px] uppercase font-bold text-muted-foreground border-l border-white/5 pl-3">
                                <span className="text-white/40">{q}:</span> {String(a)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Réu / Reclamada Principal</Label>
                          <Input value={atendimentoData.defendant} onChange={(e) => setAtendimentoData({...atendimentoData, defendant: e.target.value.toUpperCase()})} className="glass border-white/10 h-12 text-white" placeholder="NOME DA EMPRESA" />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Viabilidade Jurídica</Label>
                          <Select value={atendimentoData.viability} onValueChange={(v) => setAtendimentoData({...atendimentoData, viability: v})}>
                            <SelectTrigger className="glass border-white/10 h-12 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="glass border-white/10">
                              <SelectItem value="Alta">⭐⭐⭐ ALTA</SelectItem>
                              <SelectItem value="Média">⭐⭐ MÉDIA</SelectItem>
                              <SelectItem value="Baixa">⭐ BAIXA</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-6 pt-6 border-t border-white/5">
                        <h4 className="text-sm font-black text-primary uppercase tracking-[0.2em]">Agendar Atendimento</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input type="date" value={scheduleData.date} onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))} className="glass border-white/10 h-12 text-white" />
                          <Input type="time" value={scheduleData.time} onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))} className="glass border-white/10 h-12 text-white" />
                        </div>
                        <Button onClick={handleScheduleAttendance} className="w-full h-12 gold-gradient text-background font-black uppercase text-[11px] tracking-widest">Agendar</Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="burocracia" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-primary" />
                          <h3 className="text-sm font-black text-white uppercase tracking-tight">Sugestão de Kit: {selectedLead.type}</h3>
                        </div>
                        <Button onClick={applyReuseTargetsNow} variant="outline" className="w-full border-primary/30 text-primary uppercase font-black text-[10px] h-12">
                          Injetar Dados da Entrevista no Dossiê
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {(DOCUMENT_KITS[selectedLead.type] || DOCUMENT_KITS["Civil"]).map((docName, i) => (
                          <div key={i} className="flex items-center justify-between p-5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-4">
                              <Checkbox checked={contractualChecklist[docName] || false} onCheckedChange={(checked) => setContractualChecklist({...contractualChecklist, [docName]: !!checked})} />
                              <Label className="text-xs font-bold text-white uppercase">{docName}</Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="distribuicao" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input value={distributionData.processTitle} onChange={(e) => setDistributionData({ ...distributionData, processTitle: e.target.value.toUpperCase() })} className="glass border-white/10 h-12 text-white" placeholder="NOME DA AÇÃO" />
                        <Input value={distributionData.processNumber} onChange={(e) => setDistributionData({...distributionData, processNumber: e.target.value})} className="glass border-white/10 h-12 text-white font-mono" placeholder="NÚMERO CNJ" />
                      </div>
                      <Textarea value={distributionData.caseDetails} onChange={(e) => setDistributionData({ ...distributionData, caseDetails: e.target.value })} className="glass border-white/10 text-white min-h-[130px]" placeholder="DETALHES DO CASO" />
                      <div className="flex gap-4">
                        <Button onClick={applyInterviewSummaryToCaseDetails} className="flex-1 glass border-white/10">Resumir Entrevista</Button>
                        <Button onClick={generateCaseDetailsWithGemini} disabled={isGeneratingCaseDetails} className="flex-1 gold-gradient">
                          {isGeneratingCaseDetails ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2" />} Inteligência Gemini
                        </Button>
                      </div>
                      <Button onClick={handleDistribute} className="w-full h-16 bg-emerald-600 text-white font-black uppercase text-xs rounded-xl shadow-xl">Protocolar Distribuição</Button>
                    </TabsContent>
                  </div>
                </div>
              </Tabs>

              <div className="p-6 border-t border-white/5 bg-black/60 flex items-center justify-between gap-4">
                <Button onClick={handleUpdateLead} className="flex-1 glass border-white/10 text-white font-bold h-12 uppercase text-[10px]">Salvar Alterações</Button>
                <Button onClick={() => handleDeleteLead(selectedLead.id)} variant="ghost" className="text-rose-500 hover:bg-rose-500/10 font-bold h-12 uppercase text-[10px] border border-rose-500/30">Descartar</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isInterviewOpen} onOpenChange={setIsInterviewOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[900px] p-0 overflow-hidden shadow-2xl h-[90vh]">
          <DynamicInterviewExecution 
            template={activeTemplate}
            onSubmit={handleInterviewSubmit}
            onCancel={() => setIsInterviewOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Sheet open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <SheetContent className={cn("w-full min-h-0 overflow-hidden glass border-l border-white/10 p-0 flex flex-col bg-[#0a0f1e]", getDrawerWidthClass())}>
          <div className="p-8 border-b border-white/5 bg-[#0a0f1e]">
            <SheetHeader>
              <SheetTitle className="text-white font-headline text-3xl uppercase tracking-tighter flex items-center gap-4">
                <UserPlus className="h-8 w-8 text-primary" /> Registro de Novo Lead
              </SheetTitle>
            </SheetHeader>
          </div>
          <LeadForm 
            existingLeads={leads} 
            onSubmit={handleCreateEntry} 
            onSelectExisting={(l) => { handleOpenLead(l); setIsNewEntryOpen(false); }} 
            onQuickCreateClient={handleQuickCreateClient}
            defaultResponsibleLawyer={getLoggedLawyerName()}
            initialMode="quick" 
            lockMode={false} 
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Lógica de Largura de Drawer
function getDrawerWidthClass() {
  // Simplificado para o protótipo, no futuro pode vir das preferências do perfil
  return "sm:max-w-4xl";
}
