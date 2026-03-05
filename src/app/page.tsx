
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
  MapPin,
  Brain
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden font-sans">
      
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
            <Link href="#areas" className="hover:text-[#D4AF37] transition-colors">Especialidades</Link>
            <Link href="#processo" className="hover:text-[#D4AF37] transition-colors">Workflow</Link>
            <Link href="/login">
              <Button variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-none px-8 text-[9px] font-black uppercase tracking-widest transition-all h-10">
                Portal de Comando
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 marble-bg overflow-hidden">
        {/* Golden Rays Effect */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="max-w-4xl space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left duration-1000">
                <div className="h-px w-16 bg-[#D4AF37]" />
                <span className="text-[10px] font-black tracking-[0.6em] uppercase text-[#D4AF37]">Excelência & Blindagem Jurídica</span>
              </div>
              <h1 className="text-7xl md:text-9xl font-serif font-medium leading-[0.95] tracking-tighter animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
                Advocacia <br />
                de <span className="gold-gradient-text italic font-light">Elite</span>
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
              Soluções estratégicas personalizadas para casos de alta complexidade. Proteção patrimonial e defesa intransigente de direitos.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-8 animate-in fade-in slide-in-from-bottom duration-1000 delay-700">
              <Button size="lg" className="gold-gradient hover:scale-105 text-black font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] shadow-2xl transition-all">
                Agendar Consulta <ArrowRight className="ml-4 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white font-black rounded-none px-12 h-20 text-xs uppercase tracking-[0.3em] bg-white/5 backdrop-blur-sm transition-all">
                WhatsApp Direct <MessageSquare className="ml-4 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="py-40 px-6 bg-[#050505] border-y border-[#D4AF37]/5 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="relative">
            <div className="gold-frame max-w-md mx-auto lg:mx-0 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
              <img 
                src="https://picsum.photos/seed/reinaldo-law/800/1000" 
                alt="Dr. Reinaldo Gonçalves" 
                className="w-full grayscale hover:grayscale-0 transition-all duration-1000 object-cover aspect-[4/5]"
                data-ai-hint="elegant lawyer"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-[#D4AF37] p-10 hidden md:block shadow-2xl">
              <p className="text-black text-5xl font-serif font-black italic">08</p>
              <p className="text-black text-[10px] font-black uppercase tracking-[0.2em] mt-2">Anos de Prática de Elite</p>
            </div>
          </div>

          <div className="space-y-10">
            <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 px-8 py-2 text-[10px] font-black uppercase tracking-[0.4em] rounded-none">A BANCA</Badge>
            <h2 className="text-6xl md:text-7xl font-serif font-bold leading-[1.1] tracking-tight">Tradição que se une à <span className="italic font-light gold-gradient-text">Modernidade Jurídica</span></h2>
            <p className="text-gray-400 leading-relaxed text-xl font-light">
              Comandada pelo Dr. Reinaldo Gonçalves Miguel de Jesus, nossa banca é reconhecida pela combatividade e precisão técnica. Focamos em entregar resultados que transcendem o processo judicial, protegendo o patrimônio e a dignidade de nossos constituintes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
              <div className="space-y-4 border-l border-[#D4AF37]/30 pl-8">
                <h4 className="text-[#D4AF37] font-serif text-2xl font-bold italic">Visão Analítica</h4>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] leading-loose">Decisões baseadas em dados e jurisprudência de última instância.</p>
              </div>
              <div className="space-y-4 border-l border-[#D4AF37]/30 pl-8">
                <h4 className="text-[#D4AF37] font-serif text-2xl font-bold italic">Defesa Intransigente</h4>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] leading-loose">Proteção máxima dos ativos e direitos fundamentais.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Areas Section */}
      <section id="areas" className="py-40 px-6 bg-[#080808] relative">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter">Áreas de <span className="italic font-light gold-gradient-text">Domínio</span></h2>
            <p className="text-[#D4AF37] tracking-[0.6em] text-[10px] uppercase font-black">Especialistas em casos de alta complexidade</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
              <div key={i} className="premium-card p-16 space-y-10 gold-border-animation group overflow-hidden">
                <div className="w-16 h-16 bg-[#D4AF37]/5 flex items-center justify-center border border-[#D4AF37]/10 group-hover:border-[#D4AF37]/40 transition-all">
                  <area.icon className="h-8 w-8 text-[#D4AF37]" />
                </div>
                <h3 className="text-4xl font-serif font-bold uppercase tracking-tight">{area.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-light">{area.desc}</p>
                <div className="pt-6">
                  <Link href="#" className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] flex items-center gap-3 group/link">
                    EXPLORAR TESE <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-3 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="processo" className="py-40 px-6 bg-[#050505] relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-8">
            <div className="space-y-6">
              <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 px-8 py-2 text-[10px] font-black uppercase rounded-none">WORKFLOW</Badge>
              <h2 className="text-6xl md:text-7xl font-serif font-bold leading-none">Nossa <span className="italic font-light gold-gradient-text">Metodologia</span></h2>
            </div>
            <p className="text-gray-500 max-w-sm text-sm italic border-l border-[#D4AF37]/30 pl-8">Do protocolo inicial ao trânsito em julgado, cada passo é taticamente planejado.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-16 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent hidden lg:block" />
            
            {[
              { step: "01", title: "Análise", icon: Zap, desc: "Auditoria de Fatos" },
              { step: "02", title: "Estratégia", icon: Brain, desc: "Engenharia de Tese" },
              { step: "03", title: "Protocolo", icon: FileText, desc: "Ação Imediata" },
              { step: "04", title: "Êxito", icon: CheckCircle, desc: "Resultado Final" }
            ].map((p, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-8 group">
                <div className="w-24 h-24 bg-[#050505] border border-[#D4AF37]/20 flex items-center justify-center rounded-full group-hover:border-[#D4AF37] transition-all group-hover:scale-110 shadow-[0_0_30px_rgba(212,175,55,0.05)]">
                  <p className="text-[#D4AF37] font-serif text-3xl font-black italic">{p.step}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold uppercase tracking-[0.2em]">{p.title}</h4>
                  <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 bg-[#020202] border-t border-[#D4AF37]/10 px-6" id="contato">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-20">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-[#D4AF37] flex items-center justify-center">
                <Scale className="h-6 w-6 text-black" />
              </div>
              <span className="text-2xl font-serif font-bold tracking-[0.2em] uppercase">RGMJ Elite</span>
            </div>
            <p className="text-gray-500 max-w-md text-base leading-loose font-light">
              Escritório boutique focado em alta performance e soluções jurídicas customizadas. Atendimento exclusivo para clientes que buscam a excelência em todo o território nacional.
            </p>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">CONTATOS</h4>
            <ul className="space-y-6 text-sm text-gray-400 font-medium tracking-wide">
              <li className="flex items-center gap-4 group cursor-pointer hover:text-[#D4AF37] transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-[#D4AF37]/40"><Phone className="h-3.5 w-3.5" /></div>
                (11) 99999-9999
              </li>
              <li className="flex items-center gap-4 group cursor-pointer hover:text-[#D4AF37] transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-[#D4AF37]/40"><Mail className="h-3.5 w-3.5" /></div>
                reinaldo@rgmj.adv.br
              </li>
              <li className="flex items-center gap-4 group cursor-pointer hover:text-[#D4AF37] transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-[#D4AF37]/40"><MapPin className="h-3.5 w-3.5" /></div>
                Vila Olímpia, São Paulo - SP
              </li>
            </ul>
          </div>

          <div className="space-y-8 text-right">
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">SISTEMAS</h4>
            <ul className="space-y-6 text-xs font-black uppercase tracking-[0.3em] text-gray-600">
              <li><Link href="/login" className="hover:text-white transition-colors border-b border-transparent hover:border-[#D4AF37] pb-1">Acesso Corporativo</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors border-b border-transparent hover:border-[#D4AF37] pb-1">Compliance & LGPD</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">
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
