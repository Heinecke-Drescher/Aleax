import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import { Group, Label, Tag, Text } from "react-konva";
import { LIGHT_SURFACE } from "../theme";
import type { LabelPlace } from "./labelPlace";

interface MapLabelProps {
  place: LabelPlace;
  zoom: number;
  color: string;
  text: string;
}

export function MapLabel({
  place: { pointer, x, y },
  zoom,
  color,
  text,
}: MapLabelProps) {
  const theme = useMantineTheme();
  const dark = useComputedColorScheme("light") === "dark";

  return (
    <Group x={x} y={y} scaleX={1 / zoom} scaleY={1 / zoom}>
      <Label>
        <Tag
          fill={dark ? theme.colors.dark[7] : LIGHT_SURFACE}
          stroke={color}
          cornerRadius={4}
          pointerDirection={pointer}
          pointerWidth={10}
          pointerHeight={8}
        />
        <Text
          text={text}
          fill={dark ? theme.colors.dark[0] : theme.colors.gray[9]}
          fontSize={14}
          fontStyle="bold"
          padding={6}
        />
      </Label>
    </Group>
  );
}
