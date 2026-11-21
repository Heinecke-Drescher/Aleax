import { useCallback, useState } from "react";
import type { Room } from "../room/createRoom";
import { rollColor } from "../room/rolls";
import { useNewRolls } from "../room/useNewRolls";
import { criticalKind, isFresh, type Critical } from "./criticalRoll";

export function useCriticalRolls(room: Room, isSynced: boolean) {
  const [critical, setCritical] = useState<Critical | null>(null);

  // Late callbacks of a replaced scene must not close the next one.
  const clear = useCallback(
    (id: string) =>
      setCritical((current) => (current?.id === id ? null : current)),
    [],
  );

  useNewRolls(room.rollsArray, isSynced, (roll) => {
    if (!isFresh(roll.at, Date.now())) return;
    const kind = criticalKind(roll.sides, roll.value);
    if (kind) setCritical({ id: roll.id, kind, color: rollColor(roll) });
  });

  return { critical, clear };
}
