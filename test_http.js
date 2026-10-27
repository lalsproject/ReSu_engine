const fs = require('fs');
const path = require('path');
const http = require('http');

// Create a small test wav file
const testFile = path.join(__dirname, 'http_test.mp3');
const { spawnSync } = require('child_process');
spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', '-c:a', 'libmp3lame', '-b:a', '128k', testFile]);

const fileData = fs.readFileSync(testFile);
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

let body = '';
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="audio"; filename="http_test.mp3"\r\n`;
body += `Content-Type: audio/mpeg\r\n\r\n`;

const bodyHeader = Buffer.from(body, 'utf-8');
const bodyFooter = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
const fullBody = Buffer.concat([bodyHeader, fileData, bodyFooter]);

console.log('Sending POST /api/strip-c2pa to localhost:3000...');
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/strip-c2pa',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': fullBody.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response headers:', res.headers);
    console.log('Response body:', data);
    try { fs.unlinkSync(testFile); } catch (_) { }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
  try { fs.unlinkSync(testFile); } catch (_) { }
});

req.write(fullBody);
req.end();
