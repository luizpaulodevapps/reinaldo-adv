
"use client"

import { useState, useMemo } from "react"
import { Bell, Zap, Clock, DollarSign, Gavel, AlertCircle, CheckCircle2, History, X, Info, ChevronRight } from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, orderBy, limit, doc, serverTimestamp, writeBatch } from "firebase/firestore"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

const NOTIFICATION_ICONS: Record<string, any> = {
  deadline: Clock,
  hearing: Gavel,
  lead: Zap,
  financial: DollarSign,
  system: Info
}

const NOTIFICATION_COLORS: Record<string, string> = {
  deadline: "text-rose-500",
  hearing: "text-amber-500",
  lead: "text-blue-400",
  financial: "text-emerald-500",
  system: "text-primary"
}

export function NotificationCenter() {
  const db = useFirestore()  
  const { user } = useUser()
  const [open, setOpen] = useState(false)

  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    )
  }, [db, user])

  const { data: notifications } = useCollection(notificationsQuery)

  const unreadCount = useMemo(() => {
    return (notifications || []).filter(n => !n.read).length
  }, [notifications])

  const handleMarkAsRead = (id: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "notifications", id), { read: true })
  }

  const handleMarkAllAsRead = async () => {
    if (!db || !notifications) return
    const unread = notifications.filter(n => !n.read)
    if (unread.length === 0) return
    const batch = writeBatch(db)
    unread.forEach(n => {
      batch.update(doc(db, "notifications", n.id), { read: true })
    })
    await batch.commit()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all group">
          <Bell className="h-4.5 w-4.5 text-white/40 group-hover:text-gold-100 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white border-2 border-[#0a0a14] shadow-lg animate-in zoom-in">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[400px] p-0 bg-[#0d121f] border-white/10 shadow-2xl rounded-2xl overflow-hidden font-sans">
        <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Radar de Notificações</h3>
            {unreadCount > 0 && <Badge className="bg-primary text-background text-[9px] font-black">{unreadCount} NOVAS</Badge>}
          </div>
          <button 
            onClick={handleMarkAllAsRead}
            className="text-[9px] font-black text-primary hover:text-white uppercase tracking-widest transition-colors"
          >
            Limpar Tudo
          </button>
        </div>

        <ScrollArea className="h-[450px]">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y divide-white/5">
              {notifications.map((n) => {
                const Icon = NOTIFICATION_ICONS[n.type] || Info
                const color = NOTIFICATION_COLORS[n.type] || "text-primary"
                
                return (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-5 flex gap-4 hover:bg-white/[0.02] transition-colors relative group",
                      !n.read && "bg-primary/[0.02]"
                    )}
                    onClick={() => !n.read && handleMarkAsRead(n.id)}
                  >
                    {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-none border border-white/5 bg-black/20", color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={cn("text-xs font-bold uppercase truncate tracking-tight", n.read ? "text-white/60" : "text-white")}>
                          {n.title}
                        </h4>
                        <span className="text-[9px] font-bold text-muted-foreground/40 whitespace-nowrap">
                          {n.createdAt?.toDate ? format(n.createdAt.toDate(), "HH:mm") : '---'}
                        </span>
                      </div>
                      <p className={cn("text-[11px] leading-relaxed line-clamp-2", n.read ? "text-muted-foreground/40" : "text-muted-foreground")}>
                        {n.message}
                      </p>
                      {n.link && (
                        <Link 
                          href={n.link} 
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest pt-1 hover:underline"
                        >
                          Ver Detalhes <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center px-10 opacity-20 space-y-4">
              <Bell className="h-12 w-12" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Ambiente Silencioso</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 bg-black/40 border-t border-white/5 text-center">
          <Link 
            href="/notifications" 
            onClick={() => setOpen(false)}
            className="text-[10px] font-black text-muted-foreground hover:text-white uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors"
          >
            <History className="h-3.5 w-3.5" /> Histórico Completo
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
