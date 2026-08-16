import type { GameModel } from '../game/GameModel';

export interface GameplayInputState {
  moveLeft: boolean;
  moveRight: boolean;
  aimUp: boolean;
  aimDown: boolean;
  charging: boolean;
}

export class GameplayInputController {
  readonly state: GameplayInputState = { moveLeft: false, moveRight: false, aimUp: false, aimDown: false, charging: false };
  private chargeSeconds = 0;
  private static readonly MAX_CHARGE_SECONDS = 7;

  constructor(
    private readonly model: GameModel,
    private readonly actions: { resetStage(): void; nextStage(): void; toggleTrajectory(): void },
  ) {}

  moveLeft(active: boolean): void { this.state.moveLeft = active; }
  moveRight(active: boolean): void { this.state.moveRight = active; }
  aimUp(active: boolean): void { this.state.aimUp = active; }
  aimDown(active: boolean): void { this.state.aimDown = active; }
  selectPrimary(): void { this.model.selectWeapon('primary'); }
  selectSecondary(): void { this.model.selectWeapon('secondary'); }
  selectSignature(): void { this.model.selectWeapon('signature'); }
  passTurn(): void { this.cancelCharge(); this.model.pass(); }
  toggleTrajectoryDebug(): void { this.actions.toggleTrajectory(); }
  resetCurrentStage(): void { this.clearHeld(); this.actions.resetStage(); }
  nextStage(): void { this.clearHeld(); this.actions.nextStage(); }

  beginCharge(): void {
    if (!this.state.charging && this.model.beginCharge()) { this.state.charging = true; this.chargeSeconds = 0; }
  }

  releaseChargeAndFire(): void {
    if (!this.state.charging) return;
    this.state.charging = false;
    if (!this.model.fire()) this.model.cancelCharge();
  }

  cancelCharge(): void {
    this.state.charging = false;
    this.chargeSeconds = 0;
    this.model.cancelCharge();
  }

  clearHeld(): void {
    this.state.moveLeft = this.state.moveRight = this.state.aimUp = this.state.aimDown = false;
    this.cancelCharge();
  }

  update(deltaSeconds: number): void {
    if (this.model.projectile || this.model.winner !== null) { this.clearHeld(); return; }
    if (this.state.charging) {
      this.chargeSeconds = Math.min(GameplayInputController.MAX_CHARGE_SECONDS, this.chargeSeconds + deltaSeconds);
      this.model.setPower(0.15 + (this.chargeSeconds / GameplayInputController.MAX_CHARGE_SECONDS) * 0.85);
    }
    if (this.state.aimUp) this.model.changeAngle(34 * deltaSeconds);
    if (this.state.aimDown) this.model.changeAngle(-34 * deltaSeconds);
    if (this.state.moveLeft) this.model.moveCurrent(-180 * deltaSeconds);
    if (this.state.moveRight) this.model.moveCurrent(180 * deltaSeconds);
  }
}
