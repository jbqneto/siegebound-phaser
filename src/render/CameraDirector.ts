import Phaser from 'phaser';
import { clamp } from '../core/ballistics';
import type { GameModel, ImpactEvent } from '../game/GameModel';

export type CameraPresentationState = 'PLAYER_FOCUS' | 'AIMING' | 'PROJECTILE_FOLLOW' | 'IMPACT_HOLD' | 'NEXT_PLAYER_TRANSITION';
export interface CameraConfig { playerPanDuration: number; projectileFollowStrength: number; aimLookAhead: number; impactHoldMs: number; maxShakeIntensity: number; }
export const DEFAULT_CAMERA_CONFIG: CameraConfig = { playerPanDuration: 750, projectileFollowStrength: 5.5, aimLookAhead: 90, impactHoldMs: 380, maxShakeIntensity: 0.006 };

export class CameraDirector {
  state: CameraPresentationState = 'PLAYER_FOCUS';
  private impactHoldLeft = 0;
  constructor(private readonly camera: Phaser.Cameras.Scene2D.Camera, private readonly worldWidth: number, private readonly worldHeight: number, private readonly config = DEFAULT_CAMERA_CONFIG) {}
  focusPlayer(model: GameModel): void {
    this.state = 'NEXT_PLAYER_TRANSITION';
    const lookAhead = model.currentMachine.facing * this.config.aimLookAhead;
    this.camera.pan(model.currentMachine.x + lookAhead, model.currentMachine.y, this.config.playerPanDuration, 'Sine.easeInOut');
  }
  impact(event: ImpactEvent): void {
    this.state = 'IMPACT_HOLD'; this.impactHoldLeft = this.config.impactHoldMs;
    this.camera.pan(event.x, event.y, 180, 'Sine.easeOut');
    this.camera.shake(180, Math.min(this.config.maxShakeIntensity, event.radius / 15000));
  }
  update(model: GameModel, deltaMs: number): void {
    if (this.state === 'IMPACT_HOLD') { this.impactHoldLeft -= deltaMs; if (this.impactHoldLeft > 0) return; this.focusPlayer(model); }
    const projectile = model.projectile;
    if (projectile) { this.state = 'PROJECTILE_FOLLOW'; this.smoothToward(projectile.position.x, projectile.position.y, deltaMs / 1000); return; }
    if (!this.camera.panEffect.isRunning) this.state = model.turnState === 'CHARGING' ? 'AIMING' : 'PLAYER_FOCUS';
    if (this.state === 'AIMING') this.smoothToward(model.currentMachine.x + model.currentMachine.facing * this.config.aimLookAhead, model.currentMachine.y, deltaMs / 1000, 2);
  }
  private smoothToward(x: number, y: number, deltaSeconds: number, strength = this.config.projectileFollowStrength): void {
    const viewportWidth = this.camera.width / this.camera.zoom, viewportHeight = this.camera.height / this.camera.zoom;
    const tx = clamp(x - viewportWidth / 2, 0, Math.max(0, this.worldWidth - viewportWidth));
    const ty = clamp(y - viewportHeight / 2, 0, Math.max(0, this.worldHeight - viewportHeight));
    const smoothing = 1 - Math.exp(-strength * deltaSeconds);
    this.camera.setScroll(this.camera.scrollX + (tx - this.camera.scrollX) * smoothing, this.camera.scrollY + (ty - this.camera.scrollY) * smoothing);
  }
}
