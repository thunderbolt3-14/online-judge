const K = 25;
const WINDOW = 4;
const BASE = 257;
const MOD = 1000000007;

const normalize = (code) => code.replace(/\s+/g, '').toLowerCase();

const kgramHashes = (text, k = K) => {
  const hashes = [];
  if (text.length < k) return hashes;

  let hash = 0;
  let power = 1;
  for (let i = 0; i < k; i++) {
    hash = (hash * BASE + text.charCodeAt(i)) % MOD;
    if (i < k - 1) power = (power * BASE) % MOD;
  }
  hashes.push(hash);

  for (let i = k; i < text.length; i++) {
    hash = (hash - (text.charCodeAt(i - k) * power) % MOD + MOD) % MOD;
    hash = (hash * BASE + text.charCodeAt(i)) % MOD;
    hashes.push(hash);
  }

  return hashes;
};

const winnow = (hashes, windowSize = WINDOW) => {
  const fingerprints = new Set();
  if (hashes.length === 0) return fingerprints;

  let prevMinIndex = -1;
  for (let i = 0; i <= hashes.length - windowSize; i++) {
    const window = hashes.slice(i, i + windowSize);
    let minIndex = i;
    let minValue = window[0];
    for (let j = 1; j < window.length; j++) {
      if (window[j] <= minValue) {
        minValue = window[j];
        minIndex = i + j;
      }
    }
    if (minIndex !== prevMinIndex) {
      fingerprints.add(minValue);
      prevMinIndex = minIndex;
    }
  }

  return fingerprints;
};

const computeFingerprint = (code) => {
  const normalized = normalize(code);
  const hashes = kgramHashes(normalized);
  return winnow(hashes);
};

const similarity = (fpA, fpB) => {
  if (fpA.size === 0 || fpB.size === 0) return 0;
  let intersectionSize = 0;
  for (const h of fpA) {
    if (fpB.has(h)) intersectionSize++;
  }
  const unionSize = fpA.size + fpB.size - intersectionSize;
  return Math.round((intersectionSize / unionSize) * 100);
};

module.exports = { computeFingerprint, similarity };