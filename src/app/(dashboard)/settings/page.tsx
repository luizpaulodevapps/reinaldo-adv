
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
  Gavel,
  Calculator
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
  normalizeGoogleWorkspaceSettings,
} from "@/services/google-workspace"

const NOTIFICATION_TOPICS = [
  { id: 'prazos', label: 'PRAZOS JUDICIAIS', desc: 'ALERTAS DE PRAZOS A VENCER E VENCIDOS' },
  { id: 'audiencias', label: 'AUDIÊNCIAS', desc: 'LEMBRETES DE AUDIÊNCIAS AGENDADAS' },
  { id: 'financeiro', label: 'LANÇAMENTOS FINANCEIROS', desc: 'ENTRADAS, SAÍDAS E TÍTULOS VENCENDO' },
  { id: 'leads', label: 'NOVOS LEADS / TRIAGEM', desc: 'NOVOS LEADS E MOVIMENTAÇÕES NA TRIAGEM' },
  { id: 'tarefas', label: 'TAREFAS E DILIGÊNCIAS', desc: 'ATUALIZAÇÕES EM TAREFAS E DILIGÊNCIAS ATRIBUÍDAS' },
  { id: 'processos', label: 'MOVIMENTAÇÕES PROCESSUAIS', desc: 'PUBLICAÇÕES DJE E ANDAMENTOS DE PROCESSOS' },
  { id: 'sistema', label: 'ALERTAS DO SISTEMA', desc: 'ERROS, MANUTENÇÃO E AVISOS INTERNOS' },
  { id: 'equipe', label: 'ATIVIDADE DA EQUIPE', desc: 'AÇÕES E ATUALIZAÇÕES DOS MEMBROS DA BANCA' },
] as const

function SettingsContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "geral"
  const [activeTab, setActiveTab] = useState(initialTab)
  const db = useFirestore()
  const { user, profile, role } = useUser()

  const isAdmin = role === 'admin'

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
    const searchResult = team.filter(m => 
      m.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
    )
    const seenEmails = new Set();
    return searchResult.filter(m => {
      const email = m.email?.toLowerCase().trim();
      if (!email || seenEmails.has(email)) return false;
      seenEmails.add(email);
      return true;
    });
  }, [team, userSearchTerm])

  const [notifPrefs, setNotifPrefs] = useState<Record<string, { app: boolean; email: boolean; push: boolean }>>({})
  const [isSavingNotifPrefs, setIsSavingNotifPrefs] = useState(false)

  const notifPrefsRef = useMemoFirebase(() => (db && user) ? doc(db, 'notification_preferences', user.uid) : null, [db, user])
  const { data: storedNotifPrefs } = useDoc(notifPrefsRef)

  useEffect(() => {
    if (storedNotifPrefs) {
      setNotifPrefs(storedNotifPrefs)
    } else {
      const defaults = Object.fromEntries(NOTIFICATION_TOPICS.map(t => [t.id, { app: true, email: false, push: false }]))
      setNotifPrefs(defaults)
    }
  }, [storedNotifPrefs])

  const toggleNotifPref = (topicId: string, channel: 'app' | 'email' | 'push') => {
    setNotifPrefs(prev => ({
      ...prev,
      [topicId]: { ...prev[topicId], [channel]: !prev[topicId]?.[channel] }
    }))
  }

  const handleSaveNotifPrefs = () => {
    if (!db || !user) return
    setIsSavingNotifPrefs(true)
    setDocumentNonBlocking(
      doc(db, 'notification_preferences', user.uid),
      { ...notifPrefs, userId: user.uid, updatedAt: serverTimestamp() },
      { merge: true }
    )
    setTimeout(() => {
      setIsSavingNotifPrefs(false)
      toast({ title: "Preferências de Notificação Atualizadas" })
    }, 800)
  }

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

  const handleSaveGoogleConfig = () => {
    if (!db) return
    const normalized = normalizeGoogleWorkspaceSettings(googleConfig)
    setGoogleConfig(normalized)
    setDocumentNonBlocking(doc(db, 'settings', 'google'), { ...normalized, updatedAt: serverTimestamp() }, { merge: true })
    toast({ title: "Hub Workspace Sincronizado" })
  }

  const handleSaveUser = () => {
    if (!db || !userFormData.name || !userFormData.email) return
    const payload = {
      ...userFormData,
      name: userFormData.name.toUpperCase(),
      email: userFormData.email.toLowerCase().trim(),
      updatedAt: serverTimestamp()
    }
    setDocumentNonBlocking(doc(db!, "staff_profiles", payload.email), { ...payload, id: payload.email }, { merge: true })
    setIsUserDialogOpen(false)
    toast({ title: "Acesso Atualizado" })
  }

  const tabTriggerClass = "data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:shadow-[0_0_20px_rgba(245,208,48,0.3)] text-muted-foreground font-black text-[10px] uppercase h-full px-10 rounded-full transition-all tracking-[0.1em] border border-transparent data-[state=active]:border-black/10 shrink-0"
  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 block"

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans max-w-[1800px] mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tight uppercase tracking-tighter">Configurações do Sistema</h1>
        <p className="text-muted-foreground text-sm font-black uppercase tracking-[0.2em] opacity-60">GESTÃO DE INFRAESTRUTURA, PESSOAS E PARÂMETROS ESTRATÉGICOS.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-[#0d1117]/80 border border-white/5 p-1.5 rounded-full shadow-2xl mb-12 backdrop-blur-xl max-w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-transparent h-12 p-0 gap-1 justify-start w-max flex-nowrap">
            <TabsTrigger value="geral" className={tabTriggerClass}>Geral</TabsTrigger>
            <TabsTrigger value="seo" className={tabTriggerClass}>Google Hub</TabsTrigger>
            <TabsTrigger value="usuarios" className={tabTriggerClass}>Usuários</TabsTrigger>
            <TabsTrigger value="financeiro" className={tabTriggerClass}>Financeiro</TabsTrigger>
            <TabsTrigger value="documentos" className={tabTriggerClass}>Recibos</TabsTrigger>
            <TabsTrigger value="notificacoes" className={tabTriggerClass}>Notificações</TabsTrigger>
            <TabsTrigger value="licenca" className={tabTriggerClass}>Licença</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="geral" className="mt-0">
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
                <div className="space-y-3"><Label className={labelMini}>RAZÃO SOCIAL</Label><Input value={firmFormData.name} onChange={(e) => setFirmFormData({...firmFormData, name: e.target.value.toUpperCase()})} className="bg-black/40 border-white/10 h-14 text-white font-black" /></div>
                <div className="space-y-3"><Label className={labelMini}>CNPJ</Label><Input value={firmFormData.cnpj} onChange={(e) => setFirmFormData({...firmFormData, cnpj: maskCNPJ(e.target.value)})} className="bg-black/40 border-white/10 h-14 text-white font-mono" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3"><Label className={labelMini}>CEP</Label><Input value={firmFormData.zipCode} onChange={(e) => setFirmFormData({...firmFormData, zipCode: maskCEP(e.target.value)})} className="bg-black/40 border-white/10 h-14 text-white font-mono" /></div>
                <div className="md:col-span-2 space-y-3"><Label className={labelMini}>ENDEREÇO COMPLETO</Label><Input value={firmFormData.address} onChange={(e) => setFirmFormData({...firmFormData, address: e.target.value.toUpperCase()})} className="bg-black/40 border-white/10 h-14 text-white font-bold" /></div>
              </div>
              <Button onClick={() => { setDocumentNonBlocking(doc(db!, 'settings', 'firm'), {...firmFormData, updatedAt: serverTimestamp()}, {merge: true}); toast({title: "Dados Salvos"}); }} className="gold-gradient h-16 rounded-xl font-black uppercase text-[11px] px-12 shadow-2xl hover:scale-[1.02] transition-all text-background">SALVAR IDENTIDADE ESTRATÉGICA</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-0">
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
                  <Input value={googleConfig.masterEmail} onChange={e => setGoogleConfig({...googleConfig, masterEmail: e.target.value.toLowerCase()})} className="bg-black/40 border-white/10 h-14 text-white font-bold" />
                </div>
                <div className="space-y-3">
                  <Label className={labelMini}>Pasta Raiz Operacional (Google Drive)</Label>
                  <Input value={googleConfig.rootFolderId} onChange={e => setGoogleConfig({...googleConfig, rootFolderId: e.target.value})} className="bg-black/40 border-white/10 h-14 text-white font-mono text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5"><p className="text-[10px] font-black text-white uppercase tracking-widest">Google Drive</p><p className="text-[8px] text-muted-foreground uppercase">Automação de Pastas</p></div>
                  <Switch checked={googleConfig.isDriveActive} onCheckedChange={v => setGoogleConfig({...googleConfig, isDriveActive: v})} />
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5"><p className="text-[10px] font-black text-white uppercase tracking-widest">Google Calendar</p><p className="text-[8px] text-muted-foreground uppercase">Sincronismo de Atos</p></div>
                  <Switch checked={googleConfig.isCalendarActive} onCheckedChange={v => setGoogleConfig({...googleConfig, isCalendarActive: v})} />
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5"><p className="text-[10px] font-black text-white uppercase tracking-widest">Google Meet</p><p className="text-[8px] text-muted-foreground uppercase">Links Automáticos</p></div>
                  <Switch checked={googleConfig.isMeetActive} onCheckedChange={v => setGoogleConfig({...googleConfig, isMeetActive: v})} />
                </div>
              </div>
              <Button onClick={handleSaveGoogleConfig} className="gold-gradient h-14 rounded-xl font-black uppercase text-[11px] px-10 shadow-2xl text-background"><Save className="h-5 w-5 mr-3" /> ATUALIZAR HUB DIGITAL</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-0">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-3xl">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e] flex flex-row items-center justify-between">
              <div className="flex items-center gap-6"><div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 shadow-xl"><Users className="h-7 w-7" /></div><div><CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">Equipe & Acessos</CardTitle></div></div>
              <Button onClick={() => { setEditingUser(null); setUserFormData({ name: "", email: "", role: "lawyer", isActive: true }); setIsUserDialogOpen(true); }} className="gold-gradient text-background font-black text-[10px] uppercase h-12 px-8 rounded-xl shadow-xl"><UserPlus className="h-4 w-4 mr-2" /> LIBERAR ACESSO</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {isTeamLoading ? (
                  <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : filteredTeam.map(member => (
                  <div key={member.id} className="p-8 flex items-center justify-between hover:bg-white/[0.01] transition-all group">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-14 w-14 border-2 border-primary/20"><AvatarFallback className="bg-secondary text-primary font-black uppercase">{member.name?.substring(0, 2)}</AvatarFallback></Avatar>
                      <div className="space-y-1"><h4 className="font-black text-white uppercase text-lg tracking-tight group-hover:text-primary transition-colors">{member.name}</h4><Badge variant="outline" className="text-[9px] font-black border-white/10 text-muted-foreground uppercase">{member.role?.toUpperCase()}</Badge></div>
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

        <TabsContent value="financeiro" className="mt-0">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-3xl">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e]">
              <div className="flex items-center gap-6"><div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 shadow-xl"><Calculator className="h-7 w-7" /></div><div><CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">Parâmetros Financeiros</CardTitle></div></div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <Label className={labelMini}>Taxas & Tributação (%)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[9px] font-bold text-muted-foreground uppercase">ISS</Label><Input type="number" value={financialSettings.issRate} onChange={e => setFinancialSettings({...financialSettings, issRate: Number(e.target.value)})} className="bg-black/40 h-12 text-white font-bold" /></div>
                    <div className="space-y-2"><Label className="text-[9px] font-bold text-muted-foreground uppercase">IR Retido</Label><Input type="number" value={financialSettings.irRate} onChange={e => setFinancialSettings({...financialSettings, irRate: Number(e.target.value)})} className="bg-black/40 h-12 text-white font-bold" /></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <Label className={labelMini}>Conta Mestre da Banca</Label>
                  <div className="space-y-4">
                    <Input value={financialSettings.masterBank} onChange={e => setFinancialSettings({...financialSettings, masterBank: e.target.value.toUpperCase()})} placeholder="NOME DO BANCO" className="bg-black/40 h-12 text-white font-bold uppercase" />
                    <Input value={financialSettings.masterPix} onChange={e => setFinancialSettings({...financialSettings, masterPix: e.target.value})} placeholder="CHAVE PIX PRINCIPAL" className="bg-black/40 h-12 text-white font-bold" />
                  </div>
                </div>
              </div>
              <Button onClick={() => { setDocumentNonBlocking(doc(db!, 'settings', 'financial'), {...financialSettings, updatedAt: serverTimestamp()}, {merge: true}); toast({title: "Ajustes Financeiros Salvos"}); }} className="gold-gradient h-14 rounded-xl font-black uppercase text-[11px] px-10 shadow-2xl text-background">ATUALIZAR REGRAS FINANCEIRAS</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-0">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-3xl">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e]">
              <div className="flex items-center gap-6"><div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 shadow-xl"><Stamp className="h-7 w-7" /></div><div><CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">Identidade de Recibos</CardTitle></div></div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="space-y-6">
                <Label className={labelMini}>Template Base de Recibo</Label>
                <Textarea value={docSettings.receiptTemplate} onChange={e => setDocSettings({...docSettings, receiptTemplate: e.target.value})} className="bg-black/40 min-h-[150px] text-white text-sm leading-relaxed p-6 rounded-2xl" />
                <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-40">VARIÁVEIS: {"{{NOME_CLIENTE}}"}, {"{{VALOR}}"}, {"{{DESCRICAO}}"}</p>
              </div>
              <Button onClick={() => { setDocumentNonBlocking(doc(db!, 'settings', 'documents'), {...docSettings, updatedAt: serverTimestamp()}, {merge: true}); toast({title: "Modelos de Documento Salvos"}); }} className="gold-gradient h-14 rounded-xl font-black uppercase text-[11px] px-10 shadow-2xl text-background">SALVAR TEMPLATES DOCS</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.4)] rounded-[2.5rem] bg-[#0a0f1e]/80 relative">
            <CardHeader className="p-8 pb-6 border-b border-white/5 flex flex-row items-center gap-6 bg-black/20">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xl">
                <Bell className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">Preferências de Notificação</CardTitle>
            </CardHeader>
            
            <CardContent className="p-8 pt-10">
              <div className="rounded-[2rem] border border-white/5 bg-black/20 overflow-hidden shadow-2xl">
                <div className="grid grid-cols-[1fr_100px_100px_100px] items-center px-8 py-4 bg-white/[0.03] border-b border-white/5">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CATEGORIA DE INTELIGÊNCIA</span>
                  <span className="text-center text-[9px] font-black text-primary uppercase tracking-widest">APP</span>
                  <span className="text-center text-[9px] font-black text-primary uppercase tracking-widest">EMAIL</span>
                  <span className="text-center text-[9px] font-black text-primary uppercase tracking-widest">PUSH</span>
                </div>
                
                <div className="divide-y divide-white/5">
                  {NOTIFICATION_TOPICS.map((topic) => (
                    <div key={topic.id} className="grid grid-cols-[1fr_100px_100px_100px] items-center p-8 hover:bg-white/[0.02] transition-colors group">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-white uppercase tracking-widest group-hover:text-primary transition-colors">{topic.label}</p>
                        <p className="text-[9px] text-muted-foreground font-black uppercase opacity-40 tracking-[0.1em]">{topic.desc}</p>
                      </div>
                      
                      <div className="flex justify-center">
                        <Switch 
                          checked={notifPrefs[topic.id]?.app ?? true} 
                          onCheckedChange={() => toggleNotifPref(topic.id, 'app')} 
                          className="data-[state=checked]:bg-emerald-500 shadow-lg scale-110" 
                        />
                      </div>
                      <div className="flex justify-center">
                        <Switch 
                          checked={notifPrefs[topic.id]?.email ?? false} 
                          onCheckedChange={() => toggleNotifPref(topic.id, 'email')} 
                          className="data-[state=checked]:bg-primary/40 border-white/10 shadow-lg scale-110" 
                        />
                      </div>
                      <div className="flex justify-center">
                        <Switch 
                          checked={notifPrefs[topic.id]?.push ?? false} 
                          onCheckedChange={() => toggleNotifPref(topic.id, 'push')} 
                          className="data-[state=checked]:bg-primary/40 border-white/10 shadow-lg scale-110" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <Button 
                  onClick={handleSaveNotifPrefs} 
                  disabled={isSavingNotifPrefs}
                  className="gold-gradient h-16 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] px-16 shadow-[0_20px_50px_rgba(245,208,48,0.2)] hover:scale-105 transition-all gap-4 text-background"
                >
                  {isSavingNotifPrefs ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  SALVAR PREFERÊNCIAS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenca" className="mt-0">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-3xl">
            <CardHeader className="p-10 border-b border-white/5 bg-[#0a0f1e]">
              <div className="flex items-center gap-6"><div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl"><ShieldCheck className="h-7 w-7" /></div><div><CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">Soberania & Licença</CardTitle></div></div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-6">
                <h3 className="text-xl font-black text-primary uppercase">PLANO SOBERANIA RGMJ</h3>
                <p className="text-sm text-white/60 leading-relaxed uppercase font-bold">Licença vitalícia concedida à banca Reginaldo Gonçalves Miguel de Jesus. Uso restrito e protegido por ritos de segurança digital.</p>
                <div className="flex gap-4">
                  <Badge className="bg-emerald-500 text-white font-black px-4 py-1.5 rounded-full uppercase text-[10px]">ATIVO</Badge>
                  <Badge variant="outline" className="border-white/10 text-white/40 font-black px-4 py-1.5 rounded-full uppercase text-[10px]">VERSION 2.5.0</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between"><DialogHeader><DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">{editingUser ? "Retificar Acesso" : "Novo Acesso RGMJ"}</DialogTitle></DialogHeader></div>
          <div className="p-10 space-y-8 bg-[#0a0f1e]/50">
            <div className="space-y-3"><Label className={labelMini}>Nome Completo *</Label><Input value={userFormData.name} onChange={(e) => setUserFormData({...userFormData, name: e.target.value.toUpperCase()})} className="bg-black/40 h-14 text-white font-black" /></div>
            <div className="space-y-3"><Label className={labelMini}>E-mail Google *</Label><Input value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value.toLowerCase().trim()})} className="bg-black/40 h-14 text-white font-bold" /></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3"><Label className={labelMini}>Perfil</Label><Select value={userFormData.role} onValueChange={(v) => setUserFormData({...userFormData, role: v})}><SelectTrigger className="bg-black/40 h-14 text-white font-black text-[10px] uppercase"><SelectValue /></SelectTrigger><SelectContent className="bg-[#0d121f] text-white"><SelectItem value="admin">ADMINISTRADOR</SelectItem><SelectItem value="lawyer">ADVOGADO</SelectItem></SelectContent></Select></div>
              <div className="space-y-3"><Label className={labelMini}>Status</Label><div className="h-14 flex items-center justify-between px-4 bg-black/40 rounded-xl"><span className="text-[10px] font-black text-white">{userFormData.isActive ? "ATIVO" : "BLOQUEADO"}</span><Switch checked={userFormData.isActive} onCheckedChange={(v) => setUserFormData({...userFormData, isActive: v})} className="data-[state=checked]:bg-emerald-500" /></div></div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5"><Button variant="ghost" onClick={() => setIsUserDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12">ABORTAR</Button><Button onClick={handleSaveUser} className="gold-gradient text-background font-black h-14 px-10 rounded-xl shadow-2xl uppercase text-[11px] flex items-center gap-3"><UserCheck className="h-5 w-5" /> CONFIRMAR</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SettingsPage() {
  return (<Suspense fallback={<div className="py-24 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>}><SettingsContent /></Suspense>)
}
