
"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { 
  Archive, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Trash2, 
  Users, 
  FileText,
  ChevronRight,
  LayoutGrid,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function ArchivePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const archivedQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "processes"), where("status", "==", "Arquivado"))
  }, [db, user])

  const { data: archivedProcesses, isLoading } = useCollection(archivedQuery)

  const filtered = useMemo(() => {
    if (!archivedProcesses) return []
    return archivedProcesses.filter(p => 
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.processNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [archivedProcesses, searchTerm])

  const handleReactivate = (id: string) => {
    if (!db) return
    const ref = doc(db, "processes", id)
    updateDocumentNonBlocking(ref, {
      status: "Em Andamento",
      updatedAt: serverTimestamp()
    })
    toast({ title: "Processo Reativado", description: "O dossiê retornou para a pauta ativa." })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <LayoutGrid className="h-3 w-3" />
        <Link href="/" className="hover:text-primary transition-colors">Início</Link>
        <ChevronRight className="h-2 w-2" />
        <span className="text-muted-foreground uppercase">Dashboard</span>
        <ChevronRight className="h-2 w-2" />
        <span className="text-white uppercase tracking-tighter">Arquivo Digital</span>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4 uppercase tracking-tighter">
            <Archive className="h-8 w-8 text-muted-foreground" /> Arquivo Digital
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-70">
            Gestão de processos encerrados e histórico documental da banca.
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar no arquivo..." 
            className="glass border-white/5 h-12 text-xs text-white text-right pr-12 focus:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="processos" className="space-y-8">
        <TabsList className="bg-transparent border-b border-white/5 h-12 p-0 gap-6 w-full justify-start rounded-none">
          <TabsTrigger 
            value="processos" 
            className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] h-full rounded-none px-6 gap-2 border-b-2 border-transparent data-[state=active]:border-primary transition-all"
          >
            <FileText className="h-3.5 w-3.5" /> Processos Arquivados <Badge variant="secondary" className="h-4 px-1.5 text-[8px] bg-white/10 ml-1 font-black">{filtered.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="clientes" 
            className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] h-full rounded-none px-6 gap-2 border-b-2 border-transparent data-[state=active]:border-primary transition-all"
          >
            <Users className="h-3.5 w-3.5" /> Clientes Inativos
          </TabsTrigger>
          <TabsTrigger 
            value="lixeira" 
            className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] h-full rounded-none px-6 gap-2 border-b-2 border-transparent data-[state=active]:border-primary transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" /> Lixeira Digital
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processos" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">Histórico de Dossiês</CardTitle>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-50">
                Visualize ou reative processos que foram arquivados na base RGMJ.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Arquivo...</span>
                </div>
              ) : filtered.length > 0 ? (
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] py-6 pl-10">Processo / Descrição</TableHead>
                      <TableHead className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] py-6 text-center">Protocolo CNJ</TableHead>
                      <TableHead className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] py-6 text-right pr-10">Comandos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((proc) => (
                      <TableRow key={proc.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <TableCell className="py-8 pl-10">
                          <span className="text-sm font-black text-white uppercase tracking-tighter group-hover:text-primary transition-colors">
                            {proc.description}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-[10px] font-bold text-muted-foreground/60">
                          {proc.processNumber}
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex items-center justify-end gap-6">
                            <button 
                              onClick={() => handleReactivate(proc.id)}
                              className="flex items-center gap-2 text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-all active:scale-95"
                            >
                              <RefreshCw className="h-3.5 w-3.5" /> REATIVAR
                            </button>
                            <button className="text-muted-foreground hover:text-white transition-colors">
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center space-y-6 opacity-30">
                  <Archive className="h-16 w-16 text-muted-foreground" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Nenhum dossiê arquivado no momento.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <div className="py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-white/5 opacity-30">
            <Users className="h-16 w-16 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Nenhum cliente inativo na base RGMJ.</p>
          </div>
        </TabsContent>

        <TabsContent value="lixeira">
          <div className="py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-white/5 opacity-30">
            <Trash2 className="h-16 w-16 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">O repositório de exclusão está vazio.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
