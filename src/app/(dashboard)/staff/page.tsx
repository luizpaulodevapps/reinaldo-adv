
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users2, 
  Search, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Briefcase,
  Loader2,
  X,
  FileText,
  Trash2,
  Settings2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    oab: "",
    role: "Advogado",
    email: "",
    phone: "",
    hiringDate: new Date().toISOString().split('T')[0],
    status: "Ativo",
    specialty: "Trabalhista"
  })

  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const staffQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "employees"), orderBy("name", "asc"))
  }, [db, user])

  const { data: employees, isLoading } = useCollection(staffQuery)

  const filtered = useMemo(() => {
    if (!employees) return []
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees, searchTerm])

  const handleOpenCreate = () => {
    setEditingStaff(null)
    setFormData({
      name: "",
      cpf: "",
      oab: "",
      role: "Advogado",
      email: "",
      phone: "",
      hiringDate: new Date().toISOString().split('T')[0],
      status: "Ativo",
      specialty: "Trabalhista"
    })
    setIsUserDialogOpen(true)
  }

  const handleOpenEdit = (staff: any) => {
    setEditingStaff(staff)
    setFormData({ ...staff })
    setIsUserDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.role) {
      toast({ variant: "destructive", title: "Dados Incompletos", description: "Nome e Cargo são obrigatórios." })
      return
    }

    if (editingStaff) {
      const docRef = doc(db, "employees", editingStaff.id)
      updateDocumentNonBlocking(docRef, {
        ...formData,
        updatedAt: serverTimestamp()
      })
      toast({ title: "Registro Atualizado", description: `${formData.name} teve seus dados salvos.` })
    } else {
      addDocumentNonBlocking(collection(db, "employees"), {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      toast({ title: "Novo Colaborador", description: `${formData.name} foi adicionado ao DP.` })
    }
    setIsUserDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente remover este colaborador do Departamento Pessoal?")) {
      deleteDocumentNonBlocking(doc(db, "employees", id))
      toast({ variant: "destructive", title: "Removido", description: "O colaborador foi excluído da base." })
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">Departamento Pessoal</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Gestão técnica de colaboradores e recursos humanos RGMJ</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar funcionário..." 
              className="pl-10 glass border-primary/10 h-11 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleOpenCreate} className="gold-gradient text-background font-bold gap-2 px-6 h-11 uppercase text-[10px] tracking-widest rounded-lg">
            <Plus className="h-4 w-4" /> Novo Colaborador
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Departamento Pessoal...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((staff) => (
            <Card key={staff.id} className="glass border-primary/10 hover-gold transition-all duration-500 group overflow-hidden">
              <div className={cn(
                "h-1.5 w-full",
                staff.status === 'Ativo' ? "bg-emerald-500" : "bg-amber-500"
              )} />
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-xl">
                    <AvatarImage src={`https://picsum.photos/seed/${staff.id}/200`} />
                    <AvatarFallback className="bg-secondary text-primary font-black text-xl">
                      {staff.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="text-[9px] uppercase font-bold border-primary/30 text-primary bg-primary/5">
                      {staff.role}
                    </Badge>
                    <Badge variant="outline" className="text-[8px] uppercase border-white/10 text-muted-foreground">
                      {staff.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-headline font-bold text-white group-hover:text-primary transition-colors">
                    {staff.name.toUpperCase()}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                    <Briefcase className="h-3 w-3" /> {staff.specialty} • OAB: {staff.oab || "N/A"}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary/50" /> {staff.email}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary/50" /> {staff.phone}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary/50" /> Admissão: {staff.hiringDate}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:text-primary" onClick={() => handleOpenEdit(staff)}>
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:text-destructive" onClick={() => handleDelete(staff.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" className="glass border-primary/10 text-[9px] font-bold uppercase h-8">
                    Ver Histórico
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-primary/10">
            <Users2 className="h-16 w-16 text-muted-foreground opacity-20" />
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-white uppercase tracking-widest">Base de Funcionários Vazia</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Cadastre os colaboradores da banca RGMJ para iniciar a gestão operacional.</p>
            </div>
            <Button onClick={handleOpenCreate} className="gold-gradient text-background font-bold gap-2">
              Cadastrar Primeiro Funcionário
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[600px] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex justify-between items-center">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingStaff ? "Editar Colaborador" : "Novo Colaborador"}
              </DialogTitle>
              <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Ficha técnica para o Departamento Pessoal RGMJ.</p>
            </DialogHeader>
            <Button variant="ghost" size="icon" onClick={() => setIsUserDialogOpen(false)} className="text-muted-foreground hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="p-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nome Completo *</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                  className="glass border-white/10 h-12 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CPF</Label>
                <Input 
                  value={formData.cpf} 
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                  className="glass border-white/10 h-12 text-white"
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cargo / Função *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger className="glass border-white/10 h-12 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    <SelectItem value="Advogado">Advogado</SelectItem>
                    <SelectItem value="Estagiário">Estagiário</SelectItem>
                    <SelectItem value="Secretária">Secretária</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Inscrição OAB</Label>
                <Input 
                  value={formData.oab} 
                  onChange={(e) => setFormData({...formData, oab: e.target.value.toUpperCase()})}
                  className="glass border-white/10 h-12 text-white"
                  placeholder="SP 000.000"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-mail para Contato</Label>
                <Input 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                  className="glass border-white/10 h-12 text-white"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Telefone / WhatsApp</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="glass border-white/10 h-12 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data de Admissão</Label>
                <Input 
                  value={formData.hiringDate} 
                  onChange={(e) => setFormData({...formData, hiringDate: e.target.value})}
                  className="glass border-white/10 h-12 text-white"
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status Contratual</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="glass border-white/10 h-12 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Férias">Férias</SelectItem>
                    <SelectItem value="Afastado">Afastado</SelectItem>
                    <SelectItem value="Desligado">Desligado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="p-10 bg-black/20 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsUserDialogOpen(false)} className="text-muted-foreground uppercase font-bold text-[10px] tracking-widest">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-xl">
              Confirmar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
