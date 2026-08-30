import React from 'react';
import { 
  Scissors, 
  FolderPlus, 
  Music, 
  Type, 
  Sparkles, 
  Gauge, 
  Sliders, 
  Trash2,
  Layers,
  RotateCw
} from 'lucide-react';

interface MobileActionBarProps {
  selectedClipId: string | null;
  onSplit: () => void;
  onOpenMedia: () => void;
  onOpenAudio: () => void;
  onOpenText: () => void;
  onOpenFilters: () => void;
  onOpenSpeed: () => void;
  onOpenAdjust: () => void;
  onDelete: () => void;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  selectedClipId,
  onSplit,
  onOpenMedia,
  onOpenAudio,
  onOpenText,
  onOpenFilters,
  onOpenSpeed,
  onOpenAdjust,
  onDelete,
}) => {
  const actions = [
    {
      id: 'split',
      label: 'Dividir',
      icon: Scissors,
      onClick: onSplit,
      highlight: true,
    },
    {
      id: 'media',
      label: 'Mídia',
      icon: FolderPlus,
      onClick: onOpenMedia,
      highlight: false,
    },
    {
      id: 'audio',
      label: 'Áudio',
      icon: Music,
      onClick: onOpenAudio,
      highlight: false,
    },
    {
      id: 'text',
      label: 'Texto',
      icon: Type,
      onClick: onOpenText,
      highlight: false,
    },
    {
      id: 'filter',
      label: 'Filtros',
      icon: Sparkles,
      onClick: onOpenFilters,
      highlight: false,
    },
    {
      id: 'speed',
      label: 'Velocidade',
      icon: Gauge,
      onClick: onOpenSpeed,
      highlight: false,
    },
    {
      id: 'adjust',
      label: 'Ajustes',
      icon: Sliders,
      onClick: onOpenAdjust,
      highlight: false,
    },
    {
      id: 'delete',
      label: 'Excluir',
      icon: Trash2,
      onClick: onDelete,
      disabled: !selectedClipId,
      danger: true,
    },
  ];

  return (
    <div className="h-16 bg-slate-950/95 border-t border-slate-800/90 px-2 flex items-center justify-start gap-1 overflow-x-auto no-scrollbar select-none z-20 shrink-0">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`flex flex-col items-center justify-center min-w-[58px] py-1 px-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${
              action.danger
                ? 'text-rose-400 hover:bg-rose-950/30'
                : action.highlight
                ? 'text-sky-400 hover:bg-sky-950/40 bg-sky-950/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="p-1 rounded-lg">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium tracking-tight whitespace-nowrap mt-0.5">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
