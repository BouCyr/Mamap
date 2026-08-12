// A closed polygon: an ordered list of points forming its boundary. The
// same shape covers Voronoi cells, blocks, and parcels - what the
// vertices mean is up to whichever stage builds the cell.

/**
 * @param {Array<{x: number, y: number}>} vertices
 */
export function createCell(vertices) {
  return { vertices };
}
