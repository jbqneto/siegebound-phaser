import Phaser from 'phaser';
import { FIXED_DT } from '../core/ballistics';
import type { ProjectileState, Vec2 } from '../core/types';
import { BattleDepth } from './BattleDepth';

export class ProjectileRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private trail: Vec2[] = [];
  constructor(scene: Phaser.Scene) { this.graphics = scene.add.graphics().setDepth(BattleDepth.Projectile); }
  resetTrail(): void { this.trail = []; }
  update(projectile: ProjectileState | null): void {
    const g = this.graphics.clear();
    if (!projectile) return;
    this.trail.push({ ...projectile.position });
    if (this.trail.length > 26) this.trail.shift();
    this.trail.forEach((point, index) => g.fillStyle(0xffd88a, ((index + 1) / this.trail.length) * 0.42).fillCircle(point.x, point.y, 2 + index / 18));
    const p = projectile.position;
    g.fillStyle(0x1e1e1e, 1).fillCircle(p.x, p.y, projectile.profile.radius);
    g.lineStyle(5, 0xfff0b0, 0.28).strokeCircle(p.x, p.y, projectile.profile.radius + 5);
    g.lineStyle(3, 0xffd88a, 0.35).lineBetween(p.x, p.y, p.x - projectile.velocity.x * FIXED_DT * 5, p.y - projectile.velocity.y * FIXED_DT * 5);
  }
}
