
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, FileText, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function ClientsPage() {
  const db = useFirestore()
  const { user } = useUser()

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "clients"), orderBy("name", "asc"))
  }, [db, user])

  const { data: clients, isLoading } = useCollection(clientsQuery)

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">Base de Clientes</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Gestão Centralizada de Relacionamento</p>
        </div>
        <Button className="gold-gradient text-background font-bold gap-2">
          <UserPlus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar por nome, CPF ou e-mail..." className="pl-9 glass" />
        </div>
      </div>

      <Card className="glass border-primary/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/30">
            <TableRow className="hover:bg-transparent border-primary/10">
              <TableHead className="text-primary font-bold uppercase text-[10px] tracking-widest">Nome / Razão Social</TableHead>
              <TableHead className="text-primary font-bold uppercase text-[10px] tracking-widest">Documento</TableHead>
              <TableHead className="text-primary font-bold uppercase text-[10px] tracking-widest">E-mail</TableHead>
              <TableHead className="text-primary font-bold uppercase text-[10px] tracking-widest">Tipo</TableHead>
              <TableHead className="text-primary font-bold uppercase text-[10px] tracking-widest">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                  Sincronizando base de dados...
                </TableCell>
              </TableRow>
            ) : clients && clients.length > 0 ? (
              clients.map((client) => (
                <TableRow key={client.id} className="border-primary/10 hover:bg-white/5 transition-colors">
                  <TableCell className="font-bold text-white">{client.name}</TableCell>
                  <TableCell className="font-mono text-xs">{client.documentNumber}</TableCell>
                  <TableCell className="text-sm">{client.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold border-primary/20 text-primary">
                      {client.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><FileText className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><MoreHorizontal className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                  Nenhum cliente cadastrado na base RGMJ.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
