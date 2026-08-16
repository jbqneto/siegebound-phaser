import Phaser from 'phaser';
import type { EraDefinition, StageDefinition } from '../core/types';
import { BattleDepth } from './BattleDepth';

export interface BackgroundLayerDefinition {
  id: string;
  depth: BattleDepth;
  scrollFactorX: number;
  scrollFactorY?: number;
  alpha: number;
  color: number;
  kind: 'sky' | 'hills' | 'castle' | 'forest';
}

const DEFAULT_LAYERS: BackgroundLayerDefinition[] = [
  { id: 'sky', depth: BattleDepth.Sky, scrollFactorX: 0, alpha: 1, color: 0, kind: 'sky' },
  { id: 'distant-landscape', depth: BattleDepth.DistantLandscape, scrollFactorX: 0.08, alpha: 0.18, color: 0x263945, kind: 'hills' },
  { id: 'castle', depth: BattleDepth.Architecture, scrollFactorX: 0.14, alpha: 0.2, color: 0x25292b, kind: 'castle' },
];

const FOREST_LAYERS: BackgroundLayerDefinition[] = [
  ...DEFAULT_LAYERS,
  { id: 'forest-far', depth: BattleDepth.FarVegetation, scrollFactorX: 0.22, alpha: 0.25, color: 0x34483c, kind: 'forest' },
  { id: 'forest-near', depth: BattleDepth.NearVegetation, scrollFactorX: 0.38, alpha: 0.4, color: 0x26382d, kind: 'forest' },
];

export class BattleBackdrop {
  private layers: Phaser.GameObjects.Graphics[] = [];

  constructor(private readonly scene: Phaser.Scene, private readonly width: number, private readonly height: number) {}

  rebuild(stage: StageDefinition, era: EraDefinition): void {
    this.destroy();
    const definitions = stage.backgroundPreset === 'high-medieval-forest' ? FOREST_LAYERS : DEFAULT_LAYERS;
    this.layers = definitions.map((definition) => this.createLayer(definition, era));
  }

  destroy(): void {
    this.layers.forEach((layer) => layer.destroy());
    this.layers = [];
  }

  private createLayer(definition: BackgroundLayerDefinition, era: EraDefinition): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics().setDepth(definition.depth).setScrollFactor(definition.scrollFactorX, definition.scrollFactorY ?? 0);
    if (definition.kind === 'sky') {
      g.fillGradientStyle(era.skyTop, era.skyTop, era.skyBottom, era.skyBottom, 1).fillRect(0, 0, this.width, this.height);
    } else if (definition.kind === 'hills') {
      g.fillStyle(definition.color, definition.alpha).fillTriangle(0, 530, 350, 270, 720, 530).fillTriangle(850, 530, 1320, 300, 1800, 530);
    } else if (definition.kind === 'castle') {
      g.fillStyle(definition.color, definition.alpha).fillRect(790, 370, 210, 160).fillRect(820, 325, 48, 205).fillRect(920, 340, 45, 190);
    } else {
      g.fillStyle(definition.color, definition.alpha);
      const base = definition.id === 'forest-near' ? 555 : 525;
      for (let x = -30; x < this.width + 50; x += definition.id === 'forest-near' ? 75 : 55) g.fillTriangle(x, base, x + 32, base - 90 - (x % 35), x + 65, base);
    }
    return g;
  }
}
