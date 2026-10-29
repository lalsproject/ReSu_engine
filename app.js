/* ═══════════════════════════════════════════════════════════════
   ReSu_ Master Audio Engine — Application Logic
   Interactive UI Controller for all Engine Modules
   ═══════════════════════════════════════════════════════════════ */

// ── Preset & Format Data (mirrored from acoustic-cloaker.js) ──
const PRESETS = {
  'ai-shield-submithub-loudclean': {
    name: 'AI-Shield Loud Clean_ 👑 (71% SubmitHub / -9.5 LUFS)',
    description: 'Vocal & Modern Master Specialist: Crisp Dry Center, M/S Side Phase, Dual Notch (3.45k & 5.2k), -9.5 LUFS Full Punch',
    lufs: -9.5
  },
  'ai-shield-submithub-truezero': {
    name: 'AI-Shield True Zero_ (0.00 Cent / 86% Safe)',
    description: 'Multiband 250Hz Crossover + Studio Room Ambience (86% Safe / 77% Temporal on SubmitHub with 0.00 Cent Pitch)',
    lufs: -12.6
  },
  'ai-shield-submithub-turbo': {
    name: 'AI-Shield Turbo Human_ (65% Green / Human Made)',
    description: 'Analog Tape Micro-Resample + Spectral Damping for Guaranteed Green "Human Made" Verdict on SubmitHub',
    lufs: -12.6
  },
  'ai-shield-submithub-monobass': {
    name: 'AI-Shield Mono-Detune_ ⚡ (70% SubmitHub / -11 LUFS)',
    description: 'Mono-Maker Low-End (<120Hz) + Micro-Detune (-35c) + Dual Anti-AI Notch + Studio Room Ambience',
    lufs: -11.0
  },
  'ai-shield-master': {
    name: 'AI-Shield Ghost Master_ (-14 LUFS)',
    description: 'Analog Tape Flutter (0.00 Cent) + Dual-Notch + Phase Dispersion + Tape Saturation (97% REAL on DETECT.Music)',
    lufs: -14
  },
  'ai-shield-microtune': {
    name: 'AI-Shield Micro-Tune (+4 Cents)',
    description: 'Micro-Pitch Cloaking (+4 cents) for aggressive spectral scrambler with studio fidelity (100% REAL)',
    lufs: -14
  },
  'commercial-master': {
    name: 'DAW & Musician Master (-14 LUFS)',
    description: 'Zero BPM Drift & Pitch Locked (100% DAW, Vocal & Streaming Safe)',
    lufs: -14
  },
  'stealth-clean': {
    name: 'Stealth Pure Clean (Zero Coloration)',
    description: 'Pure C2PA Purge & Metadata Sanitizer without changing original audio balance',
    lufs: null
  },
  'club-bass': {
    name: 'Club & Bass Boost Master (-13 LUFS)',
    description: 'Heavy Sub-Bass & Club Presence for EDM/HipHop with Zero BPM Drift',
    lufs: -13
  },
  'custom-lab': {
    name: 'Custom Studio Lab_ (Pro Manual Rack)',
    description: 'Customized Dynamic EQ, Pitch Detune, and Analog Saturation Rack',
    lufs: -9.5
  }
};

const AUDIO_FORMATS = {
  'mp3-320': { name: 'MP3 — 320 kbps (Universal HQ)', ext: '.mp3' },
  'wav-24':  { name: 'WAV — 24-bit (Studio Master)', ext: '.wav' },
  'wav-16':  { name: 'WAV — 16-bit (CD Quality)', ext: '.wav' },
  'flac':    { name: 'FLAC — Lossless Audio', ext: '.flac' },
  'm4a-320': { name: 'M4A / AAC — 320 kbps (Apple Music)', ext: '.m4a' }
};

// ── Application State ──
const state = {
  activeTab: 'cloaker',
  cloaker: { file: null, preset: 'ai-shield-submithub-loudclean', format: 'mp3-320' },
  c2pa: { file: null },
  cosu: { file: null, mode: 'original', exportMode: 'slice' },
  lab: { file: null }
};

// ══════════════════════════════════════════
//  INITIALIZATION
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initNavigation();
  initPresetGrid();
  initFormatGrid();
  initUploadZones();
  initCosuModes();
  initCosuExport();
  initLabSliders();
  initCoverArt();
  updateFilterGraphPreview();
  drawEQCurve();
});

function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem('resu-theme');
  } catch (error) {
    console.warn('Theme preference could not be loaded:', error);
  }

  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const applyTheme = (theme, persist = false) => {
    document.documentElement.dataset.theme = theme;
    const isDark = theme === 'dark';
    toggle.querySelector('.theme-toggle-icon').textContent = isDark ? '☀' : '☾';
    toggle.querySelector('.theme-toggle-label').textContent = isDark ? 'Light mode' : 'Dark mode';
    toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    toggle.setAttribute('aria-pressed', String(isDark));

    if (persist) {
      try {
        localStorage.setItem('resu-theme', theme);
      } catch (error) {
        console.warn('Theme preference could not be saved:', error);
      }
    }

    drawEQCurve();
  };

  applyTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : systemTheme);
  toggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  });
}

// ── Navigation ──
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      state.activeTab = tab;

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const panelId = tab === 'custom-lab' ? 'panel-custom-lab' : `panel-${tab}`;
      const targetPanel = document.getElementById(panelId);
      if (targetPanel) targetPanel.classList.add('active');

      if (tab === 'custom-lab') {
        requestAnimationFrame(() => drawEQCurve());
      }
    });
  });
}

