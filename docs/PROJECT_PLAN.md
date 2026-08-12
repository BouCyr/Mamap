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
| 1 | Core data model | Shared types/shapes used by every later module: point, edge, cell/polygon, and the city-model object that gets passed between stages. No generation yet, just the containers. |
| 2 | Point mesh | 500 points from an even, minimum-spacing pass (Poisson-disk sampling), plus 500 points from a plain random pass (1000 points total). A Voronoi diagram is then built from those points and clipped to the map's bounds. A cleanup pass collapses any diagram edge shorter than 20 units down to a single point. |
| 3 | Terrain / elevation | An elevation value for every point in the mesh. Read from a height-map image supplied by the caller (converted to grayscale and normalized to 0–1), sampled at each point's position, then multiplied by a Simplex-noise factor in the range 0.8–1.2. A correction pass then flattens any point that ended up as a strict local maximum or minimum among its Voronoi-edge neighbors (set to the average of those neighbors' elevations), unless that point sits on the edge of the map. |
| 4 | Sea level | Given a ratio (33% by default, overridable by a parameter), the lowest-elevation ratio of points, by count, are marked underwater. Sea level is set to the highest elevation among those underwater points. Every point's elevation is then shifted by that amount, so sea level sits at 0. |
| 5 | Coastline | The mesh's site-adjacency edges (pairs of neighboring points) are checked for a sign change in elevation. Any such edge is split at the point where it crosses 0. New edges then connect crossing points that share a triangle, linking them into a continuous coastline wherever land meets water. |
| 6 | Road network | A graph of streets laid over the mesh: a small number of main roads, then a filled-in grid/organic network of minor streets, blocked by terrain (and water) where needed. |
| 7 | Parcels & blocks | The area between streets is split into blocks, and blocks into parcels (individual building lots). |
| 8 | Buildings (3D massing) | Each parcel gets a simple building volume: footprint plus height, maybe a basic roof shape. This is the last step of the 3D model. |
| 9 | Projection (3D → 2D) | Flatten the 3D city model into a 2D map description: road lines with widths, block/parcel outlines, building footprints with a fill derived from height or type. |
| 10 | 2D map rendering | Turn the flattened 2D description into the final 5000 × 5000 SVG map: colors, line weights, a simple legend/style. Built first as a file written from Node; the on-screen, in-browser version comes with phase 13. |
| 11 | CLI | A Node command-line entry point: takes parameters (seed, height-map image path, ratio, ...), runs the full pipeline, and writes the SVG to a file. This is the first fully working, end-to-end deliverable. |
| 12 | 3D preview (browser) | A minimal WebGL viewer that shows the generated 3D model (terrain + roads + building blocks), so the generator's output can be sanity-checked visually. Browser-only; not the final deliverable; deferred until phase 11 works. |
| 13 | Web UI | A simple browser form (seed + a few parameters + "generate" button) around phase 10's SVG output, shown on screen instead of (or as well as) written to a file. |
| 14 | Tuning pass | No new features — revisit parameters and defaults so generated cities look good across a range of seeds. |

Phases are meant to be done roughly in order, but a phase can be revisited
once a later phase reveals its output isn't quite the right shape.

**Node/server first**: phases 1–11 are the priority path and require no
browser at all — a working Node CLI that turns a seed and a height-map
image into an SVG file is the first real milestone. Phases 12 (3D preview)
and 13 (web UI) are both browser-only and are deferred until that path
works end-to-end.

## 7. Success criteria

- Given only a seed (and optionally a handful of parameters), the tool
  produces a 2D city map that looks like a plausible, readable city layout.
- The exact same core generation code runs from a Node script and from a
  browser page, with no duplicated logic.
- The dependency list stays short, and every dependency in it is a
  math/geometry utility, pinned to an exact version.
- Someone unfamiliar with the project can read `docs/ARCHITECTURE.md`, open
  any module, and understand what it takes in and what it hands back.

## 8. Decisions made so far

- **Map extent**: fixed at 5000 × 5000 units. It does not scale with a
  parameter (for now).
- **Output format for the final 2D map**: SVG, sized 5000 × 5000 to match the
  map extent. See [ARCHITECTURE.md](./ARCHITECTURE.md#4-rendering) for the
  reasoning.
- **Point mesh approach**: a bounded Voronoi diagram over a mix of
  Poisson-disk and plain-random points is the shared spatial structure that
  terrain (and later, roads and parcels) is built on. See
  [ARCHITECTURE.md](./ARCHITECTURE.md#2-pipeline-and-data-contracts).
- **Point mesh density**: 500 points from the Poisson-disk pass, 500 points
  from the plain-random pass — 1000 points total over the 5000 × 5000 map.
  The Poisson-disk pass's minimum-spacing value follows from that target
  count and the map area; it is not a separate setting.
- **Edge-collapse threshold**: 20 units. Any Voronoi edge shorter than that
  collapses to a single point.
- **Height-map image source**: supplied by the caller as an actual image
  file/parameter to the generation request. It is not generated
  procedurally and not picked from a bundled set — "any image" in the
  terrain data contract means "whichever image you give it".
- **Elevation noise**: Simplex noise, used as a multiplier on the height-map
  value rather than added on top of it. The noise is remapped to the range
  0.8–1.2, so `elevation = heightMapValue * factor`.
- **Local max/min correction**: "neighbor" means points connected by a
  surviving Voronoi edge (the mesh's site-adjacency graph). A flattened
  point's new elevation is the average of its neighbors' elevations.
- **Sea-level ratio**: defaults to 33%, and can be overridden by a
  parameter on the generation request.
- **Determinism**: the whole pipeline is pseudo-random, driven only by the
  seed and the supplied height-map image — no other hidden source of
  randomness anywhere in the pipeline. The same seed with the same
  height-map image always produces the same city.
- **Implementation priority**: get the Node/CLI path (phases 1–11) fully
  working end-to-end — seed and height-map image in, SVG file out — before
  starting the browser-only phases (12: 3D preview, 13: web UI).

## 9. Open questions

These are flagged rather than decided, and should be settled before or during
the phase that needs them:

- **How later phases use the mesh and coastline**: does a Voronoi cell
  become a parcel? Does a Voronoi edge become a candidate road? Does an
  underwater point mean its whole Voronoi cell is water? Does the
  coastline block roads and parcels, or do roads cross it with a bridge?
  Not yet decided — will be settled when phases 6–7 start.
- **Browser dependency delivery**: how npm packages reach the browser without
  a bundler (import maps vs. a small dev-only build step). See
  [ARCHITECTURE.md](./ARCHITECTURE.md#7-dependency-delivery-browser).
