import { createProjectile, FIXED_DT, stepProjectile, clamp } from '../core/ballistics';
import { InitiativeScheduler } from '../core/initiative';
import { SeededRandom } from '../core/random';
import { HeightmapTerrain } from '../core/terrain';
import type { ConditionId, EraId, MachineId, MachineState, PlayerId, ProjectileState, StageId, TurnState, WeaponDefinition, WeaponRole } from '../core/types';
import { ERAS, MACHINES, WEAPONS } from '../data/catalog';
import { CONDITION_ORDER, CONDITIONS } from '../data/conditions';
import { STAGES, STAGE_ORDER } from '../data/stages';

export interface ImpactEvent {
  x: number;
  y: number;
  radius: number;
  damage: number;
  owner: PlayerId;
}

export class GameModel {
  static readonly TURN_DURATION_SECONDS = 20;
  readonly width: number;
  readonly height: number;
  terrain: HeightmapTerrain;
  machines: [MachineState, MachineState];
  projectile: ProjectileState | null = null;
  eraId: EraId = 'late-antiquity';
  stageId: StageId = 'open-field';
  activePlayer: PlayerId = 0;
  turnState: TurnState = 'ACTIVE';
  selectedWeaponRole: WeaponRole = 'primary';
  wind = 0;
  conditionId: ConditionId = 'normal';
  nextConditionId: ConditionId = 'strong-gust';
  turnNumber = 1;
  turnSecondsLeft = GameModel.TURN_DURATION_SECONDS;
  winner: PlayerId | null = null;
  lastImpact: ImpactEvent | null = null;
  private readonly initiative = new InitiativeScheduler();
  private pendingActionDelay = 0;

