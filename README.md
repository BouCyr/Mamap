# Mamap

A generator for fictional city maps.

Given a seed, Mamap builds a 3D model of a city (terrain, streets, parcels,
buildings) and flattens it into a readable 2D map. The 3D model is an
intermediate step, not the end goal — see
[docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for why.

The generator runs the same way from Node (a script/CLI, no browser needed)
or from a browser page with a small UI.

## Status

Scaffold stage: folder layout and documentation only. No generation code has
been written yet.

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
