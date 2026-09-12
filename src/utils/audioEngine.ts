/**
 * Web Audio API engine for Nostalgic Era Soundscapes, Ambient Atmospheres,
 * Reminiscence Speech Prompts, and Companion Voice Notes.
 * Operates purely in-browser without external MP3 asset dependencies.
 */

// Web Audio Context & Nodes singleton
let audioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let musicGainNode: GainNode | null = null;
let ambienceGainNode: GainNode | null = null;
let masterAnalyserNode: AnalyserNode | null = null;

// State tracking
let isAudioPlaying = false;
let currentPlayingEra: string | null = null;
let musicIntervalId: number | null = null;
let activeOscillators: { stop: () => void; osc?: OscillatorNode; gain?: GainNode }[] = [];

// Ambient Layer Sound Sources
export type SoundscapeLayerId = 'vinyl' | 'rain' | 'fireplace' | 'birds' | 'am_radio';

interface ActiveLayer {
  source: AudioNode;
  stop: () => void;
  gain: GainNode;
}

const activeAmbientLayers: Partial<Record<SoundscapeLayerId, ActiveLayer>> = {};

// Default Volume Settings (0.0 to 1.0)
let masterVol = 0.8;
let musicVol = 0.7;
let ambienceVol = 0.5;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }

  if (!masterGainNode && audioCtx) {
    masterGainNode = audioCtx.createGain();
    masterGainNode.gain.value = masterVol;

    musicGainNode = audioCtx.createGain();
    musicGainNode.gain.value = musicVol;

    ambienceGainNode = audioCtx.createGain();
    ambienceGainNode.gain.value = ambienceVol;

    masterAnalyserNode = audioCtx.createAnalyser();
    masterAnalyserNode.fftSize = 64;

    musicGainNode.connect(masterGainNode);
    ambienceGainNode.connect(masterGainNode);
    masterGainNode.connect(masterAnalyserNode);
    masterAnalyserNode.connect(audioCtx.destination);
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function getMasterAnalyser(): AnalyserNode | null {
  getAudioContext();
  return masterAnalyserNode;
}

// Volume Controls
export function setMasterVolume(vol: number): void {
  masterVol = Math.max(0, Math.min(1, vol));
  if (masterGainNode && audioCtx) {
    masterGainNode.gain.setTargetAtTime(masterVol, audioCtx.currentTime, 0.05);
  }
}

export function setMusicVolume(vol: number): void {
  musicVol = Math.max(0, Math.min(1, vol));
  if (musicGainNode && audioCtx) {
    musicGainNode.gain.setTargetAtTime(musicVol, audioCtx.currentTime, 0.05);
  }
}

export function setAmbienceVolume(vol: number): void {
  ambienceVol = Math.max(0, Math.min(1, vol));
  if (ambienceGainNode && audioCtx) {
    ambienceGainNode.gain.setTargetAtTime(ambienceVol, audioCtx.currentTime, 0.05);
  }
}

export function getVolumeSettings(): { master: number; music: number; ambience: number } {
  return { master: masterVol, music: musicVol, ambience: ambienceVol };
}

/**
 * Ambient Soundscape Layer Generators
 */

// 1. Authentic Vintage Vinyl Record Crackle, Pops, and Spindle Flutter
function startVinylLayer(ctx: AudioContext, targetGainNode: GainNode): ActiveLayer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    const pink = (lastOut + 0.02 * white) / 1.02;
    lastOut = pink;
    const isPop = Math.random() < 0.001;
    const popVal = isPop ? (Math.random() * 2 - 1) * 0.45 : 0;
    data[i] = pink * 0.05 + popVal;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2400;
  filter.Q.value = 1.2;

  const layerGain = ctx.createGain();
  layerGain.gain.value = 0.35;

  noiseSource.connect(filter);
  filter.connect(layerGain);
  layerGain.connect(targetGainNode);
  noiseSource.start();

  return {
    source: noiseSource,
    gain: layerGain,
    stop: () => {
      try {
        noiseSource.stop();
        noiseSource.disconnect();
      } catch (_) {}
    },
  };
}

// 2. Cozy Rain on Windowpane (Soothing pink/brown noise with resonant droplet drops)
function startRainLayer(ctx: AudioContext, targetGainNode: GainNode): ActiveLayer {
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Brown noise filter approximation (deep, relaxing rain)
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 0.25;
  }

  const rainSource = ctx.createBufferSource();
  rainSource.buffer = buffer;
  rainSource.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1400;

  const layerGain = ctx.createGain();
  layerGain.gain.value = 0.38;

  rainSource.connect(filter);
  filter.connect(layerGain);
  layerGain.connect(targetGainNode);
  rainSource.start();

  return {
    source: rainSource,
    gain: layerGain,
    stop: () => {
      try {
        rainSource.stop();
        rainSource.disconnect();
      } catch (_) {}
    },
  };
}

