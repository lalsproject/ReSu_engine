const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegKitBridge = require('./ffmpeg-kit-bridge');

class CoSuProcessor {
  constructor() {
    const isWin = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    const ffmpegBin = isWin ? 'ffmpeg.exe' : 'ffmpeg';
    const ffprobeBin = isWin ? 'ffprobe.exe' : 'ffprobe';

    this.ffmpegPath = this.resolveBinary(ffmpegBin, isMac ? 'mac' : '');
    this.ffprobePath = this.resolveBinary(ffprobeBin, isMac ? 'mac' : '');
  }

  ensureExecutable(filePath) {
    if (process.platform !== 'win32' && filePath && fs.existsSync(filePath)) {
      try {
        fs.chmodSync(filePath, 0o755);
      } catch (_) {}
    }
    return filePath;
  }

  resolveBinary(binaryName, subFolder = '') {
    const isMac = process.platform === 'darwin';

    if (isMac && binaryName === 'ffmpeg') {
      const isArm = process.arch === 'arm64';
      const archName = isArm ? 'ffmpeg-arm64' : 'ffmpeg-x64';

      if (process.resourcesPath) {
        const packagedArch = path.join(process.resourcesPath, 'bin', subFolder, archName);
        if (fs.existsSync(packagedArch)) return this.ensureExecutable(packagedArch);
      }
      const localArch = path.resolve(__dirname, '..', 'bin', subFolder, archName);
      if (fs.existsSync(localArch)) return this.ensureExecutable(localArch);
    }

    if (process.resourcesPath) {
      if (subFolder) {
        const packagedSubPath = path.join(process.resourcesPath, 'bin', subFolder, binaryName);
        if (fs.existsSync(packagedSubPath)) return this.ensureExecutable(packagedSubPath);
      }
      const packagedPath = path.join(process.resourcesPath, 'bin', binaryName);
      if (fs.existsSync(packagedPath)) return this.ensureExecutable(packagedPath);
    }

    if (subFolder) {
      const localSubBin = path.resolve(__dirname, '..', 'bin', subFolder, binaryName);
      if (fs.existsSync(localSubBin)) return this.ensureExecutable(localSubBin);
    }

    if (process.platform === 'darwin') {
      const macPaths = [
        `/opt/homebrew/bin/${binaryName}`,
        `/usr/local/bin/${binaryName}`,
        `/usr/bin/${binaryName}`
      ];
      for (const p of macPaths) {
        if (fs.existsSync(p)) return p;
      }
    }

    const localBin = path.resolve(__dirname, '..', 'bin', binaryName);
    if (fs.existsSync(localBin)) return this.ensureExecutable(localBin);

    return binaryName;
  }

  /**
   * Mengambil durasi dan metadata audio menggunakan ffprobe
   */
  async getMetadata(filePath) {
    // 🛡️ macOS Apple Silicon guard: Biner bundled ffprobe adalah x86_64.
    // Pada Apple Silicon arm64 tanpa Rosetta, langsung gunakan getMetadataViaFfmpeg native arm64
    if (process.platform === 'darwin' && process.arch === 'arm64') {
      const isSystemProbe = this.ffprobePath.startsWith('/opt/homebrew') || this.ffprobePath.startsWith('/usr/local');
      if (!isSystemProbe) {
        try {
          return await this.getMetadataViaFfmpeg(filePath);
        } catch (_) {}
      }
    }

    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ];

      const probe = spawn(this.ffprobePath, args);
      let stdout = '';
      let stderr = '';

      probe.stdout.on('data', (data) => { stdout += data.toString(); });
      probe.stderr.on('data', (data) => { stderr += data.toString(); });

