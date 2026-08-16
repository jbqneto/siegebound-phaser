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
import { GameplayInputController } from '../input/GameplayInputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { TouchControls } from '../ui/TouchControls';
import { readViewportProfile, shouldPauseForOrientation, type ViewportProfile } from '../ui/ViewportProfile';
import { ApplicationPresentation } from '../ui/ApplicationPresentation';
import { FullscreenController } from '../ui/FullscreenController';
import { HowToPlay } from '../ui/HowToPlay';
import { HudActions } from '../ui/HudActions';

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
  private gameplayInput!: GameplayInputController;
  private keyboardAdapter!: KeyboardInputAdapter;
  private touchControls!: TouchControls;
  private viewportProfile!: ViewportProfile;
  private orientationGuard!: Phaser.GameObjects.Container;
  private readonly presentation = new ApplicationPresentation();
  private fullscreen!: FullscreenController;
  private guide!: HowToPlay;
  private hudActions!: HudActions;
  private predictionEnabled = true;
  private previousActivePlayer: 0 | 1 = 0;
  private hadProjectile = false;
  private turnBanner!: Phaser.GameObjects.Text;

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
    this.gameplayInput = new GameplayInputController(this.model, {
      resetStage: () => { this.model.resetCurrentStage(); this.resetPresentation(); },
      nextStage: () => { if (!this.model.projectile) { this.model.nextStage(); this.rebuildStagePresentation(); this.resetPresentation(); } },
      toggleTrajectory: () => { this.predictionEnabled = !this.predictionEnabled; },
    });
    this.keyboardAdapter = new KeyboardInputAdapter(this.gameplayInput);
    this.touchControls = new TouchControls(this, this.gameplayInput);
    this.fullscreen = new FullscreenController(this.game.canvas.parentElement ?? this.game.canvas);
    this.guide = new HowToPlay(this, { continue: () => this.continueFromGuide(), toggleFullscreen: () => { void this.toggleFullscreen(); } });
    this.hudActions = new HudActions(this, { help: () => this.openHelp(), fullscreen: () => { void this.toggleFullscreen(); } });
    this.createOrientationGuard();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.refreshViewport, this);
    window.addEventListener('resize', this.refreshViewport);
    window.addEventListener('orientationchange', this.interruptInput);
    document.addEventListener('fullscreenchange', this.refreshViewport);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('resize', this.refreshViewport); window.removeEventListener('orientationchange', this.interruptInput); document.removeEventListener('fullscreenchange', this.refreshViewport);
    });
    this.refreshViewport();
    this.rebuildStagePresentation();
    this.cameraDirector.focusPlayer(this.model);
  }

  update(_time: number, deltaMs: number): void {
    this.guide.update(deltaMs);
    if (this.presentation.state !== 'PLAYING') return;
    this.handleInput(deltaMs / 1000);
    this.model.update(deltaMs / 1000);
    if (!this.hadProjectile && this.model.projectile) this.projectileRenderer.resetTrail();
    this.hadProjectile = this.model.projectile !== null;
    if (this.model.activePlayer !== this.previousActivePlayer) {
      this.previousActivePlayer = this.model.activePlayer; this.gameplayInput.clearHeld();
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
    this.touchControls.update(this.model);
  }

  private handleInput(deltaSeconds: number): void {
    this.keyboardAdapter.update({ left: !!this.cursors.left?.isDown, right: !!this.cursors.right?.isDown, up: !!this.cursors.up?.isDown, down: !!this.cursors.down?.isDown, space: this.keys.space.isDown, one: this.keys.one.isDown, two: this.keys.two.isDown, three: this.keys.three.isDown, pass: this.keys.q.isDown, reset: this.keys.r.isDown, next: this.keys.n.isDown, trajectory: this.keys.p.isDown });
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
    this.gameplayInput.update(deltaSeconds);
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
  private resetPresentation(): void { this.gameplayInput.clearHeld(); this.previousActivePlayer = this.model.activePlayer; this.projectileRenderer.resetTrail(); this.terrainRenderer.invalidate(); this.cameraDirector.focusPlayer(this.model); }

  private readonly interruptInput = (): void => { this.keyboardAdapter?.clear(); this.touchControls?.cancel(); };
  private readonly refreshViewport = (): void => {
    if (!this.gameplayInput) return;
    this.viewportProfile = readViewportProfile();
    this.presentation.setPortrait(shouldPauseForOrientation(this.viewportProfile));
    if (this.presentation.state !== 'PLAYING') this.interruptInput();
    const touchOverride = new URLSearchParams(location.search).get('touchUi') === '1';
    const playing = this.presentation.state === 'PLAYING';
    this.touchControls.layout(this.viewportProfile, playing && (this.viewportProfile.coarsePointer || touchOverride));
    this.orientationGuard.setVisible(this.presentation.state === 'PORTRAIT_GUARD');
    const guideVisible = this.presentation.state === 'PRE_MATCH_GUIDE' || this.presentation.state === 'PAUSED_HELP';
    this.guide.setVisible(guideVisible);
    this.guide.layout(this.viewportProfile, this.presentation.hasStarted, this.fullscreen.supported, this.fullscreen.active);
    this.hudActions.setFullscreenActive(this.fullscreen.active);
    this.hudActions.layout(this.viewportProfile, playing, this.fullscreen.supported || this.fullscreen.active);
    this.scale.refresh();
    const debug = new URLSearchParams(location.search).get('viewportDebug') === '1';
    if (debug) console.info('[viewport]', this.viewportProfile);
  };
  private continueFromGuide(): void {
    if (this.viewportProfile.orientation === 'portrait') return;
    this.presentation.continueMatch();
    this.cameraDirector.focusPlayer(this.model);
    this.refreshViewport();
  }
  private openHelp(): void {
    if (this.presentation.state !== 'PLAYING') return;
    this.interruptInput();
    this.presentation.openHelp();
    this.refreshViewport();
  }
  private async toggleFullscreen(): Promise<void> {
    await this.fullscreen.toggle();
    this.refreshViewport();
  }
  private createOrientationGuard(): void {
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x090d10, 0.98).setScrollFactor(0);
    const title = this.add.text(640, 330, 'Rotate your device to play', { fontFamily: 'system-ui, sans-serif', fontSize: '34px', fontStyle: 'bold', color: '#fff4d6' }).setOrigin(0.5).setScrollFactor(0);
    const detail = this.add.text(640, 380, 'SiegeBound is designed for landscape mode.', { fontFamily: 'system-ui, sans-serif', fontSize: '18px', color: '#dce9f2' }).setOrigin(0.5).setScrollFactor(0);
    this.orientationGuard = this.add.container(0, 0, [shade, title, detail]).setDepth(100).setScrollFactor(0).setVisible(false);
  }
  private showTurnBanner(): void {
    this.turnBanner.setText(`PLAYER ${this.model.activePlayer + 1} TURN`).setAlpha(1);
    this.tweens.killTweensOf(this.turnBanner); this.tweens.add({ targets: this.turnBanner, alpha: 0, delay: 380, duration: 850, ease: 'Sine.easeIn' });
  }
}
