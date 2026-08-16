import type { ProjectileState, ShotInput, Vec2 } from './types';

export const WORLD_GRAVITY = 430;
export const FIXED_DT = 1 / 120;

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function createProjectile(owner: 0 | 1, input: ShotInput): ProjectileState {
  const angle = degreesToRadians(input.angleDeg);
  const speed = input.muzzleVelocity * clamp(input.power, 0.1, 1);

  return {
    owner,
    position: { ...input.origin },
    velocity: {
      x: Math.cos(angle) * speed * input.direction,
      y: -Math.sin(angle) * speed,
    },
    profile: input.profile,
    alive: true,
    ageSeconds: 0,
    behavior: input.behavior ?? 'standard',
    behaviorTriggered: false,
    terrainPiercesRemaining: input.behavior === 'piercing' ? 1 : 0,
  };
}

export function stepProjectile(
  projectile: ProjectileState,
  dt: number,
  windAcceleration: number,
  gravityMultiplier = 1,
): void {
  if (!projectile.alive) return;

  projectile.velocity.x += windAcceleration * projectile.profile.windFactor * dt;
  projectile.velocity.y += WORLD_GRAVITY * projectile.profile.gravityScale * gravityMultiplier * dt;
  if (projectile.behavior === 'scatter-at-apex' && !projectile.behaviorTriggered && projectile.velocity.y >= 0) {
    projectile.velocity.x += projectile.velocity.x >= 0 ? 34 : -34;
    projectile.behaviorTriggered = true;
  }
  projectile.position.x += projectile.velocity.x * dt;
  projectile.position.y += projectile.velocity.y * dt;
  projectile.ageSeconds += dt;
}

export function predictTrajectory(
  input: ShotInput,
  windAcceleration: number,
  seconds = 5,
  sampleEvery = 8,
  gravityMultiplier = 1,
): Vec2[] {
  const projectile = createProjectile(0, input);
  const points: Vec2[] = [];
  const steps = Math.ceil(seconds / FIXED_DT);

  for (let index = 0; index < steps; index += 1) {
    stepProjectile(projectile, FIXED_DT, windAcceleration, gravityMultiplier);
    if (index % sampleEvery === 0) points.push({ ...projectile.position });
  }

  return points;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
