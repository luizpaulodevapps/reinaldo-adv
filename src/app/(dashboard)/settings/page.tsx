
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
  Palette
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

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

  // Estado do Tema (Simulação para UI)
  const [selectedTheme, setSelectedTheme] = useState("dark")

  useEffect(() => {
    if (profile) {
      setProfileFormData({
        name: profile.name,
        email: profile.email
      })
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <LayoutGrid className="h-3 w-3" />
        <Link href="/dashboard" className="hover:text-primary transition-colors">Início</Link>
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
            { id: "usuarios", label: "Usuários" },
            { id: "geral", label: "Institucional" },
            { id: "financeiro", label: "Financeiro" },
            { id: "tags", label: "Dicionário de Tags" },
            { id: "kit", label: "Kit Cliente" },
            { id: "temas", label: "Temas" },
            { id: "licenca", label: "Licença" }
          ].map((tab) => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className={cn(
                "data-[state=active]:bg-[#f5d030] data-[state=active]:text-[#0a0f1e] text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-9 px-6 transition-all rounded-md",
                tab.id === "temas" && "border border-primary/20"
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab: Temas (Nova) */}
        <TabsContent value="temas" className="mt-0 outline-none space-y-8">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e]">
              <div className="flex items-center gap-4">
                <Palette className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-3xl font-headline font-bold text-white mb-1">Personalização de Ambiente</CardTitle>
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                    Defina a identidade visual do seu Centro de Comando RGMJ.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Tema Escuro */}
                <div 
                  onClick={() => setSelectedTheme("dark")}
                  className={cn(
                    "cursor-pointer p-8 rounded-2xl border transition-all duration-500 group relative overflow-hidden",
                    selectedTheme === "dark" ? "border-primary bg-primary/5 ring-1 ring-primary/50" : "border-white/5 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center border border-white/10">
                      <Moon className="h-6 w-6 text-primary" />
                    </div>
                    {selectedTheme === "dark" && (
                      <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase px-3">ATIVO</Badge>
                    )}
                  </div>
                  <h4 className="text-xl font-headline font-bold text-white uppercase tracking-tight">Midnight Elite</h4>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Interface profunda com alto foco e zero fadiga visual. O padrão ouro da advocacia moderna.
                  </p>
                  <div className="mt-6 flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#020617] border border-white/10" />
                    <div className="w-4 h-4 rounded-full bg-[#213B37]" />
                    <div className="w-4 h-4 rounded-full bg-[#818258]" />
                  </div>
                </div>

                {/* Tema Claro Contraste */}
                <div 
                  onClick={() => setSelectedTheme("light")}
                  className={cn(
                    "cursor-pointer p-8 rounded-2xl border transition-all duration-500 group relative overflow-hidden",
                    selectedTheme === "light" ? "border-primary bg-primary/5 ring-1 ring-primary/50" : "border-white/5 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-black/10">
                      <Sun className="h-6 w-6 text-amber-500" />
                    </div>
                    {selectedTheme === "light" && (
                      <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase px-3">ATIVO</Badge>
                    )}
                  </div>
                  <h4 className="text-xl font-headline font-bold text-white uppercase tracking-tight">Institutional Light</h4>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Ambiente claro com alto contraste e foco na legibilidade textual técnica.
                  </p>
                  <div className="mt-6 flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#FFFFFF] border border-black/10" />
                    <div className="w-4 h-4 rounded-full bg-[#213B37]" />
                    <div className="w-4 h-4 rounded-full bg-[#E9E8E6]" />
                  </div>
                </div>

                {/* Tema High Contrast */}
                <div 
                  onClick={() => setSelectedTheme("contrast")}
                  className={cn(
                    "cursor-pointer p-8 rounded-2xl border transition-all duration-500 group relative overflow-hidden",
                    selectedTheme === "contrast" ? "border-primary bg-primary/5 ring-1 ring-primary/50" : "border-white/5 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center border-4 border-white">
                      <Contrast className="h-6 w-6 text-white" />
                    </div>
                    {selectedTheme === "contrast" && (
                      <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase px-3">ATIVO</Badge>
                    )}
                  </div>
                  <h4 className="text-xl font-headline font-bold text-white uppercase tracking-tight">Pure Contrast</h4>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Acessibilidade máxima com contraste absoluto entre fundo e tipografia.
                  </p>
                  <div className="mt-6 flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#000000] border border-white" />
                    <div className="w-4 h-4 rounded-full bg-[#FFFFFF]" />
                    <div className="w-4 h-4 rounded-full bg-[#f5d030]" />
                  </div>
                </div>
              </div>

              <div className="mt-12 p-8 rounded-2xl border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">Sincronizar com Sistema Operacional</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">O tema mudará automaticamente conforme as configurações do seu dispositivo.</p>
                  </div>
                  <Switch className="data-[state=checked]:bg-primary" />
                </div>
              </div>

              <div className="mt-10">
                <Button onClick={handleSaveSettings} className="gold-gradient text-background font-black gap-3 h-16 px-12 uppercase text-[11px] tracking-widest rounded-xl shadow-lg">
                  <Save className="h-5 w-5" /> APLICAR PREFERÊNCIAS VISUAIS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Meu Perfil */}
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
              <Button onClick={handleUpdateMyProfile} className="gold-gradient text-background font-black gap-3 h-16 px-12 uppercase text-[11px] tracking-widest rounded-xl shadow-lg">
                <Save className="h-5 w-5" /> SALVAR MEUS DADOS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Google Workspace */}
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

              <div className="space-y-6 pt-6 border-t border-white/5">
                <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                  <Calendar className="h-4 w-4" /> Google Calendar (Audiências)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID DA AGENDA JURÍDICA</Label>
                    <Input defaultValue="agenda.banca@rgmj.adv.br" className="glass border-white/10 h-14 text-white focus:ring-primary/50" />
                  </div>
                  <div className="flex items-center justify-between p-6 rounded-xl bg-white/[0.02] border border-white/5 h-14 mt-7">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase">Sincronizar Atos Judiciais</h4>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                  <CheckSquare className="h-4 w-4" /> Google Tasks (Prazos)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID DA LISTA DE PRAZOS</Label>
                    <Input defaultValue="TASKS_PRAZOS_CRITICOS" className="glass border-white/10 h-14 text-white focus:ring-primary/50" />
                  </div>
                  <div className="flex items-center justify-between p-6 rounded-xl bg-white/[0.02] border border-white/5 h-14 mt-7">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase">Alerta no Celular (Google Tasks)</h4>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button onClick={handleSaveSettings} className="gold-gradient text-background font-black gap-3 h-16 px-12 uppercase text-[11px] tracking-widest rounded-xl shadow-lg shadow-primary/20">
                  <Save className="h-5 w-5" /> SALVAR CONFIGURAÇÕES GOOGLE
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 bg-primary/5">
            <CardContent className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Cpu className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xl font-headline font-bold text-white uppercase tracking-tight">Status da Conexão API</h4>
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Google Workspace está operando com latência zero.
                  </div>
                </div>
              </div>
              <Button variant="outline" className="glass border-primary/20 text-primary uppercase font-black text-[10px] px-8">Testar Conectividade</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Institucional */}
        <TabsContent value="geral" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1">Dados da Instituição</CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                Informações principais da banca RGMJ para documentos oficiais.
              </p>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nome do Escritório</Label>
                  <Input defaultValue="RGMJ Advocacia de Elite" className="glass h-12 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-mail Institucional</Label>
                  <Input defaultValue="contato@rgmj.adv.br" className="glass h-12 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sede Principal</Label>
                  <Input defaultValue="Av. Paulista, 2000 - São Paulo/SP" className="glass h-12 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PABX / WhatsApp</Label>
                  <Input defaultValue="(11) 99999-9999" className="glass h-12 text-white" />
                </div>
              </div>
              <Button onClick={handleSaveSettings} className="gold-gradient text-background font-bold gap-2">
                <Save className="h-4 w-4" /> Atualizar Cadastro
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários */}
        <TabsContent value="usuarios" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e] flex flex-row items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-3xl font-headline font-bold text-white flex items-center gap-4">
                  <ShieldCheck className="h-8 w-8 text-primary" /> Gestão de Usuários
                </CardTitle>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                  CONTROLE DE ACESSOS E HIERARQUIA DA BANCA RGMJ.
                </p>
              </div>
              <Button 
                onClick={handleOpenCreateUser}
                variant="outline" 
                className="glass border-primary/20 text-primary font-black text-[11px] uppercase h-12 px-8 gap-3 rounded-lg hover:bg-primary/5 transition-all"
              >
                <Plus className="h-4 w-4" /> NOVO USUÁRIO
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTeam ? (
                <div className="py-32 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sincronizando Hierarquia...</span>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {(team || []).map((member) => (
                    <div key={member.id} className="p-8 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                      <div className="flex items-center gap-8">
                        <Avatar className="h-14 w-14 border-2 border-primary/20 bg-secondary shadow-lg">
                          <AvatarFallback className="text-[11px] font-black text-primary uppercase">
                            {member.name ? member.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold text-white uppercase tracking-tight font-headline">
                            {member.name}
                          </h4>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.1em]">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-10">
                        <Badge 
                          variant="outline" 
                          className="text-[9px] font-black text-primary border-primary/40 px-6 py-1.5 rounded-full bg-primary/5 uppercase tracking-[0.2em]"
                        >
                          {member.role?.toUpperCase() || "MEMBRO"}
                        </Badge>
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenEditUser(member)}
                            className="h-10 w-10 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <SettingsIcon className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteUser(member.id)}
                            className="h-10 w-10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Financeiro */}
        <TabsContent value="financeiro" className="mt-0 outline-none space-y-6">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1">Parâmetros Financeiros</CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                DEFINA PADRÕES PARA HONORÁRIOS, VENCIMENTOS, MOEDA E ALERTAS FINANCEIROS.
              </p>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">HONORÁRIOS PADRÃO (%)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">%</span>
                    <Input defaultValue="20" type="number" className="glass border-white/10 h-14 pl-10 text-sm text-white focus:ring-primary/50" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">VENCIMENTO PADRÃO (DIAS)</Label>
                  <Input defaultValue="30" type="number" className="glass border-white/10 h-14 text-sm text-white focus:ring-primary/50" />
                </div>
              </div>

              <div className="flex items-center justify-between p-6 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Alertas de Inadimplência</h4>
                  <p className="text-xs text-muted-foreground">Notificar gestores sobre títulos vencidos automaticamente.</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-primary" />
              </div>

              <Button onClick={handleSaveSettings} className="gold-gradient text-background font-black gap-3 h-14 px-12 uppercase text-[11px] tracking-widest rounded-xl shadow-lg">
                <Save className="h-5 w-5" /> SALVAR PARÂMETROS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tags */}
        <TabsContent value="tags" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1">Dicionário de Tags</CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                Classificação semântica para o ecossistema RGMJ.
              </p>
            </CardHeader>
            <CardContent className="p-10">
              <div className="flex flex-wrap gap-4">
                {["URGENTE", "PRAZOS CRÍTICOS", "SENTENÇA", "ACORDO", "RECURSO", "PROVAS"].map((tag, i) => (
                  <Badge key={i} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-primary hover:text-background transition-all cursor-pointer">
                    {tag}
                  </Badge>
                ))}
                <Button variant="outline" className="glass border-dashed border-white/20 h-12 px-6 text-xs font-bold gap-2">
                  <Plus className="h-4 w-4" /> NOVA TAG
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Kit Cliente */}
        <TabsContent value="kit" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1">Kit Cliente (Google Drive)</CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                Automação da estrutura de pastas para novos dossiês.
              </p>
            </CardHeader>
            <CardContent className="p-10 space-y-4">
              {["01. PETIÇÕES", "02. PROVAS", "03. DECISÕES", "04. CÁLCULOS", "05. DOCUMENTOS PESSOAIS"].map((folder, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-3">
                    <FolderOpen className="h-4 w-4 text-primary" /> {folder}
                  </span>
                  <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Licença */}
        <TabsContent value="licenca" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1 flex items-center gap-4">
                <Key className="h-8 w-8 text-primary" /> Licença LexFlow
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              <div className="flex items-center justify-between p-10 rounded-3xl bg-primary/5 border border-primary/20 shadow-2xl">
                <div className="space-y-3">
                  <h4 className="text-4xl font-headline font-bold text-white">Plano LexFlow Elite</h4>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">ASSINATURA ATIVA E BLINDADA</p>
                </div>
                <Badge className="bg-emerald-500 text-white border-0 font-black text-[11px] uppercase px-8 h-10 rounded-full shadow-lg">STATUS: VITALÍCIO</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG DE CRUD USUÁRIO */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold text-white flex items-center gap-3 uppercase tracking-tighter">
              {editingUser ? <UserCheck className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
              {editingUser ? "Editar Membro" : "Novo Membro da Equipe"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NOME COMPLETO</Label>
              <Input 
                value={userFormData.name}
                onChange={(e) => setUserFormData({...userFormData, name: e.target.value.toUpperCase()})}
                className="glass border-white/10 h-12 text-white focus:ring-primary/50 uppercase"
                placeholder="EX: LUIZ PAULO GONÇALVES"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-MAIL INSTITUCIONAL</Label>
              <Input 
                value={userFormData.email}
                onChange={(e) => setUserFormData({...userFormData, email: e.target.value.toLowerCase()})}
                className="glass border-white/10 h-12 text-white focus:ring-primary/50"
                placeholder="contato@exemplo.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PAPEL ESTRATÉGICO (ROLE)</Label>
              <Select value={userFormData.role} onValueChange={(v) => setUserFormData({...userFormData, role: v})}>
                <SelectTrigger className="glass border-white/10 h-12 text-white">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  <SelectItem value="admin">ADMINISTRADOR</SelectItem>
                  <SelectItem value="lawyer">ADVOGADO</SelectItem>
                  <SelectItem value="financial">FINANCEIRO</SelectItem>
                  <SelectItem value="assistant">ASSISTENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsUserDialogOpen(false)} className="text-muted-foreground uppercase font-bold text-[10px]">
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} className="gold-gradient text-background font-black uppercase text-[10px] tracking-widest px-8">
              Confirmar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
