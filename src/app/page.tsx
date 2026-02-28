
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  Scale, 
  Gavel, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare, 
  Clock, 
  ChevronDown,
  Briefcase,
  TrendingUp,
  Landmark,
  Hammer,
  ChevronRight,
  Zap,
  FileText,
  Users,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white selection:bg-[#F5D030] selection:text-[#020617] overflow-x-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes reveal {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal { animation: reveal 1.2s cubic-bezier(0.215, 0.61, 0.355, 1) forwards; }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .gold-glow { box-shadow: 0 0 40px rgba(245, 208, 48, 0.15); }
        .glass-nav {
          background: rgba(2, 6, 23, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(245, 208, 48, 0.05);
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav py-5">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5D030] to-[#D4AF37] flex items-center justify-center border border-white/10 shadow-lg shadow-yellow-500/10">
              <Scale className="h-6 w-6 text-[#020617]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter uppercase leading-none font-headline">RGMJ Elite</span>
              <span className="text-[9px] font-bold text-[#F5D030] tracking-[0.4em] uppercase mt-1">Advocacia Trabalhista</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-10 text-[10px] font-black tracking-[0.25em] uppercase">
            <Link href="#atuacao" className="hover:text-[#F5D030] transition-colors">Atuação</Link>
            <Link href="#diferencial" className="hover:text-[#F5D030] transition-colors">Diferencial</Link>
            <Link href="#contato" className="hover:text-[#F5D030] transition-colors">Contato</Link>
            <Link href="/login">
              <Button size="sm" variant="outline" className="border-[#F5D030]/40 text-[#F5D030] hover:bg-[#F5D030] hover:text-[#020617] rounded-full px-8 text-[9px] font-black uppercase tracking-widest transition-all">
                Acesso Restrito
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#F5D030]/5 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-[#4D8BB1]/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center relative z-10 w-full">
          <div className="space-y-12 animate-reveal">
            <div className="space-y-6">
              <Badge variant="outline" className="border-[#F5D030]/30 text-[#F5D030] bg-[#F5D030]/5 px-6 py-1.5 text-[10px] font-black uppercase tracking-[0.4em] rounded-full">
                Estratégia Jurídica de Alto Impacto
              </Badge>
              <h1 className="text-7xl lg:text-9xl font-black leading-[0.85] tracking-tighter uppercase font-headline">
                Defesa <br />
                <span className="animate-shimmer">Implacável</span> <br />
                do seu Direito.
              </h1>
            </div>

            <p className="text-xl text-gray-400 font-light max-w-xl leading-relaxed border-l-2 border-[#F5D030]/20 pl-8">
              Dr. Reinaldo Gonçalves Miguel de Jesus comanda uma banca de elite focada na <span className="text-white font-bold italic">recuperação de patrimônio trabalhista</span>. Combinamos agressividade jurídica com inteligência técnica para resultados extraordinários.
            </p>

            <div className="flex flex-col sm:row gap-6 pt-6">
              <Link href="https://wa.me/5511999999999" target="_blank" className="w-full sm:w-auto">
                <Button size="lg" className="gold-gradient w-full sm:w-auto hover:scale-105 transition-all duration-500 font-black rounded-xl px-12 h-20 text-sm uppercase tracking-widest shadow-2xl shadow-yellow-500/20">
                  Agendar Análise Estratégica <MessageSquare className="ml-4 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#atuacao" className="w-full sm:w-auto">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/5 w-full sm:w-auto font-black h-20 px-10 text-xs uppercase tracking-widest gap-3 border border-white/5 rounded-xl">
                  Nossas Especialidades <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-12 pt-12 border-t border-white/5">
              <div>
                <p className="text-4xl font-black text-[#F5D030] font-headline">8+</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Anos de Excelência</p>
              </div>
              <div>
                <p className="text-4xl font-black text-[#F5D030] font-headline">94%</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Taxa de Sucesso</p>
              </div>
              <div>
                <p className="text-4xl font-black text-[#F5D030] font-headline">R$ Mi</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Valores Recuperados</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block group animate-reveal" style={{ animationDelay: '0.4s' }}>
            <div className="absolute -inset-6 bg-gradient-to-br from-[#F5D030] to-[#D4AF37] rounded-[3rem] opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-1000" />
            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 gold-glow bg-[#0a0a14]">
              <img 
                src="https://picsum.photos/seed/reinaldo-law/800/1000" 
                alt="Dr. Reinaldo Gonçalves" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                data-ai-hint="elegant lawyer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-12 left-12 right-12 space-y-3">
                <p className="text-3xl font-black uppercase tracking-tighter text-white font-headline">Dr. Reinaldo Gonçalves</p>
                <p className="text-[11px] font-bold text-[#F5D030] uppercase tracking-[0.5em]">Advocacia Estratégica | OAB/SP</p>
              </div>
            </div>
            
            {/* Floating Card */}
            <div className="absolute -left-12 top-1/3 glass p-8 rounded-3xl border-l-4 border-l-[#F5D030] animate-float shadow-2xl">
              <div className="flex items-center gap-5">
                <div className="bg-[#F5D030]/10 p-3 rounded-2xl text-[#F5D030]">
                  <Gavel className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#F5D030] uppercase tracking-widest">Especialista em</p>
                  <p className="text-base font-bold text-white uppercase tracking-tight">Alta Performance Trabalhista</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section id="atuacao" className="py-40 px-6 relative bg-[#020617]">
        <div className="max-w-7xl mx-auto space-y-32">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <Badge className="bg-[#F5D030]/10 text-[#F5D030] border-[#F5D030]/20 px-8 py-2 text-[10px] font-black uppercase tracking-[0.4em] rounded-full">Áreas de Domínio</Badge>
            <h2 className="text-6xl lg:text-8xl font-black uppercase tracking-tighter font-headline leading-none">A Banca que <span className="animate-shimmer">Domina</span> o Tribunal.</h2>
            <p className="text-gray-400 font-light text-xl">Desenvolvemos teses exclusivas para garantir a proteção máxima dos seus direitos trabalhistas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { 
                title: "Rescisão Indireta", 
                desc: "Saia da empresa com todos os seus direitos garantidos (FGTS + 40%, Seguro Desemprego e Aviso Prévio) quando o patrão descumpre a lei.",
                icon: Zap,
                tag: "FALTA PATRONAL"
              },
              { 
                title: "Horas Extras & Banco", 
                desc: "Recuperamos cada minuto trabalhado fora da jornada, inclusive intervalos suprimidos e períodos de prontidão via WhatsApp.",
                icon: Clock,
                tag: "RECUPERAÇÃO"
              },
              { 
                title: "Assédio & Saúde", 
                desc: "Proteção total contra assédio moral, burnout e doenças do trabalho. Defendemos sua dignidade e integridade emocional.",
                icon: ShieldCheck,
                tag: "DIGNIDADE"
              },
              { 
                title: "Cargos de Confiança", 
                desc: "Anulação de falsos cargos de gestão para recebimento de horas extras e reflexos salariais de alta monta.",
                icon: TrendingUp,
                tag: "ESTRATÉGIA"
              },
              { 
                title: "Reversão de Justa Causa", 
                desc: "Combate técnico contra demissões arbitrárias, limpando seu histórico profissional e garantindo suas verbas rescisórias.",
                icon: Hammer,
                tag: "REVERSÃO"
              },
              { 
                title: "Equiparação Salarial", 
                desc: "Justiça remuneratória: se você faz a mesma função, merece o mesmo salário. Corrigimos distorções históricas.",
                icon: Scale,
                tag: "ISONOMIA"
              }
            ].map((spec, i) => (
              <div key={i} className="group glass p-12 rounded-[3rem] hover:border-[#F5D030]/40 transition-all duration-700 hover:-translate-y-4 flex flex-col h-full hover-gold">
                <div className="flex justify-between items-start mb-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#F5D030]/10 flex items-center justify-center text-[#F5D030] group-hover:scale-110 group-hover:bg-[#F5D030] group-hover:text-[#020617] transition-all duration-700">
                    <spec.icon className="h-8 w-8" />
                  </div>
                  <Badge variant="outline" className="text-[9px] border-white/10 text-gray-500 uppercase font-black tracking-widest px-3">{spec.tag}</Badge>
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-6 group-hover:text-[#F5D030] transition-colors font-headline">{spec.title}</h3>
                <p className="text-gray-400 text-base leading-relaxed mb-10 flex-1">{spec.desc}</p>
                <Link href="https://wa.me/5511999999999" className="text-[11px] font-black text-[#F5D030] uppercase tracking-[0.3em] flex items-center gap-3 group-hover:gap-6 transition-all">
                  Analisar meu Caso <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 bg-[#01040d] border-t border-white/5" id="contato">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-4 gap-20">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#F5D030] flex items-center justify-center">
                <Scale className="h-5 w-5 text-[#020617]" />
              </div>
              <span className="text-2xl font-black uppercase tracking-tighter font-headline">RGMJ Advogados</span>
            </div>
            <p className="text-gray-500 text-lg max-w-md font-light leading-relaxed">
              Escritório Boutique especializado em alta performance trabalhista. Localizado no coração financeiro de São Paulo, atendemos clientes em todo o Brasil com rigor técnico e ética absoluta.
            </p>
            <div className="flex gap-6">
              {[Users, MessageSquare, Briefcase].map((Icon, i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#F5D030] hover:text-[#020617] transition-all cursor-pointer"><Icon className="h-5 w-5" /></div>
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#F5D030]">Contato Direto</h4>
            <div className="space-y-6 text-base text-gray-400 font-bold">
              <p className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer"><Mail className="h-5 w-5 text-[#F5D030]" /> contato@rgmj.adv.br</p>
              <p className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer"><Phone className="h-5 w-5 text-[#F5D030]" /> (11) 9999-9999</p>
              <p className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer leading-tight"><MapPin className="h-5 w-5 text-[#F5D030]" /> Vila Olímpia, <br /> São Paulo - SP</p>
            </div>
          </div>
          <div className="space-y-8 text-right">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#F5D030]">Governança</h4>
            <div className="space-y-6 text-sm text-gray-500 uppercase font-black tracking-widest">
              <Link href="/login" className="block hover:text-white transition-colors">Acesso Corporativo</Link>
              <p className="text-[10px] mt-12 text-gray-700 leading-relaxed tracking-normal font-normal">© 2025 Dr. Reinaldo Gonçalves. <br /> CNPJ: 00.000.000/0001-00. <br /> Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
