import type { MantineTheme } from "@mantine/core";
import { LIGHT_SURFACE } from "../../theme";

export function mapFillColor(
  theme: MantineTheme,
  colorScheme: "light" | "dark",
) {
  return colorScheme === "dark" ? theme.colors.dark[7] : LIGHT_SURFACE;
}

export function mapSurroundColor(
  theme: MantineTheme,
  colorScheme: "light" | "dark",
) {
  return colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[4];
}
