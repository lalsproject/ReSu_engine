/**
 * ReSu_ Universal Audio Engine Bridge (Desktop FFmpeg vs Android ffmpeg-kit)
 * Section 10: Strict Multi-Platform Audio Architecture
 * 
 * On Desktop (Win/Mac/Linux): Uses native child_process.spawn('ffmpeg').
 * On Android: Dispatches to ffmpeg-kit-android (or Capacitor FFmpegKit plugin).
 * Formula 100% Identical:
 *  - Phase inversion vokal tengah & bass (c0=c0-c1|c1=c1-c0)
 *  - Highpass filter 250Hz
 *  - Pitch-shift -2 semitones (0.8908987) with normal tempo 1.0x
 *  - Pulse staccato guide (~22% on 1.4s, 100% kill 1.6s)
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js CommonJS
    module.exports = factory();
  } else {
    // Browser / WebView
    root.FFmpegKitBridge = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  // Constant Acoustic Math
  const PITCH_SHIFT_MINUS_2_SEMITONES = 0.8908987; // 2^(-2/12)
  const TEMPO_CORRECTION_NORMAL = 1.122462;       // 1 / 0.8908987 (restores 1.0x tempo)
  const HIGHPASS_FREQ = 250;                       // 250 Hz cutoff
  const VOLUME_BOOST = 1.6;                        // 1.6x volume compensation

  /**
   * Detect current running platform
   * @returns {'android' | 'win32' | 'darwin' | 'linux' | 'web'}
   */
  function detectPlatform() {
    if (typeof process !== 'undefined' && process.platform) {
      if (process.platform === 'android') return 'android';
      return process.platform;
    }
    if (typeof window !== 'undefined') {
      if (window.resuApi && window.resuApi.platform) {
        return window.resuApi.platform;
      }
      if (/android/i.test(navigator.userAgent || '')) {
        return 'android';
      }
    }
    return 'web';
  }

  /**
   * Check if native ffmpeg-kit-android is available in this environment
   * @returns {boolean}
   */
  function isFFmpegKitAvailable() {
    if (typeof window === 'undefined') return false;
    return !!(
      window.FFmpegKit ||
      (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FFmpegKit) ||
      window.AndroidFFmpeg
    );
  }

  /**
   * Get the active FFmpegKit native instance
   */
  function getFFmpegKitInstance() {
    if (typeof window === 'undefined') return null;
    if (window.FFmpegKit) return window.FFmpegKit;
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FFmpegKit) {
      return window.Capacitor.Plugins.FFmpegKit;
    }
    if (window.AndroidFFmpeg) return window.AndroidFFmpeg;
    return null;
  }

  /**
   * Generates the 100% identical FFmpeg DSP Audio Filter string
   * @param {'original' | 'staccato'} preset
   * @param {boolean} useRubberband Whether librubberband is supported in binary
   * @returns {string} FFmpeg -af filter string
   */
  function getDspFilter(preset = 'original', useRubberband = true) {
    const pitchFilter = useRubberband
      ? `rubberband=pitch=${PITCH_SHIFT_MINUS_2_SEMITONES}:tempo=1.0`
      : `aformat=channel_layouts=stereo,aresample=44100,asetrate=44100*${PITCH_SHIFT_MINUS_2_SEMITONES},aresample=44100,atempo=${TEMPO_CORRECTION_NORMAL}`;

    if (preset === 'slow_tempo' || preset === 'slow_ballad') {
      // 🌙 Slow Tempo / Ballad Shield (In-Phase Stereo, Chopper 5.5Hz d=0.88, Notch 1800Hz, Transpose -2 Semitones, Tempo +5%)
      const pitchFilter = useRubberband
        ? `rubberband=pitch=${PITCH_SHIFT_MINUS_2_SEMITONES}:tempo=1.05`
        : `aformat=channel_layouts=stereo,aresample=44100,asetrate=44100*${PITCH_SHIFT_MINUS_2_SEMITONES},aresample=44100,atempo=1.178585`;
      return `pan=stereo|c0=c0-c1|c1=c0-c1,highpass=f=160,bass=g=3.0:f=180,equalizer=f=1800:t=q:w=1.2:g=-11,tremolo=f=5.5:d=0.88,${pitchFilter},volume=2.2`;
    }

    if (preset === 'staccato') {
      // ⚡ Staccato Guide Mode (On-Off Pulse ~22% with 50ms smooth ramp)
      // Pulse ON (1.4s): cancel factor 0.78 (leaving ~22% faint ghost vocal for Suno pitch/melody tracker)
      // Pulse OFF (1.6s): cancel factor 1.0 (100% hard kill to break Audible Magic continuous fingerprint)
      // Highpass 250Hz + Pitch Shift -2 Semitones + Volume 1.6x
      return `aeval=exprs='val(0)-if(lt(mod(t\\,3.0)\\,1.35)\\,0.78\\,if(lt(mod(t\\,3.0)\\,1.40)\\,0.78+0.22*(mod(t\\,3.0)-1.35)/0.05\\,if(gt(mod(t\\,3.0)\\,2.95)\\,1.0-0.22*(mod(t\\,3.0)-2.95)/0.05\\,1.0)))*val(1)|val(1)-if(lt(mod(t\\,3.0)\\,1.35)\\,0.78\\,if(lt(mod(t\\,3.0)\\,1.40)\\,0.78+0.22*(mod(t\\,3.0)-1.35)/0.05\\,if(gt(mod(t\\,3.0)\\,2.95)\\,1.0-0.22*(mod(t\\,3.0)-2.95)/0.05\\,1.0)))*val(0)':c=stereo,highpass=f=${HIGHPASS_FREQ},${pitchFilter},volume=${VOLUME_BOOST}`;
    }

    // 🛡️ Original Pure Side-Harmoni (Default v1.80.0)
    // 100% center vocal & bass cancellation via L-R phase inversion + Highpass 250Hz + Pitch -2 Semitones + Volume 1.6x
    return `pan=stereo|c0=c0-c1|c1=c1-c0,highpass=f=${HIGHPASS_FREQ},${pitchFilter},volume=${VOLUME_BOOST}`;
  }

  /**
   * Build array of FFmpeg arguments
   */
  function buildArgs(inputPath, outputPath, options = {}) {
    const isFull = options.mode === 'full';
    const startTime = Math.max(0, parseFloat(options.startTime || 0));
    const duration = parseFloat(options.duration || 60.00);
    const preset = options.preset || 'original';
    const useRubberband = options.useRubberband !== false;
    const bitrate = options.bitrate || '320k';

    const args = ['-y'];
    if (!isFull) {
      args.push('-ss', startTime.toFixed(3), '-t', duration.toFixed(3));
    }
    args.push(
      '-i', inputPath,
      '-vn',
      '-af', getDspFilter(preset, useRubberband),
      '-map_metadata', '-1',
      '-c:a', 'libmp3lame',
      '-b:a', bitrate,
      outputPath
    );
    return args;
  }

  /**
   * Build complete command line string (for ffmpeg-kit-android execute)
   */
  function buildCommandString(inputPath, outputPath, options = {}) {
    const args = buildArgs(inputPath, outputPath, options);
    return args.map(arg => {
      if (arg.includes(' ') || arg.includes('|') || arg.includes('=') || arg.includes(',')) {
        return `"${arg.replace(/"/g, '\\"')}"`;
      }
      return arg;
    }).join(' ');
  }

  /**
   * Execute via ffmpeg-kit-android
   * @param {string} commandString 
   * @param {Function} onProgress 
   * @returns {Promise<{success: boolean, returnCode: number, logs: string}>}
   */
  async function executeOnAndroidFFmpegKit(commandString, onProgress = null) {
    const kit = getFFmpegKitInstance();
    if (!kit) {
      throw new Error('ffmpeg-kit-android library is not mounted in this Android environment');
    }

    console.log('[ReSu_ Android Audio Engine] Executing ffmpeg-kit command:', commandString);

    return new Promise((resolve, reject) => {
      let accumulatedLogs = '';

      // Check if executeAsync exists (Standard ffmpeg-kit-android)
      if (typeof kit.executeAsync === 'function') {
        kit.executeAsync(
          commandString,
          async (session) => {
            let code = 0;
            if (typeof session.getReturnCode === 'function') {
              const rc = await session.getReturnCode();
              code = typeof rc.isValueSuccess === 'function' ? (rc.isValueSuccess() ? 0 : 1) : (rc.getValue ? rc.getValue() : 0);
            }
            if (code === 0) {
              resolve({ success: true, returnCode: 0, logs: accumulatedLogs });
            } else {
              reject(new Error(`ffmpeg-kit-android execution failed with return code ${code}: ${accumulatedLogs}`));
            }
          },
          (log) => {
            const message = log.getMessage ? log.getMessage() : String(log);
            accumulatedLogs += message + '\n';
            if (onProgress && typeof onProgress === 'function') {
              onProgress({ stage: 'processing', message });
            }
          },
          (stats) => {
            if (onProgress && typeof onProgress === 'function' && stats) {
              const time = stats.getTime ? stats.getTime() : 0;
              onProgress({ stage: 'statistics', timeMs: time });
            }
          }
        );
      } else if (typeof kit.execute === 'function') {
        // Synchronous / Promise-based execute
        Promise.resolve(kit.execute(commandString))
          .then(async (session) => {
            const rc = session?.getReturnCode ? await session.getReturnCode() : { isValueSuccess: () => true };
            const isSuccess = rc.isValueSuccess ? rc.isValueSuccess() : true;
            if (isSuccess) {
              resolve({ success: true, returnCode: 0, logs: '' });
            } else {
              reject(new Error('ffmpeg-kit execution failed.'));
            }
          })
          .catch(reject);
      } else {
        reject(new Error('Unsupported ffmpeg-kit interface.'));
      }
    });
  }

  return {
    detectPlatform,
    isFFmpegKitAvailable,
    getDspFilter,
    buildArgs,
    buildCommandString,
    executeOnAndroidFFmpegKit,
    PITCH_SHIFT_MINUS_2_SEMITONES,
    TEMPO_CORRECTION_NORMAL,
    HIGHPASS_FREQ,
    VOLUME_BOOST
  };
});
