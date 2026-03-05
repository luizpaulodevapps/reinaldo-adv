"use client"

import Link from 'next/link'
import { motion } from "framer-motion"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  Scale, 
  ShieldCheck, 
  MessageSquare, 
  Calendar,
  Gavel,
  CheckCircle,
  FileText,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Brain,
  Target
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050a19] text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden font-body">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 py-6 px-6 lg:px-12 bg-[#050a19]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <Scale className="h-5 w-5 text-[#0a0f1e]" />
            </div>
            <span className="text-xl font-display font-bold tracking-widest uppercase">RGMJ</span>
          </div>
          
          <div className="hidden md:flex items-center gap-12 text-[10px] font-black tracking-[0.4em] uppercase text-muted-foreground">
            <Link href="#sobre" className="hover:text-[#D4AF37] transition-colors">A Banca</Link>
            <Link href="#areas" className="hover:text-[#D4AF37] transition-colors">Especialidades</Link>
            <Link href="#workflow" className="hover:text-[#D4AF37] transition-colors">Metodologia</Link>
            <Link href="/login">
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary hover:text-background rounded-xl px-8 text-[9px] font-black uppercase tracking-widest transition-all h-10">
                Portal de Comando
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat marble-bg"
        />
        
        {/* Decorative elements from prompt */}
        <div className="absolute left-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/15 to-transparent hidden lg:block" />
        <div className="absolute right-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/8 to-transparent hidden lg:block" />

        <div className="absolute top-32 left-[10%] hidden lg:block">
          <div className="w-20 h-px bg-primary/20" />
          <div className="w-px h-20 bg-primary/20" />
        </div>
        <div className="absolute bottom-20 right-[10%] hidden lg:block">
          <div className="w-20 h-px bg-primary/20 ml-auto" />
          <div className="w-px h-20 bg-primary/20 ml-auto" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10 pt-20 w-full">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex items-center gap-4 mb-12"
              >
                <div className="gold-line" />
                <span className="text-primary/80 font-body text-[11px] tracking-[0.4em] uppercase font-light">
                  Excelência & Blindagem Jurídica
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="font-display text-6xl md:text-8xl lg:text-9xl text-white leading-[0.95] mb-8 font-light tracking-tighter"
              >
                Excelência Jurídica
                <br />
                com <span className="text-gradient-gold font-medium italic">Estratégia</span>,
                <br />
                <span className="text-gradient-gold font-medium italic">Ética</span> e{" "}
                <span className="text-gradient-gold font-medium italic">Compromisso</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="text-white/50 font-body text-lg md:text-xl leading-relaxed mb-14 max-w-xl font-light"
              >
                Soluções estratégicas personalizadas para casos de alta complexidade. Proteção patrimonial e defesa intransigente de direitos.
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.3 }}
                className="flex flex-col sm:flex-row gap-6"
              >
                <Button className="gold-gradient hover:scale-105 text-background font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] shadow-2xl transition-all border-0">
                  <Calendar className="w-4 h-4 mr-3" />
                  Agendar Consulta
                </Button>
                <Button variant="outline" className="border-white/10 hover:border-primary hover:text-primary text-white font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] bg-white/5 backdrop-blur-sm transition-all">
                  <MessageSquare className="w-4 h-4 mr-3" />
                  WhatsApp Direct
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom decorative */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="absolute bottom-10 left-6 lg:left-16 flex items-center gap-4"
          >
            <span className="text-white/25 font-body text-[10px] tracking-[0.3em] uppercase">OAB/SP 497650</span>
            <div className="w-24 h-px bg-primary/15" />
          </motion.div>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="py-40 px-6 bg-[#050a19] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-32 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="gold-frame max-w-md mx-auto lg:mx-0 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
              <img 
                src="https://picsum.photos/seed/reinaldo-law/800/1000" 
                alt="Dr. Reinaldo Gonçalves" 
                className="w-full grayscale hover:grayscale-0 transition-all duration-1000 object-cover aspect-[4/5]"
                data-ai-hint="elegant lawyer"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 gold-gradient p-10 hidden md:block shadow-2xl">
              <p className="text-background text-6xl font-display font-black italic">08</p>
              <p className="text-background text-[10px] font-black uppercase tracking-[0.2em] mt-2">Anos de Prática de Elite</p>
            </div>
          </motion.div>

          <div className="space-y-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-8 py-2 text-[10px] font-black uppercase tracking-[0.4em] rounded-none">A BANCA</Badge>
            <h2 className="text-6xl md:text-8xl font-display font-bold leading-[1.1] tracking-tighter">Tradição que se une à <span className="italic font-light text-gradient-gold">Modernidade Jurídica</span></h2>
            <p className="text-white/50 leading-relaxed text-xl font-light font-body">
              Comandada pelo Dr. Reinaldo Gonçalves Miguel de Jesus, nossa banca é reconhecida pela combatividade e precisão técnica. Focamos em entregar resultados que transcendem o processo judicial, protegendo o patrimônio e a dignidade de nossos constituintes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
              <div className="space-y-4 border-l border-primary/30 pl-8">
                <h4 className="text-primary font-display text-2xl font-bold italic">Visão Analítica</h4>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] leading-loose">Decisões baseadas em dados e jurisprudência de última instância.</p>
              </div>
              <div className="space-y-4 border-l border-primary/30 pl-8">
                <h4 className="text-primary font-display text-2xl font-bold italic">Defesa Intransigente</h4>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] leading-loose">Proteção máxima dos ativos e direitos fundamentais.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Areas Section */}
      <section id="areas" className="py-40 px-6 bg-[#080d1f] relative">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-6xl md:text-9xl font-display font-bold tracking-tighter">Áreas de <span className="italic font-light text-gradient-gold">Domínio</span></h2>
            <p className="text-primary tracking-[0.6em] text-[10px] uppercase font-black">Especialistas em casos de alta complexidade</p>
          </div>

          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { 
                title: "Direito Trabalhista", 
                desc: "Atuação estratégica em rescisões indiretas, horas extras complexas e assédio moral corporativo.",
                icon: Gavel
              },
              { 
                title: "Direito Civil", 
                desc: "Gestão de contratos, responsabilidade civil e litígios de alta expressão econômica.",
                icon: ShieldCheck
              },
              { 
                title: "Empresarial", 
                desc: "Consultoria preventiva e defesa institucional para corporações e holdings de elite.",
                icon: Briefcase
              }
            ].map((area, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp}
                className="premium-card gold-sweep p-16 space-y-10 group"
              >
                <div className="w-16 h-16 bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:border-primary/40 transition-all rounded-xl">
                  <area.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-4xl font-display font-bold uppercase tracking-tight">{area.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed font-light font-body">{area.desc}</p>
                <div className="pt-6">
                  <Link href="#" className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-3 group/link transition-all">
                    EXPLORAR TESE <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-3 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section id="workflow" className="py-40 px-6 bg-[#050a19] relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-8">
            <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-8 py-2 text-[10px] font-black uppercase rounded-none tracking-widest">WORKFLOW</Badge>
              <h2 className="text-6xl md:text-8xl font-display font-bold leading-none tracking-tighter">Nossa <span className="italic font-light text-gradient-gold">Metodologia</span></h2>
            </div>
            <p className="text-white/30 max-w-sm text-sm italic border-l border-primary/30 pl-8 font-body">Do protocolo inicial ao trânsito em julgado, cada passo é taticamente planejado pela nossa inteligência jurídica.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-16 relative">
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden lg:block" />
            
            {[
              { step: "01", title: "Análise", icon: Zap, desc: "Auditoria de Fatos" },
              { step: "02", title: "Estratégia", icon: Brain, desc: "Engenharia de Tese" },
              { step: "03", title: "Protocolo", icon: FileText, desc: "Ação Imediata" },
              { step: "04", title: "Êxito", icon: CheckCircle, desc: "Resultado Final" }
            ].map((p, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10 flex flex-col items-center text-center space-y-8 group"
              >
                <div className="w-24 h-24 bg-[#0a0f1e] border border-primary/20 flex items-center justify-center rounded-full group-hover:border-primary transition-all group-hover:scale-110 shadow-[0_0_30px_rgba(212,175,55,0.05)] relative">
                  <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse group-hover:animate-none" />
                  <p className="text-primary font-display text-3xl font-black italic relative z-10">{p.step}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold uppercase tracking-[0.2em] font-display">{p.title}</h4>
                  <p className="text-[10px] text-white/30 uppercase font-black tracking-widest font-body">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 bg-[#02040d] border-t border-white/5 px-6" id="contato">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-20">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/10">
                <Scale className="h-6 w-6 text-background" />
              </div>
              <span className="text-2xl font-display font-bold tracking-[0.2em] uppercase">RGMJ Elite</span>
            </div>
            <p className="text-white/40 max-w-md text-base leading-loose font-light font-body">
              Escritório boutique focado em alta performance e soluções jurídicas customizadas. Atendimento exclusivo para clientes que buscam a excelência em todo o território nacional.
            </p>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">CONTATOS</h4>
            <ul className="space-y-6 text-sm text-white/60 font-medium tracking-wide font-body">
              <li className="flex items-center gap-4 group cursor-pointer hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-primary/40"><Phone className="h-3.5 w-3.5" /></div>
                (11) 99999-9999
              </li>
              <li className="flex items-center gap-4 group cursor-pointer hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-primary/40"><Mail className="h-3.5 w-3.5" /></div>
                reinaldo@rgmj.adv.br
              </li>
              <li className="flex items-center gap-4 group cursor-pointer hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-primary/40"><MapPin className="h-3.5 w-3.5" /></div>
                Vila Olímpia, São Paulo - SP
              </li>
            </ul>
          </div>

          <div className="space-y-8 text-right">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">SISTEMAS</h4>
            <ul className="space-y-6 text-xs font-black uppercase tracking-[0.3em] text-white/20">
              <li><Link href="/login" className="hover:text-white transition-colors border-b border-transparent hover:border-primary pb-1">Acesso Corporativo</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors border-b border-transparent hover:border-primary pb-1">Compliance & LGPD</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
          <p>© 2025 RGMJ ADVOCACIA DE ELITE. TODOS OS DIREITOS RESERVADOS.</p>
          <div className="flex gap-8">
            <span>OAB/SP 000.000</span>
            <span>CNPJ: 00.000.000/0001-00</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
