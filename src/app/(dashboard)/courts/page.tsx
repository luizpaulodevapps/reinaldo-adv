
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Building2, 
  Search, 
  Plus, 
  Loader2, 
  MapPin, 
  Trash2, 
  Edit3, 
  ChevronRight,
  LayoutGrid,
  Map as MapIcon,
  Save,
  X,
  Library,
  ListPlus,
  Scale,
  Gavel,
  Tag,
  Phone,
  Eye,
  Brain,
  CheckCircle2,
  Navigation
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { cn, maskCEP, maskPhone } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { aiSearchCourtAddress } from "@/ai/flows/ai-search-court-address"

const LEGAL_AREAS = ["Trabalhista", "Cível", "Criminal", "Previdenciário", "Tributário", "Família", "Empresarial"]

export default function CourtsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewingCourt, setViewingCourt] = useState<any>(null)
  const [editingCourt, setEditingCourt] = useState<any>(null)
  const [loadingCep, setLoadingCep] = useState(false)
  const [isAiSearching, setIsAiSearching] = useState(false)
  const [newVara, setNewVara] = useState({ name: "", phone: "", notes: "" })

  const [formData, setFormData] = useState<any>({
    name: "",
    zipCode: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    mapsLink: "",
    legalAreas: ["Trabalhista"],
    varas: [],
    notes: ""
  })

  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const courtsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db!, "courts"), orderBy("name", "asc"))
  }, [db, user])

  const { data: courts, isLoading } = useCollection(courtsQuery)

  const filtered = useMemo(() => {
    if (!courts) return []
    return courts.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [courts, searchTerm])

  const handleCepBlur = async () => {
    const cep = formData.zipCode.replace(/\D/g, "")
    if (cep.length !== 8) return
    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setFormData((prev: any) => ({
          ...prev,
          address: data.logradouro.toUpperCase(),
          neighborhood: data.bairro.toUpperCase(),
          city: data.localidade.toUpperCase(),
          state: data.uf.toUpperCase()
        }))
      }
    } catch (e) {
      console.error("CEP error")
    } finally {
      setLoadingCep(false)
    }
  }

  const handleAiSearch = async () => {
    if (!formData.name) return
    setIsAiSearching(true)
    try {
      const result = await aiSearchCourtAddress({ courtName: formData.name })
      if (result.found && result.zipCode) {
        setFormData(prev => ({ ...prev, zipCode: result.zipCode, number: result.number || prev.number }))
        toast({ title: "Localização Encontrada", description: "Dados sincronizados via Inteligência RGMJ." })
        setTimeout(() => handleCepBlur(), 100)
      } else {
        toast({ variant: "destructive", title: "CEP não localizado", description: "A IA não encontrou o endereço oficial com certeza absoluta." })
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro na IA", description: "Falha na comunicação com o agente logístico." })
    } finally {
      setIsAiSearching(false)
    }
  }

  const handleAddVara = () => {
    if (!newVara.name.trim()) return
    const v = { 
      name: newVara.name.toUpperCase().trim(),
      phone: newVara.phone.trim(),
      notes: newVara.notes.trim()
    }
    
    if (formData.varas.some((item: any) => item.name === v.name)) {
      toast({ variant: "destructive", title: "Vara já cadastrada" })
      return
    }
    
    setFormData((prev: any) => ({
      ...prev,
      varas: [...prev.varas, v]
    }))
    setNewVara({ name: "", phone: "", notes: "" })
  }

  const handleRemoveVara = (idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      varas: prev.varas.filter((_: any, i: number) => i !== idx)
    }))
  }

  const handleToggleArea = (area: string) => {
    setFormData((prev: any) => {
      const areas = prev.legalAreas || []
      if (areas.includes(area)) {
        return { ...prev, legalAreas: areas.filter((a: string) => a !== area) }
      }
      return { ...prev, legalAreas: [...areas, area] }
    })
  }

  const handleSave = () => {
    if (!db || !formData.name || !formData.zipCode) {
      toast({ variant: "destructive", title: "Dados Incompletos" })
      return
    }

    const payload = {
      ...formData,
      name: formData.name.toUpperCase(),
      updatedAt: serverTimestamp()
    }

    if (editingCourt) {
      updateDocumentNonBlocking(doc(db!, "courts", editingCourt.id), payload)
      toast({ title: "Fórum Atualizado" })
    } else {
      addDocumentNonBlocking(collection(db!, "courts"), { ...payload, createdAt: serverTimestamp() })
      toast({ title: "Fórum Cadastrado na Base" })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (!db || !confirm("Deseja remover este órgão da base logística?")) return
    deleteDocumentNonBlocking(doc(db!, "courts", id))
    toast({ variant: "destructive", title: "Fórum Removido" })
  }

  const handleOpenEdit = (court: any) => {
    setEditingCourt(court)
    setFormData({ ...court, varas: court.varas || [], legalAreas: court.legalAreas || [] })
    setIsDialogOpen(true)
    setIsViewOpen(false)
  }

  const handleOpenView = (court: any) => {
    setViewingCourt(court)
    setIsViewOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingCourt(null)
    setFormData({
      name: "",
      zipCode: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      mapsLink: "",
      legalAreas: ["Trabalhista"],
      varas: [],
      notes: ""
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-4">
            <LayoutGrid className="h-3 w-3" />
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">Gestão Logística</span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
            <Building2 className="h-8 w-8 text-primary" /> Órgãos Judiciários
          </h1>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-black opacity-60">Biblioteca de tribunais e endereços para diligências.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar fórum ou cidade..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenCreate}
            className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-6 w-6 text-[#0a0f1e]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Base Logística...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((court) => (
            <Card 
              key={court.id} 
              className="bg-[#0d1117] border-white/5 hover:border-primary/20 transition-all group overflow-hidden flex flex-col shadow-2xl cursor-pointer rounded-[2rem]"
              onClick={() => handleOpenView(court)}
            >
              <CardContent className="p-10 space-y-8 relative">
                {/* Header do Card - Ícone e Ações */}
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(court); }} 
                      className="text-white/20 hover:text-white transition-colors"
                    >
                      <Edit3 className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(court.id); }} 
                      className="w-10 h-10 rounded-full bg-[#f5d030] flex items-center justify-center text-[#0d1117] hover:scale-110 transition-all shadow-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Identificação */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-[#f5d030] uppercase tracking-tighter leading-tight">
                    {court.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-black uppercase tracking-widest">
                    <MapPin className="h-3.5 w-3.5 opacity-50 text-primary" /> {court.city} - {court.state}
                  </div>
                </div>

                {/* Box de Endereço - Fiel ao Print */}
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4 shadow-inner">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Endereço de Citação</p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white uppercase leading-relaxed tracking-tight">
                      {court.address}, {court.number} {court.complement && `• ${court.complement}`}
                    </p>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">
                      {court.neighborhood} • CEP {court.zipCode}
                    </p>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-[#f5d030]/20 text-[#f5d030] bg-[#f5d030]/5 px-4 h-7 rounded-full">
                    LOGÍSTICA OK
                  </Badge>
                  {court.mapsLink ? (
                    <a href={court.mapsLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-2.5 text-[11px] font-black text-[#f5d030] hover:text-white transition-colors uppercase tracking-[0.15em]">
                      <Navigation className="h-4 w-4" /> VER NO MAPS
                    </a>
                  ) : (
                    <div className="flex items-center gap-2.5 text-[11px] font-black text-muted-foreground/30 uppercase tracking-widest">
                      <Navigation className="h-4 w-4" /> ROTA INDISP.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-white/5 opacity-30">
            <Building2 className="h-16 w-16 text-muted-foreground" />
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center">Nenhum fórum cadastrado</p>
            <Button onClick={handleOpenCreate} className="gold-gradient text-background font-black uppercase text-[11px] px-8 h-12 rounded-xl shadow-xl">
              Cadastrar Primeiro Órgão
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[850px] w-[95vw] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingCourt ? "Retificar Órgão" : "Novo Fórum / Tribunal"}
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">
                Cadastro de base logística para automação de pauta RGMJ.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button onClick={handleAiSearch} disabled={isAiSearching || !formData.name} variant="outline" className="glass border-primary/20 text-primary font-black uppercase text-[10px] gap-2.5 h-11 px-6 rounded-xl">
                {isAiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />} BUSCAR CEP IA
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-[65vh]">
            <div className="p-10 space-y-8 bg-[#0a0f1e]/50">
              
              <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4 shadow-inner">
                <Label className="text-[11px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                  <Tag className="h-4 w-4" /> Competência / Áreas de Atuação *
                </Label>
                <div className="flex flex-wrap gap-3">
                  {LEGAL_AREAS.map(area => (
                    <div key={area} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/5 hover:border-primary/30 transition-all cursor-pointer" onClick={() => handleToggleArea(area)}>
                      <Checkbox checked={(formData.legalAreas || []).includes(area)} onCheckedChange={() => handleToggleArea(area)} className="data-[state=checked]:bg-primary" />
                      <span className="text-[10px] font-black text-white uppercase">{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Nome do Órgão / Prédio *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} className="glass border-white/10 h-14 text-white font-black text-sm uppercase" placeholder="EX: TRT 2ª REGIÃO - FÓRUM RUY BARBOSA" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">CEP *</Label>
                  <div className="relative">
                    <Input 
                      value={formData.zipCode} 
                      onChange={(e) => setFormData({...formData, zipCode: maskCEP(e.target.value)})} 
                      onBlur={handleCepBlur}
                      className="glass border-white/10 h-12 text-white font-mono" 
                      placeholder="00000-000" 
                    />
                    {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Logradouro *</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value.toUpperCase()})} className="glass border-white/10 h-12 text-white font-bold" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Número</Label>
                  <Input value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} className="glass border-white/10 h-12 text-white font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Bairro</Label>
                  <Input value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value.toUpperCase()})} className="glass border-white/10 h-12 text-white font-bold" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Cidade *</Label>
                  <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value.toUpperCase()})} className="glass border-white/10 h-12 text-white font-bold" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">UF *</Label>
                  <Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})} className="glass border-white/10 h-12 text-white font-bold" maxLength={2} />
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-6 shadow-inner">
                <Label className="text-[11px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                  <Library className="h-4 w-4" /> Unidades Judiciárias (Varas)
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 space-y-1.5">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase">Nome / Número *</Label>
                    <Input 
                      value={newVara.name} 
                      onChange={(e) => setNewVara({...newVara, name: e.target.value})} 
                      placeholder="EX: 45ª VARA"
                      className="glass border-primary/30 h-11 text-white font-bold uppercase"
                    />
                  </div>
                  <div className="md:col-span-1 space-y-1.5">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase">Telefone de Contato</Label>
                    <Input 
                      value={newVara.phone} 
                      onChange={(e) => setNewVara({...newVara, phone: maskPhone(e.target.value)})} 
                      placeholder="(11) 0000-0000"
                      className="glass border-primary/30 h-11 text-white font-bold font-mono"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <Button onClick={handleAddVara} className="h-11 w-full gold-gradient text-background font-black uppercase text-[10px] rounded-xl shadow-lg">
                      <ListPlus className="h-4 w-4 mr-2" /> SOMAR VARA
                    </Button>
                  </div>
                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase">Notas (E-mail, Balcão Virtual, etc)</Label>
                    <Input 
                      value={newVara.notes} 
                      onChange={(e) => setNewVara({...newVara, notes: e.target.value})} 
                      placeholder="EX: BALCAO.VIRTUAL@TRT2.JUS.BR"
                      className="glass border-primary/30 h-11 text-white text-xs uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  {formData.varas.map((v: any, idx: number) => (
                    <Badge key={idx} className="bg-[#1a1f2e] border border-primary/20 text-white font-bold uppercase text-[9px] py-2.5 px-4 gap-4 rounded-xl flex items-center shadow-lg group hover:border-primary/50 transition-all">
                      <div className="flex flex-col text-left leading-tight">
                        <span className="font-black text-primary">{v.name}</span>
                        {v.phone && <span className="text-[8px] opacity-60 mt-0.5 font-mono">{v.phone}</span>}
                      </div>
                      <button onClick={() => handleRemoveVara(idx)} className="hover:text-rose-500 transition-colors bg-white/5 p-1.5 rounded-full"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                  {formData.varas.length === 0 && (
                    <p className="text-[10px] text-primary/40 uppercase font-black tracking-widest italic py-4">Nenhuma unidade interna mapeada para este prédio.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <MapIcon className="h-3.5 w-3.5" /> Link do Google Maps
                </Label>
                <Input value={formData.mapsLink} onChange={(e) => setFormData({...formData, mapsLink: e.target.value})} className="glass border-primary/20 h-12 text-white text-xs font-bold" placeholder="https://goo.gl/maps/..." />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px] tracking-widest px-8 h-12">CANCELAR</Button>
            <Button onClick={handleSave} className="gold-gradient text-background font-black uppercase text-[11px] px-10 h-14 rounded-xl shadow-2xl">
              <Save className="h-5 w-5 mr-3" /> SALVAR NA BIBLIOTECA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="glass border-white/10 bg-[#05070a] sm:max-w-[900px] w-[95vw] p-0 overflow-hidden shadow-2xl flex flex-col h-[85vh] font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 flex-none shadow-xl">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-2xl">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{viewingCourt?.name}</DialogTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary uppercase bg-primary/5 px-3">ÓRGÃO JUDICIÁRIO</Badge>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{viewingCourt?.city} - {viewingCourt?.state}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handleOpenEdit(viewingCourt)} variant="outline" className="glass border-white/10 text-white font-black text-[10px] uppercase h-11 px-6 rounded-xl hover:bg-white/5 transition-all">
                <Edit3 className="h-4 w-4 mr-2" /> EDITAR
              </Button>
              <Button onClick={() => setIsViewOpen(false)} variant="ghost" className="h-11 w-11 rounded-xl text-muted-foreground hover:text-white">
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-10 space-y-10 pb-32">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Localização Física</h4>
                    </div>
                    <Card className="glass border-white/5 p-6 rounded-2xl bg-white/[0.01] space-y-4 shadow-lg">
                      <div>
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Logradouro e Número</Label>
                        <p className="text-sm font-bold text-white uppercase leading-relaxed">{viewingCourt?.address}, {viewingCourt?.number}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Bairro</Label>
                          <p className="text-xs font-bold text-white uppercase">{viewingCourt?.neighborhood}</p>
                        </div>
                        <div>
                          <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">CEP</Label>
                          <p className="text-xs font-mono font-bold text-white">{viewingCourt?.zipCode}</p>
                        </div>
                      </div>
                    </Card>
                    <Button 
                      className="w-full h-14 glass border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 font-black uppercase text-[11px] tracking-widest gap-3 rounded-xl shadow-lg"
                      onClick={() => {
                        const q = encodeURIComponent(`${viewingCourt?.address} ${viewingCourt?.number} ${viewingCourt?.city}`)
                        window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank")
                      }}
                    >
                      <Navigation className="h-5 w-5" /> TRAÇAR ROTA NO GOOGLE MAPS
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                      <Scale className="h-4 w-4 text-primary" />
                      <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Esferas de Atuação</h4>
                    </div>
                    <Card className="glass border-white/5 p-6 rounded-2xl bg-white/[0.01] min-h-[120px] flex flex-wrap gap-2 content-start shadow-lg">
                      {viewingCourt?.legalAreas?.map((area: string) => (
                        <Badge key={area} className="bg-primary/10 border-primary/30 text-primary font-black uppercase text-[9px] h-8 px-4 rounded-xl">
                          {area}
                        </Badge>
                      ))}
                    </Card>
                    
                    <Card className="glass border-primary/20 bg-primary/5 p-6 rounded-2xl space-y-2 shadow-xl border-dashed">
                      <div className="flex items-center gap-3 text-primary mb-1">
                        <Brain className="h-4 w-4" />
                        <h5 className="text-[10px] font-black uppercase tracking-widest">Sincronismo RGMJ</h5>
                      </div>
                      <p className="text-[10px] text-white/60 leading-relaxed uppercase font-bold tracking-tight">
                        Este órgão faz parte da biblioteca tática de logística da banca. Os dados são usados para citação automática e pauta de diligências.
                      </p>
                    </Card>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-3">
                      <Library className="h-5 w-5 text-primary" />
                      <h4 className="text-[13px] font-black text-white uppercase tracking-widest">Unidades Judiciárias Mapeadas</h4>
                    </div>
                    <Badge className="bg-primary text-background font-black text-[10px] rounded-full h-6 px-3 shadow-lg">{viewingCourt?.varas?.length || 0} VARAS</Badge>
                  </div>

                  {viewingCourt?.varas && viewingCourt.varas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {viewingCourt.varas.map((v: any, idx: number) => (
                        <Card key={idx} className="glass border-white/5 bg-white/[0.02] p-5 rounded-2xl hover:border-primary/30 transition-all shadow-lg group">
                          <div className="flex items-start justify-between mb-4">
                            <h5 className="font-black text-white uppercase text-sm tracking-tight group-hover:text-primary transition-colors">{v.name}</h5>
                            <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-white/5 group-hover:border-primary/20">
                              <Gavel className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-all" />
                            </div>
                          </div>
                          
                          {v.phone && (
                            <div className="flex items-center gap-3 text-emerald-500 mb-3 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                              <Phone className="h-3 w-3" />
                              <span className="text-[10px] font-mono font-bold tracking-widest">{v.phone}</span>
                            </div>
                          )}

                          {v.notes && (
                            <div className="space-y-1.5">
                              <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Notas Técnicas</Label>
                              <p className="text-[10px] text-white/70 font-bold uppercase truncate bg-black/20 p-2 rounded border border-white/5">
                                {v.notes}
                              </p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center glass border-dashed border-2 border-white/5 rounded-3xl opacity-20">
                      <Library className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma unidade interna cadastrada.</p>
                    </div>
                  )}
                </div>

              </div>
            </ScrollArea>
          </div>

          <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between flex-none rounded-b-3xl">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Biblioteca Jurídica Oficial RGMJ</span>
            </div>
            <Button onClick={() => setIsViewOpen(false)} className="gold-gradient text-background font-black uppercase text-[11px] tracking-widest px-12 h-14 rounded-xl shadow-2xl">
              FECHAR DOSSIÊ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
