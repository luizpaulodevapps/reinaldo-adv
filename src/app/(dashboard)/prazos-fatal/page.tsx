"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ChevronLeft, Brain, Loader2, Save, Scale, User as UserIcon, ListChecks, History, Plus, Calendar, Navigation, AlarmClock, Gavel, DollarSign, TrendingUp, MapPin, Video, Clock, Bookmark, ShieldCheck, Zap, ChevronDown, Info, XCircle, Handshake, Users, Library, AlertCircle, ExternalLink
} from "lucide-react"
import { useFirestore, useUser, useAuth, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking, useDoc } from "@/firebase"
import { collection, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { cn, maskCurrency, parseCurrencyToNumber } from "@/lib/utils"
import { format, parseISO, addDays, addBusinessDays, differenceInDays, differenceInBusinessDays } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { syncActToGoogleCalendar } from "@/services/google-calendar-sync"
import { normalizeGoogleWorkspaceSettings } from "@/services/google-workspace"

export default function PrazosFatalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const procId = searchParams.get("procId")
  const mode = (searchParams.get("mode") || "prazo") as 'atendimento' | 'diligencia' | 'prazo' | 'audiencia' | 'financeiro'
  
  const { toast } = useToast()
  const db = useFirestore()
  const auth = useAuth()
  const { user } = useUser()

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSyncingAct, setIsSyncingAct] = useState(false)
  const [deadlineDuration, setDeadlineDuration] = useState("")

  // Carregar dados do processo
  const processRef = useMemo(() => (db && procId) ? doc(db, "processes", procId) : null, [db, procId])
  const { data: processData, isLoading: isLoadingProc } = useDoc(processRef)

  const [meetingData, setMeetingData] = useState({ 
    title: "", date: format(new Date(), 'yyyy-MM-dd'), time: "09:00", 
    type: "online" as "online" | "presencial", modality: "VIRTUAL" as "VIRTUAL" | "PRESENCIAL",
    location: "Google Meet", notes: "", publicationText: "", 
    publicationDate: format(new Date(), 'yyyy-MM-dd'), 
    calculationType: "Dias Úteis (CPC/CLT)", autoMeet: true,
    value: "", category: "Honorários",
    diligenceTarget: "", courtRoom: "",
    deadlineType: "", strategicNotes: "",
    diligenceType: "", 
    diligenceSubTasks: [] as string[],
    priority: "NORMAL" as "NORMAL" | "URGENTE" | "CRÍTICO",
    hearingType: "",
    witnesses: [] as string[],
    tacticalTheses: "",
    installments: 1,
    paymentMethod: "PIX",
    hasCommission: false,
    deductions: "",
    financeType: "ENTRADA" as "ENTRADA" | "SAÍDA"
  })

  const [newTask, setNewTask] = useState("")

  useEffect(() => {
    if (processData) {
      const defaultTitles = {
        atendimento: `REUNIÃO TÁTICA: ${processData.clientName}`,
        diligencia: `DILIGÊNCIA: ${processData.clientName}`,
        prazo: `PRAZO FATAL: ${processData.clientName}`,
        audiencia: `AUDIÊNCIA: ${processData.clientName}`,
        financeiro: `LANÇAMENTO: ${processData.clientName}`
      }
      setMeetingData(prev => ({ ...prev, title: defaultTitles[mode].toUpperCase() }))
    }
  }, [processData, mode])

  const daysDiff = useMemo(() => {
    if (!meetingData.publicationDate || !meetingData.date) return { business: 0, total: 0 }
    const start = parseISO(meetingData.publicationDate)
    const end = parseISO(meetingData.date)
    return {
      business: differenceInBusinessDays(end, start),
      total: differenceInDays(end, start)
    }
  }, [meetingData.publicationDate, meetingData.date])

  const handleSaveAndSync = async () => {
    if (!db || !processData) return
    setIsSyncingAct(true)
    try {
      const targetCollections = {
        atendimento: 'appointments',
        diligencia: 'diligences',
        prazo: 'deadlines',
        audiencia: 'hearings',
        financeiro: 'financial'
      }
      
      const appRef = doc(collection(db, targetCollections[mode]))
      const dateTimeStr = meetingData.date + "T" + meetingData.time + ":00"
      
      const payload = {
        id: appRef.id,
        title: (meetingData.deadlineType || meetingData.title).toUpperCase(),
        startDateTime: dateTimeStr,
        clientName: processData.clientName,
        processId: processData.id,
        processNumber: processData.processNumber,
        type: mode,
        notes: meetingData.notes + "\n" + (meetingData.strategicNotes || ""),
        value: meetingData.value,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'Aberto'
      }

      await setDocumentNonBlocking(appRef, payload, { merge: true })
      
      // MOTOR FINANCEIRO DE ALTA PERFORMANCE
      if (mode === 'financeiro') {
        const totalValueNumeric = parseCurrencyToNumber(meetingData.value)
        const installmentValue = totalValueNumeric / (meetingData.installments || 1)
        
        let commissionPercentage = 0
        let responsibleName = processData.responsibleStaffName
        
        // Busca telemetria de comissão se aplicável
        if (meetingData.hasCommission && meetingData.financeType === 'ENTRADA' && processData.responsibleStaffEmail) {
          const empRef = doc(db, "employees", processData.responsibleStaffEmail.toLowerCase().trim())
          const empSnap = await getDoc(empRef)
          if (empSnap.exists()) {
            commissionPercentage = empSnap.data().commissionPercentage || 0
            responsibleName = empSnap.data().name || responsibleName
          }
        }

        // Lançamento dos Títulos (Receitas/Gastos e Repasses)
        for (let i = 0; i < (meetingData.installments || 1); i++) {
          const dueDate = format(addDays(parseISO(meetingData.date), i * 30), 'yyyy-MM-dd')
          
          // 1. Título Principal (O que o escritório recebe ou gasta)
          const titleId = `${appRef.id}_FIN_${i}`
          const mainTitle = {
            id: titleId,
            type: meetingData.financeType === 'ENTRADA' ? "Entrada (Receita)" : "Saída (Despesa)",
            category: (meetingData.category || (meetingData.financeType === 'ENTRADA' ? "Honorários Contratuais" : "Outros")).toUpperCase(),
            description: `${meetingData.title} (${i+1}/${meetingData.installments})`.toUpperCase(),
            value: installmentValue,
            dueDate: dueDate,
            processId: processData.id,
            processNumber: processData.processNumber,
            clientName: processData.clientName,
            clientId: processData.clientId || "",
            responsibleStaffId: processData.responsibleStaffEmail || "",
            responsibleStaffName: processData.responsibleStaffName,
            status: "Pendente",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
          await setDocumentNonBlocking(doc(db, "financial_titles", titleId), mainTitle, { merge: true })

          // 2. Título de Repasse (Se houver participação cadastrada)
          if (meetingData.hasCommission && meetingData.financeType === 'ENTRADA' && commissionPercentage > 0) {
            const commId = `${appRef.id}_COM_${i}`
            const commissionValue = installmentValue * (commissionPercentage / 100)
            
            const commissionTitle = {
              id: commId,
              type: "Saída (Despesa)",
              category: "Repasse Associado".toUpperCase(),
              description: `REPASSE ADVG: ${meetingData.title} (${i+1}/${meetingData.installments})`.toUpperCase(),
              value: commissionValue,
              dueDate: dueDate,
              processId: processData.id,
              processNumber: processData.processNumber,
              clientName: processData.clientName,
              responsibleStaffId: processData.responsibleStaffEmail,
              responsibleStaffName: responsibleName,
              status: "Pendente",
              originTitleId: titleId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }
            await setDocumentNonBlocking(doc(db, "financial_titles", commId), commissionTitle, { merge: true })
          }
        }
      } else {
        // Integração Calendário para outros modos
        const { syncActToGoogleCalendar } = await import("@/services/google-calendar-sync")
        const calendarSync = await syncActToGoogleCalendar({ 
          auth, 
          googleSettings: normalizeGoogleWorkspaceSettings(googleSettingsData), 
          firestore: db,
          staffEmail: processData?.responsibleStaffEmail,
          act: { ...payload, type: mode as any, useMeet: meetingData.autoMeet }
        })
        if (calendarSync.status === 'synced') {
          updateDocumentNonBlocking(appRef, { calendarEventId: calendarSync.calendarEventId, meetingUrl: calendarSync.meetingUrl })
        }
      }

      toast({ title: "Operação Finalizada", description: mode === 'financeiro' ? "Títulos contábeis e repasses injetados." : "Agenda sincronizada." })
      router.push("/cases")
    } catch (e) {
      console.error("Save Error:", e)
      toast({ variant: "destructive", title: "Erro na Operação" })
    } finally {
      setIsSyncingAct(false)
    }
  }

  const handleAiParse = async () => {
    if (!meetingData.publicationText) return
    setIsAnalyzing(true)
    try {
      const { aiParseDjePublication } = await import("@/ai/flows/ai-parse-dje-publication")
      const result = await aiParseDjePublication({ publicationText: meetingData.publicationText })
      setMeetingData(prev => ({ 
        ...prev, 
        deadlineType: result.deadlineType?.toUpperCase() || prev.deadlineType, 
        strategicNotes: result.summary?.toUpperCase() || prev.strategicNotes 
      }))
    } finally { setIsAnalyzing(false) }
  }

  const handleApplyDeadlineCalculation = () => {
    const days = parseInt(deadlineDuration)
    if (isNaN(days)) return
    const calculatedDate = meetingData.calculationType.includes("Úteis") 
      ? addBusinessDays(parseISO(meetingData.publicationDate), days) 
      : addDays(parseISO(meetingData.publicationDate), days)
    setMeetingData(prev => ({ ...prev, date: format(calculatedDate, 'yyyy-MM-dd') }))
  }

  const googleSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'google') : null, [db])
  const { data: googleSettingsData } = useDoc(googleSettingsRef)

  if (isLoadingProc) return <div className="h-screen flex items-center justify-center bg-[#050810]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  const config = {
    prazo: { color: "rose-500", icon: <AlarmClock className="h-4 w-4" />, label: "Radar de Prazos Fatais" },
    atendimento: { color: "emerald-400", icon: <Calendar className="h-4 w-4" />, label: "Agendamento" },
    diligencia: { color: "blue-400", icon: <Navigation className="h-4 w-4" />, label: "Diligências" },
    audiencia: { color: "yellow-500", icon: <Gavel className="h-4 w-4" />, label: "Audiências" },
    financeiro: { color: "emerald-500", icon: <DollarSign className="h-4 w-4" />, label: "Financeiro" }
  }[mode]

  const labelMini = "text-[9px] font-black text-white/30 uppercase tracking-widest ml-3 block mb-2"

  return (
    <div className="flex-1 bg-[#050810] flex flex-col animate-in slide-in-from-right-10 duration-500 overflow-hidden border-l border-white/5 font-sans relative">
      
      {/* HEADER */}
      <div className="h-16 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between px-8 flex-none z-30 shadow-xl">
        <div className="flex items-center gap-6">
          <Button onClick={() => router.back()} variant="outline" className="border-white/10 text-white rounded-lg h-9 gap-2 hover:bg-white/5 text-[10px] uppercase font-black tracking-widest px-4">
            <ChevronLeft className="h-3 w-3" /> Painel Anterior
          </Button>
          <div className="h-8 w-[1px] bg-white/5"></div>
          <h2 className={cn("font-black text-[11px] uppercase tracking-[0.3em]", `text-${config.color}`)}>{config.label}</h2>
        </div>
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-lg">
           <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", `bg-${config.color}`)}></div>
           <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Live Engine</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-[1400px] mx-auto p-12 space-y-12">
           
           {/* CONTEXT AREA */}
           <div className="p-6 rounded-3xl bg-[#0a0f1e] border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-8 items-center shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Scale className="h-24 w-24" />
              </div>

              <div className="flex items-center gap-4">
                 <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 shadow-xl", `text-${config.color}`)}>{config.icon}</div>
                 <div>
                    <p className="text-[8px] text-white/20 uppercase mb-0.5 tracking-widest font-black">Operação</p>
                    <p className="text-white font-black text-[11px] tracking-widest uppercase">{mode}</p>
                 </div>
              </div>

              <Link 
                  href={`/processes/${processData?.id}`}
                  className="border-l border-white/5 pl-8 h-12 flex flex-col justify-center hover:bg-white/[0.02] transition-colors cursor-pointer group/link"
               >
                  <p className="text-[8px] text-white/20 uppercase mb-1 tracking-widest font-black flex items-center gap-1.5 group-hover/link:text-primary transition-colors">
                    <History className="h-2.5 w-2.5" /> Protocolo CNJ
                  </p>
                  <p className="text-white font-black text-[12px] font-mono tracking-tight uppercase truncate">{processData?.processNumber}</p>
               </Link>

              <Link 
                  href={`/processes/${processData?.id}`}
                  className="border-l border-white/5 pl-8 h-12 flex flex-col justify-center hover:bg-white/[0.02] transition-colors cursor-pointer group/link"
               >
                  <p className="text-[8px] text-white/20 uppercase mb-1 tracking-widest font-black flex items-center gap-1.5 group-hover/link:text-primary transition-colors">
                    <Users className="h-2.5 w-2.5" /> Litigância
                  </p>
                  <div className="flex items-center gap-2 overflow-hidden">
                     <span className="text-white font-black text-[10px] uppercase truncate">{processData?.clientName}</span>
                     <span className="text-white/20 font-black text-[8px] italic">VS</span>
                     <span className="text-white/60 font-black text-[10px] uppercase truncate">{processData?.defendantName || '...'}</span>
                  </div>
               </Link>

              <div className="border-l border-white/5 pl-8 h-12 flex items-center justify-between">
                  <Link 
                    href={`/settings/staff?email=${processData?.responsibleStaffEmail}`}
                    className="hover:opacity-80 transition-all cursor-pointer group/staff"
                  >
                     <p className="text-[8px] text-white/20 uppercase mb-1 tracking-widest font-black flex items-center gap-1.5 group-hover/staff:text-primary transition-colors">
                       <UserIcon className="h-2.5 w-2.5" /> Advogado de Frente
                     </p>
                     <p className="text-[#F5D030] font-black text-[10px] uppercase tracking-wider truncate border-b border-transparent group-hover/staff:border-[#F5D030]">
                       {processData?.responsibleStaffName}
                     </p>
                  </Link>
                 <Button 
                   variant="ghost" 
                   onClick={() => router.push(`/settings/staff?email=${processData?.responsibleStaffEmail}`)}
                   className="h-10 w-10 p-0 rounded-xl hover:bg-white/5 border border-white/5 text-white/20 hover:text-primary transition-all ml-4"
                   title="Ver Perfil Técnico"
                 >
                    <ExternalLink className="h-4 w-4" />
                 </Button>
              </div>
           </div>

           <div className="grid grid-cols-12 gap-8">
              <div className="col-span-8 space-y-8">
                 <div className="p-8 rounded-[2rem] bg-[#0a0f1e] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
                    
                    {/* FLUXO: PRAZO FATAL (COMPLETO) */}
                    {mode === 'prazo' && (
                      <div className="space-y-8 animate-in fade-in">
                        <div className="space-y-4">
                           <div className="flex justify-between items-center">
                              <span className={labelMini}>Texto da Publicação / Despacho</span>
                              <Button onClick={handleAiParse} disabled={isAnalyzing} className="h-9 bg-black/40 border border-white/10 text-primary font-black text-[9px] uppercase px-6 rounded-lg gap-2 hover:bg-primary/10 transition-all">
                                 {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3.5 w-3.5" />} ANALISAR COM IA
                              </Button>
                           </div>
                           <Textarea 
                             className="bg-black/30 border-white/5 min-h-[160px] text-white/70 p-6 rounded-2xl resize-none text-[13px] leading-relaxed tracking-wider" 
                             placeholder="Cole o recorte oficial aqui..." 
                             value={meetingData.publicationText} 
                             onChange={e => setMeetingData({...meetingData, publicationText: e.target.value.toUpperCase()})} 
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <Label className={labelMini}>Tipo de Prazo *</Label>
                              <div className="relative">
                                 <select 
                                   className="w-full bg-black/40 border-white/5 h-12 pl-6 pr-10 text-white font-black text-[11px] uppercase rounded-xl appearance-none outline-none focus:border-primary/50 transition-colors custom-scrollbar"
                                   value={meetingData.deadlineType}
                                   onChange={e => setMeetingData({...meetingData, deadlineType: e.target.value})}
                                 >
                                   <option value="">Selecione o Rito...</option>
                                   
                                   <optgroup label="POSTULAÇÃO E INSTRUÇÃO" className="bg-[#0a0f1e] text-primary">
                                      <option value="RÉPLICA À CONTESTAÇÃO">RÉPLICA À CONTESTAÇÃO</option>
                                      <option value="MANIFESTAÇÃO SOBRE DEFESA">MANIFESTAÇÃO SOBRE DEFESA</option>
                                      <option value="MANIFESTAÇÃO SOBRE PROVAS">MANIFESTAÇÃO SOBRE PROVAS</option>
                                      <option value="QUESITOS À PERÍCIA">QUESITOS À PERÍCIA</option>
                                      <option value="MANIFESTAÇÃO SOBRE LAUDO">MANIFESTAÇÃO SOBRE LAUDO</option>
                                      <option value="ALEGAÇÕES FINAIS">ALEGAÇÕES FINAIS</option>
                                   </optgroup>

                                   <optgroup label="RECURSOS E IMPUGNAÇÕES" className="bg-[#0a0f1e] text-primary">
                                      <option value="EMBARGOS DE DECLARAÇÃO">EMBARGOS DE DECLARAÇÃO</option>
                                      <option value="RECURSO ORDINÁRIO (TRT)">RECURSO ORDINÁRIO (TRT)</option>
                                      <option value="APELAÇÃO (TJ/TRF)">APELAÇÃO (TJ/TRF)</option>
                                      <option value="AGRAVO DE INSTRUMENTO">AGRAVO DE INSTRUMENTO</option>
                                      <option value="AGRAVO INTERNO">AGRAVO INTERNO</option>
                                      <option value="CONTRARRAZÕES AO RECURSO">CONTRARRAZÕES AO RECURSO</option>
                                      <option value="RECURSO INOMINADO (JEC)">RECURSO INOMINADO (JEC)</option>
                                   </optgroup>

                                   <optgroup label="TRIBUNAIS SUPERIORES" className="bg-[#0a0f1e] text-primary">
                                      <option value="RECURSO DE REVISTA (TST)">RECURSO DE REVISTA (TST)</option>
                                      <option value="RECURSO ESPECIAL (STJ)">RECURSO ESPECIAL (STJ)</option>
                                      <option value="RECURSO EXTRAORDINÁRIO (STF)">RECURSO EXTRAORDINÁRIO (STF)</option>
                                      <option value="AGRAVO EM RECURSO ESPECIAL">AGRAVO EM RECURSO ESPECIAL (AREsp)</option>
                                      <option value="AGRAVO EM RECURSO DE REVISTA">AGRAVO EM RECURSO DE REVISTA (AIRR)</option>
                                   </optgroup>

                                   <optgroup label="EXECUÇÃO E CÁLCULOS" className="bg-[#0a0f1e] text-primary">
                                      <option value="MANIFESTAÇÃO SOBRE CÁLCULOS">MANIFESTAÇÃO SOBRE CÁLCULOS</option>
                                      <option value="IMPUGNAÇÃO À SENTENÇA">IMPUGNAÇÃO À SENTENÇA</option>
                                      <option value="EMBARGOS À EXECUÇÃO">EMBARGOS À EXECUÇÃO</option>
                                      <option value="AGRAVO DE PETIÇÃO (TRT)">AGRAVO DE PETIÇÃO (TRT)</option>
                                      <option value="EXCEÇÃO DE PRÉ-EXECUTIVIDADE">EXCEÇÃO DE PRÉ-EXECUTIVIDADE</option>
                                   </optgroup>

                                   <optgroup label="DIVERSOS" className="bg-[#0a0f1e] text-primary">
                                      <option value="CUMPRIMENTO DE DESPACHO">CUMPRIMENTO DE DESPACHO</option>
                                      <option value="JUNTADA DE DOCUMENTOS">JUNTADA DE DOCUMENTOS</option>
                                      <option value="MANIFESTAÇÃO GERAL">MANIFESTAÇÃO GERAL</option>
                                   </optgroup>
                                 </select>
                                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
                                 <span className="text-[7px] font-black text-primary uppercase tracking-widest mb-1">Dias Úteis</span>
                                 <span className="text-xl font-black text-white">{daysDiff.business}</span>
                              </div>
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
                                 <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Corridos</span>
                                 <span className="text-xl font-black text-white/40">{daysDiff.total}</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <Label className={labelMini}>Metodologia de Contagem</Label>
                           <div className="flex gap-4">
                              {['Dias Úteis (CPC/CLT)', 'Dias Corridos (Material)'].map(m => (
                                <button 
                                  key={m}
                                  onClick={() => setMeetingData({...meetingData, calculationType: m})}
                                  className={cn(
                                    "flex-1 h-12 rounded-xl border-2 transition-all flex items-center px-6 gap-4",
                                    meetingData.calculationType === m ? "border-primary bg-primary/5" : "border-white/5 bg-black/20"
                                  )}
                                >
                                   <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", meetingData.calculationType === m ? "border-primary" : "border-white/20")}>
                                      {meetingData.calculationType === m && <div className="w-2 h-2 rounded-full bg-primary" />}
                                   </div>
                                   <span className={cn("text-[9px] font-black uppercase tracking-widest", meetingData.calculationType === m ? "text-white" : "text-white/20")}>{m}</span>
                                </button>
                              ))}
                           </div>
                        </div>

                        <div className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 space-y-6">
                           <div className="flex items-center gap-3 text-primary"><TrendingUp className="h-4 w-4" /><h4 className="text-[10px] font-black uppercase tracking-widest">Calculadora de Vencimento</h4></div>
                           <div className="flex gap-4 items-end">
                              <div className="flex-1 space-y-2">
                                 <Label className="text-[8px] font-black text-white/30 uppercase ml-2">Duração do Prazo (Dias)</Label>
                                 <Input type="number" placeholder="Ex: 5, 10, 15..." className="h-12 bg-black/40 border-white/10 rounded-xl text-center font-black text-xl" value={deadlineDuration} onChange={e => setDeadlineDuration(e.target.value)} />
                              </div>
                              <Button onClick={handleApplyDeadlineCalculation} className="h-12 bg-primary text-background font-black text-[10px] uppercase px-10 rounded-xl gap-2 hover:scale-[1.02] transition-transform shadow-xl"><Zap className="h-4 w-4" /> APLICAR PRAZO</Button>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <Label className={labelMini}>Observações Estratégicas</Label>
                           <Textarea 
                             className="bg-black/30 border-white/5 min-h-[100px] text-white/50 p-6 rounded-2xl resize-none text-[11px]" 
                             placeholder="Dicas táticas ou alertas internos sobre o cumprimento..."
                             value={meetingData.strategicNotes}
                             onChange={e => setMeetingData({...meetingData, strategicNotes: e.target.value.toUpperCase()})}
                           />
                        </div>
                      </div>
                    )}

                    {/* MODO: DILIGÊNCIA (EVOLUÍDO) */}
                    {mode === 'diligencia' && (
                      <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                          <Label className={labelMini}>Prioridade da Missão</Label>
                          <div className="flex gap-4">
                            {[
                              { id: 'NORMAL', color: 'border-blue-500/20 bg-blue-500/5 text-blue-400' },
                              { id: 'URGENTE', color: 'border-orange-500/20 bg-orange-500/5 text-orange-400' },
                              { id: 'CRÍTICO', color: 'border-rose-500/20 bg-rose-500/5 text-rose-500' }
                            ].map(p => (
                              <button 
                                key={p.id}
                                onClick={() => setMeetingData({...meetingData, priority: p.id as any})}
                                className={cn(
                                  "flex-1 h-12 rounded-xl border-2 transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest",
                                  meetingData.priority === p.id ? p.color.replace('/5', '/20').replace('/20', '') + " border-current" : "border-white/5 bg-black/20 text-white/20"
                                )}
                              >
                                <div className={cn("w-2 h-2 rounded-full", meetingData.priority === p.id ? "bg-current animate-pulse" : "bg-white/10")} />
                                {p.id}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className={labelMini}>Tipo de Operação</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { id: 'CÓPIA', icon: <History className="h-4 w-4" /> },
                              { id: 'DESPACHO', icon: <Gavel className="h-4 w-4" /> },
                              { id: 'PROTOCOLO', icon: <Zap className="h-4 w-4" /> },
                              { id: 'CITAÇÃO', icon: <ShieldCheck className="h-4 w-4" /> },
                              { id: 'PERÍCIA', icon: <Scale className="h-4 w-4" /> },
                              { id: 'EXTERNA', icon: <MapPin className="h-4 w-4" /> }
                            ].map(t => (
                              <button 
                                key={t.id}
                                onClick={() => setMeetingData({...meetingData, diligenceType: t.id})}
                                className={cn(
                                  "h-14 rounded-xl border transition-all flex items-center px-4 gap-3",
                                  meetingData.diligenceType === t.id ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-white/5 bg-black/20 text-white/20 hover:border-white/10"
                                )}
                              >
                                {t.icon}
                                <span className="text-[9px] font-black uppercase tracking-widest">{t.id}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <Label className={labelMini}>Local da Realização</Label>
                              <div className="relative">
                                 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                 <Input 
                                   className="bg-black/30 border-white/5 h-12 pl-12 text-white font-bold" 
                                   placeholder="Ex: Fórum de São Bernardo" 
                                   value={meetingData.location}
                                   onChange={e => setMeetingData({...meetingData, location: e.target.value.toUpperCase()})}
                                 />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <Label className={labelMini}>Link de Apoio (Se Online)</Label>
                              <div className="relative">
                                 <Video className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                 <Input 
                                   className="bg-black/30 border-white/5 h-12 pl-12 text-white/50" 
                                   placeholder="Google Meet, Zoom..." 
                                   value={meetingData.diligenceTarget}
                                   onChange={e => setMeetingData({...meetingData, diligenceTarget: e.target.value})}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 space-y-6">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-blue-400">
                                 <ListChecks className="h-5 w-5" />
                                 <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Checklist da Missão</h4>
                              </div>
                              <Badge className="bg-blue-500/10 text-blue-400 border-0 text-[10px] font-black">{meetingData.diligenceSubTasks.length} TAREFAS</Badge>
                           </div>

                           <div className="flex gap-3">
                              <Input 
                                placeholder="Adicionar tarefa específica..." 
                                className="bg-white/[0.02] border-white/10 h-12" 
                                value={newTask}
                                onChange={e => setNewTask(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && newTask) {
                                    setMeetingData({...meetingData, diligenceSubTasks: [...meetingData.diligenceSubTasks, newTask.toUpperCase()]})
                                    setNewTask("")
                                  }
                                }}
                              />
                              <Button 
                                onClick={() => {
                                  if (newTask) {
                                    setMeetingData({...meetingData, diligenceSubTasks: [...meetingData.diligenceSubTasks, newTask.toUpperCase()]})
                                    setNewTask("")
                                  }
                                }}
                                className="h-12 bg-blue-500 hover:bg-blue-600 text-white font-black px-6 rounded-xl"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                           </div>

                           <div className="space-y-2">
                              {meetingData.diligenceSubTasks.map((task, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl group animate-in slide-in-from-left-2">
                                  <div className="flex items-center gap-4 text-white/70">
                                    <div className="w-5 h-5 rounded-full border-2 border-blue-500/50 flex items-center justify-center text-[10px] font-black text-blue-400">{idx + 1}</div>
                                    <span className="text-[10px] font-bold uppercase tracking-wide">{task}</span>
                                  </div>
                                  <button 
                                    onClick={() => setMeetingData({...meetingData, diligenceSubTasks: meetingData.diligenceSubTasks.filter((_, i) => i !== idx)})}
                                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-rose-500 transition-all"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    )}

                    {/* MODO: AUDIÊNCIA (EVOLUÍDO) */}
                    {mode === 'audiencia' && (
                      <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                          <Label className={labelMini}>Natureza do Ato Judicial</Label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                              { id: 'CONCILIAÇÃO', icon: <Handshake className="h-4 w-4" /> },
                              { id: 'INSTRUÇÃO', icon: <Gavel className="h-4 w-4" /> },
                              { id: 'UNA', icon: <Scale className="h-4 w-4" /> },
                              { id: 'MEDIAÇÃO', icon: <Users className="h-4 w-4" /> }
                            ].map(t => (
                              <button 
                                key={t.id}
                                onClick={() => setMeetingData({...meetingData, hearingType: t.id})}
                                className={cn(
                                  "h-14 rounded-xl border transition-all flex items-center px-4 gap-3",
                                  meetingData.hearingType === t.id ? "border-yellow-500 bg-yellow-500/10 text-yellow-500" : "border-white/5 bg-black/20 text-white/20 hover:border-white/10"
                                )}
                              >
                                {t.icon}
                                <span className="text-[9px] font-black uppercase tracking-widest">{t.id}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <Label className={labelMini}>Ambiente e Sala</Label>
                              <div className="flex gap-4">
                                <button onClick={() => setMeetingData({...meetingData, type: 'online'})} className={cn("flex-1 h-12 rounded-xl border-2 transition-all flex items-center justify-center gap-3", meetingData.type === 'online' ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-white/5 bg-black/20 text-white/20")}>
                                  <Video className="h-4 w-4" /> <span className="text-[9px] font-black uppercase">Virtual</span>
                                </button>
                                <button onClick={() => setMeetingData({...meetingData, type: 'presencial'})} className={cn("flex-1 h-12 rounded-xl border-2 transition-all flex items-center justify-center gap-3", meetingData.type === 'presencial' ? "border-amber-500 bg-amber-500/10 text-amber-500" : "border-white/5 bg-black/20 text-white/20")}>
                                  <MapPin className="h-4 w-4" /> <span className="text-[9px] font-black uppercase">Presencial</span>
                                </button>
                              </div>
                           </div>
                           <div className="space-y-3">
                              <Label className={labelMini}>Juízo / Vara / Câmara</Label>
                              <div className="relative">
                                 <Library className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                 <Input 
                                   className="bg-black/30 border-white/5 h-12 pl-12 text-white font-bold" 
                                   placeholder="Ex: 45ª Vara do Trabalho" 
                                   value={meetingData.location}
                                   onChange={e => setMeetingData({...meetingData, location: e.target.value.toUpperCase()})}
                                 />
                              </div>
                           </div>
                        </div>

                        {meetingData.type === 'online' && (
                          <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between animate-in zoom-in-95">
                             <div className="flex items-center gap-4">
                                <Video className="h-6 w-6 text-emerald-500" />
                                <div><p className="text-[10px] font-black text-white uppercase tracking-widest">Sincronismo Google Meet Ativo</p><p className="text-[9px] text-emerald-500/60 uppercase font-black tracking-widest leading-none mt-1">O link de vídeo será gerado e enviado ao cliente automaticamente.</p></div>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">AutoMeet</span>
                                <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center justify-end px-1 shadow-[0_0_10px_rgba(16,185,129,0.3)]"><div className="w-3.5 h-3.5 bg-white rounded-full"></div></div>
                             </div>
                          </div>
                        )}

                        <div className="grid grid-cols-12 gap-8">
                           <div className="col-span-12 lg:col-span-7 space-y-6">
                              <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 space-y-6">
                                 <div className="flex items-center gap-3 text-yellow-500">
                                    <Brain className="h-5 w-5" />
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Briefing Tático (Pontos de Fato)</h4>
                                 </div>
                                 <Textarea 
                                   className="bg-white/[0.02] border-white/5 min-h-[180px] text-white/70 p-6 rounded-2xl resize-none text-[12px] leading-relaxed tracking-wider" 
                                   placeholder="Insira as perguntas para testemunhas, teses de ataque e pontos para confissão..." 
                                   value={meetingData.tacticalTheses}
                                   onChange={e => setMeetingData({...meetingData, tacticalTheses: e.target.value.toUpperCase()})}
                                 />
                              </div>
                           </div>
                           <div className="col-span-12 lg:col-span-5 space-y-6">
                              <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 space-y-6">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-cyan-400"><Users className="h-5 w-5" /><h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Rol de Testemunhas</h4></div>
                                    <Badge className="bg-cyan-500/10 text-cyan-400 border-0 text-[10px] font-black">{meetingData.witnesses.length}</Badge>
                                 </div>
                                 <div className="flex gap-2">
                                    <Input 
                                      placeholder="Nome da testemunha..." 
                                      className="bg-white/[0.02] border-white/10 h-11" 
                                      onKeyDown={e => {
                                        if (e.key === 'Enter' && e.currentTarget.value) {
                                          setMeetingData({...meetingData, witnesses: [...meetingData.witnesses, e.currentTarget.value.toUpperCase()]})
                                          e.currentTarget.value = ""
                                        }
                                      }}
                                    />
                                    <Button className="h-11 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all"><Plus className="h-4 w-4" /></Button>
                                 </div>
                                 <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                    {meetingData.witnesses.map((w, i) => (
                                      <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl group animate-in slide-in-from-right-2">
                                         <span className="text-[10px] font-bold text-white/50">{w}</span>
                                         <button onClick={() => setMeetingData({...meetingData, witnesses: meetingData.witnesses.filter((_, idx) => idx !== i)})} className="opacity-0 group-hover:opacity-100 text-rose-500 transition-all"><XCircle className="h-4 w-4" /></button>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* MODO: FINANCEIRO (EVOLUÍDO BI-MODAL) */}
                    {mode === 'financeiro' && (
                      <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        
                        <div className="flex gap-4 p-1.5 bg-black/40 rounded-2xl border border-white/5 w-fit mx-auto shadow-2xl">
                          <button 
                            onClick={() => setMeetingData({...meetingData, financeType: 'ENTRADA', category: 'HONORÁRIOS'})}
                            className={cn(
                              "px-8 h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3",
                              meetingData.financeType === 'ENTRADA' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-white/20 hover:text-white/40"
                            )}
                          >
                            <TrendingUp className="h-4 w-4" /> Receita / Ganho
                          </button>
                          <button 
                            onClick={() => setMeetingData({...meetingData, financeType: 'SAÍDA', category: 'CUSTAS'})}
                            className={cn(
                              "px-8 h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3",
                              meetingData.financeType === 'SAÍDA' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-white/20 hover:text-white/40"
                            )}
                          >
                            <AlertCircle className="h-4 w-4" /> Despesa / Gasto
                          </button>
                        </div>

                        <div className="space-y-4">
                          <Label className={labelMini}>Natureza do Lançamento</Label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {(meetingData.financeType === 'ENTRADA' ? [
                              { id: 'HONORÁRIOS', icon: <DollarSign className="h-4 w-4" /> },
                              { id: 'ACORDO', icon: <Handshake className="h-4 w-4" /> },
                              { id: 'SUCUMBÊNCIA', icon: <Scale className="h-4 w-4" /> },
                              { id: 'OUTROS', icon: <Plus className="h-4 w-4" /> }
                            ] : [
                              { id: 'CUSTAS', icon: <Gavel className="h-4 w-4" /> },
                              { id: 'PERÍCIA', icon: <Brain className="h-4 w-4" /> },
                              { id: 'IMPOSTOS', icon: <ShieldCheck className="h-4 w-4" /> },
                              { id: 'DILIGÊNCIA', icon: <Navigation className="h-4 w-4" /> }
                            ]).map(t => (
                              <button 
                                key={t.id}
                                onClick={() => setMeetingData({...meetingData, category: t.id})}
                                className={cn(
                                  "h-14 rounded-xl border transition-all flex items-center px-4 gap-3",
                                  meetingData.category === t.id 
                                    ? (meetingData.financeType === 'ENTRADA' ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-rose-500 bg-rose-500/10 text-rose-400")
                                    : "border-white/5 bg-black/20 text-white/20 hover:border-white/10"
                                )}
                              >
                                {t.icon}
                                <span className="text-[9px] font-black uppercase tracking-widest">{t.id}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-8">
                           <div className="col-span-12 lg:col-span-8 space-y-6">
                              <div className={cn(
                                "p-8 rounded-[2rem] bg-black/40 border space-y-8 relative overflow-hidden shadow-2xl transition-colors duration-500",
                                meetingData.financeType === 'ENTRADA' ? "border-emerald-500/10" : "border-rose-500/10"
                              )}>
                                 <div className={cn("flex items-center gap-3", meetingData.financeType === 'ENTRADA' ? "text-emerald-400" : "text-rose-400")}>
                                   {meetingData.financeType === 'ENTRADA' ? <DollarSign className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                   <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">{meetingData.financeType === 'ENTRADA' ? 'Fluxo de Ganhos' : 'Fluxo de Gastos'}</h4>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                       <Label className={labelMini}>Valor da Operação (R$)</Label>
                                       <Input 
                                         className={cn(
                                           "bg-white/[0.02] border-white/10 h-16 text-3xl font-black text-center rounded-2xl",
                                           meetingData.financeType === 'ENTRADA' ? "text-emerald-400" : "text-rose-400"
                                         )}
                                         placeholder="R$ 0,00"
                                         value={meetingData.value}
                                         onChange={e => setMeetingData({...meetingData, value: maskCurrency(e.target.value)})}
                                       />
                                    </div>
                                    <div className="space-y-2">
                                       <Label className={labelMini}>Forma de Pagamento</Label>
                                       <select 
                                         value={meetingData.paymentMethod}
                                         onChange={e => setMeetingData({...meetingData, paymentMethod: e.target.value})}
                                         className="w-full bg-white/[0.02] border-white/10 h-16 rounded-2xl px-6 text-[11px] font-black uppercase text-white outline-none appearance-none"
                                       >
                                          <option value="PIX" className="bg-[#0a0f1e]">PIX / IMEDIATO</option>
                                          <option value="BOLETO" className="bg-[#0a0f1e]">BOLETO BANCÁRIO</option>
                                          <option value="TED" className="bg-[#0a0f1e]">TRANSFERÊNCIA (TED/DOC)</option>
                                          <option value="ESPÉCIE" className="bg-[#0a0f1e]">DINHEIRO VIVO</option>
                                       </select>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-10 items-end">
                                    <div className="space-y-3">
                                       <Label className={labelMini}>Parcelamento Estruturado</Label>
                                       <div className="flex gap-1.5 h-12">
                                          {[1, 2, 3, 5, 10, 12].map(n => (
                                            <button 
                                              key={n}
                                              onClick={() => setMeetingData({...meetingData, installments: n})}
                                              className={cn(
                                                "flex-1 rounded-xl text-[9px] font-black transition-all border",
                                                meetingData.installments === n ? "bg-white text-black border-white shadow-lg" : "bg-white/[0.02] text-white/20 border-white/5 hover:border-white/20"
                                              )}
                                            >
                                              {n}X
                                            </button>
                                          ))}
                                          <div className="w-px bg-white/5 mx-2 h-8 my-auto" />
                                          <Input 
                                            type="number"
                                            className="w-20 bg-white/[0.02] border-white/10 h-12 text-center font-black text-white rounded-xl text-lg"
                                            value={meetingData.installments}
                                            onChange={e => setMeetingData({...meetingData, installments: parseInt(e.target.value) || 1})}
                                          />
                                       </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-white/[0.02] h-12 rounded-xl px-12 border border-white/5 shadow-inner">
                                       <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] leading-none">
                                         {meetingData.financeType === 'ENTRADA' ? 'Incide Comissão?' : 'Reembolsável?'}
                                       </span>
                                       <button 
                                         onClick={() => setMeetingData({...meetingData, hasCommission: !meetingData.hasCommission})}
                                         className={cn(
                                           "w-12 h-6 rounded-full transition-all flex items-center px-1.5 shadow-2xl", 
                                           meetingData.hasCommission 
                                            ? (meetingData.financeType === 'ENTRADA' ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20") 
                                            : "bg-white/10"
                                          , meetingData.hasCommission ? "justify-end" : "justify-start"
                                         )}
                                       >
                                          <div className="w-3.5 h-3.5 bg-white rounded-full shadow-lg" />
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="col-span-12 lg:col-span-4 space-y-6">
                              <div className={cn(
                                "p-8 rounded-[2rem] border space-y-6 min-h-full shadow-2xl transition-colors duration-500",
                                meetingData.financeType === 'ENTRADA' ? "bg-emerald-500/[0.02] border-emerald-500/10" : "bg-rose-500/[0.02] border-rose-500/10"
                              )}>
                                 <div className="flex items-center gap-3 opacity-40"><History className="h-4 w-4" /><h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Agenda de Liquidação</h4></div>
                                 <div className="space-y-4">
                                    {Array.from({ length: Math.min(meetingData.installments, 6) }).map((_, i) => {
                                      const rawVal = parseFloat(meetingData.value.replace(/\D/g, '')) || 0
                                      const parcelVal = (rawVal / 100 / (meetingData.installments || 1))
                                      
                                      return (
                                        <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                                           <div className="flex flex-col gap-1">
                                              <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Parcela {i+1}/{meetingData.installments}</span>
                                              <span className="text-[12px] font-black text-white tracking-widest">
                                                 {format(addDays(parseISO(meetingData.date), i * 30), 'dd/MM/yyyy')}
                                              </span>
                                           </div>
                                           <div className="flex flex-col items-end gap-1">
                                              <span className="text-[8px] font-black text-emerald-500/20 uppercase">Valor</span>
                                              <span className={cn("text-[13px] font-black font-mono", meetingData.financeType === 'ENTRADA' ? "text-emerald-400" : "text-rose-400")}>
                                                 R$ {parcelVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                              </span>
                                           </div>
                                        </div>
                                      )
                                    })}
                                    {meetingData.installments > 6 && <div className="text-center py-4 border-t border-white/5 mt-4"><span className="text-[9px] font-black text-white/10 uppercase italic tracking-[0.3em]">... e mais {meetingData.installments - 6} títulos projetados</span></div>}
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* OUTROS MODOS - COMPACTOS */}
                    {mode === 'atendimento' && (
                      <div className="space-y-8 animate-in slide-in-from-left-4">
                         <div className="grid grid-cols-2 gap-6">
                            <div onClick={() => setMeetingData({...meetingData, type: 'online'})} className={cn("p-8 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-4", meetingData.type === 'online' ? "border-emerald-400 bg-emerald-400/5" : "border-white/5 bg-white/[0.01]")}>
                               <Video className={cn("h-8 w-8", meetingData.type === 'online' ? "text-emerald-400" : "text-white/10")} /><span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Virtual</span>
                            </div>
                            <div onClick={() => setMeetingData({...meetingData, type: 'presencial'})} className={cn("p-8 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-4", meetingData.type === 'presencial' ? "border-amber-500 bg-amber-500/5" : "border-white/5 bg-white/[0.01]")}>
                               <MapPin className={cn("h-8 w-8", meetingData.type === 'presencial' ? "text-amber-500" : "text-white/10")} /><span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Sede</span>
                            </div>
                         </div>
                         <div className="space-y-3">
                            <Label className={labelMini}>Instruções Táticas</Label>
                            <Textarea className="bg-black/30 border-white/5 min-h-[250px] text-white/70 p-6 rounded-2xl resize-none text-xs" placeholder="Objetivos do ato..." value={meetingData.notes} onChange={e => setMeetingData({...meetingData, notes: e.target.value.toUpperCase()})} />
                         </div>
                      </div>
                    )}
                 </div>
              </div>

              {/* SIDEBAR */}
              <div className="col-span-4 space-y-8">
                 <div className={cn("p-8 rounded-[2rem] border-2 text-center shadow-xl", `bg-${config.color}/5 border-${config.color}/10`)}>
                    <p className={cn("font-black mb-6 uppercase tracking-[0.3em] text-[10px]", `text-${config.color}`)}>
                      {mode === 'financeiro' ? 'Agenda Financeira' : 
                       mode === 'prazo' ? 'Agenda Fatal' : 
                       mode === 'audiencia' ? 'Pauta de Audiência' : 
                       mode === 'diligencia' ? 'Missão de Campo' : 'Agendamento'}
                    </p>
                    <div className="space-y-4">
                       <Input type="date" value={meetingData.date} onChange={e => setMeetingData({...meetingData, date: e.target.value})} className="bg-transparent border-none text-4xl font-mono font-black text-white text-center shadow-none focus:ring-0" />
                       <div className="flex items-center justify-center gap-2 bg-black/40 rounded-xl h-10 w-32 mx-auto border border-white/5"><Clock className="h-3.5 w-3.5 text-white/20" /><Input type="time" value={meetingData.time} onChange={e => setMeetingData({...meetingData, time: e.target.value})} className="bg-transparent h-full w-20 text-white font-black text-xl text-center border-none p-0 focus:ring-0" /></div>
                    </div>
                 </div>

                 {mode === 'prazo' && (
                    <Card className="bg-[#0a0f1e] border-white/5 p-8 rounded-[2rem] space-y-6">
                       <div className="space-y-2">
                          <Label className={labelMini}>Publicação em Diário</Label>
                          <Input type="date" value={meetingData.publicationDate} onChange={e => setMeetingData({...meetingData, publicationDate: e.target.value})} className="bg-black/40 h-11 border-white/10 rounded-xl text-white font-black px-6 text-xs" />
                       </div>
                    </Card>
                 )}

                 {mode !== 'financeiro' && (
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                       <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-emerald-400 border border-white/10"><ShieldCheck className="h-4 w-4" /></div><div><p className="text-[7px] font-black text-emerald-500/40 uppercase">Sincronizador</p><p className="text-white font-black text-[9px] uppercase tracking-widest">Google Online</p></div></div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </ScrollArea>

      {/* FOOTER FIXO */}
      <div className="h-20 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between px-12 flex-none z-50 sticky bottom-0 shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
         <Button variant="ghost" onClick={() => router.back()} className="text-white/20 hover:text-rose-500 font-black uppercase text-[9px] tracking-[0.3em]">Ignorar</Button>
         <Button onClick={handleSaveAndSync} disabled={isSyncingAct || !processData} className="gold-gradient text-black font-black uppercase text-[11px] tracking-[0.3em] px-16 h-12 rounded-xl shadow-xl hover:scale-105 transition-all flex items-center gap-4">
            {isSyncingAct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            PROTOCOLAR OPERAÇÃO
         </Button>
      </div>
    </div>
  )
}
