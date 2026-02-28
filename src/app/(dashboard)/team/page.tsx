
"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MoreVertical, 
  Settings2, 
  Trash2, 
  Loader2, 
  Search,
  LayoutGrid,
  ChevronRight,
  ShieldAlert,
  UserCheck
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "lawyer"
  })

  const db = useFirestore()
  const { user, role } = useUser()
  const { toast } = useToast()

  // Controle de Permissão de Elite
  const isOwner = user?.email === 'luizao16@gmail.com' || user?.email === 'luizpaulo.dev.apps@gmail.com'
  const canManage = isOwner || role === 'admin'

  const staffQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user])

  const { data: team, isLoading } = useCollection(staffQuery)

  const filtered = useMemo(() => {
    if (!team) return []
    return team.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [team, searchTerm])

  const handleOpenCreate = () => {
    if (!canManage) return
    setEditingMember(null)
    setFormData({ name: "", email: "", role: "lawyer" })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (member: any) => {
    if (!canManage) return
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role || "lawyer"
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast({ variant: "destructive", title: "Campos Obrigatórios", description: "Nome e E-mail são necessários." })
      return
    }

    if (editingMember) {
      const docRef = doc(db, "staff_profiles", editingMember.id)
      updateDocumentNonBlocking(docRef, {
        ...formData,
        updatedAt: serverTimestamp()
      })
      toast({ title: "Acesso Atualizado", description: `${formData.name} teve suas permissões alteradas.` })
    } else {
      // Criação manual de perfil (O usuário precisará logar com este e-mail para vincular)
      const newId = crypto.randomUUID()
      addDocumentNonBlocking(collection(db, "staff_profiles"), {
        id: newId,
        googleId: "",
        ...formData,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      toast({ title: "Novo Acesso Liberado", description: `${formData.name} foi convidado para a banca.` })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (!canManage) return
    if (confirm("Deseja realmente revogar o acesso deste membro?")) {
      deleteDocumentNonBlocking(doc(db, "staff_profiles", id))
      toast({ variant: "destructive", title: "Acesso Revogado", description: "O usuário foi removido do sistema." })
    }
  }

  if (!canManage && !isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive animate-pulse" />
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-bold text-white">ACESSO RESTRITO</h2>
          <p className="text-muted-foreground max-w-md">Apenas administradores da banca RGMJ podem gerenciar permissões e acessos da equipe.</p>
        </div>
        <Button asChild variant="outline" className="glass border-primary/20 text-primary">
          <Link href="/">Retornar ao Comando</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <LayoutGrid className="h-3 w-3" />
        <Link href="/" className="hover:text-primary transition-colors">Início</Link>
        <ChevronRight className="h-2 w-2" />
        <span className="text-white">Equipe (Acessos)</span>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight">Gestão de Acessos</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">
            CONTROLE DE CREDENCIAIS E HIERARQUIA DIGITAL RGMJ.
          </p>
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
          <button 
            onClick={handleOpenCreate}
            className="w-12 h-12 rounded-xl bg-[#f5d030] flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all border-2 border-[#f5d030] ring-offset-2 ring-offset-[#0a0f1e] ring-1 ring-[#f5d030]/50"
            title="Novo Acesso"
          >
            <UserPlus className="h-6 w-6 text-[#0a0f1e]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Hierarquia RGMJ...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((member) => (
            <Card key={member.id} className="glass border-primary/10 hover-gold transition-all duration-500 group overflow-hidden flex flex-col">
              <div className={cn(
                "h-1.5 w-full",
                member.role === 'admin' ? "bg-primary" : "bg-blue-500"
              )} />
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-xl">
                    <AvatarImage src={`https://picsum.photos/seed/${member.id}/200`} />
                    <AvatarFallback className="bg-secondary text-primary font-black text-lg">
                      {member.name ? member.name.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5 px-4 py-1.5 rounded-full tracking-[0.1em]">
                    {member.role?.toUpperCase() || "MEMBRO"}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-headline font-bold text-white group-hover:text-primary transition-colors tracking-tight uppercase truncate">
                    {member.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <Mail className="h-3 w-3 text-primary/50" /> {member.email}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:text-primary hover:bg-primary/5 transition-all" onClick={() => handleOpenEdit(member)}>
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:text-destructive hover:bg-destructive/5 transition-all" onClick={() => handleDelete(member.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">
                    <ShieldCheck className="h-3 w-3" /> Acesso Ativo
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-white/5 opacity-30">
            <ShieldCheck className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-white uppercase tracking-widest">Nenhum Acesso Registrado</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Libere credenciais para que sua equipe possa operar o sistema RGMJ.</p>
            </div>
            <Button onClick={handleOpenCreate} className="gold-gradient text-background font-bold gap-2">
              <UserPlus className="h-4 w-4" /> Liberar Primeiro Acesso
            </Button>
          </div>
        )}
      </div>

      {/* MODAL DE CREDENCIAIS */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter flex items-center gap-3">
                {editingMember ? <UserCheck className="h-7 w-7 text-primary" /> : <UserPlus className="h-7 w-7 text-primary" />}
                {editingMember ? "EDITAR ACESSO" : "NOVO ACESSO"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-[10px] uppercase font-black tracking-[0.2em] opacity-60">
                CONFIGURAÇÃO DE PERMISSÕES E CREDENCIAIS DE ELITE.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-8 bg-[#0a0f1e]/50">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NOME COMPLETO DO USUÁRIO</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                className="bg-[#0d121f] border-white/10 h-14 text-white text-sm focus:ring-1 focus:ring-primary/50 uppercase"
                placeholder="EX: DR. REINALDO GONÇALVES"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-MAIL GOOGLE (LOGIN)</Label>
              <Input 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                className="bg-[#0d121f] border-white/10 h-14 text-white text-sm focus:ring-1 focus:ring-primary/50"
                placeholder="usuario@gmail.com"
                type="email"
              />
              <p className="text-[9px] text-primary/50 font-bold uppercase tracking-tighter">* O usuário deve usar este e-mail para logar via Google.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PAPEL ESTRATÉGICO (ROLE)</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                <SelectTrigger className="bg-[#0d121f] border-white/10 h-14 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                  <SelectItem value="admin">🏆 ADMINISTRADOR (TOTAL)</SelectItem>
                  <SelectItem value="lawyer">⚖️ ADVOGADO (TÉCNICO)</SelectItem>
                  <SelectItem value="financial">💰 FINANCEIRO (CAIXA)</SelectItem>
                  <SelectItem value="assistant">📋 ASSISTENTE (OPERAÇÃO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-bold text-[11px] tracking-[0.1em] hover:text-white transition-colors">
              CANCELAR
            </Button>
            <Button onClick={handleSave} className="w-full md:w-auto bg-[#f5d030] hover:bg-[#d4af37] text-[#0a0f1e] font-black uppercase text-[12px] tracking-widest px-12 h-16 rounded-xl shadow-2xl transition-all flex items-center justify-center gap-3">
              <ShieldCheck className="h-5 w-5" /> CONFIRMAR CREDENCIAIS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
