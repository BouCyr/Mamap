// A location in the map. Later stages build new, bigger objects out of a
// point (adding elevation, an underwater flag, ...) rather than mutating
// this one, so Point itself only ever holds the position.

/**
 * @param {number} x
 * @param {number} y
 */
export function createPoint(x, y) {
  return { x, y };
}