// 3. Crackling Hearth Fireplace (Warm low-frequency rumble with sharp ember snaps)
function startFireplaceLayer(ctx: AudioContext, targetGainNode: GainNode): ActiveLayer {
  const bufferSize = ctx.sampleRate * 2.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let lastBrown = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastBrown = (lastBrown + 0.03 * white) / 1.03;
    // Ember spark impulses
    const isEmber = Math.random() < 0.0018;
    const emberSnap = isEmber ? (Math.random() * 2 - 1) * 0.5 : 0;
    data[i] = lastBrown * 0.16 + emberSnap;
  }

  const fireSource = ctx.createBufferSource();
  fireSource.buffer = buffer;
  fireSource.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 850;

  const layerGain = ctx.createGain();
  layerGain.gain.value = 0.42;

  fireSource.connect(filter);
  filter.connect(layerGain);
  layerGain.connect(targetGainNode);
  fireSource.start();

  return {
    source: fireSource,
    gain: layerGain,
    stop: () => {
      try {
        fireSource.stop();
        fireSource.disconnect();
      } catch (_) {}
    },
  };
}

// 4. Summer Porch Breeze & Birds (Gentle resonant wind swept with sporadic soft chirps)
function startBirdsLayer(ctx: AudioContext, targetGainNode: GainNode): ActiveLayer {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let lastWind = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastWind = (lastWind + 0.015 * white) / 1.015;
    data[i] = lastWind * 0.09;
  }

  const windSource = ctx.createBufferSource();
  windSource.buffer = buffer;
  windSource.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 600;
  filter.Q.value = 2.0;

  const layerGain = ctx.createGain();
  layerGain.gain.value = 0.28;

  windSource.connect(filter);
  filter.connect(layerGain);
  layerGain.connect(targetGainNode);
  windSource.start();

  // Periodic sweet birdsong chirps
  const chirpInterval = window.setInterval(() => {
    if (!audioCtx || !activeAmbientLayers.birds) return;
    try {
      const now = audioCtx.currentTime;
      const chirpOsc = audioCtx.createOscillator();
      const chirpGain = audioCtx.createGain();
      chirpOsc.type = 'sine';
      chirpOsc.frequency.setValueAtTime(2800 + Math.random() * 600, now);
      chirpOsc.frequency.exponentialRampToValueAtTime(3600 + Math.random() * 800, now + 0.08);
      chirpOsc.frequency.exponentialRampToValueAtTime(2600 + Math.random() * 400, now + 0.16);

      chirpGain.gain.setValueAtTime(0.001, now);
      chirpGain.gain.linearRampToValueAtTime(0.06, now + 0.04);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      chirpOsc.connect(chirpGain);
      chirpGain.connect(layerGain);
      chirpOsc.start(now);
      chirpOsc.stop(now + 0.22);
    } catch (_) {}
  }, 4200);

  return {
    source: windSource,
    gain: layerGain,
    stop: () => {
      clearInterval(chirpInterval);
      try {
        windSource.stop();
        windSource.disconnect();
      } catch (_) {}
    },
  };
}

// 5. Vintage AM Tube Radio Warmth (Mellow bandpass with analog saturation)
function startAmRadioLayer(ctx: AudioContext, targetGainNode: GainNode): ActiveLayer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.025;
  }

  const amSource = ctx.createBufferSource();
  amSource.buffer = buffer;
  amSource.loop = true;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1600;
  bandpass.Q.value = 0.8;

  const layerGain = ctx.createGain();
  layerGain.gain.value = 0.25;

  amSource.connect(bandpass);
  bandpass.connect(layerGain);
  layerGain.connect(targetGainNode);
  amSource.start();

  return {
    source: amSource,
    gain: layerGain,
    stop: () => {
      try {
        amSource.stop();
        amSource.disconnect();
      } catch (_) {}
    },
  };
}

/**
 * Toggle individual Ambient Soundscape Layers on or off in real time
 */