      probe.on('close', async (code) => {
        if (code !== 0) {
          try {
            const fbData = await this.getMetadataViaFfmpeg(filePath);
            return resolve(fbData);
          } catch (fbErr) {
            return reject(new Error(`ffprobe gagal membaca file: ${stderr} (${fbErr.message})`));
          }
        }
        try {
          const data = JSON.parse(stdout);
          const duration = parseFloat(data.format?.duration || 0);
          const audioStream = (data.streams || []).find(s => s.codec_type === 'audio');

          resolve({
            duration,
            sampleRate: audioStream ? parseInt(audioStream.sample_rate) : 44100,
            channels: audioStream ? audioStream.channels : 2,
            bitrate: data.format?.bit_rate ? Math.round(parseInt(data.format.bit_rate) / 1000) : 320,
            title: data.format?.tags?.title || path.basename(filePath, path.extname(filePath)),
            artist: data.format?.tags?.artist || 'Unknown Artist',
            format: path.extname(filePath).replace('.', '').toUpperCase(),
            sizeBytes: parseInt(data.format?.size || 0)
          });
        } catch (err) {
          try {
            const fbData = await this.getMetadataViaFfmpeg(filePath);
            resolve(fbData);
          } catch (fbErr) {
            reject(new Error(`Gagal mem-parsing metadata audio: ${err.message}`));
          }
        }
      });

