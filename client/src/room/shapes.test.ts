import type { Vector2d } from "konva/lib/types";
import { describe, expect, it } from "vitest";
import { CELL_SIZE } from "./grid";
import { toPoints } from "./points";
import { fitShape, shapeOutline, shapeSize, type ShapeKind } from "./shapes";

const origin = { x: 100, y: 200 };

function cells(kind: ShapeKind, to: Vector2d) {
  return shapeSize({ kind, from: origin, to });
}

function outline(kind: ShapeKind, from: Vector2d, to: Vector2d) {
  const points = shapeOutline({ kind, from, to });
  if (!points) throw new Error("Expected a shape");
  return toPoints(points);
}

function cone(to: { x: number; y: number }) {
  const [start, left, right] = outline("cone", origin, to);
  if (!start || !left || !right) throw new Error("Expected three points");
  return { start, left, right };
}

describe("shapeSize", () => {
  it("rounds the distance to whole cells", () => {
    expect(cells("circle", { x: 100 + 2.4 * CELL_SIZE, y: 200 }).width).toBe(2);
    expect(cells("cone", { x: 100 + 2.6 * CELL_SIZE, y: 200 }).width).toBe(3);
  });

  it("measures circles and cones along the line to the pointer", () => {
    const to = { x: 100 + 3 * CELL_SIZE, y: 200 + 4 * CELL_SIZE };
    expect(cells("circle", to)).toEqual({ width: 5, height: 5 });
    expect(cells("cone", to)).toEqual({ width: 5, height: 5 });
  });

  it("measures each side of a rectangle", () => {
    const to = { x: 100 + 3 * CELL_SIZE, y: 200 - 4 * CELL_SIZE };
    expect(cells("rectangle", to)).toEqual({ width: 3, height: 4 });
  });

  it("keeps a rectangle dragged along a grid line one cell wide", () => {
    const to = { x: 100 + 3 * CELL_SIZE, y: 200 + 0.4 * CELL_SIZE };
    expect(cells("rectangle", to)).toEqual({ width: 3, height: 1 });
  });
});

describe("shapeOutline", () => {
  it("has no shape below half a cell", () => {
    const to = { x: 100 + 0.4 * CELL_SIZE, y: 200 };
    expect(shapeOutline({ kind: "cone", from: origin, to })).toBeNull();
    expect(shapeOutline({ kind: "rectangle", from: origin, to })).toBeNull();
    expect(shapeOutline({ kind: "circle", from: origin, to })).toBeNull();
  });

  it("makes a cone as wide at its end as it is long", () => {
    const length = 3 * CELL_SIZE;
    const { start, left, right } = cone({ x: 100 + length + 10, y: 200 });
    expect(start).toEqual(origin);
    expect(left.x).toBeCloseTo(100 + length);
    expect(left.y).toBeCloseTo(200 - length / 2);
    expect(right.x).toBeCloseTo(100 + length);
    expect(right.y).toBeCloseTo(200 + length / 2);
  });

  it("points a cone towards the pointer", () => {
    const { left, right } = cone({ x: 100, y: 200 + 2 * CELL_SIZE });
    expect((left.x + right.x) / 2).toBeCloseTo(100);
    expect((left.y + right.y) / 2).toBeCloseTo(200 + 2 * CELL_SIZE);
  });

  it("grows a rectangle from its corner towards the pointer", () => {
    const width = 2 * CELL_SIZE;
    const height = 3 * CELL_SIZE;
    expect(outline("rectangle", origin, { x: 210, y: 340 })).toEqual([
      origin,
      { x: 100 + width, y: 200 },
      { x: 100 + width, y: 200 + height },
      { x: 100, y: 200 + height },
    ]);
    expect(outline("rectangle", origin, { x: 10, y: 60 })[2]).toEqual({
      x: 100 - width,
      y: 200 - height,
    });
  });

  it("keeps every point of a circle at its radius", () => {
    const radius = 4 * CELL_SIZE;
    const points = outline("circle", origin, { x: 100, y: 200 + radius });
    expect(points.length).toBeGreaterThan(8);
    for (const { x, y } of points) {
      expect(Math.hypot(x - origin.x, y - origin.y)).toBeCloseTo(radius);
    }
  });
});

describe("fitShape", () => {
  it("puts the end of a rectangle on its far corner", () => {
    const to = { x: 173.4, y: 320 };
    expect(fitShape({ kind: "rectangle", from: origin, to }).to).toEqual({
      x: 150,
      y: 300,
    });
  });

  it("puts the end of a cone at its length in the dragged direction", () => {
    const to = { x: 136, y: 248 };
    const fitted = fitShape({ kind: "cone", from: origin, to });
    expect(fitted.to.x).toBeCloseTo(130);
    expect(fitted.to.y).toBeCloseTo(240);
  });
});
