"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Building, 
  FileText, 
  Gavel, 
  Trash2, 
  ShieldCheck, 
  X, 
  ChevronRight,
  Save,
  Loader2
} from "lucide-react"
import { maskCEP, maskPhone, maskCPFOrCNPJ, cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { Search, Plus, MapPin, Landmark, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface Defendant {
  name: string
  document: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  cep: string
  phone: string
  email: string
}

export interface WorkflowData {
  defendants: Defendant[]
  demandTitle: string
  notes: string
  jurisdictionCity: string
  jurisdictionState: string
  jurisdictionCourt: string
}

interface LeadWorkflowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: Partial<WorkflowData>
  onSave: (data: WorkflowData) => Promise<void>
  initialStep?: number
}

export interface Court {
  id?: string
  name: string
  city: string
  state: string
  address?: string
}

export function LeadWorkflow({ open, onOpenChange, initialData, onSave, initialStep = 1 }: LeadWorkflowProps) {
  const [step, setStep] = useState(initialStep)
  const [isSaving, setIsSaving] = useState(false)
  const [data, setData] = useState<WorkflowData>({
    defendants: initialData.defendants || [{ 
      name: "", document: "", street: "", number: "", 
      complement: "", neighborhood: "", city: "", 
      state: "", cep: "", phone: "", email: "" 
    }],
    demandTitle: initialData.demandTitle || "",
    notes: initialData.notes || "",
    jurisdictionCity: initialData.jurisdictionCity || "",
    jurisdictionState: initialData.jurisdictionState || "",
    jurisdictionCourt: initialData.jurisdictionCourt || ""
  })

  const db = useFirestore()
  const courtsQuery = useMemoFirebase(() => db ? query(collection(db, "courts"), orderBy("name", "asc")) : null, [db])
  const { data: courts } = useCollection(courtsQuery)
  const [courtSearch, setCourtSearch] = useState("")
  const [isAddingCourt, setIsAddingCourt] = useState(false)
  const [newCourtData, setNewCourtData] = useState<Court>({ name: "", city: "", state: "", address: "" })

  // Sync initial data if it changes while closed (or when opening)
  useEffect(() => {
    if (open) {
      setData({
        defendants: initialData.defendants?.length ? initialData.defendants : [{ 
          name: "", document: "", street: "", number: "", 
          complement: "", neighborhood: "", city: "", 
          state: "", cep: "", phone: "", email: "" 
        }],
        demandTitle: initialData.demandTitle || "",
        notes: initialData.notes || "",
        jurisdictionCity: initialData.jurisdictionCity || "",
        jurisdictionState: initialData.jurisdictionState || "",
        jurisdictionCourt: initialData.jurisdictionCourt || ""
      })
      setStep(initialStep)
    }
  }, [open, initialData, initialStep])

  const handleCepBlur = async (idx: number) => {
    const cep = data.defendants[idx].cep?.replace(/\D/g, "")
    if (!cep || cep.length !== 8) return
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const resData = await response.json()
      if (!resData.erro) {
        const newDefs = [...data.defendants]
        newDefs[idx].street = resData.logradouro.toUpperCase()
        newDefs[idx].neighborhood = resData.bairro.toUpperCase()
        newDefs[idx].city = resData.localidade.toUpperCase()
        newDefs[idx].state = resData.uf.toUpperCase()
        setData({ ...data, defendants: newDefs })
      }
    } catch (e) {
      console.error("CEP lookup error", e)
    }
  }

  const handleFinish = async () => {
    setIsSaving(true)
    try {
      await onSave(data)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[550px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans">
        {/* PROGRESS BAR */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden z-50">
          <div 
            className="h-full gold-gradient transition-all duration-500 ease-out shadow-[0_0_15px_rgba(245,208,48,0.5)]"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-2xl transition-transform hover:scale-110">
              {step === 1 ? <Building className="h-7 w-7" /> : step === 2 ? <FileText className="h-7 w-7" /> : <Gavel className="h-7 w-7" />}
            </div>
            <div className="text-left">
              <DialogTitle className="text-white font-headline text-2xl uppercase tracking-tighter leading-tight">
                {step === 1 ? "Pólo Passivo" : step === 2 ? "Objeto da Ação" : "Jurisdição"}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-[9px] font-black border-primary/30 bg-primary/5 text-primary uppercase h-5 px-2">ETAPA {step} / 3</Badge>
                <div className="w-1 h-1 rounded-full bg-white/10" />
                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Triagem Técnica</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Qualificação dos Réus</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setData({
                    ...data,
                    defendants: [...data.defendants, { 
                      name: "", document: "", street: "", number: "", 
                      complement: "", neighborhood: "", city: "", 
                      state: "", cep: "", phone: "", email: "" 
                    }]
                  })}
                  className="h-7 text-[8px] font-black border-primary/20 text-primary uppercase"
                >
                  + Adicionar Réu
                </Button>
              </div>

              <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 scrollbar-hide">
                {data.defendants.map((def, idx) => (
                  <div key={idx} className="group relative p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-500 shadow-xl mb-4">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40 border border-white/10 group-hover:border-primary/30 group-hover:text-primary transition-all">
                          {idx + 1}
                        </div>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Qualificação de Réu</span>
                      </div>
                      {data.defendants.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newDefs = [...data.defendants]
                            newDefs.splice(idx, 1)
                            setData({ ...data, defendants: newDefs })
                          }}
                          className="h-8 w-8 rounded-full bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-6">
                      {/* IDENTIFICAÇÃO */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Nome Completo / Razão Social</Label>
                          <Input
                            value={def.name}
                            onChange={e => {
                              const newDefs = [...data.defendants]
                              newDefs[idx].name = e.target.value.toUpperCase()
                              setData({ ...data, defendants: newDefs })
                            }}
                            className="bg-black/60 border-white/5 focus:border-primary/50 h-12 text-white font-bold rounded-xl px-5 transition-all"
                            placeholder="EX: NOME DO RÉU"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">CPF / CNPJ</Label>
                          <Input
                            value={def.document}
                            onChange={e => {
                              const newDefs = [...data.defendants]
                              newDefs[idx].document = maskCPFOrCNPJ(e.target.value)
                              setData({ ...data, defendants: newDefs })
                            }}
                            className="bg-black/60 border-white/5 focus:border-primary/50 h-12 text-white font-mono rounded-xl px-5"
                            placeholder="000.000.000-00"
                          />
                        </div>
                      </div>

                      {/* CONTATO */}
                      <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                          <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Canais de Contato</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">WhatsApp / Telefone</Label>
                            <Input
                              value={def.phone}
                              onChange={e => {
                                const newDefs = [...data.defendants]
                                newDefs[idx].phone = maskPhone(e.target.value)
                                setData({ ...data, defendants: newDefs })
                              }}
                              className="bg-black/40 border-white/5 focus:border-primary/30 h-11 text-white font-mono rounded-xl px-5"
                              placeholder="(00) 00000-0000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">E-mail</Label>
                            <Input
                              value={def.email}
                              onChange={e => {
                                const newDefs = [...data.defendants]
                                newDefs[idx].email = e.target.value.toLowerCase()
                                setData({ ...data, defendants: newDefs })
                              }}
                              className="bg-black/40 border-white/5 focus:border-primary/30 h-11 text-white lowercase rounded-xl px-5"
                              placeholder="exemplo@reu.com"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ENDEREÇO */}
                      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shadow-[0_0_5px_rgba(245,208,48,0.5)]" />
                          <span className="text-[8px] font-black text-primary/60 uppercase tracking-[0.2em]">Endereço para Citação</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">CEP</Label>
                            <Input
                              value={def.cep}
                              onChange={e => {
                                const newDefs = [...data.defendants]
                                newDefs[idx].cep = maskCEP(e.target.value)
                                setData({ ...data, defendants: newDefs })
                              }}
                              onBlur={() => handleCepBlur(idx)}
                              className="bg-black/60 border-white/5 focus:border-primary/50 h-11 text-white font-mono rounded-xl px-5 transition-all"
                              placeholder="00000-000"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Cidade / UF</Label>
                            <div className="bg-white/5 border border-white/5 h-11 flex items-center px-5 rounded-xl text-[10px] font-black text-white/40 uppercase">
                              {def.city ? `${def.city} / ${def.state}` : "AGUARDANDO CEP..."}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Logradouro (Rua, Avenida...)</Label>
                          <Input
                            value={def.street}
                            onChange={e => {
                              const newDefs = [...data.defendants]
                              newDefs[idx].street = e.target.value.toUpperCase()
                              setData({ ...data, defendants: newDefs })
                            }}
                            className="bg-black/60 border-white/5 focus:border-primary/50 h-11 text-white text-xs rounded-xl px-5 transition-all"
                            placeholder="EX: RUA DAS FLORES"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Número</Label>
                            <Input
                              value={def.number}
                              onChange={e => {
                                const newDefs = [...data.defendants]
                                newDefs[idx].number = e.target.value.toUpperCase()
                                setData({ ...data, defendants: newDefs })
                              }}
                              className="bg-black/60 border-white/5 focus:border-primary/50 h-11 text-white font-bold rounded-xl px-5 transition-all"
                              placeholder="S/N"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Complemento</Label>
                            <Input
                              value={def.complement}
                              onChange={e => {
                                const newDefs = [...data.defendants]
                                newDefs[idx].complement = e.target.value.toUpperCase()
                                setData({ ...data, defendants: newDefs })
                              }}
                              className="bg-black/60 border-white/5 focus:border-primary/50 h-11 text-white text-xs rounded-xl px-5 transition-all"
                              placeholder="EX: APTO 101, BLOCO B"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Bairro</Label>
                          <Input
                            value={def.neighborhood}
                            onChange={e => {
                              const newDefs = [...data.defendants]
                              newDefs[idx].neighborhood = e.target.value.toUpperCase()
                              setData({ ...data, defendants: newDefs })
                            }}
                            className="bg-black/60 border-white/5 focus:border-primary/50 h-11 text-white text-xs rounded-xl px-5 transition-all"
                            placeholder="EX: CENTRO"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Objeto / Pedido Principal</Label>
                  <Input
                    value={data.demandTitle}
                    onChange={e => setData({ ...data, demandTitle: e.target.value.toUpperCase() })}
                    className="bg-black/60 border-white/5 focus:border-primary/50 h-14 text-white font-black rounded-2xl px-6 transition-all"
                    placeholder="EX: AÇÃO DE INDENIZAÇÃO POR DANOS MORAIS"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Relato Sintético dos Fatos</Label>
                  <Textarea
                    value={data.notes}
                    onChange={e => setData({ ...data, notes: e.target.value })}
                    className="bg-black/60 border-white/5 focus:border-primary/50 min-h-[300px] text-white text-[13px] leading-relaxed p-8 rounded-3xl resize-none scrollbar-hide shadow-inner transition-all"
                    placeholder="Descreva detalhadamente os fatos e fundamentos..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-5">
                {/* BUSCA DE FÓRUM / TRIBUNAL */}
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Tribunal / Órgão / Comarca *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full h-14 bg-black/60 border-white/5 justify-between text-white font-bold rounded-2xl px-6 hover:bg-black/80 hover:border-primary/50 transition-all"
                      >
                        {data.jurisdictionCity ? (
                          <div className="flex items-center gap-3">
                            <Landmark className="h-4 w-4 text-primary" />
                            <span>{data.jurisdictionCity} / {data.jurisdictionState}</span>
                          </div>
                        ) : "PESQUISAR FÓRUM OU COMARCA..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0 bg-[#0d121f] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                      <div className="p-4 border-b border-white/5 bg-black/20 flex items-center gap-3">
                        <Search className="h-4 w-4 text-primary" />
                        <input 
                          className="bg-transparent border-none outline-none text-white text-xs w-full placeholder:text-white/20"
                          placeholder="DIGITE O NOME DO FÓRUM OU CIDADE..."
                          value={courtSearch}
                          onChange={(e) => setCourtSearch(e.target.value)}
                        />
                      </div>
                      <ScrollArea className="h-[300px]">
                        <div className="p-2 space-y-1">
                          {courts?.filter(c => 
                            c.name.toLowerCase().includes(courtSearch.toLowerCase()) || 
                            c.city.toLowerCase().includes(courtSearch.toLowerCase())
                          ).map((court) => (
                            <button
                              key={court.id}
                              onClick={() => {
                                setData({ 
                                  ...data, 
                                  jurisdictionCity: court.city.toUpperCase(),
                                  jurisdictionState: court.state.toUpperCase()
                                })
                              }}
                              className="w-full text-left p-4 rounded-xl hover:bg-white/5 flex flex-col gap-1 transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white uppercase group-hover:text-primary">{court.name}</span>
                                <Check className={cn("h-4 w-4 text-primary", data.jurisdictionCity === court.city ? "opacity-100" : "opacity-0")} />
                              </div>
                              <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">{court.city} / {court.state}</span>
                            </button>
                          ))}
                          
                          <button 
                            onClick={() => setIsAddingCourt(true)}
                            className="w-full p-4 flex items-center gap-3 text-primary hover:bg-primary/10 transition-all rounded-xl mt-2 border border-dashed border-primary/20"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Cadastrar Novo Fórum</span>
                          </button>
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Vara / Câmara / Juízo Específico</Label>
                    <Input
                      value={data.jurisdictionCourt}
                      onChange={e => setData({ ...data, jurisdictionCourt: e.target.value.toUpperCase() })}
                      className="bg-black/60 border-white/5 focus:border-primary/50 h-14 text-white font-bold rounded-2xl px-6 transition-all"
                      placeholder="EX: 45ª VARA DO TRABALHO"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">UF</Label>
                    <Input
                      value={data.jurisdictionState}
                      onChange={e => setData({ ...data, jurisdictionState: e.target.value.toUpperCase() })}
                      maxLength={2}
                      className="bg-black/60 border-white/5 focus:border-primary/50 h-14 text-white font-black text-center rounded-2xl transition-all"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Confirmação de Dados</h5>
                  </div>
                  <p className="text-[9px] text-white/40 uppercase leading-relaxed">A jurisdição correta garante que a peça seja endereçada ao juízo competente, evitando declínios de competência.</p>
                </div>
              </div>

              {/* DIALOG DE CADASTRO DE FÓRUM */}
              <Dialog open={isAddingCourt} onOpenChange={setIsAddingCourt}>
                <DialogContent className="glass border-primary/20 bg-[#0a0f1e] sm:max-w-[450px] p-0 overflow-hidden shadow-2xl rounded-3xl font-sans">
                  <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                      <Landmark className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-white font-headline text-xl uppercase tracking-tighter">Cadastrar Fórum</DialogTitle>
                      <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">Adicionar nova comarca à base RGMJ</p>
                    </div>
                  </div>
                  <div className="p-8 space-y-5">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Nome do Tribunal / Fórum</Label>
                      <Input 
                        value={newCourtData.name} 
                        onChange={e => setNewCourtData({...newCourtData, name: e.target.value.toUpperCase()})}
                        className="bg-black/60 border-white/5 h-12 text-white font-bold rounded-xl"
                        placeholder="EX: FÓRUM CÍVEL DE BARUERI"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Cidade</Label>
                        <Input 
                          value={newCourtData.city} 
                          onChange={e => setNewCourtData({...newCourtData, city: e.target.value.toUpperCase()})}
                          className="bg-black/60 border-white/5 h-12 text-white font-bold rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">UF</Label>
                        <Input 
                          value={newCourtData.state} 
                          onChange={e => setNewCourtData({...newCourtData, state: e.target.value.toUpperCase()})}
                          maxLength={2}
                          className="bg-black/60 border-white/5 h-12 text-white font-black text-center rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Endereço Completo</Label>
                      <Input 
                        value={newCourtData.address} 
                        onChange={e => setNewCourtData({...newCourtData, address: e.target.value.toUpperCase()})}
                        className="bg-black/60 border-white/5 h-12 text-white font-bold rounded-xl text-xs"
                        placeholder="RUA DO FÓRUM, Nº 123..."
                      />
                    </div>
                    <Button 
                      onClick={async () => {
                        if (!newCourtData.name || !newCourtData.city) return
                        await addDocumentNonBlocking(collection(db!, "courts"), { ...newCourtData, createdAt: serverTimestamp() })
                        setData({ ...data, jurisdictionCity: newCourtData.city, jurisdictionState: newCourtData.state })
                        setIsAddingCourt(false)
                        setNewCourtData({ name: "", city: "", state: "", address: "" })
                      }}
                      className="w-full h-14 gold-gradient text-background font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl mt-4"
                    >
                      Salvar e Selecionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="pt-6 flex gap-4 bg-[#0a0f1e]/80 backdrop-blur-xl border-t border-white/5 p-8 flex-none">
            {step > 1 && (
              <Button 
                onClick={() => setStep(step - 1)} 
                variant="outline" 
                className="flex-1 h-14 border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all"
              >
                Anterior
              </Button>
            )}
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)} 
                className="flex-[2] h-14 gold-gradient text-background font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-[0_0_20px_rgba(245,208,48,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                Próximo Passo
              </Button>
            ) : (
              <Button 
                onClick={handleFinish} 
                disabled={isSaving}
                className="flex-[2] h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-95 transition-all gap-3"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                Finalizar Triagem
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