      probe.on('error', async (_err) => {
        try {
          const fbData = await this.getMetadataViaFfmpeg(filePath);
          resolve(fbData);
        } catch (fbErr) {
          reject(fbErr);
        }
      });
    });
  }

  /**
   * Fallback native parser metadata menggunakan ffmpeg -i langsung
   * (Menghilangkan dependensi biner ffprobe terpisah pada Apple Silicon arm64)
   */
  async getMetadataViaFfmpeg(filePath) {
    return new Promise((resolve, reject) => {
      const args = ['-i', filePath];
      const proc = spawn(this.ffmpegPath, args);
      let stderr = '';
      proc.stderr.on('data', d => { stderr += d.toString(); });
      proc.on('close', () => {
        const durMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
        const brMatch = stderr.match(/bitrate:\s*(\d+)\s*kb\/s/i);
        const srMatch = stderr.match(/(\d+)\s*Hz/i);
        if (durMatch) {
          const hours = parseFloat(durMatch[1]);
          const mins = parseFloat(durMatch[2]);
          const secs = parseFloat(durMatch[3]);
          const duration = hours * 3600 + mins * 60 + secs;
          const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : { size: 0 };
          return resolve({
            duration,
            sampleRate: srMatch ? parseInt(srMatch[1]) : 44100,
            channels: 2,
            bitrate: brMatch ? parseInt(brMatch[1]) : 320,
            title: path.basename(filePath, path.extname(filePath)),
            artist: 'Unknown Artist',
            format: path.extname(filePath).replace('.', '').toUpperCase(),
            sizeBytes: stats.size
          });
        }
        reject(new Error('Gagal mendeteksi durasi audio via FFmpeg fallback'));
      });
      proc.on('error', err => reject(err));
    });
  }

  /**
   * Merender Side-Harmonic Stealth Cloak (Formula RISET 3: L-R Phase + Highpass 250Hz + Transpose -2 Semitones)
   * 100% Anti-Audible Magic Version ID untuk Cover Lagu Suno (Mendukung 60 Detik & Full Lagu)
   */
  async exportStealthSeed(inputPath, options = {}, onProgress = null) {
    const isFull = options.mode === 'full';
    const startTime = Math.max(0, parseFloat(options.startTime || 0));
    // Default durasi baru: 60.00s (Sesuai batas maksimal akun Free Suno)
    const duration = parseFloat(options.duration || 60.00);
    const outputPath = options.outputPath || this.generateDefaultOutputPath(inputPath, { isFull, duration });

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const preset = options.preset || 'original';

    // ─────────────────────────────────────────────────────────────────
    // PLATFORM GUARD: Android ffmpeg-kit-android Execution Bridge
    // ─────────────────────────────────────────────────────────────────
    if (process.platform === 'android' || ffmpegKitBridge.isFFmpegKitAvailable()) {
      const command = ffmpegKitBridge.buildCommandString(inputPath, outputPath, {
        mode: options.mode,
        startTime,
        duration,
        preset
      });
      await ffmpegKitBridge.executeOnAndroidFFmpegKit(command, onProgress);
      const stats = fs.existsSync(outputPath) ? fs.statSync(outputPath) : { size: 0 };
      return {
        success: true,
        outputPath,
        filename: path.basename(outputPath),
        duration: isFull ? 'FULL' : duration,
        startTime: isFull ? 0 : startTime,
        isFull,
        preset,
        presetName: preset === 'slow_tempo' ? 'Slow Tempo Shield' : (preset === 'staccato' ? 'Staccato Guide' : 'Original SideHarmoni'),
        sizeBytes: stats.size
      };
    }

    const dspFilter = this.getDspFilter(preset);

    const args = ['-y'];
    if (!isFull) {
      args.push('-ss', startTime.toFixed(3), '-t', duration.toFixed(3));
    }
    args.push(
      '-i', inputPath,
      '-vn',
      '-af', dspFilter,
      '-map_metadata', '-1',
      '-c:a', 'libmp3lame',
      '-b:a', '320k',
      outputPath
    );

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegPath, args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
        if (onProgress) {
          const modeLabel = preset === 'slow_tempo' ? '🌙 Slow Tempo Shield' : (preset === 'staccato' ? '⚡ Staccato Guide' : '🛡️ Original Side-Harmoni');
          onProgress({ 
            stage: 'processing', 
            message: isFull ? `Menerapkan formula ${modeLabel} ke Full Lagu...` : `Menerapkan formula ${modeLabel} ${duration}s...` 
          });
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          // Pastikan file hasil render valid dan bukan korup 0-byte
          if (stats.size > 1000) {
            return resolve({
              success: true,
              outputPath,
              filename: path.basename(outputPath),
              duration: isFull ? 'FULL' : duration,
              startTime: isFull ? 0 : startTime,
              isFull,
              preset,
              presetName: preset === 'slow_tempo' ? 'Slow Tempo Shield' : (preset === 'staccato' ? 'Staccato Guide' : 'Original SideHarmoni'),
              sizeBytes: stats.size
            });
          }
        }

        // 🛡️ SAFE CLEANUP ROLLBACK: Hapus file 0 KB / korup jika FFmpeg gagal
        try {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (_) {}

        reject(new Error(`FFmpeg export gagal (code ${code}): ${stderr.slice(-400)}`));
      });

      ffmpeg.on('error', (err) => {
        try {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (_) {}
        reject(err);
      });
    });
  }

  /**
   * Mengambil string filter DSP FFmpeg berdasarkan preset
   * Menggunakan formula native core FFmpeg (aresample pre-normalization + asetrate + aformat + atempo)
   * Menjamin presisi matematis 100% pada file 44.1k, 48k (Suno v3.5/v4), dan 96k tanpa drift tempo / pitch.
   */
  getDspFilter(preset = 'original') {
    const pitchShiftCore = 'aformat=channel_layouts=stereo,aresample=44100,asetrate=44100*0.8908987,aresample=44100,atempo=1.122462';

    if (preset === 'slow_tempo' || preset === 'slow_ballad') {
      // 🌙 Slow Tempo / Ballad Shield (Formula Teruji 100% Lolos + Intonasi Pas & Manis)
      // Chopper 5.5Hz (d=0.88) + Notch 1800Hz (-11dB) + Transpose -2 Semitones + Tempo Shift +5% (atempo=1.178585)
      // In-Phase Stereo (c0=c0-c1|c1=c0-c1) anti-mono phase cancellation Suno AI
      return 'pan=stereo|c0=c0-c1|c1=c0-c1,highpass=f=160,bass=g=3.0:f=180,equalizer=f=1800:t=q:w=1.2:g=-11,tremolo=f=5.5:d=0.88,aformat=channel_layouts=stereo,aresample=44100,asetrate=44100*0.8908987,aresample=44100,atempo=1.178585,volume=2.2';
    }

    if (preset === 'staccato') {
      // ⚡ Staccato Guide Mode (On-Off Pulse ~22% with 50ms smooth ramp)
      // Pulse ON (1.4s): cancel factor 0.78 (leaving ~22% faint ghost vocal for Suno pitch/melody tracker)
      // Pulse OFF (1.6s): cancel factor 1.0 (100% hard kill to break Audible Magic continuous fingerprint)
      // Highpass 250Hz + Pitch Shift -2 Semitones (0.8908987) + Volume 1.6x
      return `aeval=exprs='val(0)-if(lt(mod(t\\,3.0)\\,1.35)\\,0.78\\,if(lt(mod(t\\,3.0)\\,1.40)\\,0.78+0.22*(mod(t\\,3.0)-1.35)/0.05\\,if(gt(mod(t\\,3.0)\\,2.95)\\,1.0-0.22*(mod(t\\,3.0)-2.95)/0.05\\,1.0)))*val(1)|val(1)-if(lt(mod(t\\,3.0)\\,1.35)\\,0.78\\,if(lt(mod(t\\,3.0)\\,1.40)\\,0.78+0.22*(mod(t\\,3.0)-1.35)/0.05\\,if(gt(mod(t\\,3.0)\\,2.95)\\,1.0-0.22*(mod(t\\,3.0)-2.95)/0.05\\,1.0)))*val(0)':c=stereo,highpass=f=250,${pitchShiftCore},volume=1.6`;
    }
    // 🛡️ Original Pure SideHarmoni (Default)
    return `pan=stereo|c0=c0-c1|c1=c1-c0,highpass=f=250,${pitchShiftCore},volume=1.6`;
  }

  /**
   * Merender cuplikan audio untuk preview live filter DSP (Original atau Staccato Guide)
   * Bebas memory leak & sandboxing: Mengembalikan data URI Base64 dan membersihkan file temp dari disk.
   */
  async renderPreviewFilter(inputPath, startTime, duration = 15.00, preset = 'original') {
    const tempDir = path.join(require('os').tmpdir(), 'resu_cosu_previews');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 🧹 Auto-Purge: Hapus file preview lama yang berumur > 3 menit agar disk tidak penuh
    try {
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      for (const f of files) {
        if (f.startsWith('preview_') && f.endsWith('.mp3')) {
          const fp = path.join(tempDir, f);
          const st = fs.statSync(fp);
          if (now - st.mtimeMs > 3 * 60 * 1000) {
            try { fs.unlinkSync(fp); } catch (_) {}
          }
        }
      }
    } catch (_) {}

    const tempOutput = path.join(tempDir, `preview_${Date.now()}.mp3`);

    // ─────────────────────────────────────────────────────────────────
    // PLATFORM GUARD: Android ffmpeg-kit-android Preview Bridge
    // ─────────────────────────────────────────────────────────────────
    if (process.platform === 'android' || ffmpegKitBridge.isFFmpegKitAvailable()) {
      const command = ffmpegKitBridge.buildCommandString(inputPath, tempOutput, {
        mode: 'slice',
        startTime,
        duration,
        preset,
        bitrate: '256k'
      });
      await ffmpegKitBridge.executeOnAndroidFFmpegKit(command);
      return tempOutput;
    }

    const dspFilter = this.getDspFilter(preset);

    const args = [
      '-y',
      '-ss', Math.max(0, startTime).toFixed(3),
      '-t', duration.toFixed(3),
      '-i', inputPath,
      '-vn',
      '-af', dspFilter,
      '-map_metadata', '-1',
      '-c:a', 'libmp3lame',
      '-b:a', '256k',
      tempOutput
    ];

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegPath, args);
      let stderr = '';
      ffmpeg.stderr.on('data', d => { stderr += d.toString(); });

      ffmpeg.on('close', (code) => {
        if (code === 0 && fs.existsSync(tempOutput)) {
          try {
            // Konversi ke base64 data URI agar 100% kompatibel dengan Chromium di macOS tanpa batasan file://
            const buf = fs.readFileSync(tempOutput);
            const base64Audio = `data:audio/mp3;base64,${buf.toString('base64')}`;
            try { fs.unlinkSync(tempOutput); } catch (_) {}
            resolve(base64Audio);
          } catch (_) {
            resolve(tempOutput);
          }
        } else {
          try { if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput); } catch (_) {}
          reject(new Error(`Gagal merender audio preview siluman (code ${code}): ${stderr.slice(-300)}`));
        }
      });
      ffmpeg.on('error', (err) => {
        try { if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput); } catch (_) {}
        reject(err);
      });
    });
  }

  generateDefaultOutputPath(inputPath, options = {}) {
    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const base = path.basename(inputPath, ext);
    const presetSuffix = options.preset === 'slow_tempo' ? '_SlowTempo' : (options.preset === 'staccato' ? '_Staccato' : '_SideHarmoni');
    if (options.isFull) {
      return path.join(dir, `${base}${presetSuffix}_Full.mp3`);
    }
    const durLabel = options.duration ? `${Math.round(options.duration)}s` : '60s';
    return path.join(dir, `${base}${presetSuffix}_${durLabel}.mp3`);
  }
}

module.exports = new CoSuProcessor();
