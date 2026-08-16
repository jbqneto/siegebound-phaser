# Mobile landscape controls

SiegeBound uses one `GameModel` and deterministic projectile simulation on every
platform. Keyboard and touch adapters issue commands through the same gameplay
input controller; viewport size never changes range, terrain, weapon behavior, or
simulation rules.

## Presentation and controls

- Mobile gameplay is landscape-only. Portrait displays an orientation guard,
  clears held input, and pauses local match progression without resetting it.
  Online play will need a server-owned pause/timer policy to prevent exploits.
- The responsive HUD retains player/HP, wind, timer, weapon, angle, charge, and
  initiative while hiding verbose stage, condition, and keyboard help on touch.
- CSS safe-area environment insets are measured only by presentation code. HUD and
  controls stay inside them while the world may render behind them.
- The left thumb has hold-to-move and hold-to-aim buttons. The right has three
  weapons, large hold/release Fire, and subordinate Pass. Interruption, rotation,
  stage changes, and shutdown cancel held state.
- Phaser keeps a 1280×720 logical view fitted to the browser; gameplay coordinates
  remain unchanged as browser dimensions change.

## Manual real-phone acceptance checklist

- Open portrait, see the guard, rotate to landscape, rotate away/back, and confirm
  the same match resumes with its timer unchanged while portrait.
- Hold/release Left, Right, angle −, and angle +; confirm release stops input and
  existing movement allowance/angle limits apply.
- Select 1/2/3 and verify the active state is obvious.
- Hold Fire, observe power rise, release, and verify shot, camera, impact, crater,
  damage, initiative, and next turn. Interrupt Fire and check charge is not stuck.
- Pass; check text and thumb comfort, notch/gesture-bar clearance, and no scrolling.
- Test a real Android phone, desktop keyboard, and desktop with `?touchUi=1`.

## Deferred work

Portrait gameplay, pinch zoom, battlefield pan, drag aiming, haptics, PWA/offline,
native wrappers and stores, aim assist, auto-fire, and multiplayer orientation
policy are deferred. Wider devices currently render more without changing the
simulation; ranked play may later normalize its competitive information viewport.
