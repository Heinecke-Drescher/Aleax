import type { Vector2d } from "konva/lib/types";
import { useRef, useState } from "react";
import { usePlayer } from "../../player/PlayerContext";
import type { Room } from "../../room/createRoom";
import { cellAt, containsCell, snapToCorner } from "../../room/grid";
import { draggedEnd } from "./fingerOffset";
import type { BoardTool } from "./tool";

export function straightLine(from: Vector2d, to: Vector2d): number[] {
  const start = snapToCorner(from);
  const end = snapToCorner(to);
  return [start.x, start.y, end.x, end.y];
}

export function isEmptyLine([x1, y1, x2, y2]: number[]) {
  return x1 === x2 && y1 === y2;
}

export function useLineTool(room: Room, color: string) {
  const { isDm } = usePlayer();
  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);
  // The ref lets a second onUp before the next render see that the line is already placed.
  const draftRef = useRef<number[] | null>(null);
  const press = useRef<Vector2d>({ x: 0, y: 0 });

  function updateDraft(next: number[] | null) {
    draftRef.current = next;
    setDraftPoints(next);
  }

  const tool: BoardTool = {
    selectsItems: false,
    listensToDrawings: false,
    onDown({ point }) {
      const cell = cellAt(point);
      if (!containsCell(room.mapBounds(), cell.x, cell.y)) return;
      press.current = point;
      updateDraft(straightLine(point, point));
    },
    onMove(pointer) {
      if (draftRef.current) {
        updateDraft(
          straightLine(press.current, draggedEnd(pointer, press.current)),
        );
      }
    },
    onUp() {
      const current = draftRef.current;
      updateDraft(null);
      if (current && !isEmptyLine(current)) {
        room.addStroke(color, current, !isDm);
      }
    },
    onCancel() {
      updateDraft(null);
    },
  };

  return { tool, draftPoints };
}
