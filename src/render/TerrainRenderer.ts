import Phaser from 'phaser';
import type { HeightmapTerrain } from '../core/terrain';
import { BattleDepth } from './BattleDepth';

export class TerrainRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private revision = -1;

  constructor(scene: Phaser.Scene, private readonly width: number, private readonly height: number) {
    this.graphics = scene.add.graphics().setDepth(BattleDepth.Terrain);
  }

  invalidate(): void { this.revision = -1; }

  update(terrain: HeightmapTerrain, groundColor: number): boolean {
    if (terrain.revision === this.revision) return false;
    this.revision = terrain.revision;
    const g = this.graphics;
    g.clear().fillStyle(0x29241f, 1).beginPath().moveTo(0, this.height).lineTo(0, terrain.getHeightAt(0));
    for (let x = 0; x <= this.width; x += 4) g.lineTo(x, terrain.getHeightAt(x));
    g.lineTo(this.width, this.height).closePath().fillPath();
    g.fillStyle(groundColor, 0.55);
    for (let x = 24; x < this.width; x += 73) {
      const y = terrain.getHeightAt(x) + 28 + ((x * 17) % 90);
      g.fillEllipse(x, y, 18, 7);
    }
    g.lineStyle(10, 0x4e3b2a, 0.42);
    for (let x = 0; x < this.width - 80; x += 150) g.lineBetween(x, terrain.getHeightAt(x) + 65, x + 90, terrain.getHeightAt(x + 90) + 70);
    g.lineStyle(5, 0x7f8f4c, 1).beginPath().moveTo(0, terrain.getHeightAt(0) - 1);
    for (let x = 0; x <= this.width; x += 4) g.lineTo(x, terrain.getHeightAt(x) - 1);
    g.strokePath();
    g.lineStyle(2, 0xb2bd70, 0.8).strokePath();
    return true;
  }
}
