const fs = require('fs');
const path = require('path');

/**
 * Parses syncsafe integer (4 bytes, 7 bits per byte)
 */
function parseSyncSafeInt(buf, offset) {
  return (
    ((buf[offset] & 0x7f) << 21) |
    ((buf[offset + 1] & 0x7f) << 14) |
    ((buf[offset + 2] & 0x7f) << 7) |
    (buf[offset + 3] & 0x7f)
  );
}

/**
 * Encodes integer to 4-byte syncsafe integer
 */
function encodeSyncSafeInt(num) {
  const buf = Buffer.alloc(4);
  buf[0] = (num >> 21) & 0x7f;
  buf[1] = (num >> 14) & 0x7f;
  buf[2] = (num >> 7) & 0x7f;
  buf[3] = num & 0x7f;
  return buf;
}

/**
 * Strips C2PA manifest (GEOB), Suno URLs (WOAS), comments (COMM),
 * custom descriptors (TXXX), and Lavf headers from an MP3 file buffer.
 * 
 * @param {Buffer} inputBuffer - Raw MP3 buffer
 * @param {Object} options - Custom metadata to inject or override
 * @returns {{ cleanedBuffer: Buffer, strippedFrames: string[], audit: Object }}
 */
function stripC2PAAndSunoMetadata(inputBuffer, options = {}) {
  const audit = {
    originalSize: inputBuffer.length,
    hadID3v2: false,
    id3Version: null,
    removedC2PA: false,
    c2paSize: 0,
    removedFrames: [],
    preservedFrames: []
  };

  if (inputBuffer.length < 10 || inputBuffer.toString('ascii', 0, 3) !== 'ID3') {
    // Fallback: If raw MP3 stream without ID3v2 header, but user wants metadata / cover art injected
    const newFrames = [];
    if (options.title) newFrames.push(createTextFrame('TIT2', options.title, 3));
    if (options.artist) newFrames.push(createTextFrame('TPE1', options.artist, 3));
    if (options.album) newFrames.push(createTextFrame('TALB', options.album, 3));
    if (options.year) newFrames.push(createTextFrame('TYER', String(options.year), 3));
    if (options.copyright) newFrames.push(createTextFrame('TCOP', options.copyright, 3));
    if (options.coverArtBuffer && Buffer.isBuffer(options.coverArtBuffer)) {
      newFrames.push(createApicFrame(options.coverArtBuffer, options.coverArtMime || 'image/jpeg', 3));
    }

    if (newFrames.length > 0) {
      const framesTotalLength = newFrames.reduce((acc, f) => acc + f.length, 0);
      const newTagHeader = Buffer.alloc(10);
      newTagHeader.write('ID3', 0, 3, 'ascii');
      newTagHeader[3] = 3; // ID3v2.3
      newTagHeader[4] = 0;
      newTagHeader[5] = 0x00;
      encodeSyncSafeInt(framesTotalLength).copy(newTagHeader, 6);

      const id3v1Tag = createId3v1Tag({
        title: options.title,
        artist: options.artist,
        album: options.album,
        year: options.year
      });

      const cleaned = Buffer.concat([newTagHeader, ...newFrames, inputBuffer, id3v1Tag]);
      return { cleanedBuffer: cleaned, strippedFrames: [], audit };
    }

    return { cleanedBuffer: inputBuffer, strippedFrames: [], audit };
  }

  audit.hadID3v2 = true;
  const majorVersion = inputBuffer[3];
  const revision = inputBuffer[4];
  audit.id3Version = `ID3v2.${majorVersion}.${revision}`;

  const flags = inputBuffer[5];
  const tagSize = parseSyncSafeInt(inputBuffer, 6);
  const totalTagSize = tagSize + 10;

  let offset = 10;
  // Handle extended header if present
  if (flags & 0x40) {
    const extSize = majorVersion === 4 ? parseSyncSafeInt(inputBuffer, offset) : inputBuffer.readUInt32BE(offset);
    offset += extSize;
  }

  const keptFramesBuffers = [];

  while (offset < totalTagSize && offset < inputBuffer.length - 10) {
    if (inputBuffer[offset] === 0x00) {
      // Padding reached
      break;
    }

    const frameId = inputBuffer.toString('ascii', offset, offset + 4);
    if (!/^[A-Z0-9]{4}$/.test(frameId)) {
      break;
    }

    let frameSize;
    if (majorVersion === 4) {
      frameSize = parseSyncSafeInt(inputBuffer, offset + 4);
    } else {
      frameSize = inputBuffer.readUInt32BE(offset + 4);
    }

    const frameHeaderSize = 10;
    const fullFrameEnd = Math.min(offset + frameHeaderSize + frameSize, inputBuffer.length);
    const frameData = inputBuffer.slice(offset + frameHeaderSize, fullFrameEnd);
    const frameRawChunk = inputBuffer.slice(offset, fullFrameEnd);

    // Filter dangerous / Suno tracking frames:
    let isDangerous = false;
    let reason = '';

    // 1. GEOB containing C2PA / credentials
    if (frameId === 'GEOB') {
      const frameStr = frameData.toString('latin1');
      if (frameStr.includes('c2pa') || frameStr.includes('application/c2pa')) {
        isDangerous = true;
        reason = 'C2PA Manifest Store (GEOB)';
        audit.removedC2PA = true;
        audit.c2paSize = frameSize;
      }
    }

    // 2. WOAS: Official audio webpage pointing to suno.com
    if (frameId === 'WOAS') {
      const url = frameData.toString('latin1');
      if (url.includes('suno.com')) {
        isDangerous = true;
        reason = `Suno Source URL: ${url}`;
      }
    }

    // 3. TXXX: User defined text "made with suno"
    if (frameId === 'TXXX') {
      const content = frameData.toString('latin1');
      if (content.toLowerCase().includes('suno')) {
        isDangerous = true;
        reason = 'Suno ID3 TXXX Tag';
      }
    }

    // 4. COMM: Comments containing "made with suno"
    if (frameId === 'COMM') {
      const content = frameData.toString('latin1');
      if (content.toLowerCase().includes('suno')) {
        isDangerous = true;
        reason = 'Suno ID3 COMM Tag';
      }
    }

    // 5. TSSE: Lavf / FFmpeg encoder fingerprint
    if (frameId === 'TSSE') {
      isDangerous = true;
      reason = 'Encoder Signature (TSSE)';
    }

    // 6. PRIV: Private DRM/identification frames
    if (frameId === 'PRIV') {
      isDangerous = true;
      reason = 'Private DRM Frame (PRIV)';
    }

    // If user is overriding specific frames (Title, Artist, Album, Year, Copyright, Cover Art),
    // do NOT preserve the old ones to avoid duplicates
    const isOverridden = 
      (options.title && frameId === 'TIT2') ||
      (options.artist && frameId === 'TPE1') ||
      (options.album && frameId === 'TALB') ||
      (options.year && (frameId === 'TYER' || frameId === 'TDRC')) ||
      (options.copyright && frameId === 'TCOP') ||
      (options.coverArtBuffer && frameId === 'APIC');

    if (isDangerous || isOverridden) {
      audit.removedFrames.push({ frameId, size: frameSize, reason: isDangerous ? reason : 'Overridden by User Metadata' });
    } else {
      audit.preservedFrames.push({ frameId, size: frameSize });
      keptFramesBuffers.push(frameRawChunk);
    }

    offset += frameHeaderSize + frameSize;
  }

  // Raw audio stream starts after totalTagSize
  const rawAudioStream = inputBuffer.slice(totalTagSize);

  // If user wants custom ID3 frames injected, we can format them
  const newFrames = [...keptFramesBuffers];

  if (options.title) {
    newFrames.push(createTextFrame('TIT2', options.title, majorVersion));
  }
  if (options.artist) {
    newFrames.push(createTextFrame('TPE1', options.artist, majorVersion));
  }
  if (options.album) {
    newFrames.push(createTextFrame('TALB', options.album, majorVersion));
  }
  if (options.year) {
    newFrames.push(createTextFrame(majorVersion === 4 ? 'TDRC' : 'TYER', String(options.year), majorVersion));
  }
  if (options.copyright) {
    newFrames.push(createTextFrame('TCOP', options.copyright, majorVersion));
  }
  if (options.coverArtBuffer && Buffer.isBuffer(options.coverArtBuffer)) {
    newFrames.push(createApicFrame(options.coverArtBuffer, options.coverArtMime || 'image/jpeg', majorVersion));
  }

  // Assemble new ID3v2 tag
  const framesTotalLength = newFrames.reduce((acc, f) => acc + f.length, 0);
  const newTagHeader = Buffer.alloc(10);
  newTagHeader.write('ID3', 0, 3, 'ascii');
  newTagHeader[3] = majorVersion; // preserve version (v2.3 or v2.4)
  newTagHeader[4] = revision;
  newTagHeader[5] = 0x00; // clear flags (no extended header)
  
  const syncSafeSizeBuf = encodeSyncSafeInt(framesTotalLength);
  syncSafeSizeBuf.copy(newTagHeader, 6);

  let finalAudioStream = rawAudioStream;
  
  // If the stream already ended with an old ID3v1 tag (128 bytes starting with "TAG"), strip it first
  if (finalAudioStream.length >= 128 && finalAudioStream.slice(finalAudioStream.length - 128, finalAudioStream.length - 125).toString('ascii') === 'TAG') {
    finalAudioStream = finalAudioStream.slice(0, finalAudioStream.length - 128);
  }

  // Create clean ID3v1 tag (128 bytes) for maximum Windows Media Player compatibility
  const id3v1Tag = createId3v1Tag({
    title: options.title,
    artist: options.artist,
    album: options.album,
    year: options.year
  });

  const cleanedBuffer = Buffer.concat([newTagHeader, ...newFrames, finalAudioStream, id3v1Tag]);
  audit.cleanedSize = cleanedBuffer.length;
  audit.bytesSaved = audit.originalSize - audit.cleanedSize;

  return { cleanedBuffer, strippedFrames: audit.removedFrames, audit };
}

