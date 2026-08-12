# Mamap — Architecture

This document describes how the codebase is organized, how a request to
generate a city moves through it, and the rules that keep the code portable
between Node and the browser. See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for
the overall goal and phased roadmap.

## 1. Two halves: `core` and everything else

The codebase splits cleanly into:

- **`src/core/`** — the generator itself. Pure computation: given a seed and
  parameters, produce a city model. No DOM, no `window`, no Node-only APIs
  (no `fs`, no `process`). This is what makes the same code run in Node and
  in a browser tab unchanged.
- **Everything around it** (`src/render/`, `src/cli/`, `src/web/`) — the
  environment-specific shell that calls `core`, and either shows the result
  on screen or writes it to a file.

If a piece of code needs to know whether it is running in Node or a browser,
it does not belong in `core`.

## 2. Pipeline and data contracts

`core` is a pipeline of stages. Each stage takes the previous stage's output
plus the shared seed/parameters, and returns a plain data structure — no
classes with hidden behaviour, no references to rendering. This keeps every
stage independently testable and lets a later stage be swapped without
touching earlier ones.

The map itself is a fixed 5000 × 5000 unit square (matching the final SVG's
dimensions — see section 4).

```
seed + params
    -> points     -> point set
    -> mesh       -> Voronoi diagram + site-adjacency graph  (uses point set)
    -> terrain    -> per-point elevation                     (uses mesh)
    -> sea-level  -> corrected elevation + underwater flag   (uses elevation)
    -> coastline  -> split site-adjacency edges + coastline  (uses mesh's site-adjacency graph + elevation)
    -> roads      -> street graph                            (uses mesh + elevation + underwater flag)
    -> parcels    -> block/lot polygons                      (uses street graph, mesh)
    -> buildings  -> building volumes                        (uses parcels + elevation)
    -> project    -> flattened 2D map description            (uses everything above)
```

Planned shape of each hand-off (exact fields will firm up in phase 1, but the
kind of object each stage produces should not change later):

- **points → point set**: locations covering the 5000 × 5000 map, built in
  two passes: 500 points from an even, minimum-spacing pass (Poisson-disk
  sampling), then 500 points from a plain random pass (no spacing rule) —
  1000 points total. The mix gives the mesh an even base plus some
  irregular variation.
- **mesh → Voronoi diagram + site-adjacency graph**: the Voronoi diagram of
  the point set, clipped to the map's bounds (so border cells are cut off
  cleanly instead of running to infinity), then cleaned up by collapsing
  any edge shorter than 20 units down to a single point. Building the
  diagram this way also gives the site-adjacency graph for free: which
  pairs of points are neighbors (their cells share a border). Later stages
  that compare elevation between two points use this graph — the Voronoi
  diagram's own corners and borders do not carry elevation, only the
  original points do.
- **terrain → per-point elevation**: an elevation value for every point in
  the mesh. Read from a height-map image supplied by the caller (converted
  to grayscale and normalized to 0–1) sampled at each point's position,
  then multiplied by a factor from Simplex noise remapped to the range
  0.8–1.2 (`elevation = heightMapValue * factor`). A correction pass then
  flattens any point that ended up as a strict local maximum or minimum
  among its neighbors (points connected by a surviving Voronoi edge —
  see `mesh` above), replacing it with the average of those neighbors'
  elevations, unless that point sits on the edge of the map.

  Decoding the height-map image file into raw pixel values is
  platform-specific (a `<canvas>` in the browser, an image-decoding utility
  in Node) and happens outside `core`. `core/terrain` itself only ever
  receives already-decoded grayscale data (a plain grid of 0–1 numbers), not
  an image file or a DOM `Image` object — this is what keeps it portable.
- **sea-level → corrected elevation + underwater flag**: takes a ratio
  parameter (33% by default, overridable) and the raw per-point elevation
  from `terrain`. The lowest-elevation points, by count, up to that ratio
  of the total point count, are marked underwater. Sea level is set to the
  highest elevation among those underwater points, then every point's
  elevation is shifted by that amount, so sea level always ends up at 0.
