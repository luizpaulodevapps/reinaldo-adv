
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Settings as SettingsIcon,
  ChevronRight,
  LayoutGrid,
  Save,
  ShieldCheck,
  Tag,
  FolderOpen,
  Key,
  Plus,
  Loader2,
  Trash2,
  UserCheck,
  Search,
  Globe,
  Database,
  BarChart3,
  Mail,
  Smartphone,
  Cloud,
  Calendar,
  CheckSquare,
  HardDrive,
  Cpu,
  Lock,
  User,
  Moon,
  Sun,
  Contrast,
  Palette,
  Type,
  Layout,
  MousePointer2,
  Paintbrush,
  Image as ImageIcon,
  Upload,
  Info,
  Scale,
  Maximize2,
  Monitor,
  MousePointerClick,
  Square,
  Fingerprint,
  Zap,
  ShieldAlert,
  Columns
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function SettingsPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "google"
  const [activeTab, setActiveTab] = useState(initialTab)
  const db = useFirestore()
  const { user, profile, role } = useUser()

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  // --- ESTADO DO LABORATÓRIO DE TEMAS ---
  const [selectedTheme, setSelectedTheme] = useState("dark")
  const [selectedFont, setSelectedFont] = useState("roboto")
  const [sidebarColor, setSidebarColor] = useState("#1e1b2e")
  const [dashboardColor, setDashboardColor] = useState("#0a0a14")
  const [accentColor, setAccentColor] = useState("#3b82f6")
  const [cardStyle, setCardStyle] = useState("glass")

  // --- ESTADO DE DRAWER & NAVEGAÇÃO ---
  const [drawerWidth, setDrawerWidth] = useState("extra-largo") 
  const [linkBehavior, setLinkBehavior] = useState("drawer") 

  // --- CRUD DE USUÁRIOS ---
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "lawyer"
  })

  // Dados para Edição do Próprio Perfil
  const [profileFormData, setProfileFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || ""
  })

  useEffect(() => {
    if (profile) {
      setProfileFormData({
        name: profile.name,
        email: profile.email
      })
      if (profile.themePreferences) {
        const tp = profile.themePreferences
        setSelectedTheme(tp.preset || "dark")
        setSelectedFont(tp.font || "roboto")
        setSidebarColor(tp.sidebarColor || "#1e1b2e")
        setDashboardColor(tp.dashboardColor || "#0a0a14")
        setAccentColor(tp.accentColor || "#3b82f6")
        setCardStyle(tp.cardStyle || "glass")
        setDrawerWidth(tp.drawerWidth || "extra-largo")
        setLinkBehavior(tp.linkBehavior || "drawer")
      }
    }
  }, [profile])

  const staffQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user])

  const { data: team, isLoading: loadingTeam } = useCollection(staffQuery)
  
  const handleSaveSettings = () => {
    toast({
      title: "Parâmetros Atualizados",
      description: "As configurações estratégicas foram salvas no ecossistema RGMJ.",
    })
  }

  const handleUpdateMyProfile = () => {
    if (!user || !profileFormData.name) return
    const docRef = doc(db, "staff_profiles", user.uid)
    updateDocumentNonBlocking(docRef, {
      name: profileFormData.name.toUpperCase(),
      updatedAt: serverTimestamp()
    })
    toast({
      title: "Perfil Atualizado",
      description: "Suas informações foram salvas com sucesso."
    })
  }

  const handleApplyTheme = () => {
    if (!user) return
    const docRef = doc(db, "staff_profiles", user.uid)
    const themePreferences = {
      preset: selectedTheme,
      font: selectedFont,
      sidebarColor,
      dashboardColor,
      accentColor,
      cardStyle,
      drawerWidth,
      linkBehavior,
      updatedAt: new Date().toISOString()
    }
    
    updateDocumentNonBlocking(docRef, {
      themePreferences,
      updatedAt: serverTimestamp()
    })

    toast({
      title: "Atmosfera Visual Aplicada",
      description: "As configurações de design e navegação foram injetadas no seu perfil.",
    })
  }

  const handleOpenCreateUser = () => {
    setEditingUser(null)
    setUserFormData({ name: "", email: "", role: "lawyer" })
    setIsUserDialogOpen(true)
  }

  const handleOpenEditUser = (staff: any) => {
    setEditingUser(staff)
    setUserFormData({
      name: staff.name,
      email: staff.email,
      role: staff.role || "lawyer"
    })
    setIsUserDialogOpen(true)
  }

  const handleSaveUser = () => {
    if (!userFormData.name || !userFormData.email) {
      toast({ variant: "destructive", title: "Campos Obrigatórios", description: "Nome e E-mail são necessários." })
      return
    }

    if (editingUser) {
      const docRef = doc(db, "staff_profiles", editingUser.id)
      updateDocumentNonBlocking(docRef, {
        ...userFormData,
        updatedAt: serverTimestamp()
      })
      toast({ title: "Usuário Atualizado", description: `${userFormData.name} teve seu perfil alterado.` })
    } else {
      const newId = crypto.randomUUID()
      addDocumentNonBlocking(collection(db, "staff_profiles"), {
        id: newId,
        googleId: "",
        ...userFormData,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      toast({ title: "Novo Usuário Criado", description: `${userFormData.name} agora faz parte da banca.` })
    }
    setIsUserDialogOpen(false)
  }

  const handleDeleteUser = (id: string) => {
    if (confirm("Deseja realmente remover este usuário da banca?")) {
      const docRef = doc(db, "staff_profiles", id)
      deleteDocumentNonBlocking(docRef)
      toast({ variant: "destructive", title: "Usuário Removido", description: "Acesso revogado com sucesso." })
    }
  }

  const applyPreset = (preset: string) => {
    setSelectedTheme(preset)
    if (preset === 'dark') {
      setSidebarColor("#1e1b2e")
      setDashboardColor("#0a0a14")
      setAccentColor("#3b82f6")
      setCardStyle("glass")
    } else if (preset === 'light') {
      setSidebarColor("#1e1b2e")
      setDashboardColor("#FFFFFF")
      setAccentColor("#1e1b2e")
      setCardStyle("solid")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <LayoutGrid className="h-3 w-3" />
        <Link href="/" className="hover:text-primary transition-colors">Início</Link>
        <ChevronRight className="h-2 w-2" />
        <span className="text-muted-foreground">Dashboard</span>
        <ChevronRight className="h-2 w-2" />
        <span className="text-white">Configurações</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-5xl font-headline font-bold text-white tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-70">
          GESTÃO DE INFRAESTRUTURA, PESSOAS E PARÂMETROS ESTRATÉGICOS DA BANCA RGMJ.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-white/5 h-14 p-0 gap-1 w-full justify-start rounded-none mb-10 overflow-x-auto scrollbar-hide">
          {[
            { id: "perfil", label: "Meu Perfil" },
            { id: "google", label: "Integração Google" },
            { id: "gov", label: "Integração Gov.br" },
            { id: "usuarios", label: "Usuários" },
            { id: "geral", label: "Institucional" },
            { id: "financeiro", label: "Financeiro" },
            { id: "tags", label: "Dicionário de Tags" },
            { id: "kit", label: "Kit Cliente" },
            { id: "temas", label: "Tema e Personalização" },
            { id: "licenca", label: "Licença" }
          ].map((tab) => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className={cn(
                "data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-9 px-6 transition-all rounded-md",
                tab.id === "gov" && "border border-primary/20"
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="temas" className="mt-0 outline-none space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              {/* SEÇÃO: NAVEGAÇÃO E COMPORTAMENTO (DRAWER CONFIG) */}
              <Card className="glass border-white/5 overflow-hidden">
                <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e]">
                  <div className="flex items-center gap-4">
                    <Columns className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-3xl font-headline font-bold text-white mb-1">Navegação e Comportamento</CardTitle>
                      <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                        Configure como os formulários e detalhes são exibidos no sistema.
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">COMPORTAMENTO DE LINKS</Label>
                      <Select value={linkBehavior} onValueChange={setLinkBehavior}>
                        <SelectTrigger className="glass border-white/10 h-14 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                          <SelectItem value="drawer">ABRIR EM DRAWER (GAVETA)</SelectItem>
                          <SelectItem value="page">ABRIR EM NOVA PÁGINA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">LARGURA OFICIAL DA GAVETA</Label>
                      <Select value={drawerWidth} onValueChange={setDrawerWidth}>
                        <SelectTrigger className="glass border-white/10 h-14 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                          <SelectItem value="padrão">PADRÃO (512PX)</SelectItem>
                          <SelectItem value="largo">LARGO (672PX)</SelectItem>
                          <SelectItem value="extra-largo">EXTRA-LARGO (896PX)</SelectItem>
                          <SelectItem value="full">TELA CHEIA (FULL)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6 rounded-xl bg-primary/5 border border-primary/20">
                    <Info className="h-5 w-5 text-primary" />
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                      O COMPORTAMENTO DE "DRAWER" É RECOMENDADO PARA MONITORES ULTRA-WIDE, PERMITINDO QUE O CONTEXTO DO DASHBOARD PERMANEÇA VISÍVEL.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* SEÇÃO: LABORATÓRIO DE IDENTIDADE */}
              <Card className="glass border-white/5 overflow-hidden">
                <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e]">
                  <div className="flex items-center gap-4">
                    <Paintbrush className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-3xl font-headline font-bold text-white mb-1">Laboratório de Atmosfera</CardTitle>
                      <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                        Customize cada detalhe da interface do Centro de Comando.
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-10 space-y-12">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                      <Layout className="h-4 w-4" /> Pacotes de Atmosfera (Presets)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { id: 'dark', label: 'Midnight Elite', icon: Moon, desc: 'Escuro Profundo' },
                        { id: 'light', label: 'Classic Law', icon: Sun, desc: 'Claro Institucional' },
                      ].map((preset) => (
                        <div 
                          key={preset.id}
                          onClick={() => applyPreset(preset.id)}
                          className={cn(
                            "cursor-pointer p-6 rounded-xl border transition-all duration-300 flex flex-col items-center text-center gap-3",
                            selectedTheme === preset.id ? "border-primary bg-primary/10" : "border-white/5 bg-white/[0.02] hover:border-white/20"
                          )}
                        >
                          <preset.icon className={cn("h-6 w-6", selectedTheme === preset.id ? "text-primary" : "text-muted-foreground")} />
                          <div>
                            <p className="text-xs font-bold text-white uppercase">{preset.label}</p>
                            <p className="text-[9px] text-muted-foreground uppercase mt-1">{preset.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                      <MousePointer2 className="h-4 w-4" /> Customização Granular de Cores
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">MENU LATERAL (SIDEBAR)</Label>
                        <div className="flex gap-2">
                          <input type="color" value={sidebarColor} onChange={(e) => setSidebarColor(e.target.value)} className="w-12 h-12 p-1 bg-transparent border-white/10 rounded-md cursor-pointer" />
                          <Input value={sidebarColor} onChange={(e) => setSidebarColor(e.target.value)} className="glass border-white/10 h-12 text-xs font-mono" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">FUNDO DO DASHBOARD</Label>
                        <div className="flex gap-2">
                          <input type="color" value={dashboardColor} onChange={(e) => setDashboardColor(e.target.value)} className="w-12 h-12 p-1 bg-transparent border-white/10 rounded-md cursor-pointer" />
                          <Input value={dashboardColor} onChange={(e) => setDashboardColor(e.target.value)} className="glass border-white/10 h-12 text-xs font-mono" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">ACENTO PRIMÁRIO (BOTÕES)</Label>
                        <div className="flex gap-2">
                          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-12 h-12 p-1 bg-transparent border-white/10 rounded-md cursor-pointer" />
                          <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="glass border-white/10 h-12 text-xs font-mono" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="sticky top-10">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <LayoutGrid className="h-3 w-3" /> Visualização Tática (Preview)
                </h4>
                
                <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl bg-[#020617]">
                  <div className="flex h-[550px]">
                    <div className="w-24 flex flex-col items-center py-8 gap-8" style={{ backgroundColor: sidebarColor }}>
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/5">
                        <Scale className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 p-10 space-y-10" style={{ backgroundColor: dashboardColor }}>
                      <div className="h-6 w-48 rounded-full bg-white/5 mb-4"></div>
                      <div className="h-56 w-full rounded-3xl border bg-white/5 border-white/10"></div>
                      <div className="h-16 w-full rounded-xl shadow-lg" style={{ backgroundColor: accentColor }}></div>
                    </div>
                  </div>
                </Card>
                <Button onClick={handleApplyTheme} className="w-full gold-gradient h-16 rounded-xl mt-6 font-black uppercase text-[11px] tracking-widest shadow-2xl">
                  <Save className="h-5 w-5 mr-2" /> APLICAR CONFIGURAÇÕES VISUAIS
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="perfil" className="mt-0 outline-none space-y-8">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e]">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-2xl">
                  <AvatarFallback className="text-2xl font-black text-primary bg-secondary uppercase">
                    {profileFormData.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-3xl font-headline font-bold text-white mb-1 uppercase tracking-tight">Meu Perfil Estratégico</CardTitle>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-50">
                    GESTÃO DE CREDENCIAIS E IDENTIDADE DIGITAL RGMJ.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NOME COMPLETO</Label>
                  <Input 
                    value={profileFormData.name}
                    onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value.toUpperCase()})}
                    className="glass border-white/10 h-14 text-white focus:ring-primary/50 uppercase" 
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-MAIL DE ACESSO</Label>
                  <Input 
                    value={profileFormData.email}
                    disabled
                    className="glass border-white/5 h-14 text-muted-foreground opacity-50 cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PAPEL (ROLE)</Label>
                  <div className="glass border-white/5 h-14 flex items-center px-4 rounded-md">
                    <Badge variant="outline" className="text-[10px] font-black text-primary border-primary/30 uppercase tracking-widest">
                      {role?.toUpperCase() || "MEMBRO"}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button onClick={handleUpdateMyProfile} className="blue-gradient text-white font-black gap-3 h-16 px-12 uppercase text-[11px] tracking-widest rounded-xl shadow-lg">
                <Save className="h-5 w-5" /> SALVAR MEUS DADOS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google" className="mt-0 outline-none space-y-8">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <Cloud className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-3xl font-headline font-bold text-white mb-1">Google Workspace Hub</CardTitle>
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                    Sincronização profunda com Drive, Calendar e Tasks para a banca RGMJ.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-12">
              <div className="space-y-6">
                <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                  <HardDrive className="h-4 w-4" /> Google Drive (Documentos)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID DA PASTA RAIZ (BANCA)</Label>
                    <Input defaultValue="1A2B3C4D5E6F7G8H9I0J" className="glass border-white/10 h-14 text-white focus:ring-primary/50" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID DA PASTA DE MODELOS</Label>
                    <Input defaultValue="MODELOS_RGMJ_MASTER" className="glass border-white/10 h-14 text-white focus:ring-primary/50" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-6 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">Criar Pastas Automaticamente</h4>
                    <p className="text-xs text-muted-foreground">Gerar estrutura do 'Kit Cliente' ao protocolar novo processo.</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                </div>
              </div>

              <div className="pt-6">
                <Button onClick={handleSaveSettings} className="blue-gradient text-white font-black gap-3 h-16 px-12 uppercase text-[11px] tracking-widest rounded-xl shadow-lg">
                  <Save className="h-5 w-5" /> SALVAR CONFIGURAÇÕES GOOGLE
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gov" className="mt-0 outline-none space-y-8">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e]">
              <div className="flex items-center gap-4">
                <Globe className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-3xl font-headline font-bold text-white mb-1 uppercase tracking-tighter">Conecta Gov (Cadastro Base)</CardTitle>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
                    GESTÃO DE ACESSO AO CADASTRO BASE DO CIDADÃO (CBC) VIA API GOV.BR.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-12">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                      <Lock className="h-4 w-4" /> Credenciais OAuth2 (Estaleiro Serpro)
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CLIENT ID (CLIENT_ID)</Label>
                        <Input 
                          placeholder="EX: 1a2b3c-4d5e-6f7g-8h9i-0j1k2l3m4n5o" 
                          className="glass border-white/10 h-14 text-white focus:ring-primary/50 font-mono text-xs" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CLIENT SECRET (CLIENT_SECRET)</Label>
                        <Input 
                          type="password"
                          placeholder="••••••••••••••••••••••••••••••••" 
                          className="glass border-white/10 h-14 text-white focus:ring-primary/50" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                      <Info className="h-4 w-4" /> Parâmetros de Endpoints
                    </h4>
                    <div className="space-y-3 font-mono text-[10px] text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-bold">TOKEN URL:</span>
                        <span className="break-all">https://apigateway.conectagov.estaleiro.serpro.gov.br/oauth2/jwt-token</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-bold">API BASE URL:</span>
                        <span className="break-all">https://apigateway.conectagov.estaleiro.serpro.gov.br/api/v1/cpf/</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                      <Zap className="h-4 w-4" /> Status e Governança
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white uppercase">Habilitar Busca CBC</p>
                          <p className="text-[10px] text-muted-foreground">Permitir injeção de dados de CPFs em tempo real.</p>
                        </div>
                        <Switch className="data-[state=checked]:bg-primary" />
                      </div>

                      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">VALIDADE DO TOKEN JWT</span>
                          <Badge variant="outline" className="text-[9px] font-black border-emerald-500/50 text-emerald-500 bg-emerald-500/5">ATIVO (120 MIN)</Badge>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-3/4" />
                        </div>
                        <p className="text-[9px] text-muted-foreground italic text-center">
                          Recomendamos armazenar o token em cache no servidor por 2 horas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-3xl border border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center gap-4">
                    <ShieldAlert className="h-10 w-10 text-primary opacity-50" />
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Requisito Institucional</p>
                      <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                        A utilização desta API requer Certificado Digital e-CNPJ da banca RGMJ vinculado ao portal Conecta Gov.
                      </p>
                    </div>
                    <Button variant="outline" className="glass border-primary/20 text-primary text-[10px] font-black uppercase h-10 px-6">Solicitar Acesso</Button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <Button variant="ghost" className="text-muted-foreground uppercase font-black text-[11px] tracking-widest">
                  Restaurar Padrão Serpro
                </Button>
                <div className="flex gap-4">
                  <Button variant="outline" className="glass border-primary/20 text-primary uppercase font-black text-[11px] px-8 h-14">Testar Autenticação</Button>
                  <Button onClick={handleSaveSettings} className="blue-gradient text-white font-black gap-3 h-14 px-12 uppercase text-[11px] tracking-widest rounded-xl shadow-lg">
                    <Save className="h-5 w-5" /> SALVAR CONFIGURAÇÕES GOV.BR
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
