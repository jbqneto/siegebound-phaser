import { describe, expect, it } from 'vitest';
import { InitiativeScheduler } from '../src/core/initiative';
import { GameModel } from '../src/game/GameModel';

describe('initiative scheduler', () => {
  it('uses deterministic player zero tie-breaking and advances by action cost', () => {
    const scheduler = new InitiativeScheduler();
    expect(scheduler.activePlayer).toBe(0);
    scheduler.commitAction(0, 100, 0);
    expect(scheduler.activePlayer).toBe(1);
    scheduler.commitAction(1, 500, 0);
    expect(scheduler.activePlayer).toBe(0);
  });

  it('projects future turns using each player cost', () => {
    const scheduler = new InitiativeScheduler();
    scheduler.commitAction(0, 100, 0);
    expect(scheduler.preview(4, () => 100)).toEqual([1, 0, 1, 0]);
  });

  it('allows a cheap action to lap an expensive opponent action', () => {
    const model = new GameModel(1280, 720);
    model.pass();
    expect(model.activePlayer).toBe(1);
    model.update(0);
    model.pass();
    expect(model.activePlayer).toBe(0);
  });
});
