const fs = require('fs');
const path = require('path');

function cleanupStaleTempFiles({ directories, tempRoot, maxAgeMs, now = Date.now() }) {
  const staleBefore = now - maxAgeMs;
  let deletedCount = 0;

  const removeIfStale = (filePath, entry) => {
    if (!entry.isFile()) return;
    try {
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs >= staleBefore) return;
      fs.unlinkSync(filePath);
      deletedCount += 1;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`[ReSu_] Could not remove stale temporary file "${filePath}": ${error.message}`);
      }
    }
  };

  for (const directory of directories) {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`[ReSu_] Could not scan temporary directory "${directory}": ${error.message}`);
      }
      continue;
    }

    for (const entry of entries) {
      const filePath = path.join(directory, entry.name);
      removeIfStale(filePath, entry);
    }
  }

  let rootEntries;
  try {
    rootEntries = fs.readdirSync(tempRoot, { withFileTypes: true });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`[ReSu_] Could not scan temporary root "${tempRoot}": ${error.message}`);
    }
    return deletedCount;
  }

  for (const entry of rootEntries) {
    if (entry.name.startsWith('resu_preview_') && entry.name.endsWith('.mp3')) {
      const filePath = path.join(tempRoot, entry.name);
      removeIfStale(filePath, entry);
    }
  }

  return deletedCount;
}

module.exports = { cleanupStaleTempFiles };
