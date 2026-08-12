// Dev-only. Decodes a PNG file into a sampleHeight(x, y) -> 0..1 grayscale
// function, for scripts/debug-render.js. Stands in for the real Node-side
// height-map adapter mentioned in docs/ARCHITECTURE.md, section 6, which
// is still not built (it belongs with the CLI, phase 11).

import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { MAP_SIZE } from '../src/core/model/constants.js';

export function loadHeightMap(path) {
  const { width, height, data } = PNG.sync.read(readFileSync(path));

  return function sampleHeight(x, y) {
    const px = Math.min(width - 1, Math.max(0, Math.floor((x / MAP_SIZE) * width)));
    const py = Math.min(height - 1, Math.max(0, Math.floor((y / MAP_SIZE) * height)));
    const i = (py * width + px) * 4;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
}
