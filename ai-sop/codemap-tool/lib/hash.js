'use strict';
const fs = require('fs');
const crypto = require('crypto');

function contentHash(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash('sha1').update(buf).digest('hex');
  } catch {
    return null;
  }
}

module.exports = { contentHash };
