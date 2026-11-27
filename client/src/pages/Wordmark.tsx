import { useMantineTheme } from "@mantine/core";
import { useId } from "react";

// The A is two swords standing on their pommels, tips up, leaning with the script beside them.
// Each turns inward about its pommel, so the blades cross at the top of the A.
const SLANT = 10;
const BASELINE = 55;
const POMMEL = { x: 13.85, y: 51.8 };
const TIP = { x: 31.6, y: 9 };
const TURN = 8;
// Turning lowers the tips; stretching brings them back up to the top of the l.
const TURNED_TIP_Y =
  POMMEL.y +
  (TIP.x - POMMEL.x) * Math.sin((TURN * Math.PI) / 180) +
  (TIP.y - POMMEL.y) * Math.cos((TURN * Math.PI) / 180);
const STRETCH = (BASELINE - TIP.y) / (BASELINE - TURNED_TIP_Y);
// "leax" in Fondamento by Astigmatic (SIL Open Font License), turned into outlines.
const LEAX =
  "M72.2 51.6L72.2 51.6Q71.3 52.3 70.5 53.0Q69.7 53.7 68.8 54.3L68.8 54.3Q66.9 55.5 64.8 55.5L64.8 55.5Q61.8 55.5 61.5 51.4L61.5 51.4Q61.5 50.3 61.5 49.2L61.5 49.2L61.5 20.1Q61.5 16.4 59.8 15.2L59.8 15.2Q59.1 14.7 58.4 14.7L58.4 14.7Q57.6 14.7 57.3 14.8Q57.0 14.8 56.7 14.9L56.7 14.9Q60.7 12.1 61.7 11.6L61.7 11.6Q63.1 10.9 64.5 10.1Q66.0 9.4 66.8 9L66.8 9L66.8 46.6Q66.8 47.7 66.8 48.7Q66.8 49.6 67.1 50.3L67.1 50.3Q67.8 51.8 70.5 51.8L70.5 51.8Q71.4 51.8 72.2 51.6ZM94.8 50.0L94.8 50.0Q91.1 54.1 85.5 55.2L85.5 55.2Q84.3 55.4 82.4 55.4Q80.5 55.4 78.8 54.3Q77.2 53.3 76.1 51.6L76.1 51.6Q74.1 48.4 74.1 43.8L74.1 43.8Q74.1 40.7 76.5 37.0L76.5 37.0Q78.7 33.4 82.0 30.9L82.0 30.9Q85.6 28.3 88.7 28.3L88.7 28.3Q90.4 28.3 91.5 29.5L91.5 29.5Q92.5 30.7 92.5 32.2Q92.5 33.7 91.9 34.9Q91.2 36.2 90.2 37.4Q89.1 38.6 87.8 39.7Q86.4 40.8 85.0 41.8L85.0 41.8Q83.0 43.1 80.0 44.8L80.0 44.8Q80.9 48.1 83.1 49.9Q85.3 51.7 88.8 51.7L88.8 51.7Q91.7 51.7 94.8 50.0ZM86.6 39.0L86.6 39.0Q87.3 37.9 87.3 36.8Q87.3 35.6 87.1 34.9Q86.8 34.1 86.4 33.5L86.4 33.5Q85.3 32.1 83.6 32.1L83.6 32.1Q79.5 32.1 79.5 40.6L79.5 40.6Q79.5 42.1 79.7 43.5L79.7 43.5Q84.5 42.2 86.6 39.0ZM116.4 35.9L116.4 46.9L116.4 48.8Q116.4 51.0 117.5 51.5L117.5 51.5Q118.0 51.8 118.6 51.8L118.6 51.8Q119.6 51.8 120.6 51.3L120.6 51.3Q119.5 51.8 118.8 52.5Q118.0 53.2 117.2 53.9L117.2 53.9Q115.3 55.5 113.3 55.5L113.3 55.5Q111.3 55.5 111.1 53.2L111.1 53.2Q111.1 52.6 111.1 52.0L111.1 52.0Q106.2 55.4 102.1 55.4L102.1 55.4Q98.6 55.4 97.3 53.3L97.3 53.3Q96.8 52.5 96.8 51.2Q96.8 49.9 97.6 48.5Q98.5 47.2 99.7 46.1L99.7 46.1Q101.9 44.0 105.1 42.7L105.1 42.7Q107.4 41.7 111.1 41.5L111.1 41.5L111.1 40.3Q111.1 36.0 110.3 34.5Q109.5 32.9 108.3 32.2Q107.0 31.5 105.3 31.5L105.3 31.5Q102.5 31.5 100.3 32.6L100.3 32.6Q103.3 30.1 104.7 29.3L104.7 29.3Q107.6 27.7 109.9 27.7Q112.2 27.7 113.4 28.4Q114.6 29.1 115.2 30.2L115.2 30.2Q116.4 32.2 116.4 35.9L116.4 35.9ZM103.6 50.8Q104.3 51.3 105.1 51.5Q106.0 51.8 107.7 51.8Q109.4 51.8 111.1 50.9L111.1 50.9L111.1 45.2L106.7 45.2Q104.3 45.2 102.6 45.5L102.6 45.5Q102.2 46.7 102.2 47.8Q102.2 48.8 102.6 49.6Q103.0 50.4 103.6 50.8ZM145.9 31.7L145.3 31.7Q142.0 36.2 138.6 40.3L138.6 40.3Q140.3 42.9 141.9 45.5Q143.6 48.1 144.8 49.6Q145.9 51.0 146.6 51.4Q147.2 51.9 147.8 51.9L147.8 51.9Q148.7 51.9 149.7 51.1L149.7 51.1Q148.8 53.1 146.7 54.3L146.7 54.3Q144.8 55.5 142.5 55.5L142.5 55.5Q141.3 55.5 140.4 54.4L140.4 54.4Q138.7 52.3 137.2 50.0Q135.7 47.7 134.3 45.5L134.3 45.5Q131.5 48.6 128.0 51.3L128.0 51.3L132.6 51.3Q132.1 51.4 130.8 52.5Q129.6 53.7 129.1 54.1L129.1 54.1Q127.9 55 127.3 55L127.3 55L121.0 55Q121.3 54.8 121.7 54.5Q122.0 54.3 122.4 54.0Q122.8 53.7 123.3 53.2Q123.7 52.8 124.2 52.3L124.2 52.3Q125.3 51.3 126.3 51.3L126.3 51.3Q126.7 51.3 128.6 49.2Q130.5 47.1 131.3 46.3Q132.0 45.5 132.6 44.9Q133.1 44.2 133.3 44.0L133.3 44.0Q132.0 42.0 130.7 40.0Q129.4 38.0 128.6 36.7Q127.8 35.4 127.3 34.6Q126.9 33.8 126.3 33.1L126.3 33.1Q124.9 31.3 123.7 31.3L123.7 31.3Q122.9 31.3 122.2 31.8L122.2 31.8Q127.7 27.5 129.3 27.5L129.3 27.5Q130.0 27.5 130.7 28.5Q131.5 29.5 132.3 30.5Q133.0 31.6 133.8 32.8Q134.6 34.0 135.3 35.2Q136.1 36.3 136.7 37.3Q137.2 38.2 137.5 38.7L137.5 38.7Q140.3 35.0 142.6 31.7L142.6 31.7L138.6 31.7Q141.4 29.2 142.6 28.6Q143.7 28.0 143.9 28.0L143.9 28.0L151.2 28.0Q148.5 30.3 147.3 31.0Q146.1 31.7 145.9 31.7L145.9 31.7Z";

