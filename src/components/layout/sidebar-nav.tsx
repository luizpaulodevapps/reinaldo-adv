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
  const userRoleDisplay = role === 'admin' ? 'Administrador' : 'Equipe'

  const handleLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Erro ao sair:", error)
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-[#0a0a14] font-sans">
      <SidebarHeader className="py-6 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:w-0">
            <span className="text-xs font-black text-white uppercase tracking-tight leading-none">RGMJ</span>
            <span className="text-[7px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Comando</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {menuGroups.map((group, idx) => (
          <SidebarGroup key={idx} className="py-2">
            <SidebarGroupLabel className="text-[8px] font-black text-white/20 tracking-widest uppercase px-3 mb-1 group-data-[collapsible=icon]:hidden">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
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
                          "relative flex items-center gap-2 px-3 py-2 transition-all duration-200 h-9 rounded-md",
                          isActive 
                            ? "bg-[#1e1b2e] text-white border border-primary/10 shadow-sm" 
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn(
                            "h-4 w-4 transition-colors shrink-0",
                            isActive ? "text-primary" : "text-white/20 group-hover:text-primary/50"
                          )} />
                          <span className="text-[10px] uppercase tracking-wider font-bold whitespace-nowrap">
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

      <SidebarFooter className="p-3 bg-black/20 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white/5 transition-all outline-none border border-transparent">
              <Avatar className="h-7 w-7 shrink-0 border border-primary/20">
                <AvatarFallback className="bg-secondary text-white text-[8px] font-black uppercase">
                  {displayName.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left overflow-hidden transition-all group-data-[collapsible=icon]:w-0">
                <span className="text-[9px] font-black truncate text-white uppercase">{displayName}</span>
                <span className="text-[7px] text-primary font-bold uppercase tracking-widest">{userRoleDisplay}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-56 bg-[#1e1b2e] border-white/10 text-white p-1 rounded-xl shadow-2xl">
            <DropdownMenuItem asChild className="rounded-lg h-9 px-3">
              <Link href="/settings?tab=perfil" className="flex items-center gap-2 text-[10px] uppercase font-bold text-white">
                <UserIcon className="h-3.5 w-3.5 text-primary" /> Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg h-9 px-3 text-rose-400 hover:bg-rose-400/10 text-[10px] uppercase font-bold">
              <LogOut className="h-3.5 w-3.5" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}