- **coastline → split site-adjacency edges + coastline edges**: checks
  every site-adjacency edge from `mesh` for a sign change in elevation
  between its two points (one above 0, one below). Each such edge is split
  at the point where it crosses 0, found by linear interpolation between
  the two points' elevations — this replaces the one edge with two, meeting
  at a new point with elevation exactly 0. Wherever two crossing points fall
  on the same Delaunay triangle (the triangle of three mutually neighboring
  points on that part of the mesh), a new edge connects them. The result is
  a continuous coastline, made up of these new edges, running everywhere
  land meets water — as an open curve where it reaches the map border, or a
  closed loop around an island or lake that does not.
- **roads → street graph**: nodes (mesh points, with elevation and the
  underwater flag) and edges (a road segment between two nodes, with a
  width/class: e.g. main road vs. minor street).
- **parcels → block/lot polygons**: closed polygons carved out of the space
  between road edges, each tagged with the block it belongs to. Whether this
  reuses the mesh's Voronoi cells directly is still open — see
  [PROJECT_PLAN.md](./PROJECT_PLAN.md#9-open-questions).
- **buildings → building volumes**: for each parcel, a footprint polygon, a
  height, and a simple roof description.
- **project → 2D map description**: plain lines, polygons, and fills in 2D
  map coordinates — everything the 2D renderer needs, with no 3D or terrain
  detail left in it. This is the boundary between `core` and rendering.

A city model is the bundle of every stage's output kept together (point set +
mesh + elevation + underwater flags + coastline + street graph + parcels +
buildings), plus the seed and parameters that made it. This bundle is what
phase 9's 3D preview reads from; the flattened 2D map description is a
derived, separate object, not a replacement for it.

## 3. Determinism

Every module that needs randomness takes a seeded random source as an
argument — it never reaches for `Math.random()` directly. The only inputs
that can change a generated city are the seed and the supplied height-map
image: the same seed with the same height-map image always produces the
same city, with nothing else feeding in randomness anywhere in the
pipeline. The seeded-RNG choice itself is a small, self-contained utility
(arguably the one piece of "randomness math" simple enough to write
in-house rather than pull in as a dependency); this gets settled in phase 1.

## 4. Rendering

Two separate renderers consume `core`'s output, for two separate purposes:

- **`src/render/two-d/`** — turns the flattened 2D map description into the
  actual map. This is the final deliverable and must work in both
  environments:
  - In the browser: draw into the page (e.g. build an `<svg>` and attach it,
    or draw into a `<canvas>`).
  - In Node: produce the same description as a string/file (e.g. an `.svg`
    file), with no DOM involved.

  Decided: emit an **SVG**, sized 5000 × 5000 to match the map extent.
  Building an SVG is just assembling elements/strings — no image encoding,
  no native dependency — so the exact same builder code can either
  serialize to a file (Node) or be attached live to a page (browser). This
  avoids needing a raster/canvas dependency at all. PNG export, if wanted
  later, can be a "take the SVG, rasterize it" post-step rather than a
  second renderer.

- **`src/render/three-d/`** — the optional 3D preview from phase 9. Browser
  only (needs a `<canvas>` and a WebGL context; there is nothing to preview
  onto in Node). Uses raw WebGL, not a 3D engine library, to stay in line
  with the "no framework" rule. In Node, this module is simply never
  imported.

