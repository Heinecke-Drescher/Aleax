import type { Vector2d } from "konva/lib/types";
import { useCallback, useState } from "react";
import { Group } from "react-konva";
import { useSharedRoom } from "../../room/RoomContext";
import type { Roll } from "../../room/roomStore";
import { useNewRolls } from "../../room/useNewRolls";
import { ThrownDie } from "./ThrownDie";

interface ThrownDiceProps {
  viewCenter: () => Vector2d;
  landings: Map<string, Vector2d>;
}

// Mounted once the room is synced, so rolls loaded with the room are not thrown again.
export function ThrownDice({ viewCenter, landings }: ThrownDiceProps) {
  const room = useSharedRoom();
  const [flyingRolls, setFlyingRolls] = useState<Roll[]>([]);
  useNewRolls(room.rollsArray, true, (roll) =>
    setFlyingRolls((rolls) => [...rolls, roll]),
  );
  const markDone = useCallback(
    (id: string) =>
      setFlyingRolls((rolls) => rolls.filter((roll) => roll.id !== id)),
    [],
  );

  return (
    <Group listening={false}>
      {flyingRolls.map((roll) => (
        <ThrownDie
          key={roll.id}
          roll={roll}
          viewCenter={viewCenter}
          landings={landings}
          onDone={markDone}
        />
      ))}
    </Group>
  );
}