// ── Preset Grid ──
function initPresetGrid() {
  const grid = document.getElementById('preset-grid');
  grid.innerHTML = '';

  Object.entries(PRESETS).forEach(([key, preset]) => {
    if (key === 'custom-lab') return; // Separate tab
    const card = document.createElement('div');
    card.className = `preset-card${key === state.cloaker.preset ? ' active' : ''}`;
    card.dataset.preset = key;
    card.innerHTML = `
      <div class="preset-name">${escapeHtml(preset.name)}</div>
      <div class="preset-desc">${escapeHtml(preset.description)}</div>
      ${preset.lufs !== null ? `<div class="preset-lufs">${preset.lufs} LUFS</div>` : '<div class="preset-lufs">Transparent</div>'}
    `;
    card.addEventListener('click', () => {
      grid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.cloaker.preset = key;
    });
    grid.appendChild(card);
  });
}

// ── Format Grid ──
function initFormatGrid() {
  const grid = document.getElementById('format-grid');
  grid.innerHTML = '';

  Object.entries(AUDIO_FORMATS).forEach(([key, fmt]) => {
    const card = document.createElement('div');
    card.className = `format-card${key === state.cloaker.format ? ' active' : ''}`;
    card.dataset.format = key;
    card.innerHTML = `
      <div class="format-dot"></div>
      <div class="format-name">${escapeHtml(fmt.name)}</div>
    `;
    card.addEventListener('click', () => {
      grid.querySelectorAll('.format-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.cloaker.format = key;
    });
    grid.appendChild(card);
  });
}

// ══════════════════════════════════════════
//  FILE UPLOAD HANDLING
// ══════════════════════════════════════════
function initUploadZones() {
  const zones = [
    { id: 'cloaker-upload', fileInput: 'cloaker-file', stateKey: 'cloaker' },
    { id: 'c2pa-upload',    fileInput: 'c2pa-file',    stateKey: 'c2pa' },
    { id: 'cosu-upload',    fileInput: 'cosu-file',    stateKey: 'cosu' },
    { id: 'lab-upload',     fileInput: 'lab-file',     stateKey: 'lab' }
  ];

  zones.forEach(({ id, fileInput, stateKey }) => {
    const zone = document.getElementById(id);
    const input = document.getElementById(fileInput);
    if (!zone || !input) return;

    // Click to upload
    zone.addEventListener('click', (e) => {
      if (e.target.closest('.btn')) return;
      input.click();
    });

    // Drag and drop
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(stateKey, e.dataTransfer.files[0]);
      }
    });

    // File input change
    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        handleFileSelect(stateKey, input.files[0]);
      }
    });
  });
}

function handleFileSelect(stateKey, file) {
  state[stateKey].file = file;

  const mapPrefix = {
    cloaker: 'cloaker',
    c2pa: 'c2pa',
    cosu: 'cosu',
    lab: 'lab'
  };
  const prefix = mapPrefix[stateKey];

  // Hide upload zone, show file info
  const uploadZone = document.getElementById(`${prefix}-upload`);
  const fileInfo = document.getElementById(`${prefix}-file-info`);
  if (uploadZone) uploadZone.classList.add('hidden');
  if (fileInfo) fileInfo.classList.remove('hidden');

  // Set filename
  const fnEl = document.getElementById(`${prefix}-filename`);
  if (fnEl) fnEl.textContent = file.name;

  // Set format
  const fmtEl = document.getElementById(`${prefix}-format`);
  if (fmtEl) {
    const ext = file.name.split('.').pop().toUpperCase();
    fmtEl.textContent = ext;
  }

  // Set size
  const sizeEl = document.getElementById(`${prefix}-size`);
  if (sizeEl) sizeEl.textContent = formatFileSize(file.size);

  // Enable process button
  const btnMap = {
    cloaker: 'btn-process-cloaker',
    c2pa: 'btn-process-c2pa',
    cosu: 'btn-process-cosu',
    lab: 'btn-process-lab'
  };
  const btn = document.getElementById(btnMap[stateKey]);
  if (btn) btn.disabled = false;

  // For C2PA - inspect frames
  if (stateKey === 'c2pa') {
    inspectMp3Frames(file);
  }

  showToast('success', `File loaded: ${file.name}`);
}

function resetUpload(stateKey) {
  state[stateKey].file = null;

  const mapPrefix = {
    cloaker: 'cloaker',
    c2pa: 'c2pa',
    cosu: 'cosu',
    lab: 'lab'
  };
  const prefix = mapPrefix[stateKey];

  const uploadZone = document.getElementById(`${prefix}-upload`);
  const fileInfo = document.getElementById(`${prefix}-file-info`);
  if (uploadZone) uploadZone.classList.remove('hidden');
  if (fileInfo) fileInfo.classList.add('hidden');

  // Reset file input
  const inputMap = {
    cloaker: 'cloaker-file',
    c2pa: 'c2pa-file',
    cosu: 'cosu-file',
    lab: 'lab-file'
  };
  const input = document.getElementById(inputMap[stateKey]);
  if (input) input.value = '';

  // Disable process button
  const btnMap = {
    cloaker: 'btn-process-cloaker',
    c2pa: 'btn-process-c2pa',
    cosu: 'btn-process-cosu',
    lab: 'btn-process-lab'
  };
  const btn = document.getElementById(btnMap[stateKey]);
  if (btn) btn.disabled = true;
}

