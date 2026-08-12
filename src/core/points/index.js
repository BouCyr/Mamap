import PoissonDiskSampling from 'poisson-disk-sampling';
import { createPoint } from '../model/point.js';
import { MAP_SIZE } from '../model/constants.js';

const POISSON_COUNT = 500;
const RANDOM_COUNT = 500;

// Spacing tuned low enough that the sampler reliably produces more than
// POISSON_COUNT points; the result is then trimmed down to exactly that
// many, so the target count from docs/PROJECT_PLAN.md is met exactly
// regardless of how the packing happens to fill in for a given seed.
const AREA = MAP_SIZE * MAP_SIZE;
const MIN_DISTANCE = Math.sqrt(AREA / POISSON_COUNT) * 0.55;

/**
 * @param {{random: () => number}} cityModel
 */
export function createPoints(cityModel) {
  const { random } = cityModel;

  const sampler = new PoissonDiskSampling(
    {
      shape: [MAP_SIZE, MAP_SIZE],
      minDistance: MIN_DISTANCE,
      maxDistance: MIN_DISTANCE * 2,
      tries: 20,
    },
    random,
  );
  const poissonPoints = sampler
    .fill()
    .slice(0, POISSON_COUNT)
    .map(([x, y]) => createPoint(x, y));

  const randomPoints = [];
  for (let i = 0; i < RANDOM_COUNT; i++) {
    randomPoints.push(createPoint(random() * MAP_SIZE, random() * MAP_SIZE));
  }

  return [...poissonPoints, ...randomPoints];
}
