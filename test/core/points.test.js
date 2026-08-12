import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCityModel, MAP_SIZE } from '../../src/core/model/index.js';
import { createPoints } from '../../src/core/points/index.js';

test('createPoints returns 1000 points inside the map bounds', () => {
  const points = createPoints(createCityModel(1));
  assert.equal(points.length, 1000);
  for (const point of points) {
    assert.ok(point.x >= 0 && point.x <= MAP_SIZE);
    assert.ok(point.y >= 0 && point.y <= MAP_SIZE);
  }
});

test('the same seed produces the same points', () => {
  const a = createPoints(createCityModel(7));
  const b = createPoints(createCityModel(7));
  assert.deepEqual(a, b);
});