/**
 * Creates 128-byte ID3v1.1 tag
 */
function createId3v1Tag(meta = {}) {
  const buf = Buffer.alloc(128, 0x00);
  buf.write('TAG', 0, 3, 'ascii'); // Tag identifier (3 bytes)
  if (meta.title) buf.write(String(meta.title).slice(0, 30), 3, 30, 'latin1'); // Title (30 bytes)
  if (meta.artist) buf.write(String(meta.artist).slice(0, 30), 33, 30, 'latin1'); // Artist (30 bytes)
  if (meta.album) buf.write(String(meta.album).slice(0, 30), 63, 30, 'latin1'); // Album (30 bytes)
  if (meta.year) buf.write(String(meta.year).slice(0, 4), 93, 4, 'latin1'); // Year (4 bytes)
  buf.write('Commercial Release', 97, 28, 'latin1'); // Comment (28 bytes)
  buf[125] = 0x00; // Zero-byte flag for ID3v1.1
  buf[126] = 0x01; // Track #1
  buf[127] = 0xFF; // Genre 255 (None)
  return buf;
}

/**
 * Creates standard ID3 text frame (UTF-16LE with BOM for maximum Windows Explorer compatibility)
 */
function createTextFrame(frameId, text, version = 3) {
  // Windows Explorer natively reads ID3v2.3 with UTF-16LE (0x01 encoding byte with BOM 0xFF 0xFE)
  // or ISO-8859-1 (0x00). UTF-8 (0x03) is often ignored by Windows Shell in ID3v2.3.
  const str = String(text || '');
  const isAscii = /^[\x20-\x7E]*$/.test(str);

  let frameData;
  if (isAscii) {
    // Encoding 0x00 = ISO-8859-1 (Latin-1)
    frameData = Buffer.concat([Buffer.from([0x00]), Buffer.from(str, 'latin1')]);
  } else {
    // Encoding 0x01 = UTF-16 with BOM (0xFF, 0xFE for LE)
    const bom = Buffer.from([0xFF, 0xFE]);
    const utf16Buf = Buffer.from(str, 'utf16le');
    frameData = Buffer.concat([Buffer.from([0x01]), bom, utf16Buf]);
  }

  const frameHeader = Buffer.alloc(10);
  frameHeader.write(frameId, 0, 4, 'ascii');
  
  if (version === 4) {
    encodeSyncSafeInt(frameData.length).copy(frameHeader, 4);
  } else {
    frameHeader.writeUInt32BE(frameData.length, 4);
  }
  frameHeader.writeUInt16BE(0, 8); // flags = 0
  return Buffer.concat([frameHeader, frameData]);
}

