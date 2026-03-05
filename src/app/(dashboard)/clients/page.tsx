"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, limit, doc } from "firebase/firestore"
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
  Trash2
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
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  
  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const clientsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "clients"), orderBy("name", "asc"), limit(100))
  }, [db, user])

  const { data: clientsData, isLoading } = useCollection(clientsQuery)

  const filteredClients = useMemo(() => {
    if (!clientsData) return []
    return clientsData.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.documentNumber?.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [clientsData, searchTerm])

  const handleOpenCreate = () => {
    setEditingClient(null)
    setIsSheetOpen(true)
  }

  const handleOpenEdit = (client: any) => {
    setEditingClient(client)
    setIsSheetOpen(true)
  }

  const handleSaveClient = (data: any) => {
    if (!user || !db) return
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.firstName
    
    const clientPayload = {
      name: fullName,
      documentNumber: data.cpf,
      email: data.email || "",
      phone: data.phone || "",
      type: data.personType === 'Pessoa Jurídica' ? 'corporate' : 'individual',
      status: data.registrationStatus,
      registrationData: data,
      updatedAt: serverTimestamp(),
    }

    if (editingClient) {
      updateDocumentNonBlocking(doc(db!, "clients", editingClient.id), clientPayload)
      toast({ title: "Cadastro Atualizado", description: `${fullName} teve seus dados retificados.` })
    } else {
      addDocumentNonBlocking(collection(db!, "clients"), {
        ...clientPayload,
        id: crypto.randomUUID(),
        responsibleStaffIds: [user.uid],
        createdAt: serverTimestamp(),
      })
      toast({ title: "Cliente Cadastrado", description: `${fullName} agora faz parte da base RGMJ.` })
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
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Clientes</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-black opacity-60">Gestão estratégica RGMJ.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar..." 
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
            <Card key={client.id} className="glass border-primary/10 hover-gold transition-all duration-500 group relative overflow-hidden flex flex-col shadow-2xl">
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight truncate group-hover:text-primary transition-colors">{client.name}</h3>
                    <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-tighter mt-1">{client.documentNumber}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0d121f] border-white/10 text-white">
                      <DropdownMenuItem onClick={() => handleOpenEdit(client)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer">
                        <Edit3 className="h-4 w-4" /> Editar Cadastro
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer text-rose-500 focus:text-rose-400">
                        <Trash2 className="h-4 w-4" /> Excluir Registro
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <button className="flex items-center gap-2 text-[9px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]">
                    <FileText className="h-3.5 w-3.5" /> Abrir Prontuário
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-[2rem] border-dashed border-2 border-white/5 opacity-20">
            <Users className="h-16 w-16 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Nenhum cliente cadastrado</p>
          </div>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className={cn("glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl", getDrawerWidthClass())}>
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <SheetHeader>
              <SheetTitle className="text-white font-headline text-4xl uppercase tracking-tighter">
                {editingClient ? "Editar Cliente" : "Novo Cliente"}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                {editingClient ? "Retificação de ficha de cadastro oficial." : "Ficha de cadastro oficial da banca RGMJ."}
              </SheetDescription>
            </SheetHeader>
          </div>
          <ClientForm 
            initialData={editingClient?.registrationData || editingClient}
            onSubmit={handleSaveClient}
            onCancel={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
