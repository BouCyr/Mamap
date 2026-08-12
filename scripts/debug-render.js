// Temporary dev tool. Runs the pipeline through the coastline stage and
// writes a debug SVG: one filled polygon per Voronoi cell, colored by its
// point's elevation, with the coastline drawn on top. Not the real 2D
// renderer (that's phase 10/11, still unbuilt) - this is only here to see
// intermediate pipeline output while building it.
//
// Usage: node scripts/debug-render.js [heightMapPath|blank] [seed] [ratio] [outputPath]

import { writeFileSync } from 'node:fs';
import { createCityModel, MAP_SIZE } from '../src/core/model/index.js';
import { createPoints } from '../src/core/points/index.js';
import { createMesh } from '../src/core/mesh/index.js';
import { applyTerrain } from '../src/core/terrain/index.js';
import { applySeaLevel } from '../src/core/sea-level/index.js';
import { createCoastline } from '../src/core/coastline/index.js';
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

  const polygons = mesh.cells
    .map((cell, i) => {
      const color = colorForElevation(points[i].z, minZ, maxZ);
      const vertices = cell.vertices.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ');
      return `  <polygon points="${vertices}" fill="${color}" stroke="#00000022" />`;
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