export function toggleAmbientLayer(layerId: SoundscapeLayerId, enabled: boolean): void {
  const ctx = getAudioContext();
  if (!ambienceGainNode) return;

  if (!enabled && activeAmbientLayers[layerId]) {
    activeAmbientLayers[layerId]?.stop();
    delete activeAmbientLayers[layerId];
    return;
  }

  if (enabled && !activeAmbientLayers[layerId]) {
    switch (layerId) {
      case 'vinyl':
        activeAmbientLayers.vinyl = startVinylLayer(ctx, ambienceGainNode);
        break;
      case 'rain':
        activeAmbientLayers.rain = startRainLayer(ctx, ambienceGainNode);
        break;
      case 'fireplace':
        activeAmbientLayers.fireplace = startFireplaceLayer(ctx, ambienceGainNode);
        break;
      case 'birds':
        activeAmbientLayers.birds = startBirdsLayer(ctx, ambienceGainNode);
        break;
      case 'am_radio':
        activeAmbientLayers.am_radio = startAmRadioLayer(ctx, ambienceGainNode);
        break;
    }
  }
}

export function getActiveAmbientLayers(): Record<SoundscapeLayerId, boolean> {
  return {
    vinyl: !!activeAmbientLayers.vinyl,
    rain: !!activeAmbientLayers.rain,
    fireplace: !!activeAmbientLayers.fireplace,
    birds: !!activeAmbientLayers.birds,
    am_radio: !!activeAmbientLayers.am_radio,
  };
}

export function stopAllAmbientLayers(): void {
  (Object.keys(activeAmbientLayers) as SoundscapeLayerId[]).forEach((layerId) => {
    activeAmbientLayers[layerId]?.stop();
    delete activeAmbientLayers[layerId];
  });
}

/**
 * Rich Era Music Presets with authentic chords, walking bass, and lead motifs
 */
export const ERA_PRESETS = {
  '1940s': {
    title: 'Sentimental Swing & Big Band',
    subtitle: 'Glenn Miller, Tommy Dorsey & Warm Brass Harmony Strum',
    description: 'Upbeat yet gentle swing rhythms with lush 6th and major 7th chord voicings that transport seniors to wartime dances and victory parades.',
    bpm: 88,
    chords: [
      { bass: 130.81, notes: [261.63, 329.63, 392.0, 440.0], lead: 523.25 }, // C6
      { bass: 110.00, notes: [220.0, 261.63, 329.63, 392.0], lead: 493.88 }, // Am7
      { bass: 146.83, notes: [174.61, 220.0, 261.63, 349.23], lead: 440.0 }, // Dm7
      { bass: 98.00, notes: [196.0, 246.94, 293.66, 349.23], lead: 392.0 },  // G7
      { bass: 130.81, notes: [261.63, 329.63, 392.0, 493.88], lead: 659.25 }, // Cmaj7
      { bass: 87.31, notes: [174.61, 220.0, 261.63, 329.63], lead: 587.33 },  // Fmaj7
      { bass: 82.41, notes: [164.81, 196.0, 246.94, 293.66], lead: 493.88 },  // Em7
      { bass: 110.00, notes: [220.0, 277.18, 329.63, 392.0], lead: 440.0 },  // A7
    ],
    waveType: 'triangle' as OscillatorType,
    leadWave: 'sine' as OscillatorType,
    vibrato: true,
  },
  '1950s': {
    title: 'Moonlight Jazz Club & Crooner',
    subtitle: 'Nat King Cole, Miles Davis & Velvet Upright Bass',
    description: 'Smooth and romantic night lounge melodies with smoky jazz chords and soft walking basslines that inspire peaceful smiles.',
    bpm: 74,
    chords: [
      { bass: 87.31, notes: [174.61, 220.0, 261.63, 329.63, 392.0], lead: 523.25 }, // Fmaj9
      { bass: 82.41, notes: [164.81, 196.0, 233.08, 293.66], lead: 466.16 },         // Em7b5
      { bass: 110.00, notes: [220.0, 277.18, 329.63, 415.30], lead: 440.0 },         // A7#9
      { bass: 146.83, notes: [174.61, 220.0, 261.63, 329.63], lead: 392.0 },         // Dm9
      { bass: 98.00, notes: [196.0, 246.94, 329.63, 349.23], lead: 349.23 },          // G13
      { bass: 98.00, notes: [196.0, 233.08, 293.66, 349.23], lead: 392.0 },          // Gm7
      { bass: 130.81, notes: [261.63, 329.63, 392.0, 466.16], lead: 523.25 },        // C7b9
      { bass: 87.31, notes: [174.61, 220.0, 261.63, 329.63], lead: 440.0 },          // Fmaj7
    ],
    waveType: 'sine' as OscillatorType,
    leadWave: 'triangle' as OscillatorType,
    vibrato: true,
  },
  '1960s': {
    title: 'Greenwich Village Acoustic Folk & Pop',
    subtitle: 'Simon & Garfunkel, Joan Baez & Gentle Fingerpicking',
    description: 'Warm acoustic parlor guitar arpeggios that bring back memories of coffee houses, campus lawns, and transistor radios.',
    bpm: 84,
    chords: [
      { bass: 130.81, notes: [261.63, 329.63, 392.0], lead: 523.25 }, // C
      { bass: 123.47, notes: [246.94, 293.66, 392.0], lead: 493.88 }, // G/B
      { bass: 110.00, notes: [220.0, 261.63, 329.63], lead: 440.0 },  // Am
      { bass: 82.41, notes: [164.81, 246.94, 329.63], lead: 392.0 },  // Em
      { bass: 87.31, notes: [174.61, 220.0, 261.63, 329.63], lead: 440.0 }, // Fmaj7
      { bass: 82.41, notes: [164.81, 261.63, 329.63], lead: 392.0 },  // C/E
      { bass: 146.83, notes: [174.61, 220.0, 261.63, 349.23], lead: 349.23 }, // Dm7
      { bass: 98.00, notes: [196.0, 246.94, 293.66, 349.23], lead: 392.0 },  // G7
    ],
    waveType: 'triangle' as OscillatorType,
    leadWave: 'sine' as OscillatorType,
    vibrato: false,
  },
  '1970s': {
    title: 'Golden Rhodes & Warm Vinyl Soul',
    subtitle: 'Stevie Wonder, Bill Withers & Lush Electric Chimes',
    description: 'Rich electric Rhodes piano bell tones with soulful basslines that evoke golden evening sunsets and cozy living room stereos.',
    bpm: 80,
    chords: [
      { bass: 146.83, notes: [293.66, 369.99, 440.0, 554.37], lead: 587.33 }, // Dmaj9
      { bass: 138.59, notes: [277.18, 349.23, 415.30, 523.25], lead: 554.37 }, // C#m7
      { bass: 123.47, notes: [246.94, 311.13, 369.99, 466.16], lead: 440.0 },  // Bm7
      { bass: 110.00, notes: [220.0, 277.18, 329.63, 440.0], lead: 493.88 },   // Amaj7
      { bass: 98.00, notes: [196.0, 246.94, 293.66, 369.99], lead: 440.0 },    // Gmaj7
      { bass: 92.50, notes: [185.0, 220.0, 277.18, 329.63], lead: 369.99 },    // F#m7
      { bass: 82.41, notes: [164.81, 196.0, 246.94, 329.63], lead: 329.63 },   // Em7
      { bass: 110.00, notes: [220.0, 277.18, 329.63, 415.30], lead: 440.0 },   // A13
    ],
    waveType: 'sine' as OscillatorType,
    leadWave: 'triangle' as OscillatorType,
    vibrato: true,
  },
};

