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
  CheckCircle2
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
      }, 1500)
    }, 3000)

    const minimizeTimer = setTimeout(() => {
      setIsPopupOpen(false)
      setHasNotification(true)
    }, 12000)

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
    <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isPopupOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.5, originX: 1, originY: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="mb-8 w-[380px] bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] overflow-hidden border border-emerald-500/20 pointer-events-auto"
          >
            <div className="bg-emerald-600 p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border border-white/10 relative">
                <Scale className="h-7 w-7 text-white" />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-white text-base font-bold uppercase tracking-wider">Dr. Reinaldo Gonçalves</p>
                <div className="flex items-center gap-2">
                  <p className="text-white/70 text-sm font-medium">
                    {isTyping ? 'Digitando...' : 'Online Agora'}
                  </p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPopupOpen(false); setHasNotification(true); }}
                className="text-white/40 hover:text-white transition-colors p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-8 bg-[#f0f2f5] space-y-6 relative min-h-[180px] flex flex-col justify-end">
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
              
              <AnimatePresence mode="wait">
                {isTyping ? (
                  <motion.div 
                    key="typing"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white p-5 rounded-2xl shadow-sm max-w-[80px] flex justify-center items-center gap-1 relative z-10"
                  >
                    <div className="w-2.5 h-2.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2.5 h-2.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2.5 h-2.5 bg-gray-300 rounded-full animate-bounce" />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="message"
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    className="bg-white p-6 rounded-tr-3xl rounded-bl-3xl rounded-br-3xl shadow-lg max-w-[95%] relative z-10"
                  >
                    <div className="absolute -left-3 top-0 w-0 h-0 border-t-[15px] border-t-white border-l-[15px] border-l-transparent" />
                    
                    <p className="text-[#111b21] text-base font-normal leading-relaxed">
                      Olá! Sou o Dr. Reinaldo. Vi que você está navegando em nosso portal. Já estou disponível para uma triagem inicial do seu caso. Podemos conversar?
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-3">
                      <span className="text-xs text-gray-400 font-medium">10:42</span>
                      <div className="flex">
                        <CheckCircle2 className="w-4 h-4 text-sky-400 -mr-2" />
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleOpenWhatsApp}
              className="w-full py-6 bg-white text-emerald-600 font-bold text-base uppercase tracking-widest hover:bg-emerald-50 transition-all border-t border-gray-100 flex items-center justify-center gap-4 group pointer-events-auto"
            >
              <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform fill-current" />
              Iniciar Atendimento
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pointer-events-auto">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleOpenWhatsApp}
          className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.5)] transition-all group"
        >
          <MessageCircle className="h-12 w-12 text-white fill-current" />
          
          <AnimatePresence>
            {hasNotification && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 flex h-10 w-10"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-10 w-10 bg-rose-500 items-center justify-center text-sm font-bold text-white border-2 border-[#020617]">1</span>
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
      
      <nav className={`fixed top-0 w-full z-50 py-8 px-10 lg:px-20 transition-all duration-500 ${isScrolled ? 'bg-[#020617]/95 backdrop-blur-xl border-b border-white/5 py-5' : 'bg-transparent'}`}>
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6 group cursor-pointer">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5D030] to-[#B8860B] flex items-center justify-center shadow-[0_0_30px_rgba(245,208,48,0.3)] group-hover:scale-110 transition-transform duration-500">
              <Scale className="h-8 w-8 text-[#020617]" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold tracking-widest uppercase leading-none">RGMJ</span>
              <span className="text-xs font-black tracking-[0.4em] text-[#F5D030] uppercase mt-2">Advocacia Estratégica</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-16 text-xs font-black tracking-[0.3em] uppercase text-muted-foreground">
            <Link href="#sobre" className="hover:text-[#F5D030] transition-colors">A BANCA</Link>
            <Link href="#areas" className="hover:text-[#F5D030] transition-colors">ESPECIALIDADES</Link>
            <Link href="#metodo" className="hover:text-[#F5D030] transition-colors">MÉTODO</Link>
            <Link href="#contato" className="hover:text-[#F5D030] transition-colors">CONTATO</Link>
            <Link href="/login">
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary hover:text-background rounded-xl px-8 h-12 text-sm font-bold uppercase tracking-widest transition-all">
                <Lock className="h-5 w-5 mr-3" /> ACESSO RESTRITO
              </Button>
            </Link>
          </div>

          <Link href="/login" className="md:hidden">
            <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary hover:text-background rounded-xl p-4 h-14">
              <Lock className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center overflow-hidden pt-32">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070')" }} />
        <div className="absolute inset-0 bg-[#020617]/85 backdrop-blur-[2px]" />
        
        <div className="max-w-[1800px] mx-auto px-10 lg:px-20 relative z-10 w-full">
          <div className="max-w-6xl">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="flex items-center gap-6 mb-16">
                <div className="w-20 h-1 bg-[#F5D030]" />
                <span className="text-[#F5D030] font-bold text-sm tracking-[0.5em] uppercase">Excelência Jurídica & Resultados</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="font-serif text-7xl md:text-9xl lg:text-[10rem] text-white leading-[0.9] mb-16 font-medium tracking-tighter">
                Engenharia de <br />
                <span className="text-gradient-gold italic">Resultados </span> Jurídicos
              </motion.h1>

              <motion.p variants={itemVariants} className="text-white/70 text-xl md:text-3xl max-w-4xl mb-20 leading-relaxed font-light">
                Defesa tática incisiva e consultoria de alta performance para clientes que exigem o padrão máximo de rigor técnico e visão estratégica.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-10">
                <Button className="bg-[#F5D030] text-[#020617] hover:scale-105 font-black rounded-2xl px-16 h-28 text-base uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(245,208,48,0.3)] transition-all border-0 group">
                  <Calendar className="w-6 h-6 mr-5 group-hover:rotate-12 transition-transform" /> AGENDAR CONSULTA
                </Button>
                <Button variant="outline" className="border-white/10 hover:border-primary hover:text-primary text-white font-black rounded-2xl px-16 h-28 text-base uppercase tracking-[0.3em] bg-white/5 backdrop-blur-md transition-all group">
                  <MessageCircle className="w-6 h-6 mr-5 group-hover:scale-110 transition-transform" /> WHATSAPP DIRECT
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-40 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-10 lg:px-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 relative z-10">
          {[
            { label: "Anos de Atuação", value: "15+", icon: Clock },
            { label: "Processos de Êxito", value: "2.5k+", icon: Award },
            { label: "Valor Recuperado", value: "R$ 45M", icon: TrendingUp },
            { label: "Clientes Atendidos", value: "3.2k", icon: Users },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="flex flex-col items-center text-center space-y-8">
              <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
                <stat.icon className="h-9 w-9 text-primary" />
              </div>
              <div className="space-y-3">
                <h4 className="text-6xl font-serif font-bold text-white tracking-tighter">{stat.value}</h4>
                <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.4em]">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="areas" className="py-48 bg-[#020617]">
        <div className="max-w-[1800px] mx-auto px-10 lg:px-20">
          <div className="text-center mb-40 space-y-8">
            <Badge variant="outline" className="border-primary/30 text-primary uppercase font-black text-sm tracking-[0.4em] px-8 py-3 rounded-full">Especialidades Estratégicas</Badge>
            <h2 className="text-6xl md:text-8xl font-serif font-medium uppercase tracking-tighter">Frentes de Atuação <span className="text-gradient-gold italic">Estratégica</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { title: "Direito do Trabalho", icon: Briefcase, desc: "Foco total na proteção de direitos do empregado e execuções de alta complexidade." },
              { title: "Defesa Civil", icon: ShieldCheck, desc: "Ações indenizatórias, responsabilidade civil e contratos de alta sofisticação." },
              { title: "Previdenciário", icon: Users, desc: "Planejamento de aposentadorias e revisões de benefícios com rigor matemático." },
              { title: "Assessoria Comercial", icon: Zap, desc: "Suporte jurídico para parcerias táticas e blindagem de negócios." },
              { title: "Recursos em Tribunais", icon: Scale, desc: "Atuação técnica em tribunais superiores para reverter decisões críticas." },
              { title: "Compliance Ético", icon: Gavel, desc: "Gestão de risco e consultoria preventiva para prevenção de litígios." },
            ].map((area, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }} 
                whileInView={{ opacity: 1, scale: 1 }} 
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-16 border border-white/5 bg-white/[0.02] hover:border-primary/30 transition-all duration-700 relative overflow-hidden rounded-[2.5rem] shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-20 transition-opacity">
                  <area.icon className="h-32 w-32 text-white" />
                </div>
                <area.icon className="h-12 w-12 text-primary mb-12" />
                <h3 className="text-3xl font-serif font-bold uppercase tracking-widest text-white mb-8">{area.title}</h3>
                <p className="text-white/60 text-lg leading-relaxed font-light uppercase tracking-widest">{area.desc}</p>
                <div className="mt-12 flex items-center text-sm font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                  Consultar Tese <ChevronRight className="ml-4 h-5 w-5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="metodo" className="py-48 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-[1800px] mx-auto px-10 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-16">
              <div className="space-y-8">
                <Badge variant="outline" className="border-primary/30 text-primary uppercase font-black text-sm tracking-[0.4em] px-8 py-3 rounded-full">O Método RGMJ</Badge>
                <h2 className="text-6xl md:text-8xl font-serif font-medium uppercase tracking-tighter leading-tight">Engenharia de <br/><span className="text-gradient-gold italic">Resultados</span></h2>
              </div>
              <p className="text-white/70 text-2xl uppercase tracking-widest font-light leading-relaxed">
                Nossa abordagem não é baseada em volume, mas em precisão cirúrgica. Cada caso é tratado como uma operação de alta inteligência jurídica e estratégica.
              </p>
              
              <div className="space-y-16">
                {[
                  { step: "01", title: "Triagem Estratégica", desc: "Análise profunda dos fatos através de inteligência de dados e experiência de banca de elite." },
                  { step: "02", title: "Desenvolvimento de Tese", desc: "Construção de narrativas jurídicas inabaláveis baseadas em jurisprudência de ponta." },
                  { step: "03", title: "Execução Incisiva", desc: "Protocolo e acompanhamento agressivo para garantir a celeridade e o êxito operacional." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-10">
                    <span className="text-5xl font-serif font-bold text-primary/40 italic">{item.step}</span>
                    <div className="space-y-4">
                      <h4 className="text-2xl font-bold uppercase tracking-widest text-white">{item.title}</h4>
                      <p className="text-lg text-white/50 font-light uppercase tracking-widest leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] bg-cover bg-center border border-white/10 grayscale hover:grayscale-0 transition-all duration-1000 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070')" }} />
              <div className="absolute -bottom-16 -left-16 bg-[#020617] border border-primary/20 p-16 hidden md:block rounded-[2.5rem] shadow-2xl">
                <div className="flex items-center gap-8">
                  <ShieldAlert className="h-20 w-20 text-primary" />
                  <div>
                    <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-3">Status de Operação</p>
                    <p className="text-3xl font-serif font-bold text-white uppercase tracking-widest">Blindagem Total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contato" className="py-48 bg-gradient-to-b from-[#020617] to-[#050a19]">
        <div className="max-w-[1800px] mx-auto px-10 lg:px-20">
          <div className="relative p-20 md:p-40 bg-white/[0.02] border border-primary/20 overflow-hidden group rounded-[4rem] shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-24 text-center lg:text-left">
              <div className="max-w-4xl space-y-10">
                <h2 className="text-6xl md:text-[7rem] font-serif font-medium uppercase tracking-tighter leading-[0.95]">Inicie sua Defesa <span className="text-gradient-gold italic">Especializada</span> Agora</h2>
                <p className="text-white/60 text-xl md:text-3xl uppercase tracking-widest font-light leading-relaxed">
                  Não deixe seus direitos expostos à incerteza. Coloque seu caso nas mãos de quem domina a engenharia jurídica de resultados.
                </p>
              </div>
              <div className="flex flex-col gap-8 w-full lg:w-auto">
                <Button className="bg-[#F5D030] text-[#020617] hover:scale-105 font-black rounded-3xl px-20 h-32 text-xl uppercase tracking-[0.3em] shadow-[0_30px_70px_rgba(245,208,48,0.4)] transition-all border-0">
                  FALAR COM ESPECIALISTA
                </Button>
                <p className="text-sm font-bold text-center text-muted-foreground uppercase tracking-widest mt-6">Resposta em até 15 minutos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-32 bg-[#01040a] border-t border-white/5 px-10">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F5D030] to-[#B8860B] flex items-center justify-center shadow-xl">
              <Scale className="h-9 w-9 text-[#020617]" />
            </div>
            <span className="text-3xl font-bold tracking-widest uppercase">RGMJ</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-6">
            <p className="text-sm font-bold text-white/40 uppercase tracking-[0.4em]">© 2024 RGMJ ADVOGADOS • TODOS OS DIREITOS RESERVADOS</p>
            <div className="flex gap-12">
              <Link href="#" className="text-xs font-black text-white/20 uppercase tracking-widest hover:text-primary transition-colors">Termos de Uso</Link>
              <Link href="#" className="text-xs font-black text-white/20 uppercase tracking-widest hover:text-primary transition-colors">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppWidget />
    </div>
  )
}
