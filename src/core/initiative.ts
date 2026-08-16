import type { PlayerId } from './types';

export interface InitiativeEntry {
  playerId: PlayerId;
  nextActionAt: number;
}

/** Deterministic timeline scheduler. Lower timestamps act first; player 0 wins ties. */
export class InitiativeScheduler {
  static readonly TIME_DELAY_FACTOR = 12;

  private entries: [InitiativeEntry, InitiativeEntry] = [
    { playerId: 0, nextActionAt: 0 },
    { playerId: 1, nextActionAt: 0 },
  ];

  reset(): void {
    this.entries = [
      { playerId: 0, nextActionAt: 0 },
      { playerId: 1, nextActionAt: 0 },
    ];
  }

  get activePlayer(): PlayerId {
    return this.sortedEntries()[0]!.playerId;
  }

  commitAction(playerId: PlayerId, actionDelay: number, elapsedTurnSeconds: number): void {
    const entry = this.entries[playerId];
    entry.nextActionAt += Math.max(0, actionDelay) + Math.max(0, elapsedTurnSeconds) * InitiativeScheduler.TIME_DELAY_FACTOR;
  }

  preview(count: number, projectedDelay?: (playerId: PlayerId) => number): PlayerId[] {
    const entries = this.entries.map((entry) => ({ ...entry })) as [InitiativeEntry, InitiativeEntry];
    const result: PlayerId[] = [];
    for (let index = 0; index < count; index += 1) {
      entries.sort((left, right) => left.nextActionAt - right.nextActionAt || left.playerId - right.playerId);
      const next = entries[0]!;
      result.push(next.playerId);
      next.nextActionAt += projectedDelay?.(next.playerId) ?? 1;
    }
    return result;
  }

  snapshot(): InitiativeEntry[] {
    return this.entries.map((entry) => ({ ...entry }));
  }

  private sortedEntries(): InitiativeEntry[] {
    return [...this.entries].sort((left, right) => left.nextActionAt - right.nextActionAt || left.playerId - right.playerId);
  }
}
