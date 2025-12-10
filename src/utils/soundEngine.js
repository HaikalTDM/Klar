// Advanced Sound Engine with Multi-Track Mixing
// Supports multiple simultaneous ambient sounds with individual volume control

export const SoundEngine = {
    ctx: null,
    tracks: {}, // { trackId: { source, gain, type } }
    masterGain: null,

    init() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.ctx.createGain();
                this.masterGain.connect(this.ctx.destination);
                this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
            } catch (e) {
                console.warn("AudioContext not supported", e);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // Generate distinct noise buffers for each type
    generateNoiseBuffer(type) {
        const sampleRate = this.ctx.sampleRate;
        const bufferSize = 4 * sampleRate; // 4 seconds, will loop
        const buffer = this.ctx.createBuffer(2, bufferSize, sampleRate); // Stereo

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);

            // Each sound type gets its own unique algorithm
            switch (type) {
                case 'brown':
                    this.generateBrownNoise(data, bufferSize);
                    break;
                case 'pink':
                    this.generatePinkNoise(data, bufferSize);
                    break;
                case 'rain':
                    this.generateRain(data, bufferSize, sampleRate, channel);
                    break;
                case 'wind':
                    this.generateWind(data, bufferSize, sampleRate, channel);
                    break;
                case 'fire':
                    this.generateFire(data, bufferSize, sampleRate, channel);
                    break;
                case 'waves':
                    this.generateWaves(data, bufferSize, sampleRate, channel);
                    break;
                case 'lofi':
                    this.generateLofi(data, bufferSize, sampleRate, channel);
                    break;
                default:
                    this.generateWhiteNoise(data, bufferSize);
            }
        }

        return buffer;
    },

    // White noise - base for many sounds
    generateWhiteNoise(data, length) {
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
    },

    // Brown noise - deep, rumbling, warm
    generateBrownNoise(data, length) {
        let lastOut = 0;
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + (0.02 * white)) / 1.02;
            data[i] = lastOut * 3.5;
        }
    },

    // Pink noise - balanced, natural sounding
    generatePinkNoise(data, length) {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
    },

    // Rain - realistic rainfall with varying droplet sizes and stereo depth
    generateRain(data, length, sampleRate, channel) {
        // Multi-layer approach: constant drizzle + medium drops + occasional heavy drops
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0;

        // Different drop patterns for left/right channels
        const channelOffset = channel * 0.3;

        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;

            // Layer 1: Constant drizzle (pink noise base)
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            let sample = (b0 + b1 + b2) * 0.12;

            // Layer 2: Small drops (frequent, soft)
            if (Math.random() < 0.002 + channelOffset) {
                const dropSize = Math.random() * 0.15 + 0.05;
                const dropDecay = Math.floor(sampleRate * 0.008);
                for (let j = 0; j < dropDecay && i + j < length; j++) {
                    const envelope = Math.exp(-j / (dropDecay * 0.3));
                    data[i + j] = (data[i + j] || 0) + (Math.random() * 2 - 1) * dropSize * envelope;
                }
            }

            // Layer 3: Medium drops (moderate frequency)
            if (Math.random() < 0.0006) {
                const dropSize = Math.random() * 0.3 + 0.15;
                const dropDecay = Math.floor(sampleRate * 0.015);
                for (let j = 0; j < dropDecay && i + j < length; j++) {
                    const envelope = Math.exp(-j / (dropDecay * 0.4));
                    data[i + j] = (data[i + j] || 0) + (Math.random() * 2 - 1) * dropSize * envelope;
                }
            }

            // Layer 4: Large drops (occasional, pronounced)
            if (Math.random() < 0.0002) {
                const dropSize = Math.random() * 0.5 + 0.3;
                const dropDecay = Math.floor(sampleRate * 0.025);
                for (let j = 0; j < dropDecay && i + j < length; j++) {
                    const envelope = Math.exp(-j / (dropDecay * 0.5));
                    const splash = j < dropDecay * 0.3 ? 1 : 0.6; // Initial impact + tail
                    data[i + j] = (data[i + j] || 0) + (Math.random() * 2 - 1) * dropSize * envelope * splash;
                }
            }

            // Add subtle low-frequency rumble (distant thunder ambience)
            const rumble = Math.sin(i / (sampleRate * 8)) * 0.02;

            data[i] = sample + rumble;
        }
    },

    // Wind - realistic wind with multiple gust layers and turbulence
    generateWind(data, length, sampleRate, channel) {
        let lastOut = 0;

        // Different wind patterns for stereo
        const mainGustCycle = sampleRate * (4 + channel * 1.5);
        const subGustCycle = sampleRate * (1.2 + channel * 0.3);
        const microTurbulence = sampleRate * 0.15;

        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;

            // Base wind (brown noise)
            lastOut = (lastOut + (0.012 * white)) / 1.012;

            // Layer 1: Main gusts (slow, powerful)
            const mainGust = Math.pow((Math.sin(i / mainGustCycle) + 1) / 2, 0.8) * 0.6 + 0.4;

            // Layer 2: Sub-gusts (medium speed variations)
            const subGust = Math.sin(i / subGustCycle) * 0.2 + 0.8;

            // Layer 3: Micro-turbulence (fast, subtle variations)
            const turbulence = Math.sin(i / microTurbulence) * 0.15 + 0.85;

            // Layer 4: Random gusts (occasional strong bursts)
            let gustBurst = 1;
            if (Math.random() < 0.00008) {
                const burstLength = Math.floor(sampleRate * (0.5 + Math.random() * 1.5));
                for (let j = 0; j < burstLength && i + j < length; j++) {
                    const burstEnvelope = Math.sin((j / burstLength) * Math.PI);
                    data[i + j] = (data[i + j] || 0) * (1 + burstEnvelope * 0.8);
                }
            }

            // Combine all layers
            data[i] = lastOut * 2.8 * mainGust * subGust * turbulence;
        }
    },

    // Fire - realistic fireplace with crackling wood and ember pops
    generateFire(data, length, sampleRate, channel) {
        let lastOut = 0;

        // Stereo variation
        const channelPhase = channel * Math.PI;

        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;

            // Layer 1: Warm base (deep filtered brown noise)
            lastOut = (lastOut + (0.028 * white)) / 1.028;
            let sample = lastOut * 1.8;

            // Layer 2: Flickering (slow amplitude modulation)
            const flicker = Math.sin(i / (sampleRate * 0.8) + channelPhase) * 0.15 + 0.85;
            sample *= flicker;

            // Layer 3: Small crackles (frequent, subtle)
            if (Math.random() < 0.0015) {
                const crackleSize = Math.random() * 0.2 + 0.1;
                const crackleLength = Math.floor(sampleRate * (0.01 + Math.random() * 0.02));
                for (let j = 0; j < crackleLength && i + j < length; j++) {
                    const envelope = Math.exp(-j / (crackleLength * 0.4));
                    data[i + j] = (data[i + j] || 0) + (Math.random() * 2 - 1) * crackleSize * envelope;
                }
            }

            // Layer 4: Medium crackles (wood splitting)
            if (Math.random() < 0.0004) {
                const crackleSize = Math.random() * 0.4 + 0.2;
                const crackleLength = Math.floor(sampleRate * (0.03 + Math.random() * 0.04));
                for (let j = 0; j < crackleLength && i + j < length; j++) {
                    const envelope = Math.exp(-j / (crackleLength * 0.5));
                    // Add some pitch variation
                    const pitch = Math.sin(j / (crackleLength * 0.1)) * 0.3;
                    data[i + j] = (data[i + j] || 0) + (Math.random() * 2 - 1 + pitch) * crackleSize * envelope;
                }
            }

            // Layer 5: Large pops (ember bursts)
            if (Math.random() < 0.00015) {
                const popSize = Math.random() * 0.6 + 0.3;
                const popLength = Math.floor(sampleRate * (0.05 + Math.random() * 0.08));
                for (let j = 0; j < popLength && i + j < length; j++) {
                    const envelope = Math.exp(-j / (popLength * 0.6));
                    const attack = j < popLength * 0.1 ? j / (popLength * 0.1) : 1;
                    data[i + j] = (data[i + j] || 0) + (Math.random() * 2 - 1) * popSize * envelope * attack;
                }
            }

            // Layer 6: Very subtle hiss (burning)
            sample += white * 0.03;

            data[i] = sample;
        }
    },

    // Ocean waves - realistic seaside with swell, foam, and distant crashes
    generateWaves(data, length, sampleRate, channel) {
        let lastOut = 0;
        
        // Different wave timing for stereo depth
        const mainWaveCycle = sampleRate * (7 + channel * 2);
        const subWaveCycle = sampleRate * (3 + channel * 0.5);
        const foamCycle = sampleRate * 0.6;
        
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            
            // Base ocean sound (filtered brown noise)
            lastOut = (lastOut + (0.01 * white)) / 1.01;
            
            // Layer 1: Main wave swell (slow, powerful rhythm)
            const mainWave = Math.pow((Math.sin(i / mainWaveCycle) + 1) / 2, 2);
            
            // Layer 2: Secondary waves (faster, overlapping)
            const subWave = Math.pow((Math.sin(i / subWaveCycle) + 1) / 2, 1.5) * 0.5;
            
            // Layer 3: Foam and turbulence (constant, textured)
            const foam = Math.sin(i / foamCycle) * 0.2 + 0.8;
            
            // Layer 4: Wave crashes (occasional loud moments)
            let crash = 0;
            const wavePhase = (i % mainWaveCycle) / mainWaveCycle;
            if (wavePhase > 0.7 && wavePhase < 0.85) {
                // Peak of wave - add crash sound
                const crashIntensity = Math.pow((wavePhase - 0.7) / 0.15, 2) * 
                                      Math.pow(1 - (wavePhase - 0.7) / 0.15, 0.5);
                crash = (Math.random() * 2 - 1) * crashIntensity * 0.8;
            }
            
            // Layer 5: Distant waves (very subtle background)
            const distantWave = Math.sin(i / (sampleRate * 12)) * 0.05;
            
            // Combine all layers
            const waveMix = mainWave * 2.5 + subWave * 1.2;
            data[i] = (lastOut * (1 + waveMix) * foam) + crash + distantWave;
        }
    },

    // Lo-fi - warm noise with vinyl crackle
    generateLofi(data, length, sampleRate, channel) {
        let lastOut = 0;
        const vinylSpeed = sampleRate * 1.8; // ~33rpm cycle

        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            // Very warm, filtered noise
            lastOut = (lastOut + (0.008 * white)) / 1.008;
            let sample = lastOut * 1.5;

            // Subtle vinyl wobble
            sample *= 0.95 + Math.sin(i / vinylSpeed) * 0.05;

            // Occasional soft crackles
            if (Math.random() < 0.0003) {
                sample += (Math.random() - 0.5) * 0.15;
            }

            // Very subtle hiss
            sample += white * 0.02;

            data[i] = sample;
        }
    },

    // Start a track with smooth fade in
    startTrack(trackId, volume = 0.5) {
        this.init();
        if (!this.ctx || trackId === 'none') return;

        // Stop existing track first
        if (this.tracks[trackId]) {
            this.stopTrack(trackId);
        }

        try {
            const buffer = this.generateNoiseBuffer(trackId);
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            const gainNode = this.ctx.createGain();
            // Start at 0 and fade in smoothly
            gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * 0.2, this.ctx.currentTime + 0.5);

            source.connect(gainNode);
            gainNode.connect(this.masterGain);
            source.start();

            this.tracks[trackId] = { source, gain: gainNode, targetVolume: volume };
        } catch (e) {
            console.error(`Error starting track ${trackId}:`, e);
        }
    },

    // Stop a track with smooth fade out
    stopTrack(trackId) {
        const track = this.tracks[trackId];
        if (track && this.ctx) {
            try {
                const now = this.ctx.currentTime;
                track.gain.gain.cancelScheduledValues(now);
                track.gain.gain.setValueAtTime(track.gain.gain.value, now);
                // Smooth fade out to prevent pops
                track.gain.gain.linearRampToValueAtTime(0, now + 0.3);

                const source = track.source;
                setTimeout(() => {
                    try {
                        source.stop();
                        source.disconnect();
                    } catch (e) { }
                }, 350);

                delete this.tracks[trackId];
            } catch (e) {
                console.warn(`Error stopping track ${trackId}:`, e);
            }
        }
    },

    // Smoothly update volume for a specific track
    updateTrackVolume(trackId, volume) {
        const track = this.tracks[trackId];
        if (track && this.ctx) {
            // Use setTargetAtTime for smooth, click-free volume changes
            // This handles rapid changes (like slider dragging) without audio artifacts
            const targetValue = volume * 0.2;
            const timeConstant = 0.015; // 15ms time constant for smooth but responsive changes
            track.gain.gain.setTargetAtTime(targetValue, this.ctx.currentTime, timeConstant);
            track.targetVolume = volume;
        }
    },

    // Apply mixer config: { brown: 0.5, rain: 0.8, ... }
    applyMixerConfig(config) {
        this.init();

        const activeTrackIds = Object.keys(config).filter(id => config[id] > 0 && id !== 'none');

        // Stop tracks no longer in config
        Object.keys(this.tracks).forEach(trackId => {
            if (!activeTrackIds.includes(trackId)) {
                this.stopTrack(trackId);
            }
        });

        // Start/update tracks
        activeTrackIds.forEach(trackId => {
            const volume = config[trackId];
            if (this.tracks[trackId]) {
                this.updateTrackVolume(trackId, volume);
            } else {
                this.startTrack(trackId, volume);
            }
        });
    },

    // Stop all tracks
    stopAll() {
        Object.keys(this.tracks).forEach(trackId => {
            this.stopTrack(trackId);
        });
    },

    // Legacy support
    startAmbient(type, volume = 0.5) {
        this.stopAll();
        if (type !== 'none') {
            this.startTrack(type, volume);
        }
    },

    stopAmbient() {
        this.stopAll();
    },

    updateAmbientVolume(volume) {
        Object.keys(this.tracks).forEach(trackId => {
            this.updateTrackVolume(trackId, volume);
        });
    },

    // Sound effects
    playTone(freq, type, duration, vol = 0.1) {
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.error("Error playing tone:", e);
        }
    },

    playComplete() {
        this.playTone(523.25, 'sine', 0.6, 0.1);
        setTimeout(() => this.playTone(659.25, 'sine', 0.6, 0.1), 100);
    },

    playAlarm() {
        this.init();
        if (!this.ctx) return;
        [0, 0.2, 0.4].forEach(offset => {
            setTimeout(() => this.playTone(880, 'square', 0.1, 0.05), offset * 1000);
        });
    }
};
