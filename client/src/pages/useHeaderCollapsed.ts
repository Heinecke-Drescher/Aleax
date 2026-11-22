import { useLocalStorage } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { usePhoneLayout } from "../theme";
import { SHOW_BUTTON_FLASH_MS } from "./HeaderToggle";

// Only narrow or low windows need the header's height for the map; elsewhere it always shows.
// Remembered per browser, like the token drawer.
export function useHeaderCollapsed() {
  const canCollapse = usePhoneLayout();
  const [isStoredCollapsed, setCollapsed] = useLocalStorage({
    key: "aleax-header-collapsed",
    defaultValue: false,
    getInitialValueInEffect: false,
  });
  // Only hiding it by hand points out where the button went, not a page that loads collapsed.
  const [isJustHidden, setJustHidden] = useState(false);
  useEffect(() => {
    if (!isJustHidden) return;
    const timeout = setTimeout(
      () => setJustHidden(false),
      SHOW_BUTTON_FLASH_MS,
    );
    return () => clearTimeout(timeout);
  }, [isJustHidden]);
  return {
    canCollapse,
    isCollapsed: canCollapse && isStoredCollapsed,
    isJustHidden,
    hide: () => {
      setCollapsed(true);
      setJustHidden(true);
    },
    show: () => {
      setCollapsed(false);
      setJustHidden(false);
    },
  };
}
