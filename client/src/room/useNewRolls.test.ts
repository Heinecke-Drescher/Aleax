import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { ROOM_HISTORY } from "./roomStore";
import { newRolls } from "./useNewRolls";

const roll = { id: "r1", player: "Mira", sides: 20, value: 7, at: 1 };

function observeRolls(doc: Y.Doc) {
  const seen: unknown[] = [];
  doc.getArray("rolls").observe((event) => seen.push(...newRolls(event)));
  return seen;
}

describe("newRolls", () => {
  it("reports valid rolls added now", () => {
    const doc = new Y.Doc();
    const seen = observeRolls(doc);

    doc.getArray("rolls").push([roll, { id: "broken" }]);

    expect(seen).toEqual([roll]);
  });

  it("skips rolls that only catch this player up", () => {
    const earlier = new Y.Doc();
    earlier.getArray("rolls").push([roll]);
    const doc = new Y.Doc();
    const seen = observeRolls(doc);

    Y.applyUpdate(doc, Y.encodeStateAsUpdate(earlier), ROOM_HISTORY);

    expect(doc.getArray("rolls").length).toBe(1);
    expect(seen).toEqual([]);
  });
});
