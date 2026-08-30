import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Film
} from 'lucide-react';
import type { AspectRatioType, VideoClip, AudioClip, TextOverlay } from '../../types/editor';

interface VideoPreviewProps {
  aspectRatio: AspectRatioType;
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
  onSeek: (time: number) => void;
  videoClips: VideoClip[];
  audioClips: AudioClip[];
  textOverlays: TextOverlay[];
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  aspectRatio,
  currentTime,
  totalDuration,
  isPlaying,
  onPlayPauseToggle,
  onSeek,
  videoClips,
  audioClips,
  textOverlays,
  selectedClipId: _selectedClipId,
  onSelectClip: _onSelectClip,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Determine current active video clip at currentTime
  const activeClip = videoClips.find(
    (c) => currentTime >= c.timelineStart && currentTime < c.timelineStart + c.duration
  );

  // Determine current active audio clip at currentTime
  const activeAudio = audioClips.find(
    (a) => currentTime >= a.timelineStart && currentTime < a.timelineStart + a.duration
  );

  // Determine active text overlays at currentTime
  const activeTexts = textOverlays.filter(
    (t) => currentTime >= t.timelineStart && currentTime < t.timelineStart + t.duration
  );

  // Sync HTML5 video tag with activeClip and currentTime
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (activeClip && activeClip.type === 'video') {
      const targetSrcTime = activeClip.startOffset + (currentTime - activeClip.timelineStart) * (activeClip.speed || 1);
      
      video.volume = Math.max(0, Math.min(1, ((activeClip.volume ?? 100) / 100)));
      video.playbackRate = activeClip.speed || 1;

      // If video source changed
      if (video.src !== activeClip.url && activeClip.url) {
        video.src = activeClip.url;
        video.currentTime = Math.max(0, targetSrcTime);
        if (isPlaying) {
          video.play().catch(() => {});
        }
      } else {
        // If drift is more than 0.2s, re-align
        if (Math.abs(video.currentTime - targetSrcTime) > 0.2) {
          video.currentTime = Math.max(0, targetSrcTime);
        }
        if (isPlaying && video.paused) {
          video.play().catch(() => {});
        } else if (!isPlaying && !video.paused) {
          video.pause();
        }
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [activeClip, currentTime, isPlaying]);

  // Sync Background Audio Clip
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeAudio && activeAudio.url) {
      const targetAudioTime = currentTime - activeAudio.timelineStart;
      audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, ((activeAudio.volume ?? 80) / 100)));

      if (audio.src !== activeAudio.url) {
        audio.src = activeAudio.url;
        audio.currentTime = Math.max(0, targetAudioTime);
        if (isPlaying) {
          audio.play().catch(() => {});
        }
      } else {
        if (Math.abs(audio.currentTime - targetAudioTime) > 0.25) {
          audio.currentTime = Math.max(0, targetAudioTime);
        }
        if (isPlaying && audio.paused) {
          audio.play().catch(() => {});
        } else if (!isPlaying && !audio.paused) {
          audio.pause();
        }
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [activeAudio, currentTime, isPlaying, isMuted]);

  // Compute aspect ratio CSS classes and styles
  const getAspectRatioStyle = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[56vh] md:max-h-[58vh] max-w-full';
      case '16:9':
        return 'aspect-[16/9] w-full max-h-[52vh] max-w-[95%] md:max-w-[720px]';
      case '1:1':
        return 'aspect-square max-h-[52vh] max-w-full';
      case '4:5':
        return 'aspect-[4/5] max-h-[56vh] max-w-full';
      default:
        return 'aspect-[9/16] max-h-[56vh]';
    }
  };

  // Format seconds to mm:ss.ms
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleStep = (delta: number) => {
    const next = Math.max(0, Math.min(totalDuration, currentTime + delta));
    onSeek(next);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  // Compute CSS filter string for current active clip
  const getFilterStyle = (clip: VideoClip) => {
    const filters: string[] = [];
    if (clip.brightness !== 0) filters.push(`brightness(${100 + clip.brightness}%)`);
    if (clip.contrast !== 0) filters.push(`contrast(${100 + clip.contrast}%)`);
    if (clip.saturation !== 0) filters.push(`saturate(${100 + clip.saturation}%)`);

    switch (clip.filter) {
      case 'cinematic':
        filters.push('contrast(115%) saturate(110%) sepia(10%)');
        break;
      case 'vintage':
        filters.push('sepia(45%) contrast(90%) brightness(105%)');
        break;
      case 'cyberpunk':
        filters.push('hue-rotate(290deg) saturate(160%) contrast(120%)');
        break;
      case 'vibrant':
        filters.push('saturate(150%) contrast(108%)');
        break;
      case 'bw':
        filters.push('grayscale(100%) contrast(120%)');
        break;
      case 'warm':
        filters.push('sepia(25%) saturate(120%)');
        break;
      case 'cool':
        filters.push('hue-rotate(180deg) saturate(90%)');
        break;
      default:
        break;
    }
    return filters.join(' ');
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-slate-950 flex flex-col items-center justify-between p-2 md:p-3 relative overflow-hidden select-none"
    >
      {/* Hidden Audio Player for Background Tracks */}
      <audio ref={audioRef} playsInline />

      {/* Video Viewport Stage */}
      <div className="flex-1 w-full flex items-center justify-center relative min-h-0">
        <div 
          className={`relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 flex items-center justify-center transition-all cursor-pointer ${getAspectRatioStyle()}`}
          onClick={onPlayPauseToggle}
        >
          {/* Active Clip Render */}
          {activeClip ? (
            activeClip.type === 'video' ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover pointer-events-none"
                muted={isMuted}
                playsInline
                style={{
                  filter: getFilterStyle(activeClip),
                  transform: `scale(${activeClip.scale || 1}) rotate(${activeClip.rotation || 0}deg)`,
                }}
              />
            ) : (
              <img
                src={activeClip.url || activeClip.thumbnail}
                alt={activeClip.name}
                className="w-full h-full object-cover pointer-events-none"
                style={{
                  filter: getFilterStyle(activeClip),
                  transform: `scale(${activeClip.scale || 1}) rotate(${activeClip.rotation || 0}deg)`,
                }}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2 pointer-events-none">
              <Film className="w-10 h-10 stroke-1 text-slate-600" />
              <p className="text-xs font-medium text-slate-400">Nenhum clipe nesta posição</p>
              <p className="text-[11px] text-slate-600">Arraste a agulha ou adicione mídias na linha do tempo</p>
            </div>
          )}

          {/* Active Text Overlays */}
          {activeTexts.map((text) => (
            <div
              key={text.id}
              className="absolute pointer-events-none px-3 py-1.5 rounded-lg text-center backdrop-blur-sm transition-all animate-in fade-in zoom-in duration-200"
              style={{
                left: `${text.positionX}%`,
                top: `${text.positionY}%`,
                transform: 'translate(-50%, -50%)',
                color: text.color,
                backgroundColor: text.backgroundColor || 'transparent',
                fontSize: `${text.fontSize}px`,
                fontWeight: text.fontWeight,
                fontFamily: text.fontFamily,
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              {text.text}
            </div>
          ))}

          {/* Touch Play Indicator */}
          {!isPlaying && activeClip && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-xl shadow-black/40">
                <Play className="w-6 h-6 ml-1 text-white fill-white" />
              </div>
            </div>
          )}

          {/* Aspect Ratio Badge */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-white/10 pointer-events-none">
            {aspectRatio}
          </div>
        </div>
      </div>

      {/* Playback Control Bar */}
      <div className="w-full max-w-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2 mt-2 flex items-center justify-between gap-3 shadow-lg shrink-0">
        {/* Timecode */}
        <div className="flex items-center gap-1 font-mono text-xs text-slate-300 shrink-0">
          <span className="text-sky-400 font-semibold">{formatTime(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{formatTime(totalDuration)}</span>
        </div>

        {/* Center transport buttons */}
        <div className="flex items-center gap-1.5 md:gap-3">
          <button
            onClick={() => handleStep(-1)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Voltar 1s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onPlayPauseToggle}
            className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-sky-500/25 active:scale-95 transition-all"
            title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-slate-950" />
            ) : (
              <Play className="w-5 h-5 ml-0.5 fill-slate-950" />
            )}
          </button>

          <button
            onClick={() => handleStep(1)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Avançar 1s"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right side utilities */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-1.5 rounded-xl transition-colors ${
              isMuted ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isMuted ? 'Desmutar' : 'Mutar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tela Cheia"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
