
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  CalendarDays, 
  Gavel, 
  Clock, 
  Navigation, 
  ClipboardList,
  Filter,
  Search,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const tabs = [
  { name: "AGENDA GERAL", href: "/agenda", icon: CalendarDays },
  { name: "PRÓXIMAS AUDIÊNCIAS", href: "/agenda/audiencias", icon: Gavel },
  { name: "PRÓXIMOS PRAZOS", href: "/agenda/prazos", icon: Clock },
  { name: "PRÓXIMAS DILIGÊNCIAS", href: "/agenda/diligencias", icon: Navigation },
  { name: "ROTINAS", href: "/agenda/rotinas", icon: ClipboardList },
]

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 mb-4">
            <Link href="/" className="hover:text-primary transition-colors">INÍCIO</Link>
            <ChevronRight className="h-2 w-2" />
            <span className="text-white uppercase tracking-tighter">CENTRO DE PAUTA RGMJ</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase tracking-tighter">Comando de Operações</h1>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-black opacity-60">Gestão integrada de atos, prazos e diligências.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtro rápido global..." 
              className="pl-12 glass border-white/5 h-12 text-xs text-white focus:ring-primary/50"
            />
          </div>
          <Button variant="outline" className="glass border-white/10 h-12 px-6 gap-2 text-[10px] font-black uppercase tracking-widest hover:border-primary/40">
            <Filter className="h-4 w-4" /> Filtros Avançados
          </Button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 h-14 p-1 gap-1 w-full justify-start rounded-xl overflow-x-auto scrollbar-hide flex items-center shadow-2xl">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link key={tab.href} href={tab.href} className="flex-1 min-w-[180px] h-full">
              <button
                className={cn(
                  "w-full h-full rounded-lg text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all",
                  isActive 
                    ? "gold-gradient text-background shadow-[0_0_20px_rgba(245,208,48,0.3)]" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className={cn("h-4 w-4", isActive ? "text-background" : "text-primary/40")} />
                {tab.name}
              </button>
            </Link>
          )
        })}
      </div>

      <div className="min-h-[60vh]">
        {children}
      </div>
    </div>
  )
}
