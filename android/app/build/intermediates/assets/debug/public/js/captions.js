/**
 * FrankenCut 600+ Viral Captions & Typography Engine
 * Extraído e adaptado de Whisper/Silero & MrBeast text presets
 */
export class ViralCaptionsEngine {
    constructor() {
        this.captions = [];
    }

    setCaptions(captionsList) {
        this.captions = captionsList;
    }

    render(ctx, canvas, currentTimeSec) {
        if (!this.captions || this.captions.length === 0) return;

        const activeItem = this.captions.find(c => currentTimeSec >= c.start && currentTimeSec <= c.end);
        if (!activeItem) return;

        ctx.save();
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.78; // Posição terço inferior padrão Reels/TikTok

        ctx.font = '900 24px Montserrat, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = activeItem.text.toUpperCase();
        const metrics = ctx.measureText(text);
        const paddingH = 14;
        const paddingV = 8;
        const boxW = metrics.width + paddingH * 2;
        const boxH = 32 + paddingV;

        // Fundo estilo Hormozi/MrBeast Pill Box
        ctx.fillStyle = 'rgba(9, 13, 22, 0.90)';
        ctx.strokeStyle = '#00F2FE';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH, 12);
        ctx.fill();
        ctx.stroke();

        // Texto com Glow Neon Amarelo/Branco
        ctx.fillStyle = '#FFD700'; // Dourado/Amarelo Viral
        ctx.fillText(text, centerX, centerY);

        ctx.restore();
    }
}
