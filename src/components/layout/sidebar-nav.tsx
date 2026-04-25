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
  Settings,
  Scale,
  LogOut,
  Wallet,
  Users2,
  Building2,
  Handshake,
  Calculator,
  CalendarDays,
  User as UserIcon,
  Receipt,
  BookOpen
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
  useSidebar
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
    title: "PRINCIPAL",
    items: [
      { name: "DASHBOARD", href: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "OPERACIONAL",
    items: [
      { name: "CLIENTES", href: "/clients", icon: Users },
      { name: "PROCESSOS", href: "/cases", icon: FolderOpen },
      { name: "TRIAGEM", href: "/leads", icon: Zap },
      { name: "AGENDA", href: "/agenda", icon: CalendarDays },
    ]
  },
  {
    title: "GESTÃO",
    items: [
      { name: "FINANCEIRO", href: "/billing", icon: Calculator },
      { name: "RELATÓRIOS", href: "/reports", icon: BarChart3 },
      { name: "CORRESPONDENTES", href: "/correspondents", icon: Handshake },
    ]
  },
  {
    title: "SISTEMA",
    items: [
      { name: "CONFIGURAÇÕES", href: "/settings", icon: Settings },
      { name: "EQUIPE", href: "/staff", icon: Users2 },
      { name: "LABORATÓRIO", href: "/checklists", icon: ClipboardCheck, roleRequired: "admin" },
    ]
  },
  {
    title: "PESSOAL",
    items: [
      { name: "MINHA CARTEIRA", href: "/financial", icon: Wallet },
      { name: "REEMBOLSOS", href: "/reimbursements", icon: Receipt },
    ]
  }
]

export function SidebarNav() {
  const pathname = usePathname()
  const { user, profile, role } = useUser()
  const { state } = useSidebar()
  const auth = useAuth()

  const displayName = profile?.name || user?.displayName || "Membro RGMJ"
  const userRoleDisplay = role === 'admin' ? 'Sócio Fundador' : 'Advogado'

  const handleLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Erro ao sair:", error)
    }
  }

  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="border-r border-gold-200/10 bg-[#090E1A] font-sans">
      <SidebarHeader className={cn("py-8 transition-all duration-300 flex items-center", isCollapsed ? "px-0 justify-center" : "px-6")}>
        <div className={cn(
          "flex items-center gap-4 transition-all",
          isCollapsed ? "justify-center" : ""
        )}>
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-all duration-500",
            isCollapsed 
              ? "bg-gold-200/10 border-gold-200/40 shadow-[0_0_15px_rgba(223,200,142,0.2)]" 
              : "bg-gold-200/10 border-gold-200/20 shadow-2xl"
          )}>
            <Scale className="h-5 w-5 text-gold-100" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden animate-in fade-in duration-500">
              <span className="text-sm font-bold text-white uppercase tracking-wider leading-none font-serif">RGMJ</span>
              <span className="text-[8px] text-gold-100 font-black uppercase tracking-[0.4em] mt-1.5 opacity-60">Advocacia</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={cn("px-3 space-y-1", isCollapsed && "px-0")}>
        {menuGroups.map((group, idx) => (
          <SidebarGroup key={idx} className="py-1">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[8px] font-black text-white/20 tracking-[0.4em] uppercase px-3 mb-2">
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  if (item.roleRequired === 'admin' && role !== 'admin') return null
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "relative flex items-center transition-all duration-200 h-9 rounded-lg",
                          isCollapsed ? "justify-center px-0 w-9 mx-auto" : "gap-3 px-3",
                          isActive 
                            ? "bg-gold-200/10 text-gold-100 border border-gold-200/20" 
                            : "text-muted-foreground hover:text-white hover:bg-white/[0.03] border border-transparent"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn(
                            "h-4.5 w-4.5 transition-colors shrink-0",
                            isActive ? "text-gold-100" : "text-white/20 group-hover:text-gold-100/50"
                          )} />
                          {!isCollapsed && (
                            <span className="text-[10px] uppercase tracking-widest font-black whitespace-nowrap">
                              {item.name}
                            </span>
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

      <SidebarFooter className={cn(
        "p-3 bg-black/20 mt-auto border-t border-gold-200/10 transition-all duration-300 flex flex-col", 
        isCollapsed ? "items-center px-0 py-4" : "px-3 py-3"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className={cn(
                "w-full flex items-center rounded-xl hover:bg-white/5 transition-all outline-none border border-transparent group",
                isCollapsed ? "justify-center h-10" : "gap-3 px-2 py-2"
              )}
            >
              <Avatar className={cn(
                "shrink-0 border transition-all",
                isCollapsed ? "h-8 w-8 border-gold-200/20" : "h-8 w-8 border-white/10"
              )}>
                <AvatarFallback className="bg-secondary text-gold-100 text-[10px] font-black uppercase">
                  {displayName.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col text-left overflow-hidden animate-in fade-in duration-500">
                  <span className="text-[11px] font-bold truncate text-white uppercase tracking-tight">{displayName}</span>
                  <span className="text-[8px] text-gold-100 font-black uppercase tracking-widest mt-0.5">{userRoleDisplay}</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "center" : "end"} side={isCollapsed ? "right" : "bottom"} className="w-64 bg-[#0d1117] border-white/10 text-white p-2 rounded-xl shadow-2xl">
            <DropdownMenuItem asChild className="rounded-lg h-10 px-3 mb-1">
              <Link href="/settings?tab=geral" className="flex items-center gap-3 text-[11px] uppercase font-bold text-white">
                <UserIcon className="h-4 w-4 text-gold-100" /> Perfil de Usuário
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5 mb-1" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg h-10 px-3 text-rose-400 hover:bg-rose-400/10 text-[11px] uppercase font-bold">
              <LogOut className="h-4 w-4 mr-3" /> Encerrar Sessão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
