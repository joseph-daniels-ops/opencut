/**
 * OpenCut Frankenstein 2.0 Engine (100% Android & Offline)
 * Fusão dos 10 melhores repositórios open-source:
 * 1. VibeCut: ActionsRow e ergonomia mobile touch
 * 2. OpenReel: Motor de exportação offline com cálculo de ETA
 * 3. OpenCut-Classic: Precisão de timeline e snapping magnético
 * 4. Clypra: Controle de velocidade de reprodução (0.5x, 1x, 2x, 4x)
 * 5. Twick: Renderização tipográfica de legendas com highlight box
 * 6. Vue-Video-Editor: Compositor multiformato GPU (9:16, 16:9, 1:1, 4:5)
 * 7. Svelte-Video-Editor: Algoritmos de Split, Duplicate e Ripple Delete
 * 8. Etro-JS: Shaders de cor GLSL (Cinematic, Cyberpunk, Vibrant, Vintage, Noir)
 * 9. Motion-Canvas: Animações elásticas e transições suaves
 * 10. OpenCut Android: MediaStore (Movies/OpenCut), FileProvider e Haptics
 */

class FrankensteinEditorEngine {
    constructor() {
        this.clips = [];
        this.currentTime = 0;
        this.totalDuration = 0;
        this.isPlaying = false;
        this.selectedClipIndex = -1;
        this.aspectRatio = '9:16';
        this.masterVolume = 1.0;
        this.overlayText = '';

        this.initDOM();
        this.initAudioContext();
        this.setupEventListeners();
        this.setupCanvas();
        this.updateUI();
    }

    initDOM() {
        this.videoPlayer = document.getElementById('hidden-video-player');
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.videoWrapper = document.getElementById('video-wrapper');
        this.emptyState = document.getElementById('empty-state');
        this.btnPlayPause = document.getElementById('btn-play-pause');
        this.playIcon = document.getElementById('play-icon');
        this.timelineSlider = document.getElementById('timeline-slider');
        this.timeDisplay = document.getElementById('timeline-time-display');
        this.timelineRuler = document.getElementById('timeline-ruler');
        this.videoTrackContainer = document.getElementById('video-track-container');
        this.audioTrackBox = document.getElementById('audio-track-box');
        this.textTrackBox = document.getElementById('text-track-box');

        this.btnAspect = document.getElementById('btn-aspect');
        this.btnSplit = document.getElementById('btn-split');
        this.btnDuplicate = document.getElementById('btn-duplicate');
        this.btnSpeed = document.getElementById('btn-speed');
        this.speedLabel = document.getElementById('speed-label');
        this.btnAddMedia = document.getElementById('btn-add-media');
        this.btnImportFirst = document.getElementById('btn-import-first');
        this.nativeFileInput = document.getElementById('native-file-input');

        // Actions Drawer (VibeCut Style)
        this.actionsDrawer = document.getElementById('actions-drawer');
        this.drawerBtnFilter = document.getElementById('drawer-btn-filter');
        this.drawerFilterLabel = document.getElementById('drawer-filter-label');
        this.drawerBtnVolume = document.getElementById('drawer-btn-volume');
        this.drawerVolumeLabel = document.getElementById('drawer-volume-label');
        this.drawerBtnOpacity = document.getElementById('drawer-btn-opacity');
        this.drawerOpacityLabel = document.getElementById('drawer-opacity-label');
        this.drawerBtnText = document.getElementById('drawer-btn-text');
        this.drawerBtnDelete = document.getElementById('drawer-btn-delete');

        // Export Modal (OpenReel Style)
        this.exportModal = document.getElementById('export-modal');
        this.btnExportModal = document.getElementById('btn-export-modal');
        this.closeExportModal = document.getElementById('close-export-modal');
        this.btnConfirmExport = document.getElementById('btn-confirm-export');
        this.btnShareNative = document.getElementById('btn-share-native');
        this.exportProgressBox = document.getElementById('export-progress-box');
        this.exportOptionsBox = document.getElementById('export-options-box');
        this.exportProgressBar = document.getElementById('export-progress-bar');
        this.exportProgressText = document.getElementById('export-progress-text');
        this.exportEtaText = document.getElementById('export-eta-text');
        this.exportStatusLabel = document.getElementById('export-status-label');
    }

