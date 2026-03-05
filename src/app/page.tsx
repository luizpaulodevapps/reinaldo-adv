
"use client"

import Link from 'next/link'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Scale, 
  ShieldCheck, 
  Calendar,
  Zap,
  Lock,
  Award,
  Users,
  TrendingUp,
  Clock,
  MessageCircle,
  ChevronRight,
  Briefcase,
  Gavel,
  ShieldAlert,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"

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

function WhatsAppWidget() {
  const [isVisible, setIsVisible] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [hasNotification, setHasNotification] = useState(false)

  useEffect(() => {
    // Exibe o widget e o popup após 3s
    const showTimer = setTimeout(() => {
      setIsVisible(true)
      setIsPopupOpen(true)
    }, 3000)

    // Minimiza após 11s (3s iniciais + 8s de exibição)
    const minimizeTimer = setTimeout(() => {
      setIsPopupOpen(false)
      setHasNotification(true)
    }, 11000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(minimizeTimer)
    }
  }, [])

  const handleOpenWhatsApp = () => {
    setHasNotification(false)
    setIsPopupOpen(false)
    window.open("https://wa.me/5511999999999?text=Olá Dr. Reinaldo, gostaria de uma consultoria estratégica.", "_blank")
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isPopupOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="mb-4 w-[320px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-emerald-500/20 pointer-events-auto"
          >
            <div className="bg-emerald-600 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/10">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-[11px] font-black uppercase tracking-widest">Dr. Reinaldo Gonçalves</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-white/70 text-[9px] uppercase font-bold tracking-tighter">Disponível Agora</p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPopupOpen(false); setHasNotification(true); }}
                className="text-white/40 hover:text-white transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-4 bg-[#e5ddd5] space-y-3 relative min-h-[100px]">
              {/* WhatsApp Chat Background Pattern Simulation */}
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url('https://picsum.photos/seed/wa/200/200')" }} />
              
              <div className="bg-white p-3.5 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-md max-w-[85%] relative z-10">
                <p className="text-[#111b21] text-xs font-medium leading-relaxed">
                  Olá! Sou o Dr. Reinaldo. Notei seu interesse em nossa banca. Já estou disponível para uma triagem inicial do seu caso. Podemos conversar?
                </p>
                <span className="text-[8px] text-gray-400 block text-right mt-1 font-bold uppercase">AGORA</span>
              </div>
            </div>

            <button 
              onClick={handleOpenWhatsApp}
              className="w-full py-4 bg-white text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-50 transition-all border-t border-gray-100 flex items-center justify-center gap-2 group"
            >
              <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform fill-current" />
              Iniciar Atendimento de Elite
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pointer-events-auto">
        <button 
          onClick={handleOpenWhatsApp}
          className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:scale-110 active:scale-95 transition-all group"
        >
          <MessageCircle className="h-8 w-8 text-white fill-current" />
          
          {hasNotification && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-rose-500 items-center justify-center text-[10px] font-black text-white border-2 border-[#020617]">1</span>
            </span>
          )}
        </button>
      </div>
    </div>
  )
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
            <Link href="#sobre" className="hover:text-[#F5D030] transition-colors relative group">A BANCA</Link>
            <Link href="#areas" className="hover:text-[#F5D030] transition-colors relative group">ESPECIALIDADES</Link>
            <Link href="#metodo" className="hover:text-[#F5D030] transition-colors relative group">MÉTODO</Link>
            <Link href="#contato" className="hover:text-[#F5D030] transition-colors relative group">CONTATO</Link>
            <Link href="/login">
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary hover:text-background rounded-none px-4 text-[9px] font-black uppercase tracking-widest transition-all h-10">
                <Lock className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <Link href="/login" className="md:hidden">
            <Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary hover:text-background rounded-none px-4 h-9 text-[9px] font-black uppercase tracking-widest">
              <Lock className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070')" }} />
        <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-[2px]" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10 w-full">
          <div className="max-w-5xl">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="flex items-center gap-4 mb-10">
                <div className="gold-line" />
                <span className="text-[#F5D030]/80 font-body text-[10px] tracking-[0.5em] uppercase font-bold">Excelência Jurídica & Estratégia de Elite</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="font-display text-6xl md:text-8xl lg:text-9xl text-white leading-[0.9] mb-10 font-medium tracking-tight">
                Engenharia de <br />
                <span className="text-gradient-gold italic">Resultados </span> Jurídicos
              </motion.h1>

              <motion.p variants={itemVariants} className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-12 uppercase tracking-wide font-light">
                Defesa tática incisiva e consultoria de alta performance para clientes que exigem o padrão máximo de rigor técnico.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6">
                <Button className="bg-[#F5D030] text-[#020617] hover:scale-105 font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] shadow-2xl transition-all border-0 group">
                  <Calendar className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" /> AGENDAR CONSULTA
                </Button>
                <Button variant="outline" className="border-white/10 hover:border-primary hover:text-primary text-white font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] bg-white/5 backdrop-blur-sm transition-all group">
                  <MessageCircle className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" /> WHATSAPP DIRECT
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
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
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="flex flex-col items-center text-center space-y-4">
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

      {/* Areas of Expertise */}
      <section id="areas" className="py-32 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-24 space-y-4">
            <Badge variant="outline" className="border-primary/30 text-primary uppercase font-black text-[9px] tracking-[0.3em] px-4 py-1">Especialidades de Elite</Badge>
            <h2 className="text-5xl md:text-7xl font-display font-medium uppercase tracking-tighter">Frentes de Atuação <span className="text-gradient-gold italic">Estratégica</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Direito do Trabalho", icon: Briefcase, desc: "Foco total na proteção de direitos do empregado e execuções de alta complexidade." },
              { title: "Defesa Civil", icon: ShieldCheck, desc: "Ações indenizatórias, responsabilidade civil e contratos de alta sofisticação." },
              { title: "Previdenciário", icon: Users, desc: "Planejamento de aposentadorias e revisões de benefícios com rigor matemático." },
              { title: "Assessoria Comercial", icon: Zap, desc: "Suporte jurídico para parcerias táticas e blindagem de negócios." },
              { title: "Recursos de Elite", icon: Scale, desc: "Atuação técnica em tribunais superiores para reverter decisões críticas." },
              { title: "Compliance Ético", icon: Gavel, desc: "Gestão de risco e consultoria preventiva para prevenção de litígios." },
            ].map((area, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }} 
                whileInView={{ opacity: 1, scale: 1 }} 
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-10 border border-white/5 bg-white/[0.02] hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                  <area.icon className="h-20 w-20 text-white" />
                </div>
                <area.icon className="h-8 w-8 text-primary mb-8" />
                <h3 className="text-xl font-display font-bold uppercase tracking-widest text-white mb-4">{area.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-light uppercase tracking-wide">{area.desc}</p>
                <div className="mt-8 flex items-center text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                  Consultar Tese <ChevronRight className="ml-2 h-3.5 w-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology - The Elite Path */}
      <section id="metodo" className="py-32 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <Badge variant="outline" className="border-primary/30 text-primary uppercase font-black text-[9px] tracking-[0.3em] px-4 py-1">O Método RGMJ</Badge>
                <h2 className="text-5xl md:text-7xl font-display font-medium uppercase tracking-tighter">Engenharia de <br/><span className="text-gradient-gold italic">Resultados</span></h2>
              </div>
              <p className="text-muted-foreground text-lg uppercase tracking-wide font-light leading-relaxed">
                Nossa abordagem não é baseada em volume, mas em precisão cirúrgica. Cada caso é tratado como uma operação de alta inteligência jurídica.
              </p>
              
              <div className="space-y-8">
                {[
                  { step: "01", title: "Triagem Estratégica", desc: "Análise profunda dos fatos através de inteligência de dados e experiência de banca." },
                  { step: "02", title: "Desenvolvimento de Tese", desc: "Construção de narrativas jurídicas inabaláveis baseadas em jurisprudência de ponta." },
                  { step: "03", title: "Execução Incisiva", desc: "Protocolo e acompanhamento agressivo para garantir a celeridade e o êxito." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-2xl font-display font-bold text-primary/40 italic">{item.step}</span>
                    <div className="space-y-2">
                      <h4 className="text-base font-bold uppercase tracking-widest text-white">{item.title}</h4>
                      <p className="text-[11px] text-muted-foreground font-light uppercase tracking-widest leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] bg-cover bg-center border border-white/10 grayscale hover:grayscale-0 transition-all duration-700" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070')" }} />
              <div className="absolute -bottom-10 -left-10 bg-[#020617] border border-primary/20 p-10 hidden md:block">
                <div className="flex items-center gap-4">
                  <ShieldAlert className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status de Operação</p>
                    <p className="text-xl font-display font-bold text-white uppercase tracking-widest">Blindagem Total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-[#020617]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-4xl md:text-6xl font-display font-medium uppercase tracking-tighter">Perguntas <span className="text-gradient-gold italic">Frequentes</span></h2>
            <p className="text-muted-foreground text-xs uppercase tracking-[0.3em] font-bold">Respostas diretas para decisões rápidas.</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              { q: "Quais os prazos médios para um processo trabalhista?", a: "Depende da complexidade e da vara, mas nossa metodologia foca em agilizar cada etapa tática para reduzir o tempo de espera." },
              { q: "Quais documentos são cruciais para a triagem?", a: "CTPS, holerites, extratos de FGTS e qualquer prova documental de comunicações (WhatsApp, E-mail) são os pilares iniciais." },
              { q: "A banca atende casos fora do estado?", a: "Sim. Atuamos de forma digital em todo o território nacional, com foco especial em tribunais de alta relevância." },
              { q: "Como é feito o acompanhamento do meu caso?", a: "Nossos clientes possuem acesso a relatórios periódicos e contato direto com o corpo técnico responsável." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-white/5 bg-white/[0.01] px-8 rounded-xl overflow-hidden transition-all hover:border-primary/20">
                <AccordionTrigger className="text-sm font-bold uppercase tracking-widest text-white hover:text-primary transition-colors py-6 text-left leading-relaxed">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-[11px] uppercase tracking-widest leading-loose pb-8 pt-2">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Call to Action */}
      <section id="contato" className="py-32 bg-gradient-to-b from-[#020617] to-[#050a19]">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="relative p-12 md:p-24 bg-white/[0.02] border border-primary/20 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-16 text-center lg:text-left">
              <div className="max-w-2xl space-y-6">
                <h2 className="text-5xl md:text-7xl font-display font-medium uppercase tracking-tighter leading-none">Inicie sua Defesa de <span className="text-gradient-gold italic">Elite</span> Agora</h2>
                <p className="text-muted-foreground text-sm md:text-base uppercase tracking-widest font-light leading-relaxed">
                  Não deixe seus direitos expostos. Coloque seu caso nas mãos de quem entende a engenharia jurídica de resultados.
                </p>
              </div>
              <div className="flex flex-col gap-4 w-full lg:w-auto">
                <Button className="bg-[#F5D030] text-[#020617] hover:scale-105 font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] shadow-2xl transition-all border-0">
                  FALAR COM ESPECIALISTA
                </Button>
                <p className="text-[9px] font-black text-center text-muted-foreground uppercase tracking-[0.2em] mt-4">Resposta média em até 15 minutos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 bg-[#01040a] border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5D030] to-[#B8860B] flex items-center justify-center">
              <Scale className="h-5 w-5 text-[#020617]" />
            </div>
            <span className="text-xl font-display font-bold tracking-[0.2em] uppercase">RGMJ ELITE</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">© 2024 RGMJ ADVOGADOS ELITE • TODOS OS DIREITOS RESERVADOS</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="text-[8px] font-black text-white/20 uppercase tracking-widest hover:text-primary transition-colors">Termos de Uso</Link>
              <Link href="#" className="text-[8px] font-black text-white/20 uppercase tracking-widest hover:text-primary transition-colors">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Widget */}
      <WhatsAppWidget />
    </div>
  )
}
