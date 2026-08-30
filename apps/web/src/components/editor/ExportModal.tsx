import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  Film, 
  Share2, 
  Loader2,
  HardDrive
} from 'lucide-react';
import type { Project } from '../../types/editor';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4K'>(project.resolution || '1080p');
  const [fps, setFps] = useState<number>(30);
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsRendering(false);
      setProgress(0);
      setDownloadUrl(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartExport = () => {
    setIsRendering(true);
    setProgress(5);

    // Simulate real-time client-side rendering pipeline
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(interval);
          setIsRendering(false);
          // Set downloadable blob or sample clip
          setDownloadUrl(project.videoClips[0]?.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
          return 100;
        }
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 200);
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-${resolution}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.name,
          text: `Vídeo editado com OpenCut (${resolution})`,
          url: window.location.href,
        });
      } catch (_) {}
    } else {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Exportar Vídeo</h3>
              <p className="text-[11px] text-slate-400">Renderização em alta resolução</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {!downloadUrl ? (
            <>
              {/* Resolution options */}
              <div>
                <label className="text-slate-300 font-semibold block mb-2">Qualidade do Vídeo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['720p', '1080p', '4K'] as const).map((res) => (
                    <button
                      key={res}
                      disabled={isRendering}
                      onClick={() => setResolution(res)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        resolution === res
                          ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-bold ring-1 ring-sky-500'
                          : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-mono">{res}</div>
                      <span className="text-[10px] text-slate-400">
                        {res === '720p' ? 'HD Rápido' : res === '1080p' ? 'Full HD Padrão' : 'Ultra HD'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Framerate & Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">Taxa de Quadros</label>
                  <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                    {[30, 60].map((f) => (
                      <button
                        key={f}
                        disabled={isRendering}
                        onClick={() => setFps(f)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          fps === f
                            ? 'bg-sky-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {f} FPS
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">Formato</label>
                  <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                    {(['mp4', 'webm'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        disabled={isRendering}
                        onClick={() => setFormat(fmt)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono uppercase transition-all ${
                          format === fmt
                            ? 'bg-sky-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estimated size */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tamanho estimado:</span>
                </div>
                <span className="font-mono text-slate-200 font-semibold">
                  {resolution === '720p' ? '~18 MB' : resolution === '1080p' ? '~38 MB' : '~120 MB'}
                </span>
              </div>

              {/* Progress bar when rendering */}
              {isRendering && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Renderizando frames...
                    </span>
                    <span className="font-mono font-bold">{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Export Trigger Button */}
              <button
                onClick={handleStartExport}
                disabled={isRendering}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all"
              >
                {isRendering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando Vídeo ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Iniciar Renderização</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Success & Download state */
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white mb-1">Vídeo Pronto!</h4>
                <p className="text-slate-400 text-xs">
                  {project.name} • {resolution} {fps}FPS
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleDownload}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar no Celular / Computador</span>
                </button>

                <button
                  onClick={handleShare}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartilhar Vídeo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
