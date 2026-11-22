import { Box } from "@mantine/core";

// Softened, so a busy picture sets the mood without competing with the map.
const BLUR_PX = 4;
const SATURATION = 0.6;
const BRIGHTNESS = 1.2;
const OPACITY = 0.5;

// Lies behind the stage; its parent must isolate, so the negative z-index stays inside it.
export function BackgroundImage({ url }: { url: string }) {
  return (
    <Box
      pos="absolute"
      inset={0}
      style={{ overflow: "hidden", zIndex: -1, pointerEvents: "none" }}
    >
      <Box
        pos="absolute"
        // The blur would fade the edges otherwise.
        inset={-2 * BLUR_PX}
        style={{
          backgroundImage: `url("${url}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: `blur(${BLUR_PX}px) saturate(${SATURATION}) brightness(${BRIGHTNESS})`,
          opacity: OPACITY,
        }}
      />
    </Box>
  );
}
