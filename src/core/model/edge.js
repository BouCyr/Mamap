// A straight connection between two points.

/**
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 */
export function createEdge(a, b) {
  return { a, b };
}
