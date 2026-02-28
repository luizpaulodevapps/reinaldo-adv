"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings as SettingsIcon,
  ChevronRight,
  LayoutGrid,
  Save,
  Instagram,
  Bell,
  UserCircle
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("geral")
  
  const [formData, setFormData] = useState({
    officeName: "Bueno Gois Advogados e Associados",
    adminEmail: "contato@buenogoisadvogado.com.br",
    address: "Rua Marechal Deodoro, 1594 - Sala 2, São Bernardo do Campo / SP",
    phone: "(11) 98059-0128",
    instagram: "https://www.instagram.com/buenogoisadv/"
  })

  const handleSave = () => {
    toast({
      title: "Configurações Atualizadas",
      description: "Os dados da instituição foram salvos com sucesso.",
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <LayoutGrid className="h-3 w-3" />
        <Link href="/dashboard" className="hover:text-primary transition-colors">Início</Link>
        <ChevronRight className="h-2 w-2" />
        <span className="text-muted-foreground">Dashboard</span>
        <ChevronRight className="h-2 w-2" />
        <span className="text-white">Configurações</span>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-headline font-bold text-white tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-70">
          Gestão de infraestrutura, pessoas e parâmetros estratégicos.
        </p>
      </div>

      {/* Tabs Menu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#0a1420]/50 border border-white/5 h-12 p-1 gap-1 w-full justify-start rounded-xl mb-8 overflow-x-auto scrollbar-hide">
          {[
            { id: "geral", label: "Geral" },
            { id: "seo", label: "SEO & Analytics" },
            { id: "usuarios", label: "Usuarios" },
            { id: "financeiro", label: "Financeiro" },
            { id: "tags", label: "Dicionário de Tags" },
            { id: "kit", label: "Kit Cliente" },
            { id: "modelos", label: "Modelos" },
            { id: "backup", label: "Backup" },
            { id: "licenca", label: "Licença" }
          ].map((tab) => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className="data-[state=active]:bg-primary data-[state=active]:text-background text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-6 rounded-lg transition-all"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content Section */}
        <Card className="glass border-white/5 overflow-hidden shadow-2xl">
          <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-2xl font-headline font-bold text-white mb-1">Dados da Instituição</CardTitle>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
              Informações principais que serão usadas em documentos e notificações oficiais.
            </p>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Nome do Escritório</Label>
                <Input 
                  value={formData.officeName}
                  onChange={(e) => setFormData({...formData, officeName: e.target.value})}
                  className="glass border-white/10 h-12 text-sm text-white focus:ring-primary/50" 
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">E-mail Administrativo</Label>
                <Input 
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                  className="glass border-white/10 h-12 text-sm text-white focus:ring-primary/50" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Endereço da Sede</Label>
              <Input 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="glass border-white/10 h-12 text-sm text-white focus:ring-primary/50" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Telefone / PABX</Label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="glass border-white/10 h-12 text-sm text-white focus:ring-primary/50" 
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Instagram (URL)</Label>
                <div className="relative">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input 
                    value={formData.instagram}
                    onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                    className="pl-12 glass border-white/10 h-12 text-sm text-white focus:ring-primary/50" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button 
                onClick={handleSave}
                className="gold-gradient text-background font-black gap-3 h-12 px-10 uppercase text-[10px] tracking-widest rounded-lg shadow-xl shadow-primary/10 hover:scale-[1.02] transition-transform"
              >
                <Save className="h-4 w-4" /> Atualizar Cadastro
              </Button>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}