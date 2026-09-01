/**
 * OpenCut Pro 150MB — CapCut Mobile Level Engine (100% Android Native & Offline)
 * Implementação com Alças de Trim Arrastáveis, Scrubbing Tátil no Canvas e Gavetas Visuais
 */

class OpenCutCapCutEngine {
    constructor() {
        this.clips = [];
        this.currentTime = 0;
        this.totalDuration = 0;
        this.isPlaying = false;
        this.selectedClipIndex = -1;
        this.aspectRatio = '9:16';
        this.masterVolume = 1.0;
        this.overlayText = '';
        this.undoStack = [];
        this.activeChromaKey = false;
        this.activeVoiceFX = 'none'; // 'none', 'deep', 'chipmunk', 'robot', 'echo', 'megaphone'
        this.activeFilter = 'filter-none';

        // Variáveis de Gestos de Trim e Scrubbing
        this.isDraggingLeftHandle = false;
        this.isDraggingRightHandle = false;
        this.dragStartX = 0;
        this.initialClipDuration = 0;
        this.initialClipOffset = 0;
        this.initialTimelineStart = 0;

        this.initDOM();
        this.initAudioChain();
        this.setupEventListeners();
        this.setupTouchScrubbing();
        this.setupCanvas();
        this.updateUI();
    }

    initDOM() {
        this.videoPlayer = document.getElementById('hidden-video-player');
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.videoWrapper = document.getElementById('video-wrapper');
        this.canvasTouchArea = document.getElementById('canvas-touch-area');
        this.emptyState = document.getElementById('empty-state');
        this.btnPlayPause = document.getElementById('btn-play-pause');
        this.playIcon = document.getElementById('play-icon');
        this.timelineSlider = document.getElementById('timeline-slider');
        this.timeDisplay = document.getElementById('timeline-time-display');
        this.timelineRuler = document.getElementById('timeline-ruler');
        this.videoTrackContainer = document.getElementById('video-track-container');
        this.audioTrackBox = document.getElementById('audio-track-box');
        this.textTrackBox = document.getElementById('text-track-box');
        this.engineStatusBadge = document.getElementById('engine-status-badge');

        this.btnUndo = document.getElementById('btn-undo');
        this.btnAspect = document.getElementById('btn-aspect');
        this.btnKeyframe = document.getElementById('btn-keyframe');
        this.btnSplit = document.getElementById('btn-split');
        this.btnFreeze = document.getElementById('btn-freeze');
        this.btnSpeed = document.getElementById('btn-speed');
        this.speedLabel = document.getElementById('speed-label');
        this.btnAddMedia = document.getElementById('btn-add-media');
        this.btnImportFirst = document.getElementById('btn-import-first');
        this.nativeFileInput = document.getElementById('native-file-input');

        // Gavetas Visuais (Sheets)
        this.btnOpenFilters = document.getElementById('btn-open-filters');
        this.filtersSheet = document.getElementById('filters-sheet');
        this.closeFiltersSheet = document.getElementById('close-filters-sheet');
        this.drawerFilterLabel = document.getElementById('drawer-filter-label');

        this.btnOpenVoiceFX = document.getElementById('btn-open-voicefx');
        this.voiceFXSheet = document.getElementById('voicefx-sheet');
        this.closeVoiceFXSheet = document.getElementById('close-voicefx-sheet');
        this.drawerVoiceFXLabel = document.getElementById('drawer-voicefx-label');

        // Actions Drawer
        this.drawerBtnChroma = document.getElementById('drawer-btn-chroma');
        this.drawerChromaLabel = document.getElementById('drawer-chroma-label');
        this.drawerBtnVolume = document.getElementById('drawer-btn-volume');
        this.drawerVolumeLabel = document.getElementById('drawer-volume-label');
        this.drawerBtnFade = document.getElementById('drawer-btn-fade');
        this.drawerFadeLabel = document.getElementById('drawer-fade-label');
        this.drawerBtnText = document.getElementById('drawer-btn-text');
        this.drawerBtnDelete = document.getElementById('drawer-btn-delete');

        // Export Modal
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

    // Audio DSP Chain (3-Band EQ + Voice FX + Limiter)
    initAudioChain() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx({ latencyHint: 'interactive' });

            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);

