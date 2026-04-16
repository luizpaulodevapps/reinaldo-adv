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
  Plus
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
import { normalizeGoogleWorkspaceSettings } from "@/services/google-workspace"
import { syncActToGoogleCalendar } from "@/services/google-calendar-sync"
import Link from "next/link"

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

  const [activeDossierTab, setActiveDossierTab] = useState("atividades")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isInterviewing, setIsInterviewing] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const interviewsQuery = useMemoFirebase(() => {
    if (!db || !id) return null
    return query(collection(db, "leads", id, "interviews"), orderBy("createdAt", "desc"), limit(1))
  }, [db, id])
  const { data: interviews } = useCollection(interviewsQuery)
  const latestInterview = interviews?.[0]
  
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

  const templatesQuery = useMemoFirebase(() => db ? query(collection(db, "checklists")) : null, [db])
  const { data: templates } = useCollection(templatesQuery)

  const modelsQuery = useMemoFirebase(() => db ? query(collection(db, "document_templates")) : null, [db])
  const { data: models } = useCollection(modelsQuery)

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

  const handleFinishInterview = async (payload: { responses: any; templateSnapshot: any[] }) => {
    if (!db || !lead || !user) return
    
    setIsInterviewing(false)
    const { responses, templateSnapshot } = payload

    // 1. Extrair dados para completar o cadastro (heurística simples por labels)
    const updates: any = { updatedAt: serverTimestamp() }
    
    Object.entries(responses).forEach(([label, value]) => {
      const l = label.toUpperCase()
      if (l.includes("CPF") && !lead.cpf) updates.cpf = maskCPFOrCNPJ(String(value))
      if (l.includes("NOME COMPLETO") && !lead.name) updates.name = String(value).toUpperCase()
      if (l.includes("TELEFONE") && !lead.phone) updates.phone = maskPhone(String(value))
      if (l.includes("EMAIL") && !lead.email) updates.email = String(value).toLowerCase()
      if (l.includes("CEP") && !lead.zipCode) updates.zipCode = maskCEP(String(value))
      if (l.includes("ENDEREÇO") || l.includes("LOGRADOURO")) updates.address = String(value).toUpperCase()
    })

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

  const handleGenerateDraft = async (model: any) => {
    if (!lead) return
    
    let content = `REGINALDO GONÇALVES MIGUEL DE JESUS - ADVOCACIA ESTRATÉGICA\n`
    content += `${model.title}\n\n`
    
    // Mapeamento de tags comuns para dados do lead
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
    addDocumentNonBlocking(collection(db!, "activities"), {
      leadId: lead.id,
      type: "Documento",
      subject: `DOCUMENTO GERADO: ${model.title}`,
      description: `A minuta foi gerada e exportada para o Google Docs.`,
      responsibleId: user?.uid,
      responsibleName: user?.displayName || "Sistema",
      status: "Realizado",
      createdAt: serverTimestamp()
    })
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

        <div className="flex items-center gap-2">
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
      </div>

      {/* LAYOUT PRINCIPAL (2 COLUNAS) */}
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
                  <ActivityManager leadId={lead.id} />
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
                            <code className="text-[11px] font-bold text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10 tracking-tight">{t.tag}</code>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-medium text-white/70 truncate max-w-[180px]">{t.val || "---"}</span>
                              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(t.tag, t.tag)} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all text-white/20 hover:text-primary">
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

                    <Card className="glass border-white/5 p-6 bg-white/[0.01] rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Building className="h-4 w-4" /> Polo Passivo
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-white uppercase tracking-tighter leading-none">{lead.defendantName || "NÃO INFORMADO"}</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase">{lead.defendantDocument || "Sem registro de CNPJ"}</p>
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <Label className={labelMini}>Histórico Preliminar / Fatos</Label>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 min-h-[150px] text-xs font-bold text-white/60 uppercase leading-relaxed tracking-wide italic">
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
                            <SelectValue placeholder="SELECIONAR MODELO (CONTRATO, PROCURAÇÃO...)" />
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

              <div className="group">
                <Label className={labelMini}>Endereço Eletrônico</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/40 h-11 px-4 flex items-center justify-between rounded-xl border border-white/5 group-hover:border-primary/20 transition-all">
                    <span className="text-xs font-black text-white lowercase tracking-tight truncate">{lead.email || 'sem_email@rgmj.adv'}</span>
                    <button onClick={() => lead.email && copyToClipboard(lead.email, "E-mail")} className="text-white/20 hover:text-primary transition-colors">
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
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <Label className={labelMini}>Responsável Técnico</Label>
                <p className="text-[11px] font-black text-white uppercase">{lead.responsibleLawyer || "A REPARTIR"}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <Label className={labelMini}>Origem do Lead</Label>
                <p className="text-[11px] font-black text-white uppercase">{lead.source || "TRAFEGO DIRETO"}</p>
              </div>
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

        </div>
      </div>

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
                    <div className={cn("p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4", intakeData.type === 'online' ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5 hover:border-white/10")} onClick={() => setIntakeData({...intakeData, type: 'online'})}>
                      <Video className={cn("h-8 w-8", intakeData.type === 'online' ? "text-primary" : "text-white/20")} />
                      <span className="text-xs font-black text-white uppercase tracking-widest">Virtual</span>
                    </div>
                    <div className={cn("p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4", intakeData.type === 'presencial' ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5 hover:border-white/10")} onClick={() => setIntakeData({...intakeData, type: 'presencial'})}>
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
                    <div className="space-y-2"><Label className={labelMini}>Data</Label><Input type="date" className="bg-white/5 h-12 text-white font-bold rounded-xl border-white/10" value={intakeData.date} onChange={e => setIntakeData({...intakeData, date: e.target.value})} /></div>
                    <div className="space-y-2"><Label className={labelMini}>Hora</Label><Input type="time" className="bg-white/5 h-12 text-white font-bold rounded-xl border-white/10" value={intakeData.time} onChange={e => setIntakeData({...intakeData, time: e.target.value})} /></div>
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
                        <Select value={intakeData.priority} onValueChange={v => setIntakeData({...intakeData, priority: v})}>
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
                        onChange={e => setIntakeData({...intakeData, observations: e.target.value})} 
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
                        <Switch checked={intakeData.autoMeet} onCheckedChange={v => setIntakeData({...intakeData, autoMeet: v})} className="data-[state=checked]:bg-primary" />
                        <Label className="text-[9px] font-black text-white uppercase">Sincronizar com Workspace?</Label>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                         <div className={cn("p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3", intakeData.locationType === 'sede' ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5")} onClick={() => setIntakeData({...intakeData, locationType: 'sede'})}>
                          <Building className="h-4 w-4 text-primary" /><span className="text-[9px] font-black text-white uppercase">Sede RGMJ</span>
                        </div>
                        <div className={cn("p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3", intakeData.locationType === 'custom' ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5")} onClick={() => setIntakeData({...intakeData, locationType: 'custom'})}>
                          <MapPin className="h-4 w-4 text-primary" /><span className="text-[9px] font-black text-white uppercase">Externo</span>
                        </div>
                      </div>
                      {intakeData.locationType === 'custom' && (
                        <div className="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                           <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><Label className={labelMini}>CEP</Label><Input value={intakeData.zipCode} onChange={e => setIntakeData({...intakeData, zipCode: maskCEP(e.target.value)})} onBlur={handleIntakeCepBlur} className="bg-black/40 h-10 border-white/10 text-xs font-bold text-white" /></div>
                            <div className="space-y-1.5"><Label className={labelMini}>UF/Cidade</Label><Input value={intakeData.city} className="bg-black/40 h-10 border-white/10 text-xs font-bold text-white px-3" readOnly disabled /></div>
                          </div>
                          <div className="space-y-1.5"><Label className={labelMini}>Endereço Completo</Label><Input value={intakeData.address} onChange={e => setIntakeData({...intakeData, address: e.target.value})} className="bg-black/40 h-10 border-white/10 text-xs font-bold text-white" /></div>
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
  )
}
