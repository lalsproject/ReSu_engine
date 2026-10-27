const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ── Import Engine Modules ──
const { processSong, PRESETS, AUDIO_FORMATS, stripC2PAAndSunoMetadata, generatePreviewSnippet } = require('./index');
const { sanitizeMp3File, extractCoverArtFromBuffer } = require('./c2pa-stripper');
const cosuProcessor = require('./cosu-processor');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Upload Directory ──
const UPLOAD_DIR = path.join(os.tmpdir(), 'resu_uploads');
const OUTPUT_DIR = path.join(os.tmpdir(), 'resu_output');

[UPLOAD_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Multer Config ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${unique}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'coverArt') {
      const imgExts = ['.jpg', '.jpeg', '.png'];
      cb(null, imgExts.includes(ext));
    } else {
      cb(null, allowedExts.includes(ext));
    }
  }
});

// ── CORS Middleware ──
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ── Static Files ──
app.use(express.static(__dirname));
app.use(express.json());

// ── Serve output files for download ──
app.use('/downloads', express.static(OUTPUT_DIR));

// ══════════════════════════════════════════════════
//  API: Get Available Presets & Formats
// ══════════════════════════════════════════════════
app.get('/api/presets', (req, res) => {
  const presetList = Object.entries(PRESETS).map(([key, val]) => ({
    id: key,
    name: val.name,
    description: val.description,
    targetLufs: val.targetLufs || null
  }));
  res.json({ presets: presetList });
});

app.get('/api/formats', (req, res) => {
  const formatList = Object.entries(AUDIO_FORMATS).map(([key, val]) => ({
    id: key,
    name: val.name,
    ext: val.ext
  }));
  res.json({ formats: formatList });
});

// ══════════════════════════════════════════════════
//  API: Full Audio Processing Pipeline (Acoustic Cloaker)
// ══════════════════════════════════════════════════
app.post('/api/process', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'coverArt', maxCount: 1 }
]), async (req, res) => {
  const audioFile = req.files?.audio?.[0];
  if (!audioFile) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  try {
    const preset = req.body.preset || 'commercial-master';
    const format = req.body.format || 'mp3-320';
    const formatConfig = AUDIO_FORMATS[format] || AUDIO_FORMATS['mp3-320'];

    // Build output filename
    const baseName = path.basename(audioFile.originalname, path.extname(audioFile.originalname));
    const outputFilename = `ReSu_${baseName}${formatConfig.ext}`;
    const outputPath = path.join(OUTPUT_DIR, `${Date.now()}_${outputFilename}`);

    const options = {
      preset,
      format,
      title: req.body.title || undefined,
      artist: req.body.artist || undefined,
      album: req.body.album || undefined,
      year: req.body.year || undefined,
      copyright: req.body.copyright || undefined
    };

    // Cover art handling
    if (req.files?.coverArt?.[0]) {
      options.coverArtPath = req.files.coverArt[0].path;
    }

    // Custom Lab parameters
    if (preset === 'custom-lab' && req.body.customParams) {
      try {
        options.customParams = JSON.parse(req.body.customParams);
      } catch (e) {
        options.customParams = {};
      }
    }

    console.log(`[ReSu_] Processing: ${audioFile.originalname}`);
    console.log(`[ReSu_] Preset: ${preset} | Format: ${format}`);

    const result = await processSong(audioFile.path, outputPath, options);

    // Return download info
    const downloadName = path.basename(outputPath);
    res.json({
      success: true,
      ...result,
      downloadUrl: `/downloads/${downloadName}`,
      downloadFilename: outputFilename
    });

  } catch (err) {
    console.error('[ReSu_] Processing error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    // Cleanup uploaded file
    try { if (audioFile?.path && fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path); } catch (_) {}
    try { if (req.files?.coverArt?.[0]?.path) fs.unlinkSync(req.files.coverArt[0].path); } catch (_) {}
  }
});

