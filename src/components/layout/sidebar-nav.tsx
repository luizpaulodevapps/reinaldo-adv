
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  BarChart3, 
  ClipboardCheck, 
  Zap, 
  Users, 
  FolderOpen, 
  Clock, 
  Gavel, 
  BookOpen, 
  Archive, 
  Receipt, 
  Wallet, 
  Settings,
  Scale,
  Users2,
  UserCheck,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useUser, useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const menuGroups = [
  {
    title: "INICIATIVA (ESTRATÉGICO)",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Relatórios BI", href: "/reports", icon: BarChart3 },
      { name: "Checklists", href: "/checklists", icon: ClipboardCheck },
    ]
  },
  {
    title: "COMERCIAL (CRM)",
    items: [
      { name: "Leads (Triagem)", href: "/leads", icon: Zap },
      { name: "Clientes", href: "/clients", icon: Users },
    ]
  },
  {
    title: "SECRETARIA (OPERACIONAL)",
    items: [
      { name: "Processos", href: "/cases", icon: FolderOpen },
      { name: "Agenda de Prazos", href: "/deadlines", icon: Clock },
      { name: "Pauta de Audiências", href: "/agenda", icon: Gavel },
      { name: "Acervo de Modelos", href: "/drafting", icon: BookOpen },
      { name: "Arquivo Digital", href: "/archive", icon: Archive },
    ]
  },
  {
    title: "FINANCEIRO (CAIXA)",
    items: [
      { name: "Faturamento", href: "/billing", icon: Receipt },
      { name: "Carteira & Repasses", href: "/financial", icon: Wallet },
    ]
  },
  {
    title: "GESTÃO (D.P.)",
    items: [
      { name: "Departamento Pessoal", href: "/staff", icon: Users2 },
      { name: "Equipe (Acessos)", href: "/team", icon: UserCheck },
      { name: "Configurações", href: "/settings", icon: Settings },
    ]
  }
]

export function SidebarNav() {
  const pathname = usePathname()
  const { user, profile, role } = useUser()
  const auth = useAuth()

  const displayName = profile?.name || user?.displayName || "Membro RGMJ"
  const userRole = role === 'admin' ? 'Administrador' : role === 'lawyer' ? 'Advogado' : role === 'financial' ? 'Financeiro' : 'Equipe'

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Erro ao sair:", error)
    }
  }

  return (
    <nav className="flex flex-col h-full bg-[#020617] border-r border-white/5">
      {/* Logo RGMJ */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg shadow-primary/20">
          <Scale className="text-background h-6 w-6" />
        </div>
        <span className="font-headline text-2xl font-bold tracking-tight text-white uppercase tracking-tighter">RGMJ</span>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-8 pb-8">
          {/* Seção Minha Conta (Conforme Referência) */}
          <div className="space-y-3 px-2 mb-6">
            <h3 className="px-2 text-[10px] font-bold text-muted-foreground/60 tracking-[0.2em] uppercase">
              MINHA CONTA
            </h3>
            <Button 
              asChild 
              className="w-full bg-[#f5d030] hover:bg-[#d4af37] text-[#0a0f1e] font-bold h-12 shadow-lg rounded-lg uppercase tracking-wider text-[12px] transition-transform active:scale-95 border-0"
            >
              <Link href="/settings?tab=perfil">
                Meu Perfil
              </Link>
            </Button>
          </div>

          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="px-4 text-[10px] font-bold text-muted-foreground/60 tracking-[0.2em] uppercase">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative",
                        isActive 
                          ? "bg-primary/10 text-primary font-bold shadow-[inset_0_0_10px_rgba(245,208,48,0.1)]" 
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
                      )}
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors", 
                        isActive ? "text-primary" : "group-hover:text-primary"
                      )} />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* User Section with Dropdown Menu */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 border border-white/5 hover:bg-secondary/50 transition-all outline-none focus:ring-1 focus:ring-primary/50 text-left group">
              <Avatar className="h-10 w-10 border border-primary/20 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold truncate text-white uppercase tracking-tighter group-hover:text-primary transition-colors">{displayName}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{userRole}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 glass border-white/10 bg-[#0a0f1e] text-white p-2">
            <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-3">Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=perfil" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 cursor-pointer transition-colors rounded-lg">
                <UserIcon className="h-4 w-4 text-primary" /> Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 cursor-pointer transition-colors rounded-lg">
                <SettingsIcon className="h-4 w-4 text-primary" /> Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 cursor-pointer transition-colors rounded-lg focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sair do Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
