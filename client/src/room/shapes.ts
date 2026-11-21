import type { Vector2d } from "konva/lib/types";
import { CELL_SIZE, toCells } from "./grid";
import { validPoint } from "./points";
import { isRecord } from "./typeGuards";

export type ShapeKind = "cone" | "rectangle" | "circle";

export interface AreaShape {
  kind: ShapeKind;
  from: Vector2d;
  to: Vector2d;
}

export function isShapeKind(value: unknown): value is ShapeKind {
  return value === "cone" || value === "rectangle" || value === "circle";
}

export function validShape(value: unknown): AreaShape | null {
  if (!isRecord(value) || !isShapeKind(value.kind)) return null;
  const from = validPoint(value.from);
  const to = validPoint(value.to);
  if (!from || !to) return null;
  const shape = { kind: value.kind, from, to };
  return isEmptyShape(shape) ? null : shape;
}

export function shiftShape(
  { kind, from, to }: AreaShape,
  dx: number,
  dy: number,
): AreaShape {
  return {
    kind,
    from: { x: from.x + dx, y: from.y + dy },
    to: { x: to.x + dx, y: to.y + dy },
  };
}

// Takes over only the known fields, also from other players' data.
export function copyShape(shape: AreaShape) {
  return shiftShape(shape, 0, 0);
}

// A cone is as wide as it is long at every point (D&D 5e), so each side opens by atan(1/2).
const CONE_HALF_ANGLE = Math.atan(1 / 2);
const CIRCLE_CORNERS = 64;

// In cells; a cone or circle has one length, given as both.
export function shapeSize({ kind, from, to }: AreaShape) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (kind !== "rectangle") {
    const length = toCells(Math.hypot(dx, dy));
    return { width: length, height: length };
  }
  const width = toCells(Math.abs(dx));
  const height = toCells(Math.abs(dy));
  if (width === 0 && height === 0) return { width, height };
  // So a 5 ft line along a grid line needs no aiming.
  return { width: Math.max(width, 1), height: Math.max(height, 1) };
}

export function isEmptyShape(shape: AreaShape) {
  return shapeSize(shape).width === 0;
}

export function shapeOutline(shape: AreaShape): number[] | null {
  const { kind, from, to } = shape;
  if (isEmptyShape(shape)) return null;
  const { width, height } = shapeSize(shape);
  switch (kind) {
    case "cone":
      return coneOutline(
        from,
        Math.atan2(to.y - from.y, to.x - from.x),
        width * CELL_SIZE,
      );
    case "rectangle":
      return rectangleOutline(from, rectangleCorner(from, to, width, height));
    case "circle":
      return circleOutline(from, width * CELL_SIZE);
  }
}

function coneOutline(origin: Vector2d, direction: number, length: number) {
  const corner = length / Math.cos(CONE_HALF_ANGLE);
  return [
    origin.x,
    origin.y,
    ...[-CONE_HALF_ANGLE, CONE_HALF_ANGLE].flatMap((offset) => [
      origin.x + Math.cos(direction + offset) * corner,
      origin.y + Math.sin(direction + offset) * corner,
    ]),
  ];
}

function rectangleCorner(
  from: Vector2d,
  to: Vector2d,
  width: number,
  height: number,
) {
  return {
    x: from.x + (Math.sign(to.x - from.x) || 1) * width * CELL_SIZE,
    y: from.y + (Math.sign(to.y - from.y) || 1) * height * CELL_SIZE,
  };
}

function rectangleOutline(from: Vector2d, { x, y }: Vector2d) {
  return [from.x, from.y, x, from.y, x, y, from.x, y];
}

// Moves `to` to where the shape really ends, so its size stays the same when computed again.
export function fitShape(shape: AreaShape): AreaShape {
  const { kind, from, to } = shape;
  const { width, height } = shapeSize(shape);
  const length = width * CELL_SIZE;
  const direction = Math.atan2(to.y - from.y, to.x - from.x);
  const end =
    kind === "rectangle"
      ? rectangleCorner(from, to, width, height)
      : {
          x: from.x + Math.cos(direction) * length,
          y: from.y + Math.sin(direction) * length,
        };
  return { kind, from: { x: from.x, y: from.y }, to: end };
}

function circleOutline(center: Vector2d, radius: number) {
  return Array.from(
    { length: CIRCLE_CORNERS },
    (_, i) => (i / CIRCLE_CORNERS) * 2 * Math.PI,
  ).flatMap((angle) => [
    center.x + Math.cos(angle) * radius,
    center.y + Math.sin(angle) * radius,
  ]);
}
