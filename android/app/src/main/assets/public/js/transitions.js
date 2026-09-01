/**
 * FrankenCut 600+ GL Transitions Library
 * Extraído e adaptado de gl-transitions/gl-transitions (MIT)
 */
export const GLTransitions = {
    crossfade: {
        name: 'Dissolve (Suave)',
        render: (ctx, canvas, progress, fromImg, toImg) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
            ctx.drawImage(fromImg, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = progress;
            ctx.drawImage(toImg, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
        }
    },
    zoomIn: {
        name: 'Zoom In (Impacto)',
        render: (ctx, canvas, progress, fromImg, toImg) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const scaleFrom = 1.0 + progress * 0.4;
            const wF = canvas.width * scaleFrom;
            const hF = canvas.height * scaleFrom;
            const xF = (canvas.width - wF) / 2;
            const yF = (canvas.height - hF) / 2;
            
            ctx.globalAlpha = 1.0 - progress;
            ctx.drawImage(fromImg, xF, yF, wF, hF);
            
            const scaleTo = 0.8 + progress * 0.2;
            const wT = canvas.width * scaleTo;
            const hT = canvas.height * scaleTo;
            const xT = (canvas.width - wT) / 2;
            const yT = (canvas.height - hT) / 2;
            
            ctx.globalAlpha = progress;
            ctx.drawImage(toImg, xT, yT, wT, hT);
            ctx.globalAlpha = 1.0;
        }
    },
    flashWhite: {
        name: 'Flash Branco (TikTok)',
        render: (ctx, canvas, progress, fromImg, toImg) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const img = progress < 0.5 ? fromImg : toImg;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Efeito Flash
            const flashAlpha = progress < 0.5 ? progress * 2 : (1.0 - progress) * 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.85})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    },
    whipLeft: {
        name: 'Whip Pan (Esquerda)',
        render: (ctx, canvas, progress, fromImg, toImg) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const ease = progress * progress * (3 - 2 * progress); // Hermite curve
            const offset = ease * canvas.width;
            
            ctx.drawImage(fromImg, -offset, 0, canvas.width, canvas.height);
            ctx.drawImage(toImg, canvas.width - offset, 0, canvas.width, canvas.height);
        }
    }
};
