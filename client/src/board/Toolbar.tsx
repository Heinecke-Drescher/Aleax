import {
  ActionIcon,
  ColorSwatch,
  Divider,
  Group,
  Menu,
  Popover,
  Stack,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBucketDroplet,
  IconCheck,
  IconCircle,
  IconCone,
  IconDots,
  IconEraser,
  IconEye,
  IconEyeOff,
  IconLine,
  IconPencil,
  IconPointer,
  IconRectangle,
  IconResize,
  IconRuler,
} from "@tabler/icons-react";
import {
  FLOATING_BAR_SPACE,
  FLOATING_GAP,
  FLOATING_PADDING,
  FloatingPanel,
} from "../FloatingPanel";
import { usePlayer } from "../player/PlayerContext";
import { PAINT_COLORS, paintColorValue, type PaintColor } from "./paintColors";
import type { TextFontSize } from "../room/texts";
import { TextToolButton } from "./texts/TextToolButton";
import {
  ToolGroupButton,
  type ToolButton,
  type ToolGroup,
} from "./ToolGroupButton";
import { ToolTooltipLabel } from "./ToolTooltipLabel";
import type { Tool } from "./tools/tool";
import type { ReactNode, Ref } from "react";
import { useWideLayout } from "../theme";

export const TOOLBAR_SPACE = FLOATING_BAR_SPACE;

const MAP_TOOLS: ToolButton[] = [
  {
    tool: "select",
    label: "Select and move",
    icon: IconPointer,
    hint: "Right-click for the menu, double-click to ping",
  },
  { tool: "measure", label: "Measure distance", icon: IconRuler },
];

const RESIZE_TOOL: ToolButton = {
  tool: "resize",
  label: "Resize canvas",
  icon: IconResize,
};

const ERASER_TOOL: ToolButton = {
  tool: "eraser",
  label: "Erase",
  icon: IconEraser,
};

const DRAW_TOOLS: ToolGroup = [
  {
    tool: "line",
    label: "Draw lines",
    option: "Straight line",
    icon: IconLine,
  },
  { tool: "pen", label: "Draw", option: "Freehand", icon: IconPencil },
  { tool: "paint", label: "Paint cells", icon: IconBucketDroplet },
];

const SHAPE_TOOLS: ToolGroup = [
  { tool: "rectangle", label: "Rectangle area", icon: IconRectangle },
  { tool: "circle", label: "Circle area", icon: IconCircle },
  { tool: "cone", label: "Cone area", icon: IconCone },
];

const FOG_TOOLS: ToolGroup = [
  { tool: "hide", label: "Hide under fog", icon: IconEyeOff },
  { tool: "reveal", label: "Reveal fog", icon: IconEye },
];

interface ToolbarProps {
  ref: Ref<HTMLDivElement>;
  axisShift: number;
  // Buttons that do not belong to the map, after the tools.
  end: ReactNode;
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  activeColor: PaintColor;
  onColorChange: (color: PaintColor) => void;
  textSize: TextFontSize;
  onTextSizeChange: (size: TextFontSize) => void;
}

export function Toolbar({
  ref,
  axisShift,
  end,
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  textSize,
  onTextSizeChange,
}: ToolbarProps) {
  const theme = useMantineTheme();
  const { isDm } = usePlayer();
  const [isPicking, picking] = useDisclosure();
  const isWide = useWideLayout();
  // A narrow screen, e.g. a phone, keeps the tools players need most in view.
  const menuTools = [RESIZE_TOOL, ...(isDm ? FOG_TOOLS : [])];
  // The menu's button shows the tool picked from it, so the toolbar always tells what is active.
  const pickedFromMenu = menuTools.find(({ tool }) => tool === activeTool);
  const MenuIcon = pickedFromMenu ? pickedFromMenu.icon : IconDots;

  function toolGroup(tools: ToolGroup, hint: string) {
    return (
      <ToolGroupButton
        tools={tools}
        hint={hint}
        activeTool={activeTool}
        onToolChange={onToolChange}
      />
    );
  }

  function toolButton({ tool, label, icon: ToolIcon, hint }: ToolButton) {
    return (
      <Tooltip
        key={tool}
        label={<ToolTooltipLabel label={label} hint={hint} />}
        position="bottom"
      >
        <ActionIcon
          variant={tool === activeTool ? "filled" : "subtle"}
          size="lg"
          aria-label={label}
          onClick={() => onToolChange(tool)}
        >
          <ToolIcon size={20} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <FloatingPanel
      ref={ref}
      pos="absolute"
      top={FLOATING_GAP}
      left={`calc(50% - ${axisShift}px)`}
      style={{ transform: "translateX(-50%)" }}
      p={FLOATING_PADDING}
    >
      <Tooltip.Group>
        <Group gap={4} wrap="nowrap">
          {MAP_TOOLS.map(toolButton)}
          {isWide && toolButton(RESIZE_TOOL)}
          <Divider orientation="vertical" />
          {toolGroup(DRAW_TOOLS, "Click again for other ways to draw")}
          {toolButton(ERASER_TOOL)}
          <TextToolButton
            isActive={activeTool === "text"}
            onSelect={() => onToolChange("text")}
            size={textSize}
            onSizeChange={onTextSizeChange}
          />
          {isWide && <Divider orientation="vertical" />}
          {toolGroup(SHAPE_TOOLS, "Click again for other areas")}
          <Popover
            opened={isPicking}
            onDismiss={picking.close}
            position="bottom"
            shadow="md"
          >
            <Popover.Target>
              <Tooltip label="Color" position="bottom" disabled={isPicking}>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  aria-label={`Color: ${activeColor}`}
                  onClick={picking.toggle}
                >
                  <ColorSwatch
                    component="span"
                    color={paintColorValue(theme, activeColor)}
                    size={24}
                  />
                </ActionIcon>
              </Tooltip>
            </Popover.Target>
            <Popover.Dropdown p={6}>
              <Stack gap={6}>
                {PAINT_COLORS.filter((color) => color !== activeColor).map(
                  (color) => (
                    <ColorSwatch
                      key={color}
                      component="button"
                      color={paintColorValue(theme, color)}
                      size={24}
                      aria-label={`Use ${color}`}
                      onClick={() => {
                        onColorChange(color);
                        picking.close();
                      }}
                    />
                  ),
                )}
              </Stack>
            </Popover.Dropdown>
          </Popover>
          {isWide && isDm && (
            <>
              <Divider orientation="vertical" />
              {toolGroup(
                FOG_TOOLS,
                "Click again to switch hiding and revealing",
              )}
            </>
          )}
          {!isWide && (
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <Tooltip
                  label={pickedFromMenu ? pickedFromMenu.label : "More tools"}
                  position="bottom"
                >
                  <ActionIcon
                    variant={pickedFromMenu ? "filled" : "subtle"}
                    size="lg"
                    aria-label="More tools"
                  >
                    <MenuIcon size={20} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                {menuTools.map(({ tool, label, icon: ToolIcon }) => (
                  <Menu.Item
                    key={tool}
                    leftSection={<ToolIcon size={16} />}
                    rightSection={
                      tool === activeTool && <IconCheck size={16} />
                    }
                    onClick={() => onToolChange(tool)}
                  >
                    {label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          )}
          {end}
        </Group>
      </Tooltip.Group>
    </FloatingPanel>
  );
}
