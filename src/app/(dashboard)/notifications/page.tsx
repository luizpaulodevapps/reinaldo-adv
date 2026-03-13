
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  Clock, 
  Zap, 
  DollarSign, 
  Gavel, 
  Info, 
  CheckCircle2, 
  Trash2, 
  Filter, 
  Search,
  ChevronRight,
  History,
  LayoutGrid
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, where, orderBy, doc, serverTimestamp } from "firebase/firestore"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import Link from "next/link"

const NOTIFICATION_ICONS: Record<string, any> = {
  deadline: Clock,
  hearing: Gavel,
  lead: Zap,
  financial: DollarSign,
  system: Info
}

const NOTIFICATION_LABELS: Record<string, string> = {
  deadline: "PRAZO JUDICIAL",
  hearing: "AUDIÊNCIA",
  lead: "TRIAGEM / LEAD",
  financial: "CENTRAL FINANCEIRA",
  system: "ALERTA DO SISTEMA"
}

export default function NotificationsHistoryPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")

  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user])

  const { data: notifications, isLoading } = useCollection(notificationsQuery)

  const filtered = useMemo(() => {
    if (!notifications) return []
    return notifications.filter(n => 
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [notifications, searchTerm])

  const handleMarkAsRead = (id: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "notifications", id), { read: true })
  }

  const handleDelete = (id: string) => {
    if (!db || !confirm("Excluir esta notificação do histórico?")) return
    deleteDocumentNonBlocking(doc(db, "notifications", id))
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">CENTRO DE NOTIFICAÇÕES</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Audit de Eventos</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] opacity-60">Histórico cronológico de telemetria RGMJ.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrar eventos..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="glass border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="min-h-[600px]">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auditando Histórico...</span>
            </div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-white/5">
              {filtered.map((n) => {
                const Icon = NOTIFICATION_ICONS[n.type] || Info
                return (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.01] transition-all group",
                      !n.read && "bg-primary/[0.01]"
                    )}
                  >
                    <div className="flex items-start gap-6">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all shadow-xl",
                        n.read ? "bg-white/5 border-white/5 text-white/20" : "bg-primary/10 border-primary/20 text-primary"
                      )}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{NOTIFICATION_LABELS[n.type]}</span>
                          {!n.read && <Badge className="bg-emerald-500/10 text-emerald-500 border-0 h-5 px-2 text-[8px] font-black uppercase animate-pulse">NOVO</Badge>}
                        </div>
                        <h3 className={cn("text-lg font-black uppercase tracking-tight", n.read ? "text-white/40" : "text-white")}>{n.title}</h3>
                        <p className={cn("text-sm leading-relaxed max-w-2xl", n.read ? "text-white/20" : "text-white/60")}>{n.message}</p>
                        <div className="flex items-center gap-4 pt-2">
                          <span className="text-[10px] font-mono font-bold text-muted-foreground/40 flex items-center gap-2">
                            <Clock className="h-3 w-3" /> {n.createdAt?.toDate ? format(n.createdAt.toDate(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : '---'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end md:self-center">
                      {!n.read && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleMarkAsRead(n.id)}
                          className="h-10 border-primary/20 text-primary hover:bg-primary/10 font-black text-[10px] uppercase px-6 rounded-xl"
                        >
                          Arquivar Alerta
                        </Button>
                      )}
                      {n.link && (
                        <Button asChild variant="ghost" size="icon" className="h-10 w-10 text-white/20 hover:text-white rounded-xl">
                          <Link href={n.link}><ExternalLink className="h-5 w-5" /></Link>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(n.id)}
                        className="h-10 w-10 text-white/10 hover:text-rose-500 rounded-xl"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-48 flex flex-col items-center justify-center opacity-20 text-center space-y-6">
              <History className="h-20 w-20" />
              <p className="text-sm font-black uppercase tracking-[0.5em]">Histórico de eventos vazio</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
