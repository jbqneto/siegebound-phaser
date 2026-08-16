import Phaser from 'phaser';
import type { ViewportProfile } from './ViewportProfile';

export class HudActions {
  private readonly help: Phaser.GameObjects.Rectangle;
  private readonly helpLabel: Phaser.GameObjects.Text;
  private readonly fullscreen: Phaser.GameObjects.Rectangle;
  private readonly fullscreenLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, actions: { help(): void; fullscreen(): void }) {
    const makeButton = (label: string, action: () => void) => {
      const background = scene.add.rectangle(0, 0, 46, 46, 0x101820, 0.92).setStrokeStyle(2, 0xdbe7ed, 0.7).setDepth(35).setScrollFactor(0).setInteractive({ useHandCursor: true });
      const text = scene.add.text(0, 0, label, { fontFamily: 'system-ui, sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#fff4d6' }).setOrigin(0.5).setDepth(36).setScrollFactor(0);
      background.on('pointerdown', action);
      return [background, text] as const;
    };
    [this.help, this.helpLabel] = makeButton('?', actions.help);
    [this.fullscreen, this.fullscreenLabel] = makeButton('⛶', actions.fullscreen);
  }

  layout(profile: ViewportProfile, show: boolean, fullscreenAvailable: boolean): void {
    const width = this.help.scene.scale.width;
    const sx = width / profile.width, sy = this.help.scene.scale.height / profile.height;
    const right = width - profile.safeArea.right * sx - 26, top = profile.safeArea.top * sy + 124;
    this.setPair(this.help, this.helpLabel, show, right - 54, top);
    this.setPair(this.fullscreen, this.fullscreenLabel, show && fullscreenAvailable, right, top);
  }

  setFullscreenActive(active: boolean): void { this.fullscreen.setFillStyle(active ? 0x263949 : 0x101820, 0.92); }

  private setPair(background: Phaser.GameObjects.Rectangle, label: Phaser.GameObjects.Text, visible: boolean, x: number, y: number): void {
    background.setVisible(visible).setPosition(x, y); label.setVisible(visible).setPosition(x, y);
  }
}
