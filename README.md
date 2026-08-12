# Mamap

A generator for fictional city maps.

Given a seed, Mamap builds a 3D model of a city (terrain, streets, parcels,
buildings) and flattens it into a readable 2D map. The 3D model is an
intermediate step, not the end goal — see
[docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for why.

The generator runs the same way from Node (a script/CLI, no browser needed)
or from a browser page with a small UI.

## Status

Phase 1 (core data model) is implemented: shared point/edge/cell containers
and a seeded random source, with tests. Phases 2 onward (point mesh,
terrain, ...) are not implemented yet — see
[docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the roadmap.

Run the tests with `npm test`.

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
