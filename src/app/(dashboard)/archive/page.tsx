
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Folder, FileText, Search, MoreVertical, ExternalLink, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const files = [
  { name: "Petição Inicial_Silva.pdf", type: "PDF", size: "1.2 MB", date: "12/05/2024", case: "0012345-67" },
  { name: "Contrato_Social_TechCorp.docx", type: "DOCX", size: "850 KB", date: "10/05/2024", case: "0098765-43" },
  { name: "Procuração_Oliveira.pdf", type: "PDF", size: "420 KB", date: "08/05/2024", case: "0012345-67" },
  { name: "Evidência_Audio_Conversa.mp3", type: "AUDIO", size: "4.5 MB", date: "05/05/2024", case: "0045678-90" },
]

export default function ArchivePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">Arquivo Digital</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Gestão de Documentos e Dossiês Digitais</p>
        </div>
        <Button className="glass border-primary/20 text-primary font-bold gap-2">
          <HardDrive className="h-4 w-4" /> Conectar Google Drive
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar por arquivo ou processo..." className="pl-9 glass" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {["Petições", "Contratos", "Evidências", "Sentenças"].map((folder, i) => (
          <Card key={i} className="glass border-primary/10 hover-gold transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Folder className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{folder}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">24 Arquivos</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass border-primary/10 overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-primary/10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Arquivos Recentes</h3>
        </div>
        <div className="divide-y divide-primary/10">
          {files.map((file, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">{file.name}</h5>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                    {file.case} • {file.size} • {file.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><ExternalLink className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
