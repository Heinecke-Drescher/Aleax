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
  IconCheck,
  IconCircle,
  IconCone,
  IconDots,
  IconEraser,
  IconEye,
  IconEyeOff,
  IconPointer,
  IconRectangle,
  IconResize,
  IconRuler,
  type Icon,
} from "@tabler/icons-react";
import {
  FLOATING_BAR_SPACE,
  FLOATING_GAP,
  FLOATING_PADDING,
  FloatingPanel,
} from "../FloatingPanel";
import { usePlayer } from "../player/PlayerContext";
import { DrawToolButton } from "./DrawToolButton";
import { PAINT_COLORS, paintColorValue, type PaintColor } from "./paintColors";
import type { TextFontSize } from "../room/texts";
import { TextToolButton } from "./texts/TextToolButton";
import { ToolTooltipLabel } from "./ToolTooltipLabel";
import type { Tool } from "./tools/tool";
import type { ReactNode, Ref } from "react";
import { useWideLayout } from "../theme";

export const TOOLBAR_SPACE = FLOATING_BAR_SPACE;

interface ToolButton {
  tool: Tool;
  label: string;
  icon: Icon;
  hint?: string;
}

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

const SHAPE_TOOLS: ToolButton[] = [
  { tool: "cone", label: "Cone area", icon: IconCone },
  { tool: "rectangle", label: "Rectangle area", icon: IconRectangle },
  { tool: "circle", label: "Circle area", icon: IconCircle },
];

const FOG_TOOLS: ToolButton[] = [
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
  const menuTools = [RESIZE_TOOL, ...SHAPE_TOOLS, ...(isDm ? FOG_TOOLS : [])];
  // The menu's button shows the tool picked from it, so the toolbar always tells what is active.
  const pickedFromMenu = menuTools.find(({ tool }) => tool === activeTool);
  const MenuIcon = pickedFromMenu ? pickedFromMenu.icon : IconDots;

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
          <DrawToolButton activeTool={activeTool} onToolChange={onToolChange} />
          {toolButton(ERASER_TOOL)}
          <TextToolButton
            isActive={activeTool === "text"}
            onSelect={() => onToolChange("text")}
            size={textSize}
            onSizeChange={onTextSizeChange}
          />
          {isWide && (
            <>
              <Divider orientation="vertical" />
              {SHAPE_TOOLS.map(toolButton)}
            </>
          )}
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
              {FOG_TOOLS.map(toolButton)}
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
