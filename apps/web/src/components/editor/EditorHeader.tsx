import React from 'react';
import { 
  ArrowLeft, 
  Smartphone, 
  Download, 
  Undo2, 
  Redo2, 
} from 'lucide-react';
import type { AspectRatioType } from '../../types/editor';

interface EditorHeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  aspectRatio: AspectRatioType;
  onAspectRatioChange: (ratio: AspectRatioType) => void;
  onOpenInstallModal: () => void;
  onOpenExportModal: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onBack: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  projectName,
  onProjectNameChange,
  aspectRatio,
  onAspectRatioChange,
  onOpenInstallModal,
  onOpenExportModal,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onBack,
}) => {
  return (
    <header className="h-14 bg-slate-950/90 border-b border-slate-800/80 px-3 md:px-5 flex items-center justify-between gap-2 select-none z-30 shrink-0">
      {/* Left section: Back button & Name */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button
          onClick={onBack}
          className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title="Voltar para Projetos"
          aria-label="Voltar para Projetos"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-sky-500/20">
            <span className="font-extrabold text-xs tracking-tighter">OC</span>
          </div>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-100 hover:bg-slate-900 focus:bg-slate-900 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 max-w-[140px] md:max-w-[220px] truncate outline-none transition-all"
            placeholder="Nome do Projeto"
          />
        </div>
      </div>

      {/* Middle section: Aspect Ratio & Undo/Redo */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Aspect Ratio Selector */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
          {(['9:16', '16:9', '1:1', '4:5'] as AspectRatioType[]).map((ratio) => (
            <button
              key={ratio}
              onClick={() => onAspectRatioChange(ratio)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                aspectRatio === ratio
                  ? 'bg-sky-500 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`Proporção ${ratio}`}
            >
              {ratio}
            </button>
          ))}
        </div>

        {/* Undo/Redo */}
        <div className="hidden sm:flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Refazer (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right section: Android Install & Export */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenInstallModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/30 text-xs font-medium transition-all shadow-sm active:scale-95"
          title="Instalar no Android"
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Android</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/25 active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar</span>
        </button>
      </div>
    </header>
  );
};
