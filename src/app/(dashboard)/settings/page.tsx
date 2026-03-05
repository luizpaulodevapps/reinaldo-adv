
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
  Link as LinkIcon
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
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const LEGAL_AREAS = ["Trabalhista", "Cível", "Criminal", "Família", "Previdenciário", "Tributário", "Geral"]

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

  // Busca Modelos do Firestore
  const modelsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "document_templates"), orderBy("createdAt", "desc"))
  }, [db, user])
  const { data: models, isLoading: loadingModels } = useCollection(modelsQuery)

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
            </div>
          </div>
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
                            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{(model.tags || []).length} tags ativas</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
              
              {(!models || models.length === 0) && (
                <div className="py-32 text-center opacity-20 border-2 border-dashed border-white/5 rounded-[2rem]">
                  <FileText className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-[11px] font-black uppercase tracking-[0.5em]">Nenhum modelo cadastrado no acervo.</p>
                </div>
              )}
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
