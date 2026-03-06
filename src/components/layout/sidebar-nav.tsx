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
  Settings,
  Scale,
  UserCheck,
  LogOut,
  ClipboardList,
  DollarSign,
  Wallet,
  Users2,
  User as UserIcon
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
      { name: "ROTINAS", href: "/checklists/execucao", icon: ClipboardList },
      { name: "PRAZOS", href: "/deadlines", icon: Clock },
      { name: "AUDIÊNCIAS", href: "/agenda", icon: Gavel },
      { name: "MODELOS", href: "/drafting", icon: BookOpen },
    ]
  },
  {
    title: "FINANCEIRO",
    items: [
      { name: "CENTRAL", href: "/billing", icon: DollarSign },
      { name: "REPASSES", href: "/financial", icon: Wallet },
    ]
  },
  {
    title: "GESTÃO",
    items: [
      { name: "D.P. INTERNO", href: "/staff", icon: Users2 },
      { name: "EQUIPE", href: "/team", icon: UserCheck },
      { name: "AJUSTES", href: "/settings", icon: Settings },
    ]
  }
]

export function SidebarNav() {
  const pathname = usePathname()
  const { user, profile, role } = useUser()
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

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-[#02040a] font-sans">
      <SidebarHeader className="py-8 px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/5">
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:w-0">
            <span className="text-sm font-bold text-white uppercase tracking-wider leading-none">RGMJ ADVOGADOS</span>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1.5 opacity-60">Comando Central</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        {menuGroups.map((group, idx) => (
          <SidebarGroup key={idx} className="py-4">
            <SidebarGroupLabel className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase px-3 mb-3 group-data-[collapsible=icon]:hidden">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
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
                          "relative flex items-center gap-4 px-4 py-2 transition-all duration-200 h-11 rounded-xl",
                          isActive 
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-inner" 
                            : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn(
                            "h-5 w-5 transition-colors shrink-0",
                            isActive ? "text-primary" : "text-white/20 group-hover:text-primary/50"
                          )} />
                          <span className="text-xs uppercase tracking-widest font-bold whitespace-nowrap">
                            {item.name}
                          </span>
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

      <SidebarFooter className="p-4 bg-black/20 mt-auto border-t border-white/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/5 transition-all outline-none border border-transparent">
              <Avatar className="h-10 w-10 shrink-0 border border-primary/20 shadow-xl">
                <AvatarFallback className="bg-secondary text-white text-xs font-black uppercase">
                  {displayName.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left overflow-hidden transition-all group-data-[collapsible=icon]:w-0">
                <span className="text-sm font-bold truncate text-white uppercase tracking-tight">{displayName}</span>
                <span className="text-[10px] text-primary font-black uppercase tracking-widest mt-0.5">{userRoleDisplay}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-64 bg-[#0d1117] border-white/10 text-white p-2 rounded-2xl shadow-2xl">
            <DropdownMenuItem asChild className="rounded-xl h-11 px-4 mb-1">
              <Link href="/settings?tab=perfil" className="flex items-center gap-4 text-xs uppercase font-bold text-white">
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