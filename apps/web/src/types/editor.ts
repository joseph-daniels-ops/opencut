export type AspectRatioType = '9:16' | '16:9' | '1:1' | '4:5';

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  duration: number; // in seconds
  thumbnail?: string;
  width?: number;
  height?: number;
}

export interface VideoClip {
  id: string;
  assetId: string;
  name: string;
  type: 'video' | 'image';
  url: string;
  thumbnail?: string;
  startOffset: number; // cut start inside asset
  duration: number; // duration of the clip in timeline
  timelineStart: number; // position on timeline
  speed: number;
  volume: number;
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  filter: 'none' | 'cinematic' | 'vintage' | 'cyberpunk' | 'vibrant' | 'bw' | 'warm' | 'cool';
  rotation: number;
  scale: number;
}

export interface AudioClip {
  id: string;
  assetId: string;
  name: string;
  url: string;
  duration: number;
  timelineStart: number;
  volume: number;
  fadeDuration: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  timelineStart: number;
  duration: number;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  fontFamily: string;
  fontWeight: string;
  positionX: number; // percentage (0-100)
  positionY: number; // percentage (0-100)
  animation: 'none' | 'fade' | 'pop' | 'slide-up' | 'typewriter';
}

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatioType;
  resolution: '720p' | '1080p' | '4K';
  fps: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
  videoClips: VideoClip[];
  audioClips: AudioClip[];
  textOverlays: TextOverlay[];
}
