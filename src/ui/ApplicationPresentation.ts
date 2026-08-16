export type ApplicationPresentationState = 'PORTRAIT_GUARD' | 'PRE_MATCH_GUIDE' | 'PLAYING' | 'PAUSED_HELP';

/** Presentation-only state machine. The deterministic match never needs to know why it is paused. */
export class ApplicationPresentation {
  state: ApplicationPresentationState = 'PRE_MATCH_GUIDE';
  private matchStarted = false;
  private guideOpen = true;

  get hasStarted(): boolean { return this.matchStarted; }

  setPortrait(portrait: boolean): ApplicationPresentationState {
    if (portrait) this.state = 'PORTRAIT_GUARD';
    else this.state = !this.matchStarted ? 'PRE_MATCH_GUIDE' : this.guideOpen ? 'PAUSED_HELP' : 'PLAYING';
    return this.state;
  }

  openHelp(): ApplicationPresentationState {
    if (!this.matchStarted || this.state === 'PORTRAIT_GUARD') return this.state;
    this.guideOpen = true;
    return (this.state = 'PAUSED_HELP');
  }

  continueMatch(): ApplicationPresentationState {
    this.matchStarted = true;
    this.guideOpen = false;
    return (this.state = 'PLAYING');
  }
}
