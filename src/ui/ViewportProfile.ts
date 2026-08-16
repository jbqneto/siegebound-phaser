export type LandscapeFormFactor = 'compact-landscape' | 'standard-landscape' | 'wide-landscape';
export interface ViewportProfile {
  width: number; height: number; aspectRatio: number;
  orientation: 'landscape' | 'portrait';
  formFactor: LandscapeFormFactor;
  coarsePointer: boolean;
  safeArea: { top: number; right: number; bottom: number; left: number };
}

// Aspect-ratio thresholds, rather than device names, keep layout behavior predictable.
export function classifyLandscape(aspectRatio: number): LandscapeFormFactor {
  if (aspectRatio < 1.65) return 'compact-landscape';
  if (aspectRatio < 2.05) return 'standard-landscape';
  return 'wide-landscape';
}

export function shouldPauseForOrientation(profile: Pick<ViewportProfile, 'orientation'>): boolean { return profile.orientation === 'portrait'; }

export function readViewportProfile(): ViewportProfile {
  const width = window.innerWidth, height = window.innerHeight;
  const styles = getComputedStyle(document.documentElement);
  const inset = (name: string) => Number.parseFloat(styles.getPropertyValue(name)) || 0;
  const aspectRatio = width / Math.max(1, height);
  return {
    width, height, aspectRatio,
    orientation: height > width ? 'portrait' : 'landscape',
    formFactor: classifyLandscape(aspectRatio),
    coarsePointer: matchMedia('(pointer: coarse)').matches,
    safeArea: { top: inset('--safe-area-top'), right: inset('--safe-area-right'), bottom: inset('--safe-area-bottom'), left: inset('--safe-area-left') },
  };
}
