
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
  Contact, 
  Settings,
  Scale
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    title: "TECNOLOGIA (GESTÃO)",
    items: [
      { name: "Equipe", href: "/team", icon: Contact },
      { name: "Configurações", href: "/settings", icon: Settings },
    ]
  }
]

export function SidebarNav() {
  const pathname = usePathname()

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

      {/* User Section */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 border border-white/5">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">RGMJ</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold truncate text-white">Dr. Reinaldo G.</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Administrador</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