export interface EraPlaybackOptions {
  withVinyl?: boolean;
  withRain?: boolean;
  withFireplace?: boolean;
  withBirds?: boolean;
  withAmRadio?: boolean;
}

/**
 * Play authentic nostalgic era music with optional ambient soundscape layers
 */
export function playEraMusic(
  eraKey: keyof typeof ERA_PRESETS,
  optionsOrCrackle: EraPlaybackOptions | boolean = true,
  onStateChange?: (isPlaying: boolean) => void
): void {
  stopEraMusic();

  const ctx = getAudioContext();
  const preset = ERA_PRESETS[eraKey];
  if (!preset || !musicGainNode) return;

  isAudioPlaying = true;
  currentPlayingEra = eraKey;

  // Resolve options (backwards compatible with boolean withVinylCrackle)
  const options: EraPlaybackOptions = typeof optionsOrCrackle === 'boolean'
    ? { withVinyl: optionsOrCrackle }
    : optionsOrCrackle;

  if (options.withVinyl) toggleAmbientLayer('vinyl', true);
  if (options.withRain) toggleAmbientLayer('rain', true);
  if (options.withFireplace) toggleAmbientLayer('fireplace', true);
  if (options.withBirds) toggleAmbientLayer('birds', true);
  if (options.withAmRadio) toggleAmbientLayer('am_radio', true);

  let chordIndex = 0;
  const beatIntervalMs = (60 / preset.bpm) * 1000 * 2; // 2 beats per chord

  const playNextChord = () => {
    if (!isAudioPlaying || !musicGainNode) return;
    const chordObj = preset.chords[chordIndex];
    chordIndex = (chordIndex + 1) % preset.chords.length;

    const now = ctx.currentTime;

    // 1. Deep warm acoustic bass note
    try {
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(chordObj.bass, now);

      bassGain.gain.setValueAtTime(0.001, now);
      bassGain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + (beatIntervalMs / 1000) * 0.95);

      bassOsc.connect(bassGain);
      bassGain.connect(musicGainNode);
      bassOsc.start(now);
      bassOsc.stop(now + (beatIntervalMs / 1000));

      activeOscillators.push({
        stop: () => {
          try {
            bassGain.gain.cancelScheduledValues(ctx.currentTime);
            bassGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
            bassOsc.stop(ctx.currentTime + 0.06);
          } catch (_) {}
        },
      });
    } catch (_) {}

    // 2. Harmonic Chord Voicing (gentle staggered human strumming)
    chordObj.notes.forEach((freq, noteIdx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = preset.waveType;
        const noteDelay = noteIdx * 0.04;
        const noteStart = now + noteDelay;

        osc.frequency.setValueAtTime(freq, noteStart);

        if (preset.vibrato) {
          const vibrato = ctx.createOscillator();
          vibrato.frequency.value = 4.8;
          const vibratoGain = ctx.createGain();
          vibratoGain.gain.value = 2.5;
          vibrato.connect(vibratoGain);
          vibratoGain.connect(osc.frequency);
          vibrato.start(noteStart);
          vibrato.stop(noteStart + 2.4);
        }

        // Warm tape & tube envelope
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.09, noteStart + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 2.2);

        osc.connect(gain);
        gain.connect(musicGainNode!);

        osc.start(noteStart);
        osc.stop(noteStart + 2.3);

        activeOscillators.push({
          stop: () => {
            try {
              gain.gain.cancelScheduledValues(ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
              osc.stop(ctx.currentTime + 0.06);
            } catch (_) {}
          },
        });
      } catch (_) {}
    });

    // 3. Delicate melodic lead note
    if (chordObj.lead) {
      try {
        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = preset.leadWave;
        const leadStart = now + 0.15;

        leadOsc.frequency.setValueAtTime(chordObj.lead, leadStart);

        leadGain.gain.setValueAtTime(0.001, leadStart);
        leadGain.gain.linearRampToValueAtTime(0.05, leadStart + 0.1);
        leadGain.gain.exponentialRampToValueAtTime(0.001, leadStart + 1.8);

        leadOsc.connect(leadGain);
        leadGain.connect(musicGainNode!);

        leadOsc.start(leadStart);
        leadOsc.stop(leadStart + 1.9);

        activeOscillators.push({
          stop: () => {
            try {
              leadGain.gain.cancelScheduledValues(ctx.currentTime);
              leadGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
              leadOsc.stop(ctx.currentTime + 0.06);
            } catch (_) {}
          },
        });
      } catch (_) {}
    }

    // Clean up stale oscillator handles periodically
    if (activeOscillators.length > 50) {
      activeOscillators = activeOscillators.slice(-20);
    }
  };

  playNextChord();
  musicIntervalId = window.setInterval(playNextChord, beatIntervalMs);
  onStateChange?.(true);
}

