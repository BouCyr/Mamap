const DEFAULT_RATIO = 0.33;

/**
 * @param {Array<{z: number, underwater?: boolean}>} points
 * @param {number} [ratio] fraction of points, by count, that become underwater
 * @returns {number} the sea level found, before points were shifted by it
 */
export function applySeaLevel(points, ratio = DEFAULT_RATIO) {
  const sorted = [...points].sort((a, b) => a.z - b.z);
  const underwaterCount = Math.round(sorted.length * ratio);
  const seaLevel = sorted[Math.max(underwaterCount - 1, 0)].z;

  for (let i = 0; i < sorted.length; i++) {
    sorted[i].underwater = i < underwaterCount;
  }
  for (const point of points) {
    point.z -= seaLevel;
  }

  return seaLevel;
}
