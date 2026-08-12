import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPoint,
  createEdge,
  createCell,
  createCityModel,
} from '../../src/core/model/index.js';

test('createPoint holds x and y', () => {
  assert.deepEqual(createPoint(3, 4), { x: 3, y: 4 });
});

test('createEdge holds its two endpoints', () => {
  const a = createPoint(0, 0);
  const b = createPoint(1, 1);
  assert.deepEqual(createEdge(a, b), { a, b });
});

test('createCell holds its ordered vertices', () => {
  const vertices = [createPoint(0, 0), createPoint(1, 0), createPoint(0, 1)];
  assert.deepEqual(createCell(vertices), { vertices });
});

test('createCityModel carries the seed, params, and a seeded random source', () => {
  const model = createCityModel(42, { ratio: 0.33 });
  assert.equal(model.seed, 42);
  assert.deepEqual(model.params, { ratio: 0.33 });
  assert.equal(typeof model.random, 'function');
});

test('createCityModel is deterministic: same seed gives the same random sequence', () => {
  const a = createCityModel(42);
  const b = createCityModel(42);
  assert.equal(a.random(), b.random());
});