// ══════════════════════════════════════════════════
//  API: C2PA & Metadata Stripper
// ══════════════════════════════════════════════════
app.post('/api/strip-c2pa', upload.single('audio'), async (req, res) => {
  const audioFile = req.file;
  if (!audioFile) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  try {
    const baseName = path.basename(audioFile.originalname, path.extname(audioFile.originalname));
    const outputFilename = `ReSu_Clean_${baseName}.mp3`;
    const outputPath = path.join(OUTPUT_DIR, `${Date.now()}_${outputFilename}`);

    const options = {
      title: req.body.title || undefined,
      artist: req.body.artist || undefined,
      album: req.body.album || undefined,
      year: req.body.year || undefined,
      copyright: req.body.copyright || undefined
    };

    console.log(`[ReSu_ C2PA] Stripping: ${audioFile.originalname}`);

    const result = sanitizeMp3File(audioFile.path, outputPath, options);

    const downloadName = path.basename(outputPath);
    res.json({
      success: true,
      outputPath: outputPath,
      downloadUrl: `/downloads/${downloadName}`,
      downloadFilename: outputFilename,
      strippedFrames: result.strippedFrames,
      audit: result.audit
    });

  } catch (err) {
    console.error('[ReSu_ C2PA] Strip error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    try { if (audioFile?.path && fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path); } catch (_) {}
  }
});

// ══════════════════════════════════════════════════
//  API: C2PA Frame Inspector (Analyze without modifying)
// ══════════════════════════════════════════════════
app.post('/api/inspect-frames', upload.single('audio'), async (req, res) => {
  const audioFile = req.file;
  if (!audioFile) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  try {
    const buf = fs.readFileSync(audioFile.path);
    const result = stripC2PAAndSunoMetadata(buf, {}); // Dry run (we just read the audit)

    // Also try to extract cover art info
    let hasCoverArt = false;
    try {
      const cover = extractCoverArtFromBuffer(buf);
      hasCoverArt = !!(cover && cover.buffer);
    } catch (_) {}

    res.json({
      success: true,
      fileSize: buf.length,
      audit: result.audit,
      strippedFrames: result.strippedFrames,
      hasCoverArt
    });

  } catch (err) {
    console.error('[ReSu_] Inspect error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    try { if (audioFile?.path && fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path); } catch (_) {}
  }
});

// ══════════════════════════════════════════════════
//  API: CoSu Stealth Seed Processor
// ══════════════════════════════════════════════════
app.post('/api/cosu-export', upload.single('audio'), async (req, res) => {
  const audioFile = req.file;
  if (!audioFile) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  try {
    const mode = req.body.mode || 'slice';  // 'slice' or 'full'
    const preset = req.body.preset || 'original';
    const startTime = parseFloat(req.body.startTime || 0);
    const duration = parseFloat(req.body.duration || 60);

    const baseName = path.basename(audioFile.originalname, path.extname(audioFile.originalname));
    const presetSuffix = preset === 'slow_tempo' ? '_SlowTempo' : (preset === 'staccato' ? '_Staccato' : '_SideHarmoni');
    const outputFilename = `ReSu_${baseName}${presetSuffix}.mp3`;
    const outputPath = path.join(OUTPUT_DIR, `${Date.now()}_${outputFilename}`);

    console.log(`[ReSu_ CoSu] Exporting: ${audioFile.originalname} | Mode: ${mode} | Preset: ${preset}`);

    const result = await cosuProcessor.exportStealthSeed(audioFile.path, {
      mode,
      preset,
      startTime,
      duration,
      outputPath
    });

    const downloadName = path.basename(result.outputPath);
    res.json({
      success: true,
      ...result,
      downloadUrl: `/downloads/${downloadName}`,
      downloadFilename: outputFilename
    });

  } catch (err) {
    console.error('[ReSu_ CoSu] Export error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    try { if (audioFile?.path && fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path); } catch (_) {}
  }
});

// ══════════════════════════════════════════════════
//  API: CoSu Audio Preview (Base64 data URI)
// ══════════════════════════════════════════════════
app.post('/api/cosu-preview', upload.single('audio'), async (req, res) => {
  const audioFile = req.file;
  if (!audioFile) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  try {
    const preset = req.body.preset || 'original';
    const startTime = parseFloat(req.body.startTime || 0);
    const duration = parseFloat(req.body.duration || 15);

    const base64Audio = await cosuProcessor.renderPreviewFilter(audioFile.path, startTime, duration, preset);

    res.json({
      success: true,
      base64Audio,
      preset,
      duration
    });

  } catch (err) {
    console.error('[ReSu_] Preview error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    try { if (audioFile?.path && fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path); } catch (_) {}
  }
});

// ══════════════════════════════════════════════════
//  API: Custom Lab Preview Snippet
// ══════════════════════════════════════════════════
app.post('/api/lab-preview', upload.single('audio'), async (req, res) => {
  const audioFile = req.file;
  if (!audioFile) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  try {
    let customParams = {};
    try { customParams = JSON.parse(req.body.customParams || '{}'); } catch (_) {}

    const isOriginal = req.body.isOriginal === 'true';
    const startSec = parseFloat(req.body.startSec || 15);
    const durationSec = parseFloat(req.body.durationSec || 15);

    const result = await generatePreviewSnippet(audioFile.path, {
      customParams,
      isOriginal,
      startSec,
      durationSec
    });

    res.json({
      success: true,
      ...result
    });

  } catch (err) {
    console.error('[ReSu_] Lab preview error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    try { if (audioFile?.path && fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path); } catch (_) {}
  }
});

// ══════════════════════════════════════════════════
//  API: Audio Metadata (via CoSu ffprobe)
// ══════════════════════════════════════════════════
app.post('/api/metadata', upload.single('audio'), async (req, res) => {
  const audioFile = req.file;
  if (!audioFile) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  try {
    const metadata = await cosuProcessor.getMetadata(audioFile.path);
    res.json({ success: true, metadata });
  } catch (err) {
    console.error('[ReSu_] Metadata error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    try { if (audioFile?.path && fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path); } catch (_) {}
  }
});

// ── Periodic Cleanup: remove files older than 30 minutes ──
setInterval(() => {
  const maxAge = 30 * 60 * 1000;
  [OUTPUT_DIR, UPLOAD_DIR].forEach(dir => {
    try {
      const files = fs.readdirSync(dir);
      const now = Date.now();
      for (const f of files) {
        const fp = path.join(dir, f);
        try {
          const st = fs.statSync(fp);
          if (now - st.mtimeMs > maxAge) {
            fs.unlinkSync(fp);
          }
        } catch (_) {}
      }
    } catch (_) {}
  });
}, 10 * 60 * 1000); // Every 10 minutes

// ── Start Server ──
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║                                                  ║');
  console.log('  ║   🎵  ReSu_ Master Audio Engine  v1.80.0        ║');
  console.log('  ║                                                  ║');
  console.log('  ║   Acoustic Cloaker • C2PA Stripper               ║');
  console.log('  ║   CoSu Processor  • Custom Studio Lab            ║');
  console.log('  ║                                                  ║');
  console.log(`  ║   🌐  http://localhost:${PORT}                     ║`);
  console.log('  ║                                                  ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');
});
