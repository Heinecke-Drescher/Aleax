import type { Room } from "../../room/createRoom";
import type { TextFontSize } from "../../room/texts";
import type { SelectionControls } from "../selection/useSelection";
import { useEraserTool } from "./eraser";
import { useFogTool } from "./fog";
import { useLineTool } from "./line";
import { useMeasureTool } from "./measure";
import { usePaintTool } from "./paint";
import { usePenTool } from "./pen";
import { ownEventsTool } from "./ownEvents";
import { useSelectTool } from "./select";
import { useShapeTool } from "./shape";
import { useTextTool } from "./text";
import type { BoardTool, Tool } from "./tool";

export function useBoardTools(
  tool: Tool,
  selection: SelectionControls,
  room: Room,
  color: string,
  textSize: TextFontSize,
  onShapePlaced: (id: string) => void,
) {
  const pen = usePenTool(room, color);
  const line = useLineTool(room, color);
  const { tool: text, ...texts } = useTextTool(room, color, textSize);
  const { tool: measure, measurement } = useMeasureTool(room);
  const cone = useShapeTool(room, "cone", color, onShapePlaced);
  const rectangle = useShapeTool(room, "rectangle", color, onShapePlaced);
  const circle = useShapeTool(room, "circle", color, onShapePlaced);
  const reveal = useFogTool(room, "reveal");
  const hide = useFogTool(room, "hide");
  const select = useSelectTool(selection);
  const tools: Record<Tool, BoardTool> = {
    select,
    paint: usePaintTool(room, color),
    pen: pen.tool,
    line: line.tool,
    eraser: useEraserTool(room),
    text,
    measure,
    cone: cone.tool,
    rectangle: rectangle.tool,
    circle: circle.tool,
    resize: ownEventsTool,
    alignImage: ownEventsTool,
    reveal: reveal.tool,
    hide: hide.tool,
  };
  return {
    activeTool: tools[tool],
    draftPoints: pen.draftPoints ?? line.draftPoints,
    measurement,
    shapeDraft: cone.draft ?? rectangle.draft ?? circle.draft,
    fogFrame: reveal.frame ?? hide.frame,
    texts,
  };
}
