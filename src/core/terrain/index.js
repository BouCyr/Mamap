import { createNoise2D } from 'simplex-noise';
import { MAP_SIZE } from '../model/constants.js';

const NOISE_MIN_FACTOR = 0.8;
const NOISE_MAX_FACTOR = 1.2;
// Simplex noise varies over roughly one unit of input; scaling map
// coordinates down first spreads that variation smoothly across the map
// instead of changing on every point.
const NOISE_SCALE = 5 / MAP_SIZE;
const BORDER_EPSILON = 1e-6;

/**
 * @param {Array<{x: number, y: number, z?: number}>} points
 * @param {{cells: Array<{vertices: Array<{x: number, y: number}>}>, edges: Array<{a: object, b: object}>}} mesh
 * @param {(x: number, y: number) => number} sampleHeight already-decoded, normalized 0-1 height-map sampler
 * @param {{random: () => number}} cityModel
 */
export function applyTerrain(points, mesh, sampleHeight, cityModel) {
  const noise2D = createNoise2D(cityModel.random);

  for (const point of points) {
    const height = sampleHeight(point.x, point.y);
    const noise = noise2D(point.x * NOISE_SCALE, point.y * NOISE_SCALE);
    const factor = NOISE_MIN_FACTOR + ((noise + 1) / 2) * (NOISE_MAX_FACTOR - NOISE_MIN_FACTOR);
    point.z = height * factor;
  }

  const neighborsOf = buildNeighborMap(points, mesh.edges);

  for (let i = 0; i < points.length; i++) {
    if (isBorderCell(mesh.cells[i])) continue;

    const point = points[i];
    const neighborZs = neighborsOf.get(point).map((neighbor) => neighbor.z);
    const isLocalMax = neighborZs.every((z) => point.z > z);
    const isLocalMin = neighborZs.every((z) => point.z < z);
    if (isLocalMax || isLocalMin) {
      point.z = neighborZs.reduce((sum, z) => sum + z, 0) / neighborZs.length;
    }
  }
}

function buildNeighborMap(points, edges) {
  const neighborsOf = new Map(points.map((point) => [point, []]));
  for (const edge of edges) {
    neighborsOf.get(edge.a).push(edge.b);
    neighborsOf.get(edge.b).push(edge.a);
  }
  return neighborsOf;
}

function isBorderCell(cell) {
  return cell.vertices.some(
    (v) =>
      v.x <= BORDER_EPSILON ||
      v.x >= MAP_SIZE - BORDER_EPSILON ||
      v.y <= BORDER_EPSILON ||
      v.y >= MAP_SIZE - BORDER_EPSILON,
  );
}