Rendering code reads the city model; it never mutates it and never invents
data the earlier pipeline stages should have produced (e.g. the 2D renderer
should not be deciding building heights — that is `buildings`' job).

## 5. Running it: Node and browser entry points

- **`src/cli/`** — a small Node entry point. Takes parameters (seed, size,
  etc.), runs the `core` pipeline, runs `render/two-d` in its Node mode, and
  writes the result to a file. This is the "server-side" way to run the
  generator — no UI, no browser required.
- **`src/web/`** — a small browser page: a form for the seed/parameters, a
  "generate" button, and a spot to show the result. Calls the exact same
  `core` pipeline (imported as an ES module) and the same `render/two-d`
  code, just in its browser mode. May optionally offer the phase 9 3D
  preview alongside the 2D result.

Neither entry point contains generation logic of its own — they only wire
parameters in and rendered output out.

## 6. Dependency policy

- Only technical/mathematical utility libraries are allowed as dependencies
  (noise generation, geometry/triangulation helpers, vector/matrix math).
  No UI frameworks, no state-management libraries, no CSS frameworks.
- Every dependency is pinned to an exact version in `package.json` (no `^`
  or `~` ranges). Bumping a version is a deliberate, separate change.
- Before adding any dependency, check whether the need is small enough to
  write directly (a few dozen lines of clear code beats a dependency for
  something like "compute a 2D cross product").
- Categories identified so far (no exact libraries chosen yet — this is a
  note for whoever implements the matching phase, not a commitment):
  - **Point sampling** (phase 2, points): needed — Poisson-disk sampling for
    the even pass over the map.
  - **Triangulation / Voronoi** (phase 2, mesh): needed — building a bounded
    Voronoi diagram from the point set.
  - **Noise** (phase 3, terrain): needed — Simplex noise, used as a
    multiplying factor on the height-map value at each point.
  - **Image decoding** (phase 3, terrain, Node side only): needed in the
    Node-side adapter that reads the height-map image file into raw pixel
    values (see section 2) — not needed in the browser, which can decode
    images with a `<canvas>` and no extra dependency.
  - **Vector/matrix math** (phase 8/9): 3D vector, matrix, and quaternion
    helpers for building volumes and the WebGL preview camera.
  Each will be picked, justified in a short note, and pinned when its phase
  actually starts.

## 7. Dependency delivery (browser)

Plain ESM `import` statements with bare specifiers (e.g. `import x from
"some-package"`) do not resolve in a browser without help — browsers only
understand relative/absolute URLs in `import`. Two ways to keep this
framework-free:

- **Import maps**: an `<script type="importmap">` in `src/web/` that maps
  each bare specifier to a URL (a local vendored copy of that exact pinned
  version). No build step, no bundler dependency — just a small JSON map
  kept in sync with `package.json`'s pinned versions.
- **Dev-only bundling** (fallback if import maps prove awkward for a given
  library): a build tool (e.g. esbuild) used purely as a local dev
  command to produce a single bundled file for the browser. This would be a
  dev dependency, not a runtime one, and does not change how `core` itself
  is written.

Current lean is import maps, since it needs no extra tool at all. This should
be confirmed once phase 2 or 3 actually picks a first real dependency and we
see how well it works in practice.

## 8. Folder layout

```
docs/                   Project plan and this document.
src/
  core/                 Pure generation logic. Node- and browser-safe.
    points/             Phase 2: point-set generation (Poisson-disk + random passes). Not yet scaffolded.
    mesh/               Phase 2: Voronoi diagram + site-adjacency graph, short-edge collapse. Not yet scaffolded.
    terrain/            Phase 3: per-point elevation from a height-map image + noise, with local max/min correction.
    sea-level/          Phase 4: underwater flag + elevation shift so sea level sits at 0. Not yet scaffolded.
    coastline/          Phase 5: split edges + new edges forming the coastline at elevation 0. Not yet scaffolded.
    roads/              Phase 6: street graph generation.
    parcels/            Phase 7: block/lot polygon generation.
    buildings/          Phase 8: building volume generation.
    project/            Phase 10: flatten the 3D city model to a 2D map description.
    index.js            Wires the stages above into one pipeline function.
  render/
    two-d/              Phase 11: draw the flattened 2D map (5000 x 5000 SVG). Node- and browser-safe.
    three-d/             Phase 9: optional WebGL preview of the 3D city model. Browser-only.
  cli/                  Phase 12: Node command-line entry point.
  web/                  Phase 12: browser page/UI entry point.
test/                   Tests, mirroring the src/ layout.
```

`points/`, `mesh/`, `sea-level/`, and `coastline/` are new since those
stages were decided; they are not yet created (see phase 0's scaffold — it
predates these decisions). They will be added, as empty stubs like their
siblings, at the start of their phase.

## 9. Coding conventions

- ES modules everywhere (`"type": "module"` in `package.json`); no
  CommonJS (`require`/`module.exports`).
- Plain JavaScript, no TypeScript. Where a shape is worth documenting, use a
  short JSDoc comment above the function, not a type-checked build step.
- Prefer small, named, pure functions per file over large multi-purpose
  ones. A module's `index.js` is its public entry point; anything else in
  that folder is an implementation detail it can change freely.
- Comments explain *why*, not *what* — skip comments that just restate what
  the code already says through clear naming.
- Plain, simple wording in code, comments, and docs (see
  [PROJECT_PLAN.md](./PROJECT_PLAN.md#4-constraints-carried-over-into-every-later-decision)).
