
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users2, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase,
  Loader2,
  Trash2,
  Settings2,
  FileText,
  MapPin,
  ShieldCheck,
  Fingerprint,
  User,
  X,
  Heart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("geral")
  const [loadingCep, setLoadingCep] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    motherName: "",
    fatherName: "",
    cpf: "",
    rg: "",
    rgIssuer: "",
    rgIssueDate: "",
    rgState: "",
    pis: "",
    ctps: "",
    voterCard: "",
    birthDate: "",
    oab: "",
    role: "Secretária",
    email: "",
    phone: "",
    hiringDate: new Date().toISOString().split('T')[0],
    status: "Ativo",
    specialty: "",
    zipCode: "",
    address: "",
    number: "",
    neighborhood: "",
    city: "",
    state: ""
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
      e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.cpf?.includes(searchTerm)
    )
  }, [employees, searchTerm])

  const handleOpenCreate = () => {
    setEditingStaff(null)
    setFormData({
      name: "",
      motherName: "",
      fatherName: "",
      cpf: "",
      rg: "",
      rgIssuer: "",
      rgIssueDate: "",
      rgState: "",
      pis: "",
      ctps: "",
      voterCard: "",
      birthDate: "",
      oab: "",
      role: "Secretária",
      email: "",
      phone: "",
      hiringDate: new Date().toISOString().split('T')[0],
      status: "Ativo",
      specialty: "",
      zipCode: "",
      address: "",
      number: "",
      neighborhood: "",
      city: "",
      state: ""
    })
    setActiveTab("geral")
    setIsUserDialogOpen(true)
  }

  const handleOpenEdit = (staff: any) => {
    setEditingStaff(staff)
    setFormData({ ...staff })
    setActiveTab("geral")
    setIsUserDialogOpen(true)
  }

  const handleCepBlur = async () => {
    const cep = formData.zipCode.replace(/\D/g, "")
    if (cep.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }))
        toast({ title: "Localização Encontrada", description: data.logradouro })
      } else {
        toast({ variant: "destructive", title: "CEP Inválido", description: "Verifique o número digitado." })
      }
    } catch (error) {
      console.error("Erro ao buscar CEP")
    } finally {
      setLoadingCep(false)
    }
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

  const isLegalRole = formData.role === 'Advogado' || formData.role === 'Sócio' || formData.role === 'Estagiário'

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2 tracking-tight">Departamento Pessoal</h1>
          <p className="text-muted-foreground uppercase tracking-[0.2em] text-[10px] font-bold opacity-70">
            Gestão técnica de colaboradores e capital humano da banca RGMJ.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nome ou CPF..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleOpenCreate} className="gold-gradient text-background font-black gap-2 px-8 h-12 uppercase text-[10px] tracking-widest rounded-lg shadow-lg shadow-primary/10">
            <Plus className="h-4 w-4" /> Novo Colaborador
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando DP RGMJ...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((staff) => (
            <Card key={staff.id} className="glass border-primary/10 hover-gold transition-all duration-500 group overflow-hidden flex flex-col">
              <div className={cn(
                "h-1.5 w-full",
                staff.status === 'Ativo' ? "bg-emerald-500" : "bg-amber-500"
              )} />
              <CardContent className="p-8 space-y-6 flex-1">
                <div className="flex items-start justify-between">
                  <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-2xl">
                    <AvatarImage src={`https://picsum.photos/seed/${staff.id}/200`} />
                    <AvatarFallback className="bg-secondary text-primary font-black text-xl">
                      {staff.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5 px-3 py-1">
                      {staff.role}
                    </Badge>
                    <Badge variant="outline" className="text-[8px] uppercase font-bold border-white/10 text-muted-foreground">
                      {staff.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-headline font-bold text-white group-hover:text-primary transition-colors tracking-tight uppercase">
                    {staff.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <Briefcase className="h-3 w-3 text-primary/50" /> {staff.role === 'Advogado' ? staff.specialty : staff.role} {staff.oab ? `• OAB: ${staff.oab}` : ""}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary/40" /> {staff.email || "Sem e-mail"}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary/40" /> {staff.phone || "Sem contato"}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary/40" /> Admitido em: {staff.hiringDate}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 mt-auto">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:text-primary hover:bg-primary/5 transition-all" onClick={() => handleOpenEdit(staff)}>
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:text-destructive hover:bg-destructive/5 transition-all" onClick={() => handleDelete(staff.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" className="glass border-primary/10 text-[9px] font-black uppercase h-9 px-4 tracking-widest hover:border-primary/50">
                    Abrir Prontuário
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-white/5 opacity-30">
            <Users2 className="h-16 w-16 text-muted-foreground" />
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
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[850px] p-0 overflow-hidden shadow-2xl">
          <div className="p-10 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-6xl uppercase tracking-tighter leading-none mb-2">
                {editingStaff ? "EDITAR COLABORADOR" : "NOVO COLABORADOR"}
              </DialogTitle>
              <p className="text-muted-foreground text-[10px] uppercase font-black tracking-[0.3em] opacity-60">FICHA TÉCNICA PARA O DEPARTAMENTO PESSOAL RGMJ.</p>
            </DialogHeader>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-[#0a0f1e] px-8 pt-6">
              <TabsList className="bg-white/5 border border-white/5 h-14 p-1 gap-1 w-full justify-start rounded-xl">
                <TabsTrigger value="geral" className="data-[state=active]:bg-[#f5d030] data-[state=active]:text-[#0a0f1e] text-white font-bold text-[10px] uppercase tracking-widest h-full px-8 gap-3 rounded-lg transition-all">
                  <User className="h-4 w-4" /> Informações Iniciais
                </TabsTrigger>
                <TabsTrigger value="documentos" className="data-[state=active]:bg-[#f5d030] data-[state=active]:text-[#0a0f1e] text-white font-bold text-[10px] uppercase tracking-widest h-full px-8 gap-3 rounded-lg transition-all">
                  <Fingerprint className="h-4 w-4" /> Documentação
                </TabsTrigger>
                <TabsTrigger value="endereco" className="data-[state=active]:bg-[#f5d030] data-[state=active]:text-[#0a0f1e] text-white font-bold text-[10px] uppercase tracking-widest h-full px-8 gap-3 rounded-lg transition-all">
                  <MapPin className="h-4 w-4" /> Endereço & Contato
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="max-h-[500px]">
              <div className="p-10">
                <TabsContent value="geral" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">NOME COMPLETO *</Label>
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
                        placeholder="EX: DR. REINALDO GONÇALVES"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">CARGO / FUNÇÃO *</Label>
                      <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                        <SelectTrigger className="bg-[#0d121f] border-white/10 h-14 text-white text-sm focus:ring-1 focus:ring-primary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                          <SelectItem value="Advogado">Advogado</SelectItem>
                          <SelectItem value="Estagiário">Estagiário</SelectItem>
                          <SelectItem value="Secretária">Secretária</SelectItem>
                          <SelectItem value="Administrativo">Administrativo</SelectItem>
                          <SelectItem value="Financeiro">Financeiro</SelectItem>
                          <SelectItem value="Sócio">Sócio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isLegalRole && (
                      <>
                        <div className="space-y-3 animate-in slide-in-from-left-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">ESPECIALIDADE JURÍDICA</Label>
                          <Select value={formData.specialty} onValueChange={(v) => setFormData({...formData, specialty: v})}>
                            <SelectTrigger className="bg-[#0d121f] border-white/10 h-14 text-white text-sm focus:ring-1 focus:ring-primary/50">
                              <SelectValue placeholder="Selecione a área" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                              <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                              <SelectItem value="Cível">Cível</SelectItem>
                              <SelectItem value="Criminal">Criminal</SelectItem>
                              <SelectItem value="Previdenciário">Previdenciário</SelectItem>
                              <SelectItem value="Família">Família</SelectItem>
                              <SelectItem value="Tributário">Tributário</SelectItem>
                              <SelectItem value="Empresarial">Empresarial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3 animate-in slide-in-from-right-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">INSCRIÇÃO OAB</Label>
                          <Input 
                            value={formData.oab} 
                            onChange={(e) => setFormData({...formData, oab: e.target.value.toUpperCase()})}
                            className="bg-[#0d121f] border-white/10 h-14 text-white"
                            placeholder="SP 000.000"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">DATA DE ADMISSÃO</Label>
                      <Input 
                        value={formData.hiringDate} 
                        onChange={(e) => setFormData({...formData, hiringDate: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        type="date"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">STATUS CONTRATUAL</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger className="bg-[#0d121f] border-white/10 h-14 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Férias">Férias</SelectItem>
                          <SelectItem value="Afastado">Afastado</SelectItem>
                          <SelectItem value="Desligado">Desligado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-8 pt-6 border-t border-white/5">
                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                      <Heart className="h-4 w-4" /> Filiação & Pessoal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">NOME DA MÃE</Label>
                        <Input 
                          value={formData.motherName} 
                          onChange={(e) => setFormData({...formData, motherName: e.target.value.toUpperCase()})}
                          className="bg-[#0d121f] border-white/10 h-14 text-white text-sm"
                          placeholder="NOME COMPLETO DA GENITORA"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">NOME DO PAI</Label>
                        <Input 
                          value={formData.fatherName} 
                          onChange={(e) => setFormData({...formData, fatherName: e.target.value.toUpperCase()})}
                          className="bg-[#0d121f] border-white/10 h-14 text-white text-sm"
                          placeholder="NOME COMPLETO DO GENITOR"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
                    <div className="space-y-3 md:col-span-1">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">RG (NÚMERO)</Label>
                      <Input 
                        value={formData.rg} 
                        onChange={(e) => setFormData({...formData, rg: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        placeholder="00.000.000-0"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">ÓRGÃO EMISSOR</Label>
                      <Input 
                        value={formData.rgIssuer} 
                        onChange={(e) => setFormData({...formData, rgIssuer: e.target.value.toUpperCase()})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        placeholder="EX: SSP"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">UF DO RG</Label>
                      <Select value={formData.rgState} onValueChange={(v) => setFormData({...formData, rgState: v})}>
                        <SelectTrigger className="bg-[#0d121f] border-white/10 h-14 text-white">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d121f] border-white/10 text-white">
                          {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map(uf => (
                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">DATA DE EMISSÃO RG</Label>
                      <Input 
                        value={formData.rgIssueDate} 
                        onChange={(e) => setFormData({...formData, rgIssueDate: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        type="date"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">CPF</Label>
                      <Input 
                        value={formData.cpf} 
                        onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        placeholder="000.000.000-00"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">DATA DE NASCIMENTO</Label>
                      <Input 
                        value={formData.birthDate} 
                        onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        type="date"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">PIS / PASEP</Label>
                      <Input 
                        value={formData.pis} 
                        onChange={(e) => setFormData({...formData, pis: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        placeholder="000.00000.00-0"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">CARTEIRA DE TRABALHO (CTPS)</Label>
                      <Input 
                        value={formData.ctps} 
                        onChange={(e) => setFormData({...formData, ctps: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        placeholder="0000000 / 000-0"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">TÍTULO DE ELEITOR</Label>
                      <Input 
                        value={formData.voterCard} 
                        onChange={(e) => setFormData({...formData, voterCard: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        placeholder="0000 0000 0000"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="endereco" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">E-MAIL INSTITUCIONAL</Label>
                      <Input 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        type="email"
                        placeholder="contato@rgmj.adv.br"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">WHATSAPP / CELULAR</Label>
                      <Input 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
                        CEP {loadingCep && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                      </Label>
                      <Input 
                        value={formData.zipCode} 
                        onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                        onBlur={handleCepBlur}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">LOGRADOURO</Label>
                      <Input 
                        value={formData.address} 
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">NÚMERO / COMPLEMENTO</Label>
                      <Input 
                        value={formData.number} 
                        onChange={(e) => setFormData({...formData, number: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">BAIRRO</Label>
                      <Input 
                        value={formData.neighborhood} 
                        onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">CIDADE</Label>
                      <Input 
                        value={formData.city} 
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">UF</Label>
                      <Input 
                        value={formData.state} 
                        onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                        className="bg-[#0d121f] border-white/10 h-14 text-white"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="p-10 bg-black/40 border-t border-white/5 flex flex-row items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => setIsUserDialogOpen(false)} className="text-muted-foreground uppercase font-bold text-[11px] tracking-[0.1em] hover:text-white transition-colors">
              CANCELAR OPERAÇÃO
            </Button>
            <Button onClick={handleSave} className="bg-[#f5d030] hover:bg-[#d4af37] text-[#0a0f1e] font-black uppercase text-[12px] tracking-widest px-12 h-16 rounded-xl shadow-2xl transition-all flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" /> CONFIRMAR REGISTRO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