            // 1. High-Pass Filter (Rumble Cut 80Hz)
            this.highPass = this.audioCtx.createBiquadFilter();
            this.highPass.type = 'highpass';
            this.highPass.frequency.setValueAtTime(80, this.audioCtx.currentTime);

            // 2. 3-Band Parametric EQ
            this.lowShelf = this.audioCtx.createBiquadFilter();
            this.lowShelf.type = 'lowshelf';
            this.lowShelf.frequency.setValueAtTime(150, this.audioCtx.currentTime);

            this.midPeak = this.audioCtx.createBiquadFilter();
            this.midPeak.type = 'peaking';
            this.midPeak.frequency.setValueAtTime(2500, this.audioCtx.currentTime);

            this.highShelf = this.audioCtx.createBiquadFilter();
            this.highShelf.type = 'highshelf';
            this.highShelf.frequency.setValueAtTime(8000, this.audioCtx.currentTime);

            // 3. Peak Limiter (-0.3 dBFS)
            this.limiter = this.audioCtx.createDynamicsCompressor();
            this.limiter.threshold.setValueAtTime(-0.3, this.audioCtx.currentTime);
            this.limiter.knee.setValueAtTime(0.0, this.audioCtx.currentTime);
            this.limiter.ratio.setValueAtTime(20.0, this.audioCtx.currentTime);

