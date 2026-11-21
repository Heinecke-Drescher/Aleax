import type { Vector2d } from "konva/lib/types";

export interface Measurement {
  from: Vector2d;
  to: Vector2d;
  // The line runs between the centers of squares this many cells wide, e.g. a large token's.
  size: number;
}

export function cellDistance({ from, to }: Pick<Measurement, "from" | "to">) {
  return Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
}
