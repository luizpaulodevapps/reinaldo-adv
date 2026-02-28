"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Sun, 
  Moon, 
  Monitor, 
  Maximize2, 
  Layout, 
  MousePointerClick, 
  Check,
  Settings as SettingsIcon,
  Palette
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const [theme, setTheme] = useState("escuro")
  const [drawerWidth, setDrawerWidth] = useState("largo")
  const [clickBehavior, setClickBehavior] = useState("navigate")

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-headline font-bold text-primary mb-2 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" /> Configurações
        </h1>
        <p className="text-muted-foreground">Personalize a sua interface de trabalho no LexFlow.</p>
      </div>

      <Card className="glass border-primary/20 overflow-hidden">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-xl font-headline flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" /> Personalização
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-12">
          
          {/* Tema */}
          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Sun className="h-3 w-3" /> Tema do Sistema
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className={cn(
                  "h-16 glass border-border/50 text-muted-foreground transition-all gap-3",
                  theme === "claro" && "bg-primary/10 border-primary text-primary font-bold shadow-lg shadow-primary/10"
                )}
                onClick={() => setTheme("claro")}
              >
                <Sun className={cn("h-5 w-5", theme === "claro" ? "text-primary" : "text-muted-foreground")} />
                Claro
              </Button>
              <Button 
                variant="outline" 
                className={cn(
                  "h-16 glass border-border/50 text-muted-foreground transition-all gap-3",
                  theme === "escuro" && "bg-primary/10 border-primary text-primary font-bold shadow-lg shadow-primary/10"
                )}
                onClick={() => setTheme("escuro")}
              >
                <Moon className={cn("h-5 w-5", theme === "escuro" ? "text-primary" : "text-muted-foreground")} />
                Escuro
              </Button>
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* Drawer & Navegação */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-headline font-bold text-white">Drawer & Navegação</h3>
              <p className="text-sm text-muted-foreground">Defina o comportamento das gavetas de visualização rápida.</p>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layout className="h-3 w-3" /> Largura do Drawer Padrão
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "normal", label: "Normal", size: "600px", icon: Layout },
                  { id: "largo", label: "Largo", size: "900px", icon: Maximize2 },
                  { id: "extra-largo", label: "Extra Largo", size: "1200px", icon: Monitor },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDrawerWidth(opt.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-xl border transition-all space-y-2 group",
                      drawerWidth === opt.id 
                        ? "bg-primary border-primary text-background shadow-xl shadow-primary/20" 
                        : "glass border-border/50 text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <opt.icon className={cn("h-6 w-6 mb-1", drawerWidth === opt.id ? "text-background" : "text-primary")} />
                    <span className="font-bold text-sm">{opt.label}</span>
                    <span className={cn("text-[10px] opacity-60", drawerWidth === opt.id ? "text-background" : "text-muted-foreground")}>{opt.size}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MousePointerClick className="h-3 w-3" /> Comportamento de Clique em Links
              </Label>
              <RadioGroup value={clickBehavior} onValueChange={setClickBehavior} className="grid gap-4">
                <div 
                  className={cn(
                    "relative flex items-center space-x-4 p-4 rounded-xl border cursor-pointer transition-all",
                    clickBehavior === "drawer" ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" : "glass border-border/50 hover:bg-secondary/50"
                  )}
                  onClick={() => setClickBehavior("drawer")}
                >
                  <RadioGroupItem value="drawer" id="drawer" className="border-primary text-primary" />
                  <div className="flex-1">
                    <Label htmlFor="drawer" className="font-bold text-white cursor-pointer">Padrão: Abrir Drawer</Label>
                    <p className="text-xs text-muted-foreground mt-1">Clique normal abre o Drawer. <span className="text-primary font-bold">Ctrl + Clique</span> navega para a página.</p>
                  </div>
                  {clickBehavior === "drawer" && <Check className="h-5 w-5 text-primary" />}
                </div>

                <div 
                  className={cn(
                    "relative flex items-center space-x-4 p-4 rounded-xl border cursor-pointer transition-all",
                    clickBehavior === "navigate" ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" : "glass border-border/50 hover:bg-secondary/50"
                  )}
                  onClick={() => setClickBehavior("navigate")}
                >
                  <RadioGroupItem value="navigate" id="navigate" className="border-primary text-primary" />
                  <div className="flex-1">
                    <Label htmlFor="navigate" className="font-bold text-white cursor-pointer">Padrão: Navegar (Mesma Aba)</Label>
                    <p className="text-xs text-muted-foreground mt-1">Clique normal navega para a página. <span className="text-primary font-bold">Ctrl + Clique</span> abre o Drawer.</p>
                  </div>
                  {clickBehavior === "navigate" && <Check className="h-5 w-5 text-primary" />}
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="pt-8 flex justify-end gap-3">
            <Button variant="ghost" className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Restaurar Padrões</Button>
            <Button className="gold-gradient text-background font-bold px-10 h-12 shadow-xl shadow-primary/20 rounded-lg">
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
