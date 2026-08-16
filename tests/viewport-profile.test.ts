import { describe, expect, it } from 'vitest';
import { classifyLandscape, shouldPauseForOrientation } from '../src/ui/ViewportProfile';

describe('viewport decisions', () => {
  it('centralizes landscape layout thresholds', () => {
    expect(classifyLandscape(1.5)).toBe('compact-landscape');
    expect(classifyLandscape(1.8)).toBe('standard-landscape');
    expect(classifyLandscape(2.2)).toBe('wide-landscape');
  });
  it('pauses only in portrait and resumes in landscape', () => {
    expect(shouldPauseForOrientation({ orientation: 'landscape' })).toBe(false);
    expect(shouldPauseForOrientation({ orientation: 'portrait' })).toBe(true);
    expect(shouldPauseForOrientation({ orientation: 'landscape' })).toBe(false);
  });
});
