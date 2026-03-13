import React from 'react';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from './ui';

/**
 * Componente de erro exibido quando falha ao carregar barbearias
 * Impede loop infinito de requisições mostrando mensagem amigável
 */
export const ShopLoadError: React.FC = () => {
  const { fetchError, retryFetch, isLoadingShops } = useShop();

  if (!fetchError) return null;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-2xl p-8 text-center">
        {/* Ícone de Alerta */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-tenant-primary/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-tenant-primary" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Erro ao Carregar Barbearias
        </h2>

        {/* Mensagem de Erro */}
        <p className="text-gray-400 mb-6">
          {fetchError}
        </p>

        {/* Dicas de Diagnóstico */}
        <div className="bg-gray-900/50 rounded-lg p-4 mb-6 text-left">
          <p className="text-gray-300 text-sm font-semibold mb-2">
            Possíveis soluções:
          </p>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Verifique se o backend está rodando</li>
            <li>• Confirme a URL: <code className="text-tenant-primary">http://localhost:3000</code></li>
            <li>• Verifique se o endpoint existe: <code className="text-tenant-primary">/api/barbershops/public</code></li>
            <li>• Aguarde alguns segundos se ocorreu erro 429</li>
          </ul>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={retryFetch}
            disabled={isLoadingShops}
            className="w-full bg-tenant-primary hover:opacity-90 text-gray-900 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoadingShops ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Tentando novamente...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Tentar Novamente</span>
              </>
            )}
          </Button>

          <a
            href="https://github.com/seu-repo/barberpro/blob/main/TROUBLESHOOTING.md"
            target="_blank"
            rel="nãoopener nãoreferrer"
            className="text-gray-400 hover:text-gray-300 text-sm flex items-center justify-center gap-1 transition-colors"
          >
            <span>Ver guia de troubleshooting</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Informação Técnica (Colapsável) */}
        <details className="mt-6 text-left">
          <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-400 transition-colors">
            Informações técnicas
          </summary>
          <div className="mt-2 bg-gray-900 rounded p-3 text-xs text-gray-400 font-monão">
            <div><strong>Erro:</strong> {fetchError}</div>
            <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
            <div><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</div>
          </div>
        </details>
      </div>
    </div>
  );
};
