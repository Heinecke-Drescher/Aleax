import { ActionIcon, Button, Popover, Stack, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { Icon } from "@tabler/icons-react";
import { useState } from "react";
import { ToolTooltipLabel } from "./ToolTooltipLabel";
import type { Tool } from "./tools/tool";

export interface ToolButton {
  tool: Tool;
  label: string;
  icon: Icon;
  // Shown below the label, for what the tool does that no button shows.
  hint?: string;
  // The name in a group's choice, where it differs from the label.
  option?: string;
}

// The first one is shown until another is chosen.
export type ToolGroup = readonly [ToolButton, ...ToolButton[]];

interface ToolGroupButtonProps {
  tools: ToolGroup;
  hint: string;
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

// Like the text tool: clicking the active button opens the choice below it.
export function ToolGroupButton({
  tools,
  hint,
  activeTool,
  onToolChange,
}: ToolGroupButtonProps) {
  const [isPicking, picking] = useDisclosure();
  const [lastTool, setLastTool] = useState(tools[0]);
  const active = tools.find(({ tool }) => tool === activeTool);
  const shown = active ?? lastTool;
  const { label, icon: ShownIcon } = shown;

  function choose(toolButton: ToolButton) {
    setLastTool(toolButton);
    onToolChange(toolButton.tool);
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
          label={<ToolTooltipLabel label={label} hint={hint} />}
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
          {tools.map((toolButton) => (
            <Button
              key={toolButton.tool}
              variant={toolButton === shown ? "filled" : "subtle"}
              justify="flex-start"
              leftSection={<toolButton.icon size={20} />}
              onClick={() => choose(toolButton)}
            >
              {toolButton.option ?? toolButton.label}
            </Button>
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