// ══════════════════════════════════════════
//  C2PA BINARY INSPECTOR (Client-side ID3 parsing)
// ══════════════════════════════════════════
async function inspectMp3Frames(file) {
  const inspector = document.getElementById('c2pa-inspector');
  inspector.innerHTML = '<div class="inspector-placeholder"><span>Analyzing ID3 frames...</span></div>';

  try {
    const buffer = await file.arrayBuffer();
    const view = new Uint8Array(buffer);
    const frames = parseID3v2Frames(view);

    if (frames.length === 0) {
      inspector.innerHTML = '<div class="inspector-placeholder"><span>No ID3v2 tag found in this file</span></div>';
      return;
    }

    inspector.innerHTML = '';
    frames.forEach(frame => {
      const el = document.createElement('div');
      el.className = 'inspector-frame';

      let tagClass = 'safe';
      if (frame.dangerous) tagClass = 'danger';
      else if (['TSSE', 'PRIV'].includes(frame.id)) tagClass = 'warning';

      el.innerHTML = `
        <div class="frame-tag ${tagClass}">${escapeHtml(frame.id)}</div>
        <div style="flex:1">
          <div style="font-size:0.8rem;font-weight:500;color:var(--text-primary)">${escapeHtml(frame.label)}</div>
          <div style="font-size:0.7rem;color:var(--text-muted)">${frame.size} bytes${frame.reason ? ' — ' + escapeHtml(frame.reason) : ''}</div>
        </div>
        <div style="font-size:0.7rem;font-weight:600;color:${frame.dangerous ? 'var(--accent-rose)' : 'var(--accent-emerald)'}">
          ${frame.dangerous ? '⚠ STRIP' : '✓ SAFE'}
        </div>
      `;
      inspector.appendChild(el);
    });

    const dangerCount = frames.filter(f => f.dangerous).length;
    if (dangerCount > 0) {
      showToast('info', `Found ${dangerCount} dangerous frame(s) to strip`);
    } else {
      showToast('success', 'No dangerous frames detected');
    }
  } catch (err) {
    inspector.innerHTML = `<div class="inspector-placeholder"><span>Error parsing: ${escapeHtml(err.message)}</span></div>`;
  }
}

function parseID3v2Frames(view) {
  const frames = [];
  if (view.length < 10) return frames;

  // Check for ID3 header
  const header = String.fromCharCode(view[0], view[1], view[2]);
  if (header !== 'ID3') return frames;

  const majorVersion = view[3];
  const flags = view[5];
  const tagSize = parseSyncSafe(view, 6);
  const totalTagSize = tagSize + 10;

  let offset = 10;
  // Handle extended header
  if (flags & 0x40) {
    const extSize = majorVersion === 4 ? parseSyncSafe(view, offset) : readUint32BE(view, offset);
    offset += extSize;
  }

  const frameLabels = {
    'TIT2': 'Title', 'TPE1': 'Artist', 'TALB': 'Album',
    'TYER': 'Year', 'TDRC': 'Recording Date', 'TCON': 'Genre',
    'TRCK': 'Track Number', 'COMM': 'Comment', 'APIC': 'Cover Art',
    'TSSE': 'Encoder Signature', 'GEOB': 'General Encapsulated Object',
    'WOAS': 'Official Audio Source URL', 'TXXX': 'User Text',
    'PRIV': 'Private Frame', 'TCOP': 'Copyright',
    'TENC': 'Encoded By', 'TPUB': 'Publisher', 'TBPM': 'BPM',
    'TLEN': 'Length', 'TPOS': 'Disc Number', 'TPE2': 'Album Artist',
    'TCOM': 'Composer', 'USLT': 'Lyrics', 'SYLT': 'Synced Lyrics',
    'WOAR': 'Artist URL', 'WXXX': 'User URL', 'MCDI': 'Music CD Identifier',
    'UFID': 'Unique File ID'
  };

  while (offset < totalTagSize && offset < view.length - 10) {
    if (view[offset] === 0x00) break;

    const frameId = String.fromCharCode(view[offset], view[offset+1], view[offset+2], view[offset+3]);
    if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

    let frameSize;
    if (majorVersion === 4) {
      frameSize = parseSyncSafe(view, offset + 4);
    } else {
      frameSize = readUint32BE(view, offset + 4);
    }

    const frameEnd = Math.min(offset + 10 + frameSize, view.length);
    const frameData = view.slice(offset + 10, frameEnd);

    let dangerous = false;
    let reason = '';

    // Check for C2PA in GEOB
    if (frameId === 'GEOB') {
      const str = uint8ArrayToLatin1(frameData);
      if (str.includes('c2pa') || str.includes('application/c2pa')) {
        dangerous = true;
        reason = 'C2PA Manifest Store detected';
      }
    }
    // Check for Suno URLs
    if (frameId === 'WOAS') {
      const url = uint8ArrayToLatin1(frameData);
      if (url.includes('suno.com')) {
        dangerous = true;
        reason = `Suno Source URL: ${url.substring(0, 60)}`;
      }
    }
    // Check TXXX for Suno
    if (frameId === 'TXXX') {
      const content = uint8ArrayToLatin1(frameData);
      if (content.toLowerCase().includes('suno')) {
        dangerous = true;
        reason = 'Suno tracking tag';
      }
    }
    // Check COMM for Suno
    if (frameId === 'COMM') {
      const content = uint8ArrayToLatin1(frameData);
      if (content.toLowerCase().includes('suno')) {
        dangerous = true;
        reason = 'Suno comment tag';
      }
    }
    // TSSE always dangerous
    if (frameId === 'TSSE') {
      dangerous = true;
      reason = 'Encoder fingerprint (Lavf/FFmpeg)';
    }
    // PRIV always dangerous
    if (frameId === 'PRIV') {
      dangerous = true;
      reason = 'Private DRM/identification frame';
    }

    frames.push({
      id: frameId,
      label: frameLabels[frameId] || frameId,
      size: frameSize,
      dangerous,
      reason
    });

    offset += 10 + frameSize;
  }

  return frames;
}

