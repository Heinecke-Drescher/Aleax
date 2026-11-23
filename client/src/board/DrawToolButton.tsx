import { ActionIcon, Button, Popover, Stack, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBucketDroplet, IconLine, IconPencil } from "@tabler/icons-react";
import { useState } from "react";
import { ToolTooltipLabel } from "./ToolTooltipLabel";
import type { Tool } from "./tools/tool";

const DRAW_TOOLS = [
  {
    tool: "line",
    label: "Draw lines",
    option: "Straight line",
    icon: IconLine,
  },
  { tool: "pen", label: "Draw", option: "Freehand", icon: IconPencil },
  {
    tool: "paint",
    label: "Paint cells",
    option: "Paint cells",
    icon: IconBucketDroplet,
  },
] as const;

type DrawTool = (typeof DRAW_TOOLS)[number];

interface DrawToolButtonProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

// Like the text tool: clicking the active button opens the choice below it.
export function DrawToolButton({
  activeTool,
  onToolChange,
}: DrawToolButtonProps) {
  const [isPicking, picking] = useDisclosure();
  const [lastTool, setLastTool] = useState<DrawTool>(DRAW_TOOLS[0]);
  const active = DRAW_TOOLS.find(({ tool }) => tool === activeTool);
  const shown = active ?? lastTool;
  const { label, icon: ShownIcon } = shown;

  function choose(drawTool: DrawTool) {
    setLastTool(drawTool);
    onToolChange(drawTool.tool);
    picking.close();
  }

  return (
    <Popover
      opened={isPicking}
      onDismiss={picking.close}
      position="bottom"
      shadow="md"
    >
      <Popover.Target>
        <Tooltip
          label={
            <ToolTooltipLabel
              label={label}
              hint="Click again for other ways to draw"
            />
          }
          position="bottom"
          disabled={isPicking}
        >
          <ActionIcon
            variant={active ? "filled" : "subtle"}
            size="lg"
            aria-label={label}
            onClick={() => (active ? picking.toggle() : choose(shown))}
          >
            <ShownIcon size={20} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown p={6}>
        <Stack gap={6}>
          {DRAW_TOOLS.map((drawTool) => (
            <Button
              key={drawTool.tool}
              variant={drawTool === shown ? "filled" : "subtle"}
              justify="flex-start"
              leftSection={<drawTool.icon size={20} />}
              onClick={() => choose(drawTool)}
            >
              {drawTool.option}
            </Button>
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
