import { describe, expect, it } from 'vitest';
import { ApplicationPresentation } from '../src/ui/ApplicationPresentation';

describe('application presentation', () => {
  it('requires an explicit start and preserves the pre-match guide across portrait', () => {
    const presentation = new ApplicationPresentation();
    expect(presentation.state).toBe('PRE_MATCH_GUIDE');
    expect(presentation.setPortrait(true)).toBe('PORTRAIT_GUARD');
    expect(presentation.setPortrait(false)).toBe('PRE_MATCH_GUIDE');
    expect(presentation.hasStarted).toBe(false);
  });

  it('pauses for help and resumes without resetting match state', () => {
    const presentation = new ApplicationPresentation();
    expect(presentation.continueMatch()).toBe('PLAYING');
    expect(presentation.openHelp()).toBe('PAUSED_HELP');
    expect(presentation.setPortrait(true)).toBe('PORTRAIT_GUARD');
    expect(presentation.setPortrait(false)).toBe('PAUSED_HELP');
    expect(presentation.continueMatch()).toBe('PLAYING');
    expect(presentation.hasStarted).toBe(true);
  });

  it('automatically returns an active match from portrait to playing', () => {
    const presentation = new ApplicationPresentation();
    presentation.continueMatch();
    presentation.setPortrait(true);
    expect(presentation.setPortrait(false)).toBe('PLAYING');
  });
});