function parseSyncSafe(view, offset) {
  return (
    ((view[offset] & 0x7f) << 21) |
    ((view[offset + 1] & 0x7f) << 14) |
    ((view[offset + 2] & 0x7f) << 7) |
    (view[offset + 3] & 0x7f)
  );
}

function readUint32BE(view, offset) {
  return (view[offset] << 24) | (view[offset+1] << 16) | (view[offset+2] << 8) | view[offset+3];
}

function uint8ArrayToLatin1(arr) {
  let result = '';
  for (let i = 0; i < Math.min(arr.length, 500); i++) {
    result += String.fromCharCode(arr[i]);
  }
  return result;
}

// ══════════════════════════════════════════
//  COSU MODES & EXPORT
// ══════════════════════════════════════════
function initCosuModes() {
  const modeCards = document.querySelectorAll('.cosu-mode-card');
  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      modeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.cosu.mode = card.dataset.mode;
    });
  });
}

function initCosuExport() {
  const sliceBtn = document.getElementById('cosu-export-slice');
  const fullBtn = document.getElementById('cosu-export-full');
  const sliceSettings = document.getElementById('cosu-slice-settings');

  sliceBtn.addEventListener('click', () => {
    sliceBtn.classList.add('active');
    fullBtn.classList.remove('active');
    state.cosu.exportMode = 'slice';
    sliceSettings.style.display = '';
  });

  fullBtn.addEventListener('click', () => {
    fullBtn.classList.add('active');
    sliceBtn.classList.remove('active');
    state.cosu.exportMode = 'full';
    sliceSettings.style.display = 'none';
  });
}

// ══════════════════════════════════════════
//  CUSTOM LAB SLIDERS
// ══════════════════════════════════════════
function initLabSliders() {
  const sliders = [
    { id: 'lab-subbass',    valId: 'lab-subbass-val',    format: v => `${v > 0 ? '+' : ''}${v} dB` },
    { id: 'lab-mudscoop',   valId: 'lab-mudscoop-val',   format: v => `${v > 0 ? '+' : ''}${v} dB` },
    { id: 'lab-antinotch',  valId: 'lab-antinotch-val',  format: v => `${v > 0 ? '+' : ''}${v} dB` },
    { id: 'lab-airsheen',   valId: 'lab-airsheen-val',   format: v => `${v > 0 ? '+' : ''}${v} dB` },
    { id: 'lab-pitch',      valId: 'lab-pitch-val',      format: v => `${v > 0 ? '+' : ''}${v} ¢` },
    { id: 'lab-stereo',     valId: 'lab-stereo-val',     format: v => `${v}x` },
    { id: 'lab-softclip',   valId: 'lab-softclip-val',   format: v => `${v}x` },
    { id: 'lab-ultrasonic', valId: 'lab-ultrasonic-val', format: v => `${(v/1000).toFixed(1)} kHz` },
    { id: 'lab-lufs',       valId: 'lab-lufs-val',       format: v => `${v} LUFS` }
  ];

  sliders.forEach(({ id, valId, format }) => {
    const slider = document.getElementById(id);
    const valEl = document.getElementById(valId);
    if (!slider || !valEl) return;

    const update = () => {
      valEl.textContent = format(parseFloat(slider.value));
      updateFilterGraphPreview();
      drawEQCurve();
    };

    slider.addEventListener('input', update);
    update(); // Initialize display
  });
}

function getLabParams() {
  return {
    pitchCents:       parseFloat(document.getElementById('lab-pitch')?.value || 0),
    subBassGain:      parseFloat(document.getElementById('lab-subbass')?.value || 3.2),
    mudScoopGain:     parseFloat(document.getElementById('lab-mudscoop')?.value || -2.2),
    antiAiNotchGain:  parseFloat(document.getElementById('lab-antinotch')?.value || -2.0),
    airSheenGain:     parseFloat(document.getElementById('lab-airsheen')?.value || 0.5),
    ultrasonicCut:    parseFloat(document.getElementById('lab-ultrasonic')?.value || 17200),
    stereoSideLevel:  parseFloat(document.getElementById('lab-stereo')?.value || 1.05),
    softClip:         parseFloat(document.getElementById('lab-softclip')?.value || 1.10),
    targetLufs:       parseFloat(document.getElementById('lab-lufs')?.value || -9.5)
  };
}