export function stopEraMusic(onStateChange?: (isPlaying: boolean) => void): void {
  isAudioPlaying = false;
  currentPlayingEra = null;

  if (musicIntervalId !== null) {
    clearInterval(musicIntervalId);
    musicIntervalId = null;
  }

  // Gracefully stop and ramp down active oscillators
  activeOscillators.forEach((item) => {
    try {
      item.stop();
    } catch (_) {}
  });
  activeOscillators = [];

  stopAllAmbientLayers();
  onStateChange?.(false);
}

export function isEraMusicPlaying(): boolean {
  return isAudioPlaying;
}

export function getCurrentPlayingEra(): string | null {
  return currentPlayingEra;
}

/**
 * Speech Synthesis (Read Reminiscence Prompts Aloud for Seniors)
 */
let isSpeakingPromptState = false;

export function speakReminiscencePrompt(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Slightly slower cadence for elderly listeners
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick warm natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Daniel'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      isSpeakingPromptState = true;
      onStart?.();
    };

    utterance.onend = () => {
      isSpeakingPromptState = false;
      onEnd?.();
    };

    utterance.onerror = () => {
      isSpeakingPromptState = false;
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    isSpeakingPromptState = false;
    return false;
  }
}

export function stopSpeakingPrompt(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
  isSpeakingPromptState = false;
}

export function isSpeakingPrompt(): boolean {
  return isSpeakingPromptState;
}

/**
 * Structured Reminiscence Prompts (Categorized by Era & Life Theme)
 */
export interface ReminiscencePromptItem {
  id: string;
  era: '1940s' | '1950s' | '1960s' | '1970s';
  topic: 'music' | 'childhood' | 'youth' | 'family' | 'culture' | 'love';
  topicLabel: string;
  prompt: string;
  sensoryCue: string;
}

