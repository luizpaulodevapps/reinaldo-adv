
"use client"

import { useState, useEffect, Suspense } from "react"
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
  Tag
} from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useDoc } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

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
  { tag: "{{SENHA_ATO}}", desc: "Senha/Código de acesso (Virtual)" },
  { tag: "{{REGRAS_CONDUCAO}}", desc: "Orientações de comportamento/vídeo" },
  { tag: "{{ALERTA_LEGAL}}", desc: "Avisos sobre revelia ou testemunhas" },
  { tag: "{{NOME_ADVOGADO}}", desc: "Nome do advogado responsável" },
  { tag: "{{DESC_CURTA}}", desc: "Breve resumo do objeto/pauta" },
]

const CALENDAR_COLORS = [
  { id: "1", name: "Lavanda (Padrão)", hex: "#a4bdfc" },
  { id: "2", name: "Sálvia", hex: "#7ae7bf" },
  { id: "3", name: "Uva", hex: "#dbadff" },
  { id: "4", name: "Flamingo", hex: "#ff887c" },
  { id: "5", name: "Banana", hex: "#fbd75b" },
  { id: "6", name: "Tangerina", hex: "#ffb878" },
  { id: "7", name: "Pavão", hex: "#46d6db" },
  { id: "8", name: "Grafite", hex: "#e1e1e1" },
  { id: "9", name: "Mirtilo", hex: "#5484ed" },
  { id: "10", name: "Manjericão", hex: "#51b749" },
  { id: "11", name: "Tomate (Crítico)", hex: "#dc2127" },
]

const DEFAULT_TEMPLATES = {
  "Audiência Física": {
    profileName: "AUDIÊNCIA PRESENCIAL RGMJ",
    calendarTemplate: "Título: 🏛️ AUDIÊNCIA FÍSICA: {{NOME_CLIENTE}}\n\nLOCALIZAÇÃO:\nEndereço: {{LOCAL_ATO}}\nFórum/Vara: {{FORUM_VARA}}\n\nPROCESSO: {{NUMERO_PROCESSO}}\n\nALERTA:\n{{ALERTA_LEGAL}}",
    clientTemplate: "Prezado(a) {{NOME_CLIENTE}},\n\nConfirmamos sua AUDIÊNCIA PRESENCIAL no dia {{DATA_ATO}} às {{HORA_ATO}}.\n\nENDEREÇO: {{LOCAL_ATO}}\nFórum: {{FORUM_VARA}}\n\nIMPORTANTE: Chegar com 30 minutos de antecedência portando RG original.\n\nAtenciosamente,\nRGMJ Advogados.",
    reminderMinutes: 120,
    calendarColorId: "11",
    useMeetLink: false,
    sendWhatsApp: true
  },
  "Audiência Virtual": {
    profileName: "AUDIÊNCIA VIRTUAL (TELEPRESENCIAL)",
    calendarTemplate: "Título: 🖥️ AUDIÊNCIA VIRTUAL: {{NOME_CLIENTE}}\n\nACESSO DIGITAL:\nLink: {{LINK_ATO}}\nSenha: {{SENHA_ATO}}\n\nPROCESSO: {{NUMERO_PROCESSO}}\n\nREGRAS:\n{{REGRAS_CONDUCAO}}",
    clientTemplate: "Olá {{NOME_CLIENTE}},\n\nSua AUDIÊNCIA VIRTUAL está confirmada para o dia {{DATA_ATO}} às {{HORA_ATO}}.\n\nLINK DE ACESSO: {{LINK_ATO}}\nSENHA: {{SENHA_ATO}}\n\nINSTRUÇÕES:\n1. Conecte-se 15 minutos antes.\n2. Utilize fones de ouvido.\n3. Esteja em ambiente silencioso.\n\n{{ALERTA_LEGAL}}",
    reminderMinutes: 60,
    calendarColorId: "9",
    useMeetLink: true,
    sendWhatsApp: true
  },
  "Atendimento": {
    profileName: "TRIAGEM INICIAL (LEAD)",
    calendarTemplate: "Título: ⚡ ATENDIMENTO: {{NOME_CLIENTE}}\n\nSALA DE VIDEO: {{LINK_ATO}}\n\nBREVE RELATO:\n{{DESC_CURTA}}",
    clientTemplate: "Olá {{NOME_CLIENTE}},\n\nAgendamos seu atendimento com o Dr. Reinaldo Gonçalves para o dia {{DATA_ATO}} às {{HORA_ATO}}.\n\nLink da sala virtual: {{LINK_ATO}}\n\nAté breve!",
    reminderMinutes: 30,
    calendarColorId: "7",
    useMeetLink: true,
    sendWhatsApp: true
  },
  "Prazo": {
    profileName: "ALERTA DE PRAZO JUDICIAL",
    calendarTemplate: "Título: ⏰ PRAZO: {{NUMERO_PROCESSO}} - {{DESC_CURTA}}\n\nPROVIDÊNCIA:\n{{ALERTA_LEGAL}}\n\nRESPONSÁVEL: {{NOME_ADVOGADO}}",
    clientTemplate: "",
    reminderMinutes: 1440,
    calendarColorId: "4",
    useMeetLink: false,
    sendWhatsApp: false
  }
}

function SettingsContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "geral"
  const [activeTab, setActiveTab] = useState(initialTab)
  const db = useFirestore()
  const { user, profile } = useUser()

  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<any>(null)
  const [modelFormData, setModelFormData] = useState({
    title: "",
    area: "Trabalhista",
    googleDocId: "",
    tags: ""
  })

  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [editingMessage, setEditingMessage] = useState<any>(null)
  const [lastFocusedField, setLastFocusedField] = useState<"calendar" | "client">("calendar")
  const [messageFormData, setMessageFormData] = useState({
    profileName: "",
    eventType: "Audiência Virtual",
    calendarTemplate: "",
    clientTemplate: "",
    isActive: true,
    reminderMinutes: 60,
    calendarColorId: "1",
    useMeetLink: true,
    sendWhatsApp: true
  })

  const [loadingFirmCep, setLoadingFirmCep] = useState(false)
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
    email: ""
  })

  const [googleConfig, setGoogleConfig] = useState({
    masterEmail: "financeiro@rgmj.com.br",
    rootFolderId: "",
    clientId: "",
    isDriveActive: true,
    isDocsActive: true,
    isCalendarActive: true,
    isTasksActive: true,
    isMeetActive: true
  })

  // Carregamento de Configurações do Banco
  const firmRef = useMemoFirebase(() => db ? doc(db, 'settings', 'firm') : null, [db])
  const { data: firmData } = useDoc(firmRef)

  const googleRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleData } = useDoc(googleRef)

  useEffect(() => {
    if (firmData) setFirmFormData(prev => ({ ...prev, ...firmData }))
  }, [firmData])

  useEffect(() => {
    if (googleData) setGoogleConfig(prev => ({ ...prev, ...googleData }))
  }, [googleData])

  const modelsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "document_templates"), orderBy("createdAt", "desc"))
  }, [db, user])
  const { data: models, isLoading: loadingModels } = useCollection(modelsQuery)

  const messagesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "notification_templates"), orderBy("createdAt", "desc"))
  }, [db, user])
  const { data: messageTemplates, isLoading: loadingMessages } = useCollection(messagesQuery)

  const [drawerWidth, setDrawerWidth] = useState("extra-largo") 

  const [profileFormData, setProfileFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || ""
  })

  useEffect(() => {
    if (profile) {
      setProfileFormData({
        name: profile.name || "",
        email: profile.email || ""
      })
      if (profile.themePreferences) {
        setDrawerWidth(profile.themePreferences.drawerWidth || "extra-largo")
      }
    }
  }, [profile])

  const handleUpdateMyProfile = () => {
    if (!user || !db || !profileFormData.name) return
    const docRef = doc(db!, "staff_profiles", user.uid)
    updateDocumentNonBlocking(docRef, {
      name: profileFormData.name.toUpperCase(),
      updatedAt: serverTimestamp()
    })
    toast({ title: "Perfil Atualizado" })
  }

  const handleSaveGoogleConfig = () => {
    if (!db) return
    const docRef = doc(db, 'settings', 'google')
    setDocumentNonBlocking(docRef, {
      ...googleConfig,
      updatedAt: serverTimestamp()
    }, { merge: true })
    toast({ title: "Gateway Google Sincronizado" })
  }

  const handleApplyTheme = () => {
    if (!user || !db) return
    const docRef = doc(db!, "staff_profiles", user.uid)
    updateDocumentNonBlocking(docRef, {
      themePreferences: { drawerWidth, updatedAt: new Date().toISOString() },
      updatedAt: serverTimestamp()
    })
    toast({ title: "Preferências Salvas" })
  }

  const handleSaveFirmProfile = () => {
    if (!db || !firmFormData.name) return
    const docRef = doc(db, 'settings', 'firm')
    setDocumentNonBlocking(docRef, {
      ...firmFormData,
      name: firmFormData.name.toUpperCase(),
      updatedAt: serverTimestamp()
    }, { merge: true })
    toast({ title: "Dados da Banca Atualizados" })
  }

  const handleFirmCepBlur = async () => {
    const cep = firmFormData.zipCode.replace(/\D/g, "")
    if (cep.length !== 8) return
    setLoadingFirmCep(true)
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
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingFirmCep(false)
    }
  }

  const handleOpenCreateModel = () => {
    setEditingModel(null)
    setModelFormData({ title: "", area: "Trabalhista", googleDocId: "", tags: "" })
    setIsModelDialogOpen(true)
  }

  const handleOpenEditModel = (model: any) => {
    setEditingModel(model)
    setModelFormData({
      title: model.title,
      area: model.area,
      googleDocId: model.googleDocId || "",
      tags: (model.tags || []).join(", ")
    })
    setIsModelDialogOpen(true)
  }

  const handleSaveModel = () => {
    if (!db || !modelFormData.title) return
    const tagsArray = modelFormData.tags.split(",").map(t => t.trim().toUpperCase()).filter(t => t !== "")
    const payload = {
      title: modelFormData.title.toUpperCase(),
      area: modelFormData.area,
      googleDocId: modelFormData.googleDocId,
      tags: tagsArray,
      updatedAt: serverTimestamp()
    }
    if (editingModel) {
      updateDocumentNonBlocking(doc(db!, "document_templates", editingModel.id), payload)
    } else {
      addDocumentNonBlocking(collection(db!, "document_templates"), { ...payload, createdAt: serverTimestamp() })
    }
    setIsModelDialogOpen(false)
    toast({ title: "Acervo Atualizado" })
  }

  const handleDeleteModel = (id: string) => {
    if (!db || !confirm("Remover este modelo?")) return
    deleteDocumentNonBlocking(doc(db!, "document_templates", id))
    toast({ variant: "destructive", title: "Modelo Removido" })
  }

  const handleOpenCreateMessage = () => {
    setEditingMessage(null)
    setMessageFormData({
      profileName: "",
      eventType: "Audiência Virtual",
      calendarTemplate: "",
      clientTemplate: "",
      isActive: true,
      reminderMinutes: 60,
      calendarColorId: "1",
      useMeetLink: true,
      sendWhatsApp: true
    })
    setIsMessageDialogOpen(true)
  }

  const loadDefaultTemplate = (type: string) => {
    const preset = DEFAULT_TEMPLATES[type as keyof typeof DEFAULT_TEMPLATES]
    if (preset) {
      setMessageFormData({
        ...messageFormData,
        ...preset,
        eventType: type,
        isActive: true
      })
      toast({ title: `Modelo de ${type} Carregado` })
    }
  }

  const handleOpenEditMessage = (template: any) => {
    setEditingMessage(template)
    setMessageFormData({ ...messageFormData, ...template })
    setIsMessageDialogOpen(true)
  }

  const handleInjectTag = (tag: string) => {
    const field = lastFocusedField === "calendar" ? "calendarTemplate" : "clientTemplate"
    const currentValue = (messageFormData[field as keyof typeof messageFormData] || "") as string
    setMessageFormData(prev => ({
      ...prev,
      [field]: currentValue + ` ${tag}`
    }))
  }

  const handleSaveMessageTemplate = () => {
    if (!db || !messageFormData.profileName) {
      toast({ variant: "destructive", title: "Nome do perfil é obrigatório" })
      return
    }
    const payload = {
      ...messageFormData,
      profileName: messageFormData.profileName.toUpperCase(),
      updatedAt: serverTimestamp()
    }
    if (editingMessage) {
      updateDocumentNonBlocking(doc(db!, "notification_templates", editingMessage.id), payload)
    } else {
      addDocumentNonBlocking(collection(db!, "notification_templates"), { ...payload, createdAt: serverTimestamp() })
    }
    setIsMessageDialogOpen(false)
    toast({ title: "Perfil de Notificação Salvo" })
  }

  const handleDeleteMessageTemplate = (id: string) => {
    if (!db || !confirm("Remover este perfil de notificação?")) return
    deleteDocumentNonBlocking(doc(db!, "notification_templates", id))
    toast({ variant: "destructive", title: "Perfil Removido" })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tight uppercase tracking-tighter">Configurações do Sistema</h1>
        <p className="text-muted-foreground text-sm font-black uppercase tracking-[0.2em] opacity-60">
          GESTÃO DE INFRAESTRUTURA, PESSOAS E PARÂMETROS ESTRATÉGICOS.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/5 h-14 p-1 gap-1 w-full justify-start rounded-xl overflow-x-auto scrollbar-hide mb-10">
          <TabsTrigger value="geral" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">Geral</TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">SEO & Analytics</TabsTrigger>
          <TabsTrigger value="usuarios" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">Usuarios</TabsTrigger>
          <TabsTrigger value="financeiro" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">Financeiro</TabsTrigger>
          <TabsTrigger value="tags" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">Dicionário de Tags</TabsTrigger>
          <TabsTrigger value="kit" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">Kit Cliente</TabsTrigger>
          <TabsTrigger value="modelos" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">Modelos</TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">Backup</TabsTrigger>
          <TabsTrigger value="licenca" className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-black text-[11px] uppercase h-full px-8 rounded-lg transition-all">Licença</TabsTrigger>
        </TabsList>

        {/* --- ABA GERAL --- */}
        <TabsContent value="geral" className="mt-0 space-y-10">
          {/* Dados da Banca */}
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-[#0a0f1e] flex flex-row items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">Identidade Institucional</CardTitle>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50">DADOS OFICIAIS DA SEDE RGMJ.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">RAZÃO SOCIAL / NOME DA BANCA</Label>
                  <Input value={firmFormData.name} onChange={(e) => setFirmFormData({...firmFormData, name: e.target.value.toUpperCase()})} className="glass border-white/10 h-14 text-white font-black text-sm" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">CNPJ DA BANCA</Label>
                  <Input value={firmFormData.cnpj} onChange={(e) => setFirmFormData({...firmFormData, cnpj: e.target.value})} className="glass border-white/10 h-14 text-white font-mono text-sm" placeholder="00.000.000/0000-00" />
                </div>
              </div>

              <div className="border-t border-white/5 pt-10 space-y-8">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Localização da Sede</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">CEP</Label>
                    <div className="relative">
                      <Input value={firmFormData.zipCode} onChange={(e) => setFirmFormData({...firmFormData, zipCode: e.target.value})} onBlur={handleFirmCepBlur} className="glass border-white/10 h-12 text-white font-mono" placeholder="00000-000" />
                      {loadingFirmCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">LOGRADOURO</Label>
                    <Input value={firmFormData.address} onChange={(e) => setFirmFormData({...firmFormData, address: e.target.value.toUpperCase()})} className="glass border-white/10 h-12 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">NÚMERO</Label>
                    <Input value={firmFormData.number} onChange={(e) => setFirmFormData({...firmFormData, number: e.target.value})} className="glass border-white/10 h-12 text-white" />
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveFirmProfile} className="gold-gradient h-14 rounded-xl font-black uppercase text-[11px] tracking-widest px-10 shadow-2xl hover:scale-[1.02] transition-transform">
                <Save className="h-5 w-5 mr-3" /> SALVAR DADOS DA BANCA
              </Button>
            </CardContent>
          </Card>

          {/* Meu Perfil */}
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-[#0a0f1e]">
              <div className="flex items-center gap-6">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarFallback className="text-xl font-black text-primary bg-secondary uppercase">{profileFormData.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">Meu Perfil</CardTitle>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50">CONFIGURAÇÕES DE USUÁRIO.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">NOME DE EXIBIÇÃO</Label>
                  <Input value={profileFormData.name} onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value.toUpperCase()})} className="glass border-white/10 h-14 text-white font-bold" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">INTERFACE (DRAWER)</Label>
                  <Select value={drawerWidth} onValueChange={setDrawerWidth}>
                    <SelectTrigger className="glass border-white/10 h-14 text-white font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      <SelectItem value="padrão">PADRÃO</SelectItem>
                      <SelectItem value="largo">LARGO</SelectItem>
                      <SelectItem value="extra-largo">EXTRA-LARGO</SelectItem>
                      <SelectItem value="full">MAXIMIZADO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={handleUpdateMyProfile} className="gold-gradient text-background font-black gap-3 h-14 px-10 uppercase text-[11px] rounded-xl">
                  <Save className="h-5 w-5" /> SALVAR MEUS DADOS
                </Button>
                <Button onClick={handleApplyTheme} variant="outline" className="border-white/10 text-white font-black h-14 px-8 uppercase text-[11px] rounded-xl hover:bg-white/5">
                  APLICAR TEMA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ABA SEO & ANALYTICS --- */}
        <TabsContent value="seo" className="mt-0 space-y-10">
          <Card className="glass border-primary/20 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-[#0a0f1e] flex flex-row items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl">
                  <CloudLightning className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">Google Workspace Hub</CardTitle>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">INFRAESTRUTURA DE APIS RGMJ.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Gateway Ativo</span>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">CONTA MESTRE (ADMIN)</Label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                    <Input value={googleConfig.masterEmail} onChange={(e) => setGoogleConfig({...googleConfig, masterEmail: e.target.value})} className="glass border-white/10 h-14 pl-12 text-white font-bold" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">CLIENT ID (OAUTH 2.0)</Label>
                  <Input value={googleConfig.clientId} onChange={(e) => setGoogleConfig({...googleConfig, clientId: e.target.value})} className="glass border-white/10 h-14 text-white font-mono text-xs" />
                </div>
              </div>
              <Button onClick={handleSaveGoogleConfig} className="gold-gradient h-14 rounded-xl font-black uppercase text-[11px] tracking-widest px-10 shadow-2xl">
                <Save className="h-5 w-5 mr-3" /> SINCRONIZAR GATEWAY GOOGLE
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ABA USUARIOS --- */}
        <TabsContent value="usuarios" className="mt-0">
          <div className="py-24 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-6 opacity-30">
            <Users className="h-14 w-14 text-primary mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.4em]">Gestão de Hierarquia</p>
              <p className="text-[10px] font-bold uppercase tracking-widest">Consulte a aba EQUIPE no menu lateral para gerenciar acessos.</p>
            </div>
          </div>
        </TabsContent>

        {/* --- ABA FINANCEIRO --- */}
        <TabsContent value="financeiro" className="mt-0">
          <div className="py-24 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-6 opacity-30">
            <CreditCard className="h-14 w-14 text-primary mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.4em]">Parâmetros Fiscais</p>
              <p className="text-[10px] font-bold uppercase tracking-widest">Configuração de impostos e taxas da banca em desenvolvimento.</p>
            </div>
          </div>
        </TabsContent>

        {/* --- ABA DICIONARIO DE TAGS --- */}
        <TabsContent value="tags" className="mt-0 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MESSAGE_PLACEHOLDERS.map((p) => (
              <Card key={p.tag} className="glass border-white/5 p-6 hover:border-primary/30 transition-all group shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <code className="text-primary font-black text-sm uppercase tracking-tight">{p.tag}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => {
                    navigator.clipboard.writeText(p.tag)
                    toast({ title: "Tag Copiada!" })
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* --- ABA KIT CLIENTE --- */}
        <TabsContent value="kit" className="mt-0 space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/5 pb-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Perfis de Comunicação</h2>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50">TEMPLATES PADRONIZADOS RGMJ.</p>
            </div>
            <Button onClick={handleOpenCreateMessage} className="gold-gradient font-black text-xs uppercase tracking-widest h-14 px-10 rounded-xl gap-3 shadow-2xl">
              <Plus className="h-5 w-5" /> NOVO PERFIL DE NOTIFICAÇÃO
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(DEFAULT_TEMPLATES).map(([type, template]) => (
              <Card key={type} className="glass border-white/5 p-8 hover:border-primary/40 transition-all group shadow-2xl flex flex-col h-full rounded-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                    {type.includes("Virtual") ? <Video className="h-6 w-6" /> : type === "Prazo" ? <Clock className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/30 text-primary px-3">SISTEMA</Badge>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-6 flex-1">{type}</h3>
                <Button variant="outline" onClick={() => loadDefaultTemplate(type)} className="w-full h-12 text-[10px] font-black uppercase border-primary/30 text-primary hover:bg-primary hover:text-background rounded-xl">Customizar</Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* --- ABA MODELOS --- */}
        <TabsContent value="modelos" className="mt-0 space-y-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Acervo de Minutas</h2>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50">KITS DOCUMENTAIS ESTRATÉGICOS.</p>
            </div>
            <Button onClick={handleOpenCreateModel} className="gold-gradient font-black text-xs uppercase tracking-widest h-14 px-10 rounded-xl shadow-2xl">
              <Plus className="h-5 w-5 mr-3" /> NOVO MODELO
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models?.map((model) => (
              <Card key={model.id} className="glass border-white/5 p-8 hover:border-primary/40 transition-all group shadow-2xl rounded-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEditModel(model)} className="text-white/20 hover:text-white bg-white/5 p-2 rounded-lg transition-colors"><Settings2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteModel(model.id)} className="text-white/20 hover:text-rose-500 bg-white/5 p-2 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-4">{model.title}</h3>
                <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary bg-primary/5">{model.area}</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* --- ABA BACKUP --- */}
        <TabsContent value="backup" className="mt-0">
          <div className="py-24 border-2 border-dashed border-white/5 rounded-3xl text-center space-y-6 opacity-30">
            <History className="h-14 w-14 text-primary mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.4em]">Soberania de Dados</p>
              <p className="text-[10px] font-bold uppercase tracking-widest">O sistema realiza backups automáticos diários em Google Cloud Storage.</p>
            </div>
          </div>
        </TabsContent>

        {/* --- ABA LICENÇA --- */}
        <TabsContent value="licenca" className="mt-0">
          <Card className="glass border-primary/20 p-10 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5"><ShieldCheck className="h-40 w-40" /></div>
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-widest">Licença LexFlow ERP</h3>
                <p className="text-[11px] text-primary font-black uppercase tracking-widest">STATUS: ATIVO • PLANO ESTRATÉGICO</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOGS (Modelos e Mensagens) mantidos da versão anterior, apenas com refinos de UI */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[700px] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                {editingModel ? "Retificar Modelo" : "Novo Modelo Estratégico"}
              </DialogTitle>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-10 space-y-8 bg-[#0a0f1e]/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">TÍTULO DA MINUTA *</Label>
                  <Input value={modelFormData.title} onChange={(e) => setModelFormData({...modelFormData, title: e.target.value.toUpperCase()})} className="glass border-white/10 h-14 text-white font-black text-sm" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">ÁREA DE ATUAÇÃO</Label>
                  <Select value={modelFormData.area} onValueChange={(v) => setModelFormData({...modelFormData, area: v})}>
                    <SelectTrigger className="glass border-white/10 h-14 text-white uppercase text-[11px] font-black tracking-widest"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      {LEGAL_AREAS.map(area => <SelectItem key={area} value={area}>{area.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">ID GOOGLE DOC (MODELO BASE)</Label>
                <Input value={modelFormData.googleDocId} onChange={(e) => setModelFormData({...modelFormData, googleDocId: e.target.value})} className="glass border-white/10 h-14 text-white font-mono text-xs" />
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-primary uppercase tracking-widest">TAGS DINÂMICAS (SEPARAR POR VÍRGULA)</Label>
                <Input value={modelFormData.tags} onChange={(e) => setModelFormData({...modelFormData, tags: e.target.value})} className="glass border-primary/20 h-14 text-white font-bold text-xs" placeholder="{{NOME}}, {{CPF}}, {{DATA}}..." />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsModelDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8">ABORTAR</Button>
            <Button onClick={handleSaveModel} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-10 h-14 rounded-xl shadow-2xl">SALVAR ACERVO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[1100px] w-[95vw] h-[90vh] p-0 overflow-hidden shadow-2xl font-sans flex flex-col rounded-3xl">
          <div className="flex-none p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between z-10 shadow-xl">
            <DialogHeader><DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">{editingMessage ? "Retificar Perfil" : "Novo Rito de Notificação"}</DialogTitle></DialogHeader>
          </div>
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            <div className="lg:col-span-8 h-full flex flex-col border-r border-white/5 bg-[#0a0f1e]/50 overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-10 space-y-10 pb-32">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">NOME DO PERFIL ESTRATÉGICO *</Label>
                      <Input value={messageFormData.profileName} onChange={(e) => setMessageFormData({...messageFormData, profileName: e.target.value.toUpperCase()})} className="glass border-white/10 h-14 text-white font-black text-sm" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">TIPO DE ATO</Label>
                      <Select value={messageFormData.eventType} onValueChange={(v) => setMessageFormData({...messageFormData, eventType: v})}>
                        <SelectTrigger className="glass border-white/10 h-14 text-white font-black uppercase text-[11px] tracking-widest"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#0d121f] text-white">
                          <SelectItem value="Audiência Física">🏛️ AUDIÊNCIA FÍSICA</SelectItem>
                          <SelectItem value="Audiência Virtual">🖥️ AUDIÊNCIA VIRTUAL</SelectItem>
                          <SelectItem value="Atendimento">⚡ ATENDIMENTO</SelectItem>
                          <SelectItem value="Prazo">⏰ PRAZO JUDICIAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 space-y-6">
                    <Label className="text-[11px] font-black text-primary uppercase tracking-widest">CONTEÚDO DO ATO (AGENDA/WHATSAPP)</Label>
                    <Textarea onFocus={() => setLastFocusedField("calendar")} value={messageFormData.calendarTemplate} onChange={(e) => setMessageFormData({...messageFormData, calendarTemplate: e.target.value})} className="glass min-h-[200px] text-white text-xs font-mono leading-relaxed resize-none p-6 rounded-2xl" placeholder="Use as tags para preenchimento dinâmico..." />
                  </div>
                </div>
              </ScrollArea>
            </div>
            <div className="lg:col-span-4 h-full bg-black/40 flex flex-col border-l border-white/5 overflow-hidden">
              <div className="p-8 border-b border-white/5 flex-none bg-black/20"><h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Tags Rápidas</h4></div>
              <ScrollArea className="flex-1">
                <div className="p-8 space-y-3">
                  {MESSAGE_PLACEHOLDERS.map((p) => (
                    <button key={p.tag} onClick={() => handleInjectTag(p.tag)} className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/50 transition-all flex flex-col gap-2 group">
                      <code className="text-primary font-black text-[10px]">{p.tag}</code>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter className="p-8 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsMessageDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8">CANCELAR</Button>
            <Button onClick={handleSaveMessageTemplate} className="gold-gradient text-background font-black h-14 px-12 rounded-xl shadow-2xl uppercase text-[11px] tracking-widest">SALVAR PERFIL</Button>
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
