import { createPoint } from '../model/point.js';
import { createEdge } from '../model/edge.js';

/**
 * @param {Array<{x: number, y: number, z: number}>} points
 * @param {{edges: Array<{a: object, b: object}>, triangles: Array<[object, object, object]>}} mesh
 * @returns {{edges: Array<object>, coastlineEdges: Array<object>}}
 */
export function createCoastline(points, mesh) {
  const indexOf = new Map(points.map((point, i) => [point, i]));
  const crossingPoints = new Map();

  function crossingKey(a, b) {
    const ia = indexOf.get(a);
    const ib = indexOf.get(b);
    return ia < ib ? `${ia}:${ib}` : `${ib}:${ia}`;
  }

  function getCrossingPoint(a, b) {
    const key = crossingKey(a, b);
    let point = crossingPoints.get(key);
    if (!point) {
      point = computeCrossingPoint(a, b);
      crossingPoints.set(key, point);
    }
    return point;
  }

  const edges = mesh.edges.flatMap((edge) => {
    if (!crossesSeaLevel(edge.a, edge.b)) return [edge];
    const crossing = getCrossingPoint(edge.a, edge.b);
    return [createEdge(edge.a, crossing), createEdge(crossing, edge.b)];
  });

  const coastlineEdges = [];
  for (const [a, b, c] of mesh.triangles) {
    const crossingSides = [
      [a, b],
      [b, c],
      [c, a],
    ].filter(([p, q]) => crossesSeaLevel(p, q));

    // A triangle with one vertex on the opposite side from the other two
    // has exactly two sides that cross sea level; the coastline runs
    // between those two crossing points. A triangle entirely above or
    // below sea level has none.
    if (crossingSides.length === 2) {
      coastlineEdges.push(
        createEdge(getCrossingPoint(...crossingSides[0]), getCrossingPoint(...crossingSides[1])),
      );
    }
  }

  return { edges, coastlineEdges };
}

/**
 * Whether two mesh points sit on opposite sides of sea level (z = 0).
 * @param {{z: number}} a
 * @param {{z: number}} b
 */
export function crossesSeaLevel(a, b) {
  return (a.z > 0 && b.z < 0) || (a.z < 0 && b.z > 0);
}

/**
 * The point on segment a-b where elevation crosses 0, found by linear
 * interpolation between the two points' elevations.
 * @param {{x: number, y: number, z: number}} a
 * @param {{x: number, y: number, z: number}} b
 */
export function computeCrossingPoint(a, b) {
  const t = a.z / (a.z - b.z);
  const point = createPoint(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  point.z = 0;
  return point;
}
