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
  ChevronRight,
  ClipboardList
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
    title: "ESTRATÉGICO",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Relatórios BI", href: "/reports", icon: BarChart3 },
      { name: "Laboratório", href: "/checklists", icon: ClipboardCheck, roleRequired: "admin" },
    ]
  },
  {
    title: "COMERCIAL",
    items: [
      { name: "Triagem", href: "/leads", icon: Zap },
      { name: "Clientes", href: "/clients", icon: Users },
    ]
  },
  {
    title: "OPERACIONAL",
    items: [
      { name: "Processos", href: "/cases", icon: FolderOpen },
      { name: "Protocolos", href: "/checklists/execucao", icon: ClipboardList },
      { name: "Prazos", href: "/deadlines", icon: Clock },
      { name: "Audiências", href: "/agenda", icon: Gavel },
      { name: "Modelos", href: "/drafting", icon: BookOpen },
    ]
  },
  {
    title: "FINANCEIRO",
    items: [
      { name: "Caixa", href: "/billing", icon: Receipt },
      { name: "Repasses", href: "/financial", icon: Wallet },
    ]
  },
  {
    title: "GESTÃO",
    items: [
      { name: "D.P.", href: "/staff", icon: Users2 },
      { name: "Equipe", href: "/team", icon: UserCheck },
      { name: "Configurações", href: "/settings", icon: Settings },
    ]
  }
]

export function SidebarNav() {
  const pathname = usePathname()
  const { user, profile, role } = useUser()
  const auth = useAuth()

  const displayName = profile?.name || user?.displayName || "Membro RGMJ"
  const userRoleDisplay = role === 'admin' ? 'Administrador' : 'Equipe'

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Erro ao sair:", error)
    }
  }

  return (
    <nav className="flex flex-col h-[calc(100vh-40px)] m-5 rounded-[2rem] bg-[#1e1b2e] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Bloco de Marca - Estilo "Your Logo" */}
      <div className="flex items-center gap-3 px-8 py-10">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
          <Scale className="text-primary h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-white uppercase tracking-tighter leading-none">RGMJ Elite</span>
          <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1">Portal de Comando</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-8 pb-10">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="px-4 text-[9px] font-black text-white/20 tracking-[0.3em] uppercase">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  if (item.roleRequired === 'admin' && role !== 'admin') return null

                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                        isActive 
                          ? "bg-white/5 text-white" 
                          : "text-white/40 hover:text-white hover:bg-white/[0.03]"
                      )}
                    >
                      {/* Indicador Lateral da Referência */}
                      {isActive && (
                        <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
                      )}
                      
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-primary" : "text-white/20 group-hover:text-primary/50"
                      )} />
                      <span className={cn(
                        "text-[11px] uppercase tracking-widest font-bold",
                        isActive ? "opacity-100" : "opacity-80"
                      )}>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer de Usuário SaaS */}
      <div className="p-6 bg-black/20 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-white/5 transition-all outline-none group border border-transparent">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarFallback className="bg-secondary text-white text-[10px] font-black uppercase">
                  {displayName.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[10px] font-black truncate text-white uppercase">{displayName}</span>
                <span className="text-[8px] text-primary font-bold uppercase tracking-widest">{userRoleDisplay}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-64 bg-[#1e1b2e] border-white/10 text-white p-2 rounded-2xl shadow-2xl">
            <DropdownMenuLabel className="text-[9px] font-black text-white/40 uppercase px-4 py-3 tracking-widest">Opções</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=perfil" className="flex items-center gap-3 px-4 py-3 text-xs hover:bg-white/5 cursor-pointer rounded-xl transition-colors">
                <UserIcon className="h-4 w-4 text-primary" /> Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-xs text-rose-400 hover:bg-rose-400/10 cursor-pointer rounded-xl transition-colors font-bold"
            >
              <LogOut className="h-4 w-4" /> Sair com Segurança
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}