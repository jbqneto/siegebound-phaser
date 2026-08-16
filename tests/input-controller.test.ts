import { describe, expect, it, vi } from 'vitest';
import { GameModel } from '../src/game/GameModel';
import { GameplayInputController } from '../src/input/GameplayInputController';
import { KeyboardInputAdapter, type KeyboardSnapshot } from '../src/input/KeyboardInputAdapter';

const idle = (): KeyboardSnapshot => ({ left: false, right: false, up: false, down: false, space: false, one: false, two: false, three: false, pass: false, reset: false, next: false, trajectory: false });

describe('gameplay input command layer', () => {
  it('maps keyboard edge and continuous states through one controller', () => {
    const model = new GameModel(1800, 720);
    const toggle = vi.fn();
    const controller = new GameplayInputController(model, { resetStage: vi.fn(), nextStage: vi.fn(), toggleTrajectory: toggle });
    const keyboard = new KeyboardInputAdapter(controller);
    const first = idle(); first.left = true; first.two = true; first.trajectory = true;
    keyboard.update(first); controller.update(0.1);
    expect(model.currentMachine.x).toBeLessThan(1800 * model.stage.spawnX[0]);
    expect(model.selectedWeaponRole).toBe('secondary'); expect(toggle).toHaveBeenCalledOnce();
    keyboard.update(first); expect(toggle).toHaveBeenCalledOnce();
    keyboard.update(idle()); expect(controller.state.moveLeft).toBe(false);
  });

  it('cancellation clears every held state and cannot leave CHARGING stuck', () => {
    const model = new GameModel(1800, 720);
    const controller = new GameplayInputController(model, { resetStage: vi.fn(), nextStage: vi.fn(), toggleTrajectory: vi.fn() });
    controller.moveRight(true); controller.aimUp(true); controller.beginCharge();
    expect(model.turnState).toBe('CHARGING');
    controller.clearHeld();
    expect(controller.state).toEqual({ moveLeft: false, moveRight: false, aimUp: false, aimDown: false, charging: false });
    expect(model.turnState).toBe('ACTIVE');
  });
});
