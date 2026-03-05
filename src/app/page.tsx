import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  Scale, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare, 
  Clock, 
  Zap,
  Gavel,
  CheckCircle,
  FileText,
  Briefcase,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 py-6 px-6 lg:px-12 bg-[#050505]/80 backdrop-blur-md border-b border-[#D4AF37]/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#D4AF37] flex items-center justify-center">
              <Scale className="h-5 w-5 text-black" />
            </div>
            <span className="text-xl font-serif font-bold tracking-widest uppercase">RGMJ</span>
          </div>
          
          <div className="hidden md:flex items-center gap-12 text-[10px] font-bold tracking-[0.3em] uppercase">
            <Link href="#sobre" className="hover:text-[#D4AF37] transition-colors">Sobre</Link>
            <Link href="#areas" className="hover:text-[#D4AF37] transition-colors">Áreas</Link>
            <Link href="#diferenciais" className="hover:text-[#D4AF37] transition-colors">Diferenciais</Link>
            <Link href="#processo" className="hover:text-[#D4AF37] transition-colors">Processo</Link>
            <Link href="/login">
              <Button variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-none px-8 text-[9px] font-black uppercase tracking-widest transition-all h-10">
                Acesso Restrito
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 marble-bg">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="max-w-4xl space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-[#D4AF37]" />
                <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#D4AF37]">Advocacia & Consultoria Jurídica</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-serif font-medium leading-[1.1] tracking-tight">
                Excelência Jurídica <br />
                com <span className="italic font-light">Estratégia</span>, <br />
                <span className="italic font-light text-[#D4AF37]">Ética</span> e Compromisso
              </h1>
            </div>

            <p className="text-lg md:text-xl text-gray-400 font-light max-w-2xl leading-relaxed font-sans">
              Atuação completa em todas as áreas do Direito, com atendimento personalizado, análise criteriosa e soluções eficazes para cada caso.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Button size="lg" className="bg-[#D4AF37] hover:bg-[#B8860B] text-black font-bold rounded-none px-10 h-16 text-xs uppercase tracking-widest shadow-xl">
                Agendar Consulta <Clock className="ml-3 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white font-bold rounded-none px-10 h-16 text-xs uppercase tracking-widest bg-transparent">
                Falar pelo WhatsApp <MessageSquare className="ml-3 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="py-32 px-6 bg-[#050505] border-y border-[#D4AF37]/5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="relative">
            <div className="gold-frame max-w-md mx-auto lg:mx-0">
              <img 
                src="https://picsum.photos/seed/reinaldo-law/800/1000" 
                alt="Dr. Reinaldo Gonçalves" 
                className="w-full grayscale hover:grayscale-0 transition-all duration-700 object-cover aspect-[4/5]"
                data-ai-hint="elegant lawyer"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 bg-[#D4AF37] p-8 hidden md:block">
              <p className="text-black text-4xl font-serif font-bold">08</p>
              <p className="text-black text-[9px] font-bold uppercase tracking-widest mt-1">Anos de Prática</p>
            </div>
          </div>

          <div className="space-y-8">
            <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 px-6 py-1 text-[9px] font-black uppercase tracking-widest rounded-none">A Banca</Badge>
            <h2 className="text-5xl md:text-6xl font-serif font-bold leading-tight">Tradição que se une à <span className="italic font-light">Modernidade Jurídica</span></h2>
            <p className="text-gray-400 leading-relaxed font-sans text-lg">
              Comandada pelo Dr. Reinaldo Gonçalves Miguel de Jesus, nossa banca é reconhecida pela combatividade e precisão técnica. Focamos em entregar resultados que transcendem o processo judicial, protegendo o patrimônio e a dignidade de nossos constituintes.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-6">
              <div className="space-y-2">
                <h4 className="text-[#D4AF37] font-serif text-xl font-bold italic">Visão Analítica</h4>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Decisões baseadas em dados e jurisprudência atualizada.</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[#D4AF37] font-serif text-xl font-bold italic">Defesa Intransigente</h4>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Proteção máxima dos direitos individuais.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Areas Section */}
      <section id="areas" className="py-32 px-6 bg-[#080808]">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter">Áreas de <span className="italic font-light text-[#D4AF37]">Domínio</span></h2>
            <p className="text-gray-500 font-sans tracking-widest text-[10px] uppercase font-bold italic">Especialistas em casos de alta complexidade</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: "Direito Trabalhista", 
                desc: "Atuação estratégica em rescisões indiretas, horas extras complexas e assédio moral.",
                icon: Gavel
              },
              { 
                title: "Direito Civil", 
                desc: "Gestão de contratos, responsabilidade civil e litígios de alta expressão econômica.",
                icon: ShieldCheck
              },
              { 
                title: "Empresarial", 
                desc: "Consultoria preventiva e defesa institucional para corporações de elite.",
                icon: Briefcase
              }
            ].map((area, i) => (
              <div key={i} className="premium-card p-12 space-y-8 gold-border-animation">
                <div className="w-14 h-14 bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                  <area.icon className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <h3 className="text-3xl font-serif font-bold uppercase tracking-tight">{area.title}</h3>
                <p className="text-gray-400 font-sans text-sm leading-relaxed">{area.desc}</p>
                <div className="pt-4">
                  <Link href="#" className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.3em] flex items-center gap-2 group">
                    Explorar Tese <ArrowRight className="h-3 w-3 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="processo" className="py-32 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4">
              <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 px-6 py-1 text-[9px] font-black uppercase rounded-none">Workflow</Badge>
              <h2 className="text-5xl md:text-6xl font-serif font-bold">Nossa <span className="italic font-light">Metodologia</span></h2>
            </div>
            <p className="text-gray-500 max-w-sm text-sm italic">Do protocolo inicial ao trânsito em julgado, cada passo é milimetricamente planejado.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent hidden lg:block" />
            
            {[
              { step: "01", title: "Análise", icon: Zap },
              { step: "02", title: "Estratégia", icon: Brain },
              { step: "03", title: "Protocolo", icon: FileText },
              { step: "04", title: "Êxito", icon: CheckCircle }
            ].map((p, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-6 group">
                <div className="w-20 h-20 bg-[#050505] border border-[#D4AF37]/30 flex items-center justify-center rounded-full group-hover:border-[#D4AF37] transition-all group-hover:scale-110">
                  <p className="text-[#D4AF37] font-serif text-2xl font-bold">{p.step}</p>
                </div>
                <h4 className="text-lg font-bold uppercase tracking-widest">{p.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-[#020202] border-t border-[#D4AF37]/10 px-6" id="contato">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-16">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#D4AF37] flex items-center justify-center">
                <Scale className="h-4 w-4 text-black" />
              </div>
              <span className="text-xl font-serif font-bold tracking-widest uppercase">RGMJ Elite</span>
            </div>
            <p className="text-gray-500 max-w-md text-sm leading-loose font-sans">
              Escritório boutique focado em alta performance e soluções jurídicas customizadas. Atendimento exclusivo em todo o território nacional.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#D4AF37]">Contatos</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-[#D4AF37]" /> (11) 99999-9999</li>
              <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#D4AF37]" /> reinaldo@rgmj.adv.br</li>
              <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[#D4AF37]" /> Vila Olímpia, São Paulo - SP</li>
            </ul>
          </div>

          <div className="space-y-6 text-right">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#D4AF37]">Institucional</h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-gray-600">
              <li><Link href="/login" className="hover:text-white transition-colors">Acesso Corporativo</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">LGPD & Compliance</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-700">
          <p>© 2025 RGMJ ADVOGADOS. TODOS OS DIREITOS RESERVADOS.</p>
          <p>CNPJ: 00.000.000/0001-00</p>
        </div>
      </footer>
    </div>
  )
}

import { Brain } from 'lucide-react'
