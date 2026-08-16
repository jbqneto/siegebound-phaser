export class FullscreenController {
  private unavailable = false;

  constructor(private readonly target: HTMLElement) {}

  get supported(): boolean { return !this.unavailable && document.fullscreenEnabled && typeof this.target.requestFullscreen === 'function'; }
  get active(): boolean { return document.fullscreenElement !== null; }

  async toggle(): Promise<boolean> {
    if (!this.supported && !this.active) return false;
    try {
      if (this.active) await document.exitFullscreen();
      else await this.target.requestFullscreen({ navigationUI: 'hide' });
      return true;
    } catch (error) {
      this.unavailable = true;
      console.warn('Fullscreen request was rejected; continuing in the browser viewport.', error);
      return false;
    }
  }
}
