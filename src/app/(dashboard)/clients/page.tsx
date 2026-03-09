
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, limit, doc, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  UserPlus, 
  FileText,
  Loader2,
  Users,
  ChevronRight,
  LayoutGrid,
  MoreVertical,
  Edit3,
  Trash2,
  UserX,
  Scale,
  Calendar,
  Wallet,
  Zap,
  Plus,
  ArrowLeft,
  Briefcase,
  History,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClientForm } from "@/components/clients/client-form"
import { ProcessForm } from "@/components/cases/process-form"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [selectedClientDossier, setSelectedClientDossier] = useState<any>(null)
  
  const [isNewProcessOpen, setIsNewProcessOpen] = useState(false)

  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  // Busca todos os clientes para não esconder dados legados sem o campo 'status'
  const clientsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db!, "clients"), 
      orderBy("name", "asc")
    )
  }, [db, user])

  const { data: clientsData, isLoading } = useCollection(clientsQuery)

  const filteredClients = useMemo(() => {
    if (!clientsData) return []
    return clientsData.filter(client => {
      // Regra de Negócio: Se não tem status, é considerado Ativo (Legado)
      // Se tem status, deve ser diferente de "Inativo"
      const isActive = !client.status || client.status === "Ativo"
      
      const matchesSearch = 
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.documentNumber?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return isActive && matchesSearch
    })
  }, [clientsData, searchTerm])

  // Queries para o Dossiê (quando um cliente é selecionado)
  const clientProcessesQuery = useMemoFirebase(() => {
    if (!db || !selectedClientDossier) return null
    return query(collection(db, "processes"), where("clientId", "==", selectedClientDossier.id))
  }, [db, selectedClientDossier])
  const { data: clientProcesses } = useCollection(clientProcessesQuery)

  const clientAgendaQuery = useMemoFirebase(() => {
    if (!db || !selectedClientDossier) return null
    return query(collection(db, "appointments"), where("clientId", "==", selectedClientDossier.id))
  }, [db, selectedClientDossier])
  const { data: clientAgenda } = useCollection(clientAgendaQuery)

  const handleOpenCreate = () => {
    setEditingClient(null)
    setIsSheetOpen(true)
  }

  const handleOpenEdit = (client: any) => {
    setEditingClient(client)
    setIsSheetOpen(true)
  }

  const handleOpenDossier = (client: any) => {
    setSelectedClientDossier(client)
  }

  const handleInactivateClient = (id: string) => {
    if (!db || !confirm("Deseja inativar este cliente? Ele será movido para o arquivo digital.")) return
    updateDocumentNonBlocking(doc(db!, "clients", id), {
      status: "Inativo",
      updatedAt: serverTimestamp()
    })
    toast({ title: "Cliente Inativado", description: "O registro foi movido para a base passiva." })
  }

  const handleSaveClient = (data: any) => {
    if (!user || !db) return
    const fullName = data.firstName || data.name || ""
    const clientPayload = {
      name: fullName.toUpperCase(),
      documentNumber: data.cpf || data.documentNumber || "",
      email: data.email || "",
      phone: data.phone || "",
      type: data.personType === 'Pessoa Jurídica' ? 'corporate' : 'individual',
      status: "Ativo",
      registrationData: data,
      updatedAt: serverTimestamp(),
    }

    if (editingClient) {
      updateDocumentNonBlocking(doc(db!, "clients", editingClient.id), clientPayload)
      toast({ title: "Ficha Atualizada" })
    } else {
      addDocumentNonBlocking(collection(db!, "clients"), {
        ...clientPayload,
        createdAt: serverTimestamp(),
      })
      toast({ title: "Cliente Cadastrado" })
    }
    setIsSheetOpen(false)
  }

  const handleDeleteClient = (id: string) => {
    if (!db || !confirm("Deseja remover este cliente permanentemente?")) return
    deleteDocumentNonBlocking(doc(db!, "clients", id))
    toast({ variant: "destructive", title: "Cliente Removido" })
  }

  const getDrawerWidthClass = () => {
    const pref = profile?.themePreferences?.drawerWidth || "extra-largo"
    switch (pref) {
      case "padrão": return "sm:max-w-lg"
      case "largo": return "sm:max-w-2xl"
      case "extra-largo": return "sm:max-w-4xl"
      case "full": return "sm:max-w-full"
      default: return "sm:max-w-4xl"
    }
  }

  if (selectedClientDossier) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 font-sans">
        <div className="flex items-center justify-between border-b border-white/5 pb-8">
          <div className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => setSelectedClientDossier(null)} className="h-12 w-12 rounded-xl text-primary hover:bg-primary/10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{selectedClientDossier.name}</h1>
                <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary px-3 h-6">DOSSIÊ 360º</Badge>
              </div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60">
                CPF/CNPJ: {selectedClientDossier.documentNumber} • Cadastrado em {selectedClientDossier.createdAt?.toDate ? new Date(selectedClientDossier.createdAt.toDate()).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => handleOpenEdit(selectedClientDossier)} className="glass border-white/10 text-[11px] font-black uppercase tracking-widest h-12 px-8 rounded-xl gap-2 hover:bg-white/5 transition-all">
              <Edit3 className="h-4 w-4" /> Editar Ficha
            </Button>
            <Button onClick={() => setIsNewProcessOpen(true)} className="gold-gradient text-background font-black text-[11px] uppercase tracking-widest h-12 px-8 rounded-xl shadow-xl hover:scale-105 transition-all">
              <Plus className="h-4 w-4" /> Novo Processo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-transparent border-b border-white/5 h-12 p-0 gap-8 w-full justify-start rounded-none">
            <TabsTrigger value="overview" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase tracking-[0.2em] h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all">VISÃO GERAL</TabsTrigger>
            <TabsTrigger value="processos" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase tracking-[0.2em] h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all">PROCESSOS ({clientProcesses?.length || 0})</TabsTrigger>
            <TabsTrigger value="agenda" className="data-[state=active]:text-primary text-muted-foreground font-black text-[11px] uppercase tracking-[0.2em] h-full rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-primary transition-all">AGENDA & ATOS</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass border-white/5 p-8 space-y-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Users className="h-5 w-5" /></div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Informações de Contato</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">WhatsApp / Celular</p>
                    <p className="text-base font-bold text-white uppercase">{selectedClientDossier.phone || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">E-mail</p>
                    <p className="text-base font-bold text-white lowercase">{selectedClientDossier.email || "Não informado"}</p>
                  </div>
                </div>
              </Card>

              <Card className="glass border-white/5 p-8 space-y-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Briefcase className="h-5 w-5" /></div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Resumo Processual</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-2xl font-black text-white">{clientProcesses?.length || 0}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Dossiês Ativos</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-2xl font-black text-emerald-500">{clientAgenda?.length || 0}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Atos Agendados</p>
                  </div>
                </div>
              </Card>

              <Card className="glass border-emerald-500/20 bg-emerald-500/5 p-8 space-y-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4 border-b border-emerald-500/10 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500"><Wallet className="h-5 w-5" /></div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Painel Financeiro</h3>
                </div>
                <p className="text-xs text-emerald-500/70 font-bold uppercase tracking-widest">Consulte repasses e honorários vinculados ao CPF deste cliente na Central Financeira.</p>
                <Button asChild variant="outline" className="w-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 h-10 rounded-xl text-[10px] font-black uppercase">
                  <Link href="/billing">Acessar Carteira <ChevronRight className="h-3 w-3 ml-2" /></Link>
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="processos">
            {clientProcesses && clientProcesses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {clientProcesses.map(proc => (
                  <Card key={proc.id} className="glass border-white/5 p-6 hover:border-primary/30 transition-all group rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary uppercase">{proc.caseType}</Badge>
                          <span className="text-xs font-mono font-bold text-muted-foreground">{proc.processNumber}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">{proc.description}</h4>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{proc.court} • {proc.vara}</p>
                      </div>
                      <Button asChild variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-primary rounded-xl">
                        <Link href="/cases"><ChevronRight className="h-6 w-6" /></Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center space-y-6 glass border-dashed border-2 border-white/5 opacity-30 rounded-[2rem]">
                <Scale className="h-16 w-16 text-muted-foreground" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">Nenhum processo vinculado</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="agenda">
            {clientAgenda && clientAgenda.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clientAgenda.map(event => (
                  <Card key={event.id} className="glass border-white/5 p-6 space-y-4 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[10px] font-black uppercase">{event.type}</Badge>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-white uppercase">{event.startDateTime ? new Date(event.startDateTime).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{event.startDateTime ? new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-white uppercase tracking-tight">{event.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase border-t border-white/5 pt-4">
                      <MapPin className="h-3.5 w-3.5" /> {event.location || "Local não informado"}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center space-y-6 glass border-dashed border-2 border-white/5 opacity-30 rounded-[2rem]">
                <Calendar className="h-16 w-16 text-muted-foreground" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">Agenda limpa para este cliente</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal de Novo Processo já vinculado */}
        <Sheet open={isNewProcessOpen} onOpenChange={setIsNewProcessOpen}>
          <SheetContent className="flex flex-col h-full glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl sm:max-w-4xl">
            <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none">
              <SheetHeader>
                <SheetTitle className="text-white font-headline text-4xl uppercase tracking-tighter">Vincular Processo</SheetTitle>
                <SheetDescription className="text-muted-foreground text-[11px] uppercase font-bold tracking-[0.2em] mt-1">Novo dossiê estratégico para {selectedClientDossier.name}.</SheetDescription>
              </SheetHeader>
            </div>
            <ProcessForm 
              initialData={{ clientId: selectedClientDossier.id, clientName: selectedClientDossier.name }}
              onSubmit={(data) => {
                addDocumentNonBlocking(collection(db!, "processes"), { ...data, status: "Em Andamento", createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
                setIsNewProcessOpen(false)
                toast({ title: "Processo Vinculado" })
              }}
              onCancel={() => setIsNewProcessOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Base de Clientes</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Clientes Ativos</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-black opacity-60">Gestão estratégica RGMJ.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nome ou CPF..." 
              className="pl-10 glass border-white/5 h-11 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleOpenCreate}
            className="gold-gradient text-background font-black gap-2 px-8 h-11 uppercase text-[10px] tracking-widest rounded-lg shadow-xl"
          >
            <UserPlus className="h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Base RGMJ...</span>
          </div>
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <Card 
              key={client.id} 
              className="glass border-primary/10 hover-gold transition-all duration-500 group relative overflow-hidden flex flex-col shadow-2xl cursor-pointer"
              onClick={() => handleOpenDossier(client)}
            >
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight truncate group-hover:text-primary transition-colors">{client.name}</h3>
                    <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-tighter mt-1">{client.documentNumber}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0d121f] border-white/10 text-white">
                      <DropdownMenuItem onClick={() => handleOpenDossier(client)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer">
                        <History className="h-4 w-4" /> Dossiê Completo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenEdit(client)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer">
                        <Edit3 className="h-4 w-4" /> Ver Ficha Técnica
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleInactivateClient(client.id)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer text-amber-500 focus:text-amber-400">
                        <UserX className="h-4 w-4" /> Inativar Cliente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer text-rose-500 focus:text-rose-400">
                        <Trash2 className="h-4 w-4" /> Excluir Definitivamente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-[0.2em]">
                    <Zap className="h-3.5 w-3.5" /> ABRIR DOSSIÊ 360º
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-[2rem] border-dashed border-2 border-white/5 opacity-20">
            <Users className="h-16 w-16 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Nenhum cliente ativo no radar</p>
          </div>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className={cn("glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl flex flex-col h-full", getDrawerWidthClass())}>
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex-none">
            <SheetHeader>
              <SheetTitle className="text-white font-headline text-4xl uppercase tracking-tighter">
                {editingClient ? "Ficha do Cliente" : "Novo Cliente"}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                {editingClient ? "Dossiê cadastral oficial RGMJ." : "Cadastro estruturado na base de inteligência."}
              </SheetDescription>
            </SheetHeader>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ClientForm 
              initialData={editingClient?.registrationData || editingClient}
              onSubmit={handleSaveClient}
              onCancel={() => setIsSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
