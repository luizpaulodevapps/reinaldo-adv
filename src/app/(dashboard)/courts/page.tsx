
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
  ExternalLink, 
  Trash2, 
  Edit3, 
  ChevronRight,
  LayoutGrid,
  Map as MapIcon,
  Save,
  X,
  Library,
  ListPlus
} from "lucide-react"
import { useFirestore, useCollection, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { cn, maskCEP } from "@/lib/utils"

export default function CourtsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourt, setEditingCourt] = useState<any>(null)
  const [loadingCep, setLoadingCep] = useState(false)
  const [newVara, setNewVara] = useState("")

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

  const handleAddVara = () => {
    if (!newVara.trim()) return
    const v = newVara.toUpperCase().trim()
    if (formData.varas.includes(v)) {
      toast({ variant: "destructive", title: "Vara já cadastrada" })
      return
    }
    setFormData((prev: any) => ({
      ...prev,
      varas: [...prev.varas, v]
    }))
    setNewVara("")
  }

  const handleRemoveVara = (v: string) => {
    setFormData((prev: any) => ({
      ...prev,
      varas: prev.varas.filter((item: string) => item !== v)
    }))
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
    setFormData({ ...court, varas: court.varas || [] })
    setIsDialogOpen(true)
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
              className="pl-12 glass border-white/5 h-12 text-xs text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenCreate}
            className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-6 w-6 text-background" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando Base Logística...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((court) => (
            <Card key={court.id} className="glass border-primary/10 hover-gold transition-all group overflow-hidden flex flex-col shadow-2xl">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-xl">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(court)} className="h-8 w-8 text-muted-foreground hover:text-primary"><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(court.id)} className="h-8 w-8 text-muted-foreground hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">
                    {court.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <MapPin className="h-3 w-3 opacity-50" /> {court.city} - {court.state}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Endereço de Citação</p>
                  <p className="text-[11px] text-white/80 font-medium uppercase leading-relaxed">
                    {court.address}, {court.number} {court.complement && `• ${court.complement}`}<br/>
                    {court.neighborhood} • CEP {court.zipCode}
                  </p>
                </div>

                {court.varas && court.varas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Unidades Internas ({court.varas.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {court.varas.slice(0, 5).map((v: string) => (
                        <Badge key={v} variant="secondary" className="bg-white/5 text-[8px] font-black border-white/5 uppercase">{v}</Badge>
                      ))}
                      {court.varas.length > 5 && <span className="text-[8px] text-muted-foreground font-black">+ {court.varas.length - 5} OUTRAS</span>}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary bg-primary/5 px-2">LOGÍSTICA OK</Badge>
                  {court.mapsLink && (
                    <a href={court.mapsLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest">
                      <MapIcon className="h-3.5 w-3.5" /> Ver no Maps
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6 glass rounded-3xl border-dashed border-2 border-white/5 opacity-30">
            <Building2 className="h-16 w-16 text-muted-foreground" />
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center">Nenhum fórum cadastrado</p>
            <Button onClick={handleOpenCreate} className="gold-gradient text-background font-black uppercase text-[11px] px-8 h-12 rounded-xl">
              Cadastrar Primeiro Órgão
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/10 bg-[#0a0f1e] sm:max-w-[800px] p-0 overflow-hidden shadow-2xl font-sans rounded-3xl">
          <div className="p-8 bg-[#0a0f1e] border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-white font-headline text-3xl uppercase tracking-tighter">
                {editingCourt ? "Retificar Órgão" : "Novo Fórum / Tribunal"}
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">
                Cadastro de base logística para automação de pauta RGMJ.
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-10 space-y-8 bg-[#0a0f1e]/50">
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Nome do Órgão / Prédio *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} className="glass border-white/10 h-14 text-white font-black text-sm" placeholder="EX: TRT 2ª REGIÃO - FÓRUM RUY BARBOSA" />
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
                  <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value.toUpperCase()})} className="glass border-white/10 h-12 text-white" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Número</Label>
                  <Input value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} className="glass border-white/10 h-12 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Bairro</Label>
                  <Input value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value.toUpperCase()})} className="glass border-white/10 h-12 text-white" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Cidade *</Label>
                  <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value.toUpperCase()})} className="glass border-white/10 h-12 text-white" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">UF *</Label>
                  <Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})} className="glass border-white/10 h-12 text-white" maxLength={2} />
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-6 shadow-inner">
                <Label className="text-[11px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                  <Library className="h-4 w-4" /> Unidades Judiciárias (Varas)
                </Label>
                <div className="flex gap-3">
                  <Input 
                    value={newVara} 
                    onChange={(e) => setNewVara(e.target.value)} 
                    placeholder="EX: 45ª VARA DO TRABALHO"
                    className="glass border-primary/30 h-12 text-white font-bold"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddVara()}
                  />
                  <Button onClick={handleAddVara} className="h-12 px-6 gold-gradient text-background font-black uppercase text-[10px] rounded-xl">
                    <ListPlus className="h-4 w-4 mr-2" /> SOMAR
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.varas.map((v: string) => (
                    <Badge key={v} className="bg-primary text-background font-black uppercase text-[9px] py-1.5 px-3 gap-2 rounded-lg flex items-center">
                      {v} <button onClick={() => handleRemoveVara(v)} className="hover:text-rose-700 transition-colors"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                  {formData.varas.length === 0 && (
                    <p className="text-[10px] text-primary/40 uppercase font-black tracking-widest italic py-2">Nenhuma unidade interna mapeada.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <MapIcon className="h-3.5 w-3.5" /> Link do Google Maps
                </Label>
                <Input value={formData.mapsLink} onChange={(e) => setFormData({...formData, mapsLink: e.target.value})} className="glass border-primary/20 h-12 text-white text-xs" placeholder="https://goo.gl/maps/..." />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground uppercase font-black text-[11px]">Cancelar</Button>
            <Button onClick={handleSave} className="gold-gradient text-background font-black uppercase text-[11px] px-10 h-14 rounded-xl shadow-2xl">
              <Save className="h-5 w-5 mr-3" /> SALVAR NA BIBLIOTECA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
