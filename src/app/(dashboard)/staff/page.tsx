
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users2, 
  Search, 
  Plus, 
  Loader2, 
  Trash2,
  Settings2,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Fingerprint,
  Phone,
  Mail,
  UserCheck,
  X,
  Save,
  MapPin,
  Eye,
  Landmark,
  Share2,
  Copy,
  Lock,
  Smartphone,
  CheckCircle2,
  Crown,
  Calendar,
  Wallet,
  Scale,
  CreditCard,
  FileText,
  UserPlus,
  ExternalLink,
  ShieldAlert,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore, useCollection, useUser, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn, maskPhone, maskCPF, maskCurrency, parseCurrencyToNumber } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

const STAFF_ROLES = [
  { id: "Sócio", label: "SÓCIO(A) FUNDADOR", defaultSystemRole: 'admin' },
  { id: "Advogado", label: "ADVOGADO(A)", defaultSystemRole: 'lawyer' },
  { id: "Estagiário", label: "ESTAGIÁRIO(A)", defaultSystemRole: 'assistant' },
  { id: "Secretária", label: "SECRETÁRIA(O)", defaultSystemRole: 'assistant' },
  { id: "Financeiro", label: "FINANCEIRO", defaultSystemRole: 'financial' },
]

const PAYMENT_TYPES = [
  { id: "Mensalista", label: "MENSALISTA (FIXO)" },
  { id: "Por Demanda", label: "POR DEMANDA (VALOR POR ATO)" },
  { id: "Parceria (Porcentagem)", label: "PARCERIA (PORCENTAGEM)" },
]

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  
  const [viewingStaff, setViewingStaff] = useState<any>(null)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [invitedMember, setInvitedMember] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: "",
    role: "Advogado",
    email: "",
    phone: "",
    cpf: "",
    oabNumber: "",
    hiringDate: new Date().toISOString().split('T')[0],
    status: "Ativo",
    paymentType: "Mensalista",
    commissionPercentage: 0,
    baseSalary: 0,
    salaryFormatted: "0,00",
    createSystemAccess: true,
    isOwner: false
  })

  const db = useFirestore()
  const { user, role: userRole } = useUser()
  const { toast } = useToast()

  const canManage = userRole === 'admin'

  const staffQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "employees"), orderBy("name", "asc"))
  }, [db, user])

  const { data: employees, isLoading } = useCollection(staffQuery)

  const filtered = useMemo(() => {
    if (!employees) return []
    const searchResult = employees.filter(e => 
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Saneamento de Duplicidade: Garante unicidade por E-mail no RH
    const seenEmails = new Set();
    return searchResult.filter(e => {
      const email = e.email?.toLowerCase();
      if (!email || seenEmails.has(email)) return false;
      seenEmails.add(email);
      return true;
    });
  }, [employees, searchTerm])

  const handleSave = () => {
    if (!db || !formData.name || !formData.role || !formData.email) {
      toast({ variant: "destructive", title: "Dados Incompletos" })
      return
    }

    const emailId = formData.email.toLowerCase().trim();
    const payload = {
      ...formData,
      name: formData.name.toUpperCase(),
      email: emailId,
      baseSalary: parseCurrencyToNumber(formData.salaryFormatted),
      updatedAt: serverTimestamp()
    }

    // 1. RH Central
    setDocumentNonBlocking(doc(db!, "employees", emailId), {
      ...payload,
      id: emailId,
      createdAt: editingStaff?.createdAt || serverTimestamp()
    }, { merge: true })

    // 2. Soberania Digital
    if (formData.createSystemAccess) {
      const roleConfig = STAFF_ROLES.find(r => r.id === formData.role)
      const systemRole = roleConfig?.defaultSystemRole || 'lawyer'
      
      setDocumentNonBlocking(doc(db!, "staff_profiles", emailId), {
        id: emailId,
        name: payload.name,
        email: emailId,
        role: systemRole,
        isOwner: payload.isOwner,
        isActive: payload.status === 'Ativo',
        updatedAt: serverTimestamp()
      }, { merge: true })

      setInvitedMember({ name: payload.name, email: emailId })
      setIsInviteOpen(true)
    }

    toast({ title: editingStaff ? "Registro Atualizado" : "Membro Admitido" })
    setIsDialogOpen(false)
  }

  const handleCopyInvite = () => {
    if (!invitedMember) return
    const appUrl = window.location.origin
    const message = `Olá ${invitedMember.name}! \n\nVocê foi convidado para o Ecossistema RGMJ.\n\nE-mail liberado: ${invitedMember.email}\n\nPara entrar, acesse:\n${appUrl}/login`
    navigator.clipboard.writeText(message)
    toast({ title: "Convite Copiado!" })
  }

  const handleDeleteStaff = (id: string) => {
    if (!db) return
    if (!canManage) {
      toast({ variant: "destructive", title: "Acesso Negado" })
      return
    }
    if (confirm("Revogar este acesso permanentemente?")) {
      deleteDocumentNonBlocking(doc(db!, "employees", id))
      deleteDocumentNonBlocking(doc(db!, "staff_profiles", id))
      toast({ title: "Acesso Revogado" })
      setIsViewOpen(false)
    }
  }

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 block"
  const inputClass = "bg-black/40 border-white/10 h-12 text-white font-bold uppercase focus:ring-1 focus:ring-primary/50 rounded-xl"

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Users2 className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Equipe & Permissões</span>
          </div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Corpo Técnico RGMJ</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-60">GESTÃO DE SOBERANIA DIGITAL E PERFIS PROFISSIONAIS.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou cargo..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white rounded-xl focus:ring-primary/50" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          {canManage && (
            <Button 
              onClick={() => { setEditingStaff(null); setFormData({...formData, isOwner: false, salaryFormatted: "0,00"}); setIsDialogOpen(true); }} 
              className="gold-gradient text-background font-black gap-3 px-8 h-12 uppercase text-[10px] tracking-widest rounded-xl shadow-xl hover:scale-105 transition-all"
            >
              <UserPlus className="h-4.5 w-4.5" /> ADMISSÃO
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest mt-4">Sincronizando Hierarquia...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((staff) => (
            <Card key={staff.id} className="bg-[#0d1117] border-primary/20 hover:border-primary/50 transition-all group overflow-hidden flex flex-col shadow-2xl rounded-[2.5rem] border min-h-[400px]">
              <CardContent className="p-10 space-y-8 relative flex-1">
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-white/5 shadow-2xl transition-transform group-hover:scale-105 duration-500">
                      <AvatarFallback className="bg-[#1a1f2e] text-primary text-2xl font-black uppercase">
                        {staff.name?.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {staff.status === 'Ativo' && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0a0f1e] border-2 border-[#0a0f1e] flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setViewingStaff(staff); setIsViewOpen(true); }} className="text-white/20 hover:text-primary transition-all hover:scale-110"><Settings2 className="h-5 w-5" /></button>
                    <button onClick={() => handleDeleteStaff(staff.id)} className="text-white/20 hover:text-rose-500 transition-all hover:scale-110"><Trash2 className="h-5 w-5" /></button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-black uppercase border-primary/30 text-primary bg-primary/5 px-4 h-7 rounded-full tracking-widest",
                    staff.isOwner && "bg-primary text-background border-0"
                  )}>
                    {staff.isOwner ? <Crown className="h-3 w-3 mr-2" /> : null}
                    {staff.role?.toUpperCase() || 'ADVOGADO'}
                  </Badge>
                  <h3 className="text-2xl font-black text-[#F5D030] uppercase truncate tracking-tighter group-hover:brightness-125 transition-all leading-tight">
                    {staff.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                    <Mail className="h-3.5 w-3.5 text-primary/40" /> {staff.email}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4 shadow-inner">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase mb-1 opacity-40">Contrato</p>
                      <p className="text-xs font-bold text-white uppercase">{staff.paymentType || 'MENSALISTA'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-muted-foreground uppercase mb-1 opacity-40">Admissão</p>
                      <p className="text-xs font-mono font-bold text-white">{staff.hiringDate || '---'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <div className="px-10 py-8 bg-black/40 border-t border-white/5 flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-4 text-[11px] font-black text-primary uppercase tracking-widest">
                  <ShieldCheck className="h-5 w-5 opacity-50" /> ACESSO ATIVO
                </div>
                <ChevronRight className="h-5 w-5 text-white/5 group-hover:text-primary transition-all group-hover:translate-x-2" />
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-48 text-center glass rounded-[3rem] border-dashed border-2 border-white/5 opacity-20">
            <Users2 className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
            <p className="text-base font-black uppercase tracking-[0.5em]">Hierarquia Digital Vazia</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[800px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl h-[90vh] flex flex-col">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none shadow-xl">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">
                {editingStaff ? "Gestão de Colaborador" : "Admissão RGMJ"}
              </DialogTitle>
              <DialogDescription className="text-[10px] text-muted-foreground font-black uppercase opacity-60">
                REGISTRO DE DADOS E NÍVEIS DE ACESSO GOOGLE.
              </DialogDescription>
            </DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
          
          <ScrollArea className="flex-1 bg-[#0a0f1e]/50">
            <div className="p-10 space-y-10 pb-32 max-w-4xl mx-auto">
              
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-4 shadow-xl">
                <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0 mt-1" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Aviso de Soberania Digital</h4>
                  <p className="text-[10px] text-white/70 leading-relaxed font-bold uppercase">
                    O e-mail indicado abaixo será o <span className="text-white">ID MESTRE</span> para todas as integrações Google (Agenda, Drive, Meet). Certifique-se de que é um e-mail @gmail.com ou Workspace ativo.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Contrato & Função</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-8 space-y-2">
                    <Label className={labelMini}>Nome Completo *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} className={inputClass} />
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <Label className={labelMini}>Cargo *</Label>
                    <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                      <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0d121f] text-white border-white/10">
                        {STAFF_ROLES.map(r => <SelectItem key={r.id} value={r.id} className="uppercase text-[10px] font-bold">{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <Checkbox id="isOwner" checked={formData.isOwner} onCheckedChange={(v) => setFormData({...formData, isOwner: !!v})} />
                  <div className="space-y-0.5">
                    <Label htmlFor="isOwner" className="text-[10px] font-black text-white uppercase cursor-pointer">Sócio Fundador / Dono da Banca</Label>
                    <p className="text-[8px] text-primary/60 font-bold uppercase">Habilita soberania financeira total e selo de distinção.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                  <Fingerprint className="h-4 w-4 text-primary" />
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Dados Pessoais</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={labelMini}>CPF *</Label>
                    <Input 
                      value={formData.cpf} 
                      onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})} 
                      className={inputClass} 
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelMini}>WhatsApp / Celular *</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} 
                      className={inputClass} 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-white/5 bg-[#0d1422]/60 space-y-10 shadow-2xl relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-white/5 pb-6 border-b gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                      <Lock className="h-5 w-5" />
                    </div>
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Soberania Workspace</h4>
                  </div>
                  <div className="flex items-center gap-3 bg-white/[0.02] px-4 py-2.5 rounded-full border border-white/5">
                    <Checkbox id="access" checked={formData.createSystemAccess} onCheckedChange={(v) => setFormData({...formData, createSystemAccess: !!v})} />
                    <Label htmlFor="access" className="text-[10px] font-black text-white uppercase cursor-pointer flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Habilitar Acesso ao Sistema
                    </Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-3">
                    <Label className={labelMini}>E-mail Google (Identidade Oficial) *</Label>
                    <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})} className={cn(inputClass, "h-14")} placeholder="exemplo@gmail.com" />
                    <div className="flex items-center gap-2 mt-2">
                      <Info className="h-3 w-3 text-primary/40" />
                      <span className="text-[8px] text-primary/60 font-black uppercase">Este e-mail será usado para todas as permissões automáticas Google.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] space-y-8 shadow-inner">
                <div className="flex items-center gap-3 border-white/5 pb-4 border-b">
                  <Landmark className="h-5 w-5 text-primary" />
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Remuneração & Repasses</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className={labelMini}>Modelo de Contratação</Label>
                    <Select value={formData.paymentType} onValueChange={(v) => setFormData({...formData, paymentType: v})}>
                      <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0d121f] text-white">
                        {PAYMENT_TYPES.map(t => <SelectItem key={t.id} value={t.id} className="text-[10px] font-bold">{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.paymentType === "Parceria (Porcentagem)" ? (
                    <div className="space-y-2">
                      <Label className={labelMini}>Comissão (%)</Label>
                      <Input type="number" value={formData.commissionPercentage} onChange={(e) => setFormData({...formData, commissionPercentage: Number(e.target.value)})} className="bg-black/60 h-12 text-white text-center font-black text-lg rounded-xl" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className={labelMini}>Valor Fixo / Salário</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-black text-sm">R$</span>
                        <Input 
                          type="text" 
                          value={formData.salaryFormatted} 
                          onChange={(e) => setFormData({...formData, salaryFormatted: maskCurrency(e.target.value)})} 
                          className={cn(inputClass, "pl-12 bg-black/60 h-12 text-white font-black text-lg")}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 hover:text-white transition-colors">Abortar</Button>
            <Button onClick={handleSave} className="gold-gradient text-background font-black uppercase text-[11px] px-12 h-14 rounded-xl shadow-2xl transition-all hover:scale-105 active:scale-95">
              <Save className="h-5 w-5 mr-3" /> SALVAR REGISTRO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="glass border-emerald-500/20 bg-[#0a0f1e] sm:max-w-[550px] p-0 overflow-hidden shadow-2xl rounded-[2.5rem] text-center">
          <div className="p-12 space-y-8">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 mx-auto shadow-2xl">
              <ShieldCheck className="h-12 w-12 animate-pulse" />
            </div>
            <div className="space-y-3">
              <DialogTitle className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Soberania Liberada</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs font-bold uppercase tracking-widest leading-relaxed">
                O PERFIL DE <span className="text-primary">{invitedMember?.name}</span> JÁ ESTÁ ATIVO NO ECOSSISTEMA RGMJ.
              </DialogDescription>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 shadow-inner">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Link Oficial de Acesso:</p>
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                <code className="text-xs font-mono text-primary truncate mr-4">{window.location.origin}/login</code>
                <button onClick={() => { 
                  navigator.clipboard.writeText(`${window.location.origin}/login`); 
                  toast({ title: "Link Copiado" });
                }} className="text-white/40 hover:text-primary transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <Button onClick={handleCopyInvite} className="gold-gradient h-16 rounded-2xl font-black uppercase text-[11px] gap-4 shadow-xl hover:scale-105 transition-all text-background">
                <Smartphone className="h-5 w-5" /> DISPARAR CONVITE WHATSAPP
              </Button>
              <Button variant="ghost" onClick={() => setIsInviteOpen(false)} className="text-muted-foreground font-black uppercase text-[10px] h-12 hover:text-white">CONCLUIR RITO</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[850px] w-[95vw] p-0 overflow-hidden shadow-2xl flex flex-col h-[85vh] font-sans rounded-3xl">
          <div className="p-10 bg-[#0a0f1e] border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 flex-none shadow-xl">
            <div className="flex items-center gap-8">
              <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-2xl">
                <AvatarFallback className="bg-secondary text-3xl font-black text-primary uppercase">{viewingStaff?.name?.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="text-left space-y-2">
                <DialogTitle className="text-4xl font-black text-[#F5D030] uppercase tracking-tighter leading-none">{viewingStaff?.name}</DialogTitle>
                <div className="flex items-center gap-4 pt-2">
                  <Badge className="bg-primary text-background font-black uppercase text-[10px] px-4 h-7 rounded-full shadow-lg">{viewingStaff?.role?.toUpperCase()}</Badge>
                  {viewingStaff?.isOwner && <Badge className="bg-emerald-500 text-white font-black uppercase text-[10px] px-4 h-7 rounded-full shadow-lg">SÓCIO FUNDADOR</Badge>}
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">• {viewingStaff?.status?.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pr-8">
              <button onClick={() => { 
                setEditingStaff(viewingStaff); 
                setFormData({...formData, ...viewingStaff, salaryFormatted: maskCurrency(viewingStaff.baseSalary || 0), createSystemAccess: false}); 
                setIsDialogOpen(true); 
                setIsViewOpen(false); 
              }} className="text-white/20 hover:text-primary transition-all border border-white/10 p-3 rounded-xl"><Settings2 className="h-6 w-6" /></button>
              <button onClick={() => handleDeleteStaff(viewingStaff?.id)} className="text-white/20 hover:text-rose-500 transition-all border border-white/10 p-3 rounded-xl"><Trash2 className="h-6 w-6" /></button>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-[#05070a]">
            <div className="p-12 space-y-12 pb-40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="flex items-center gap-4 pb-3 border-b border-white/5">
                    <Fingerprint className="h-5 w-5 text-primary" />
                    <h4 className="text-[12px] font-black text-white uppercase tracking-widest">Perfil & Contato</h4>
                  </div>
                  <Card className="glass border-white/5 p-8 rounded-[2rem] bg-white/[0.01] space-y-8 shadow-xl">
                    <div className="space-y-2">
                      <Label className={labelMini}>E-mail Institucional</Label>
                      <p className="text-base font-bold text-white lowercase flex items-center gap-3"><Mail className="h-4 w-4 text-primary/40" /> {viewingStaff?.email}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className={labelMini}>WhatsApp</Label>
                        <p className="text-sm font-bold text-white uppercase flex items-center gap-3"><Smartphone className="h-4 w-4 text-emerald-500/40" /> {viewingStaff?.phone || '---'}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className={labelMini}>CPF</Label>
                        <p className="text-sm font-mono font-bold text-white">{viewingStaff?.cpf || '---'}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4 pb-3 border-b border-white/5">
                    <Wallet className="h-5 w-5 text-primary" />
                    <h4 className="text-[12px] font-black text-white uppercase tracking-widest">Dossiê de Repasses</h4>
                  </div>
                  <Card className="glass border-primary/20 bg-primary/[0.02] p-8 rounded-[2rem] space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Landmark className="h-20 w-20" /></div>
                    <div className="space-y-2">
                      <Label className={labelMini}>Modelo de Contratação</Label>
                      <Badge className="bg-primary text-background font-black uppercase text-[10px] h-8 px-5 rounded-full">{viewingStaff?.paymentType?.toUpperCase()}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className={labelMini}>Valor Fixo / Base</Label>
                        <p className="text-2xl font-black text-white tabular-nums">R$ {Number(viewingStaff?.baseSalary || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className={labelMini}>Participação %</Label>
                        <p className="text-2xl font-black text-[#F5D030] tabular-nums">{viewingStaff?.commissionPercentage || 0}%</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-10 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none rounded-b-[2.5rem]">
            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-4 opacity-50">
              <ShieldCheck className="h-5 w-5 text-emerald-500" /> SOBERANIA TÉCNICA AUDITADA
            </span>
            <Button variant="ghost" onClick={() => setIsViewOpen(false)} className="text-white uppercase font-black text-[11px] px-10 h-12 hover:bg-white/5">FECHAR</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
