// Terrain stage (see docs/PROJECT_PLAN.md, phase 3).
//
// Takes the point mesh (see core/mesh) and returns an elevation value for
// every point: read from a height-map image (already decoded to grayscale,
// normalized 0-1) plus added noise, then corrected so no interior point is
// a strict local maximum or minimum among its mesh neighbors.
//
// Not implemented yet. See docs/ARCHITECTURE.md, section 2, for the exact
// data contract this stage is expected to produce.

export {};
