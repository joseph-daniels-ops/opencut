import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_PROJECT } from '../lib/sampleMedia';
import type { Project, VideoClip, AudioClip, TextOverlay, AspectRatioType, MediaAsset } from '../types/editor';
import { EditorHeader } from '../components/editor/EditorHeader';
import { VideoPreview } from '../components/editor/VideoPreview';
import { Timeline } from '../components/editor/Timeline';
import { MobileActionBar } from '../components/editor/MobileActionBar';
import { InspectorDrawer } from '../components/editor/InspectorDrawer';
import { MediaPickerModal } from '../components/editor/MediaPickerModal';
import { ExportModal } from '../components/editor/ExportModal';
import { AndroidInstallModal } from '../components/editor/AndroidInstallModal';

export const Route = createFileRoute('/editor')({
  component: EditorPage,
});

function EditorPage() {
  const navigate = useNavigate();
  
  // Project State
  const [project, setProject] = useState<Project>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('opencut_current_project');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (_) {}
      }
    }
    return INITIAL_PROJECT;
  });

  // Undo/Redo History
  const [history, setHistory] = useState<Project[]>([INITIAL_PROJECT]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Playback State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Selection & UI Modals
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip-1');
  const [selectedType, setSelectedType] = useState<'video' | 'audio' | 'text'>('video');
  const [inspectorMode, setInspectorMode] = useState<'all' | 'filter' | 'speed' | 'adjust'>('all');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState<boolean>(false);
  const [mediaModalTab, setMediaModalTab] = useState<'media' | 'audio' | 'text'>('media');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // Calculate total timeline duration
  const maxVideoEnd = project.videoClips.reduce((max, c) => Math.max(max, c.timelineStart + c.duration), 0);
  const maxAudioEnd = project.audioClips.reduce((max, a) => Math.max(max, a.timelineStart + a.duration), 0);
  const maxTextEnd = project.textOverlays.reduce((max, t) => Math.max(max, t.timelineStart + t.duration), 0);
  const totalDuration = Math.max(10, Math.max(maxVideoEnd, maxAudioEnd, maxTextEnd));

  // Save to local storage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('opencut_current_project', JSON.stringify(project));
    }
  }, [project]);

  // Push new state to undo/redo history
  const updateProjectWithHistory = (updater: (prev: Project) => Project) => {
    setProject((prev) => {
      const next = updater(prev);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(next);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setProject(history[nextIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setProject(history[nextIndex]);
    }
  };

  // Playback Loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      const loop = () => {
        const now = performance.now();
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });

        animationFrameRef.current = requestAnimationFrame(loop);
      };
      animationFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime((t) => Math.max(0, t - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime((t) => Math.min(totalDuration, t + 1));
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        e.preventDefault();
        handleDeleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, totalDuration, historyIndex, history]);

  // Selected entities
  const selectedVideoClip = selectedType === 'video' ? project.videoClips.find((c) => c.id === selectedClipId) || null : null;
  const selectedAudioClip = selectedType === 'audio' ? project.audioClips.find((a) => a.id === selectedClipId) || null : null;
  const selectedTextOverlay = selectedType === 'text' ? project.textOverlays.find((t) => t.id === selectedClipId) || null : null;

  // Split Clip Logic (supports video and audio)
  const handleSplitClip = () => {
    // 1. Try splitting selected video clip or active video clip at currentTime
    const targetVideo = (selectedType === 'video' && selectedVideoClip) 
      ? selectedVideoClip 
      : project.videoClips.find(
          (c) => currentTime > c.timelineStart + 0.1 && currentTime < c.timelineStart + c.duration - 0.1
        );

    if (targetVideo && currentTime > targetVideo.timelineStart + 0.1 && currentTime < targetVideo.timelineStart + targetVideo.duration - 0.1) {
      const splitOffsetInClip = currentTime - targetVideo.timelineStart;
      const firstPartDuration = splitOffsetInClip;
      const secondPartDuration = targetVideo.duration - splitOffsetInClip;

      const clip1: VideoClip = {
        ...targetVideo,
        duration: firstPartDuration,
      };

      const clip2: VideoClip = {
        ...targetVideo,
        id: `clip-${Date.now()}`,
        timelineStart: currentTime,
        startOffset: targetVideo.startOffset + splitOffsetInClip * (targetVideo.speed || 1),
        duration: secondPartDuration,
      };

      updateProjectWithHistory((prev) => ({
        ...prev,
        videoClips: prev.videoClips.flatMap((c) => (c.id === targetVideo.id ? [clip1, clip2] : [c])),
      }));

      setSelectedClipId(clip2.id);
      setSelectedType('video');
      return;
    }

    // 2. Try splitting audio clip if selected or active under playhead
    const targetAudio = (selectedType === 'audio' && selectedAudioClip)
      ? selectedAudioClip
      : project.audioClips.find(
          (a) => currentTime > a.timelineStart + 0.1 && currentTime < a.timelineStart + a.duration - 0.1
        );

    if (targetAudio && currentTime > targetAudio.timelineStart + 0.1 && currentTime < targetAudio.timelineStart + targetAudio.duration - 0.1) {
      const splitOffsetInClip = currentTime - targetAudio.timelineStart;
      const firstPartDuration = splitOffsetInClip;
      const secondPartDuration = targetAudio.duration - splitOffsetInClip;

      const audio1: AudioClip = {
        ...targetAudio,
        duration: firstPartDuration,
      };

      const audio2: AudioClip = {
        ...targetAudio,
        id: `audio-${Date.now()}`,
        timelineStart: currentTime,
        duration: secondPartDuration,
      };

      updateProjectWithHistory((prev) => ({
        ...prev,
        audioClips: prev.audioClips.flatMap((a) => (a.id === targetAudio.id ? [audio1, audio2] : [a])),
      }));

      setSelectedClipId(audio2.id);
      setSelectedType('audio');
    }
  };

  // Delete selected
  const handleDeleteSelected = () => {
    if (!selectedClipId) return;

    updateProjectWithHistory((prev) => ({
      ...prev,
      videoClips: prev.videoClips.filter((c) => c.id !== selectedClipId),
      audioClips: prev.audioClips.filter((a) => a.id !== selectedClipId),
      textOverlays: prev.textOverlays.filter((t) => t.id !== selectedClipId),
    }));

    setSelectedClipId(null);
    setIsInspectorOpen(false);
  };

  // Duplicate selected (supports video, audio, text)
  const handleDuplicateSelected = () => {
    if (!selectedClipId) return;

    if (selectedVideoClip) {
      const cloned: VideoClip = {
        ...selectedVideoClip,
        id: `clip-${Date.now()}`,
        timelineStart: selectedVideoClip.timelineStart + selectedVideoClip.duration + 0.2,
        name: `${selectedVideoClip.name} (Cópia)`,
      };
      updateProjectWithHistory((prev) => ({
        ...prev,
        videoClips: [...prev.videoClips, cloned],
      }));
      setSelectedClipId(cloned.id);
    } else if (selectedAudioClip) {
      const cloned: AudioClip = {
        ...selectedAudioClip,
        id: `audio-${Date.now()}`,
        timelineStart: selectedAudioClip.timelineStart + selectedAudioClip.duration + 0.2,
        name: `${selectedAudioClip.name} (Cópia)`,
      };
      updateProjectWithHistory((prev) => ({
        ...prev,
        audioClips: [...prev.audioClips, cloned],
      }));
      setSelectedClipId(cloned.id);
    } else if (selectedTextOverlay) {
      const cloned: TextOverlay = {
        ...selectedTextOverlay,
        id: `text-${Date.now()}`,
        timelineStart: selectedTextOverlay.timelineStart + selectedTextOverlay.duration + 0.2,
        text: `${selectedTextOverlay.text} (Cópia)`,
      };
      updateProjectWithHistory((prev) => ({
        ...prev,
        textOverlays: [...prev.textOverlays, cloned],
      }));
      setSelectedClipId(cloned.id);
    }
  };

  // Add new media
  const handleAddVideoClip = (asset: MediaAsset) => {
    const newClip: VideoClip = {
      id: `clip-${Date.now()}`,
      assetId: asset.id,
      name: asset.name,
      type: asset.type === 'image' ? 'image' : 'video',
      url: asset.url,
      thumbnail: asset.thumbnail,
      startOffset: 0,
      duration: asset.duration || 6,
      timelineStart: maxVideoEnd,
      speed: 1,
      volume: 100,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      filter: 'none',
      rotation: 0,
      scale: 1,
    };

    updateProjectWithHistory((prev) => ({
      ...prev,
      videoClips: [...prev.videoClips, newClip],
    }));
    setSelectedClipId(newClip.id);
    setSelectedType('video');
  };

  const handleAddAudioClip = (asset: MediaAsset) => {
    const newAudio: AudioClip = {
      id: `audio-${Date.now()}`,
      assetId: asset.id,
      name: asset.name,
      url: asset.url,
      duration: asset.duration || 15,
      timelineStart: maxAudioEnd,
      volume: 80,
      fadeDuration: 1,
    };

    updateProjectWithHistory((prev) => ({
      ...prev,
      audioClips: [...prev.audioClips, newAudio],
    }));
    setSelectedClipId(newAudio.id);
    setSelectedType('audio');
  };

  const handleAddTextOverlay = (text: string) => {
    const newText: TextOverlay = {
      id: `text-${Date.now()}`,
      text,
      timelineStart: currentTime,
      duration: 4,
      fontSize: 28,
      color: '#ffffff',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: '700',
      positionX: 50,
      positionY: 80,
      animation: 'pop',
    };

    updateProjectWithHistory((prev) => ({
      ...prev,
      textOverlays: [...prev.textOverlays, newText],
    }));
    setSelectedClipId(newText.id);
    setSelectedType('text');
  };

  // Update properties
  const handleUpdateVideoClip = (updates: Partial<VideoClip>) => {
    if (!selectedVideoClip) return;
    setProject((prev) => ({
      ...prev,
      videoClips: prev.videoClips.map((c) => (c.id === selectedVideoClip.id ? { ...c, ...updates } : c)),
    }));
  };

  const handleUpdateAudioClip = (updates: Partial<AudioClip>) => {
    if (!selectedAudioClip) return;
    setProject((prev) => ({
      ...prev,
      audioClips: prev.audioClips.map((a) => (a.id === selectedAudioClip.id ? { ...a, ...updates } : a)),
    }));
  };

  const handleUpdateTextOverlay = (updates: Partial<TextOverlay>) => {
    if (!selectedTextOverlay) return;
    setProject((prev) => ({
      ...prev,
      textOverlays: prev.textOverlays.map((t) => (t.id === selectedTextOverlay.id ? { ...t, ...updates } : t)),
    }));
  };

  const openDrawerWithMode = (mode: 'all' | 'filter' | 'speed' | 'adjust') => {
    setInspectorMode(mode);
    setIsInspectorOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <EditorHeader
        projectName={project.name}
        onProjectNameChange={(name) => updateProjectWithHistory((p) => ({ ...p, name }))}
        aspectRatio={project.aspectRatio}
        onAspectRatioChange={(ratio) => updateProjectWithHistory((p) => ({ ...p, aspectRatio: ratio }))}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onBack={() => navigate({ to: '/' })}
      />

      {/* Main Workspace: Preview Center */}
      <VideoPreview
        aspectRatio={project.aspectRatio}
        currentTime={currentTime}
        totalDuration={totalDuration}
        isPlaying={isPlaying}
        onPlayPauseToggle={() => setIsPlaying(!isPlaying)}
        onSeek={setCurrentTime}
        videoClips={project.videoClips}
        audioClips={project.audioClips}
        textOverlays={project.textOverlays}
        selectedClipId={selectedClipId}
        onSelectClip={(id) => {
          setSelectedClipId(id);
          if (id) {
            setSelectedType('video');
            setIsInspectorOpen(true);
            setInspectorMode('all');
          }
        }}
      />

      {/* Multi-Track Timeline */}
      <Timeline
        currentTime={currentTime}
        totalDuration={totalDuration}
        onSeek={setCurrentTime}
        videoClips={project.videoClips}
        audioClips={project.audioClips}
        textOverlays={project.textOverlays}
        selectedClipId={selectedClipId}
        onSelectClip={(id, type = 'video') => {
          setSelectedClipId(id);
          setSelectedType(type);
          if (id) {
            setIsInspectorOpen(true);
            setInspectorMode('all');
          }
        }}
        onSplitClip={handleSplitClip}
        onDeleteSelected={handleDeleteSelected}
        onDuplicateSelected={handleDuplicateSelected}
        onOpenMediaModal={() => {
          setMediaModalTab('media');
          setIsMediaModalOpen(true);
        }}
        onOpenTextModal={() => {
          setMediaModalTab('text');
          setIsMediaModalOpen(true);
        }}
      />

      {/* Mobile Android Touch Action Bar */}
      <MobileActionBar
        selectedClipId={selectedClipId}
        onSplit={handleSplitClip}
        onOpenMedia={() => {
          setMediaModalTab('media');
          setIsMediaModalOpen(true);
        }}
        onOpenAudio={() => {
          setMediaModalTab('audio');
          setIsMediaModalOpen(true);
        }}
        onOpenText={() => {
          setMediaModalTab('text');
          setIsMediaModalOpen(true);
        }}
        onOpenFilters={() => openDrawerWithMode('filter')}
        onOpenSpeed={() => openDrawerWithMode('speed')}
        onOpenAdjust={() => openDrawerWithMode('adjust')}
        onDelete={handleDeleteSelected}
      />

      {/* Slide-up Inspector & Property Drawer */}
      <InspectorDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        selectedClip={selectedVideoClip}
        selectedAudio={selectedAudioClip}
        selectedText={selectedTextOverlay}
        onUpdateVideoClip={handleUpdateVideoClip}
        onUpdateAudioClip={handleUpdateAudioClip}
        onUpdateTextOverlay={handleUpdateTextOverlay}
        mode={inspectorMode}
      />

      {/* Media Picker & Import Modal */}
      <MediaPickerModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onAddVideoClip={handleAddVideoClip}
        onAddAudioClip={handleAddAudioClip}
        onAddTextOverlay={handleAddTextOverlay}
        initialTab={mediaModalTab}
      />

      {/* Video Rendering & Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
      />

      {/* Android PWA / APK Guide Modal */}
      <AndroidInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
