"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  FolderPlus, 
  Upload, 
  Archive, 
  Brain,
  X
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DraftingTool } from "@/components/drafting/drafting-tool"

export default function DraftingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAiToolOpen, setIsAiToolOpen] = useState(false)

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold text-white tracking-tight">Acervo Digital</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">
            Biblioteca central de modelos e documentos institucionais.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar no acervo..." 
              className="pl-10 glass border-white/5 h-11 text-xs text-white focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-white hover:bg-white/5 border border-white/5 rounded-lg">
              <FolderPlus className="h-5 w-5" />
            </Button>
            <Button className="gold-gradient text-background font-bold gap-2 px-6 h-11 uppercase text-[10px] tracking-widest rounded-lg shadow-lg shadow-primary/10">
              <Upload className="h-4 w-4" /> Enviar Arquivo
            </Button>
          </div>
        </div>
      </div>

      {/* Biblioteca de Documentos */}
      <Card className="glass border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="p-10 border-b border-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-3xl font-headline font-bold text-white mb-2 tracking-tight">Biblioteca de Documentos</CardTitle>
              <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
                Gerencie o repositório oficial de modelos do RGMJ Advogados.
              </p>
            </div>
            <Dialog open={isAiToolOpen} onOpenChange={setIsAiToolOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="glass border-primary/20 text-primary font-bold gap-3 h-14 px-8 rounded-xl hover:bg-primary/10 transition-all">
                  <Brain className="h-5 w-5" /> Minuta Inteligente (IA)
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-primary/20 sm:max-w-[1200px] bg-[#0a0f1e] p-0 overflow-hidden shadow-2xl">
                <div className="p-6 bg-[#0a0f1e] border-b border-white/5 flex justify-between items-center">
                  <DialogHeader>
                    <DialogTitle className="text-white font-headline text-2xl flex items-center gap-4 uppercase tracking-tighter">
                      <Brain className="h-7 w-7 text-primary" /> Central de Inteligência
                    </DialogTitle>
                  </DialogHeader>
                  <Button variant="ghost" size="icon" onClick={() => setIsAiToolOpen(false)} className="text-muted-foreground hover:text-white">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-10 bg-[#0a0f1e]/50">
                  <DraftingTool />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] py-6 pl-10">Tipo</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] py-6">Identificação do Item</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] py-6">Criação</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] py-6 text-right pr-10">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Empty State */}
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="h-96 text-center border-0">
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center opacity-20">
                      <Archive className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground opacity-30">O acervo digital está vazio.</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}