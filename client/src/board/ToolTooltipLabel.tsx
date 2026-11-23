import { Text } from "@mantine/core";

interface ToolTooltipLabelProps {
  label: string;
  // Shown below the label, for what the tool does that no button shows.
  hint?: string;
}

export function ToolTooltipLabel({ label, hint }: ToolTooltipLabelProps) {
  if (!hint) return label;
  return (
    <>
      {label}
      {/* Dimmed by opacity, as the tooltip's colors flip with the color scheme. */}
      <Text size="xs" opacity={0.75}>
        {hint}
      </Text>
    </>
  );
}
