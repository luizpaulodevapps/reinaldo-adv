
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
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: "",
    role: "Secretária",
    email: "",
    status: "Ativo",
  })

  const db = useFirestore()
  const { user, role } = useUser()
  const { toast } = useToast()

  const canManage = role === 'admin'

  const staffQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "employees"), orderBy("name", "asc"))
  }, [db, user])

  const { data: employees, isLoading } = useCollection(staffQuery)

  const filtered = useMemo(() => {
    if (!employees) return []
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees, searchTerm])

  const handleSave = () => {
    if (!db || !formData.name || !formData.role) return
    if (editingStaff) {
      updateDocumentNonBlocking(doc(db!, "employees", editingStaff.id), { ...formData, updatedAt: serverTimestamp() })
      toast({ title: "Registro Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db!, "employees"), { ...formData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      toast({ title: "Colaborador Adicionado" })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (!db || !canManage) return
    if (confirm("Remover este colaborador?")) {
      deleteDocumentNonBlocking(doc(db!, "employees", id))
      toast({ variant: "destructive", title: "Colaborador Removido" })
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Departamento Pessoal</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight uppercase tracking-tighter">Gestão de Equipe</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">Capital Humano RGMJ Elite.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canManage && (
            <button onClick={() => { setEditingStaff(null); setIsDialogOpen(true); }} className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-all">
              <Plus className="h-6 w-6 text-background" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest mt-4">Carregando D.P...</span>
          </div>
        ) : filtered.map((staff) => (
          <Card key={staff.id} className="glass border-primary/10 hover-gold transition-all group overflow-hidden shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <Avatar className="h-16 w-16 border-2 border-primary/20"><AvatarFallback className="bg-secondary text-primary font-black">{staff.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5">{staff.role}</Badge>
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{staff.name}</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{staff.email || "Sem e-mail"}</p>
              </div>
              <div className="flex justify-end gap-2 pt-6 border-t border-white/5">
                <Button variant="ghost" size="icon" onClick={() => { setEditingStaff(staff); setFormData(staff); setIsDialogOpen(true); }}><Settings2 className="h-4 w-4" /></Button>
                {canManage && <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => handleDelete(staff.id)}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[800px] p-0 overflow-hidden shadow-2xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">{editingStaff ? "EDITAR" : "NOVO"} COLABORADOR</DialogTitle>
          </div>
          <ScrollArea className="max-h-[500px] p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Completo</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} className="glass border-white/10 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargo</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger className="glass border-white/10 h-12 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d121f] text-white">
                    <SelectItem value="Advogado">Advogado</SelectItem>
                    <SelectItem value="Estagiário">Estagiário</SelectItem>
                    <SelectItem value="Secretária">Secretária</SelectItem>
                    <SelectItem value="Sócio">Sócio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-black/40 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px]">Cancelar</Button>
            <Button onClick={handleSave} className="gold-gradient text-background font-black uppercase text-[11px] px-10 h-14 rounded-xl shadow-xl">Confirmar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
