# Game Design Direction — Prototype 0.1

## Core fantasy

Two crews command stylized mobile siege engines on destructible battlefields. The player reads terrain and wind, chooses angle and power, commits to a shot, and watches a dramatic ballistic payoff.

The machines are historically inspired, but mobility and cross-era matchups are intentional arcade abstractions.

## Why multiple eras

Trying to place every recognizable siege machine in one exact historical year makes the roster artificially narrow. The game instead treats history as a progression of **siege ages**. Each age can define its own visual language, maps and normal roster, while an arcade mode can allow cross-era combinations.

### Era 1 — Classical Siegecraft

Gameplay identity: precision, torsion, lighter projectiles, flatter trajectories.

Prototype roster:

- Ballista
- Onager (used here as the bridge toward late Roman artillery)

Visual direction:

- Mediterranean cliffs
- Roman/Hellenistic fortifications
- dry earth, timber frames, bronze/iron details

### Era 2 — Age of Transition

Gameplay identity: mixed technologies and more pronounced lobbed projectiles.

Prototype roster:

- Onager
- Traction Trebuchet

Visual direction:

- late Roman / Byzantine / early medieval inspiration
- hill forts and fortified towns
- more timber construction and rough stone

### Era 3 — High Medieval Siege

Gameplay identity: heavy payloads, large craters, high arcs, deliberate movement.

Prototype roster:

- Traction Trebuchet
- Counterweight Trebuchet

Visual direction:

- castles and walled towns
- larger silhouettes
- darker stone, heraldic accents, smoke and siege camps

## Machine design principle

A machine must change **how the player thinks about the shot**, not merely change damage.

| Machine | Primary skill test | Arc | Wind sensitivity | Terrain damage | Mobility |
|---|---|---:|---:|---:|---:|
| Ballista | precision | low | low | low | high |
| Onager | generalist judgement | medium | medium | medium | medium |
| Traction Trebuchet | wind + high arc | high | high | medium-high | medium-high |
| Counterweight Trebuchet | commitment + prediction | very high | high | very high | low |

## Implemented weapon and initiative slice

The prototype now gives every machine three data-driven weapon roles:

- **Primary** — reliable, lower delay action;
- **Secondary** — specialized projectile behavior and higher delay;
- **Signature** — high-impact action with the largest initiative cost.

Selection is available with `1`, `2` and `3`. The current action is committed by firing or by `Q` (Pass).

Turns are scheduled on a deterministic timeline rather than alternating strictly between players:

```text
nextActionAt += machine.baseDelay + weapon.delay
              + elapsedTurnSeconds * 12
```

Ties favor player 1. The HUD shows the next six projected players. Projectile behaviors currently include standard flight, piercing through one terrain layer and a scatter impulse at the apex. These behaviors are selected by weapon data, not by machine-specific branches.

The match model also exposes explicit turn states (`PREPARE`, `ACTIVE`, `CHARGING`, `PROJECTILE`, `RESOLVE`, `MATCH_END`). Battlefield Conditions currently rotate deterministically through Calm Field, Strong Gust, Wind Shift, Thermal Updraft, Heavy Rain and Supply Restriction. The active and next condition are public in the HUD; modifiers affect wind, gravity or muzzle velocity without changing the base wind value.

## Prototype questions to answer

Do not add production systems until these have answers:

1. Is aiming satisfying without a trajectory preview?
2. How strong can wind be before shots feel random rather than learnable?
3. Does movement materially improve tactical choices, or merely delay firing?
4. How large can craters become before the heightmap model feels visibly limited?
5. Do machine identities remain obvious after 5–10 turns?
6. Does the three-weapon structure create meaningful tradeoffs before adding items?
7. Should angle/power be continuous, stepped, or charge-timed?
8. Should the player be allowed to move before and after firing, or is firing the hard end-of-turn action?

## Deliberately deferred

- online multiplayer
- accounts / progression
- cosmetics
- economy
- matchmaking
- ranked mode
- item system (weapon slots are implemented; tactical items remain deferred)
- complex status effects
- pixel-mask terrain
- buildings with structural simulation
- physically simulated ropes/arms

These features are valuable only after the ballistic core loop proves itself.
