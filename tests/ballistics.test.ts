import { describe, expect, it } from 'vitest';
import { createProjectile, FIXED_DT, stepProjectile } from '../src/core/ballistics';
import { MACHINES, WEAPONS } from '../src/data/catalog';

function simulate() {
  const def = MACHINES.onager;
  const projectile = createProjectile(0, {
    origin: { x: 100, y: 400 },
    angleDeg: 52,
    power: 0.72,
    direction: 1,
    muzzleVelocity: def.muzzleVelocity,
    profile: def.projectile,
  });

  for (let i = 0; i < 240; i += 1) stepProjectile(projectile, FIXED_DT, -18.5);
  return projectile;
}

describe('ballistics', () => {
  it('is deterministic for identical initial conditions', () => {
    expect(simulate()).toEqual(simulate());
  });

  it('moves a right-facing shot forward', () => {
    expect(simulate().position.x).toBeGreaterThan(100);
  });

  it('applies reusable scatter behavior at the apex', () => {
    const def = WEAPONS['onager-stone-cluster'];
    const projectile = createProjectile(0, {
      origin: { x: 100, y: 400 },
      angleDeg: 52,
      power: 0.72,
      direction: 1,
      muzzleVelocity: MACHINES.onager.muzzleVelocity,
      profile: def.profile,
      behavior: def.behavior,
    });
    for (let i = 0; i < 240; i += 1) stepProjectile(projectile, FIXED_DT, 0);
    expect(projectile.behaviorTriggered).toBe(true);
  });

  it('defines three distinct weapon roles for every machine', () => {
    for (const machine of Object.values(MACHINES)) {
      const ids = Object.values(machine.weaponIds);
      expect(new Set(ids).size).toBe(3);
      expect(ids.every((id) => WEAPONS[id].machineId === machine.id)).toBe(true);
    }
  });
});
