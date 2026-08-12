import { Delaunay } from 'd3-delaunay';
import { createCell } from '../model/cell.js';
import { createEdge } from '../model/edge.js';
import { MAP_SIZE } from '../model/constants.js';

const EDGE_COLLAPSE_THRESHOLD = 20;

/**
 * @param {Array<{x: number, y: number}>} points
 */
export function createMesh(points) {
  const delaunay = Delaunay.from(points.map((p) => [p.x, p.y]));
  const voronoi = delaunay.voronoi([0, 0, MAP_SIZE, MAP_SIZE]);

  const rawCells = points.map((_, i) => {
    const polygon = voronoi.cellPolygon(i);
    // cellPolygon returns a closed ring (first point repeated at the end).
    return polygon ? polygon.slice(0, -1).map(([x, y]) => ({ x, y })) : [];
  });

  const cells = collapseShortEdges(rawCells, EDGE_COLLAPSE_THRESHOLD).map(createCell);

  const edges = [];
  const seenPairs = new Set();
  for (let i = 0; i < points.length; i++) {
    for (const j of delaunay.neighbors(i)) {
      const key = i < j ? `${i}:${j}` : `${j}:${i}`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      edges.push(createEdge(points[i], points[j]));
    }
  }

  const triangles = [];
  for (let t = 0; t < delaunay.triangles.length; t += 3) {
    triangles.push([
      points[delaunay.triangles[t]],
      points[delaunay.triangles[t + 1]],
      points[delaunay.triangles[t + 2]],
    ]);
  }

  return { cells, edges, triangles };
}

// Voronoi cells share vertices with their neighbors. Any shared vertex
// pulled together with another by a too-short edge (in any cell) merges
// into the average position of the whole group it ends up in - this
// naturally handles chains of short edges too, not just single ones.
function collapseShortEdges(rawCells, threshold) {
  const keyOf = (p) => `${p.x.toFixed(6)}:${p.y.toFixed(6)}`;
  const indexByKey = new Map();
  const vertices = [];
  const cellIndices = rawCells.map((cell) =>
    cell.map((point) => {
      const key = keyOf(point);
      let index = indexByKey.get(key);
      if (index === undefined) {
        index = vertices.length;
        indexByKey.set(key, index);
        vertices.push(point);
      }
      return index;
    }),
  );

  const parent = vertices.map((_, i) => i);
  function find(i) {
    while (parent[i] !== i) i = parent[i];
    return i;
  }
  function union(a, b) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootA] = rootB;
  }

  for (const indices of cellIndices) {
    for (let i = 0; i < indices.length; i++) {
      const a = indices[i];
      const b = indices[(i + 1) % indices.length];
      const dx = vertices[a].x - vertices[b].x;
      const dy = vertices[a].y - vertices[b].y;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) union(a, b);
    }
  }

  const groups = new Map();
  for (let i = 0; i < vertices.length; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(vertices[i]);
  }
  const merged = new Map();
  for (const [root, group] of groups) {
    merged.set(root, {
      x: group.reduce((sum, p) => sum + p.x, 0) / group.length,
      y: group.reduce((sum, p) => sum + p.y, 0) / group.length,
    });
  }

  return cellIndices.map((indices) => {
    const collapsed = indices.map((i) => merged.get(find(i)));
    const withoutRepeats = [];
    for (const point of collapsed) {
      const last = withoutRepeats[withoutRepeats.length - 1];
      if (!last || last.x !== point.x || last.y !== point.y) {
        withoutRepeats.push(point);
      }
    }
    const first = withoutRepeats[0];
    const last = withoutRepeats[withoutRepeats.length - 1];
    if (withoutRepeats.length > 1 && first.x === last.x && first.y === last.y) {
      withoutRepeats.pop();
    }
    return withoutRepeats;
  });
}
