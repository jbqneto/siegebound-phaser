# Art Direction — Visual Vertical Slice

## Readability hierarchy

The battle image is composed from a muted, painterly background toward increasingly clear gameplay information:

```text
sky
↓ distant landscape
↓ distant castle / architecture
↓ far vegetation
↓ near vegetation
↓ readable destructible terrain
↓ high-contrast siege engines
↓ projectiles and VFX that communicate physics
↓ HUD
```

Atmospheric perspective reduces saturation, contrast and detail with distance. The terrain surface is intentionally clean and light enough to expose the exact collision heightmap. Subtle soil strata and stones add material character without disguising crater geometry. Machines use strong player accents and must remain separable from both terrain and scenery. Projectile trails, impact rings, dust and debris explain motion and impact; they never affect simulation.

## Runtime layers

`BattleBackdrop` owns data-driven, parallax background layers. `TerrainRenderer` reads terrain revision and redraws only after invalidation or terrain changes. `MachineRenderer` owns replaceable `MachineView` instances. `ProjectileRenderer` presents the authoritative projectile and cosmetic trail. `BattleFx` owns transient impact effects and non-colliding debris. `CameraDirector` consumes game state/events and coordinates player focus, aim look-ahead, smoothed projectile follow, impact hold and next-player movement. `Hud` remains fixed above all world layers.

Semantic depths are centralized in `BattleDepth`: sky, distant landscape, architecture, far vegetation, near vegetation, terrain, machines, projectile, effects and HUD.

## Future asset pipeline

Procedural placeholders should be replaced incrementally without changing gameplay or renderer boundaries:

```text
public/assets/
├── backgrounds/high-medieval-forest/
│   ├── sky.png
│   ├── distant-hills.png
│   ├── distant-castle.png
│   ├── forest-far.png
│   └── forest-near.png
├── terrain/forest/
│   ├── surface.png
│   ├── soil.png
│   └── rock.png
├── machines/
│   ├── onager/
│   ├── traction-trebuchet/
│   ├── counterweight-trebuchet/
│   └── ballista/
├── props/medieval/
├── vfx/{dust,smoke,fire,debris}/
└── ui/
```

A future `SpriteMachineView` can replace `ProceduralMachineView`. Machine packages may contain chassis, independent wheels, arm, counterweight, sling and projectile-anchor sprites. Their animation remains presentational; the model continues to provide position, aim, health and projectile origin.
