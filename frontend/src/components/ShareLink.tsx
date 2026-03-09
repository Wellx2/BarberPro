import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useNotification } from '../context/NotificationContext';
import { Copy, Share2, MessageCircle, Mail, X, QrCode } from 'lucide-react';
import { QRCodeGenerator } from './QRCodeGenerator';

interface ShareLinkProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareLink: React.FC<ShareLinkProps> = ({ isOpen, onClose }) => {
  const { shop } = useShop();
  const { addNotification } = useNotification();
  const [copied, setCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  // Gerar slugs para os links
  const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const shopSlug = slugify(shop.name);

  // URLs de compartilhamento
  const subdomainUrl = `https://${shopSlug}.barberpro.com`;
  const queryParamUrl = `${window.location.origin}?shopId=${shop.id}`;
  const whatsappMessage = `Olá! Agende seu corte comigo aqui: ${subdomainUrl}`;
  const emailSubject = `Agende seu corte em ${shop.name}`;
  const emailBody = `Olá!\n\nClique no link abaixo para agendar seu corte em ${shop.name}:\n\n${subdomainUrl}\n\nAbração!`;

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    addNotification('success', 'Link copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsapp = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleShareEmail = () => {
    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailBody);
    window.open(`mailto:?subject=${encodedSubject}&body=${encodedBody}`);
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 text-white p-6 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold">Compartilhar Link</h2>
                <p className="text-sm text-orange-100 mt-1">Convide clientes para {shop.name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-orange-400 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Link Principal (Subdomain) */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-gray-700 tracking-widest">
                  Link Direto (Recomendado)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={subdomainUrl}
                    className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 text-sm font-mono text-xs"
                  />
                  <button
                    onClick={() => handleCopyLink(subdomainUrl)}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                  >
                    <Copy size={16} /> {copied ? 'OK!' : 'Copiar'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  ⭐ Simples, profissional e fácil de lembrar
                </p>
              </div>

              {/* Link Alternativo (Query Param) */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <label className="text-xs font-bold uppercase text-gray-700 tracking-widest">
                  Link Alternativo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={queryParamUrl}
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm font-mono text-xs"
                  />
                  <button
                    onClick={() => handleCopyLink(queryParamUrl)}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-600">Use como backup se o subdomain não funcionar</p>
              </div>

              {/* Botões de Compartilhamento */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                <button
                  onClick={handleShareWhatsapp}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </button>
                <button
                  onClick={handleShareEmail}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Mail size={18} />
                  E-mail
                </button>
                <button
                  onClick={() => setShowQRCode(true)}
                  className="col-span-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <QrCode size={18} />
                  Gerar QR Code
                </button>
              </div>

              {/* Dicas */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-xs font-bold uppercase text-amber-700 mb-3 tracking-widest">💡 Dicas</h3>
                <ul className="text-xs text-amber-800 space-y-2">
                  <li>✓ Compartilhe no WhatsApp, SMS ou redes sociais</li>
                  <li>✓ Envie para sua lista de clientes por e-mail</li>
                  <li>✓ Cole em sua bio do Instagram</li>
                  <li>✓ Gere QR Code para imprimir na barbearia</li>
                </ul>
              </div>
            </div>

            {/* Footer com botão de fechar */}
            <div className="border-t p-4 bg-gray-50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Generator Modal */}
      <QRCodeGenerator 
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        shopName={shop.name}
        deepLink={subdomainUrl}
      />
    </>
  );
};
