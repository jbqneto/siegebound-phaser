import type { GameplayInputController } from './GameplayInputController';

export interface KeyboardSnapshot {
  left: boolean; right: boolean; up: boolean; down: boolean; space: boolean;
  one: boolean; two: boolean; three: boolean; pass: boolean; reset: boolean; next: boolean; trajectory: boolean;
}

const EMPTY: KeyboardSnapshot = { left: false, right: false, up: false, down: false, space: false, one: false, two: false, three: false, pass: false, reset: false, next: false, trajectory: false };

export class KeyboardInputAdapter {
  private previous: KeyboardSnapshot = { ...EMPTY };
  constructor(private readonly controller: GameplayInputController) {}
  update(current: KeyboardSnapshot): void {
    this.controller.moveLeft(current.left); this.controller.moveRight(current.right);
    this.controller.aimUp(current.up); this.controller.aimDown(current.down);
    if (current.space && !this.previous.space) this.controller.beginCharge();
    if (!current.space && this.previous.space) this.controller.releaseChargeAndFire();
    if (current.one && !this.previous.one) this.controller.selectPrimary();
    if (current.two && !this.previous.two) this.controller.selectSecondary();
    if (current.three && !this.previous.three) this.controller.selectSignature();
    if (current.pass && !this.previous.pass) this.controller.passTurn();
    if (current.reset && !this.previous.reset) this.controller.resetCurrentStage();
    if (current.next && !this.previous.next) this.controller.nextStage();
    if (current.trajectory && !this.previous.trajectory) this.controller.toggleTrajectoryDebug();
    this.previous = { ...current };
  }
  clear(): void { this.previous = { ...EMPTY }; this.controller.clearHeld(); }
}
