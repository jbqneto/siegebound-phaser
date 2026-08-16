import Phaser from 'phaser';
import { predictTrajectory } from '../core/ballistics';
import type { EraId, MachineId, MachineState } from '../core/types';
import { ERA_ORDER, MACHINE_ORDER, MACHINES } from '../data/catalog';
import { GameModel } from '../game/GameModel';
import { BattleBackdrop } from '../render/BattleBackdrop';
import { BattleDepth } from '../render/BattleDepth';
import { BattleFx } from '../render/BattleFx';
import { CameraDirector } from '../render/CameraDirector';
import { MachineRenderer } from '../render/MachineRenderer';
import { ProjectileRenderer } from '../render/ProjectileRenderer';
import { TerrainRenderer } from '../render/TerrainRenderer';
import { Hud } from '../ui/Hud';

export class BattleScene extends Phaser.Scene {
  private readonly worldWidth = 1800;
  private readonly worldHeight = 720;
  private model!: GameModel;
  private backdrop!: BattleBackdrop;
  private terrainRenderer!: TerrainRenderer;
  private machineRenderer!: MachineRenderer;
  private projectileRenderer!: ProjectileRenderer;
  private battleFx!: BattleFx;
  private cameraDirector!: CameraDirector;
  private hud!: Hud;
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'space' | 'm' | 't' | 'n' | 'p' | 'r' | 'q' | 'one' | 'two' | 'three', Phaser.Input.Keyboard.Key>;
  private predictionEnabled = true;
  private chargeSeconds = 0;
  private charging = false;
  private previousActivePlayer: 0 | 1 = 0;
  private hadProjectile = false;
  private turnBanner!: Phaser.GameObjects.Text;
  private static readonly MAX_CHARGE_SECONDS = 7;

  constructor() { super('battle'); }

