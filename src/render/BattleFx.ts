import Phaser from 'phaser';
import type { ImpactEvent } from '../game/GameModel';
import { BattleDepth } from './BattleDepth';

interface Debris { x: number; y: number; vx: number; vy: number; age: number; }

export class BattleFx {
  readonly graphics: Phaser.GameObjects.Graphics;
  private impact: ImpactEvent | null = null;
  private impactAge = 1;
  private debris: Debris[] = [];
  constructor(scene: Phaser.Scene) { this.graphics = scene.add.graphics().setDepth(BattleDepth.Effects); }
  showImpact(impact: ImpactEvent): void {
    this.impact = { ...impact };
    this.impactAge = 0;
    this.debris = Array.from({ length: 12 }, (_, i) => ({ x: impact.x, y: impact.y, vx: ((i * 47) % 90) - 45, vy: -35 - ((i * 29) % 70), age: 0 }));
  }
  update(deltaSeconds: number): void {
    this.impactAge += deltaSeconds;
    this.debris.forEach((p) => { p.age += deltaSeconds; p.x += p.vx * deltaSeconds; p.y += p.vy * deltaSeconds; p.vy += 170 * deltaSeconds; });
    this.debris = this.debris.filter((p) => p.age < 0.8);
    const g = this.graphics.clear();
    this.debris.forEach((p) => g.fillStyle(0x8d6947, 1 - p.age / 0.8).fillCircle(p.x, p.y, 2.5));
    if (!this.impact || this.impactAge > 0.45) return;
    const progress = this.impactAge / 0.45;
    g.fillStyle(0xffd25c, 0.65 * (1 - progress)).fillCircle(this.impact.x, this.impact.y, this.impact.radius * (0.45 + progress));
    g.lineStyle(3, 0xffffff, 1 - progress).strokeCircle(this.impact.x, this.impact.y, this.impact.radius * (0.8 + progress));
  }
}
