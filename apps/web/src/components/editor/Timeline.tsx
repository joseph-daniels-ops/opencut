import React, { useRef, useState, useEffect } from 'react';
import { 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Scissors, 
  Trash2, 
  Copy, 
  Volume2, 
  Type, 
  Music, 
  Film,
} from 'lucide-react';
import type { VideoClip, AudioClip, TextOverlay } from '../../types/editor';

interface TimelineProps {
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
  videoClips: VideoClip[];
  audioClips: AudioClip[];
  textOverlays: TextOverlay[];
  selectedClipId: string | null;
  onSelectClip: (id: string | null, type?: 'video' | 'audio' | 'text') => void;
  onSplitClip: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onOpenMediaModal: () => void;
  onOpenTextModal: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  totalDuration,
  onSeek,
  videoClips,
  audioClips,
  textOverlays,
  selectedClipId,
  onSelectClip,
  onSplitClip,
  onDeleteSelected,
  onDuplicateSelected,
  onOpenMediaModal,
  onOpenTextModal,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackAreaRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(30); // pixels per second
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  // Width in pixels of the full timeline
  const timelineWidth = Math.max(800, totalDuration * zoomLevel + 200);

  // Handle pointer down for scrubbing
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackAreaRef.current) return;
    setIsScrubbing(true);
    updateSeekFromEvent(e);
    trackAreaRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    updateSeekFromEvent(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      setIsScrubbing(false);
      try {
        trackAreaRef.current?.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const updateSeekFromEvent = (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
    if (!trackAreaRef.current) return;
    const rect = trackAreaRef.current.getBoundingClientRect();
    const scrollLeft = trackAreaRef.current.scrollLeft || 0;
    const offsetX = e.clientX - rect.left + scrollLeft;
    const seekTime = Math.max(0, Math.min(totalDuration, offsetX / zoomLevel));
    onSeek(seekTime);
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(15, Math.min(80, prev + delta)));
  };

  // Auto-scroll timeline to follow playhead when near edges
  useEffect(() => {
    if (!trackAreaRef.current) return;
    const playheadPx = currentTime * zoomLevel;
    const scrollLeft = trackAreaRef.current.scrollLeft;
    const clientWidth = trackAreaRef.current.clientWidth;

    if (playheadPx > scrollLeft + clientWidth - 60) {
      trackAreaRef.current.scrollLeft = playheadPx - clientWidth + 120;
    } else if (playheadPx < scrollLeft + 30) {
      trackAreaRef.current.scrollLeft = Math.max(0, playheadPx - 30);
    }
  }, [currentTime, zoomLevel]);

  // Generate ruler tick marks
  const rulerTicks = [];
  const tickInterval = zoomLevel < 25 ? 2 : 1;
  for (let s = 0; s <= totalDuration + 2; s += tickInterval) {
    rulerTicks.push(s);
  }

  return (
    <div 
      ref={containerRef}
      className="bg-slate-950 border-t border-slate-800/90 flex flex-col h-48 md:h-56 select-none shrink-0"
    >
      {/* Timeline Toolbar */}
      <div className="h-9 px-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={onSplitClip}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-medium transition-colors"
            title="Dividir no cursor (Split)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dividir</span>
          </button>

          <button
            onClick={onDeleteSelected}
            disabled={!selectedClipId}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Excluir selecionado"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excluir</span>
          </button>

          <button
            onClick={onDuplicateSelected}
            disabled={!selectedClipId}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Duplicar selecionado"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicar</span>
          </button>
        </div>

        {/* Right side: Track buttons & Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMediaModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mídia</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => handleZoom(-5)}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(5)}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Tracks Scrolling Area */}
      <div
        ref={trackAreaRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#070b12] cursor-crosshair touch-pan-x"
        style={{ touchAction: 'pan-x' }}
      >
        <div 
          className="h-full relative flex flex-col py-1.5"
          style={{ width: `${timelineWidth}px` }}
        >
          {/* Time Ruler */}
          <div className="h-6 border-b border-slate-800/80 relative select-none pointer-events-none">
            {rulerTicks.map((sec) => (
              <div
                key={sec}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${sec * zoomLevel}px` }}
              >
                <span className="text-[9px] font-mono text-slate-500 -translate-x-1/2">
                  {Math.floor(sec / 60)}:{Math.floor(sec % 60).toString().padStart(2, '0')}s
                </span>
                <div className="w-[1px] h-2 bg-slate-800" />
              </div>
            ))}
          </div>

          {/* Track 1: Text Overlays */}
          <div className="h-7 my-1 relative bg-slate-900/30 rounded-lg border border-slate-800/30 overflow-hidden">
            <div className="absolute left-1 top-1 text-[9px] font-semibold text-amber-400/70 flex items-center gap-1 pointer-events-none z-10">
              <Type className="w-3 h-3" />
              <span className="hidden md:inline">Legendas</span>
            </div>
            {textOverlays.map((text) => (
              <div
                key={text.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelectClip(text.id, 'text');
                }}
                className={`absolute top-0.5 bottom-0.5 rounded-md px-2 flex items-center text-[10px] font-medium truncate cursor-pointer transition-all border ${
                  selectedClipId === text.id
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/50 z-20'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25 z-10'
                }`}
                style={{
                  left: `${text.timelineStart * zoomLevel}px`,
                  width: `${text.duration * zoomLevel}px`,
                }}
              >
                <span className="truncate">{text.text}</span>
              </div>
            ))}
          </div>

          {/* Track 2: Video Clips Track */}
          <div className="h-16 my-1 relative bg-slate-900/50 rounded-xl border border-slate-800/60 flex items-center overflow-hidden">
            <div className="absolute left-2 top-2 text-[9px] font-semibold text-sky-400/70 flex items-center gap-1 pointer-events-none z-10">
              <Film className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Vídeo Principal</span>
            </div>

            {videoClips.map((clip) => (
              <div
                key={clip.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelectClip(clip.id, 'video');
                }}
                className={`absolute top-1 bottom-1 rounded-lg overflow-hidden flex flex-col justify-between border cursor-pointer transition-all ${
                  selectedClipId === clip.id
                    ? 'border-sky-400 bg-sky-950/60 shadow-lg ring-2 ring-sky-400/40 z-20'
                    : 'border-slate-700/80 bg-slate-800/80 hover:border-slate-600 z-10'
                }`}
                style={{
                  left: `${clip.timelineStart * zoomLevel}px`,
                  width: `${clip.duration * zoomLevel}px`,
                }}
              >
                {/* Clip thumbnail background */}
                {clip.thumbnail && (
                  <img
                    src={clip.thumbnail}
                    alt={clip.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
                  />
                )}
                
                <div className="relative z-10 px-2 py-1 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-white drop-shadow truncate">
                    {clip.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-300 bg-black/50 px-1 py-0.2 rounded">
                    {clip.duration.toFixed(1)}s
                  </span>
                </div>

                <div className="relative z-10 px-2 pb-1 flex items-center justify-between text-[9px] text-slate-300">
                  <span className="text-sky-300">{clip.filter !== 'none' ? `🎨 ${clip.filter}` : 'Normal'}</span>
                  {clip.speed !== 1 && <span className="text-amber-300 font-bold">{clip.speed}x</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Track 3: Audio Soundtrack Track */}
          <div className="h-8 my-1 relative bg-slate-900/30 rounded-lg border border-slate-800/30 overflow-hidden">
            <div className="absolute left-1 top-1 text-[9px] font-semibold text-emerald-400/70 flex items-center gap-1 pointer-events-none z-10">
              <Music className="w-3 h-3" />
              <span className="hidden md:inline">Áudio</span>
            </div>

            {audioClips.map((audio) => (
              <div
                key={audio.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelectClip(audio.id, 'audio');
                }}
                className={`absolute top-0.5 bottom-0.5 rounded-md px-2 flex items-center text-[10px] font-medium truncate cursor-pointer transition-all border ${
                  selectedClipId === audio.id
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/50 z-20'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 z-10'
                }`}
                style={{
                  left: `${audio.timelineStart * zoomLevel}px`,
                  width: `${audio.duration * zoomLevel}px`,
                }}
              >
                <Volume2 className="w-3 h-3 mr-1 shrink-0" />
                <span className="truncate">{audio.name}</span>
              </div>
            ))}
          </div>

          {/* Draggable Playhead Scrubber */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center"
            style={{ left: `${currentTime * zoomLevel}px` }}
          >
            <div className="w-3.5 h-3.5 bg-sky-400 rotate-45 -mt-1 shadow-lg shadow-sky-500/50" />
            <div className="w-[2px] h-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          </div>
        </div>
      </div>
    </div>
  );
};
