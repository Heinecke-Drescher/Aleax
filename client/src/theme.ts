import {
  ActionIcon,
  Button,
  createTheme,
  DEFAULT_THEME,
  Input,
  type MantineColorsTuple,
  type CSSVariablesResolver,
  type MantineTransition,
  Menu,
  Modal,
  Popover,
  SegmentedControl,
  Tabs,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery, useOrientation } from "@mantine/hooks";
import classes from "./theme.module.css";

export const TOOLTIP_DELAY = 500;
// Menus and popovers round their corners like the panels floating over the map, and the
// context menu on the map does the same.
export const MENU_RADIUS = "md";
const BUTTON_SURFACE = "--aleax-button-surface";
const BUTTON_HOVER = "--aleax-button-hover";
export const LIGHT_SURFACE = "#fdf6e3";
// Warm grays for the cream map; Mantine's own are bluish, which looked like paper on a desk.
const SAND: MantineColorsTuple = [
  "#fcf7ec",
  "#f6edda",
  "#eee0c4",
  "#e3d0ab",
  "#d3bb8f",
  "#b99d6c",
  "#937a4f",
  "#64523a",
  "#433626",
  "#2a2118",
];
// Dark mode keeps Mantine's grays, which some of its components read there.
const DARK_MODE_GRAYS = Object.fromEntries(
  DEFAULT_THEME.colors.gray.map((color, step) => [
    `--mantine-color-gray-${step}`,
    color,
  ]),
);
// Everything that only reacts to the mouse, gray buttons and tabs, shares one gray; blue stays
// for choosing a tool, as blue means selection. Menu items keep Mantine's lighter hover gray.
export const NEUTRAL_HOVER = `var(${BUTTON_HOVER})`;
// Marks what only this player sees: dice rolled secretly and a scene being prepared, so nothing
// is kept from the others by mistake.
export const PRIVATE_OUTLINE = "2px dashed var(--mantine-color-dimmed)";

// So one sees where a menu comes from; theme.module.css picks the corner touching its button.
const GROW_FROM_ANCHOR: MantineTransition = {
  in: { opacity: 1, transform: "scale(1)" },
  out: { opacity: 0, transform: "scale(.95)" },
  transitionProperty: "transform, opacity",
};
const DROPDOWN_TRANSITION = {
  transition: GROW_FROM_ANCHOR,
  duration: 150,
  timingFunction: "ease-out",
};

function isNeutral(props: { variant?: string; color?: string }) {
  return props.variant === "subtle" && props.color === "gray";
}

// In light mode the panels are a little darker than the cream map, so the map is the
// brightest place, and the buttons and fields on them are cream like the map, as both are
// what one touches. Grays for hover stay darker than the panel they lie on, a button's two
// steps, so it does not seem to fade into the panel.
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-body": "var(--mantine-color-gray-1)",
    "--mantine-color-default-hover": "var(--mantine-color-gray-2)",
    "--mantine-color-default": LIGHT_SURFACE,
    [BUTTON_SURFACE]: LIGHT_SURFACE,
    "--aleax-light-surface": LIGHT_SURFACE,
    [BUTTON_HOVER]: "var(--mantine-color-gray-3)",
  },
  dark: {
    ...DARK_MODE_GRAYS,
    [BUTTON_SURFACE]: "transparent",
    [BUTTON_HOVER]: "var(--mantine-color-default-hover)",
  },
});

export const theme = createTheme({
  respectReducedMotion: true,
  colors: { gray: SAND },
  black: SAND[9],
  components: {
    ActionIcon: ActionIcon.extend({
      classNames: { root: classes.actionIcon },
      vars: (_, props) => ({
        root: {
          ...(props.variant === "subtle" && {
            "--ai-bg": `var(${BUTTON_SURFACE})`,
          }),
          ...(isNeutral(props) && { "--ai-hover": NEUTRAL_HOVER }),
        },
      }),
    }),
    Button: Button.extend({
      vars: (_, props) => ({
        root: isNeutral(props)
          ? {
              "--button-bg": `var(${BUTTON_SURFACE})`,
              "--button-hover": NEUTRAL_HOVER,
            }
          : {},
      }),
    }),
    Input: Input.extend({
      classNames: { input: classes.input },
    }),
    SegmentedControl: SegmentedControl.extend({
      classNames: { indicator: classes.segmentIndicator },
    }),
    Tabs: Tabs.extend({
      classNames: { tab: classes.tab },
    }),
    Menu: Menu.extend({
      defaultProps: {
        radius: MENU_RADIUS,
        transitionProps: DROPDOWN_TRANSITION,
      },
    }),
    Popover: Popover.extend({
      defaultProps: {
        radius: MENU_RADIUS,
        transitionProps: DROPDOWN_TRANSITION,
      },
    }),
    Modal: Modal.extend({
      defaultProps: { centered: true },
      classNames: { root: classes.modalRoot, inner: classes.modalInner },
    }),
    Tooltip: Tooltip.extend({
      defaultProps: { openDelay: TOOLTIP_DELAY, withArrow: true },
    }),
    TooltipGroup: Tooltip.Group.extend({
      defaultProps: { openDelay: TOOLTIP_DELAY, closeDelay: 100 },
    }),
  },
});

// Below it, the layout is a phone's. Read at once, so nothing renders in the wrong place first.
export function useWideLayout() {
  const { breakpoints } = useMantineTheme();
  return useMediaQuery(`(min-width: ${breakpoints.sm})`, undefined, {
    getInitialValueInEffect: false,
  });
}

// Phones held sideways are about 360 to 430 pixels high, desktop windows hardly ever this low.
const LOW_WINDOW = "(max-height: 500px)";

// Narrow or low: a phone in either orientation.
export function usePhoneLayout() {
  const isWide = useWideLayout();
  const isLow = useMediaQuery(LOW_WINDOW, undefined, {
    getInitialValueInEffect: false,
  });
  return !isWide || isLow;
}

// Only both together: a narrow window on a monitor lies on a landscape screen, and a phone held
// upright with its on-screen keyboard open shows a landscape page.
export function useLandscape() {
  const { type } = useOrientation({ getInitialValueInEffect: false });
  const isPageLandscape = useMediaQuery("(orientation: landscape)", undefined, {
    getInitialValueInEffect: false,
  });
  return type.startsWith("landscape") && isPageLandscape;
}
