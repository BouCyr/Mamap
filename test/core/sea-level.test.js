import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applySeaLevel } from '../../src/core/sea-level/index.js';

test('marks the lowest ratio of points underwater and shifts elevation so sea level is 0', () => {
  const points = Array.from({ length: 100 }, (_, i) => ({ z: i }));
  const seaLevel = applySeaLevel(points, 0.3);

  assert.equal(seaLevel, 29);
  const underwater = points.filter((p) => p.underwater);
  assert.equal(underwater.length, 30);
  assert.ok(underwater.every((p) => p.z <= 0));
  assert.ok(points.filter((p) => !p.underwater).every((p) => p.z > 0));
});
