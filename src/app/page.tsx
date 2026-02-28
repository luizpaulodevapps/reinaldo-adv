
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Scale, 
  ChevronRight, 
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
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlaceHolderImages } from "@/lib/placeholder-images"

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
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'glass py-3' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center transition-transform group-hover:scale-110">
              <Scale className="text-background h-5 w-5" />
            </div>
            <span className="font-headline text-2xl font-bold tracking-tighter text-white">
              Dr. Reinaldo <span className="text-primary">Gonçalves</span>
            </span>
          </Link>
          <nav className="hidden md:flex gap-8 items-center">
            <Link href="#sobre" className="text-sm font-medium hover:text-primary transition-colors">Sobre</Link>
            <Link href="#atuacao" className="text-sm font-medium hover:text-primary transition-colors">Áreas</Link>
            <Link href="#processo" className="text-sm font-medium hover:text-primary transition-colors">Processo</Link>
            <Button asChild className="gold-gradient text-background font-bold px-6 rounded-full hover:opacity-90 transition-opacity">
              <Link href="https://wa.me/5511999999999" target="_blank">Falar com Especialista</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src={heroImg || "https://picsum.photos/seed/reinaldohero/1920/1080"} 
              alt="Advocacia de Elite" 
              fill 
              className="object-cover opacity-40 scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
          </div>

          <div className="container mx-auto px-6 relative z-10 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-primary/20 text-primary text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-1000">
              <ShieldCheck className="h-4 w-4" /> 
              Excelência, Estratégia e Discrição
            </div>
            <h1 className="text-5xl md:text-8xl font-headline font-bold text-white max-w-5xl mx-auto leading-tight animate-in fade-in zoom-in-95 duration-1000 delay-200">
              Defesa jurídica com <span className="text-gold">exatidão estratégica.</span>
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              Atuação especializada com atendimento personalizado e foco absoluto em resultados reais para casos de alta complexidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
              <Button asChild size="lg" className="gold-gradient text-background font-bold px-10 h-16 rounded-full text-lg shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
                <Link href="#contato">Agendar Consulta <ChevronRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass text-white font-bold px-10 h-16 rounded-full text-lg border-white/20 hover:bg-white/5 transition-colors">
                <Link href="https://wa.me/5511999999999" target="_blank" className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp
                </Link>
              </Button>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground animate-bounce opacity-50">
            <span className="text-[10px] uppercase tracking-widest font-bold">Scroll para explorar</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent" />
          </div>
        </section>

        {/* Autoridade (Sobre) */}
        <section id="sobre" className="py-24 md:py-32 bg-secondary/20">
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative group scroll-reveal">
              <div className="absolute -inset-4 gold-gradient opacity-20 blur-2xl rounded-3xl group-hover:opacity-30 transition-opacity" />
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-white/10">
                <Image src={aboutImg || "https://picsum.photos/seed/reinaldoabout/800/1000"} alt="Dr. Reinaldo Gonçalves" fill className="object-cover" />
              </div>
              <div className="absolute -bottom-8 -right-8 glass p-8 rounded-2xl border-primary/30 hidden md:block">
                <div className="text-4xl font-headline font-bold text-primary">15+</div>
                <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Anos de Experiência</div>
              </div>
            </div>

            <div className="space-y-8 scroll-reveal">
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">Autoridade Jurídica</h2>
                <h3 className="text-4xl md:text-5xl font-headline font-bold text-white">Dr. Reinaldo Gonçalves Miguel de Jesus</h3>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">OAB/SP 000.000</p>
              </div>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed font-light">
                <p>
                  Com uma trajetória pautada pela <strong>ética inabalável</strong> e pelo rigor acadêmico, o Dr. Reinaldo Gonçalves Miguel de Jesus consolidou-se como referência no atendimento de demandas jurídicas complexas.
                </p>
                <p>
                  Sua atuação é marcada pela <strong>simbiose entre a tradição do Direito e a inovação tecnológica</strong>, garantindo que cada cliente receba uma solução sob medida, desenhada para proteger interesses e viabilizar conquistas.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold">Atendimento Premium</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold">Estratégia Customizada</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Áreas de Atuação */}
        <section id="atuacao" className="py-24 md:py-32 container mx-auto px-6">
          <div className="text-center space-y-4 mb-20 scroll-reveal">
            <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">Especialidades</h2>
            <h3 className="text-4xl md:text-6xl font-headline font-bold text-white">Domínio Jurídico Integral</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">Soluções especializadas em diversas esferas do Direito, focadas na proteção de patrimônio e direitos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Direito Trabalhista", icon: Briefcase, desc: "Foco em cargos de alta gestão, compliance e contencioso estratégico." },
              { title: "Direito Civil", icon: Scale, desc: "Responsabilidade civil, sucessões e litígios de alta complexidade." },
              { title: "Direito Empresarial", icon: Handshake, desc: "Blindagem jurídica para empresas e estruturação de negócios." },
              { title: "Direito Contratual", icon: BookOpen, desc: "Redação e análise minuciosa para garantir segurança total." },
              { title: "Direito Previdenciário", icon: ShieldCheck, desc: "Planejamento e revisões para garantir a melhor proteção futura." },
              { title: "Direito Tributário", icon: Gavel, desc: "Otimização fiscal e defesa contra excessos arrecadatórios." },
            ].map((area, idx) => (
              <Card key={idx} className="glass hover-gold transition-all duration-300 group cursor-pointer scroll-reveal">
                <CardContent className="p-10 space-y-6">
                  <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center text-background transform group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
                    <area.icon className="h-7 w-7" />
                  </div>
                  <h4 className="text-2xl font-headline font-bold text-white group-hover:text-primary transition-colors">{area.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{area.desc}</p>
                  <div className="pt-4 flex items-center gap-2 text-primary font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Saiba mais <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Processo de Atendimento */}
        <section id="processo" className="py-24 md:py-32 bg-secondary/10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/3 space-y-6 scroll-reveal">
                <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">O Caminho</h2>
                <h3 className="text-4xl md:text-5xl font-headline font-bold text-white">Como protegemos seus interesses</h3>
                <p className="text-muted-foreground text-lg font-light">
                  Um processo transparente e metódico desenhado para oferecer segurança em cada etapa da sua jornada jurídica.
                </p>
                <Button asChild variant="link" className="text-primary p-0 text-lg hover:no-underline flex items-center gap-2 group">
                  <Link href="#contato" className="flex items-center gap-2">
                    Iniciar agora <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                {[
                  { step: "01", title: "Contato Inicial", desc: "Triagem personalizada para compreender a urgência e as nuances do caso." },
                  { step: "02", title: "Análise Técnica", desc: "Estudo aprofundado de provas e jurisprudência para viabilidade real." },
                  { step: "03", title: "Desenho da Estratégia", desc: "Criação de um plano de ação tático focado na melhor resolução possível." },
                  { step: "04", title: "Execução & Reporte", desc: "Acompanhamento integral com reportes claros e presença constante." },
                ].map((item, idx) => (
                  <div key={idx} className="glass p-8 rounded-2xl relative scroll-reveal overflow-hidden group">
                    <div className="text-6xl font-headline font-black text-white/5 absolute -top-4 -right-4 transition-all group-hover:text-primary/10 group-hover:scale-110">{item.step}</div>
                    <div className="space-y-4 relative z-10">
                      <h4 className="text-xl font-headline font-bold text-primary">{item.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="py-24 md:py-32 container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: ShieldCheck, title: "Sigilo Absoluto", desc: "Protocolos rigorosos de confidencialidade e proteção de dados." },
              { icon: MessageCircle, title: "Comunicação Direta", desc: "Acesso facilitado e linguagem jurídica clara para o cliente." },
              { icon: Award, title: "Estratégia sob Medida", desc: "Cada caso é único. Não usamos soluções genéricas de balcão." },
              { icon: Users, title: "Foco no Cliente", desc: "Nossa prioridade é a sua tranquilidade e sucesso processual." },
            ].map((diff, idx) => (
              <div key={idx} className="text-center space-y-4 scroll-reveal group">
                <div className="mx-auto w-16 h-16 rounded-full border border-primary/20 flex items-center justify-center text-primary group-hover:gold-gradient group-hover:text-background transition-all duration-500">
                  <diff.icon className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-headline font-bold text-white">{diff.title}</h4>
                <p className="text-sm text-muted-foreground font-light">{diff.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA de Conversão */}
        <section id="contato" className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-primary opacity-[0.03]" />
          <div className="container mx-auto px-6 text-center space-y-12 relative z-10">
            <h2 className="text-4xl md:text-7xl font-headline font-bold text-white max-w-4xl mx-auto leading-tight scroll-reveal">
              Pronto para elevar a sua <span className="text-gold">estratégia jurídica?</span>
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto scroll-reveal font-light">
              Agende uma consulta estratégica com o Dr. Reinaldo Gonçalves Miguel de Jesus e tenha o suporte que você merece.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center scroll-reveal">
              <Button asChild size="lg" className="gold-gradient text-background font-bold px-12 h-16 rounded-full text-xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                <Link href="https://wa.me/5511999999999" target="_blank" className="flex items-center gap-3">
                  <MessageCircle className="h-6 w-6" /> Agendar Agora
                </Link>
              </Button>
              <div className="flex items-center gap-4 text-white font-headline text-2xl">
                <Phone className="h-6 w-6 text-primary" /> (11) 99999-9999
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card py-20 border-t border-white/5">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="md:col-span-2 space-y-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                <Scale className="text-background h-5 w-5" />
              </div>
              <span className="font-headline text-2xl font-bold tracking-tighter text-white">
                Dr. Reinaldo <span className="text-primary">Gonçalves</span>
              </span>
            </Link>
            <p className="text-muted-foreground max-w-md leading-relaxed font-light">
              Oferecendo advocacia de alto desempenho, focada em resultados e na excelência do atendimento. Sua segurança jurídica é o nosso compromisso maior.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:text-primary transition-colors"><Phone className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:text-primary transition-colors"><MessageCircle className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-headline font-bold text-white text-lg">Institucional</h4>
            <nav className="flex flex-col gap-4 text-sm text-muted-foreground">
              <Link href="#sobre" className="hover:text-primary transition-colors">Sobre o Advogado</Link>
              <Link href="#atuacao" className="hover:text-primary transition-colors">Áreas de Atuação</Link>
              <Link href="#processo" className="hover:text-primary transition-colors">Como Trabalhamos</Link>
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Acesso Restrito</Link>
            </nav>
          </div>

          <div className="space-y-6">
            <h4 className="font-headline font-bold text-white text-lg">Contato</h4>
            <div className="flex flex-col gap-4 text-sm text-muted-foreground font-light">
              <p className="flex items-start gap-3">
                <span className="text-primary font-bold">Email:</span> contato@lexflow.adv.br
              </p>
              <p className="flex items-start gap-3">
                <span className="text-primary font-bold">OAB:</span> SP 000.000
              </p>
              <p className="flex items-start gap-3 leading-relaxed">
                Av. Paulista, 2000 - Bela Vista, São Paulo - SP
              </p>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 pt-16 mt-16 border-t border-white/5 text-center text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          © 2024 Dr. Reinaldo Gonçalves Miguel de Jesus. Todos os direitos reservados. 
          <span className="mx-2">|</span> 
          Desenvolvido com Tecnologia LexFlow
        </div>
      </footer>

      {/* Botão flutuante WhatsApp */}
      <Link 
        href="https://wa.me/5511999999999" 
        target="_blank" 
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-1000 group"
      >
        <MessageCircle className="h-8 w-8" />
        <span className="absolute right-full mr-4 bg-white text-background py-2 px-4 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
          Falar com o Dr. Reinaldo
        </span>
      </Link>
    </div>
  )
}
