
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Scale, 
  Phone, 
  MessageCircle, 
  ShieldCheck, 
  Gavel, 
  Briefcase, 
  Handshake, 
  BookOpen, 
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Lock,
  Zap,
  Target,
  Trophy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlaceHolderImages } from "@/lib/placeholder-images"

// Shield Icon
const Shield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// Counter Animation Component
const StatCounter = ({ target, label, suffix = "" }: { target: number; label: string; suffix?: string }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const increment = target / (duration / 16)
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [target])

  return (
    <div className="text-center space-y-2">
      <div className="text-4xl md:text-5xl font-headline font-bold text-gold">
        {count}{suffix}
      </div>
      <p className="text-muted-foreground text-sm font-semibold uppercase tracking-widest">{label}</p>
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const heroImg = PlaceHolderImages.find(img => img.id === 'hero-lawyer')?.imageUrl
  const aboutImg = PlaceHolderImages.find(img => img.id === 'about-reinaldo')?.imageUrl

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse opacity-20" />
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse opacity-20 delay-700" />
      </div>

      {/* Premium Navbar */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'glass-dark shadow-premium border-b border-primary/20' 
          : 'bg-transparent py-6'
      }`}>
        <div className="container mx-auto px-6 flex items-center justify-between h-16 md:h-auto md:py-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-lg gold-gradient flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/40">
              <Scale className="text-background h-6 w-6" />
            </div>
            <div className="hidden sm:block">
              <p className="font-headline text-xl font-bold tracking-tight text-white">
                Dr. Reinaldo <span className="text-gold">Gonçalves</span>
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Advocacia Estratégica</p>
            </div>
          </Link>

          <nav className="hidden lg:flex gap-12 items-center">
            <Link href="#sobre" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors relative group">
              Sobre
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 gold-gradient group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="#atuacao" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors relative group">
              Áreas
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 gold-gradient group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="#processo" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors relative group">
              Processo
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 gold-gradient group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="#resultados" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors relative group">
              Resultados
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 gold-gradient group-hover:w-full transition-all duration-300" />
            </Link>
            <Button asChild className="gold-gradient text-background font-bold px-8 py-2.5 rounded-full hover:shadow-lg hover:shadow-primary/40 transition-all duration-300 btn-premium">
              <Link href="https://wa.me/5511999999999" target="_blank">
                <MessageCircle className="w-4 h-4 mr-2" />
                Consultar
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button asChild variant="outline" size="sm" className="lg:hidden rounded-full border-white/20">
            <Link href="https://wa.me/5511999999999" target="_blank">
              <MessageCircle className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section - Premium */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          {/* Hero Background */}
          <div className="absolute inset-0 z-0">
            <Image 
              src={heroImg || "https://picsum.photos/seed/reinaldohero/1920/1080"} 
              alt="Advocacia de Elite" 
              fill 
              className="object-cover opacity-30 scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
            <div className="absolute inset-0 premium-gradient opacity-40" />
          </div>

          {/* Decorative Lines */}
          <div className="absolute top-0 left-1/4 w-px h-96 bg-gradient-to-b from-primary/50 to-transparent opacity-50" />
          <div className="absolute top-0 right-1/4 w-px h-96 bg-gradient-to-b from-primary/50 to-transparent opacity-50" />

          <div className="container mx-auto px-6 relative z-10 text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass-dark border border-primary/40 text-primary text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-1000 shadow-lg shadow-primary/10">
              <Sparkles className="h-4 w-4" />
              Excelência em Advocacia Estratégica
              <Zap className="h-4 w-4" />
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-headline font-bold text-white max-w-6xl mx-auto leading-[1.1] animate-in fade-in zoom-in-95 duration-1000 delay-200">
              Defesa jurídica com <span className="text-gold-2 inline-block">
                <span>exatidão</span>
              </span> e <span className="text-gold-2 inline-block">estratégia</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
              Atendimento especializado e personalizado em casos jurídicos de alta complexidade. Resultados comprovados e discrição absoluta.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-600">
              <Button asChild size="lg" className="gold-gradient text-background font-bold px-12 h-14 rounded-full text-lg shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all duration-300 btn-premium">
                <Link href="#contato" className="flex items-center gap-3">
                  <Target className="h-5 w-5" />
                  Agendar Consulta
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass-dark text-white font-bold px-12 h-14 rounded-full text-lg border-white/30 hover:border-primary/50 hover:bg-white/5 transition-all duration-300 hover-lift">
                <Link href="https://wa.me/5511999999999" target="_blank" className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  WhatsApp Premium
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-6 pt-16 max-w-2xl mx-auto">
              <div className="text-center space-y-1 animate-in fade-in duration-1000 delay-700">
                <div className="text-3xl font-headline font-bold text-gold">150+</div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Casos Resolvidos</p>
              </div>
              <div className="text-center space-y-1 animate-in fade-in duration-1000 delay-800">
                <div className="text-3xl font-headline font-bold text-gold">98%</div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Taxa Sucesso</p>
              </div>
              <div className="text-center space-y-1 animate-in fade-in duration-1000 delay-900">
                <div className="text-3xl font-headline font-bold text-gold">15+</div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Anos Exp.</p>
              </div>
              <div className="hidden md:block text-center space-y-1 animate-in fade-in duration-1000 delay-1000">
                <div className="text-3xl font-headline font-bold text-gold">300+</div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Clientes</p>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-muted-foreground animate-bounce opacity-50">
            <span className="text-[11px] uppercase tracking-widest font-bold">Scroll para explorar</span>
            <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-transparent rounded-full" />
          </div>
        </section>

        {/* Authority Section - Premium About */}
        <section id="sobre" className="relative py-32 md:py-40 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl opacity-20" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20" />
          </div>
          
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            {/* Image Section */}
            <div className="relative group scroll-reveal-left">
              {/* Decorative Elements */}
              <div className="absolute -inset-6 gold-gradient opacity-0 blur-3xl rounded-3xl group-hover:opacity-20 transition-opacity duration-500" />
              <div className="absolute -top-6 -right-6 w-20 h-20 border border-primary/30 rounded-full animate-pulse opacity-50" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 border border-primary/20 rounded-full animate-pulse opacity-30 delay-700" />

              <div className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-primary/30 shadow-premium hover:shadow-premium-lg transition-all duration-500 card-hover">
                <Image 
                  src={aboutImg || "https://picsum.photos/seed/reinaldoabout/800/1000"} 
                  alt="Dr. Reinaldo Gonçalves" 
                  fill 
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-10 -right-10 glass-dark p-10 rounded-2xl border border-primary/30 shadow-premium hover-lift hidden md:block">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-6 w-6 text-gold animate-bounce" />
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Reconhecimento</span>
                </div>
                <div className="text-4xl font-headline font-bold text-gold">15+</div>
                <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Anos de Excelência</div>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-10 scroll-reveal-right">
              {/* Header */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Autoridade Jurídica</span>
                </div>

                <h2 className="text-5xl md:text-6xl font-headline font-bold text-white leading-tight">
                  Dr. Reinaldo <br className="hidden sm:block" /> Gonçalves
                </h2>

                <p className="text-sm font-bold text-primary/80 uppercase tracking-[0.2em]">OAB/SP 000.000 | Especialista em Direito Estratégico</p>
              </div>

              {/* Description */}
              <div className="space-y-6">
                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed font-light">
                  <p>
                    Com uma trajetória consolidada pela <span className="text-white font-semibold">ética inabalável</span> e pelo rigor jurídico, Dr. Reinaldo é referência em atendimento de demandas complexas e de alta relevância.
                  </p>
                  <p>
                    Sua atuação une <span className="text-white font-semibold">tradição jurídica com inovação tecnológica</span>, garantindo soluções sob medida que protegem patrimônio, direitos e interesses.
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-6 pt-8">
                  <div className="glass-subtle p-6 rounded-xl border border-primary/20 hover-lift">
                    <CheckCircle2 className="h-6 w-6 text-gold mb-3" />
                    <h4 className="font-semibold text-white mb-1">Atendimento Premium</h4>
                    <p className="text-xs text-muted-foreground">Dedicação integral personalizada</p>
                  </div>
                  <div className="glass-subtle p-6 rounded-xl border border-primary/20 hover-lift">
                    <Target className="h-6 w-6 text-gold mb-3" />
                    <h4 className="font-semibold text-white mb-1">Estratégia Customizada</h4>
                    <p className="text-xs text-muted-foreground">Soluções específicas para seu caso</p>
                  </div>
                  <div className="glass-subtle p-6 rounded-xl border border-primary/20 hover-lift">
                    <Lock className="h-6 w-6 text-gold mb-3" />
                    <h4 className="font-semibold text-white mb-1">Sigilo Absoluto</h4>
                    <p className="text-xs text-muted-foreground">Protocolo rigoroso de confidencialidade</p>
                  </div>
                  <div className="glass-subtle p-6 rounded-xl border border-primary/20 hover-lift">
                    <TrendingUp className="h-6 w-6 text-gold mb-3" />
                    <h4 className="font-semibold text-white mb-1">Foco em Resultados</h4>
                    <p className="text-xs text-muted-foreground">Comprovação de sucesso processual</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Areas of Practice - Redesigned */}
        <section id="atuacao" className="relative py-32 md:py-40 overflow-hidden">
          <div className="absolute inset-0 z-0 pattern-grid opacity-5" />
          
          <div className="container mx-auto px-6 relative z-10">
            {/* Section Header */}
            <div className="text-center space-y-6 mb-20">
              <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass-dark border border-primary/40 text-primary text-xs font-bold uppercase tracking-widest justify-center">
                <Sparkles className="h-4 w-4" />
                Especialidades
              </div>
              <h2 className="text-5xl md:text-7xl font-headline font-bold text-white max-w-4xl mx-auto">
                Domínio <span className="text-gold">integral</span> jurídico
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
                Expertise em diversas esferas do Direito, sempre focado em proteção de patrimônio e garantia de direitos
              </p>
            </div>

            {/* Practice Areas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { 
                  title: "Direito Trabalhista", 
                  icon: Briefcase, 
                  desc: "Especialista em casos de executivos e cargos de alta gestão. Compliance corporativo e contencioso estratégico.",
                  color: "from-blue-600 to-blue-400"
                },
                { 
                  title: "Direito Civil", 
                  icon: Scale, 
                  desc: "Responsabilidade civil, sucessões e litígios complexos. Proteção de patrimônio pessoal e familiar.",
                  color: "from-purple-600 to-purple-400"
                },
                { 
                  title: "Direito Empresarial", 
                  icon: Handshake, 
                  desc: "Blindagem jurídica para empresas e estruturação de negócios com consultoria estratégica.",
                  color: "from-emerald-600 to-emerald-400"
                },
                { 
                  title: "Direito Contratual", 
                  icon: BookOpen, 
                  desc: "Redação, análise e revisão minuciosa de contratos com segurança integral.",
                  color: "from-amber-600 to-amber-400"
                },
                { 
                  title: "Direito Previdenciário", 
                  icon: ShieldCheck, 
                  desc: "Planejamento previdenciário e revisões estratégicas para proteção futura.",
                  color: "from-rose-600 to-rose-400"
                },
                { 
                  title: "Direito Tributário", 
                  icon: Gavel, 
                  desc: "Otimização fiscal e defesa contra excessos arrecadatórios estratégicos.",
                  color: "from-cyan-600 to-cyan-400"
                },
              ].map((area, idx) => (
                <Card 
                  key={idx} 
                  className="glass-dark hover-gold transition-all duration-500 group scroll-reveal card-hover border-primary/20 overflow-hidden"
                >
                  <CardContent className="p-8 space-y-6 relative">
                    <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${area.color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`} />

                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${area.color} flex items-center justify-center text-white transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-primary/20`}>
                      <area.icon className="h-8 w-8" />
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-2xl font-headline font-bold text-white group-hover:text-gold transition-colors duration-300">{area.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">{area.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 text-gold font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pt-2">
                      Saiba mais <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="processo" className="relative py-32 md:py-40 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass-dark border border-primary/40 text-primary text-xs font-bold uppercase tracking-widest">
                    <Zap className="h-4 w-4" />
                    Metodologia
                  </div>

                  <h2 className="text-5xl md:text-6xl font-headline font-bold text-white leading-tight">
                    Como protegemos seus <span className="text-gold">interesses</span>
                  </h2>

                  <p className="text-lg text-muted-foreground font-light leading-relaxed">
                    Um processo transparente, metódico e comprovadamente efetivo, desenhado para oferecer segurança em cada etapa.
                  </p>
                </div>

                <Button asChild variant="link" className="text-gold p-0 text-lg hover:no-underline font-semibold flex items-center gap-2 group w-fit">
                  <Link href="#contato" className="flex items-center gap-2">
                    Iniciar Agora <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {[
                  { 
                    step: "01", 
                    title: "Contato Inicial", 
                    desc: "Triagem profunda e personalizada para compreender urgência e nuances." 
                  },
                  { 
                    step: "02", 
                    title: "Análise Técnica", 
                    desc: "Estudo aprofundado de provas e jurisprudência para viabilidade real." 
                  },
                  { 
                    step: "03", 
                    title: "Estratégia Customizada", 
                    desc: "Plano tático focado na melhor resolução possível do caso." 
                  },
                  { 
                    step: "04", 
                    title: "Execução & Reporte", 
                    desc: "Acompanhamento integral com reportes frequentes e presença constante." 
                  },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="glass-subtle p-8 rounded-2xl relative scroll-reveal group border border-primary/20 hover-lift overflow-hidden"
                  >
                    <div className="absolute -top-8 -right-8 text-7xl font-headline font-black text-white/10 group-hover:text-gold/10 transition-colors duration-300">
                      {item.step}
                    </div>

                    <div className="space-y-4 relative z-10">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-background font-bold text-sm flex-shrink-0">
                          {item.step.split('/')[0]}
                        </div>
                        <h3 className="text-xl font-headline font-bold text-white pt-1">{item.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Results & Stats Section */}
        <section id="resultados" className="relative py-32 md:py-40 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 pattern-dots opacity-10" />
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center space-y-16">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass-dark border border-primary/40 text-primary text-xs font-bold uppercase tracking-widest">
                  <Trophy className="h-4 w-4" />
                  Comprovação
                </div>

                <h2 className="text-5xl md:text-7xl font-headline font-bold text-white max-w-4xl mx-auto">
                  Números que <span className="text-gold">falam</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                <div className="glass-dark p-8 rounded-2xl border border-primary/20 hover-lift scroll-reveal">
                  <StatCounter target={150} label="Casos Resolvidos" />
                </div>
                <div className="glass-dark p-8 rounded-2xl border border-primary/20 hover-lift scroll-reveal">
                  <StatCounter target={98} label="Taxa de Sucesso" suffix="%" />
                </div>
                <div className="glass-dark p-8 rounded-2xl border border-primary/20 hover-lift scroll-reveal">
                  <StatCounter target={300} label="Clientes Satisfeitos" suffix="+" />
                </div>
                <div className="glass-dark p-8 rounded-2xl border border-primary/20 hover-lift scroll-reveal">
                  <StatCounter target={15} label="Anos Experiência" suffix="+" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto pt-8">
                {[
                  { icon: Lock, title: "Sigilo Absoluto", desc: "Protocolos rigorosos" },
                  { icon: MessageCircle, title: "Comunicação Direta", desc: "Acesso facilitado" },
                  { icon: Award, title: "Expertise Comprovada", desc: "Resultados reais" },
                  { icon: Users, title: "Foco no Cliente", desc: "Sua tranquilidade" },
                ].map((item, idx) => (
                  <div key={idx} className="glass-subtle p-6 rounded-xl border border-primary/20 text-center space-y-4 scroll-reveal hover-lift">
                    <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center text-gold mx-auto hover:scale-110 transition-transform">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-white mb-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground font-light">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="contato" className="relative py-32 md:py-40 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-primary opacity-[0.05]" />
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-10" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-10" />
          </div>

          <div className="container mx-auto px-6 text-center space-y-12 relative z-10">
            <h2 className="text-5xl md:text-7xl font-headline font-bold text-white max-w-5xl mx-auto leading-tight">
              Pronto para elevar sua <span className="text-gold">estratégia jurídica</span>?
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              Agende uma consulta estratégica com Dr. Reinaldo Gonçalves e tenha o suporte jurídico que você merece.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Button asChild size="lg" className="gold-gradient text-background font-bold px-12 h-16 rounded-full text-lg shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all btn-premium">
                <Link href="https://wa.me/5511999999999" target="_blank" className="flex items-center gap-3">
                  <MessageCircle className="h-6 w-6" />
                  Agendar Premium
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>

              <div className="flex items-center gap-4 glass-dark px-8 py-4 rounded-full border border-primary/30 hover-lift">
                <Phone className="h-6 w-6 text-gold" />
                <span className="font-headline text-2xl font-bold text-white">(11) 99999-9999</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="relative border-t border-white/10 bg-secondary/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2 space-y-6">
              <Link href="/" className="flex items-center gap-3 w-fit group">
                <div className="w-12 h-12 rounded-lg gold-gradient flex items-center justify-center transition-transform group-hover:scale-110">
                  <Scale className="text-background h-6 w-6" />
                </div>
                <div>
                  <p className="font-headline text-xl font-bold tracking-tight text-white">
                    Dr. Reinaldo <span className="text-gold">Gonçalves</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Advocacia Estratégica</p>
                </div>
              </Link>
              <p className="text-muted-foreground max-w-xs leading-relaxed font-light">
                Advocacia de alto desempenho focada em excelência, estratégia e proteção integral.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-all">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-all">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-headline font-bold text-white text-lg">Institucional</h4>
              <nav className="flex flex-col gap-3 text-sm text-muted-foreground">
                <Link href="#sobre" className="hover:text-gold transition-colors font-light">Sobre</Link>
                <Link href="#atuacao" className="hover:text-gold transition-colors font-light">Áreas</Link>
                <Link href="#processo" className="hover:text-gold transition-colors font-light">Como Trabalhamos</Link>
                <Link href="#resultados" className="hover:text-gold transition-colors font-light">Resultados</Link>
                <Link href="/dashboard" className="hover:text-gold transition-colors font-semibold text-gold">Acesso Restrito</Link>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="font-headline font-bold text-white text-lg">Contato</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground font-light">
                <p className="flex items-start gap-3">
                  <span className="text-gold font-bold text-xs uppercase tracking-widest mt-0.5">Email</span>
                  <span>contato@lexflow.adv.br</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-gold font-bold text-xs uppercase tracking-widest mt-0.5">OAB</span>
                  <span>SP 000.000</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-gold font-bold text-xs uppercase tracking-widest mt-0.5">Sede</span>
                  <span>Av. Paulista, 2000 - SP</span>
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-8" />

          <div className="text-center text-xs uppercase tracking-widest text-muted-foreground/60 font-bold">
            © 2024 Dr. Reinaldo Gonçalves. Todos os direitos reservados.
            <span className="mx-2 text-primary/40">|</span>
            Desenvolvido com Excelência
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button - Premium */}
      <Link 
        href="https://wa.me/5511999999999" 
        target="_blank" 
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center shadow-premium hover:shadow-premium-lg hover:scale-110 active:scale-95 transition-all animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-1000 group"
      >
        <MessageCircle className="h-8 w-8" />
        <span className="absolute right-full mr-4 glass-dark px-4 py-3 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-premium border border-primary/30">
          Conversar com Dr. Reinaldo
        </span>
      </Link>
    </div>
  )
}
