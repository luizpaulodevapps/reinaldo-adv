
"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Clock, 
  Zap, 
  UserPlus, 
  Brain,
  Scale,
  Loader2,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  Sparkles,
  X,
  PlusCircle,
  LayoutGrid
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
import { Label } from "@/components/ui/label"
import { LeadForm } from "@/components/leads/lead-form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collection, query, serverTimestamp, doc, where, limit } from "firebase/firestore"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { cn } from "@/lib/utils"
import { DynamicInterviewExecution } from "@/components/interviews/dynamic-interview-execution"
import Link from "next/link"

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

  const checklistsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "checklists"), where("category", "==", "Entrevista de Triagem"))
  }, [db, user])
  const { data: interviewTemplates } = useCollection(checklistsQuery)

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [isInterviewOpen, setIsInterviewOpen] = useState(false)
  
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
    lawyerName: "",
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

  const getLoggedLawyerName = () => profile?.name || user?.displayName || "Dr. Reinaldo Gonçalves"

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

  const isRegistrationComplete = () => {
    return !!(clientRegistrationData.fullName && clientRegistrationData.cpf && claimantData.fullName)
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

  const getDrawerWidthClass = () => {
    const pref = profile?.themePreferences?.drawerWidth || "extra-largo"
    switch (pref) {
      case "padrão": return "sm:max-w-lg"
      case "largo": return "sm:max-w-2xl"
      case "extra-largo": return "sm:max-w-4xl"
      case "full": return "sm:max-w-full"
      default: return "sm:max-w-4xl"
    }
  }

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
    if (!user || !db) return
    const newLead = {
      ...data,
      assignedStaffId: user.uid,
      status: "novo",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await addDocumentNonBlocking(collection(db, "leads"), newLead)
    setIsNewEntryOpen(false)
    toast({ title: "Triagem Iniciada!" })
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

  const handleDistribute = async () => {
    if (!selectedLead || !db) return

    const newProcess = {
      protocolId: `PROC-${Date.now()}`,
      sourceLeadId: selectedLead.id,
      clientId: selectedLead.id,
      clientName: selectedLead.name,
      processNumber: distributionData.processNumber,
      processTitle: distributionData.processTitle,
      caseType: selectedLead.type,
      status: "Em Andamento",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await addDocumentNonBlocking(collection(db, "processes"), newProcess)
    deleteDocumentNonBlocking(doc(db, "leads", selectedLead.id))
    setIsSheetOpen(false)
    toast({ title: "PROCESSO PROTOCOLADO!" })
  }

  const handleInterviewSubmit = (payload: { responses: any; templateSnapshot: any[] }) => {
    if (!selectedLead || !db) return
    const responses = payload.responses || {}
    const templateSnapshot = payload.templateSnapshot || []
    
    const leadRef = doc(db, "leads", selectedLead.id)
    updateDocumentNonBlocking(leadRef, {
      interviewResponses: responses,
      interviewTemplateSnapshot: templateSnapshot,
      updatedAt: serverTimestamp()
    })

    setSelectedLead((prev: any) => prev ? {
      ...prev,
      interviewResponses: responses,
      interviewTemplateSnapshot: templateSnapshot,
    } : prev)

    setIsInterviewOpen(false)
    toast({ title: "Entrevista Concluída" })
  }

  const activeTemplate = useMemo(() => {
    if (!selectedLead || !interviewTemplates) return null
    return interviewTemplates.find(t => t.legalArea === selectedLead.type) || interviewTemplates[0]
  }, [selectedLead, interviewTemplates])

  const getStatusLabel = (status?: string) => {
    const normalizedStatus = normalizeLeadStatus(status)
    const found = columns.find((col) => col.id === normalizedStatus)
    return found?.title || String(status || "NOVO").toUpperCase()
  }

  const getDefaultLeadTab = (status?: string) => {
    const normalizedStatus = normalizeLeadStatus(status)
    return LEAD_TABS.includes(normalizedStatus || "") ? (normalizedStatus as "atendimento" | "burocracia" | "distribuicao") : "atendimento"
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Triagem & Funil</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Leads</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-black opacity-60">Triagem Estratégica RGMJ.</p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-background font-black gap-3 px-8 h-12 rounded-xl shadow-xl">
          <PlusCircle className="h-5 w-5" /> NOVO ATENDIMENTO
        </Button>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Funil...</span>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          {columns.map((col) => {
            const leadsInCol = leads.filter(l => normalizeLeadStatus(l.status) === col.id)
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
                    <Card key={lead.id} className="glass hover-gold transition-all cursor-pointer group" onClick={() => handleOpenLead(lead)}>
                      <CardContent className="p-5 space-y-4">
                        <div className="font-bold text-base text-white group-hover:text-primary transition-colors uppercase tracking-tight truncate">{lead.name}</div>
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase">{lead.updatedAt?.toDate ? new Date(lead.updatedAt.toDate()).toLocaleDateString() : 'Agosto/24'}</span>
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
                    <SheetTitle className="text-4xl font-black text-white uppercase tracking-tighter">
                      {selectedLead.name}
                    </SheetTitle>
                  </SheetHeader>
                  <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)}><X className="h-6 w-6" /></Button>
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
                    <TabsContent value="atendimento" className="mt-0 space-y-8">
                      <Button 
                        onClick={() => setIsInterviewOpen(true)}
                        className="w-full h-20 glass border-primary/20 text-primary font-black uppercase text-xs tracking-widest gap-4 hover:bg-primary/10 transition-all rounded-2xl"
                      >
                        <MessageSquare className="h-6 w-6" /> Iniciar Entrevista Técnica
                      </Button>

                      {selectedLead.interviewResponses && (
                        <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 space-y-4 shadow-xl">
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">Dados Coletados</h4>
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
                    </TabsContent>
                    
                    <TabsContent value="burocracia" className="mt-0 space-y-8">
                      <div className="space-y-4">
                        {(DOCUMENT_KITS[selectedLead.type] || DOCUMENT_KITS["Civil"]).map((docName, i) => (
                          <div key={i} className="flex items-center justify-between p-5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-4">
                              <Checkbox checked={contractualChecklist[docName] || false} onCheckedChange={(checked) => setContractualChecklist({...contractualChecklist, [docName]: !!checked})} />
                              <Label className="text-[10px] font-black text-white uppercase tracking-widest">{docName}</Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="distribuicao" className="mt-0 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input value={distributionData.processTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDistributionData({ ...distributionData, processTitle: e.target.value.toUpperCase() })} className="glass border-white/10 h-14 text-white uppercase font-bold" placeholder="NOME DA AÇÃO" />
                        <Input value={distributionData.processNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDistributionData({...distributionData, processNumber: e.target.value})} className="glass border-white/10 h-14 text-white font-mono font-bold" placeholder="NÚMERO CNJ" />
                      </div>
                      <Button onClick={handleDistribute} className="w-full h-16 bg-emerald-600 text-white font-black uppercase text-xs rounded-xl shadow-xl tracking-widest">Protocolar Distribuição</Button>
                    </TabsContent>
                  </div>
                </div>
              </Tabs>

              <div className="p-8 border-t border-white/5 bg-black/60 flex items-center justify-between gap-4">
                <Button onClick={handleUpdateLead} className="flex-1 glass border-white/10 text-white font-black h-14 uppercase text-[11px] tracking-widest">Salvar Dossiê</Button>
                <Button onClick={() => setSelectedLead(null)} variant="ghost" className="text-rose-500 hover:bg-rose-500/10 font-black h-14 uppercase text-[11px] px-8 tracking-widest border border-rose-500/20">Sair</Button>
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
                <UserPlus className="h-8 w-8 text-primary" /> Novo Lead RGMJ
              </SheetTitle>
            </SheetHeader>
          </div>
          <LeadForm 
            existingLeads={leads} 
            onSubmit={handleCreateEntry} 
            onSelectExisting={(l) => { handleOpenLead(l); setIsNewEntryOpen(false); }} 
            defaultResponsibleLawyer={getLoggedLawyerName()}
            initialMode="quick" 
            lockMode={false} 
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
