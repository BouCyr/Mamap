import { createRandom } from '../random/index.js';

// The bundle that travels through the whole pipeline: the seed and
// parameters a city was generated from, plus the one seeded random source
// every stage shares (see docs/ARCHITECTURE.md, section 3). Later stages
// extend this object with their own output as the pipeline runs.

/**
 * @param {number} seed
 * @param {object} [params]
 */
export function createCityModel(seed, params = {}) {
  return {
    seed,
    params,
    random: createRandom(seed),
  };
}
