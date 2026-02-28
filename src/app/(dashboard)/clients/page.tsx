
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, limit } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  UserPlus, 
  MessageCircle, 
  Mail, 
  MoreVertical, 
  FolderOpen, 
  FileText,
  Loader2,
  Users,
  X
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
import { ClientForm } from "@/components/clients/client-form"
import { useToast } from "@/hooks/use-toast"

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "clients"), orderBy("name", "asc"), limit(100))
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

  const handleCreateClient = (data: any) => {
    if (!user) return
    const fullName = `${data.firstName} ${data.lastName}`.trim()
    const newClient = {
      id: crypto.randomUUID(),
      name: fullName,
      documentNumber: data.cpf,
      email: data.email || "",
      phone: data.phone || "",
      type: data.personType === 'Pessoa Jurídica' ? 'corporate' : 'individual',
      status: data.registrationStatus,
      registrationData: data,
      responsibleStaffIds: [user.uid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    addDocumentNonBlocking(collection(db, "clients"), newClient)
      .then(() => {
        setIsNewClientOpen(false)
        toast({
          title: "Cliente Cadastrado",
          description: `${fullName} agora faz parte da base RGMJ.`
        })
      })
  }

  // Lógica de Largura de Drawer
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">Clientes</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Gestão estratégica da banca RGMJ</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-10 glass border-primary/10 h-10 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsNewClientOpen(true)}
            className="bg-[#f5d030] hover:bg-[#d4af37] text-[#0a0f1e] font-black gap-2 px-6 h-10 uppercase text-[10px] tracking-widest rounded-lg shadow-lg"
          >
            <UserPlus className="h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ... list content (omitido para brevidade) ... */}
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Base RGMJ...</span>
          </div>
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <Card key={client.id} className="glass border-primary/10 hover-gold transition-all duration-500 group relative overflow-hidden flex flex-col">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-headline font-bold text-white uppercase truncate">{client.name}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">{client.documentNumber}</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                    <FileText className="h-3 w-3" /> Abrir Prontuário
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed">
            <Users className="h-10 w-10 text-muted-foreground opacity-20" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Base Vazia</p>
          </div>
        )}
      </div>

      <Sheet open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
        <SheetContent className={cn("glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl", getDrawerWidthClass())}>
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <SheetHeader>
              <SheetTitle className="text-white font-headline text-4xl uppercase tracking-tighter">
                Novo Cliente
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                Preencha os dados conforme documentação oficial da banca RGMJ.
              </SheetDescription>
            </SheetHeader>
          </div>
          <ClientForm 
            onSubmit={handleCreateClient}
            onCancel={() => setIsNewClientOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
