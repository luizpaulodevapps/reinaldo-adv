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
    title: "ESTRATÉGICO",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Relatórios BI", href: "/reports", icon: BarChart3 },
      { name: "Checklists", href: "/checklists", icon: ClipboardCheck },
    ]
  },
  {
    title: "COMERCIAL",
    items: [
      { name: "Leads (Triagem)", href: "/leads", icon: Zap },
      { name: "Clientes", href: "/clients", icon: Users },
    ]
  },
  {
    title: "OPERACIONAL",
    items: [
      { name: "Processos", href: "/cases", icon: FolderOpen },
      { name: "Agenda de Prazos", href: "/deadlines", icon: Clock },
      { name: "Audiências", href: "/agenda", icon: Gavel },
      { name: "Modelos", href: "/drafting", icon: BookOpen },
      { name: "Arquivo", href: "/archive", icon: Archive },
    ]
  },
  {
    title: "FINANCEIRO",
    items: [
      { name: "Faturamento", href: "/billing", icon: Receipt },
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
  const userRole = role === 'admin' ? 'Administrador' : 'Equipe'

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Erro ao sair:", error)
    }
  }

  return (
    <nav className="flex flex-col h-full bg-[#162a27] border-r border-white/5 shadow-2xl">
      {/* Bloco de Marca */}
      <div className="flex items-center gap-4 px-8 py-10">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
          <Scale className="text-primary h-6 w-6" />
        </div>
        <div>
          <span className="text-lg font-black text-white uppercase tracking-tighter block leading-none">Portal RGMJ</span>
          <span className="text-[8px] text-primary font-bold uppercase tracking-[0.3em] mt-1 opacity-70">Advocacia de Elite</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-10 pb-10">
          {/* Botão de Conta Tático */}
          <div className="px-2">
            <p className="px-4 text-[9px] font-black text-white/30 tracking-[0.3em] uppercase mb-3">Minha Conta</p>
            <Button 
              asChild 
              className="w-full gold-gradient hover:opacity-90 text-[#0a0f1e] font-black h-12 rounded-xl uppercase text-[10px] tracking-[0.15em] shadow-xl shadow-primary/10 active:scale-95 transition-all gap-2"
            >
              <Link href="/settings?tab=perfil">
                <UserIcon className="h-3.5 w-3.5" /> Acessar Meu Perfil
              </Link>
            </Button>
          </div>

          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="px-4 text-[9px] font-black text-white/20 tracking-[0.4em] uppercase">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 group",
                        isActive 
                          ? "bg-[#818258]/20 text-white border border-[#818258]/30 shadow-lg" 
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-primary" : "text-white/20 group-hover:text-primary/50"
                        )} />
                        <span className={cn(
                          "text-[11px] uppercase tracking-widest font-bold",
                          isActive ? "opacity-100" : "opacity-80"
                        )}>{item.name}</span>
                      </div>
                      {isActive && <ChevronRight className="h-3 w-3 text-primary/50" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer de Usuário */}
      <div className="p-6 border-t border-white/5 bg-black/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-4 px-2 py-2 rounded-xl hover:bg-white/5 transition-all outline-none group border border-transparent hover:border-white/5">
              <Avatar className="h-10 w-10 border-2 border-primary/30 group-hover:border-primary/60 transition-all">
                <AvatarFallback className="bg-secondary text-white text-[11px] font-black uppercase">
                  {displayName.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[11px] font-black truncate text-white uppercase tracking-tight">{displayName}</span>
                <span className="text-[9px] text-primary font-bold uppercase tracking-[0.2em] mt-0.5">{userRole}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-64 bg-[#162a27] border-white/10 text-white p-2 shadow-2xl">
            <DropdownMenuLabel className="text-[10px] font-black text-white/40 uppercase px-4 py-3 tracking-[0.2em]">Gestão de Comando</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=perfil" className="flex items-center gap-3 px-4 py-3 text-xs hover:bg-white/5 cursor-pointer rounded-lg transition-colors">
                <UserIcon className="h-4 w-4 text-primary" /> Meu Perfil Estratégico
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-xs hover:bg-white/5 cursor-pointer rounded-lg transition-colors">
                <Settings className="h-4 w-4 text-primary" /> Configurações de Sistema
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-xs text-rose-400 hover:bg-rose-400/10 cursor-pointer rounded-lg transition-colors font-bold"
            >
              <LogOut className="h-4 w-4" /> Encerrar Sessão Segura
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}