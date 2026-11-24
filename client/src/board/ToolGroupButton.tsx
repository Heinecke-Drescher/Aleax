import { ActionIcon, Button, Popover, Stack, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { Icon } from "@tabler/icons-react";
import { useState } from "react";
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
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

// Like the text tool: the first click picks the shown tool and opens the choice below it, so a
// phone shows the other tools at once.
export function ToolGroupButton({
  tools,
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
        <Tooltip label={label} position="bottom" disabled={isPicking}>
          <ActionIcon
            variant={active ? "filled" : "subtle"}
            size="lg"
            aria-label={label}
            onClick={() => {
              if (active) {
                picking.toggle();
                return;
              }
              onToolChange(shown.tool);
              picking.open();
            }}
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
