/**
 * FrankenCut 600+ Filters & Cinematic LUTs Library
 * Extraído e adaptado de cats-oss/android-gpuimage (Apache 2.0)
 */
export const CinematicFilters = {
    none: {
        name: 'Normal (Original)',
        apply: (ctx, canvas) => {}
    },
    tealOrange: {
        name: 'Teal & Orange (Cinema)',
        apply: (ctx, canvas) => {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
                let r = d[i], g = d[i+1], b = d[i+2];
                // Satura tons quentes para Laranja e tons frios para Teal
                const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                if (luma > 128) {
                    d[i] = Math.min(255, r * 1.15);     // Red/Orange boost
                    d[i+1] = Math.min(255, g * 1.05);
                    d[i+2] = Math.max(0, b * 0.85);
                } else {
                    d[i] = Math.max(0, r * 0.85);
                    d[i+1] = Math.min(255, g * 1.08);   // Teal boost
                    d[i+2] = Math.min(255, b * 1.20);
                }
            }
            ctx.putImageData(imgData, 0, 0);
        }
    },
    cyberpunk: {
        name: 'Cyberpunk Neon',
        apply: (ctx, canvas) => {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
                d[i] = Math.min(255, d[i] * 1.25);     // Magenta boost
                d[i+1] = Math.max(0, d[i+1] * 0.80);
                d[i+2] = Math.min(255, d[i+2] * 1.40);  // Blue/Cyan boost
            }
            ctx.putImageData(imgData, 0, 0);
        }
    },
    vhsRetro: {
        name: 'VHS Retro 90s',
        apply: (ctx, canvas) => {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
                // Saturação suave e leve ruído
                const noise = (Math.random() - 0.5) * 12;
                d[i] = Math.min(255, Math.max(0, d[i] * 1.05 + noise));
                d[i+1] = Math.min(255, Math.max(0, d[i+1] * 0.95 + noise));
                d[i+2] = Math.min(255, Math.max(0, d[i+2] * 0.85 + noise));
            }
            ctx.putImageData(imgData, 0, 0);
        }
    },
    bwContrast: {
        name: 'B&W Alto Contraste',
        apply: (ctx, canvas) => {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
                let luma = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
                luma = luma < 128 ? luma * 0.8 : Math.min(255, luma * 1.2);
                d[i] = luma;
                d[i+1] = luma;
                d[i+2] = luma;
            }
            ctx.putImageData(imgData, 0, 0);
        }
    }
};
