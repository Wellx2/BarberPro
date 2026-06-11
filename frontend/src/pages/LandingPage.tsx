import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scissors, BarChart3, Users, Zap, CheckCircle2, 
  ChevronDown, ArrowRight, ShieldCheck, Smartphone,
  Play, Star, TrendingUp, Clock, Target, AlertTriangle, Check
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Klyp Barber | O Sistema Definitivo para Barbearias Lucrativas";
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      {/* HEADER / NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-2 rounded-xl shadow-lg shadow-orange-500/20">
              <Scissors className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight uppercase">Klyp<span className="text-orange-500">Barber</span></span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#problema" className="hover:text-white transition-colors">O Desafio</a>
            <a href="#solucao" className="hover:text-white transition-colors">A Solução</a>
            <a href="#oferta" className="hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="hover:text-white transition-colors">Dúvidas</a>
            <Link to="/explore" className="text-orange-400 hover:text-orange-300 font-bold transition-colors flex items-center gap-1 ml-4 border-l border-white/10 pl-8">
              Encontrar Barbearias
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-sm font-bold text-gray-300 hover:text-orange-500 transition-colors">
              Acessar Painel
            </Link>
            <a 
              href="#planos" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95 text-center"
            >
              Começar Agora
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION - The Hook & Promise */}
      <main>
        <section className="relative pt-40 pb-24 overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-40">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full mb-8">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-black text-orange-500 uppercase tracking-widest">A Nova Era da Gestão de Barbearias</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
                Quebre o teto de faturamento da sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">barbearia.</span>
              </h1>
              <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                O Klyp Barber é o parceiro de crescimento que analisa o histórico dos seus clientes e te diz exatamente <strong>o que vender e para quem vender</strong>, multiplicando seus lucros.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a 
                  href="#planos" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-orange-500/20 text-center"
                >
                  Quero Aumentar Meus Lucros <ArrowRight size={22} strokeWidth={3} />
                </a>
                <a href="#solucao" className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                  <Play size={20} fill="currentColor" /> Entender a Mágica
                </a>
              </div>
              
              <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 lg:gap-6 justify-center lg:justify-start border-t border-white/10 pt-8">
                <div className="flex -space-x-3">
                  <div className="w-12 h-12 rounded-full border-2 border-[#050505] bg-gray-800 flex items-center justify-center text-gray-400">
                    <Scissors size={20} />
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-[#050505] bg-orange-500 flex items-center justify-center text-xs font-black text-white">
                    PRO
                  </div>
                </div>
                <div className="text-sm text-gray-400 text-center sm:text-left">
                  <div className="flex text-orange-400 mb-1 justify-center sm:justify-start">
                    <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
                  </div>
                  <span className="text-white font-bold">Sistema premium</span> validado por profissionais exigentes.
                </div>
              </div>
            </div>

            {/* Dashboard / Video Mockup */}
            <div className="relative z-10 w-full max-w-2xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-[2.5rem] blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gray-900 border border-white/10 rounded-[2rem] p-2 shadow-2xl">
                <div className="bg-black rounded-3xl overflow-hidden relative aspect-[4/3]">
                  {/* Dashboard Mockup Image */}
                  <img 
                    src="/landing-dashboard.png" 
                    alt="Klyp Barber Dashboard" 
                    className="w-full h-full object-cover object-top opacity-80"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1000';
                    }}
                  />
                  {/* Floating Elements to show value */}
                  <div className="absolute top-6 right-6 bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 animate-bounce">
                    <AlertTriangle size={16} /> Alerta: 3 clientes sumindo!
                  </div>
                  <div className="absolute bottom-6 left-6 bg-green-500/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                    <TrendingUp size={16} /> +R$ 2.450 retidos este mês
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AGITATION - The Problem Section */}
        <section id="problema" className="py-24 bg-black border-y border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Você corta muito bem, mas <span className="text-red-500 underline decoration-red-500/30 underline-offset-8">a conta não fecha.</span></h2>
            <p className="text-xl text-gray-400 mb-16">Se você respondeu SIM para qualquer uma dessas situações, você está deixando dinheiro na mesa todos os dias:</p>
            
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="bg-white/5 p-8 rounded-3xl border border-red-500/20 hover:border-red-500/50 transition-colors">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <Clock className="text-red-500 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">A Cadeira Fica Vazia</h3>
                <p className="text-gray-400">Clientes marcam e não aparecem. Ou pior, você fica horas ociosas no meio da semana esperando o movimento.</p>
              </div>
              <div className="bg-white/5 p-8 rounded-3xl border border-red-500/20 hover:border-red-500/50 transition-colors">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="text-red-500 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">O Teto de Faturamento</h3>
                <p className="text-gray-400">Você bateu no teto. Só ganha dinheiro quando está cortando cabelo. Perde a chance de vender produtos ou serviços extras (como barba e pomadas) por não saber o momento certo de oferecer.</p>
              </div>
              <div className="bg-white/5 p-8 rounded-3xl border border-red-500/20 hover:border-red-500/50 transition-colors">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 className="text-red-500 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">O Faturamento é Cego</h3>
                <p className="text-gray-400">Você não sabe qual serviço dá mais lucro, não controla o estoque de produtos e na hora do rateio das comissões é uma dor de cabeça.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTION - The Product Features translated to Benefits */}
        <section id="solucao" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-block bg-green-500/10 text-green-500 font-bold px-4 py-1 rounded-full mb-4 uppercase tracking-widest text-sm">
                A Solução Definitiva
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Conheça a Máquina de Gestão <br/><span className="text-orange-500">Klyp Barber</span></h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">Nós automatizamos as partes chatas para você focar no que faz de melhor: cortar cabelo e escalar seu negócio.</p>
            </div>

            <div className="space-y-24">
              {/* Feature 1: Predictive BI */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 relative group">
                  <div className="absolute -inset-4 bg-orange-500/20 blur-3xl rounded-full"></div>
                  <div className="relative bg-gray-900 border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-6">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <Target className="text-orange-500 w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Alerta de Risco (Churn)</h4>
                        <p className="text-sm text-gray-400">Análise de IA Preditiva</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-black border border-red-500/30 p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-red-400">João Silva</p>
                          <p className="text-xs text-gray-500">Atraso de 8 dias na rotina</p>
                        </div>
                        <button className="bg-red-500/20 text-red-500 px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer">Enviar Promoção</button>
                      </div>
                      <div className="bg-black border border-yellow-500/30 p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-yellow-400">Carlos Eduardo</p>
                          <p className="text-xs text-gray-500">Atraso de 4 dias na rotina</p>
                        </div>
                        <button className="bg-yellow-500/20 text-yellow-500 px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-yellow-500 hover:text-black transition-colors cursor-pointer">Lembrar</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <h3 className="text-3xl font-bold mb-4">Inteligência Preditiva: <span className="text-gray-400">Seu cão de guarda.</span></h3>
                  <p className="text-lg text-gray-400 mb-6 leading-relaxed">
                    O sistema aprende a rotina de cada cliente. Se o João corta o cabelo a cada 20 dias, no 21º dia sem agendamento o sistema te avisa. 
                    Com um clique, você envia uma mensagem oferecendo desconto no serviço e traz o João de volta. <strong className="text-white">Dinheiro que ia ser perdido, direto para o caixa.</strong>
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="text-orange-500 w-5 h-5 flex-shrink-0" /> Identificação de clientes em risco</li>
                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="text-orange-500 w-5 h-5 flex-shrink-0" /> Histórico inteligente de frequência</li>
                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="text-orange-500 w-5 h-5 flex-shrink-0" /> Aumento de retenção em até 40%</li>
                  </ul>
                </div>
              </div>

              {/* Feature 2: Financial Management */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-4">Gestão Financeira & Comissões: <span className="text-gray-400">Zero dores de cabeça.</span></h3>
                  <p className="text-lg text-gray-400 mb-6 leading-relaxed">
                    Esqueça o caderno e o Excel. O sistema calcula automaticamente a comissão de cada barbeiro, descontando as taxas do cartão e o custo dos produtos. Fechamento de caixa em 30 segundos, sem brigas.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="text-orange-500 w-5 h-5 flex-shrink-0" /> Rateio automático de taxas de cartão</li>
                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="text-orange-500 w-5 h-5 flex-shrink-0" /> Extrato individual para cada barbeiro</li>
                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="text-orange-500 w-5 h-5 flex-shrink-0" /> Controle de entrada e saída de caixa</li>
                  </ul>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full"></div>
                  <div className="relative bg-gray-900 border border-white/10 p-8 rounded-3xl shadow-2xl">
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-black rounded-2xl p-4 border border-white/5">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Faturamento Hoje</p>
                          <p className="text-2xl font-bold text-white">R$ 1.240</p>
                        </div>
                        <div className="bg-black rounded-2xl p-4 border border-white/5">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Comissões Pagar</p>
                          <p className="text-2xl font-bold text-orange-500">R$ 580</p>
                        </div>
                     </div>
                     <div className="bg-black border border-white/5 rounded-2xl p-4">
                        <p className="text-sm font-bold mb-4">Barbeiros</p>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-400">Marcos (50%)</span>
                          <span className="text-sm font-bold text-green-400">R$ 310,00</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Felipe (40%)</span>
                          <span className="text-sm font-bold text-green-400">R$ 270,00</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Feature 3: Cross-sell / Upsell */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 relative group">
                  <div className="absolute -inset-4 bg-green-500/20 blur-3xl rounded-full"></div>
                  <div className="relative bg-gray-900 border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-6">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="text-green-500 w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Sugestão de Vendas (Upsell)</h4>
                        <p className="text-sm text-gray-400">Aumente seu Ticket Médio</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-black border border-green-500/30 p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-green-400">Oportunidade: Lucas</p>
                          <p className="text-xs text-gray-500">Cortou cabelo. Sugira fazer a barba hoje.</p>
                        </div>
                        <button className="bg-green-500/20 text-green-500 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer hover:bg-green-500 hover:text-black transition-colors">Oferecer</button>
                      </div>
                      <div className="bg-black border border-green-500/30 p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-green-400">Oportunidade: Marcos</p>
                          <p className="text-xs text-gray-500">Relatou caspa. Oferecer Shampoo Anticaspa.</p>
                        </div>
                        <button className="bg-green-500/20 text-green-500 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer hover:bg-green-500 hover:text-black transition-colors">Vender Produto</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <h3 className="text-3xl font-bold mb-4">Aumento de Ticket Médio: <span className="text-gray-400">Venda no momento certo.</span></h3>
                  <p className="text-lg text-gray-400 mb-6 leading-relaxed">
                    Não dependa apenas do corte de cabelo. O Klyp Barber analisa o que o cliente consome e te dá o roteiro do que vender. Se o cliente só corta o cabelo, ofereça a barba. Se ele tem caspa, indique o shampoo. Multiplique o faturamento com os mesmos clientes.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="text-orange-500 w-5 h-5 flex-shrink-0" /> Indicações automáticas de serviços extras</li>
                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="text-orange-500 w-5 h-5 flex-shrink-0" /> Histórico detalhado de compras do cliente</li>
                    <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="text-orange-500 w-5 h-5 flex-shrink-0" /> Quebre o teto de faturamento vendendo produtos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THE OFFER - Hormozi Value Stack */}
        <section id="oferta" className="py-24 bg-gradient-to-b from-[#050505] to-gray-900 border-t border-white/5 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black mb-6">A Oferta <span className="text-orange-500">Irrecusável</span></h2>
              <p className="text-xl text-gray-400">Veja o que você leva ao assinar o Klyp Barber hoje:</p>
            </div>

            <div className="bg-black border border-orange-500/30 rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-orange-500/10">
              <div className="space-y-6 mb-10">
                {[
                  { title: "Sistema de Agendamento Online VIP 24/7", value: "R$ 97/mês", desc: "Seus clientes marcam sozinhos, sem você precisar largar a tesoura." },
                  { title: "Módulo de Inteligência Preditiva (Anti-Churn)", value: "R$ 197/mês", desc: "A tecnologia que avisa quem está parando de vir na sua barbearia." },
                  { title: "Dashboard Financeiro e de Comissões", value: "R$ 147/mês", desc: "Cálculos automáticos que evitam erros e conflitos na equipe." },
                  { title: "BÔNUS: Acesso Exclusivo para sua Equipe", value: "R$ 97/mês", desc: "Cada barbeiro tem seu login para ver sua própria agenda e metas." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start pb-6 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="bg-green-500/20 p-2 rounded-full mt-1">
                      <Check className="w-5 h-5 text-green-500" strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold">{item.title}</h4>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-gray-500 line-through">Valor real</p>
                      <p className="font-bold text-gray-300">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* ── Cards de Planos — fora do card interno, usa todo max-w-6xl ── */}
            <div id="planos" className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch scroll-mt-28">
              {/* PLAN 1: PLUS */}
              <div className="bg-[#0b0b0b] border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-orange-500/30 transition-all text-left">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Klyp Barber PLUS</h3>
                  <p className="text-sm text-gray-500 mb-6 font-medium">Perfeito para equipes pequenas que estão começando a crescer.</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-5xl font-black text-white">R$ 79</span>
                    <span className="text-base text-gray-400">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-gray-300 font-medium">
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Até 6 barbeiros ativos</li>
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Agendamento Online 24/7</li>
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Controle de Caixa & Vendas</li>
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Produtos & Controle de Estoque</li>
                  </ul>
                </div>
                <Link
                  to="/checkout?plan=plus"
                  className="block w-full text-center bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl font-bold text-sm transition-all"
                >
                  Começar com Plus
                </Link>
              </div>

              {/* PLAN 2: PRO — destaque sem scale que espreme */}
              <div className="bg-black border-2 border-orange-500 rounded-3xl p-8 flex flex-col justify-between relative shadow-2xl shadow-orange-500/20 z-10 text-left ring-1 ring-orange-500/20">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black uppercase tracking-widest px-5 py-2 rounded-full shadow-lg whitespace-nowrap">
                  ⚡ Super Promoção (40% OFF)
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold mb-2 text-orange-400">Klyp Barber PRO</h3>
                  <p className="text-sm text-gray-400 mb-6 font-medium">O plano mais completo para escalar o faturamento da sua barbearia.</p>
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 line-through">De R$ 125,00/mês</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-white">R$ 89</span>
                      <span className="text-base text-gray-400">/mês</span>
                    </div>
                    <p className="text-xs text-orange-400 font-bold mt-1">Preço promocional válido por tempo limitado!</p>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-gray-300 font-medium">
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Até 20 barbeiros ativos</li>
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Inteligência Preditiva (Anti-Churn)</li>
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Caixa & Relatórios Financeiros PRO</li>
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Painel de Comissões Automatizado</li>
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Suporte Prioritário por WhatsApp</li>
                  </ul>
                </div>
                <Link
                  to="/checkout?plan=pro"
                  className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-black text-sm transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
                >
                  Garantir Promoção Pro
                </Link>
              </div>

              {/* PLAN 3: MASTER */}
              <div className="bg-[#0b0b0b] border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-orange-500/30 transition-all text-left">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Klyp Barber MASTER</h3>
                  <p className="text-sm text-gray-500 mb-6 font-medium">Para redes, franquias ou grandes barbearias que exigem o máximo.</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-5xl font-black text-white">R$ 149</span>
                    <span className="text-base text-gray-400">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-gray-300 font-medium">
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Barbeiros ativos ilimitados</li>
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Custom Branding (Logotipo próprio)</li>
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Gerente de Conta Dedicado</li>
                    <li className="flex items-center gap-2"><Check className="text-orange-500 w-4 h-4 shrink-0" /> Suporte VIP 24h & Migração de dados</li>
                  </ul>
                </div>
                <Link
                  to="/checkout?plan=master"
                  className="block w-full text-center bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl font-bold text-sm transition-all"
                >
                  Começar com Master
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* RISK REVERSAL (Guarantee) */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto bg-white border border-gray-200 text-black rounded-[2rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
            <ShieldCheck className="w-24 h-24 text-green-500 mx-auto mb-8 opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[3]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-6 text-gray-900">O Risco é 100% Nosso. Garantia Incondicional de 7 Dias.</h2>
              <p className="text-xl text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto mb-8">
                Teste o Klyp Barber na prática. Configure sua barbearia, adicione seus profissionais e envie seu link de agendamento. 
                Se em 7 dias você não achar que o sistema te salvou horas de trabalho e ajudou a faturar mais, aperte um botão e devolvemos cada centavo. 
                Sem perguntas, sem enrolação.
              </p>
              <p className="font-bold text-gray-900 text-xl border-t border-gray-200 pt-8 mt-8">Você literalmente não tem nada a perder.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 px-6 bg-[#050505]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-16 text-center">Dúvidas Frequentes</h2>
            <div className="space-y-4">
              {[
                { q: "Eu sou ruim com tecnologia, consigo usar?", a: "Sim. Criamos o Klyp Barber pensando exatamente em quem não quer perder tempo com softwares complexos. Em 5 minutos você já configura e começa a usar." },
                { q: "O cliente precisa baixar algum aplicativo?", a: "NÃO! Isso é um erro fatal que destrói suas conversões. O agendamento é feito via link direto (você coloca na bio do Instagram ou manda no WhatsApp). Ele abre no navegador do celular, rápido e fácil." },
                { q: "Tenho mais de 5 barbeiros, o sistema aguenta?", a: "Temos barbearias com mais de 20 profissionais faturando múltiplos 6 dígitos usando nosso sistema. A plataforma não trava e escala com você." },
                { q: "Tem suporte caso eu precise de ajuda?", a: "Sim, suporte humanizado pelo WhatsApp. Sem robôs que não entendem seu problema." },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-colors">
                  <button 
                    onClick={() => toggleFaq(i)}
                    className="w-full p-6 text-left flex items-center justify-between group"
                  >
                    <span className="font-bold text-lg">{item.q}</span>
                    <ChevronDown className={`w-6 h-6 transition-transform ${activeFaq === i ? 'rotate-180 text-orange-500' : 'text-gray-500'}`} />
                  </button>
                  <div 
                    className={`px-6 transition-all duration-300 ease-in-out ${
                      activeFaq === i ? 'pb-6 max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                  >
                    <p className="text-gray-400 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-32 px-6 relative overflow-hidden bg-orange-600">
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tight">O Tempo Está Passando.</h2>
            <p className="text-2xl text-white/90 mb-12 font-medium">Cada dia sem o Klyp Barber é um cliente que foi cortar em outra barbearia e você não sabe.</p>
            <a 
              href="#planos" 
              className="inline-flex items-center justify-center bg-black text-white px-12 py-6 rounded-2xl font-black text-2xl hover:bg-gray-900 hover:scale-105 transition-all shadow-2xl text-center"
            >
              TESTAR GRÁTIS AGORA <ArrowRight className="ml-2" size={28} />
            </a>
            <div className="mt-10">
              <p className="text-sm text-black/70 font-black uppercase tracking-widest bg-white/20 inline-block px-6 py-2 rounded-full">
                🛡️ Garantia de 7 dias ou seu dinheiro de volta
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-8 justify-between items-center text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-orange-500" />
            <span className="font-bold uppercase tracking-tight text-white">Klyp<span className="text-orange-500">Barber</span></span>
          </div>
          <div className="flex gap-8">
            <Link to="/terms" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Políticas de Privacidade</Link>
            <a href="https://wa.me/5511999999999?text=Olá,%20tenho%20interesse%20no%20Klyp%20Barber!" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Suporte WhatsApp</a>
          </div>
          <p>&copy; {new Date().getFullYear()} Klyp Barber. Todos os direitos reservados.</p>
        </div>
      </footer>

      <style>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};
