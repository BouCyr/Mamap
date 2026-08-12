# Mamap — Project Plan

## 1. What this project is

Mamap generates maps of fictional cities. The generator builds a city from a
seed and a small set of parameters, and produces a map a person can read at a
glance: streets, blocks, buildings, maybe parks and water.

The final output is a **2D map**. To get there cleanly, the generator first
builds a **3D model** of the city (terrain, streets, building shapes) and then
flattens that model into the 2D map. The 3D step is not the goal. It exists
because some things are easier to get right in 3D and then project down, than
to fake directly in 2D:

- Terrain height decides where roads bend, where rivers sit, where building
  footprints can go.
- Building height and rough shape give the 2D map useful things to draw:
  footprint outlines, shadow hints, roof color by height, block density.
- Working in 3D first means the 2D renderer can stay simple: it only has to
  draw shapes it is given, not invent the missing height information itself.

So the pipeline is: **parameters → 3D city model → flattened 2D map.**

## 2. Goals

- Generate a believable city layout from a seed: road network, blocks,
  parcels, buildings.
- Produce a clean 2D map as the final artifact (image or vector output).
- Support an optional 3D preview of the same generated city, mainly as a way
  to check the generator is producing sensible geometry before it is
  flattened.
- Run the same generation logic in two places:
  - **Node**, as a command-line/server task (no browser needed).
  - **Browser**, from a small UI a person can use directly.
- Keep the codebase small, plain, and easy to read.

## 3. Non-goals (for now)

- No real-world map import or GIS data. Cities are invented, not traced from
  real places.
- No multiplayer, accounts, persistence layer, or backend API beyond "run the
  generator and hand back a result."
- No game engine, no physics, no animation beyond a simple camera to look at
  the 3D preview.
- No mobile app. The browser UI only needs to work in a normal desktop
  browser.

## 4. Constraints (carried over into every later decision)

- **Language**: plain modern ECMAScript (ESM modules). No TypeScript, no
  framework (no React/Vue/Angular/etc.), no build framework unless a later
  decision explicitly justifies one.
- **Dependencies**: as few as possible. Only technical/mathematical utility
  libraries are allowed (e.g. noise functions, geometry/triangulation,
  vector/matrix math). Every dependency must earn its place — if it can be
  written simply and clearly in-house, prefer that instead.
- **Versions**: every dependency is pinned to an exact version (no `^`, no
  `~`). Upgrades are a deliberate, reviewed step, not an accident of `npm
  install`.
- **Style**: code and docs use plain, simple words. Prefer clarity over
  cleverness. A reader who is not a native English speaker should still find
  it easy to follow.
- **Portability**: the generation logic itself (terrain, roads, parcels,
  buildings, 3D→2D projection) must run unchanged in Node and in the browser.
  Only rendering/output differs by environment (see
  [ARCHITECTURE.md](./ARCHITECTURE.md)).

## 5. Current status

Scaffold stage. Folder layout and documentation only — no generation logic
yet. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the module layout and data
contracts each piece will follow once implementation starts.

## 6. Phased plan

Each phase should end with something that can be looked at or checked, even
if rough.

| Phase | Name | Output |
|---|---|---|
| 0 | Scaffold | Folder layout, docs, empty module stubs (this phase). |
| 1 | Core data model | Shared types/shapes used by every later module: grid, graph, polygon, and the city-model object that gets passed between stages. No generation yet, just the containers. |
| 2 | Terrain | A heightmap for the city area (hills, flat ground, maybe a river/coastline), from a seed. |
| 3 | Road network | A graph of streets laid over the terrain: a small number of main roads, then a filled-in grid/organic network of minor streets, blocked by terrain where needed. |
| 4 | Parcels & blocks | The area between streets is split into blocks, and blocks into parcels (individual building lots). |
| 5 | Buildings (3D massing) | Each parcel gets a simple building volume: footprint plus height, maybe a basic roof shape. This is the last step of the 3D model. |
| 6 | 3D preview (browser) | A minimal WebGL viewer that shows the generated 3D model (terrain + roads + building blocks), so the generator's output can be sanity-checked visually. Browser-only; not the final deliverable. |
| 7 | Projection (3D → 2D) | Flatten the 3D city model into a 2D map description: road lines with widths, block/parcel outlines, building footprints with a fill derived from height or type. |
| 8 | 2D map rendering | Turn the flattened 2D description into an actual map: colors, line weights, a simple legend/style. Must work both as a file written from Node and as an on-screen result in the browser. |
| 9 | UI & CLI polish | Simple browser form (seed + a few parameters + "generate" button) around phase 8's output, and an equivalent Node CLI entry point. Export to a file (e.g. SVG/PNG) from either side. |
| 10 | Tuning pass | No new features — revisit parameters and defaults so generated cities look good across a range of seeds. |

Phases are meant to be done roughly in order, but a phase can be revisited
once a later phase reveals its output isn't quite the right shape.

## 7. Success criteria

- Given only a seed (and optionally a handful of parameters), the tool
  produces a 2D city map that looks like a plausible, readable city layout.
- The exact same core generation code runs from a Node script and from a
  browser page, with no duplicated logic.
- The dependency list stays short, and every dependency in it is a
  math/geometry utility, pinned to an exact version.
- Someone unfamiliar with the project can read `docs/ARCHITECTURE.md`, open
  any module, and understand what it takes in and what it hands back.

## 8. Open questions

These are flagged rather than decided, and should be settled before or during
the phase that needs them:

- **Output format for the final 2D map**: SVG (vector, resolution independent,
  trivial to write from Node as a string) vs. Canvas/PNG (raster). Current
  lean is SVG — see [ARCHITECTURE.md](./ARCHITECTURE.md#rendering) for the
  reasoning — but this should be confirmed before phase 8.
- **Browser dependency delivery**: how npm packages reach the browser without
  a bundler (import maps vs. a small dev-only build step). See
  [ARCHITECTURE.md](./ARCHITECTURE.md#dependency-delivery).
- **Scale/extent**: is a "city" a fixed-size area, or does size scale with a
  parameter? Affects how terrain and road generation are parameterized.
  Decide by phase 2.
- **Determinism**: same seed must always produce the same city. This needs a
  single seeded random source shared by every module (no use of the platform
  `Math.random`). Decide the exact seeded-RNG approach by phase 1.
