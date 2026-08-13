# Mamap

A generator for fictional city maps.

Given a seed, Mamap builds a 3D model of a city (terrain, streets, parcels,
buildings) and flattens it into a readable 2D map. The 3D model is an
intermediate step, not the end goal — see
[docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for why.

The generator runs the same way from Node (a script/CLI, no browser needed)
or from a browser page with a small UI.

## Status

Phases 1–5 are implemented: the core data model, point-set generation,
the bounded Voronoi mesh, terrain elevation, sea level, and the
coastline, with tests for each. Phase 6 (roads) onward is not
implemented yet — see [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for
the roadmap.

Run the tests with `npm test`. See intermediate output with
`node scripts/debug-render.js [heightMapPath|blank] [seed] [ratio] [outputPath] [pointMultiplier]`.

## Example output

Debug renders through the coastline stage: filled triangles colored by
elevation, split into their land part and sea part wherever the coastline
crosses them, with the coastline drawn on top in white. Not the real 2D
renderer, which is still unbuilt — just a look at intermediate pipeline
output.

- [docs/examples/coastline-demo.svg](docs/examples/coastline-demo.svg) —
  seed 1, ratio 0.33, from a hand-painted height map (636 coastline edges).
- Effect of `ratio` (the share of points forced underwater), same seed and
  the same
  [height map](docs/examples/two-hills-heightmap.png):
  [ratio 0.33](docs/examples/two-hills-demo.svg) (sea level 0.4219, 226
  coastline edges) vs.
  [ratio 0.2](docs/examples/two-hills-demo-ratio-0.2.svg) (sea level
  0.3314, 71 coastline edges) — a lower ratio pulls sea level down, so
  less of the map floods and the coastline shrinks.
- Effect of point count, same height map and ratio 0.2:
  [1000 points](docs/examples/two-hills-demo-ratio-0.2.svg) vs.
  [3000 points](docs/examples/two-hills-demo-3x-points.svg) (sea level
  0.1545, 143 coastline edges) — more points give a finer mesh and a
  more detailed coastline.

## Documentation

- [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) — goals, constraints, and the
  phased roadmap.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — module layout, data
  contracts between pipeline stages, and coding conventions.

## Tech stack

Plain modern ECMAScript (ES modules), no framework. Dependencies are kept to
a minimum and limited to technical/mathematical utility libraries (noise,
geometry, vector math), each pinned to an exact version. Details and
reasoning are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#6-dependency-policy).

## Layout

```
docs/     Project plan and architecture notes.
src/
  core/   Generation logic (terrain, roads, parcels, buildings, projection).
  render/ Turning the generated model into pixels/vectors (2D and 3D preview).
  cli/    Node entry point.
  web/    Browser entry point and UI.
test/     Tests, mirroring src/.
```
