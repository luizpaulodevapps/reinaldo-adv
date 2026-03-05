
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  RefreshCw, 
  Zap, 
  ChevronRight, 
  Users, 
  Building2, 
  History, 
  Scale,
  Loader2,
  Wallet,
  CheckCircle2,
  Printer,
  TrendingUp
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, where, serverTimestamp } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function FinancialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("advogados")
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [isPayConfirmOpen, setIsPayConfirmOpen] = useState(false)
  const [folhaLoading, setFolhaLoading] = useState(false)
  
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const canQuery = !!user && !!db

  const staffQuery = useMemoFirebase(() => {
    if (!canQuery) return null
    return query(collection(db!, "staff_profiles"), orderBy("name", "asc"))
  }, [db, canQuery])
  const { data: team, isLoading: loadingTeam } = useCollection(staffQuery)

  const creditsQuery = useMemoFirebase(() => {
    if (!canQuery) return null
    return query(collection(db!, "staff_credits"), orderBy("createdAt", "desc"))
  }, [db, canQuery])
  const { data: credits, isLoading: loadingCredits } = useCollection(creditsQuery)

  const titlesQuery = useMemoFirebase(() => {
    if (!canQuery) return null
    return query(collection(db!, "financial_titles"), where("status", "==", "Recebido"))
  }, [db, canQuery])
  const { data: receivedTitles } = useCollection(titlesQuery)

  const stats = useMemo(() => {
    if (!credits) return { liquidado: 0, liberado: 0, retido: 0, ativos: 0 }
    
    const liquidado = credits.filter(c => c.status === 'Pago').reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
    const liberado = credits.filter(c => c.status === 'Disponível').reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
    const retido = credits.filter(c => c.status === 'Retido').reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
    const ativos = new Set(credits.filter(c => c.status === 'Disponível').map(c => c.staffId)).size

    return { liquidado, liberado, retido, ativos }
  }, [credits])

  const filteredTeam = useMemo(() => {
    if (!team) return []
    let list = team.filter(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (activeTab === "advogados") return list.filter(m => m.role === "lawyer" || m.role === "admin")
    if (activeTab === "colaboradores") return list.filter(m => m.role === "assistant" || m.role === "financial")
    
    return list
  }, [team, searchTerm, activeTab])

  const getStaffBalance = (staffId: string) => {
    if (!credits) return 0
    return credits
      .filter(c => c.staffId === staffId && c.status === 'Disponível')
      .reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
  }

  const handleRodarFolha = async () => {
    if (!receivedTitles || !team || !db) return
    setFolhaLoading(true)

    let createdCount = 0
    for (const title of receivedTitles) {
      const existing = credits?.find(c => c.financialTitleId === title.id)
      if (!existing && title.processResponsibleStaffId) {
        const amount = (Number(title.value) || 0) * 0.3
        
        await addDocumentNonBlocking(collection(db!, "staff_credits"), {
          staffId: title.processResponsibleStaffId,
          financialTitleId: title.id,
          description: `Repasse: ${title.description}`,
          amount: amount,
          status: "Disponível",
          honorariumPercentage: 30,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        createdCount++
      }
    }

    setFolhaLoading(false)
    toast({
      title: "Folha Processada",
      description: `${createdCount} novos créditos liberados.`
    })
  }

  const handleConfirmQuitar = () => {
    if (!selectedStaff || !credits || !db) return

    const pendingCredits = credits.filter(c => c.staffId === selectedStaff.id && c.status === 'Disponível')
    
    pendingCredits.forEach(c => {
      const cRef = doc(db!, "staff_credits", c.id)
      updateDocumentNonBlocking(cRef, {
        status: "Pago",
        paymentDate: new Date().toISOString().split('T')[0],
        updatedAt: serverTimestamp()
      })
    })

    toast({ title: "Saldo Quitado", description: `Pagamento para ${selectedStaff.name} processado.` })
    setIsPayConfirmOpen(false)
  }

  const isLoading = loadingTeam || loadingCredits

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span>Dashboard</span>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Carteiras & Repasses</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase tracking-tighter">Gestão de Carteiras</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-70">
            AUDITORIA DE SALDOS E CONTROLE DE HONORÁRIOS RGMJ.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRodarFolha} disabled={folhaLoading} className="glass border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase h-11 gap-2 px-6">
            {folhaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Rodar Folha
          </Button>
          <Button variant="outline" className="glass border-primary/20 text-primary text-[10px] font-black uppercase h-11 gap-2 px-6" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5" /> Sincronizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Liquidado", value: stats.liquidado, color: "text-emerald-500" },
          { label: "Saldos em Aberto", value: stats.liberado, color: "text-primary" },
          { label: "Provisionado", value: stats.retido, color: "text-blue-500" },
          { label: "Membros Ativos", value: stats.ativos, color: "text-muted-foreground", isCurrency: false },
        ].map((s, i) => (
          <Card key={i} className="glass border-white/5 h-32 flex flex-col justify-center">
            <CardContent className="p-6">
              <p className={cn("text-[9px] font-black uppercase tracking-widest mb-2", s.color)}>{s.label}</p>
              <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
                {s.isCurrency === false ? s.value : `R$ ${s.value.toLocaleString('pt-BR')}`}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="advogados" onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#0a1420]/50 border border-white/5 h-12 p-1 gap-1 w-full justify-start rounded-xl">
          <TabsTrigger value="advogados" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full px-8">Advogados</TabsTrigger>
          <TabsTrigger value="colaboradores" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full px-8">Equipe Apoio</TabsTrigger>
          <TabsTrigger value="banca" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full px-8">Banca</TabsTrigger>
          <TabsTrigger value="historico" className="data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase h-full px-8">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auditando Carteiras RGMJ...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow className="border-white/5">
                      <TableHead className="text-[9px] font-black uppercase py-6 pl-10">Membro da Banca</TableHead>
                      <TableHead className="text-[9px] font-black uppercase py-6 text-center">Perfil</TableHead>
                      <TableHead className="text-[9px] font-black uppercase py-6 text-right">Saldo Disponível</TableHead>
                      <TableHead className="text-[9px] font-black uppercase py-6 text-right pr-10">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeam.map((member) => {
                      const balance = getStaffBalance(member.id)
                      return (
                        <TableRow key={member.id} className="border-white/5 hover-gold transition-colors">
                          <TableCell className="py-6 pl-10">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 border border-primary/20"><AvatarFallback className="text-[10px] font-black bg-secondary text-primary uppercase">{member.name.substring(0, 2)}</AvatarFallback></Avatar>
                              <span className="text-sm font-black text-white uppercase tracking-tight">{member.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[8px] font-black border-white/10 uppercase">{member.role}</Badge>
                          </TableCell>
                          <TableCell className={cn("text-right font-black text-sm", balance > 0 ? "text-emerald-400" : "text-white/20")}>
                            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right pr-10">
                            <div className="flex justify-end gap-6">
                              <button onClick={() => { setSelectedStaff(member); setIsWalletOpen(true); }} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">VER CARTEIRA</button>
                              <button onClick={() => { setSelectedStaff(member); setIsPayConfirmOpen(true); }} disabled={balance <= 0} className={cn("text-[10px] font-black uppercase tracking-widest", balance > 0 ? "text-emerald-500 hover:text-emerald-400" : "text-white/10 opacity-50")}>QUITAR</button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isWalletOpen} onOpenChange={setIsWalletOpen}>
        <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[800px] p-0 overflow-hidden shadow-2xl font-sans">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-2xl"><AvatarFallback className="font-black text-primary bg-secondary uppercase">{selectedStaff?.name?.substring(0, 2)}</AvatarFallback></Avatar>
              <div>
                <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Dossiê: {selectedStaff?.name}</DialogTitle>
                <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Extrato de lançamentos e repasses.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Saldo Disponível</p>
              <p className="text-2xl font-black text-emerald-400">R$ {getStaffBalance(selectedStaff?.id).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableBody>
                {credits?.filter(c => c.staffId === selectedStaff?.id).map((credit) => (
                  <TableRow key={credit.id} className="border-white/5">
                    <TableCell className="pl-8 py-4">
                      <p className="text-xs font-bold text-white uppercase">{credit.description}</p>
                      <p className="text-[9px] text-muted-foreground font-bold">{credit.createdAt?.toDate ? format(credit.createdAt.toDate(), "dd/MM/yyyy") : '--/--/----'}</p>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <p className="text-sm font-black text-white">R$ {(credit.amount || 0).toLocaleString('pt-BR')}</p>
                      <Badge className={cn("text-[8px] font-black uppercase mt-1", credit.status === 'Pago' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>{credit.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter className="p-8 bg-black/20 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsWalletOpen(false)} className="text-muted-foreground uppercase font-black text-[10px]">Fechar</Button>
            <Button className="glass border-primary/20 text-primary font-black uppercase text-[10px] px-8 gap-2" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Imprimir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPayConfirmOpen} onOpenChange={setIsPayConfirmOpen}>
        <DialogContent className="glass border-emerald-500/20 bg-[#0a0f1e] sm:max-w-[450px] p-10 text-center font-sans">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter mb-4">Confirmar Quitação?</DialogTitle>
          <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest leading-loose">
            Autorizando liquidação de <span className="text-emerald-400 font-black">R$ {getStaffBalance(selectedStaff?.id).toLocaleString('pt-BR')}</span> para <span className="text-white">{selectedStaff?.name}</span>.
          </p>
          <div className="mt-10 flex flex-col gap-3">
            <Button onClick={handleConfirmQuitar} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-14 uppercase text-[11px] rounded-xl shadow-xl">Confirmar Pagamento</Button>
            <Button variant="ghost" onClick={() => setIsPayConfirmOpen(false)} className="text-muted-foreground uppercase font-black text-[10px]">Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
