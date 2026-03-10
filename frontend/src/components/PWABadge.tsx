import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PWABadge() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowInstallBanner(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowInstallBanner(false);
        } else {
            // User dismissed the install prompt
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    if (!showInstallBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-amber-500 p-4 z-50 animate-fade-in flex items-start gap-4">
            <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-xl shrink-0">
                <Download className="text-amber-600 dark:text-amber-400" size={24} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-1">Instalar BarberPro</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Adicione o aplicativo à sua tela inicial para acesso rápido e funcionamento offline.
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={handleInstallClick}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors uppercase"
                    >
                        Instalar
                    </button>
                    <button
                        onClick={() => setShowInstallBanner(false)}
                        className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Fechar"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
