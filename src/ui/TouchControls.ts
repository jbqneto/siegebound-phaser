import Phaser from 'phaser';
import type { GameModel } from '../game/GameModel';
import type { GameplayInputController } from '../input/GameplayInputController';
import type { ViewportProfile } from './ViewportProfile';

type Button = { background: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; role?: 'primary' | 'secondary' | 'signature' };

export class TouchControls {
  private readonly buttons: Button[] = [];
  private firePointer: number | null = null;
  private visible = false;

  constructor(private readonly scene: Phaser.Scene, private readonly input: GameplayInputController) {
    this.makeHold('◀', (active) => input.moveLeft(active));
    this.makeHold('▶', (active) => input.moveRight(active));
    this.makeHold('−', (active) => input.aimDown(active));
    this.makeHold('+', (active) => input.aimUp(active));
    this.makeTap('1', () => input.selectPrimary(), 'primary');
    this.makeTap('2', () => input.selectSecondary(), 'secondary');
    this.makeTap('3', () => input.selectSignature(), 'signature');
    this.makeFire();
    this.makeTap('PASS', () => input.passTurn());
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => this.releaseFire(pointer));
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  layout(profile: ViewportProfile, show: boolean): void {
    this.visible = show;
    for (const button of this.buttons) { button.background.setVisible(show); button.label.setVisible(show); }
    if (!show) { this.input.clearHeld(); return; }
    const width = this.scene.scale.width, height = this.scene.scale.height;
    const sx = width / profile.width, sy = height / profile.height;
    const left = profile.safeArea.left * sx + 24, right = width - profile.safeArea.right * sx - 24;
    const bottom = height - profile.safeArea.bottom * sy - 22;
    const size = profile.formFactor === 'compact-landscape' ? 58 : 64;
    const positions: Array<[number, number, number, number]> = [
      [left + size / 2, bottom - size / 2, size, size], [left + size * 1.65, bottom - size / 2, size, size],
      [left + size / 2, bottom - size * 1.65, size, size], [left + size * 1.65, bottom - size * 1.65, size, size],
      [right - 220, bottom - size * 1.65, 52, 52], [right - 158, bottom - size * 1.65, 52, 52], [right - 96, bottom - size * 1.65, 52, 52],
      [right - 105, bottom - 36, 210, 72], [right - 250, bottom - 29, 76, 54],
    ];
    this.buttons.forEach((button, index) => {
      const p = positions[index]!; button.background.setPosition(p[0], p[1]).setSize(p[2], p[3]).setDisplaySize(p[2], p[3]); button.label.setPosition(p[0], p[1]);
    });
  }

  update(model: GameModel): void {
    if (!this.visible) return;
    for (const button of this.buttons) if (button.role) {
      const selected = button.role === model.selectedWeaponRole;
      button.background.setFillStyle(selected ? 0xb8782e : 0x101820, selected ? 0.98 : 0.88).setStrokeStyle(selected ? 3 : 1, selected ? 0xffdfa0 : 0xc8a66a, 1);
    }
    const fire = this.buttons[7]!;
    fire.label.setText(this.input.state.charging ? `RELEASE TO FIRE  ${Math.round(model.currentMachine.power * 100)}%` : 'HOLD TO FIRE');
  }

  cancel(): void { this.firePointer = null; this.input.clearHeld(); }

  private base(label: string): Button {
    const background = this.scene.add.rectangle(0, 0, 60, 60, 0x101820, 0.9).setStrokeStyle(2, 0xc8a66a, 0.9).setScrollFactor(0).setDepth(30).setInteractive();
    const text = this.scene.add.text(0, 0, label, { fontFamily: 'system-ui, sans-serif', fontSize: label.length > 4 ? '16px' : '25px', fontStyle: 'bold', color: '#fff4d6' }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    const button = { background, label: text }; this.buttons.push(button); return button;
  }
  private makeHold(label: string, change: (active: boolean) => void): void {
    const button = this.base(label);
    button.background.on('pointerdown', () => change(true)).on('pointerup', () => change(false)).on('pointerout', () => change(false));
  }
  private makeTap(label: string, action: () => void, role?: Button['role']): void { const button = this.base(label); button.role = role; button.background.on('pointerdown', action); }
  private makeFire(): void {
    const button = this.base('HOLD TO FIRE');
    button.background.on('pointerdown', (pointer: Phaser.Input.Pointer) => { this.firePointer = pointer.id; this.input.beginCharge(); });
    button.background.on('pointerup', (pointer: Phaser.Input.Pointer) => this.releaseFire(pointer));
    button.background.on('pointerout', (pointer: Phaser.Input.Pointer) => { if (!pointer.isDown) this.releaseFire(pointer); });
  }
  private releaseFire(pointer: Phaser.Input.Pointer): void { if (pointer.id !== this.firePointer) return; this.firePointer = null; this.input.releaseChargeAndFire(); }
  private destroy(): void { this.cancel(); this.scene.input.off('pointerup'); for (const button of this.buttons) { button.background.destroy(); button.label.destroy(); } }
}
