export type PlayerId = 0 | 1;
export type EraId = 'classical' | 'late-antiquity' | 'high-medieval';
export type MachineId = 'ballista' | 'onager' | 'traction-trebuchet' | 'counterweight-trebuchet';
export type StageId = 'open-field' | 'long-ridge' | 'hidden-basin';
export type WeaponRole = 'primary' | 'secondary' | 'signature';
export type WeaponId =
  | 'ballista-heavy-bolt' | 'ballista-split-bolt' | 'ballista-piercing-lance'
  | 'onager-stone' | 'onager-stone-cluster' | 'onager-siege-boulder'
  | 'traction-sling-stone' | 'traction-double-sling' | 'traction-fire-pot'
  | 'counterweight-heavy-stone' | 'counterweight-demolition-shot' | 'counterweight-great-boulder';
export type ProjectileBehaviorId = 'standard' | 'piercing' | 'scatter-at-apex';
export type TurnState = 'PREPARE' | 'ACTIVE' | 'CHARGING' | 'PROJECTILE' | 'RESOLVE' | 'MATCH_END';
export type ConditionId = 'normal' | 'strong-gust' | 'wind-shift' | 'updraft' | 'heavy-rain' | 'supply-restriction';

export interface Vec2 {
  x: number;
  y: number;
}

export interface ProjectileProfile {
  radius: number;
  gravityScale: number;
  windFactor: number;
  damage: number;
  blastRadius: number;
}

export interface MachineDefinition {
  id: MachineId;
  name: string;
  era: EraId;
  description: string;
  baseDelay: number;
  muzzleVelocity: number;
  minAngle: number;
  maxAngle: number;
  movementPerTurn: number;
  maxHp: number;
  projectile: ProjectileProfile;
  weaponIds: {
    primary: WeaponId;
    secondary: WeaponId;
    signature: WeaponId;
  };
  silhouette: 'crossbow' | 'spoon' | 'traction' | 'trebuchet';
}

export interface WeaponDefinition {
  id: WeaponId;
  machineId: MachineId;
  name: string;
  role: WeaponRole;
  description: string;
  delay: number;
  behavior: ProjectileBehaviorId;
  profile: ProjectileProfile;
}

export interface BattlefieldConditionDefinition {
  id: ConditionId;
  name: string;
  description: string;
  windMultiplier: number;
  gravityMultiplier: number;
  velocityMultiplier: number;
}

export interface EraDefinition {
  id: EraId;
  name: string;
  period: string;
  description: string;
  skyTop: number;
  skyBottom: number;
  ground: number;
  accent: number;
  machineIds: MachineId[];
}

export interface StageDefinition {
  id: StageId;
  name: string;
  description: string;
  terrainSeed: number;
  eraId: EraId;
  machineIds: MachineId[];
  spawnX: [number, number];
  maxVisualContactDistance: number;
}

export interface MachineState {
  playerId: PlayerId;
  machineId: MachineId;
  x: number;
  y: number;
  hp: number;
  angleDeg: number;
  power: number;
  movementLeft: number;
  facing: -1 | 1;
}

export interface ProjectileState {
  owner: PlayerId;
  position: Vec2;
  velocity: Vec2;
  profile: ProjectileProfile;
  alive: boolean;
  ageSeconds: number;
  behavior: ProjectileBehaviorId;
  behaviorTriggered: boolean;
  terrainPiercesRemaining: number;
}

export interface ShotInput {
  origin: Vec2;
  angleDeg: number;
  power: number;
  direction: -1 | 1;
  muzzleVelocity: number;
  profile: ProjectileProfile;
  behavior?: ProjectileBehaviorId;
}
