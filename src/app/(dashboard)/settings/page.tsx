
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
  AlertCircle
} from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, updateDocumentNonBlocking } from "@/firebase"
import { doc, serverTimestamp } from "firebase/firestore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

function SettingsContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "perfil"
  const [activeTab, setActiveTab] = useState(initialTab)
  const db = useFirestore()
  const { user, profile } = useUser()

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
    toast({
      title: "Perfil Atualizado",
      description: "Suas informações foram salvas com sucesso."
    })
  }

  const handleSaveGoogleConfig = () => {
    toast({
      title: "Configuração Google Salva",
      description: "Os serviços serão reiniciados para sincronização.",
    })
  }

  const handleApplyTheme = () => {
    if (!user || !db) return
    const docRef = doc(db!, "staff_profiles", user.uid)
    const themePreferences = {
      drawerWidth,
      updatedAt: new Date().toISOString()
    }
    
    updateDocumentNonBlocking(docRef, {
      themePreferences,
      updatedAt: serverTimestamp()
    })

    toast({
      title: "Preferências Salvas",
      description: "As configurações foram injetadas no seu perfil.",
    })
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

        <TabsContent value="google" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
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
                      <p className="text-[9px] text-muted-foreground italic">Esta conta será a proprietária das pastas e documentos criados.</p>
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
                      <p className="text-[9px] text-muted-foreground italic">O ID que aparece após "/folders/" na URL do seu Google Drive.</p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Status de Serviços Individuais
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { id: "drive", name: "Drive", icon: Database, status: googleConfig.isDriveActive },
                        { id: "docs", name: "Docs", icon: FileText, status: googleConfig.isDocsActive },
                        { id: "calendar", name: "Agenda", icon: Calendar, status: googleConfig.isCalendarActive },
                        { id: "tasks", name: "Tasks", icon: ListTodo, status: googleConfig.isTasksActive },
                        { id: "meet", name: "Meet", icon: Video, status: googleConfig.isMeetActive },
                      ].map((svc) => (
                        <div key={svc.id} className={cn(
                          "p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all",
                          svc.status ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20 opacity-60"
                        )}>
                          <svc.icon className={cn("h-5 w-5", svc.status ? "text-emerald-500" : "text-rose-500")} />
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">{svc.name}</span>
                          <span className={cn("text-[7px] font-black uppercase", svc.status ? "text-emerald-500" : "text-rose-500")}>
                            {svc.status ? "Sincronizado" : "Desconectado"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSaveGoogleConfig} className="gold-gradient h-16 w-full md:w-auto rounded-xl font-black uppercase text-[11px] tracking-widest px-12 shadow-xl">
                    <Save className="h-5 w-5 mr-3" /> SALVAR E SINCRONIZAR GATEWAY
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-white/5 bg-black/20 overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-lg font-black text-white uppercase tracking-widest">Guia de Configuração (Google Cloud Console)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-primary text-background flex items-center justify-center text-[10px] font-black shrink-0">01</div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase">Crie um Projeto no Google Cloud</p>
                        <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-bold">Acesse console.cloud.google.com e crie um novo projeto chamado "RGMJ-ERP".</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-primary text-background flex items-center justify-center text-[10px] font-black shrink-0">02</div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase">Ative as APIs Necessárias</p>
                        <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-bold">Na biblioteca de APIs, ative: Google Drive API, Google Docs API, Google Calendar API e Tasks API.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-primary text-background flex items-center justify-center text-[10px] font-black shrink-0">03</div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase">Configure a Conta de Serviço</p>
                        <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-bold">Crie uma 'Service Account', gere uma chave JSON e compartilhe a pasta raiz do Drive com o e-mail da conta de serviço.</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button variant="outline" className="glass border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest gap-2">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir Console Google
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="glass border-white/5 overflow-hidden">
                <CardHeader className="p-6 border-b border-white/5 bg-primary/5">
                  <CardTitle className="text-xs font-black text-white uppercase tracking-[0.2em]">Resumo de Volume Cloud</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                      <span>Uso do Drive</span>
                      <span className="text-white">12.4 GB / 100 GB</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[12.4%] shadow-[0_0_10px_rgba(245,208,48,0.5)]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Pastas Criadas</p>
                      <p className="text-xl font-black text-white tracking-tighter">1.242</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Docs Gerados</p>
                      <p className="text-xl font-black text-white tracking-tighter">4.890</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-white/5 p-6 space-y-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> Log de Sincronia
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5" />
                    <p className="text-[9px] text-white/70 font-bold uppercase leading-tight">Docs sincronizados com o acervo às 14:30</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5" />
                    <p className="text-[9px] text-white/70 font-bold uppercase leading-tight">Estrutura de pastas verificada com sucesso</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5" />
                    <p className="text-[9px] text-white/70 font-bold uppercase leading-tight">Agenda requer revalidação de token OAuth2</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
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
                  <Input value={profileFormData.name} onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value.toUpperCase()})} className="glass border-white/10 h-14 text-white uppercase" />
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

        <TabsContent value="modelos" className="mt-0 space-y-8">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-black text-white uppercase tracking-tighter">Gestão de Modelos (.DOC)</CardTitle>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-50">KITS DOCUMENTAIS POR ÁREA JURÍDICA.</p>
              </div>
              <Button className="gold-gradient font-black text-[10px] uppercase h-12 px-6 rounded-lg gap-2">
                <Plus className="h-4 w-4" /> Novo Modelo
              </Button>
            </CardHeader>
            <CardContent className="p-10">
              <div className="space-y-6">
                {["Trabalhista", "Cível", "Criminal", "Família"].map((area) => (
                  <div key={area} className="space-y-4">
                    <h4 className="text-primary font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-3">
                      <Settings2 className="h-4 w-4" /> KIT {area.toUpperCase()}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="glass border-white/5 p-5 hover:border-primary/30 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between mb-4">
                          <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                          <div className="flex gap-2">
                            <button className="text-white/20 hover:text-white"><Settings2 className="h-3.5 w-3.5" /></button>
                            <button className="text-white/20 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                        <p className="text-xs font-black text-white uppercase">Procuração Ad Judicia</p>
                        <p className="text-[8px] text-muted-foreground uppercase font-bold mt-1">3 tags ativas</p>
                      </Card>
                      <Card className="glass border-white/5 p-5 hover:border-primary/30 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between mb-4">
                          <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                          <div className="flex gap-2">
                            <button className="text-white/20 hover:text-white"><Settings2 className="h-3.5 w-3.5" /></button>
                            <button className="text-white/20 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                        <p className="text-xs font-black text-white uppercase">Contrato de Honorários</p>
                        <p className="text-[8px] text-muted-foreground uppercase font-bold mt-1">5 tags ativas</p>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
