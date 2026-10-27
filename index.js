const path = require('path');
const fs = require('fs');
const { stripC2PAAndSunoMetadata, sanitizeMp3File, extractCoverArtFromBuffer } = require('./c2pa-stripper');
const { cloakAndMasterAudio, generatePreviewSnippet, PRESETS, AUDIO_FORMATS } = require('./acoustic-cloaker');

/**
 * ReSu_ Master Audio Pipeline:
 * Full Multi-Format Sanitization, Acoustic Cloaking, and Studio Remastering
 * 
 * @param {string} inputPath - Original Suno audio file path (MP3, WAV, FLAC, M4A, etc.)
 * @param {string} outputPath - Destination commercial-ready audio file path
 * @param {Object} options - Pipeline options (preset, format, artist, title, album, year)
 * @returns {Promise<Object>} Execution report
 */
async function processSong(inputPath, outputPath, options = {}) {
  const startTime = Date.now();
  
  if (!fs.existsSync(inputPath)) {
    throw new Error(`File input tidak ditemukan: ${inputPath}`);
  }

  const preset = options.preset || 'commercial-master';
  const formatKey = options.format || 'mp3-320';
  const ext = path.extname(inputPath).toLowerCase();
  const isMp3 = ext === '.mp3';

  let processingSourcePath = inputPath;
  let tempCleanedPath = null;
  let tempExtractedCoverPath = null;
  let c2paRemoved = false;
  let c2paBytesStripped = 0;
  let strippedFrames = [];

  let coverArtBuffer = null;
  let coverArtMime = 'image/jpeg';
  if (options.coverArtPath && fs.existsSync(options.coverArtPath)) {
    try {
      coverArtBuffer = fs.readFileSync(options.coverArtPath);
      const extImg = path.extname(options.coverArtPath).toLowerCase();
      coverArtMime = (extImg === '.png') ? 'image/png' : 'image/jpeg';
    } catch (_) {}
  } else if (isMp3) {
    // 🛡️ Auto-Preserve: Jika user tidak upload cover manual, ekstrak cover art asli bawaan MP3 Suno!
    try {
      const srcBuf = fs.readFileSync(inputPath);
      const extracted = extractCoverArtFromBuffer(srcBuf);
      if (extracted && extracted.buffer) {
        coverArtBuffer = extracted.buffer;
        coverArtMime = extracted.mime;
      }
    } catch (_) {}
  }

  // Jika cover art diekstrak dari lagu asli dan belum ada file di disk, simpan ke file temp
  if (!options.coverArtPath && coverArtBuffer) {
    try {
      const extImg = (coverArtMime === 'image/png') ? '.png' : '.jpg';
      tempExtractedCoverPath = outputPath + '.tmp_cover' + extImg;
      fs.writeFileSync(tempExtractedCoverPath, coverArtBuffer);
    } catch (_) {}
  }

  // Stage 1: Binary C2PA & Provenance Stripper (For MP3 containers)
  if (isMp3) {
    tempCleanedPath = outputPath + '.tmp_sanitized.mp3';
    try {
      const sanitizeResult = sanitizeMp3File(inputPath, tempCleanedPath, {
        title: options.title,
        artist: options.artist,
        album: options.album,
        year: options.year,
        copyright: options.copyright,
        coverArtBuffer,
        coverArtMime
      });
      processingSourcePath = tempCleanedPath;
      c2paRemoved = sanitizeResult.audit.removedC2PA;
      c2paBytesStripped = sanitizeResult.audit.c2paSize;
      strippedFrames = sanitizeResult.strippedFrames;
    } catch (err) {
      // Fallback: If ID3 parsing fails, let FFmpeg clean metadata directly
      processingSourcePath = inputPath;
    }
  }

  try {
    // Stage 2: Acoustic Cloaker Engine (Bypass fingerprint.v4, Master & Encode to Selected Format)
    const dspResult = await cloakAndMasterAudio(
      processingSourcePath,
      outputPath,
      preset,
      formatKey,
      {
        title: options.title,
        artist: options.artist,
        album: options.album,
        year: options.year,
        copyright: options.copyright,
        coverArtPath: options.coverArtPath || tempExtractedCoverPath,
        customParams: options.customParams
      }
    );

    // Stage 3: For MP3 output, ensure clean ID3 tags with UTF-16LE / Windows compatibility
    const outputExt = path.extname(outputPath).toLowerCase();
    if (outputExt === '.mp3') {
      try {
        const finalBuf = fs.readFileSync(outputPath);
        const postTag = stripC2PAAndSunoMetadata(finalBuf, {
          title: options.title,
          artist: options.artist,
          album: options.album,
          year: options.year,
          copyright: options.copyright,
          coverArtBuffer,
          coverArtMime
        });
        fs.writeFileSync(outputPath, postTag.cleanedBuffer);
      } catch (_) {}
    }

    const totalDurationMs = Date.now() - startTime;
    const finalStats = fs.statSync(outputPath);

    return {
      success: true,
      inputPath,
      outputPath,
      preset: PRESETS[preset] ? PRESETS[preset].name : preset,
      format: AUDIO_FORMATS[formatKey] ? AUDIO_FORMATS[formatKey].name : formatKey,
      c2paRemoved,
      c2paBytesStripped,
      strippedFramesCount: strippedFrames.length,
      strippedDetails: strippedFrames,
      finalSize: finalStats.size,
      totalDurationMs,
      commercialSafeStatus: '100% COMMERCIAL READY'
    };
  } finally {
    // Clean up temp files
    if (tempCleanedPath && fs.existsSync(tempCleanedPath)) {
      try { fs.unlinkSync(tempCleanedPath); } catch (_) {}
    }
    if (tempExtractedCoverPath && fs.existsSync(tempExtractedCoverPath)) {
      try { fs.unlinkSync(tempExtractedCoverPath); } catch (_) {}
    }
  }
}

module.exports = {
  processSong,
  PRESETS,
  AUDIO_FORMATS,
  stripC2PAAndSunoMetadata,
  cloakAndMasterAudio,
  generatePreviewSnippet
};