/**
 * Creates ID3 APIC (Attached Picture / Cover Art) frame
 * 100% Native compatibility for Windows Explorer Shell thumbnail, Groove, WMP, macOS Finder, iOS & Android
 */
function createApicFrame(imageBuffer, mimeType = 'image/jpeg', version = 3) {
  // APIC frame structure for 100% Windows Media Player & Shell compatibility:
  // Text encoding: 0x00 (Latin-1)
  // MIME type: string + 0x00 null terminator
  // Picture type: 0x03 (Cover / Front)
  // Description: "" (single 0x00 null byte) -> Universal standard for Windows Explorer Shell & macOS Finder
  // Picture data: raw binary image bytes
  const encByte = Buffer.from([0x00]);
  const cleanMime = (mimeType && mimeType.includes('/')) ? mimeType : 'image/jpeg';
  const mimeBuf = Buffer.from(cleanMime + '\0', 'latin1');
  const picType = Buffer.from([0x03]); // 3 = Cover (front)
  const descBuf = Buffer.from([0x00]); // Single 0x00 null byte for empty description (Universal)
  const frameData = Buffer.concat([encByte, mimeBuf, picType, descBuf, imageBuffer]);

  const frameHeader = Buffer.alloc(10);
  frameHeader.write('APIC', 0, 4, 'ascii');
  if (version === 4) {
    encodeSyncSafeInt(frameData.length).copy(frameHeader, 4);
  } else {
    frameHeader.writeUInt32BE(frameData.length, 4);
  }
  frameHeader.writeUInt16BE(0, 8); // flags = 0
  return Buffer.concat([frameHeader, frameData]);
}

