// Temporary dev tool. Runs the pipeline through the sea-level stage and
// writes a debug SVG: one filled polygon per Voronoi cell, colored by its
// point's elevation. Not the real 2D renderer (that's phase 10/11, still
// unbuilt) - this is only here to see intermediate pipeline output while
// building it.
//
// Usage: node scripts/debug-render.js [seed] [ratio] [outputPath]

import { writeFileSync } from 'node:fs';
import { createCityModel, MAP_SIZE } from '../src/core/model/index.js';
import { createPoints } from '../src/core/points/index.js';
import { createMesh } from '../src/core/mesh/index.js';
import { applyTerrain } from '../src/core/terrain/index.js';
import { applySeaLevel } from '../src/core/sea-level/index.js';

const seed = Number(process.argv[2] ?? 1);
const ratio = Number(process.argv[3] ?? 0.33);
const outputPath = process.argv[4] ?? 'debug-map.svg';

// A blank height-map: every point starts at the same mid-grey value, so
// elevation comes only from the noise factor applied on top of it.
const blankHeightMap = () => 0.5;

const cityModel = createCityModel(seed);
const points = createPoints(cityModel);
const mesh = createMesh(points);
applyTerrain(points, mesh, blankHeightMap, cityModel);
const seaLevel = applySeaLevel(points, ratio);

writeFileSync(outputPath, renderDebugSvg(points, mesh));
console.log(`wrote ${outputPath} (seed ${seed}, ratio ${ratio}, sea level was ${seaLevel.toFixed(4)})`);

function renderDebugSvg(points, mesh) {
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

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${MAP_SIZE}" height="${MAP_SIZE}" viewBox="0 0 ${MAP_SIZE} ${MAP_SIZE}">`,
    polygons,
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
