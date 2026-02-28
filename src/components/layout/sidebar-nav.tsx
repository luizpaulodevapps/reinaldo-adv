"use client"

import * as React from "react"
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useUser, useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
    <Sidebar collapsible="icon" className="border-r border-white/5">
      <SidebarHeader className="py-8 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <span className="text-sm font-black text-white uppercase tracking-tighter leading-none whitespace-nowrap">RGMJ Elite</span>
            <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 whitespace-nowrap">Portal de Comando</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {menuGroups.map((group, idx) => (
          <SidebarGroup key={idx}>
            <SidebarGroupLabel className="text-[9px] font-black text-white/30 tracking-[0.3em] uppercase px-4 group-data-[collapsible=icon]:hidden">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  if (item.roleRequired === 'admin' && role !== 'admin') return null
                  const isActive = pathname === item.href
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                        className={cn(
                          "relative flex items-center gap-3 px-4 py-6 rounded-xl transition-all duration-300 group h-12",
                          isActive 
                            ? "bg-white/10 text-white" 
                            : "text-white/70 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn(
                            "h-5 w-5 transition-colors shrink-0",
                            isActive ? "text-primary" : "text-white/40 group-hover:text-primary/70"
                          )} />
                          <span className="text-[11px] uppercase tracking-widest font-bold whitespace-nowrap">
                            {item.name}
                          </span>
                          {isActive && (
                            <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 bg-black/20 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton 
              size="lg" 
              className="w-full flex items-center gap-3 px-2 py-3 rounded-2xl hover:bg-white/5 transition-all outline-none border border-transparent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              <Avatar className="h-9 w-9 shrink-0 border-2 border-primary/20">
                <AvatarFallback className="bg-secondary text-white text-[10px] font-black uppercase">
                  {displayName.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left overflow-hidden transition-all group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                <span className="text-[10px] font-black truncate text-white uppercase whitespace-nowrap">{displayName}</span>
                <span className="text-[8px] text-primary font-bold uppercase tracking-widest whitespace-nowrap">{userRoleDisplay}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-64 bg-[#1e1b2e] border-white/10 text-white p-2 rounded-2xl shadow-2xl">
            <DropdownMenuLabel className="text-[9px] font-black text-white/40 uppercase px-4 py-3 tracking-widest">Opções</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=perfil" className="flex items-center gap-3 px-4 py-3 text-xs hover:bg-white/5 cursor-pointer rounded-xl transition-colors text-white">
                <UserIcon className="h-4 w-4 text-primary" /> Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-xs text-rose-400 hover:bg-rose-400/10 cursor-pointer rounded-xl transition-colors font-bold"
            >
              <LogOut className="h-4 w-4" /> Sair com Segurança
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}