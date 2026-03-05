
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
  ShieldAlert
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

  const canManage = role === 'admin'
  const canQuery = !!user && !!db

  const staffQuery = useMemoFirebase(() => {
    if (!user || !db) return null
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

  const handleSave = () => {
    if (!db || !formData.name || !formData.email) return
    if (editingMember) {
      updateDocumentNonBlocking(doc(db, "staff_profiles", editingMember.id), { ...formData, updatedAt: serverTimestamp() })
      toast({ title: "Acesso Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db, "staff_profiles"), { ...formData, id: crypto.randomUUID(), isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      toast({ title: "Acesso Liberado" })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (!db || !canManage) return
    if (confirm("Revogar este acesso?")) {
      deleteDocumentNonBlocking(doc(db, "staff_profiles", id))
      toast({ variant: "destructive", title: "Acesso Revogado" })
    }
  }

  if (!canManage && !isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center font-sans">
        <ShieldAlert className="h-16 w-16 text-destructive animate-pulse" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">ACESSO RESTRITO</h2>
        <Button asChild variant="outline" className="glass border-primary/20 text-primary uppercase font-black text-[10px] tracking-widest h-12 px-8"><Link href="/">Voltar</Link></Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Gestão de Acessos</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight uppercase tracking-tighter">Equipe & Permissões</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">Hierarquia Digital RGMJ.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Input 
            placeholder="Buscar acessos..." 
            className="glass border-white/5 h-12 text-xs text-white md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={() => { setEditingMember(null); setIsDialogOpen(true); }} className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg transition-all hover:scale-105"><UserPlus className="h-6 w-6 text-background" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest mt-4">Sincronizando Acessos...</span>
          </div>
        ) : filtered.map((member) => (
          <Card key={member.id} className="glass border-primary/10 hover-gold transition-all shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <Avatar className="h-16 w-16 border-2 border-primary/20"><AvatarFallback className="bg-secondary text-primary font-black">{member.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5">{member.role?.toUpperCase()}</Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">{member.name}</h3>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest"><Mail className="h-3 w-3 opacity-50" /> {member.email}</div>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-auto">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingMember(member); setFormData(member); setIsDialogOpen(true); }}><Settings2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => handleDelete(member.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest"><ShieldCheck className="h-3.5 w-3.5" /> Ativo</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[500px] p-0 overflow-hidden shadow-2xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">{editingMember ? "EDITAR" : "NOVO"} ACESSO</DialogTitle>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">Nome Completo</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} className="glass border-white/10 h-14 text-white uppercase font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">E-mail Google</Label><Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})} className="glass border-white/10 h-14 text-white" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">Nível de Acesso</Label><Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}><SelectTrigger className="glass border-white/10 h-14 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#0d121f] text-white"><SelectItem value="admin">Administrador</SelectItem><SelectItem value="lawyer">Advogado</SelectItem><SelectItem value="financial">Financeiro</SelectItem><SelectItem value="assistant">Assistente</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px]">Cancelar</Button>
            <Button onClick={handleSave} className="gold-gradient text-background font-black uppercase text-[11px] px-10 h-14 rounded-xl shadow-xl">Confirmar Acesso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
