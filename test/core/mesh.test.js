import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCityModel } from '../../src/core/model/index.js';
import { createPoints } from '../../src/core/points/index.js';
import { createMesh } from '../../src/core/mesh/index.js';

test('createMesh returns one cell per point and a site-adjacency edge list', () => {
  const points = createPoints(createCityModel(1));
  const mesh = createMesh(points);

  assert.equal(mesh.cells.length, points.length);
  for (const cell of mesh.cells) {
    assert.ok(cell.vertices.length >= 3);
  }

  assert.ok(mesh.edges.length > 0);
  for (const edge of mesh.edges) {
    assert.ok(points.includes(edge.a));
    assert.ok(points.includes(edge.b));
    assert.notEqual(edge.a, edge.b);
  }
});

test('has no duplicate edges between the same pair of points', () => {
  const points = createPoints(createCityModel(2));
  const { edges } = createMesh(points);
  const seen = new Set();
  for (const edge of edges) {
    const a = points.indexOf(edge.a);
    const b = points.indexOf(edge.b);
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    assert.ok(!seen.has(key), `duplicate edge ${key}`);
    seen.add(key);
  }
});

test('createMesh returns the Delaunay triangles as point triples', () => {
  const points = createPoints(createCityModel(1));
  const { triangles } = createMesh(points);

  assert.ok(triangles.length > 0);
  for (const triangle of triangles) {
    assert.equal(triangle.length, 3);
    const [a, b, c] = triangle;
    assert.ok(points.includes(a) && points.includes(b) && points.includes(c));
    assert.notEqual(a, b);
    assert.notEqual(b, c);
    assert.notEqual(a, c);
  }
});
