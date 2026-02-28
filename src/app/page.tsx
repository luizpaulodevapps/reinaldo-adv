
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Scale, Shield, Zap, TrendingUp, ChevronRight, Gavel, FileCheck, Brain } from "lucide-react"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-20 flex items-center border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
            <Scale className="text-background h-6 w-6" />
          </div>
          <span className="font-headline text-2xl font-bold tracking-tight text-primary">LexFlow</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors hidden md:block" href="#features">
            Recursos
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors hidden md:block" href="#about">
            Sobre
          </Link>
          <Button asChild className="gold-gradient text-background font-bold px-8">
            <Link href="/dashboard">Acessar Sistema</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 px-4 bg-[url('https://picsum.photos/seed/law-hero/1920/1080')] bg-cover bg-center relative">
          <div className="absolute inset-0 bg-background/90" />
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-7xl/none text-primary">
                  Gestão Jurídica de Alto Desempenho
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl font-body mt-4">
                  Dr. Reinaldo Gonçalves Miguel de Jesus apresenta a LexFlow: 
                  A simbiose perfeita entre a tradição do Direito Trabalhista e a vanguarda da Inteligência Artificial.
                </p>
              </div>
              <div className="space-x-4 mt-8">
                <Button asChild size="lg" className="gold-gradient text-background font-bold text-lg px-8 py-6">
                  <Link href="/dashboard">Entrar no Dashboard <ChevronRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl text-primary">Exclusividade LexFlow</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl font-body">
                Tecnologias desenvolvidas para elevar a produtividade e a assertividade do escritório.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="glass p-8 rounded-2xl flex flex-col items-start space-y-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Parser de IA</h3>
                <p className="text-sm text-muted-foreground">Extração automática de prazos fatais diretamente de publicações do Diário de Justiça.</p>
              </div>
              <div className="glass p-8 rounded-2xl flex flex-col items-start space-y-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <FileCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Minutas Inteligentes</h3>
                <p className="text-sm text-muted-foreground">Geração de rascunhos de peças complexas baseadas em fatos e fundamentos jurídicos.</p>
              </div>
              <div className="glass p-8 rounded-2xl flex flex-col items-start space-y-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">CRM Estratégico</h3>
                <p className="text-sm text-muted-foreground">Controle total do funil de leads e conversão de novos clientes trabalhistas.</p>
              </div>
              <div className="glass p-8 rounded-2xl flex flex-col items-start space-y-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Segurança de Dados</h3>
                <p className="text-sm text-muted-foreground">Criptografia de ponta a ponta e total conformidade com a LGPD e sigilo profissional.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl text-primary">
                  Pronto para a Transformação Digital?
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl font-body mx-auto">
                  Tome o controle total da sua advocacia com a ferramenta mais poderosa do mercado.
                </p>
              </div>
              <Button asChild size="lg" className="gold-gradient text-background font-bold text-lg px-12 py-7 mt-8">
                <Link href="/dashboard">Começar Agora</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 bg-card border-t border-border/50">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Scale className="text-primary h-6 w-6" />
              <span className="font-headline text-xl font-bold text-primary">LexFlow</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Tecnologia de elite para advogados que não aceitam nada menos que a excelência.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-4">Dr. Reinaldo Gonçalves Miguel de Jesus</h4>
            <p className="text-sm text-muted-foreground">OAB/SP 000.000</p>
            <p className="text-sm text-muted-foreground">Especialista em Direito do Trabalho</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>© 2024 LexFlow ERP. Todos os direitos reservados.</p>
            <div className="flex justify-center md:justify-start gap-4 mt-4">
              <Link href="#" className="hover:text-primary underline">Privacidade</Link>
              <Link href="#" className="hover:text-primary underline">Termos</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
