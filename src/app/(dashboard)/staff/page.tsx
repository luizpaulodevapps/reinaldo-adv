
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
  Calendar,
  Scale,
  UserCheck,
  X,
  Save,
  MapPin,
  Eye,
  DollarSign,
  Wallet,
  Landmark,
  Percent
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn, maskPhone, maskCPF, maskCEP } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

const STAFF_ROLES = [
  { id: "Sócio", label: "SÓCIO(A)", isLegal: true },
  { id: "Advogado", label: "ADVOGADO(A)", isLegal: true, oabRequired: true },
  { id: "Estagiário", label: "ESTAGIÁRIO(A)", isLegal: true, oabRequired: false },
  { id: "Secretária", label: "SECRETÁRIA(O)", isLegal: false },
  { id: "Auxiliar Administrativo", label: "AUX. ADMINISTRATIVO", isLegal: false },
  { id: "Copeiro", label: "COPEIRO(A)", isLegal: false },
  { id: "Faxineiro", label: "FAXINEIRO(A)", isLegal: false },
  { id: "Recepcionista", label: "RECEPCIONISTA", isLegal: false },
  { id: "Contabilidade", label: "CONTABILIDADE", isLegal: false },
]

const PAYMENT_TYPES = [
  { id: "Mensalista", label: "MENSALISTA (FIXO)" },
  { id: "Por Demanda", label: "POR DEMANDA (VALOR POR ATO)" },
  { id: "Parceria (Porcentagem)", label: "PARCERIA (PORCENTAGEM)" },
]

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewingStaff, setViewingStaff] = useState<any>(null)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [loadingCep, setLoadingCep] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    role: "Secretária",
    email: "",
    phone: "",
    cpf: "",
    oabNumber: "",
    oabState: "SP",
    hiringDate: new Date().toISOString().split('T')[0],
    status: "Ativo",
    zipCode: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    paymentType: "Mensalista",
    commissionPercentage: 0,
    baseSalary: 0
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

  const staffFinancialQuery = useMemoFirebase(() => {
    if (!db || !viewingStaff) return null
    return query(
      collection(db, "financial_titles"),
      where("entityName", "==", viewingStaff.name),
      orderBy("dueDate", "desc")
    )
  }, [db, viewingStaff])
  const { data: staffTransactions, isLoading: isLoadingFinance } = useCollection(staffFinancialQuery)

  const filtered = useMemo(() => {
    if (!employees) return []
    return employees.filter(e => 
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees, searchTerm])

  const currentRoleConfig = useMemo(() => {
    return STAFF_ROLES.find(r => r.id === formData.role)
  }, [formData.role])

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
          address: data.logradouro.toUpperCase(),
          neighborhood: data.bairro.toUpperCase(),
          city: data.localidade.toUpperCase(),
          state: data.uf.toUpperCase()
        }))
      }
    } catch (error) {
      console.error("CEP error")
    } finally {
      setLoadingCep(false)
    }
  }

  const handleSave = () => {
    if (!db || !formData.name || !formData.role) {
      toast({ variant: "destructive", title: "Dados Incompletos", description: "Nome e cargo são fundamentais." })
      return
    }

    if (currentRoleConfig?.oabRequired && !formData.oabNumber) {
      toast({ variant: "destructive", title: "OAB Obrigatória", description: "Advogados devem possuir registro na ordem." })
      return
    }

    const payload = {
      ...formData,
      name: formData.name.toUpperCase(),
      email: formData.email.toLowerCase(),
      updatedAt: serverTimestamp()
    }

    if (editingStaff) {
      updateDocumentNonBlocking(doc(db!, "employees", editingStaff.id), payload)
      toast({ title: "Dossiê Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db!, "employees"), { ...payload, createdAt: serverTimestamp() })
      toast({ title: "Colaborador Admitido na Base" })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (!db || !canManage) return
    if (confirm("Confirmar a remoção permanente deste colaborador dos registros da banca?")) {
      deleteDocumentNonBlocking(doc(db, "employees", id))
      toast({ variant: "destructive", title: "Colaborador Removido" })
    }
  }

  const handleOpenEdit = (staff: any) => {
    setEditingStaff(staff)
    setFormData({
      ...formData,
      ...staff,
      hiringDate: staff.hiringDate || new Date().toISOString().split('T')[0]
    })
    setIsDialogOpen(true)
  }

  const handleOpenView = (staff: any) => {
    setViewingStaff(staff)
    setIsViewOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingStaff(null)
    setFormData({
      name: "",
      role: "Secretária",
      email: "",
      phone: "",
      cpf: "",
      oabNumber: "",
      oabState: "SP",
      hiringDate: new Date().toISOString().split('T')[0],
      status: "Ativo",
      zipCode: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      paymentType: "Mensalista",
      commissionPercentage: 0,
      baseSalary: 0
    })
    setIsDialogOpen(true)
  }

  const labelMini = "text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 block"
  const inputClass = "bg-black/40 border-white/10 h-12 text-white font-bold uppercase focus:ring-primary/50 rounded-xl"

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Users2 className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Corpo Técnico & Administrativo</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight uppercase tracking-tighter">Equipe RGMJ</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">ADMINISTRAÇÃO DE CAPITAL HUMANO DA BANCA.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nome ou cargo..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canManage && (
            <button 
              onClick={handleOpenCreate} 
              className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(245,208,48,0.2)] hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="h-6 w-6 text-background" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Equipe...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((staff) => (
            <Card key={staff.id} className="glass border-primary/10 hover-gold transition-all group overflow-hidden shadow-2xl rounded-2xl cursor-pointer" onClick={() => handleOpenView(staff)}>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-xl">
                    <AvatarFallback className="bg-secondary text-primary font-black text-lg uppercase">{staff.name?.substring(0, 2) || "??"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/30 text-primary bg-primary/5 px-3 py-1">
                      {staff.role}
                    </Badge>
                    <Badge className="bg-white/5 text-white/40 border-0 text-[8px] font-black uppercase tracking-widest px-2">
                      {staff.paymentType || "Mensalista"}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight truncate">
                    {staff.name}
                  </h3>
                  <div className="flex flex-col gap-1 mt-3">
                    {staff.email && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        <Mail className="h-3 w-3 opacity-40" /> {staff.email}
                      </div>
                    )}
                    {staff.phone && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        <Phone className="h-3 w-3 opacity-40" /> {staff.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-4">
                  <div className="flex gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                      onClick={(e) => { e.stopPropagation(); handleOpenView(staff); }}
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(staff); }}
                    >
                      <Settings2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                    <ShieldCheck className="h-3.5 w-3.5" /> {staff.status || "ATIVO"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-40 flex flex-col items-center justify-center space-y-8 glass rounded-[3rem] border-dashed border-2 border-white/5 opacity-20">
            <Users2 className="h-20 w-20 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-base font-black text-white uppercase tracking-[0.4em]">Quadro de Pessoal Vazio</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Nenhum colaborador registrado na base RGMJ.</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[1000px] w-[95vw] p-0 overflow-hidden shadow-2xl rounded-3xl flex flex-col h-[85vh] font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex flex-row items-center justify-between shadow-xl flex-none">
            <div className="flex items-center gap-6">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarFallback className="bg-secondary text-primary font-black text-xl uppercase">{viewingStaff?.name?.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{viewingStaff?.name}</DialogTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary uppercase">{viewingStaff?.role}</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dossiê Técnico RGMJ</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pr-8">
              <Button onClick={() => handleOpenEdit(viewingStaff)} variant="outline" className="glass border-white/10 text-white font-black text-[10px] uppercase h-11 px-6 rounded-xl hover:bg-primary hover:text-background transition-all">
                <Settings2 className="h-4 w-4 mr-2" /> EDITAR
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="ficha" className="h-full flex flex-col">
              <div className="px-8 bg-[#0a0f1e]/50 border-b border-white/5 flex-none">
                <TabsList className="bg-transparent h-12 gap-8 p-0">
                  <TabsTrigger value="ficha" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary tracking-widest gap-2"><UserCheck className="h-3.5 w-3.5" /> DOSSIÊ GERAL</TabsTrigger>
                  <TabsTrigger value="financeiro" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary tracking-widest gap-2"><DollarSign className="h-3.5 w-3.5" /> REMUNERAÇÃO & REPASSES</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-10 space-y-10">
                    
                    <TabsContent value="ficha" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="glass bg-white/[0.01] border-white/5 p-6 rounded-2xl space-y-6">
                          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                            <Fingerprint className="h-4 w-4 text-primary" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Identidade e Qualificação</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div><Label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">CPF</Label><p className="text-sm font-bold text-white font-mono">{viewingStaff?.cpf || "Não informado"}</p></div>
                            <div><Label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">OAB</Label><p className="text-sm font-bold text-white uppercase">{viewingStaff?.oabNumber ? `${viewingStaff.oabNumber}/${viewingStaff.oabState}` : "Sem registro de ordem"}</p></div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                              <div><Label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">Telefone</Label><p className="text-sm font-bold text-white uppercase">{viewingStaff?.phone || "---"}</p></div>
                              <div><Label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">E-mail</Label><p className="text-sm font-bold text-white lowercase">{viewingStaff?.email || "---"}</p></div>
                            </div>
                          </div>
                        </Card>

                        <Card className="glass bg-white/[0.01] border-white/5 p-6 rounded-2xl space-y-6">
                          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Endereço Residencial</h4>
                          </div>
                          <div className="space-y-4">
                            <div><Label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">Logradouro</Label><p className="text-sm font-bold text-white uppercase">{viewingStaff?.address || "Não informado"}{viewingStaff?.number && `, ${viewingStaff.number}`}</p></div>
                            <div className="grid grid-cols-2 gap-4">
                              <div><Label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">Bairro</Label><p className="text-xs font-bold text-white uppercase">{viewingStaff?.neighborhood || "---"}</p></div>
                              <div><Label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">Cidade/UF</Label><p className="text-xs font-bold text-white uppercase">{viewingStaff?.city} / {viewingStaff?.state}</p></div>
                            </div>
                            <div className="pt-4 border-t border-white/5"><Label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">CEP</Label><p className="text-sm font-mono text-white/60">{viewingStaff?.zipCode || "---"}</p></div>
                          </div>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="financeiro" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="glass border-primary/20 bg-primary/5 p-8 rounded-3xl space-y-4 shadow-xl">
                          <div className="flex items-center gap-3">
                            <Landmark className="h-5 w-5 text-primary" />
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Rito de Contrato</h4>
                          </div>
                          <p className="text-2xl font-black text-white uppercase tracking-tighter">{viewingStaff?.paymentType || "MENSALISTA"}</p>
                        </Card>

                        {viewingStaff?.paymentType?.includes("Parceria") && (
                          <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-8 rounded-3xl space-y-4 shadow-xl">
                            <div className="flex items-center gap-3">
                              <Percent className="h-5 w-5 text-emerald-500" />
                              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Comissão em Honorários</h4>
                            </div>
                            <p className="text-4xl font-black text-white tabular-nums">{viewingStaff?.commissionPercentage || 0}%</p>
                          </Card>
                        )}

                        {(viewingStaff?.paymentType === "Mensalista" || viewingStaff?.baseSalary > 0) && (
                          <Card className="glass border-blue-500/20 bg-blue-500/5 p-8 rounded-3xl space-y-4 shadow-xl">
                            <div className="flex items-center gap-3">
                              <DollarSign className="h-5 w-5 text-blue-400" />
                              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Valor Base / Salário</h4>
                            </div>
                            <p className="text-2xl font-black text-white tabular-nums">R$ {Number(viewingStaff?.baseSalary || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </Card>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-b border-white/5 pb-4 mt-10">
                        <div className="flex items-center gap-4">
                          <Wallet className="h-6 w-6 text-primary" />
                          <h3 className="text-base font-bold text-white uppercase tracking-widest">Extrato de Pagamentos Realizados</h3>
                        </div>
                      </div>

                      {isLoadingFinance ? (
                        <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                      ) : staffTransactions && staffTransactions.length > 0 ? (
                        <div className="divide-y divide-white/5 glass border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                          {staffTransactions.map(t => (
                            <div key={t.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                              <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg">
                                  <DollarSign className="h-6 w-6" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">{t.description}</h4>
                                  <div className="flex items-center gap-4 mt-1.5">
                                    <Badge variant="outline" className="text-[8px] border-white/10 text-muted-foreground uppercase">{t.category}</Badge>
                                    <span className="text-[9px] text-muted-foreground font-mono">PAGO EM: {t.dueDate}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-white tabular-nums">R$ {Number(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black uppercase mt-1">LIQUIDADO</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-32 flex flex-col items-center justify-center opacity-20 space-y-6 glass rounded-3xl border-dashed border-2 border-white/5">
                          <DollarSign className="h-16 w-16 text-muted-foreground" />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum histórico financeiro registrado</p>
                        </div>
                      )}
                    </TabsContent>

                  </div>
                </ScrollArea>
              </div>
            </Tabs>
          </div>

          <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none rounded-b-3xl">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base de Dados Permanente RGMJ</span>
            </div>
            <Button onClick={() => setIsViewOpen(false)} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-2xl">
              FECHAR DOSSIÊ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[850px] w-[95vw] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between shadow-xl">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingStaff ? "Gestão de Colaborador" : "Admissão Digital"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                REGISTRO TÉCNICO DE CAPITAL HUMANO RGMJ.
              </DialogDescription>
            </DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>

          <ScrollArea className="max-h-[70vh]">
            <div className="p-10 space-y-10 bg-[#0a0f1e]/50">
              
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Função e Identidade</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-8 space-y-2">
                    <Label className={labelMini}>Nome Completo *</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} 
                      className={cn(inputClass, "h-14 text-sm")}
                      placeholder="EX: REINALDO GONÇALVES"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <Label className={labelMini}>Cargo na Banca *</Label>
                    <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                      <SelectTrigger className={cn(inputClass, "h-14")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d121f] text-white">
                        {STAFF_ROLES.map(role => (
                          <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-primary/20 bg-primary/5 space-y-8 shadow-inner">
                <div className="flex items-center gap-3 border-primary/10 pb-4">
                  <Landmark className="h-5 w-5 text-primary" />
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Modelo de Remuneração</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className={labelMini}>Tipo de Contrato / Repasse</Label>
                    <Select value={formData.paymentType} onValueChange={(v) => setFormData({...formData, paymentType: v})}>
                      <SelectTrigger className="bg-black/60 border-primary/30 h-12 text-white font-black"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0d121f] text-white">
                        {PAYMENT_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.paymentType === "Parceria (Porcentagem)" ? (
                    <div className="space-y-2 animate-in slide-in-from-right-2 duration-300">
                      <Label className={labelMini}>Porcentagem sobre Honorários (%)</Label>
                      <div className="relative">
                        <Input 
                          type="number"
                          value={formData.commissionPercentage} 
                          onChange={(e) => setFormData({...formData, commissionPercentage: Number(e.target.value)})} 
                          className="bg-black/60 border-emerald-500/30 h-12 text-white font-black text-center pr-10"
                        />
                        <Percent className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className={labelMini}>Valor Fixo (Salário ou Base)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-xs">R$</span>
                        <Input 
                          type="number"
                          value={formData.baseSalary} 
                          onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})} 
                          className="bg-black/60 border-primary/30 h-12 text-white font-black pl-10"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(currentRoleConfig?.isLegal) && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-3">
                      <Scale className="h-5 w-5 text-primary" />
                      <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Habilitação Profissional</h4>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className={labelMini}>Número da OAB {currentRoleConfig.oabRequired && "*"}</Label>
                      <Input 
                        value={formData.oabNumber} 
                        onChange={(e) => setFormData({...formData, oabNumber: e.target.value})} 
                        className="bg-black/40 border-white/10 h-12 text-white font-mono text-lg font-black"
                        placeholder="000.000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelMini}>Seccional (UF)</Label>
                      <Select value={formData.oabState} onValueChange={(v) => setFormData({...formData, oabState: v})}>
                        <SelectTrigger className="bg-black/40 border-white/10 h-12 text-white font-black"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#0d121f] text-white">
                          {BRAZIL_STATES.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                  <Fingerprint className="h-4 w-4 text-primary" />
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Documentação e Contato</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className={labelMini}>CPF</Label>
                    <Input 
                      value={formData.cpf} 
                      onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})} 
                      className={cn(inputClass, "font-mono")}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelMini}>WhatsApp Direct</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} 
                      className={inputClass}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelMini}>E-mail Institucional</Label>
                    <Input 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})} 
                      className={cn(inputClass, "lowercase")}
                      placeholder="usuario@rgmj.com.br"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Vínculo com a Banca</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={labelMini}>Data de Admissão</Label>
                    <Input 
                      type="date"
                      value={formData.hiringDate} 
                      onChange={(e) => setFormData({...formData, hiringDate: e.target.value})} 
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelMini}>Status Operacional</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0d121f] text-white">
                        <SelectItem value="Ativo">✅ ATIVO / EM EXERCÍCIO</SelectItem>
                        <SelectItem value="Inativo">❌ INATIVO / DESLIGADO</SelectItem>
                        <SelectItem value="Afastado">⌛ AFASTADO TEMPORARIAMENTE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setIsDialogOpen(false)} 
              className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12 hover:text-white"
            >
              DESCARTAR
            </Button>
            <Button 
              onClick={handleSave} 
              className="gold-gradient text-background font-black uppercase text-[11px] px-12 h-14 rounded-xl shadow-2xl hover:scale-[1.02] transition-all flex items-center gap-3"
            >
              <Save className="h-5 w-5" /> {editingStaff ? "ATUALIZAR DOSSIÊ" : "CONFIRMAR ADMISSÃO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
