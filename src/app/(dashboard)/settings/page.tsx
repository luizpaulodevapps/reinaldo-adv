
"use client"

import { useState, useMemo } from "react"
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
  Instagram,
  ShieldCheck,
  DollarSign,
  Tag,
  FolderOpen,
  FileText,
  Database,
  Key,
  Globe,
  Plus,
  Loader2,
  Trash2,
  X,
  UserCheck
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("geral")
  const db = useFirestore()
  const { user } = useUser()

  // --- CRUD DE USUÁRIOS ---
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "lawyer"
  })

  // Busca Equipe Real do Firestore
  const staffQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user])

  const { data: team, isLoading: loadingTeam } = useCollection(staffQuery)
  
  const handleSaveSettings = () => {
    toast({
      title: "Configurações Atualizadas",
      description: "Os parâmetros estratégicos da banca foram salvos com sucesso.",
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
      const docRef = doc(db, "staff_profiles", newId)
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
            { id: "geral", label: "GERAL" },
            { id: "usuarios", label: "USUARIOS" },
            { id: "financeiro", label: "FINANCEIRO" },
            { id: "tags", label: "DICIONÁRIO DE TAGS" },
            { id: "kit", label: "KIT CLIENTE" },
            { id: "modelos", label: "MODELOS" },
            { id: "licenca", label: "LICENÇA" }
          ].map((tab) => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-primary border-2 border-transparent text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-6 transition-all rounded-lg"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab: Geral */}
        <TabsContent value="geral" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1">Dados da Instituição</CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                Informações principais que serão usadas em documentos e notificações oficiais.
              </p>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Nome do Escritório</Label>
                  <Input defaultValue="Bueno Gois Advogados e Associados" className="glass border-white/10 h-14 text-sm text-white focus:ring-primary/50" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">E-mail Administrativo</Label>
                  <Input defaultValue="contato@buenogoisadvogado.com.br" className="glass border-white/10 h-14 text-sm text-white focus:ring-primary/50" />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Endereço da Sede</Label>
                <Input defaultValue="Rua Marechal Deodoro, 1594 - Sala 2, São Bernardo do Campo / SP" className="glass border-white/10 h-14 text-sm text-white focus:ring-primary/50" />
              </div>
              <div className="pt-6">
                <Button onClick={handleSaveSettings} className="gold-gradient text-background font-black gap-3 h-14 px-12 uppercase text-[11px] tracking-widest rounded-xl">
                  <Save className="h-5 w-5" /> ATUALIZAR CADASTRO
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários (FIDELIDADE TOTAL À REFERÊNCIA) */}
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
                          {member.role || "MEMBRO"}
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
        <TabsContent value="financeiro" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1 flex items-center gap-4">
                <DollarSign className="h-8 w-8 text-primary" /> Parâmetros Financeiros
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                CONFIGURAÇÃO DE TAXAS E REPASSES.
              </p>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">DIVISÃO BASE ESCRITÓRIO (%)</Label>
                  <Input defaultValue="70" type="number" className="glass border-white/10 h-14 text-sm text-white" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">DIVISÃO BASE ADVOGADO (%)</Label>
                  <Input defaultValue="30" type="number" className="glass border-white/10 h-14 text-sm text-white" />
                </div>
              </div>
              <Button onClick={handleSaveSettings} className="gold-gradient text-background font-black gap-3 h-14 px-12 uppercase text-[11px] tracking-widest rounded-xl">
                <Save className="h-5 w-5" /> SALVAR REGRAS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tags */}
        <TabsContent value="tags" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1 flex items-center gap-4">
                <Tag className="h-8 w-8 text-primary" /> Dicionário de Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              <div className="flex flex-wrap gap-4">
                {["URGENTE", "PRAZOS CRÍTICOS", "SENTENÇA", "ACORDO"].map((tag, i) => (
                  <div key={i} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white">
                    {tag}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Kit Cliente */}
        <TabsContent value="kit" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1 flex items-center gap-4">
                <FolderOpen className="h-8 w-8 text-primary" /> Automação Drive
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-4">
              {["01. PETIÇÕES", "02. PROVAS", "03. DECISÕES"].map((folder, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs font-bold text-white tracking-widest uppercase">{folder}</span>
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
              <div className="flex items-center justify-between p-10 rounded-3xl bg-primary/5 border border-primary/20">
                <div className="space-y-3">
                  <h4 className="text-4xl font-headline font-bold text-white">Plano LexFlow Elite</h4>
                  <p className="text-xs text-muted-foreground uppercase font-bold">ASSINATURA ATIVA</p>
                </div>
                <Badge className="bg-emerald-500 text-white border-0 font-black text-[11px] uppercase px-6 h-9 rounded-full">STATUS: VITALÍCIO</Badge>
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
