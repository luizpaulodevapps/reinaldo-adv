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
  User as UserIcon
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
      { name: "Settings", href: "/settings", icon: Settings },
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
    <nav className="flex flex-col h-full bg-[#213B37]">
      <div className="flex items-center gap-4 px-8 py-12">
        <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center border border-white/5">
          <Scale className="text-white h-6 w-6" />
        </div>
        <span className="text-xl font-bold text-white uppercase tracking-tighter">Portal RGMJ</span>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-10 pb-10">
          <div className="px-4">
            <Button 
              asChild 
              className="w-full bg-[#818258] hover:bg-[#bbbd7e] text-white font-bold h-12 rounded-[0.3em] uppercase text-[11px] tracking-[0.2em] shadow-lg"
            >
              <Link href="/settings?tab=perfil">Meu Perfil</Link>
            </Button>
          </div>

          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="px-4 text-[9px] font-bold text-white/30 tracking-[0.3em] uppercase">
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
                        "flex items-center gap-3 px-4 py-2.5 rounded transition-all duration-200",
                        isActive 
                          ? "bg-[#818258] text-white font-bold shadow-md" 
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-xs uppercase font-bold tracking-widest">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-6 border-t border-white/5 bg-black/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-4 px-2 py-2 rounded hover:bg-white/5 transition-all outline-none">
              <Avatar className="h-9 w-9 border-2 border-[#818258]">
                <AvatarFallback className="bg-[#818258] text-white text-[11px] font-bold uppercase">
                  {displayName.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[11px] font-bold truncate text-white uppercase tracking-tight">{displayName}</span>
                <span className="text-[9px] text-white/30 uppercase font-bold tracking-[0.2em] mt-0.5">{userRole}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-64 bg-[#213B37] border-white/10 text-white p-2">
            <DropdownMenuLabel className="text-[10px] font-bold text-white/40 uppercase px-4 py-3 tracking-widest">Gestão de Comando</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=perfil" className="flex items-center gap-3 px-4 py-3 text-xs hover:bg-white/5 cursor-pointer rounded-md">
                <UserIcon className="h-4 w-4 text-[#818258]" /> Meu Perfil Estratégico
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-xs text-rose-400 hover:bg-rose-400/10 cursor-pointer rounded-md"
            >
              <LogOut className="h-4 w-4" /> Encerrar Sessão Segura
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}