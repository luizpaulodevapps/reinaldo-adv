"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  PlusCircle, 
  ChevronRight, 
  LayoutGrid,
  ArrowRight,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent,
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { LeadForm } from "@/components/leads/lead-form"
import { collection, query, serverTimestamp, doc, limit, orderBy } from "firebase/firestore"
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { moveFile } from "@/services/google-drive"
import { getValidGoogleAccessToken } from "@/services/google-token"
import { normalizeGoogleWorkspaceSettings } from "@/services/google-workspace"
import { useAuth } from "@/firebase"

const columns = [
  { id: "novo", title: "NOVO LEAD", color: "text-blue-400" },
  { id: "atendimento", title: "ATENDIMENTO", color: "text-amber-400" },
  { id: "burocracia", title: "BUROCRACIA", color: "text-emerald-400" },
  { id: "distribuicao", title: "DISTRIBUIÇÃO", color: "text-purple-400" },
]

export default function LeadsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const auth = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [listLimit, setListLimit] = useState(50)
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  const leadsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "leads"), orderBy("updatedAt", "desc"), limit(listLimit))
  }, [db, user, listLimit])

  const { data: leadsData } = useCollection(leadsQuery)
  const leads = useMemo(() => (leadsData || []).filter(l => l.status !== 'arquivado'), [leadsData])

  const googleSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleSettingsData } = useDoc(googleSettingsRef)
  const googleSettings = useMemo(() => normalizeGoogleWorkspaceSettings(googleSettingsData), [googleSettingsData])

  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)

  const handleOpenLead = (lead: any) => { 
    router.push(`/leads/${lead.id}`)
  }

  const handleDragStart = (id: string) => setDraggedLeadId(id)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  
  const handleDrop = async (status: string) => {
    if (!draggedLeadId || !db) return
    
    const lead = leads.find(l => l.id === draggedLeadId)
    const oldStatus = lead?.status || "novo"
    
    if (oldStatus === status) return

    updateDocumentNonBlocking(doc(db, "leads", draggedLeadId), { status, updatedAt: serverTimestamp() })
    
    // Automação Google Drive: Mover de Leads para Clientes se for distribuído
    if (status === 'distribuicao' && lead?.driveFolderId && lead?.driveStatus === 'pasta_lead') {
      const accessToken = await getValidGoogleAccessToken(auth)
      if (accessToken && googleSettings.clientsFolderId) {
        try {
          await moveFile(accessToken, lead.driveFolderId, googleSettings.clientsFolderId, googleSettings.leadsFolderId)
          updateDocumentNonBlocking(doc(db, "leads", draggedLeadId), { 
            driveStatus: 'pasta_cliente',
            updatedAt: serverTimestamp() 
          })
          toast({ title: "Workspace Migrado", description: "A pasta do Drive foi movida para a raiz de Clientes Ativos." })
        } catch (e) {
          console.error("Erro ao mover pasta:", e)
        }
      }
    }

    if (user && lead) {
      const colTitle = columns.find(c => c.id === status)?.title || status.toUpperCase()
      addDocumentNonBlocking(collection(db, "notifications"), {
        userId: user.uid,
        title: "Lead Movimentado",
        message: `${lead.name.toUpperCase()} movido para a coluna ${colTitle}.`,
        type: "lead",
        severity: "info",
        read: false,
        link: "/leads",
        createdAt: serverTimestamp()
      })
    }

    setDraggedLeadId(null)
  }

  const handleCreateLead = async (leadData: any) => {
    if (!db || !user) return

    const newLeadRef = doc(collection(db, "leads"))
    const newLead = {
      ...leadData,
      id: newLeadRef.id,
      status: "novo",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid
    }

    await setDocumentNonBlocking(newLeadRef, newLead, {})
    
    addDocumentNonBlocking(collection(db, "notifications"), {
      userId: user.uid,
      title: "Novo Lead Capturado",
      message: `O lead ${leadData.name.toUpperCase()} foi inserido no funil de triagem.`,
      type: "lead",
      severity: "info",
      read: false,
      link: `/leads/${newLeadRef.id}`,
      createdAt: serverTimestamp()
    })

    setIsNewEntryOpen(false)
    toast({ title: "Lead Protocolado", description: "O novo atendimento foi injetado no funil." })
    
    // Redireciona imediatamente para o dossiê para agendar o atendimento
    router.push(`/leads/${newLeadRef.id}?action=schedule`)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/40 mb-2">
            <LayoutGrid className="h-3 w-3" /><Link href="/">INÍCIO</Link><ChevronRight className="h-2 w-2" /><span className="text-white">FUNIL DE LEADS</span>
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Triagem de Oportunidades</h1>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="gold-gradient text-black font-black gap-3 px-6 h-11 rounded-xl text-xs tracking-widest shadow-xl">
          <PlusCircle className="h-4 w-4" /> NOVO ATENDIMENTO
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-12 scrollbar-hide min-h-[600px]">
        {columns.map((col) => {
          const leadsInCol = leads.filter(l => (l.status || "novo") === col.id)
          return (
            <div key={col.id} className="min-w-[340px] flex-1 flex flex-col" onDragOver={handleDragOver} onDrop={() => handleDrop(col.id)}>
              <div className="flex items-center justify-between mb-4 px-4 bg-white/[0.02] py-2.5 rounded-xl border border-white/5 shadow-inner">
                <div className="flex items-center gap-3"><div className={cn("w-2 h-2 rounded-full", col.color.replace('text-', 'bg-'))} /><h3 className={cn("font-black text-[10px] tracking-[0.25em] uppercase", col.color)}>{col.title}</h3></div>
                <Badge variant="secondary" className="bg-white/5 text-[10px] border-white/5 font-black h-6 px-2.5 rounded-lg">{leadsInCol.length}</Badge>
              </div>
              <div className={cn("space-y-4 flex-1 bg-white/[0.01] rounded-2xl p-3 border border-white/5 transition-all", draggedLeadId && "ring-1 ring-primary/20")}>
                {leadsInCol.map((lead) => (
                  <Card key={lead.id} draggable onDragStart={() => handleDragStart(lead.id)} className={cn("glass hover-gold transition-all cursor-grab active:cursor-grabbing border-white/5 shadow-lg rounded-xl overflow-hidden group", draggedLeadId === lead.id && "opacity-50")} onClick={() => handleOpenLead(lead)}>
                    <CardContent className="p-4 space-y-4 text-left">
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-white group-hover:text-primary uppercase truncate leading-none">{lead.name}</div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{lead.type || 'Geral'}</p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex gap-1.5 flex-wrap">
                          {lead.driveFolderId && <Badge variant="outline" className="text-[7px] border-primary/20 text-primary bg-primary/5 uppercase font-black flex items-center gap-1">DRIVE OK</Badge>}
                          {lead.cpf && <Badge variant="outline" className="text-[7px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5 uppercase font-black">CPF OK</Badge>}
                          {lead.source && <Badge variant="outline" className="text-[7px] border-white/10 text-white/40 uppercase font-black">{lead.source}</Badge>}
                        </div>
                        <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[700px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans flex flex-col h-[90vh]">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between flex-none shadow-xl">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                <PlusCircle className="h-6 w-6" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter">Novo Atendimento</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">Protocolo de Entrada</Badge>
                </div>
              </div>
            </div>
          </div>
          <LeadForm 
            existingLeads={leads} 
            onSubmit={handleCreateLead}
            onSelectExisting={(l) => {
              handleOpenLead(l)
              setIsNewEntryOpen(false)
            }}
            onCancel={() => setIsNewEntryOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}