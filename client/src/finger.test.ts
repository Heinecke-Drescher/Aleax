import { describe, expect, it } from "vitest";
import { isFinger } from "./finger";

describe("isFinger", () => {
  function pointerEvent(pointerType: string) {
    return Object.assign(new Event("pointermove"), { pointerType });
  }

  it("tells a finger from a mouse and a pen", () => {
    expect(isFinger(pointerEvent("touch"))).toBe(true);
    expect(isFinger(pointerEvent("mouse"))).toBe(false);
    expect(isFinger(pointerEvent("pen"))).toBe(false);
  });

  it("takes events without a pointer type for no finger", () => {
    expect(isFinger(new Event("wheel"))).toBe(false);
    expect(isFinger(undefined)).toBe(false);
  });
});
