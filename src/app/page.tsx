
"use client"

import Link from 'next/link'
import { motion } from "framer-motion"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Scale, 
  ShieldCheck, 
  MessageSquare, 
  Calendar,
  Zap,
  Lock,
  Award,
  Users,
  TrendingUp,
  Clock,
  MessageCircle,
  ChevronRight
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
            <Link href="#sobre" className="hover:text-[#F5D030] transition-colors relative group">A BANCA</Link>
            <Link href="#areas" className="hover:text-[#F5D030] transition-colors relative group">ESPECIALIDADES</Link>
            <Link href="#metodo" className="hover:text-[#F5D030] transition-colors relative group">MÉTODO</Link>
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
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/image/hero-bg.jpg')" }} />
        <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-[2px]" />
        
        {/* Decorative corner elements */}
        <div className="absolute top-32 left-[10%] hidden lg:block z-10">
          <div className="w-20 h-px bg-primary/20" />
          <div className="w-px h-20 bg-primary/20" />
        </div>
        <div className="absolute bottom-20 right-[10%] hidden lg:block z-10">
          <div className="w-20 h-px bg-primary/20 ml-auto" />
          <div className="w-px h-20 bg-primary/20 ml-auto" />
        </div>

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

      {/* Areas Section */}
      <section id="areas" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <Badge variant="outline" className="border-primary/30 text-primary uppercase font-black px-4 py-1 text-[10px] tracking-widest">Especialidades</Badge>
            <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight">Expertise de <span className="text-gradient-gold italic">Elite</span></h2>
            <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium leading-relaxed">Soluções jurídicas complexas executadas com precisão cirúrgica.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "DIREITO TRABALHISTA", desc: "Defesa estratégica para altos executivos e empresas.", icon: Zap },
              { title: "CÍVEL ESTRATÉGICO", desc: "Litígios complexos e proteção patrimonial de alto nível.", icon: Scale },
              { title: "EMPRESARIAL", desc: "Engenharia de contratos e consultoria tática preventiva.", icon: ShieldCheck },
            ].map((area, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }} 
                whileInView={{ opacity: 1, scale: 1 }} 
                viewport={{ once: true }}
                className="premium-card p-10 group hover:border-primary/30 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 border border-primary/20 group-hover:scale-110 transition-transform">
                  <area.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-display font-bold mb-4 tracking-wider">{area.title}</h3>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest leading-loose">{area.desc}</p>
                <div className="mt-8 pt-8 border-t border-white/5">
                  <button className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2 hover:translate-x-2 transition-transform">Saber Mais <ChevronRight className="h-3 w-3" /></button>
                </div>
              </motion.div>
            ))}
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
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">© 2024 RGMJ ADVOGADOS ELITE • TODOS OS DIREITOS RESERVADOS</p>
        </div>
      </footer>
    </div>
  )
}
