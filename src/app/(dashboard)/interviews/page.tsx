
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Loader2, 
  FileText, 
  Clock, 
  ChevronRight,
  Brain,
  ClipboardList,
  Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { InterviewForm } from "@/components/interviews/interview-form"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function InterviewsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFormOpen, setIsNewFormOpen] = useState(false)
  const db = useFirestore()
  const { user, profile } = useUser()
  const { toast } = useToast()

  const interviewsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "interviews"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: interviews, isLoading } = useCollection(interviewsQuery)

  const handleCreateInterview = (data: any) => {
    if (!user || !db) return
    const newInterview = {
      ...data,
      interviewerId: user.uid,
      interviewerName: user.displayName,
      status: "Concluída",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    addDocumentNonBlocking(collection(db!, "interviews"), newInterview)
      .then(() => {
        setIsNewFormOpen(false)
        toast({ title: "Entrevista Registrada", description: `Dados de ${data.clientName} salvos no sistema.` })
      })
  }

  const filteredInterviews = (interviews || []).filter(i => 
    i.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    <div className="space-y-10 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Triagem & Entrevistas</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Central de Atendimento</h1>
          <p className="text-muted-foreground uppercase tracking-[0.3em] text-[10px] font-black opacity-60">Triagem e Captura de DNA Jurídico RGMJ.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar entrevistas..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsNewFormOpen(true)}
            className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-6 w-6 text-[#0a0f1e]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Dossiês...</span>
          </div>
        ) : filteredInterviews.length > 0 ? (
          filteredInterviews.map((item) => (
            <Card key={item.id} className="glass border-primary/10 hover-gold transition-all group overflow-hidden flex flex-col shadow-2xl">
              <CardContent className="p-8 space-y-6 flex-1">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5 px-3">
                      {item.interviewType || "LABOR INTAKE"}
                    </Badge>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">
                      {item.clientName}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-all border border-primary/20">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground uppercase font-bold tracking-widest">
                    <Building2 className="h-3.5 w-3.5 opacity-50" /> {item.companyName || "NÃO INFORMADO"}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground uppercase font-bold tracking-widest">
                    <Clock className="h-3.5 w-3.5 opacity-50" /> Realizada em: {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Agosto/24'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                  <button className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest">
                    <FileText className="h-4 w-4" /> Ver Relatório
                  </button>
                  <button className="flex items-center gap-2 text-[10px] font-black text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
                    Analisar IA <Brain className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-white/5 opacity-30">
            <MessageSquare className="h-16 w-16 text-muted-foreground" />
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center">Nenhum atendimento no radar</p>
            <Button onClick={() => setIsNewFormOpen(true)} className="gold-gradient text-background font-black uppercase text-[11px] px-8 h-12">
              Novo Atendimento Estratégico
            </Button>
          </div>
        )}
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsNewFormOpen}>
        <SheetContent className={cn("glass border-white/10 p-0 overflow-hidden bg-[#0a0f1e] shadow-2xl", getDrawerWidthClass())}>
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <SheetHeader>
              <SheetTitle className="text-white font-headline text-4xl uppercase tracking-tighter flex items-center gap-4">
                <MessageSquare className="h-8 w-8 text-primary" /> Roteiro de Entrevista
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                Captura estruturada de fatos para a banca RGMJ.
              </SheetDescription>
            </SheetHeader>
          </div>
          <InterviewForm 
            onSubmit={handleCreateInterview}
            onCancel={() => setIsNewFormOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
