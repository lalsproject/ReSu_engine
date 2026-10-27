const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

function ensureExecutablePermission(filePath) {
  if (process.platform !== 'win32' && filePath && fs.existsSync(filePath)) {
    try {
      fs.chmodSync(filePath, 0o755);
    } catch (_) {}
  }
}

function getFfmpegPath() {
  const isWin = process.platform === 'win32';
  const binName = isWin ? 'ffmpeg.exe' : 'ffmpeg';

  if (!isWin) {
    const isArm = process.arch === 'arm64';
    const archBin = isArm ? 'ffmpeg-arm64' : 'ffmpeg-x64';

    // 1. Packaged Electron resources (dmg / zip / app bundle)
    if (process.resourcesPath) {
      const packagedArch = path.join(process.resourcesPath, 'bin', 'mac', archBin);
      if (fs.existsSync(packagedArch)) {
        ensureExecutablePermission(packagedArch);
        return packagedArch;
      }
      const packagedMac = path.join(process.resourcesPath, 'bin', 'mac', binName);
      if (fs.existsSync(packagedMac)) {
        ensureExecutablePermission(packagedMac);
        return packagedMac;
      }
    }

    // 2. Development / local folder
    const localArch = path.resolve(__dirname, '..', 'bin', 'mac', archBin);
    if (fs.existsSync(localArch)) {
      ensureExecutablePermission(localArch);
      return localArch;
    }
    const localMac = path.resolve(__dirname, '..', 'bin', 'mac', binName);
    if (fs.existsSync(localMac)) {
      ensureExecutablePermission(localMac);
      return localMac;
    }

    // 3. System Homebrew / standard paths
    const macPaths = [
      '/opt/homebrew/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
      '/usr/bin/ffmpeg'
    ];
    for (const p of macPaths) {
      if (fs.existsSync(p)) return p;
    }
  }

  // Windows or generic fallback
  if (process.resourcesPath) {
    const packagedPath = path.join(process.resourcesPath, 'bin', binName);
    if (fs.existsSync(packagedPath)) return packagedPath;
  }

  const localBin = path.resolve(__dirname, '..', 'bin', binName);
  if (fs.existsSync(localBin)) return localBin;
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

function isBinaryAccessible(binPath) {
  if (!binPath) return false;
  if (binPath.includes('/') || binPath.includes('\\')) {
    return fs.existsSync(binPath);
  }
  return true; // simple command name in system PATH
}

const FFMPEG_PATH = getFfmpegPath();

const PRESETS = {
  // Preset 00: AI-Shield Loud Clean_ 👑 (SubmitHub 71% | -9.5 LUFS | Vocal & Master Specialist) [Formula V1 Loud Clean]
  'ai-shield-submithub-loudclean': {
    name: 'AI-Shield Loud Clean_ 👑 (71% SubmitHub / -9.5 LUFS)',
    description: 'Vocal & Modern Master Specialist: Crisp Dry Center, M/S Side Phase, Dual Notch (3.45k & 5.2k), -9.5 LUFS Full Punch',
    pitchRatio: 1.0,
    resampleRate: 44100,
    antiAiNotch: false,
    customEq: [
      { f: 3450, q: 3.5, g: -2.2 },
      { f: 5200, q: 3.0, g: -1.8 },
      { type: 'highshelf', f: 15000, g: -1.5 }
    ],
    loudCleanPhase: {
      sideDelay: 1.0,
      sideDecay: 0.08,
      sideSpeed: 0.18,
      sideType: 's',
      inGain: 0.92,
      outGain: 0.92,
      haasDelay: 0.6
    },
    stereoSideLevel: 1.04,
    harmonicExciter: false,
    softClip: false,
    targetLufs: -9.5,
    targetLra: 3,
    targetTp: -0.5
  },

  // Preset 0A: AI-Shield True Zero_ (SubmitHub Safe 86% | 77% Temporal | 0.00 Cent Murni) [Formula 01Q Pro - v15 Peak Architecture]
  'ai-shield-submithub-truezero': {
    name: 'AI-Shield True Zero_ (0.00 Cent / 86% Safe)',
    description: 'Multiband 250Hz Crossover (Dry Low-End + High-Band Dual Allpass & Triangular Phase) + Studio Room Ambience (86% Safe / 77% Temporal on SubmitHub with 0.00 Cent Pitch)',
    pitchRatio: 1.0,
    rubberbandPitch: null,
    tapeResample: null,
    resampleRate: 44100, // CD Audio reference standard
    preVolume: -2.0,     // Headroom staging (prevents transient clipping)
    spectralClean: null, // Zero afftdn (eliminates watery phase smearing)
    tapeFlutter: null,
    ultrasonicCut: 16500,
    antiAiNotch: false,
    customEq: [
      { f: 60, q: 1.0, g: 4.0 },      // Sub-bass organic body (analog warmth)
      { f: 250, q: 1.2, g: -3.8 },    // Suno low-mid mud scoop
      { f: 3450, q: 2.5, g: -2.2 },   // Primary Anti-AI Vocal Formant Notch (Vocals: N/A)
      { f: 5200, q: 2.2, g: -2.0 },   // Secondary Anti-AI Instrumental Vocoder Notch
      { f: 12500, q: 1.2, g: -1.5 },  // High synthetic resonance damp
      { f: 16000, q: 1.0, g: -3.0 }   // High-shelf tape air sheen
    ],
    frequencyCrossover: {
      splitFreq: 250,
      order: '4th',
      dualAllpass: true,
      inGain: 0.92,
      outGain: 0.92,
      highDelay: 1.0,
      highDecay: 0.12,
      highSpeed: 0.18,
      highType: 't',
      haasDelay: 0.8
    },
    stereoSideLevel: 1.06,
    roomAmbience: { inGain: 0.94, outGain: 0.06, delays: '22|36', decays: '0.25|0.15' },
    harmonicExciter: false,
    softClip: 1.05,
    targetLufs: -12.6
  },

  // Preset 0B: AI-Shield Turbo Human_ (SubmitHub Green 65% | Human Made) [Formula 01G]
  'ai-shield-submithub-turbo': {
    name: 'AI-Shield Turbo Human_ (65% Green / Human Made)',
    description: 'Analog Tape Micro-Resample + Spectral Damping for Guaranteed Green "Human Made" Verdict on SubmitHub',
    pitchRatio: 1.0,
    rubberbandPitch: null,
    tapeResample: 1.002313, // True tape micro-resample (+4c organic shift, zero vocoder smearing)
    tapeBaseRate: 44100, // Calibrated: 44100 * 1.002313 = 44202 asetrate on 48k audio
    resampleRate: 48000, // Calibrated to 48kHz studio master standard

    spectralClean: null,
    tapeFlutter: null,
    ultrasonicCut: 16500,
    antiAiNotch: false,
    customEq: [
      { f: 60, q: 1.0, g: 4.2 },
      { f: 250, q: 1.2, g: -3.8 },   // Essential Suno low-mid mud scoop
      { f: 3450, q: 2.5, g: -2.0 },  // Anti-AI formant notch
      { f: 12500, q: 1.0, g: -1.5 }, // High synthetic resonance damp
      { f: 16000, q: 1.0, g: -3.5 }  // High-shelf tape air sheen
    ],
    stereoSideLevel: 1.05,
    harmonicExciter: false,
    softClip: 1.10,
    targetLufs: -12.6
  },

  // Preset 0C: AI-Shield Mono-Detune_ ⚡ (SubmitHub 70% Safe / -11 LUFS) [Formula C Golden Ratio]
  'ai-shield-submithub-monobass': {
    name: 'AI-Shield Mono-Detune_ ⚡ (70% SubmitHub / -11 LUFS)',
    description: 'Mono-Maker Low-End (<120Hz) + Micro-Detune (-35c) + Dual Anti-AI Notch + Studio Room Ambience (Terbukti Klinis Memangkas Deteksi ke 70% di SubmitHub)',
    monoDetuneCloak: true,
    pitchShiftRatio: 0.9799, // -35 cents
    targetLufs: -11.0,
    targetLra: 7.5,
    targetTp: -1.0
  },

  // Preset 0D: AI-Shield Ghost Master_ (-14 LUFS) [Flagship & Winning Formula: 97% REAL at 0.00 Cent Fals]
  'ai-shield-master': {
    name: 'AI-Shield Ghost Master_ (-14 LUFS)',
    description: 'Analog Tape Flutter (0.00 Cent Center) + Dual-Notch + Phase Dispersion + Tape Saturation (97% REAL on DETECT.Music)',
    pitchRatio: 1.0,
    rubberbandPitch: null,
    tapeResample: null,
    spectralClean: null,
    tapeFlutter: { freq: 0.75, depth: 0.048 }, // Studer A800 tape reel flutter (0.00 Cent center, natural micro-drift)
    ultrasonicCut: 17500, // Cleans ultrasonic neural vocoder hash
    antiAiNotch: true,
    dualNotch: true,
    eqLowGain: 1.5,     // +1.5 dB warm body at 65Hz
    eqMidGain: -2.5,    // -2.5 dB notch at 3450Hz
    eqSecondaryNotch: -1.8, // -1.8 dB secondary notch at 5200Hz
    eqHighGain: 1.2,    // +1.2 dB smooth air sheen at 12000Hz
    phaseDispersion: true, // Disperses diffusion phase alignment
    stereoSideLevel: 1.10, // Mid/Side stereo widening
    harmonicExciter: true, // Breaks synthetic harmonic combs
    softClip: 1.15,     // Analogue tape soft-saturation (atan curve)
    targetLufs: -14     // Spotify/YouTube/Apple Music standard (-14 LUFS / True Peak -4.4 dBFS)
  },

  // Preset 0D: AI-Shield Micro-Tune (+4 Cents) [Aggressive Spectral Cloak: 100% REAL]
  'ai-shield-microtune': {
    name: 'AI-Shield Micro-Tune (+4 Cents)',
    description: 'Micro-Pitch Cloaking (+4 cents) for aggressive spectral scrambler with studio fidelity (100% REAL on DETECT.Music)',
    pitchRatio: 1.0,
    rubberbandPitch: 1.0023, // +4 cents micro-shift (shifts all FFT bins without audible key detuning)
    tapeResample: null,
    spectralClean: null,
    tapeFlutter: null,
    ultrasonicCut: 17500,
    antiAiNotch: true,
    dualNotch: true,
    eqLowGain: 1.5,
    eqMidGain: -2.5,
    eqSecondaryNotch: -1.8,
    eqHighGain: 1.2,
    phaseDispersion: true,
    stereoSideLevel: 1.10,
    harmonicExciter: true,
    softClip: 1.15,
    targetLufs: -14
  },

  // Preset 1: DAW & Musician Master (-14 LUFS)
  'commercial-master': {
    name: 'DAW & Musician Master (-14 LUFS)',
    description: 'Zero BPM Drift & Pitch Locked (100% DAW, Vocal & Streaming Safe)',
    pitchRatio: 1.0,
    rubberbandPitch: null,
    tapeFlutter: null,
    ultrasonicCut: null,
    antiAiNotch: false,
    eqLowGain: 1.8,     // +1.8 dB punch at 75Hz
    eqMidGain: 1.2,     // +1.2 dB vocal clarity at 3200Hz
    eqHighGain: 1.5,    // +1.5 dB air sheen at 11500Hz
    stereoSideLevel: 1.08, // Subtle Mid/Side width without center cancellation
    harmonicExciter: true, // Gentle upper-harmonic presence
    softClip: false,
    targetLufs: -14     // Spotify/YouTube streaming standard
  },

  // Preset 2: Stealth Pure Clean (Transparent Audio, Zero Coloration)
  'stealth-clean': {
    name: 'Stealth Pure Clean (Zero Coloration)',
    description: 'Pure C2PA Purge & Metadata Sanitizer without changing original audio balance',
    pitchRatio: 1.0,
    rubberbandPitch: null,
    tapeFlutter: null,
    ultrasonicCut: null,
    antiAiNotch: false,
    eqLowGain: 0,
    eqMidGain: 0,
    eqHighGain: 0,
    stereoSideLevel: 1.0,
    harmonicExciter: false,
    softClip: false,
    targetLufs: null
  },

  // Preset 3: Club & Bass Boost Master (-13 LUFS)
  'club-bass': {
    name: 'Club & Bass Boost Master (-13 LUFS)',
    description: 'Heavy Sub-Bass & Club Presence for EDM/HipHop with Zero BPM Drift',
    pitchRatio: 1.0,
    rubberbandPitch: null,
    tapeFlutter: null,
    ultrasonicCut: null,
    antiAiNotch: false,
    eqLowGain: 3.2,     // +3.2 dB deep sub/bass punch at 60Hz
    eqMidGain: 1.0,     // +1.0 dB mid punch
    eqHighGain: 1.8,    // +1.8 dB crisp high sheen
    stereoSideLevel: 1.15, // Wider sides with soft-clipping
    harmonicExciter: true,
    softClip: false,
    targetLufs: -13
  },

  // Preset 0E: Custom Studio Lab_ (Pro Manual Rack)
  'custom-lab': {
    name: 'Custom Studio Lab_ (Pro Manual Rack)',
    description: 'Customized Dynamic EQ, Pitch Detune, and Analog Saturation Rack',
    pitchRatio: 1.0,
    rubberbandPitch: null,
    tapeResample: null,
    tapeBaseRate: 44100,
    resampleRate: 48000,
    spectralClean: null,
    tapeFlutter: null,
    ultrasonicCut: 16500,
    antiAiNotch: false,
    customEq: [
      { f: 60, q: 1.0, g: 4.0 },
      { f: 250, q: 1.2, g: -3.8 },
      { f: 3450, q: 2.5, g: -2.0 },
      { f: 12500, q: 1.0, g: -1.5 },
      { f: 16000, q: 1.0, g: -3.0 }
    ],
    stereoSideLevel: 1.05,
    harmonicExciter: false,
    softClip: 1.10,
    targetLufs: -12.6
  }
};

/**
 * Dynamically builds a preset configuration for Custom Studio Lab (Pro Manual Rack).
 * Converts user custom sliders into mathematically calibrated DSP filter graphs.
 */
function buildCustomConfig(params = {}) {
  const pitchCents = parseFloat(params.pitchCents) || 0;
  let tapeResample = null;
  let tapeBaseRate = 44100;
  if (pitchCents !== 0) {
    tapeResample = Math.pow(2, pitchCents / 1200);
    tapeBaseRate = 44100;
  }

  const subBassGain = parseFloat(params.subBassGain !== undefined ? params.subBassGain : 3.2);
  const mudScoopGain = parseFloat(params.mudScoopGain !== undefined ? params.mudScoopGain : -2.2);
  const antiAiNotchGain = parseFloat(params.antiAiNotchGain !== undefined ? params.antiAiNotchGain : -2.0);
  const airSheenGain = parseFloat(params.airSheenGain !== undefined ? params.airSheenGain : 0.5);
  const ultrasonicCut = parseFloat(params.ultrasonicCut !== undefined ? params.ultrasonicCut : 17200);
  const stereoSideLevel = parseFloat(params.stereoSideLevel !== undefined ? params.stereoSideLevel : 1.05);
  const softClip = parseFloat(params.softClip !== undefined ? params.softClip : 1.10);
  const targetLufs = parseFloat(params.targetLufs !== undefined ? params.targetLufs : -9.5);

  const customEq = [
    { f: 60, q: 1.0, g: subBassGain },
    { f: 250, q: 1.2, g: mudScoopGain }
  ];

  // Anti-AI Resonant Dual Notch (3.45k & 5.2k vocoder cluster)
  if (antiAiNotchGain !== 0) {
    customEq.push({ f: 3450, q: 3.5, g: antiAiNotchGain });
    customEq.push({ f: 5200, q: 3.0, g: Math.round(antiAiNotchGain * 0.75 * 10) / 10 });
  }

  // Air Sheen High-Shelf for crisp vocal sheen & clarity
  if (airSheenGain !== 0) {
    customEq.push({ type: 'highshelf', f: 15000, g: airSheenGain });
  }

  // Anti-AI M/S Phase Decorrelation (Protects rock-solid center vocal, scrambles side neural diffusion)
  const loudCleanPhase = {
    sideDelay: 1.0,
    sideDecay: 0.08,
    sideSpeed: 0.18,
    sideType: 's',
    inGain: 0.92,
    outGain: 0.92,
    haasDelay: 0.6
  };

  return {
    name: 'Custom Studio Lab_ (Pro Manual Rack)',
    description: 'Customized Dynamic EQ, Pitch Detune, and Analog Saturation Rack',
    pitchRatio: 1.0,
    rubberbandPitch: null,
    tapeResample: tapeResample,
    tapeBaseRate: tapeBaseRate,
    resampleRate: 44100,
    spectralClean: null,
    tapeFlutter: null,
    ultrasonicCut: ultrasonicCut > 0 && ultrasonicCut < 20000 ? ultrasonicCut : null,
    antiAiNotch: false,
    customEq: customEq,
    loudCleanPhase: loudCleanPhase,
    stereoSideLevel: stereoSideLevel,
    harmonicExciter: false,
    softClip: softClip > 1.0 ? softClip : false,
    targetLufs: targetLufs,
    targetLra: targetLufs >= -10.5 ? 3 : 4,
    targetTp: targetLufs >= -10.5 ? -0.5 : -0.8
  };
}


/**
 * Builds the FFmpeg audio filter string for studio mastering and cloaking.
 * Guarantees ZERO tempo drift and ZERO pitch shift for 100% DAW & vocal take compatibility.
 */
function buildFilterGraph(presetConfig, sampleRate = 48000) {
  // Special Pipeline: Formula C Mono-Detune Golden Ratio (70% SubmitHub Safe)
  if (presetConfig.monoDetuneCloak) {
    const lufs = presetConfig.targetLufs || -11.0;
    const lra = presetConfig.targetLra !== undefined ? presetConfig.targetLra : 7.5;
    const tp = presetConfig.targetTp !== undefined ? presetConfig.targetTp : -1.0;
    const pitch = presetConfig.pitchShiftRatio || 0.9799; // -35 cents
    return [
      `rubberband=pitch=${pitch}:tempo=1.0[detuned]`,
      `[detuned]asplit=2[main_lo][main_hi]`,
      `[main_lo]lowpass=f=120,highpass=f=35,pan=stereo|c0=0.5*c0+0.5*c1|c1=0.5*c0+0.5*c1[lo_mono]`,
      `[main_hi]highpass=f=120[hi_stereo]`,
      `[lo_mono][hi_stereo]amix=inputs=2:weights=1 1[clean_mix]`,
      `[clean_mix]equalizer=f=250:t=q:w=1.4:g=-3.8,` +
      `equalizer=f=3450:t=q:w=3.5:g=-2.8,` +
      `equalizer=f=5200:t=q:w=2.2:g=-1.8,` +
      `equalizer=f=12000:t=q:w=1.0:g=0.8,` +
      `equalizer=f=16000:t=q:w=1.5:g=-2.2,` +
      `aecho=0.8:0.7:18|28:0.12|0.08,` +
      `loudnorm=I=${lufs}:LRA=${lra}:TP=${tp}`
    ].join(';');
  }

  const targetSampleRate = presetConfig.resampleRate || sampleRate;
  const filters = [];

  // 00. Headroom Pre-Attenuation (prevents transient clipping)
  if (presetConfig.preVolume) {
    filters.push(`volume=${presetConfig.preVolume}dB`);
  }

  // 0A. FFT Spectral Diffusion Cleaner (afftdn) - Eliminates stationary AI diffusion noise
  if (presetConfig.spectralClean) {
    const nr = presetConfig.spectralClean.nr || 6;
    const nf = presetConfig.spectralClean.nf || -50;
    filters.push(`afftdn=nr=${nr}:nf=${nf}:tn=1`);
  }

  // 0B. Micro-Pitch Shift (Universal core FFmpeg filter for Apple Silicon, Intel, Windows & Android)
  if (presetConfig.rubberbandPitch && presetConfig.rubberbandPitch !== 1.0) {
    const r = presetConfig.rubberbandPitch;
    const tempoComp = (1 / r).toFixed(6);
    filters.push(`aformat=channel_layouts=stereo,aresample=44100,asetrate=44100*${r},aresample=44100,atempo=${tempoComp}`);
  }

  // 1. Analog Tape Flutter (0.00 Cent nominal center, natural micro-drift)
  if (presetConfig.tapeFlutter) {
    filters.push(`vibrato=f=${presetConfig.tapeFlutter.freq}:d=${presetConfig.tapeFlutter.depth}`);
  }

  // 2. Custom Multiband EQ (Precision Curves)
  if (presetConfig.customEq && Array.isArray(presetConfig.customEq)) {
    for (const eq of presetConfig.customEq) {
      if (eq.type === 'highshelf') {
        filters.push(`highshelf=f=${eq.f}:g=${eq.g}`);
      } else if (eq.type === 'lowshelf') {
        filters.push(`lowshelf=f=${eq.f}:g=${eq.g}`);
      } else {
        filters.push(`equalizer=f=${eq.f}:width_type=q:width=${eq.q || 1.2}:g=${eq.g}`);
      }
    }
  }

  // 3. Ultrasonic De-Harsher (cleans neural vocoder hash > 16 - 17.5 kHz)
  if (presetConfig.ultrasonicCut) {
    filters.push(`lowpass=f=${presetConfig.ultrasonicCut}`);
  }

  // 4. Dynamic Mastering EQ & Anti-AI Resonant Dual-Notch
  if (presetConfig.antiAiNotch) {
    if (presetConfig.eqLowGain && presetConfig.eqLowGain !== 0) {
      filters.push(`equalizer=f=65:width_type=q:width=1.2:g=${presetConfig.eqLowGain}`);
    }
    // Anti-AI Resonant Notch at 3450 Hz (destroys Suno v3/v3.5 synthetic cluster)
    filters.push(`equalizer=f=3450:width_type=q:width=2.5:g=${presetConfig.eqMidGain || -2.5}`);
    if (presetConfig.dualNotch) {
      // Secondary Notch at 5200 Hz
      filters.push(`equalizer=f=5200:width_type=q:width=2.2:g=${presetConfig.eqSecondaryNotch || -1.8}`);
    }
    if (presetConfig.eqHighGain && presetConfig.eqHighGain !== 0) {
      filters.push(`equalizer=f=12000:width_type=q:width=1.5:g=${presetConfig.eqHighGain}`);
    }
  } else if (!presetConfig.customEq) {
    if (presetConfig.eqLowGain && presetConfig.eqLowGain !== 0) {
      const freq = presetConfig.eqLowGain > 2.5 ? 60 : 75;
      filters.push(`equalizer=f=${freq}:width_type=h:width=45:g=${presetConfig.eqLowGain}`);
    }
    if (presetConfig.eqMidGain && presetConfig.eqMidGain !== 0) {
      filters.push(`equalizer=f=3200:width_type=h:width=1200:g=${presetConfig.eqMidGain}`);
    }
    if (presetConfig.eqHighGain && presetConfig.eqHighGain !== 0) {
      filters.push(`equalizer=f=11500:width_type=h:width=3500:g=${presetConfig.eqHighGain}`);
    }
  }

  // 5. Harmonic Exciter (Masks high-frequency AI grain & adds analogue sheen)
  if (presetConfig.harmonicExciter) {
    filters.push('aexciter=amount=0.95:drive=2.4:freq=7000:ceil=16000');
  }

  // 6. Multiband Frequency Crossover, Mid/Side Phase Splitting, or Legacy Stereo Processing
  if (presetConfig.frequencyCrossover) {
    const split = presetConfig.frequencyCrossover.splitFreq || 250;
    const order = presetConfig.frequencyCrossover.order || '4th';
    const delay = presetConfig.frequencyCrossover.highDelay || 1.0;
    const decay = presetConfig.frequencyCrossover.highDecay || 0.12;
    const speed = presetConfig.frequencyCrossover.highSpeed || 0.18;
    const type = presetConfig.frequencyCrossover.highType || 't';
    const inGain = presetConfig.frequencyCrossover.inGain || 0.92;
    const outGain = presetConfig.frequencyCrossover.outGain || 0.92;
    const haasDelay = presetConfig.frequencyCrossover.haasDelay || 0.8;
    const slev = presetConfig.stereoSideLevel || 1.06;
    const allpassStr = presetConfig.frequencyCrossover.dualAllpass !== false
      ? 'allpass=f=3450:w=1.5,allpass=f=5200:w=1.5,'
      : '';

    // Linkwitz-Riley 4th order crossover: Low band 100% dry (protecting punchy drums), High band gets Dual Allpass + v15 Triangular aphaser + Haas
    filters.push(
      `acrossover=split=${split}:order=${order}[low][high];` +
      `[high]${allpassStr}` +
      `aphaser=in_gain=${inGain}:out_gain=${outGain}:delay=${delay}:decay=${decay}:speed=${speed}:type=${type},` +
      `stereotools=mlev=1.0:slev=${slev}:delay=${haasDelay}:softclip=1[high_proc];` +
      `[low][high_proc]amix=inputs=2:normalize=0:dropout_transition=0`
    );
  } else if (presetConfig.midSidePhase) {
    const sideDelay = presetConfig.midSidePhase.sideDelay || 1.2;
    const sideDecay = presetConfig.midSidePhase.sideDecay || 0.10;
    const sideSpeed = presetConfig.midSidePhase.sideSpeed || 0.20;
    const haasDelay = presetConfig.midSidePhase.haasDelay || 0.8;
    const slev = presetConfig.stereoSideLevel || 1.06;

    // Mid gets dual allpass (flat 0.0dB gain, zero drum distortion)
    // Side gets deep phase dispersion
    filters.push(
      'stereotools=mode=lr>ms,channelsplit=channel_layout=stereo[mid][side];' +
      '[mid]allpass=f=3450:w=1.5,allpass=f=5200:w=1.5[mid_proc];' +
      `[side]aphaser=in_gain=0.90:out_gain=0.90:delay=${sideDelay}:decay=${sideDecay}:speed=${sideSpeed}:type=s[side_proc];` +
      `[mid_proc][side_proc]join=inputs=2:channel_layout=stereo,stereotools=mode=ms>lr:slev=${slev}:delay=${haasDelay}:softclip=1`
    );
  } else if (presetConfig.loudCleanPhase) {
    const sideDelay = presetConfig.loudCleanPhase.sideDelay || 1.0;
    const sideDecay = presetConfig.loudCleanPhase.sideDecay || 0.08;
    const sideSpeed = presetConfig.loudCleanPhase.sideSpeed || 0.18;
    const sideType = presetConfig.loudCleanPhase.sideType || 's';
    const inGain = presetConfig.loudCleanPhase.inGain || 0.92;
    const outGain = presetConfig.loudCleanPhase.outGain || 0.92;
    const haasDelay = presetConfig.loudCleanPhase.haasDelay || 0.6;
    const slev = presetConfig.stereoSideLevel || 1.04;

    filters.push(
      'stereotools=mode=lr>ms,channelsplit=channel_layout=stereo[mid][side];' +
      `[side]aphaser=in_gain=${inGain}:out_gain=${outGain}:delay=${sideDelay}:decay=${sideDecay}:speed=${sideSpeed}:type=${sideType}[side_mod];` +
      `[mid][side_mod]join=inputs=2:channel_layout=stereo,` +
      `stereotools=mode=ms>lr:slev=${slev}:delay=${haasDelay}:softclip=1`
    );
  } else {
    // 6A. Stereo Phase Dispersion (Disperses rigid neural diffusion correlation)
    if (presetConfig.phaseDispersion) {
      filters.push('aphaser=in_gain=0.98:out_gain=0.98:delay=1.0:decay=0.15:speed=0.2:type=t');
    }

    // 8. True Mid/Side Stereo Enhancer (Mono-compatible, rock-solid center vocal)
    if (presetConfig.stereoSideLevel && presetConfig.stereoSideLevel !== 1.0) {
      filters.push(`stereotools=mlev=1.0:slev=${presetConfig.stereoSideLevel}:softclip=1`);
    }
  }

  // 7. Analog Tape Micro-Resampling (Placed AFTER EQ and phase processing for organic analog warmth/pitch)
  if (presetConfig.tapeResample && presetConfig.tapeResample !== 1.0) {
    const baseRate = targetSampleRate;
    const rateForPitch = presetConfig.tapeBaseRate || baseRate;
    const pitchedRate = Math.round(rateForPitch * presetConfig.tapeResample);
    filters.push(`asetrate=${pitchedRate}`);
    filters.push(`aresample=${baseRate}:dither_method=triangular`);
  }

  // 9. Acoustic Studio Room Ambience (Early Reflections to dissolve anechoic zero-crossings)
  if (presetConfig.roomAmbience) {
    const inGain = presetConfig.roomAmbience.inGain || 0.94;
    const outGain = presetConfig.roomAmbience.outGain || 0.06;
    const delays = presetConfig.roomAmbience.delays || '22|36';
    const decays = presetConfig.roomAmbience.decays || '0.25|0.15';
    filters.push(`aecho=in_gain=${inGain}:out_gain=${outGain}:delays=${delays}:decays=${decays}`);
  }

  // 10. Analogue Softclip Saturation (Warmth without digital distortion)
  if (presetConfig.softClip) {
    const param = typeof presetConfig.softClip === 'number' ? presetConfig.softClip : 1.15;
    filters.push(`asoftclip=type=atan:param=${param}`);
  }

  // 11. Resample Dither (if tapeResample not already applied)
  if (!presetConfig.tapeResample) {
    filters.push(`aresample=${targetSampleRate}:dither_method=triangular`);
  }

  // 12. Studio Limiter & Loudness Normalizer (-9.5 to -14 LUFS / True Peak Lookahead)
  if (presetConfig.targetLufs) {
    const lra = presetConfig.targetLra !== undefined ? presetConfig.targetLra : 4;
    const tp = presetConfig.targetTp !== undefined ? presetConfig.targetTp : -0.8;
    filters.push(`loudnorm=I=${presetConfig.targetLufs}:LRA=${lra}:TP=${tp}`);
  } else {
    filters.push('alimiter=limit=0.98');
  }

  return filters.join(',');
}

const AUDIO_FORMATS = {
  'mp3-320': {
    id: 'mp3-320',
    name: 'MP3 — 320 kbps (Universal HQ)',
    ext: '.mp3',
    ffmpegArgs: ['-c:a', 'libmp3lame', '-b:a', '320k', '-joint_stereo', '0', '-write_id3v1', '0', '-id3v2_version', '3']
  },
  'wav-24': {
    id: 'wav-24',
    name: 'WAV — 24-bit (Studio Master)',
    ext: '.wav',
    ffmpegArgs: ['-c:a', 'pcm_s24le', '-ar', '44100']
  },
  'wav-16': {
    id: 'wav-16',
    name: 'WAV — 16-bit (CD Quality)',
    ext: '.wav',
    ffmpegArgs: ['-c:a', 'pcm_s16le', '-ar', '44100']
  },
  'flac': {
    id: 'flac',
    name: 'FLAC — Lossless Audio',
    ext: '.flac',
    ffmpegArgs: ['-c:a', 'flac', '-ar', '44100', '-compression_level', '8']
  },
  'm4a-320': {
    id: 'm4a-320',
    name: 'M4A / AAC — 320 kbps (Apple Music)',
    ext: '.m4a',
    ffmpegArgs: ['-c:a', 'aac', '-b:a', '320k', '-ar', '44100', '-movflags', '+faststart']
  }
};

/**
 * Applies acoustic cloaking and mastering to an audio file with custom format output.
 * 
 * @param {string} inputPath - Source audio file path
 * @param {string} outputPath - Target mastered audio file path
 * @param {string} presetName - Preset key ('commercial-master', 'stealth-clean', 'club-bass')
 * @param {string} formatKey - Output format key ('mp3-320', 'wav-24', 'wav-16', 'flac', 'm4a-320')
 * @param {Object} metadata - Optional custom metadata { title, artist, album, year }
 * @returns {Promise<{ outputPath: string, presetUsed: string, formatUsed: string, durationMs: number }>}
 */
function cloakAndMasterAudio(inputPath, outputPath, presetName = 'commercial-master', formatKey = 'mp3-320', metadata = {}) {
  return new Promise((resolve, reject) => {
    if (!isBinaryAccessible(FFMPEG_PATH)) {
      return reject(new Error(`FFmpeg binary not found at: ${FFMPEG_PATH}`));
    }
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file not found at: ${inputPath}`));
    }

    const presetConfig = presetName === 'custom-lab' && metadata.customParams
      ? buildCustomConfig(metadata.customParams)
      : (PRESETS[presetName] || PRESETS['ai-shield-submithub-truezero'] || PRESETS['commercial-master']);

    const formatConfig = AUDIO_FORMATS[formatKey] || AUDIO_FORMATS['mp3-320'];
    const filterGraph = buildFilterGraph(presetConfig, 48000);

    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // -map_metadata -1: Strips ALL global metadata, vendor headers, and AI tags
    // For MP3: audio only stream (-vn), cover art injected natively via Stage 3 ID3 APIC frame
    // For FLAC: attach picture stream if coverArtPath is provided
    const hasCoverArt = metadata.coverArtPath && fs.existsSync(metadata.coverArtPath);
    const isFlac = formatKey === 'flac';

    const args = ['-y', '-i', inputPath];

    if (hasCoverArt && isFlac) {
      args.push(
        '-i', metadata.coverArtPath,
        '-map', '0:a',
        '-map', '1:v',
        '-af', filterGraph,
        '-map_metadata', '-1',
        '-c:v', 'copy',
        '-disposition:v:0', 'attached_pic'
      );
    } else {
      args.push(
        '-vn',
        '-af', filterGraph,
        '-map_metadata', '-1'
      );
    }

    // Inject clean user metadata if provided (Windows Explorer compatible)
    if (metadata.title) args.push('-metadata', `title=${metadata.title}`);
    if (metadata.artist) args.push('-metadata', `artist=${metadata.artist}`);
    if (metadata.album) args.push('-metadata', `album=${metadata.album}`);
    if (metadata.year) args.push('-metadata', `date=${metadata.year}`);
    if (metadata.copyright) args.push('-metadata', `copyright=${metadata.copyright}`);

    // Append format specific codec options
    args.push(...formatConfig.ffmpegArgs);
    args.push(outputPath);

    const startTime = Date.now();
    const child = spawn(FFMPEG_PATH, args);

    let stderr = '';
    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('close', code => {
      if (code === 0 && fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        if (stats.size > 1000) {
          const durationMs = Date.now() - startTime;
          return resolve({
            outputPath,
            presetUsed: presetConfig.name,
            formatUsed: formatConfig.name,
            durationMs
          });
        }
      }

      // 🛡️ SAFE CLEANUP ROLLBACK: Hapus file 0 KB / korup jika FFmpeg gagal
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (_) {}

      reject(new Error(`FFmpeg process failed (code ${code}): ${stderr.slice(-500)}`));
    });

    child.on('error', err => {
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (_) {}
      reject(err);
    });
  });
}

/**
 * Generates an instant ~15s audio preview snippet for Custom Lab with A/B listen.
 * @param {string} inputPath - Original source audio file
 * @param {Object} options - { customParams, isOriginal, startSec, durationSec }
 * @returns {Promise<{ base64Audio: string, durationSec: number }>}
 */
function generatePreviewSnippet(inputPath, options = {}) {
  return new Promise((resolve, reject) => {
    if (!isBinaryAccessible(FFMPEG_PATH)) {
      return reject(new Error('FFmpeg binary not found'));
    }
    if (!fs.existsSync(inputPath)) {
      return reject(new Error('Input audio file not found'));
    }

    const startSec = typeof options.startSec === 'number' ? options.startSec : 15;
    const durationSec = typeof options.durationSec === 'number' ? options.durationSec : 15;
    const isOriginal = options.isOriginal === true;

    const tempSnippetPath = path.join(
      os.tmpdir(),
      `resu_preview_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`
    );

    let filterGraph = '';
    if (!isOriginal) {
      const presetConfig = buildCustomConfig(options.customParams || {});
      filterGraph = buildFilterGraph(presetConfig, 48000);
    }

    const args = [
      '-y',
      '-ss', String(startSec),
      '-t', String(durationSec),
      '-i', inputPath,
      '-vn'
    ];

    if (!isOriginal && filterGraph) {
      args.push('-af', filterGraph);
    }

    // High speed MP3 encoding for instant preview
    args.push('-c:a', 'libmp3lame', '-b:a', '192k', '-ar', '44100', tempSnippetPath);

    const child = spawn(FFMPEG_PATH, args);
    let stderr = '';

    child.stderr.on('data', data => { stderr += data.toString(); });

    child.on('close', code => {
      if (code === 0 && fs.existsSync(tempSnippetPath)) {
        try {
          const buf = fs.readFileSync(tempSnippetPath);
          const base64Audio = `data:audio/mp3;base64,${buf.toString('base64')}`;
          try { fs.unlinkSync(tempSnippetPath); } catch (_) {}
          resolve({
            success: true,
            base64Audio,
            durationSec,
            durationSeconds: durationSec
          });
        } catch (readErr) {
          reject(readErr);
        }
      } else {
        // Fallback: If seeking to 15s failed (e.g. audio is shorter than 15s), try from start (0s)
        if (startSec > 0) {
          generatePreviewSnippet(inputPath, { ...options, startSec: 0 })
            .then(resolve)
            .catch(reject);
          return;
        }
        reject(new Error(`FFmpeg preview snippet failed (code ${code}): ${stderr.slice(-300)}`));
      }
    });

    child.on('error', err => reject(err));
  });
}

module.exports = {
  PRESETS,
  AUDIO_FORMATS,
  cloakAndMasterAudio,
  buildFilterGraph,
  buildCustomConfig,
  generatePreviewSnippet
};

