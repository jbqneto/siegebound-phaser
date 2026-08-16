import { describe, expect, it } from 'vitest';
import { GameModel } from '../src/game/GameModel';

describe('game stages', () => {
  it('rotates through all three stages when restarting', () => {
    const model = new GameModel(1280, 720);

    expect(model.stageId).toBe('open-field');
    model.reset();
    expect(model.stageId).toBe('long-ridge');
    model.reset();
    expect(model.stageId).toBe('hidden-basin');
    model.reset();
    expect(model.stageId).toBe('open-field');
  });

  it('ends an idle turn after twenty seconds', () => {
    const model = new GameModel(1280, 720);

    model.update(19.9);
    expect(model.activePlayer).toBe(0);
    expect(model.turnSecondsLeft).toBeCloseTo(0.1);

    model.update(0.1);
    expect(model.activePlayer).toBe(1);
    expect(model.turnNumber).toBe(2);
    expect(model.turnSecondsLeft).toBe(20);
  });

  it('moves through explicit charge and projectile states', () => {
    const model = new GameModel(1280, 720);

    expect(model.turnState).toBe('ACTIVE');
    expect(model.beginCharge()).toBe(true);
    expect(model.turnState).toBe('CHARGING');
    expect(model.selectWeapon('secondary')).toBe(false);
    expect(model.fire()).toBe(true);
    expect(model.turnState).toBe('PROJECTILE');
  });

  it('advances the public condition cycle after a committed turn', () => {
    const model = new GameModel(1280, 720);
    const nextCondition = model.nextConditionId;

    model.pass();
    expect(model.turnState).toBe('PREPARE');
    model.update(0);
    expect(model.turnState).toBe('ACTIVE');
    expect(model.conditionId).toBe(nextCondition);
  });

  it('applies condition modifiers without changing the base wind value', () => {
    const model = new GameModel(1280, 720);
    model.conditionId = 'strong-gust';
    model.wind = 20;
    expect(model.effectiveWind).toBe(36);

    model.conditionId = 'wind-shift';
    expect(model.effectiveWind).toBe(-20);
    expect(model.projectileGravityMultiplier).toBe(1);
  });
});
