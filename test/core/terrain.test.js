import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCityModel } from '../../src/core/model/index.js';
import { createPoints } from '../../src/core/points/index.js';
import { createMesh } from '../../src/core/mesh/index.js';
import { applyTerrain } from '../../src/core/terrain/index.js';

function run(seed) {
  const cityModel = createCityModel(seed);
  const points = createPoints(cityModel);
  const mesh = createMesh(points);
  applyTerrain(points, mesh, () => 0.5, cityModel);
  return points;
}

test('assigns elevation within the height * noise-factor range', () => {
  const points = run(1);
  for (const point of points) {
    assert.ok(Number.isFinite(point.z));
    assert.ok(point.z >= 0.5 * 0.8 - 1e-9);
    assert.ok(point.z <= 0.5 * 1.2 + 1e-9);
  }
});

test('is deterministic for the same seed', () => {
  const a = run(3).map((p) => p.z);
  const b = run(3).map((p) => p.z);
  assert.deepEqual(a, b);
});
