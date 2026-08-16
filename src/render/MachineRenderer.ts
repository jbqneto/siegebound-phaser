import Phaser from 'phaser';
import type { MachineState } from '../core/types';
import type { HeightmapTerrain } from '../core/terrain';
import { drawMachine } from './drawMachine';
import { BattleDepth } from './BattleDepth';

export interface MachineView {
  update(state: MachineState, active: boolean, slopeRadians: number): void;
  setVisible(visible: boolean): void;
  destroy(): void;
}

export class ProceduralMachineView implements MachineView {
  private readonly graphics: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) { this.graphics = scene.add.graphics().setDepth(BattleDepth.Machines); }
  update(state: MachineState, active: boolean, slopeRadians: number): void { this.graphics.clear(); drawMachine(this.graphics, state, active, slopeRadians); }
  setVisible(visible: boolean): void { this.graphics.setVisible(visible); }
  destroy(): void { this.graphics.destroy(); }
}

export class MachineRenderer {
  private readonly views: [MachineView, MachineView];
  constructor(scene: Phaser.Scene) { this.views = [new ProceduralMachineView(scene), new ProceduralMachineView(scene)]; }
  update(machines: [MachineState, MachineState], terrain: HeightmapTerrain, activePlayer: 0 | 1, visualContact: boolean, projectileActive: boolean): void {
    machines.forEach((machine) => {
      const sampleRadius = 28;
      const slope = Math.atan2(terrain.getHeightAt(machine.x + sampleRadius) - terrain.getHeightAt(machine.x - sampleRadius), sampleRadius * 2);
      const clampedSlope = Phaser.Math.Clamp(slope, -0.28, 0.28);
      const view = this.views[machine.playerId];
      view.setVisible(machine.playerId === activePlayer || visualContact);
      view.update(machine, machine.playerId === activePlayer && !projectileActive, clampedSlope);
    });
  }
}