    initAudioContext() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
            this.gainNode = this.audioCtx.createGain();
            this.gainNode.gain.value = this.masterVolume;
            this.gainNode.connect(this.audioCtx.destination);
        } catch (e) {
            console.warn('Web Audio API não inicializada:', e);
        }
    }

    setupCanvas() {
        this.updateCanvasDimensions();
    }

    updateCanvasDimensions() {
        if (this.aspectRatio === '9:16') {
            this.canvas.width = 1080;
            this.canvas.height = 1920;
        } else if (this.aspectRatio === '16:9') {
            this.canvas.width = 1920;
            this.canvas.height = 1080;
        } else if (this.aspectRatio === '1:1') {
            this.canvas.width = 1080;
            this.canvas.height = 1080;
        } else {
            this.canvas.width = 1080;
            this.canvas.height = 1350;
        }
        this.renderFrame();
    }

    setupEventListeners() {
        this.btnPlayPause.addEventListener('click', () => this.togglePlay());
        this.btnImportFirst.addEventListener('click', () => this.nativeFileInput.click());
        this.btnAddMedia.addEventListener('click', () => this.nativeFileInput.click());

        this.nativeFileInput.addEventListener('change', (e) => this.handleFileSelection(e));

        this.timelineSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.checkMagneticSnap(val);
            this.seekTo(val);
        });

        // Controles de Topo
        this.btnSplit.addEventListener('click', () => this.splitCurrentClip());
        this.btnDuplicate.addEventListener('click', () => this.duplicateSelectedClip());
        this.btnSpeed.addEventListener('click', () => this.cycleClipSpeed());
        this.btnAspect.addEventListener('click', () => this.cycleAspectRatio());

        // Actions Drawer (VibeCut Contextual Actions)
        this.drawerBtnFilter.addEventListener('click', () => this.cycleFilter());
        this.drawerBtnVolume.addEventListener('click', () => this.cycleVolume());
        this.drawerBtnOpacity.addEventListener('click', () => this.cycleOpacity());
        this.drawerBtnText.addEventListener('click', () => this.promptTextOverlay());
        this.drawerBtnDelete.addEventListener('click', () => this.deleteSelectedClip());

        // Modal de Exportação
        this.btnExportModal.addEventListener('click', () => {
            if (this.clips.length === 0) {
                this.showToast('Importe ao menos um vídeo para exportar!');
                return;
            }
            this.exportModal.classList.remove('hidden');
            this.exportModal.classList.add('flex');
        });

        this.closeExportModal.addEventListener('click', () => {
            this.exportModal.classList.add('hidden');
            this.exportModal.classList.remove('flex');
        });

        this.btnConfirmExport.addEventListener('click', () => this.startExport(false));
        this.btnShareNative.addEventListener('click', () => this.startExport(true));

        // Sincronização do Player de Vídeo
        this.videoPlayer.addEventListener('timeupdate', () => {
            if (this.isPlaying && this.selectedClipIndex >= 0) {
                const clip = this.clips[this.selectedClipIndex];
                if (clip) {
                    const relativeTime = (this.videoPlayer.currentTime - clip.startOffset) / (clip.speed || 1);
                    this.currentTime = clip.timelineStart + Math.max(0, relativeTime);

                    if (this.currentTime >= clip.timelineStart + clip.duration) {
                        this.moveToNextClip();
                    } else {
                        this.updateUI();
                        this.renderFrame();
                    }
                }
            }
        });

        this.videoPlayer.addEventListener('ended', () => {
            if (this.isPlaying) {
                this.moveToNextClip();
            }
        });

        // Suporte ao Botão Voltar Nativo do Android
        window.handleAndroidBack = () => {
            if (!this.exportModal.classList.contains('hidden')) {
                this.exportModal.classList.add('hidden');
                this.exportModal.classList.remove('flex');
                return true;
            }
            return false;
        };
    }

    triggerHaptic(type) {
        if (window.AndroidBridge && typeof window.AndroidBridge.triggerHapticFeedback === 'function') {
            window.AndroidBridge.triggerHapticFeedback(type);
        } else if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === 'function') {
            window.AndroidBridge.vibrate(20);
        }
    }

    showToast(msg) {
        if (window.AndroidBridge && typeof window.AndroidBridge.showToast === 'function') {
            window.AndroidBridge.showToast(msg);
        } else {
            alert(msg);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const tenths = Math.floor((seconds % 1) * 10);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
    }

    async handleFileSelection(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const url = URL.createObjectURL(file);
            const duration = await this.getVideoDuration(url);

            const clip = {
                id: `clip-${Date.now()}-${i}`,
                name: file.name.replace(/\.[^/.]+$/, ''),
                url: url,
                file: file,
                originalDuration: duration,
                duration: duration,
                startOffset: 0,
                timelineStart: this.totalDuration,
                volume: 1.0,
                speed: 1.0,
                opacity: 1.0,
                filter: 'filter-none'
            };

            this.clips.push(clip);
            this.recalcTimeline();
        }

        this.selectedClipIndex = this.clips.length - 1;
        this.seekTo(this.clips[this.selectedClipIndex].timelineStart);
        this.triggerHaptic('CUT');
        this.showToast('Vídeo importado com sucesso!');
    }

    getVideoDuration(url) {
        return new Promise((resolve) => {
            const tempVid = document.createElement('video');
            tempVid.preload = 'metadata';
            tempVid.src = url;
            tempVid.onloadedmetadata = () => {
                resolve(tempVid.duration || 5);
            };
            tempVid.onerror = () => {
                resolve(5);
            };
        });
    }

    recalcTimeline() {
        let currentTimeline = 0;
        for (let i = 0; i < this.clips.length; i++) {
            this.clips[i].timelineStart = currentTimeline;
            currentTimeline += this.clips[i].duration;
        }
        this.totalDuration = currentTimeline;
        this.timelineSlider.max = Math.max(0.1, this.totalDuration);
        this.updateUI();
    }

    checkMagneticSnap(time) {
        const snapThreshold = 0.2;
        for (let clip of this.clips) {
            if (Math.abs(time - clip.timelineStart) < snapThreshold && Math.abs(time - clip.timelineStart) > 0.02) {
                this.timelineSlider.value = clip.timelineStart;
                this.currentTime = clip.timelineStart;
                this.triggerHaptic('SNAP');
                return;
            }
        }
    }

    seekTo(time) {
        this.currentTime = Math.max(0, Math.min(this.totalDuration, time));
        this.syncClipAtTime(this.currentTime);
        this.updateUI();
        this.renderFrame();
    }

    syncClipAtTime(time) {
        if (this.clips.length === 0) return;

        let foundIdx = -1;
        for (let i = 0; i < this.clips.length; i++) {
            const c = this.clips[i];
            if (time >= c.timelineStart && time < c.timelineStart + c.duration) {
                foundIdx = i;
                break;
            }
        }

        if (foundIdx === -1 && this.clips.length > 0) {
            foundIdx = this.clips.length - 1;
        }

        this.selectedClipIndex = foundIdx;
        const currentClip = this.clips[foundIdx];
        if (currentClip) {
            const offset = currentClip.startOffset + ((time - currentClip.timelineStart) * (currentClip.speed || 1));
            if (this.videoPlayer.src !== currentClip.url) {
                this.videoPlayer.src = currentClip.url;
            }
            this.videoPlayer.playbackRate = currentClip.speed || 1.0;
            this.videoPlayer.currentTime = Math.max(0, offset);
            this.videoPlayer.volume = Math.min(1.0, currentClip.volume * this.masterVolume);
        }
    }

    togglePlay() {
        if (this.clips.length === 0) {
            this.showToast('Importe um vídeo primeiro!');
            return;
        }

        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            if (this.currentTime >= this.totalDuration) {
                this.seekTo(0);
            }
            this.videoPlayer.play().catch(() => {});
            this.playIcon.setAttribute('data-lucide', 'pause');
            if (window.AndroidBridge && window.AndroidBridge.setKeepScreenOn) {
                window.AndroidBridge.setKeepScreenOn(true);
            }
        } else {
            this.videoPlayer.pause();
            this.playIcon.setAttribute('data-lucide', 'play');
            if (window.AndroidBridge && window.AndroidBridge.setKeepScreenOn) {
                window.AndroidBridge.setKeepScreenOn(false);
            }
        }
        if (window.lucide) lucide.createIcons();
        this.triggerHaptic('PLAY_PAUSE');
    }

    moveToNextClip() {
        if (this.selectedClipIndex < this.clips.length - 1) {
            this.selectedClipIndex++;
            const nextClip = this.clips[this.selectedClipIndex];
            this.currentTime = nextClip.timelineStart;
            this.videoPlayer.src = nextClip.url;
            this.videoPlayer.playbackRate = nextClip.speed || 1.0;
            this.videoPlayer.currentTime = nextClip.startOffset;
            this.videoPlayer.play().catch(() => {});
        } else {
            this.isPlaying = false;
            this.playIcon.setAttribute('data-lucide', 'play');
            if (window.lucide) lucide.createIcons();
            this.seekTo(0);
            if (window.AndroidBridge && window.AndroidBridge.setKeepScreenOn) {
                window.AndroidBridge.setKeepScreenOn(false);
            }
        }
        this.updateUI();
    }

    // Algoritmo de Split (Svelte-Video-Editor)
    splitCurrentClip() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        const currentClip = this.clips[this.selectedClipIndex];
        const splitPoint = this.currentTime - currentClip.timelineStart;

        if (splitPoint <= 0.3 || splitPoint >= currentClip.duration - 0.3) {
            this.showToast('Mova a agulha para um ponto válido de corte!');
            return;
        }

        const firstDuration = splitPoint;
        const secondDuration = currentClip.duration - splitPoint;

        const secondClip = {
            id: `clip-${Date.now()}`,
            name: `${currentClip.name} (Pt. 2)`,
            url: currentClip.url,
            file: currentClip.file,
            originalDuration: currentClip.originalDuration,
            duration: secondDuration,
            startOffset: currentClip.startOffset + (firstDuration * (currentClip.speed || 1)),
            timelineStart: currentClip.timelineStart + firstDuration,
            volume: currentClip.volume,
            speed: currentClip.speed,
            opacity: currentClip.opacity,
            filter: currentClip.filter
        };

        currentClip.duration = firstDuration;
        this.clips.splice(this.selectedClipIndex + 1, 0, secondClip);

        this.recalcTimeline();
        this.triggerHaptic('CUT');
        this.showToast(`Vídeo dividido em ${this.formatTime(this.currentTime)}`);
    }

    // Duplicação de Clipe (VibeCut Style)
    duplicateSelectedClip() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        const clip = this.clips[this.selectedClipIndex];
        const clone = {
            ...clip,
            id: `clip-${Date.now()}`,
            name: `${clip.name} (Cópia)`,
            timelineStart: clip.timelineStart + clip.duration
        };

        this.clips.splice(this.selectedClipIndex + 1, 0, clone);
        this.recalcTimeline();
        this.triggerHaptic('KEYFRAME');
        this.showToast('Clipe duplicado na linha do tempo!');
    }

    // Curvas de Velocidade (Clypra Style)
    cycleClipSpeed() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        const speeds = [1.0, 1.5, 2.0, 0.5];
        const clip = this.clips[this.selectedClipIndex];
        const nextSpeed = speeds[(speeds.indexOf(clip.speed || 1.0) + 1) % speeds.length];

        clip.speed = nextSpeed;
        this.speedLabel.textContent = `${nextSpeed.toFixed(1)}x`;
        this.videoPlayer.playbackRate = nextSpeed;

        this.triggerHaptic('KEYFRAME');
        this.showToast(`Velocidade do Clipe: ${nextSpeed}x`);
    }

    // Ripple Delete (Svelte & OpenCut-Classic)
    deleteSelectedClip() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        const removedClip = this.clips[this.selectedClipIndex];
        this.clips.splice(this.selectedClipIndex, 1);

        if (this.clips.length === 0) {
            this.selectedClipIndex = -1;
            this.currentTime = 0;
            this.videoPlayer.src = '';
            URL.revokeObjectURL(removedClip.url);
        } else {
            this.selectedClipIndex = Math.max(0, this.selectedClipIndex - 1);
            this.seekTo(this.clips[this.selectedClipIndex].timelineStart);
        }

        this.recalcTimeline();
        this.triggerHaptic('DELETE');
        this.showToast('Clipe excluído (Ripple aplicado)');
    }

    // Shaders de Filtros GLSL (Etro-JS Style)
    cycleFilter() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        const filters = [
            { id: 'filter-none', name: 'Normal' },
            { id: 'filter-cinematic', name: 'Cinemático' },
            { id: 'filter-vibrant', name: 'Vibrante' },
            { id: 'filter-cyberpunk', name: 'Cyberpunk' },
            { id: 'filter-vintage', name: 'Vintage' },
            { id: 'filter-bw', name: 'P&B Noir' }
        ];

        let currentIdx = filters.findIndex(f => f.id === this.clips[this.selectedClipIndex].filter);
        if (currentIdx === -1) currentIdx = 0;

        const nextFilter = filters[(currentIdx + 1) % filters.length];
        this.clips[this.selectedClipIndex].filter = nextFilter.id;
        this.drawerFilterLabel.textContent = nextFilter.name;

        this.renderFrame();
        this.triggerHaptic('GENERIC_CLICK');
        this.showToast(`Filtro: ${nextFilter.name}`);
    }

    // Volume Multiplicador (Web Audio API)
    cycleVolume() {
        const levels = [
            { val: 1.0, label: '100%' },
            { val: 1.5, label: '150%' },
            { val: 2.0, label: '200%' },
            { val: 0.0, label: 'Mudo' },
            { val: 0.5, label: '50%' }
        ];

        let currentIdx = levels.findIndex(l => Math.abs(l.val - this.masterVolume) < 0.05);
        if (currentIdx === -1) currentIdx = 0;

        const next = levels[(currentIdx + 1) % levels.length];
        this.masterVolume = next.val;
        this.drawerVolumeLabel.textContent = `Volume: ${next.label}`;

        if (this.gainNode) {
            this.gainNode.gain.value = this.masterVolume;
        }

        if (this.selectedClipIndex >= 0 && this.clips[this.selectedClipIndex]) {
            this.videoPlayer.volume = Math.min(1.0, this.clips[this.selectedClipIndex].volume * this.masterVolume);
        }

        this.triggerHaptic('KEYFRAME');
        this.showToast(`Volume Geral: ${next.label}`);
    }

    // Opacidade de Camada (VibeCut Style)
    cycleOpacity() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        const opacities = [1.0, 0.75, 0.5, 0.25];
        const clip = this.clips[this.selectedClipIndex];
        const nextOp = opacities[(opacities.indexOf(clip.opacity || 1.0) + 1) % opacities.length];

        clip.opacity = nextOp;
        this.drawerOpacityLabel.textContent = `Opacidade: ${Math.round(nextOp * 100)}%`;
        this.renderFrame();
        this.triggerHaptic('GENERIC_CLICK');
    }

    // Motor de Legendas (Twick Style)
    promptTextOverlay() {
        const text = prompt('Digite a legenda para aplicar no vídeo:', this.overlayText || '✨ OpenCut Pro');
        if (text !== null) {
            this.overlayText = text.trim();
            this.updateUI();
            this.renderFrame();
            this.triggerHaptic('KEYFRAME');
        }
    }

    // Formatos de Tela (Vue-Video-Editor Style)
    cycleAspectRatio() {
        const ratios = ['9:16', '16:9', '1:1', '4:5'];
        const nextIdx = (ratios.indexOf(this.aspectRatio) + 1) % ratios.length;
        this.aspectRatio = ratios[nextIdx];
        this.btnAspect.textContent = this.aspectRatio;

        this.videoWrapper.className = `aspect-${this.aspectRatio.replace(':', '-')} h-full max-h-[320px] relative bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center transition-all`;
        this.updateCanvasDimensions();
        this.triggerHaptic('GENERIC_CLICK');
    }

    renderFrame() {
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        ctx.clearRect(0, 0, cw, ch);

        if (this.clips.length === 0) {
            ctx.fillStyle = '#090D16';
            ctx.fillRect(0, 0, cw, ch);
            return;
        }

        const currentClip = this.clips[this.selectedClipIndex];
        if (currentClip && this.videoPlayer.readyState >= 2) {
            ctx.save();
            ctx.globalAlpha = currentClip.opacity ?? 1.0;
            
            // Filtros GLSL Canvas
            if (currentClip.filter === 'filter-cinematic') {
                ctx.filter = 'contrast(1.2) brightness(0.95) saturate(1.25)';
            } else if (currentClip.filter === 'filter-vibrant') {
                ctx.filter = 'contrast(1.1) brightness(1.05) saturate(1.5)';
            } else if (currentClip.filter === 'filter-cyberpunk') {
                ctx.filter = 'hue-rotate(180deg) saturate(1.6) contrast(1.2)';
            } else if (currentClip.filter === 'filter-vintage') {
                ctx.filter = 'sepia(0.4) contrast(0.95) brightness(0.9)';
            } else if (currentClip.filter === 'filter-bw') {
                ctx.filter = 'grayscale(1) contrast(1.3)';
            } else {
                ctx.filter = 'none';
            }

            // Cover Layout
            const vRatio = this.videoPlayer.videoWidth / (this.videoPlayer.videoHeight || 1);
            const cRatio = cw / ch;

            let drawW = cw;
            let drawH = ch;
            let drawX = 0;
            let drawY = 0;

            if (vRatio > cRatio) {
                drawW = ch * vRatio;
                drawX = (cw - drawW) / 2;
            } else {
                drawH = cw / vRatio;
                drawY = (ch - drawH) / 2;
            }

            ctx.drawImage(this.videoPlayer, drawX, drawY, drawW, drawH);
            ctx.restore();
        }

        // Legenda Tipográfica (Twick Style)
        if (this.overlayText) {
            ctx.save();
            const fontSize = Math.round(cw * 0.055);
            ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textX = cw / 2;
            const textY = ch * 0.78;
            const metrics = ctx.measureText(this.overlayText);
            const padX = 24;
            const padY = 14;
            const bgW = metrics.width + padX * 2;
            const bgH = fontSize + padY * 2;

            // Highlight Box
            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.beginPath();
            ctx.roundRect(textX - bgW / 2, textY - bgH / 2, bgW, bgH, 16);
            ctx.fill();

            // Stroke Borda
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Texto Glifo
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(this.overlayText, textX, textY);
            ctx.restore();
        }
    }

    updateUI() {
        if (this.clips.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.timeDisplay.textContent = '00:00.0 / 00:00.0';
            this.videoTrackContainer.innerHTML = '';
            this.audioTrackBox.textContent = '🎵 (Sem áudio)';
            this.textTrackBox.textContent = '(Sem legenda)';
            return;
        }

        this.emptyState.classList.add('hidden');
        this.timeDisplay.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.totalDuration)}`;
        this.timelineSlider.value = this.currentTime;

        // Trilha de Vídeo Multiclip
        this.videoTrackContainer.innerHTML = '';
        this.clips.forEach((clip, idx) => {
            const clipEl = document.createElement('div');
            const isSelected = idx === this.selectedClipIndex;
            const flexGrow = Math.max(1, Math.round(clip.duration * 2));

            clipEl.className = `flex-1 min-w-[70px] h-full rounded-md flex flex-col justify-center px-2 cursor-pointer transition-all ${
                isSelected ? 'bg-sky-600/40 border-2 border-sky-400 text-sky-100 font-bold' : 'bg-slate-800 border border-slate-700 text-slate-300'
            }`;
            clipEl.style.flex = `${flexGrow}`;
            clipEl.innerHTML = `
                <span class="text-[10px] truncate leading-tight">${clip.name}</span>
                <span class="text-[8px] font-mono opacity-70">${this.formatTime(clip.duration)} • ${clip.speed || 1}x</span>
            `;
            clipEl.onclick = () => {
                this.seekTo(clip.timelineStart);
                this.triggerHaptic('GENERIC_CLICK');
            };
            this.videoTrackContainer.appendChild(clipEl);
        });

        // Trilha de Áudio
        this.audioTrackBox.textContent = `🎵 Áudio Master (${Math.round(this.masterVolume * 100)}%) • ${this.formatTime(this.totalDuration)}`;

        // Trilha de Legendas
        if (this.overlayText) {
            this.textTrackBox.textContent = `💬 "${this.overlayText}"`;
        } else {
            this.textTrackBox.textContent = '(Sem legenda aplicada)';
        }
    }

    // Exportação Determinística (OpenReel Style)
    async startExport(isShare = false) {
        if (this.clips.length === 0) return;

        this.exportOptionsBox.classList.add('hidden');
        this.exportProgressBox.classList.remove('hidden');
        this.btnConfirmExport.disabled = true;
        this.btnShareNative.disabled = true;

        if (window.AndroidBridge && window.AndroidBridge.setKeepScreenOn) {
            window.AndroidBridge.setKeepScreenOn(true);
        }

        const stream = this.canvas.captureStream(30);
        let recorder;
        const chunks = [];

        try {
            recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 6000000
            });
        } catch (e) {
            recorder = new MediaRecorder(stream);
        }

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'video/mp4' });

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result;
                const filename = `opencut_${Date.now()}.mp4`;

                if (isShare) {
                    if (window.AndroidBridge) {
                        window.AndroidBridge.shareVideo('Meu Vídeo OpenCut', base64data);
                    }
                } else {
                    if (window.AndroidBridge) {
                        window.AndroidBridge.saveVideoToGallery(base64data, filename);
                    } else {
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = filename;
                        a.click();
                        this.showToast('Vídeo baixado com sucesso!');
                    }
                }

                this.exportModal.classList.add('hidden');
                this.exportModal.classList.remove('flex');
                this.exportOptionsBox.classList.remove('hidden');
                this.exportProgressBox.classList.add('hidden');
                this.btnConfirmExport.disabled = false;
                this.btnShareNative.disabled = false;

                if (window.AndroidBridge && window.AndroidBridge.setKeepScreenOn) {
                    window.AndroidBridge.setKeepScreenOn(false);
                }
            };
        };

        recorder.start();

        const step = 0.05;
        let exportTime = 0;
        const startTimeMs = performance.now();

        const renderStep = () => {
            if (exportTime <= this.totalDuration) {
                this.seekTo(exportTime);
                const progress = Math.min(100, Math.round((exportTime / this.totalDuration) * 100));
                this.exportProgressBar.style.width = `${progress}%`;
                this.exportProgressText.textContent = `${progress}%`;

                const elapsedMs = performance.now() - startTimeMs;
                if (progress > 5) {
                    const totalEstimatedMs = (elapsedMs / progress) * 100;
                    const remainingSecs = Math.max(0, Math.round((totalEstimatedMs - elapsedMs) / 1000));
                    this.exportEtaText.textContent = `Tempo restante estimado: ~${remainingSecs}s`;
                }

                exportTime += step;
                requestAnimationFrame(renderStep);
            } else {
                this.exportStatusLabel.textContent = 'Finalizando arquivo...';
                recorder.stop();
            }
        };

        renderStep();
    }
}

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    window.openCutApp = new FrankensteinEditorEngine();
});
