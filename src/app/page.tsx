
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
  Gavel,
  Briefcase,
  Lock,
  Zap,
  Target,
  Users,
  TrendingUp,
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
            <Link href="/login">
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary hover:text-background rounded-none px-4 text-[9px] font-black uppercase tracking-widest transition-all h-10">
                <Lock className="h-3.5 w-3.5" />
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
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/image/hero-bg.jpg')" }} />
        <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-[2px]" />
        
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
                <div className="h-px w-16 bg-[#F5D030]/60" />
                <span className="text-[#F5D030]/80 font-body text-[10px] tracking-[0.5em] uppercase font-bold">
                  Excelência Jurídica & Estratégia de Elite
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
                Proteção patrimonial e defesa estratégica personalizada sob o comando da banca RGMJ.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-6"
              >
                <Button className="bg-[#F5D030] text-[#020617] hover:scale-105 font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] shadow-2xl transition-all border-0 group">
                  <Calendar className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" />
                  AGENDAR CONSULTA
                </Button>
                <Button variant="outline" className="border-white/10 hover:border-primary hover:text-primary text-white font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] bg-white/5 backdrop-blur-sm transition-all group">
                  <MessageSquare className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                  WHATSAPP DIRECT
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

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

      {/* Footer */}
      <footer className="py-20 bg-[#01040a] border-t border-white/5 px-6" id="contato">
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
