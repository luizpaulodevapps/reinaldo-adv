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
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Zap
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
            <Link href="#contato" className="hover:text-[#D4AF37] transition-colors">Contato</Link>
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
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: "url('/image/hero-bg.jpg')" }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050a19]/20 via-[#050a19]/80 to-[#050a19]" />
        
        {/* Decorative elements */}
        <div className="absolute left-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/15 to-transparent hidden lg:block" />
        <div className="absolute right-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/8 to-transparent hidden lg:block" />

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
                <div className="h-px w-16 bg-[#D4AF37]/60" />
                <span className="text-[#D4AF37]/80 font-body text-[11px] tracking-[0.4em] uppercase font-light">
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
                com <span className="text-[#D4AF37] font-medium italic">Estratégia</span>,
                <br />
                <span className="text-[#D4AF37] font-medium italic">Ética</span> e{" "}
                <span className="text-[#D4AF37] font-medium italic">Compromisso</span>
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
                <Button className="bg-[#D4AF37] text-[#050a19] hover:scale-105 font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] shadow-2xl transition-all border-0">
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
            <div className="p-4 bg-[#0a0f1e] border border-primary/20 relative shadow-[0_0_50px_rgba(212,175,55,0.1)]">
              <img 
                src="https://picsum.photos/seed/reinaldo-law/800/1000" 
                alt="Dr. Reinaldo Gonçalves" 
                className="w-full grayscale hover:grayscale-0 transition-all duration-1000 object-cover aspect-[4/5]"
              />
              <div className="absolute -inset-2 border border-primary/40 pointer-events-none" />
              <div className="absolute -inset-4 border border-primary/10 pointer-events-none" />
            </div>
          </motion.div>

          <div className="space-y-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-8 py-2 text-[10px] font-black uppercase tracking-[0.4em] rounded-none">A BANCA</Badge>
            <h2 className="text-6xl md:text-8xl font-display font-bold leading-[1.1] tracking-tighter">Tradição que se une à <span className="italic font-light text-[#D4AF37]">Modernidade Jurídica</span></h2>
            <p className="text-white/50 leading-relaxed text-xl font-light font-body">
              Comandada pelo Dr. Reinaldo Gonçalves Miguel de Jesus, nossa banca é reconhecida pela combatividade e precisão técnica. Focamos em entregar resultados que transcendem o processo judicial.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 bg-[#02040d] border-t border-white/5 px-6" id="contato">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-20">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/10">
                <Scale className="h-6 w-6 text-[#02040d]" />
              </div>
              <span className="text-2xl font-display font-bold tracking-[0.2em] uppercase">RGMJ Elite</span>
            </div>
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
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
