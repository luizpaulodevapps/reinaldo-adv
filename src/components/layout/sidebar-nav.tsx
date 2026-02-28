
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  DollarSign, 
  Settings,
  Scale,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads & CRM", href: "/leads", icon: Users },
  { name: "Processos", href: "/cases", icon: Briefcase },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Prazos & IA", href: "/deadlines", icon: Clock },
  { name: "Financeiro", href: "/financial", icon: DollarSign },
  { name: "Minuta IA", href: "/drafting", icon: FileText },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col h-full gap-2 p-4">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
          <Scale className="text-background h-6 w-6" />
        </div>
        <span className="font-headline text-2xl font-bold tracking-tight text-primary">LexFlow</span>
      </div>
      
      <div className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-background font-bold shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "" : "group-hover:text-primary")} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>

      <div className="mt-auto space-y-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 border border-border/50">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">RG</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold truncate text-foreground">Dr. Reinaldo G. M. de Jesus</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">OAB/SP 000.000</span>
          </div>
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <Settings className="h-5 w-5" />
          <span>Configurações</span>
        </Link>
      </div>
    </nav>
  )
}
