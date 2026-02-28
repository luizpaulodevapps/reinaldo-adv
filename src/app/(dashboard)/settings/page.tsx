
"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Settings as SettingsIcon,
  ChevronRight,
  LayoutGrid,
  Save,
  Instagram,
  Bell,
  UserCircle,
  BarChart,
  ShieldCheck,
  DollarSign,
  Tag,
  FolderOpen,
  FileText,
  Database,
  Key,
  Globe,
  Plus
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("geral")
  
  const handleSave = () => {
    toast({
      title: "Configurações Atualizadas",
      description: "Os parâmetros estratégicos da banca foram salvos com sucesso.",
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
          Gestão de infraestrutura, pessoas e parâmetros estratégicos da banca RGMJ.
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

        {/* Tab: Geral */}
        <TabsContent value="geral" className="mt-0 outline-none">
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
                  <Input defaultValue="Bueno Gois Advogados e Associados" className="glass border-white/10 h-12 text-sm text-white focus:ring-primary/50" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">E-mail Administrativo</Label>
                  <Input defaultValue="contato@buenogoisadvogado.com.br" className="glass border-white/10 h-12 text-sm text-white focus:ring-primary/50" />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Endereço da Sede</Label>
                <Input defaultValue="Rua Marechal Deodoro, 1594 - Sala 2, São Bernardo do Campo / SP" className="glass border-white/10 h-12 text-sm text-white focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Telefone / PABX</Label>
                  <Input defaultValue="(11) 98059-0128" className="glass border-white/10 h-12 text-sm text-white focus:ring-primary/50" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Instagram (URL)</Label>
                  <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input defaultValue="https://www.instagram.com/buenogoisadv/" className="pl-12 glass border-white/10 h-12 text-sm text-white focus:ring-primary/50" />
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <Button onClick={handleSave} className="gold-gradient text-background font-black gap-3 h-12 px-10 uppercase text-[10px] tracking-widest rounded-lg shadow-xl shadow-primary/10 hover:scale-[1.02] transition-transform">
                  <Save className="h-4 w-4" /> Atualizar Cadastro
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: SEO & Analytics */}
        <TabsContent value="seo" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-2xl font-headline font-bold text-white mb-1 flex items-center gap-3">
                <BarChart className="h-6 w-6 text-primary" /> SEO & Analytics
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                Gestão de tráfego, pixel de conversão e visibilidade digital.
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">ID de Mensuração (Google Analytics)</Label>
                  <Input placeholder="G-XXXXXXXXXX" className="glass border-white/10 h-12 text-sm text-white" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">ID do Pixel (Facebook/Meta)</Label>
                  <Input placeholder="XXXXXXXXXXXXXXXX" className="glass border-white/10 h-12 text-sm text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Palavras-Chave Estratégicas (Separe por vírgula)</Label>
                <Input placeholder="advogado trabalhista, direito executivo, rgmadvogados" className="glass border-white/10 h-12 text-sm text-white" />
              </div>
              <div className="pt-6">
                <Button onClick={handleSave} className="gold-gradient text-background font-black gap-3 h-12 px-10 uppercase text-[10px] tracking-widest rounded-lg">
                  <Save className="h-4 w-4" /> Salvar Preferências
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários */}
        <TabsContent value="usuarios" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-headline font-bold text-white mb-1 flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary" /> Gestão de Usuários
                </CardTitle>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                  Controle de acessos e hierarquia da banca RGMJ.
                </p>
              </div>
              <Button variant="outline" className="glass border-primary/20 text-primary font-bold text-[10px] uppercase h-10 px-6 gap-2">
                <Plus className="h-3.5 w-3.5" /> Novo Usuário
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {[
                  { name: "Dr. Reinaldo Gonçalves", email: "luizao16@gmail.com", role: "ADMIN", status: "ATIVO" },
                  { name: "Secretaria Operacional", email: "secretaria@rgmj.com.br", role: "ASSISTENTE", status: "ATIVO" },
                ].map((user, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{user.name}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[9px] font-black text-primary border border-primary/20 px-3 py-1 rounded-full">{user.role}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <SettingsIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Financeiro */}
        <TabsContent value="financeiro" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-2xl font-headline font-bold text-white mb-1 flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-primary" /> Parâmetros Financeiros
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                Configuração de taxas, repasses e tributação.
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Divisão Base Escritório (%)</Label>
                  <Input defaultValue="70" type="number" className="glass border-white/10 h-12 text-sm text-white" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Divisão Base Advogado (%)</Label>
                  <Input defaultValue="30" type="number" className="glass border-white/10 h-12 text-sm text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between p-6 rounded-xl bg-secondary/20 border border-white/5">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">Emissão Automática de Recibo</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Gerar PDF profissional no ato da baixa.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="pt-6">
                <Button onClick={handleSave} className="gold-gradient text-background font-black gap-3 h-12 px-10 uppercase text-[10px] tracking-widest rounded-lg">
                  <Save className="h-4 w-4" /> Atualizar Regras Financeiras
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Dicionário de Tags */}
        <TabsContent value="tags" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-2xl font-headline font-bold text-white mb-1 flex items-center gap-3">
                <Tag className="h-6 w-6 text-primary" /> Dicionário de Tags
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                Categorização semântica para processos e documentos.
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex flex-wrap gap-3">
                {["Urgente", "Prazos Críticos", "Sentença", "Acordo", "Honorários", "Vara 01", "Tribunal", "Recurso"].map((tag, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:border-primary/50 transition-colors group cursor-default">
                    {tag}
                    <button className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="h-3 w-3 rotate-45" /></button>
                  </div>
                ))}
                <Button variant="ghost" className="h-9 border-dashed border border-white/20 text-[10px] uppercase font-bold text-muted-foreground">
                  <Plus className="h-3 w-3 mr-2" /> Adicionar Tag
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Kit Cliente */}
        <TabsContent value="kit" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-2xl font-headline font-bold text-white mb-1 flex items-center gap-3">
                <FolderOpen className="h-6 w-6 text-primary" /> Kit Cliente (Automação Drive)
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                Estrutura padrão de pastas e documentos para novos casos.
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Pastas Automáticas (Google Drive)</Label>
                <div className="space-y-3">
                  {["01. PETIÇÕES", "02. PROVAS", "03. DECISÕES", "04. CÁLCULOS", "05. DOCUMENTOS PESSOAIS"].map((folder, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                      <span className="text-xs font-bold text-white">{folder}</span>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-6">
                <Button onClick={handleSave} className="gold-gradient text-background font-black gap-3 h-12 px-10 uppercase text-[10px] tracking-widest rounded-lg">
                  <Save className="h-4 w-4" /> Salvar Estrutura de Kit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Modelos */}
        <TabsContent value="modelos" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-headline font-bold text-white mb-1 flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" /> Modelos de Documentos
                </CardTitle>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                  Templates institucionais para a IA de redação.
                </p>
              </div>
              <Button className="gold-gradient text-background font-bold text-[10px] uppercase h-10 px-6 gap-2">
                <Plus className="h-3.5 w-3.5" /> Novo Modelo
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {["Petição Inicial - Trabalhista", "Procuração de Plenos Poderes", "Contrato de Honorários", "Recurso Ordinário"].map((doc, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight">{doc}</h4>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Backup */}
        <TabsContent value="backup" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-2xl font-headline font-bold text-white mb-1 flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" /> Backup & Exportação
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                Segurança de dados e portabilidade da base RGMJ.
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-white/5 border-white/10 p-6 space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">Exportação Firestore (JSON)</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-relaxed">Baixar toda a base de clientes, processos e histórico financeiro em formato legível por máquina.</p>
                  <Button variant="outline" className="w-full glass border-white/20 text-white font-bold text-[10px] uppercase h-10">Exportar Agora</Button>
                </Card>
                <Card className="bg-white/5 border-white/10 p-6 space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">Relatório Auditado (PDF)</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-relaxed">Gerar documento consolidado de performance e saúde financeira da banca para auditoria externa.</p>
                  <Button variant="outline" className="w-full glass border-white/20 text-white font-bold text-[10px] uppercase h-10">Gerar Relatório</Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Licença */}
        <TabsContent value="licenca" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-2xl font-headline font-bold text-white mb-1 flex items-center gap-3">
                <Key className="h-6 w-6 text-primary" /> Licença & Assinatura
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                Informações de ativação e versão do LexFlow ERP.
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between p-8 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="space-y-2">
                  <h4 className="text-2xl font-headline font-bold text-white">Plano LexFlow Elite</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Assinatura Ativa • Próximo faturamento: 20/06/2024</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-500 text-white border-0 font-black text-[10px] uppercase px-4 h-7">STATUS: VITALÍCIO</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl bg-secondary/30 border border-white/5 text-center space-y-2">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Versão</p>
                  <p className="text-lg font-bold text-white">v2.4.0-pro</p>
                </div>
                <div className="p-6 rounded-xl bg-secondary/30 border border-white/5 text-center space-y-2">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Usuários</p>
                  <p className="text-lg font-bold text-white">Ilimitado</p>
                </div>
                <div className="p-6 rounded-xl bg-secondary/30 border border-white/5 text-center space-y-2">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">IA Engine</p>
                  <p className="text-lg font-bold text-primary flex items-center justify-center gap-2">
                    <Globe className="h-4 w-4" /> Gemini 2.5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
