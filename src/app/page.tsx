
"use client"

import Link from 'next/link'
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Scale, 
  ShieldCheck, 
  MessageSquare, 
  Calendar,
  Gavel,
  Briefcase,
  Phone,
  Mail,
  Lock,
  Zap,
  ChevronRight,
  Target,
  Users,
  TrendingUp,
  FileText,
  Award,
  Globe,
  Clock,
  ArrowRight
} from 'lucide-react'
import { useState, useEffect } from 'react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white selection:bg-[#F5D030] selection:text-black overflow-x-hidden font-body">
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 py-4 px-6 lg:px-12 transition-all duration-500 ${isScrolled ? 'bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5D030] to-[#B8860B] flex items-center justify-center shadow-[0_0_20px_rgba(245,208,48,0.2)] group-hover:scale-110 transition-transform duration-500">
              <Scale className="h-5 w-5 text-[#020617]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold tracking-widest uppercase leading-none">RGMJ</span>
              <span className="text-[8px] font-black tracking-[0.3em] text-[#F5D030] uppercase">Advocacia de Elite</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-[9px] font-black tracking-[0.3em] uppercase text-muted-foreground">
            <Link href="#sobre" className="hover:text-[#F5D030] transition-colors relative group">
              A BANCA
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#F5D030] transition-all group-hover:w-full" />
            </Link>
            <Link href="#areas" className="hover:text-[#F5D030] transition-colors relative group">
              ESPECIALIDADES
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#F5D030] transition-all group-hover:w-full" />
            </Link>
            <Link href="#metodo" className="hover:text-[#F5D030] transition-colors relative group">
              MÉTODO
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#F5D030] transition-all group-hover:w-full" />
            </Link>
            <Link href="#contato" className="hover:text-[#F5D030] transition-colors relative group">
              CONTATO
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#F5D030] transition-all group-hover:w-full" />
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary hover:text-background rounded-none px-8 text-[9px] font-black uppercase tracking-widest transition-all h-10">
                <Lock className="h-3.5 w-3.5 mr-2" /> PORTAL RGMJ
              </Button>
            </Link>
          </div>

          <Link href="/login" className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/40 text-primary hover:bg-primary hover:text-background rounded-none px-4 h-9 text-[9px] font-black uppercase tracking-widest"
            >
              <Lock className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 marble-bg opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/20 via-[#020617]/80 to-[#020617]" />
        
        {/* Decorative elements */}
        <div className="absolute left-[8%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#F5D030]/15 to-transparent hidden lg:block" />
        <div className="absolute right-[12%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#F5D030]/8 to-transparent hidden lg:block" />

        <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10 w-full">
          <div className="max-w-5xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="flex items-center gap-4 mb-10">
                <div className="gold-line" />
                <span className="text-[#F5D030]/80 font-body text-[10px] tracking-[0.5em] uppercase font-bold">
                  Excelência & Blindagem Jurídica de Alto Padrão
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="font-display text-6xl md:text-8xl lg:text-9xl text-white leading-[0.9] mb-10 font-medium tracking-tight"
              >
                Engenharia de <br />
                <span className="text-gradient-gold italic">Resultados </span> 
                Jurídicos
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-white/60 font-body text-lg md:text-xl leading-relaxed mb-14 max-w-2xl font-light italic"
              >
                Proteção patrimonial, defesa trabalhista de elite e estratégia processual personalizada para clientes que exigem o máximo rigor técnico sob o comando da banca RGMJ.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-6"
              >
                <Button className="bg-[#F5D030] text-[#020617] hover:scale-105 font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] shadow-2xl transition-all border-0 group">
                  <Calendar className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" />
                  AGENDAR CONSULTA DE ELITE
                </Button>
                <Button variant="outline" className="border-white/10 hover:border-primary hover:text-primary text-white font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] bg-white/5 backdrop-blur-sm transition-all group">
                  <MessageSquare className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                  WHATSAPP DIRECT
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom stats decor */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-12 left-6 lg:left-16 hidden md:flex items-center gap-12"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-[#F5D030] uppercase tracking-widest leading-none">OAB/SP</span>
            <span className="text-[14px] font-display font-bold text-white/40 tracking-widest">497650</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-[#F5D030] uppercase tracking-widest leading-none">STATUS</span>
            <span className="text-[14px] font-display font-bold text-white/40 tracking-widest uppercase">Operação Ativa</span>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
          {[
            { label: "Anos de Atuação", value: "15+", icon: Clock },
            { label: "Processos de Êxito", value: "2.5k+", icon: Award },
            { label: "Valor Recuperado", value: "R$ 45M", icon: TrendingUp },
            { label: "Clientes Atendidos", value: "3.2k", icon: Users },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-4xl font-display font-bold text-white tracking-tighter">{stat.value}</h4>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="py-40 px-6 bg-[#020617] relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-32 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="gold-frame shadow-[0_0_80px_rgba(245,208,48,0.05)]">
              <img 
                src="https://picsum.photos/seed/reinaldo-law/800/1000" 
                alt="Dr. Reinaldo Gonçalves" 
                className="w-full grayscale hover:grayscale-0 transition-all duration-1000 object-cover aspect-[4/5]"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-[#F5D030] p-10 hidden xl:block">
              <span className="text-[10px] font-black text-[#020617] uppercase tracking-[0.4em] block mb-2 leading-none">ASSINATURA</span>
              <span className="text-2xl font-display font-bold text-[#020617] italic">Dr. Reinaldo Gonçalves</span>
            </div>
          </motion.div>

          <div className="space-y-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-8 py-2 text-[10px] font-black uppercase tracking-[0.4em] rounded-none">A BANCA ESTRATÉGICA</Badge>
            <h2 className="text-6xl md:text-8xl font-display font-bold leading-[1.1] tracking-tighter">Tradição em <br /><span className="italic font-light text-[#F5D030]">Combate Jurídico</span></h2>
            <p className="text-white/50 leading-relaxed text-xl font-light font-body">
              Comandada pelo Dr. Reinaldo Gonçalves Miguel de Jesus, nossa banca é reconhecida pela combatividade intransigente e precisão técnica. Focamos em entregar resultados que transcendem o processo judicial, utilizando inteligência de dados e teses personalizadas para a elite do Direito.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-6 group">
                <div className="mt-1 w-6 h-6 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary transition-all">
                  <ShieldCheck className="h-3 w-3 text-primary group-hover:text-[#020617]" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-1">Blindagem de Direitos</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Atuamos na proteção integral do cliente em cenários de alta complexidade jurídica.</p>
                </div>
              </div>
              <div className="flex items-start gap-6 group">
                <div className="mt-1 w-6 h-6 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary transition-all">
                  <Gavel className="h-3 w-3 text-primary group-hover:text-[#020617]" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-1">Combatividade Técnica</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Teses inovadoras desenhadas para reverter cenários desfavoráveis e garantir o êxito.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section id="areas" className="py-40 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center space-y-6 mb-32">
            <Badge className="bg-primary/5 text-primary border-primary/10 px-8 py-2 text-[10px] font-black uppercase tracking-[0.4em] rounded-none">DOMÍNIOS TÉCNICOS</Badge>
            <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tighter">Áreas de <span className="italic font-light text-[#F5D030]">Atuação Elite</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Direito do Trabalho", icon: Briefcase, desc: "Especialista em reclamações de alta complexidade e defesas patronais estratégicas." },
              { title: "Direito Civil", icon: Scale, desc: "Contratos, responsabilidade civil e litígios patrimoniais de grande porte." },
              { title: "Blindagem Patrimonial", icon: ShieldCheck, desc: "Estruturas jurídicas para proteção de bens e sucessão estratégica." },
              { title: "Direito Empresarial", icon: Globe, desc: "Consultoria preventiva e defesa de interesses corporativos em âmbito nacional." },
              { title: "Direito de Família", icon: Users, desc: "Sucessões, inventários e divórcios complexos com foco em preservação de valor." },
              { title: "Contencioso Estratégico", icon: Target, desc: "Gestão de crises e processos judiciais com foco em decisões de instâncias superiores." },
            ].map((area, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="premium-card gold-sweep p-10 group cursor-pointer h-full"
              >
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:border-primary/30 transition-all duration-500">
                  <area.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-4 group-hover:text-primary transition-colors">{area.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed font-light mb-8">{area.desc}</p>
                <div className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-500">
                  Ver Detalhes <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="metodo" className="py-40 px-6 bg-[#020617] relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-end justify-between mb-32 gap-10">
            <div className="space-y-6 max-w-2xl">
              <Badge className="bg-primary/5 text-primary border-primary/10 px-8 py-2 text-[10px] font-black uppercase tracking-[0.4em] rounded-none">METODOLOGIA RGMJ</Badge>
              <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tighter">Engenharia de <br /><span className="italic font-light text-[#F5D030]">Tese Jurídica</span></h2>
            </div>
            <p className="text-white/40 font-body text-lg font-light max-w-sm italic leading-relaxed text-right">
              "A vitória jurídica não é fruto do acaso, mas de um desenho estratégico meticuloso."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
            {/* Conector Line */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent hidden lg:block" />

            {[
              { step: "01", title: "Triagem Inteligente", desc: "Análise profunda dos fatos através de nossa IA própria para detectar riscos e oportunidades ocultas." },
              { step: "02", title: "Desenho da Tese", desc: "Criação de teses customizadas com fundamentação em jurisprudência atualizada de tribunais superiores." },
              { step: "03", title: "Execução de Elite", desc: "Protocolo e acompanhamento obsessivo de cada ato processual, com relatórios em tempo real." },
              { step: "04", title: "Êxito Estratégico", desc: "Foco na liquidação rápida e no resultado financeiro real para o cliente final." },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="relative z-10 flex flex-col space-y-6 group"
              >
                <div className="text-6xl font-display font-bold text-white/5 group-hover:text-[#F5D030]/10 transition-colors duration-700">{step.step}</div>
                <div className="w-4 h-4 rounded-full bg-white/10 border border-white/5 group-hover:bg-primary group-hover:shadow-[0_0_15px_rgba(245,208,48,0.5)] transition-all duration-500" />
                <h4 className="text-lg font-bold text-white uppercase tracking-widest">{step.title}</h4>
                <p className="text-sm text-white/30 font-light leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-40 bg-white/[0.01] relative">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-10">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <motion.h3 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-3xl md:text-5xl font-display italic font-light text-white/80 leading-snug"
          >
            "O Dr. Reinaldo não apenas conduziu meu caso, ele desenhou uma estratégia que parecia impossível aos olhos de outros escritórios. A precisão técnica é o seu maior diferencial."
          </motion.h3>
          <div className="space-y-2">
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">CLIENTE DE ALTA COMPLEXIDADE</div>
            <div className="text-white/30 text-xs font-light">Setor Industrial, 2024</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 bg-gradient-to-b from-transparent to-[#020617] border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 marble-bg opacity-10 grayscale" />
        <div className="max-w-7xl mx-auto px-6 lg:px-16 text-center relative z-10 space-y-16">
          <div className="space-y-6">
            <h2 className="text-6xl md:text-8xl font-display font-bold tracking-tighter">Pronto para a <span className="text-gradient-gold">Defesa de Elite?</span></h2>
            <p className="text-white/40 font-body text-xl max-w-2xl mx-auto font-light">
              Inicie agora uma triagem estruturada para seu caso. Nossa equipe técnica está de prontidão para analisar sua demanda com o rigor que ela exige.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <Button className="bg-[#F5D030] text-[#020617] font-black rounded-none px-16 h-24 text-sm uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(245,208,48,0.2)] hover:scale-105 transition-all">
              INICIAR TRIAGEM IMEDIATA
            </Button>
            <div className="flex flex-col items-start text-left gap-2">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">OU LIGUE AGORA</span>
              <span className="text-2xl font-display font-bold text-[#F5D030] tracking-widest">(11) 99999-9999</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 bg-[#01040a] border-t border-white/5 px-6" id="contato">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-24">
          <div className="lg:col-span-2 space-y-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5D030] to-[#B8860B] flex items-center justify-center shadow-lg shadow-primary/10">
                <Scale className="h-6 w-6 text-[#020617]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-display font-bold tracking-[0.2em] uppercase">RGMJ ELITE</span>
                <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">Engenharia Jurídica</span>
              </div>
            </div>
            <p className="text-white/30 text-xs font-light max-w-sm leading-relaxed">
              Escritório de advocacia boutique focado em resultados de alta complexidade. Proteção jurídica estratégica em âmbito nacional para clientes que não aceitam o comum.
            </p>
            <div className="flex gap-6">
              <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center hover:border-primary transition-all cursor-pointer"><Mail className="h-4 w-4 text-white/40" /></div>
              <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center hover:border-primary transition-all cursor-pointer"><Phone className="h-4 w-4 text-white/40" /></div>
              <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center hover:border-primary transition-all cursor-pointer"><Globe className="h-4 w-4 text-white/40" /></div>
            </div>
          </div>

          <div className="space-y-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">NAVEGAÇÃO</h4>
            <ul className="space-y-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
              <li><Link href="#sobre" className="hover:text-primary transition-colors">A Banca</Link></li>
              <li><Link href="#areas" className="hover:text-primary transition-colors">Especialidades</Link></li>
              <li><Link href="#metodo" className="hover:text-primary transition-colors">Metodologia</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Acesso Restrito</Link></li>
            </ul>
          </div>

          <div className="space-y-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">CONTATO E SEDE</h4>
            <ul className="space-y-8 text-sm text-white/60 font-light font-body">
              <li className="flex items-center gap-4 group cursor-pointer hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-primary/40 transition-all shrink-0"><Phone className="h-3.5 w-3.5" /></div>
                (11) 99999-9999
              </li>
              <li className="flex items-center gap-4 group cursor-pointer hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-primary/40 transition-all shrink-0"><Mail className="h-3.5 w-3.5" /></div>
                reinaldo@rgmj.adv.br
              </li>
              <li className="flex items-start gap-4 group transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center shrink-0"><Globe className="h-3.5 w-3.5" /></div>
                <span className="text-xs leading-relaxed opacity-60">Atendimento Nacional • <br />Sede em São Paulo/SP</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">© 2024 RGMJ ADVOGADOS ELITE • TODOS OS DIREITOS RESERVADOS</p>
          <div className="flex gap-8 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
            <span className="hover:text-primary cursor-pointer transition-colors">Privacidade</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Termos</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
