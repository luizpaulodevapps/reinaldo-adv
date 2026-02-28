
"use client"

import { useState, useMemo } from "react"
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
  ShieldCheck,
  BarChart,
  DollarSign,
  Tag,
  FolderOpen,
  FileText,
  Database,
  Key,
  Globe,
  Plus,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("geral")
  const db = useFirestore()
  const { user } = useUser()

  // Busca Equipe Real do Firestore
  const staffQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "staff_profiles"), orderBy("name", "asc"))
  }, [db, user])

  const { data: team, isLoading: loadingTeam } = useCollection(staffQuery)
  
  const handleSave = () => {
    toast({
      title: "Configurações Atualizadas",
      description: "Os parâmetros estratégicos da banca foram salvos com sucesso.",
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        <LayoutGrid className="h-3 w-3" />
        <Link href="/dashboard" className="hover:text-primary transition-colors">Início</Link>
        <ChevronRight className="h-2 w-2" />
        <span className="text-muted-foreground">Dashboard</span>
        <ChevronRight className="h-2 w-2" />
        <span className="text-white">Configurações</span>
      </div>

      {/* Header Corporativo */}
      <div className="space-y-1">
        <h1 className="text-5xl font-headline font-bold text-white tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-70">
          GESTÃO DE INFRAESTRUTURA, PESSOAS E PARÂMETROS ESTRATÉGICOS DA BANCA RGMJ.
        </p>
      </div>

      {/* Menu de Abas Estilizado */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-white/5 h-14 p-0 gap-1 w-full justify-start rounded-none mb-10 overflow-x-auto scrollbar-hide">
          {[
            { id: "geral", label: "GERAL" },
            { id: "seo", label: "SEO & ANALYTICS" },
            { id: "usuarios", label: "USUARIOS" },
            { id: "financeiro", label: "FINANCEIRO" },
            { id: "tags", label: "DICIONÁRIO DE TAGS" },
            { id: "kit", label: "KIT CLIENTE" },
            { id: "modelos", label: "MODELOS" },
            { id: "backup", label: "BACKUP" },
            { id: "licenca", label: "LICENÇA" }
          ].map((tab) => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-primary border-2 border-transparent text-muted-foreground font-bold text-[10px] uppercase tracking-widest h-full px-6 transition-all rounded-lg"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab: Geral */}
        <TabsContent value="geral" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1">Dados da Instituição</CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                Informações principais que serão usadas em documentos e notificações oficiais.
              </p>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Nome do Escritório</Label>
                  <Input defaultValue="Bueno Gois Advogados e Associados" className="glass border-white/10 h-14 text-sm text-white focus:ring-primary/50" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">E-mail Administrativo</Label>
                  <Input defaultValue="contato@buenogoisadvogado.com.br" className="glass border-white/10 h-14 text-sm text-white focus:ring-primary/50" />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Endereço da Sede</Label>
                <Input defaultValue="Rua Marechal Deodoro, 1594 - Sala 2, São Bernardo do Campo / SP" className="glass border-white/10 h-14 text-sm text-white focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Telefone / PABX</Label>
                  <Input defaultValue="(11) 98059-0128" className="glass border-white/10 h-14 text-sm text-white focus:ring-primary/50" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Instagram (URL)</Label>
                  <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input defaultValue="https://www.instagram.com/buenogoisadv/" className="pl-14 glass border-white/10 h-14 text-sm text-white focus:ring-primary/50" />
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <Button onClick={handleSave} className="gold-gradient text-background font-black gap-3 h-14 px-12 uppercase text-[11px] tracking-widest rounded-xl shadow-2xl shadow-primary/10 hover:scale-[1.02] transition-transform">
                  <Save className="h-5 w-5" /> ATUALIZAR CADASTRO
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários (Fidelidade Total à Referência) */}
        <TabsContent value="usuarios" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01] flex flex-row items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-3xl font-headline font-bold text-white flex items-center gap-4">
                  <ShieldCheck className="h-8 w-8 text-primary" /> Gestão de Usuários
                </CardTitle>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                  CONTROLE DE ACESSOS E HIERARQUIA DA BANCA RGMJ.
                </p>
              </div>
              <Button variant="outline" className="glass border-primary/20 text-primary font-black text-[11px] uppercase h-12 px-8 gap-3 rounded-xl hover:bg-primary/5">
                <Plus className="h-5 w-5" /> NOVO USUÁRIO
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTeam ? (
                <div className="py-32 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sincronizando Hierarquia...</span>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {(team || []).map((member) => (
                    <div key={member.id} className="p-8 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-14 w-14 border-2 border-primary/20 bg-secondary shadow-lg">
                          <AvatarFallback className="text-[11px] font-black text-primary uppercase">
                            {member.name ? member.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-lg font-bold text-white uppercase tracking-tight">{member.name}</h4>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.1em]">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-10">
                        <Badge 
                          variant="outline" 
                          className="text-[9px] font-black text-primary border-primary/20 px-5 py-1.5 rounded-full bg-primary/5 uppercase tracking-widest"
                        >
                          {member.role || "MEMBRO"}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white transition-colors">
                          <SettingsIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Financeiro */}
        <TabsContent value="financeiro" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1 flex items-center gap-4">
                <DollarSign className="h-8 w-8 text-primary" /> Parâmetros Financeiros
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                CONFIGURAÇÃO DE TAXAS, REPASSES E TRIBUTAÇÃO.
              </p>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">DIVISÃO BASE ESCRITÓRIO (%)</Label>
                  <Input defaultValue="70" type="number" className="glass border-white/10 h-14 text-sm text-white" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">DIVISÃO BASE ADVOGADO (%)</Label>
                  <Input defaultValue="30" type="number" className="glass border-white/10 h-14 text-sm text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between p-8 rounded-2xl bg-secondary/20 border border-white/5">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">Emissão Automática de Recibo</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">GERAR PDF PROFISSIONAL NO ATO DA BAIXA.</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-primary" />
              </div>
              <div className="pt-6">
                <Button onClick={handleSave} className="gold-gradient text-background font-black gap-3 h-14 px-12 uppercase text-[11px] tracking-widest rounded-xl">
                  <Save className="h-5 w-5" /> ATUALIZAR REGRAS FINANCEIRAS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tags */}
        <TabsContent value="tags" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1 flex items-center gap-4">
                <Tag className="h-8 w-8 text-primary" /> Dicionário de Tags
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                CATEGORIZAÇÃO SEMÂNTICA PARA PROCESSOS E DOCUMENTOS.
              </p>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="flex flex-wrap gap-4">
                {["URGENTE", "PRAZOS CRÍTICOS", "SENTENÇA", "ACORDO", "HONORÁRIOS", "TRIBUNAL", "RECURSO"].map((tag, i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:border-primary/50 transition-colors group cursor-default">
                    {tag}
                    <button className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="h-4 w-4 rotate-45" /></button>
                  </div>
                ))}
                <Button variant="ghost" className="h-12 border-dashed border-2 border-white/10 text-[10px] uppercase font-bold text-muted-foreground hover:bg-white/5 px-8 rounded-xl">
                  <Plus className="h-4 w-4 mr-2" /> ADICIONAR TAG
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Kit Cliente */}
        <TabsContent value="kit" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1 flex items-center gap-4">
                <FolderOpen className="h-8 w-8 text-primary" /> Kit Cliente (Automação Drive)
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                ESTRUTURA PADRÃO DE PASTAS E DOCUMENTOS PARA NOVOS CASOS.
              </p>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">PASTAS AUTOMÁTICAS (GOOGLE DRIVE)</Label>
                <div className="space-y-3">
                  {["01. PETIÇÕES", "02. PROVAS", "03. DECISÕES", "04. CÁLCULOS", "05. DOCUMENTOS PESSOAIS"].map((folder, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-xs font-bold text-white tracking-widest uppercase">{folder}</span>
                      <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-6">
                <Button onClick={handleSave} className="gold-gradient text-background font-black gap-3 h-14 px-12 uppercase text-[11px] tracking-widest rounded-xl">
                  <Save className="h-5 w-5" /> SALVAR ESTRUTURA DE KIT
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Modelos */}
        <TabsContent value="modelos" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01] flex flex-row items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-3xl font-headline font-bold text-white flex items-center gap-4">
                  <FileText className="h-8 w-8 text-primary" /> Modelos de Documentos
                </CardTitle>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                  TEMPLATES INSTITUCIONAIS PARA A IA DE REDAÇÃO.
                </p>
              </div>
              <Button className="gold-gradient text-background font-black text-[11px] uppercase h-12 px-8 gap-3 rounded-xl">
                <Plus className="h-5 w-5" /> NOVO MODELO
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {["PETIÇÃO INICIAL - TRABALHISTA", "PROCURAÇÃO DE PLENOS PODERES", "CONTRATO DE HONORÁRIOS", "RECURSO ORDINÁRIO"].map((doc, i) => (
                  <div key={i} className="p-8 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                        <FileText className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-widest">{doc}</h4>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Backup */}
        <TabsContent value="backup" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1 flex items-center gap-4">
                <Database className="h-8 w-8 text-primary" /> Backup & Exportação
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                SEGURANÇA DE DADOS E PORTABILIDADE DA BASE RGMJ.
              </p>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Card className="bg-white/5 border-white/10 p-8 space-y-6 rounded-2xl">
                  <h4 className="text-lg font-headline font-bold text-white uppercase tracking-tight">Exportação Firestore (JSON)</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-relaxed">BAIXAR TODA A BASE DE CLIENTES, PROCESSOS E HISTÓRICO FINANCEIRO EM FORMATO LEGÍVEL POR MÁQUINA PARA SEGURANÇA LOCAL.</p>
                  <Button variant="outline" className="w-full glass border-white/20 text-white font-black text-[11px] uppercase h-14 rounded-xl hover:bg-white/5">EXPORTAR AGORA</Button>
                </Card>
                <Card className="bg-white/5 border-white/10 p-8 space-y-6 rounded-2xl">
                  <h4 className="text-lg font-headline font-bold text-white uppercase tracking-tight">Relatório Auditado (PDF)</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-relaxed">GERAR DOCUMENTO CONSOLIDADO DE PERFORMANCE E SAÚDE FINANCEIRA DA BANCA PARA AUDITORIA EXTERNA E CONFERÊNCIA.</p>
                  <Button variant="outline" className="w-full glass border-white/20 text-white font-black text-[11px] uppercase h-14 rounded-xl hover:bg-white/5">GERAR RELATÓRIO</Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Licença */}
        <TabsContent value="licenca" className="mt-0 outline-none">
          <Card className="glass border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-3xl font-headline font-bold text-white mb-1 flex items-center gap-4">
                <Key className="h-8 w-8 text-primary" /> Licença & Assinatura
              </CardTitle>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                INFORMAÇÕES DE ATIVAÇÃO E VERSÃO DO LEXFLOW ERP.
              </p>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="flex items-center justify-between p-10 rounded-3xl bg-primary/5 border border-primary/20 shadow-2xl">
                <div className="space-y-3">
                  <h4 className="text-4xl font-headline font-bold text-white">Plano LexFlow Elite</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">ASSINATURA ATIVA • PRÓXIMO FATURAMENTO: 20/06/2024</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-500 text-white border-0 font-black text-[11px] uppercase px-6 h-9 rounded-full shadow-lg shadow-emerald-500/20">STATUS: VITALÍCIO</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 rounded-2xl bg-secondary/30 border border-white/5 text-center space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Versão</p>
                  <p className="text-2xl font-bold text-white">v2.4.0-pro</p>
                </div>
                <div className="p-8 rounded-2xl bg-secondary/30 border border-white/5 text-center space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Usuários</p>
                  <p className="text-2xl font-bold text-white">Ilimitado</p>
                </div>
                <div className="p-8 rounded-2xl bg-secondary/30 border border-white/5 text-center space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">IA Engine</p>
                  <p className="text-2xl font-bold text-primary flex items-center justify-center gap-3">
                    <Globe className="h-6 w-6" /> Gemini 2.5
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
