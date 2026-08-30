import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Smartphone, 
  Film, 
  Sparkles, 
  Clock, 
  Trash2, 
  Play, 
  Download, 
  Scissors, 
} from 'lucide-react';
import type { AspectRatioType, Project } from '../types/editor';
import { INITIAL_PROJECT } from '../lib/sampleMedia';
import { AndroidInstallModal } from '../components/editor/AndroidInstallModal';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('opencut_projects_list');
      if (saved) {
        try {
          setProjects(JSON.parse(saved));
        } catch (_) {}
      } else {
        setProjects([INITIAL_PROJECT]);
        localStorage.setItem('opencut_projects_list', JSON.stringify([INITIAL_PROJECT]));
      }
    }
  }, []);

  const handleCreateNewProject = (ratio: AspectRatioType) => {
    const newProject: Project = {
      ...INITIAL_PROJECT,
      id: `proj-${Date.now()}`,
      name: `Projeto ${ratio} (${new Date().toLocaleDateString('pt-BR')})`,
      aspectRatio: ratio,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newProject, ...projects];
    setProjects(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('opencut_projects_list', JSON.stringify(updated));
      localStorage.setItem('opencut_current_project', JSON.stringify(newProject));
    }

    navigate({ to: '/editor' });
  };

  const handleOpenProject = (project: Project) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('opencut_current_project', JSON.stringify(project));
    }
    navigate({ to: '/editor' });
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filtered = projects.filter((p) => p.id !== id);
    setProjects(filtered);
    if (typeof window !== 'undefined') {
      localStorage.setItem('opencut_projects_list', JSON.stringify(filtered));
    }
  };

  const formats: { ratio: AspectRatioType; label: string; sub: string; icon: string; badge: string }[] = [
    {
      ratio: '9:16',
      label: 'Shorts & Reels',
      sub: 'TikTok, Instagram, YouTube Shorts',
      icon: '📱',
      badge: 'Mais Popular',
    },
    {
      ratio: '16:9',
      label: 'YouTube & TV',
      sub: 'Vídeos horizontais widescreen 1080p/4K',
      icon: '🖥️',
      badge: 'Paisagem',
    },
    {
      ratio: '1:1',
      label: 'Feed Quadrado',
      sub: 'Instagram, Facebook, LinkedIn',
      icon: '🔲',
      badge: 'Quadrado',
    },
    {
      ratio: '4:5',
      label: 'Retrato Feed',
      sub: 'Carrosséis e anúncios verticais',
      icon: '📸',
      badge: 'Retrato',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <span className="font-extrabold text-sm tracking-tight">OC</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-white tracking-tight leading-none">OpenCut</h1>
              <span className="px-1.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold">
                ANDROID APP
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Editor de Vídeo Profissional</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500/15 to-indigo-500/15 hover:from-sky-500/25 hover:to-indigo-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Smartphone className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Instalar no Android</span>
            <span className="sm:hidden">Instalar</span>
          </button>

          <button
            onClick={() => handleCreateNewProject('9:16')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Vídeo</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Android Native Banner */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-sky-500/10 to-transparent pointer-events-none" />
          
          <div className="max-w-2xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Otimizado para Telas de Toque & Android</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Edite vídeos com velocidade direto no seu celular ou navegador
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Corte, divida, aplique filtros cinematográficos, adicione músicas e exporte em alta resolução sem marca d'água. Instale como aplicativo nativo no Android com 1 toque.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/25 transition-all active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Como Instalar no Celular</span>
              </button>
              <button
                onClick={() => handleCreateNewProject('9:16')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-colors"
              >
                <Film className="w-4 h-4 text-sky-400" />
                <span>Abrir Editor Completo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Create by Format Selection */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              Criar Novo Projeto por Formato
            </h2>
            <span className="text-xs text-slate-400">Escolha a proporção ideal</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {formats.map((fmt) => (
              <button
                key={fmt.ratio}
                onClick={() => handleCreateNewProject(fmt.ratio)}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 text-left transition-all duration-200 group flex flex-col justify-between h-36 shadow-md hover:shadow-sky-500/10 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between w-full">
                  <span className="text-2xl">{fmt.icon}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 font-semibold border border-slate-700">
                    {fmt.ratio}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                    {fmt.label}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {fmt.sub}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Projects */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Projetos Recentes
            </h2>
            <span className="text-xs text-slate-400">{projects.length} projeto(s)</span>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => handleOpenProject(proj)}
                  className="rounded-2xl bg-slate-900 border border-slate-800/90 overflow-hidden hover:border-sky-500/40 transition-all cursor-pointer group shadow-lg flex flex-col"
                >
                  {/* Thumbnail Banner */}
                  <div className="h-32 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                    {proj.videoClips[0]?.thumbnail ? (
                      <img
                        src={proj.videoClips[0].thumbnail}
                        alt={proj.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-60"
                      />
                    ) : (
                      <Film className="w-8 h-8 text-slate-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-sky-300 font-bold border border-white/10">
                      {proj.aspectRatio}
                    </div>

                    <div className="w-10 h-10 rounded-full bg-sky-500/90 text-slate-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 group-hover:scale-100">
                      <Play className="w-4 h-4 ml-0.5 fill-slate-950" />
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-white group-hover:text-sky-300 transition-colors truncate">
                        {proj.name}
                      </h4>
                      <button
                        onClick={(e) => handleDeleteProject(e, proj.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
                        title="Excluir Projeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 mt-2">
                      <span>{proj.videoClips.length} clipes • {proj.duration}s</span>
                      <span className="text-sky-400 font-semibold flex items-center gap-1">
                        Editar &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
              <Film className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Nenhum projeto recente salvo</p>
              <button
                onClick={() => handleCreateNewProject('9:16')}
                className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Primeiro Projeto</span>
              </button>
            </div>
          )}
        </section>

        {/* Feature Grid */}
        <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-300">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              <Scissors className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Cortes & Divisões Rápidos</h4>
            <p className="text-slate-400 leading-relaxed">
              Arraste a linha do tempo e divida clipes com precisão milimétrica em qualquer dispositivo touch.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Filtros & Legendas</h4>
            <p className="text-slate-400 leading-relaxed">
              Efeitos cinematográficos, cyberpunk, vintage, controle de brilho, saturação e textos animados.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Download className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Exportação Direta</h4>
            <p className="text-slate-400 leading-relaxed">
              Exporte em Full HD (1080p) e 4K até 60 FPS direto para o armazenamento ou galeria do seu Android.
            </p>
          </div>
        </section>
      </main>

      {/* Android Installation Modal */}
      <AndroidInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
