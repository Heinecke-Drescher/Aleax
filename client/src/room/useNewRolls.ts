import { useEffectEvent, useLayoutEffect } from "react";
import type * as Y from "yjs";
import { validRoll } from "./rolls";
import { ROOM_HISTORY, type Roll } from "./roomStore";

// Reports only rolls added while enabled, so rolls loaded with the room are not reported.
export function useNewRolls(
  rollsArray: Y.Array<unknown>,
  enabled: boolean,
  onRoll: (roll: Roll) => void,
) {
  const reportRoll = useEffectEvent(onRoll);

  // A layout effect listens before anything else runs, so no roll slips
  // through between rendering and listening.
  useLayoutEffect(() => {
    if (!enabled) return;
    const observer = (event: Y.YArrayEvent<unknown>) => {
      for (const roll of newRolls(event)) reportRoll(roll);
    };
    rollsArray.observe(observer);
    return () => {
      rollsArray.unobserve(observer);
    };
  }, [rollsArray, enabled]);
}

// Rolls that reach a player only to catch up were made earlier.
export function newRolls(event: Y.YArrayEvent<unknown>): Roll[] {
  if (event.transaction.origin === ROOM_HISTORY) return [];
  return event.changes.delta.flatMap(({ insert }) =>
    Array.isArray(insert)
      ? insert.flatMap((value) => validRoll(value) ?? [])
      : [],
  );
}
