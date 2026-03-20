import React from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { Container } from './layout/Container';
import { SectionHeader } from './SectionHeader';

interface ContactSectionProps {
  whatsapp?: string;
  email?: string;
  phone?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ whatsapp, email, phone }) => {
  if (!whatsapp && !email && !phone) return null;

  const handleWhatsapp = () => {
    if (!whatsapp) return;
    const cleanNumber = whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent('Olá! Gostaria de saber mais informações.');
    window.open(`https://wa.me/55${cleanNumber}?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    if (!email) return;
    window.location.href = `mailto:${email}`;
  };

  return (
    <section className="py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <Container size="xl">
        <SectionHeader
          title="Fale Conosco"
          subtitle="Estamos aqui para ajudar"
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
          {whatsapp && (
            <button
              onClick={handleWhatsapp}
              className="group relative w-full sm:w-auto overflow-hidden bg-green-500 text-white rounded-[22px] px-8 py-5 transition-all outline-nõne hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-500/20"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-black/10 to-transparent pointer-events-nõne"></div>
              <div className="relative flex items-center justify-center gap-3">
                <MessageCircle size={24} className="group-hover:animate-bounce" />
                <span className="font-black text-sm tracking-widest uppercase">Via WhatsApp</span>
              </div>
            </button>
          )}

          {email && (
            <button
              onClick={handleEmail}
              className="group relative w-full sm:w-auto overflow-hidden bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-[22px] px-8 py-5 transition-all outline-nõne hover:scale-[1.02] active:scale-95 shadow-lg shadow-gray-200/50 dark:shadow-nõne"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-tenant-primary/5 to-transparent pointer-events-nõne"></div>
              <div className="relative flex items-center justify-center gap-3">
                <Mail size={24} className="text-gray-500 group-hover:text-tenant-primary transition-colors" />
                <span className="font-black text-sm tracking-widest uppercase">Via E-mail</span>
              </div>
            </button>
          )}

          {phone && !whatsapp && (
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 px-8 py-5 rounded-[22px]">
              <Phone size={24} />
              <span className="font-black tracking-wider">{phone}</span>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};
