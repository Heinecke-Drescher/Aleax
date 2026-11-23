import { describe, expect, it } from "vitest";
import { isEmptyLine, straightLine } from "./line";

describe("straightLine", () => {
  it.each([
    ["on corners", { x: 0, y: 0 }, { x: 100, y: 50 }, [0, 0, 100, 50]],
    ["near corners", { x: 24, y: 26 }, { x: 126, y: 74 }, [0, 50, 150, 50]],
    ["diagonal", { x: 3, y: 2 }, { x: 148, y: 152 }, [0, 0, 150, 150]],
    ["negative cells", { x: -97, y: -51 }, { x: 3, y: 1 }, [-100, -50, 0, 0]],
  ])("snaps both ends %s to the nearest corner", (_, from, to, expected) => {
    expect(straightLine(from, to)).toEqual(expected);
  });
});

describe("isEmptyLine", () => {
  it("is empty when both ends snap to the same corner", () => {
    expect(isEmptyLine(straightLine({ x: 3, y: 4 }, { x: 20, y: -20 }))).toBe(
      true,
    );
  });

  it("is not empty along one cell edge", () => {
    expect(isEmptyLine(straightLine({ x: 0, y: 0 }, { x: 30, y: 0 }))).toBe(
      false,
    );
  });
});