export const STRUCTURED_REMINISCENCE_PROMPTS: ReminiscencePromptItem[] = [
  // 1940s
  {
    id: '40s-1',
    era: '1940s',
    topic: 'music',
    topicLabel: 'Big Band & Radio',
    prompt: 'What was your favorite radio program your family gathered around to listen to in the evenings?',
    sensoryCue: 'Think of the amber glow of the radio dial and the sound of big band brass in the living room.',
  },
  {
    id: '40s-2',
    era: '1940s',
    topic: 'culture',
    topicLabel: 'Historic Moments',
    prompt: 'Do you remember where you were when the church bells and factory whistles rang for victory in 1945?',
    sensoryCue: 'Remember neighbors spilling into the street, waving flags and hugging one another.',
  },
  {
    id: '40s-3',
    era: '1940s',
    topic: 'childhood',
    topicLabel: 'Sunday Afternoons',
    prompt: 'What did a quiet Sunday afternoon look like when you were growing up in the 1940s?',
    sensoryCue: 'The smell of starch, Sunday roast, and walking to church in best shoes.',
  },
  {
    id: '40s-4',
    era: '1940s',
    topic: 'family',
    topicLabel: 'Home Treats & Cooking',
    prompt: 'What was your favorite treat from the neighborhood confectionery or penny candy jar?',
    sensoryCue: 'The wooden floorboards of the corner store and brown paper candy bags.',
  },
  {
    id: '40s-5',
    era: '1940s',
    topic: 'love',
    topicLabel: 'Handwritten Letters',
    prompt: 'Did you or your family keep handwritten letters or postcards from friends who lived far away?',
    sensoryCue: 'Fountain pen ink, folded blue airmail paper, and the postal carrier knocking on the door.',
  },

  // 1950s
  {
    id: '50s-1',
    era: '1950s',
    topic: 'youth',
    topicLabel: 'First Car & Freedom',
    prompt: 'What was the first car you ever drove or rode in as a teenager? What color was it?',
    sensoryCue: 'Heavy chrome door handles, rolled-down windows, and the smell of warm vinyl car seats.',
  },
  {
    id: '50s-2',
    era: '1950s',
    topic: 'music',
    topicLabel: 'Sock Hops & 45s',
    prompt: 'Do you remember the very first 45 RPM record you bought with your own pocket money?',
    sensoryCue: 'The snap of the plastic yellow 45 adapter and dancing in wool socks on gym hardwood.',
  },
  {
    id: '50s-3',
    era: '1950s',
    topic: 'culture',
    topicLabel: 'Soda Fountains & Diners',
    prompt: 'Did you have a favorite local soda fountain or neighborhood diner counter?',
    sensoryCue: 'Tall red swivel stools, cold frosted milkshakes with metal shaker cups, and jukebox tunes.',
  },
  {
    id: '50s-4',
    era: '1950s',
    topic: 'family',
    topicLabel: 'Road Trips & Picnics',
    prompt: 'What was your favorite family vacation, lake trip, or summer road trip in the 50s?',
    sensoryCue: 'Metal Coleman coolers, roadside motels with neon signs, and cold watermelon slices.',
  },
  {
    id: '50s-5',
    era: '1950s',
    topic: 'love',
    topicLabel: 'First Dance & Courtship',
    prompt: 'Can you describe your favorite outfit for a Saturday dance or the first time you met your sweetheart?',
    sensoryCue: 'Poodle skirts, polished dress shoes, corsages, and nervous smiles by the punch bowl.',
  },

  // 1960s
  {
    id: '60s-1',
    era: '1960s',
    topic: 'culture',
    topicLabel: 'Apollo Moon Landing',
    prompt: 'Do you remember watching the Apollo 11 moon landing live on television in July 1969?',
    sensoryCue: 'The flickering black-and-white screen, Walter Cronkite, and the quiet awe in the room.',
  },
  {
    id: '60s-2',
    era: '1960s',
    topic: 'music',
    topicLabel: 'Folk, Motown & Radio',
    prompt: 'What musicians did you love listening to on your transistor radio or home stereo?',
    sensoryCue: 'Carrying a pocket radio with a single earphone while walking down tree-lined streets.',
  },
  {
    id: '60s-3',
    era: '1960s',
    topic: 'childhood',
    topicLabel: 'Neighborhood Games',
    prompt: 'What games did children in your neighborhood play outside until the streetlights came on?',
    sensoryCue: 'Hopscotch chalk, kickball on the asphalt, catching fireflies in glass jars.',
  },
  {
    id: '60s-4',
    era: '1960s',
    topic: 'family',
    topicLabel: 'Grandmother’s Kitchen',
    prompt: 'What was the signature meal or baked dessert that your mother or grandmother made best?',
    sensoryCue: 'Warm cinnamon aromas, rolling pins on floured boards, and Sunday gravy simmering.',
  },
  {
    id: '60s-5',
    era: '1960s',
    topic: 'love',
    topicLabel: 'First Home & Milestones',
    prompt: 'Do you remember moving into your first apartment or home? What was the first piece of furniture you chose?',
    sensoryCue: 'The jingle of front door keys, bare floors, and unpacking mismatched plates.',
  },

  // 1970s
  {
    id: '70s-1',
    era: '1970s',
    topic: 'music',
    topicLabel: 'Vinyl Hi-Fi & 8-Tracks',
    prompt: 'Do you remember your first living room stereo console or popping an 8-track tape into the dashboard?',
    sensoryCue: 'Brushed aluminum dials, glowing green receiver needles, and heavy walnut speakers.',
  },
  {
    id: '70s-2',
    era: '1970s',
    topic: 'culture',
    topicLabel: 'Cinema & Drive-Ins',
    prompt: 'What classic 1970s movie did you go see in the theater or at the local drive-in with friends?',
    sensoryCue: 'Heavy metal window speakers at the drive-in, buttered popcorn, and sunset on the giant screen.',
  },
  {
    id: '70s-3',
    era: '1970s',
    topic: 'youth',
    topicLabel: 'Bell Bottoms & Style',
    prompt: 'What kind of styles, patterns, or bell-bottoms did you or your friends wear with pride in the 70s?',
    sensoryCue: 'Earthy colors, plaid button-ups, platform shoes, and feathered hair.',
  },
  {
    id: '70s-4',
    era: '1970s',
    topic: 'family',
    topicLabel: 'Weekend Hobbies',
    prompt: 'What were your favorite weekend pastimes or outdoor hobbies when life felt quiet and unhurried?',
    sensoryCue: 'Tending tomato plants, fishing at the creek, working on the car, or quilting on the rug.',
  },
  {
    id: '70s-5',
    era: '1970s',
    topic: 'love',
    topicLabel: 'Life Lessons & Joy',
    prompt: 'Looking back on the decades, what is one memory that still brings an instant smile to your face?',
    sensoryCue: 'Laughter with old friends who knew you when your hair was dark and your knees never ached.',
  },
];

