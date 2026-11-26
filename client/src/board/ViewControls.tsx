import { ActionIcon, Divider, Group, Tooltip } from "@mantine/core";
import { IconZoomIn, IconZoomOut, IconZoomScan } from "@tabler/icons-react";
import {
  FLOATING_GAP,
  FLOATING_PADDING,
  FloatingPanel,
} from "../FloatingPanel";
import { UndoButtons } from "./UndoButtons";

interface ViewControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitMap: () => void;
}

export function ViewControls({
  onZoomIn,
  onZoomOut,
  onFitMap,
}: ViewControlsProps) {
  // The same place on every layout, as narrow ones keep the lower right corner for the tokens.
  // Undo, used most, ends the row: away from the screen's edge and near a right thumb.
  return (
    <FloatingPanel
      pos="absolute"
      bottom={FLOATING_GAP}
      left={FLOATING_GAP}
      p={FLOATING_PADDING}
    >
      <Group gap={4} wrap="nowrap">
        <Tooltip label="Zoom out (wheel)" position="top">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Zoom out"
            onClick={onZoomOut}
          >
            <IconZoomOut size={20} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Zoom in (wheel)" position="top">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Zoom in"
            onClick={onZoomIn}
          >
            <IconZoomIn size={20} />
          </ActionIcon>
        </Tooltip>
        <Divider orientation="vertical" />
        <Tooltip label="Fit map (Shift+1)" position="top">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Fit map"
            onClick={onFitMap}
          >
            <IconZoomScan size={20} />
          </ActionIcon>
        </Tooltip>
        <Divider orientation="vertical" />
        <UndoButtons />
      </Group>
    </FloatingPanel>
  );
}
