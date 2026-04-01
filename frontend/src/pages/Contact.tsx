import React from 'react';
import { useShop } from '../context/ShopContext';
import { 
  MapPin, Phone, Instagram, Clock, Mail, 
  MessageSquare, ExternalLink, ShieldCheck, Star 
} from 'lucide-react';

export const Contact: React.FC = () => {
  const { shop } = useShop();

  const handleWhatsApp = () => {
    const number = shop.socialWhatsapp || shop.whatsapp || shop.phone;
    window.open(`https://wa.me/${number.replace(/\D/g, '')}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-10 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
          Canais de Atendimento
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
          Escolha como deseja falar conosco. Temos canais específicos para a unidade e para suporte da plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Unidade Info - Coluna da Esquerda (2/3 no desktop) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-900 p-6 sm:p-10 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <MapPin size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-tenant-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-tenant-primary/20">
                  <MapPin size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Atendimento Local</h2>
                  <p className="text-tenant-primary font-bold text-xs uppercase tracking-widest mt-1">{shop.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Dados da Loja */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Localização</h3>
                    <p className="text-gray-700 dark:text-gray-300 font-bold leading-relaxed">
                      {shop.address}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contatos</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <Phone size={18} className="text-tenant-primary" />
                        <span className="font-bold">{shop.phone}</span>
                      </div>
                      {(shop.socialWhatsapp || shop.whatsapp) && (
                        <button 
                          onClick={handleWhatsApp}
                          className="flex items-center gap-3 text-green-600 hover:text-green-700 font-black transition-colors"
                        >
                          <MessageSquare size={18} />
                          <span>Fale no WhatsApp</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Redes Sociais</h3>
                    <div className="flex flex-wrap gap-3">
                      {shop.socialInstagram && (
                        <a 
                          href={`https://instagram.com/${shop.socialInstagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-900/10 text-pink-600 rounded-xl font-bold text-xs hover:bg-pink-100 transition-colors"
                        >
                          <Instagram size={16} />
                          Instagram
                        </a>
                      )}
                      {shop.socialGoogleReview && (
                        <a 
                          href={shop.socialGoogleReview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"
                        >
                          <Star size={16} />
                          Avaliações Google
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Horários */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white font-black uppercase text-sm">
                    <Clock size={16} className="text-tenant-primary" />
                    Horário de Funcionamento
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-bold text-gray-500 uppercase">Segunda a Sábado</span>
                      <span className="text-xs font-black text-gray-900 dark:text-white uppercase">{shop.openingTime} - {shop.closingTime}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs font-bold text-gray-500 uppercase">Domingo</span>
                      <span className="text-xs font-black text-red-500 uppercase tracking-widest">Fechado</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase leading-relaxed text-center italic">
                    * Os horários podem sofrer alterações em feriados.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de Mensagem */}
          <div className="bg-white dark:bg-gray-900 p-6 sm:p-10 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">Envie uma Mensagem Direta</h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); alert('Mensagem enviada com sucesso!'); }}>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Seu Nome</label>
                <input type="text" className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-tenant-primary outline-none font-bold text-sm" placeholder="Nome completo" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail para Retorno</label>
                <input type="email" className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-tenant-primary outline-none font-bold text-sm" placeholder="seu@email.com" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Sua Mensagem</label>
                <textarea className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-tenant-primary outline-none h-32 resize-none font-bold text-sm" placeholder="Como podemos te ajudar?" required></textarea>
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="w-full bg-gray-900 dark:bg-tenant-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-gray-200 dark:shadow-none">
                  Enviar Mensagem para Unidade
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Suporte Plataforma - Coluna da Direita (1/3) */}
        <div className="space-y-6">
          <div className="bg-gray-900 dark:bg-tenant-primary text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck size={100} />
            </div>
            
            <div className="relative z-10 font-black">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xl uppercase tracking-tight mb-2">Suporte KlypBarber</h2>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
                Relate problemas técnicos ou dúvidas sobre sua conta na plataforma.
              </p>

              <div className="space-y-4">
                <a 
                  href="mailto:suporte@klypbarber.com.br"
                  className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors group/item"
                >
                  <Mail size={18} />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-widest opacity-60">E-mail de Suporte</p>
                    <p className="text-xs">suporte@klypbarber.com.br</p>
                  </div>
                  <ExternalLink size={14} className="opacity-40 group-hover/item:opacity-100" />
                </a>

                <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl">
                  <Clock size={18} />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-widest opacity-60">Horário Suporte</p>
                    <p className="text-xs">Seg a Sex: 09h às 18h</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[9px] uppercase tracking-widest opacity-50 text-center leading-relaxed font-bold">
                  KlypBarber é uma plataforma SaaS<br />
                  Tecnologia para barbearias premium
                </p>
              </div>
            </div>
          </div>

          <div className="bg-tenant-primary/5 dark:bg-gray-800/50 p-6 rounded-3xl border border-tenant-primary/10 dark:border-gray-700 text-center">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-2">Dúvidas Frequentes?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-4">
              Confira nossa central de ajuda rápida.
            </p>
            <button className="text-tenant-primary font-black uppercase text-[10px] tracking-widest hover:underline">
              Acessar FAQ &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