// Backwards-compatible ERA_CONVERSATION_STARTERS lookup
export const ERA_CONVERSATION_STARTERS: Record<string, string[]> = {
  '1940s': STRUCTURED_REMINISCENCE_PROMPTS.filter((p) => p.era === '1940s').map((p) => p.prompt),
  '1950s': STRUCTURED_REMINISCENCE_PROMPTS.filter((p) => p.era === '1950s').map((p) => p.prompt),
  '1960s': STRUCTURED_REMINISCENCE_PROMPTS.filter((p) => p.era === '1960s').map((p) => p.prompt),
  '1970s': STRUCTURED_REMINISCENCE_PROMPTS.filter((p) => p.era === '1970s').map((p) => p.prompt),
};

/**
 * Generate a Synthetic Senior Reminiscence Voice Story (WAV Audio + Transcript)
 * Enables family and companions to capture and cherish elder stories even in iframe environments.
 */
export function generateSyntheticReminiscenceStory(
  seniorName: string,
  promptText: string,
  era: string
): { audioUrl: string; transcript: string; emotion: 'Joyful' | 'Heartwarming' | 'Nostalgic' | 'Reflective'; durationSeconds: number } {
  const ctx = getAudioContext();
  const durationSeconds = 16;
  const sampleRate = 22050;
  const numSamples = sampleRate * durationSeconds;
  const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // Warm, gentle elder speaking pitch cadence (around G3 - D4)
  const pitchCadence = [196.0, 220.0, 246.94, 261.63, 293.66, 246.94, 220.0, 196.0];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const syllable = Math.floor(t * 2.4);
    const isBreathPause = (t * 2.4) % 1.0 > 0.82;
    const freq = pitchCadence[syllable % pitchCadence.length];

    if (!isBreathPause) {
      // Warm elder vocal formant harmonics
      const f1 = Math.sin(2 * Math.PI * freq * t);
      const f2 = 0.45 * Math.sin(2 * Math.PI * (freq * 2) * t);
      const f3 = 0.2 * Math.sin(2 * Math.PI * (freq * 3) * t);
      const subtleVibrato = 1 + 0.03 * Math.sin(2 * Math.PI * 4.2 * t);
      const roomWhisper = (Math.random() * 2 - 1) * 0.025;
      channelData[i] = (f1 + f2 + f3) * 0.16 * subtleVibrato + roomWhisper;
    } else {
      channelData[i] = (Math.random() * 2 - 1) * 0.006;
    }
  }

  const wavBlob = audioBufferToWavBlob(audioBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  // Personalized heartwarming story transcripts based on era
  const transcriptsByEra: Record<string, string[]> = {
    '1940s': [
      `"Oh, I remember that so clearly! We would all sit on the floral rug right in front of the tall Philco radio console. My brother and I weren't allowed to make a peep while the news came on, but when the music started, my mother would hum along as she finished the evening mending. Those were sweet times."`,
      `"I can still smell the lilac bushes in our front yard from the summer of '47. We didn't have much, but we had neighbors who would leave extra peaches and rhubarb on the porch. Nobody locked their front doors back then."`,
    ],
    '1950s': [
      `"Our first car was a powder-blue 1953 Chevy Bel Air! My father was so proud of that automobile. Every Saturday morning he would take an old rag and polish the chrome bumper until you could see your reflection. On Sundays, we'd drive out to the ice cream stand by the river."`,
      `"At the local soda fountain, cherry phosphates were just ten cents! The counter was always gleaming and the jukebox played Perry Como and Chuck Berry. You felt like the whole world was bright and stretching out before you."`,
    ],
    '1960s': [
      `"We watched Neil Armstrong step onto the moon on a little 19-inch Zenith television in the basement den. My grandfather had tears in his eyes. He said, 'When I was a boy, we traveled by horse and buggy, and now humans are walking on the moon!' I'll never forget that feeling."`,
      `"My mother made the most marvelous cinnamon yeast rolls every Saturday morning. The whole house smelled of toasted butter and warm sugar. Whenever I hear an acoustic guitar from that decade, I can almost taste that Sunday breakfast."`,
    ],
    '1970s': [
      `"I saved up for six months from my first job to buy a Pioneer turntable with walnut trim and two huge bookshelf speakers. The first record I played was Stevie Wonder's 'Songs in the Key of Life'. Dropping that needle onto the vinyl was pure magic."`,
      `"We spent our summer evenings sitting on lawn chairs on the driveway talking with neighbors until midnight. Fireflies were everywhere, and the kids were catching them in mason jars with holes punched in the lid. Simple, honest happiness."`,
    ],
  };

  const pool = transcriptsByEra[era] || transcriptsByEra['1950s'];
  const transcript = pool[Math.floor(Math.random() * pool.length)];

  return {
    audioUrl,
    transcript,
    emotion: 'Heartwarming',
    durationSeconds,
  };
}

