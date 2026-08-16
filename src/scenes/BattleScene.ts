import Phaser from 'phaser';
import { clamp, FIXED_DT, predictTrajectory } from '../core/ballistics';
import type { EraId, MachineId, Vec2 } from '../core/types';
import { ERA_ORDER, MACHINE_ORDER, MACHINES } from '../data/catalog';
import { GameModel } from '../game/GameModel';
import { drawMachine } from '../render/drawMachine';
import { Hud } from '../ui/Hud';

export class BattleScene extends Phaser.Scene {
  private readonly worldWidth = 1800;
  private readonly worldHeight = 720;
  private model!: GameModel;
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private terrainGraphics!: Phaser.GameObjects.Graphics;
  private worldGraphics!: Phaser.GameObjects.Graphics;
  private fxGraphics!: Phaser.GameObjects.Graphics;
  private hud!: Hud;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'space' | 'm' | 't' | 'n' | 'p' | 'r' | 'q' | 'one' | 'two' | 'three', Phaser.Input.Keyboard.Key>;
  private predictionEnabled = true;
  private previousTerrainRevision = -1;
  private impactFlash = 0;
  private chargeSeconds = 0;
  private charging = false;
  private previousActivePlayer: 0 | 1 = 0;
  private projectileTrail: Vec2[] = [];
  private impactAge = 0;
  private turnBanner!: Phaser.GameObjects.Text;

  private static readonly MAX_CHARGE_SECONDS = 7;

  constructor() {
    super('battle');
  }