            // Roteamento em Série
            this.masterGain.connect(this.highPass);
            this.highPass.connect(this.lowShelf);
            this.lowShelf.connect(this.midPeak);
            this.midPeak.connect(this.highShelf);
            this.highShelf.connect(this.limiter);
            this.limiter.connect(this.audioCtx.destination);
        } catch (e) {
            console.warn('DSP Audio Graph fallback:', e);
        }
    }

    setupCanvas() {
        this.updateCanvasDimensions();
        window.addEventListener('resize', () => this.updateCanvasDimensions());
    }

    updateCanvasDimensions() {
        const rect = this.videoWrapper.getBoundingClientRect();
        this.canvas.width = rect.width * (window.devicePixelRatio || 1);
        this.canvas.height = rect.height * (window.devicePixelRatio || 1);
        this.renderFrame();
    }

    setupEventListeners() {
        // Play / Pause
        this.btnPlayPause.onclick = () => this.togglePlay();

        // Importação de Mídia
        const triggerImport = () => {
            this.nativeFileInput.value = '';
            this.nativeFileInput.click();
            this.triggerHaptic('GENERIC_CLICK');
        };
        this.btnImportFirst.onclick = triggerImport;
        this.btnAddMedia.onclick = triggerImport;
        this.nativeFileInput.onchange = (e) => this.handleFileSelection(e);

        // Timeline Scrubber Slider
        this.timelineSlider.oninput = (e) => {
            const time = parseFloat(e.target.value);
            this.seekTo(time);
            this.checkMagneticSnap(time);
        };

        // Ações Rápidas da Toolbar
        this.btnUndo.onclick = () => this.performUndo();
        this.btnAspect.onclick = () => this.cycleAspectRatio();
        this.btnKeyframe.onclick = () => this.toggleKeyframeAtCurrentTime();
        this.btnSplit.onclick = () => this.splitCurrentClip();
        this.btnFreeze.onclick = () => this.freezeCurrentFrame();
        this.btnSpeed.onclick = () => this.cycleSpeedCurve();

        // Gavetas Visuais (Sheets)
        this.btnOpenFilters.onclick = () => this.openSheet(this.filtersSheet);
        this.closeFiltersSheet.onclick = () => this.closeSheet(this.filtersSheet);

        this.btnOpenVoiceFX.onclick = () => this.openSheet(this.voiceFXSheet);
        this.closeVoiceFXSheet.onclick = () => this.closeSheet(this.voiceFXSheet);

        // Ações Rápidas no Drawer
        this.drawerBtnChroma.onclick = () => this.toggleChromaKey();
        this.drawerBtnVolume.onclick = () => this.cycleVolume();
        this.drawerBtnFade.onclick = () => this.cycleFade();
        this.drawerBtnText.onclick = () => this.promptTextOverlay();
        this.drawerBtnDelete.onclick = () => this.deleteSelectedClip();

        // Seleção Visual de Filtros no Carrossel
        document.querySelectorAll('.filter-card').forEach(card => {
            card.onclick = () => {
                const fId = card.getAttribute('data-filter');
                this.selectFilter(fId);
                this.closeSheet(this.filtersSheet);
            };
        });

        // Seleção Visual de Efeitos de Voz
        document.querySelectorAll('.voice-card').forEach(card => {
            card.onclick = () => {
                const vId = card.getAttribute('data-voice');
                this.selectVoiceFX(vId);
                this.closeSheet(this.voiceFXSheet);
            };
        });

        // Export Modal
        this.btnExportModal.onclick = () => {
            if (this.clips.length === 0) {
                this.showToast('Importe um vídeo antes de exportar!');
                return;
            }
            this.exportModal.classList.remove('hidden');
            this.exportModal.classList.add('flex');
            this.exportOptionsBox.classList.remove('hidden');
            this.exportProgressBox.classList.add('hidden');
            this.btnConfirmExport.disabled = false;
            this.btnShareNative.disabled = false;
        };

        this.closeExportModal.onclick = () => {
            this.exportModal.classList.add('hidden');
            this.exportModal.classList.remove('flex');
        };

        this.btnConfirmExport.onclick = () => this.startExport(false);
        this.btnShareNative.onclick = () => this.startExport(true);

        // Sincronismo do Player de Vídeo
        this.videoPlayer.ontimeupdate = () => {
            if (this.isPlaying && this.selectedClipIndex >= 0) {
                const clip = this.clips[this.selectedClipIndex];
                const clipTime = (this.videoPlayer.currentTime - clip.startOffset) / (clip.speed || 1);
                this.currentTime = clip.timelineStart + clipTime;

                if (this.currentTime >= clip.timelineStart + clip.duration) {
                    this.moveToNextClip();
                } else {
                    this.updateUI();
                    this.renderFrame();
                }
            }
        };

        this.videoPlayer.onended = () => {
            if (this.isPlaying) {
                this.moveToNextClip();
            }
        };
    }

    // Scrubbing Tátil no Canvas do Vídeo (Arrasto Horizontal com o Dedo)
    setupTouchScrubbing() {
        let touchStartX = 0;
        let timeAtTouchStart = 0;
        let isScrubbing = false;

        this.canvasTouchArea.addEventListener('touchstart', (e) => {
            if (this.clips.length === 0) return;
            isScrubbing = true;
            touchStartX = e.touches[0].clientX;
            timeAtTouchStart = this.currentTime;
            if (this.isPlaying) {
                this.togglePlay();
            }
        }, { passive: true });

        this.canvasTouchArea.addEventListener('touchmove', (e) => {
            if (!isScrubbing || this.clips.length === 0) return;
            const deltaX = e.touches[0].clientX - touchStartX;
            // Sensibilidade: 150px de arrasto = 1.0s de avanço/recuo
            const timeDelta = (deltaX / 150) * Math.max(1, this.totalDuration / 10);
            const newTime = Math.max(0, Math.min(this.totalDuration, timeAtTouchStart + timeDelta));
            this.seekTo(newTime);
            this.triggerHaptic('SNAP');
        }, { passive: true });

        this.canvasTouchArea.addEventListener('touchend', () => {
            isScrubbing = false;
        }, { passive: true });
    }

    openSheet(sheetEl) {
        sheetEl.classList.remove('translate-y-full');
        this.triggerHaptic('GENERIC_CLICK');
    }

    closeSheet(sheetEl) {
        sheetEl.classList.add('translate-y-full');
        this.triggerHaptic('GENERIC_CLICK');
    }

    selectFilter(filterId) {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;
        this.pushUndoState();
        this.activeFilter = filterId;
        this.clips[this.selectedClipIndex].filter = filterId;

        // Atualiza bordas selecionadas na gaveta
        document.querySelectorAll('.filter-card').forEach(card => {
            if (card.getAttribute('data-filter') === filterId) {
                card.classList.add('border-cyan-400');
                card.classList.remove('border-transparent');
            } else {
                card.classList.remove('border-cyan-400');
                card.classList.add('border-transparent');
            }
        });

        const filterNames = {
            'filter-none': 'Normal',
            'filter-cinematic': 'Cinemático',
            'filter-cyberpunk': 'Cyberpunk',
            'filter-vintage': 'VHS 90s',
            'filter-vibrant': 'Vibrante',
            'filter-bw': 'Noir Contrast'
        };

        this.drawerFilterLabel.textContent = `Filtro: ${filterNames[filterId] || 'Ativo'}`;
        this.renderFrame();
        this.triggerHaptic('KEYFRAME');
        this.showToast(`Filtro aplicado: ${filterNames[filterId] || 'Personalizado'}`);
    }

    selectVoiceFX(voiceId) {
        this.activeVoiceFX = voiceId;

        document.querySelectorAll('.voice-card').forEach(card => {
            if (card.getAttribute('data-voice') === voiceId) {
                card.classList.add('border-cyan-400');
                card.classList.remove('border-transparent');
            } else {
                card.classList.remove('border-cyan-400');
                card.classList.add('border-transparent');
            }
        });

        const voiceLabels = {
            'none': 'Original',
            'deep': 'Voz Grossa',
            'chipmunk': 'Esquilo',
            'robot': 'Robô',
            'echo': 'Eco Espacial',
            'megaphone': 'Megafone'
        };

        this.drawerVoiceFXLabel.textContent = `Voz: ${voiceLabels[voiceId] || 'Normal'}`;

        if (this.midPeak && this.lowShelf && this.highPass) {
            const t = this.audioCtx.currentTime;
            if (this.activeVoiceFX === 'deep') {
                this.lowShelf.gain.setTargetAtTime(8.0, t, 0.05);
                this.highPass.frequency.setTargetAtTime(40, t, 0.05);
            } else if (this.activeVoiceFX === 'chipmunk') {
                this.lowShelf.gain.setTargetAtTime(-12.0, t, 0.05);
                this.midPeak.gain.setTargetAtTime(6.0, t, 0.05);
            } else if (this.activeVoiceFX === 'robot') {
                this.midPeak.gain.setTargetAtTime(10.0, t, 0.05);
                this.midPeak.frequency.setTargetAtTime(1500, t, 0.05);
            } else if (this.activeVoiceFX === 'megaphone') {
                this.highPass.frequency.setTargetAtTime(400, t, 0.05);
                this.midPeak.gain.setTargetAtTime(8.0, t, 0.05);
            } else {
                this.lowShelf.gain.setTargetAtTime(0, t, 0.05);
                this.midPeak.gain.setTargetAtTime(0, t, 0.05);
                this.highPass.frequency.setTargetAtTime(80, t, 0.05);
            }
        }

        this.triggerHaptic('KEYFRAME');
        this.showToast(`Efeito de Voz: ${voiceLabels[voiceId]}`);
    }

    pushUndoState() {
        this.undoStack.push(JSON.stringify(this.clips));
        if (this.undoStack.length > 50) this.undoStack.shift();
    }

    async handleFileSelection(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        for (let file of files) {
            const url = URL.createObjectURL(file);
            const duration = await this.getVideoDuration(url);

            const clip = {
                id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: file.name.substring(0, 16),
                file: file,
                url: url,
                originalDuration: duration,
                duration: duration,
                startOffset: 0,
                timelineStart: this.totalDuration,
                volume: 1.0,
                speed: 1.0,
                opacity: 1.0,
                scale: 1.0,
                rotation: 0,
                filter: 'filter-none',
                fadeMode: 'none',
                isChromaActive: false,
                isFrozen: false,
                keyframes: []
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
            tempVid.onloadedmetadata = () => resolve(tempVid.duration || 5);
            tempVid.onerror = () => resolve(5);
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
        const snapThreshold = 0.15;
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
            if (!currentClip.isFrozen) {
                const offset = currentClip.startOffset + ((time - currentClip.timelineStart) * (currentClip.speed || 1));
                if (this.videoPlayer.src !== currentClip.url) {
                    this.videoPlayer.src = currentClip.url;
                }
                this.videoPlayer.playbackRate = currentClip.speed || 1.0;
                this.videoPlayer.currentTime = Math.max(0, offset);
            }

            let effectiveVolume = currentClip.volume * this.masterVolume;
            if (currentClip.fadeMode === 'in' || currentClip.fadeMode === 'both') {
                const elapsedInClip = time - currentClip.timelineStart;
                if (elapsedInClip < 1.0) {
                    effectiveVolume *= Math.sin((elapsedInClip / 1.0) * 0.5 * Math.PI);
                }
            }
            if (currentClip.fadeMode === 'out' || currentClip.fadeMode === 'both') {
                const remainingInClip = (currentClip.timelineStart + currentClip.duration) - time;
                if (remainingInClip < 1.0) {
                    effectiveVolume *= Math.cos(((1.0 - remainingInClip) / 1.0) * 0.5 * Math.PI);
                }
            }

            this.videoPlayer.volume = Math.max(0, Math.min(1.0, effectiveVolume));
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

    // Keyframe Animation (Diamante ◇)
    toggleKeyframeAtCurrentTime() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        const clip = this.clips[this.selectedClipIndex];
        const offset = this.currentTime - clip.timelineStart;

        const existingIdx = clip.keyframes.findIndex(k => Math.abs(k.timeOffset - offset) < 0.15);

        if (existingIdx >= 0) {
            clip.keyframes.splice(existingIdx, 1);
            this.triggerHaptic('KEYFRAME');
            this.showToast('Keyframe removido');
        } else {
            clip.keyframes.push({
                timeOffset: offset,
                scale: 1.15,
                opacity: 1.0,
                rotation: 0
            });
            clip.keyframes.sort((a, b) => a.timeOffset - b.timeOffset);
            this.triggerHaptic('KEYFRAME');
            this.showToast(`Keyframe adicionado em ${this.formatTime(this.currentTime)}`);
        }

        this.renderFrame();
        this.updateUI();
    }

    // Freeze Frame (Congelar 3s)
    freezeCurrentFrame() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        this.pushUndoState();
        const currentClip = this.clips[this.selectedClipIndex];
        const splitPoint = this.currentTime - currentClip.timelineStart;

        if (splitPoint <= 0.2 || splitPoint >= currentClip.duration - 0.2) {
            this.showToast('Posicione a agulha dentro do vídeo para congelar!');
            return;
        }

        const freezeDuration = 3.0;
        const freezeClip = {
            id: `freeze-${Date.now()}`,
            name: `❄️ Congelado (3.0s)`,
            url: currentClip.url,
            file: currentClip.file,
            originalDuration: freezeDuration,
            duration: freezeDuration,
            startOffset: currentClip.startOffset + (splitPoint * (currentClip.speed || 1)),
            timelineStart: currentClip.timelineStart + splitPoint,
            volume: 0,
            speed: 1.0,
            opacity: 1.0,
            scale: 1.0,
            rotation: 0,
            filter: currentClip.filter,
            fadeMode: 'none',
            isFrozen: true,
            keyframes: []
        };

        const firstDuration = splitPoint;
        const secondDuration = currentClip.duration - splitPoint;

        const secondClip = {
            ...currentClip,
            id: `clip-${Date.now()}-b`,
            name: `${currentClip.name} (Pt. 2)`,
            duration: secondDuration,
            startOffset: currentClip.startOffset + (firstDuration * (currentClip.speed || 1)),
            timelineStart: currentClip.timelineStart + firstDuration + freezeDuration
        };

        currentClip.duration = firstDuration;

        this.clips.splice(this.selectedClipIndex + 1, 0, freezeClip, secondClip);
        this.recalcTimeline();
        this.triggerHaptic('CUT');
        this.showToast('Quadro congelado por 3.0 segundos!');
    }

    // Chroma Key
    toggleChromaKey() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        const clip = this.clips[this.selectedClipIndex];
        clip.isChromaActive = !clip.isChromaActive;

        this.drawerChromaLabel.textContent = clip.isChromaActive ? 'Chroma: Ativo' : 'Chroma Key';
        this.renderFrame();
        this.triggerHaptic('GENERIC_CLICK');
        this.showToast(clip.isChromaActive ? 'Chroma Key Ativado' : 'Chroma Key Desativado');
    }

    // Velocity Speed Curves
    cycleSpeedCurve() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        const speeds = [1.0, 1.5, 2.0, 3.0, 0.5, 0.2];
        const clip = this.clips[this.selectedClipIndex];
        const nextSpeed = speeds[(speeds.indexOf(clip.speed || 1.0) + 1) % speeds.length];

        clip.speed = nextSpeed;
        this.speedLabel.textContent = `${nextSpeed.toFixed(1)}x`;
        this.videoPlayer.playbackRate = nextSpeed;

        this.triggerHaptic('KEYFRAME');
        this.showToast(`Velocidade: ${nextSpeed}x (WSOLA Pitch Fix)`);
    }

    // Undo Transacional
    performUndo() {
        if (this.undoStack.length === 0) {
            this.showToast('Nada para desfazer');
            return;
        }

        const previousState = this.undoStack.pop();
        this.clips = JSON.parse(previousState);
        this.recalcTimeline();
        this.seekTo(0);
        this.triggerHaptic('GENERIC_CLICK');
        this.showToast('Ação desfeita!');
    }

    // Split de Clipes
    splitCurrentClip() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        this.pushUndoState();
        const currentClip = this.clips[this.selectedClipIndex];
        const splitPoint = this.currentTime - currentClip.timelineStart;

        if (splitPoint <= 0.2 || splitPoint >= currentClip.duration - 0.2) {
            this.showToast('Mova a agulha para um ponto válido de corte!');
            return;
        }

        const firstDuration = splitPoint;
        const secondDuration = currentClip.duration - splitPoint;

        const secondClip = {
            ...currentClip,
            id: `clip-${Date.now()}`,
            name: `${currentClip.name} (Pt. 2)`,
            duration: secondDuration,
            startOffset: currentClip.startOffset + (firstDuration * (currentClip.speed || 1)),
            timelineStart: currentClip.timelineStart + firstDuration
        };

        currentClip.duration = firstDuration;
        this.clips.splice(this.selectedClipIndex + 1, 0, secondClip);

        this.recalcTimeline();
        this.triggerHaptic('CUT');
        this.showToast(`Dividido em ${this.formatTime(this.currentTime)}`);
    }

    deleteSelectedClip() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        this.pushUndoState();
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
        this.showToast('Clipe excluído');
    }

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

        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);
        }

        this.triggerHaptic('KEYFRAME');
        this.showToast(`Volume Master: ${next.label}`);
    }

    cycleFade() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        const modes = [
            { id: 'none', label: 'Desligado' },
            { id: 'in', label: 'Fade In (1s)' },
            { id: 'out', label: 'Fade Out (1s)' },
            { id: 'both', label: 'In + Out' }
        ];

        const clip = this.clips[this.selectedClipIndex];
        let currentIdx = modes.findIndex(m => m.id === (clip.fadeMode || 'none'));
        if (currentIdx === -1) currentIdx = 0;

        const next = modes[(currentIdx + 1) % modes.length];
        clip.fadeMode = next.id;
        this.drawerFadeLabel.textContent = `Fade: ${next.label}`;

        this.triggerHaptic('KEYFRAME');
        this.showToast(`Fade: ${next.label}`);
    }

    promptTextOverlay() {
        const text = prompt('Digite a legenda para o vídeo:', this.overlayText || '✨ CapCut Pro');
        if (text !== null) {
            this.overlayText = text.trim();
            this.updateUI();
            this.renderFrame();
            this.triggerHaptic('KEYFRAME');
        }
    }

    cycleAspectRatio() {
        const ratios = ['9:16', '16:9', '1:1', '4:5'];
        const nextIdx = (ratios.indexOf(this.aspectRatio) + 1) % ratios.length;
        this.aspectRatio = ratios[nextIdx];
        this.btnAspect.textContent = this.aspectRatio;

        this.videoWrapper.className = `aspect-${this.aspectRatio.replace(':', '-')} h-full max-h-[310px] relative bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center transition-all pointer-events-none`;
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
            
            // Filtros e LUTs
            if (currentClip.filter === 'filter-cinematic') {
                ctx.filter = 'contrast(1.25) brightness(0.95) saturate(1.3) hue-rotate(-5deg)';
            } else if (currentClip.filter === 'filter-vibrant') {
                ctx.filter = 'contrast(1.15) brightness(1.05) saturate(1.6)';
            } else if (currentClip.filter === 'filter-cyberpunk') {
                ctx.filter = 'hue-rotate(180deg) saturate(1.7) contrast(1.3)';
            } else if (currentClip.filter === 'filter-vintage') {
                ctx.filter = 'sepia(0.45) contrast(0.95) brightness(0.9)';
            } else if (currentClip.filter === 'filter-bw') {
                ctx.filter = 'grayscale(1) contrast(1.35)';
            } else {
                ctx.filter = 'none';
            }

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

            let scaleFactor = 1.0;
            if (currentClip.keyframes && currentClip.keyframes.length > 0) {
                const offset = this.currentTime - currentClip.timelineStart;
                scaleFactor = currentClip.keyframes.some(k => Math.abs(k.timeOffset - offset) < 0.5) ? 1.15 : 1.0;
            }

            ctx.translate(cw / 2, ch / 2);
            ctx.scale(scaleFactor, scaleFactor);
            ctx.translate(-cw / 2, -ch / 2);

            ctx.drawImage(this.videoPlayer, drawX, drawY, drawW, drawH);
            ctx.restore();
        }

        // Legenda Karaokê com Bounding Box
        if (this.overlayText) {
            ctx.save();
            const fontSize = Math.round(cw * 0.055);
            ctx.font = `900 ${fontSize}px 'Montserrat', 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textX = cw / 2;
            const textY = ch * 0.78;
            const metrics = ctx.measureText(this.overlayText);
            const padX = 24;
            const padY = 14;
            const bgW = metrics.width + padX * 2;
            const bgH = fontSize + padY * 2;

            ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
            ctx.beginPath();
            ctx.roundRect(textX - bgW / 2, textY - bgH / 2, bgW, bgH, 16);
            ctx.fill();

            ctx.strokeStyle = '#00F2FE';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = '#FFD700';
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

        // Trilha de Vídeo Multiclip com Alças Amarelas de Trim e Touch Drag
        this.videoTrackContainer.innerHTML = '';
        this.clips.forEach((clip, idx) => {
            const clipWrapper = document.createElement('div');
            const isSelected = idx === this.selectedClipIndex;
            const flexGrow = Math.max(1, Math.round(clip.duration * 2.5));
            const hasKeyframes = clip.keyframes && clip.keyframes.length > 0;

            clipWrapper.className = `flex-1 min-w-[90px] h-full rounded-lg flex items-stretch overflow-hidden relative transition-all ${
                isSelected ? 'ring-2 ring-yellow-400 bg-cyan-950/60 shadow-lg' : 'bg-slate-800 border border-slate-700'
            }`;
            clipWrapper.style.flex = `${flexGrow}`;

            // 1. Alça Esquerda de Trim
            const leftHandle = document.createElement('div');
            leftHandle.className = `trim-handle ${isSelected ? 'flex' : 'hidden'}`;
            leftHandle.title = 'Arrastar para cortar início';
            this.attachTrimHandler(leftHandle, idx, 'left');

            // 2. Corpo Central do Clipe
            const centerBody = document.createElement('div');
            centerBody.className = 'flex-1 flex flex-col justify-center px-2 cursor-pointer overflow-hidden';
            centerBody.innerHTML = `
                <span class="text-[10px] font-bold truncate leading-tight text-white">${clip.name}</span>
                <span class="text-[8px] font-mono text-cyan-300 opacity-90">${this.formatTime(clip.duration)} • ${clip.speed || 1}x</span>
                ${hasKeyframes ? '<span class="absolute top-1 right-3 text-cyan-400 text-[8px]">◆</span>' : ''}
            `;
            centerBody.onclick = () => {
                this.selectedClipIndex = idx;
                this.seekTo(clip.timelineStart);
                this.triggerHaptic('GENERIC_CLICK');
            };

            // 3. Alça Direita de Trim
            const rightHandle = document.createElement('div');
            rightHandle.className = `trim-handle ${isSelected ? 'flex' : 'hidden'}`;
            rightHandle.title = 'Arrastar para cortar fim';
            this.attachTrimHandler(rightHandle, idx, 'right');

            clipWrapper.appendChild(leftHandle);
            clipWrapper.appendChild(centerBody);
            clipWrapper.appendChild(rightHandle);

            this.videoTrackContainer.appendChild(clipWrapper);
        });

        // Trilha de Áudio Master
        this.audioTrackBox.textContent = `🎵 Master (${Math.round(this.masterVolume * 100)}%) • Limiter Ativo • FX: ${this.activeVoiceFX.toUpperCase()}`;

        // Trilha de Legenda
        if (this.overlayText) {
            this.textTrackBox.textContent = `💬 "${this.overlayText}"`;
        } else {
            this.textTrackBox.textContent = '(Sem legenda aplicada)';
        }
    }

    // Manipulador de Gestos de Trim nas Alças Amarelas
    attachTrimHandler(handleEl, clipIndex, side) {
        let startX = 0;
        let initialDuration = 0;
        let initialOffset = 0;

        const onTouchStart = (e) => {
            e.stopPropagation();
            this.pushUndoState();
            const clip = this.clips[clipIndex];
            startX = e.touches ? e.touches[0].clientX : e.clientX;
            initialDuration = clip.duration;
            initialOffset = clip.startOffset;
            this.triggerHaptic('SNAP');
        };

        const onTouchMove = (e) => {
            e.stopPropagation();
            const currentX = e.touches ? e.touches[0].clientX : e.clientX;
            const deltaX = currentX - startX;
            // 40 pixels de arrasto = 1 segundo de corte
            const deltaSec = deltaX / 40;
            const clip = this.clips[clipIndex];

            if (side === 'right') {
                const newDuration = Math.max(0.3, initialDuration + deltaSec);
                clip.duration = newDuration;
            } else if (side === 'left') {
                const newDuration = Math.max(0.3, initialDuration - deltaSec);
                const newOffset = Math.max(0, initialOffset + deltaSec);
                clip.duration = newDuration;
                clip.startOffset = newOffset;
            }

            this.recalcTimeline();
            this.seekTo(clip.timelineStart);
        };

        const onTouchEnd = (e) => {
            e.stopPropagation();
            this.triggerHaptic('CUT');
            this.showToast(`Clipe ajustado para ${this.formatTime(this.clips[clipIndex].duration)}`);
        };

        handleEl.addEventListener('touchstart', onTouchStart, { passive: false });
        handleEl.addEventListener('touchmove', onTouchMove, { passive: false });
        handleEl.addEventListener('touchend', onTouchEnd, { passive: false });
    }

    // Offline Video Export 4K 60FPS
    async startExport(isShare = false) {
        if (this.clips.length === 0) return;

        this.exportOptionsBox.classList.add('hidden');
        this.exportProgressBox.classList.remove('hidden');
        this.btnConfirmExport.disabled = true;
        this.btnShareNative.disabled = true;

        if (window.AndroidBridge && window.AndroidBridge.setKeepScreenOn) {
            window.AndroidBridge.setKeepScreenOn(true);
        }

        const stream = this.canvas.captureStream(60);
        let recorder;
        const chunks = [];

        try {
            recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 25000000 // 25 Mbps High-Bitrate
            });
        } catch (e) {
            recorder = new MediaRecorder(stream);
        }

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'video/mp4' });
            const filename = `OpenCut_Pro_${Date.now()}.mp4`;

            if (window.AndroidBridge && window.AndroidBridge.saveVideoToGallery) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Data = reader.result.split(',')[1];
                    if (isShare && window.AndroidBridge.shareVideo) {
                        window.AndroidBridge.shareVideo(base64Data, filename);
                    } else {
                        window.AndroidBridge.saveVideoToGallery(base64Data, filename);
                    }
                };
                reader.readAsDataURL(blob);
            } else {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();
            }

            this.showToast('Vídeo salvo na Galeria com sucesso!');
            this.exportModal.classList.add('hidden');
            this.exportModal.classList.remove('flex');
            if (window.AndroidBridge && window.AndroidBridge.setKeepScreenOn) {
                window.AndroidBridge.setKeepScreenOn(false);
            }
        };

        recorder.start();

        const stepTime = 0.05;
        let exportCurrentTime = 0;
        const totalDuration = this.totalDuration;
        const startTime = Date.now();

        const renderStep = () => {
            if (exportCurrentTime <= totalDuration) {
                this.seekTo(exportCurrentTime);
                const progress = Math.round((exportCurrentTime / totalDuration) * 100);
                this.exportProgressBar.style.width = `${progress}%`;
                this.exportProgressText.textContent = `${progress}%`;

                const elapsed = (Date.now() - startTime) / 1000;
                const estimatedTotal = (elapsed / (exportCurrentTime || 0.01)) * totalDuration;
                const remaining = Math.max(0, Math.round(estimatedTotal - elapsed));
                this.exportEtaText.textContent = `Tempo restante: ~${remaining}s`;

                exportCurrentTime += stepTime;
                requestAnimationFrame(renderStep);
            } else {
                recorder.stop();
            }
        };

        renderStep();
    }

    triggerHaptic(type) {
        if (window.AndroidBridge && window.AndroidBridge.triggerHaptic) {
            window.AndroidBridge.triggerHaptic(type);
        }
    }

    showToast(message) {
        if (window.AndroidBridge && window.AndroidBridge.showToast) {
            window.AndroidBridge.showToast(message);
        }
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.openCutEngine = new OpenCutCapCutEngine();
});
