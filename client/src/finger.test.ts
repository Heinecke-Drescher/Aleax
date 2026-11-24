import { describe, expect, it } from "vitest";
import { clientPoint, isFinger } from "./finger";

function pointerEvent(pointerType: string) {
  return Object.assign(new Event("pointerdown"), { pointerType });
}

describe("isFinger", () => {
  it("knows a finger from pointer events and from the touch events Konva drags with", () => {
    expect(isFinger(pointerEvent("touch"))).toBe(true);
    expect(isFinger(new Event("touchstart"))).toBe(true);
    expect(isFinger(new Event("touchmove"))).toBe(true);
  });

  it("does not count a mouse, a pen or a missing event", () => {
    expect(isFinger(pointerEvent("mouse"))).toBe(false);
    expect(isFinger(pointerEvent("pen"))).toBe(false);
    expect(isFinger(new Event("mousedown"))).toBe(false);
    expect(isFinger(new Event("wheel"))).toBe(false);
    expect(isFinger(undefined)).toBe(false);
  });
});

describe("clientPoint", () => {
  it("reads a mouse or pointer event", () => {
    const event = { type: "mousedown", clientX: 10, clientY: 20 };
    expect(clientPoint(event as MouseEvent)).toEqual({ x: 10, y: 20 });
  });

  it("reads the finger that started a touch", () => {
    const event = {
      type: "touchstart",
      changedTouches: [{ clientX: 30, clientY: 40 }],
    };
    expect(clientPoint(event as unknown as TouchEvent)).toEqual({
      x: 30,
      y: 40,
    });
  });

  it("fails on a touch event without a touch", () => {
    const event = { type: "touchend", changedTouches: [] };
    expect(() => clientPoint(event as unknown as TouchEvent)).toThrow();
  });
});
