// Seeded pseudo-random source (mulberry32). Every module that needs
// randomness takes one of these instead of calling Math.random(), so the
// same seed always produces the same city (see docs/ARCHITECTURE.md,
// section 3).

export function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
