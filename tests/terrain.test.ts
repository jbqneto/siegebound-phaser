import { describe, expect, it } from 'vitest';
import { HeightmapTerrain } from '../src/core/terrain';

describe('heightmap terrain', () => {
  it('carves a crater downward around the impact', () => {
    const terrain = new HeightmapTerrain(400, 300, 123);
    const x = 200;
    const before = terrain.getHeightAt(x);
    terrain.carveCrater(x, before, 35);
    const after = terrain.getHeightAt(x);
    expect(after).toBeGreaterThan(before);
  });
});