  create(): void {
    this.model = new GameModel(this.worldWidth, this.worldHeight);
    this.backdrop = new BattleBackdrop(this, this.worldWidth, this.worldHeight);
    this.terrainRenderer = new TerrainRenderer(this, this.worldWidth, this.worldHeight);
    this.machineRenderer = new MachineRenderer(this);
    this.projectileRenderer = new ProjectileRenderer(this);
    this.battleFx = new BattleFx(this);
    this.aimGraphics = this.add.graphics().setDepth(BattleDepth.Effects);
    this.hud = new Hud(this);
    this.turnBanner = this.add.text(this.scale.width / 2, 130, '', { fontFamily: 'system-ui, sans-serif', fontSize: '30px', color: '#fff4d6', stroke: '#111820', strokeThickness: 6, backgroundColor: '#101820cc', padding: { x: 18, y: 8 } }).setOrigin(0.5).setDepth(BattleDepth.Hud).setScrollFactor(0).setAlpha(0);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight).setZoom(1);
    this.cameraDirector = new CameraDirector(this.cameras.main, this.worldWidth, this.worldHeight);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys({ space: Phaser.Input.Keyboard.KeyCodes.SPACE, m: Phaser.Input.Keyboard.KeyCodes.M, t: Phaser.Input.Keyboard.KeyCodes.T, n: Phaser.Input.Keyboard.KeyCodes.N, p: Phaser.Input.Keyboard.KeyCodes.P, r: Phaser.Input.Keyboard.KeyCodes.R, q: Phaser.Input.Keyboard.KeyCodes.Q, one: Phaser.Input.Keyboard.KeyCodes.ONE, two: Phaser.Input.Keyboard.KeyCodes.TWO, three: Phaser.Input.Keyboard.KeyCodes.THREE }) as typeof this.keys;
    this.rebuildStagePresentation();
    this.cameraDirector.focusPlayer(this.model);
  }

  update(_time: number, deltaMs: number): void {
    this.handleInput(deltaMs / 1000);
    this.model.update(deltaMs / 1000);
    if (!this.hadProjectile && this.model.projectile) this.projectileRenderer.resetTrail();
    this.hadProjectile = this.model.projectile !== null;
    if (this.model.activePlayer !== this.previousActivePlayer) {
      this.previousActivePlayer = this.model.activePlayer; this.charging = false; this.chargeSeconds = 0;
      this.cameraDirector.focusPlayer(this.model); this.showTurnBanner();
    }
    if (this.model.lastImpact) { this.projectileRenderer.resetTrail(); this.battleFx.showImpact(this.model.lastImpact); this.cameraDirector.impact(this.model.lastImpact); }
    this.terrainRenderer.update(this.model.terrain, this.model.era.ground);
    this.machineRenderer.update(this.model.machines, this.model.terrain, this.model.activePlayer, this.model.hasVisualContact(), !!this.model.projectile);
    this.projectileRenderer.update(this.model.projectile);
    this.battleFx.update(deltaMs / 1000);
    this.drawAimAndPrediction();
    this.cameraDirector.update(this.model, deltaMs);
    this.hud.update(this.model, this.predictionEnabled, this.model.hasVisualContact());
  }

  private handleInput(deltaSeconds: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) { this.model.resetCurrentStage(); this.resetPresentation(); return; }
    if (Phaser.Input.Keyboard.JustDown(this.keys.n) && !this.model.projectile) { this.model.nextStage(); this.rebuildStagePresentation(); this.resetPresentation(); return; }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p)) this.predictionEnabled = !this.predictionEnabled;
    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) this.model.selectWeapon('primary');
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) this.model.selectWeapon('secondary');
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) this.model.selectWeapon('signature');
    if (Phaser.Input.Keyboard.JustDown(this.keys.q)) { this.model.pass(); return; }
    if (Phaser.Input.Keyboard.JustDown(this.keys.t) && !this.model.projectile) {
      const next = ERA_ORDER[(ERA_ORDER.indexOf(this.model.eraId) + 1) % ERA_ORDER.length] as EraId;
      this.model.setEra(next); const roster = this.model.era.machineIds;
      if (roster[0]) this.model.cycleMachine(0, roster[0]); if (roster.at(-1)) this.model.cycleMachine(1, roster.at(-1)!);
      this.backdrop.rebuild(this.model.stage, this.model.era); this.terrainRenderer.invalidate();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.m) && !this.model.projectile) {
      const id = this.model.currentMachine.machineId;
      this.model.cycleMachine(this.model.activePlayer, MACHINE_ORDER[(MACHINE_ORDER.indexOf(id) + 1) % MACHINE_ORDER.length] as MachineId);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && !this.model.projectile && this.model.winner === null) { this.charging = this.model.beginCharge(); this.chargeSeconds = 0; }
    if (this.charging && this.keys.space.isDown && !this.model.projectile && this.model.winner === null) {
      this.chargeSeconds = Math.min(BattleScene.MAX_CHARGE_SECONDS, this.chargeSeconds + deltaSeconds);
      this.model.setPower(0.15 + (this.chargeSeconds / BattleScene.MAX_CHARGE_SECONDS) * 0.85);
    }
    if (this.charging && Phaser.Input.Keyboard.JustUp(this.keys.space)) { this.charging = false; if (!this.model.fire()) this.model.cancelCharge(); }
    if (this.model.projectile || this.model.winner !== null) return;
    if (this.cursors.up?.isDown) this.model.changeAngle(34 * deltaSeconds);
    if (this.cursors.down?.isDown) this.model.changeAngle(-34 * deltaSeconds);
    if (this.cursors.left?.isDown) this.model.moveCurrent(-180 * deltaSeconds);
    if (this.cursors.right?.isDown) this.model.moveCurrent(180 * deltaSeconds);
  }

  private drawAimAndPrediction(): void {
    const g = this.aimGraphics.clear();
    if (this.model.projectile || this.model.winner !== null) return;
    const machine = this.model.currentMachine;
    this.drawAimIndicator(g, machine);
    if (!this.predictionEnabled) return;
    const def = MACHINES[machine.machineId], weapon = this.model.currentWeapon;
    const points = predictTrajectory({ origin: this.model.getMuzzlePosition(machine), angleDeg: machine.angleDeg, power: machine.power, direction: machine.facing, muzzleVelocity: def.muzzleVelocity * this.model.projectileVelocityMultiplier, profile: weapon.profile, behavior: weapon.behavior }, this.model.effectiveWind, 4.6, 12, this.model.projectileGravityMultiplier);
    for (const point of points) { if (point.x < 0 || point.x >= this.worldWidth || point.y < 0 || point.y >= this.worldHeight) continue; if (this.model.terrain.isSolid(point)) break; g.fillStyle(0xffffff, 0.35).fillCircle(point.x, point.y, 2); }
  }

  private drawAimIndicator(g: Phaser.GameObjects.Graphics, machine: MachineState): void {
    const angle = Phaser.Math.DegToRad(machine.angleDeg), dx = Math.cos(angle) * machine.facing, dy = -Math.sin(angle);
    const center = { x: machine.x, y: machine.y - 27 }, muzzle = this.model.getMuzzlePosition(machine);
    g.lineStyle(3, 0x9affad, 0.95).lineBetween(center.x, center.y, center.x + dx * 58, center.y + dy * 58);
    g.lineStyle(2, 0xffffff, 0.95).lineBetween(center.x, center.y, muzzle.x, muzzle.y).strokeCircle(muzzle.x, muzzle.y, 6);
  }

  private rebuildStagePresentation(): void { this.backdrop.rebuild(this.model.stage, this.model.era); this.terrainRenderer.invalidate(); }
  private resetPresentation(): void { this.chargeSeconds = 0; this.charging = false; this.previousActivePlayer = this.model.activePlayer; this.projectileRenderer.resetTrail(); this.terrainRenderer.invalidate(); this.cameraDirector.focusPlayer(this.model); }
  private showTurnBanner(): void {
    this.turnBanner.setText(`PLAYER ${this.model.activePlayer + 1} TURN`).setAlpha(1);
    this.tweens.killTweensOf(this.turnBanner); this.tweens.add({ targets: this.turnBanner, alpha: 0, delay: 380, duration: 850, ease: 'Sine.easeIn' });
  }
}