// Straight edges up to a shoulder, then a short point, so the tip reads as a tip.
const BLADE = `17.42,36.71 22.24,38.69 31.35,16.47 ${TIP.x},${TIP.y} 26.53,14.49`;
// The lower sword is cut where the upper one lies over it, so both blades stay apart.
const GAP = 3;

interface SwordProps {
  color: string;
  outline?: number;
}

function Sword({ color, outline = 0 }: SwordProps) {
  return (
    <g transform={`rotate(${TURN} ${POMMEL.x} ${POMMEL.y})`}>
      <polygon
        points={BLADE}
        fill={color}
        stroke={outline > 0 ? color : undefined}
        strokeWidth={outline}
        strokeLinejoin="round"
      />
      <g stroke={color} strokeLinecap="round">
        <path d="M10 36 L27.8 43.6" strokeWidth={4.4 + outline} />
        <path d="M17.5 43.2 L15 49.2" strokeWidth={4.6 + outline} />
      </g>
      <circle cx={POMMEL.x} cy={POMMEL.y} r={3.2 + outline / 2} fill={color} />
    </g>
  );
}

const VIEW_BOX = { x: 7.5, y: 8.5, width: 144.5, height: 47.5 };
const MASK_AREA = { x: -10, y: -10, width: 90, height: 90 };

interface WordmarkProps {
  height: number;
}

export function Wordmark({ height }: WordmarkProps) {
  const theme = useMantineTheme();
  const gapId = useId();

  return (
    <svg
      viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}
      width={(height * VIEW_BOX.width) / VIEW_BOX.height}
      height={height}
      role="img"
      aria-label="Aleax"
    >
      <g
        transform={`translate(0 ${BASELINE}) skewX(-${SLANT}) scale(1 ${STRETCH}) translate(0 -${BASELINE})`}
      >
        <mask id={gapId} maskUnits="userSpaceOnUse" {...MASK_AREA}>
          <rect {...MASK_AREA} fill="white" />
          <Sword color="black" outline={GAP} />
        </mask>
        <g mask={`url(#${gapId})`}>
          <g transform="translate(64 0) scale(-1 1)">
            <Sword color="currentColor" />
          </g>
        </g>
        <Sword color={theme.colors.blue[7]} />
      </g>
      <path d={LEAX} fill="currentColor" />
    </svg>
  );
}