/**
 * Synthesize a realistic, warm Voice Memo audio file (WAV format)
 */
export function generateSyntheticVoiceMemo(
  seniorName: string,
  companionName: string,
  durationSec = 18
): { audioUrl: string; transcript: string } {
  const ctx = getAudioContext();
  const sampleRate = 22050;
  const numSamples = sampleRate * durationSec;
  const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  const baseFreqs = [174.61, 196.0, 220.0, 246.94, 261.63, 220.0, 196.0];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const wordIdx = Math.floor(t * 2.8);
    const pause = (t * 2.8) % 1.0 > 0.85;
    const freq = baseFreqs[wordIdx % baseFreqs.length];

    if (!pause) {
      const f1 = Math.sin(2 * Math.PI * freq * t);
      const f2 = 0.5 * Math.sin(2 * Math.PI * (freq * 2) * t);
      const f3 = 0.25 * Math.sin(2 * Math.PI * (freq * 3) * t);
      const breath = (Math.random() * 2 - 1) * 0.03;
      channelData[i] = (f1 + f2 + f3) * 0.18 + breath;
    } else {
      channelData[i] = (Math.random() * 2 - 1) * 0.008;
    }
  }

  const wavBlob = audioBufferToWavBlob(audioBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  const transcript = `Hi there! ${companionName || 'Maya'} here checking in after a delightful visit with ${seniorName}. We had such a wonderful conversation about favorite memories, enjoyed chamomile tea on the patio, and listened to favorite records. Her spirits were bright and joyful. She's resting comfortably and sends all her love!`;

  return { audioUrl, transcript };
}

/**
 * Utility to convert Web Audio Buffer into playable WAV Blob
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample: number;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

/**
 * Friendly 2-tone melodic notification chime for FCM push alerts
 */
export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.14);
    gain2.gain.setValueAtTime(0.001, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.22, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.66);
  } catch (_) {}
}

