import React, { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle2, Share, Sparkles, ExternalLink, X, Laptop, Layers } from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk' | 'capacitor'>('pwa');

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      alert('Para instalar no Android pelo Chrome: Toque no menu (três pontos ⋮) no topo do navegador e selecione "Adicionar à tela inicial" ou "Instalar aplicativo".');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base leading-tight">OpenCut para Android</h3>
              <p className="text-xs text-slate-400">Instalação PWA & Opções Nativas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 gap-1">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'pwa'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. PWA Direto (Sem Loja)
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'apk'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Como Gerar APK
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'capacitor'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Capacitor / TWA
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-300">
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium text-xs mb-1">Experiência de App Nativo</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    O OpenCut já está 100% configurado com <strong>Web App Manifest</strong>, <strong>Service Worker</strong> e ícones adaptativos para rodar em tela cheia no Android como um aplicativo instalado.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Passo a passo no Android:</h4>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <div className="w-6 h-6 rounded-full bg-slate-700 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                    <p className="text-xs text-slate-300">Abra este link no <strong>Google Chrome</strong> ou <strong>Samsung Internet</strong> no seu celular Android.</p>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <div className="w-6 h-6 rounded-full bg-slate-700 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                    <p className="text-xs text-slate-300">Toque no botão <strong>"Instalar App no Android"</strong> abaixo ou no menu de 3 pontinhos (⋮) do navegador.</p>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <div className="w-6 h-6 rounded-full bg-slate-700 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                    <p className="text-xs text-slate-300">Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:opacity-90 active:scale-[0.99] transition-all"
              >
                <Download className="w-4 h-4" />
                {isInstalled ? 'App Já Instalado (Abrir)' : 'Instalar App no Android'}
              </button>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <h4 className="text-xs font-semibold text-white mb-1.5 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Gerar APK / AAB para Google Play Store
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Você pode empacotar este projeto como um arquivo <strong>.APK</strong> nativo para Android usando o <strong>PWABuilder</strong> da Microsoft ou <strong>Bubblewrap (TWA)</strong> do Google em menos de 2 minutos:
                </p>
              </div>

              <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside pl-1 space-y-2.5">
                <li className="p-2 bg-slate-950/50 rounded-lg border border-slate-800">
                  Acesse <strong className="text-sky-400">pwabuilder.com</strong> no seu navegador.
                </li>
                <li className="p-2 bg-slate-950/50 rounded-lg border border-slate-800">
                  Cole a URL compartilhada deste app.
                </li>
                <li className="p-2 bg-slate-950/50 rounded-lg border border-slate-800">
                  Clique em <strong>Package for Stores &rarr; Android</strong> para baixar o APK ou código Android Studio pronto com assinatura.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'capacitor' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Para compilar via <strong>Capacitor</strong> localmente no seu computador com Android Studio:
              </p>
              <div className="p-3 bg-black/70 rounded-xl font-mono text-[11px] text-slate-300 space-y-1 border border-slate-800 overflow-x-auto">
                <div className="text-slate-500"># Instalar Capacitor</div>
                <div>npm install @capacitor/core @capacitor/android</div>
                <div>npx cap init OpenCut app.opencut.video</div>
                <div className="text-slate-500 mt-2"># Compilar e abrir no Android Studio</div>
                <div>npm run build</div>
                <div>npx cap add android</div>
                <div>npx cap open android</div>
              </div>
              <p className="text-slate-400 text-[11px]">
                O Android Studio irá abrir o projeto nativo completo em Kotlin/Java para gerar o APK assinado.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
