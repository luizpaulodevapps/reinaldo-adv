import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Building2, Users, Briefcase, Award, Mail, Phone, MapPin, FileText, Scale, BarChart3, ChevronDown, Sparkles, CheckCircle, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(100px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(129, 130, 88, 0.3); }
          50% { box-shadow: 0 0 40px rgba(129, 130, 88, 0.6); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .float-animation { animation: float 3s ease-in-out infinite; }
        .slide-in-left { animation: slideInLeft 0.8s ease-out; }
        .slide-in-right { animation: slideInRight 0.8s ease-out; }
        .slide-in-up { animation: slideInUp 0.8s ease-out; }
        .pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
        .shimmer-text { 
          background: linear-gradient(90deg, #213b37, #818258, #213b37);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-20 pb-16 bg-gradient-to-b from-white to-[#E9E8E6]">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#818258]/10 rounded-full blur-3xl float-animation" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#213b37]/10 rounded-full blur-3xl float-animation" style={{ animationDelay: '1s' }} />
        </div>

        <div className="mx-auto max-w-6xl relative z-10 px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="slide-in-left space-y-4">
                <div className="inline-block px-4 py-2 bg-[#818258]/20 text-[#818258] text-sm font-bold uppercase tracking-wider rounded-full border border-[#818258]/30">
                  <Sparkles className="inline h-4 w-4 mr-2" />
                  Legal Excellence
                </div>
                <h1 className="text-6xl sm:text-7xl font-light leading-tight text-[#213b37]">
                  Assessoria<br />
                  <span className="shimmer-text font-normal text-7xl">Jurídica</span>
                </h1>
              </div>

              <p className="slide-in-left text-xl text-gray-700 font-light max-w-lg leading-relaxed" style={{ animationDelay: '0.2s' }}>
                Soluções ágeis, seguras e confiáveis. Transformamos desafios jurídicos em oportunidades de negócio.
              </p>

              <div className="slide-in-left flex flex-col sm:flex-row gap-4 pt-4" style={{ animationDelay: '0.4s' }}>
                <Link href="/">
                  <Button size="lg" className="bg-[#818258] hover:bg-[#bbbd7e] text-white font-semibold rounded-lg px-8 h-14 pulse-glow">
                    Acessar Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#areas">
                  <Button size="lg" variant="outline" className="border-[#213b37] text-[#213b37] hover:bg-[#213b37] hover:text-white rounded-lg px-8 h-14 font-semibold">
                    Explorar
                  </Button>
                </Link>
              </div>

              {/* Stats Row */}
              <div className="slide-in-left grid grid-cols-3 gap-6 pt-8 border-t border-gray-200" style={{ animationDelay: '0.6s' }}>
                <div>
                  <p className="text-3xl font-bold text-[#818258]">8+</p>
                  <p className="text-sm text-gray-600">Anos</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#818258]">20+</p>
                  <p className="text-sm text-gray-600">Profissionais</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#818258]">500+</p>
                  <p className="text-sm text-gray-600">Clientes</p>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="hidden md:flex relative h-[600px]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#213b37] to-[#0A2C29] rounded-3xl overflow-hidden slide-in-right">
                <div className="absolute inset-0 opacity-20 pattern-dots" />
                <div className="flex items-center justify-center h-full relative z-10">
                  <div className="text-center space-y-6 px-8">
                    <Building2 className="h-32 w-32 text-[#818258] mx-auto float-animation" />
                    <h3 className="text-3xl font-serif font-semibold text-white">
                      Escritório Especializado
                    </h3>
                    <p className="text-lg text-gray-300 font-light">
                      Expertise consolidada em Direito Corporativo e Consultoria Jurídica Estratégica
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-[#818258]" />
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-[#213b37] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm uppercase tracking-widest text-[#818258] font-bold mb-8">
            Confiado por líderes do mercado
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <Star className="h-6 w-6 text-[#818258] mx-auto" />
              <p className="font-semibold">Excelência</p>
              <p className="text-sm text-gray-400">Técnica Jurídica</p>
            </div>
            <div className="space-y-2">
              <CheckCircle className="h-6 w-6 text-[#818258] mx-auto" />
              <p className="font-semibold">Resultados</p>
              <p className="text-sm text-gray-400">Comprovados</p>
            </div>
            <div className="space-y-2">
              <Award className="h-6 w-6 text-[#818258] mx-auto" />
              <p className="font-semibold">Confiança</p>
              <p className="text-sm text-gray-400">De Clientes</p>
            </div>
            <div className="space-y-2">
              <Sparkles className="h-6 w-6 text-[#818258] mx-auto" />
              <p className="font-semibold">Inovação</p>
              <p className="text-sm text-gray-400">Estratégica</p>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Areas Section - Enhanced */}
      <section id="areas" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#E9E8E6]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-block px-4 py-2 bg-[#818258]/20 text-[#818258] text-sm font-bold uppercase tracking-wider rounded-full">
              Especialidades
            </div>
            <h2 className="text-6xl font-serif font-semibold text-[#213b37]">
              Áreas de Atuação
            </h2>
            <p className="text-xl text-[#464646] max-w-2xl mx-auto font-light">
              Expertise consolidada em múltiplas áreas do direito corporativo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: 'Direito Corporativo',
                description: 'Operações societárias complexas, contratos comerciais e governança.',
                icon: Building2,
                delay: '0s'
              },
              {
                title: 'Direito Trabalhista',
                description: 'Contencioso e consultiva em relações trabalhistas especializadas.',
                icon: Users,
                delay: '0.1s'
              },
              {
                title: 'Direito Imobiliário',
                description: 'Exploração comercial de imóveis com análises de risco.',
                icon: Award,
                delay: '0.2s'
              },
              {
                title: 'Direito Tributário',
                description: 'Planejamento tributário estratégico e contencioso fiscal.',
                icon: BarChart3,
                delay: '0.3s'
              },
              {
                title: 'Direito Penal',
                description: 'Atuação estratégica contenciosa em todos os ramos.',
                icon: Scale,
                delay: '0.4s'
              },
              {
                title: 'Direito Civil',
                description: 'Contencioso nas mais diversas áreas do Direito Civil.',
                icon: FileText,
                delay: '0.5s'
              },
            ].map((area, idx) => {
              const Icon = area.icon
              return (
                <div
                  key={idx}
                  className="slide-in-up bg-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100 group hover:-translate-y-2"
                  style={{ animationDelay: area.delay }}
                >
                  <div className="mb-4 inline-flex p-3 rounded-lg bg-[#213b37]/5 group-hover:bg-[#213b37] transition-all duration-300">
                    <Icon className="h-6 w-6 text-[#213b37] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-[#213b37] mb-3">
                    {area.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {area.description}
                  </p>
                  <div className="mt-6 flex items-center text-[#818258] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-semibold">Explorar</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center slide-in-up">
            <Link href="#areas">
              <Button
                size="lg"
                className="bg-[#213b37] hover:bg-[#26736b] text-white font-semibold rounded-lg px-8 h-14"
              >
                Ver Todas as Áreas <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section - Enhanced */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 slide-in-left">
              <div className="space-y-4">
                <div className="inline-block px-4 py-2 bg-[#818258]/20 text-[#818258] text-sm font-bold uppercase tracking-wider rounded-full">
                  História
                </div>
                <h2 className="text-5xl font-serif font-semibold text-[#213b37]">
                  Quem Somos
                </h2>
              </div>

              <p className="text-gray-700 leading-relaxed text-lg font-light">
                Fundado em 2017, nascemos da união entre jovens advogados que decidiram agregar à experiência da advocacia tradicional uma forma <span className="text-[#818258] font-semibold">descomplicada, próxima e incisiva</span>.
              </p>

              <p className="text-gray-700 leading-relaxed text-lg font-light">
                O contato direto com clientes, aliado à experiência em grandes operações, proporciona <span className="text-[#818258] font-semibold">fluidez e segurança</span> a novos negócios.
              </p>

              <div className="space-y-3 pt-4">
                {['Excelência Técnica', 'Agilidade Estratégica', 'Foco em Resultados'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 slide-in-left" style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
                    <CheckCircle className="h-5 w-5 text-[#818258] flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative slide-in-right">
              <div className="absolute -inset-8 bg-gradient-to-br from-[#818258] to-[#213b37] rounded-3xl opacity-20 blur-2xl" />
              <div className="relative bg-gradient-to-br from-[#818258] to-[#213b37] rounded-3xl overflow-hidden p-12 text-white h-96 flex flex-col justify-between">
                <div className="space-y-4">
                  <Award className="h-16 w-16 text-white/80 float-animation" />
                  <h3 className="text-3xl font-serif font-semibold">
                    Missão
                  </h3>
                  <p className="text-lg font-light text-gray-100">
                    Ser fonte de boas ideias, descomplicando o cotidiano jurídico-empresarial e otimizando a busca por novas oportunidades.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#213b37] text-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-5xl font-serif font-semibold text-center mb-20">
            Por que Nos Escolher?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: 'Inovação Jurídica',
                desc: 'Estratégias modernas combinadas com expertise tradicional.',
                gradient: 'from-[#818258] to-[#bbbd7e]'
              },
              {
                icon: CheckCircle,
                title: 'Resultados Garantidos',
                desc: 'Foco obsessivo em alcançar objetivos estratégicos definidos.',
                gradient: 'from-[#26736b] to-[#0A2C29]'
              },
              {
                icon: Award,
                title: 'Expertise Consolidada',
                desc: 'Profissionais com vasta experiência em casos complexos.',
                gradient: 'from-[#213b37] to-[#0A2C29]'
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className={`bg-gradient-to-br ${feature.gradient} rounded-2xl p-8 slide-in-up`} style={{ animationDelay: `${idx * 0.2}s` }}>
                  <Icon className="h-12 w-12 mb-6 float-animation" style={{ animationDelay: `${idx * 0.2}s` }} />
                  <h3 className="text-2xl font-serif font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-100 font-light leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0A2C29] to-[#213b37] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#818258]/10 rounded-full blur-3xl -z-0" />
        <div className="mx-auto max-w-5xl text-center space-y-12 relative z-10">
          <div className="space-y-6 slide-in-up">
            <h2 className="text-6xl font-serif font-semibold leading-tight">
              Transforme Seus Desafios Jurídicos
            </h2>
            <p className="text-2xl text-gray-300 font-light max-w-3xl mx-auto">
              Em oportunidades de negócio com assessoria estratégica de alta performance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 py-12 slide-in-up">
            {[
              { icon: Mail, label: 'Email', value: 'contato@reinaldoadv.com.br', href: 'mailto:contato@reinaldoadv.com.br' },
              { icon: Phone, label: 'Telefone', value: '(11) 9999-9999', href: 'tel:+5511999999999' },
              { icon: MapPin, label: 'Localização', value: 'São Paulo, SP', href: '#' },
            ].map((contact, idx) => {
              const Icon = contact.icon
              return (
                <a
                  key={idx}
                  href={contact.href}
                  className="p-8 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-all border border-white/20 hover:border-[#818258] group backdrop-blur-sm"
                >
                  <Icon className="h-12 w-12 text-[#818258] mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-lg mb-1">{contact.label}</p>
                  <p className="text-gray-300 text-sm">{contact.value}</p>
                </a>
              )
            })}
          </div>

          <div className="slide-in-up pt-8">
            <Link href="/">
              <Button size="lg" className="bg-[#818258] hover:bg-[#bbbd7e] text-white font-semibold rounded-lg px-8 h-14 pulse-glow">
                Acessar Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A2C29] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-16 pb-16 border-b border-gray-800">
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-semibold text-[#818258]">
                Dr. Reinaldo Gonçalves
              </h3>
              <p className="text-gray-400 font-light text-sm leading-relaxed">
                Assessoria Jurídica Especializada em Direito Corporativo e Consultoria Estratégica
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-[#818258]">Contato</h4>
              <div className="text-gray-400 font-light text-sm space-y-2">
                <p>contato@reinaldoadv.com.br</p>
                <p>(11) 9999-9999</p>
                <p>São Paulo, SP</p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-[#818258]">Navegação</h4>
              <div className="flex flex-col gap-2">
                <Link href="/" className="text-gray-400 hover:text-[#818258] transition font-light text-sm">Dashboard</Link>
                <Link href="#areas" className="text-gray-400 hover:text-[#818258] transition font-light text-sm">Áreas de Atuação</Link>
                <Link href="#" className="text-gray-400 hover:text-[#818258] transition font-light text-sm">Contato</Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-[#818258]">Redes Sociais</h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-[#818258] transition font-light text-sm">LinkedIn</a>
                <a href="#" className="text-gray-400 hover:text-[#818258] transition font-light text-sm">Instagram</a>
              </div>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm font-light">
            <p>&copy; 2025 Dr. Reinaldo Gonçalves. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
