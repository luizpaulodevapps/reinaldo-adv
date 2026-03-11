
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Settings2, 
  Trash2, 
  Loader2, 
  Search,
  ChevronRight,
  LayoutGrid,
  ShieldAlert,
  Table as TableIcon,
  Copy,
  Share2,
  ExternalLink,
  MoreHorizontal,
  UserCheck,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [invitedUser, setInvitedUser] = useState<any>(null)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "lawyer"
  })

  const db = useFirestore()
  const { user, role } = useUser()
  const { toast } = useToast()

  const canManage = role === 'admin'

  const staffQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user])

  const { data: team, isLoading } = useCollection(staffQuery)

  const filtered = useMemo(() => {
    if (!team) return []
    return team.filter(m => 
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [team, searchTerm])

  const handleSave = async () => {
    if (!db || !formData.name || !formData.email) {
      toast({ variant: "destructive", title: "Dados incompletos" })
      return
    }

    const payload = {
      ...formData,
      name: formData.name.toUpperCase(),
      email: formData.email.toLowerCase(),
      updatedAt: serverTimestamp()
    }

    try {
      if (editingMember) {
        updateDocumentNonBlocking(doc(db!, "staff_profiles", editingMember.id), payload)
        toast({ title: "Acesso Atualizado" })
      } else {
        const invitePayload = {
          ...payload,
          id: crypto.randomUUID(),
          isActive: true,
          createdAt: serverTimestamp(),
        }
        await addDocumentNonBlocking(collection(db!, "staff_profiles"), invitePayload)
        setInvitedUser(invitePayload)
        setIsInviteOpen(true)
        toast({ title: "Acesso Liberado" })
      }
      setIsDialogOpen(false)
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao salvar" })
    }
  }

  const handleDelete = (id: string) => {
    if (!db || !canManage) return
    if (confirm("Revogar este acesso permanentemente?")) {
      deleteDocumentNonBlocking(doc(db!, "staff_profiles", id))
      toast({ variant: "destructive", title: "Acesso Revogado" })
    }
  }

  const handleCopyInvite = () => {
    if (!invitedUser) return
    const appUrl = window.location.origin
    const message = `Olá ${invitedUser.name}! \n\nVocê foi convidado para acessar o LexFlow ERP da banca RGMJ Advogados.\n\nSeu acesso foi liberado com o e-mail: ${invitedUser.email}\n\nPara entrar, acesse o link abaixo e utilize o botão "Entrar com Google":\n${appUrl}/login\n\nSucesso no comando!`
    
    navigator.clipboard.writeText(message)
    toast({ title: "Convite Copiado!", description: "Envie agora para o novo membro via WhatsApp." })
  }

  if (!canManage && !isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center font-sans">
        <ShieldAlert className="h-16 w-16 text-destructive animate-pulse" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">ACESSO RESTRITO</h2>
        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Apenas administradores podem gerenciar a hierarquia digital.</p>
        <Button asChild variant="outline" className="glass border-primary/20 text-primary uppercase font-black text-[10px] tracking-widest h-12 px-8">
          <Link href="/">Voltar ao Início</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Gestão de Acessos</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight uppercase tracking-tighter leading-none">Equipe & Permissões</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">Controladoria de Acessos e Hierarquia Digital RGMJ.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => { setEditingMember(null); setFormData({ name: "", email: "", role: "lawyer" }); setIsDialogOpen(true); }} 
            className="gold-gradient text-background font-black gap-3 px-8 h-12 uppercase text-[10px] tracking-widest rounded-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <UserPlus className="h-4.5 w-4.5" /> CONVIDAR MEMBRO
          </Button>
        </div>
      </div>

      <Card className="glass border-white/5 overflow-hidden shadow-2xl rounded-[2rem]">
        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl">
              <TableIcon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Matriz de Colaboradores ({filtered.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Soberania Digital Ativa</span>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Hierarquia...</span>
            </div>
          ) : filtered.length > 0 ? (
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest h-14 pl-10">Membro / Identidade</TableHead>
                  <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest h-14">E-mail de Acesso</TableHead>
                  <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest h-14">Nível de Permissão</TableHead>
                  <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest h-14">Status</TableHead>
                  <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest h-14 text-right pr-10">Comandos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => (
                  <TableRow key={member.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                    <TableCell className="py-6 pl-10">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-primary/20 shadow-lg">
                          <AvatarFallback className="bg-secondary text-primary font-black text-[10px] uppercase">
                            {member.name?.substring(0, 2) || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{member.name}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Cadastrado em {member.createdAt?.toDate ? new Date(member.createdAt.toDate()).toLocaleDateString() : '--/--/--'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-2 text-[11px] text-white/70 font-medium">
                        <Mail className="h-3.5 w-3.5 opacity-30" />
                        {member.email}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase tracking-widest border-0 px-3 h-6",
                        member.role === 'admin' ? "bg-primary text-background" : "bg-white/5 text-white/60"
                      )}>
                        {member.role === 'admin' ? 'ADMINISTRADOR' : member.role === 'lawyer' ? 'ADVOGADO' : member.role === 'financial' ? 'FINANCEIRO' : 'ASSISTENTE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px]", member.isActive ? "bg-emerald-500 shadow-emerald-500/50" : "bg-rose-500 shadow-rose-500/50")} />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", member.isActive ? "text-emerald-500" : "text-rose-500")}>
                          {member.isActive ? "ATIVO" : "BLOQUEADO"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-right pr-10">
                      <div className="flex items-center justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all">
                              <MoreHorizontal className="h-4.5 w-4.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0d121f] border-white/10 text-white w-56 p-2 rounded-2xl shadow-2xl">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">Comandos de Gestão</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => { setEditingMember(member); setFormData({ name: member.name, email: member.email, role: member.role }); setIsDialogOpen(true); }}
                              className="rounded-xl h-11 px-3 text-xs font-bold uppercase tracking-widest gap-3 focus:bg-white/5"
                            >
                              <Settings2 className="h-4 w-4 text-primary" /> Editar Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => { setInvitedUser(member); setIsInviteOpen(true); }}
                              className="rounded-xl h-11 px-3 text-xs font-bold uppercase tracking-widest gap-3 focus:bg-white/5 text-emerald-400"
                            >
                              <Share2 className="h-4 w-4" /> Compartilhar Convite
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5 my-1" />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(member.id)}
                              className="rounded-xl h-11 px-3 text-xs font-bold uppercase tracking-widest gap-3 focus:bg-rose-500/10 text-rose-500"
                            >
                              <Trash2 className="h-4 w-4" /> Revogar Acesso
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-40 flex flex-col items-center justify-center space-y-8 opacity-20">
              <Users className="h-20 w-20 text-muted-foreground" />
              <p className="text-sm font-black uppercase tracking-[0.5em]">Hierarquia vazia</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIÁLOGO DE CADASTRO/EDIÇÃO */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[550px] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 shadow-xl flex items-center justify-between">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingMember ? "Retificar Acesso" : "Convidar Membro"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                DEFINA O NÍVEL DE SOBERANIA NO ECOSSISTEMA.
              </DialogDescription>
            </DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="p-10 space-y-8 bg-[#0a0f1e]/50">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nome Completo *</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} 
                className="bg-black/40 border-white/10 h-14 text-white uppercase font-bold text-sm rounded-xl focus:ring-1 focus:ring-primary/50" 
                placeholder="EX: DR. REINALDO GONÇALVES"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">E-mail Google Corporativo *</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <Input 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})} 
                  className="bg-black/40 border-white/10 h-14 pl-12 text-white font-medium text-sm rounded-xl focus:ring-1 focus:ring-primary/50" 
                  placeholder="usuario@gmail.com" 
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nível de Permissão</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                <SelectTrigger className="bg-black/40 border-white/10 h-14 text-white font-black text-[11px] uppercase tracking-widest rounded-xl focus:ring-1 focus:ring-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d121f] border-white/10 text-white p-2 rounded-xl shadow-2xl">
                  <SelectItem value="admin" className="rounded-lg h-10 uppercase text-[10px] font-black focus:bg-primary focus:text-background">👑 ADMINISTRADOR</SelectItem>
                  <SelectItem value="lawyer" className="rounded-lg h-10 uppercase text-[10px] font-black focus:bg-primary focus:text-background">⚖️ ADVOGADO(A)</SelectItem>
                  <SelectItem value="financial" className="rounded-lg h-10 uppercase text-[10px] font-black focus:bg-primary focus:text-background">💵 FINANCEIRO</SelectItem>
                  <SelectItem value="assistant" className="rounded-lg h-10 uppercase text-[10px] font-black focus:bg-primary focus:text-background">⚡ ASSISTENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12">ABORTAR</Button>
            <Button 
              onClick={handleSave} 
              className="gold-gradient text-background font-black h-14 px-12 rounded-2xl shadow-2xl uppercase text-[11px] tracking-widest flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Save className="h-5 w-5" /> {editingMember ? "SALVAR ALTERAÇÕES" : "CONCEDER ACESSO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CONVITE (RESULTADO) */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="glass border-emerald-500/20 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl animate-in zoom-in-95">
          <div className="p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 mx-auto shadow-2xl">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Liberado!</h3>
              <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest leading-relaxed px-4">
                O PERFIL DE <span className="text-primary">{invitedUser?.name}</span> JÁ ESTÁ ATIVO NO ECOSSISTEMA RGMJ.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 text-left space-y-4 shadow-inner">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <Share2 className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Script de Boas-vindas</span>
              </div>
              <p className="text-[10px] text-white/60 leading-relaxed italic">
                "Olá {invitedUser?.name}! Você foi convidado para acessar o LexFlow ERP... Seu acesso foi liberado com o e-mail: {invitedUser?.email}"
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <Button 
                onClick={handleCopyInvite}
                className="gold-gradient h-14 rounded-xl font-black uppercase text-[11px] tracking-widest gap-3 shadow-xl hover:scale-105 active:scale-95"
              >
                <Copy className="h-4 w-4" /> COPIAR CONVITE PARA WHATSAPP
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsInviteOpen(false)}
                className="text-muted-foreground font-black uppercase text-[10px] h-12"
              >
                CONCLUIR RITO
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
