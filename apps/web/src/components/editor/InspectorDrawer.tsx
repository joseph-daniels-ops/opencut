import React from 'react';
import { 
  X, 
  Sliders
} from 'lucide-react';
import type { VideoClip, AudioClip, TextOverlay } from '../../types/editor';

interface InspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClip: VideoClip | null;
  selectedAudio: AudioClip | null;
  selectedText: TextOverlay | null;
  onUpdateVideoClip: (updates: Partial<VideoClip>) => void;
  onUpdateAudioClip: (updates: Partial<AudioClip>) => void;
  onUpdateTextOverlay: (updates: Partial<TextOverlay>) => void;
  mode?: 'all' | 'filter' | 'speed' | 'adjust';
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  isOpen,
  onClose,
  selectedClip,
  selectedAudio,
  selectedText,
  onUpdateVideoClip,
  onUpdateAudioClip,
  onUpdateTextOverlay,
  mode = 'all',
}) => {
  if (!isOpen) return null;

  const filters = [
    { id: 'none', label: 'Original', bg: 'bg-slate-800' },
    { id: 'cinematic', label: 'Cinema', bg: 'bg-amber-900/60' },
    { id: 'vibrant', label: 'Vibrante', bg: 'bg-sky-600/60' },
    { id: 'cyberpunk', label: 'Cyberpunk', bg: 'bg-fuchsia-600/60' },
    { id: 'vintage', label: 'Vintage', bg: 'bg-orange-800/60' },
    { id: 'bw', label: 'P&B', bg: 'bg-zinc-700' },
    { id: 'warm', label: 'Quente', bg: 'bg-amber-600/60' },
    { id: 'cool', label: 'Frio', bg: 'bg-cyan-700/60' },
  ];

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-4 shadow-2xl rounded-t-3xl max-h-[60vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">
              {selectedClip ? `Ajustar: ${selectedClip.name}` : selectedText ? 'Editar Legenda' : selectedAudio ? 'Ajustar Áudio' : 'Propriedades'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Clip Controls */}
        {selectedClip && (
          <div className="space-y-4 text-xs">
            {/* Filter Selector */}
            {(mode === 'all' || mode === 'filter') && (
              <div>
                <label className="text-slate-400 font-semibold block mb-2">Filtros de Cor</label>
                <div className="grid grid-cols-4 gap-2">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => onUpdateVideoClip({ filter: f.id as any })}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        selectedClip.filter === f.id
                          ? 'border-sky-400 bg-sky-500/20 text-white font-bold ring-1 ring-sky-400'
                          : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-full h-7 rounded-lg mb-1 ${f.bg} flex items-center justify-center text-[10px]`}>
                        {selectedClip.filter === f.id ? '✓' : ''}
                      </div>
                      <span className="text-[11px]">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Speed Selector */}
            {(mode === 'all' || mode === 'speed') && (
              <div>
                <div className="flex justify-between text-slate-400 font-semibold mb-2">
                  <span>Velocidade de Reprodução</span>
                  <span className="text-sky-400 font-mono">{selectedClip.speed}x</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdateVideoClip({ speed: s })}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                        selectedClip.speed === s
                          ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color & Light Adjustments */}
            {(mode === 'all' || mode === 'adjust') && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Brilho</span>
                    <span className="font-mono">{selectedClip.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={selectedClip.brightness}
                    onChange={(e) => onUpdateVideoClip({ brightness: Number(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Contraste</span>
                    <span className="font-mono">{selectedClip.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={selectedClip.contrast}
                    onChange={(e) => onUpdateVideoClip({ contrast: Number(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Saturação</span>
                    <span className="font-mono">{selectedClip.saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="100"
                    value={selectedClip.saturation}
                    onChange={(e) => onUpdateVideoClip({ saturation: Number(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Volume do Clipe</span>
                    <span className="font-mono">{selectedClip.volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedClip.volume}
                    onChange={(e) => onUpdateVideoClip({ volume: Number(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Zoom / Escala</span>
                      <span className="font-mono">{selectedClip.scale || 1}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={selectedClip.scale || 1}
                      onChange={(e) => onUpdateVideoClip({ scale: Number(e.target.value) })}
                      className="w-full accent-sky-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Rotação</span>
                      <span className="font-mono">{selectedClip.rotation || 0}°</span>
                    </div>
                    <div className="flex gap-1">
                      {[0, 90, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          onClick={() => onUpdateVideoClip({ rotation: deg })}
                          className={`flex-1 py-1 rounded bg-slate-800 text-[10px] ${
                            (selectedClip.rotation || 0) === deg ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300'
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    onUpdateVideoClip({
                      brightness: 0,
                      contrast: 0,
                      saturation: 0,
                      filter: 'none',
                      speed: 1,
                      scale: 1,
                      rotation: 0,
                      volume: 100,
                    })
                  }
                  className="w-full py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium border border-slate-700/60 transition-colors mt-2"
                >
                  Restaurar Ajustes Padrão
                </button>
              </div>
            )}
          </div>
        )}

        {/* Text Overlay Controls */}
        {selectedText && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Texto</label>
              <input
                type="text"
                value={selectedText.text}
                onChange={(e) => onUpdateTextOverlay({ text: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Tamanho da Fonte ({selectedText.fontSize}px)</label>
                <input
                  type="range"
                  min="14"
                  max="64"
                  value={selectedText.fontSize}
                  onChange={(e) => onUpdateTextOverlay({ fontSize: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cor do Texto</label>
                <div className="flex gap-1.5">
                  {['#ffffff', '#38bdf8', '#fbbf24', '#f43f5e', '#a855f7'].map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateTextOverlay({ color: c })}
                      className={`w-6 h-6 rounded-full border ${selectedText.color === c ? 'ring-2 ring-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Posição Vertical</span>
                <span className="font-mono">{selectedText.positionY}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={selectedText.positionY}
                onChange={(e) => onUpdateTextOverlay({ positionY: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        )}

        {/* Audio Controls */}
        {selectedAudio && (
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Volume da Trilha</span>
                <span className="font-mono">{selectedAudio.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedAudio.volume}
                onChange={(e) => onUpdateAudioClip({ volume: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
