
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
  Crown
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
import { cn, maskPhone, maskCPF } from "@/lib/utils"
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
    createSystemAccess: false,
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
    return employees.filter(e => 
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees, searchTerm])

  const handleSave = async () => {
    if (!db || !formData.name || !formData.role || !formData.email) {
      toast({ variant: "destructive", title: "Dados Incompletos" })
      return
    }

    const payload = {
      ...formData,
      name: formData.name.toUpperCase(),
      email: formData.email.toLowerCase(),
      updatedAt: serverTimestamp()
    }

    try {
      let memberId = editingStaff?.id || crypto.randomUUID()
      await setDocumentNonBlocking(doc(db!, "employees", memberId), {
        ...payload,
        id: memberId,
        createdAt: editingStaff?.createdAt || serverTimestamp()
      }, { merge: true })

      if (formData.createSystemAccess) {
        const roleConfig = STAFF_ROLES.find(r => r.id === formData.role)
        const systemRole = roleConfig?.defaultSystemRole || 'lawyer'
        
        await setDocumentNonBlocking(doc(db!, "staff_profiles", memberId), {
          id: memberId,
          name: payload.name,
          email: payload.email,
          role: systemRole,
          isOwner: payload.isOwner,
          isActive: payload.status === 'Ativo',
          updatedAt: serverTimestamp()
        }, { merge: true })

        setInvitedMember({ name: payload.name, email: payload.email })
        setIsInviteOpen(true)
      }

      toast({ title: editingStaff ? "Registro Atualizado" : "Membro Admitido" })
      setIsDialogOpen(false)
    } catch (e) {
      toast({ variant: "destructive", title: "Erro no processamento" })
    }
  }

  const handleCopyInvite = () => {
    if (!invitedMember) return
    const appUrl = window.location.origin
    const message = `Olá ${invitedMember.name}! \n\nVocê foi convidado para o Ecossistema RGMJ.\n\nE-mail liberado: ${invitedMember.email}\n\nPara entrar, acesse:\n${appUrl}/login\n\nUtilize o botão "Entrar com Google".`
    navigator.clipboard.writeText(message)
    toast({ title: "Convite Copiado!" })
  }

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 block"
  const inputClass = "bg-black/40 border-white/10 h-12 text-white font-bold uppercase focus:ring-primary/50 rounded-xl"

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Users2 className="h-3.5 w-3.5" /><Link href="/" className="hover:text-primary transition-colors">Início</Link><ChevronRight className="h-2 w-2" /><span className="text-white uppercase tracking-tighter">Gestão de Equipe</span>
          </div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Corpo Técnico RGMJ</h1>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Input placeholder="Pesquisar..." className="pl-12 glass border-white/5 h-12 text-xs text-white md:w-80" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {canManage && <button onClick={() => { setEditingStaff(null); setFormData({...formData, isOwner: false}); setIsDialogOpen(true); }} className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"><Plus className="h-6 w-6 text-background" /></button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : filtered.length > 0 ? (
          filtered.map((staff) => (
            <Card key={staff.id} className="glass border-primary/10 hover-gold transition-all group rounded-2xl shadow-2xl cursor-pointer overflow-hidden" onClick={() => { setViewingStaff(staff); setIsViewOpen(true); }}>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <Avatar className="h-14 w-14 border-2 border-primary/20"><AvatarFallback className="bg-secondary text-primary font-black uppercase">{staff.name?.substring(0, 2)}</AvatarFallback></Avatar>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase border-primary/30 text-primary", staff.isOwner && "bg-primary text-background border-0")}>
                      {staff.isOwner ? <Crown className="h-2.5 w-2.5 mr-1.5" /> : null}
                      {staff.role}
                    </Badge>
                    <Badge className="bg-white/5 text-white/40 text-[8px] font-black uppercase">{staff.paymentType}</Badge>
                  </div>
                </div>
                <div className="space-y-1"><h3 className="text-xl font-black text-white uppercase truncate group-hover:text-primary transition-colors">{staff.name}</h3><div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase"><Mail className="h-3 w-3 opacity-40" /> {staff.email}</div></div>
                <div className="pt-6 border-t border-white/5 flex justify-between items-center mt-4"><div className="flex gap-2"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white"><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-primary" onClick={(e) => { e.stopPropagation(); setEditingStaff(staff); setFormData({...formData, ...staff, createSystemAccess: false}); setIsDialogOpen(true); }}><Settings2 className="h-4 w-4" /></Button></div><span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> {staff.status}</span></div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-40 text-center opacity-20"><Users2 className="h-20 w-20 mx-auto mb-6" /><p className="text-base font-black uppercase tracking-[0.4em]">Quadro de Pessoal Vazio</p></div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[800px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between"><DialogHeader className="text-left space-y-1"><DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">{editingStaff ? "Gestão de Colaborador" : "Admissão RGMJ"}</DialogTitle><DialogDescription className="text-[10px] text-muted-foreground font-black uppercase opacity-60">REGISTRO DE DADOS E NÍVEIS DE ACESSO.</DialogDescription></DialogHeader><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl"><UserCheck className="h-6 w-6" /></div></div>
          <ScrollArea className="max-h-[70vh]"><div className="p-10 space-y-10 bg-[#0a0f1e]/50">
            <div className="space-y-6"><div className="flex items-center gap-3 pb-2 border-b border-white/5"><Briefcase className="h-4 w-4 text-primary" /><h4 className="text-[11px] font-black text-white uppercase tracking-widest">Contrato & Função</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 space-y-2"><Label className={labelMini}>Nome Completo *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} className={inputClass} /></div>
                <div className="md:col-span-4 space-y-2"><Label className={labelMini}>Cargo *</Label><Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    {STAFF_ROLES.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <Checkbox id="isOwner" checked={formData.isOwner} onCheckedChange={(v) => setFormData({...formData, isOwner: !!v})} />
                <div className="space-y-0.5">
                  <Label htmlFor="isOwner" className="text-[10px] font-black text-white uppercase cursor-pointer">Sócio Fundador / Dono da Banca</Label>
                  <p className="text-[8px] text-primary/60 font-bold uppercase">Habilita soberania financeira total e selo de distinção.</p>
                </div>
              </div>
            </div>
            <div className="p-8 rounded-2xl border border-primary/20 bg-primary/5 space-y-8 shadow-inner">
              <div className="flex items-center justify-between border-primary/10 pb-4 border-b"><div className="flex items-center gap-3"><Lock className="h-5 w-5 text-primary" /><h4 className="text-[11px] font-black text-white uppercase tracking-widest">Soberania de Acesso</h4></div><div className="flex items-center gap-3"><Checkbox id="access" checked={formData.createSystemAccess} onCheckedChange={(v) => setFormData({...formData, createSystemAccess: !!v})} /><Label htmlFor="access" className="text-[10px] font-black text-white uppercase cursor-pointer">Habilitar Acesso ao Sistema</Label></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-2"><Label className={labelMini}>E-mail Google Corporativo *</Label><Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})} className={inputClass} /></div><div className="space-y-2"><Label className={labelMini}>Status Atual</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent className="bg-[#0d121f] text-white"><SelectItem value="Ativo">✅ ATIVO</SelectItem><SelectItem value="Inativo">❌ INATIVO</SelectItem></SelectContent></Select></div></div>
            </div>
            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] space-y-8 shadow-inner">
              <div className="flex items-center gap-3 border-white/5 pb-4 border-b"><Landmark className="h-5 w-5 text-primary" /><h4 className="text-[11px] font-black text-white uppercase tracking-widest">Remuneração & Repasses</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-2"><Label className={labelMini}>Modelo de Contrato</Label><Select value={formData.paymentType} onValueChange={(v) => setFormData({...formData, paymentType: v})}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent className="bg-[#0d121f] text-white">{PAYMENT_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select></div>{formData.paymentType === "Parceria (Porcentagem)" ? <div className="space-y-2"><Label className={labelMini}>Comissão (%)</Label><Input type="number" value={formData.commissionPercentage} onChange={(e) => setFormData({...formData, commissionPercentage: Number(e.target.value)})} className="bg-black/60 h-12 text-white text-center font-black" /></div> : <div className="space-y-2"><Label className={labelMini}>Valor Fixo / Salário</Label><Input type="number" value={formData.baseSalary} onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})} className="bg-black/60 h-12 text-white font-black" /></div>}</div>
            </div>
          </div></ScrollArea>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between"><Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12">ABORTAR</Button><Button onClick={handleSave} className="gold-gradient text-background font-black uppercase text-[11px] px-12 h-14 rounded-xl shadow-2xl">SALVAR REGISTRO</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="glass border-emerald-500/20 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl rounded-3xl text-center">
          <div className="p-10 space-y-6">
            <DialogHeader className="sr-only">
              <DialogTitle>Acesso Liberado</DialogTitle>
              <DialogDescription>O perfil do colaborador foi ativado no sistema.</DialogDescription>
            </DialogHeader>
            <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 mx-auto shadow-2xl"><CheckCircle2 className="h-10 w-10 animate-bounce" /></div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Liberado!</DialogTitle>
              <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest leading-relaxed">O PERFIL DE <span className="text-primary">{invitedMember?.name}</span> JÁ ESTÁ ATIVO NO SISTEMA.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 pt-2">
              <Button onClick={handleCopyInvite} className="gold-gradient h-14 rounded-xl font-black uppercase text-[11px] gap-3 shadow-xl hover:scale-105 transition-all">
                <Copy className="h-4 w-4" /> COPIAR CONVITE WHATSAPP
              </Button>
              <Button variant="ghost" onClick={() => setIsInviteOpen(false)} className="text-muted-foreground font-black uppercase text-[10px] h-12">FECHAR</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
