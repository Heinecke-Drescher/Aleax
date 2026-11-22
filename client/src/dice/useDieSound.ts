import type { Room } from "../room/createRoom";
import { useNewRolls } from "../room/useNewRolls";
import type { SoundName } from "../sounds";
import { isFresh } from "./criticalRoll";

export function useDieSound(
  room: Room,
  isSynced: boolean,
  playSound: (name: SoundName) => void,
) {
  useNewRolls(room.rollsArray, isSynced, (roll) => {
    if (isFresh(roll.at, Date.now())) playSound("dieThrow");
  });
}
