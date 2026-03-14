
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
  X,
  CheckCircle2,
  MapPin,
  ArrowRight
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
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true)
      setIsPopupOpen(true)
      
      setTimeout(() => {
        setIsTyping(false)
      }, 2500)
    }, 3000)

    const minimizeTimer = setTimeout(() => {
      if (isPopupOpen) {
        setIsPopupOpen(false)
        setHasNotification(true)
      }
    }, 15000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(minimizeTimer)
    }
  }, [isPopupOpen])

  const handleOpenWhatsApp = () => {
    setHasNotification(false)
    setIsPopupOpen(false)
    window.open("https://wa.me/5511968285695?text=Olá Dr. Reinaldo, gostaria de uma consultoria estratégica.", "_blank")
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isPopupOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.8, originX: 1, originY: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: 40, transition: { duration: 0.2 } }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="mb-8 w-[360px] bg-white rounded-[2rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden border border-emerald-500/10 pointer-events-auto"
          >
            <div className="bg-[#075e54] p-6 flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Scale className="h-7 w-7 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#075e54] shadow-sm animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-white text-base font-black uppercase tracking-widest leading-none">Dr. Reinaldo Gonçalves</p>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                  Online Agora
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPopupOpen(false); setHasNotification(true); }}
                className="text-white/40 hover:text-white transition-colors p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-8 bg-[#e5ddd5] space-y-6 relative min-h-[160px] flex flex-col justify-end overflow-hidden">
              <div className="absolute inset-0 opacity-[0.08] pointer-events-none grayscale" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
              
              <AnimatePresence mode="wait">
                {isTyping ? (
                  <motion.div 
                    key="typing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white p-4 rounded-2xl shadow-md max-w-[80px] flex justify-center items-center gap-1 relative z-10"
                  >
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="message"
                    initial={{ opacity: 0, scale: 0.9, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    className="bg-white p-5 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-lg max-w-[95%] relative z-10 border border-white/50"
                  >
                    <div className="absolute -left-2 top-0 w-0 h-0 border-t-[12px] border-t-white border-l-[12px] border-l-transparent" />
                    <p className="text-[#111b21] text-[14px] leading-relaxed font-medium">
                      Olá! Sou o Dr. Reinaldo. Vi que você está navegando em nosso portal. Já estou disponível para uma triagem inicial do seu caso. Podemos conversar?
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <span className="text-[10px] text-gray-400 font-bold">{new Date().getHours()}:{new Date().getMinutes().toString().padStart(2, '0')}</span>
                      <div className="flex">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 -mr-1.5" />
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleOpenWhatsApp}
              className="w-full py-6 bg-white text-[#075e54] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-50 transition-all border-t border-gray-100 flex items-center justify-center gap-4 group pointer-events-auto"
            >
              <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform fill-current" />
              INICIAR ATENDIMENTO
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pointer-events-auto">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleOpenWhatsApp}
          className="w-20 h-20 rounded-full bg-[#25d366] flex items-center justify-center shadow-[0_20px_50px_rgba(37,211,102,0.4)] transition-all group border-4 border-[#020617]"
        >
          <MessageCircle className="h-10 w-10 text-white fill-current" />
          
          <AnimatePresence>
            {hasNotification && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-8 w-8"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-8 w-8 bg-rose-500 items-center justify-center text-xs font-black text-white border-2 border-[#020617]">1</span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
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
    <div className="flex flex-col min-h-screen bg-[#020617] text-white selection:bg-[#F5D030] selection:text-black overflow-x-hidden font-sans">
      
      {/* NAVEGAÇÃO MINIMALISTA */}
      <nav className={`fixed top-0 w-full z-50 py-8 px-10 lg:px-20 transition-all duration-500 ${isScrolled ? 'bg-[#020617]/95 backdrop-blur-xl border-b border-white/5 py-5' : 'bg-transparent'}`}>
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6 group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5D030] to-[#B8860B] flex items-center justify-center shadow-[0_0_30px_rgba(245,208,48,0.3)] group-hover:scale-110 transition-transform duration-500">
              <Scale className="h-6 w-6 text-[#020617]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-widest uppercase leading-none font-serif">RGMJ</span>
              <span className="text-[8px] font-black tracking-[0.5em] text-[#F5D030] uppercase mt-1.5">Advocacia de Elite</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-12 text-[10px] font-black tracking-[0.3em] uppercase text-muted-foreground">
            <Link href="#sobre" className="hover:text-[#F5D030] transition-colors">A Banca</Link>
            <Link href="#areas" className="hover:text-[#F5D030] transition-colors">Especialidades</Link>
            <Link href="#metodo" className="hover:text-[#F5D030] transition-colors">Estratégia</Link>
            <Link href="/login">
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary hover:text-background rounded-full px-8 h-10 text-[9px] font-black uppercase tracking-widest transition-all">
                <Lock className="h-3 w-3 mr-2.5" /> ACESSO RESTRITO
              </Button>
            </Link>
          </div>

          <Link href="/login" className="md:hidden">
            <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary hover:text-background rounded-full p-3 h-10">
              <Lock className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* HERO SECTION - FIDELIDADE À IMAGEM DE REFERÊNCIA */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Imagem de Fundo Estilo Escritório de Elite com Vidro */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/95 via-[#020617]/80 to-[#020617]/95" />
        
        {/* Conteúdo Centralizado Estilo Logotipo Institucional */}
        <div className="relative z-10 w-full max-w-[1800px] px-10 text-center space-y-16">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-12">
            
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              <h1 className="font-serif text-[10rem] md:text-[14rem] lg:text-[18rem] text-gradient-gold leading-none font-medium tracking-tighter opacity-90 mb-4">
                RGMJ
              </h1>
              <div className="flex items-center gap-10 w-full max-w-4xl mx-auto">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#F5D030]/40" />
                <h2 className="text-white font-black text-xl md:text-3xl lg:text-4xl uppercase tracking-[0.4em] whitespace-nowrap leading-none">
                  Advocacia e Consultoria Jurídica
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#F5D030]/40" />
              </div>
            </motion.div>

            <motion.p variants={itemVariants} className="text-white/50 text-base md:text-xl max-w-3xl mx-auto leading-relaxed font-light uppercase tracking-[0.25em]">
              Soberania técnica, ética inabalável e engenharia de resultados para demandas de alta complexidade.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-8 justify-center pt-8">
              <Button className="bg-[#F5D030] text-[#020617] hover:scale-105 font-black rounded-2xl px-12 h-20 text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(245,208,48,0.3)] transition-all border-0 group">
                <Calendar className="w-5 h-5 mr-4 group-hover:rotate-12 transition-transform" /> INICIAR TRIAGEM
              </Button>
              <Button variant="outline" className="border-white/10 hover:border-primary hover:text-primary text-white font-black rounded-2xl px-12 h-20 text-xs uppercase tracking-[0.3em] bg-white/5 backdrop-blur-md transition-all group">
                <MessageCircle className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" /> CONSULTORIA DIRETA
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30"
        >
          <span className="text-[8px] font-black uppercase tracking-[0.5em]">Explore a Banca</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#F5D030] to-transparent" />
        </motion.div>
      </section>

      {/* STATS SECTION - MINIMALISTA E PRESTIGIADO */}
      <section className="py-32 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-[1800px] mx-auto px-10 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { label: "Anos de Soberania", value: "15+", desc: "Atuação ininterrupta" },
              { label: "Casos Resolvidos", value: "2.5k", desc: "Êxito operacional" },
              { label: "Patrimônio Gerido", value: "R$ 45M", desc: "Valores recuperados" },
              { label: "Clientes Ativos", value: "3.2k", desc: "Confiança estabelecida" },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="space-y-4 border-l border-white/5 pl-8">
                <h4 className="text-5xl font-serif font-bold text-white tracking-tighter">{stat.value}</h4>
                <div>
                  <p className="text-[10px] font-black text-[#F5D030] uppercase tracking-[0.3em]">{stat.label}</p>
                  <p className="text-[9px] text-muted-foreground uppercase mt-1 tracking-widest opacity-40">{stat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ÁREAS DE ATUAÇÃO - CARDS GLASS DE ALTA DENSIDADE */}
      <section id="areas" className="py-48 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="max-w-[1800px] mx-auto px-10 lg:px-20">
          <div className="text-left mb-32 space-y-6">
            <Badge variant="outline" className="border-primary/30 text-primary uppercase font-black text-[10px] tracking-[0.4em] px-6 py-2 rounded-full">Inteligência Jurídica</Badge>
            <h2 className="text-6xl md:text-8xl font-serif font-medium uppercase tracking-tighter leading-none">Frentes de <br/><span className="text-gradient-gold italic">Atuação Estratégica</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Direito do Trabalho", icon: Briefcase, desc: "Proteção de direitos do empregado em execuções de alta complexidade e reversão de injustiças." },
              { title: "Defesa Cível", icon: ShieldCheck, desc: "Ações indenizatórias, responsabilidade civil e estruturação de contratos de alto valor." },
              { title: "Previdenciário de Elite", icon: Users, desc: "Planejamento tático de aposentadorias e revisões de benefícios com rigor matemático." },
              { title: "Consultoria Comercial", icon: Zap, desc: "Blindagem de negócios e assessoria estratégica para parcerias e expansão." },
              { title: "Tribunais Superiores", icon: Scale, desc: "Atuação técnica cirúrgica em recursos para reverter decisões críticas de mérito." },
              { title: "Compliance Ético", icon: Gavel, desc: "Gestão preventiva de riscos e auditoria jurídica para evitar litígios desnecessários." },
            ].map((area, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-12 border border-white/5 bg-white/[0.02] hover:border-primary/30 transition-all duration-700 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <area.icon className="h-32 w-32 text-white" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-10 group-hover:scale-110 transition-transform">
                  <area.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-serif font-bold uppercase tracking-widest text-white mb-6 leading-tight">{area.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed uppercase tracking-widest font-light">{area.desc}</p>
                <div className="mt-10 flex items-center text-[9px] font-black text-primary uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  CONSULTAR TESE <ArrowRight className="ml-3 h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MÉTODO - ENGENHARIA DE RESULTADOS */}
      <section id="metodo" className="py-48 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-[1800px] mx-auto px-10 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-16">
              <div className="space-y-8">
                <Badge variant="outline" className="border-primary/30 text-primary uppercase font-black text-[10px] tracking-[0.4em] px-6 py-2 rounded-full">O Método RGMJ</Badge>
                <h2 className="text-6xl md:text-8xl font-serif font-medium uppercase tracking-tighter leading-tight">Engenharia de <br/><span className="text-gradient-gold italic">Resultados</span></h2>
              </div>
              <p className="text-white/60 text-xl uppercase tracking-widest font-light leading-relaxed">
                Nossa abordagem ignora o volume para focar na precisão cirúrgica. Cada caso é tratado como uma operação de alta inteligência.
              </p>
              
              <div className="space-y-16">
                {[
                  { step: "01", title: "Triagem Estratégica", desc: "Análise profunda de DNA jurídico para identificar a melhor rota tática." },
                  { step: "02", title: "Desenvolvimento de Tese", desc: "Construção de narrativas inabaláveis baseadas em jurisprudência de vanguarda." },
                  { step: "03", title: "Execução Incisiva", desc: "Protocolo e acompanhamento agressivo para garantir a celeridade do êxito." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-10 group">
                    <span className="text-5xl font-serif font-bold text-primary/20 italic group-hover:text-primary transition-colors duration-500">{item.step}</span>
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold uppercase tracking-[0.2em] text-white">{item.title}</h4>
                      <p className="text-sm text-white/30 uppercase tracking-widest leading-relaxed font-light">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] bg-cover bg-center border border-white/10 grayscale hover:grayscale-0 transition-all duration-1000 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070')" }} />
              <div className="absolute -bottom-16 -left-16 bg-[#020617] border border-primary/20 p-16 hidden md:block rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-8">
                  <ShieldAlert className="h-16 w-16 text-primary" />
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Protocolo de Operação</p>
                    <p className="text-2xl font-serif font-bold text-white uppercase tracking-widest">Soberania Total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - CONVITE À CONSULTORIA DE ELITE */}
      <section id="contato" className="py-48">
        <div className="max-w-[1800px] mx-auto px-10 lg:px-20">
          <div className="relative p-20 md:p-32 bg-[#0d1117] border border-primary/20 overflow-hidden group rounded-[4rem] shadow-2xl text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            
            <div className="max-w-4xl mx-auto space-y-12 relative z-10">
              <h2 className="text-5xl md:text-[6rem] font-serif font-medium uppercase tracking-tighter leading-[0.95]">Inicie sua Defesa <br/><span className="text-gradient-gold italic">Especializada</span> Agora</h2>
              <p className="text-white/40 text-lg md:text-2xl uppercase tracking-widest font-light leading-relaxed">
                Não deixe seus direitos expostos à incerteza. Coloque seu caso nas mãos de quem domina a engenharia jurídica de resultados.
              </p>
              <div className="pt-10 flex flex-col items-center gap-8">
                <Button className="bg-[#F5D030] text-[#020617] hover:scale-105 font-black rounded-3xl px-20 h-28 text-sm uppercase tracking-[0.4em] shadow-[0_30px_70px_rgba(245,208,48,0.4)] transition-all border-0">
                  FALAR COM ESTRATEGISTA
                </Button>
                <div className="flex items-center gap-4 text-emerald-500 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Resposta Prioritária em 15 Minutos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="py-32 bg-[#01040a] border-t border-white/5 px-10">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="flex items-center gap-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5D030] to-[#B8860B] flex items-center justify-center shadow-xl">
              <Scale className="h-6 w-6 text-[#020617]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-widest uppercase font-serif">RGMJ</span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/40">Advocacia e Consultoria Jurídica</span>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-6 text-center md:text-right">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">© 2024 RGMJ ADVOGADOS • SOBERANIA, ÉTICA E TECNOLOGIA</p>
            <div className="flex gap-12">
              <Link href="#" className="text-[9px] font-black text-white/10 uppercase tracking-widest hover:text-primary transition-colors">Termos de Operação</Link>
              <Link href="#" className="text-[9px] font-black text-white/10 uppercase tracking-widest hover:text-primary transition-colors">Privacidade Digital</Link>
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppWidget />
    </div>
  )
}
