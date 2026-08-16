# AGENTS.md

## Project intent

This repository is a technical prototype for a deterministic 2D turn-based artillery game with mobile siege engines across historically inspired eras.

The current milestone is **game feel validation**, not production completeness.

## Architectural rules

1. `src/core` MUST NOT import Phaser or browser APIs.
2. Projectile gameplay physics MUST remain deterministic and fixed-timestep.
3. Do not replace the custom projectile simulation with Arcade Physics, Matter or Box2D without an explicit design decision.
4. Rendering is allowed to be approximate. Gameplay state is the source of truth.
5. New machine differences must be data-driven through `MachineDefinition` before adding machine-specific branches.
6. Terrain is intentionally a heightmap in this milestone. Do not introduce polygon boolean operations or pixel-mask terrain until the core loop has been validated.
7. Avoid backend, persistence, authentication, matchmaking and monetization work in the current milestone.
8. Preserve deterministic seeds where randomness affects gameplay.
9. Add/adjust tests whenever changing ballistic or terrain rules.

## Current acceptance criteria

A player must be able to:

- move within the turn allowance;
- adjust angle and power;
- understand wind direction and strength;
- fire a projectile with a readable arc;
- hit terrain and produce a crater;
- damage the opponent by proximity;
- switch between machines and feel meaningful ballistic differences;
- change era and see a distinct roster/presentation;
- complete a local two-player match.

## Coding conventions

- TypeScript strict mode.
- Prefer pure functions in `core`.
- Keep Phaser-specific code under `render`, `scenes`, and `ui`.
- Do not hide balancing constants inside rendering code.
- Prefer explicit domain names (`blastRadius`, `windFactor`, `movementPerTurn`) over generic numeric parameters.

## Rendering foundation

- Keep semantic world/HUD ordering centralized in `src/render/BattleDepth.ts`.
- Background presets are data-driven; procedural layers must remain replaceable by assets.
- `TerrainRenderer`, machine views, projectile presentation, effects, and `CameraDirector` consume gameplay state but never mutate it.
- Camera motion and terrain slope rotation are presentation-only.
