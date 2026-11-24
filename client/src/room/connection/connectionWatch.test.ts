import { describe, expect, it, vi } from "vitest";
import { createConnectionWatch } from "./connectionWatch";

function checkTimes(
  watch: ReturnType<typeof createConnectionWatch>,
  times: number,
) {
  for (let i = 0; i < times; i++) watch.check(0, 0);
}

describe("createConnectionWatch", () => {
  it("connects once a relay can be reached", () => {
    const onChange = vi.fn();
    const watch = createConnectionWatch(onChange);

    watch.check(0, 0);
    expect(onChange).not.toHaveBeenCalled();
    watch.check(1, 0);

    expect(onChange.mock.calls).toEqual([["connected"]]);
  });

  it("counts a player linked without relays as connected", () => {
    const onChange = vi.fn();
    const watch = createConnectionWatch(onChange);

    watch.check(0, 1);

    expect(onChange).toHaveBeenLastCalledWith("connected");
  });

  it("gives up when nothing opens for a while", () => {
    const onChange = vi.fn();
    const watch = createConnectionWatch(onChange);

    checkTimes(watch, 4);
    expect(onChange).not.toHaveBeenCalled();
    watch.check(0, 0);

    expect(onChange).toHaveBeenLastCalledWith("disconnected");
  });

  it("rides out a short loss and reports a longer one until it comes back", () => {
    const onChange = vi.fn();
    const watch = createConnectionWatch(onChange);
    watch.check(2, 1);

    checkTimes(watch, 4);
    watch.check(1, 0);
    expect(onChange.mock.calls).toEqual([["connected"]]);

    checkTimes(watch, 5);
    expect(onChange).toHaveBeenLastCalledWith("disconnected");
    watch.check(1, 0);
    expect(onChange).toHaveBeenLastCalledWith("connected");
  });

  it("stops waiting when every relay failed, unless a player is linked", () => {
    const failed = vi.fn();
    const alone = createConnectionWatch(failed);
    alone.stopWaiting();
    alone.check(0, 0);
    expect(failed.mock.calls).toEqual([["disconnected"]]);

    const linked = vi.fn();
    const withPeer = createConnectionWatch(linked);
    withPeer.stopWaiting();
    withPeer.check(0, 1);
    expect(linked.mock.calls).toEqual([["connected"]]);
  });
});
