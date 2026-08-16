import Phaser from 'phaser';
import type { MachineState } from '../core/types';
import { MACHINES } from '../data/catalog';

export function drawMachine(graphics: Phaser.GameObjects.Graphics, machine: MachineState, active: boolean, slopeRadians = 0): void {
  const def = MACHINES[machine.machineId];
  const x = machine.x;
  const y = machine.y;
  const facing = machine.facing;

  graphics.save();
  graphics.translateCanvas(x, y);
  graphics.rotateCanvas(slopeRadians);

  const bodyColor = machine.playerId === 0 ? 0xb64d3b : 0x3c6ea8;
  const woodColor = 0x6f4b2c;
  const metalColor = 0xc3c5c7;
  const highlight = active ? 0xffe291 : 0xffffff;

  graphics.fillStyle(0x111111, 0.25);
  graphics.fillEllipse(0, 18, 72, 15);

  graphics.fillStyle(woodColor, 1);
  graphics.fillRoundedRect(-34, -4, 68, 22, 5);
  graphics.lineStyle(3, bodyColor, 1);
  graphics.strokeRoundedRect(-34, -4, 68, 22, 5);

  graphics.fillStyle(0x3e3428, 1);
  graphics.fillCircle(-22, 17, 10);
  graphics.fillCircle(22, 17, 10);
  graphics.lineStyle(3, metalColor, 0.8);
  graphics.strokeCircle(-22, 17, 10);
  graphics.strokeCircle(22, 17, 10);

  const angle = Phaser.Math.DegToRad(machine.angleDeg);
  const ux = Math.cos(angle) * facing;
  const uy = -Math.sin(angle);

  if (def.silhouette === 'crossbow') {
    graphics.lineStyle(7, woodColor, 1);
    graphics.lineBetween(-5, -4, ux * 34, uy * 34 - 4);
    graphics.lineStyle(5, bodyColor, 1);
    graphics.lineBetween(ux * 20 - uy * 20, uy * 20 + ux * 20 - 4, ux * 20 + uy * 20, uy * 20 - ux * 20 - 4);
  } else {
    graphics.lineStyle(def.silhouette === 'trebuchet' ? 8 : 6, woodColor, 1);
    graphics.lineBetween(0, -2, ux * 42, uy * 42 - 2);
    graphics.fillStyle(metalColor, 1);
    graphics.fillCircle(ux * 42, uy * 42 - 2, def.silhouette === 'trebuchet' ? 7 : 5);

    if (def.silhouette === 'trebuchet') {
      graphics.fillStyle(0x4b3a2a, 1);
      graphics.fillRect(-15, -40, 30, 9);
      graphics.fillStyle(0x272727, 1);
      graphics.fillRect(-11, -31, 22, 20);
    }
  }

  if (active) {
    graphics.lineStyle(2, highlight, 0.9);
    graphics.strokeCircle(0, 0, 43);
  }

  const hpRatio = machine.hp / def.maxHp;
  graphics.fillStyle(0x101010, 0.8);
  graphics.fillRect(-35, -43, 70, 7);
  graphics.fillStyle(hpRatio > 0.45 ? 0x6bc46d : 0xd06a4f, 1);
  graphics.fillRect(-34, -42, 68 * hpRatio, 5);

  graphics.restore();
}
