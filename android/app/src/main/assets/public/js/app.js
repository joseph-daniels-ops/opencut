/**
 * OpenCut Mobile — Engine de Edição Focada em Usabilidade Real (Fases 1 & 2)
 */

class OpenCutMobileEngine {
    constructor() {
        this.clips = [];
        this.currentTime = 0;
        this.totalDuration = 0;
        this.isPlaying = false;
        this.selectedClipIndex = -1;
        this.aspectRatio = '9:16';
        this.activeFilter = 'filter-none';

        this.initDOM();
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
        this.videoTrackContainer = document.getElementById('video-track-container');

        this.btnAspect = document.getElementById('btn-aspect');
        this.btnSplit = document.getElementById('btn-split');
        this.btnDeleteClip = document.getElementById('btn-delete-clip');
        this.btnAddMedia = document.getElementById('btn-add-media');
        this.btnImportFirst = document.getElementById('btn-import-first');
        this.nativeFileInput = document.getElementById('native-file-input');

        // Gaveta de Filtros
        this.btnOpenFilters = document.getElementById('btn-open-filters');
        this.filtersSheet = document.getElementById('filters-sheet');
        this.closeFiltersSheet = document.getElementById('close-filters-sheet');

        // Export Modal
        this.exportModal = document.getElementById('export-modal');
        this.btnExportModal = document.getElementById('btn-export-modal');
        this.closeExportModal = document.getElementById('close-export-modal');
        this.btnConfirmExport = document.getElementById('btn-confirm-export');
        this.exportProgressBox = document.getElementById('export-progress-box');
        this.exportProgressBar = document.getElementById('export-progress-bar');
        this.exportProgressText = document.getElementById('export-progress-text');
    }

    setupCanvas() {
        this.updateCanvasDimensions();
        window.addEventListener('resize', () => this.updateCanvasDimensions());
    }

    updateCanvasDimensions() {
        const rect = this.videoWrapper.getBoundingClientRect();
        this.canvas.width = Math.max(100, Math.round(rect.width * (window.devicePixelRatio || 1)));
        this.canvas.height = Math.max(100, Math.round(rect.height * (window.devicePixelRatio || 1)));
        this.renderFrame();
    }

