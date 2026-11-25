// Sizzle & Serve — seeded randomness.
// One file, one job: deterministic numbers so a seed always replays the
// same shift, which is what makes the screenshots reproducible.

/** mulberry32: a small, fast seeded PRNG. */
export function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `items` using `rand`. */
export function pick(rand, items) {
  return items[Math.floor(rand() * items.length)];
}

/** An integer in [min, max] using `rand`. */
export function intBetween(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}

/** Shuffle a copy of `items` using `rand` (Fisher-Yates). */
export function shuffle(rand, items) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
