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
  TrendingUp,
  Lock,
  Target
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar Institucional */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white shadow-md py-4' 
          : 'bg-transparent py-6'
      }`}>
        <div className="site-container flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#213B37] flex items-center justify-center rounded">
              <Scale className="text-white h-6 w-6" />
            </div>
            <div className="text-[#213B37]">
              <p className="text-xl font-bold uppercase tracking-tight">
                Reinaldo Gonçalves
              </p>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Advocacia Estratégica</p>
            </div>
          </Link>

          <nav className="hidden lg:flex gap-10 items-center">
            <Link href="#sobre" className="text-sm font-bold text-[#213B37] hover:text-[#818258] transition-colors">Sobre</Link>
            <Link href="#atuacao" className="text-sm font-bold text-[#213B37] hover:text-[#818258] transition-colors">Áreas de Atuação</Link>
            <Link href="#processo" className="text-sm font-bold text-[#213B37] hover:text-[#818258] transition-colors">Diferencial</Link>
            <Button asChild className="bg-[#818258] hover:bg-[#bbbd7e] text-white font-bold px-8 rounded-[0.3em]">
              <Link href="https://wa.me/5511999999999" target="_blank">
                Consultar Agora
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section - Tradicional */}
        <section className="relative h-[85vh] flex items-center pt-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://picsum.photos/seed/reinaldohero/1920/1080" 
              alt="Escritório de Advocacia" 
              fill 
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
          </div>

          <div className="site-container relative z-10 space-y-8">
            <div className="inline-block px-4 py-1 bg-[#818258]/10 text-[#818258] text-xs font-bold uppercase tracking-widest rounded border border-[#818258]/30">
              Excelência e Tradição Jurídica
            </div>
            <h1 className="text-[#213B37] max-w-2xl">
              Defesa jurídica com <br />
              <span className="text-[#818258]">ética e estratégia</span>
            </h1>
            <p className="text-lg text-[#213B37]/70 max-w-xl font-medium leading-relaxed">
              Atendimento personalizado para demandas de alta relevância. Soluções jurídicas sólidas pautadas pelo rigor técnico e discrição absoluta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild className="bg-[#818258] hover:bg-[#bbbd7e] text-white font-bold h-14 px-10 text-lg rounded-[0.3em]">
                <Link href="#contato">Agendar Consulta</Link>
              </Button>
              <Button variant="outline" asChild className="border-[#213B37] text-[#213B37] h-14 px-10 text-lg hover:bg-[#213B37]/5">
                <Link href="/">Acesso Restrito</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Sobre Section */}
        <section id="sobre" className="py-24 bg-[#E9E8E6]">
          <div className="site-container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/5] rounded shadow-2xl overflow-hidden border-8 border-white">
              <Image 
                src="https://picsum.photos/seed/reinaldoabout/800/1000" 
                alt="Dr. Reinaldo Gonçalves" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-[#213B37]">Dr. Reinaldo Gonçalves</h2>
                <p className="text-[#818258] font-bold uppercase tracking-widest text-sm">OAB/SP 000.000 | Especialista em Direito do Trabalho</p>
              </div>
              <div className="space-y-6 text-[#213B37]/80 text-lg leading-relaxed">
                <p>
                  Com sólida formação e anos de experiência no contencioso estratégico, o Dr. Reinaldo Gonçalves Miguel de Jesus lidera uma banca focada na proteção integral de seus clientes.
                </p>
                <p>
                  Nossa atuação é pautada pela análise minuciosa de cada caso, garantindo que a tradição jurídica encontre as melhores práticas contemporâneas para resultados efetivos.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <CheckCircle2 className="h-6 w-6 text-[#818258]" />
                  <h4 className="text-[#213B37]">Rigor Técnico</h4>
                  <p className="text-sm text-[#213B37]/60">Fundamentação jurídica profunda em cada peça.</p>
                </div>
                <div className="space-y-2">
                  <Lock className="h-6 w-6 text-[#818258]" />
                  <h4 className="text-[#213B37]">Sigilo Absoluto</h4>
                  <p className="text-sm text-[#213B37]/60">Proteção total dos dados e interesses do cliente.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Áreas Section */}
        <section id="atuacao" className="py-24 bg-white">
          <div className="site-container">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-[#213B37]">Áreas de Especialidade</h2>
              <p className="text-[#213B37]/60 max-w-2xl mx-auto">Domínio técnico nas principais esferas do Direito para oferecer suporte completo à sua demanda.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "Direito do Trabalho", desc: "Contencioso estratégico e compliance para executivos e empresas.", icon: Briefcase },
                { title: "Direito Civil", desc: "Sucessões, contratos e responsabilidade civil complexa.", icon: Scale },
                { title: "Direito Empresarial", desc: "Consultoria e blindagem jurídica para negócios em expansão.", icon: Handshake },
                { title: "Direito Tributário", desc: "Defesa e otimização fiscal para patrimônios e corporações.", icon: Gavel },
                { title: "Direito Contratual", desc: "Redação e revisão minuciosa de instrumentos jurídicos.", icon: BookOpen },
                { title: "Previdenciário", desc: "Planejamento e revisões estratégicas de benefícios.", icon: ShieldCheck },
              ].map((area, i) => (
                <Card key={i} className="border-[#E9E8E6] hover:border-[#818258] transition-all duration-300 group">
                  <CardContent className="p-8 space-y-4">
                    <div className="w-12 h-12 bg-[#213B37]/5 rounded flex items-center justify-center text-[#213B37] group-hover:bg-[#213B37] group-hover:text-white transition-all">
                      <area.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl text-[#213B37]">{area.title}</h3>
                    <p className="text-[#213B37]/60 text-sm leading-relaxed">{area.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-24 bg-[#213B37] text-white">
          <div className="site-container text-center space-y-10">
            <h2 className="text-white max-w-3xl mx-auto leading-tight">Agende uma consulta estratégica com quem domina a técnica.</h2>
            <p className="text-white/70 text-xl max-w-2xl mx-auto">Suporte jurídico de alta performance para a segurança dos seus direitos.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button asChild className="bg-[#818258] hover:bg-[#bbbd7e] text-white font-bold h-16 px-12 text-lg rounded-[0.3em]">
                <Link href="https://wa.me/5511999999999" target="_blank" className="flex items-center gap-3">
                  <MessageCircle className="h-6 w-6" />
                  Atendimento via WhatsApp
                </Link>
              </Button>
              <div className="text-2xl font-bold border-l-2 border-[#818258] pl-6 py-2">
                (11) 99999-9999
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Institucional */}
      <footer className="bg-[#213B37] border-t border-white/10 pt-20 pb-10 text-white">
        <div className="site-container grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#818258] rounded flex items-center justify-center">
                <Scale className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-bold uppercase tracking-tighter">Reinaldo Gonçalves</span>
            </div>
            <p className="text-white/60 max-w-xs text-sm">
              Escritório jurídico especializado em advocacia tática e resultados sólidos para casos de alta complexidade.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-white">Navegação</h4>
            <nav className="flex flex-col gap-3 text-sm text-white/60">
              <Link href="#sobre" className="hover:text-[#818258]">Sobre</Link>
              <Link href="#atuacao" className="hover:text-[#818258]">Áreas</Link>
              <Link href="/" className="text-[#818258] font-bold">Portal do Cliente</Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h4 className="text-white">Contato</h4>
            <div className="text-sm text-white/60 space-y-2">
              <p>OAB/SP 000.000</p>
              <p>contato@rgmj.adv.br</p>
              <p>Av. Paulista, 2000 - SP</p>
            </div>
          </div>
        </div>
        <div className="site-container border-t border-white/5 pt-8 text-center text-xs text-white/40 font-bold uppercase tracking-widest">
          © 2024 Dr. Reinaldo Gonçalves Miguel de Jesus. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
