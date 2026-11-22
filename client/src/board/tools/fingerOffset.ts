import type { Vector2d } from "konva/lib/types";
import { FINGER_OFFSET, isFinger } from "../../finger";
import { CELL_SIZE, type Square } from "../../room/grid";
import { TAP_SCREEN_DISTANCE } from "../../tap";
import { LIFTED } from "../tokens/liftTokens";
import type { ToolPointer } from "./tool";

const TOKEN_ABOVE_FINGER = 40;

// Until the finger moves further than a tap, the end stays under it, so a tap creates nothing.
export function endAboveFinger(
  point: Vector2d,
  press: Vector2d,
  scale: number,
  lift = FINGER_OFFSET,
): Vector2d {
  const moved = Math.hypot(point.x - press.x, point.y - press.y) * scale;
  if (moved < TAP_SCREEN_DISTANCE) return point;
  return { x: point.x, y: point.y - lift / scale };
}

// How far above the finger a grabbed token goes, in screen pixels, so its lifted lower edge stays
// clear of the finger at every zoom and size. The extra half cell makes snapping round it upwards.
export function tokenLift(token: Square, pressY: number, scale: number) {
  const center = (token.y + token.size / 2) * CELL_SIZE;
  const lowerEdge = center + (token.size * CELL_SIZE * LIFTED) / 2;
  return (lowerEdge - pressY + CELL_SIZE / 2) * scale + TOKEN_ABOVE_FINGER;
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
