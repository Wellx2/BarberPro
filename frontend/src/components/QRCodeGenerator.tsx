import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, X, Copy, Check } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface QRCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  deepLink: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  isOpen, 
  onClose, 
  shopName, 
  deepLink 
}) => {
  const qrRef = useRef<any>(null);
  const { addNotification } = useNotification();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `qrcode-${shopName.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = url;
        link.click();
        addNotification('success', 'QR Code baixado com sucesso!');
      }
    }
  };

  const handlePrint = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow && canvas) {
        const imageData = canvas.toDataURL('image/png');
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>QR Code - ${shopName}</title>
              <style>
                body { 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh;
                  margin: 0;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                  background: white;
                }
                .container {
                  text-align: center;
                  padding: 30px;
                  border: 3px solid #d97706;
                  border-radius: 12px;
                  background: white;
                }
                h1 { 
                  margin: 0 0 20px 0;
                  color: #d97706;
                  font-size: 28px;
                }
                img { 
                  width: 300px;
                  height: 300px;
                  margin: 20px 0;
                  border: 2px solid #d97706;
                  padding: 10px;
                  background: white;
                }
                .link {
                  margin-top: 20px;
                  font-size: 14px;
                  color: #666;
                  word-break: break-all;
                }
                .tips {
                  margin-top: 30px;
                  text-align: left;
                  font-size: 12px;
                  color: #666;
                  border-top: 1px solid #ddd;
                  padding-top: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>${shopName}</h1>
                <p>Aponte sua câmera para agendar!</p>
                <img src="${imageData}" alt="QR Code" />
                <div class="link">
                  <strong>Link:</strong> ${deepLink}
                </div>
                <div class="tips">
                  <strong>Dicas de uso:</strong>
                  <ul>
                    <li>Imprima em tamanho 15x15cm a 50x50cm</li>
                    <li>Cole em local visível na barbearia</li>
                    <li>Certifique-se de boa iluminação</li>
                    <li>Teste a leitura antes de usar</li>
                  </ul>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
        addNotification('info', 'Abrindo visualização de impressão...');
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deepLink).then(() => {
      setCopied(true);
      addNotification('success', 'Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-500 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{shopName}</h2>
            <p className="text-sm text-orange-100 mt-1">Gerar QR Code para agendamentos</p>
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
          {/* QR Code Container */}
          <div className="bg-gray-50 p-6 rounded-lg flex justify-center">
            <div ref={qrRef} className="bg-white p-2 rounded">
              <QRCodeSVG 
                value={deepLink} 
                size={256}
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
          </div>

          {/* Link Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-semibold mb-2">LINK CODIFICADO</p>
            <p className="text-xs text-gray-700 break-all font-mono bg-white p-2 rounded">{deepLink}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <Download size={18} />
              Baixar QR Code (PNG)
            </button>

            <button
              onClick={handlePrint}
              className="w-full bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-50 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <Printer size={18} />
              Imprimir
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              {copied ? 'Link copiado!' : 'Copiar link'}
            </button>
          </div>

          {/* Tips Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-bold text-amber-900 mb-2 text-sm">💡 Dicas de Uso</h4>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>✓ Imprima em tamanho 15x15cm a 50x50cm para melhor leitura</li>
              <li>✓ Cole em local bem visível na barbearia (entrada, recepção)</li>
              <li>✓ Certifique-se de boa iluminação no local</li>
              <li>✓ Teste a leitura do QR em um smartphone antes de usar</li>
              <li>✓ Considere plastificar para proteger a impressão</li>
            </ul>
          </div>

          {/* Size Recommendations */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-3 text-sm">📏 Tamanhos Recomendados</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center">
                <div className="w-16 h-16 border-2 border-amber-400 mx-auto mb-1 flex items-center justify-center">
                  <span className="text-gray-500 text-[10px]">15cm</span>
                </div>
                <p className="text-gray-600 font-semibold">Pequeno<br/>(Adesivos)</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 border-2 border-amber-500 mx-auto mb-1 flex items-center justify-center">
                  <span className="text-gray-500 text-[10px]">30cm</span>
                </div>
                <p className="text-gray-600 font-semibold">Médio<br/>(Recomendado)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
