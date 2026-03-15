
"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  ChevronRight,
  LayoutGrid,
  Save,
  Loader2,
  FileText,
  Plus,
  Trash2,
  Settings2,
  CloudLightning,
  ShieldCheck,
  Globe,
  Database,
  Calendar,
  Video,
  ListTodo,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Hash,
  Link as LinkIcon,
  MessageSquare,
  Bell,
  Smartphone,
  Info,
  ChevronDown,
  Copy,
  Zap,
  Sparkles,
  Clock,
  Palette,
  X,
  MapPin,
  Lock,
  ListChecks,
  Key,
  Mail,
  Library,
  Building2,
  Fingerprint,
  Users,
  ShieldAlert,
  Search,
  History,
  CreditCard,
  Tag,
  UserPlus,
  UserCog,
  UserCheck,
  TrendingUp,
  Landmark,
  Scale,
  DollarSign,
  Stamp,
  Signature,
  ArrowUpRight,
  ArrowDownRight,
  Gavel
} from "lucide-react"
import { 
  Select, 
  SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useDoc } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn, maskPhone, maskCEP, maskCNPJ } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_GOOGLE_WORKSPACE_SETTINGS,
  extractGoogleDriveFolderId,
  getGoogleWorkspaceRuntimeContext,
  isValidGoogleDriveFolderId,
  normalizeGoogleWorkspaceSettings,
  toGoogleDriveFolderUrl,
} from "@/services/google-workspace"

const LEGAL_AREAS = ["Trabalhista", "Cível", "Criminal", "Família", "Previdenciário", "Tributário", "Geral"]

const MESSAGE_PLACEHOLDERS = [
  { tag: "{{NOME_CLIENTE}}", desc: "Nome completo do lead ou cliente" },
  { tag: "{{CLIENTE_CPF}}", desc: "CPF/CNPJ do cliente" },
  { tag: "{{NUMERO_PROCESSO}}", desc: "CNJ do processo vinculado" },
  { tag: "{{FORUM_VARA}}", desc: "Tribunal e Vara do feito" },
  { tag: "{{DATA_ATO}}", desc: "Data formatada do compromisso" },
  { tag: "{{HORA_ATO}}", desc: "Horário do compromisso" },
  { tag: "{{LOCAL_ATO}}", desc: "Endereço físico (Somente Audiência Física)" },
  { tag: "{{LINK_ATO}}", desc: "Link eletrônico (Tribunal/Virtual)" },
  { tag: "{{VALOR}}", desc: "Valor numérico do lançamento" },
  { tag: "{{VALOR_EXTENSO}}", desc: "Valor por extenso do lançamento" },
  { tag: "{{DESCRICAO}}", desc: "Objeto do pagamento ou recebimento" },
]

const KIT_TEMPLATES = [
  { id: "audiencia_fisica", title: "AUDIÊNCIA FÍSICA", icon: MapPin },
  { id: "audiencia_virtual", title: "AUDIÊNCIA VIRTUAL", icon: Video },
  { id: "atendimento", title: "ATENDIMENTO", icon: MapPin },
  { id: "prazo", title: "PRAZO", icon: Clock },
]

function SettingsContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "geral"
  const [activeTab, setActiveTab] = useState(initialTab)
  const db = useFirestore()
  const { user, profile, role } = useUser()
  const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : ""

  const isAdmin = role === 'admin'

  // Estados CRUD Usuários
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "lawyer",
    isActive: true
  })

  const teamQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user])
  const { data: team, isLoading: isTeamLoading } = useCollection(teamQuery)

  const filteredTeam = useMemo(() => {
    if (!team) return []
    // Filtro por busca
    const searchResult = team.filter(m => 
      m.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
    )
    
    // Saneamento de Duplicidade: Garante unicidade por E-mail
    const seenEmails = new Set();
    return searchResult.filter(m => {
      const email = m.email?.toLowerCase().trim();
      if (!email || seenEmails.has(email)) return false;
      seenEmails.add(email);
      return true;
    });
  }, [team, userSearchTerm])

  // Estados Financeiros
  const [financialSettings, setFinancialSettings] = useState({
    issRate: 2.0,
    irRate: 1.5,
    successFeeDefault: 20,
    consultationValue: 350,
    masterBank: "BANCO ITAÚ",
    masterAgency: "0000",
    masterAccount: "00000-0",
    masterPix: "rgmj.adv@gmail.com",
    autoGenerateInvoices: true
  })

  const finRef = useMemoFirebase(() => db ? doc(db, 'settings', 'financial') : null, [db])
  const { data: finData } = useDoc(finRef)

  useEffect(() => {
    if (finData) setFinancialSettings(prev => ({ ...prev, ...finData }))
  }, [finData])

  // Estados Recibos & Comprovantes
  const [docSettings, setDocSettings] = useState({
    receiptTemplate: "Recebemos de {{NOME_CLIENTE}}, CPF/CNPJ {{CLIENTE_CPF}}, a importância de {{VALOR}} ({{VALOR_EXTENSO}}), referente a {{DESCRICAO}}.",
    voucherTemplate: "Efetuamos o pagamento a {{NOME_CLIENTE}}, referente a {{DESCRICAO}}, no valor de {{VALOR}}.",
    signatureText: "Dr. Reinaldo Gonçalves Miguel de Jesus\nOAB/SP 000.000",
    stampText: "RGMJ ADVOGADOS\nCNPJ 00.000.000/0001-00",
    logoUrl: "",
    useDigitalStamp: true,
    useDigitalSignature: true
  })

  const docRef = useMemoFirebase(() => db ? doc(db, 'settings', 'documents') : null, [db])
  const { data: storedDocData } = useDoc(docRef)

  useEffect(() => {
    if (storedDocData) setDocSettings(prev => ({ ...prev, ...storedDocData }))
  }, [storedDocData])

  const handleSaveDocSettings = () => {
    if (!db) return
    setDocumentNonBlocking(doc(db, 'settings', 'documents'), { ...docSettings, updatedAt: serverTimestamp() }, { merge: true })
    toast({ title: "Modelos de Documentos Atualizados" })
  }

  // Estados Customização Kit Cliente
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [messageFormData, setMessageFormData] = useState({
    profileName: "",
    eventType: "",
    calendarTemplate: "",
    clientTemplate: "",
    isActive: true,
    reminderMinutes: 60,
    calendarColorId: "1",
    useMeetLink: true,
    sendWhatsApp: true
  })

  const messagesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "notification_templates"), orderBy("createdAt", "desc"))
  }, [db, user])
  const { data: messageTemplates } = useCollection(messagesQuery)

  const [firmFormData, setFirmFormData] = useState({
    name: "RGMJ ADVOGADOS",
    cnpj: "",
    zipCode: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    openingHours: "Segunda a Sexta, das 09:00 às 18:00",
    responsibleLawyer: "Dr. Reinaldo Gonçalves Miguel de Jesus",
    oabNumber: "",
    logoUrl: ""
  })

  const [googleConfig, setGoogleConfig] = useState(DEFAULT_GOOGLE_WORKSPACE_SETTINGS)

  const firmRef = useMemoFirebase(() => db ? doc(db, 'settings', 'firm') : null, [db])
  const { data: firmData } = useDoc(firmRef)

  const googleRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleData } = useDoc(googleRef)

  useEffect(() => {
    if (firmData) setFirmFormData(prev => ({ ...prev, ...firmData }))
  }, [firmData])

  useEffect(() => {
    if (googleData) setGoogleConfig(normalizeGoogleWorkspaceSettings(googleData))
  }, [googleData])

  const googleRuntime = useMemo(() => getGoogleWorkspaceRuntimeContext(runtimeOrigin), [runtimeOrigin])
  const connectedGoogleEmail = user?.email?.toLowerCase() || ""
  const normalizedRootFolderId = extractGoogleDriveFolderId(googleConfig.rootFolderId)
  const rootFolderUrl = toGoogleDriveFolderUrl(normalizedRootFolderId)
  const isRootFolderValid = !googleConfig.isDriveActive || isValidGoogleDriveFolderId(normalizedRootFolderId)
  const isMasterEmailAligned = !!(
    googleConfig.masterEmail &&
    connectedGoogleEmail &&
    googleConfig.masterEmail === connectedGoogleEmail
  )

  const handleSaveFinancial = () => {
    if (!db) return
    setDocumentNonBlocking(doc(db, 'settings', 'financial'), {
      ...financialSettings,
      updatedAt: serverTimestamp()
    }, { merge: true })
    toast({ title: "Parâmetros Fiscais Atualizados" })
  }

  const handleSaveUser = () => {
    if (!db || !userFormData.name || !userFormData.email) return
    const payload = {
      ...userFormData,
      name: userFormData.name.toUpperCase(),
      email: userFormData.email.toLowerCase().trim(),
      updatedAt: serverTimestamp()
    }
    const emailId = payload.email
    setDocumentNonBlocking(doc(db!, "staff_profiles", emailId), { ...payload, id: emailId }, { merge: true })
    setIsUserDialogOpen(false)
    toast({ title: "Acesso Atualizado" })
  }

  const handleSaveMessageTemplate = () => {
    if (!db || !messageFormData.profileName) return
    const payload = {
      ...messageFormData,
      updatedAt: serverTimestamp()
    }
    if (editingTemplate) {
      updateDocumentNonBlocking(doc(db, "notification_templates", editingTemplate.id), payload)
    } else {
      addDocumentNonBlocking(collection(db, "notification_templates"), { ...payload, createdAt: serverTimestamp() })
    }
    setIsMessageDialogOpen(false)
    toast({ title: "Configuração de Atendimento Salva" })
  }

  const handleOpenMessageTemplate = (typeId: string, title: string) => {
    const existing = (messageTemplates || []).find(t => t.eventType === typeId)
    setEditingTemplate(existing || null)
    setMessageFormData({
      profileName: title,
      eventType: typeId,
      calendarTemplate: existing?.calendarTemplate || `[${title}] {{NOME_CLIENTE}}`,
      clientTemplate: existing?.clientTemplate || `Olá {{NOME_CLIENTE}}, confirmamos o compromisso de ${title} para {{DATA_ATO}} às {{HORA_ATO}}.`,
      isActive: existing?.isActive ?? true,
      reminderMinutes: existing?.reminderMinutes || 60,
      calendarColorId: existing?.calendarColorId || "1",
      useMeetLink: existing?.useMeetLink ?? (typeId === 'audiencia_virtual'),
      sendWhatsApp: existing?.sendWhatsApp ?? true
    })
    setIsMessageDialogOpen(true)
  }

  const handleSaveGoogleConfig = () => {
    if (!db) return
    const normalized = normalizeGoogleWorkspaceSettings(googleConfig)

    if (normalized.masterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.masterEmail)) {
      toast({
        variant: "destructive",
        title: "E-mail Mestre Inválido",
        description: "Informe um e-mail Google válido para auditoria operacional do Workspace.",
      })
      return
    }

    if (normalized.isDriveActive && !isValidGoogleDriveFolderId(normalized.rootFolderId)) {
      toast({
        variant: "destructive",
        title: "Pasta Raiz Inválida",
        description: "Cole o ID ou a URL de uma pasta real do Google Drive. O sistema salva apenas o ID operacional.",
      })
      return
    }

    setGoogleConfig(normalized)
    setDocumentNonBlocking(doc(db, 'settings', 'google'), { ...normalized, updatedAt: serverTimestamp() }, { merge: true })
    toast({ title: "Hub Workspace Sincronizado", description: "As integrações Google agora obedecem a essas flags em runtime." })
  }

  const handleCepBlur = async () => {
    const cep = firmFormData.zipCode.replace(/\D/g, "")
    if (cep.length !== 8) return
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setFirmFormData(prev => ({
          ...prev,
          address: data.logradouro.toUpperCase(),
          neighborhood: data.bairro.toUpperCase(),
          city: data.localidade.toUpperCase(),
          state: data.uf.toUpperCase()
        }))
      }
    } catch (e) { console.error(e) }
  }

  const renderMessagePreview = (template: string) => {
    const mockData: Record<string, string> = {
      "{{NOME_CLIENTE}}": "LUIZ PAULO",
      "{{CLIENTE_CPF}}": "000.000.000-00",
      "{{NUMERO_PROCESSO}}": "0001234-56.2024.5.02.0000",
      "{{FORUM_VARA}}": "TRT 2ª REGIÃO - 45ª VARA DO TRABALHO",
      "{{DATA_ATO}}": "15/05/2024",
      "{{HORA_ATO}}": "14:30",
      "{{LOCAL_ATO}}": "RUA DO FÓRUM, Nº 123 - CENTRO",
      "{{LINK_ATO}}": "meet.google.com/rgmj-atend",
      "{{VALOR}}": "R$ 1.500,00",
      "{{DESCRICAO}}": "REUNIÃO TÁTICA DE ALINHAMENTO"
    }
    
    let rendered = template;
    Object.entries(mockData).forEach(([tag, val]) => {
      rendered = rendered.replaceAll(tag, val);
    });
    
    return rendered;
  }

  const tabTriggerClass = "data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:shadow-[0_0_20px_rgba(245,208,48,0.3)] text-muted-foreground font-black text-[10px] uppercase h-full px-10 rounded-full transition-all tracking-[0.1em] border border-transparent data-[state=active]:border-black/10"
  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 block"

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tight uppercase tracking-tighter">Configurações do Sistema</h1>
        <p className="text-muted-foreground text-sm font-black uppercase tracking-[0.2em] opacity-60">GESTÃO DE INFRAESTRUTURA, PESSOAS E PARÂMETROS ESTRATÉGICOS.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-[#0d1117]/80 border border-white/5 p-1.5 rounded-full overflow-x-auto scrollbar-hide shadow-2xl mb-12 backdrop-blur-xl w-fit">
          <TabsList className="bg-transparent h-12 p-0 gap-1 justify-start">
            <TabsTrigger value="geral" className={tabTriggerClass}>Geral</TabsTrigger>
            <TabsTrigger value="seo" className={tabTriggerClass}>Google Hub</TabsTrigger>
            <TabsTrigger value="usuarios" className={tabTriggerClass}>Usuários</TabsTrigger>
            <TabsTrigger value="financeiro" className={tabTriggerClass}>Financeiro</TabsTrigger>
            <TabsTrigger value="documentos" className={tabTriggerClass}>Recibos</TabsTrigger>
            <TabsTrigger value="tags" className={tabTriggerClass}>Tags</TabsTrigger>
            <TabsTrigger value="kit" className={tabTriggerClass}>Kit Cliente</TabsTrigger>
            <TabsTrigger value="licenca" className={tabTriggerClass}>Licença</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="geral" className="mt-0 space-y-8">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-3xl">
            <CardHeader className="p-8 border-b border-white/5 bg-[#0a0f1e] flex flex-row items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl"><Building2 className="h-6 w-6" /></div>
                <div>
                  <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">Perfil Institucional</CardTitle>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50">DADOS OFICIAIS DA BANCA RGMJ.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3"><Label className={labelMini}>RAZÃO SOCIAL</Label><Input value={firmFormData.name} onChange={(e) => setFirmFormData({...firmFormData, name: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-black" /></div>
                <div className="space-y-3"><Label className={labelMini}>CNPJ</Label><Input value={firmFormData.cnpj} onChange={(e) => setFirmFormData({...firmFormData, cnpj: maskCNPJ(e.target.value)})} className="bg-black/40 h-14 text-white font-mono" placeholder="00.000.000/0000-00" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-10">
                <div className="space-y-3"><Label className={labelMini}>Advogado Responsável (Diretor)</Label><div className="relative"><UserCog className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" /><Input value={firmFormData.responsibleLawyer} onChange={(e) => setFirmFormData({...firmFormData, responsibleLawyer: e.target.value.toUpperCase()})} className="bg-black/40 h-14 pl-12 text-white font-bold" /></div></div>
                <div className="space-y-3"><Label className={labelMini}>Inscrição OAB</Label><div className="relative"><Gavel className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" /><Input value={firmFormData.oabNumber} onChange={(e) => setFirmFormData({...firmFormData, oabNumber: e.target.value.toUpperCase()})} className="bg-black/40 h-14 pl-12 text-white font-black" placeholder="EX: SP 000.000" /></div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-10">
                <div className="space-y-3"><Label className={labelMini}>E-mail Institucional</Label><Input value={firmFormData.email} onChange={(e) => setFirmFormData({...firmFormData, email: e.target.value.toLowerCase()})} className="bg-black/40 h-14 text-white font-bold" placeholder="atendimento@rgmj.adv.br" /></div>
                <div className="space-y-3"><Label className={labelMini}>WhatsApp / Telefone</Label><Input value={firmFormData.phone} onChange={(e) => setFirmFormData({...firmFormData, phone: maskPhone(e.target.value)})} className="bg-black/40 h-14 text-white font-bold" placeholder="(11) 96828-5695" /></div>
              </div>

              <div className="space-y-3 border-t border-white/5 pt-10">
                <Label className={labelMini}>Horário de Funcionamento</Label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                  <Input value={firmFormData.openingHours} onChange={(e) => setFirmFormData({...firmFormData, openingHours: e.target.value.toUpperCase()})} className="bg-black/40 h-14 pl-12 text-white font-bold" placeholder="EX: SEGUNDA A SEXTA, DAS 09:00 ÀS 18:00" />
                </div>
              </div>

              <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-8 shadow-inner border-t border-white/5 pt-10">
                <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                  <MapPin className="h-6 w-6 text-primary" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Endereço da Sede</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2"><Label className={labelMini}>CEP</Label><Input value={firmFormData.zipCode} onChange={e => setFirmFormData({...firmFormData, zipCode: maskCEP(e.target.value)})} onBlur={handleCepBlur} className="bg-black/40 h-12 text-white font-mono" placeholder="00000-000" /></div>
                  <div className="md:col-span-2 space-y-2"><Label className={labelMini}>Logradouro</Label><Input value={firmFormData.address} onChange={e => setFirmFormData({...firmFormData, address: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white font-bold" /></div>
                  <div className="space-y-2"><Label className={labelMini}>Número</Label><Input value={firmFormData.number} onChange={e => setFirmFormData({...firmFormData, number: e.target.value})} className="bg-black/40 h-12 text-white" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2"><Label className={labelMini}>Bairro</Label><Input value={firmFormData.neighborhood} onChange={e => setFirmFormData({...firmFormData, neighborhood: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white" /></div>
                  <div className="space-y-2"><Label className={labelMini}>Cidade</Label><Input value={firmFormData.city} onChange={e => setFirmFormData({...firmFormData, city: e.target.value.toUpperCase()})} className="bg-black/40 h-12 text-white font-bold" /></div>
                  <div className="space-y-2"><Label className={labelMini}>UF</Label><Input value={firmFormData.state} onChange={e => setFirmFormData({...firmFormData, state: e.target.value.toUpperCase()})} maxLength={2} className="bg-black/40 h-12 text-white font-bold" /></div>
                </div>
              </div>

              <div className="space-y-3 border-t border-white/5 pt-10">
                <Label className={labelMini}>Logo Institucional (URL .png)</Label>
                <div className="flex gap-6 items-center">
                  <Input value={firmFormData.logoUrl} onChange={e => setFirmFormData({...firmFormData, logoUrl: e.target.value})} className="bg-black/40 h-14 text-white font-mono text-xs" placeholder="https://..." />
                  {firmFormData.logoUrl && <div className="w-20 h-20 bg-white p-2 rounded-xl flex items-center justify-center border border-white/10"><img src={firmFormData.logoUrl} className="max-h-full max-w-full object-contain" /></div>}
                </div>
              </div>

              <Button onClick={() => { setDocumentNonBlocking(doc(db!, 'settings', 'firm'), {...firmFormData, updatedAt: serverTimestamp()}, {merge: true}); toast({title: "Dados Salvos"}); }} className="gold-gradient h-16 rounded-xl font-black uppercase text-[11px] px-12 shadow-2xl hover:scale-[1.02] transition-all">SALVAR IDENTIDADE ESTRATÉGICA</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-0 space-y-8">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-3xl">
            <CardHeader className="p-8 border-b border-white/5 bg-[#0a0f1e] flex flex-row items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 shadow-xl"><CloudLightning className="h-6 w-6" /></div>
                <div>
                  <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">Google Workspace Hub</CardTitle>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50">SINCRONISMO E SOBERANIA DIGITAL RGMJ.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className={labelMini}>E-mail Mestre (Admin Workspace)</Label>
                  <Input value={googleConfig.masterEmail} onChange={e => setGoogleConfig({...googleConfig, masterEmail: e.target.value.toLowerCase()})} className="bg-black/40 h-14 text-white font-bold" placeholder="rgmj.adv@gmail.com" />
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                    Usado para conferência operacional. O sincronismo sempre roda com a conta Google autenticada no app.
                  </p>
                </div>
                <div className="space-y-3">
                  <Label className={labelMini}>Pasta Raiz Operacional (Google Drive)</Label>
                  <Input value={googleConfig.rootFolderId} onChange={e => setGoogleConfig({...googleConfig, rootFolderId: e.target.value})} className="bg-black/40 h-14 text-white font-mono text-xs" placeholder="Cole a URL ou o ID da pasta raiz" />
                  <p className={cn("text-[8px] font-bold uppercase", isRootFolderValid ? "text-primary/60" : "text-rose-400")}>Aceita URL ou ID. O sistema salva somente o ID real usado pela API do Drive.</p>
                  {normalizedRootFolderId && (
                    <div className="flex flex-wrap items-center gap-3 text-[9px] font-black uppercase tracking-wider">
                      <span className="text-muted-foreground">ID operacional:</span>
                      <code className="px-2 py-1 rounded bg-black/50 border border-white/5 text-primary">{normalizedRootFolderId}</code>
                      {rootFolderUrl && (
                        <a href={rootFolderUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> ABRIR PASTA
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-6">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-primary" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Runtime OAuth / Firebase Auth</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Fluxo de autenticação em uso', value: googleRuntime.authFlow },
                    { label: 'Firebase Auth Domain', value: googleRuntime.authDomain },
                    { label: 'Projeto Firebase', value: googleRuntime.projectId },
                    { label: 'Origem atual do app', value: googleRuntime.origin || 'Indisponível nesta sessão' },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2">
                      <Label className={labelMini}>{item.label}</Label>
                      <div className="text-[11px] font-black text-white break-all">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-3">
                  <Label className={labelMini}>Conta Google autenticada nesta sessão</Label>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black text-white break-all">{connectedGoogleEmail || 'Nenhuma conta autenticada'}</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                        {googleConfig.masterEmail
                          ? (isMasterEmailAligned
                              ? 'Conta autenticada alinhada com o e-mail mestre configurado.'
                              : 'A conta conectada no app é a que executa Calendar, Drive e Meet.')
                          : 'Defina um e-mail mestre se quiser auditoria de alinhamento da conta operacional.'}
                      </p>
                    </div>
                    <Badge className={cn(
                      'h-7 px-3 text-[9px] font-black uppercase border',
                      isMasterEmailAligned
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : googleConfig.masterEmail
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-white/5 text-white/60 border-white/10'
                    )}>
                      {isMasterEmailAligned ? 'ALINHADO' : googleConfig.masterEmail ? 'CONTA DIFERENTE' : 'SEM AUDITORIA'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className={labelMini}>Scopes solicitados pelo app</Label>
                  <div className="flex flex-wrap gap-2">
                    {googleRuntime.scopes.map(scope => (
                      <Badge key={scope} variant="outline" className="border-primary/20 bg-primary/10 text-primary text-[9px] font-black uppercase break-all py-1.5 px-3">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { id: 'isDriveActive', label: 'Google Drive', icon: Database },
                  { id: 'isDocsActive', label: 'Google Docs', icon: FileText },
                  { id: 'isCalendarActive', label: 'Google Calendar', icon: Calendar },
                  { id: 'isMeetActive', label: 'Google Meet', icon: Video },
                ].map(service => (
                  <div key={service.id} className="p-6 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <service.icon className="h-5 w-5 text-primary/40" />
                      <span className="text-[10px] font-black text-white uppercase">{service.label}</span>
                    </div>
                    <Switch checked={(googleConfig as any)[service.id]} onCheckedChange={v => setGoogleConfig({...googleConfig, [service.id]: v})} className="data-[state=checked]:bg-emerald-500" />
                  </div>
                ))}
              </div>

              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                Essas flags já controlam o comportamento real do app em Drive, Docs, Calendar e Meet.
              </p>

              <Button onClick={handleSaveGoogleConfig} className="gold-gradient h-14 rounded-xl font-black uppercase text-[11px] px-10 shadow-2xl">
                <Save className="h-5 w-5 mr-3" /> ATUALIZAR HUB DIGITAL
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-0 space-y-8">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-3xl">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e] flex flex-row items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 shadow-xl"><Users className="h-7 w-7" /></div>
                <div>
                  <CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">Equipe & Acessos</CardTitle>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50">GERENCIAMENTO DE SOBERANIA DIGITAL E MEMBROS.</p>
                </div>
              </div>
              <Button onClick={() => { setEditingUser(null); setIsUserDialogOpen(true); }} className="gold-gradient text-background font-black text-[10px] uppercase h-12 px-8 rounded-xl shadow-xl">
                <UserPlus className="h-4 w-4 mr-2" /> LIBERAR ACESSO
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {isTeamLoading ? (
                  <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : filteredTeam.map(member => (
                  <div key={member.id} className="p-8 flex items-center justify-between hover:bg-white/[0.01] transition-all group">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarFallback className="bg-secondary text-primary font-black uppercase">{member.name?.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h4 className="font-black text-white uppercase text-lg tracking-tight group-hover:text-primary transition-colors">{member.name}</h4>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-[9px] font-black border-white/10 text-muted-foreground uppercase">{member.role?.toUpperCase()}</Badge>
                          <span className="text-[10px] text-muted-foreground/40 font-bold lowercase">{member.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingUser(member); setUserFormData({...member}); setIsUserDialogOpen(true); }} className="h-10 w-10 text-white/20 hover:text-white"><UserCog className="h-5 w-5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, "staff_profiles", member.id))} className="h-10 w-10 text-white/10 hover:text-rose-500"><Trash2 className="h-5 w-5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MESSAGE_PLACEHOLDERS.map((p) => (
              <Card key={p.tag} className="glass border-white/5 p-8 hover:border-primary/30 transition-all group shadow-xl rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Tag className="h-10 w-10" /></div>
                <code className="text-primary font-black text-sm uppercase tracking-tight block mb-4">{p.tag}</code>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kit" className="mt-0 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {KIT_TEMPLATES.map((item) => (
              <Card key={item.id} className="bg-[#0d1117]/80 border border-white/5 p-8 hover:border-primary/30 transition-all group shadow-2xl rounded-3xl relative overflow-hidden flex flex-col items-start gap-8">
                <div className="flex items-center justify-between w-full">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <Badge variant="outline" className="border-white/10 text-muted-foreground font-black text-[8px] uppercase px-3 h-6">SISTEMA</Badge>
                </div>
                
                <h3 className="text-white font-black uppercase tracking-tight text-sm leading-tight">{item.title}</h3>
                
                <Button 
                  variant="outline" 
                  onClick={() => handleOpenMessageTemplate(item.id, item.title)}
                  className="w-full h-12 border border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-primary/10 transition-all"
                >
                  CUSTOMIZAR
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="licenca" className="mt-0">
          <Card className="glass border-primary/20 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden bg-primary/5">
            <div className="absolute top-0 right-0 p-16 opacity-5"><ShieldCheck className="h-64 w-64 text-white" /></div>
            <div className="flex items-center gap-10">
              <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
                <ShieldCheck className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Licença LexFlow ERP</h3>
                <div className="flex items-center gap-4">
                  <Badge className="bg-primary text-background font-black uppercase text-[10px] h-7 px-4 rounded-full">ATIVO • PLANO SOBERANO</Badge>
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Validade: Ilimitada (Enterprise)</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIÁLOGO CUSTOMIZAR RITO / MENSAGEM */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col h-[90vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl flex-none">
            <DialogHeader className="text-left">
              <div className="flex items-center justify-between w-full">
                <div className="space-y-1">
                  <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Configuração de Rito: {messageFormData.profileName}</DialogTitle>
                  <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground mt-1">DEFINA OS TEMPLATES DE COMUNICAÇÃO E AGENDA.</DialogDescription>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-0 h-7 px-4 text-[9px] font-black uppercase tracking-widest">Sincronisno Ativo</Badge>
              </div>
            </DialogHeader>
          </div>
          
          <ScrollArea className="flex-1 bg-[#0a0f1e]/50">
            <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Template do Calendário Google</h4>
                  </div>
                  <div className="space-y-3">
                    <Label className={labelMini}>Título do Evento na Agenda</Label>
                    <Input value={messageFormData.calendarTemplate} onChange={e => setMessageFormData({...messageFormData, calendarTemplate: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-black" />
                    <p className="text-[8px] text-primary/60 font-bold uppercase">Use as tags do dicionário para injeção dinâmica.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Template WhatsApp (Cliente)</h4>
                  </div>
                  <div className="space-y-3">
                    <Label className={labelMini}>Corpo da Mensagem de Confirmação</Label>
                    <Textarea 
                      value={messageFormData.clientTemplate} 
                      onChange={e => setMessageFormData({...messageFormData, clientTemplate: e.target.value})} 
                      className="bg-black/40 min-h-[200px] text-white text-xs font-bold leading-relaxed resize-none p-6 rounded-2xl shadow-inner focus:ring-primary/50" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className={labelMini}>Gerar Meet Link?</Label>
                      <Switch checked={messageFormData.useMeetLink} onCheckedChange={v => setMessageFormData({...messageFormData, useMeetLink: v})} className="data-[state=checked]:bg-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className={labelMini}>Notificar WhatsApp?</Label>
                      <Switch checked={messageFormData.sendWhatsApp} onCheckedChange={v => setMessageFormData({...messageFormData, sendWhatsApp: v})} className="data-[state=checked]:bg-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className={labelMini}>Antecedência Alerta (Minutos)</Label>
                    <Input type="number" value={messageFormData.reminderMinutes} onChange={e => setMessageFormData({...messageFormData, reminderMinutes: Number(e.target.value)})} className="bg-black/40 h-14 text-white font-black text-center text-lg" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-8">
                <div className="sticky top-0 space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Simulador de Entrega (WhatsApp)</h4>
                  </div>

                  <div className="bg-[#0b141a] rounded-[2rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
                    <div className="flex items-center gap-4 mb-8 relative z-10 border-b border-white/5 pb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20"><Scale className="h-5 w-5" /></div>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wider">RGMJ ADVOGADOS</p>
                        <p className="text-[8px] text-emerald-500 font-bold uppercase">Online agora</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-end relative z-10">
                      <div className="bg-[#1f2c33] p-6 rounded-tr-3xl rounded-bl-3xl rounded-br-3xl shadow-xl max-w-[90%] animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="absolute -left-3 top-0 w-0 h-0 border-t-[15px] border-t-[#1f2c33] border-l-[15px] border-l-transparent" />
                        <p className="text-white text-[13px] leading-relaxed whitespace-pre-wrap font-normal italic">{renderMessagePreview(messageFormData.clientTemplate)}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-3">
                          <span className="text-[9px] text-white/40 font-medium">{new Date().getHours()}:{new Date().getMinutes().toString().padStart(2, '0')}</span>
                          <div className="flex"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400 -mr-1.5" /><CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <Button variant="ghost" onClick={() => setIsMessageDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8">ABORTAR</Button>
            <Button onClick={handleSaveMessageTemplate} className="gold-gradient text-background font-black h-14 px-12 rounded-xl shadow-2xl uppercase text-[11px] flex items-center gap-3"><ShieldCheck className="h-5 w-5" /> CONSOLIDAR RITO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO USUÁRIOS */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogHeader><DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">{editingUser ? "Retificar Acesso" : "Novo Acesso RGMJ"}</DialogTitle></DialogHeader>
          </div>
          <div className="p-10 space-y-8 bg-[#0a0f1e]/50">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-white/70 font-bold uppercase leading-relaxed">Este e-mail é a chave de acesso Google. Certifique-se da grafia correta para sucesso no login.</p>
            </div>
            <div className="space-y-3"><Label className={labelMini}>Nome Completo *</Label><Input value={userFormData.name} onChange={(e) => setUserFormData({...userFormData, name: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-black" /></div>
            <div className="space-y-3"><Label className={labelMini}>E-mail Google *</Label><Input value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value.toLowerCase().trim()})} className="bg-black/40 h-14 text-white font-bold" placeholder="usuario@gmail.com" /></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className={labelMini}>Perfil de Comando</Label>
                <Select value={userFormData.role} onValueChange={(v) => setUserFormData({...userFormData, role: v})}>
                  <SelectTrigger className="bg-black/40 h-14 text-white font-black text-[10px] uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white"><SelectItem value="admin">ADMINISTRADOR</SelectItem><SelectItem value="lawyer">ADVOGADO</SelectItem><SelectItem value="assistant">ASSISTENTE</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className={labelMini}>Status</Label>
                <div className="h-14 flex items-center justify-between px-4 bg-black/40 rounded-xl"><span className="text-[10px] font-black text-white">{userFormData.isActive ? "ATIVO" : "BLOQUEADO"}</span><Switch checked={userFormData.isActive} onCheckedChange={(v) => setUserFormData({...userFormData, isActive: v})} className="data-[state=checked]:bg-emerald-500" /></div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsUserDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8">ABORTAR</Button>
            <Button onClick={handleSaveUser} className="gold-gradient text-background font-black h-14 px-10 rounded-xl shadow-2xl uppercase text-[11px] flex items-center gap-3"><UserCheck className="h-5 w-5" /> CONFIRMAR ACESSO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>}>
      <SettingsContent />
    </Suspense>
  )
}
