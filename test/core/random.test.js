import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRandom } from '../../src/core/random/index.js';

test('the same seed produces the same sequence', () => {
  const a = createRandom(42);
  const b = createRandom(42);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
});

test('different seeds produce different sequences', () => {
  const a = createRandom(1);
  const b = createRandom(2);
  assert.notEqual(a(), b());
});

test('values stay within [0, 1)', () => {
  const random = createRandom(7);
  for (let i = 0; i < 1000; i++) {
    const value = random();
    assert.ok(value >= 0 && value < 1);
  }
});
