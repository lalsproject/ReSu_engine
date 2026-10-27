const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

console.log('=== TEST 1: Check FFmpeg ===');
const ff = spawnSync('ffmpeg', ['-version']);
console.log('FFmpeg exit code:', ff.status);
if (ff.status !== 0) {
  console.error('FFmpeg failed:', ff.stderr ? ff.stderr.toString() : ff.error);
}

// Generate 2 second test tone
const testWav = path.join(__dirname, 'test_input.wav');
const testMp3 = path.join(__dirname, 'test_input.mp3');
console.log('\n=== Creating test audio files ===');
spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-c:a', 'pcm_s16le', testWav]);
spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-c:a', 'libmp3lame', '-b:a', '320k', testMp3]);

console.log('testWav exists:', fs.existsSync(testWav), fs.existsSync(testWav) ? fs.statSync(testWav).size : 0);
console.log('testMp3 exists:', fs.existsSync(testMp3), fs.existsSync(testMp3) ? fs.statSync(testMp3).size : 0);

console.log('\n=== TEST 2: c2pa-stripper.js ===');
try {
  const { sanitizeMp3File } = require('./c2pa-stripper');
  const cleanOut = path.join(__dirname, 'test_clean.mp3');
  const res = sanitizeMp3File(testMp3, cleanOut, { title: 'Test Title', artist: 'Test Artist' });
  console.log('c2pa-stripper SUCCESS:', res.audit);
} catch (e) {
  console.error('c2pa-stripper ERROR:', e.message, e.stack);
}

console.log('\n=== TEST 3: cosu-processor.js ===');
(async () => {
  try {
    const cosuProcessor = require('./cosu-processor');
    const cosuOut = path.join(__dirname, 'test_cosu.mp3');
    const res = await cosuProcessor.exportStealthSeed(testMp3, {
      mode: 'slice',
      preset: 'original',
      startTime: 0,
      duration: 2,
      outputPath: cosuOut
    });
    console.log('cosu-processor SUCCESS:', res);
  } catch (e) {
    console.error('cosu-processor ERROR:', e.message, e.stack);
  }

  console.log('\n=== TEST 4: index.js processSong ===');
  try {
    const { processSong } = require('./index');
    const masterOut = path.join(__dirname, 'test_master.mp3');
    const res = await processSong(testMp3, masterOut, {
      preset: 'ai-shield-submithub-loudclean',
      format: 'mp3-320',
      title: 'Master Song',
      artist: 'Master Artist'
    });
    console.log('processSong SUCCESS:', res);
  } catch (e) {
    console.error('processSong ERROR:', e.message, e.stack);
  }

  // Cleanup
  [testWav, testMp3, path.join(__dirname, 'test_clean.mp3'), path.join(__dirname, 'test_cosu.mp3'), path.join(__dirname, 'test_master.mp3')].forEach(p => {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {}
  });
})();
