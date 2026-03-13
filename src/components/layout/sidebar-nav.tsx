
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
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
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
    title: "ESTRATÉGICO",
    items: [
      { name: "DASHBOARD", href: "/dashboard", icon: LayoutDashboard },
      { name: "RELATÓRIOS BI", href: "/reports", icon: BarChart3 },
      { name: "LABORATÓRIO", href: "/checklists", icon: ClipboardCheck, roleRequired: "admin" },
    ]
  },
  {
    title: "COMERCIAL",
    items: [
      { name: "TRIAGEM", href: "/leads", icon: Zap },
      { name: "CLIENTES", href: "/clients", icon: Users },
    ]
  },
  {
    title: "OPERACIONAL",
    items: [
      { name: "PROCESSOS", href: "/cases", icon: FolderOpen },
      { name: "AGENDA", href: "/agenda", icon: CalendarDays },
      { name: "MODELOS", href: "/drafting", icon: BookOpen },
    ]
  },
  {
    title: "FINANCEIRO",
    items: [
      { name: "CENTRAL", href: "/billing", icon: Calculator },
      { name: "REEMBOLSOS", href: "/reimbursements", icon: Receipt },
      { name: "CONTAS A RECEBER", href: "/receivables", icon: ArrowUpRight },
      { name: "CONTAS A PAGAR", href: "/payables", icon: ArrowDownRight },
      { name: "REPASSES", href: "/financial", icon: Wallet },
      { name: "FLUXO DE CAIXA", href: "/cash-flow", icon: TrendingUp },
    ]
  },
  {
    title: "PARCERIAS",
    items: [
      { name: "CORRESPONDENTES", href: "/correspondents", icon: Handshake },
    ]
  },
  {
    title: "GESTÃO",
    items: [
      { name: "FÓRUNS", href: "/courts", icon: Building2 },
      { name: "EQUIPE", href: "/staff", icon: Users2 },
      { name: "AJUSTES", href: "/settings", icon: Settings },
    ]
  }
]

export function SidebarNav() {
  const pathname = usePathname()
  const { user, profile, role } = useUser()
  const { state } = useSidebar()
  const auth = useAuth()

  const displayName = profile?.name || user?.displayName || "Membro RGMJ"
  const userRoleDisplay = role === 'admin' ? 'Administrador' : 'Corpo Técnico'

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
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-[#02040a] font-sans">
      <SidebarHeader className={cn("py-8 transition-all duration-300 flex items-center", isCollapsed ? "px-0 justify-center" : "px-6")}>
        <div className={cn(
          "flex items-center gap-4 transition-all",
          isCollapsed ? "justify-center" : ""
        )}>
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-500",
            isCollapsed 
              ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(245,208,48,0.2)]" 
              : "bg-primary/10 border-primary/20 shadow-2xl shadow-primary/5"
          )}>
            <Scale className="h-5 w-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden animate-in fade-in duration-500">
              <span className="text-sm font-bold text-white uppercase tracking-wider leading-none">RGMJ ADVOGADOS</span>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1.5 opacity-60">Comando Central</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={cn("px-3 space-y-2", isCollapsed && "px-0")}>
        {menuGroups.map((group, idx) => (
          <SidebarGroup key={idx} className="py-1">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[9px] font-black text-white/20 tracking-[0.4em] uppercase px-3 mb-2">
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {group.items.map((item) => {
                  if (item.roleRequired === 'admin' && role !== 'admin') return null
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                        className={cn(
                          "relative flex items-center transition-all duration-200 h-10 rounded-xl",
                          isCollapsed ? "justify-center px-0 w-10 mx-auto" : "gap-4 px-4",
                          isActive 
                            ? "bg-primary/10 text-primary border border-primary/40 shadow-[0_0_15px_rgba(245,208,48,0.1)]" 
                            : "text-white/40 hover:text-white hover:bg-white/[0.05] border border-transparent"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn(
                            "h-5 w-5 transition-colors shrink-0",
                            isActive ? "text-primary" : "text-white/20 group-hover:text-primary/50"
                          )} />
                          {!isCollapsed && (
                            <span className="text-[11px] uppercase tracking-widest font-black whitespace-nowrap">
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
        "p-3 bg-black/20 mt-auto border-t border-white/5 transition-all duration-300 flex flex-col", 
        isCollapsed ? "items-center px-0 py-4" : "px-3 py-3"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className={cn(
                "w-full flex items-center rounded-2xl hover:bg-white/5 transition-all outline-none border border-transparent group",
                isCollapsed ? "justify-center h-12" : "gap-4 px-3 py-3"
              )}
            >
              <Avatar className={cn(
                "shrink-0 border transition-all",
                isCollapsed ? "h-10 w-10 border-primary/20" : "h-9 w-9 border-white/10"
              )}>
                <AvatarFallback className="bg-secondary text-white text-[10px] font-black uppercase">
                  {displayName.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col text-left overflow-hidden animate-in fade-in duration-500">
                  <span className="text-xs font-bold truncate text-white uppercase tracking-tight">{displayName}</span>
                  <span className="text-[9px] text-primary font-black uppercase tracking-widest mt-0.5">{userRoleDisplay}</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "center" : "end"} side={isCollapsed ? "right" : "bottom"} className="w-64 bg-[#0d1117] border-white/10 text-white p-2 rounded-2xl shadow-2xl">
            <DropdownMenuItem asChild className="rounded-xl h-11 px-4 mb-1">
              <Link href="/settings?tab=geral" className="flex items-center gap-4 text-xs uppercase font-bold text-white">
                <UserIcon className="h-5 w-5 text-primary" /> Perfil de Usuário
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5 mb-1" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-xl h-11 px-4 text-rose-400 hover:bg-rose-400/10 text-xs uppercase font-bold">
              <LogOut className="h-5 w-5 mr-4" /> Encerrar Sessão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