// ── Build filter graph preview (mirrors buildCustomConfig + buildFilterGraph from engine) ──
function updateFilterGraphPreview() {
  const params = getLabParams();
  const filters = [];

  // Tape Resample
  if (params.pitchCents !== 0) {
    const tapeResample = Math.pow(2, params.pitchCents / 1200);
    const pitchedRate = Math.round(44100 * tapeResample);
    filters.push(`asetrate=${pitchedRate}`);
    filters.push(`aresample=44100:dither_method=triangular`);
  }

  // Custom EQ
  filters.push(`equalizer=f=60:width_type=q:width=1.0:g=${params.subBassGain}`);
  filters.push(`equalizer=f=250:width_type=q:width=1.2:g=${params.mudScoopGain}`);

  if (params.antiAiNotchGain !== 0) {
    filters.push(`equalizer=f=3450:width_type=q:width=3.5:g=${params.antiAiNotchGain}`);
    filters.push(`equalizer=f=5200:width_type=q:width=3.0:g=${Math.round(params.antiAiNotchGain * 0.75 * 10) / 10}`);
  }

  if (params.airSheenGain !== 0) {
    filters.push(`highshelf=f=15000:g=${params.airSheenGain}`);
  }

  // Ultrasonic cut
  if (params.ultrasonicCut > 0 && params.ultrasonicCut < 20000) {
    filters.push(`lowpass=f=${params.ultrasonicCut}`);
  }

  // M/S Phase
  filters.push(`stereotools=mode=lr>ms,channelsplit=channel_layout=stereo[mid][side]`);
  filters.push(`[side]aphaser=in_gain=0.92:out_gain=0.92:delay=1.0:decay=0.08:speed=0.18:type=s[side_mod]`);
  filters.push(`[mid][side_mod]join=inputs=2:channel_layout=stereo,stereotools=mode=ms>lr:slev=${params.stereoSideLevel}:delay=0.6:softclip=1`);

  // Soft clip
  if (params.softClip > 1.0) {
    filters.push(`asoftclip=type=atan:param=${params.softClip}`);
  }

  // Resample + Loudnorm
  if (!params.pitchCents) {
    filters.push(`aresample=44100:dither_method=triangular`);
  }

  const lra = params.targetLufs >= -10.5 ? 3 : 4;
  const tp = params.targetLufs >= -10.5 ? -0.5 : -0.8;
  filters.push(`loudnorm=I=${params.targetLufs}:LRA=${lra}:TP=${tp}`);

  const codeEl = document.getElementById('lab-filtergraph');
  if (codeEl) {
    codeEl.textContent = filters.join(',\n');
  }
}

function copyFilterGraph() {
  const codeEl = document.getElementById('lab-filtergraph');
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.textContent).then(() => {
      showToast('success', 'Filter graph copied to clipboard');
    }).catch(() => {
      // Fallback copy
      const textArea = document.createElement('textarea');
      textArea.value = codeEl.textContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('success', 'Filter graph copied to clipboard');
    });
  }
}

