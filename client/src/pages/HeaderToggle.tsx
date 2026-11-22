import { ActionIcon, Indicator, Tooltip } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import classes from "./HeaderToggle.module.css";

export function HideHeaderButton({ onHide }: { onHide: () => void }) {
  return (
    <Tooltip label="Hide header">
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        ml="auto"
        style={{ flexShrink: 0 }}
        aria-label="Hide header"
        onClick={onHide}
      >
        <IconChevronUp size={20} />
      </ActionIcon>
    </Tooltip>
  );
}

interface ShowHeaderButtonProps {
  isDisconnected: boolean;
  isFlashing: boolean;
  onShow: () => void;
}

export const SHOW_BUTTON_FLASH_MS = 3100;

// At the end of the toolbar, which never shares its row with it. The warning about a lost
// connection hides with the header, so a red dot keeps it in sight.
export function ShowHeaderButton({
  isDisconnected,
  isFlashing,
  onShow,
}: ShowHeaderButtonProps) {
  const label = isDisconnected ? "Show header (not connected)" : "Show header";
  return (
    <Tooltip label={label} position="bottom">
      <Indicator color="red" size={10} disabled={!isDisconnected}>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          className={isFlashing ? classes.flash : undefined}
          style={{ animationDuration: `${SHOW_BUTTON_FLASH_MS}ms` }}
          aria-label={label}
          onClick={onShow}
        >
          <IconChevronDown size={20} />
        </ActionIcon>
      </Indicator>
    </Tooltip>
  );
}
