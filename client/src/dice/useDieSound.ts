import { useEffect, useRef } from "react";
import type { Room } from "../room/createRoom";
import { useNewRolls } from "../room/useNewRolls";
import { isFresh } from "./criticalRoll";
import { createDieSound, type DieSound } from "./dieSound";
import { useSoundSetting } from "./useSoundSetting";

export function useDieSound(room: Room, isSynced: boolean) {
  const [isSoundOn] = useSoundSetting();
  const sound = useRef<DieSound | null>(null);

  useEffect(() => {
    if (!isSoundOn) return;
    const created = createDieSound();
    sound.current = created;
    return () => {
      created.close();
      sound.current = null;
    };
  }, [isSoundOn]);

  useNewRolls(room.rollsArray, isSynced && isSoundOn, (roll) => {
    if (!isFresh(roll.at, Date.now())) return;
    if (!sound.current) throw new Error("Die sound is not created");
    sound.current.play();
  });
}
