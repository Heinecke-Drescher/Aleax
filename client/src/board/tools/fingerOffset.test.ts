import { describe, expect, it } from "vitest";
import { endAboveFinger, tokenLift } from "./fingerOffset";

describe("endAboveFinger", () => {
  const press = { x: 100, y: 200 };

  it("keeps the same distance on screen at every zoom", () => {
    expect(endAboveFinger({ x: 100, y: 300 }, press, 1)).toEqual({
      x: 100,
      y: 240,
    });
    expect(endAboveFinger({ x: 100, y: 300 }, press, 2)).toEqual({
      x: 100,
      y: 270,
    });
    expect(endAboveFinger({ x: 100, y: 300 }, press, 0.5)).toEqual({
      x: 100,
      y: 180,
    });
  });

  it("stays under a finger that has only moved as far as a tap", () => {
    expect(endAboveFinger({ x: 105, y: 205 }, press, 1)).toEqual({
      x: 105,
      y: 205,
    });
    // The same distance on the map is ten screen pixels when zoomed in.
    expect(endAboveFinger({ x: 105, y: 205 }, press, 2).y).toBe(175);
  });
});

describe("tokenLift", () => {
  const token = { x: 0, y: 0, size: 1 };

  it("lifts the lower edge of the grown token and half a cell above the finger", () => {
    // Pressed in the middle: 27.5 px to the grown lower edge, 25 px for snapping, then the gap.
    expect(tokenLift(token, 25, 1)).toBe(92.5);
  });

  it("grows with the zoom, so the token clears the finger when zoomed in", () => {
    expect(tokenLift(token, 25, 2)).toBe(145);
    expect(tokenLift(token, 25, 0.5)).toBe(66.25);
  });

  it("depends on where the token is pressed and on its size", () => {
    expect(tokenLift(token, 0, 1)).toBe(117.5);
    expect(tokenLift({ x: 0, y: 0, size: 2 }, 50, 1)).toBe(120);
  });

  it("lifts less when the finger holds the token below its image", () => {
    expect(tokenLift(token, 60, 1)).toBe(57.5);
  });

  it("keeps the snapped token's lower edge 40 px above the finger, wherever the finger goes", () => {
    for (const scale of [0.5, 1, 2, 4]) {
      for (const size of [1, 3]) {
        for (const pressY of [0, size * 25, size * 50]) {
          const lift = tokenLift({ x: 0, y: 0, size }, pressY, scale);
          for (let fingerY = 0; fingerY < 100; fingerY += 7) {
            const shownTop = fingerY - pressY - lift / scale;
            const snappedTop = Math.round(shownTop / 50) * 50;
            const lowerEdge = snappedTop + size * 25 + size * 27.5;
            expect((fingerY - lowerEdge) * scale).toBeGreaterThanOrEqual(40);
          }
        }
      }
    }
  });
});
