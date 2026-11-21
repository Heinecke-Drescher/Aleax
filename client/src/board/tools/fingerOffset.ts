import type { Vector2d } from "konva/lib/types";
import { FINGER_OFFSET, isFinger } from "../../finger";
import { TAP_SCREEN_DISTANCE } from "../../tap";
import type { ToolPointer } from "./tool";

// Until the finger moves further than a tap, the end stays under it, so a tap creates nothing.
export function endAboveFinger(
  point: Vector2d,
  press: Vector2d,
  scale: number,
): Vector2d {
  const moved = Math.hypot(point.x - press.x, point.y - press.y) * scale;
  if (moved < TAP_SCREEN_DISTANCE) return point;
  return { x: point.x, y: point.y - FINGER_OFFSET / scale };
}

// Mouse and pen keep the end under them.
export function draggedEnd(
  { point, event }: ToolPointer,
  press: Vector2d,
): Vector2d {
  if (!isFinger(event.evt)) return point;
  const stage = event.target.getStage();
  if (!stage) throw new Error("Pointer event without stage");
  return endAboveFinger(point, press, stage.scaleY());
}
