import Phaser from 'phaser';
import { MACHINES } from '../data/catalog';
import type { GameModel } from '../game/GameModel';

const PLAYER_COLORS = [0xb64d3b, 0x3c6ea8] as const;

export class Hud {
  private readonly scene: Phaser.Scene;
  private readonly chrome: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly info: Phaser.GameObjects.Text;
  private readonly help: Phaser.GameObjects.Text;
  private readonly chargeBar: Phaser.GameObjects.Graphics;
  private readonly chargeLabel: Phaser.GameObjects.Text;
  private readonly turnLabel: Phaser.GameObjects.Text;
  private readonly conditionLabel: Phaser.GameObjects.Text;
  private readonly machineReadout: Phaser.GameObjects.Text;
  private readonly queueReadout: Phaser.GameObjects.Text;
  private readonly windDial: Phaser.GameObjects.Graphics;
  private readonly radar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.chrome = scene.add.graphics().setDepth(18).setScrollFactor(0);

    this.title = scene.add.text(34, 22, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '23px',
      color: '#fff4d6',
      stroke: '#111820',
      strokeThickness: 4,
    }).setDepth(20).setScrollFactor(0);

    this.info = scene.add.text(34, 53, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#dce9f2',
      stroke: '#111820',
      strokeThickness: 3,
      lineSpacing: 2,
    }).setDepth(20).setScrollFactor(0);

    this.turnLabel = scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#fff4d6',
      stroke: '#111820',
      strokeThickness: 4,
    }).setDepth(20).setScrollFactor(0);

    this.conditionLabel = scene.add.text(330, 74, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#dce9f2',
      stroke: '#111820',
      strokeThickness: 3,
    }).setDepth(20).setScrollFactor(0);

    this.chargeLabel = scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#fff4d6',
      stroke: '#111820',
      strokeThickness: 3,
    }).setDepth(20).setScrollFactor(0);

    this.machineReadout = scene.add.text(34, 0, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#fff4d6',
      stroke: '#111820',
      strokeThickness: 3,
    }).setDepth(20).setScrollFactor(0);

    this.queueReadout = scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#dce9f2',
      stroke: '#111820',
      strokeThickness: 3,
    }).setDepth(20).setScrollFactor(0);

    this.chargeBar = scene.add.graphics().setDepth(20).setScrollFactor(0);
    this.windDial = scene.add.graphics().setDepth(20).setScrollFactor(0);
    this.radar = scene.add.graphics().setDepth(19).setScrollFactor(0);

    this.help = scene.add.text(34, 690, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#dce9f2',
      stroke: '#111820',
      strokeThickness: 3,
    }).setDepth(20).setScrollFactor(0);
  }

  update(model: GameModel, predictionEnabled: boolean, visualContact: boolean): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const machine = model.currentMachine;
    const def = MACHINES[machine.machineId];
    const weapon = model.currentWeapon;
    const activeColor = PLAYER_COLORS[model.activePlayer];
    const chargePercent = Math.round(machine.power * 100);

    this.chrome.clear();
    this.chrome.fillStyle(0x101820, 0.9);
    this.chrome.fillRoundedRect(18, 12, width - 36, 86, 8);
    this.chrome.fillStyle(activeColor, 0.95);
    this.chrome.fillRect(18, 12, 7, 86);
    this.chrome.lineStyle(2, 0xdbe7ed, 0.28);
    this.chrome.strokeRoundedRect(18, 12, width - 36, 86, 8);

    const bottomY = height - 132;
    this.chrome.fillStyle(0x101820, 0.94);
    this.chrome.fillRoundedRect(18, bottomY, width - 36, 114, 8);
    this.chrome.lineStyle(2, 0xdbe7ed, 0.28);
    this.chrome.strokeRoundedRect(18, bottomY, width - 36, 114, 8);
    this.chrome.lineStyle(1, 0xdbe7ed, 0.18);
    this.chrome.lineBetween(260, bottomY + 12, 260, height - 30);
    this.chrome.lineBetween(width - 270, bottomY + 12, width - 270, height - 30);

    this.title.setText(`${model.stage.name}  ·  ${model.era.name}`);
    this.info.setText([
      `P1  ${Math.ceil(model.machines[0].hp).toString().padStart(4, ' ')} / ${MACHINES[model.machines[0].machineId].maxHp}`,
      `P2  ${Math.ceil(model.machines[1].hp).toString().padStart(4, ' ')} / ${MACHINES[model.machines[1].machineId].maxHp}`,
    ]);
    this.drawHpBar(180, 45, 125, model.machines[0].hp / MACHINES[model.machines[0].machineId].maxHp, 0x67d17b);
    this.drawHpBar(180, 70, 125, model.machines[1].hp / MACHINES[model.machines[1].machineId].maxHp, 0x4aa1ff);

    const windArrow = model.wind > 0 ? '→' : model.wind < 0 ? '←' : '·';
    this.turnLabel.setPosition(width - 280, 22);
    this.turnLabel.setText(`P${model.activePlayer + 1}  ·  ${model.turnSecondsLeft.toFixed(1)}s  ·  ${windArrow}${Math.abs(model.wind).toFixed(1)}`);
    this.turnLabel.setColor(model.turnSecondsLeft <= 5 ? '#ff806d' : '#fff4d6');

    this.conditionLabel.setPosition(330, 74);
    this.conditionLabel.setText(`FIELD  ${model.condition.name}  →  NEXT  ${model.nextCondition.name}`);
    this.conditionLabel.setColor(model.conditionId === 'normal' ? '#dce9f2' : '#ffd47d');

    this.chargeLabel.setPosition(width - 235, 54);
    this.chargeLabel.setText(`CHARGE  ${chargePercent}%`);
    this.chargeBar.clear();
    this.chargeBar.fillStyle(0x060b0f, 1);
    this.chargeBar.fillRoundedRect(width - 120, 56, 86, 16, 3);
    this.chargeBar.fillStyle(0xe8b25d, 1);
    this.chargeBar.fillRoundedRect(width - 118, 58, 82 * machine.power, 12, 2);
    this.chargeBar.lineStyle(1, 0xfff4d6, 0.75);
    this.chargeBar.strokeRoundedRect(width - 120, 56, 86, 16, 3);

    this.drawWindDial(width - 335, 55, model.wind);

    const powerX = 340;
    const powerY = bottomY + 51;
    this.chrome.fillStyle(0x070b0e, 1);
    this.chrome.fillRoundedRect(powerX, powerY, width - 650, 30, 4);
    this.chrome.fillStyle(0xe8b25d, 1);
    this.chrome.fillRoundedRect(powerX + 3, powerY + 3, (width - 656) * machine.power, 24, 3);
    this.chrome.lineStyle(1, 0xfff4d6, 0.8);
    this.chrome.strokeRoundedRect(powerX, powerY, width - 650, 30, 4);
    for (let tick = 0; tick <= 20; tick += 1) {
      const tickX = powerX + (width - 650) * (tick / 20);
      const tickHeight = tick % 5 === 0 ? 10 : 5;
      this.chrome.lineStyle(1, 0xffffff, tick % 5 === 0 ? 0.8 : 0.35);
      this.chrome.lineBetween(tickX, powerY - tickHeight - 2, tickX, powerY - 2);
    }

    this.chrome.fillStyle(activeColor, 1);
    this.chrome.fillRoundedRect(34, bottomY + 18, 196, 26, 4);
    this.chrome.fillStyle(0x101820, 0.9);
    this.chrome.fillRoundedRect(38, bottomY + 22, 188, 18, 3);
    this.chrome.fillStyle(0xfff4d6, 0.9);
    this.chrome.fillCircle(54, bottomY + 31, 6);
    this.chrome.fillCircle(76, bottomY + 31, 6);

    this.machineReadout.setPosition(278, bottomY + 20);
    const weaponKey = model.selectedWeaponRole === 'primary' ? '1' : model.selectedWeaponRole === 'secondary' ? '2' : '3';
    this.machineReadout.setText(`${def.name.toUpperCase()}  ·  [${weaponKey}] ${weapon.role.toUpperCase()} ${weapon.name.toUpperCase()}  ·  ANGLE ${machine.angleDeg.toFixed(0)}°`);

    this.queueReadout.setPosition(width - 255, bottomY + 20);
    this.queueReadout.setText(`NEXT  ${model.initiativePreview.map((player) => `P${player + 1}`).join(' › ')}`);

    this.help.setPosition(34, height - 28);
    this.help.setText(
      `←/→ MOVE   ↑/↓ AIM   1/2/3 WEAPON   Q PASS   HOLD SPACE CHARGE / RELEASE FIRE   ·   ${predictionEnabled ? 'TRAJECTORY ON' : 'TRAJECTORY OFF'}   ·   N NEXT MAP   ·   R RESET`,
    );

    this.drawRadar(model, visualContact, height);
  }

  private drawHpBar(x: number, y: number, width: number, ratio: number, color: number): void {
    this.chrome.fillStyle(0x05080a, 0.9);
    this.chrome.fillRoundedRect(x, y, width, 12, 3);
    this.chrome.fillStyle(color, 1);
    this.chrome.fillRoundedRect(x + 2, y + 2, (width - 4) * Math.max(0, ratio), 8, 2);
  }

  private drawWindDial(x: number, y: number, wind: number): void {
    const direction = wind === 0 ? 0 : wind > 0 ? 1 : -1;
    const strength = Math.min(1, Math.abs(wind) / 48);
    this.windDial.clear();
    this.windDial.fillStyle(0x05080a, 0.95);
    this.windDial.fillCircle(x, y, 27);
    this.windDial.lineStyle(2, 0x8bd4ff, 0.8);
    this.windDial.strokeCircle(x, y, 27);
    this.windDial.lineStyle(4, 0x8bd4ff, 1);
    this.windDial.lineBetween(x, y, x + direction * (8 + strength * 14), y);
    this.windDial.fillStyle(0x8bd4ff, 1);
    this.windDial.fillTriangle(x + direction * 22, y, x + direction * 12, y - 6, x + direction * 12, y + 6);
  }

  private drawRadar(model: GameModel, visualContact: boolean, height: number): void {
    this.radar.clear();
    if (visualContact) return;

    const size = 118;
    const x = 28;
    const y = height - 260;
    this.radar.fillStyle(0x070b0e, 0.96);
    this.radar.fillRect(x, y, size, size);
    this.radar.fillStyle(0x5d533f, 0.95);
    this.radar.beginPath();
    this.radar.moveTo(x, y + size);
    for (let sample = 0; sample <= size; sample += 2) {
      const terrainY = model.terrain.getHeightAt((sample / size) * model.width);
      this.radar.lineTo(x + sample, y + (terrainY / model.height) * size);
    }
    this.radar.lineTo(x + size, y + size);
    this.radar.closePath();
    this.radar.fillPath();
    this.radar.lineStyle(2, 0xfff4d6, 0.8);
    this.radar.strokeRect(x, y, size, size);
    for (const machine of model.machines) {
      this.radar.fillStyle(PLAYER_COLORS[machine.playerId], 1);
      this.radar.fillCircle(x + (machine.x / model.width) * size, y + (machine.y / model.height) * size, 5);
    }
  }
}
