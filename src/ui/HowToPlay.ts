import Phaser from 'phaser';
import type { ViewportProfile } from './ViewportProfile';

export class HowToPlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly movement: Phaser.GameObjects.Text;
  private readonly angle: Phaser.GameObjects.Text;
  private readonly weapons: Phaser.GameObjects.Text;
  private readonly fire: Phaser.GameObjects.Text;
  private readonly pass: Phaser.GameObjects.Text;
  private readonly chargeDemo: Phaser.GameObjects.Graphics;
  private readonly fullscreenButton: Phaser.GameObjects.Rectangle;
  private readonly fullscreenLabel: Phaser.GameObjects.Text;
  private readonly continueButton: Phaser.GameObjects.Rectangle;
  private readonly continueLabel: Phaser.GameObjects.Text;
  private demoTime = 0;

  constructor(scene: Phaser.Scene, actions: { continue(): void; toggleFullscreen(): void }) {
    this.panel = scene.add.graphics();
    this.title = this.text(scene, 'HOW TO PLAY', 32, '#fff4d6', true);
    this.movement = this.text(scene, '', 18);
    this.angle = this.text(scene, '', 18);
    this.weapons = this.text(scene, '', 18);
    this.fire = this.text(scene, '', 19, '#fff4d6', true).setAlign('center');
    this.pass = this.text(scene, '', 18);
    this.chargeDemo = scene.add.graphics();
    this.fullscreenButton = scene.add.rectangle(0, 0, 290, 58, 0x263949).setStrokeStyle(2, 0x8bd4ff).setInteractive({ useHandCursor: true });
    this.fullscreenLabel = this.text(scene, '⛶  ENTER FULLSCREEN', 18, '#dce9f2', true).setOrigin(0.5);
    this.continueButton = scene.add.rectangle(0, 0, 290, 64, 0xb8782e).setStrokeStyle(3, 0xffdfa0).setInteractive({ useHandCursor: true });
    this.continueLabel = this.text(scene, 'START MATCH', 22, '#ffffff', true).setOrigin(0.5);
    this.fullscreenButton.on('pointerdown', actions.toggleFullscreen);
    this.continueButton.on('pointerdown', actions.continue);
    this.container = scene.add.container(0, 0, [this.panel, this.title, this.movement, this.angle, this.weapons, this.fire, this.pass, this.chargeDemo, this.fullscreenButton, this.fullscreenLabel, this.continueButton, this.continueLabel])
      .setScrollFactor(0).setDepth(110).setVisible(false);
  }

  setVisible(visible: boolean): void { this.container.setVisible(visible); }

  layout(profile: ViewportProfile, resume: boolean, fullscreenSupported: boolean, fullscreenActive: boolean): void {
    const width = this.container.scene.scale.width, height = this.container.scene.scale.height;
    const sx = width / profile.width, sy = height / profile.height;
    const safeLeft = profile.safeArea.left * sx + 18, safeRight = profile.safeArea.right * sx + 18;
    const safeTop = profile.safeArea.top * sy + 12, safeBottom = profile.safeArea.bottom * sy + 12;
    const x = safeLeft, y = safeTop, w = width - safeLeft - safeRight, h = height - safeTop - safeBottom;
    const compact = profile.height < 560;
    const fontScale = compact ? Math.min(1.65, sy) : 1;
    this.panel.clear().fillStyle(0x090d10, 0.985).fillRoundedRect(x, y, w, h, 14).lineStyle(2, 0xc8a66a, 0.8).strokeRoundedRect(x, y, w, h, 14);
    this.title.setPosition(x + w / 2, y + (compact ? 28 : 36)).setOrigin(0.5).setFontSize((compact ? 21 : 32) * fontScale);
    const top = y + (compact ? 58 : 82), left = x + 34, column = w * 0.27;
    const touch = profile.coarsePointer || new URLSearchParams(location.search).get('touchUi') === '1';
    this.movement.setText(touch ? 'MOVE\n[ ◀ ]  [ ▶ ]\nHold to move. Release to stop.' : 'MOVE\n←  →\nHold to move. Release to stop.');
    this.angle.setText(touch ? 'ANGLE\n[ − ]  58°  [ + ]\nHold to change angle.' : 'ANGLE\n↑  ↓\nHold to change angle.');
    this.weapons.setText('WEAPONS\n[1]  [2]  [3]\nPrimary · Secondary · Signature');
    this.pass.setText(touch ? 'PASS\nEnds the current turn.' : 'PASS  [ Q ]\nEnds the current turn.');
    for (const [text, tx] of [[this.movement, left], [this.angle, left + column], [this.weapons, left + column * 2]] as const) text.setPosition(tx, top).setFontSize((compact ? 13 : 18) * fontScale).setLineSpacing(compact ? 2 : 7);
    const fireY = top + (compact ? 105 : 142);
    this.fire.setText(touch ? 'FIRE\nPRESS AND HOLD TO CHARGE\n\nRELEASE TO FIRE' : 'FIRE\nHOLD SPACE TO CHARGE\n\nRELEASE SPACE TO FIRE').setPosition(x + w / 2, fireY).setOrigin(0.5, 0).setFontSize((compact ? 15 : 20) * fontScale).setLineSpacing(compact ? 2 : 5);
    const buttonHeight = compact ? 52 * sy : 64;
    this.pass.setPosition(left, y + h - buttonHeight - (compact ? 58 : 76)).setFontSize((compact ? 13 : 18) * fontScale);
    const buttonsY = y + h - buttonHeight / 2 - 10;
    const fullVisible = fullscreenSupported || fullscreenActive;
    this.fullscreenButton.setVisible(fullVisible).setPosition(x + w / 2 - 151, buttonsY).setSize(290, buttonHeight).setDisplaySize(290, buttonHeight);
    this.fullscreenLabel.setVisible(fullVisible).setPosition(this.fullscreenButton.x, buttonsY).setText(fullscreenActive ? '⛶  EXIT FULLSCREEN' : '⛶  ENTER FULLSCREEN').setFontSize((compact ? 14 : 18) * fontScale);
    const continueX = fullVisible ? x + w / 2 + 151 : x + w / 2;
    this.continueButton.setPosition(continueX, buttonsY).setSize(290, buttonHeight).setDisplaySize(290, buttonHeight);
    this.continueLabel.setPosition(continueX, buttonsY).setText(resume ? 'RESUME' : 'START MATCH').setFontSize((compact ? 17 : 22) * fontScale);
    this.chargeDemo.setPosition(x + w / 2 - 150, fireY + (compact ? 75 : 90));
  }

  update(deltaMs: number): void {
    if (!this.container.visible) return;
    this.demoTime = (this.demoTime + deltaMs / 1800) % 1;
    const ratio = this.demoTime < 0.78 ? this.demoTime / 0.78 : 1 - (this.demoTime - 0.78) / 0.22;
    this.chargeDemo.clear().fillStyle(0x05080a, 1).fillRoundedRect(0, 0, 300, 24, 4).fillStyle(0xe8b25d, 1).fillRoundedRect(3, 3, 294 * Math.max(0, ratio), 18, 3).lineStyle(2, 0xffdfa0, 0.9).strokeRoundedRect(0, 0, 300, 24, 4);
  }

  private text(scene: Phaser.Scene, value: string, size: number, color = '#dce9f2', bold = false): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, value, { fontFamily: 'system-ui, sans-serif', fontSize: `${size}px`, fontStyle: bold ? 'bold' : 'normal', color, lineSpacing: 6 });
  }
}