  create(): void {
    this.model = new GameModel(this.worldWidth, this.worldHeight);
    this.backgroundGraphics = this.add.graphics().setDepth(0);
    this.terrainGraphics = this.add.graphics().setDepth(2);
    this.worldGraphics = this.add.graphics().setDepth(6);
    this.fxGraphics = this.add.graphics().setDepth(10);
    this.hud = new Hud(this);
    this.turnBanner = this.add.text(this.scale.width / 2, 130, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '30px',
      color: '#fff4d6',
      stroke: '#111820',
      strokeThickness: 6,
      backgroundColor: '#101820cc',
      padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setDepth(22).setScrollFactor(0).setAlpha(0);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    // The world matches the viewport exactly; zooming would crop the terrain
    // and the HUD at the edges of the screen.
    this.cameras.main.setZoom(1);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys({
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      m: Phaser.Input.Keyboard.KeyCodes.M,
      t: Phaser.Input.Keyboard.KeyCodes.T,
      n: Phaser.Input.Keyboard.KeyCodes.N,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
    }) as typeof this.keys;

    this.drawBackground();
    this.drawTerrain(true);
  }

  update(_time: number, deltaMs: number): void {
    const hadProjectile = this.model.projectile !== null;
    this.handleInput(deltaMs / 1000);
    this.model.update(deltaMs / 1000);
    if (this.model.projectile) this.followProjectile(deltaMs / 1000);

    if (!hadProjectile && this.model.projectile) this.projectileTrail = [];
    if (this.model.projectile) {
      this.projectileTrail.push({ ...this.model.projectile.position });
      if (this.projectileTrail.length > 26) this.projectileTrail.shift();
    }

    if (this.model.activePlayer !== this.previousActivePlayer) {
      this.previousActivePlayer = this.model.activePlayer;
      this.charging = false;
      this.chargeSeconds = 0;
      this.focusActivePlayer();
      this.showTurnBanner();
    }

    if (this.model.lastImpact) {
      this.impactFlash = 0.28;
      this.impactAge = 0;
      this.projectileTrail = [];
    }
    this.impactFlash = Math.max(0, this.impactFlash - deltaMs / 1000);
    this.impactAge += deltaMs / 1000;

    this.drawTerrain();
    this.drawWorld();
    this.hud.update(this.model, this.predictionEnabled, this.model.hasVisualContact());
  }

  private handleInput(deltaSeconds: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      this.model.reset();
      this.previousTerrainRevision = -1;
      this.chargeSeconds = 0;
      this.charging = false;
      this.previousActivePlayer = this.model.activePlayer;
      this.focusActivePlayer();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.p)) this.predictionEnabled = !this.predictionEnabled;

    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) this.model.selectWeapon('primary');
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) this.model.selectWeapon('secondary');
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) this.model.selectWeapon('signature');
    if (Phaser.Input.Keyboard.JustDown(this.keys.q)) {
      this.model.pass();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.t) && !this.model.projectile) {
      const current = ERA_ORDER.indexOf(this.model.eraId);
      const next = ERA_ORDER[(current + 1) % ERA_ORDER.length] as EraId;
      this.model.setEra(next);
      const roster = this.model.era.machineIds;
      const leftMachine = roster[0];
      const rightMachine = roster[roster.length - 1];
      if (leftMachine) this.model.cycleMachine(0, leftMachine);
      if (rightMachine) this.model.cycleMachine(1, rightMachine);
      this.drawBackground();
      this.previousTerrainRevision = -1;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.n) && !this.model.projectile) {
      this.model.nextStage();
      this.chargeSeconds = 0;
      this.charging = false;
      this.previousTerrainRevision = -1;
      this.drawBackground();
      this.focusActivePlayer();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.m) && !this.model.projectile) {
      const currentId = this.model.currentMachine.machineId;
      const currentIndex = MACHINE_ORDER.indexOf(currentId);
      const next = MACHINE_ORDER[(currentIndex + 1) % MACHINE_ORDER.length] as MachineId;
      this.model.cycleMachine(this.model.activePlayer, next);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && !this.model.projectile && this.model.winner === null) {
      this.charging = this.model.beginCharge();
      this.chargeSeconds = 0;
    }

    if (this.charging && this.keys.space.isDown && !this.model.projectile && this.model.winner === null) {
      this.chargeSeconds = Math.min(
        BattleScene.MAX_CHARGE_SECONDS,
        this.chargeSeconds + deltaSeconds,
      );
      const chargeRatio = this.chargeSeconds / BattleScene.MAX_CHARGE_SECONDS;
      this.model.setPower(0.15 + chargeRatio * 0.85);
    }

    if (this.charging && Phaser.Input.Keyboard.JustUp(this.keys.space)) {
      this.charging = false;
      if (!this.model.fire()) this.model.cancelCharge();
    }

    if (this.model.projectile || this.model.winner !== null) return;

    const angularSpeed = 34 * deltaSeconds;
    const moveSpeed = 180 * deltaSeconds;

    if (this.cursors.up?.isDown) this.model.changeAngle(angularSpeed);
    if (this.cursors.down?.isDown) this.model.changeAngle(-angularSpeed);
    if (this.cursors.left?.isDown) this.model.moveCurrent(-moveSpeed);
    if (this.cursors.right?.isDown) this.model.moveCurrent(moveSpeed);
  }

  private drawBackground(): void {
    const era = this.model.era;
    const background = this.backgroundGraphics;
    background.clear();
    background.fillGradientStyle(era.skyTop, era.skyTop, era.skyBottom, era.skyBottom, 1);
    background.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Distant silhouettes: purely vector, so the prototype has zero art dependencies.
    background.fillStyle(0x151c23, 0.16);
    background.fillTriangle(80, 520, 360, 265, 640, 520);
    background.fillTriangle(1050, 520, 1350, 300, 1650, 520);
    background.fillStyle(0x151515, 0.22);
    background.fillRect(790, 385, 190, 135);
    background.fillRect(825, 335, 48, 185);
    background.fillRect(900, 350, 42, 170);
    background.fillStyle(era.accent, 0.15);
    background.fillCircle(1430, 138, 70);
  }

  private drawTerrain(force = false): void {
    const revision = this.model.terrain.revision;
    if (!force && revision === this.previousTerrainRevision) return;
    this.previousTerrainRevision = revision;

    const g = this.terrainGraphics;
    g.clear();
    g.fillStyle(this.model.era.ground, 1);
    g.beginPath();
    g.moveTo(0, this.worldHeight);
    g.lineTo(0, this.model.terrain.getHeightAt(0));

    for (let x = 0; x < this.worldWidth; x += 4) {
      g.lineTo(x, this.model.terrain.getHeightAt(x));
    }

    g.lineTo(this.worldWidth, this.worldHeight);
    g.closePath();
    g.fillPath();

    g.lineStyle(3, 0x25241f, 0.8);
    g.beginPath();
    g.moveTo(0, this.model.terrain.getHeightAt(0));
    for (let x = 0; x < this.worldWidth; x += 4) g.lineTo(x, this.model.terrain.getHeightAt(x));
    g.strokePath();
  }

  private drawWorld(): void {
    const g = this.worldGraphics;
    const fx = this.fxGraphics;
    g.clear();
    fx.clear();

    const visualContact = this.model.hasVisualContact();
    this.model.machines.forEach((machine) => {
      const isVisible = machine.playerId === this.model.activePlayer || visualContact;
      if (isVisible) {
        drawMachine(g, machine, machine.playerId === this.model.activePlayer && !this.model.projectile);
      }
    });

    if (!this.model.projectile && this.model.winner === null) {
      const machine = this.model.currentMachine;
      this.drawAimIndicator(fx, machine);
    }

    if (!this.model.projectile && this.predictionEnabled && this.model.winner === null) {
      const machine = this.model.currentMachine;
      const def = MACHINES[machine.machineId];
      const weapon = this.model.currentWeapon;
      const points = predictTrajectory({
        origin: this.model.getMuzzlePosition(machine),
        angleDeg: machine.angleDeg,
        power: machine.power,
        direction: machine.facing,
        muzzleVelocity: def.muzzleVelocity * this.model.projectileVelocityMultiplier,
        profile: weapon.profile,
        behavior: weapon.behavior,
      }, this.model.effectiveWind, 4.6, 12, this.model.projectileGravityMultiplier);

      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        if (!point) continue;
        if (point.x < 0 || point.x >= this.worldWidth || point.y < 0 || point.y >= this.worldHeight) continue;
        if (this.model.terrain.isSolid(point)) break;
        fx.fillStyle(0xffffff, 0.35);
        fx.fillCircle(point.x, point.y, 2);
      }
    }

    if (this.model.projectile) {
      const p = this.model.projectile.position;
      for (let index = 0; index < this.projectileTrail.length; index += 1) {
        const trailPoint = this.projectileTrail[index];
        if (!trailPoint) continue;
        const alpha = (index + 1) / this.projectileTrail.length * 0.42;
        fx.fillStyle(0xffd88a, alpha);
        fx.fillCircle(trailPoint.x, trailPoint.y, 2 + index / 18);
      }
      fx.fillStyle(0x1e1e1e, 1);
      fx.fillCircle(p.x, p.y, this.model.projectile.profile.radius);
      fx.lineStyle(5, 0xfff0b0, 0.28);
      fx.strokeCircle(p.x, p.y, this.model.projectile.profile.radius + 5);
      fx.lineStyle(3, 0xffd88a, 0.35);
      fx.lineBetween(p.x, p.y, p.x - this.model.projectile.velocity.x * FIXED_DT * 5, p.y - this.model.projectile.velocity.y * FIXED_DT * 5);
    }

    if (this.impactFlash > 0 && this.model.lastImpact) {
      const impact = this.model.lastImpact;
      const progress = Math.min(1, this.impactAge / 0.42);
      const scale = 0.45 + progress * 0.9;
      fx.fillStyle(0xffd25c, Math.max(0, 0.7 - progress * 0.7));
      fx.fillCircle(impact.x, impact.y, impact.radius * scale);
      fx.lineStyle(4, 0xffffff, Math.max(0, 0.95 - progress));
      fx.strokeCircle(impact.x, impact.y, impact.radius * (0.8 + progress * 0.8));
      fx.lineStyle(2, 0xff9a52, Math.max(0, 0.8 - progress));
      fx.strokeCircle(impact.x, impact.y, impact.radius * (1.2 + progress * 1.4));
    }
  }

  private focusActivePlayer(): void {
    this.cameras.main.pan(this.model.currentMachine.x, this.worldHeight / 2, 850, 'Sine.easeInOut');
  }

  private drawAimIndicator(graphics: Phaser.GameObjects.Graphics, machine: GameModel['machines'][number]): void {
    const angle = Phaser.Math.DegToRad(machine.angleDeg);
    const directionX = Math.cos(angle) * machine.facing;
    const directionY = -Math.sin(angle);
    const centerX = machine.x;
    const centerY = machine.y - 27;
    const muzzle = this.model.getMuzzlePosition(machine);
    const baseAngle = machine.facing === 1 ? 0 : Math.PI;
    const aimAngle = machine.facing === 1 ? -angle : Math.PI + angle;

    // Gunbound-style local aiming reticle: a compact sector follows the cannon
    // and communicates angle without drawing a confusing full-screen aim line.
    graphics.fillStyle(0x7dff9a, 0.24);
    graphics.beginPath();
    graphics.moveTo(centerX, centerY);
    graphics.lineTo(centerX + directionX * 58, centerY + directionY * 58);
    graphics.lineTo(centerX + (directionX * 58 - directionY * 12), centerY + (directionY * 58 + directionX * 12));
    graphics.closePath();
    graphics.fillPath();

    graphics.lineStyle(3, 0x9affad, 0.95);
    graphics.beginPath();
    graphics.arc(centerX, centerY, 48, baseAngle, aimAngle, machine.facing === 1);
    graphics.strokePath();
    graphics.lineStyle(3, 0x9affad, 0.95);
    graphics.lineBetween(centerX, centerY, centerX + directionX * 58, centerY + directionY * 58);
    graphics.lineStyle(2, 0xffffff, 0.95);
    graphics.lineBetween(centerX, centerY, muzzle.x, muzzle.y);
    graphics.strokeCircle(muzzle.x, muzzle.y, 6);
    graphics.lineBetween(
      muzzle.x,
      muzzle.y,
      muzzle.x - directionY * 8 - directionX * 8,
      muzzle.y + directionX * 8 - directionY * 8,
    );
    graphics.lineBetween(
      muzzle.x,
      muzzle.y,
      muzzle.x + directionY * 8 - directionX * 8,
      muzzle.y - directionX * 8 - directionY * 8,
    );

  }

  private followProjectile(deltaSeconds: number): void {
    const projectile = this.model.projectile;
    if (!projectile) return;

    const camera = this.cameras.main;
    const viewportWidth = camera.width / camera.zoom;
    const viewportHeight = camera.height / camera.zoom;
    const targetScrollX = clamp(projectile.position.x - viewportWidth / 2, 0, this.worldWidth - viewportWidth);
    const targetScrollY = clamp(projectile.position.y - viewportHeight / 2, 0, this.worldHeight - viewportHeight);
    const smoothing = Math.min(1, deltaSeconds * 8);
    camera.setScroll(
      camera.scrollX + (targetScrollX - camera.scrollX) * smoothing,
      camera.scrollY + (targetScrollY - camera.scrollY) * smoothing,
    );
  }

  private showTurnBanner(): void {
    this.turnBanner.setText(`PLAYER ${this.model.activePlayer + 1} TURN`);
    this.turnBanner.setAlpha(1);
    this.tweens.killTweensOf(this.turnBanner);
    this.tweens.add({
      targets: this.turnBanner,
      alpha: 0,
      delay: 380,
      duration: 850,
      ease: 'Sine.easeIn',
    });
  }
}
