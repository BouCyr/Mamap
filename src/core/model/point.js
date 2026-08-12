// A location in the map. Later stages add more fields directly onto a
// point (elevation, an underwater flag, ...) instead of replacing it, so
// that edges and cells built from these points automatically see the
// added fields too, without needing to be rebuilt.

/**
 * @param {number} x
 * @param {number} y
 */
export function createPoint(x, y) {
  return { x, y };
}