// ══════════════════════════════════════════
//  EQ VISUALIZER (Canvas)
// ══════════════════════════════════════════
function drawEQCurve() {
  const canvas = document.getElementById('eq-canvas');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  // Guard against hidden tab (0 width or height)
  if (!w || !h || w <= 0 || h <= 0) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  if (ctx.resetTransform) {
    ctx.resetTransform();
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  ctx.scale(dpr, dpr);

  const params = getLabParams();

  const themeStyles = getComputedStyle(document.documentElement);
  const canvasBackground = themeStyles.getPropertyValue('--canvas-bg').trim();
  const canvasGrid = themeStyles.getPropertyValue('--canvas-grid').trim();
  const canvasLabel = themeStyles.getPropertyValue('--canvas-label').trim();
  const canvasGridStrong = themeStyles.getPropertyValue('--canvas-grid-strong').trim();

  // Background
  ctx.fillStyle = canvasBackground;
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = canvasGrid;
  ctx.lineWidth = 1;

  // Horizontal grid (dB levels)
  const dbLevels = [-12, -6, 0, 6, 12];
  const midY = h / 2;
  const dbScale = h / 28; // ±14 dB range

  dbLevels.forEach(db => {
    const y = midY - db * dbScale;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();

    // Label
    ctx.fillStyle = canvasLabel;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${db > 0 ? '+' : ''}${db} dB`, 4, y - 3);
  });

  // Frequency labels
  const freqLabels = [20, 60, 250, 1000, 3450, 5200, 10000, 15000, 20000];
  ctx.fillStyle = canvasLabel;
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';

  freqLabels.forEach(freq => {
    const x = freqToX(freq, w);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.strokeStyle = canvasGrid;
    ctx.stroke();

    const label = freq >= 1000 ? `${freq/1000}k` : `${freq}`;
    ctx.fillText(label, x, h - 4);
  });

  // 0dB center line
  ctx.strokeStyle = canvasGridStrong;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(w, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  // EQ curve
  const eqBands = [
    { f: 60, q: 1.0, g: params.subBassGain },
    { f: 250, q: 1.2, g: params.mudScoopGain }
  ];
  if (params.antiAiNotchGain !== 0) {
    eqBands.push({ f: 3450, q: 3.5, g: params.antiAiNotchGain });
    eqBands.push({ f: 5200, q: 3.0, g: Math.round(params.antiAiNotchGain * 0.75 * 10) / 10 });
  }
  if (params.airSheenGain !== 0) {
    eqBands.push({ f: 15000, q: 0.7, g: params.airSheenGain, type: 'highshelf' });
  }

  // Calculate composite EQ curve
  const points = [];
  for (let px = 0; px < w; px++) {
    const freq = xToFreq(px, w);
    let totalGain = 0;

    eqBands.forEach(band => {
      if (band.type === 'highshelf') {
        const ratio = freq / band.f;
        if (ratio > 1) {
          totalGain += band.g * Math.min(1, (ratio - 1) * 2);
        } else {
          totalGain += band.g * Math.max(0, 1 - Math.pow(band.f / freq, 2) * 0.3);
        }
      } else {
        const logRatio = Math.log2(freq / band.f);
        const bandwidth = 1 / (band.q || 1.2);
        const attenuation = Math.exp(-0.5 * Math.pow(logRatio / (bandwidth * 0.5), 2));
        totalGain += band.g * attenuation;
      }
    });

    if (params.ultrasonicCut > 0 && params.ultrasonicCut < 20000) {
      const ratio = freq / params.ultrasonicCut;
      if (ratio > 0.8) {
        const rolloff = -24 * Math.pow(Math.max(0, (ratio - 0.8) / 0.4), 2);
        totalGain += rolloff;
      }
    }

    totalGain = Math.max(-14, Math.min(14, totalGain));
    const y = midY - totalGain * dbScale;
    points.push({ x: px, y });
  }

  if (points.length < 2) return;

  // Draw fill gradient
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, 'rgba(167, 139, 250, 0.15)');
  gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.15)');

  ctx.beginPath();
  ctx.moveTo(0, midY);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(w, midY);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw curve line
  const lineGradient = ctx.createLinearGradient(0, 0, w, 0);
  lineGradient.addColorStop(0, '#a78bfa');
  lineGradient.addColorStop(0.5, '#06b6d4');
  lineGradient.addColorStop(1, '#10b981');

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw EQ band dots
  eqBands.forEach(band => {
    const x = freqToX(band.f, w);
    const y = midY - band.g * dbScale;

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = band.g < 0 ? '#f43f5e' : '#10b981';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = band.g < 0 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function freqToX(freq, width) {
  const minLog = Math.log10(20);
  const maxLog = Math.log10(20000);
  return ((Math.log10(freq) - minLog) / (maxLog - minLog)) * width;
}

function xToFreq(x, width) {
  const minLog = Math.log10(20);
  const maxLog = Math.log10(20000);
  return Math.pow(10, minLog + (x / width) * (maxLog - minLog));
}

// Redraw on resize
window.addEventListener('resize', () => {
  drawEQCurve();
});

// ══════════════════════════════════════════
//  COVER ART HANDLER
// ══════════════════════════════════════════
function initCoverArt() {
  const coverInput = document.getElementById('meta-cover');
  const coverLabel = document.getElementById('cover-filename');
  if (!coverInput || !coverLabel) return;

  coverInput.addEventListener('change', () => {
    if (coverInput.files.length > 0) {
      coverLabel.textContent = coverInput.files[0].name;
      coverLabel.style.color = 'var(--accent-emerald)';
    }
  });
}

// ══════════════════════════════════════════
//  NODE.JS ENGINE API INTEGRATION
// ══════════════════════════════════════════
const API_BASE = window.location.protocol.startsWith('http') ? '' : 'http://localhost:3000';
let isServerOnline = false;

// Check connection to Node.js backend
async function checkEngineConnection() {
  try {
    const res = await fetch(`${API_BASE}/api/presets`);
    if (res.ok) {
      isServerOnline = true;
      updateEngineStatus(true);
      return true;
    }
  } catch (_) {}
  isServerOnline = false;
  updateEngineStatus(false);
  return false;
}

function updateEngineStatus(online) {
  let pill = document.getElementById('engine-status-pill');
  if (!pill) {
    pill = document.createElement('div');
    pill.id = 'engine-status-pill';
    pill.className = 'engine-status-pill';
    const headerInner = document.querySelector('.header-inner');
    if (headerInner) {
      headerInner.appendChild(pill);
    }
  }

  if (online) {
    pill.innerHTML = '<span class="status-dot online"></span> Node.js Engine: <strong>Active</strong> (localhost:3000)';
    pill.classList.remove('offline');
    pill.classList.add('online');
  } else {
    pill.innerHTML = '<span class="status-dot offline"></span> Engine: <strong>Offline</strong> (Buka http://localhost:3000)';
    pill.classList.remove('online');
    pill.classList.add('offline');
  }
}

// Check on boot and periodically
checkEngineConnection();
setInterval(checkEngineConnection, 10000);

// ── Attach Process Button Listeners ──
document.getElementById('btn-process-cloaker')?.addEventListener('click', () => {
  handleProcessCloaker();
});

document.getElementById('btn-process-c2pa')?.addEventListener('click', () => {
  handleProcessC2PA();
});

document.getElementById('btn-process-cosu')?.addEventListener('click', () => {
  handleProcessCoSu();
});

document.getElementById('btn-process-lab')?.addEventListener('click', () => {
  handleProcessLab();
});

// ══════════════════════════════════════════
//  1. ACOUSTIC CLOAKER (Full Pipeline)
// ══════════════════════════════════════════
async function handleProcessCloaker() {
  const file = state.cloaker.file;
  if (!file) {
    showToast('error', '⚠️ Silakan pilih file audio terlebih dahulu.');
    return;
  }

  const progressSection = document.getElementById('cloaker-progress');
  const resultCard = document.getElementById('cloaker-result');
  const btn = document.getElementById('btn-process-cloaker');

  progressSection.classList.remove('hidden');
  resultCard.classList.add('hidden');
  btn.disabled = true;

  const stageEls = document.querySelectorAll('#cloaker-stages .stage');
  const setStage = (idx, pct) => {
    stageEls.forEach((s, i) => {
      s.classList.remove('active');
      if (i < idx) s.classList.add('done');
      if (i === idx) s.classList.add('active');
    });
    const fill = document.getElementById('cloaker-progress-fill');
    const label = document.getElementById('cloaker-progress-pct');
    if (fill) fill.style.width = `${pct}%`;
    if (label) label.textContent = `${pct}%`;
  };

  setStage(0, 20); // C2PA Strip stage
  showToast('info', 'Mengirim file ke ReSu_ Master Engine...');

  try {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('preset', state.cloaker.preset);
    formData.append('format', state.cloaker.format);

    const title = document.getElementById('meta-title')?.value;
    const artist = document.getElementById('meta-artist')?.value;
    const album = document.getElementById('meta-album')?.value;
    const year = document.getElementById('meta-year')?.value;
    const copyright = document.getElementById('meta-copyright')?.value;
    if (title) formData.append('title', title);
    if (artist) formData.append('artist', artist);
    if (album) formData.append('album', album);
    if (year) formData.append('year', year);
    if (copyright) formData.append('copyright', copyright);

    const coverInput = document.getElementById('meta-cover');
    if (coverInput && coverInput.files.length > 0) {
      formData.append('coverArt', coverInput.files[0]);
    }

    const t1 = setTimeout(() => setStage(1, 45), 1000); // Acoustic Cloak
    const t2 = setTimeout(() => setStage(2, 75), 2500); // Studio Master

    const response = await fetch(`${API_BASE}/api/process`, {
      method: 'POST',
      body: formData
    });

    clearTimeout(t1);
    clearTimeout(t2);

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || `Server HTTP ${response.status}`);
    }

    const data = await response.json();
    setStage(3, 100); // Finalize
    stageEls.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });

    // Populate result card
    document.getElementById('result-preset').textContent = data.preset || PRESETS[state.cloaker.preset]?.name || state.cloaker.preset;
    document.getElementById('result-format').textContent = data.format || AUDIO_FORMATS[state.cloaker.format]?.name || state.cloaker.format;
    document.getElementById('result-c2pa').textContent = data.c2paRemoved ? '✅ Yes' : 'Clean';
    document.getElementById('result-bytes').textContent = data.c2paBytesStripped ? `${data.c2paBytesStripped} bytes` : '0 bytes';
    document.getElementById('result-size').textContent = data.finalSize ? formatFileSize(data.finalSize) : '—';
    document.getElementById('result-duration').textContent = data.totalDurationMs ? `${(data.totalDurationMs / 1000).toFixed(1)}s` : '—';

    // Store download details & attach player
    const fullDownloadUrl = `${API_BASE}${data.downloadUrl}`;
    state.lastCloakerDownload = {
      url: fullDownloadUrl,
      filename: data.downloadFilename || `ReSu_${file.name}`
    };

    attachAudioPlayer('cloaker-result', fullDownloadUrl);

    resultCard.classList.remove('hidden');
    showToast('success', '🚀 Audio processed — 100% COMMERCIAL READY');

  } catch (err) {
    console.error('Cloaker error:', err);
    showToast('error', `Gagal memproses audio: ${err.message}`);
    progressSection.classList.add('hidden');
  } finally {
    btn.disabled = false;
  }
}

// ══════════════════════════════════════════
//  2. C2PA & PROVENANCE STRIPPER
// ══════════════════════════════════════════
async function handleProcessC2PA() {
  const file = state.c2pa.file;
  if (!file) {
    showToast('error', '⚠️ Silakan pilih file MP3 terlebih dahulu.');
    return;
  }

  const btn = document.getElementById('btn-process-c2pa');
  const resultCard = document.getElementById('c2pa-result');
  btn.disabled = true;

  showToast('info', 'Membersihkan manifest C2PA & frame ID3 berbahaya...');

  try {
    const formData = new FormData();
    formData.append('audio', file);

    const title = document.getElementById('meta-title')?.value;
    const artist = document.getElementById('meta-artist')?.value;
    if (title) formData.append('title', title);
    if (artist) formData.append('artist', artist);

    const response = await fetch(`${API_BASE}/api/strip-c2pa`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || `Server HTTP ${response.status}`);
    }

    const data = await response.json();
    const statsEl = document.getElementById('c2pa-result-stats');
    const removedCount = data.strippedFrames ? data.strippedFrames.length : 0;

    statsEl.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">C2PA Removed</span>
        <span class="stat-value">${data.audit?.removedC2PA ? '✅ Yes' : 'Not detected'}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Frames Stripped</span>
        <span class="stat-value">${removedCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Bytes Saved</span>
        <span class="stat-value">${formatFileSize(data.audit?.c2paSize || 0)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">ID3 Version</span>
        <span class="stat-value">ID3v2.3.0</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">ID3v1 Injected</span>
        <span class="stat-value">✅ Yes</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Status</span>
        <span class="stat-value" style="color:var(--accent-emerald)">CLEAN</span>
      </div>
    `;

    const fullDownloadUrl = `${API_BASE}${data.downloadUrl}`;
    state.lastC2paDownload = {
      url: fullDownloadUrl,
      filename: data.downloadFilename || `ReSu_Clean_${file.name}`
    };

    attachAudioPlayer('c2pa-result', fullDownloadUrl);

    resultCard.classList.remove('hidden');
    showToast('success', '🧹 Semua frame berbahaya & C2PA berhasil dibersihkan');

  } catch (err) {
    console.error('C2PA error:', err);
    showToast('error', `Gagal strip C2PA: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

// ══════════════════════════════════════════
//  3. COSU STEALTH SEED PROCESSOR
// ══════════════════════════════════════════
async function handleProcessCoSu() {
  const file = state.cosu.file;
  if (!file) {
    showToast('error', '⚠️ Silakan pilih file audio untuk CoSu terlebih dahulu.');
    return;
  }

  const btn = document.getElementById('btn-process-cosu');
  const resultCard = document.getElementById('cosu-result');
  btn.disabled = true;

  const modeNames = {
    original: '🛡️ Original Side-Harmoni',
    slow_tempo: '🌙 Slow Tempo Shield',
    staccato: '⚡ Staccato Guide'
  };

  showToast('info', `Menerapkan ${modeNames[state.cosu.mode]}...`);

  try {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('mode', state.cosu.exportMode);
    formData.append('preset', state.cosu.mode);
    formData.append('startTime', document.getElementById('cosu-start')?.value || 0);
    formData.append('duration', document.getElementById('cosu-duration')?.value || 60);

    const response = await fetch(`${API_BASE}/api/cosu-export`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || `Server HTTP ${response.status}`);
    }

    const data = await response.json();
    const statsEl = document.getElementById('cosu-result-stats');
    const durLabel = state.cosu.exportMode === 'full' ? 'Full Song' : `${document.getElementById('cosu-duration')?.value || 60}s`;

    statsEl.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Mode Preset</span>
        <span class="stat-value">${modeNames[state.cosu.mode]}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Durasi</span>
        <span class="stat-value">${durLabel}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Format Output</span>
        <span class="stat-value">MP3 320 kbps</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Fase Stereo</span>
        <span class="stat-value">${state.cosu.mode === 'slow_tempo' ? 'In-Phase + Tremolo' : 'L-R Inverted'}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Pitch Transpose</span>
        <span class="stat-value">-2 Semitones</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Status Bypass</span>
        <span class="stat-value" style="color:var(--accent-emerald)">STEALTH READY</span>
      </div>
    `;

    const fullDownloadUrl = `${API_BASE}${data.downloadUrl}`;
    state.lastCosuDownload = {
      url: fullDownloadUrl,
      filename: data.downloadFilename || `ReSu_Stealth_${file.name}`
    };

    attachAudioPlayer('cosu-result', fullDownloadUrl);

    resultCard.classList.remove('hidden');
    showToast('success', '🎵 Stealth seed CoSu berhasil digenerate');

  } catch (err) {
    console.error('CoSu error:', err);
    showToast('error', `Gagal ekspor CoSu: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

// ══════════════════════════════════════════
//  4. CUSTOM STUDIO LAB PROCESSOR
// ══════════════════════════════════════════
async function handleProcessLab() {
  const file = state.lab.file;
  if (!file) {
    showToast('error', '⚠️ Silakan pilih file audio di tab Custom Lab terlebih dahulu.');
    return;
  }

  const btn = document.getElementById('btn-process-lab');
  btn.disabled = true;

  showToast('info', 'Merender audio dengan Custom Studio Lab DSP rack...');

  try {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('preset', 'custom-lab');
    formData.append('format', 'mp3-320');
    formData.append('customParams', JSON.stringify(getLabParams()));

    const response = await fetch(`${API_BASE}/api/process`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || `Server HTTP ${response.status}`);
    }

    const data = await response.json();
    const downloadUrl = `${API_BASE}${data.downloadUrl}`;
    const filename = data.downloadFilename || 'ReSu_Custom_Master.mp3';

    // Trigger auto-download
    downloadFromUrl(downloadUrl, filename);
    showToast('success', '🔧 Custom Lab mastering selesai & file didownload!');

  } catch (err) {
    console.error('Custom Lab error:', err);
    showToast('error', `Gagal Custom Lab: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

// ── Audio Player Attachment ──
function attachAudioPlayer(containerId, audioUrl) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let player = container.querySelector('.resu-audio-player');
  if (!player) {
    player = document.createElement('div');
    player.className = 'resu-audio-player';
    const actions = container.querySelector('.result-actions');
    if (actions) {
      container.insertBefore(player, actions);
    } else {
      container.appendChild(player);
    }
  }

  player.innerHTML = `
    <div class="audio-preview">
      <div class="audio-preview-title">
        <span>🎧 Direct Audio Preview</span>
      </div>
      <audio controls src="${audioUrl}"></audio>
    </div>
  `;
}

// ══════════════════════════════════════════
//  DOWNLOAD HANDLERS
// ══════════════════════════════════════════
document.getElementById('btn-download-result')?.addEventListener('click', () => {
  if (state.lastCloakerDownload) {
    downloadFromUrl(state.lastCloakerDownload.url, state.lastCloakerDownload.filename);
  } else if (state.cloaker.file) {
    triggerDownload(state.cloaker.file, `ReSu_Mastered_${state.cloaker.file.name}`);
  }
});

document.getElementById('btn-download-c2pa')?.addEventListener('click', () => {
  if (state.lastC2paDownload) {
    downloadFromUrl(state.lastC2paDownload.url, state.lastC2paDownload.filename);
  } else if (state.c2pa.file) {
    triggerDownload(state.c2pa.file, `ReSu_Clean_${state.c2pa.file.name}`);
  }
});

document.getElementById('btn-download-cosu')?.addEventListener('click', () => {
  if (state.lastCosuDownload) {
    downloadFromUrl(state.lastCosuDownload.url, state.lastCosuDownload.filename);
  } else if (state.cosu.file) {
    triggerDownload(state.cosu.file, `ReSu_Stealth_${state.cosu.file.name}`);
  }
});

function downloadFromUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('success', `Mengunduh: ${filename}`);
}

function triggerDownload(file, filename) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('success', `Mengunduh: ${filename}`);
}

// ══════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showToast(type, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 4500);
}
