
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Scale, 
  Search, 
  Plus, 
  Loader2,
  Zap,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, limit } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"
import { ProcessForm } from "@/components/cases/process-form"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeArea, setActiveArea] = useState("todos")
  const [isNewProcessOpen, setIsNewProcessOpen] = useState(false)
  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const processesQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "processes"), orderBy("createdAt", "desc"), limit(100))
  }, [db, user])

  const { data: processesData, isLoading } = useCollection(processesQuery)
  const processes = processesData || []

  const filteredProcesses = useMemo(() => {
    return processes.filter(proc => {
      const matchesSearch = 
        proc.processNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesArea = activeArea === "todos" || proc.caseType?.toLowerCase() === activeArea
      
      return matchesSearch && matchesArea
    })
  }, [processes, searchTerm, activeArea])

  const metrics = useMemo(() => {
    const total = processes.length
    const valorEmRisco = processes.reduce((acc, p) => {
      const numericString = p.value
        ?.replace(/\./g, '')
        ?.replace(',', '.')
        ?.replace(/[^\d.]/g, '') || "0"
      return acc + parseFloat(numericString)
    }, 0)
    const ticketMedio = total > 0 ? valorEmRisco / total : 0
    return { total, valorEmRisco, ticketMedio }
  }, [processes])

  const handleCreateProcess = (data: any) => {
    if (!user || !db) return
    const newProcess = {
      ...data,
      status: "Em Andamento",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    addDocumentNonBlocking(collection(db, "processes"), newProcess)
      .then(() => {
        setIsNewProcessOpen(false)
        toast({
          title: "Processo Protocolado",
          description: `O dossiê ${data.processNumber} foi registrado com sucesso.`
        })
      })
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
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span>Dashboard</span>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Dossiês Ativos</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-1 uppercase tracking-tighter">Processos</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-60">
            GESTÃO JURÍDICA ESTRATÉGICA RGMJ.
          </p>
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
            onClick={() => setIsNewProcessOpen(true)}
            className="gold-gradient text-background font-black gap-2 px-8 h-11 uppercase text-[10px] tracking-widest rounded-lg shadow-xl"
          >
            <Plus className="h-4 w-4" /> Novo Processo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-primary/20 relative overflow-hidden h-32 flex flex-col justify-center shadow-2xl">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" /> Dossiês Ativos
            </p>
            <div className="text-4xl font-black text-white tracking-tighter">
              {isLoading ? "..." : metrics.total}
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-white/5 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
              <Scale className="h-3.5 w-3.5" /> Valor sob Gestão
            </p>
            <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
              R$ {metrics.valorEmRisco.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 relative overflow-hidden h-32 flex flex-col justify-center">
          <CardContent className="p-6">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Ticket Médio</p>
            <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
              R$ {metrics.ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Base Jurídica...</span>
          </div>
        ) : filteredProcesses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredProcesses.map((proc) => (
              <Card key={proc.id} className="glass border-white/5 hover-gold transition-all group overflow-hidden">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[8px] font-black border-primary/30 text-primary bg-primary/5 uppercase tracking-widest">
                        {proc.caseType?.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-tighter">{proc.processNumber}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">{proc.description}</h3>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">{proc.court} • {proc.vara}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-primary">
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center space-y-6 glass rounded-[2rem] border-dashed border-2 border-white/5 opacity-30">
            <Scale className="h-16 w-16 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Nenhum dossiê estratégico no radar</p>
          </div>
        )}
      </div>

      <Sheet open={isNewProcessOpen} onOpenChange={setIsNewProcessOpen}>
        <SheetContent className={cn("glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl", getDrawerWidthClass())}>
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <SheetHeader>
              <SheetTitle className="text-white font-headline text-4xl uppercase tracking-tighter">
                Novo Processo
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                Cadastro estruturado no ecossistema RGMJ.
              </SheetDescription>
            </SheetHeader>
          </div>
          <ProcessForm 
            onSubmit={handleCreateProcess}
            onCancel={() => setIsNewProcessOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
