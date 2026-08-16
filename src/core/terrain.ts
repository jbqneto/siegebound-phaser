import type { Vec2 } from './types';

export class HeightmapTerrain {
  readonly width: number;
  readonly height: number;
  readonly surface: Float32Array;
  revision = 0;

  constructor(width: number, height: number, seed = 12345) {
    this.width = width;
    this.height = height;
    this.surface = new Float32Array(width);
    this.generate(seed);
  }

  getHeightAt(x: number): number {
    const index = Math.max(0, Math.min(this.width - 1, Math.round(x)));
    return this.surface[index] ?? this.height;
  }

  getSlopeAngleAt(x: number): number {
    const left = this.getHeightAt(x - 4);
    const right = this.getHeightAt(x + 4);
    return Math.atan2(right - left, 8);
  }

  isSolid(point: Vec2): boolean {
    if (point.x < 0 || point.x >= this.width || point.y >= this.height) return true;
    if (point.y < 0) return false;
    return point.y >= this.getHeightAt(point.x);
  }

  carveCrater(cx: number, cy: number, radius: number): void {
    const from = Math.max(0, Math.floor(cx - radius));
    const to = Math.min(this.width - 1, Math.ceil(cx + radius));

    for (let x = from; x <= to; x += 1) {
      const dx = x - cx;
      const inside = radius * radius - dx * dx;
      if (inside <= 0) continue;
      const lowerEdge = cy + Math.sqrt(inside);
      this.surface[x] = Math.min(this.height - 4, Math.max(this.surface[x] ?? 0, lowerEdge));
    }

    this.smoothRegion(from - 3, to + 3, 1);
    this.revision += 1;
  }

  private generate(seed: number): void {
    const base = this.height * 0.68;
    const p1 = (seed % 97) * 0.03;
    const p2 = (seed % 53) * 0.05;

    for (let x = 0; x < this.width; x += 1) {
      const normalized = x / this.width;
      const hills = Math.sin(normalized * Math.PI * 3.2 + p1) * 46;
      const detail = Math.sin(normalized * Math.PI * 9.1 + p2) * 18;
      const valley = -70 * Math.exp(-Math.pow((normalized - 0.52) / 0.14, 2));
      const edgeLift = 22 * Math.abs(normalized - 0.5);
      this.surface[x] = base - hills - detail - valley + edgeLift;
    }

    this.smoothRegion(0, this.width - 1, 4);
  }

  private smoothRegion(from: number, to: number, passes: number): void {
    const start = Math.max(1, Math.floor(from));
    const end = Math.min(this.width - 2, Math.ceil(to));

    for (let pass = 0; pass < passes; pass += 1) {
      const copy = this.surface.slice();
      for (let x = start; x <= end; x += 1) {
        const left = copy[x - 1] ?? copy[x] ?? 0;
        const mid = copy[x] ?? 0;
        const right = copy[x + 1] ?? copy[x] ?? 0;
        this.surface[x] = left * 0.2 + mid * 0.6 + right * 0.2;
      }
    }
  }
}