  private accumulator = 0;
  private readonly random = new SeededRandom(0x5eed1234);

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.terrain = new HeightmapTerrain(width, height, STAGES['open-field'].terrainSeed);
    this.machines = [
      this.makeMachine(0, 'ballista', width * 0.17, 1),
      this.makeMachine(1, 'onager', width * 0.83, -1),
    ];
    this.setStage('open-field');
  }

  update(deltaSeconds: number): void {
    this.lastImpact = null;
    if (this.winner !== null) return;

    if (this.turnState === 'PREPARE') {
      this.turnState = 'ACTIVE';
      return;
    }

    if (!this.projectile || !this.projectile.alive) {
      this.turnSecondsLeft = Math.max(0, this.turnSecondsLeft - Math.max(0, deltaSeconds));
      if (this.turnSecondsLeft <= 0.001) this.pass();
      return;
    }

    this.accumulator += Math.min(deltaSeconds, 0.05);

    while (this.accumulator >= FIXED_DT && this.projectile?.alive) {
      stepProjectile(this.projectile, FIXED_DT, this.effectiveWind, this.projectileGravityMultiplier);
      this.accumulator -= FIXED_DT;
      this.detectProjectileCollision();
    }
  }

  fire(): boolean {
    if (this.projectile || this.winner !== null || (this.turnState !== 'ACTIVE' && this.turnState !== 'CHARGING')) return false;

    const machine = this.currentMachine;
    const def = MACHINES[machine.machineId];
    const weapon = this.currentWeapon;
    const muzzle = this.getMuzzlePosition(machine);

    this.projectile = createProjectile(machine.playerId, {
      origin: muzzle,
      angleDeg: machine.angleDeg,
      power: machine.power,
      direction: machine.facing,
      muzzleVelocity: def.muzzleVelocity * this.projectileVelocityMultiplier,
      profile: weapon.profile,
      behavior: weapon.behavior,
    });
    this.pendingActionDelay = def.baseDelay + weapon.delay;
    this.turnState = 'PROJECTILE';

    return true;
  }

  beginCharge(): boolean {
    if (this.projectile || this.winner !== null || this.turnState !== 'ACTIVE') return false;
    this.turnState = 'CHARGING';
    return true;
  }

  cancelCharge(): void {
    if (this.turnState === 'CHARGING') this.turnState = 'ACTIVE';
  }

  pass(): boolean {
    if (this.projectile || this.winner !== null || this.turnState !== 'ACTIVE') return false;
    const machine = this.currentMachine;
    this.pendingActionDelay = MACHINES[machine.machineId].baseDelay + 180;
    this.endTurn();
    return true;
  }

  selectWeapon(role: WeaponRole): boolean {
    if (this.projectile || this.winner !== null || this.turnState !== 'ACTIVE') return false;
    this.selectedWeaponRole = role;
    return true;
  }

  changeAngle(delta: number): void {
    if (this.projectile || this.winner !== null) return;
    const machine = this.currentMachine;
    const def = MACHINES[machine.machineId];
    machine.angleDeg = clamp(machine.angleDeg + delta, def.minAngle, def.maxAngle);
  }

  changePower(delta: number): void {
    if (this.projectile || this.winner !== null) return;
    this.currentMachine.power = clamp(this.currentMachine.power + delta, 0.15, 1);
  }

  setPower(power: number): void {
    if (this.projectile || this.winner !== null) return;
    this.currentMachine.power = clamp(power, 0.15, 1);
  }

  moveCurrent(deltaX: number): void {
    if (this.projectile || this.winner !== null) return;
    const machine = this.currentMachine;
    const amount = clamp(deltaX, -machine.movementLeft, machine.movementLeft);
    const target = clamp(machine.x + amount, 55, this.width - 55);
    const actual = target - machine.x;
    machine.x = target;
    machine.movementLeft = Math.max(0, machine.movementLeft - Math.abs(actual));
    machine.y = this.terrain.getHeightAt(machine.x) - 18;
  }

  cycleMachine(playerId: PlayerId, nextMachineId: MachineId): void {
    if (this.projectile || this.winner !== null) return;
    const machine = this.machines[playerId];
    const def = MACHINES[nextMachineId];
    machine.machineId = nextMachineId;
    machine.hp = Math.min(machine.hp, def.maxHp);
    machine.angleDeg = clamp(machine.angleDeg, def.minAngle, def.maxAngle);
    machine.movementLeft = def.movementPerTurn;
  }

  setEra(eraId: EraId): void {
    this.eraId = eraId;
  }

  setStage(stageId: StageId): void {
    const stage = STAGES[stageId];
    this.stageId = stageId;
    this.eraId = stage.eraId;
    this.terrain = new HeightmapTerrain(this.width, this.height, stage.terrainSeed);
    this.activePlayer = 0;
    this.turnState = 'ACTIVE';
    this.selectedWeaponRole = 'primary';
    this.turnNumber = 1;
    this.turnSecondsLeft = GameModel.TURN_DURATION_SECONDS;
    this.winner = null;
    this.projectile = null;
    this.lastImpact = null;
    this.pendingActionDelay = 0;
    this.initiative.reset();
    this.conditionId = 'normal';
    this.nextConditionId = this.pickNextCondition();
    this.machines = [
      this.makeMachine(0, stage.machineIds[0] ?? 'onager', this.width * stage.spawnX[0], 1),
      this.makeMachine(1, stage.machineIds[stage.machineIds.length - 1] ?? 'onager', this.width * stage.spawnX[1], -1),
    ];
    this.rollWind();
    this.settleMachines();
  }

  nextStage(): void {
    const current = STAGE_ORDER.indexOf(this.stageId);
    const next = STAGE_ORDER[(current + 1) % STAGE_ORDER.length] ?? 'open-field';
    this.setStage(next);
  }

  reset(): void {
    const current = STAGE_ORDER.indexOf(this.stageId);
    const next = STAGE_ORDER[(current + 1) % STAGE_ORDER.length] ?? 'open-field';
    this.setStage(next);
  }

  get currentMachine(): MachineState {
    return this.machines[this.activePlayer];
  }

  get currentWeapon(): WeaponDefinition {
    const machine = MACHINES[this.currentMachine.machineId];
    return WEAPONS[machine.weaponIds[this.selectedWeaponRole]];
  }

  get condition() {
    return CONDITIONS[this.conditionId];
  }

  get nextCondition() {
    return CONDITIONS[this.nextConditionId];
  }

  get effectiveWind(): number {
    return this.wind * this.condition.windMultiplier;
  }

  get projectileGravityMultiplier(): number {
    return this.condition.gravityMultiplier;
  }

  get projectileVelocityMultiplier(): number {
    return this.condition.velocityMultiplier;
  }

  get initiativePreview(): PlayerId[] {
    return this.initiative.preview(6, (playerId) => {
      const machine = this.machines[playerId];
      return MACHINES[machine.machineId].baseDelay + WEAPONS[MACHINES[machine.machineId].weaponIds.primary].delay;
    });
  }

  get era() {
    return ERAS[this.eraId];
  }

  get stage() {
    return STAGES[this.stageId];
  }

  hasVisualContact(): boolean {
    const left = this.machines[0];
    const right = this.machines[1];
    if (Math.abs(right.x - left.x) > this.stage.maxVisualContactDistance) return false;

    const from = Math.min(left.x, right.x);
    const to = Math.max(left.x, right.x);
    const steps = Math.max(1, Math.ceil((to - from) / 12));
    for (let index = 1; index < steps; index += 1) {
      const ratio = index / steps;
      const x = from + (to - from) * ratio;
      const lineY = left.y + (right.y - left.y) * ratio;
      if (this.terrain.getHeightAt(x) < lineY - 4) return false;
    }

    return true;
  }

  getMuzzlePosition(machine: MachineState) {
    const def = MACHINES[machine.machineId];
    const angle = (machine.angleDeg * Math.PI) / 180;
    const arm = def.silhouette === 'trebuchet' ? 42 : def.silhouette === 'crossbow' ? 34 : 36;
    return {
      x: machine.x + Math.cos(angle) * arm * machine.facing,
      y: machine.y - 18 - Math.sin(angle) * arm,
    };
  }

  private makeMachine(playerId: PlayerId, machineId: MachineId, x: number, facing: -1 | 1): MachineState {
    const def = MACHINES[machineId];
    return {
      playerId,
      machineId,
      x,
      y: this.terrain.getHeightAt(x) - 18,
      hp: def.maxHp,
      angleDeg: machineId === 'ballista' ? 34 : 52,
      power: 0.72,
      movementLeft: def.movementPerTurn,
      facing,
    };
  }

  private detectProjectileCollision(): void {
    const projectile = this.projectile;
    if (!projectile) return;

    const p = projectile.position;
    const outOfBounds = p.x < -100 || p.x > this.width + 100 || p.y > this.height + 100;
    const directHit = this.machines.some((machine) => {
      if (machine.playerId === projectile.owner && projectile.ageSeconds < 0.25) return false;
      return Math.hypot(machine.x - p.x, machine.y - p.y) <= 24 + projectile.profile.radius;
    });
    const hitTerrain = this.terrain.isSolid(p);

    if (outOfBounds) {
      projectile.alive = false;
      this.projectile = null;
      this.endTurn();
      return;
    }

    if (!hitTerrain && !directHit) return;

    if (hitTerrain && projectile.behavior === 'piercing' && projectile.terrainPiercesRemaining > 0) {
      projectile.terrainPiercesRemaining -= 1;
      this.terrain.carveCrater(p.x, p.y, Math.max(8, projectile.profile.blastRadius * 0.35));
      return;
    }

    projectile.alive = false;
    this.turnState = 'RESOLVE';
    const impact: ImpactEvent = {
      x: clamp(p.x, 0, this.width - 1),
      y: clamp(p.y, 0, this.height - 1),
      radius: projectile.profile.blastRadius,
      damage: projectile.profile.damage,
      owner: projectile.owner,
    };

    this.resolveImpact(impact);
    this.lastImpact = impact;
    this.projectile = null;
    this.endTurn();
  }

  private resolveImpact(impact: ImpactEvent): void {
    this.terrain.carveCrater(impact.x, impact.y, impact.radius);

    for (const machine of this.machines) {
      const dx = machine.x - impact.x;
      const dy = machine.y - impact.y;
      const distance = Math.hypot(dx, dy);
      const damageRadius = impact.radius * 1.7;
      if (distance >= damageRadius) continue;

      const falloff = 1 - distance / damageRadius;
      machine.hp = Math.max(0, machine.hp - impact.damage * falloff);
      if (machine.hp <= 0) this.winner = machine.playerId === 0 ? 1 : 0;
    }

    this.settleMachines();
  }

  private settleMachines(): void {
    for (const machine of this.machines) {
      machine.y = this.terrain.getHeightAt(machine.x) - 18;
    }
  }

  private endTurn(): void {
    if (this.winner !== null) {
      this.turnState = 'MATCH_END';
      return;
    }
    const elapsedTurnSeconds = GameModel.TURN_DURATION_SECONDS - this.turnSecondsLeft;
    this.initiative.commitAction(this.activePlayer, this.pendingActionDelay, elapsedTurnSeconds);
    this.activePlayer = this.initiative.activePlayer;
    this.turnNumber += 1;
    const def = MACHINES[this.currentMachine.machineId];
    this.currentMachine.movementLeft = def.movementPerTurn;
    this.turnSecondsLeft = GameModel.TURN_DURATION_SECONDS;
    this.selectedWeaponRole = 'primary';
    this.pendingActionDelay = 0;
    this.conditionId = this.nextConditionId;
    this.nextConditionId = this.pickNextCondition();
    this.turnState = 'PREPARE';
    this.rollWind();
  }

  private pickNextCondition(): ConditionId {
    const index = Math.floor(this.random.next() * CONDITION_ORDER.length);
    return CONDITION_ORDER[index] ?? 'normal';
  }

  private rollWind(): void {
    // Gameplay acceleration in px/s². Kept intentionally modest for learnable trajectories.
    this.wind = Math.round(this.random.range(-48, 48) * 10) / 10;
  }
}