    setupEventListeners() {
        // Play / Pause
        this.btnPlayPause.onclick = () => this.togglePlay();

        // Importação de Vídeo
        const triggerImport = () => {
            this.nativeFileInput.value = '';
            this.nativeFileInput.click();
            this.triggerHaptic('GENERIC_CLICK');
        };
        this.btnImportFirst.onclick = triggerImport;
        this.btnAddMedia.onclick = triggerImport;
        this.nativeFileInput.onchange = (e) => this.handleFileSelection(e);

        // Slider da Timeline
        this.timelineSlider.oninput = (e) => {
            const time = parseFloat(e.target.value);
            this.seekTo(time);
        };

        // Dividir e Excluir
        this.btnSplit.onclick = () => this.splitCurrentClip();
        this.btnDeleteClip.onclick = () => this.deleteSelectedClip();

        // Proporção de Tela
        this.btnAspect.onclick = () => this.cycleAspectRatio();

        // Gaveta de Filtros
        this.btnOpenFilters.onclick = () => {
            this.filtersSheet.classList.remove('translate-y-full');
            this.triggerHaptic('GENERIC_CLICK');
        };
        this.closeFiltersSheet.onclick = () => {
            this.filtersSheet.classList.add('translate-y-full');
            this.triggerHaptic('GENERIC_CLICK');
        };

        document.querySelectorAll('.filter-card').forEach(card => {
            card.onclick = () => {
                const fId = card.getAttribute('data-filter');
                this.selectFilter(fId);
                this.filtersSheet.classList.add('translate-y-full');
            };
        });

        // Exportação
        this.btnExportModal.onclick = () => {
            if (this.clips.length === 0) {
                this.showToast('Abra um vídeo antes de exportar!');
                return;
            }
            this.exportModal.classList.remove('hidden');
            this.exportModal.classList.add('flex');
            this.exportProgressBox.classList.add('hidden');
            this.btnConfirmExport.disabled = false;
        };

        this.closeExportModal.onclick = () => {
            this.exportModal.classList.add('hidden');
            this.exportModal.classList.remove('flex');
        };

        this.btnConfirmExport.onclick = () => this.startExport();

        // Loop de Vídeo
        this.videoPlayer.ontimeupdate = () => {
            if (this.isPlaying && this.selectedClipIndex >= 0) {
                const clip = this.clips[this.selectedClipIndex];
                const clipTime = this.videoPlayer.currentTime - clip.startOffset;
                this.currentTime = clip.timelineStart + clipTime;

                if (this.currentTime >= clip.timelineStart + clip.duration) {
                    this.moveToNextClip();
                } else {
                    this.timelineSlider.value = this.currentTime;
                    this.timeDisplay.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.totalDuration)}`;
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

    // FASE 2: Scrubbing Tátil Suave no Player (Arrastar com o Dedo)
    setupTouchScrubbing() {
        let touchStartX = 0;
        let timeAtTouchStart = 0;
        let isScrubbing = false;

        const onStart = (e) => {
            if (this.clips.length === 0) return;
            isScrubbing = true;
            touchStartX = e.touches ? e.touches[0].clientX : e.clientX;
            timeAtTouchStart = this.currentTime;
            if (this.isPlaying) {
                this.togglePlay();
            }
        };

        const onMove = (e) => {
            if (!isScrubbing || this.clips.length === 0) return;
            const currentX = e.touches ? e.touches[0].clientX : e.clientX;
            const deltaX = currentX - touchStartX;
            // Sensibilidade calibrada: 120 pixels = 1 segundo de navegação
            const timeDelta = (deltaX / 120) * Math.max(1, this.totalDuration / 10);
            const newTime = Math.max(0, Math.min(this.totalDuration, timeAtTouchStart + timeDelta));
            this.seekTo(newTime);
        };

        const onEnd = () => {
            isScrubbing = false;
        };

        this.canvasTouchArea.addEventListener('touchstart', onStart, { passive: true });
        this.canvasTouchArea.addEventListener('touchmove', onMove, { passive: true });
        this.canvasTouchArea.addEventListener('touchend', onEnd, { passive: true });

        this.canvasTouchArea.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
    }

    selectFilter(filterId) {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;
        this.activeFilter = filterId;
        this.clips[this.selectedClipIndex].filter = filterId;

        document.querySelectorAll('.filter-card').forEach(card => {
            if (card.getAttribute('data-filter') === filterId) {
                card.classList.add('border-cyan-400');
                card.classList.remove('border-transparent');
            } else {
                card.classList.remove('border-cyan-400');
                card.classList.add('border-transparent');
            }
        });

        this.renderFrame();
        this.triggerHaptic('KEYFRAME');
        this.showToast('Filtro aplicado!');
    }

    async handleFileSelection(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        for (let file of files) {
            const url = URL.createObjectURL(file);
            const duration = await this.getVideoDuration(url);

            const clip = {
                id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: file.name.substring(0, 14),
                file: file,
                url: url,
                originalDuration: duration,
                duration: duration,
                startOffset: 0,
                timelineStart: this.totalDuration,
                filter: 'filter-none'
            };

            this.clips.push(clip);
            this.recalcTimeline();
        }

        this.selectedClipIndex = this.clips.length - 1;
        this.seekTo(this.clips[this.selectedClipIndex].timelineStart);
        this.triggerHaptic('CUT');
        this.showToast('Vídeo carregado com sucesso!');
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

    seekTo(time) {
        this.currentTime = Math.max(0, Math.min(this.totalDuration, time));
        this.syncClipAtTime(this.currentTime);
        this.timelineSlider.value = this.currentTime;
        this.timeDisplay.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.totalDuration)}`;
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
            const offset = currentClip.startOffset + (time - currentClip.timelineStart);
            if (this.videoPlayer.src !== currentClip.url) {
                this.videoPlayer.src = currentClip.url;
            }
            this.videoPlayer.currentTime = Math.max(0, offset);
        }
    }

