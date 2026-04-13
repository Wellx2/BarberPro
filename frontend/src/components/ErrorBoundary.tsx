import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Você também pode registrar o erro em um serviço de relatórios de erros (ex: Sentry)
    console.error('Um erro foi capturado pelo ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-lg w-full border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ops, tivemos uma instabilidade visual!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              A aplicação encontrou um problema inesperado ao renderizar esta tela. Nossa equipe já deve estar verificando, mas você pode tentar recarregar a página para continuar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 bg-tenant-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
              >
                <RefreshCcw size={18} />
                Recarregar Página
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                <Home size={18} />
                Início
              </button>
            </div>

            {/* Apenas para desenvolvimento: Exibe sutilmente a stack do erro para debugar */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-8 text-left bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs text-red-500 font-mono">
                <p className="font-bold mb-1">{this.state.error.toString()}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
