import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPoint } from '../../src/core/model/point.js';
import { createEdge } from '../../src/core/model/edge.js';
import { createCoastline } from '../../src/core/coastline/index.js';
import { createCityModel } from '../../src/core/model/index.js';
import { createPoints } from '../../src/core/points/index.js';
import { createMesh } from '../../src/core/mesh/index.js';
import { applyTerrain } from '../../src/core/terrain/index.js';
import { applySeaLevel } from '../../src/core/sea-level/index.js';

test('splits crossing edges and links the two crossing points of a mixed triangle', () => {
  const a = createPoint(0, 0);
  a.z = 2;
  const b = createPoint(10, 0);
  b.z = -2;
  const c = createPoint(0, 10);
  c.z = 2;

  const mesh = {
    edges: [createEdge(a, b), createEdge(b, c), createEdge(a, c)],
    triangles: [[a, b, c]],
  };

  const { edges, coastlineEdges } = createCoastline([a, b, c], mesh);

  // a-c does not cross sea level, so it survives untouched.
  assert.ok(edges.some((edge) => edge.a === a && edge.b === c));

  // a-b and b-c each split into two edges meeting at a new z=0 point, so
  // the direct a-b and b-c edges are gone and 5 edges remain in total.
  const isEndpointPair = (edge, p, q) =>
    (edge.a === p && edge.b === q) || (edge.a === q && edge.b === p);
  assert.ok(!edges.some((edge) => isEndpointPair(edge, a, b)));
  assert.ok(!edges.some((edge) => isEndpointPair(edge, b, c)));
  assert.equal(edges.length, 5);

  assert.equal(coastlineEdges.length, 1);
  const [coastEdge] = coastlineEdges;
  assert.equal(coastEdge.a.z, 0);
  assert.equal(coastEdge.b.z, 0);
  // The crossing points sit at the midpoints, since both triangles here
  // are symmetric (z=2 to z=-2, and z=-2 to z=2).
  assert.deepEqual([coastEdge.a.x, coastEdge.a.y], [5, 0]);
  assert.deepEqual([coastEdge.b.x, coastEdge.b.y], [5, 5]);
});

test('a triangle entirely on one side of sea level contributes no coastline edge', () => {
  const a = createPoint(0, 0);
  a.z = 1;
  const b = createPoint(10, 0);
  b.z = 2;
  const c = createPoint(0, 10);
  c.z = 3;

  const mesh = {
    edges: [createEdge(a, b), createEdge(b, c), createEdge(a, c)],
    triangles: [[a, b, c]],
  };

  const { edges, coastlineEdges } = createCoastline([a, b, c], mesh);
  assert.equal(coastlineEdges.length, 0);
  assert.equal(edges.length, 3); // nothing split
});

test('on the real pipeline, every coastline edge sits exactly at sea level', () => {
  const cityModel = createCityModel(1);
  const points = createPoints(cityModel);
  const mesh = createMesh(points);
  applyTerrain(points, mesh, () => 0.5, cityModel);
  applySeaLevel(points, 0.33);

  const { coastlineEdges } = createCoastline(points, mesh);

  assert.ok(coastlineEdges.length > 0);
  for (const edge of coastlineEdges) {
    assert.equal(edge.a.z, 0);
    assert.equal(edge.b.z, 0);
  }
});
