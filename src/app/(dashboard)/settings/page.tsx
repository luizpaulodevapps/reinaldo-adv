
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
  Palette
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
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
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
  { tag: "{{CLIENTE_ENDERECO}}", desc: "Endereço completo capturado" },
  { tag: "{{DATA_ATO}}", desc: "Data formatada do compromisso" },
  { tag: "{{HORA_ATO}}", desc: "Horário do compromisso" },
  { tag: "{{LOCAL_ATO}}", desc: "Endereço ou Link da reunião" },
  { tag: "{{LINK_MEET}}", desc: "Link direto do Google Meet" },
  { tag: "{{NUMERO_PROCESSO}}", desc: "CNJ do processo vinculado" },
  { tag: "{{FORUM_VARA}}", desc: "Tribunal e Vara do feito" },
  { tag: "{{TIPO_ATO}}", desc: "Audiência, Atendimento ou Prazo" },
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
  "Audiência": {
    profileName: "PADRÃO AUDIÊNCIA RGMJ",
    calendarTemplate: "Título: 🏛️ AUDIÊNCIA: {{NOME_CLIENTE}}\n\nDETALHES DO PROCESSO:\nNúmero: {{NUMERO_PROCESSO}}\nLocal: {{FORUM_VARA}}\n\nOBJETO:\n{{DESC_CURTA}}\n\nLINK VIRTUAL: {{LINK_MEET}}\nResponsável: {{NOME_ADVOGADO}}",
    clientTemplate: "Prezado(a) {{NOME_CLIENTE}},\n\nConfirmamos sua AUDIÊNCIA agendada para o dia {{DATA_ATO}} às {{HORA_ATO}}.\n\nLOCAL/LINK: {{LOCAL_ATO}}\n\nPor favor, conecte-se com 15 minutos de antecedência. Caso tenha dúvidas, responda a esta mensagem.\n\nAtenciosamente,\nEquipe RGMJ Advogados.",
    reminderMinutes: 60,
    calendarColorId: "11",
    useMeetLink: true
  },
  "Atendimento": {
    profileName: "TRIAGEM INICIAL (LEAD)",
    calendarTemplate: "Título: ⚡ ATENDIMENTO: {{NOME_CLIENTE}}\n\nCONTATOS:\nWhatsApp: {{CLIENTE_WHATSAPP}}\nEmail: {{CLIENTE_EMAIL}}\n\nBREVE RELATO:\n{{DESC_CURTA}}\n\nSALA DE VIDEO: {{LINK_MEET}}",
    clientTemplate: "Olá {{NOME_CLIENTE}}, tudo bem?\n\nAgendamos seu atendimento com o Dr. Reinaldo Gonçalves para o dia {{DATA_ATO}} às {{HORA_ATO}}.\n\nVocê poderá acessar a sala virtual pelo link: {{LINK_MEET}}\n\nAté breve!",
    reminderMinutes: 30,
    calendarColorId: "9",
    useMeetLink: true
  },
  "Prazo": {
    profileName: "ALERTA DE PRAZO JUDICIAL",
    calendarTemplate: "Título: ⏰ PRAZO: {{NOME_CLIENTE}} - {{TIPO_ATO}}\n\nPROCESSO: {{NUMERO_PROCESSO}}\nPROVIDÊNCIA: {{DESC_CURTA}}\n\nSTATUS: CRÍTICO",
    clientTemplate: "",
    reminderMinutes: 1440, // 24h
    calendarColorId: "4",
    useMeetLink: false
  }
}

function SettingsContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "perfil"
  const [activeTab, setActiveTab] = useState(initialTab)
  const db = useFirestore()
  const { user, profile } = useUser()

  // Estados para Gestão de Modelos
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<any>(null)
  const [modelFormData, setModelFormData] = useState({
    title: "",
    area: "Trabalhista",
    googleDocId: "",
    tags: ""
  })

  // Estados para Mensagens & Alertas
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [editingMessage, setEditingMessage] = useState<any>(null)
  const [lastFocusedField, setLastFocusedField] = useState<"calendar" | "client">("calendar")
  const [messageFormData, setMessageFormData] = useState({
    profileName: "",
    eventType: "Audiência",
    calendarTemplate: "",
    clientTemplate: "",
    isActive: true,
    reminderMinutes: 60,
    calendarColorId: "1",
    useMeetLink: true,
    sendWhatsApp: true
  })

  // Busca Modelos do Firestore
  const modelsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "document_templates"), orderBy("createdAt", "desc"))
  }, [db, user])
  const { data: models, isLoading: loadingModels } = useCollection(modelsQuery)

  // Busca Templates de Mensagem
  const messagesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "notification_templates"), orderBy("createdAt", "desc"))
  }, [db, user])
  const { data: messageTemplates, isLoading: loadingMessages } = useCollection(messagesQuery)

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  const [drawerWidth, setDrawerWidth] = useState("extra-largo") 
  const [googleConfig, setGoogleConfig] = useState({
    masterEmail: "financeiro@rgmj.com.br",
    rootFolderId: "1A2B3C4D5E6F7G8H9I0J",
    isDriveActive: true,
    isDocsActive: true,
    isCalendarActive: false,
    isTasksActive: true,
    isMeetActive: true
  })

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
    toast({ title: "Configuração Google Salva" })
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

  // Ações de Modelos
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
      toast({ title: "Modelo Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db!, "document_templates"), {
        ...payload,
        createdAt: serverTimestamp()
      })
      toast({ title: "Modelo Cadastrado" })
    }
    setIsModelDialogOpen(false)
  }

  const handleDeleteModel = (id: string) => {
    if (!db || !confirm("Remover permanentemente este modelo do acervo?")) return
    deleteDocumentNonBlocking(doc(db!, "document_templates", id))
    toast({ variant: "destructive", title: "Modelo Removido" })
  }

  // Ações de Mensagens
  const handleOpenCreateMessage = () => {
    setEditingMessage(null)
    loadDefaultTemplate("Audiência")
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
    }
  }

  const handleOpenEditMessage = (template: any) => {
    setEditingMessage(template)
    setMessageFormData({
      ...messageFormData,
      ...template
    })
    setIsMessageDialogOpen(true)
  }

  const handleInjectTag = (tag: string) => {
    const field = lastFocusedField === "calendar" ? "calendarTemplate" : "clientTemplate"
    const currentValue = messageFormData[field as keyof typeof messageFormData] as string
    setMessageFormData(prev => ({
      ...prev,
      [field]: currentValue + ` ${tag}`
    }))
  }

  const handleSaveMessageTemplate = () => {
    if (!db || !messageFormData.profileName) return
    
    const payload = {
      ...messageFormData,
      profileName: messageFormData.profileName.toUpperCase(),
      updatedAt: serverTimestamp()
    }

    if (editingMessage) {
      updateDocumentNonBlocking(doc(db!, "notification_templates", editingMessage.id), payload)
      toast({ title: "Perfil de Mensagem Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db!, "notification_templates"), {
        ...payload,
        createdAt: serverTimestamp()
      })
      toast({ title: "Perfil de Mensagem Criado" })
    }
    setIsMessageDialogOpen(false)
  }

  const handleDeleteMessageTemplate = (id: string) => {
    if (!db || !confirm("Remover este perfil de mensagem?")) return
    deleteDocumentNonBlocking(doc(db!, "notification_templates", id))
    toast({ variant: "destructive", title: "Perfil Removido" })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <LayoutGrid className="h-3 w-3" />
        <Link href="/" className="hover:text-primary transition-colors">Início</Link>
        <ChevronRight className="h-2 w-2" />
        <span className="text-white uppercase tracking-tighter">Configurações</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-5xl font-black text-white tracking-tight uppercase tracking-tighter">Configurações</h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-60">
          GESTÃO DE PARÂMETROS ESTRATÉGICOS RGMJ ELITE.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-white/5 h-14 p-0 gap-1 w-full justify-start rounded-none mb-10 overflow-x-auto scrollbar-hide">
          {[
            { id: "perfil", label: "Meu Perfil" },
            { id: "temas", label: "Interface" },
            { id: "google", label: "Integração Google" },
            { id: "modelos", label: "Modelos de Documentos" },
            { id: "notificacoes", label: "Mensagens & Alertas" },
          ].map((tab) => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full px-6 border-b-2 border-transparent data-[state=active]:border-primary transition-all rounded-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="perfil" className="mt-0 space-y-8">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e]">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-2xl">
                  <AvatarFallback className="text-2xl font-black text-primary bg-secondary uppercase">{profileFormData.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-3xl font-black text-white uppercase tracking-tighter">Meu Perfil</CardTitle>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-50">GESTÃO DE IDENTIDADE RGMJ ELITE.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NOME COMPLETO</Label>
                  <Input value={profileFormData.name} onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value.toUpperCase()})} className="glass border-white/10 h-14 text-white uppercase font-bold" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-MAIL GOOGLE</Label>
                  <Input value={profileFormData.email} disabled className="glass border-white/5 h-14 text-muted-foreground opacity-50 cursor-not-allowed" />
                </div>
              </div>
              <Button onClick={handleUpdateMyProfile} className="bg-primary text-background font-black gap-3 h-16 px-12 uppercase text-[11px] rounded-xl shadow-lg">
                <Save className="h-5 w-5" /> SALVAR MEUS DADOS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temas" className="mt-0 space-y-8">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e]">
              <CardTitle className="text-3xl font-black text-white uppercase tracking-tighter">Interface & Navegação</CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">LARGURA OFICIAL DA GAVETA</Label>
                  <Select value={drawerWidth} onValueChange={setDrawerWidth}>
                    <SelectTrigger className="glass border-white/10 h-14 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                      <SelectItem value="padrão">PADRÃO (512PX)</SelectItem>
                      <SelectItem value="largo">LARGO (672PX)</SelectItem>
                      <SelectItem value="extra-largo">EXTRA-LARGO (896PX)</SelectItem>
                      <SelectItem value="full">TELA CHEIA (FULL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleApplyTheme} className="gold-gradient h-16 rounded-xl font-black uppercase text-[11px] tracking-widest px-12 shadow-xl">
                <Save className="h-5 w-5 mr-3" /> SALVAR PREFERÊNCIAS VISUAIS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="glass border-primary/20 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-[#0a0f1e] flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <CloudLightning className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">Google Workspace Hub</CardTitle>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Sincronização central de APIs e Serviços.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Gateway Ativo</span>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CONTA MESTRE (ADMIN)</Label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                    <Input 
                      value={googleConfig.masterEmail} 
                      onChange={(e) => setGoogleConfig({...googleConfig, masterEmail: e.target.value})}
                      className="glass border-white/10 h-14 pl-12 text-white font-bold"
                      placeholder="exemplo@suabanca.com.br"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID DA PASTA RAIZ (DRIVE)</Label>
                  <div className="relative">
                    <Database className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                    <Input 
                      value={googleConfig.rootFolderId} 
                      onChange={(e) => setGoogleConfig({...googleConfig, rootFolderId: e.target.value})}
                      className="glass border-white/10 h-14 pl-12 text-white font-mono text-xs"
                      placeholder="ID da pasta no Google Drive"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveGoogleConfig} className="gold-gradient h-16 w-full md:w-auto rounded-xl font-black uppercase text-[11px] tracking-widest px-12 shadow-xl">
                <Save className="h-5 w-5 mr-3" /> SALVAR E SINCRONIZAR GATEWAY
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modelos" className="mt-0 space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Gestão de Modelos (.DOC)</h2>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-50">KITS DOCUMENTAIS POR ÁREA JURÍDICA.</p>
            </div>
            <Button onClick={handleOpenCreateModel} className="gold-gradient font-black text-[11px] uppercase tracking-widest h-14 px-10 rounded-xl gap-3 shadow-xl">
              <Plus className="h-5 w-5" /> Novo Modelo
            </Button>
          </div>

          {loadingModels ? (
            <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
          ) : (
            <div className="space-y-12">
              {LEGAL_AREAS.map((area) => {
                const areaModels = models?.filter(m => m.area === area) || []
                if (areaModels.length === 0) return null

                return (
                  <div key={area} className="space-y-6">
                    <h4 className="text-primary font-black uppercase text-[11px] tracking-[0.3em] flex items-center gap-3">
                      <Settings2 className="h-4 w-4" /> KIT {area.toUpperCase()}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {areaModels.map((model) => (
                        <Card key={model.id} className="glass border-white/5 p-8 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden shadow-2xl">
                          <div className="flex items-start justify-between mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleOpenEditModel(model)} className="text-white/20 hover:text-white transition-colors p-2"><Settings2 className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteModel(model.id)} className="text-white/20 hover:text-rose-500 transition-colors p-2"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                          <h3 className="text-sm font-black text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{model.title}</h3>
                          <div className="flex items-center gap-2 mt-4">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{(model.tags || []).length} tags ativas</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-0 space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Perfis de Mensagem</h2>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-50">NOTIFICAÇÕES PERSONALIZADAS GOOGLE & WHATSAPP.</p>
            </div>
            <Button onClick={handleOpenCreateMessage} className="gold-gradient font-black text-[11px] uppercase tracking-widest h-14 px-10 rounded-xl gap-3 shadow-xl">
              <Plus className="h-5 w-5" /> Novo Perfil
            </Button>
          </div>

          {loadingMessages ? (
            <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {messageTemplates?.map((template) => (
                <Card key={template.id} className="glass border-white/5 p-8 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden shadow-2xl">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEditMessage(template)} className="text-white/20 hover:text-white transition-colors p-2"><Settings2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteMessageTemplate(template.id)} className="text-white/20 hover:text-rose-500 transition-colors p-2"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/30 text-primary mb-3 bg-primary/5">{template.eventType}</Badge>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight leading-tight mb-4">{template.profileName}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Lembrete: {template.reminderMinutes}m</span>
                    </div>
                    <div className={cn("flex items-center gap-1.5", template.sendWhatsApp ? "text-emerald-500" : "text-muted-foreground opacity-30")}>
                      <Smartphone className="h-3 w-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Cadastro de Modelo */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[700px] p-0 overflow-hidden shadow-2xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingModel ? "Editar Modelo de Documento" : "Novo Modelo Estratégico"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Vinculação de inteligência documental ao ecossistema RGMJ.
              </DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-10 space-y-8 bg-[#0a0f1e]/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TÍTULO DO DOCUMENTO *</Label>
                  <Input 
                    value={modelFormData.title} 
                    onChange={(e) => setModelFormData({...modelFormData, title: e.target.value.toUpperCase()})}
                    className="glass border-white/10 h-14 text-white font-black uppercase"
                    placeholder="EX: PROCURAÇÃO AD JUDICIA"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ÁREA JURÍDICA</Label>
                  <Select value={modelFormData.area} onValueChange={(v) => setModelFormData({...modelFormData, area: v})}>
                    <SelectTrigger className="glass border-white/10 h-14 text-white font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d121f] text-white">
                      {LEGAL_AREAS.map(area => <SelectItem key={area} value={area}>{area.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <LinkIcon className="h-3 w-3" /> ID DO GOOGLE DOC (TEMPLATE)
                </Label>
                <Input 
                  value={modelFormData.googleDocId} 
                  onChange={(e) => setModelFormData({...modelFormData, googleDocId: e.target.value})}
                  className="glass border-white/10 h-14 text-white font-mono text-xs"
                  placeholder="ID que aparece na URL do Documento Google"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <Hash className="h-3 w-3" /> MAPEAMENTO DE TAGS (SEPARADAS POR VÍRGULA)
                </Label>
                <Input 
                  value={modelFormData.tags} 
                  onChange={(e) => setModelFormData({...modelFormData, tags: e.target.value})}
                  className="glass border-primary/20 h-14 text-white font-bold placeholder:text-white/10"
                  placeholder="EX: {{CLIENTE_NOME}}, {{CPF}}, {{ENDERECO}}"
                />
                <p className="text-[9px] text-muted-foreground italic uppercase">Estas tags serão substituídas pelos dados reais na geração do .DOC.</p>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsModelDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest">Cancelar</Button>
            <Button onClick={handleSaveModel} className="gold-gradient text-background font-black uppercase text-[11px] px-12 h-14 rounded-xl shadow-xl">
              {editingModel ? "Atualizar Modelo" : "Confirmar Acervo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cadastro de Mensagem - Editor Ultra Inteligente */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[1100px] p-0 overflow-hidden shadow-2xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingMessage ? "Editar Perfil de Mensagem" : "Novo Perfil de Notificação"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                CONSTRUÇÃO DE NARRATIVAS TÁTICAS PARA GOOGLE CALENDAR E CLIENTES.
              </DialogDescription>
            </DialogHeader>
            {!editingMessage && (
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Carregar Base:</p>
                <Select onValueChange={(v) => loadDefaultTemplate(v)}>
                  <SelectTrigger className="w-40 glass border-white/10 h-10 text-[9px] font-black uppercase"><SelectValue placeholder="SELECIONE..." /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    <SelectItem value="Audiência">🏛️ AUDIÊNCIA</SelectItem>
                    <SelectItem value="Atendimento">⚡ ATENDIMENTO</SelectItem>
                    <SelectItem value="Prazo">⏰ PRAZO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 h-[75vh]">
            <div className="lg:col-span-8 flex flex-col border-r border-white/5 bg-[#0a0f1e]/50">
              <ScrollArea className="flex-1">
                <div className="p-10 space-y-10">
                  {/* DADOS DE IDENTIFICAÇÃO E TIPO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NOME DO PERFIL *</Label>
                      <Input 
                        value={messageFormData.profileName} 
                        onChange={(e) => setMessageFormData({...messageFormData, profileName: e.target.value.toUpperCase()})}
                        className="glass border-white/10 h-12 text-white font-black uppercase"
                        placeholder="EX: PADRÃO TRABALHISTA INICIAL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TIPO DE EVENTO</Label>
                      <Select value={messageFormData.eventType} onValueChange={(v) => loadDefaultTemplate(v)}>
                        <SelectTrigger className="glass border-white/10 h-12 text-white font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#0d121f] text-white">
                          <SelectItem value="Audiência">🏛️ AUDIÊNCIA</SelectItem>
                          <SelectItem value="Atendimento">⚡ ATENDIMENTO</SelectItem>
                          <SelectItem value="Prazo">⏰ PRAZO JUDICIAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* CONFIGURAÇÕES GOOGLE CALENDAR */}
                  <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20 space-y-8 shadow-inner">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                        <Calendar className="h-4 w-4" /> Integração Google Calendar
                      </h4>
                      <div className="flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                        <Select value={messageFormData.calendarColorId} onValueChange={(v) => setMessageFormData({...messageFormData, calendarColorId: v})}>
                          <SelectTrigger className="w-32 glass h-8 text-[8px] font-black uppercase border-primary/30"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#0d121f] text-white">
                            {CALENDAR_COLORS.map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.hex }} />
                                  {c.name.toUpperCase()}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Lembrete Antes (Minutos)</Label>
                          <span className="text-[10px] font-black text-primary uppercase">{messageFormData.reminderMinutes}m</span>
                        </div>
                        <Input 
                          type="number" 
                          value={messageFormData.reminderMinutes} 
                          onChange={(e) => setMessageFormData({...messageFormData, reminderMinutes: parseInt(e.target.value) || 0})}
                          className="glass h-10 text-white font-bold"
                        />
                      </div>
                      <div className="flex items-center justify-around bg-black/30 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-3">
                          <Switch checked={messageFormData.useMeetLink} onCheckedChange={(v) => setMessageFormData({...messageFormData, useMeetLink: v})} />
                          <Label className="text-[9px] font-black text-white uppercase cursor-pointer">Gerar Google Meet</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <FileText className="h-3 w-3" /> Descrição Técnica (Calendário Interno)
                      </Label>
                      <Textarea 
                        onFocus={() => setLastFocusedField("calendar")}
                        value={messageFormData.calendarTemplate} 
                        onChange={(e) => setMessageFormData({...messageFormData, calendarTemplate: e.target.value})}
                        className="glass border-white/10 min-h-[150px] text-white text-xs leading-relaxed font-mono focus:ring-1 focus:ring-primary/50"
                        placeholder="Ex: Título: AUDIÊNCIA - {{NOME_CLIENTE}}..."
                      />
                    </div>
                  </div>

                  {/* CONFIGURAÇÕES DE CANAIS DE CLIENTE */}
                  <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Smartphone className="h-4 w-4" /> Canal do Cliente (WA / Email)
                      </h4>
                      <div className="flex items-center gap-2">
                        <Switch checked={messageFormData.sendWhatsApp} onCheckedChange={(v) => setMessageFormData({...messageFormData, sendWhatsApp: v})} className="data-[state=checked]:bg-emerald-500" />
                        <Label className="text-[9px] font-black text-emerald-500 uppercase">Ativar WhatsApp</Label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" /> Script de Comunicação
                      </Label>
                      <Textarea 
                        onFocus={() => setLastFocusedField("client")}
                        value={messageFormData.clientTemplate} 
                        onChange={(e) => setMessageFormData({...messageFormData, clientTemplate: e.target.value})}
                        className="glass border-white/10 min-h-[150px] text-white text-xs leading-relaxed focus:ring-1 focus:ring-emerald-500/50"
                        placeholder="Olá, {{NOME_CLIENTE}}..."
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* BARRA LATERAL DE TAGS DINÂMICAS */}
            <div className="lg:col-span-4 bg-black/40 p-8 space-y-8 overflow-y-auto border-l border-white/5">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-black text-white uppercase tracking-tighter">Biblioteca de Tags</h4>
                </div>
                <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-bold tracking-widest">
                  Clique nas tags para injetar no campo selecionado (Calendário ou Cliente).
                </p>
              </div>

              <div className="space-y-3">
                {MESSAGE_PLACEHOLDERS.map((p) => (
                  <button 
                    key={p.tag}
                    onClick={() => handleInjectTag(p.tag)}
                    className="w-full text-left p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all group shadow-sm"
                  >
                    <code className="text-primary font-black text-[11px] block mb-1 group-hover:scale-105 transition-transform origin-left">{p.tag}</code>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest group-hover:text-white transition-colors">{p.desc}</p>
                  </button>
                ))}
              </div>

              <div className="pt-8 border-t border-white/5">
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex gap-4">
                  <Info className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-[9px] text-muted-foreground uppercase leading-normal font-medium italic">
                    O SISTEMA SUBSTITUIRÁ ESTAS TAGS PELOS DADOS CAPTURADOS EM ENTREVISTAS E FORMULÁRIOS AUTOMATICAMENTE.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-black/60 border-t border-white/5 flex items-center justify-between">
            <button 
              onClick={() => setIsMessageDialogOpen(false)} 
              className="text-muted-foreground uppercase font-black text-[11px] tracking-[0.2em] hover:text-white transition-colors"
            >
              DESCARTAR ALTERAÇÕES
            </button>
            <div className="flex gap-4">
              <Button onClick={handleSaveMessageTemplate} className="gold-gradient text-background font-black uppercase text-[12px] tracking-widest px-16 h-16 rounded-xl shadow-2xl hover:scale-[1.02] transition-all flex items-center gap-3">
                <ShieldCheck className="h-6 w-6" /> CONFIRMAR PERFIL TÁTICO
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></div>}>
      <SettingsContent />
    </Suspense>
  )
}
