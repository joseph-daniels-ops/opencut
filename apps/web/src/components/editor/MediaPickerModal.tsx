import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Film, 
  Music, 
  Plus, 
  Type
} from 'lucide-react';
import { SAMPLE_ASSETS } from '../../lib/sampleMedia';
import type { MediaAsset } from '../../types/editor';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideoClip: (asset: MediaAsset) => void;
  onAddAudioClip: (asset: MediaAsset) => void;
  onAddTextOverlay: (text: string) => void;
  initialTab?: 'media' | 'audio' | 'text';
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onAddVideoClip,
  onAddAudioClip,
  onAddTextOverlay,
  initialTab = 'media',
}) => {
  const [tab, setTab] = useState<'media' | 'audio' | 'text'>(initialTab);
  const [customText, setCustomText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle local file upload (Android Gallery / Camera / Files)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');

      const asset: MediaAsset = {
        id: `local-${Date.now()}-${i}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
        url,
        duration: isVideo ? 8 : isAudio ? 15 : 4,
        thumbnail: isImage ? url : undefined,
      };

      if (isAudio) {
        onAddAudioClip(asset);
      } else {
        onAddVideoClip(asset);
      }
    }
    onClose();
  };

  const handleAddText = () => {
    if (!customText.trim()) return;
    onAddTextOverlay(customText.trim());
    setCustomText('');
    onClose();
  };

  const videoAssets = SAMPLE_ASSETS.filter((a) => a.type === 'video');
  const audioAssets = SAMPLE_ASSETS.filter((a) => a.type === 'audio');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <h3 className="font-semibold text-white text-base">Adicionar Elementos</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950 p-1.5 gap-1.5">
          <button
            onClick={() => setTab('media')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'media'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Vídeos & Fotos</span>
          </button>
          <button
            onClick={() => setTab('audio')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'audio'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Músicas & Efeitos</span>
          </button>
          <button
            onClick={() => setTab('text')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'text'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Texto & Legenda</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {tab === 'media' && (
            <div className="space-y-4">
              {/* Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 rounded-xl border-2 border-dashed border-sky-500/40 bg-sky-500/5 hover:bg-sky-500/10 flex flex-col items-center justify-center gap-2 text-sky-300 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-sky-400" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-white">Galeria do Celular / Enviar Arquivos</p>
                  <p className="text-[11px] text-slate-400">Suporta vídeos (MP4, WebM, MOV) e fotos (JPG, PNG)</p>
                </div>
              </button>

              {/* Sample Stock Videos */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Vídeos de Exemplo (Gratuitos)
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {videoAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => {
                        onAddVideoClip(asset);
                        onClose();
                      }}
                      className="group relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80 aspect-video cursor-pointer hover:border-sky-500 transition-all shadow-md"
                    >
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                        <span className="text-xs font-semibold text-white truncate">{asset.name}</span>
                        <span className="text-[10px] text-slate-300">{asset.duration}s</span>
                      </div>
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'audio' && (
            <div className="space-y-3">
              {/* Upload custom sound */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-300 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Importar Áudio do Dispositivo</span>
              </button>

              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Trilhas e Efeitos Sonoros
              </h4>
              <div className="space-y-2">
                {audioAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between hover:border-emerald-500 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-white">{asset.name}</h5>
                        <p className="text-[10px] text-slate-400">{asset.duration}s • Royalty Free</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onAddAudioClip(asset);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Usar</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Texto da Legenda ou Título
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Ex: Inscreva-se no Canal / Super Oferta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-amber-400 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                />
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">Sugestões rápidas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['✨ Novo Vídeo', '🔥 Destaque', '🔔 Curta & Compartilhe', '📍 Localização', '💬 Comente abaixo'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setCustomText(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddText}
                disabled={!customText.trim()}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar à Linha do Tempo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
