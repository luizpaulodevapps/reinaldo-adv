
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
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
  Users
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const db = useFirestore()
  const { user } = useUser()

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "clients"), orderBy("name", "asc"))
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Estratégico */}
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
          <Button className="gold-gradient text-background font-bold gap-2 px-6 h-10 uppercase text-[10px] tracking-widest rounded-lg">
            <UserPlus className="h-4 w-4" /> Novo
          </Button>
        </div>
      </div>

      {/* Grid de Cards de Elite */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4 glass rounded-3xl border-dashed">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Base RGMJ...</span>
          </div>
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            // Mock de integridade baseado no ID para visual fixo porém diferente entre cards
            const integrity = Math.floor((client.id.charCodeAt(0) % 30) + 70); 
            const statusColor = integrity > 85 ? "bg-emerald-500" : integrity > 75 ? "bg-primary" : "bg-destructive";

            return (
              <Card key={client.id} className="glass border-primary/10 hover-gold transition-all duration-500 group relative overflow-hidden flex flex-col">
                {/* Indicador Superior de Status */}
                <div className={cn("h-1.5 w-full", statusColor)} />
                
                <CardContent className="p-6 space-y-6">
                  {/* Top Section */}
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[9px] border-primary/20 text-primary uppercase font-bold px-2">
                        Ativo
                      </Badge>
                      <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground uppercase font-bold px-2">
                        {client.type === 'corporate' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Nome e Documento */}
                  <div>
                    <h3 className="text-xl font-headline font-bold text-white group-hover:text-primary transition-colors leading-tight">
                      {client.name.toUpperCase()}
                    </h3>
                    <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-tighter">
                      {client.documentNumber || "CPF/CNPJ NÃO INFORMADO"}
                    </p>
                  </div>

                  {/* Contact Action Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="glass border-primary/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-[9px] font-bold uppercase gap-2 h-10 group/btn">
                      <MessageCircle className="h-3 w-3 text-emerald-500 group-hover/btn:scale-110 transition-transform" /> WhatsApp
                    </Button>
                    <Button variant="outline" className="glass border-primary/10 hover:border-primary/50 hover:bg-primary/5 text-[9px] font-bold uppercase gap-2 h-10 group/btn">
                      <Mail className="h-3 w-3 text-primary group-hover/btn:scale-110 transition-transform" /> E-mail
                    </Button>
                  </div>

                  {/* Stats Section */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Processos</p>
                      <p className="text-xl font-bold text-white">0</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Integridade</p>
                        <span className="text-[10px] font-bold text-white">{integrity}%</span>
                      </div>
                      <Progress value={integrity} className="h-1.5 bg-secondary" />
                    </div>
                  </div>

                  {/* Footer Links */}
                  <div className="flex items-center justify-between pt-2">
                    <button className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                      <FileText className="h-3 w-3" /> Abrir Prontuário
                    </button>
                    <button className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
                      <FolderOpen className="h-3 w-3" /> Abrir Pasta
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-primary/10">
            <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center">
              <Users className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-white uppercase tracking-widest">Base de Clientes Vazia</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Nenhum cliente foi encontrado na base de dados estratégica da banca RGMJ.</p>
            </div>
            <Button className="gold-gradient text-background font-bold gap-2">
              Cadastrar Primeiro Cliente
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