    togglePlay() {
        if (this.clips.length === 0) {
            this.showToast('Importe um vídeo primeiro!');
            return;
        }

        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            if (this.currentTime >= this.totalDuration) {
                this.seekTo(0);
            }
            this.videoPlayer.play().catch(() => {});
            this.playIcon.setAttribute('data-lucide', 'pause');
        } else {
            this.videoPlayer.pause();
            this.playIcon.setAttribute('data-lucide', 'play');
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
            this.videoPlayer.currentTime = nextClip.startOffset;
            this.videoPlayer.play().catch(() => {});
        } else {
            this.isPlaying = false;
            this.playIcon.setAttribute('data-lucide', 'play');
            if (window.lucide) lucide.createIcons();
            this.seekTo(0);
        }
        this.updateUI();
    }

    splitCurrentClip() {
        if (this.selectedClipIndex < 0 || this.clips.length === 0) return;

        const currentClip = this.clips[this.selectedClipIndex];
        const splitPoint = this.currentTime - currentClip.timelineStart;

        if (splitPoint <= 0.2 || splitPoint >= currentClip.duration - 0.2) {
            this.showToast('Mova a agulha para um ponto de corte!');
            return;
        }

        const firstDuration = splitPoint;
        const secondDuration = currentClip.duration - splitPoint;

        const secondClip = {
            ...currentClip,
            id: `clip-${Date.now()}`,
            name: `${currentClip.name} (Pt. 2)`,
            duration: secondDuration,
            startOffset: currentClip.startOffset + firstDuration,
            timelineStart: currentClip.timelineStart + firstDuration
        };

        currentClip.duration = firstDuration;
        this.clips.splice(this.selectedClipIndex + 1, 0, secondClip);

        this.recalcTimeline();
        this.triggerHaptic('CUT');
        this.showToast(`Vídeo dividido com sucesso!`);
    }

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
        this.showToast('Clipe excluído');
    }

    cycleAspectRatio() {
        const ratios = ['9:16', '16:9', '1:1'];
        const nextIdx = (ratios.indexOf(this.aspectRatio) + 1) % ratios.length;
        this.aspectRatio = ratios[nextIdx];
        this.btnAspect.textContent = this.aspectRatio;

        const aspectClasses = {
            '9:16': 'aspect-[9/16]',
            '16:9': 'aspect-[16/9]',
            '1:1': 'aspect-square'
        };

        this.videoWrapper.className = `${aspectClasses[this.aspectRatio]} h-full max-h-[300px] relative bg-black rounded-xl overflow-hidden flex items-center justify-center transition-all pointer-events-none`;
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
            
            // Filtros de Cor
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

            ctx.drawImage(this.videoPlayer, drawX, drawY, drawW, drawH);
            ctx.restore();
        }
    }

    updateUI() {
        if (this.clips.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.timeDisplay.textContent = '00:00.0 / 00:00.0';
            this.videoTrackContainer.innerHTML = '';
            return;
        }

        this.emptyState.classList.add('hidden');
        this.timeDisplay.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.totalDuration)}`;
        this.timelineSlider.value = this.currentTime;

        // FASE 2: Renderização das Alças Táteis de Trim nos Clipes
        this.videoTrackContainer.innerHTML = '';
        this.clips.forEach((clip, idx) => {
            const clipWrapper = document.createElement('div');
            const isSelected = idx === this.selectedClipIndex;
            const flexGrow = Math.max(1, Math.round(clip.duration * 3));

            clipWrapper.className = `flex-1 min-w-[100px] h-full rounded-xl flex items-stretch overflow-hidden relative transition-all ${
                isSelected ? 'ring-2 ring-yellow-400 bg-cyan-950/70 shadow-lg' : 'bg-slate-800 border border-slate-700'
            }`;
            clipWrapper.style.flex = `${flexGrow}`;

            // 1. Alça Esquerda Amarela de Corte
            const leftHandle = document.createElement('div');
            leftHandle.className = `trim-handle ${isSelected ? 'flex' : 'hidden'}`;
            this.attachTrimHandler(leftHandle, idx, 'left');

            // 2. Corpo Central do Clipe
            const centerBody = document.createElement('div');
            centerBody.className = 'flex-1 flex flex-col justify-center px-2 cursor-pointer overflow-hidden';
            centerBody.innerHTML = `
                <span class="text-xs font-bold truncate text-white leading-tight">${clip.name}</span>
                <span class="text-[9px] font-mono text-cyan-300 font-bold">${this.formatTime(clip.duration)}</span>
            `;
            centerBody.onclick = () => {
                this.selectedClipIndex = idx;
                this.seekTo(clip.timelineStart);
                this.triggerHaptic('GENERIC_CLICK');
            };

            // 3. Alça Direita Amarela de Corte
            const rightHandle = document.createElement('div');
            rightHandle.className = `trim-handle ${isSelected ? 'flex' : 'hidden'}`;
            this.attachTrimHandler(rightHandle, idx, 'right');

            clipWrapper.appendChild(leftHandle);
            clipWrapper.appendChild(centerBody);
            clipWrapper.appendChild(rightHandle);

            this.videoTrackContainer.appendChild(clipWrapper);
        });
    }

    // FASE 2: Captura Tátil do Polegar nas Alças de Corte
    attachTrimHandler(handleEl, clipIndex, side) {
        let startX = 0;
        let initialDuration = 0;
        let initialOffset = 0;

        const onStart = (e) => {
            e.stopPropagation();
            const clip = this.clips[clipIndex];
            startX = e.touches ? e.touches[0].clientX : e.clientX;
            initialDuration = clip.duration;
            initialOffset = clip.startOffset;
            this.triggerHaptic('SNAP');

            const onMove = (moveEvent) => {
                moveEvent.preventDefault();
                moveEvent.stopPropagation();
                const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
                const deltaX = currentX - startX;
                // Sensibilidade: 30 pixels de arrasto = 1 segundo de corte
                const deltaSec = deltaX / 30;
                const currentClip = this.clips[clipIndex];

                if (side === 'right') {
                    const newDuration = Math.max(0.3, initialDuration + deltaSec);
                    currentClip.duration = newDuration;
                } else if (side === 'left') {
                    const newDuration = Math.max(0.3, initialDuration - deltaSec);
                    const newOffset = Math.max(0, initialOffset + deltaSec);
                    currentClip.duration = newDuration;
                    currentClip.startOffset = newOffset;
                }

                this.recalcTimeline();
                this.seekTo(currentClip.timelineStart);
            };

            const onEnd = () => {
                window.removeEventListener('touchmove', onMove);
                window.removeEventListener('touchend', onEnd);
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onEnd);
                this.triggerHaptic('CUT');
                this.showToast(`Duração ajustada: ${this.formatTime(this.clips[clipIndex].duration)}`);
            };

            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
        };

        handleEl.addEventListener('touchstart', onStart, { passive: false });
        handleEl.addEventListener('mousedown', onStart);
    }

    // FASE 4: Exportação Determinística
    async startExport() {
        if (this.clips.length === 0) return;

        this.exportProgressBox.classList.remove('hidden');
        this.btnConfirmExport.disabled = true;

        const stream = this.canvas.captureStream(60);
        let recorder;
        const chunks = [];

        try {
            recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 15000000
            });
        } catch (e) {
            recorder = new MediaRecorder(stream);
        }

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'video/mp4' });
            const filename = `OpenCut_${Date.now()}.mp4`;

            if (window.AndroidBridge && window.AndroidBridge.saveVideoToGallery) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Data = reader.result.split(',')[1];
                    window.AndroidBridge.saveVideoToGallery(base64Data, filename);
                };
                reader.readAsDataURL(blob);
            } else {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();
            }

            this.showToast('Vídeo salvo na Galeria!');
            this.exportModal.classList.add('hidden');
            this.exportModal.classList.remove('flex');
        };

        recorder.start();

        const stepTime = 0.05;
        let exportCurrentTime = 0;
        const totalDuration = this.totalDuration;

        const renderStep = () => {
            if (exportCurrentTime <= totalDuration) {
                this.seekTo(exportCurrentTime);
                const progress = Math.round((exportCurrentTime / totalDuration) * 100);
                this.exportProgressBar.style.width = `${progress}%`;
                this.exportProgressText.textContent = `${progress}%`;

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
    window.openCutEngine = new OpenCutMobileEngine();
});
