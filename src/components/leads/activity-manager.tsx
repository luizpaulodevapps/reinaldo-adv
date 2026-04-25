
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Bell, 
  Calendar, 
  Phone, 
  Mail, 
  MessageSquare, 
  StickyNote, 
  Plus, 
  Clock, 
  User, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  ShieldAlert
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ActivityManagerProps {
  leadId: string
  onNavigateToTab?: (tab: string) => void
}

const ACTIVITY_TYPES = [
  { id: "Lembrete", icon: Bell, label: "Lembrete" },
  { id: "Reunião", icon: Calendar, label: "Reunião" },
  { id: "Ligação", icon: Phone, label: "Ligação" },
  { id: "E-mail", icon: Mail, label: "E-mail" },
  { id: "WhatsApp", icon: MessageSquare, label: "WhatsApp" },
  { id: "Nota", icon: StickyNote, label: "Nota Interna" },
  { id: "Sistema", icon: ShieldAlert, label: "Log de Sistema" },
]

export function ActivityManager({ leadId, onNavigateToTab }: ActivityManagerProps) {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    type: "Lembrete",
    subject: "",
    scheduledAt: "",
    duration: "30",
    description: "",
    responsibleId: user?.uid || "",
    responsibleName: user?.displayName || "Membro da Equipe"
  })

  // Busca histórico de atividades do lead
  const activitiesQuery = useMemoFirebase(() => {
    if (!db || !leadId) return null
    return query(
      collection(db, "activities"),
      where("leadId", "==", leadId),
      orderBy("createdAt", "desc")
    )
  }, [db, leadId])

  const { data: activities, isLoading } = useCollection(activitiesQuery)

  const handleCreateActivity = async () => {
    if (!db || !formData.subject || !formData.scheduledAt) {
      toast({ variant: "destructive", title: "Campos Obrigatórios", description: "Defina o assunto e o agendamento." })
      return
    }

    setLoading(true)
    try {
      await addDocumentNonBlocking(collection(db, "activities"), {
        leadId,
        type: formData.type,
        subject: formData.subject.toUpperCase(),
        scheduledAt: formData.scheduledAt,
        duration: Number(formData.duration),
        description: formData.description,
        responsibleId: formData.responsibleId,
        responsibleName: formData.responsibleName,
        status: "Planejado",
        createdAt: serverTimestamp()
      })

      setFormData(prev => ({
        ...prev,
        subject: "",
        scheduledAt: "",
        description: ""
      }))
      
      toast({ title: "Atividade Agendada" })
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao agendar" })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsDone = (id: string) => {
    if (!db) return
    updateDocumentNonBlocking(doc(db, "activities", id), {
      status: "Realizado",
      completedAt: serverTimestamp()
    })
    toast({ title: "Atividade Concluída" })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full animate-in fade-in duration-500">
      
      {/* LADO ESQUERDO: HISTÓRICO */}
      <div className="lg:col-span-5 flex flex-col h-full border-r border-white/5 pr-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.25em] flex items-center gap-3">
            <Clock className="h-4 w-4 text-primary" /> Histórico de Atividades
          </h3>
          <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary">
            {activities?.length || 0} REGISTROS
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-8 pr-4">
              {activities.map((act) => {
                const typeInfo = ACTIVITY_TYPES.find(t => t.id === act.type) || ACTIVITY_TYPES[0]
                const Icon = typeInfo.icon
                return (
                  <div key={act.id} className="relative pl-8 group">
                    {/* Linha da Timeline */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white/5 group-last:bottom-auto group-last:h-4" />
                    <div className={cn(
                      "absolute left-[-5px] top-0 w-3 h-3 rounded-full border-2 border-[#0a0f1e] shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                      act.status === 'Realizado' ? "bg-emerald-500" : "bg-primary"
                    )} />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            {act.status === 'Realizado' ? 'REALIZADO' : 'PLANEJADO'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-white/30">
                          {act.scheduledAt ? format(new Date(act.scheduledAt), "dd/MM HH:mm") : '---'}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 group-hover:border-primary/20 transition-all">
                        <h4 className="text-xs font-bold text-white uppercase tracking-tight mb-2">{act.subject}</h4>
                        {act.description && <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 italic mb-3">{act.description}</p>}
                        
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 border border-white/10">
                              <AvatarFallback className="bg-secondary text-[8px] font-black">{act.responsibleName?.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="text-[9px] font-bold text-white/40 uppercase">{act.responsibleName}</span>
                          </div>
                          {act.status !== 'Realizado' && (
                            <button 
                              onClick={() => handleMarkAsDone(act.id)}
                              className="text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors"
                            >
                              Finalizar
                            </button>
                          )}
                          {act.type === 'Entrevista' && onNavigateToTab && (
                            <button 
                              onClick={() => onNavigateToTab('entrevista')}
                              className="text-[9px] font-black text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
                            >
                              Ver Resumo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
              <Calendar className="h-12 w-12" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma atividade criada ainda.</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* LADO DIREITO: FORMULÁRIO */}
      <div className="lg:col-span-7 flex flex-col space-y-8">
        <h3 className="text-sm font-black text-white uppercase tracking-[0.25em] flex items-center gap-3">
          <Plus className="h-4 w-4 text-primary" /> Criar Atividade
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tipo</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
              <SelectTrigger className="bg-black/40 border-white/10 h-12 text-white font-bold uppercase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d121f] text-white">
                {ACTIVITY_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-3 uppercase font-black text-[10px] tracking-widest">
                      <type.icon className="h-4 w-4 opacity-50" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Responsável</Label>
            <div className="bg-black/40 border border-white/10 h-12 rounded-lg flex items-center px-4 gap-3">
              <User className="h-4 w-4 text-primary/40" />
              <span className="text-xs font-bold text-white uppercase">{formData.responsibleName}</span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Assunto *</Label>
            <Input 
              value={formData.subject} 
              onChange={e => setFormData({...formData, subject: e.target.value.toUpperCase()})}
              className="bg-black/40 border-white/10 h-12 text-white font-bold" 
              placeholder="EX: RETORNO SOBRE PROCURAÇÃO" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Agendar para *</Label>
            <Input 
              type="datetime-local"
              value={formData.scheduledAt} 
              onChange={e => setFormData({...formData, scheduledAt: e.target.value})}
              className="bg-black/40 border-white/10 h-12 text-white font-bold" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Duração (minutos)</Label>
            <Input 
              type="number"
              value={formData.duration} 
              onChange={e => setFormData({...formData, duration: e.target.value})}
              className="bg-black/40 border-white/10 h-12 text-white font-bold" 
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Descrição</Label>
            <Textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="bg-black/40 border-white/10 min-h-[120px] text-white resize-none p-4 text-sm" 
              placeholder="Detalhes da pauta..." 
            />
          </div>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleCreateActivity}
            disabled={loading}
            className="w-full h-14 gold-gradient text-background font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-[1.01] transition-all"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Plus className="h-5 w-5 mr-3" />}
            Criar Atividade
          </Button>
        </div>
      </div>
    </div>
  )
}

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
