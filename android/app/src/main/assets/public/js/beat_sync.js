/**
 * FrankenCut 600+ Beat Detection & Rhythm Sync
 * Extraído e adaptado de essentia.js / web-audio-beat-detector (MIT)
 */
export class BeatDetector {
    constructor(audioContext) {
        this.ctx = audioContext;
    }

    /**
     * Análise simplificada de energia espectral para encontrar batidas em baixa latência
     */
    detectBeatsFromBuffer(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const bufferSize = 1024;
        const peaks = [];
        
        let localEnergySum = 0;
        const energyHistory = [];
        const historySize = 43; // ~1 segundo de histórico

        for (let i = 0; i < channelData.length; i += bufferSize) {
            let instantEnergy = 0;
            for (let j = 0; j < bufferSize && (i + j) < channelData.length; j++) {
                const sample = channelData[i + j];
                instantEnergy += sample * sample;
            }

            // Média local
            let avgEnergy = 0;
            if (energyHistory.length > 0) {
                avgEnergy = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
            }

            // Se a energia instantânea for 1.35x maior que a média histórica -> Beat detectado
            if (instantEnergy > 1.35 * avgEnergy && instantEnergy > 0.05) {
                const timestampSec = (i / sampleRate);
                // Evita batidas coladas (< 200ms de distância)
                if (peaks.length === 0 || (timestampSec - peaks[peaks.length - 1].time) > 0.20) {
                    peaks.push({
                        time: timestampSec,
                        intensity: Math.min(1.0, instantEnergy)
                    });
                }
            }

            energyHistory.push(instantEnergy);
            if (energyHistory.length > historySize) {
                energyHistory.shift();
            }
        }

        return peaks;
    }
}
