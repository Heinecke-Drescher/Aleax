import { Button, Text } from "@mantine/core";
import { ToolbarHint } from "../ToolbarHint";

interface MapResizeHintProps {
  onDone: () => void;
  axisShift: number;
}

// Resizing starts from the map menu, so no tool button tells how to end it.
export function MapResizeHint({ onDone, axisShift }: MapResizeHintProps) {
  return (
    <ToolbarHint axisShift={axisShift}>
      <Text size="sm">Drag the handles to resize the canvas</Text>
      <Button
        size="xs"
        variant="default"
        onClick={onDone}
        style={{ flexShrink: 0 }}
      >
        Done
      </Button>
    </ToolbarHint>
  );
}
