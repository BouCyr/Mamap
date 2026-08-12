// Temporary dev tool. Runs the pipeline through the coastline stage and
// writes a debug SVG: one filled polygon per Delaunay triangle, colored by
// the elevation of its corners, with the coastline drawn on top. Any
// triangle the coastline runs through is split into its land part and its
// sea part first, each colored on its own side - this is what keeps the
// fill from showing land past the coastline into the sea, or the other way
// round, since the fill boundary and the coastline line are the same line.
// Not the real 2D renderer (that's phase 10/11, still unbuilt) - this is
// only here to see intermediate pipeline output while building it.
//
// Usage: node scripts/debug-render.js [heightMapPath|blank] [seed] [ratio] [outputPath]

import { writeFileSync } from 'node:fs';
import { createCityModel, MAP_SIZE } from '../src/core/model/index.js';
import { createPoints } from '../src/core/points/index.js';
import { createMesh } from '../src/core/mesh/index.js';
import { applyTerrain } from '../src/core/terrain/index.js';
import { applySeaLevel } from '../src/core/sea-level/index.js';
import { createCoastline, crossesSeaLevel, computeCrossingPoint } from '../src/core/coastline/index.js';
import { loadHeightMap } from './load-height-map.js';

const heightMapArg = process.argv[2] ?? 'blank';
const seed = Number(process.argv[3] ?? 1);
const ratio = Number(process.argv[4] ?? 0.33);
const outputPath = process.argv[5] ?? 'debug-map.svg';

// "blank" is every point starting at the same mid-grey value, so elevation
// comes only from the noise factor applied on top of it. Anything else is
// read as a path to a real PNG height-map image.
const sampleHeight = heightMapArg === 'blank' ? () => 0.5 : loadHeightMap(heightMapArg);

const cityModel = createCityModel(seed);
const points = createPoints(cityModel);
const mesh = createMesh(points);
applyTerrain(points, mesh, sampleHeight, cityModel);
const seaLevel = applySeaLevel(points, ratio);
const { coastlineEdges } = createCoastline(points, mesh);

writeFileSync(outputPath, renderDebugSvg(points, mesh, coastlineEdges));
console.log(
  `wrote ${outputPath} (heightMap ${heightMapArg}, seed ${seed}, ratio ${ratio}, ` +
    `sea level was ${seaLevel.toFixed(4)}, ${coastlineEdges.length} coastline edges)`,
);

function renderDebugSvg(points, mesh, coastlineEdges) {
  const zValues = points.map((point) => point.z);
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);

  const polygons = mesh.triangles
    .flatMap(splitTriangleByCoastline)
    .map(({ vertices, z }) => {
      const color = colorForElevation(z, minZ, maxZ);
      const coords = vertices.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ');
      return `  <polygon points="${coords}" fill="${color}" stroke="${color}" />`;
    })
    .join('\n');

  const coastline = coastlineEdges
    .map(
      (edge) =>
        `  <line x1="${edge.a.x.toFixed(1)}" y1="${edge.a.y.toFixed(1)}" x2="${edge.b.x.toFixed(1)}" y2="${edge.b.y.toFixed(1)}" stroke="#ffffff" stroke-width="6" />`,
    )
    .join('\n');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${MAP_SIZE}" height="${MAP_SIZE}" viewBox="0 0 ${MAP_SIZE} ${MAP_SIZE}">`,
    polygons,
    coastline,
    '</svg>',
    '',
  ].join('\n');
}

// A triangle entirely above or below sea level renders as one flat polygon.
// A triangle with one corner on the opposite side from the other two is cut
// at the two points where its sides cross sea level, into a small triangle
// (the lone corner) and a quad (the other two corners) - the same crossing
// points createCoastline uses to draw the coastline itself, so the two
// fills meet exactly on that line instead of over- or under-shooting it.
function splitTriangleByCoastline(triangle) {
  const [p0, p1, p2] = triangle;
  const crossingSides = [
    [p0, p1],
    [p1, p2],
    [p2, p0],
  ].filter(([a, b]) => crossesSeaLevel(a, b));

  if (crossingSides.length === 0) {
    return [{ vertices: triangle, z: (p0.z + p1.z + p2.z) / 3 }];
  }

  const isLand = (p) => p.z > 0;
  const landCount = triangle.filter(isLand).length;
  const loneIsLand = landCount === 1;
  const loneIndex = triangle.findIndex((p) => isLand(p) === loneIsLand);
  const [lone, otherA, otherB] = [
    triangle[loneIndex],
    triangle[(loneIndex + 1) % 3],
    triangle[(loneIndex + 2) % 3],
  ];

  const crossingLoneA = computeCrossingPoint(lone, otherA);
  const crossingOtherBLone = computeCrossingPoint(otherB, lone);

  return [
    { vertices: [crossingOtherBLone, lone, crossingLoneA], z: lone.z },
    {
      vertices: [crossingLoneA, otherA, otherB, crossingOtherBLone],
      z: (otherA.z + otherB.z) / 2,
    },
  ];
}

function colorForElevation(z, minZ, maxZ) {
  if (z <= 0) {
    const t = minZ === 0 ? 0 : z / minZ;
    return mixColor('#5fb2e8', '#0a2f5c', t);
  }
  const t = maxZ === 0 ? 0 : z / maxZ;
  if (t < 0.5) return mixColor('#3f7d2c', '#c2a05a', t * 2);
  return mixColor('#c2a05a', '#ffffff', (t - 0.5) * 2);
}

function mixColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const blue = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${blue})`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