/**
 * Extracts embedded cover art (APIC frame) from an MP3 buffer if present
 * @param {Buffer} inputBuffer
 * @returns {{ buffer: Buffer, mime: string } | null}
 */
function extractCoverArtFromBuffer(inputBuffer) {
  if (!inputBuffer || inputBuffer.length < 10 || inputBuffer.toString('ascii', 0, 3) !== 'ID3') {
    return null;
  }
  const majorVersion = inputBuffer[3];
  const flags = inputBuffer[5];
  const tagSize = parseSyncSafeInt(inputBuffer, 6);
  const totalTagSize = tagSize + 10;

  let offset = 10;
  if (flags & 0x40) {
    const extSize = majorVersion === 4 ? parseSyncSafeInt(inputBuffer, offset) : inputBuffer.readUInt32BE(offset);
    offset += extSize;
  }

  while (offset < totalTagSize && offset < inputBuffer.length - 10) {
    if (inputBuffer[offset] === 0x00) break;
    const frameId = inputBuffer.toString('ascii', offset, offset + 4);
    if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

    const frameSize = majorVersion === 4 ? parseSyncSafeInt(inputBuffer, offset + 4) : inputBuffer.readUInt32BE(offset + 4);
    const frameHeaderSize = 10;
    const fullFrameEnd = Math.min(offset + frameHeaderSize + frameSize, inputBuffer.length);
    const frameData = inputBuffer.slice(offset + frameHeaderSize, fullFrameEnd);

    if (frameId === 'APIC' && frameData.length > 5) {
      try {
        const encoding = frameData[0];
        let mimeEnd = 1;
        while (mimeEnd < frameData.length && frameData[mimeEnd] !== 0x00) {
          mimeEnd++;
        }
        const mime = frameData.slice(1, mimeEnd).toString('ascii').trim() || 'image/jpeg';
        let cursor = mimeEnd + 1; // Skip null terminator of MIME
        if (cursor >= frameData.length) break;

        cursor += 1; // Skip pictureType byte

        // Skip description according to encoding
        if (encoding === 0x01 || encoding === 0x02) {
          // UTF-16: terminated by 0x00 0x00
          while (cursor < frameData.length - 1 && !(frameData[cursor] === 0x00 && frameData[cursor + 1] === 0x00)) {
            cursor += 2;
          }
          cursor += 2; // Skip 0x00 0x00
        } else {
          // ISO-8859-1 or UTF-8: terminated by single 0x00
          while (cursor < frameData.length && frameData[cursor] !== 0x00) {
            cursor++;
          }
          cursor += 1; // Skip 0x00
        }

        if (cursor < frameData.length) {
          const imgBuf = frameData.slice(cursor);
          if (imgBuf.length > 32) {
            return { buffer: imgBuf, mime };
          }
        }
      } catch (_) {}
    }
    offset += frameHeaderSize + frameSize;
  }
  return null;
}

/**
 * Strips C2PA and writes sanitized file
 */
function sanitizeMp3File(inputPath, outputPath, options = {}) {
  const buf = fs.readFileSync(inputPath);
  const { cleanedBuffer, strippedFrames, audit } = stripC2PAAndSunoMetadata(buf, options);
  
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, cleanedBuffer);
  return { outputPath, strippedFrames, audit };
}

module.exports = {
  stripC2PAAndSunoMetadata,
  sanitizeMp3File,
  createTextFrame,
  createApicFrame,
  extractCoverArtFromBuffer
};
