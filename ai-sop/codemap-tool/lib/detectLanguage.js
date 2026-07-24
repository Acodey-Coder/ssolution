'use strict';
const path = require('path');

const EXT_TO_LANG = {
  '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
  '.ts': 'TypeScript', '.tsx': 'TypeScript',
  '.py': 'Python',
  '.java': 'Java',
  '.cs': 'C#',
  '.go': 'Go',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.rs': 'Rust',
  '.kt': 'Kotlin', '.kts': 'Kotlin',
  '.c': 'C', '.h': 'C',
  '.cpp': 'C++', '.cc': 'C++', '.hpp': 'C++',
};

/**
 * Detects language(s) present by file-extension counts across all scanned files.
 * Returns { counts: {lang: n}, primary: lang } - primary is the highest-count language.
 */
function detectLanguages(files) {
  const counts = {};
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    const lang = EXT_TO_LANG[ext];
    if (lang) counts[lang] = (counts[lang] || 0) + 1;
  }
  let primary = null;
  let max = 0;
  for (const [lang, n] of Object.entries(counts)) {
    if (n > max) { max = n; primary = lang; }
  }
  return { counts, primary };
}

module.exports = { detectLanguages, EXT_TO_LANG };
