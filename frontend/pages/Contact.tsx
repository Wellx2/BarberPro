
import React from 'react';
import { useShop } from '../context/ShopContext';
import { MapPin, Phone, Instagram, Clock, Mail, MessageSquare } from 'lucide-react';

export const Contact: React.FC = () => {
  const { shop } = useShop();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Entre em Contato</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">Estamos prontos para atender você. Tire suas dúvidas, envie sugestões ou venha nos visitar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Contact Info Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Informações</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Endereço</h3>
                <p className="text-gray-600">{shop.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Telefone</h3>
                <p className="text-gray-600">{shop.phone}</p>
              </div>
            </div>

            {/* Fix: Accessing optional social fields from shop object */}
            {shop.socialWhatsapp && (
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-lg text-green-600">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">WhatsApp</h3>
                  <a href={`https://wa.me/${shop.socialWhatsapp}`} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-green-600 hover:underline">
                    {shop.socialWhatsapp}
                  </a>
                </div>
              </div>
            )}

            {/* Fix: Accessing optional social fields from shop object */}
            {shop.socialInstagram && (
              <div className="flex items-start gap-4">
                <div className="bg-pink-100 p-3 rounded-lg text-pink-600">
                  <Instagram size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Instagram</h3>
                  <a href={`https://instagram.com/${shop.socialInstagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-pink-600 hover:underline">
                    {shop.socialInstagram}
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-3 rounded-lg text-gray-600">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Horário de Funcionamento</h3>
                <p className="text-gray-600">
                  Segunda a Sábado: <span className="font-medium">{shop.openingTime} às {shop.closingTime}</span>
                </p>
                <p className="text-gray-500 text-sm">Domingo: Fechado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Mock */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Envie uma Mensagem</h2>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Mensagem enviada com sucesso!'); }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Seu nome completo" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" placeholder="seu@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
              <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Motivo do contato" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none h-32 resize-none" placeholder="Como podemos ajudar?" required></textarea>
            </div>
            <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
              Enviar Mensagem
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
